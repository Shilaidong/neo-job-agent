import { execFile, execFileSync } from "node:child_process"
import { existsSync } from "node:fs"
import { copyFile, mkdir, readFile, readdir, rm, stat, writeFile } from "node:fs/promises"
import { basename, dirname, join } from "node:path"
import type { ResumeEngine, ResumeItem, ResumeResult } from "../../shared/resume"
import { RESUME_TRACK_LABELS, type JobTarget, type ResumeTrack } from "../../shared/jobs"
import { createLogger } from "../log"
import { workspacesRoot } from "../workspace"
import { buildLatex, cap, slugName, trackArg, type Profile } from "./resume-core"

const log = createLogger("resume")

export { buildLatex, cap, slugName, trackArg } from "./resume-core"
export { RESUME_TRACK_LABELS as RESUME_TRACK_LABELS_UI }

// ------------------------------------------------------------------ engine discovery

let cached: ResumeEngine | undefined

export async function findEngine(): Promise<ResumeEngine> {
  if (cached) return cached
  const candidates = [
    { kind: "tectonic" as const, cmds: ["tectonic"], args: ["--version"], versionRe: /Tectonic ([^\s]+)/ },
    { kind: "pdflatex" as const, cmds: ["/Library/TeX/texbin/pdflatex", "/usr/local/texlive/2024/bin/universal-darwin/pdflatex", "/usr/local/texlive/2023/bin/universal-darwin/pdflatex", "pdflatex"], args: ["-version"], versionRe: /pdfTeX ([^\s]+)/ },
    { kind: "xelatex" as const, cmds: ["/Library/TeX/texbin/xelatex", "xelatex"], args: ["-version"], versionRe: /XeTeX ([^\s]+)/ },
  ]
  for (const cand of candidates) {
    for (const cmd of cand.cmds) {
      try {
        const out = execFileSync(cmd, cand.args, { timeout: 8000, encoding: "utf8" }).split("\n").slice(0, 2).join(" · ")
        const version = cand.versionRe.exec(out)?.[1] ?? out.slice(0, 40)
        cached = { kind: cand.kind, binary: cmd, version, note: `${cand.kind}（${cmd}）· ${version}` }
        return cached
      } catch {
        /* try the next */
      }
    }
  }
  cached = {
    kind: "none",
    note: "没找到 LaTeX 引擎。装一个：brew install tectonic（单文件，自动下载宏包，推荐），或 brew install --cask mactex-no-gui。装好后在「设置 · 简历」里点『重新检测』。",
  }
  log.warn("no LaTeX engine found", { note: cached.note })
  return cached
}

export function invalidateEngine() {
  cached = undefined
}

// ------------------------------------------------------------------ compiling

function run(engine: ResumeEngine, args: string[], cwd: string): Promise<string> {
  return new Promise((resolve, reject) => {
    execFile(engine.binary!, args, { cwd, timeout: 160_000, maxBuffer: 8_000_000 }, (error, stdout, stderr) => {
      const tail = `${stdout}\n${stderr}`.trim().split("\n").slice(-40).join("\n")
      if (error) reject(new Error(`${engine.kind} 编译失败：${tail.slice(0, 900)}`))
      else resolve(tail)
    })
  })
}

export async function compileTex(engine: ResumeEngine, dir: string): Promise<string> {
  const tex = join(dir, "main.tex")
  if (!existsSync(tex)) throw new Error(`找不到 ${tex}——请先生成 main.tex。`)
  // Tectonic's first run downloads the format and packages; on a flaky line that can time out once and
  // succeed on the next try (each attempt also warms the on-disk cache). Three outer tries ride it out.
  const attempts = engine.kind === "tectonic" ? 3 : 1
  let last: string = ""
  for (let attempt = 1; attempt <= attempts; attempt++) {
    let output = ""
    const before = Date.now()
    if (engine.kind === "tectonic") {
      output += await run(engine, ["-X", "compile", "main.tex"], dir)
    } else {
      output += await run(engine, ["-interaction=nonstopmode", "-halt-on-error", "main.tex"], dir)
      output += await run(engine, ["-interaction=nonstopmode", "main.tex"], dir)
    }
    if (existsSync(join(dir, "main.pdf"))) {
      for (const aux of ["main.aux", "main.log", "main.out", "main.toc"]) await rm(join(dir, aux), { force: true, recursive: false }).catch(() => undefined)
      return output.slice(0, 800)
    }
    last = output
    log.warn("compile produced no pdf; retrying", { attempt, engine: engine.kind, ms: Date.now() - before })
    if (attempt < attempts) await new Promise((r) => setTimeout(r, 800))
  }
  throw new Error(`编译没产出 main.pdf：\n${last.slice(0, 600)}`)
}

// ------------------------------------------------------------------ the public API

