"""
Nepal Retail AI Dynamic Pricing API
====================================
FastAPI backend that serves price predictions from the trained XGBoost model.
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Optional
import numpy as np
import pandas as pd
import joblib
import json
import math
from datetime import datetime, date

# ── Load models once at startup ────────────────────────────
model         = joblib.load("xgboost_pricing_model.pkl")
metrics       = json.load(open("model_metrics.json"))

demand_model   = joblib.load("xgboost_demand_model.pkl")
demand_metrics = json.load(open("demand_model_metrics.json"))

inventory_df  = pd.read_csv("inventory_recommendations.csv")

FEATURE_COLS = metrics["features"]
DEMAND_FEATURE_COLS = demand_metrics["features"]

# ── Commodity & Province mappings (from training data) ────
COMMODITY_MAP = {
    "apples": 0, "bananas": 1, "beans_black": 2, "cabbage": 3,
    "carrots": 4, "chickpeas": 5, "eggs": 6, "fish": 7,
    "lentils_broken": 8, "meat_chicken": 9, "milk": 10,
    "oil_mustard": 11, "oil_soybean": 12, "oranges": 13,
    "peanut": 14, "potatoes_red": 15, "pumpkin": 16,
    "rice_coarse": 17, "rice_medium": 18, "tomatoes": 19,
    "wheat_flour": 20,
}

CATEGORY_MAP = {
    "cereals_tubers": 0, "pulses_legumes": 1, "vegetables": 2,
    "meat_fish": 3, "dairy_eggs": 4, "oils_fats": 5, "fruits": 6, "fuel": 7,
}

PROVINCE_MAP = {
    "province_1": 0, "province_2": 1, "bagmati": 2,
    "gandaki": 3, "lumbini": 4, "karnali": 5, "sudurpashchim": 6,
}

KTM_VALLEY_MARKETS = ["kathmandu", "bhaktapur", "lalitpur", "kirtipur"]

# Maps internal commodity_key -> display name used in datasets/inventory
COMMODITY_DISPLAY_MAP = {
    "apples": "Apples", "bananas": "Bananas", "beans_black": "Beans (black)",
    "cabbage": "Cabbage", "carrots": "Carrots", "chickpeas": "Chickpeas",
    "eggs": "Eggs", "fish": "Fish", "lentils_broken": "Lentils (broken)",
    "meat_chicken": "Meat (chicken)", "milk": "Milk",
    "oil_mustard": "Oil (mustard)", "oil_soybean": "Oil (soybean)",
    "oranges": "Oranges", "peanut": "Peanut", "potatoes_red": "Potatoes (red)",
    "pumpkin": "Pumpkin", "rice_coarse": "Rice (coarse)",
    "rice_medium": "Rice (medium grain)", "tomatoes": "Tomatoes",
    "wheat_flour": "Wheat flour",
}

app = FastAPI(
    title="Nepal Retail AI Pricing API",
    description="AI-driven dynamic price prediction for Nepal retail stores",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Request / Response Models ──────────────────────────────

class PricePredictionRequest(BaseModel):
    commodity: str = Field(..., example="rice_coarse",
                           description="Commodity key from the commodity list")
    market:    str = Field(..., example="kathmandu",
                           description="Market/city name")
    province:  str = Field(..., example="bagmati",
                           description="Province code")

    # Recent price history (required for lag features)
    price_last_1m:  float = Field(..., example=62.0,  description="Price 1 month ago (NRs/kg)")
    price_last_3m:  float = Field(..., example=60.0,  description="Price 3 months ago (NRs/kg)")
    price_last_6m:  float = Field(..., example=58.0,  description="Price 6 months ago (NRs/kg)")
    price_last_12m: float = Field(..., example=55.0,  description="Price 12 months ago (NRs/kg)")

    # Optional — defaults to current date
    prediction_date: Optional[str] = Field(None, example="2025-10-15",
                                           description="Date to predict for (YYYY-MM-DD)")
    # Optional macro
    food_cpi:            Optional[float] = Field(120.0, description="Current food CPI index")
    nrb_food_cpi_change: Optional[float] = Field(5.0,   description="NRB annual food CPI change %")


class PricePredictionResponse(BaseModel):
    commodity:          str
    market:             str
    prediction_date:    str
    predicted_price:    float
    price_last_1m:      float
    price_change_pct:   float
    confidence:         str
    festival_season:    str
    recommendation:     str
    model_accuracy:     float
    margin_suggestion:  dict


class BatchPredictionRequest(BaseModel):
    items: list[PricePredictionRequest]


class HealthResponse(BaseModel):
    status:         str
    model_accuracy: float
    total_features: int
    commodities:    list[str]
    version:        str


# ── Sales Optimization Models ──────────────────────────────

class DemandPredictionRequest(BaseModel):
    commodity: str = Field(..., example="rice_coarse")
    market:    str = Field(..., example="kathmandu")
    province:  str = Field(..., example="bagmati")

    current_price:    float = Field(..., example=65.0, description="Current selling price NRs/kg")
    price_last_1m:    float = Field(..., example=62.0)
    price_last_3m:    float = Field(..., example=60.0)

    qty_last_1m:  float = Field(..., example=220.0, description="Units sold last month")
    qty_last_3m:  float = Field(..., example=210.0, description="Units sold 3 months ago")
    qty_last_12m: float = Field(..., example=200.0, description="Units sold 12 months ago")

    prediction_date: Optional[str] = Field(None, example="2025-10-15")
    food_cpi:            Optional[float] = Field(120.0)
    nrb_food_cpi_change: Optional[float] = Field(5.0)


class InventoryRequest(BaseModel):
    commodity: str = Field(..., example="rice_coarse")
    current_stock: float = Field(..., example=300.0, description="Current stock on hand (units)")


class PromotionRequest(BaseModel):
    commodity: str = Field(..., example="tomatoes")
    current_stock: float = Field(..., example=150.0)
    days_in_stock: int   = Field(..., example=10, description="Days since last restock")
    current_price: float = Field(..., example=55.0)


class SalesOptimizationRequest(BaseModel):
    """Combined request: price + demand + inventory + promotion in one call."""
    commodity: str
    market:    str = "kathmandu"
    province:  str = "bagmati"
    price_last_1m:  float
    price_last_3m:  float
    price_last_6m:  float
    price_last_12m: float
    qty_last_1m:  float
    qty_last_3m:  float
    qty_last_12m: float
    current_stock: float
    days_in_stock: int = 7
    prediction_date: Optional[str] = None
    food_cpi: Optional[float] = 120.0
    nrb_food_cpi_change: Optional[float] = 5.0


# ── Helper Functions ───────────────────────────────────────

def get_festival_season(month: int) -> str:
    if month in [9, 10]:  return "Dashain Season"
    if month in [10, 11]: return "Tihar Season"
    if month in [8, 9]:   return "Teej Season"
    if month == 4:        return "New Year (Baisakh)"
    return "Normal Season"

def build_features(req: PricePredictionRequest) -> np.ndarray:
    pred_date = (datetime.strptime(req.prediction_date, "%Y-%m-%d")
                 if req.prediction_date else datetime.now())

    month      = pred_date.month
    year       = pred_date.year
    quarter    = (month - 1) // 3 + 1
    doy        = pred_date.timetuple().tm_yday
    week       = pred_date.isocalendar()[1]
    month_sin  = math.sin(2 * math.pi * month / 12)
    month_cos  = math.cos(2 * math.pi * month / 12)

    # Rolling stats from provided price history
    prices           = [req.price_last_1m, req.price_last_3m,
                        req.price_last_6m, req.price_last_12m]
    rolling_mean_3m  = np.mean([req.price_last_1m, req.price_last_3m])
    rolling_mean_6m  = np.mean([req.price_last_1m, req.price_last_3m, req.price_last_6m])
    rolling_mean_12m = np.mean(prices)
    rolling_std_3m   = np.std([req.price_last_1m, req.price_last_3m])
    rolling_std_6m   = np.std([req.price_last_1m, req.price_last_3m, req.price_last_6m])

    # Price change features
    price_change_1m  = req.price_last_1m - req.price_last_3m
    price_change_pct = ((req.price_last_1m - req.price_last_3m) /
                        req.price_last_3m * 100) if req.price_last_3m else 0
    price_vs_3m_avg  = req.price_last_1m / rolling_mean_3m  if rolling_mean_3m  else 1
    price_vs_12m_avg = req.price_last_1m / rolling_mean_12m if rolling_mean_12m else 1

    # Festival flags
    is_dashain  = int(month in [9, 10])
    is_tihar    = int(month in [10, 11])
    is_teej     = int(month in [8, 9])
    is_chhath   = int(month in [10, 11])
    is_newyear  = int(month == 4)
    is_festival = int(is_dashain or is_tihar or is_teej or is_chhath or is_newyear)
    months_to_dashain = (10 - month) % 12

    # Geography
    is_ktm      = int(req.market.lower() in KTM_VALLEY_MARKETS)
    prov_code   = PROVINCE_MAP.get(req.province.lower(), 2)

    # Commodity
    comm_code   = COMMODITY_MAP.get(req.commodity.lower(), 17)  # default rice
    cat_code    = CATEGORY_MAP.get("cereals_tubers", 0)

    # Macro
    cpi_3m_change = ((req.food_cpi - 110) / 110 * 100) if req.food_cpi else 5.0

    features = [
        year, month, quarter, week, doy, month_sin, month_cos,
        req.price_last_1m, req.price_last_3m, req.price_last_6m, req.price_last_12m,
        rolling_mean_3m, rolling_mean_6m, rolling_mean_12m,
        rolling_std_3m, rolling_std_6m,
        price_change_1m, price_change_pct, price_vs_3m_avg, price_vs_12m_avg,
        is_dashain, is_tihar, is_teej, is_chhath, is_newyear,
        is_festival, months_to_dashain,
        is_ktm, prov_code, comm_code, cat_code,
        req.food_cpi or 120.0,
        req.nrb_food_cpi_change or 5.0,
        cpi_3m_change,
    ]
    return np.array(features).reshape(1, -1)

def make_recommendation(predicted: float, last_price: float,
                         festival: str) -> str:
    change_pct = ((predicted - last_price) / last_price) * 100
    if change_pct > 10:
        return f"INCREASE STOCK — Price expected to rise {change_pct:.1f}%. Stock up now before price hike."
    elif change_pct > 3:
        return f"SLIGHT INCREASE — Price may rise {change_pct:.1f}%. Consider moderate restocking."
    elif change_pct < -5:
        return f"PRICE DROP EXPECTED — Consider promotions or discounts to move current stock."
    else:
        return f"STABLE — Price relatively steady ({change_pct:+.1f}%). Normal restocking recommended."

def margin_suggestion(predicted: float, last_price: float) -> dict:
    cost_estimate = last_price * 0.72   # assume ~28% retail margin baseline
    min_price     = round(cost_estimate * 1.10, 2)   # 10% min margin
    optimal_price = round(predicted * 0.98, 2)        # slight undercut of prediction
    max_price     = round(predicted * 1.08, 2)        # 8% above prediction
    return {
        "estimated_cost":     round(cost_estimate, 2),
        "min_price_10pct":    min_price,
        "optimal_price":      optimal_price,
        "max_price":          max_price,
        "suggested_margin_pct": round(((optimal_price - cost_estimate) / cost_estimate) * 100, 1),
    }


# ── Sales Optimization Helpers ─────────────────────────────

def build_demand_features(req: DemandPredictionRequest) -> np.ndarray:
    pred_date = (datetime.strptime(req.prediction_date, "%Y-%m-%d")
                 if req.prediction_date else datetime.now())

    month   = pred_date.month
    year    = pred_date.year
    quarter = (month - 1) // 3 + 1
    doy     = pred_date.timetuple().tm_yday
    week    = pred_date.isocalendar()[1]
    month_sin = math.sin(2 * math.pi * month / 12)
    month_cos = math.cos(2 * math.pi * month / 12)

    rolling_mean_3m  = np.mean([req.current_price, req.price_last_1m, req.price_last_3m])
    rolling_mean_12m = np.mean([req.current_price, req.price_last_1m, req.price_last_3m])
    price_change_pct = ((req.price_last_1m - req.price_last_3m) /
                        req.price_last_3m * 100) if req.price_last_3m else 0
    price_vs_3m_avg  = req.current_price / rolling_mean_3m if rolling_mean_3m else 1

    qty_rolling_3m = np.mean([req.qty_last_1m, req.qty_last_3m])
    qty_rolling_6m = np.mean([req.qty_last_1m, req.qty_last_3m, req.qty_last_12m])

    is_dashain  = int(month in [9, 10])
    is_tihar    = int(month in [10, 11])
    is_teej     = int(month in [8, 9])
    is_chhath   = int(month in [10, 11])
    is_newyear  = int(month == 4)
    is_festival = int(is_dashain or is_tihar or is_teej or is_chhath or is_newyear)
    months_to_dashain = (10 - month) % 12

    is_ktm    = int(req.market.lower() in KTM_VALLEY_MARKETS)
    prov_code = PROVINCE_MAP.get(req.province.lower(), 2)
    comm_code = COMMODITY_MAP.get(req.commodity.lower(), 17)
    cat_code  = CATEGORY_MAP.get("cereals_tubers", 0)

    features = [
        year, month, quarter, week, doy, month_sin, month_cos,
        req.current_price, req.price_last_1m, req.price_last_3m,
        rolling_mean_3m, rolling_mean_12m, price_change_pct, price_vs_3m_avg,
        req.qty_last_1m, req.qty_last_3m, req.qty_last_12m, qty_rolling_3m, qty_rolling_6m,
        is_dashain, is_tihar, is_teej, is_chhath, is_newyear, is_festival, months_to_dashain,
        is_ktm, prov_code, comm_code, cat_code,
        req.food_cpi or 120.0, req.nrb_food_cpi_change or 5.0,
    ]
    return np.array(features).reshape(1, -1)


def get_inventory_recommendation(commodity_key: str, current_stock: float) -> dict:
    display_name = COMMODITY_DISPLAY_MAP.get(commodity_key.lower())
    if display_name is None:
        raise HTTPException(status_code=400, detail=f"Unknown commodity '{commodity_key}'")

    row = inventory_df[inventory_df["commodity"] == display_name]
    if row.empty:
        raise HTTPException(status_code=404, detail=f"No inventory data for '{commodity_key}'")
    row = row.iloc[0]

    reorder_point = float(row["reorder_point"])
    eoq           = float(row["eoq"])
    safety_stock  = float(row["safety_stock"])
    max_stock     = float(row["max_stock"])
    daily_demand  = float(row["daily_demand"])

    days_remaining = round(current_stock / daily_demand, 1) if daily_demand > 0 else None

    if current_stock <= safety_stock:
        status = "CRITICAL"
        action = f"URGENT: Order now! Stock below safety level. Order {eoq:.0f} units immediately."
    elif current_stock <= reorder_point:
        status = "REORDER"
        action = f"Place order for {eoq:.0f} units now — stock will hit safety level in ~{days_remaining} days."
    elif current_stock >= max_stock:
        status = "OVERSTOCKED"
        action = f"Stock is above max level ({max_stock:.0f}). Consider a promotion to move excess inventory."
    else:
        status = "HEALTHY"
        action = f"Stock is healthy. Next reorder needed in ~{round((current_stock - reorder_point)/daily_demand,1) if daily_demand>0 else '—'} days."

    return {
        "commodity": commodity_key,
        "current_stock": current_stock,
        "days_of_stock_remaining": days_remaining,
        "avg_daily_demand": round(daily_demand, 2),
        "safety_stock": round(safety_stock, 1),
        "reorder_point": round(reorder_point, 1),
        "economic_order_quantity": round(eoq, 1),
        "max_stock_level": round(max_stock, 1),
        "status": status,
        "action": action,
    }


def get_promotion_recommendation(req: PromotionRequest) -> dict:
    display_name = COMMODITY_DISPLAY_MAP.get(req.commodity.lower())
    if display_name is None:
        raise HTTPException(status_code=400, detail=f"Unknown commodity '{req.commodity}'")

    row = inventory_df[inventory_df["commodity"] == display_name]
    if row.empty:
        raise HTTPException(status_code=404, detail=f"No inventory data for '{req.commodity}'")
    row = row.iloc[0]

    daily_demand = float(row["daily_demand"])
    max_stock    = float(row["max_stock"])

    days_remaining = round(req.current_stock / daily_demand, 1) if daily_demand > 0 else 999
    stock_ratio    = req.current_stock / max_stock if max_stock > 0 else 0

    # Perishability factor — vegetables/fruits/meat/fish/milk decay fast
    PERISHABLE = ["Tomatoes","Cabbage","Carrots","Pumpkin","Apples","Bananas","Oranges",
                  "Meat (chicken)","Fish","Milk","Eggs","Potatoes (red)"]
    is_perishable = display_name in PERISHABLE

    discount_pct = 0
    urgency = "none"
    reasons = []

    if is_perishable and req.days_in_stock > 5:
        discount_pct += 8
        urgency = "high"
        reasons.append(f"{display_name} is perishable and has been in stock {req.days_in_stock} days")

    if stock_ratio > 0.85:
        discount_pct += 7
        urgency = "high" if urgency != "high" else urgency
        reasons.append(f"Stock at {stock_ratio*100:.0f}% of max capacity — overstocked")

    if days_remaining > 30 and not is_perishable:
        discount_pct += 5
        urgency = "medium" if urgency == "none" else urgency
        reasons.append(f"{days_remaining:.0f} days of stock remaining — slow-moving")

    discount_pct = min(discount_pct, 25)  # cap at 25%

    if discount_pct == 0:
        recommendation = "No promotion needed. Stock levels and turnover are healthy."
        promo_price = req.current_price
    else:
        promo_price = round(req.current_price * (1 - discount_pct/100), 2)
        recommendation = (f"Run a {discount_pct}% discount promotion. "
                          f"Suggested price: NRs {promo_price} (from NRs {req.current_price}). "
                          f"Bundle with complementary items to boost basket size.")

    return {
        "commodity": req.commodity,
        "current_price": req.current_price,
        "days_in_stock": req.days_in_stock,
        "stock_ratio_of_max": round(stock_ratio, 2),
        "is_perishable": is_perishable,
        "urgency": urgency,
        "suggested_discount_pct": discount_pct,
        "suggested_promo_price": promo_price,
        "reasons": reasons,
        "recommendation": recommendation,
    }


# ── Routes ────────────────────────────────────────────────

@app.get("/", response_model=HealthResponse)
def health():
    return {
        "status":         "running",
        "model_accuracy": metrics["accuracy"],
        "total_features": len(FEATURE_COLS),
        "commodities":    list(COMMODITY_MAP.keys()),
        "version":        "2.0.0",
    }

@app.get("/commodities")
def list_commodities():
    """List all supported commodities and provinces."""
    return {
        "commodities": list(COMMODITY_MAP.keys()),
        "provinces":   list(PROVINCE_MAP.keys()),
        "categories":  list(CATEGORY_MAP.keys()),
    }

@app.post("/predict", response_model=PricePredictionResponse)
def predict_price(req: PricePredictionRequest):
    """Predict next month's price for a commodity in a given market."""
    if req.commodity.lower() not in COMMODITY_MAP:
        raise HTTPException(
            status_code=400,
            detail=f"Unknown commodity '{req.commodity}'. "
                   f"Valid: {list(COMMODITY_MAP.keys())}"
        )

    features       = build_features(req)
    predicted      = float(model.predict(features)[0])
    predicted      = round(predicted, 2)

    pred_date      = (datetime.strptime(req.prediction_date, "%Y-%m-%d")
                      if req.prediction_date else datetime.now())
    festival       = get_festival_season(pred_date.month)
    change_pct     = round(((predicted - req.price_last_1m) / req.price_last_1m) * 100, 2)
    confidence     = "High" if abs(change_pct) < 15 else "Medium"
    recommendation = make_recommendation(predicted, req.price_last_1m, festival)
    margin         = margin_suggestion(predicted, req.price_last_1m)

    return {
        "commodity":         req.commodity,
        "market":            req.market,
        "prediction_date":   pred_date.strftime("%Y-%m-%d"),
        "predicted_price":   predicted,
        "price_last_1m":     req.price_last_1m,
        "price_change_pct":  change_pct,
        "confidence":        confidence,
        "festival_season":   festival,
        "recommendation":    recommendation,
        "model_accuracy":    metrics["accuracy"],
        "margin_suggestion": margin,
    }

