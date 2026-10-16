import { createResource, createSignal, For, Show } from "solid-js"
import { RESUME_TRACK_LABELS, RESUME_TRACKS, type ResumeTrack } from "../../../shared/jobs"
import type { ResumeEngine } from "../../../shared/resume"
import { cleanIpcError } from "./Login"

const neo = window.neo

/**
 * 简历工作室 —— 用学生的档案（student_profile.json）和求职目标，生成某个方向的 LaTeX 简历并编译成 PDF。
 * 也可以随时改 main.tex，然后在任意投递对话里说「重新编译简历」让 AI 调 resume_compile 导出。
 */
export function ResumeStudio(props: { onBack: () => void }) {
  const [engine, { refetch: refetchEngine }] = createResource<ResumeEngine>(() => neo.resumeEngine())
  const [students, { refetch: refetchStudents }] = createResource(() => neo.listStudents())
  const [selStudent, setSelStudent] = createSignal("")
  const [track, setTrack] = createSignal<ResumeTrack>("data")
  const [busy, setBusy] = createSignal(false)
  const [error, setError] = createSignal("")
  const [result, setResult] = createSignal("")
  const [exported, setExported] = createSignal("")

  const activeDir = () => selStudent() || (students() ?? [])[0]?.studentDir || ""
  const activeName = () => (students() ?? []).find((s) => s.studentDir === activeDir())?.studentName ?? ""

  const generate = async () => {
    if (!activeDir()) return
    setError("")
    setResult("")
    setBusy(true)
    try {
      const r = await neo.resumeGenerate(activeDir(), track())
      const tail = r.log.trim().split("\n").slice(-6).join("\n")
      setExported(r.item.exported)
      setResult(`已生成 → ${r.item.exported}\n\n${tail}`)
      void neo.revealPath(r.item.exported)
    } catch (err) {
      setError(cleanIpcError(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <main class="home-main form">
      <div class="home-head">
        <div>
          <p class="kicker">Resume studio</p>
          <h1>简历</h1>
          <p class="muted">按学生档案一键生成 LaTeX 简历并导出 PDF。之后想微调，直接在对话里跟 AI 说，它会改 main.tex 再编译。</p>
        </div>
        <button onClick={props.onBack}>返回列表</button>
      </div>

      <Show when={!engine.loading} fallback={<p class="hint">正在检测…</p>}>
        <div class="card">
          <div class="card-head">LaTeX 引擎</div>
          <p class={engine()?.kind === "none" ? "note" : "muted small"}>{engine()?.note}</p>
          <div class="row end">
            <button onClick={() => void refetchEngine()}>重新检测</button>
          </div>
        </div>
      </Show>

      <Show when={error()}><div class="error">{error()}</div></Show>

      <Show when={!students.loading} fallback={<p class="hint">正在读取…</p>}>
        <Show when={(students() ?? []).length > 0} fallback={<div class="empty"><p>还没有学生。</p><p class="muted">先在首页「新建投递」建一位学生，AI 整理档案后再来生成简历。</p></div>}>
          <div class="field-grid form-section">
            <label class="field">
              <span>学生</span>
              <select value={activeDir()} onChange={(e) => setSelStudent(e.currentTarget.value)}>
                <For each={students()}>{(s) => <option value={s.studentDir}>{s.studentName}（{s.tasks.length} 份投递）</option>}</For>
              </select>
            </label>
            <label class="field">
              <span>简历方向（影响侧重顺序与表述）</span>
              <select value={track()} onChange={(e) => setTrack(e.currentTarget.value as ResumeTrack)}>
                <For each={RESUME_TRACKS}>{(t) => <option value={t}>{RESUME_TRACK_LABELS[t]}</option>}</For>
              </select>
            </label>
            <div class="note wide">
              <small>先生成再微调都行；没有 student_profile.json 时，先生成一份投递任务让 AI 把档案建好再回来。</small>
            </div>
            <div class="row end">
              <button class="primary big" disabled={busy() || !activeDir() || engine()?.kind === "none"} onClick={generate}>
                {busy() ? "正在生成…" : `生成 ${activeName()} 的 ${RESUME_TRACK_LABELS[track()] || track()} 简历`}
              </button>
            </div>
          </div>

          <Show when={result()}>
            <div class="card">
              <div class="card-head">结果</div>
              <pre style={{ "white-space": "pre-wrap", "margin": "0", "font-size": "12px" }}>{result()}</pre>
              <Show when={exported()}>
                <div class="row end">
                  <button onClick={() => (void neo.revealPath(exported()))}>在访达中显示 PDF</button>
                </div>
              </Show>
            </div>
          </Show>
        </Show>
      </Show>
    </main>
  )
}
