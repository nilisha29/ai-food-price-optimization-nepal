# Methodology

## Problem

Nepalese food retailers need price recommendations that account for historical prices, seasonality, festivals, location, commodity type, and food inflation signals.

## Pipeline

1. Load the engineered WFP Nepal retail dataset.
2. Create temporal, lag, rolling, festival, location, commodity, and CPI features.
3. Train an XGBoost price model for next-month price prediction.
4. Train an XGBoost demand model for next-month quantity prediction.
5. Combine forecasts with inventory and promotion rules.
6. Present recommendations through the FastAPI and React applications.

## Evaluation

The project reports MAE, RMSE, MAPE, R2, accuracy, train/test row counts, and commodity-level performance. Feature importance is used to explain model behavior. Feature importance indicates association within the trained model and should not be interpreted as proof of causation.

## Scope and limitations

The system is a decision-support prototype. Recommendations depend on historical data coverage and should be reviewed against current supplier costs, perishability, competition, and local store policy. Fuel observations remain in the source dataset but are excluded from the food-commodity user interface.
