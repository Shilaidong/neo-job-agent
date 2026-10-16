import { createResource, createSignal, For, onCleanup, onMount, Show } from "solid-js"
import { createStore } from "solid-js/store"
import type { FeedOverview, FeedSchedule, JobEntry, JobMatchResult, JobSource, JobTarget, StudentFeed } from "../../../shared/jobs"
import { cleanIpcError } from "./Login"

const neo = window.neo

/**
 * 岗位中心 —— 每天按时（北京时间 13:00 和美国东部时间 13:00）把各来源的岗位拉回本机，按学生的
 * 求职目标（job_target.json）筛好。点「投递」就给这位学生建一份任务并打开工作台，AI 接着全自动填。
 */
export function JobCenter(props: { onBack: () => void }) {
  const [data, { refetch }] = createResource<FeedOverview>(() => neo.feedOverview())
  const [busy, setBusy] = createSignal(false)
  const [error, setError] = createSignal("")
  const [selStudent, setSelStudent] = createSignal("")
  const [expanded, setExpanded] = createSignal<Record<string, boolean>>({})
  const [editingTarget, setEditingTarget] = createSignal<string>("")

  onMount(() => {
    const off = neo.on("feed:state", () => void refetch())
    onCleanup(off)
  })

  const guard = async (work: () => Promise<void>) => {
    setBusy(true)
    setError("")
    try {
      await work()
      await refetch()
    } catch (err) {
      setError(cleanIpcError(err))
    } finally {
      setBusy(false)
    }
  }

  const runNow = () =>
    guard(async () => {
      await neo.runFeedNow()
    })

  const students = () => data()?.students ?? []
  const activeDir = () => selStudent() || students()[0]?.studentDir || ""
  const activeStudent = () => students().find((s) => s.studentDir === activeDir())

  const feed: () => StudentFeed = () => {
    const d = data()
    const dir = activeDir()
    if (!d || !dir) return { entries: [], matches: {}, generatedAt: "" }
    return d.feeds[dir] ?? { entries: [], matches: {}, generatedAt: d.lastRun?.finishedAt ?? "" }
  }

  const orderedJobs = () => {
    const f = feed()
    const entries = [...f.entries].sort((a, b) => {
      const ma = f.matches[a.id]?.matched ?? false
      const mb = f.matches[b.id]?.matched ?? false
      if (ma !== mb) return ma ? -1 : 1
      return (f.matches[b.id]?.score ?? 0) - (f.matches[a.id]?.score ?? 0)
    })
    return entries
  }

  return (
    <main class="home-main form">
      <div class="home-head">
        <div>
          <p class="kicker">Job center</p>
          <h1>岗位中心</h1>
          <p class="muted">每天北京时间 13:00 和美国东部时间 13:00 自动抓取并保存到本机；没开机时下次打开会补抓。点「投递」开始全自动填表投递。</p>
        </div>
        <div class="row">
          <button onClick={() => refetch()}>刷新</button>
          <button class="primary" disabled={busy()} onClick={runNow}>{busy() ? "抓取中…" : "立即抓取"}</button>
          <button onClick={props.onBack}>返回列表</button>
        </div>
      </div>

      <Show when={error()}><div class="error">{error()}</div></Show>
      <Show when={!data.loading} fallback={<p class="hint">正在读取…</p>}>
        <StatusBar overview={data()!} onChanged={() => void refetch()} />
        <Show
          when={students().length > 0}
          fallback={
            <div class="empty">
              <p>还没有学生。</p>
              <p class="muted">先在首页「新建投递」建一位学生；AI 会在对话里整理出他的求职目标（job_target.json），岗位中心随后按它筛。</p>
            </div>
          }
        >
          <Show when={students().length > 1}>
            <div class="row wrap" style={{ "margin": "12px 0" }}>
              <For each={students()}>{(s) => <button classList={{ chip: true, on: activeDir() === s.studentDir }} onClick={() => setSelStudent(s.studentDir)}>{s.studentName}</button>}</For>
            </div>
          </Show>

          <Show
            when={activeStudent()}
            fallback={<p class="hint">请选择学生。</p>}
          >
            {(s) => (
              <>
                <section class="form-section">
                  <div class="section-head">
                    <div>
                      <h2>求职目标 · {s().studentName}
                        <button class="chip" style={{ "margin-left": "10px" }} onClick={() => setEditingTarget(editingTarget() === s().studentDir ? "" : s().studentDir)}>
                          {editingTarget() === s().studentDir ? "收起" : "编辑"}
                        </button>
                      </h2>
                      <p class="muted">{targetSummary(s().target)}</p>
                    </div>
                  </div>
                  <Show when={editingTarget() === s().studentDir}>
                    <TargetEditor dir={s().studentDir} target={s().target} onSave={async () => { setEditingTarget(""); await refetch() }} />
                  </Show>
                </section>

                <section class="form-section">
                  <JobList jobs={orderedJobs()} matches={feed().matches} feedTime={feed().generatedAt} studentDir={s().studentDir} onChanged={() => void refetch()} />
                </section>
              </>
            )}
          </Show>
        </Show>
      </Show>
    </main>
  )
}

