# Nepal Retail AI Dynamic Pricing System

An artificial intelligence-driven dynamic pricing and sales optimization system for food retail stores in Nepal.

## Project Scope

The system combines machine learning and operational decision support to help retailers:

- Predict next-month prices for food commodities.
- Forecast expected demand.
- Recommend pricing and margins.
- Monitor inventory and reorder points.
- Recommend promotions for overstocked or slow-moving items.
- Compare pricing strategies with a what-if simulator.
- Inspect model performance and feature importance.

## System Architecture

```text
Nepal retail data
      |
      v
Feature engineering: price history, seasonality, festivals, market, province, CPI
      |
      +--> XGBoost price model ------> Dynamic price recommendation
      |
      +--> XGBoost demand model -----> Demand and revenue forecast
      |
      +--> Inventory rules ----------> Reorder and stock recommendation
      |
      +--> Promotion rules ----------> Discount recommendation
      |
      v
React decision-support dashboard
```

## Project Structure

```text
backend/
  main.py                         FastAPI API and decision logic
  featured_dataset.csv            Engineered Nepal retail dataset
  model_metrics.json              Price model evaluation metrics
  demand_model_metrics.json       Demand model evaluation metrics
  inventory_recommendations.csv   Inventory planning inputs
  requirements.txt

frontend/
  src/
    components/                   Dashboard and decision-support views
    config/api.js                 Configurable backend URL
    App.jsx                       Application shell and navigation

notebooks/
  01_data_exploration.ipynb       Dataset coverage and quality analysis
  02_model_evaluation.ipynb       Metrics and feature importance evidence

docs/
  architecture.md                 Runtime and research architecture
  methodology.md                  Modeling approach and limitations

scripts/
  inspect_dataset.py              Repeatable dataset quality summary

tests/
  test_data_contract.py           Dataset and model-feature contract checks

reports/
  README.md                       Evidence and figure organization
```

## Running Locally

### Backend

```powershell
cd backend
pip install -r requirements.txt
python -m uvicorn main:app --reload --port 8000
```

The API is available at `http://localhost:8000`. Interactive API documentation is available at `http://localhost:8000/docs`.

### Frontend

```powershell
cd frontend
npm install
npm run dev
```

The frontend expects the backend at `http://localhost:8000`. To use another API URL, create `frontend/.env`:

```text
VITE_API_URL=http://localhost:8000
```

### Research workflow

From the project root, inspect the dataset and run the data-contract checks:

```powershell
python scripts/inspect_dataset.py
pytest tests/
```

Open the notebooks in VS Code or Jupyter to reproduce the exploration and evaluation evidence. Generated figures and final evaluation summaries belong in `reports/`.

## Main Views

- **Dashboard**: portfolio-level commodity price signals and predictions.
- **Price Predictor**: individual commodity, market, and province prediction.
- **Sales Optimization**: combined price, demand, inventory, and promotion decision.
- **What-If Simulator**: baseline, discount, and premium strategy comparison.
- **Model Evaluation**: accuracy, MAE, RMSE, R², dataset coverage, and explainability.
- **Price History**: historical commodity price trends.

## Evaluation Summary

The metrics are loaded from the trained model evaluation files and displayed by the Model Evaluation view. The price and demand models report accuracy, MAE, RMSE, R², MAPE, training rows, test rows, and feature counts. Feature importance is calculated from the trained XGBoost price model at API startup.

Model results are decision-support signals, not guarantees. Recommendations should be reviewed against current supplier costs, local competition, perishability, and store policy.

## Academic Project Title

**Design and Implementation of an Artificial Intelligence-Driven Dynamic Pricing and Sales Optimization System for Retail Stores in Nepal**
