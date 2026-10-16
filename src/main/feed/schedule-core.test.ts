import { describe, expect, test } from "bun:test"
import { BEIJING, EASTERN, nextRunFor, todaySlotIn, zoneMinutes } from "./schedule-core"

// A fixed instant: 2026-10-17 05:00 UTC = 13:00 Beijing = 01:00 Eastern (EDT, -4).
const NOON_UTC = new Date("2026-10-17T05:00:00Z")

describe("schedule core", () => {
  test("zones report the expected wall-clock minutes (Beijing is not Eastern)", () => {
    expect(zoneMinutes(BEIJING, NOON_UTC)).toBe(13 * 60)
    expect(zoneMinutes(EASTERN, NOON_UTC)).toBe(1 * 60)
  })

  test("the next Beijing 13:00 from 13:00 Beijing is tomorrow, not now", () => {
    const next = nextRunFor(BEIJING, "13:00", NOON_UTC)!
    expect(zoneMinutes(BEIJING, next)).toBe(13 * 60)
    expect(next.getTime()).toBeGreaterThan(NOON_UTC.getTime() + 20 * 60 * 60 * 1000)
  })

  test("the next Eastern 13:00 from 01:00 Eastern is 12 hours away", () => {
    const next = nextRunFor(EASTERN, "13:00", NOON_UTC)!
    expect(next.getTime() - NOON_UTC.getTime()).toBeCloseTo(12 * 60 * 60 * 1000, -4)
  })

  test("a malformed time never schedules", () => {
    expect(nextRunFor(BEIJING, "13:00", NOON_UTC)).not.toBeNull()
    expect(nextRunFor(BEIJING, "o'clock", NOON_UTC)).toBeNull()
    expect(nextRunFor(BEIJING, "25:00", NOON_UTC)).toBeNull()
  })

  test("todaySlotIn walks back to the most recent 13:00 in the zone", () => {
    const slot = todaySlotIn(BEIJING, "13:00", NOON_UTC)!
    // 05:00 UTC is exactly 13:00 Beijing → the slot is now.
    expect(zoneMinutes(BEIJING, slot)).toBe(13 * 60)
    expect(slot.getTime()).toBeLessThanOrEqual(NOON_UTC.getTime())
    // Stepping 1 minute later, the most recent Beijing 13:00 is brought forward to its own 13:00.
    const later = new Date(NOON_UTC.getTime() + 60_000)
    const slot2 = todaySlotIn(BEIJING, "13:00", later)!
    expect(slot2.getTime()).toBeLessThan(later.getTime())
    expect(zoneMinutes(BEIJING, slot2)).toBe(13 * 60)
  })

  test("an Eastern-morning local time correctly recognises the Eastern slot has not come", () => {
    const now = new Date("2026-10-17T14:00:00Z") // 10:00 EDT → 13:00 EDT is at 17:00Z (in the future)
    const slot = todaySlotIn(EASTERN, "13:00", now)!
    expect(slot.getTime()).toBeGreaterThan(now.getTime())
  })
})
