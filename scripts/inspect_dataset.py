from pathlib import Path
import pandas as pd


PROJECT_ROOT = Path(__file__).resolve().parents[1]
DATA_PATH = PROJECT_ROOT / "backend" / "featured_dataset.csv"


def main():
    data = pd.read_csv(DATA_PATH, parse_dates=["date"])
    print(f"rows={len(data):,}")
    print(f"columns={len(data.columns)}")
    print(f"date_range={data['date'].min().date()}..{data['date'].max().date()}")
    print(f"commodities={data['commodity'].nunique()}")
    print(f"markets={data['market'].nunique()}")
    print(f"missing_values={int(data.isna().sum().sum())}")
    print("commodity_counts:")
    print(data["commodity"].value_counts().to_string())


if __name__ == "__main__":
    main()
