import { render } from "solid-js/web"
import { App } from "./App"
import "./styles.css"

// Sidebar crashes are invisible to the consultant; make sure they at least reach the log file.
window.addEventListener("error", (e) => void window.neo.log("error", "uncaught error", { message: e.message, source: e.filename, line: e.lineno, stack: e.error?.stack }))
window.addEventListener("unhandledrejection", (e) => void window.neo.log("error", "unhandled rejection", { reason: String(e.reason?.stack || e.reason) }))

render(() => <App />, document.getElementById("root")!)
