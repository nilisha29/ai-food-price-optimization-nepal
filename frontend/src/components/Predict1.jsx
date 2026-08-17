import { useState } from "react"

const API = "http://localhost:8000"

const COMMODITIES = [
  "rice_coarse","rice_medium","wheat_flour","lentils_broken",
  "oil_mustard","oil_soybean","potatoes_red","tomatoes",
  "meat_chicken","milk","eggs","fish","apples","bananas",
  "chickpeas","beans_black","carrots","cabbage","pumpkin","peanut"
]

const PROVINCES = [
  "bagmati","province_1","province_2","gandaki","lumbini","karnali","sudurpashchim"
]

const MARKETS = [
  "kathmandu","bhaktapur","lalitpur","pokhara","chitwan",
  "butwal","dharan","biratnagar","janakpur","nepalgunj"
]
const Field = ({ label, children }) => (
  <div style={{ marginBottom: "1.2rem" }}>
    <label style={{ display: "block", fontFamily: "'DM Mono', monospace",
      fontSize: "0.62rem", letterSpacing: "0.15em", color: "var(--accent)",
      textTransform: "uppercase", marginBottom: "0.5rem" }}>{label}</label>
    {children}
  </div>
)

const inputStyle = {
  width: "100%", background: "var(--panel)", border: "1px solid var(--border)",
  borderRadius: "var(--radius)", padding: "0.65rem 0.9rem", color: "var(--cream)",
  fontSize: "0.875rem", fontFamily: "inherit", outline: "none",
  transition: "border-color 0.15s",
}

const selectStyle = { ...inputStyle, cursor: "pointer" }