@app.post("/predict/batch")
def predict_batch(req: BatchPredictionRequest):
    """Predict prices for multiple commodities at once."""
    results = []
    for item in req.items:
        try:
            result = predict_price(item)
            results.append(result)
        except Exception as e:
            results.append({"error": str(e), "commodity": item.commodity})
    return {"predictions": results, "count": len(results)}

@app.get("/model/info")
def model_info():
    """Return model training metrics and feature list."""
    return {
        "accuracy_pct":    metrics["accuracy"],
        "mae_nrs":         metrics["mae"],
        "rmse_nrs":        metrics["rmse"],
        "r2_score":        metrics["r2"],
        "train_rows":      metrics["train_rows"],
        "test_rows":       metrics["test_rows"],
        "features":        FEATURE_COLS,
        "top_commodities": metrics["per_commodity"][:5] if metrics.get("per_commodity") else [],
    }

@app.get("/prices/history/{commodity}")
def price_history(commodity: str, market: str = "kathmandu", limit: int = 12):
    """Return recent price history for a commodity from the dataset."""
    try:
        df = pd.read_csv("featured_dataset.csv", parse_dates=["date"])
        comm_map_rev = {v: k for k, v in COMMODITY_MAP.items()}
        comm_code    = COMMODITY_MAP.get(commodity.lower())
        if comm_code is None:
            raise HTTPException(status_code=400, detail=f"Unknown commodity: {commodity}")
        sub = (df[df["commodity_code"] == comm_code]
               .sort_values("date", ascending=False)
               .head(limit * 5)
               .groupby("date")["price_nrs"]
               .mean()
               .reset_index()
               .sort_values("date", ascending=False)
               .head(limit))
        return {
            "commodity": commodity,
            "market":    market,
            "history": [
                {"date": str(r["date"])[:10], "price_nrs": round(r["price_nrs"], 2)}
                for _, r in sub.iterrows()
            ],
        }
    except FileNotFoundError:
        raise HTTPException(status_code=500, detail="Dataset not found on server")


