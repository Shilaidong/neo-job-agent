import { createEffect, createResource, createSignal, For, Show } from "solid-js"
import { createStore, unwrap } from "solid-js/store"
import { THINKING_LABELS, THINKING_LEVELS, type JevServer, type ModelOption, type ModelServer } from "../../../shared/types"
import type { FeedSchedule, JobSource } from "../../../shared/jobs"
import type { ResumeEngine } from "../../../shared/resume"
import { cleanIpcError } from "./Login"

const neo = window.neo

const EMPTY: ModelServer = { name: "", baseURL: "", apiKey: "", model: "", sees: true, thinkingLevels: ["low", "medium", "high", "xhigh"], thinkingDefault: "medium", context: 262144, output: 65536 }

/** A draft for editing/managing a cloud model row: no address, no thinking levels — but it may carry the provider's API key (typed once per machine, stored plainly on it). */
const cloudDraft = (m: Partial<ModelServer> & { providerID: string; model: string }): ModelServer => ({
  id: m.id,
  providerID: m.providerID,
  name: m.name ?? m.model,
  baseURL: "",
  apiKey: m.apiKey,
  model: m.model,
  sees: m.sees ?? true,
  thinkingLevels: [],
  thinkingDefault: "",
  context: m.context ?? 0,
  output: m.output ?? 0,
})

/** "provider/model" — what the main process stores as the default and the hidden list. */
const rowRef = (s: { providerID?: string; id?: string; model: string }) => `${s.providerID ?? `own-${s.id ?? ""}`}/${s.model}`

const levelLabel = (level: string) => THINKING_LABELS[level] ?? level

/**
 * The settings screen: EVERY model is managed here — the consultant's own servers (add / edit / delete),
 * the cloud rows seeded and editable, and the logged-in cloud models not configured yet.
 * 「设为默认」 sits on every card, one click, effective immediately (an in-place restart, conversation survives).
 */
