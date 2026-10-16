/**
 * The settings screen's Jev rows in storage (see jev-servers-core for the rules). Same shape of
 * life as the model servers: one JSON file under userData, deletions stick via a hidden list, the
 * key never goes into a log line. `default` is the row a task's Jev calls go to; "off" is a real
 * choice — Jev is an accelerator, the consultant may want the big model alone.
 */
import { randomUUID } from "node:crypto"
import { createLogger } from "./log"
import { localEnv } from "./local-env"
import { activeJevServer as pickRow, CLOUD_JEV_ID, JEV_SEED, jevDoor, seedJevServers, type JevServer } from "./jev-servers-core"
import { openStore } from "./store"

const log = createLogger("jev-servers")
const store = openStore<{ servers: JevServer[]; hidden?: string[]; default?: string | null }>("jev-servers")

let seeded = false
function ensureStore() {
  if (seeded) return
  seeded = true
  const servers = store.get("servers") ?? []
  const next = seedJevServers(servers, store.get("hidden") ?? [])
  if (next.length !== servers.length) store.set("servers", next)
  if (store.get("default") === undefined) store.set("default", CLOUD_JEV_ID) // official cloud first (2026-10-12 用户点单); the LAN row is still one click away on the settings screen
}

export function listJevServers(): JevServer[] {
  ensureStore()
  return store.get("servers") ?? []
}

export function saveJevServer(server: JevServer): JevServer[] {
  ensureStore()
  const servers = store.get("servers") ?? []
  const stored = { ...server, id: server.id ?? randomUUID() }
  const at = servers.findIndex((s) => s.id === stored.id)
  const next = at >= 0 ? servers.map((s, i) => (i === at ? stored : s)) : [...servers, stored]
  store.set("servers", next)
  log.info("jev server saved", { id: stored.id, name: stored.name, baseURL: stored.baseURL }) // never the key
  return next
}

export function deleteJevServer(id: string): JevServer[] {
  ensureStore()
  const servers = store.get("servers") ?? []
  const gone = servers.find((s) => s.id === id)
  if (!gone) return servers
  const next = servers.filter((s) => s.id !== id)
  store.set("servers", next)
  if (id.startsWith("seed-")) store.set("hidden", [...(store.get("hidden") ?? []), id]) // seeded rows would otherwise return at next start
  if (store.get("default") === id) store.set("default", null) // falls back to the first row on screen
  log.info("jev server removed", { id, name: gone.name })
  return next
}

export function setDefaultJev(id: string | null | "off"): void {
  ensureStore()
  store.set("default", id)
}

/** Deleted seeded rows (the screen's restore strip shows these by name, same ritual as the model cards). */
export function hiddenJevNames(): { id: string; name: string }[] {
  ensureStore()
  return (store.get("hidden") ?? []).map((id) => ({ id, name: JEV_SEED.find((s) => s.id === id)?.name ?? id }))
}

export function unhideJevServer(id: string): void {
  ensureStore()
  const hidden = store.get("hidden") ?? []
  store.set("hidden", hidden.filter((h) => h !== id))
  log.info("jev server restored", { id })
}

/** What the settings screen marks as the chosen row (null = no pick yet, "off" = consultant turned Jev away). */
export function jevDefault(): string | null | undefined {
  ensureStore()
  return store.get("default")
}

/** The row the running Jev should use right now, or undefined for "no Jev". */
export function activeJevServer(): JevServer | undefined {
  ensureStore()
  return pickRow(store.get("servers") ?? [], store.get("default"))
}

/** The key a row answers with: its own, or the per-machine TypeSafe key when the cloud row's box is empty. */
export function jevServerKey(server: JevServer): string | undefined {
  return server.apiKey || (server.id === "seed-cloud-jev" ? localEnv("NEO_TYPESAFE_KEY") : undefined)
}

/** 【测试连接】: one trivial question through the same door the real calls use. */
export async function testJevServer(id: string): Promise<{ ok: boolean; detail: string }> {
  const server = listJevServers().find((s) => s.id === id)
  if (!server) return { ok: false, detail: "这一条不在了" }
  const { typesafeBackend } = await import("./jev-core")
  const ask = typesafeBackend(() => jevServerKey(server), server.model, jevDoor(server.baseURL))
  try {
    const answers = await ask("自检：1 加 1？", { one: { type: "choice", instructions: "答案是几", criteria: { two: "2", three: "3" } } }, AbortSignal.timeout(8_000))
    const pick = answers.one && answers.one.type === "choice" ? answers.one.choice : undefined
    return pick ? { ok: true, detail: `它答了「${pick}」` } : { ok: false, detail: "答不上来（连接是通的，答案不对）" }
  } catch (error) {
    return { ok: false, detail: error instanceof Error ? error.message.slice(0, 160) : String(error).slice(0, 160) }
  }
}