# ════════════════════════════════════════════════════════════
# SALES OPTIMIZATION ENDPOINTS
# ════════════════════════════════════════════════════════════

@app.post("/demand/predict")
def predict_demand(req: DemandPredictionRequest):
    """Predict next month's sales quantity (units) for a commodity."""
    if req.commodity.lower() not in COMMODITY_MAP:
        raise HTTPException(status_code=400,
            detail=f"Unknown commodity '{req.commodity}'. Valid: {list(COMMODITY_MAP.keys())}")

    features = build_demand_features(req)
    predicted_qty = float(demand_model.predict(features)[0])
    predicted_qty = max(0, round(predicted_qty, 1))

    pred_date  = (datetime.strptime(req.prediction_date, "%Y-%m-%d")
                  if req.prediction_date else datetime.now())
    festival   = get_festival_season(pred_date.month)
    change_pct = round(((predicted_qty - req.qty_last_1m) / req.qty_last_1m) * 100, 2) if req.qty_last_1m else 0

    predicted_revenue = round(predicted_qty * req.current_price, 2)
    estimated_cost    = req.current_price * 0.72
    predicted_profit  = round(predicted_qty * (req.current_price - estimated_cost), 2)

    return {
        "commodity":          req.commodity,
        "market":             req.market,
        "prediction_date":    pred_date.strftime("%Y-%m-%d"),
        "predicted_qty_units": predicted_qty,
        "qty_last_1m":        req.qty_last_1m,
        "qty_change_pct":     change_pct,
        "festival_season":    festival,
        "predicted_revenue_nrs": predicted_revenue,
        "predicted_profit_nrs": predicted_profit,
        "model_accuracy":     demand_metrics["accuracy"],
    }