function targetSummary(target: JobTarget): string {
  const parts: string[] = []
  if (target.roleKeywords.length) parts.push(`岗位关键词：${target.roleKeywords.slice(0, 5).join("、")}`)
  if (target.companies.length) parts.push(`目标公司：${target.companies.slice(0, 5).join("、")}`)
  if (target.locations.length) parts.push(`地点：${target.locations.slice(0, 5).join("、")}`)
  if (target.internshipsOnly) parts.push("只要实习")
  if (target.fullTimeOnly) parts.push("只要全职")
  if (!parts.length) parts.push("还没有求职目标——让 AI 在对话里整理，或点「编辑」手填。")
  return parts.join(" · ")
}

function StatusBar(props: { overview: FeedOverview; onChanged: () => void }) {
  const [schedule, setSchedule] = createStore<FeedSchedule>({ ...props.overview.schedule })
  const [saved, setSaved] = createSignal("")
  const save = async () => {
    try {
      await neo.saveFeedSchedule({ ...schedule })
      setSaved("已保存")
      setTimeout(() => setSaved(""), 4000)
      props.onChanged()
    } catch (err) {
      setSaved(cleanIpcError(err))
    }
  }
  const last = props.overview.lastRun
  return (
    <div class="card">
      <div class="card-head">抓取计划与结果</div>
      <div class="field-grid">
        <label class="check wide">
          <input type="checkbox" checked={schedule.enabled} onChange={(e) => setSchedule("enabled", e.currentTarget.checked)} />
          <span>开启定时抓取</span>
        </label>
        <label class="field">
          <span>北京时间（Asia/Shanghai）</span>
          <input value={schedule.beijing} onInput={(e) => setSchedule("beijing", e.currentTarget.value)} placeholder="13:00" />
        </label>
        <label class="field">
          <span>美国东部时间（America/New_York）</span>
          <input value={schedule.eastern} onInput={(e) => setSchedule("eastern", e.currentTarget.value)} placeholder="13:00" />
        </label>
        <label class="check wide">
          <input type="checkbox" checked={Boolean(schedule.catchUpOnLaunch)} onChange={(e) => setSchedule("catchUpOnLaunch", e.currentTarget.checked)} />
          <span>错过的时间点，下次打开软件时补抓</span>
        </label>
      </div>
      <div class="row end">
        <button class="primary" onClick={save}>保存抓取时间</button>
        <Show when={saved()}><span class="muted small">{saved()}</span></Show>
      </div>
      <p class="muted small" style={{ "margin-top": "8px" }}>
        {last ? `上次抓取：${new Date(last.finishedAt).toLocaleString()}（抓到 ${last.fetched} 条，其中新 ${last.new} 条${last.failed.length ? `；失败 ${last.failed.length} 个来源` : ""}）` : "还没有抓取过。点「立即抓取」试一次，或在「设置 · 岗位中心」里配置数据源。"}
        <Show when={last?.failed.length}>
          <span class="error small"> <br />{last!.failed.slice(0, 5).join("；")}</span>
        </Show>
      </p>
      <div class="section-head" style={{ "margin-top": "14px" }}>
        <div><h3 style={{ "margin": "0" }}>数据源（详细编辑在「设置 · 岗位中心」）</h3></div>
      </div>
      <div class="row wrap" style={{ "padding": "4px 0" }}>
        <For each={props.overview.sources}>{(src) => (
          <span class="tag" style={{ "margin": "2px 6px 2px 0" }}>{src.enabled ? "●" : "○"} {src.name}</span>
        )}</For>
      </div>
    </div>
  )
}

