import { createSignal, For, Show } from "solid-js"
import { createStore } from "solid-js/store"
import { JOB_TYPES, TASK_GOALS, type PlatformAccount, type Task, type TaskInput } from "../../../shared/tasks"
import { cleanIpcError } from "./Login"

const neo = window.neo

/**
 * Start one job application: student, folder, job type, goal, company, job title, the posting link,
 * and the sign-in paste box (the blob goes to the model's opening message verbatim, the software never
 * parses it). Everything after the basics — reading materials, the answer bank, the resume, filling the
 * page — belongs to the AI in the workbench.
 */
export function NewTask(props: { onCancel: () => void; onCreated: (tasks: Task[]) => void }) {
  const [input, setInput] = createStore<TaskInput>({
    studentName: "",
    sourceFolder: "",
    jobType: JOB_TYPES[0],
    taskGoal: TASK_GOALS[0],
    outputLanguage: "zh",
    allowUpload: true,
    company: "",
    jobTitle: "",
    applicationUrl: "",
    platformUsername: "",
    platformLogin: "",
    deadline: "",
    salary: "",
    notes: "",
  })
  const [savedAccount, setSavedAccount] = createSignal<PlatformAccount | null>(null)
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

  const pickFolder = () => guard(async () => {
    const folder = await neo.pickFolder()
    if (folder) setInput("sourceFolder", folder)
  })

  const recallAccount = async () => {
    const url = input.applicationUrl?.trim()
    const account = url ? await neo.getPlatformAccount(url).catch(() => null) : null
    setSavedAccount(account)
    if (account && !input.platformUsername) setInput("platformUsername", account.username)
  }

  const forgetAccount = async () => {
    if (input.applicationUrl) await neo.clearPlatformAccount(input.applicationUrl)
    setSavedAccount(null)
  }

  const create = () => guard(async () => {
    const task = await neo.createTask({ ...input })
    props.onCreated([task])
  })

  const ready = () => Boolean(input.studentName.trim() && input.company.trim() && input.jobTitle.trim())

  return (
    <main class="home-main form">
      <div class="home-head">
        <div>
          <p class="kicker">New application</p>
          <h1>新建一份投递</h1>
          <p class="muted">只填基础信息。之后整理材料、写档案与求职目标、生成简历、到招聘页填表存草稿，由 AI 接手；缺什么它会在对话里问你。</p>
        </div>
        <button onClick={props.onCancel}>返回列表</button>
      </div>

      <div class="field-grid form-section">
        <label class="field">
          <span>学生姓名</span>
          <input value={input.studentName} onInput={(e) => setInput("studentName", e.currentTarget.value)} />
        </label>
        <label class="field">
          <span>学生资料文件夹</span>
          <div class="picker-row">
            <input value={input.sourceFolder ?? ""} readonly placeholder="选择本地学生资料文件夹（第一次必选；以后可直接「一键投递」复用）" onClick={pickFolder} />
            <button type="button" onClick={pickFolder}>选择</button>
          </div>
        </label>
        <label class="field">
          <span>求职类型</span>
          <select value={input.jobType} onChange={(e) => setInput("jobType", e.currentTarget.value)}>
            <For each={JOB_TYPES}>{(item) => <option value={item}>{item}</option>}</For>
          </select>
        </label>
        <label class="field">
          <span>本次任务目标</span>
          <select value={input.taskGoal} onChange={(e) => setInput("taskGoal", e.currentTarget.value)}>
            <For each={TASK_GOALS}>{(item) => <option value={item}>{item}</option>}</For>
          </select>
        </label>
        <label class="field">
          <span>输出语言</span>
          <select value={input.outputLanguage} onChange={(e) => setInput("outputLanguage", e.currentTarget.value as "zh" | "en")}>
            <option value="zh">中文</option>
            <option value="en">English</option>
          </select>
        </label>
      </div>

      <div class="field-grid form-section">
        <label class="field">
          <span>公司</span>
          <input value={input.company} onInput={(e) => setInput("company", e.currentTarget.value)} />
        </label>
        <label class="field">
          <span>岗位名称</span>
          <input value={input.jobTitle} onInput={(e) => setInput("jobTitle", e.currentTarget.value)} />
        </label>
        <label class="field">
          <span>投递/招聘页面链接</span>
          <input value={input.applicationUrl ?? ""} placeholder="https://..." onInput={(e) => setInput("applicationUrl", e.currentTarget.value)} onBlur={recallAccount} />
        </label>
        <label class="field">
          <span>平台账号（登录用的网站账号，密码不默认收集）</span>
          <input value={input.platformUsername ?? ""} placeholder="登录邮箱/账号" onInput={(e) => setInput("platformUsername", e.currentTarget.value)} />
        </label>
        <div class="note wide">
          <Show when={savedAccount()} fallback={<small>只记平台账号。需要自动登录的站，在下面「平台登录」框里整段贴一次即可；不贴的话，登录仍由你在左边的页面上自己完成，AI 停手等你。</small>}>
            {(saved) => (
              <small>
                这个平台上次用的账号：<strong>{saved().username}</strong>
                <button type="button" class="link" onClick={forgetAccount}>忘掉它</button>
              </small>
            )}
          </Show>
        </div>
        <Show when={input.allowAutoLogin}>
          <label class="field wide">
            <span>平台登录（可选：整段贴这里，账号、密码、备注网站名，怎么写都行——软件不拆它，原样交给 AI 自己认）</span>
            <textarea rows={2} placeholder="例：LinkedIn 账号 chen@example.com | 密码 Chloe123456!" value={input.platformLogin ?? ""} onInput={(e) => setInput("platformLogin", e.currentTarget.value)} />
          </label>
        </Show>
        <label class="field">
          <span>截止日期</span>
          <input type="date" value={input.deadline ?? ""} onInput={(e) => setInput("deadline", e.currentTarget.value)} />
        </label>
        <label class="field">
          <span>薪资/待遇（不填也行）</span>
          <input value={input.salary ?? ""} placeholder="例如：8000/月 · 有转正名额" onInput={(e) => setInput("salary", e.currentTarget.value)} />
        </label>
        <label class="field wide">
          <span>备注 / 岗位描述粘贴处</span>
          <textarea rows={3} value={input.notes ?? ""} onInput={(e) => setInput("notes", e.currentTarget.value)} />
        </label>
      </div>

      <label class="check">
        <input type="checkbox" checked={input.allowUpload} onChange={(e) => setInput("allowUpload", e.currentTarget.checked)} />
        <span>允许 AI 上传用途明确的材料。最终提交、付款始终由你来点。</span>
      </label>
      <label class="check">
        <input type="checkbox" checked={Boolean(input.allowAutoLogin)} onChange={(e) => setInput("allowAutoLogin", e.currentTarget.checked)} />
        <span>允许自动登录：AI 到登录页自己输账号密码登录——默认由软件从学生资料、本机存储里认这一站的记录，不经对话；勾了以后还可以在上面「平台登录」框整段贴账号密码，原样交给 AI 带去登录。</span>
      </label>

      <Show when={error()}><div class="error">{error()}</div></Show>

      <div class="row end">
        <button onClick={props.onCancel}>取消</button>
        <button class="primary big" disabled={busy() || !ready()} onClick={create}>
          {busy() ? "正在创建…" : "创建并开始"}
        </button>
      </div>
    </main>
  )
}
