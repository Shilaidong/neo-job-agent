import type { ModelServer } from "../shared/types"

/**
 * The pure half of the model-server settings: what a saved entry becomes in the config we hand OpenCode at spawn.
 * No Electron, no files — the same split as jev.ts / jev-core.ts, so `bun test` can check the shapes.
 */

/** The server that still comes from `NEO_LOCAL_*` keeps its old provider id, so saved model choices keep pointing at it. */
export const OWN_ENV_PROVIDER = "own"
export const serverProviderId = (id: string) => `own-${id}`

/** One model + its address, shaped for `OPENCODE_CONFIG_CONTENT`'s `provider` section. */
export type OwnModelConfig = {
  providerID: string
  modelID: string
  /** The level to think at unless the consultant picks another; "" = this server is never asked to think. */
  thinking: string
  provider: {
    npm: "@ai-sdk/openai-compatible"
    name: string
    options: { baseURL: string; apiKey: string }
    models: Record<string, unknown>
  }
}

function providerConfig(o: { name: string; baseURL: string; apiKey?: string; model: string; sees: boolean; levels: string[]; context: number; output: number }) {
  return {
    npm: "@ai-sdk/openai-compatible" as const,
    name: o.name,
    options: { baseURL: o.baseURL, apiKey: o.apiKey?.trim() || "none" },
    models: {
      [o.model]: {
        name: o.model,
        attachment: o.sees,
        reasoning: o.levels.length > 0,
        tool_call: true,
        modalities: { input: o.sees ? ["text", "image"] : ["text"], output: ["text"] },
        limit: { context: o.context, output: o.output },
        variants: Object.fromEntries(o.levels.map((level) => [level, { reasoningEffort: level }])),
      },
    },
  }
}

/** "provider/model" — how the default and the hidden list name a model. */
export const modelRefOf = (providerID: string, modelID: string) => `${providerID}/${modelID}`
export function parseModelRef(ref: string): { providerID: string; modelID: string } | undefined {
  const cut = ref.indexOf("/")
  return cut > 0 && cut < ref.length - 1 ? { providerID: ref.slice(0, cut), modelID: ref.slice(cut + 1) } : undefined
}

/** A row of the settings screen that manages a model inside OpenCode's own provider (cloud), not a server of our own. */
export const isCloudRow = (s: ModelServer) => Boolean(s.providerID)

/** The "provider/model" ref a stored row answers to, own or cloud — same grammar the default and the hidden list use. */
export const rowRef = (s: ModelServer) => modelRefOf(s.providerID ?? serverProviderId(s.id ?? ""), s.model)

/**
 * Which existing row a just-cleaned row replaces (-1 = append). Cloud rows match on the ref, NOT the id:
 * an edit whose draft lost the id (or a 「改成配置」 from the live list) must never grow a second card for
 * the same model — the consultant read that as "it did not save". Own rows match on id: same name + model
 * may run twice side by side on purpose (two doors to one model).
 */
export function upsertIndex(servers: ModelServer[], clean: ModelServer): number {
  return isCloudRow(clean)
    ? servers.findIndex((s) => isCloudRow(s) && rowRef(s) === rowRef(clean))
    : servers.findIndex((s) => s.id === clean.id)
}

/** Our own servers (settings screen's `own-<id>`, and the old `own` from the env file) need no login; cloud providers do. */
export const isOwnProviderId = (providerID: string) => providerID === OWN_ENV_PROVIDER || providerID.startsWith("own-")

/**
 * Of opencode's `/provider` `all` list, which provider entries hold a REAL credential on this machine.
 * NOT the `connected` field: a provider merely DECLARED by our injected config reports itself connected
 * (entry `source: "config"`, no key — probe 2026-10-01), which made the picker offer cloud rows that could not
 * answer and made applyCloudKeys skip the Key the consultant just typed ("already connected", so never written).
 * The honest signal is the entry's own `key` field: absent without a credential, present once auth.set stored one.
 * Not an array (the server did not answer) → null: callers must not filter on a guess.
 */
export function credentialHolderIds(all: unknown): Set<string> | null {
  if (!Array.isArray(all)) return null
  return new Set(
    (all as Array<{ id?: string; key?: unknown } | undefined>)
      .filter((p) => p?.id && p.key !== undefined && p.key !== null && p.key !== "")
      .map((p) => p!.id!),
  )
}

