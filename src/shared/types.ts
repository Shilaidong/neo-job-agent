import type { AuthStatus } from "./auth"
import type { FeedOverview, FeedSchedule, JobSource, JobTarget, StudentFeed } from "./jobs"
import type { PlatformAccount, StudentGroup, Task, TaskInput } from "./tasks"

export type ModelRef = { providerID: string; modelID: string }
/**
 * `sees`: accepts images (the agent reads numbered screenshots) — for any model our own config file lists, the FILE answers;
 * `thinkingOptions`: the thinking levels this model offers (opencode's variants, strongest first);
 * `thinkingChosen`: the consultant's saved pick for this model, when it is still offered; absent = the automatic one
 * (`thinking`: the model's own default, else the strongest offered).
 */
export type ModelOption = ModelRef & { label: string; provider: string; sees: boolean; thinking?: string; thinkingOptions?: string[]; thinkingChosen?: string }

/**
 * One row of the settings screen. Without `providerID`: a model server of the consultant's own
 * (vLLM, Ollama, LM Studio, a relay — anything speaking OpenAI chat completions), injected as a
 * provider of its own (`own-<id>`), so the same model behind several doors coexist and switch freely.
 * With `providerID`: a CLOUD model row — it manages a model inside OpenCode's own provider (auth,
 * base URL and key stay opencode's, we never touch them); editable here are the display name, the
 * model id (a newer id opencode's catalog may not list yet), whether it sees, and its limits.
 */
export type ModelServer = {
  /** Stable id; the provider is named after it. Absent until the entry has been saved once. */
  id?: string
  /** Present on a cloud model row: OpenCode's provider id it lives under, e.g. `minimax-cn`. */
  providerID?: string
  /** Shown in the model picker's group header. */
  name: string
  baseURL: string
  /** Kept plainly on this machine (the consultant's call: no keychain). Never logged, never sent to the model. */
  apiKey?: string
  /** What the server calls the model — exactly the id its /models list answers with. */
  model: string
  /** Accepts images. Off = no screenshots are ever sent (a text-only server answers 400 to them). */
  sees: boolean
  /** Reasoning levels this server understands (sent as `reasoning_effort`). Empty = it is never asked to think. */
  thinkingLevels: string[]
  /** The level to think at unless the consultant picks another; a server's own default is usually "as hard as it can", which is slow. */
  thinkingDefault: string
  /** Total context window. */
  context: number
  /** Max tokens per answer (thinking counts inside it). */
  output: number
  /** Open a task on this server instead of the cloud default — while it answers. */
  isDefault?: boolean
  /** Only on the read-only row shown for the entry that still lives in `local.env` / `.env.local`. */
  readOnly?: boolean
}

/**
 * A Jev row on the settings screen (2026-10-08): which fast-judgement engine answers while a form fills.
 * `baseURL` is the server's `/v1`; the app calls its `/systemone`. Two rows ship inside the app —
 * the LAN cluster (key included: it is a public placeholder) and TypeSafe's cloud (URL only; the real
 * key stays a per-machine secret). All fields editable, one row active at a time, "off" is a choice.
 */
export type JevServer = { id?: string; name: string; baseURL: string; apiKey?: string; model: string }

/** Reasoning levels the settings screen offers; a server may understand others — they are just `reasoning_effort` strings. */
export const THINKING_LEVELS = ["none", "low", "medium", "high", "xhigh"]
/** How to say a level to a consultant. */
export const THINKING_LABELS: Record<string, string> = { none: "不思考（直接回答）", low: "低", medium: "中", high: "高", xhigh: "最高" }

/** `inEgo` — the task's page currently lives in the ego lite window (stage 4); the ☰ switch reads it. */
export type NavState = { url: string; title: string; canGoBack: boolean; canGoForward: boolean; loading: boolean; inEgo: boolean }

