import os
import sys
from pathlib import Path

from fastapi.testclient import TestClient


ROOT = Path(__file__).resolve().parents[1]
BACKEND = ROOT / "backend"
os.chdir(BACKEND)
sys.path.insert(0, str(BACKEND))

from main import SalesOptimizationRequest, app, get_festival_season, sales_optimize  # noqa: E402


client = TestClient(app)


def price_payload(commodity="rice_coarse"):
    return {
        "commodity": commodity,
        "market": "kathmandu",
        "province": "bagmati",
        "price_last_1m": 100,
        "price_last_3m": 95,
        "price_last_6m": 90,
        "price_last_12m": 85,
        "prediction_date": "2026-08-20",
        "food_cpi": 125,
        "nrb_food_cpi_change": 5.2,
    }


def test_health_endpoint_reports_supported_food_scope():
    response = client.get("/")
    assert response.status_code == 200
    body = response.json()
    assert body["status"] == "running"
    assert "tomatoes" in body["commodities"]
    assert "wheat_flour" in body["commodities"]


def test_prediction_endpoint_returns_model_result():
    response = client.post("/predict", json=price_payload("tomatoes"))
    assert response.status_code == 200
    body = response.json()
    assert body["commodity"] == "tomatoes"
    assert isinstance(body["predicted_price"], float)
    assert body["confidence"] in {"High", "Medium", "Low"}


def test_model_info_includes_price_and_demand_evaluation():
    response = client.get("/model/info")
    assert response.status_code == 200
    body = response.json()
    assert len(body["feature_importance"]) == 12
    assert body["demand_model"]["accuracy_pct"] > 0


def test_october_reports_both_major_festivals():
    assert get_festival_season(10) == "Dashain & Tihar Season"


def test_history_endpoint_respects_market_filter():
    response = client.get("/prices/history/rice_coarse?market=kathmandu&limit=3")
    assert response.status_code == 200
    assert response.json()["market"] == "kathmandu"
    assert len(response.json()["history"]) <= 3


def test_sales_revenue_uses_recommended_price_and_forecast_quantity():
    payload = {
        **price_payload("tomatoes"),
        "qty_last_1m": 95,
        "qty_last_3m": 88,
        "qty_last_12m": 80,
        "current_stock": 120,
        "days_in_stock": 4,
    }
    result = sales_optimize(SalesOptimizationRequest(**payload))
    revenue = result["revenue_optimization"]
    demand = result["demand_forecast"]
    expected_revenue = round(
        revenue["optimal_price_nrs"] * revenue["predicted_units_sold"], 2
    )
    assert revenue["projected_revenue_nrs"] == expected_revenue
    assert demand["predicted_revenue_nrs"] == expected_revenue
