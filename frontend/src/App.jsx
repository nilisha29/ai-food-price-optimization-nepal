import { useState } from "react"
import Dashboard from "./components/Dashboard"
import Predict from "./components/Predict"
import History from "./components/History"
import SalesOptimization from "./components/SalesOptimization"
import ScenarioSimulator from "./components/ScenarioSimulator"
import ModelEvaluation from "./components/ModelEvaluation"

const NAV_ITEMS = [
  { id: "dashboard", label: "Dashboard", component: Dashboard },
  { id: "predict", label: "Price Predictor", component: Predict },
  { id: "sales", label: "Sales Optimization", component: SalesOptimization },
  { id: "scenarios", label: "What-If Simulator", component: ScenarioSimulator },
  { id: "evaluation", label: "Model Evaluation", component: ModelEvaluation },
  { id: "history", label: "Price History", component: History },
]

export default function App() {
  const [page, setPage] = useState("dashboard")
  const activePage = NAV_ITEMS.find(item => item.id === page) || NAV_ITEMS[0]
  const ActiveComponent = activePage.component

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      <aside style={{
        width: 220, background: "var(--panel)", borderRight: "1px solid var(--border)",
        display: "flex", flexDirection: "column", padding: "2rem 0", position: "fixed",
        top: 0, left: 0, height: "100vh", zIndex: 10,
      }}>
        <div style={{ padding: "0 1.5rem 2rem" }}>
          <div style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.6rem",
            letterSpacing: "0.2em", color: "var(--accent)", marginBottom: "0.4rem",
            textTransform: "uppercase" }}>Nepal Retail AI</div>
          <div style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.15rem",
            fontWeight: 700, lineHeight: 1.2 }}>Dynamic<br />Pricing<br />System</div>
        </div>
        <nav aria-label="Main navigation" style={{ borderTop: "1px solid var(--border)", paddingTop: "1rem" }}>
          {NAV_ITEMS.map(item => (
            <button key={item.id} onClick={() => setPage(item.id)} style={{
              display: "block", width: "100%", textAlign: "left",
              padding: "0.75rem 1.5rem", background: page === item.id
                ? "rgba(193,154,93,0.1)" : "transparent",
              border: "none", borderLeft: page === item.id
                ? "2px solid var(--accent)" : "2px solid transparent",
              color: page === item.id ? "var(--cream)" : "var(--muted)",
              cursor: "pointer", fontSize: "0.875rem", fontFamily: "inherit",
              transition: "all 0.15s",
            }}>{item.label}</button>
          ))}
        </nav>
      </aside>

      <main style={{ marginLeft: 220, flex: 1, padding: "2rem", minHeight: "100vh" }}>
        <ActiveComponent />
      </main>
    </div>
  )
}