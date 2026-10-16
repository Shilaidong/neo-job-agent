import { describe, expect, test } from "bun:test"
import { waitForHealth } from "./ready"

describe("waitForHealth", () => {
  test("a server that answers right away is healthy", async () => {
    const out = await waitForHealth(() => Promise.resolve({ version: "1.18.31" }), { deadlineMs: 5_000 })
    expect(out?.version).toBe("1.18.31")
  })

  test("a server that answers after a few stalls is healthy too, as long as it is within the deadline", async () => {
    let probes = 0
    const out = await waitForHealth(
      () => {
        probes++
        return probes >= 3 ? Promise.resolve({ ok: true }) : Promise.resolve(undefined)
      },
      { deadlineMs: 5_000 },
    )
    expect(out).toEqual({ ok: true })
    expect(probes).toBe(3)
  })

  test("a server that never answers times out with undefined, without hanging past the deadline", async () => {
    const start = Date.now()
    const out = await waitForHealth(() => Promise.resolve(undefined), { deadlineMs: 150, betweenMs: 25 })
    expect(out).toBeUndefined()
    expect(Date.now() - start).toBeLessThan(3_000)
  })

  test("a server that has already exited is reported as not ready, not probed", async () => {
    let probes = 0
    const out = await waitForHealth(
      () => {
        probes++
        return Promise.resolve(undefined)
      },
      { deadlineMs: 5_000, exited: () => "opencode 退出（code=1 signal=null）" },
    )
    expect(out).toBeUndefined()
    expect(probes).toBe(0)
  })
})
