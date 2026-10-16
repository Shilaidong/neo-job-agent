import { randomUUID } from "node:crypto"
import type { ModelServer } from "../shared/types"
import { createLogger } from "./log"
import { localEnv } from "./local-env"
import { envOwnConfig, isCloudRow, isOwnProviderId, modelRefOf, modelServerOwnConfig, normalizeCloudModel, normalizeModelServer, parseModelRef, resolveDefaultRef, rowRef, upsertIndex, type OwnModelConfig } from "./model-server-core"
import { openStore } from "./store"

const log = createLogger("models")

/**
 * Everything behind the settings screen's model card, one plain JSON file under userData:
 * `servers` (own servers and cloud model rows side by side), `hidden` (refs the consultant deleted — on the screen
 * this is simply 【删除】: the row goes, the picker drops it, and restarts do not bring it back. The list is the only
 * way to make a cloud deletion stick, because opencode's own catalog cannot be deleted from; the restore strip at
 * the bottom of the screen is the way back, and opencode's own login stays untouched), `default` (the one ref
 * a task opens on, own or cloud; null = "no pick, let the built-in chain decide"), `efforts` (per-model thinking
 * level the consultant picked in the chat's model picker; absent = auto).
 * Deliberately not the keychain (the consultant's call, 2026-09-28: one machine, one user, and a keychain hiccup
 * would take the entries with it). The key still never goes into a log line or into anything the model sees.
 */
const store = openStore<{ servers: ModelServer[]; hidden?: string[]; default?: string | null; efforts?: Record<string, string> }>("model-servers")

/**
 * The two cloud rows every install starts with. MiniMax answers behind a token plan with plenty of room,
 * so M3.1 is the everyday model and plain M3 its backup. Honest note: M3.1-Flash-Preview is not in opencode's
 * own catalog yet, so its limits are copied from M3 (the vendor gave no sheet) — editable on the screen.
 */
const CLOUD_SEED: ModelServer[] = [
  { providerID: "minimax-cn", name: "MiniMax M3.1 Flash Preview", baseURL: "", model: "MiniMax-M3.1-Flash-Preview", sees: true, thinkingLevels: [], thinkingDefault: "", context: 1_000_000, output: 512_000 },
  { providerID: "minimax-cn", name: "MiniMax M3", baseURL: "", model: "MiniMax-M3", sees: true, thinkingLevels: [], thinkingDefault: "", context: 1_000_000, output: 512_000 },
]

/**
 * The LAN model server (用户拍板 2026-10-07:「本地的 qwen，url 写成 http://10.0.0.109/v1，不带端口号」) — preset for a
 * fresh install, as a picker option, NOT as the default (MiniMax stays the everyday model; this one only answers
 * on the LAN it sits on). Thinking levels skip `high`: this server answers 400 to it (INTEL_MAC_PROMPT 实测).
 * Deleting the row hides it for good like any other row (see deleteModelServer).
 */
const LAN_SEED: ModelServer = { id: "seed-lan-qwen", name: "Qwen（局域网）", baseURL: "http://10.0.0.109/v1", apiKey: "123456789", model: "qwen3.8-flash-next", sees: true, thinkingLevels: ["low", "medium", "xhigh"], thinkingDefault: "medium", context: 262_144, output: 65_536 }

/** The seed's default: what the fallback chain sits on when nothing is picked. */
export const SEED_REF = modelRefOf("minimax-cn", "MiniMax-M3.1-Flash-Preview")

/**
 * Run once per process: put the seed rows in (unless hidden), then write the default the old file never had —
 * resolveDefaultRef keeps whatever the consultant had chosen before (a flagged server, or NEO_LOCAL_DEFAULT=1)
 * ahead of the seed, so migrating never overwrites a past choice.
 */
let seeded = false
function ensureStore() {
  if (seeded) return
  seeded = true
  const hidden = new Set(store.get("hidden") ?? [])
  const servers = store.get("servers") ?? []
  const next = [...servers]
  for (const seed of CLOUD_SEED) {
    const ref = modelRefOf(seed.providerID!, seed.model)
    if (hidden.has(ref)) continue
    if (!next.some((s) => isCloudRow(s) && modelRefOf(s.providerID!, s.model) === ref)) next.push({ ...seed })
  }
  // The LAN server: skipped when the machine already keeps one for that address (a hand-built entry counts — one card per server),
  // skipped when it was deleted before, and never taken as a cloud row (it has no providerID).
  if (!hidden.has(refOfRow(LAN_SEED)) && !next.some((s) => s.baseURL === LAN_SEED.baseURL && s.model === LAN_SEED.model)) next.push({ ...LAN_SEED })
  if (next.length !== servers.length) store.set("servers", next)
  if (store.get("default") === undefined) {
    const env = envOwnConfig(localEnv)
    const envDefaultRef = env && localEnv("NEO_LOCAL_DEFAULT") === "1" ? modelRefOf(env.providerID, env.modelID) : undefined
    store.set("default", resolveDefaultRef(next, { envDefaultRef, seedRef: SEED_REF }))
  }
}

