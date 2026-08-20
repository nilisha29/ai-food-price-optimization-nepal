import { useState } from "react"
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import { API_BASE_URL } from "../config/api"
import { FOOD_COMMODITIES, MARKETS, PROVINCES } from "../config/catalog"

const inputStyle = {
  width: "100%", background: "var(--panel)", border: "1px solid var(--border)",
  borderRadius: "var(--radius)", padding: "0.65rem 0.9rem", color: "var(--cream)",
  fontSize: "0.875rem", fontFamily: "inherit", outline: "none",
}

const Field = ({ label, children }) => (
  <label style={{ display: "block", marginBottom: "1rem" }}>
    <span style={{ display: "block", fontFamily: "'DM Mono', monospace", fontSize: "0.6rem",
      letterSpacing: "0.15em", color: "var(--accent)", textTransform: "uppercase", marginBottom: "0.4rem" }}>{label}</span>
    {children}
  </label>
)

const labelFor = value => value.replace(/_/g, " ").replace(/\b\w/g, letter => letter.toUpperCase())
const money = value => `NRs ${Number(value || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}`

function ScenarioCard({ label, result, tone }) {
  if (!result) return null
  const revenue = result.revenue_optimization
  const priceChange = result.price_forecast.price_change_pct
  return (
    <div style={{ background: "var(--card)", border: `1px solid ${tone}`, borderRadius: "var(--radius)", padding: "1.2rem" }}>
      <div style={{ color: tone, fontFamily: "'DM Mono', monospace", fontSize: "0.62rem", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: "0.8rem" }}>{label}</div>
      <div style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.7rem", color: "var(--cream)", fontWeight: 700 }}>{money(revenue.projected_profit_nrs)}</div>
      <div style={{ color: "var(--muted)", fontSize: "0.72rem", marginBottom: "1rem" }}>Projected profit</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.7rem" }}>
        <Metric label="Price" value={money(revenue.optimal_price_nrs)} />
        <Metric label="Units" value={revenue.predicted_units_sold} />
        <Metric label="Revenue" value={money(revenue.projected_revenue_nrs)} />
        <Metric label="Price trend" value={`${priceChange >= 0 ? "+" : ""}${priceChange}%`} />
      </div>
    </div>
  )
}

const Metric = ({ label, value }) => (
  <div style={{ borderTop: "1px solid var(--border)", paddingTop: "0.55rem" }}>
    <div style={{ color: "var(--muted)", fontSize: "0.62rem", textTransform: "uppercase" }}>{label}</div>
    <div style={{ color: "var(--cream)", fontFamily: "'DM Mono', monospace", fontSize: "0.78rem", marginTop: "0.2rem" }}>{value}</div>
  </div>
)

