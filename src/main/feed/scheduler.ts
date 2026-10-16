import { app, powerMonitor } from "electron"
import { createLogger } from "../log"
import { loadSchedule } from "./feed"
import type { FeedSchedule } from "../../shared/jobs"
import { BEIJING, EASTERN, isTime, nextRunFor, todaySlotIn, zoneMinutes } from "./schedule-core"

const log = createLogger("feed-scheduler")

export { BEIJING, EASTERN }
export { nextRunFor, todaySlotIn }

export type FeedScheduler = { stop: () => void }

/** One zone's slot from a schedule row. */
function slotsFor(cfg: FeedSchedule) {
  return [
    { zone: BEIJING, time: cfg.beijing?.trim() || "" },
    { zone: EASTERN, time: cfg.eastern?.trim() || "" },
  ]
}

/**
 * Runs the daily snapshot at Beijing 13:00 and US Eastern 13:00, plus a catch-up when the app was asleep
 * past a slot (launch, and every mac sleep-wake). One timer per zone; rescheduling is cheap so a settings
 * change just calls startFeedScheduler again (the old handle's stop() clears the old timers).
 */
export function startFeedScheduler(run: () => Promise<void>, lastFinishedAt: () => string | null): FeedScheduler {
  const timers: ReturnType<typeof setTimeout>[] = []
  const schedule = () => {
    for (const t of timers) clearTimeout(t)
    timers.length = 0
    const cfg = loadSchedule()
    if (!cfg.enabled) return
    for (const { zone, time } of slotsFor(cfg)) {
      const next = nextRunFor(zone, time)
      if (!next) continue
      log.info("next feed run", { zone, time, at: next.toISOString() })
      timers.push(
        setTimeout(async () => {
          await run().catch((error) => log.error("scheduled feed run failed", { error }))
          schedule() // reschedule to the next slot after it ran
        }, Math.max(1000, next.getTime() - Date.now())),
      )
    }
  }
  schedule()

  const catchUp = () => {
    const cfg = loadSchedule()
    if (!cfg.enabled || !cfg.catchUpOnLaunch) return
    const since = lastFinishedAt()
    const now = new Date()
    for (const { zone, time } of slotsFor(cfg)) {
      const slot = todaySlotIn(zone, time, now)
      if (!slot) continue
      // The slot already passed AND we have no newer finished run → the machine was off/sleeping: fetch now.
      if (slot.getTime() < now.getTime() && (!since || Date.parse(since) < slot.getTime())) {
        log.info("feed catch-up: a slot was missed", { zone, slot: slot.toISOString(), zoneMinutes: zoneMinutes(zone, now) })
        void run().catch((error) => log.error("feed catch-up failed", { error }))
        return
      }
    }
  }

  // Launch (after a short settle so the store is ready) and every mac sleep-wake.
  setTimeout(catchUp, 4000)
  powerMonitor.on("resume", catchUp)

  return {
    stop: () => {
      for (const t of timers) clearTimeout(t)
      powerMonitor.removeListener("resume", catchUp)
    },
  }
}
