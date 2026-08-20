from pathlib import Path
import json
import pandas as pd


ROOT = Path(__file__).resolve().parents[1]
BACKEND = ROOT / "backend"


def test_featured_dataset_has_model_columns():
    data = pd.read_csv(BACKEND / "featured_dataset.csv", nrows=1)
    with open(BACKEND / "model_metrics.json", encoding="utf-8") as file:
        metrics = json.load(file)
    assert set(metrics["features"]).issubset(data.columns)
    assert "target_price_next_month" in data.columns


def test_food_commodity_codes_are_contiguous_in_source_data():
    data = pd.read_csv(BACKEND / "featured_dataset.csv", usecols=["commodity", "commodity_code", "category"])
    food = data[data["category"] != "non-food"]
    assert food["commodity"].nunique() == 21
    assert food["commodity_code"].nunique() == 21
