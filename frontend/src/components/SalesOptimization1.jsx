import { useState, useEffect } from "react"
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from "recharts"

const API = "http://localhost:8000"

const COMMODITIES = [
  "rice_coarse","rice_medium","wheat_flour","lentils_broken",
  "oil_mustard","oil_soybean","potatoes_red","tomatoes",
  "meat_chicken","milk","eggs","fish","apples","bananas",
  "chickpeas","beans_black","carrots","cabbage","pumpkin","peanut"
]

const inputStyle = {
  width: "100%", background: "var(--panel)", border: "1px solid var(--border)",
  borderRadius: "var(--radius)", padding: "0.65rem 0.9rem", color: "var(--cream)",
  fontSize: "0.875rem", fontFamily: "inherit", outline: "none",
}
const selectStyle = { ...inputStyle, cursor: "pointer" }

const Field = ({ label, children }) => (
  <div style={{ marginBottom: "1rem" }}>
    <label style={{ display: "block", fontFamily: "'DM Mono', monospace",
      fontSize: "0.6rem", letterSpacing: "0.15em", color: "var(--accent)",
      textTransform: "uppercase", marginBottom: "0.4rem" }}>{label}</label>
    {children}
  </div>
)

const STATUS_COLORS = {
  CRITICAL: "var(--crimson)", REORDER: "var(--saffron)",
  OVERSTOCKED: "var(--gold)", HEALTHY: "var(--green)",
}

const URGENCY_COLORS = {
  high: "var(--crimson)", medium: "var(--saffron)", none: "var(--green)",
}

