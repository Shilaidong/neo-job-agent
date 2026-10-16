import { describe, expect, test } from "bun:test"
import { challengePageHit } from "./challenge"

describe("recognising a bot gate that only a person can pass", () => {
  const clean = { title: "UCAS Login", body: "Sign in with your email and password.\nValidate your email address.", cfGlobal: false, turnstile: false }

  test("an ordinary login page (even one talking about verifying an email) is NOT handed off", () => {
    expect(challengePageHit(clean)).toBe(false)
  })

  test("the two Cloudflare interstitials a real UCAS attempt showed are caught", () => {
    expect(challengePageHit({ ...clean, title: "Just a moment..." })).toBe(true)
    expect(challengePageHit({ ...clean, title: "One more step", body: "Why do I have to complete a CAPTCHA?" })).toBe(true)
    expect(challengePageHit({ ...clean, title: "", body: "请验证您是真人\nCLOUDFLARE" })).toBe(true)
  })

  test("Cloudflare's own globals and a VISIBLE Turnstile widget are caught", () => {
    expect(challengePageHit({ title: "login", body: "", cfGlobal: true, turnstile: false })).toBe(true)
    expect(challengePageHit({ title: "login", body: "", cfGlobal: false, turnstile: true })).toBe(true)
  })

  test("the probe only reports visible widgets: hidden inputs on ordinary forms stay the model's", () => {
    // CHALLENGE_PROBE counts a widget only when it (or its parent) has size — the pure side here trusts that flag,
    // the fixture + smoke cover the DOM side. Assert the contract this file depends on stays binary.
    expect(challengePageHit({ title: "", body: "cf-turnstile-response", cfGlobal: false, turnstile: false })).toBe(false)
  })
})