@app.post("/inventory/recommendation")
def inventory_recommendation(req: InventoryRequest):
    """Get reorder point, EOQ, and stock status for a commodity."""
    if req.commodity.lower() not in COMMODITY_MAP:
        raise HTTPException(status_code=400,
            detail=f"Unknown commodity '{req.commodity}'. Valid: {list(COMMODITY_MAP.keys())}")
    return get_inventory_recommendation(req.commodity, req.current_stock)


@app.get("/inventory/all")
def inventory_all():
    """Get inventory recommendations for all commodities (assuming stock = reorder point for demo)."""
    results = []
    for key, display_name in COMMODITY_DISPLAY_MAP.items():
        row = inventory_df[inventory_df["commodity"] == display_name]
        if row.empty:
            continue
        row = row.iloc[0]
        results.append({
            "commodity": key,
            "display_name": display_name,
            "avg_monthly_demand": round(float(row["avg_monthly_demand"]), 1),
            "safety_stock": round(float(row["safety_stock"]), 1),
            "reorder_point": round(float(row["reorder_point"]), 1),
            "eoq": round(float(row["eoq"]), 1),
            "max_stock": round(float(row["max_stock"]), 1),
            "avg_price": round(float(row["avg_price"]), 2),
        })
    return {"inventory": results, "count": len(results)}