export default function SalesOptimization() {
  const [form, setForm] = useState({
    commodity: "tomatoes", market: "kathmandu", province: "bagmati",
    price_last_1m: 55, price_last_3m: 52, price_last_6m: 48, price_last_12m: 45,
    qty_last_1m: 95, qty_last_3m: 88, qty_last_12m: 80,
    current_stock: 260, days_in_stock: 8,
    prediction_date: "2025-10-15", food_cpi: 120, nrb_food_cpi_change: 5,
  })
  const [result, setResult]   = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState(null)

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const optimize = async () => {
    setLoading(true); setError(null); setResult(null)
    try {
      const res = await fetch(`${API}/sales/optimize`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          price_last_1m: parseFloat(form.price_last_1m),
          price_last_3m: parseFloat(form.price_last_3m),
          price_last_6m: parseFloat(form.price_last_6m),
          price_last_12m: parseFloat(form.price_last_12m),
          qty_last_1m: parseFloat(form.qty_last_1m),
          qty_last_3m: parseFloat(form.qty_last_3m),
          qty_last_12m: parseFloat(form.qty_last_12m),
          current_stock: parseFloat(form.current_stock),
          days_in_stock: parseInt(form.days_in_stock),
          food_cpi: parseFloat(form.food_cpi),
          nrb_food_cpi_change: parseFloat(form.nrb_food_cpi_change),
        }),
      })
      if (!res.ok) throw new Error(await res.text())
      setResult(await res.json())
    } catch (e) {
      setError(e.message.includes("fetch")
        ? "Cannot connect to API. Make sure backend is running on port 8000."
        : "Error: " + e.message)
    } finally {
      setLoading(false)
    }
  }

  const stockChartData = result ? [
    { name: "Safety Stock", value: result.inventory_status.safety_stock, fill: "#8A7E72" },
    { name: "Reorder Point", value: result.inventory_status.reorder_point, fill: "#E67E22" },
    { name: "Current Stock", value: result.inventory_status.current_stock, fill: "#C0392B" },
    { name: "Max Stock", value: result.inventory_status.max_stock_level, fill: "#F1C40F" },
  ] : []

  return (
    <div>
      <div style={{ marginBottom: "2rem" }}>
        <div style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.65rem",
          letterSpacing: "0.2em", color: "var(--accent)", marginBottom: "0.4rem",
          textTransform: "uppercase" }}>Sales Optimization Engine</div>
        <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: "2rem",
          fontWeight: 700 }}>Demand, Inventory & <span style={{ color: "var(--crimson)" }}>Promotion AI</span></h1>
        <p style={{ color: "var(--muted)", marginTop: "0.4rem", fontSize: "0.875rem" }}>
          Combined forecast: price, demand quantity, inventory reorder, and discount strategy
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1.3fr", gap: "2rem" }}>

        {/* LEFT — Form */}
        <div style={{ background: "var(--card)", border: "1px solid var(--border)",
          borderRadius: "var(--radius)", padding: "2rem" }}>
          <div style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.62rem",
            color: "var(--accent)", letterSpacing: "0.15em", textTransform: "uppercase",
            marginBottom: "1.2rem" }}>Store Parameters</div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 1rem" }}>
            <Field label="Commodity">
              <select value={form.commodity} onChange={e => set("commodity", e.target.value)} style={selectStyle}>
                {COMMODITIES.map(c => (
                  <option key={c} value={c} style={{ background: "var(--panel)" }}>
                    {c.replace(/_/g, " ").replace(/\b\w/g, x => x.toUpperCase())}
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

          <div style={{ borderTop: "1px solid var(--border)", margin: "0.8rem 0 1rem",
            paddingTop: "1rem", fontFamily: "'DM Mono', monospace", fontSize: "0.6rem",
            color: "var(--muted)", letterSpacing: "0.12em", textTransform: "uppercase" }}>
            Price History (NRs/kg)
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: "0 0.6rem" }}>
            {[["1m ago","price_last_1m"],["3m ago","price_last_3m"],
              ["6m ago","price_last_6m"],["12m ago","price_last_12m"]].map(([l,k]) => (
              <Field key={k} label={l}>
                <input type="number" value={form[k]} step="0.5"
                  onChange={e => set(k, e.target.value)} style={inputStyle} />
              </Field>
            ))}
          </div>

          <div style={{ borderTop: "1px solid var(--border)", margin: "0.8rem 0 1rem",
            paddingTop: "1rem", fontFamily: "'DM Mono', monospace", fontSize: "0.6rem",
            color: "var(--muted)", letterSpacing: "0.12em", textTransform: "uppercase" }}>
            Sales Quantity History (units sold)
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0 0.6rem" }}>
            {[["1m ago","qty_last_1m"],["3m ago","qty_last_3m"],["12m ago","qty_last_12m"]].map(([l,k]) => (
              <Field key={k} label={l}>
                <input type="number" value={form[k]} step="1"
                  onChange={e => set(k, e.target.value)} style={inputStyle} />
              </Field>
            ))}
          </div>

          <div style={{ borderTop: "1px solid var(--border)", margin: "0.8rem 0 1rem",
            paddingTop: "1rem", fontFamily: "'DM Mono', monospace", fontSize: "0.6rem",
            color: "var(--muted)", letterSpacing: "0.12em", textTransform: "uppercase" }}>
            Inventory Status
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 1rem" }}>
            <Field label="Current Stock (units)">
              <input type="number" value={form.current_stock} step="1"
                onChange={e => set("current_stock", e.target.value)} style={inputStyle} />
            </Field>
            <Field label="Days Since Restock">
              <input type="number" value={form.days_in_stock} step="1"
                onChange={e => set("days_in_stock", e.target.value)} style={inputStyle} />
            </Field>
          </div>

          <button onClick={optimize} disabled={loading} style={{
            width: "100%", padding: "0.9rem", marginTop: "0.5rem",
            background: loading ? "rgba(192,57,43,0.4)" : "var(--crimson)",
            border: "none", borderRadius: "var(--radius)", color: "white",
            fontSize: "0.9rem", fontWeight: 700, fontFamily: "inherit",
            cursor: loading ? "not-allowed" : "pointer", letterSpacing: "0.05em",
          }}>
            {loading ? "Running Full AI Pipeline..." : "Run Sales Optimization →"}
          </button>

          {error && (
            <div style={{ marginTop: "1rem", padding: "0.9rem",
              background: "rgba(192,57,43,0.1)", border: "1px solid var(--crimson)",
              borderRadius: "var(--radius)", color: "var(--crimson)",
              fontSize: "0.8rem", lineHeight: 1.5 }}>{error}</div>
          )}
        </div>

        {/* RIGHT — Results */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {!result && !loading && (
            <div style={{ background: "var(--card)", border: "1px solid var(--border)",
              borderRadius: "var(--radius)", padding: "3rem 2rem", textAlign: "center",
              color: "var(--muted)" }}>
              <div style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.2rem",
                marginBottom: "0.5rem", color: "var(--cream)" }}>
                AI-Powered Sales Optimization
              </div>
              <div style={{ fontSize: "0.8rem", lineHeight: 1.7 }}>
                This combines 2 ML models + inventory math:<br/>
                Price forecast (XGBoost, 93.4% acc) · Demand forecast (XGBoost, 85.2% acc)<br/>
                Reorder point / EOQ calculation · Promotion engine
              </div>
            </div>
          )}

          {loading && (
            <div style={{ background: "var(--card)", border: "1px solid var(--border)",
              borderRadius: "var(--radius)", padding: "3rem 2rem", textAlign: "center" }}>
              <div style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.2rem",
                color: "var(--accent)" }}>Running full AI pipeline...</div>
            </div>
          )}

          {result && (
            <>
              {/* Revenue summary - hero */}
              <div style={{ background: "var(--card)", border: "1px solid var(--border)",
                borderRadius: "var(--radius)", padding: "1.5rem" }}>
                <div style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.62rem",
                  color: "var(--accent)", letterSpacing: "0.15em", textTransform: "uppercase",
                  marginBottom: "1rem" }}>Revenue Optimization — Next Month Projection</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: "0.75rem" }}>
                  {[
                    { label: "Optimal Price", value: `NRs ${result.revenue_optimization.optimal_price_nrs}`, color: "var(--accent)" },
                    { label: "Predicted Units", value: result.revenue_optimization.predicted_units_sold, color: "var(--cream)" },
                    { label: "Projected Revenue", value: `NRs ${result.revenue_optimization.projected_revenue_nrs.toLocaleString()}`, color: "var(--gold)" },
                    { label: "Projected Profit", value: `NRs ${result.revenue_optimization.projected_profit_nrs.toLocaleString()}`, color: "var(--green)" },
                  ].map(({label,value,color}) => (
                    <div key={label} style={{ textAlign: "center", padding: "0.9rem",
                      background: "rgba(193,154,93,0.05)", border: "1px solid var(--border)",
                      borderRadius: 4 }}>
                      <div style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.55rem",
                        color: "var(--muted)", marginBottom: "0.3rem", textTransform: "uppercase",
                        letterSpacing: "0.1em" }}>{label}</div>
                      <div style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.15rem",
                        fontWeight: 700, color }}>{value}</div>
                    </div>
                  ))}
                </div>
                <div style={{ marginTop: "0.75rem", textAlign: "center", fontFamily: "'DM Mono', monospace",
                  fontSize: "0.7rem", color: "var(--muted)" }}>
                  Margin: <span style={{ color: "var(--green)" }}>{result.revenue_optimization.projected_margin_pct}%</span>
                  {"  ·  "}Festival: <span style={{ color: "var(--gold)" }}>{result.price_forecast.festival_season}</span>
                </div>
              </div>

              {/* Two columns: Inventory + Promotion */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>

                {/* Inventory */}
                <div style={{ background: "var(--card)", border: "1px solid var(--border)",
                  borderRadius: "var(--radius)", padding: "1.5rem" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center",
                    marginBottom: "1rem" }}>
                    <div style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.62rem",
                      color: "var(--accent)", letterSpacing: "0.15em",
                      textTransform: "uppercase" }}>Inventory Status</div>
                    <span style={{ background: `${STATUS_COLORS[result.inventory_status.status]}22`,
                      color: STATUS_COLORS[result.inventory_status.status],
                      padding: "0.2rem 0.6rem", borderRadius: 3,
                      fontFamily: "'DM Mono', monospace", fontSize: "0.62rem",
                      letterSpacing: "0.08em" }}>{result.inventory_status.status}</span>
                  </div>

                  <ResponsiveContainer width="100%" height={140}>
                    <BarChart data={stockChartData} layout="vertical"
                      margin={{ left: 10, right: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(193,154,93,0.07)" horizontal={false} />
                      <XAxis type="number" tick={{ fill: "#8A7E72", fontSize: 9 }} axisLine={false} tickLine={false} />
                      <YAxis type="category" dataKey="name" tick={{ fill: "#8A7E72", fontSize: 9 }}
                        axisLine={false} tickLine={false} width={85} />
                      <Tooltip contentStyle={{ background: "var(--panel)", border: "1px solid var(--border)",
                        borderRadius: 4, fontSize: 12 }} />
                      <Bar dataKey="value" radius={[0,3,3,0]}>
                        {stockChartData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>

                  <p style={{ fontSize: "0.8rem", lineHeight: 1.6, color: "var(--cream)",
                    marginTop: "0.5rem" }}>{result.inventory_status.action}</p>
                  <div style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.7rem",
                    color: "var(--muted)", marginTop: "0.5rem" }}>
                    Days of stock left: <span style={{ color: "var(--accent)" }}>
                      {result.inventory_status.days_of_stock_remaining}
                    </span> · EOQ: <span style={{ color: "var(--accent)" }}>
                      {result.inventory_status.economic_order_quantity}
                    </span> units
                  </div>
                </div>

                {/* Promotion */}
                <div style={{ background: "var(--card)", border: "1px solid var(--border)",
                  borderRadius: "var(--radius)", padding: "1.5rem" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center",
                    marginBottom: "1rem" }}>
                    <div style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.62rem",
                      color: "var(--accent)", letterSpacing: "0.15em",
                      textTransform: "uppercase" }}>Promotion Engine</div>
                    <span style={{ background: `${URGENCY_COLORS[result.promotion.urgency]}22`,
                      color: URGENCY_COLORS[result.promotion.urgency],
                      padding: "0.2rem 0.6rem", borderRadius: 3,
                      fontFamily: "'DM Mono', monospace", fontSize: "0.62rem",
                      letterSpacing: "0.08em", textTransform: "uppercase" }}>
                      {result.promotion.urgency} urgency
                    </span>
                  </div>

                  <div style={{ textAlign: "center", padding: "1.5rem 0" }}>
                    {result.promotion.suggested_discount_pct > 0 ? (
                      <>
                        <div style={{ fontFamily: "'Playfair Display', serif", fontSize: "3rem",
                          fontWeight: 900, color: "var(--crimson)", lineHeight: 1 }}>
                          -{result.promotion.suggested_discount_pct}%
                        </div>
                        <div style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.85rem",
                          color: "var(--muted)", marginTop: "0.5rem" }}>
                          NRs {result.promotion.current_price} → <span style={{ color: "var(--gold)" }}>
                            NRs {result.promotion.suggested_promo_price}
                          </span>
                        </div>
                      </>
                    ) : (
                      <div style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.8rem",
                        color: "var(--green)" }}>No Promo Needed</div>
                    )}
                  </div>

                  <p style={{ fontSize: "0.8rem", lineHeight: 1.6, color: "var(--cream)" }}>
                    {result.promotion.recommendation}
                  </p>
                  {result.promotion.reasons.length > 0 && (
                    <ul style={{ marginTop: "0.5rem", paddingLeft: "1.2rem" }}>
                      {result.promotion.reasons.map((r, i) => (
                        <li key={i} style={{ fontSize: "0.72rem", color: "var(--muted)",
                          marginBottom: "0.2rem" }}>{r}</li>
                      ))}
                    </ul>
                  )}
                  <div style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.7rem",
                    color: "var(--muted)", marginTop: "0.6rem" }}>
                    Perishable: <span style={{ color: result.promotion.is_perishable ? "var(--crimson)" : "var(--green)" }}>
                      {result.promotion.is_perishable ? "Yes" : "No"}
                    </span> · Stock ratio: <span style={{ color: "var(--accent)" }}>
                      {(result.promotion.stock_ratio_of_max * 100).toFixed(0)}%
                    </span> of max
                  </div>
                </div>
              </div>

              {/* Price + Demand side by side */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                <div style={{ background: "var(--card)", border: "1px solid var(--border)",
                  borderRadius: "var(--radius)", padding: "1.5rem" }}>
                  <div style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.62rem",
                    color: "var(--accent)", letterSpacing: "0.15em", textTransform: "uppercase",
                    marginBottom: "0.8rem" }}>Price Forecast (93.4% acc)</div>
                  <div style={{ fontFamily: "'Playfair Display', serif", fontSize: "2rem",
                    fontWeight: 900, color: "var(--accent)" }}>
                    NRs {result.price_forecast.predicted_price}
                  </div>
                  <div style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.8rem",
                    color: result.price_forecast.price_change_pct > 0 ? "var(--crimson)" : "var(--green)" }}>
                    {result.price_forecast.price_change_pct > 0 ? "▲" : "▼"} {Math.abs(result.price_forecast.price_change_pct)}%
                  </div>
                </div>

                <div style={{ background: "var(--card)", border: "1px solid var(--border)",
                  borderRadius: "var(--radius)", padding: "1.5rem" }}>
                  <div style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.62rem",
                    color: "var(--accent)", letterSpacing: "0.15em", textTransform: "uppercase",
                    marginBottom: "0.8rem" }}>Demand Forecast (85.2% acc)</div>
                  <div style={{ fontFamily: "'Playfair Display', serif", fontSize: "2rem",
                    fontWeight: 900, color: "var(--saffron)" }}>
                    {result.Celldemand_forecast.predicted_qty_units} units
                  </div>
                  <div style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.8rem",
                    color: result.demand_forecast.qty_change_pct > 0 ? "var(--crimson)" : "var(--green)" }}>
                    {result.demand_forecast.qty_change_pct > 0 ? "▲" : "▼"} {Math.abs(result.demand_forecast.qty_change_pct)}%
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
