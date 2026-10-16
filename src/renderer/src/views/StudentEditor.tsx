import { createEffect, createResource, createSignal, For, Show } from "solid-js"
import type { StudentGroup } from "../../../shared/tasks"
import { RESUME_TRACK_LABELS } from "../../../shared/jobs"
import { cleanIpcError } from "./Login"

const neo = window.neo

/**
 * The student's edit page: the account memo (all sites' passwords, whole-text replace, stored encrypted
 * outside the workspace), plus a quick look at their resume projects and a door to the folders.
 * Everything else (materials, progress, the answer bank) lives in the student's workspace untouched.
 */
export function StudentEditor(props: { group: StudentGroup; onBack: () => void; onChanged: () => void }) {
  const [memo, setMemo] = createSignal("")
  const [memoState, setMemoState] = createSignal("")
  const [busy, setBusy] = createSignal(false)
  const [error, setError] = createSignal("")
  const [resumes, { refetch: refetchResumes }] = createResource(() => neo.resumeList(props.group.studentDir))

  createEffect(() => {
    void neo.getStudentMemo(props.group.studentDir).then(setMemo, (err) => setError(cleanIpcError(err)))
  })

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

  const saveMemo = () => guard(async () => {
    await neo.setStudentMemo(props.group.studentDir, memo())
    setMemoState(memo().trim() ? "已保存——下一次开这个学生的任何投递都会带上它" : "已清空")
    setTimeout(() => setMemoState(""), 6000)
  })

  return (
    <main class="home-main form">
      <div class="home-head">
        <div>
          <p class="kicker">Student · Editing</p>
          <h1>{props.group.studentName}<span class="muted small"> · <span class="num">{props.group.tasks.length}</span> 份投递</span></h1>
          <p class="muted">开着的投递、材料、进度、答案库一概不碰。求职目标和岗位筛选取「岗位中心」里编辑。</p>
        </div>
        <button onClick={props.onBack}>返回列表</button>
      </div>

      <Show when={error()}><div class="error">{error()}</div></Show>

      <section class="form-section">
        <div class="section-head">
          <div>
            <h2>学生文件夹</h2>
            <p class="muted">这里放着学生的材料和答案库；材料更新就是把新文件放进 materials/ 后，回到投递对话告诉 AI「补好了」。</p>
          </div>
        </div>
        <div class="picker-row">
          <input value={props.group.studentDir} readonly />
          <button type="button" onClick={() => neo.revealPath(props.group.studentDir)}>在访达中打开</button>
        </div>
      </section>

      <section class="form-section">
        <div class="section-head">
          <div>
            <h2>简历</h2>
            <p class="muted">这个学生已有的 LaTeX 简历工程（导出 PDF 在 resume/ 文件夹里）。新的去首页的「简历」工作室生成。</p>
          </div>
        </div>
        <Show when={!resumes.loading && (resumes() ?? []).length} fallback={<p class="hint">还没有简历工程。</p>}>
          <For each={resumes()}>
            {(item) => (
              <div class="task-line">
                <div class="task-id">
                  <strong>Resume · {(RESUME_TRACK_LABELS as Record<string, string>)[item.track] ?? item.track}</strong>
                  <span class="muted small">{item.updatedAt.slice(0, 10)} 更新</span>
                </div>
                <div class="row">
                  <button onClick={() => neo.revealPath(item.exported)}>打开 PDF</button>
                  <button onClick={() => neo.revealPath(item.tex)}>打开工程</button>
                </div>
              </div>
            )}
          </For>
        </Show>
      </section>

      <section class="form-section">
        <div class="section-head">
          <div>
            <h2>账号备忘</h2>
            <p class="muted">这个学生全部网站的账号密码，整段贴进来；保存即替换现有内容。软件不拆它，哪段对哪个站由模型自己认，只随这个学生投递任务的开场白进对话——存在本机加密存储里，学生文件夹里看不到。</p>
          </div>
        </div>
        <label class="field">
          <textarea rows={8} placeholder={"例：\nLinkedIn chen@example.com / Chloe123456!\n联合利华校招 账号 chen.wang，密码 …\nGoogle 求职 账号 chen，密码 …"} value={memo()} onInput={(e) => setMemo(e.currentTarget.value)} />
        </label>
        <div class="row">
          <button class="primary" disabled={busy()} onClick={saveMemo}>保存备忘</button>
          <Show when={memoState()}><span class="muted small">{memoState()}</span></Show>
        </div>
      </section>
    </main>
  )
}
