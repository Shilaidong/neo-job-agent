/** Pure scheduling math — no Electron, fully unit-testable. */

export const BEIJING = "Asia/Shanghai"
export const EASTERN = "America/New_York"

/** The wall-clock minutes since midnight in `zone` for the instant `at` (DST-correct via Intl). */
export function zoneMinutes(zone: string, at: Date): number {
  const parts = new Intl.DateTimeFormat("en-GB", { timeZone: zone, hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).formatToParts(at)
  const hour = Number(parts.find((p) => p.type === "hour")?.value ?? 0)
  const minute = Number(parts.find((p) => p.type === "minute")?.value ?? 0)
  return hour * 60 + minute
}

/** The "y-m-d" calendar day in `zone` for `at` — the key todaySlotIn locks onto. */
export function zoneDayKey(zone: string, at: Date): string {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: zone, year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(at)
  const year = parts.find((p) => p.type === "year")?.value ?? ""
  const month = parts.find((p) => p.type === "month")?.value ?? ""
  const day = parts.find((p) => p.type === "day")?.value ?? ""
  return `${year}-${month}-${day}`
}

export function isTime(hhmm: string): boolean {
  const m = /^(\d{1,2}):(\d{2})$/.exec(hhmm.trim())
  if (!m) return false
  const hh = Number(m[1])
  const mm = Number(m[2])
  return hh >= 0 && hh <= 23 && mm >= 0 && mm <= 59
}

function minutesUntil(zone: string, time: string, at: Date): number {
  const [hh = 0, mm = 0] = time.split(":").map(Number)
  const target = hh * 60 + mm
  const now = zoneMinutes(zone, at)
  const delta = (target - now + 1440) % 1440
  return delta === 0 ? 1440 : delta // 0 = right now → next day
}

/** Epoch of the next trigger (now + deltas), for one zone's slot. */
export function nextRunFor(zone: string, time: string, now: Date = new Date()): Date | null {
  if (!isTime(time)) return null
  return new Date(now.getTime() + minutesUntil(zone, time, now) * 60_000)
}

/**
 * The instant of the slot on the SAME calendar day (in that zone) as `now` — whether already elapsed
 * (in the past) or still to come (in the future). The catch-up keys on it: slot < now && no newer run.
 * Probes the ±28h window by minute so DST days and non-integer offsets still land.
 */
export function todaySlotIn(zone: string, time: string, now: Date = new Date()): Date | null {
  if (!isTime(time)) return null
  const [hh = 0, mm = 0] = time.split(":").map(Number)
  const targetMinutes = hh * 60 + mm
  const day = zoneDayKey(zone, now)
  for (let k = -1700; k <= 1700; k++) {
    const cand = new Date(now.getTime() + k * 60_000)
    if (zoneDayKey(zone, cand) === day && zoneMinutes(zone, cand) === targetMinutes) return cand
  }
  return null
}