@app.post("/promotion/recommendation")
def promotion_recommendation(req: PromotionRequest):
    """Get discount/promotion recommendation based on stock age and levels."""
    if req.commodity.lower() not in COMMODITY_MAP:
        raise HTTPException(status_code=400,
            detail=f"Unknown commodity '{req.commodity}'. Valid: {list(COMMODITY_MAP.keys())}")
    return get_promotion_recommendation(req)


@app.post("/sales/optimize")
def sales_optimize(req: SalesOptimizationRequest):
    """
    Combined endpoint: returns price prediction, demand forecast,
    inventory status, and promotion recommendation in one call.
    """
    if req.commodity.lower() not in COMMODITY_MAP:
        raise HTTPException(status_code=400,
            detail=f"Unknown commodity '{req.commodity}'. Valid: {list(COMMODITY_MAP.keys())}")

    # 1. Price prediction
    price_req = PricePredictionRequest(
        commodity=req.commodity, market=req.market, province=req.province,
        price_last_1m=req.price_last_1m, price_last_3m=req.price_last_3m,
        price_last_6m=req.price_last_6m, price_last_12m=req.price_last_12m,
        prediction_date=req.prediction_date,
        food_cpi=req.food_cpi, nrb_food_cpi_change=req.nrb_food_cpi_change,
    )
    price_result = predict_price(price_req)

    # 2. Demand prediction
    demand_req = DemandPredictionRequest(
        commodity=req.commodity, market=req.market, province=req.province,
        current_price=req.price_last_1m,
        price_last_1m=req.price_last_1m, price_last_3m=req.price_last_3m,
        qty_last_1m=req.qty_last_1m, qty_last_3m=req.qty_last_3m, qty_last_12m=req.qty_last_12m,
        prediction_date=req.prediction_date,
        food_cpi=req.food_cpi, nrb_food_cpi_change=req.nrb_food_cpi_change,
    )
    demand_result = predict_demand(demand_req)

    # 3. Inventory status
    inventory_result = get_inventory_recommendation(req.commodity, req.current_stock)

    # 4. Promotion recommendation (using predicted price as current price)
    promo_req = PromotionRequest(
        commodity=req.commodity, current_stock=req.current_stock,
        days_in_stock=req.days_in_stock, current_price=req.price_last_1m,
    )
    promo_result = get_promotion_recommendation(promo_req)

    # 5. Combined revenue optimization summary
    optimal_price = price_result["margin_suggestion"]["optimal_price"]
    predicted_qty = demand_result["predicted_qty_units"]
    projected_revenue = round(optimal_price * predicted_qty, 2)
    projected_cost    = round(price_result["margin_suggestion"]["estimated_cost"] * predicted_qty, 2)
    projected_profit  = round(projected_revenue - projected_cost, 2)

    return {
        "commodity": req.commodity,
        "market": req.market,
        "prediction_date": price_result["prediction_date"],
        "price_forecast": price_result,
        "demand_forecast": demand_result,
        "inventory_status": inventory_result,
        "promotion": promo_result,
        "revenue_optimization": {
            "optimal_price_nrs": optimal_price,
            "predicted_units_sold": predicted_qty,
            "projected_revenue_nrs": projected_revenue,
            "projected_cost_nrs": projected_cost,
            "projected_profit_nrs": projected_profit,
            "projected_margin_pct": round((projected_profit / projected_revenue * 100), 1) if projected_revenue else 0,
        },
    }