/**
 * What the model picker may offer right now: own servers always (their door is the address itself),
 * a cloud model only while this machine holds its login. Our injected cloud rows make a provider show
 * in opencode's list even with no login — presence in the list is not enough to promise it answers.
 */
export function pickerUsable<T extends { providerID: string }>(models: T[], connected: Set<string> | null): T[] {
  if (connected === null) return [...models] // opencode's provider list did not answer: do not filter on a guess
  return models.filter((m) => isOwnProviderId(m.providerID) || connected.has(m.providerID))
}

/**
 * A cloud model row from the settings screen: the address is not ours to know and the base URL never appears here.
 * The consultant may type the provider's API key (opencode's login lives in the app's private directory now,
 * and this row is how a machine gets one); it travels to opencode through auth.set only, never through the
 * injected config - that env string is visible to the model's own shell tool. What the consultant edits here:
 * display name, model id (opencode's catalog may not list a newer one yet), whether it sees, the limits, and the key.
 * 0 limits = "don't tell opencode, it knows the model already".
 */
export function normalizeCloudModel(input: Partial<ModelServer>): ModelServer {
  const providerID = String(input.providerID ?? "").trim()
  const name = String(input.name ?? "").trim()
  const model = String(input.model ?? "").trim()
  if (!providerID) throw new Error("云端模型没有说明属于哪个服务商。")
  if (!name) throw new Error("请给这个模型起个显示名（它会出现在模型列表和设置页里）。")
  if (!model) throw new Error("请填写模型 ID：服务商对这个名字的写法，比如 MiniMax-M3.1-Flash-Preview。")
  return {
    id: input.id?.trim() || undefined,
    providerID,
    name,
    baseURL: "",
    apiKey: input.apiKey?.trim() || undefined,
    model,
    sees: input.sees !== false,
    thinkingLevels: [],
    thinkingDefault: "",
    context: Number(input.context) > 0 ? Math.round(Number(input.context)) : 0,
    output: Number(input.output) > 0 ? Math.round(Number(input.output)) : 0,
  }
}

/**
 * What a cloud row adds to an already-logged-in provider: opencode merges these model definitions with its
 * own catalog. No address, no key — auth belongs to opencode and we never touch it. Limits are only written
 * when known (opencode already sizes the models it knows), and the shapes follow the M3 catalog entry.
 */
export function cloudProviderConfigs(rows: ModelServer[]): Record<string, { models: Record<string, unknown> }> {
  const blocks = new Map<string, Record<string, unknown>>()
  for (const row of rows) {
    if (!isCloudRow(row)) continue
    const models = blocks.get(row.providerID!) ?? {}
    blocks.set(row.providerID!, models)
    models[row.model] = {
      name: row.name,
      attachment: row.sees,
      reasoning: true,
      tool_call: true,
      modalities: { input: row.sees ? ["text", "image"] : ["text"], output: ["text"] },
      ...(row.context > 0 && row.output > 0 ? { limit: { context: row.context, output: row.output } } : {}),
    }
  }
  return Object.fromEntries([...blocks].map(([providerID, models]) => [providerID, { models }]))
}

/**
 * Whether a listed model can see images. Every model our own config file spells out (cloud rows, own-server rows)
 * is answered BY THE FILE: opencode's response does not reliably echo `attachment` back for injected models, and
 * copying its capabilities then both mislabels the picker and — worse — stops sending screenshots to a model that
 * sees. Only models opencode's own catalog describes are left to answer for themselves.
 */
export function seesOfListedModel(rowSees: boolean | undefined, info: { capabilities?: { input?: { image?: boolean } }; attachment?: boolean } | undefined): boolean {
  if (rowSees !== undefined) return rowSees
  return info?.capabilities?.input?.image === true || info?.attachment === true
}

/** Our idea of which thinking levels are "more", strongest first; names opencode invented but we don't rank go last, in the order it listed them. */
const THINKING_STRENGTH = ["max", "xhigh", "high", "thinking", "medium", "low"]

/** The levels the picker may offer for a model: the variant names opencode listed, strongest first (the list order is opencode's, which is arbitrary). */
export function thinkingOptionsOf(variantKeys: string[]): string[] {
  const known = variantKeys.filter((k) => THINKING_STRENGTH.includes(k)).sort((a, b) => THINKING_STRENGTH.indexOf(a) - THINKING_STRENGTH.indexOf(b))
  return [...known, ...variantKeys.filter((k) => !THINKING_STRENGTH.includes(k))]
}

