import { useState, useEffect } from "react"
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts"

const API = "http://localhost:8000"
const COMMODITIES = [
  "rice_coarse","wheat_flour","lentils_broken","oil_mustard",
  "potatoes_red","meat_chicken","milk","eggs","tomatoes","chickpeas"
]

export default function History() {
  const [commodity, setCommodity] = useState("rice_coarse")
  const [data,      setData]      = useState([])
  const [loading,   setLoading]   = useState(false)
  const [error,     setError]     = useState(null)

  const fetchHistory = async (c) => {
    setLoading(true); setError(null)
    try {
      const res = await fetch(`${API}/prices/history/${c}?limit=24`)
      if (!res.ok) throw new Error("API error")
      const json = await res.json()
      setData(json.history?.reverse() || [])
    } catch {
      setError("Cannot connect to API. Make sure backend is running.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchHistory(commodity) }, [commodity])

  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null
    return (
      <div style={{ background: "var(--panel)", border: "1px solid var(--border)",
        borderRadius: 4, padding: "0.6rem 1rem" }}>
        <div style={{ color: "var(--muted)", fontSize: "0.75rem", marginBottom: 4 }}>
          {label}
        </div>
        <div style={{ color: "var(--accent)", fontSize: "0.9rem", fontWeight: 600 }}>
          NRs {payload[0].value?.toFixed(2)}
        </div>
      </div>
    )
  }

  const prices   = data.map(d => d.price_nrs)
  const minPrice = prices.length ? Math.min(...prices).toFixed(2) : "—"
  const maxPrice = prices.length ? Math.max(...prices).toFixed(2) : "—"
  const avgPrice = prices.length ? (prices.reduce((a,b) => a+b, 0) / prices.length).toFixed(2) : "—"
  const lastPrice = prices.length ? prices[prices.length - 1]?.toFixed(2) : "—"
  const trend    = prices.length > 1
    ? ((prices[prices.length-1] - prices[0]) / prices[0] * 100).toFixed(1)
    : 0

  return (
    <div>
      <div style={{ marginBottom: "2rem" }}>
        <div style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.65rem",
          letterSpacing: "0.2em", color: "var(--accent)", marginBottom: "0.4rem",
          textTransform: "uppercase" }}>Historical Data</div>
        <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: "2rem",
          fontWeight: 700 }}>Price <span style={{ color: "var(--crimson)" }}>History</span></h1>
        <p style={{ color: "var(--muted)", marginTop: "0.4rem", fontSize: "0.875rem" }}>
          Historical retail prices from WFP Nepal dataset
          Retail prices are collected from WFP Nepal's market monitoring program, which tracks p
        </p>
      </div>

      {/* Commodity selector */}
      <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginBottom: "2rem" }}>
        {COMMODITIES.map(c => (
          <button key={c} onClick={() => setCommodity(c)} style={{
            padding: "0.4rem 1rem", borderRadius: 999,
            border: "1px solid",
            borderColor: commodity === c ? "var(--accent)" : "var(--border)",
            background: commodity === c ? "rgba(193,154,93,0.12)" : "transparent",
            color: commodity === c ? "var(--accent)" : "var(--muted)",
            fontSize: "0.8rem", cursor: "pointer", fontFamily: "inherit",
            transition: "all 0.15s",
          }}>
            {c.replace(/_/g, " ").replace(/\b\w/g, x => x.toUpperCase())}
          </button>
        ))}
      </div>

      {error && (
        <div style={{ background: "rgba(192,57,43,0.12)", border: "1px solid var(--crimson)",
          borderRadius: "var(--radius)", padding: "1rem 1.5rem", marginBottom: "1.5rem",
          color: "var(--crimson)", fontSize: "0.875rem" }}>⚠ {error}</div>
      )}

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)",
        gap: "1rem", marginBottom: "1.5rem" }}>
        {[
          { label: "Latest Price",   value: `NRs ${lastPrice}`, color: "var(--accent)" },
          { label: "Lowest",         value: `NRs ${minPrice}`,  color: "var(--green)" },
          { label: "Highest",        value: `NRs ${maxPrice}`,  color: "var(--crimson)" },
          { label: "Average",        value: `NRs ${avgPrice}`,  color: "var(--cream)" },
          { label: "Overall Trend",  value: `${trend > 0 ? "▲" : "▼"} ${Math.abs(trend)}%`,
            color: trend > 0 ? "var(--crimson)" : "var(--green)" },
        ].map(({ label, value, color }) => (
          <div key={label} style={{ background: "var(--card)",
            border: "1px solid var(--border)", borderRadius: "var(--radius)",
            padding: "1.2rem 1.5rem" }}>
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.6rem",
              color: "var(--muted)", letterSpacing: "0.15em",
              textTransform: "uppercase", marginBottom: "0.4rem" }}>{label}</div>
            <div style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.4rem",
              fontWeight: 700, color }}>{value}</div>
          </div>
        ))}
      </div>

      {/* Chart */}
      <div style={{ background: "var(--card)", border: "1px solid var(--border)",
        borderRadius: "var(--radius)", padding: "1.5rem" }}>
        <div style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.62rem",
          color: "var(--accent)", letterSpacing: "0.15em", textTransform: "uppercase",
          marginBottom: "1.5rem" }}>
          {commodity.replace(/_/g, " ").replace(/\b\w/g, x => x.toUpperCase())} — Price History (NRs/kg)
        </div>

        {loading ? (
          <div style={{ height: 320, display: "flex", alignItems: "center",
            justifyContent: "center", color: "var(--muted)" }}>
            Loading price history...
          </div>
        ) : data.length === 0 ? (
          <div style={{ height: 320, display: "flex", alignItems: "center",
            justifyContent: "center", color: "var(--muted)" }}>
            No data available for this commodity
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={320}>
            <LineChart data={data} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(193,154,93,0.07)" />
              <XAxis dataKey="date" tick={{ fill: "#8A7E72", fontSize: 10 }}
                axisLine={false} tickLine={false}
                tickFormatter={d => d?.slice(0, 7)} />
              <YAxis tick={{ fill: "#8A7E72", fontSize: 10 }}
                axisLine={false} tickLine={false}
                tickFormatter={v => `NRs ${v}`} />
              <Tooltip content={<CustomTooltip />} />
              <Line type="monotone" dataKey="price_nrs" stroke="var(--accent)"
                strokeWidth={2} dot={{ fill: "var(--accent)", r: 3 }}
                activeDot={{ r: 5, fill: "var(--crimson)" }} name="Price" />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Data table */}
      {data.length > 0 && (
        <div style={{ background: "var(--card)", border: "1px solid var(--border)",
          borderRadius: "var(--radius)", overflow: "hidden", marginTop: "1.5rem" }}>
          <div style={{ padding: "1rem 1.5rem", borderBottom: "1px solid var(--border)",
            fontFamily: "'DM Mono', monospace", fontSize: "0.62rem",
            color: "var(--accent)", letterSpacing: "0.15em", textTransform: "uppercase" }}>
            Raw Data — Last {data.length} Records
          </div>
          <div style={{ maxHeight: 280, overflowY: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid var(--border)" }}>
                  {["Date", "Price (NRs/kg)", "vs Previous", "vs Average"].map(h => (
                    <th key={h} style={{ padding: "0.6rem 1.5rem", textAlign: "left",
                      fontFamily: "'DM Mono', monospace", fontSize: "0.6rem",
                      color: "var(--muted)", letterSpacing: "0.12em",
                      textTransform: "uppercase", fontWeight: 500, position: "sticky",
                      top: 0, background: "var(--card)" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.map((row, i) => {
                  const prev   = i > 0 ? data[i-1].price_nrs : null
                  const diff   = prev ? ((row.price_nrs - prev) / prev * 100).toFixed(1) : null
                  const vsAvg  = avgPrice ? ((row.price_nrs - parseFloat(avgPrice)) / parseFloat(avgPrice) * 100).toFixed(1) : null
                  return (
                    <tr key={i} style={{ borderBottom: "1px solid rgba(193,154,93,0.05)" }}>
                      <td style={{ padding: "0.65rem 1.5rem", fontFamily: "'DM Mono', monospace",
                        fontSize: "0.8rem", color: "var(--muted)" }}>{row.date?.slice(0,10)}</td>
                      <td style={{ padding: "0.65rem 1.5rem", fontFamily: "'DM Mono', monospace",
                        fontSize: "0.85rem", color: "var(--cream)", fontWeight: 600 }}>
                        {row.price_nrs?.toFixed(2)}
                      </td>
                      <td style={{ padding: "0.65rem 1.5rem", fontFamily: "'DM Mono', monospace",
                        fontSize: "0.8rem",
                        color: diff === null ? "var(--muted)" : diff > 0 ? "var(--crimson)" : "var(--green)" }}>
                        {diff === null ? "—" : `${diff > 0 ? "▲" : "▼"} ${Math.abs(diff)}%`}
                      </td>
                      <td style={{ padding: "0.65rem 1.5rem", fontFamily: "'DM Mono', monospace",
                        fontSize: "0.8rem",
                        color: vsAvg === null ? "var(--muted)" : vsAvg > 0 ? "var(--saffron)" : "var(--green)" }}>
                        {vsAvg === null ? "—" : `${vsAvg > 0 ? "+" : ""}${vsAvg}%`}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}