/** The `provider/model` ref a stored row answers to, own or cloud. */
const refOfRow = rowRef

export function listModelServers(): ModelServer[] {
  ensureStore()
  return (store.get("servers") ?? []).map((s) => ({ ...s }))
}

/**
 * Insert or replace in place, then the default is NOT touched here — see setModelDefault.
 * A cloud row is found by its "provider/model" ref, not by id: an edit that lost the id (or a 「改成配置」 click
 * on a live row) must never grow a second card for the same model — that "saved and got another M3.1" surprise.
 * An own-server row is found by id (its address is part of its identity; same name + model may run twice on purpose).
 */
export function saveModelServer(input: ModelServer): ModelServer {
  ensureStore()
  const cloud = isCloudRow(input)
  const clean = cloud ? normalizeCloudModel(input) : normalizeModelServer(input)
  clean.id = clean.id || randomUUID()
  delete clean.isDefault // legacy rows carried the flag; one store-level field now holds the single default
  const ref = refOfRow(clean)
  const servers = store.get("servers") ?? []
  const at = upsertIndex(servers, clean)
  const next = at >= 0 ? servers.map((s, i) => (i === at ? { ...clean, id: s.id } : s)) : [...servers, clean] // an in-place replace keeps the row's old id
  store.set("servers", next)
  const hidden = store.get("hidden") ?? []
  if (hidden.includes(ref)) store.set("hidden", hidden.filter((h) => h !== ref)) // saving a row un-hides it
  log.info(cloud ? "cloud model row saved" : clean.id === (input.id ?? "") ? "model server updated" : "model server added", { id: next[at >= 0 ? at : next.length - 1]?.id, ref, name: clean.name, ...(cloud ? {} : { baseURL: clean.baseURL }), sees: clean.sees })
  return { ...(at >= 0 ? next[at] : clean) }
}

export function deleteModelServer(id: string): boolean {
  ensureStore()
  const servers = store.get("servers") ?? []
  const gone = servers.find((s) => s.id === id)
  if (!gone) return false
  if (isCloudRow(gone) || gone.id?.startsWith("seed-")) return hideModel(refOfRow(gone)), true // a seed row (cloud or LAN) deleted without the hidden-list entry would be re-seeded on next start — deletion must stick
  const rest = servers.filter((s) => s.id !== id)
  store.set("servers", rest)
  if (gone.isDefault || store.get("default") === refOfRow(gone)) store.set("default", SEED_REF)
  log.info("model server removed", { id, name: gone.name })
  return true
}

/** The single default: a "provider/model" ref, or null = no pick (the built-in chain decides). */
export function defaultModelRef(): string | null {
  ensureStore()
  return store.get("default") ?? null
}

export function setModelDefault(ref: string | null): void {
  ensureStore()
  if (ref !== null && !parseModelRef(ref)) throw new Error("模型引用写错了：应该是「服务商/模型ID」这种写法。")
  store.set("default", ref)
  log.info("default model set", { ref })
}

/** Refs the consultant deleted: the model picker skips them, and live cloud models stay out of the settings list. */
export function hiddenModels(): string[] {
  ensureStore()
  return [...(store.get("hidden") ?? [])]
}

/**
 * What the screen's 【删除】 does to a cloud model: row gone, ref into the exclusion list (picker and settings
 * both drop it, restarts do not re-seed it), opencode's login and stored key on this machine untouched —
 * re-adding the model later needs no key typed again while opencode still holds its login.
 */
export function hideModel(ref: string): void {
  ensureStore()
  if (!parseModelRef(ref)) throw new Error("模型引用写错了：应该是「服务商/模型ID」这种写法。")
  const hidden = store.get("hidden") ?? []
  if (!hidden.includes(ref)) store.set("hidden", [...hidden, ref])
  const servers = store.get("servers") ?? []
  const rest = servers.filter((s) => refOfRow(s) !== ref)
  if (rest.length !== servers.length) store.set("servers", rest)
  if (store.get("default") === ref) store.set("default", SEED_REF)
  log.info("model hidden", { ref })
}

export function unhideModel(ref: string): void {
  ensureStore()
  const hidden = store.get("hidden") ?? []
  const rest = hidden.filter((h) => h !== ref)
  if (rest.length !== hidden.length) store.set("hidden", rest)
  log.info("model restored", { ref })
}

/** The thinking level picked per model in the chat's picker ("自动" deletes the entry). */
export function modelEfforts(): Record<string, string> {
  ensureStore()
  return { ...(store.get("efforts") ?? {}) }
}

export function setModelEffort(ref: string, level: string | null): void {
  ensureStore()
  if (!parseModelRef(ref)) throw new Error("模型引用写错了：应该是「服务商/模型ID」这种写法。")
  const efforts = { ...(store.get("efforts") ?? {}) }
  if (level) efforts[ref] = level
  else delete efforts[ref]
  store.set("efforts", efforts)
  log.info("model thinking level set", { ref, level: level ?? "自动（默认）" })
}

/** The cloud model rows (seed or hand-edited) whose definitions get merged into opencode's own providers. */
export function cloudModels(): ModelServer[] {
  ensureStore()
  return (store.get("servers") ?? []).filter(isCloudRow).map((s) => ({ ...s }))
}

