import { describe, expect, it } from "bun:test"
import { isOnboardingRefusal, parseEgoCliOutput, wrapEgoScript } from "./ego-cli"

describe("ego-cli marker protocol", () => {
  it("reads the value off the marker line", () => {
    const r = parseEgoCliOutput(`some chatter\nNEO_RESULT:{"id":3,"ownership":"agent"}\n`, "")
    expect(r.ok).toBe(true)
    if (r.ok) expect(r.value).toEqual({ id: 3, ownership: "agent" })
  })

  it("the marker on STDERR counts too (cliLog really writes there — real binary, 2026-10-06)", () => {
    const r = parseEgoCliOutput("cli chatter on stdout\n", 'NEO_RESULT:{"done":true}\n')
    expect(r.ok).toBe(true)
    if (r.ok) expect(r.value).toEqual({ done: true })
  })

  it("handOff's real round: marker first, hard-stop chatter after — still reads as success", () => {
    const r = parseEgoCliOutput(`NEO_RESULT:{"done":true}\nThe user has taken control of this task space, so browser commands are paused.\n`, "")
    expect(r.ok).toBe(true) // handOff kills the round AFTER our marker — that IS the success shape
  })

  it("with two markers the lower one wins", () => {
    const r = parseEgoCliOutput(`NEO_RESULT:{"first":true}\nNEO_RESULT:{"second":true}\n`, "")
    expect(r.ok).toBe(true)
    if (r.ok) expect(r.value).toEqual({ second: true })
  })

  it("no marker is an error carrying the raw text — the wizard refusal is typed", () => {
    const refused = parseEgoCliOutput("", "Please complete the onboarding process first. A setup window has opened; follow the on-screen instructions to continue.")
    expect(refused.ok).toBe(false)
    if (!refused.ok) {
      expect(refused.needsOnboarding).toBe(true)
      expect(refused.error).toContain("onboarding")
    }
    const other = parseEgoCliOutput("boom\n", "")
    expect(other.ok).toBe(false)
    if (!other.ok) expect(other.needsOnboarding).toBe(false)
  })

  it("a corrupt marker falls into the error reading, never a crash", () => {
    const r = parseEgoCliOutput("NEO_RESULT:{not json\n", "")
    expect(r.ok).toBe(false)
  })

  it("empty output is an error, not a hang", () => {
    const r = parseEgoCliOutput("", "")
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.error).toBe("ego-cli returned nothing")
  })

  it("wrapEgoScript: body sets NEO_OUT, the marker prints last", () => {
    const s = wrapEgoScript(`NEO_OUT = 1 + 1`)
    expect(s).toContain("NEO_OUT = 1 + 1")
    expect(s.trimEnd().endsWith(`cliLog('NEO_RESULT:' + JSON.stringify(NEO_OUT))`)).toBe(true)
  })

  it("isOnboardingRefusal matches ego's exact sentence", () => {
    expect(isOnboardingRefusal("Please complete the onboarding process first.")).toBe(true)
    expect(isOnboardingRefusal("user is controlling")).toBe(false)
  })
})