/** "自动（默认）" resolves to: the server's own default when it set one, else the strongest level offered. An unknown level in either place is ignored, never sent. */
export function resolveThinking(options: string[], chosen: string | undefined, ownDefault: string): string {
  if (chosen && options.includes(chosen)) return chosen
  if (ownDefault && options.includes(ownDefault)) return ownDefault
  return options.find((k) => THINKING_STRENGTH.includes(k)) ?? ""
}

/**
 * The single default, when the store has not written one yet: a server the old file flagged outranks the old
 * NEO_LOCAL_DEFAULT=1, which outranks the built-in seed (the consultant's past choice is never overwritten).
 */
export function resolveDefaultRef(servers: ModelServer[], opts: { envDefaultRef?: string; seedRef: string }): string {
  const flagged = servers.find((s) => s.isDefault)
  if (flagged?.id) return modelRefOf(flagged.providerID ?? serverProviderId(flagged.id), flagged.model)
  return opts.envDefaultRef || opts.seedRef
}

/** Clean a draft from the settings screen: trim, fill defaults, refuse what is missing. Errors are what the consultant reads — say what to fix. */
export function normalizeModelServer(input: Partial<ModelServer>): ModelServer {
  const name = String(input.name ?? "").trim()
  const baseURL = String(input.baseURL ?? "").trim()
  const model = String(input.model ?? "").trim()
  if (!name) throw new Error("请给这台模型服务器起个名字（它会出现在模型列表的分组里）。")
  if (!/^https?:\/\/\S+$/.test(baseURL)) throw new Error("接口地址要以 http:// 或 https:// 开头，例如 http://10.0.0.109/v1")
  if (!model) throw new Error("请填写模型 ID：服务器对这个名字的写法（它 /models 列表里能看到）。")
  const levels = [...new Set((input.thinkingLevels ?? []).map((level) => String(level).trim()).filter(Boolean))]
  const thinkingDefault = String(input.thinkingDefault ?? "").trim()
  if (thinkingDefault && !levels.includes(thinkingDefault)) throw new Error(`默认思考档「${thinkingDefault}」不在勾选的档位里，勾上它或换一个。`)
  return {
    id: input.id?.trim() || undefined,
    name,
    baseURL,
    apiKey: String(input.apiKey ?? "").trim() || undefined,
    model,
    sees: input.sees !== false,
    thinkingLevels: levels,
    thinkingDefault,
    context: Number(input.context) > 0 ? Math.round(Number(input.context)) : 262144,
    output: Number(input.output) > 0 ? Math.round(Number(input.output)) : 65536,
    isDefault: input.isDefault === true,
  }
}

/** A saved entry as OpenCode sees it: one provider of its own, keyed by the entry id, so entries never collide. */
export function modelServerOwnConfig(s: ModelServer): OwnModelConfig {
  return {
    providerID: serverProviderId(s.id ?? "unnamed"),
    modelID: s.model,
    thinking: s.thinkingDefault,
    provider: providerConfig({ name: s.name, baseURL: s.baseURL, apiKey: s.apiKey, model: s.model, sees: s.sees, levels: s.thinkingLevels, context: s.context, output: s.output }),
  }
}

/**
 * The server that still comes from `NEO_LOCAL_*` (process env / local.env / .env.local). It keeps working —
 * self-tests run on it — and the settings screen shows it as a read-only row so it is never a mystery guest in the picker.
 */
export function envOwnConfig(get: (name: string) => string | undefined): OwnModelConfig | undefined {
  const baseURL = get("NEO_LOCAL_BASE_URL"), model = get("NEO_LOCAL_MODEL")
  if (!baseURL || !model) return undefined
  const levels = (get("NEO_LOCAL_THINKING_LEVELS") || "low,medium,xhigh").split(",").map((l) => l.trim()).filter(Boolean)
  return {
    providerID: OWN_ENV_PROVIDER,
    modelID: model,
    thinking: get("NEO_LOCAL_THINKING") || (levels.includes("medium") ? "medium" : levels[0] ?? ""),
    provider: providerConfig({
      name: "自己的模型",
      baseURL,
      apiKey: get("NEO_LOCAL_KEY"),
      model,
      sees: get("NEO_LOCAL_SEES") !== "0",
      levels,
      context: Number(get("NEO_LOCAL_CONTEXT")) || 262144,
      output: Number(get("NEO_LOCAL_OUTPUT")) || 65536,
    }),
  }
}
