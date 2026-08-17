// import { useState } from 'react'
// import reactLogo from './assets/react.svg'
// import viteLogo from './assets/vite.svg'
// import heroImg from './assets/hero.png'
// import './App.css'

// function App() {
//   const [count, setCount] = useState(0)

//   return (
//     <>
//       <section id="center">
//         <div className="hero">
//           <img src={heroImg} className="base" width="170" height="179" alt="" />
//           <img src={reactLogo} className="framework" alt="React logo" />
//           <img src={viteLogo} className="vite" alt="Vite logo" />
//         </div>
//         <div>
//           <h1>Get started</h1>
//           <p>
//             Edit <code>src/App.jsx</code> and save to test <code>HMR</code>
//           </p>
//         </div>
//         <button
//           type="button"
//           className="counter"
//           onClick={() => setCount((count) => count + 1)}
//         >
//           Count is {count}
//         </button>
//       </section>

//       <div className="ticks"></div>

//       <section id="next-steps">
//         <div id="docs">
//           <svg className="icon" role="presentation" aria-hidden="true">
//             <use href="/icons.svg#documentation-icon"></use>
//           </svg>
//           <h2>Documentation</h2>
//           <p>Your questions, answered</p>
//           <ul>
//             <li>
//               <a href="https://vite.dev/" target="_blank">
//                 <img className="logo" src={viteLogo} alt="" />
//                 Explore Vite
//               </a>
//             </li>
//             <li>
//               <a href="https://react.dev/" target="_blank">
//                 <img className="button-icon" src={reactLogo} alt="" />
//                 Learn more
//               </a>
//             </li>
//           </ul>
//         </div>
//         <div id="social">
//           <svg className="icon" role="presentation" aria-hidden="true">
//             <use href="/icons.svg#social-icon"></use>
//           </svg>
//           <h2>Connect with us</h2>
//           <p>Join the Vite community</p>
//           <ul>
//             <li>
//               <a href="https://github.com/vitejs/vite" target="_blank">
//                 <svg
//                   className="button-icon"
//                   role="presentation"
//                   aria-hidden="true"
//                 >
//                   <use href="/icons.svg#github-icon"></use>
//                 </svg>
//                 GitHub
//               </a>
//             </li>
//             <li>
//               <a href="https://chat.vite.dev/" target="_blank">
//                 <svg
//                   className="button-icon"
//                   role="presentation"
//                   aria-hidden="true"
//                 >
//                   <use href="/icons.svg#discord-icon"></use>
//                 </svg>
//                 Discord
//               </a>
//             </li>
//             <li>
//               <a href="https://x.com/vite_js" target="_blank">
//                 <svg
//                   className="button-icon"
//                   role="presentation"
//                   aria-hidden="true"
//                 >
//                   <use href="/icons.svg#x-icon"></use>
//                 </svg>
//                 X.com
//               </a>
//             </li>
//             <li>
//               <a href="https://bsky.app/profile/vite.dev" target="_blank">
//                 <svg
//                   className="button-icon"
//                   role="presentation"
//                   aria-hidden="true"
//                 >
//                   <use href="/icons.svg#bluesky-icon"></use>
//                 </svg>
//                 Bluesky
//               </a>
//             </li>
//           </ul>
//         </div>
//       </section>

//       <div className="ticks"></div>
//       <section id="spacer"></section>
//     </>
//   )
// }

// export default App



// import { useState } from "react"
// import Dashboard from "./components/Dashboard"
// import Predict from "./components/Predict"
// import History from "./components/History"
// import ModelInfo from "./components/ModelInfo"

// const NAV = [
//   { id: "dashboard", label: "Dashboard" },
//   { id: "predict",   label: "Price Predictor" },
//   { id: "history",   label: "Price History" },
//   { id: "model",     label: "Model Info" },
// ]

// export default function App() {
//   const [page, setPage] = useState("dashboard")