export async function readProfile(studentDir: string): Promise<Profile> {
  try {
    return JSON.parse(await readFile(join(studentDir, "student_profile.json"), "utf8"))
  } catch (error) {
    throw new Error("还没有 student_profile.json——让学生先在对话里把材料整理成答案库（或直接让我从材料生成）。")
  }
}

async function readTarget(studentDir: string): Promise<JobTarget> {
  const blank: JobTarget = { roles: [], roleKeywords: [], companies: [], locations: [], locationExclude: [], skills: [] }
  try {
    return { ...blank, ...(JSON.parse(await readFile(join(studentDir, "job_target.json"), "utf8")) as JobTarget) }
  } catch {
    return blank
  }
}

export async function resumeDir(studentDir: string) {
  const dir = join(studentDir, "resume")
  await mkdir(dir, { recursive: true })
  return dir
}

export async function generateResume(studentDir: string, trackIn: string): Promise<ResumeResult> {
  const track = trackArg(trackIn)
  const engine = await findEngine()
  if (engine.kind === "none") throw new Error(`没有可用的 LaTeX 引擎：${engine.note}`)
  const profile = await readProfile(studentDir)
  const target = await readTarget(studentDir)
  const root = await resumeDir(studentDir)
  const name = slugName(profile)
  const folder = join(root, `resume-${track}-${name}`)
  await mkdir(folder, { recursive: true })
  const tex = join(folder, "main.tex")
  await writeFile(tex, buildLatex(profile, target, track))
  const logTail = await compileTex(engine, folder)
  const exported = await exportPdf(folder, root, track, name)
  const item: ResumeItem = { studentDir, track, tex, pdf: join(folder, "main.pdf"), exported, updatedAt: new Date().toISOString() }
  log.info("resume generated", { track, folder, pdf: exported })
  return { item, log: logTail }
}

async function exportPdf(folder: string, root: string, track: string, name: string): Promise<string> {
  const exported = join(root, `Resume_${cap(track)}_${name}.pdf`)
  // copy, not rename: the project folder keeps its own main.pdf (the MCP flow and the editor read it)
  await copyFile(join(folder, "main.pdf"), exported)
  return exported
}

/** Compile an existing LaTeX project folder (the resume_compile MCP tool's path). */
export async function compileFolder(folder: string): Promise<ResumeResult> {
  const engine = await findEngine()
  if (engine.kind === "none") throw new Error(`没有可用的 LaTeX 引擎：${engine.note}`)
  const dir = resolveInsideWorkspace(folder)
  if (!existsSync(join(dir, "main.tex"))) {
    const studentDir = dirname(dir)
    const track = trackArg(basename(dir).startsWith("resume-") ? basename(dir).split("-")[1] : "general")
    return generateResume(studentDir, track)
  }
  const logTail = await compileTex(engine, dir)
  const studentDir = dirname(dir)
  const track = trackArg(basename(dir).startsWith("resume-") ? basename(dir).split("-")[1] : "general")
  const profile = await readProfile(studentDir).catch(() => ({} as Profile))
  const name = slugName(profile)
  const root = await resumeDir(studentDir)
  const exported = await exportPdf(dir, root, track, name)
  log.info("resume project compiled", { dir, pdf: exported })
  return { item: { studentDir, track, tex: join(dir, "main.tex"), pdf: join(dir, "main.pdf"), exported, updatedAt: new Date().toISOString() }, log: logTail }
}

/** Refuse paths outside any workspace — the MCP tool never compiles the consultant's own files. */
function resolveInsideWorkspace(folder: string): string {
  const root = workspacesRoot()
  const normalized = folder.replace(/\/+$/, "")
  if (normalized !== root && !normalized.startsWith(root + "/")) throw new Error("只能编译工作区里的简历文件夹。")
  return normalized
}

export async function listResumes(studentDir: string): Promise<ResumeItem[]> {
  const root = join(studentDir, "resume")
  const out: ResumeItem[] = []
  let names: string[] = []
  try {
    names = await readdir(root)
  } catch {
    return out
  }
  for (const name of names) {
    if (!name.startsWith("resume-")) continue
    const folder = join(root, name)
    if (!existsSync(join(folder, "main.tex"))) continue
    const track = trackArg(name.split("-")[1] ?? "general")
    const mainPdf = join(folder, "main.pdf")
    out.push({
      studentDir,
      track,
      tex: join(folder, "main.tex"),
      pdf: mainPdf,
      exported: join(root, `Resume_${cap(track)}_${name.replace(/^resume-[^-]+-/, "")}.pdf`),
      updatedAt: await statFolder(folder),
    })
  }
  return out
}

async function statFolder(folder: string): Promise<string> {
  try {
    return (await stat(folder)).mtime.toISOString()
  } catch {
    return new Date().toISOString()
  }
}
