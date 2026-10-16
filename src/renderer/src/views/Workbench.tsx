import DOMPurify from "dompurify"
import { marked } from "marked"
import { createEffect, createMemo, createSignal, For, Match, onCleanup, onMount, Show, Switch } from "solid-js"
import { createStore, produce, reconcile } from "solid-js/store"
import { THINKING_LABELS, type AppState, type NavState, type RiskAsk, type TabInfo } from "../../../shared/types"
import { toolDetail, toolLabel } from "../labels"

type Part = { id: string; messageID: string; type: string; [key: string]: any }
type Message = { id: string; role: "user" | "assistant"; error?: string; parts: Part[] }
type QuestionRequest = { id: string; questions: Array<{ header: string; question: string; options: Array<{ label: string; description: string }>; multiple?: boolean; custom?: boolean }> }

const neo = window.neo
marked.setOptions({ gfm: true, breaks: true })
const markdown = (text: string) => DOMPurify.sanitize(marked.parse(text, { async: false }) as string)

/** Inside a task: the page lives on the left (a native view under `.page-slot`), the conversation on the right. */
export function Workbench(props: { app: AppState; setApp: (next: AppState) => void; devView: () => string }) {
  const app = () => props.app
  const setApp = props.setApp
  const [nav, setNav] = createSignal<NavState>({ url: "", title: "", canGoBack: false, canGoForward: false, loading: false, inEgo: false })
  const [address, setAddress] = createSignal("")
  /** The embedded stage's tabs (2026-10-16 多标签): site popups land here, the active one is inked. */
  const [tabStrip, setTabStrip] = createSignal<TabInfo[]>([])
  const [messages, setMessages] = createStore<Message[]>([])
  const [questions, setQuestions] = createStore<QuestionRequest[]>([])
  const [risks, setRisks] = createStore<RiskAsk[]>([])
  const [busy, setBusy] = createSignal(false)
  const [activity, setActivity] = createSignal("")
  const [draft, setDraft] = createSignal("")
  const [notice, setNotice] = createSignal("")
  const [materials, setMaterials] = createSignal<{ done: number; total: number; current: string } | null>(null)
  const [menuOpen, setMenuOpen] = createSignal(false)
  let menuWrap!: HTMLDivElement
  let scroller!: HTMLDivElement
  let stick = true

  const upsertMessage = (id: string, patch: Partial<Message>) =>
    setMessages(
      produce((list) => {
        const found = list.find((m) => m.id === id)
        if (found) Object.assign(found, patch)
        else list.push({ id, role: "assistant", parts: [], ...patch })
      }),
    )

  const upsertPart = (part: Part) => {
    if (!messages.some((m) => m.id === part.messageID)) upsertMessage(part.messageID, {})
    setMessages(
      (m) => m.id === part.messageID,
      "parts",
      produce((parts) => {
        const index = parts.findIndex((p) => p.id === part.id)
        if (index >= 0) parts[index] = part
        else parts.push(part)
      }),
    )
  }

  const onEvent = (evt: { type: string; properties: any }) => {
    const p = evt.properties ?? {}
    switch (evt.type) {
      case "message.updated":
        upsertMessage(p.info.id, { role: p.info.role, error: p.info.error ? describeError(p.info.error) : undefined })
        break
      case "message.part.updated":
        upsertPart(p.part)
        break
      case "message.part.delta":
        setMessages((m) => m.id === p.messageID, "parts", (part) => part.id === p.partID, p.field, (old: string) => (old ?? "") + p.delta)
        break
      case "message.removed":
        setMessages((list) => list.filter((m) => m.id !== p.messageID))
        break
      case "message.part.removed":
        setMessages((m) => m.id === p.messageID, "parts", (parts) => parts.filter((x) => x.id !== p.partID))
        break
      case "session.status":
        setBusy(p.status?.type !== "idle")
        if (p.status?.type === "retry") setActivity(`模型暂时没响应，正在重试（第 ${p.status.attempt} 次）`)
        break
      case "session.idle":
        setBusy(false)
        setActivity("")
        break
      case "session.error":
        setNotice(describeError(p.error))
        setBusy(false)
        break
      case "question.asked":
        if (!questions.some((q) => q.id === p.id)) setQuestions(questions.length, { id: p.id, questions: p.questions })
        break
      case "question.replied":
      case "question.rejected":
        setQuestions((list) => list.filter((q) => q.id !== p.requestID))
        break
    }
    queueMicrotask(scrollToEnd)
  }

  const scrollToEnd = () => {
    if (stick && scroller) scroller.scrollTop = scroller.scrollHeight
  }

  const reload = async () => {
    const history = await neo.history()
    setMessages(reconcile(history.map((m) => ({ id: m.info.id, role: m.info.role, error: m.info.error ? describeError(m.info.error) : undefined, parts: m.parts }))))
    setQuestions(reconcile(await neo.pendingQuestions()))
    queueMicrotask(scrollToEnd)
  }

  onMount(async () => {
    const offs = [
      neo.on("oc:event", onEvent),
      neo.on("nav:state", (s: NavState) => setNav(s)),
      neo.on("tabs:state", (list: TabInfo[]) => setTabStrip(list)),
      neo.on("notice", (text: string) => setNotice(text)),
      neo.on("materials:progress", (progress) => setMaterials(progress)),
      neo.on("activity", (text: string) => setActivity(text)),
      neo.on("risk:ask", (ask: RiskAsk) => setRisks(risks.length, ask)),
      neo.on("risk:closed", (id: string) => setRisks((list) => list.filter((r) => r.id !== id))),
    ]
    onCleanup(() => offs.forEach((off) => off()))
    setNav(await neo.getNav())
    setTabStrip(await neo.tabsList())
  })

  // A different conversation (another task, "新对话") means a different transcript.
  createEffect(() => {
    const ready = app().phase === "ready" && app().sessionID
    if (ready) void reload()
  })

  createEffect(() => setAddress(nav().url.startsWith("file:") ? "" : nav().url))

  // The strip only earns its room when there is something to switch between; ego pages have their own
  // window's real tabs, so the embedded strip steps aside there.
  const showTabs = createMemo(() => !nav().inEgo && tabStrip().length > 1)

  const send = async () => {
    const text = draft().trim()
    if (!text || app().phase !== "ready") return
    setDraft("")
    setNotice("")
    stick = true
    // A typed reply answers the open question, so the consultant can just talk.
    if (questions.length === 1 && questions[0].questions.length === 1) {
      await neo.replyQuestion(questions[0].id, [[text]])
      return
    }
    setBusy(true)
    await neo.send(text).catch((error) => (setNotice(String(error.message || error)), setBusy(false)))
  }

  // Read the list here too: Solid writes select.value when THIS memo changes — if the options arrive one tick later
  // (first load), the value was set against an empty select and never re-applied (task view then showed 「默认模型」
  // while a specific model was in use). Depending on the list makes the write run again after the options exist.
  const modelValue = createMemo(() => (app().models.length && app().model ? `${app().model!.providerID}/${app().model!.modelID}` : ""))
  /** The option row for the model in use: it carries the thinking levels this model offers and the consultant's saved pick. */
  const currentModel = createMemo(() => app().models.find((m) => m.providerID === app().model?.providerID && m.modelID === app().model?.modelID))
  const providers = createMemo(() => {
    const groups = new Map<string, AppState["models"]>()
    for (const m of app().models) groups.set(m.provider, [...(groups.get(m.provider) ?? []), m])
    return [...groups.entries()]
  })

  const startResize = (down: PointerEvent) => {
    const handle = down.currentTarget as HTMLElement
    handle.setPointerCapture(down.pointerId)
    const move = (e: PointerEvent) => {
      const width = window.innerWidth - e.clientX
      document.documentElement.style.setProperty("--sidebar", `${Math.min(760, Math.max(340, width))}px`)
      void neo.setSidebarWidth(width)
    }
    const up = () => (handle.removeEventListener("pointermove", move), handle.removeEventListener("pointerup", up))
    handle.addEventListener("pointermove", move)
    handle.addEventListener("pointerup", up)
  }

  // ☰ menu closes on a pointerdown outside the ☰+panel pair (capture phase, so nothing in the sidebar can
  // stop it first; clicks inside either part never close it, so the ☰ button itself still toggles).
  // Honest limit: the left page is a native WebContentsView — clicks there never reach this document, so
  // the menu cannot hear them. What it can hear is the page reacting: a navigation closes the menu below.
  const closeMenuIfOutside = (e: Event) => {
    if (menuWrap && !menuWrap.contains(e.target as Node)) setMenuOpen(false)
  }
  createEffect(() => {
    if (menuOpen()) document.addEventListener("pointerdown", closeMenuIfOutside, true)
    else document.removeEventListener("pointerdown", closeMenuIfOutside, true)
  })
  onCleanup(() => document.removeEventListener("pointerdown", closeMenuIfOutside, true))
  let lastSeenUrl = ""
  createEffect(() => {
    const url = nav().url
    if (lastSeenUrl && url !== lastSeenUrl) setMenuOpen(false)
    lastSeenUrl = url
  })
  // Dev screenshot hook (NEO_SHOT_VIEW=menu): open the menu so the shot shows it open.
  createEffect(() => {
    if (props.devView() === "menu") setMenuOpen(true)
  })

  return (
    <div class="shell">
      <section class="stage">
      <header class="toolbar">
        <button title="后退" disabled={!nav().canGoBack} onClick={() => neo.goBack()}>‹</button>
        <button title="前进" disabled={!nav().canGoForward} onClick={() => neo.goForward()}>›</button>
        <button title="刷新" onClick={() => neo.reload()}>{nav().loading ? "×" : "↻"}</button>
        <Show when={showTabs()}>
          <div class="tabs" role="tablist">
            <For each={tabStrip()}>
              {(t) => (
                <button
                  role="tab"
                  classList={{ tab: true, on: t.active }}
                  title={`${t.title || (t.popup ? "新标签页" : "申请页")} — ${t.url}`}
                  onClick={() => !t.active && neo.activateTab(t.id)}
                >
                  <span class="tab-title">{t.title || (t.popup ? "新标签页" : "投递页")}</span>
                  <span
                    class="tab-x"
                    title="关闭这个标签页"
                    onClick={(e) => (e.stopPropagation(), neo.closeTab(t.id))}
                  >
                    ×
                  </span>
                </button>
              )}
            </For>
          </div>
        </Show>
        <form class="address" classList={{ squeezed: showTabs() }} onSubmit={(e) => (e.preventDefault(), address().trim() && neo.navigate(address().trim()))}>
          <input value={address()} onInput={(e) => setAddress(e.currentTarget.value)} placeholder="输入招聘/投递网址，回车打开" spellcheck={false} />
        </form>
      </header>
        <div class="page-slot" />
      </section>

      <div class="resizer" onPointerDown={startResize} />

      <aside class="sidebar">
        <header class="side-head">
          <div class="brand">
            <button class="back" title="回到投递列表" onClick={() => neo.goHome()}>‹ 列表</button>
            <div class="brand-text" title={app().task ? `${app().task!.input.studentName} · ${app().task!.input.company} · ${app().task!.input.jobTitle}` : "自由对话"}>
              <strong>{app().task ? app().task!.input.company : "自由对话"}</strong>
              <Show when={app().task}><span>{app().task!.input.studentName} · {app().task!.input.jobTitle}</span></Show>
            </div>
            <span class={`dot ${app().phase}`} />
          </div>
          {/* Everything the narrow sidebar could not show next to the title lives behind ☰ (2026-10-05: overflowing
              buttons used to be silently cut off by the sidebar's overflow:hidden). Each row closes the menu. */}
          <div class="side-menu-wrap" ref={menuWrap}>
            <button class="menu-btn" title="全部操作" aria-label="全部操作" aria-expanded={menuOpen()} onClick={() => setMenuOpen((v) => !v)}>☰</button>
            <Show when={menuOpen()}>
              <div class="side-menu">
                <label>
                  模型
                  <select
                    class="model"
                    value={modelValue()}
                    onChange={async (e) => {
                      setMenuOpen(false)
                      const [providerID, ...rest] = e.currentTarget.value.split("/")
                      if (rest.length) setApp({ ...(await neo.setModel({ providerID, modelID: rest.join("/") })) })
                    }}
                  >
                    <option value="">默认模型</option>
                    <For each={providers()}>
                      {([provider, models]) => (
                        <optgroup label={provider}>
                          {/* selected lives on the option (reflected attribute): with it, the right row lights up whenever the
                              list is (re)built — a select-level value write can land before the options exist on first load. */}
                          <For each={models}>{(m) => <option value={`${m.providerID}/${m.modelID}`} selected={modelValue() === `${m.providerID}/${m.modelID}`}>{m.label}</option>}</For>
                        </optgroup>
                      )}
                    </For>
                  </select>
                </label>
                <Show when={(currentModel()?.thinkingOptions?.length ?? 0) > 0}>
                  {/* What the model itself offers (opencode's variants); 自动 = its default, else the strongest. Effective from the next message, remembered per model. */}
                  <label>
                    思考档（下一条消息起生效）
                    <select
                      class="model"
                      value={currentModel()?.thinkingChosen ?? ""}
                      onChange={async (e) => {
                        setMenuOpen(false)
                        const m = currentModel()
                        if (!m) return
                        setApp({ ...(await neo.setModelEffort({ providerID: m.providerID, modelID: m.modelID, level: e.currentTarget.value || null })) })
                      }}
                    >
                      <option value="" selected={!currentModel()?.thinkingChosen}>自动（模型默认）</option>
                      <For each={currentModel()!.thinkingOptions ?? []}>{(level) => <option value={level} selected={currentModel()?.thinkingChosen === level}>{THINKING_LABELS[level] ?? level}</option>}</For>
                    </select>
                  </label>
                </Show>
                <Show when={!app().humanHandoff}>
                  {/* Some pages (人机验证) only a person can pass — and the tools must not even be touching them. */}
                  <button title="你来动手：工具立刻放手，你亲手点验证、输密码；弄完点【我操作完了，交回 AI】" onClick={() => (setMenuOpen(false), neo.handoff(true))}>交给人</button>
                </Show>
                {/* The manual route to ego lite (stage 4): UCAS goes there by itself; any other page comes here
                    when the consultant says so. Session-only — a reopen needs one more click (ROADMAP, honest). */}
                <button
                  title="把这一页搬进 ego lite（真浏览器）里操作：AI 的工具照常干活，人机验证你在 ego 窗口里亲手点；关掉则回内置浏览器"
                  onClick={() => (setMenuOpen(false), neo.taskUseEgo(!nav()?.inEgo))}
                >
                  {nav()?.inEgo ? "回内置浏览器" : "用 ego lite 操作这页"}
                </button>
                <button title="打开工作区文件夹" onClick={() => (setMenuOpen(false), neo.openWorkspace())}>文件夹</button>
                <button title="在访达中显示本次运行的日志文件（报 Bug 时发这个）" onClick={() => (setMenuOpen(false), neo.revealLog())}>日志</button>
                <Show
                  when={app().task}
                  fallback={<button title="开始一段新对话" onClick={async () => (setMenuOpen(false), setApp({ ...(await neo.newChat()) }))}>新对话</button>}
                >
                  <button title="从头重来这份投递：结束当前对话、重新发一遍开头那条指令；文件、进度和答案库都还在，不会重做" onClick={async () => (setMenuOpen(false), setApp({ ...(await neo.newChat()) }))}>重开</button>
                </Show>
              </div>
            </Show>
          </div>
        </header>

        <Show when={app().humanHandoff}>
          <div class="handoff-bar">
            <span>页面交给你了——验证、登录这类是人的事，工具已断开。还在反复验证的话，点左上角刷新让这一页重新跑一遍。弄完点这里，AI 接着干。</span>
            <button class="primary" onClick={() => neo.handoff(false)}>我操作完了，交回 AI</button>
          </div>
        </Show>

        <div class="messages" ref={scroller} onScroll={() => (stick = scroller.scrollHeight - scroller.scrollTop - scroller.clientHeight < 80)}>
          <Switch>
            <Match when={app().phase === "starting"}><p class="hint">正在启动 AI<span class="caret" /></p></Match>
            <Match when={app().phase === "failed"}>
              <div class="error"><strong>AI 没能启动</strong><p>{app().error}</p></div>
            </Match>
            <Match when={messages.length === 0 && !busy()}>
              <div class="hint">
                <p>左边是招聘网页，你可以随时自己动手。</p>
                <Show when={!app().task}><p>这里是自由对话，没有绑定任何投递，适合在练习表上试一试。</p></Show>
                <p>最终提交、付款，始终由你来点。</p>
              </div>
            </Match>
          </Switch>

          <For each={messages}>
            {(message, mi) => (
              <article class={`msg ${message.role}`}>
                <For each={message.parts}>{(part, pi) => <PartView part={part} role={message.role} streaming={busy() && mi() === messages.length - 1 && pi() === message.parts.length - 1} />}</For>
                <Show when={message.error}><div class="error">{message.error}</div></Show>
              </article>
            )}
          </For>

          <For each={questions}>{(request) => <QuestionCard request={request} />}</For>

          <For each={risks}>
            {(risk) => (
              <div class="card risk">
                <div class="card-head">需要你决定 · {risk.title}</div>
                <p>AI 准备点击页面上的「<strong>{risk.label}</strong>」。这类操作做了就收不回。</p>
                <div class="row">
                  <button class="primary" onClick={() => neo.decideRisk(risk.id, "deny")}>我自己来</button>
                  <button onClick={() => neo.decideRisk(risk.id, "allow")}>这只是普通按钮，让 AI 点</button>
                </div>
              </div>
            )}
          </For>

          <Show when={materials()}>
            {(m) => (
              <div class="working">
                <span class="pulse" />
                正在读取材料{m().total ? `（${m().done}/${m().total}）` : ""}：{m().current}
              </div>
            )}
          </Show>
          <Show when={busy() && !materials() && !questions.length && !risks.length}>
            <div class="working"><span class="pulse" />{activity() || "正在思考"}</div>
          </Show>
          <Show when={notice()}><div class="error">{notice()}</div></Show>
        </div>

        <footer class="composer">
          <textarea
            value={draft()}
            rows={3}
            placeholder={questions.length ? "直接打字回答上面的问题…" : "告诉 AI 要做什么，回车发送"}
            onInput={(e) => setDraft(e.currentTarget.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey && !e.isComposing) (e.preventDefault(), void send())
            }}
          />
          <div class="row end">
            <Show when={busy()}><button onClick={() => neo.abort()}>停下</button></Show>
            <button class="primary" disabled={!draft().trim() || app().phase !== "ready"} onClick={send}>发送</button>
          </div>
        </footer>
      </aside>
    </div>
  )
}

