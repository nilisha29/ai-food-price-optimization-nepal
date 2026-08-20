# Architecture

```text
featured_dataset.csv and model artifacts
              |
              v
        FastAPI backend
  price + demand + inventory + promotion
              |
              v
        React frontend
 dashboard | predictor | optimization | scenarios | evaluation | history
```

## Runtime modules

- `backend/main.py`: API routes, feature construction, model inference, and decision rules.
- `frontend/src/components`: user-facing decision-support views.
- `frontend/src/config`: API and food commodity catalog configuration.

## Research artifacts

- `notebooks/`: reproducible exploration and evaluation work.
- `reports/`: generated figures and evaluation summaries.
- `scripts/`: repeatable dataset and model checks.
- `tests/`: automated API and logic checks.
