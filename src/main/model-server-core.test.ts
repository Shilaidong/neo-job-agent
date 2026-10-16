import { describe, expect, test } from "bun:test"
import type { ModelServer } from "../shared/types"
import { cloudProviderConfigs, credentialHolderIds, envOwnConfig, isOwnProviderId, modelRefOf, modelServerOwnConfig, normalizeCloudModel, normalizeModelServer, OWN_ENV_PROVIDER, parseModelRef, pickerUsable, resolveDefaultRef, resolveThinking, rowRef, seesOfListedModel, serverProviderId, thinkingOptionsOf, upsertIndex } from "./model-server-core"

const draft = {
  name: " 局域网 Qwen ",
  baseURL: "http://10.0.0.109/v1",
  apiKey: " 123456789 ",
  model: "qwen3.8-flash-next",
  sees: true,
  thinkingLevels: ["low", "medium", "high", "xhigh", " medium "],
  thinkingDefault: "medium",
  context: 262144,
  output: 131072,
}

describe("model server settings", () => {
  test("cleaning trims the text and each thinking level", () => {
    const clean = normalizeModelServer(draft)
    expect(clean.name).toBe("局域网 Qwen")
    expect(clean.apiKey).toBe("123456789")
    expect(clean.thinkingLevels).toEqual(["low", "medium", "high", "xhigh"])
    expect(clean.context).toBe(262144)
    expect(clean.output).toBe(131072)
  })

  test("blank context and output fall back to the usual numbers", () => {
    const clean = normalizeModelServer({ ...draft, context: 0 as never, output: undefined })
    expect(clean.context).toBe(262144)
    expect(clean.output).toBe(65536)
  })

  test("a missing name is refused with advice the consultant can act on", () => {
    expect(() => normalizeModelServer({ ...draft, name: "  " })).toThrow(/名字/)
  })

  test("an address that is not a URL is refused", () => {
    expect(() => normalizeModelServer({ ...draft, baseURL: "10.0.0.109/v1" })).toThrow(/http/)
  })

  test("the default thinking level must be one that was ticked", () => {
    expect(() => normalizeModelServer({ ...draft, thinkingDefault: "ultra" })).toThrow(/medium|勾选/)
  })

  test("a server becomes a provider of its own, keyed by the entry id", () => {
    const cfg = modelServerOwnConfig({ ...normalizeModelServer(draft), id: "abc123" })
    expect(cfg.providerID).toBe(serverProviderId("abc123"))
    expect(cfg.modelID).toBe("qwen3.8-flash-next")
    expect(cfg.thinking).toBe("medium")
    const info = cfg.provider.models["qwen3.8-flash-next"] as { limit: unknown; variants: Record<string, unknown>; modalities: { input: string[] } }
    expect(info.limit).toEqual({ context: 262144, output: 131072 })
    // The consultant's own words for the levels reach OpenCode as reasoning variants, one effort each.
    expect(Object.keys(info.variants)).toEqual(["low", "medium", "high", "xhigh"])
    expect(info.variants["medium"]).toEqual({ reasoningEffort: "medium" })
    expect(info.modalities.input).toEqual(["text", "image"])
  })

  test("a server without eyes gets text-only modalities so no screenshot is ever sent", () => {
    const cfg = modelServerOwnConfig({ ...normalizeModelServer({ ...draft, sees: false }), id: "x" })
    const info = cfg.provider.models[cfg.modelID] as { modalities: { input: string[] }; attachment: boolean }
    expect(info.modalities.input).toEqual(["text"])
    expect(info.attachment).toBe(false)
  })

  test("an empty key becomes the placeholder OpenCode expects", () => {
    const cfg = modelServerOwnConfig({ ...normalizeModelServer({ ...draft, apiKey: "  " }), id: "x" })
    expect(cfg.provider.options.apiKey).toBe("none")
  })

  test("the env server keeps answering to the old provider id, with its old defaults", () => {
    const values: Record<string, string> = { NEO_LOCAL_BASE_URL: "http://x/v1", NEO_LOCAL_MODEL: "deep" }
    const cfg = envOwnConfig((name) => values[name])
    expect(cfg?.providerID).toBe(OWN_ENV_PROVIDER)
    expect(cfg?.thinking).toBe("medium")
    expect(cfg?.provider.options.apiKey).toBe("none")
    expect(Object.keys((cfg?.provider.models["deep"] as { variants: Record<string, unknown> }).variants)).toEqual(["low", "medium", "xhigh"])
  })

  test("no env server when the address or the model id is missing", () => {
    expect(envOwnConfig(() => undefined)).toBeUndefined()
    expect(envOwnConfig((n) => (n === "NEO_LOCAL_BASE_URL" ? "http://x/v1" : undefined))).toBeUndefined()
  })

  test("NEO_LOCAL_SEES=0 is understood the old way too", () => {
    const values: Record<string, string> = { NEO_LOCAL_BASE_URL: "http://x/v1", NEO_LOCAL_MODEL: "deep", NEO_LOCAL_SEES: "0" }
    const info = envOwnConfig((name) => values[name])!.provider.models["deep"] as { modalities: { input: string[] } }
    expect(info.modalities.input).toEqual(["text"])
  })
})