/** Every own-model server to inject into OpenCode: the settings screen's entries first, then the one from local.env (id stays "own"). */
export function ownConfigs(): OwnModelConfig[] {
  ensureStore()
  const env = envOwnConfig(localEnv)
  return [...(store.get("servers") ?? []).filter((s) => !isCloudRow(s)).map(modelServerOwnConfig), ...(env ? [env] : [])]
}

/**
 * Which of the own servers (if any) a task should open on instead of the cloud default: the single
 * `default` field, and only when it points at an own provider — a cloud default is the caller's cloud chain's job.
 */
export function defaultOwnConfig(configs: OwnModelConfig[]): OwnModelConfig | undefined {
  const ref = defaultModelRef()
  const parsed = ref ? parseModelRef(ref) : undefined
  if (!parsed || !isOwnProviderId(parsed.providerID)) return undefined
  return configs.find((c) => c.providerID === parsed.providerID)
}

/** The local.env entry as the screen shows it: read-only, and its key is not sent to the screen. */
export function envFileServer(): ModelServer | undefined {
  const env = envOwnConfig(localEnv)
  if (!env) return undefined
  const info = env.provider.models[env.modelID] as { attachment?: boolean; limit?: { context: number; output: number }; variants?: Record<string, unknown> }
  return {
    id: env.providerID,
    name: "配置文件里的那台（local.env / .env.local）",
    baseURL: env.provider.options.baseURL,
    model: env.modelID,
    sees: info.attachment === true,
    thinkingLevels: Object.keys(info.variants ?? {}),
    thinkingDefault: env.thinking,
    context: info.limit?.context ?? 262144,
    output: info.limit?.output ?? 65536,
    readOnly: true,
  }
}

/**
 * Ask a server what it serves: `GET <baseURL>/models` with the key, 5 seconds (cold vLLM/Ollama need the
 * slack). The `note` is advice for the consultant, so it names what to check; with `model` given it also
 * says whether that id is really on the list. A bare host that 404s gets ONE retry with `/v1` appended —
 * the single most common typo, and if that works the note tells the consultant to write it in.
 */
export async function probeModelServer(cfg: { baseURL: string; apiKey?: string; model?: string }): Promise<{ ok: boolean; note: string; ids?: string[] }> {
  if (!/^https?:\/\/\S+$/.test(cfg.baseURL ?? "")) return { ok: false, note: "接口地址要以 http:// 或 https:// 开头。" }
  const attempt = async (base: string) => {
    let res: Response
    try {
      res = await fetch(`${base.replace(/\/$/, "")}/models`, { headers: { Authorization: `Bearer ${cfg.apiKey?.trim() || "none"}` }, signal: AbortSignal.timeout(5_000) })
    } catch (error) {
      return { kind: "network" as const, why: error instanceof Error && error.name === "TimeoutError" ? "5 秒内没有回答（地址不对？不在这个网络里？服务器在冷启动就再试一次。）" : `连不上：${error instanceof Error ? error.message : String(error)}` }
    }
    if (!res.ok) return { kind: "status" as const, status: res.status }
    const body = (await res.json().catch(() => undefined)) as { data?: { id?: unknown } } | undefined
    const ids = Array.isArray(body?.data) ? body.data.map((m) => (typeof m?.id === "string" ? m.id : "")).filter(Boolean) : []
    return { kind: "ok" as const, ids }
  }
  let out = await attempt(cfg.baseURL)
  let v1Fixed = false
  if (out.kind === "status" && out.status === 404 && !/\/v\d+(\/|$)/.test(cfg.baseURL)) {
    const retried = await attempt(`${cfg.baseURL.replace(/\/$/, "")}/v1`)
    if (retried.kind === "ok") {
      out = retried
      v1Fixed = true
    }
  }
  if (out.kind === "network") return { ok: false, note: out.why }
  if (out.kind === "status")
    return { ok: false, note: `服务器回答了，但状态是 ${out.status}（地址或 key 可能不对）。${out.status === 404 && !/\/v\d+(\/|$)/.test(cfg.baseURL) ? "OpenAI 协议的服务器多半要把 /v1 写进接口地址。" : ""}` }
  const ids = out.kind === "ok" ? out.ids : []
  const suffix = v1Fixed ? "（这次是软件替你在地址后面加了 /v1 试通的——把它写进接口地址，对话请求打的就是这个地址。）" : ""
  if (!cfg.model) return { ok: true, note: `${ids.length ? `服务器有回答，共 ${ids.length} 个模型。` : "服务器有回答。"}${suffix}`, ids }
  if (ids.length && !ids.includes(cfg.model)) {
    return { ok: false, note: `服务器连得上，但它的列表里没有「${cfg.model}」。列表里有：${ids.slice(0, 8).join("、")}${ids.length > 8 ? "…" : ""}`, ids }
  }
  return { ok: true, note: `${ids.includes(cfg.model) ? `连得上，模型「${cfg.model}」在服务器上。` : "连得上。"}${suffix}`, ids }
}