function TargetEditor(props: { dir: string; target: JobTarget; onSave: () => void }) {
  const [t, setT] = createStore<JobTarget>({ ...props.target })
  const [error, setError] = createSignal("")
  const put = (key: "roles" | "roleKeywords" | "companies" | "locations" | "locationExclude" | "skills", value: string) => setT(key as any, value.split(/[,，;；\n]/).map((s) => s.trim()).filter(Boolean))
  const save = async () => {
    setError("")
    try {
      await neo.saveJobTarget(props.dir, { ...t })
      props.onSave()
    } catch (err) {
      setError(cleanIpcError(err))
    }
  }
  return (
    <div class="card">
      <div class="field-grid">
        <label class="field">
          <span>目标岗位类型（只用来贴标签）</span>
          <input value={t.roles.join("，")} placeholder="数据科学实习，机器学习" onInput={(e) => put("roles", e.currentTarget.value)} />
        </label>
        <label class="field">
          <span>岗位关键词（和标题/描述比对）</span>
          <input value={t.roleKeywords.join("，")} placeholder="data science, machine learning, data analyst" onInput={(e) => put("roleKeywords", e.currentTarget.value)} />
        </label>
        <label class="field">
          <span>目标公司（服务商名匹配）</span>
          <input value={t.companies.join("，")} placeholder="Google，字节跳动" onInput={(e) => put("companies", e.currentTarget.value)} />
        </label>
        <label class="field">
          <span>目标地点（出现在岗位里就算）</span>
          <input value={t.locations.join("，")} placeholder="new york, remote, 远程" onInput={(e) => put("locations", e.currentTarget.value)} />
        </label>
        <label class="field">
          <span>排除地点</span>
          <input value={t.locationExclude.join("，")} placeholder="beijing" onInput={(e) => put("locationExclude", e.currentTarget.value)} />
        </label>
        <label class="field">
          <span>加分技能</span>
          <input value={t.skills.join("，")} placeholder="python, sql, tableau" onInput={(e) => put("skills", e.currentTarget.value)} />
        </label>
        <label class="check wide">
          <input type="checkbox" checked={Boolean(t.internshipsOnly)} onChange={(e) => setT("internshipsOnly", e.currentTarget.checked)} />
          <span>只要实习</span>
        </label>
        <label class="check wide">
          <input type="checkbox" checked={Boolean(t.fullTimeOnly)} onChange={(e) => setT("fullTimeOnly", e.currentTarget.checked)} />
          <span>只要全职</span>
        </label>
      </div>
      <Show when={error()}><p class="error">{error()}</p></Show>
      <div class="row end">
        <button class="primary" onClick={save}>保存求职目标</button>
      </div>
    </div>
  )
}

function JobList(props: { jobs: JobEntry[]; matches: Record<string, JobMatchResult>; feedTime: string; studentDir: string; onChanged: () => void }) {
  const [applying, setApplying] = createSignal("")
  const [error, setError] = createSignal("")
  const [expanded, setExpanded] = createSignal<string[]>([])

  const apply = async (job: JobEntry) => {
    setError("")
    setApplying(job.id)
    try {
      const task = await neo.applyToJob({ studentDir: props.studentDir, entry: job })
      void task // opening the task flips the app to the workbench automatically
    } catch (err) {
      setError(cleanIpcError(err))
      setApplying("")
    }
  }

  const toggle = (id: string) => setExpanded((list) => (list.includes(id) ? list.filter((x) => x !== id) : [...list, id]))

  return (
    <>
      <div class="section-head">
        <div>
          <h2>适合的岗位 <span class="muted small">（共 {props.jobs.length} 条 · 快照 {props.feedTime ? new Date(props.feedTime).toLocaleString() : "—"}）</span></h2>
          <p class="muted">按契合度排序；带 ✓ 的是筛出来的。想看详情点开，要投点「投递」——会为这位学生建一份任务并打开工作台，AI 接着干活。</p>
        </div>
      </div>
      <Show when={error()}><div class="error">{error()}</div></Show>
      <Show when={props.jobs.length === 0} fallback={undefined}>
        <div class="empty"><p>还没有抓到岗位。</p><p class="muted">到「设置 · 岗位中心」把数据源打开（默认的 LinkedIn/Indeed 都要联网），再点上面的「立即抓取」。</p></div>
      </Show>
      <For each={props.jobs}>
        {(job) => {
          const m = () => props.matches[job.id]
          const open = () => expanded().includes(job.id)
          return (
            <div class="card job">
              <div class="job-top">
                <div class="job-title">
                  <strong>{job.title}</strong>
                  <span class="muted small">{job.company}{job.location ? ` · ${job.location}` : ""}</span>
                </div>
                <div class="job-badges">
                  {job.internship ? <span class="tag on">实习</span> : null}
                  {job.fullTime ? <span class="tag">全职</span> : null}
                  <Show when={m()?.matched}><span class="tag on">✓ 契合 {m()?.score ?? 0} 分</span></Show>
                </div>
              </div>
              <Show when={m()?.reasons.length}>
                <p class="muted small">{m()!.reasons.join(" · ")}</p>
              </Show>
              <Show when={job.salary}><p class="muted small">待遇：{job.salary}</p></Show>
              <Show when={open()}>
                <p class="job-desc">{job.description.slice(0, 2000)}</p>
              </Show>
              <div class="row end">
                <Show when={job.postedAt} fallback={null}>{(p) => <span class="muted small num">{p().slice(0, 10)}</span>}</Show>
                <button class="chip" onClick={() => toggle(job.id)}>{open() ? "收起" : "详情"}</button>
                <Show when={job.url.startsWith("http")}><button onClick={() => (void neo.openExternal(job.url))}>在浏览器打开</button></Show>
                <button class="primary" disabled={applying() === job.id} onClick={() => apply(job)}>{applying() === job.id ? "正在建任务…" : "投递"}</button>
              </div>
            </div>
          )
        }}
      </For>
    </>
  )
}