export function Settings(props: { onBack: () => void; startInAdd?: boolean }) {
  const [data, { refetch }] = createResource(() => neo.listModelServers())
  const [editing, setEditing] = createSignal<ModelServer | null>(null)
  createEffect(() => props.startInAdd && setEditing((e) => e ?? { ...EMPTY }))
  const [error, setError] = createSignal("")
  const [confirmDelete, setConfirmDelete] = createSignal("")
  const [rowNotes, setRowNotes] = createSignal<Record<string, string>>({})

  // The Jev section (2026-10-08): which fast-judgement engine answers during a form, chosen right here.
  const [jevData, { refetch: refetchJev }] = createResource(() => neo.listJevServers())
  const [jevEditing, setJevEditing] = createSignal<string | null>(null)
  const [jevNotes, setJevNotes] = createSignal<Record<string, string>>({})
  const [jevConfirm, setJevConfirm] = createSignal("")
  /**
   * Which row the running Jev actually uses — not just the stored pick. main's activeJevServer falls a
   * deleted (null) default back to the first row; the screen must mark THAT row "在用", or every row
   * would read idle while one is answering (2026-10-11 review P2-4).
   */
  const jevActiveId = () => {
    const d = jevData()
    if (!d) return undefined
    if (d.default === "off") return "off"
    return d.default ?? d.servers[0]?.id
  }

  const guard = async (work: () => Promise<void>) => {
    setError("")
    try {
      await work()
    } catch (err) {
      setError(cleanIpcError(err))
    }
  }

  const testOne = (s: ModelServer) =>
    guard(async () => {
      const r = await neo.testModelServer(s)
      setRowNotes((notes) => ({ ...notes, [s.id ?? ""]: `${r.ok ? "✓" : "✗"} ${r.note}` }))
    })

  const remove = (id: string) =>
    guard(async () => {
      await neo.deleteModelServer(id)
      setConfirmDelete("")
      await refetch()
    })

  const setDefault = (ref: string) =>
    guard(async () => {
      await neo.setModelDefault(ref)
      await refetch()
    })

  const hide = (ref: string) =>
    guard(async () => {
      await neo.hideModel(ref)
      setConfirmDelete("")
      await refetch()
    })

  /** What the cloud card tells the truth with: opencode's own credential list (null = engine not running — promise nothing). */
  const cloudStatus = (s: ModelServer) => {
    const conn = data()?.connected
    if (conn?.includes(s.providerID!)) return { ok: true, text: "✓ 这台电脑上已经能用" }
    if (s.apiKey) return { ok: false, text: conn === null ? "Key 已存——下次打开任务自动生效（内核会当场多重启一次，几秒）" : "Key 已存，登录还没建立（这个服务商的 Key 可能不对，或还没轮到生效）" }
    return { ok: false, text: conn === null ? "还差 Key——点【编辑】填一次，开了任务后这里会告诉你成没成" : "这个模型现在还用不了——点【编辑】把服务商的 API Key 填进来" }
  }

  const unhide = (ref: string) =>
    guard(async () => {
      await neo.unhideModel(ref)
      await refetch()
    })

  const jevTest = (id: string) =>
    guard(async () => {
      const r = await neo.testJevServer(id)
      setJevNotes((notes) => ({ ...notes, [id]: `${r.ok ? "✓" : "✗"} ${r.detail}` }))
    })

  const jevRemove = (id: string) =>
    guard(async () => {
      await neo.deleteJevServer(id)
      setJevConfirm("")
      await refetchJev()
    })

  const jevUnhide = (id: string) =>
    guard(async () => {
      await neo.unhideJevServer(id)
      await refetchJev()
    })

  const jevUse = (id: string | "off") =>
    guard(async () => {
      await neo.setJevDefault(id)
      await refetchJev()
    })

  const defaultRef = () => data()?.defaultRef ?? ""
  /** How to call the default on the top card: a row we manage by name, a logged-in model by label, else the raw ref. */
  const defaultName = () => {
    const ref = defaultRef()
    if (!ref) return ""
    const row = (data()?.servers ?? []).find((s) => rowRef(s) === ref)
    if (row) return `「${row.name}」（模型 ${row.model}）`
    const live = (data()?.liveCloud ?? []).find((m) => `${m.providerID}/${m.modelID}` === ref)
    if (live) return `云端模型「${live.label}」（${live.providerID}/${live.modelID}）`
    return ref
  }
  const isDefaultRow = (ref: string) => Boolean(defaultRef()) && ref === defaultRef()

  return (
    <main class="home-main form">
      <div class="home-head">
        <div>
          <p class="kicker">Settings</p>
          <h1>模型</h1>
          <p class="muted">
            所有模型都在这里管：自己的服务器（局域网的 vLLM、Ollama、LM Studio、各种中转——只要是 OpenAI 的接口都能接）、
            云端的 MiniMax，还有 OpenCode 已登录的其他云端模型。每张卡片上直接【设为默认】。
            改动后台当场生效（重启一次，几秒钟），正在进行的对话不受影响，历史都还在。
          </p>
        </div>
        <button onClick={props.onBack}>返回列表</button>
      </div>

      <Show when={error()}><div class="error">{error()}</div></Show>

      <Show
        when={!editing()}
        keyed
        fallback={
          editing()!.providerID ? (
            <CloudModelForm draft={editing()!} onSaved={async () => { setEditing(null); await refetch() }} onCancel={() => setEditing(null)} />
          ) : (
            <ServerForm draft={editing()!} onSaved={async () => { setEditing(null); await refetch() }} onCancel={() => setEditing(null)} />
          )
        }
      >
        <div class="card">
          <div class="card-head">打开任务时默认用哪个</div>
          <Show
            when={defaultRef()}
            fallback={<p class="muted small">现在没有单独指定，打开任务直接用兜底的 MiniMax M3.1。</p>}
          >
            <p class="muted small">
              现在默认是 {defaultName()}。它那一次用不了（服务器不在网、云端登录掉了），会自动改用兜底的 MiniMax（M3.1 → M3），并在右边提示你一声。
            </p>
          </Show>
        </div>

        <Show when={!data.loading} fallback={<p class="hint">正在读取…</p>}>
        <For each={data()?.servers ?? []}>
          {(s) => (
            <div class="card">
              <div class="card-head">
                {s.name}
                <Show when={s.providerID}><span class="tag">云端</span></Show>
                <Show when={isDefaultRow(rowRef(s))}><span class="tag on">默认</span></Show>
                <Show when={!s.sees}><span class="tag">看不了图</span></Show>
                <Show when={!s.providerID && !s.thinkingLevels.length}><span class="tag">不思考</span></Show>
              </div>
              <Show
                when={s.providerID}
                fallback={<p class="muted small">{s.baseURL} · 模型 {s.model} · 默认思考档「{levelLabel(s.thinkingDefault)}」· 上下文 {s.context} / 单次输出上限 {s.output}</p>}
              >
                <p class="muted small">
                  模型 {s.model} · 服务商 {s.providerID}
                  {s.context > 0 ? ` · 上下文 ${s.context} / 单次输出上限 ${s.output}` : " · 上下文按 OpenCode 的目录"}
                </p>
                <p class={cloudStatus(s).ok ? "muted small" : "note small"} style={{ "margin-top": "2px" }}>{cloudStatus(s).text}</p>
              </Show>
              <Show when={rowNotes()[s.id ?? ""]}><p class={rowNotes()[s.id ?? ""].startsWith("✓") ? "muted" : "error"}>{rowNotes()[s.id ?? ""]}</p></Show>
              <div class="row end">
                <Show
                  when={confirmDelete() !== s.id}
                  fallback={
                    <>
                      <span class="muted small">
                        {s.providerID
                          ? "它会从模型列表和选择器里消失，重启也不会再回来；这台电脑上的服务商登录和 Key 都不动，之后重新添加不用重新填。删错了在最下面的「删错了？在这里恢复」点一下就行。"
                          : "删除后模型列表里就没有它了（这台自己配的服务器会整条删掉）。"}
                      </span>
                      <button onClick={() => setConfirmDelete("")}>留着</button>
                      <button class="primary" onClick={() => (s.providerID ? hide(rowRef(s)) : remove(s.id!))}>确定删除</button>
                    </>
                  }
                >
                  <Show when={!s.providerID}>
                    <button onClick={() => testOne(s)}>测试连接</button>
                  </Show>
                  <button onClick={() => { setRowNotes({}); setEditing(s.providerID ? cloudDraft({ ...s, providerID: s.providerID }) : { ...EMPTY, ...s, apiKey: s.apiKey ?? "" }) }}>编辑</button>
                  <button onClick={() => setConfirmDelete(s.id!)}>删除</button>
                  <Show when={!isDefaultRow(rowRef(s))}>
                    <button class="primary" onClick={() => setDefault(rowRef(s))}>设为默认</button>
                  </Show>
                </Show>
              </div>
            </div>
          )}
        </For>

        <Show when={data()?.fileServer}>
          {(fs) => (
            <div class="card">
              <div class="card-head">{fs().name}<span class="tag">只读</span></div>
              <p class="muted small">{fs().baseURL} · 模型 {fs().model} · 默认思考档「{levelLabel(fs().thinkingDefault)}」</p>
              <p class="muted small">这一台写在配置文件里（开发机是 .env.local，装好的应用是 local.env；自检也靠它），界面上改不了也删不掉。想让它听界面的，就在文件里删掉那几行 NEO_LOCAL_ 开头的行，再在这里「添加自己的模型服务器」。</p>
            </div>
          )}
        </Show>

        <Show when={(data()?.liveCloud ?? []).length > 0}>
          <div class="card-head" style={{ margin: "18px 0 8px" }}>已登录、还没写进上面的云端模型</div>
          <p class="muted small" style={{ "margin-bottom": "8px" }}>也可以直接设为默认或删除；想改它的显示名或参数，点【改成配置】就变成上面可编辑的卡片。</p>
          <For each={data()?.liveCloud ?? []}>
            {(m) => (
              <div class="card">
                <div class="card-head">
                  {m.label}
                  <span class="tag">云端</span>
                  <Show when={isDefaultRow(`${m.providerID}/${m.modelID}`)}><span class="tag on">默认</span></Show>
                  <Show when={!m.sees}><span class="tag">看不了图</span></Show>
                </div>
                <p class="muted small">{m.provider} · 模型 {m.modelID}</p>
                <div class="row end">
                  <button onClick={() => setEditing(cloudDraft({ providerID: m.providerID, model: m.modelID, name: m.label, sees: m.sees }))}>改成配置</button>
                  <button onClick={() => hide(`${m.providerID}/${m.modelID}`)}>删除</button>
                  <Show when={!isDefaultRow(`${m.providerID}/${m.modelID}`)}>
                    <button class="primary" onClick={() => setDefault(`${m.providerID}/${m.modelID}`)}>设为默认</button>
                  </Show>
                </div>
              </div>
            )}
          </For>
        </Show>

        <Show when={(data()?.hidden ?? []).length > 0}>
          <div class="card">
            <div class="card-head">删错了？在这里恢复（{data()!.hidden.length} 个）</div>
            <p class="muted small">这些是你删掉的云端模型。恢复后回到上面的列表；服务商的登录和 Key 都还在，不用重填。</p>
            <For each={data()!.hidden}>
              {(ref) => (
                <div class="row end" style={{ "margin-top": "6px" }}>
                  <span class="muted small">{ref}</span>
                  <button onClick={() => unhide(ref)}>恢复</button>
                </div>
              )}
            </For>
          </div>
        </Show>
        </Show>

        <div class="row end">
          <button class="primary big" onClick={() => { setRowNotes({}); setEditing({ ...EMPTY }) }}>添加自己的模型服务器</button>
        </div>

        <div class="card-head" style={{ margin: "26px 0 8px" }}>Jev —— 填表时的快判断</div>
        <p class="muted small" style={{ "margin-bottom": "8px" }}>
          大模型管「填什么」，Jev 管「这个格子对的是哪一个」——一次判断约 0.1~0.3 秒。下面用哪一条就在这里切换；名字、地址、Key、模型名都可以改。
          整体不用也行：关掉它，这些判断全交大模型，就是慢一点，进度和答案库不受影响。
        </p>
        <Show when={!jevData.loading} fallback={<p class="hint">正在读取…</p>}>
          <For each={jevData()?.servers ?? []}>
            {(j) => (
              <Show
                when={jevEditing() !== j.id}
                fallback={<JevForm draft={j} onSaved={async () => { setJevEditing(null); await refetchJev() }} onCancel={() => setJevEditing(null)} />}
              >
                <div class="card">
                  <div class="card-head">
                    {j.name}
                    <Show when={jevActiveId() === j.id}><span class="tag on">在用</span></Show>
                  </div>
                  <p class="muted small">
                    {j.baseURL} · 模型 {j.model}
                    {!j.apiKey && j.id === "seed-cloud-jev" ? " · Key 用这台电脑配置文件里的那份（想写进这一条，点【编辑】填）" : ""}
                  </p>
                  <Show when={jevNotes()[j.id ?? ""]}><p class={jevNotes()[j.id ?? ""].startsWith("✓") ? "muted" : "error"}>{jevNotes()[j.id ?? ""]}</p></Show>
                  <div class="row end">
                    <Show
                      when={jevConfirm() !== j.id}
                      fallback={
                        <>
                          <span class="muted small">删掉后列表里就没有它了，重启也不会回来；删错了在下面「删错了？在这里恢复」点一下就回来。</span>
                          <button onClick={() => setJevConfirm("")}>留着</button>
                          <button class="primary" onClick={() => jevRemove(j.id!)}>确定删除</button>
                        </>
                      }
                    >
                      <button onClick={() => jevTest(j.id!)}>测试连接</button>
                      <button onClick={() => { setJevNotes({}); setJevEditing(j.id!) }}>编辑</button>
                      <button onClick={() => setJevConfirm(j.id!)}>删除</button>
                      <Show when={jevActiveId() !== j.id}><button class="primary" onClick={() => jevUse(j.id!)}>用它</button></Show>
                    </Show>
                  </div>
                </div>
              </Show>
            )}
          </For>

          <div class="card">
            <div class="card-head">不用 Jev<Show when={jevActiveId() === "off"}><span class="tag on">在用</span></Show></div>
            <p class="muted small">「哪一个」的判断全部交给大模型——填表会慢一点，别的都不受影响。</p>
            <Show when={jevActiveId() !== "off"}><div class="row end"><button class="primary" onClick={() => jevUse("off")}>不用 Jev</button></div></Show>
          </div>

          <Show when={(jevData()?.hidden ?? []).length > 0}>
            <div class="card">
              <div class="card-head">删错了？在这里恢复（{jevData()!.hidden.length} 个）</div>
              <For each={jevData()!.hidden}>
                {(h) => (
                  <div class="row end" style={{ "margin-top": "6px" }}>
                    <span class="muted small">{h.name}</span>
                    <button onClick={() => jevUnhide(h.id)}>恢复</button>
                  </div>
                )}
              </For>
            </div>
          </Show>

          <Show when={jevEditing() !== "new"} fallback={<JevForm draft={{ name: "", baseURL: "", apiKey: "", model: "jev-latest" }} onSaved={async () => { setJevEditing(null); await refetchJev() }} onCancel={() => setJevEditing(null)} />}>
            <div class="row end"><button class="primary big" onClick={() => { setJevNotes({}); setJevEditing("new") }}>添加一条 Jev</button></div>
          </Show>
        </Show>

        <FeedSettingsSection />

      </Show>
    </main>
  )
}

