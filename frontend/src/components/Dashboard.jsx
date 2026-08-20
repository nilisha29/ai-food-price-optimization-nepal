import { useEffect, useState } from "react"
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts"
import { API_BASE_URL } from "../config/api"

// Representative recent prices used to request the dashboard portfolio snapshot.
const COMMODITY_DATA = [
  { key: "apples",         label: "Apples",          p1: 180, p3: 172, p6: 165, p12: 155 },
  { key: "bananas",        label: "Bananas",         p1: 120, p3: 115, p6: 108, p12: 100 },
  { key: "beans_black",    label: "Beans (black)",   p1: 190, p3: 185, p6: 178, p12: 165 },
  { key: "cabbage",        label: "Cabbage",         p1: 65,  p3: 60,  p6: 55,  p12: 50  },
  { key: "carrots",        label: "Carrots",         p1: 110, p3: 105, p6: 98,  p12: 90  },
  { key: "chickpeas",      label: "Chickpeas",       p1: 180, p3: 175, p6: 168, p12: 160 },
  { key: "eggs",           label: "Eggs",            p1: 30,  p3: 28,  p6: 26,  p12: 25  },
  { key: "fish",           label: "Fish",            p1: 480, p3: 465, p6: 450, p12: 430 },
  { key: "lentils_broken", label: "Lentils Broken",  p1: 220, p3: 210, p6: 200, p12: 190 },
  { key: "meat_chicken",   label: "Meat Chicken",    p1: 700, p3: 670, p6: 640, p12: 600 },
  { key: "milk",           label: "Milk",            p1: 100, p3: 98,  p6: 95,  p12: 92  },
  { key: "oil_mustard",    label: "Oil Mustard",     p1: 430, p3: 410, p6: 390, p12: 370 },
  { key: "oil_soybean",    label: "Oil Soybean",     p1: 300, p3: 290, p6: 280, p12: 265 },
  { key: "oranges",        label: "Oranges",         p1: 145, p3: 138, p6: 130, p12: 120 },
  { key: "peanut",         label: "Peanut",          p1: 210, p3: 202, p6: 195, p12: 185 },
  { key: "potatoes_red",   label: "Potatoes Red",    p1: 70,  p3: 65,  p6: 60,  p12: 55  },
  { key: "pumpkin",        label: "Pumpkin",         p1: 85,  p3: 80,  p6: 75,  p12: 68  },
  { key: "rice_coarse",    label: "Rice Coarse",    p1: 100, p3: 95,  p6: 90,  p12: 85  },
  { key: "rice_medium",    label: "Rice Medium",    p1: 115, p3: 110, p6: 104, p12: 98  },
  { key: "tomatoes",       label: "Tomatoes",       p1: 95,  p3: 88,  p6: 80,  p12: 72  },
  { key: "wheat_flour",    label: "Wheat Flour",    p1: 100, p3: 95,  p6: 92,  p12: 88  },
]

// Today's date dynamically
const getTodayDate = () => new Date().toISOString().split("T")[0]

// Current season label based on actual current month
const getCurrentSeason = () => {
  const m = new Date().getMonth() + 1
  if (m === 9 || m === 10) return "Dashain Season"
  if (m === 11)             return "Tihar Season"
  if (m === 8)              return "Teej Season"
  if (m === 4)              return "New Year (Baisakh)"
  if ([6,7,8].includes(m)) return "Monsoon Season"
  if ([12,1,2].includes(m)) return "Winter Season"
  return "Normal Season"
}

const StatCard = ({ label, value, sub, color = "var(--accent)" }) => (
  <div style={{ background: "var(--card)", border: "1px solid var(--border)",
    borderRadius: "var(--radius)", padding: "1.5rem" }}>
    <div style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.62rem",
      letterSpacing: "0.18em", color: "var(--muted)", textTransform: "uppercase",
      marginBottom: "0.5rem" }}>{label}</div>
    <div style={{ fontFamily: "'Playfair Display', serif", fontSize: "2rem",
      fontWeight: 700, color, lineHeight: 1 }}>{value}</div>
    {sub && <div style={{ fontSize: "0.75rem", color: "var(--muted)", marginTop: "0.4rem" }}>{sub}</div>}
  </div>
)

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background: "var(--panel)", border: "1px solid var(--border)",
      borderRadius: 4, padding: "0.6rem 1rem" }}>
      <div style={{ color: "var(--muted)", fontSize: "0.75rem", marginBottom: 4 }}>{label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ color: p.color, fontSize: "0.85rem" }}>
          {p.name}: NRs {p.value?.toFixed(2)}
        </div>
      ))}
    </div>
  )
}