describe("cloud model rows", () => {
  const cloud = { providerID: "minimax-cn", name: " MiniMax M3.1 Flash Preview ", model: "MiniMax-M3.1-Flash-Preview", sees: true, context: 1000000, output: 512000 }

  test("a cloud row keeps no address; a typed key is kept, trimmed, and never rides in the injected config", () => {
    const clean = normalizeCloudModel(cloud)
    expect(clean.providerID).toBe("minimax-cn")
    expect(clean.name).toBe("MiniMax M3.1 Flash Preview")
    expect(clean.baseURL).toBe("")
    expect(clean.apiKey).toBeUndefined()
    expect(clean.context).toBe(1000000)
    const keyed = normalizeCloudModel({ ...cloud, apiKey: "  sk-test-123  " })
    expect(keyed.apiKey).toBe("sk-test-123")
    // The key reaches opencode through auth.set only — the config block is env-visible to the model's shell tool.
    expect(JSON.stringify(cloudProviderConfigs([keyed]))).not.toContain("sk-test-123")
  })

  test("unknown limits stay 0 (don't second-guess what opencode already knows)", () => {
    const clean = normalizeCloudModel({ ...cloud, context: 0, output: undefined })
    expect(clean.context).toBe(0)
    expect(clean.output).toBe(0)
  })

  test("a missing display name or model id is refused", () => {
    expect(() => normalizeCloudModel({ ...cloud, name: " " })).toThrow(/显示名/)
    expect(() => normalizeCloudModel({ ...cloud, model: "" })).toThrow(/模型 ID/)
    expect(() => normalizeCloudModel({ ...cloud, providerID: "" })).toThrow(/服务商/)
  })

  test("cloud rows merge into one provider block, and the block carries models only", () => {
    const blocks = cloudProviderConfigs([normalizeCloudModel(cloud), normalizeCloudModel({ ...cloud, model: "MiniMax-M3", context: 0, output: 0 }), normalizeModelServer(draft)])
    expect(Object.keys(blocks)).toEqual(["minimax-cn"])
    const block = blocks["minimax-cn"] as { models: Record<string, { name: string; limit?: unknown; attachment: boolean }> }
    expect(Object.keys(block.models)).toEqual(["MiniMax-M3.1-Flash-Preview", "MiniMax-M3"])
    expect(block.models["MiniMax-M3.1-Flash-Preview"].limit).toEqual({ context: 1000000, output: 512000 })
    // Limits the consultant left blank are not invented — opencode sizes the models its catalog knows.
    expect(block.models["MiniMax-M3"].limit).toBeUndefined()
    // Own servers never sneak into a provider we do not own.
    expect(JSON.stringify(blocks)).not.toContain("openai-compatible")
  })

  test("model refs round-trip, and junk is refused", () => {
    expect(parseModelRef(modelRefOf("minimax-cn", "MiniMax-M3"))).toEqual({ providerID: "minimax-cn", modelID: "MiniMax-M3" })
    expect(parseModelRef("no-slash")).toBeUndefined()
    expect(parseModelRef("/leading")).toBeUndefined()
  })

  test("the default migrates from the old flags, preferring the consultant's own pick", () => {
    const own = { ...normalizeModelServer(draft), id: "abc123", isDefault: true }
    const cloudRow = { ...normalizeCloudModel(cloud), id: "c1" }
    expect(resolveDefaultRef([cloudRow, own], { seedRef: "minimax-cn/MiniMax-M3.1-Flash-Preview" })).toBe("own-abc123/qwen3.8-flash-next")
    expect(resolveDefaultRef([cloudRow], { envDefaultRef: "own/deep", seedRef: "minimax-cn/MiniMax-M3.1-Flash-Preview" })).toBe("own/deep")
    expect(resolveDefaultRef([cloudRow], { seedRef: "minimax-cn/MiniMax-M3.1-Flash-Preview" })).toBe("minimax-cn/MiniMax-M3.1-Flash-Preview")
    // A cloud row flagged in an old file points at its provider, not at an own- provider.
    expect(resolveDefaultRef([{ ...cloudRow, isDefault: true }], { seedRef: "x/y" })).toBe("minimax-cn/MiniMax-M3.1-Flash-Preview")
  })

  test("the picker offers own servers always, cloud models only while this machine holds the login", () => {
    const models = [{ providerID: "minimax-cn" }, { providerID: OWN_ENV_PROVIDER }, { providerID: "own-c1" }, { providerID: "anthropic" }]
    expect(pickerUsable(models, new Set(["minimax-cn"])).map((m) => m.providerID)).toEqual(["minimax-cn", OWN_ENV_PROVIDER, "own-c1"])
    expect(pickerUsable(models, new Set()).map((m) => m.providerID)).toEqual([OWN_ENV_PROVIDER, "own-c1"])
    // A provider list that did not answer filters nothing — no guessing.
    expect(pickerUsable(models, null).length).toBe(4)
    // Plain "own" and "own-<id>" are ours; a real provider that merely starts with those letters is not.
    expect(isOwnProviderId("owncloud")).toBe(false)
    expect(isOwnProviderId(OWN_ENV_PROVIDER)).toBe(true)
    expect(isOwnProviderId("own-c1")).toBe(true)
  })
})