export default function ScenarioSimulator() {
  const [form, setForm] = useState({
    commodity: "rice_coarse", market: "kathmandu", province: "bagmati",
    price_last_1m: 100, price_last_3m: 95, price_last_6m: 90, price_last_12m: 85,
    qty_last_1m: 220, qty_last_3m: 210, qty_last_12m: 200, current_stock: 300,
    days_in_stock: 5, prediction_date: new Date().toISOString().split("T")[0],
    food_cpi: 125, nrb_food_cpi_change: 5.2,
  })
  const [scenarioPrices, setScenarioPrices] = useState({ discount: 90, premium: 110 })
  const [results, setResults] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const set = (key, value) => setForm(current => ({ ...current, [key]: value }))
  const setScenarioPrice = (key, value) => setScenarioPrices(current => ({ ...current, [key]: value }))

  const runSimulation = async () => {
    setLoading(true)
    setError(null)
    setResults(null)
    const prices = { baseline: Number(form.price_last_1m), ...Object.fromEntries(Object.entries(scenarioPrices).map(([key, value]) => [key, Number(value)])) }
    try {
      const responses = await Promise.all(Object.entries(prices).map(async ([name, price]) => {
        const response = await fetch(`${API_BASE_URL}/sales/optimize`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...form, price_last_1m: price, price_last_3m: Number(form.price_last_3m), price_last_6m: Number(form.price_last_6m), price_last_12m: Number(form.price_last_12m), qty_last_1m: Number(form.qty_last_1m), qty_last_3m: Number(form.qty_last_3m), qty_last_12m: Number(form.qty_last_12m), current_stock: Number(form.current_stock), days_in_stock: Number(form.days_in_stock), food_cpi: Number(form.food_cpi), nrb_food_cpi_change: Number(form.nrb_food_cpi_change) }),
        })
        if (!response.ok) throw new Error(await response.text())
        return [name, await response.json()]
      }))
      setResults(Object.fromEntries(responses))
    } catch (err) {
      setError(err.message.includes("fetch") ? "Cannot connect to API. Make sure the backend is running on port 8000." : err.message)
    } finally {
      setLoading(false)
    }
  }

  const chartData = results ? Object.entries(results).map(([name, result]) => ({
    name: labelFor(name), profit: result.revenue_optimization.projected_profit_nrs, revenue: result.revenue_optimization.projected_revenue_nrs,
  })) : []
  const bestScenario = results ? Object.entries(results).sort(([, left], [, right]) => right.revenue_optimization.projected_profit_nrs - left.revenue_optimization.projected_profit_nrs)[0] : null

  return (
    <div>
      <header style={{ marginBottom: "2rem" }}>
        <div style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.65rem", letterSpacing: "0.2em", color: "var(--accent)", textTransform: "uppercase", marginBottom: "0.4rem" }}>Decision Lab</div>
        <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: "2rem", fontWeight: 700 }}>What-If <span style={{ color: "var(--crimson)" }}>Simulator</span></h1>
        <p style={{ color: "var(--muted)", marginTop: "0.4rem", fontSize: "0.875rem" }}>Compare food commodity pricing strategies before applying them to a Nepal retail store.</p>
      </header>

      <div style={{ display: "grid", gridTemplateColumns: "minmax(280px, 0.85fr) minmax(400px, 1.5fr)", gap: "1.5rem", alignItems: "start" }}>
        <section style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: "var(--radius)", padding: "1.5rem" }}>
          <div style={{ color: "var(--accent)", fontFamily: "'DM Mono', monospace", fontSize: "0.62rem", letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: "1rem" }}>Scenario Inputs</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 0.8rem" }}>
            <Field label="Commodity"><select value={form.commodity} onChange={event => set("commodity", event.target.value)} style={inputStyle}>{FOOD_COMMODITIES.map(item => <option key={item} value={item}>{labelFor(item)}</option>)}</select></Field>
            <Field label="Market"><select value={form.market} onChange={event => set("market", event.target.value)} style={inputStyle}>{MARKETS.map(item => <option key={item} value={item}>{labelFor(item)}</option>)}</select></Field>
            <Field label="Province"><select value={form.province} onChange={event => set("province", event.target.value)} style={inputStyle}>{PROVINCES.map(item => <option key={item} value={item}>{labelFor(item)}</option>)}</select></Field>
            <Field label="Current price"><input type="number" value={form.price_last_1m} onChange={event => set("price_last_1m", event.target.value)} style={inputStyle} /></Field>
            <Field label="Units sold / month"><input type="number" value={form.qty_last_1m} onChange={event => set("qty_last_1m", event.target.value)} style={inputStyle} /></Field>
            <Field label="Current stock"><input type="number" value={form.current_stock} onChange={event => set("current_stock", event.target.value)} style={inputStyle} /></Field>
          </div>
          <div style={{ borderTop: "1px solid var(--border)", paddingTop: "1rem", marginTop: "0.3rem" }}>
            <Field label="Discount scenario price"><input type="number" value={scenarioPrices.discount} onChange={event => setScenarioPrice("discount", event.target.value)} style={inputStyle} /></Field>
            <Field label="Premium scenario price"><input type="number" value={scenarioPrices.premium} onChange={event => setScenarioPrice("premium", event.target.value)} style={inputStyle} /></Field>
          </div>
          <button onClick={runSimulation} disabled={loading} style={{ width: "100%", padding: "0.9rem", background: loading ? "rgba(192,57,43,0.4)" : "var(--crimson)", border: "none", borderRadius: "var(--radius)", color: "white", fontSize: "0.9rem", fontWeight: 700, cursor: loading ? "not-allowed" : "pointer" }}>{loading ? "Comparing scenarios..." : "Run Scenario Comparison ->"}</button>
          {error && <div style={{ marginTop: "1rem", padding: "0.8rem", color: "var(--crimson)", border: "1px solid var(--crimson)", borderRadius: "var(--radius)", fontSize: "0.78rem" }}>{error}</div>}
        </section>

        <section>
          {!results && !loading && <div style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: "var(--radius)", padding: "3rem 2rem", textAlign: "center", color: "var(--muted)" }}>Run the simulator to compare baseline, discount, and premium pricing strategies.</div>}
          {loading && <div style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: "var(--radius)", padding: "3rem 2rem", textAlign: "center", color: "var(--accent)" }}>Running three AI optimization pipelines...</div>}
          {results && <>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "0.8rem", marginBottom: "1rem" }}>
              <ScenarioCard label="Current strategy" result={results.baseline} tone="var(--accent)" />
              <ScenarioCard label="Discount strategy" result={results.discount} tone="var(--green)" />
              <ScenarioCard label="Premium strategy" result={results.premium} tone="var(--saffron)" />
            </div>
            <div style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: "var(--radius)", padding: "1.2rem", marginBottom: "1rem" }}>
              <div style={{ color: "var(--accent)", fontFamily: "'DM Mono', monospace", fontSize: "0.62rem", letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: "1rem" }}>Financial comparison</div>
              <ResponsiveContainer width="100%" height={250}><BarChart data={chartData} barCategoryGap="25%"><CartesianGrid strokeDasharray="3 3" stroke="rgba(193,154,93,0.08)" /><XAxis dataKey="name" tick={{ fill: "#8A7E72", fontSize: 10 }} axisLine={false} tickLine={false} /><YAxis tick={{ fill: "#8A7E72", fontSize: 10 }} axisLine={false} tickLine={false} /><Tooltip formatter={value => money(value)} /><Bar dataKey="revenue" fill="#8A7E72" name="Revenue" radius={[3, 3, 0, 0]} /><Bar dataKey="profit" fill="#27AE60" name="Profit" radius={[3, 3, 0, 0]} /></BarChart></ResponsiveContainer>
            </div>
            {bestScenario && <div style={{ background: "rgba(39,174,96,0.1)", border: "1px solid var(--green)", borderRadius: "var(--radius)", padding: "1rem 1.2rem", color: "var(--cream)", fontSize: "0.85rem" }}><strong style={{ color: "var(--green)" }}>Recommended strategy: {labelFor(bestScenario[0])}</strong><br />This scenario produces the highest projected profit: {money(bestScenario[1].revenue_optimization.projected_profit_nrs)}. Review inventory status and model confidence before applying the price.</div>}
          </>}
        </section>
      </div>
    </div>
  )
}
