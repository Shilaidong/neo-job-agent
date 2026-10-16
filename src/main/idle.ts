/**
 * The Electron side of the sleep guard (see idle-core for the rule). `prevent-display-sleep` is the
 * right assertion on macOS: holding the display awake also holds off the screensaver and the lock that
 * follows from an idle timeout, which is exactly what broke the form mid-fill.
 *
 * Called from publish(), so every view change lands here; start/stop are idempotent. The assertion dies
 * with the process, and before-quit releases it early for good measure.
 */
import { powerSaveBlocker } from "electron"
import { sleepGuardOn } from "./idle-core"

const SMOKE = process.argv.includes("--smoke")
let id: number | null = null

export function syncSleepGuard(view: "home" | "task"): void {
  const want = sleepGuardOn(view, SMOKE)
  if (want && id === null) id = powerSaveBlocker.start("prevent-display-sleep")
  else if (!want && id !== null) {
    powerSaveBlocker.stop(id)
    id = null
  }
}

export function releaseSleepGuard(): void {
  if (id !== null) {
    powerSaveBlocker.stop(id)
    id = null
  }
}