function PartView(props: { part: Part; role: string; streaming?: boolean }) {
  const part = () => props.part
  return (
    <Switch>
      <Match when={part().type === "text" && !part().synthetic && !part().ignored && part().text?.trim()}>
        {/* 流式尾巴：一枚 1s 慢闪的黑方块。空闲时整个 span 不在 DOM 里——动画元素为零。 */}
        <div class="bubble" innerHTML={markdown(part().text) + (props.streaming ? '<span class="caret" aria-hidden="true"></span>' : "")} />
      </Match>
      <Match when={part().type === "reasoning" && part().text?.trim()}>
        <details class="thinking"><summary>思考过程</summary><div innerHTML={markdown(part().text)} /></details>
      </Match>
      <Match when={part().type === "tool" && part().tool !== "question"}>
        <details class={`tool ${part().state?.status}`}>
          <summary>
            <span class="tool-status" />
            <span class="tool-name">{toolLabel(part().tool)}</span>
            <span class="tool-detail">{toolDetail(part().tool, part().state?.input)}</span>
          </summary>
          <pre>{JSON.stringify(part().state?.input ?? {}, null, 2)}</pre>
          <Show when={part().state?.output || part().state?.error}>
            <pre>{String(part().state?.output ?? part().state?.error).slice(0, 6000)}</pre>
          </Show>
        </details>
      </Match>
      <Match when={part().type === "file" && String(part().mime || "").startsWith("image/")}>
        <img class="attachment" src={part().url} alt={part().filename || "图片"} />
      </Match>
    </Switch>
  )
}