/** The inline form of a Jev row (2026-10-08): the row's four fields, nothing more. */
function JevForm(props: { draft: JevServer; onSaved: () => Promise<void> | void; onCancel: () => void }) {
  const [server, setServer] = createStore<JevServer>({ ...props.draft })
  const [busy, setBusy] = createSignal(false)
  const [error, setError] = createSignal("")

  const save = async () => {
    setBusy(true)
    setError("")
    try {
      await neo.saveJevServer(unwrap(server)) // unwrap: a Solid proxy does not survive IPC
      await props.onSaved()
    } catch (err) {
      setError(cleanIpcError(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div class="card">
      <div class="card-head">{props.draft.id ? `修改「${props.draft.name || "未命名"}」` : "添加一条 Jev"}</div>
      <div class="field-grid">
        <label class="field">
          <span>名称</span>
          <input value={server.name} placeholder="比如：Jev（局域网集群）" onInput={(e) => setServer("name", e.currentTarget.value)} />
        </label>
        <label class="field">
          <span>模型名（服务器对它的写法）</span>
          <input value={server.model} placeholder="比如：jev-latest" onInput={(e) => setServer("model", e.currentTarget.value)} />
        </label>
        <label class="field wide">
          <span>接口地址（填到 /v1 为止，程序自己去找 /systemone）</span>
          <input value={server.baseURL} placeholder="比如：http://10.0.0.109/v1" onInput={(e) => setServer("baseURL", e.currentTarget.value)} />
        </label>
        <label class="field">
          <span>认证 Key（没有就留空）</span>
          <input value={server.apiKey ?? ""} placeholder="配置单里给的那串" onInput={(e) => setServer("apiKey", e.currentTarget.value)} />
        </label>
      </div>
      <Show when={error()}><p class="error">{error()}</p></Show>
      <div class="row end">
        <button onClick={props.onCancel}>取消</button>
        <button class="primary" disabled={busy()} onClick={save}>保存</button>
      </div>
    </div>
  )
}

/**
 * One entry's form. The draft lives INSIDE this component (a local store): typing must not re-run the parent's
 * `editing` signal, or the whole form would be rebuilt under the cursor on every keystroke.
 */
function ServerForm(props: { draft: ModelServer; onSaved: () => Promise<void> | void; onCancel: () => void }) {
  const [server, setServer] = createStore<ModelServer>({ ...props.draft })
  const [busy, setBusy] = createSignal(false)
  const [error, setError] = createSignal("")
  const [test, setTest] = createSignal<{ ok: boolean; note: string } | null>(null)

  const guard = async (work: () => Promise<void>) => {
    setBusy(true)
    setError("")
    try {
      await work()
    } catch (err) {
      setError(cleanIpcError(err))
    } finally {
      setBusy(false)
    }
  }

  const toggleLevel = (level: string) => {
    const has = server.thinkingLevels.includes(level)
    const levels = has ? server.thinkingLevels.filter((l) => l !== level) : [...server.thinkingLevels, level]
    setServer({ thinkingLevels: levels, thinkingDefault: levels.includes(server.thinkingDefault) ? server.thinkingDefault : (levels[levels.length - 1] ?? "") })
  }

  // `{ ...server }` is not enough over IPC: a spread leaves nested values (thinkingLevels) as Solid proxies,
  // and Electron's structured clone rejects proxies with "An object could not be cloned". unwrap returns the plain tree.
  const payload = (): ModelServer => unwrap(server)

  const runTest = () =>
    guard(async () => {
      const r = await neo.testModelServer(payload())
      setTest({ ok: r.ok, note: r.note })
    })

  const save = () =>
    guard(async () => {
      await neo.saveModelServer(payload())
      await props.onSaved()
    })

  return (
    <div class="form-section">
      <div class="section-head">
        <div>
          <h2>{props.draft.id ? `修改「${props.draft.name || "未命名"}」` : "添加一台模型服务器"}</h2>
          <p class="muted">照服务器那边给的配置单填。填完可以先「测试连接」，确认这台现在就在，再保存。</p>
        </div>
      </div>

      <div class="field-grid">
        <label class="field">
          <span>名称（模型列表里显示这个）</span>
          <input value={server.name} placeholder="比如：局域网 Qwen" onInput={(e) => setServer("name", e.currentTarget.value)} />
        </label>
        <label class="field">
          <span>模型 ID（服务器对它的写法）</span>
          <input value={server.model} placeholder="比如：qwen3.8-flash-next" onInput={(e) => setServer("model", e.currentTarget.value)} />
        </label>
        <label class="field wide">
          <span>接口地址</span>
          <input value={server.baseURL} placeholder="比如：http://10.0.0.109/v1" onInput={(e) => { setServer("baseURL", e.currentTarget.value); setTest(null) }} />
        </label>
        <label class="field">
          <span>认证 Key（没有就留空）</span>
          <input value={server.apiKey ?? ""} placeholder="服务器那边给的那串" onInput={(e) => setServer("apiKey", e.currentTarget.value)} />
        </label>
        <label class="field">
          <span>默认思考强度</span>
          <select value={server.thinkingDefault} disabled={server.thinkingLevels.length === 0} onChange={(e) => setServer("thinkingDefault", e.currentTarget.value)}>
            <Show when={server.thinkingLevels.length === 0}><option value="">（上面一个档都没勾，不思考）</option></Show>
            <For each={server.thinkingLevels}>{(level) => <option value={level}>{levelLabel(level)}</option>}</For>
          </select>
        </label>
        <div class="field wide">
          <span>这台服务器支持的思考档位（勾它认识的；发消息时按这里写的 reasoning_effort 传）</span>
          <div class="row wrap">
            <For each={THINKING_LEVELS}>
              {(level) => (
                <label class="check">
                  <input type="checkbox" checked={server.thinkingLevels.includes(level)} onChange={() => toggleLevel(level)} />
                  <span>{levelLabel(level)}</span>
                </label>
              )}
            </For>
          </div>
        </div>
        <label class="field">
          <span>总上下文（token）</span>
          <input type="number" min={1} value={server.context} onInput={(e) => setServer("context", Number(e.currentTarget.value) || 0)} />
        </label>
        <label class="field">
          <span>单次输出上限（token，思考的内容也算在内）</span>
          <input type="number" min={1} value={server.output} onInput={(e) => setServer("output", Number(e.currentTarget.value) || 0)} />
        </label>
        <div class="note wide"><small>上下文和输出上限照服务器配置单上写的填；不确定就留空，会按 262144 / 65536 记。</small></div>
        <div class="check wide">
          <label class="check">
            <input type="checkbox" checked={server.sees} onChange={(e) => setServer("sees", e.currentTarget.checked)} />
            <span>这台能看图（会给它发带编号的截图）。纯文字的服务器关掉它，不然它会对截图报错。</span>
          </label>
        </div>
      </div>

      <Show when={test()}>
        {(t) => <p class={t().ok ? "muted" : "error"}>{t().ok ? "✓ " : "✗ "}{t().note}</p>}
      </Show>
      <Show when={error()}><div class="error">{error()}</div></Show>

      <div class="row end">
        <button onClick={props.onCancel}>取消</button>
        <button disabled={busy()} onClick={runTest}>{busy() ? "请稍候…" : "测试连接"}</button>
        <button class="primary big" disabled={busy()} onClick={save}>{busy() ? "正在保存…" : "保存"}</button>
      </div>
    </div>
  )
}

/**
 * The short form for a CLOUD model row: the address, the key and the login are opencode's own — nothing to fill here
 * but the display name, the model id (opencode's catalog may not list a newer id yet), whether it sees, and the limits.
 */
function CloudModelForm(props: { draft: ModelServer; onSaved: () => Promise<void> | void; onCancel: () => void }) {
  const [server, setServer] = createStore<ModelServer>({ ...props.draft })
  const [busy, setBusy] = createSignal(false)
  const [error, setError] = createSignal("")

  const guard = async (work: () => Promise<void>) => {
    setBusy(true)
    setError("")
    try {
      await work()
    } catch (err) {
      setError(cleanIpcError(err))
    } finally {
      setBusy(false)
    }
  }

  const payload = (): ModelServer => unwrap(server)

  const save = () =>
    guard(async () => {
      await neo.saveModelServer(payload())
      await props.onSaved()
    })

  return (
    <div class="form-section">
      <div class="section-head">
        <div>
          <h2>配置云端模型「{server.name || server.model}」</h2>
          <p class="muted">服务商：{server.providerID}（地址由 OpenCode 自己认，这里不填）。第一次用这个服务商，把它的 API Key 填在下面——存这台电脑上，一次就够。</p>
        </div>
      </div>

      <div class="field-grid">
        <label class="field">
          <span>显示名（模型列表里显示这个）</span>
          <input value={server.name} placeholder="比如：MiniMax M3.1 Flash Preview" onInput={(e) => setServer("name", e.currentTarget.value)} />
        </label>
        <label class="field">
          <span>模型 ID（服务商对它的写法）</span>
          <input value={server.model} placeholder="比如：MiniMax-M3.1-Flash-Preview" onInput={(e) => setServer("model", e.currentTarget.value)} />
        </label>
        <label class="field wide">
          <span>API Key（服务商给的那串；MiniMax 的在 MiniMax 开放平台账号页拿）</span>
          <input value={server.apiKey ?? ""} placeholder="没有就留空——留空这个模型在这台电脑上用不了" onInput={(e) => setServer("apiKey", e.currentTarget.value)} />
        </label>
        <label class="field">
          <span>总上下文（token，留空=不写，听 OpenCode 目录的）</span>
          <input type="number" min={1} value={server.context || ""} placeholder="留空" onInput={(e) => setServer("context", Number(e.currentTarget.value) || 0)} />
        </label>
        <label class="field">
          <span>单次输出上限（token，留空=不写）</span>
          <input type="number" min={1} value={server.output || ""} placeholder="留空" onInput={(e) => setServer("output", Number(e.currentTarget.value) || 0)} />
        </label>
        <div class="check wide">
          <label class="check">
            <input type="checkbox" checked={server.sees} onChange={(e) => setServer("sees", e.currentTarget.checked)} />
            <span>这个模型能看图（会给它发带编号的截图）。看不了图的关掉它。</span>
          </label>
        </div>
        <div class="note wide"><small>Key 只存在这台电脑的应用数据里，不会进日志，也不进模型能看到的任何东西。模型 ID 写给服务商的最新叫法就行——OpenCode 目录里还没有的，会按这里填的注入进去；上下文和上限不确定就留空，OpenCode 认识这个模型的话用它自己的数。</small></div>
      </div>

      <Show when={error()}><div class="error">{error()}</div></Show>

      <div class="row end">
        <button onClick={props.onCancel}>取消</button>
        <button class="primary big" disabled={busy()} onClick={save}>{busy() ? "正在保存…" : "保存"}</button>
      </div>
    </div>
  )
}


/**
 * 岗位中心 + 简历的设置（2026-10-17）：数据源、抓取时间、引擎状态。数据仍然都在这台电脑上。
 */
function FeedSettingsSection() {
  const [overview, { refetch }] = createResource(() => neo.feedOverview())
  const [sources, setSources] = createStore<JobSource[]>([])
  createEffect(() => {
    const ov = overview()
    if (ov) {
      if (sources.length === 0 || sources.length !== ov.sources.length) setSources([...ov.sources])
    }
  })
  const [schedule, setSchedule] = createStore<FeedSchedule>({ enabled: true, beijing: "13:00", eastern: "13:00", catchUpOnLaunch: true })
  createEffect(() => {
    const ov = overview()
    if (ov) setSchedule({ ...ov.schedule })
  })
  const [newSrc, setNewSrc] = createStore<{ name: string; kind: JobSource["kind"]; url: string }>({ name: "", kind: "rss", url: "" })
  const [busy, setBusy] = createSignal(false)
  const [saved, setSaved] = createSignal("")
  const [error, setError] = createSignal("")
  const [engine, { refetch: refetchEngine }] = createResource<ResumeEngine>(() => neo.resumeEngine())

  const patchSource = (index: number, patch: Partial<JobSource>) => setSources(index, patch as any)

  const addSource = () => {
    if (!newSrc.name.trim() || !newSrc.url.trim()) return
    setSources(sources.length, { id: `custom-${Date.now()}`, name: newSrc.name.trim(), kind: newSrc.kind, url: newSrc.url.trim(), enabled: true })
    setNewSrc({ name: "", kind: newSrc.kind, url: "" })
  }

  const guard = async (work: () => Promise<void>) => {
    setBusy(true)
    setError("")
    try {
      await work()
      setSaved("已保存，下次抓取生效")
      setTimeout(() => setSaved(""), 4000)
      await refetch()
    } catch (err) {
      setError(cleanIpcError(err))
    } finally {
      setBusy(false)
    }
  }

  const saveSourcesOnly = () => guard(async () => {
    await neo.saveFeedSources([...sources])
  })

  const saveTime = () => guard(async () => {
    await neo.saveFeedSchedule({ ...schedule })
  })

  const runNow = () =>
    guard(async () => {
      await neo.runFeedNow()
      setSaved("抓取完成")
    })

  const resetEngine = async () => {
    try {
      await neo.resumeEngineReset()
      await refetchEngine()
    } catch (err) {
      setError(cleanIpcError(err))
    }
  }

  const last = overview()?.lastRun

  return (
    <>
      <div class="card-head" style={{ margin: "26px 0 8px" }}>岗位中心 —— 每天抓什么、什么时候抓</div>
      <p class="muted small" style={{ "margin-bottom": "8px" }}>
        LinkedIn / Indeed 的 RSS 和 Greenhouse / Lever / Ashby 的公开招聘接口，全部拉回本机保存；按学生的求职目标筛。抓取的频率写在「岗位中心」页。
      </p>
      <Show when={!overview.loading} fallback={<p class="hint">正在读取…</p>}>
        <Show when={overview()}>
          {(ov) => (
            <>
              <div class="card">
                <div class="card-head">数据源</div>
                <For each={sources}>
                  {(src, i) => (
                    <div class="task-line" style={{ "align-items": "center" }}>
                      <label class="check" style={{ "min-width": "22px" }}>
                        <input type="checkbox" checked={src.enabled} onChange={(e) => patchSource(i(), { enabled: e.currentTarget.checked })} />
                      </label>
                      <div class="task-id" style={{ flex: 1 }}>
                        <strong>{src.name}</strong>
                        <span class="muted small">{modelKind(src.kind)} · {src.url}</span>
                      </div>
                      <button class="chip" onClick={() => setSources((list) => list.filter((_, idx) => idx !== i()))}>移除</button>
                    </div>
                  )}
                </For>
                <div class="pick-row wide" style={{ "display": "flex", "gap": "6px", "margin": "8px 0" }}>
                  <select value={newSrc.kind} onChange={(e) => setNewSrc("kind", e.currentTarget.value as JobSource["kind"])}>
                    <option value="rss">RSS 订阅</option>
                    <option value="greenhouse">Greenhouse 招聘板</option>
                    <option value="lever">Lever 招聘板</option>
                    <option value="ashby">Ashby 招聘板</option>
                    <option value="json">通用 JSON</option>
                  </select>
                  <input class="field" style={{ flex: 1 }} placeholder="名称" value={newSrc.name} onInput={(e) => setNewSrc("name", e.currentTarget.value)} />
                  <input class="field" style={{ flex: 2 }} placeholder={newSrc.kind === "rss" || newSrc.kind === "json" ? "完整网址 https://…" : "公司板名，例如 google"} value={newSrc.url} onInput={(e) => setNewSrc("url", e.currentTarget.value)} />
                  <button class="primary" onClick={addSource}>添加</button>
                </div>
                <div class="row end">
                  <button class="primary" disabled={busy()} onClick={saveSourcesOnly}>保存数据源</button>
                </div>
              </div>

              <div class="card">
                <div class="card-head">抓取时间与状态</div>
                <div class="field-grid">
                  <label class="check wide">
                    <input type="checkbox" checked={schedule.enabled} onChange={(e) => setSchedule("enabled", e.currentTarget.checked)} />
                    <span>开启定时抓取</span>
                  </label>
                  <label class="field"><span>北京时间</span><input value={schedule.beijing} onInput={(e) => setSchedule("beijing", e.currentTarget.value)} placeholder="13:00" /></label>
                  <label class="field"><span>美国东部时间</span><input value={schedule.eastern} onInput={(e) => setSchedule("eastern", e.currentTarget.value)} placeholder="13:00" /></label>
                  <label class="check wide">
                    <input type="checkbox" checked={Boolean(schedule.catchUpOnLaunch)} onChange={(e) => setSchedule("catchUpOnLaunch", e.currentTarget.checked)} />
                    <span>错过的时间点，下次打开软件时补抓</span>
                  </label>
                </div>
                <div class="row end">
                  <button disabled={busy()} onClick={runNow}>{busy() ? "抓取中…" : "立即抓取"}</button>
                  <button class="primary" disabled={busy()} onClick={saveTime}>保存时间</button>
                </div>
                <p class="muted small" style={{ "margin-top": "8px" }}>
                  {last ? `上次：${new Date(last.finishedAt).toLocaleString()}，抓到 ${last.fetched} 条 / 新 ${last.new} 条${last.failed.length ? `，失败 ${last.failed.length} 个来源` : ""}` : "还没抓过。"}
                </p>
                <Show when={last?.failed.length}>
                  <p class="error small">{last!.failed.slice(0, 5).join("；")}</p>
                </Show>
              </div>

              <Show when={saved()}><p class="muted">{saved()}</p></Show>
              <Show when={error()}><div class="error">{error()}</div></Show>
            </>
          )}
        </Show>
      </Show>

      <div class="card-head" style={{ margin: "26px 0 8px" }}>简历（LaTeX）</div>
      <Show when={!engine.loading} fallback={<p class="hint">正在检测…</p>}>
        <div class="card">
          <div class="card-head">编译引擎</div>
          <p class={engine()?.kind === "none" ? "note" : "muted small"}>{engine()?.note}</p>
          <div class="row end">
            <button onClick={resetEngine}>重新检测</button>
          </div>
        </div>
      </Show>
    </>
  )
}

function modelKind(kind: JobSource["kind"]): string {
  return { rss: "RSS 订阅", greenhouse: "Greenhouse 招聘板", lever: "Lever 招聘板", ashby: "Ashby 招聘板", json: "通用 JSON" }[kind] ?? kind
}
