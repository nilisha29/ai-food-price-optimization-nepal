import { useEffect, useState } from "react"
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import { API_BASE_URL } from "../config/api"

const cardStyle = {
  background: "var(--card)", border: "1px solid var(--border)",
  borderRadius: "var(--radius)", padding: "1.25rem",
}

const metricGroups = [
  { title: "Price model", key: "price", metrics: [["Accuracy", "accuracy_pct", "%"], ["MAE", "mae_nrs", " NRs/kg"], ["RMSE", "rmse_nrs", " NRs/kg"], ["R² score", "r2_score", ""]] },
  { title: "Demand model", key: "demand", metrics: [["Accuracy", "accuracy_pct", "%"], ["MAE", "mae_units", " units"], ["RMSE", "rmse_units", " units"], ["R² score", "r2_score", ""]] },
]

const formatFeature = feature => feature.replace(/_/g, " ").replace(/\b\w/g, letter => letter.toUpperCase())
const formatValue = (value, suffix) => `${Number(value).toFixed(value < 1 ? 3 : 2)}${suffix}`

export default function ModelEvaluation() {
  const [info, setInfo] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetch(`${API_BASE_URL}/model/info`)
      .then(response => {
        if (!response.ok) throw new Error("Unable to load model information")
        return response.json()
      })
      .then(setInfo)
      .catch(() => setError("Cannot connect to the backend. Start the FastAPI server and try again."))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div>
      <header style={{ marginBottom: "2rem" }}>
        <div style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.65rem", letterSpacing: "0.2em", color: "var(--accent)", textTransform: "uppercase", marginBottom: "0.4rem" }}>Research & Evaluation</div>
        <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: "2rem", fontWeight: 700 }}>Model <span style={{ color: "var(--crimson)" }}>Evaluation</span></h1>
        <p style={{ color: "var(--muted)", marginTop: "0.4rem", fontSize: "0.875rem" }}>Performance, training coverage, and explainability for the pricing and demand engines.</p>
      </header>

      {loading && <div style={{ ...cardStyle, color: "var(--accent)" }}>Loading evaluation metrics from the trained models...</div>}
      {error && <div style={{ ...cardStyle, color: "var(--crimson)", borderColor: "var(--crimson)" }}>{error}</div>}
      {info && <>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "1rem", marginBottom: "1rem" }}>
          {metricGroups.map(group => {
            const source = group.key === "price" ? info : info.demand_model
            return <section key={group.key} style={cardStyle}>
              <div style={{ color: "var(--accent)", fontFamily: "'DM Mono', monospace", fontSize: "0.62rem", letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: "1rem" }}>{group.title}</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "0.6rem" }}>
                {group.metrics.map(([label, key, suffix]) => <div key={key}>
                  <div style={{ color: "var(--muted)", fontSize: "0.65rem", textTransform: "uppercase" }}>{label}</div>
                  <div style={{ color: "var(--cream)", fontFamily: "'Playfair Display', serif", fontSize: "1.35rem", fontWeight: 700, marginTop: "0.25rem" }}>{formatValue(source[key], suffix)}</div>
                </div>)}
              </div>
            </section>
          })}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1.35fr 1fr", gap: "1rem", marginBottom: "1rem" }}>
          <section style={cardStyle}>
            <div style={{ color: "var(--accent)", fontFamily: "'DM Mono', monospace", fontSize: "0.62rem", letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: "1rem" }}>What influences price predictions?</div>
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={info.feature_importance.map(item => ({ ...item, label: formatFeature(item.feature) }))} layout="vertical" margin={{ left: 20, right: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(193,154,93,0.08)" />
                <XAxis type="number" tick={{ fill: "#8A7E72", fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="label" width={135} tick={{ fill: "#8A7E72", fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip formatter={value => Number(value).toFixed(4)} />
                <Bar dataKey="importance" fill="#C0392B" radius={[0, 3, 3, 0]} name="Importance" />
              </BarChart>
            </ResponsiveContainer>
          </section>

          <section style={cardStyle}>
            <div style={{ color: "var(--accent)", fontFamily: "'DM Mono', monospace", fontSize: "0.62rem", letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: "1rem" }}>Training coverage</div>
            <div style={{ display: "grid", gap: "0.9rem" }}>
              <MetricRow label="Price training rows" value={info.train_rows.toLocaleString()} />
              <MetricRow label="Price test rows" value={info.test_rows.toLocaleString()} />
              <MetricRow label="Price features" value={info.features.length} />
              <MetricRow label="Demand training rows" value={info.demand_model.train_rows.toLocaleString()} />
              <MetricRow label="Demand test rows" value={info.demand_model.test_rows.toLocaleString()} />
              <MetricRow label="Demand features" value={info.demand_model.features.length} />
            </div>
            <div style={{ borderTop: "1px solid var(--border)", marginTop: "1.2rem", paddingTop: "1rem", color: "var(--muted)", fontSize: "0.78rem", lineHeight: 1.6 }}>
              Models use temporal price history, seasonality, festivals, location, commodity category, and Nepal food CPI signals.
            </div>
          </section>
        </div>

        <section style={{ ...cardStyle, borderColor: "var(--accent)" }}>
          <div style={{ color: "var(--accent)", fontFamily: "'DM Mono', monospace", fontSize: "0.62rem", letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: "0.7rem" }}>Interpretation & limitations</div>
          <p style={{ color: "var(--cream)", fontSize: "0.85rem", lineHeight: 1.7 }}>Feature importance shows which inputs the XGBoost price model used most across its learned trees. It describes model behavior, not causation. Predictions depend on the quality and range of the historical Nepal retail data and should support, not replace, store-manager judgment.</p>
        </section>
      </>}
    </div>
  )
}

const MetricRow = ({ label, value }) => <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid rgba(193,154,93,0.08)", paddingBottom: "0.55rem" }}><span style={{ color: "var(--muted)", fontSize: "0.78rem" }}>{label}</span><strong style={{ color: "var(--cream)", fontFamily: "'DM Mono', monospace", fontSize: "0.78rem" }}>{value}</strong></div>