function QuestionCard(props: { request: QuestionRequest }) {
  const [picked, setPicked] = createStore<string[][]>(props.request.questions.map(() => []))
  const [custom, setCustom] = createStore<string[]>(props.request.questions.map(() => ""))
  const single = () => props.request.questions.length === 1 && !props.request.questions[0].multiple

  const answers = () => props.request.questions.map((_, i) => [...picked[i], ...(custom[i].trim() ? [custom[i].trim()] : [])])
  const submit = () => neo.replyQuestion(props.request.id, answers())
  const toggle = (qi: number, label: string, multiple?: boolean) => {
    if (single()) return void neo.replyQuestion(props.request.id, [[label]])
    setPicked(qi, (list) => (multiple ? (list.includes(label) ? list.filter((x) => x !== label) : [...list, label]) : [label]))
  }

  return (
    <div class="card question">
      <For each={props.request.questions}>
        {(q, qi) => (
          <div class="q">
            <div class="card-head">{q.header || "需要你确认"}</div>
            <p>{q.question}</p>
            <div class="options">
              <For each={q.options}>
                {(option) => (
                  <button classList={{ option: true, on: picked[qi()].includes(option.label) }} onClick={() => toggle(qi(), option.label, q.multiple)}>
                    <strong>{option.label}</strong>
                    <Show when={option.description}><span>{option.description}</span></Show>
                  </button>
                )}
              </For>
            </div>
            <Show when={q.custom !== false}>
              <input
                class="custom"
                placeholder="或者直接写你的回答"
                value={custom[qi()]}
                onInput={(e) => setCustom(qi(), e.currentTarget.value)}
                onKeyDown={(e) => e.key === "Enter" && !e.isComposing && custom[qi()].trim() && submit()}
              />
            </Show>
          </div>
        )}
      </For>
      <div class="row end">
        <button onClick={() => neo.rejectQuestion(props.request.id)}>先不回答</button>
        <Show when={!single() || custom[0]?.trim()}>
          <button class="primary" disabled={answers().some((a) => a.length === 0)} onClick={submit}>确认</button>
        </Show>
      </div>
    </div>
  )
}

function describeError(error: any): string {
  if (!error) return "出了点问题"
  const message = error.data?.message || error.message || error.name || JSON.stringify(error)
  if (error.name === "MessageAbortedError") return "已停下。"
  if (error.name === "ProviderAuthError") {
    // The usual shape is opencode's raw English ("Anthropic API key is missing…" — MiniMax speaks the Anthropic protocol).
    // The real cause is almost always: nobody typed this provider's key into the settings screen on this machine.
    if (/API key is missing|no auth|unauthorized/i.test(message))
      return `这台电脑上还没有这个模型的账号密钥。到「设置」里找到这个模型的卡片，点【编辑】，把服务商的 API Key 填进去保存，当场生效。（MiniMax 的 key 在 MiniMax 开放平台的账号页拿；密钥只存在这台电脑上。）`
    return `模型账号验证失败：${message}`
  }
  // Most first-run failures are "this model is not available to you"; say what to do about it.
  return `${message}\n\n如果是模型不可用或额度问题，在右上角换一个模型再试。`
}