export default function Predict() {
  const [form, setForm] = useState({
    commodity: "rice_coarse", market: "kathmandu", province: "bagmati",
    price_last_1m: 62, price_last_3m: 60, price_last_6m: 58, price_last_12m: 55,
    prediction_date: "2025-10-15", food_cpi: 120, nrb_food_cpi_change: 5,
  })
  const [result,  setResult]  = useState(null)
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState(null)

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const predict = async () => {
    setLoading(true); setError(null); setResult(null)
    try {
      const res = await fetch(`${API}/predict`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          price_last_1m:  parseFloat(form.price_last_1m),
          price_last_3m:  parseFloat(form.price_last_3m),
          price_last_6m:  parseFloat(form.price_last_6m),
          price_last_12m: parseFloat(form.price_last_12m),
          food_cpi:       parseFloat(form.food_cpi),
          nrb_food_cpi_change: parseFloat(form.nrb_food_cpi_change),
        }),
      })
      if (!res.ok) throw new Error(await res.text())
      setResult(await res.json())
    } catch (e) {
      setError(e.message.includes("fetch") 
        ? "Cannot connect to API. Make sure backend is running: python -m uvicorn main:app --reload --port 8000"
        : e.message)
    } finally {
      setLoading(false)
    }
  }

  const changeColor = result
    ? result.price_change_pct > 3  ? "var(--crimson)"
    : result.price_change_pct < -3 ? "var(--green)"
    : "var(--saffron)" : "var(--accent)"

  return (
    <div>
      <div style={{ marginBottom: "2rem" }}>
        <div style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.65rem",
          letterSpacing: "0.2em", color: "var(--accent)", marginBottom: "0.4rem",
          textTransform: "uppercase" }}>AI Engine</div>
        <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: "2rem",
          fontWeight: 700 }}>Price <span style={{ color: "var(--crimson)" }}>Predictor</span></h1>
        <p style={{ color: "var(--muted)", marginTop: "0.4rem", fontSize: "0.875rem" }}>
          Enter current market prices to get next month's AI prediction
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2rem" }}>

        {/* Left — form */}
        <div style={{ background: "var(--card)", border: "1px solid var(--border)",
          borderRadius: "var(--radius)", padding: "2rem" }}>
          <div style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.62rem",
            color: "var(--accent)", letterSpacing: "0.15em", textTransform: "uppercase",
            marginBottom: "1.5rem" }}>Market Parameters</div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 1rem" }}>
            <Field label="Commodity">
              <select value={form.commodity} onChange={e => set("commodity", e.target.value)}
                style={selectStyle}>
                {COMMODITIES.map(c => (
                  <option key={c} value={c} style={{ background: "var(--panel)" }}>
                    {c.replace(/_/g, " ").replace(/\b\w/g, x => x.toUpperCase())}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Market">
              <select value={form.market} onChange={e => set("market", e.target.value)}
                style={selectStyle}>
                {MARKETS.map(m => (
                  <option key={m} value={m} style={{ background: "var(--panel)" }}>
                    {m.replace(/\b\w/g, x => x.toUpperCase())}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Province">
              <select value={form.province} onChange={e => set("province", e.target.value)}
                style={selectStyle}>
                {PROVINCES.map(p => (
                  <option key={p} value={p} style={{ background: "var(--panel)" }}>
                    {p.replace(/_/g, " ").replace(/\b\w/g, x => x.toUpperCase())}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Prediction Date">
              <input type="date" value={form.prediction_date}
                onChange={e => set("prediction_date", e.target.value)}
                style={{ ...inputStyle, colorScheme: "dark" }} />
            </Field>
          </div>

          <div style={{ borderTop: "1px solid var(--border)", margin: "1.2rem 0",
            paddingTop: "1.2rem", fontFamily: "'DM Mono', monospace", fontSize: "0.62rem",
            color: "var(--muted)", letterSpacing: "0.12em", textTransform: "uppercase" }}>
            Recent Price History (NRs/kg)
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 1rem" }}>
            {[
              ["Price — 1 Month Ago", "price_last_1m"],
              ["Price — 3 Months Ago", "price_last_3m"],
              ["Price — 6 Months Ago", "price_last_6m"],
              ["Price — 12 Months Ago", "price_last_12m"],
            ].map(([label, key]) => (
              <Field key={key} label={label}>
                <input type="number" value={form[key]} step="0.5"
                  onChange={e => set(key, e.target.value)}
                  style={inputStyle}
                  onFocus={e => e.target.style.borderColor = "var(--accent)"}
                  onBlur={e => e.target.style.borderColor = "var(--border)"} />
              </Field>
            ))}
          </div>

          <div style={{ borderTop: "1px solid var(--border)", margin: "1.2rem 0",
            paddingTop: "1.2rem", fontFamily: "'DM Mono', monospace", fontSize: "0.62rem",
            color: "var(--muted)", letterSpacing: "0.12em", textTransform: "uppercase" }}>
            Macro Signals (Optional)
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 1rem" }}>
            <Field label="Food CPI Index">
              <input type="number" value={form.food_cpi} step="1"
                onChange={e => set("food_cpi", e.target.value)} style={inputStyle}
                onFocus={e => e.target.style.borderColor = "var(--accent)"}
                onBlur={e => e.target.style.borderColor = "var(--border)"} />
            </Field>
            <Field label="NRB CPI Change (%)">
              <input type="number" value={form.nrb_food_cpi_change} step="0.1"
                onChange={e => set("nrb_food_cpi_change", e.target.value)} style={inputStyle}
                onFocus={e => e.target.style.borderColor = "var(--accent)"}
                onBlur={e => e.target.style.borderColor = "var(--border)"} />
            </Field>
          </div>

          <button onClick={predict} disabled={loading} style={{
            width: "100%", padding: "0.9rem", marginTop: "0.5rem",
            background: loading ? "rgba(192,57,43,0.4)" : "var(--crimson)",
            border: "none", borderRadius: "var(--radius)", color: "white",
            fontSize: "0.9rem", fontWeight: 700, fontFamily: "inherit",
            cursor: loading ? "not-allowed" : "pointer",
            letterSpacing: "0.05em", transition: "all 0.15s",
          }}>
            {loading ? "Running AI Model..." : "Get Price Prediction →"}
          </button>

          {error && (
            <div style={{ marginTop: "1rem", padding: "0.9rem",
              background: "rgba(192,57,43,0.1)", border: "1px solid var(--crimson)",
              borderRadius: "var(--radius)", color: "var(--crimson)",
              fontSize: "0.8rem", lineHeight: 1.5 }}>{error}</div>
          )}
        </div>

        {/* Right — result */}
        <div>
          {!result && !loading && (
            <div style={{ background: "var(--card)", border: "1px solid var(--border)",
              borderRadius: "var(--radius)", padding: "3rem 2rem", textAlign: "center",
              color: "var(--muted)" }}>
              <div style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.2rem",
                marginBottom: "0.5rem", color: "var(--cream)" }}>
                Fill in the form and click<br/>Get Price Prediction
              </div>
              <div style={{ fontSize: "0.8rem" }}>
                The AI model will predict next month's price<br/>
                based on your input and Nepal market patterns
              </div>
            </div>
          )}

          {loading && (
            <div style={{ background: "var(--card)", border: "1px solid var(--border)",
              borderRadius: "var(--radius)", padding: "3rem 2rem", textAlign: "center" }}>
              <div style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.2rem",
                color: "var(--accent)", marginBottom: "0.5rem" }}>Running XGBoost Model...</div>
              <div style={{ color: "var(--muted)", fontSize: "0.8rem" }}>
                Applying 34 features · Festival calendar · Nepal CPI data
              </div>
            </div>
          )}

          {result && (
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              {/* Main prediction */}
              <div style={{ background: "var(--card)", border: "1px solid var(--border)",
                borderRadius: "var(--radius)", padding: "2rem", textAlign: "center" }}>
                <div style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.62rem",
                  color: "var(--muted)", letterSpacing: "0.15em",
                  textTransform: "uppercase", marginBottom: "0.5rem" }}>
                  Predicted Price — Next Month
                </div>
                <div style={{ fontFamily: "'Playfair Display', serif",
                  fontSize: "3.5rem", fontWeight: 900, color: "var(--accent)",
                  lineHeight: 1 }}>
                  NRs {result.predicted_price?.toFixed(2)}
                </div>
                <div style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.9rem",
                  color: changeColor, marginTop: "0.5rem" }}>
                  {result.price_change_pct > 0 ? "▲" : "▼"} {Math.abs(result.price_change_pct)?.toFixed(2)}% from current
                </div>
                <div style={{ marginTop: "0.8rem", padding: "0.4rem 0.8rem",
                  display: "inline-block", borderRadius: 3,
                  background: result.festival_season !== "Normal Season"
                    ? "rgba(241,196,15,0.12)" : "rgba(193,154,93,0.08)",
                  color: result.festival_season !== "Normal Season"
                    ? "var(--gold)" : "var(--muted)",
                  fontFamily: "'DM Mono', monospace", fontSize: "0.7rem",
                  letterSpacing: "0.08em" }}>
                  {result.festival_season}
                </div>
              </div>

              {/* Recommendation */}
              <div style={{ background: "var(--card)", border: "1px solid var(--border)",
                borderRadius: "var(--radius)", padding: "1.5rem" }}>
                <div style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.62rem",
                  color: "var(--accent)", letterSpacing: "0.15em",
                  textTransform: "uppercase", marginBottom: "0.75rem" }}>AI Recommendation</div>
                <p style={{ fontSize: "0.9rem", lineHeight: 1.6, color: "var(--cream)" }}>
                  {result.recommendation}
                </p>
                <div style={{ marginTop: "0.75rem", display: "flex",
                  alignItems: "center", gap: "0.5rem" }}>
                  <span style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.65rem",
                    color: "var(--muted)" }}>Confidence:</span>
                  <span style={{ background: result.confidence === "High"
                    ? "rgba(39,174,96,0.15)" : "rgba(230,126,34,0.15)",
                    color: result.confidence === "High" ? "var(--green)" : "var(--saffron)",
                    padding: "0.2rem 0.6rem", borderRadius: 3,
                    fontFamily: "'DM Mono', monospace", fontSize: "0.65rem" }}>
                    {result.confidence}
                  </span>
                  <span style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.65rem",
                    color: "var(--muted)", marginLeft: "auto" }}>
                    Model accuracy: {result.model_accuracy}%
                  </span>
                </div>
              </div>

              {/* Margin suggestion */}
              <div style={{ background: "var(--card)", border: "1px solid var(--border)",
                borderRadius: "var(--radius)", padding: "1.5rem" }}>
                <div style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.62rem",
                  color: "var(--accent)", letterSpacing: "0.15em",
                  textTransform: "uppercase", marginBottom: "1rem" }}>Pricing Strategy</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.75rem" }}>
                  {[
                    { label: "Min Price (10%)", key: "min_price_10pct", color: "var(--muted)" },
                    { label: "Optimal Price", key: "optimal_price",    color: "var(--accent)" },
                    { label: "Max Price",      key: "max_price",       color: "var(--crimson)" },
                  ].map(({ label, key, color }) => (
                    <div key={key} style={{ textAlign: "center", padding: "0.75rem",
                      background: "rgba(193,154,93,0.05)",
                      border: "1px solid var(--border)", borderRadius: 4 }}>
                      <div style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.58rem",
                        color: "var(--muted)", marginBottom: "0.3rem",
                        textTransform: "uppercase", letterSpacing: "0.1em" }}>{label}</div>
                      <div style={{ fontFamily: "'Playfair Display', serif",
                        fontSize: "1.2rem", fontWeight: 700, color }}>
                        NRs {result.margin_suggestion?.[key]?.toFixed(2)}
                      </div>
                    </div>
                  ))}
                </div>
                <div style={{ marginTop: "0.75rem", fontFamily: "'DM Mono', monospace",
                  fontSize: "0.7rem", color: "var(--muted)", textAlign: "center" }}>
                  Suggested margin: <span style={{ color: "var(--green)" }}>
                    {result.margin_suggestion?.suggested_margin_pct}%
                  </span> · Est. cost: NRs {result.margin_suggestion?.estimated_cost?.toFixed(2)}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}