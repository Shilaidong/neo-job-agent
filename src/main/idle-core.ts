/**
 * The sleep guard exists because of what the consultant lived through filling a form (2026-10-07):
 * the machine screensaves/locks while the page sits being edited, the session stops, the work breaks.
 * The guard is an idle-timer assertion — it stops the IDLE-driven screensaver/display-off (and the
 * sleep that follows). A deliberate "lock screen now" from the consultant is never prevented.
 *
 * The one rule, kept testable apart from Electron: awake only while a task screen is open, and never
 * during smoke — a self-test has no business touching the machine's power state.
 */
export function sleepGuardOn(view: "home" | "task", smoke: boolean): boolean {
  return view === "task" && !smoke
}
