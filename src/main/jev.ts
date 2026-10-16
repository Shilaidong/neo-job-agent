import { join } from "node:path"
import { createJev, fakeJev, gatewayBackend, typesafeBackend, type JevBackend, type JevQuestion } from "./jev-core"
import { jevDoor } from "./jev-servers-core"
import { activeJevServer, jevServerKey } from "./jev-servers"
import { createLogger } from "./log"
import { localEnv } from "./local-env"

export { CONFIDENT, isConfident, type JevAnswer, type JevAnswers, type JevQuestion } from "./jev-core"

const log = createLogger("jev")

/**
 * Three ways to reach Jev: a LAN cluster (`NEO_JEV_BASE_URL` = its `/v1`, speaking the same
 * `/systemone` spec — the X Spark pair as of 2026-10-08, ~0.25 s, no key if the server doesn't ask),
 * TypeSafe directly (`NEO_TYPESAFE_KEY`, ~0.3 s) or through the Vercel AI Gateway (`NEO_JEV_KEY`,
 * ~0.7 s). The model name defaults to `jev-latest`, which is what both the cloud and the cluster
 * answer to; `NEO_JEV_MODEL` overrides (the cluster also lists `kev-latest`). Dev: `.env.local` at
 * the repo root (gitignored) or the environment. `opencode.ts` keeps the secrets out of OpenCode's
 * shell tool.
 */
let keys: { typesafe?: string; gateway?: string; base?: string; model?: string } | undefined
function loadKeys() {
  if (keys) return keys
  keys = { typesafe: localEnv("NEO_TYPESAFE_KEY"), gateway: localEnv("NEO_JEV_KEY"), base: localEnv("NEO_JEV_BASE_URL"), model: localEnv("NEO_JEV_MODEL") }
  log.info("route", { via: keys.base ? "lan cluster" : keys.typesafe ? "typesafe" : keys.gateway ? "vercel gateway" : "none" })
  return keys
}

let scripted: JevBackend | undefined
/** Self-checks install a scripted backend so they need no network and no judgement from a fake. */
export function setJevBackendForTests(backend: JevBackend | undefined) {
  scripted = backend
}

/** The door moves with the config: the cluster's own address when there is one, TypeSafe's otherwise. */
const direct = typesafeBackend(
  () => loadKeys().typesafe,
  () => loadKeys().model ?? "jev-latest",
  () => (loadKeys().base ? `${loadKeys().base!.replace(/\/+$/, "")}/systemone` : "https://api.typesafe.ai/v1/systemone"),
)
const gateway = gatewayBackend(() => loadKeys().gateway)

const jev = createJev({
  log,
  timeoutMs: Number(process.env.NEO_JEV_TIMEOUT_MS) || undefined,
  backend: () => {
    if (scripted) return scripted
    if (process.env.NEO_JEV === "off") return undefined
    if (process.env.NEO_JEV === "fake") return fakeJev
    if (loadKeys().base) return direct // an explicit env door outranks the screen (dev and self-checks)
    // The settings screen decides from 2026-10-08: whichever Jev row is picked answers; "off" means none.
    const row = activeJevServer()
    if (row) return typesafeBackend(() => jevServerKey(row), row.model, jevDoor(row.baseURL))
    return loadKeys().typesafe ? direct : loadKeys().gateway ? gateway : undefined
  },
})

/**
 * Ask Jev several questions about one small piece of state, in one round trip.
 * `undefined` means "not available right now": do what you did before Jev existed.
 * Send only what the question needs — never the whole page, never the student's profile.
 */
export function askJev(state: unknown, questions: Record<string, JevQuestion>, workspace?: string) {
  // A scripted backend is a self-check counting its calls: no cache between it and the tool.
  return jev.ask(state, questions, workspace && !scripted ? join(workspace, ".cache", "jev.json") : undefined)
}
