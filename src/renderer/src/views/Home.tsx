import { createEffect, createResource, createSignal, For, Show } from "solid-js"
import type { StudentGroup, Task } from "../../../shared/tasks"
import { cleanIpcError } from "./Login"
import { NewTask } from "./NewTask"
import { Settings } from "./Settings"
import { StudentEditor } from "./StudentEditor"
import { JobCenter } from "./JobCenter"
import { ResumeStudio } from "./ResumeStudio"

const neo = window.neo

/**
 * The front door: applications grouped by student, plus the two job-agent doorways — the daily 岗位中心
 * (matched postings) and the 简历工作室 (LaTeX resumes). Everything stays local.
 */
export function Home(props: { startInNewTask?: boolean; startInSettings?: boolean; startInAddServer?: boolean; startInEdit?: boolean }) {
  const [creating, setCreating] = createSignal(false)
  const [settings, setSettings] = createSignal(false)
  const [editing, setEditing] = createSignal<StudentGroup>()
  const [center, setCenter] = createSignal(props.startInNewTask === false ? false : false)
  const [studio, setStudio] = createSignal(false)
  createEffect(() => props.startInNewTask && setCreating(true))
  createEffect(() => (props.startInSettings || props.startInAddServer) && setSettings(true))
  createEffect(() => { const s = students(); if (props.startInEdit && s && s.length && !editing()) setEditing(s[0]) })
  const [students, { refetch }] = createResource(() => neo.listStudents())
  const [opening, setOpening] = createSignal("")
  const [error, setError] = createSignal("")
  const [chatting, setChatting] = createSignal(false)
  const [topic, setTopic] = createSignal("")

  const chat = async (choice: { kind: "fresh"; topic?: string } | { kind: "student"; studentDir: string }) => {
    setError("")
    try {
      await neo.openPlaygroundIn(choice)
    } catch (e) {
      setError(cleanIpcError(e))
    }
  }

  const open = async (task: Task) => {
    setOpening(task.taskDir)
    setError("")
    try {
      await neo.openTask(task.taskDir)
    } catch (err) {
      setError(cleanIpcError(err))
      setOpening("")
    }
  }

  const restart = async (task: Task) => {
    setOpening(task.taskDir)
    setError("")
    try {
      await neo.restartTask(task.taskDir)
    } catch (err) {
      setError(cleanIpcError(err))
      setOpening("")
    }
  }

  const created = async (tasks: Task[]) => {
    setCreating(false)
    await refetch()
    if (tasks.length === 1) await open(tasks[0])
  }

  return (
    <div class="home">
      <header class="home-bar">
        <div class="brand"><strong>Terra-Edu 求职助理</strong></div>
        <div class="home-bar-right">
          <span class="muted small">本地模式（数据都在本机，不上传云端）</span>
          <button onClick={() => setSettings(true)}>设置</button>
          <button title="在访达中显示本次运行的日志文件" onClick={() => neo.revealLog()}>日志</button>
        </div>
      </header>

      <Show
        when={!creating()}
        fallback={<NewTask onCancel={() => setCreating(false)} onCreated={created} />}
      >
      <Show
        when={!settings()}
        fallback={<Settings onBack={() => setSettings(false)} startInAdd={props.startInAddServer} />}
      >
      <Show
        when={!editing()}
        fallback={<StudentEditor group={editing()!} onBack={() => { setEditing(undefined); void refetch() }} onChanged={() => void refetch()} />}
      >
      <Show
        when={!center()}
        fallback={<JobCenter onBack={() => setCenter(false)} />}
      >
      <Show
        when={!studio()}
        fallback={<ResumeStudio onBack={() => setStudio(false)} />}
      >
        <main class="home-main">
          <div class="home-head">
            <div>
              <h1>投递</h1>
              <p class="muted">每个学生一个文件夹，材料只整理一次；每家公司的岗位一段独立对话。日常岗位由右边的岗位中心按学生画像抓取和筛好。</p>
            </div>
            <div class="row">
              <button onClick={() => setChatting((on) => !on)}>自由对话</button>
              <button onClick={() => setCenter(true)}>岗位中心</button>
              <button onClick={() => setStudio(true)}>简历</button>
              <button class="primary big" onClick={() => setCreating(true)}>新建投递</button>
            </div>
          </div>

          <Show when={error()}><div class="error">{error()}</div></Show>

          <Show when={chatting()}>
            <div class="card chat-start">
              <div class="card-head">自由对话 · 这次聊什么</div>
              <p class="muted small">不挂学生：开一个新文件夹（用今天的日期和话题命名），聊过的东西留在里面。挂某个学生：直接进他的文件夹，材料和档案都在，可以直接问。</p>
              <div class="row">
                <input
                  type="text"
                  placeholder="话题（可留空），比如 求职方向怎么定"
                  value={topic()}
                  onInput={(e) => setTopic(e.currentTarget.value)}
                  onKeyDown={(e) => e.key === "Enter" && chat({ kind: "fresh", topic: topic() })}
                />
                <button class="primary" onClick={() => chat({ kind: "fresh", topic: topic() })}>不挂学生，开始</button>
              </div>
              <Show when={(students() ?? []).length > 0}>
                <p class="muted small">或者挂一个学生：</p>
                <div class="row wrap">
                  <For each={students()}>{(group) => <button onClick={() => chat({ kind: "student", studentDir: group.studentDir })}>{group.studentName}</button>}</For>
                </div>
              </Show>
            </div>
          </Show>

          <Show when={!students.loading} fallback={<p class="hint">正在读取…</p>}>
            <Show
              when={(students() ?? []).length > 0}
              fallback={
                <div class="empty">
                  <p>还没有投递。</p>
                  <p class="muted">点「新建投递」，填学生、公司、岗位和招聘链接——之后的整理材料、写档案、生成简历、填表存草稿交给 AI。岗位中心会每天按学生的求职目标帮你筛好适合的岗位。</p>
                </div>
              }
            >
              <For each={students()}>
                {(group) => (
                  <section class="student">
                    <h2>{group.studentName}<span class="muted small"> · <span class="num">{group.tasks.length}</span> 份</span> <button class="chip" title="更新账号备忘、看求职目标、管理简历" onClick={() => setEditing(group)}>编辑</button></h2>
                    <div class="task-list">
                      <For each={group.tasks}>
                        {(task) => (
                          <div class="task-line">
                            <button class="task-row" disabled={Boolean(opening())} onClick={() => open(task)}>
                              <div class="task-id">
                                <strong>{task.input.company}</strong>
                                <Show when={task.input.jobTitle}><span>{task.input.jobTitle}</span></Show>
                              </div>
                              <div class="task-meta">
                                <Show when={task.input.deadline}><span class="num">截止 {task.input.deadline}</span></Show>
                                <span>{task.input.jobType}</span>
                                <span class={task.sessionID ? "tag on" : "tag"}>{opening() === task.taskDir ? "正在打开…" : task.sessionID ? "继续" : "未开始"}</span>
                              </div>
                            </button>
                            <Show when={task.sessionID}>
                              <button class="task-again" disabled={Boolean(opening())} title="从头重来：重新发一遍开头那条指令；文件、进度和答案库都还在，不会重做" onClick={() => restart(task)}>重开</button>
                            </Show>
                          </div>
                        )}
                      </For>
                    </div>
                  </section>
                )}
              </For>
            </Show>
          </Show>
        </main>
      </Show>
      </Show>
      </Show>
      </Show>
      </Show>
    </div>
  )
}