describe("the picker answers from our own config file", () => {
  test("a model the config spells out sees what the file says, not what opencode echoes back", () => {
    // The bug this pins: an injected model opencode did not mark as image-capable must STILL be treated as seeing
    // when the file says so — the label is cosmetic, but the flag also decides whether screenshots are sent.
    expect(seesOfListedModel(true, { capabilities: { input: { image: false } } })).toBe(true)
    expect(seesOfListedModel(false, { capabilities: { input: { image: true } } })).toBe(false)
    // Only models opencode's own catalog describes get to answer for themselves.
    expect(seesOfListedModel(undefined, { capabilities: { input: { image: true } } })).toBe(true)
    expect(seesOfListedModel(undefined, { capabilities: { input: { image: false } }, attachment: true })).toBe(true)
    expect(seesOfListedModel(undefined, undefined)).toBe(false)
  })

  test("thinking levels come out strongest first, unknown names keep opencode's order at the end", () => {
    expect(thinkingOptionsOf(["medium", "max", "thinking"])).toEqual(["max", "thinking", "medium"])
    expect(thinkingOptionsOf(["ultra", "low", "fast"])).toEqual(["low", "ultra", "fast"])
    expect(thinkingOptionsOf([])).toEqual([])
  })

  test("the level actually sent: the consultant's pick wins, then the server's default, then the strongest; nothing unlisted ever goes out", () => {
    expect(resolveThinking(["max", "thinking"], "thinking", "")).toBe("thinking")
    // A saved pick that the model stopped offering is ignored, not sent (opencode would reject it).
    expect(resolveThinking(["thinking"], "ultra", "")).toBe("thinking")
    expect(resolveThinking(["high", "medium"], undefined, "medium")).toBe("medium")
    expect(resolveThinking(["high", "medium"], undefined, "unlisted-default")).toBe("high")
    expect(resolveThinking([], "thinking", "")).toBe("")
  })
})

describe("saving a row finds the row it replaces", () => {
  const cloud: ModelServer = { providerID: "minimax-cn", name: "MiniMax M3", baseURL: "", model: "MiniMax-M3", sees: true, thinkingLevels: [], thinkingDefault: "", context: 0, output: 0 }
  const own: ModelServer = { id: "c1", name: "Qwen", baseURL: "http://x/v1", model: "qwen", sees: true, thinkingLevels: [], thinkingDefault: "", context: 1, output: 1 }

  test("a cloud row matches by provider+model, even when the draft lost its id — never a second card", () => {
    const servers = [{ ...cloud, id: "r1" }]
    expect(upsertIndex(servers, { ...cloud })).toBe(0) // edit path that dropped the id
    expect(upsertIndex(servers, { ...cloud, id: "brand-new-uuid" })).toBe(0) // even a fresh id must not duplicate the ref
    expect(upsertIndex(servers, { ...cloud, model: "MiniMax-M3.1-Flash-Preview" })).toBe(-1) // a different model is a new row
    expect(rowRef({ ...cloud, id: "r1" })).toBe("minimax-cn/MiniMax-M3")
  })

  test("own-server rows match by id only: the same model behind two addresses stays two rows", () => {
    const servers = [own, { ...own, id: "c2", baseURL: "http://y/v1" }]
    expect(upsertIndex(servers, { ...own, name: "Qwen 改名" })).toBe(0)
    expect(upsertIndex(servers, { ...own, id: "c2" })).toBe(1)
    expect(upsertIndex(servers, { ...own, id: undefined })).toBe(-1)
  })
})

describe("a provider counts as logged in only when it holds a credential", () => {
  // Shapes from the 2026-10-01 probe against a live opencode serve: a provider merely declared in the injected
  // config carries no `key` field AT ALL (yet reports itself in `connected`); after auth.set the entry gains `key`.
  test("a config-declared provider without a key is NOT a holder — the exact case the picker got wrong", () => {
    const all = [{ id: "minimax-cn", source: "config", env: [], models: {} }, { id: "opencode" }]
    expect(credentialHolderIds(all)?.has("minimax-cn")).toBe(false)
    expect(credentialHolderIds(all)?.size).toBe(0)
  })

  test("after auth.set the key field appears and the provider counts; empty-ish key values do not", () => {
    expect(credentialHolderIds([{ id: "minimax-cn", key: { type: "api" } }])?.has("minimax-cn")).toBe(true)
    expect(credentialHolderIds([{ id: "anthropic", key: "" }])?.has("anthropic")).toBe(false)
    expect(credentialHolderIds([{ id: "x", key: null }, { id: "", key: { type: "oauth" } }])?.size).toBe(0)
  })

  test("no answer is not an empty answer: the caller must not filter on a guess", () => {
    expect(credentialHolderIds(undefined)).toBeNull()
    expect(credentialHolderIds({})).toBeNull()
  })
})
