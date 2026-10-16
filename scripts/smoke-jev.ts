/**
 * `bun run smoke:jev` — one real round trip to Jev (three questions in it), then the same ask again
 * to prove the cache. Costs one request; the free tier allows about five per five minutes.
 * Needs NEO_JEV_KEY in the environment or in .env.local.
 */
import { existsSync, readFileSync } from "node:fs"
import { mkdtemp, rm } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { parseEnv } from "node:util"
import { createJev, gatewayBackend, isConfident, typesafeBackend } from "../src/main/jev-core"

const envFile = join(import.meta.dir, "..", ".env.local")
const local = existsSync(envFile) ? parseEnv(readFileSync(envFile, "utf8")) : {}
const typesafe = process.env.NEO_TYPESAFE_KEY || local.NEO_TYPESAFE_KEY
const key = typesafe || process.env.NEO_JEV_KEY || local.NEO_JEV_KEY
if (!key) {
  console.log("SMOKE FAILED  no NEO_TYPESAFE_KEY or NEO_JEV_KEY (environment or .env.local)")
  process.exit(1)
}
console.log(`route: ${typesafe ? "TypeSafe direct" : "Vercel AI Gateway"}`)

const events: string[] = []
const log = { info: (msg: string, data?: unknown) => events.push(`${msg} ${JSON.stringify(data ?? {})}`), warn: (msg: string, data?: unknown) => events.push(`WARN ${msg} ${JSON.stringify(data ?? {})}`) }
const jev = createJev({ backend: () => (typesafe ? typesafeBackend(() => key) : gatewayBackend(() => key)), log, timeoutMs: 8_000 })
const dir = await mkdtemp(join(tmpdir(), "neo-jev-"))
const cache = join(dir, "jev.json")

const state = {
  dropdown: { field: "Country of citizenship", value_from_student_profile: "中国" },
  control: { label: "Continue", page_context: "Application fee: you will be charged £90 when you continue" },
}
const questions = {
  country: { type: "choice", instructions: "For `dropdown`: pick the option that means the same as value_from_student_profile.", criteria: { o0: "Chile", o1: "China, People's Republic of", o2: "Taiwan (Province of China)", o3: "Korea, Republic of", NONE: "No option fits" } },
  risk: { type: "choice", instructions: "For `control`: what will clicking it do on this university application site?", criteria: { final_submit: "Irreversibly submits the whole application", payment: "Charges money or starts paying a fee", recommender_invite: "Emails a recommender", none: "Anything else" } },
  charged: { type: "boolean", instructions: "For `control`: will the applicant be charged money by clicking it?" },
} as const

let failed = 0
const check = (name: string, ok: boolean, detail = "") => {
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${ok ? "" : `  ← ${detail}`}`)
  if (!ok) failed++
}

const started = Date.now()
const first = await jev.ask(state, questions, cache)
const ms = Date.now() - started
if (!first) {
  console.log(events.join("\n"))
  console.log(/rate limited/.test(events.join()) ? "SMOKE SKIPPED  rate limited (free tier: ~5 calls per 5 minutes). Try again in a few minutes." : "SMOKE FAILED  Jev did not answer")
  await rm(dir, { recursive: true, force: true })
  process.exit(/rate limited/.test(events.join()) ? 0 : 1)
}
check("three questions answered in one round trip", Object.keys(first).length === 3, JSON.stringify(first))
check("中国 → China, People's Republic of, confidently", first.country.type === "choice" && first.country.choice === "o1" && isConfident(first.country), JSON.stringify(first.country))
check("'Continue' next to a fee notice is recognised as payment", first.risk.type === "choice" && first.risk.choice === "payment", JSON.stringify(first.risk))
check("boolean answers carry a probability", first.charged.type === "boolean" && first.charged.probability > 0.5, JSON.stringify(first.charged))
check(`round trip under 3 seconds (${ms} ms)`, ms < 3_000)

const again = Date.now()
const second = await jev.ask(state, questions, cache)
check(`the same ask is served from the cache (${Date.now() - again} ms)`, JSON.stringify(second) === JSON.stringify(first) && Date.now() - again < 50)
check("the key never reaches the log", !events.join("\n").includes(key))

await rm(dir, { recursive: true, force: true })
console.log(failed ? `SMOKE FAILED  ${failed} check(s)` : "SMOKE PASSED")
process.exit(failed ? 1 : 0)