/** One tab of the embedded stage (2026-10-16 多标签): the application page plus site popups. */
export type TabInfo = { id: string; title: string; url: string; active: boolean; popup: boolean }

export type RiskAsk = { id: string; kind: "final_submit" | "payment" | "recommender_invite"; title: string; label: string; url: string }

export type AppState = {
  phase: "starting" | "ready" | "failed"
  error?: string
  /** home = task list / new task / login (full window); task = page on the left, conversation on the right */
  view: "home" | "task"
  /** undefined inside the task view = the free-form practice conversation */
  task?: Task
  auth?: AuthStatus
  workspace: string
  sessionID?: string
  models: ModelOption[]
  model?: ModelRef
  opencodeBinary?: string
  arch: string
  /** True while the consultant holds the left page (bot gate or their own 【交给人】): tools are off, the banner is up. */
  humanHandoff?: boolean
}

/** What the preload exposes as `window.neo`. */
export type NeoApi = {
  getState: () => Promise<AppState>
  goHome: () => Promise<AppState>
  openPlayground: () => Promise<AppState>
  /** A free conversation: in a folder of its own for today's topic, or inside an existing student's workspace. */
  openPlaygroundIn: (choice: { kind: "fresh"; topic?: string } | { kind: "student"; studentDir: string }) => Promise<AppState>
  authStatus: () => Promise<AuthStatus>
  login: (email: string, password: string) => Promise<AuthStatus>
  logout: () => Promise<AuthStatus>
  listStudents: () => Promise<StudentGroup[]>
  createTask: (input: TaskInput) => Promise<Task>
  openTask: (taskDir: string) => Promise<AppState>
  /** Start this application over from the opening message — files and the answer bank stay; the abandoned conversation is left on disk. */
  restartTask: (taskDir: string) => Promise<AppState>
  revealTask: (task: Task) => Promise<void>
  getPlatformAccount: (applicationUrl: string) => Promise<PlatformAccount | null>
  clearPlatformAccount: (applicationUrl: string) => Promise<void>
  /** Store this platform's password in the machine-local encrypted store for browser_login. Returns whether it saved. */
  savePlatformPassword: (applicationUrl: string, password: string) => Promise<boolean>
  /** The student's credentials memo, whole-text replace — lives outside the workspace (2026-10-14 编辑). */
  getStudentMemo: (studentDir: string) => Promise<string>
  setStudentMemo: (studentDir: string, text: string) => Promise<void>
  /** Re-import the selection sheet: preview the three-way diff, then apply it (missing schools to the Trash). */
  pickFolder: () => Promise<string | null>
  feedOverview: () => Promise<FeedOverview>
  saveFeedSources: (sources: JobSource[]) => Promise<FeedOverview>
  saveFeedSchedule: (schedule: FeedSchedule) => Promise<FeedOverview>
  runFeedNow: () => Promise<FeedOverview>
  saveJobTarget: (studentDir: string, target: JobTarget) => Promise<FeedOverview>
  /** 一键投递：从岗位中心拿一个岗位，给某位学生建一个投递任务并打开它。 */
  applyToJob: (input: { studentDir: string; entry: import("./jobs").JobEntry; notes?: string; taskGoal?: string }) => Promise<Task>
  resumeEngine: () => Promise<import("./resume").ResumeEngine>
  resumeEngineReset: () => Promise<void>
  resumeList: (studentDir: string) => Promise<import("./resume").ResumeItem[]>
  /** 用学生档案 + 求职目标生成/更新一份方向的 LaTeX 简历并编译导出 PDF。 */
  resumeGenerate: (studentDir: string, track: string, opts?: { fromProfile?: boolean }) => Promise<import("./resume").ResumeResult>
  /** 在访达里显示一个文件夹。 */
  revealPath: (path: string) => Promise<void>
  /** 用系统默认浏览器打开一个网址（不弹应用内的新窗口）。 */
  openExternal: (url: string) => Promise<void>
  getNav: () => Promise<NavState>
  /** The embedded stage's tab strip (2026-10-16): list, activate, close. Pushes arrive on "tabs:state". */
  tabsList: () => Promise<TabInfo[]>
  activateTab: (id: string) => Promise<TabInfo[]>
  closeTab: (id: string) => Promise<TabInfo[]>
  history: () => Promise<Array<{ info: any; parts: any[] }>>
  pendingQuestions: () => Promise<any[]>
  send: (text: string) => Promise<void>
  abort: () => Promise<void>
  /** In the task view this is 【重开】: same fresh start as a reopen, opening message included. In a free chat, a plain new conversation. */
  newChat: () => Promise<AppState>
  setModel: (model: ModelRef) => Promise<AppState>
  /** The thinking level for one model from the picker; null back to 自动（默认）. In force from the next message; remembered per model. */
  setModelEffort: (model: ModelRef & { level: string | null }) => Promise<AppState>
  /** The settings screen's rows (own servers + cloud models), the read-only local.env row, the default, what is deleted-but-restorable, any logged-in cloud model not configured here, and which providers hold a credential on this machine (null: engine not running). */
  listModelServers: () => Promise<{ servers: ModelServer[]; fileServer?: ModelServer; defaultRef?: string; hidden: string[]; liveCloud: ModelOption[]; connected: string[] | null }>
  /** Save (new when it has no id yet); takes effect right away — the engine restarts in place, the conversation survives. A cloud row is found by provider+model, never duplicated. */
  saveModelServer: (server: ModelServer) => Promise<void>
  /** Remove an own server for good; a cloud model goes through the restore list instead (its login and key on this machine stay). */
  deleteModelServer: (id: string) => Promise<void>
  /** The one default, first-class: "provider/model" (or null back to the built-in chain). */
  setModelDefault: (ref: string | null) => Promise<void>
  hideModel: (ref: string) => Promise<void>
  unhideModel: (ref: string) => Promise<void>
  /** Ask the server, from the form before saving: is it alive, and does it serve the model id written? */
  testModelServer: (server: ModelServer) => Promise<{ ok: boolean; note: string; ids?: string[] }>
  /** The settings screen's Jev rows (which fast-judgement engine answers during a form). */
  listJevServers: () => Promise<{ servers: JevServer[]; default: string | null | undefined; hidden: { id: string; name: string }[] }>
  saveJevServer: (server: JevServer) => Promise<void>
  deleteJevServer: (id: string) => Promise<void>
  unhideJevServer: (id: string) => Promise<void>
  setJevDefault: (id: string | "off" | null) => Promise<void>
  testJevServer: (id: string) => Promise<{ ok: boolean; detail: string }>
  replyQuestion: (requestID: string, answers: string[][]) => Promise<void>
  rejectQuestion: (requestID: string) => Promise<void>
  decideRisk: (id: string, decision: "allow" | "deny") => Promise<void>
  navigate: (url: string) => Promise<void>
  goBack: () => Promise<void>
  goForward: () => Promise<void>
  reload: () => Promise<void>
  setSidebarWidth: (width: number) => Promise<void>
  openWorkspace: () => Promise<void>
  revealLog: () => Promise<void>
  /** True: 【交给人】— tools let go of the page (bot gates, or anything the consultant wants done by hand). False: 【我操作完了，交回 AI】. */
  handoff: (on: boolean) => Promise<void>
  /** The ☰ switch: run THIS task's page in ego lite (or bring it back to the embedded view). Session-only. */
  taskUseEgo: (on: boolean) => Promise<NavState>
  log: (level: "debug" | "info" | "warn" | "error", msg: string, data?: Record<string, unknown>) => Promise<void>
  on: (channel: "oc:event" | "nav:state" | "tabs:state" | "risk:ask" | "risk:closed" | "activity" | "app:state" | "notice" | "dev:view" | "materials:progress" | "feed:state", listener: (payload: any) => void) => () => void
}
