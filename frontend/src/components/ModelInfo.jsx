import { useState, useEffect } from "react"
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer, Tooltip } from "recharts"

const API = "http://localhost:8000"

export default function ModelInfo() {
  const [info,    setInfo]    = useState(null)
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState(null)

  useEffect(() => {
    fetch(`${API}/model/info`)
      .then(r => r.json())
      .then(setInfo)
      .catch(() => setError("Cannot connect to API."))
      .finally(() => setLoading(false))
  }, [])

  const featureGroups = [
    { name: "Time",          count: 7,  desc: "year, month, quarter, day_of_year, cyclical month encoding" },
    { name: "Lag Prices",    count: 4,  desc: "prices from 1, 3, 6, and 12 months ago" },
    { name: "Rolling Stats", count: 5,  desc: "3m/6m/12m rolling mean, 3m/6m rolling std deviation" },
    { name: "Price Change",  count: 4,  desc: "absolute change, % change, vs 3m avg, vs 12m avg" },
    { name: "Festival",      count: 7,  desc: "Dashain, Tihar, Teej, Chhath, New Year flags + days-to-Dashain" },
    { name: "Geography",     count: 2,  desc: "Kathmandu Valley flag, province code" },
    { name: "Commodity",     count: 2,  desc: "commodity code, category code (21 commodities)" },
    { name: "Macro / CPI",   count: 3,  desc: "food CPI index, NRB annual change, 3-month CPI momentum" },
  ]

  const radarData = featureGroups.map(g => ({
    feature: g.name, importance: g.count * 3 + Math.random() * 5,
  }))

  const pipeline = [
    { step: "01", title: "Data Collection",      desc: "WFP, FAO, NRB, NSO Nepal — 5 real datasets, 85K+ records" },
    { step: "02", title: "Cleaning",             desc: "Outlier removal (3σ), date normalization, NRs currency standardization" },
    { step: "03", title: "EDA",                  desc: "Festival seasonality, geographic variance, COVID anomaly detection" },
    { step: "04", title: "Feature Engineering",  desc: "34 features: lag prices, rolling stats, festival flags, CPI signals" },
    { step: "05", title: "Model Training",       desc: "XGBoost with time-based split — train ≤2022, test 2023–2026" },
    { step: "06", title: "Evaluation",           desc: "93.4% accuracy, MAE NRs 9.35, R² 0.9763 on held-out test set" },
    { step: "07", title: "API Deployment",       desc: "FastAPI serving predictions with festival context & margin suggestions" },
  ]

  return (
    <div>
      <div style={{ marginBottom: "2rem" }}>
        <div style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.65rem",
          letterSpacing: "0.2em", color: "var(--accent)", marginBottom: "0.4rem",
          textTransform: "uppercase" }}>Technical Details</div>
        <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: "2rem", fontWeight: 700 }}>
          Model <span style={{ color: "var(--crimson)" }}>Information</span>
        </h1>
        <p style={{ color: "var(--muted)", marginTop: "0.4rem", fontSize: "0.875rem" }}>
          XGBoost demand forecasting model trained on real Nepal retail data
        </p>
      </div>

      {error && (
        <div style={{ background: "rgba(192,57,43,0.12)", border: "1px solid var(--crimson)",
          borderRadius: "var(--radius)", padding: "1rem 1.5rem", marginBottom: "1.5rem",
          color: "var(--crimson)", fontSize: "0.875rem" }}>⚠ {error}</div>
      )}

      {/* Metrics row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)",
        gap: "1rem", marginBottom: "2rem" }}>
        {[
          { label: "Accuracy",    value: loading ? "—" : `${info?.accuracy_pct}%`, color: "var(--green)" },
          { label: "MAE",         value: loading ? "—" : `NRs ${info?.mae_nrs}`,   color: "var(--accent)" },
          { label: "R² Score",    value: loading ? "—" : info?.r2_score,           color: "var(--saffron)" },
          { label: "RMSE",        value: loading ? "—" : `NRs ${info?.rmse_nrs}`,  color: "var(--cream)" },
        ].map(({ label, value, color }) => (
          <div key={label} style={{ background: "var(--card)",
            border: "1px solid var(--border)", borderRadius: "var(--radius)",
            padding: "1.5rem", textAlign: "center" }}>
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.6rem",
              color: "var(--muted)", letterSpacing: "0.15em",
              textTransform: "uppercase", marginBottom: "0.5rem" }}>{label}</div>
            <div style={{ fontFamily: "'Playfair Display', serif",
              fontSize: "2rem", fontWeight: 700, color }}>{value}</div>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem", marginBottom: "1.5rem" }}>

        {/* Feature groups */}
        <div style={{ background: "var(--card)", border: "1px solid var(--border)",
          borderRadius: "var(--radius)", padding: "1.5rem" }}>
          <div style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.62rem",
            color: "var(--accent)", letterSpacing: "0.15em", textTransform: "uppercase",
            marginBottom: "1.2rem" }}>34 Feature Groups</div>
          {featureGroups.map((g, i) => (
            <div key={i} style={{ marginBottom: "1rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between",
                marginBottom: "0.3rem" }}>
                <span style={{ fontSize: "0.85rem", fontWeight: 500 }}>{g.name}</span>
                <span style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.75rem",
                  color: "var(--accent)" }}>{g.count} features</span>
              </div>
              <div style={{ background: "rgba(193,154,93,0.08)", borderRadius: 2,
                height: 4, overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${(g.count / 7) * 100}%`,
                  background: `linear-gradient(90deg, var(--crimson), var(--saffron))`,
                  borderRadius: 2, transition: "width 1s ease" }} />
              </div>
              <div style={{ fontSize: "0.72rem", color: "var(--muted)", marginTop: "0.2rem" }}>
                {g.desc}
              </div>
            </div>
          ))}
        </div>

        {/* Model config */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div style={{ background: "var(--card)", border: "1px solid var(--border)",
            borderRadius: "var(--radius)", padding: "1.5rem" }}>
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.62rem",
              color: "var(--accent)", letterSpacing: "0.15em", textTransform: "uppercase",
              marginBottom: "1rem" }}>XGBoost Hyperparameters</div>
            {[
              ["n_estimators",      "500"],
              ["learning_rate",     "0.05"],
              ["max_depth",         "6"],
              ["subsample",         "0.8"],
              ["colsample_bytree",  "0.8"],
              ["min_child_weight",  "5"],
              ["reg_alpha",         "0.1"],
              ["reg_lambda",        "1.0"],
              ["eval_metric",       "MAE"],
              ["early_stopping",    "30 rounds"],
            ].map(([k, v]) => (
              <div key={k} style={{ display: "flex", justifyContent: "space-between",
                padding: "0.45rem 0", borderBottom: "1px solid rgba(193,154,93,0.06)" }}>
                <span style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.78rem",
                  color: "var(--muted)" }}>{k}</span>
                <span style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.78rem",
                  color: "var(--accent)" }}>{v}</span>
              </div>
            ))}
          </div>

          <div style={{ background: "var(--card)", border: "1px solid var(--border)",
            borderRadius: "var(--radius)", padding: "1.5rem" }}>
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.62rem",
              color: "var(--accent)", letterSpacing: "0.15em", textTransform: "uppercase",
              marginBottom: "1rem" }}>Training Strategy</div>
            {[
              ["Split Type",    "Time-based (no data leakage)"],
              ["Train Period",  "2001 – 2022"],
              ["Test Period",   "2023 – 2026"],
              ["Train Rows",    loading ? "—" : `${info?.train_rows?.toLocaleString()}`],
              ["Test Rows",     loading ? "—" : `${info?.test_rows?.toLocaleString()}`],
              ["Commodities",   "21 Nepal retail items"],
              ["Markets",       "42 across 7 provinces"],
            ].map(([k, v]) => (
              <div key={k} style={{ display: "flex", justifyContent: "space-between",
                padding: "0.45rem 0", borderBottom: "1px solid rgba(193,154,93,0.06)" }}>
                <span style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.78rem",
                  color: "var(--muted)" }}>{k}</span>
                <span style={{ fontSize: "0.78rem", color: "var(--cream)",
                  textAlign: "right", maxWidth: "55%" }}>{v}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Pipeline */}
      <div style={{ background: "var(--card)", border: "1px solid var(--border)",
        borderRadius: "var(--radius)", padding: "1.5rem" }}>
        <div style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.62rem",
          color: "var(--accent)", letterSpacing: "0.15em", textTransform: "uppercase",
          marginBottom: "1.5rem" }}>Full ML Pipeline</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: "1px",
          background: "var(--border)", borderRadius: 4, overflow: "hidden" }}>
          {pipeline.map((p, i) => (
            <div key={i} style={{ background: "var(--panel)", padding: "1rem 0.75rem" }}>
              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.6rem",
                color: "var(--crimson)", marginBottom: "0.4rem" }}>{p.step}</div>
              <div style={{ fontSize: "0.8rem", fontWeight: 600, marginBottom: "0.4rem",
                color: "var(--cream)" }}>{p.title}</div>
              <div style={{ fontSize: "0.72rem", color: "var(--muted)", lineHeight: 1.5 }}>
                {p.desc}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}