//   return (
//     <div style={{ display: "flex", minHeight: "100vh" }}>
//       {/* Sidebar */}
//       <aside style={{
//         width: 220, background: "var(--panel)", borderRight: "1px solid var(--border)",
//         display: "flex", flexDirection: "column", padding: "2rem 0", position: "fixed",
//         top: 0, left: 0, height: "100vh", zIndex: 10,
//       }}>
//         <div style={{ padding: "0 1.5rem 2rem" }}>
//           <div style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.6rem",
//             letterSpacing: "0.2em", color: "var(--accent)", marginBottom: "0.4rem",
//             textTransform: "uppercase" }}>Nepal Retail AI</div>
//           <div style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.15rem",
//             fontWeight: 700, lineHeight: 1.2 }}>Dynamic<br/>Pricing<br/>System</div>
//         </div>
//         <div style={{ borderTop: "1px solid var(--border)", paddingTop: "1rem" }}>
//           {NAV.map(n => (
//             <button key={n.id} onClick={() => setPage(n.id)} style={{
//               display: "block", width: "100%", textAlign: "left",
//               padding: "0.75rem 1.5rem", background: page === n.id
//                 ? "rgba(193,154,93,0.1)" : "transparent",
//               border: "none", borderLeft: page === n.id
//                 ? "2px solid var(--accent)" : "2px solid transparent",
//               color: page === n.id ? "var(--cream)" : "var(--muted)",
//               cursor: "pointer", fontSize: "0.875rem", fontFamily: "inherit",
//               transition: "all 0.15s",
//             }}>{n.label}</button>
//           ))}
//         </div>
//         <div style={{ marginTop: "auto", padding: "1.5rem",
//           borderTop: "1px solid var(--border)" }}>
//           <div style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.6rem",
//             color: "var(--muted)", letterSpacing: "0.1em" }}>MODEL ACCURACY</div>
//           <div style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.6rem",
//             fontWeight: 700, color: "var(--green)" }}>93.4%</div>
//           <div style={{ fontSize: "0.7rem", color: "var(--muted)", marginTop: "0.2rem" }}>
//             XGBoost · 83,473 rows
//           </div>
//         </div>
//       </aside>

//       {/* Main */}
//       <main style={{ marginLeft: 220, flex: 1, padding: "2rem", minHeight: "100vh" }}>
//         {page === "dashboard" && <Dashboard />}
//         {page === "predict"   && <Predict />}
//         {page === "history"   && <History />}
//         {page === "model"     && <ModelInfo />}
//       </main>
//     </div>
//   )
// }



import { useState } from "react"
import Dashboard from "./components/Dashboard"
import Predict from "./components/Predict"
import History from "./components/History"
// import ModelInfo from "./components/ModelInfo"
import SalesOptimization from "./components/SalesOptimization"

const NAV = [
  { id: "dashboard", label: "Dashboard" },
  { id: "predict",   label: "Price Predictor" },
  { id: "sales",     label: "Sales Optimization" },
  { id: "history",   label: "Price History" },
  // { id: "model",     label: "Model Info" },
]

export default function App() {
  const [page, setPage] = useState("dashboard")

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      {/* Sidebar */}
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
            fontWeight: 700, lineHeight: 1.2 }}>Dynamic<br/>Pricing<br/>System</div>
        </div>
        <div style={{ borderTop: "1px solid var(--border)", paddingTop: "1rem" }}>
          {NAV.map(n => (
            <button key={n.id} onClick={() => setPage(n.id)} style={{
              display: "block", width: "100%", textAlign: "left",
              padding: "0.75rem 1.5rem", background: page === n.id
                ? "rgba(193,154,93,0.1)" : "transparent",
              border: "none", borderLeft: page === n.id
                ? "2px solid var(--accent)" : "2px solid transparent",
              color: page === n.id ? "var(--cream)" : "var(--muted)",
              cursor: "pointer", fontSize: "0.875rem", fontFamily: "inherit",
              transition: "all 0.15s",
            }}>{n.label}</button>
          ))}
        </div>
        {/* <div style={{ marginTop: "auto", padding: "1.5rem",
          borderTop: "1px solid var(--border)" }}>
          <div style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.6rem",
            color: "var(--muted)", letterSpacing: "0.1em" }}>MODEL ACCURACY</div>
          <div style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.6rem",
            fontWeight: 700, color: "var(--green)" }}>93.4%</div>
          <div style={{ fontSize: "0.7rem", color: "var(--muted)", marginTop: "0.2rem" }}>
            XGBoost · 83,473 rows
          </div>
        </div> */}
      </aside>

      {/* Main */}
      <main style={{ marginLeft: 220, flex: 1, padding: "2rem", minHeight: "100vh" }}>
        {page === "dashboard" && <Dashboard />}
        {page === "predict"   && <Predict />}
        {page === "sales"     && <SalesOptimization />}
        {page === "history"   && <History />}
        {/* {page === "model"     && <ModelInfo />} */}
      </main>
    </div>
  )
}