export default function Dashboard() {
  const [predictions, setPredictions] = useState([])
  const [loading, setLoading]         = useState(true)
  const [error, setError]             = useState(null)

  const todayDate    = getTodayDate()
  const seasonLabel  = getCurrentSeason()
  

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true)
      try {
        const results = await Promise.all(
          COMMODITY_DATA.map(c =>
            fetch(`${API_BASE_URL}/predict`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                commodity:       c.key,
                market:          "kathmandu",
                province:        "bagmati",
                price_last_1m:   c.p1,
                price_last_3m:   c.p3,
                price_last_6m:   c.p6,
                price_last_12m:  c.p12,
                prediction_date: todayDate,   // ← today's real date
                food_cpi:        125,
                nrb_food_cpi_change: 5.2,
              }),
            }).then(r => r.json()).catch(() => null)
          )
        )
        setPredictions(results.filter(Boolean))
      } catch {
        setError("Cannot connect to API. Make sure the backend is running on port 8000.")
      } finally {
        setLoading(false)
      }
    }
    fetchAll()
  }, [todayDate])

  const rising        = predictions.filter(p => p.price_change_pct > 0).length
  const falling       = predictions.filter(p => p.price_change_pct < 0).length

  const chartData = predictions.map((p, i) => ({
    name:      COMMODITY_DATA[i]?.label || p.commodity,
    current:   p.price_last_1m,
    predicted: p.predicted_price,
    change:    p.price_change_pct,
  }))

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: "2rem" }}>
        <div style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.65rem",
          letterSpacing: "0.2em", color: "var(--accent)", marginBottom: "0.4rem",
          textTransform: "uppercase" }}>Live Dashboard</div>
        <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: "2rem", fontWeight: 700 }}>
          Nepal Retail Pricing <span style={{ color: "var(--crimson)" }}>Intelligence</span>
        </h1>
        <p style={{ color: "var(--muted)", marginTop: "0.4rem", fontSize: "0.875rem" }}>
          AI-driven food commodity price predictions for Nepal retail markets —{" "}
          <span style={{ color: "var(--accent)" }}>{seasonLabel}</span>
          {" "}· Predicting for {todayDate}
        </p>
      </div>

      {error && (
        <div style={{ background: "rgba(192,57,43,0.12)", border: "1px solid var(--crimson)",
          borderRadius: "var(--radius)", padding: "1rem 1.5rem", marginBottom: "1.5rem",
          color: "var(--crimson)", fontSize: "0.875rem" }}>⚠ {error}</div>
      )}

      {/* Stats row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "1rem", marginBottom: "2rem" }}>
        <StatCard label="Model Accuracy"  value="93.4%"                         sub="XGBoost on 83K rows"     color="var(--green)"   />
        <StatCard label="Prices Rising"   value={loading ? "—" : rising}        sub="commodities this period"  color="var(--crimson)" />
        <StatCard label="Prices Falling"  value={loading ? "—" : falling}       sub="commodities this period"  color="var(--saffron)" />
        <StatCard label="Current Season"  value={seasonLabel.split(" ")[0]}     sub={seasonLabel}              color="var(--gold)"    />
      </div>

      {/* Charts row */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem", marginBottom: "2rem" }}>
        {/* Current vs Predicted */}
        <div style={{ background: "var(--card)", border: "1px solid var(--border)",
          borderRadius: "var(--radius)", padding: "1.5rem" }}>
          <div style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.62rem",
            color: "var(--accent)", letterSpacing: "0.15em", marginBottom: "1rem",
            textTransform: "uppercase" }}>Current vs Predicted Price (NRs/kg)</div>
          {loading ? (
            <div style={{ height: 220, display: "flex", alignItems: "center",
              justifyContent: "center", color: "var(--muted)" }}>Loading predictions...</div>
          ) : (
            <ResponsiveContainer width="100%" height={270}>
              <BarChart data={chartData} barCategoryGap="30%">
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(193,154,93,0.08)" />
                <XAxis dataKey="name" interval={0} angle={-45} textAnchor="end" height={75}
                  tick={{ fill: "#8A7E72", fontSize: 8 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "#8A7E72", fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="current"   fill="#8A7E72" name="Current"   radius={[3,3,0,0]} />
                <Bar dataKey="predicted" fill="#C0392B" name="Predicted" radius={[3,3,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Price change % */}
        <div style={{ background: "var(--card)", border: "1px solid var(--border)",
          borderRadius: "var(--radius)", padding: "1.5rem" }}>
          <div style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.62rem",
            color: "var(--accent)", letterSpacing: "0.15em", marginBottom: "1rem",
            textTransform: "uppercase" }}>Predicted Price Change (%)</div>
          {loading ? (
            <div style={{ height: 220, display: "flex", alignItems: "center",
              justifyContent: "center", color: "var(--muted)" }}>Loading...</div>
          ) : (
            <ResponsiveContainer width="100%" height={270}>
              <BarChart data={chartData} barCategoryGap="30%">
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(193,154,93,0.08)" />
                <XAxis dataKey="name" interval={0} angle={-45} textAnchor="end" height={75}
                  tick={{ fill: "#8A7E72", fontSize: 8 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "#8A7E72", fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip content={({ active, payload, label }) => active && payload?.length ? (
                  <div style={{ background: "var(--panel)", border: "1px solid var(--border)",
                    borderRadius: 4, padding: "0.6rem 1rem" }}>
                    <div style={{ color: "var(--muted)", fontSize: "0.75rem" }}>{label}</div>
                    <div style={{ color: payload[0].value >= 0 ? "#C0392B" : "#27AE60",
                      fontSize: "0.85rem" }}>{payload[0].value?.toFixed(2)}%</div>
                  </div>
                ) : null} />
                <Bar dataKey="change" name="Change %" radius={[3,3,0,0]} fill="#E67E22"
                  label={{ position: "top", fill: "#8A7E72", fontSize: 9,
                    formatter: v => `${v?.toFixed(1)}%` }} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Predictions table */}
      <div style={{ background: "var(--card)", border: "1px solid var(--border)",
        borderRadius: "var(--radius)", overflow: "hidden" }}>
        <div style={{ padding: "1.2rem 1.5rem", borderBottom: "1px solid var(--border)",
          fontFamily: "'DM Mono', monospace", fontSize: "0.62rem", color: "var(--accent)",
          letterSpacing: "0.15em", textTransform: "uppercase" }}>
          All Commodity Predictions — Kathmandu · {todayDate}
        </div>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid var(--border)" }}>
              {["Commodity","Current Price","Predicted","Change","Season","Recommendation","Confidence"].map(h => (
                <th key={h} style={{ padding: "0.75rem 1rem", textAlign: "left",
                  fontFamily: "'DM Mono', monospace", fontSize: "0.6rem",
                  color: "var(--muted)", letterSpacing: "0.12em",
                  textTransform: "uppercase", fontWeight: 500 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} style={{ padding: "2rem", textAlign: "center",
                color: "var(--muted)" }}>Loading predictions from AI model...</td></tr>
            ) : predictions.map((p, i) => (
              <tr key={i} style={{ borderBottom: "1px solid rgba(193,154,93,0.06)" }}
                onMouseEnter={e => e.currentTarget.style.background = "rgba(193,154,93,0.04)"}
                onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                <td style={{ padding: "0.9rem 1rem", fontWeight: 500, color: "var(--cream)" }}>
                  {COMMODITY_DATA[i]?.label || p.commodity}
                </td>
                <td style={{ padding: "0.9rem 1rem", fontFamily: "'DM Mono', monospace",
                  fontSize: "0.85rem" }}>NRs {p.price_last_1m}</td>
                <td style={{ padding: "0.9rem 1rem", fontFamily: "'DM Mono', monospace",
                  fontSize: "0.85rem", color: "var(--accent)", fontWeight: 600 }}>
                  NRs {p.predicted_price?.toFixed(2)}
                </td>
                <td style={{ padding: "0.9rem 1rem", fontFamily: "'DM Mono', monospace",
                  fontSize: "0.85rem",
                  color: p.price_change_pct > 0 ? "var(--crimson)" : "var(--green)" }}>
                  {p.price_change_pct > 0 ? "▲" : "▼"} {Math.abs(p.price_change_pct)?.toFixed(1)}%
                </td>
                <td style={{ padding: "0.9rem 1rem", fontSize: "0.8rem",
                  color: p.festival_season !== "Normal Season" ? "var(--gold)" : "var(--muted)" }}>
                  {p.festival_season}
                </td>
                <td style={{ padding: "0.9rem 1rem", fontSize: "0.78rem",
                  color: "var(--muted)", maxWidth: 220 }}>
                  {p.recommendation?.slice(0, 50)}...
                </td>
                <td style={{ padding: "0.9rem 1rem" }}>
                  <span style={{ background: p.confidence === "High"
                    ? "rgba(39,174,96,0.15)" : "rgba(230,126,34,0.15)",
                    color: p.confidence === "High" ? "var(--green)" : "var(--saffron)",
                    padding: "0.2rem 0.6rem", borderRadius: 3,
                    fontFamily: "'DM Mono', monospace", fontSize: "0.65rem" }}>
                    {p.confidence}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
