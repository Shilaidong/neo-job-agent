import { randomUUID } from "node:crypto"
import { existsSync } from "node:fs"
import { cp, mkdir, readdir, readFile, rename, stat, writeFile } from "node:fs/promises"
import { join } from "node:path"
import type { StudentGroup, Task, TaskInput } from "../../shared/tasks"
import { createLogger } from "../log"
import { workspacesRoot, writeGuide } from "../workspace"
import { savePlatformAccount } from "./accounts"
import { sameApplication, slugPart, taskSlug } from "./slug"

/**
 * One folder per student, one sub-folder per job application:
 *
 *   <workspaces>/<学生>/
 *     AGENTS.md            the one-page guide (ours, refreshed on open)
 *     student.json         who this is, where the materials came from
 *     materials/           a copy of the consultant's folder — the original is never touched
 *     job_target.json      the AI's job positioning (roles/companies/locations/filters)
 *     resume/              LaTeX resume projects + exported PDFs
 *     jobs/<公司>_<岗位>/task.json
 *
 * The agent works from the student folder, so what it learns for one application (the profile,
 * the resume, the answers the consultant gave) is there for the next.
 */
const log = createLogger("task")
const TASK_FILE = "task.json"

async function writeJson(path: string, value: unknown) {
  const tmp = `${path}.tmp`
  await writeFile(tmp, JSON.stringify(value, null, 2))
  await rename(tmp, path)
}

async function readJson<T>(path: string): Promise<T | undefined> {
  try {
    return JSON.parse(await readFile(path, "utf8")) as T
  } catch {
    return undefined
  }
}

function validate(input: TaskInput) {
  if (!input.studentName.trim()) throw new Error("学生姓名不能为空")
  if (!input.jobType.trim()) throw new Error("求职类型不能为空")
  if (!input.company.trim()) throw new Error("公司不能为空")
  if (!input.jobTitle.trim()) throw new Error("岗位名称不能为空")
  if (input.applicationUrl?.trim() && !URL.canParse(input.applicationUrl.trim())) throw new Error("投递链接格式不正确，应以 https:// 开头")
}

const clean = (input: TaskInput): TaskInput => ({
  ...input,
  studentName: input.studentName.trim(),
  jobType: input.jobType.trim(),
  company: input.company.trim(),
  jobTitle: input.jobTitle.trim(),
  applicationUrl: input.applicationUrl?.trim() || undefined,
  platformUsername: input.platformUsername?.trim() || undefined,
  // the pasted login blob rides along verbatim — the model reads it, we never parse it
  platformLogin: input.platformLogin?.trim() || undefined,
  deadline: input.deadline?.trim() || undefined,
  salary: input.salary?.trim() || undefined,
  notes: input.notes?.trim() || undefined,
  allowAutoLogin: input.allowAutoLogin ? true : undefined,
})

/** Create the student folder if needed and bring in any material files it does not have yet. */
async function ensureStudent(studentName: string, sourceFolder: string) {
  const studentDir = join(workspacesRoot(), slugPart(studentName))
  const materials = join(studentDir, "materials")
  await mkdir(join(studentDir, "jobs"), { recursive: true })
  await mkdir(materials, { recursive: true })
  const had = await countFiles(materials)
  await log.time("copy materials", () => cp(sourceFolder, materials, { recursive: true, force: false, errorOnExist: false }), { sourceFolder, materials })
  const brought = (await countFiles(materials)) - had
  const studentFile = join(studentDir, "student.json")
  const existing = await readJson<{ sourceFolders?: string[]; createdAt?: string }>(studentFile)
  await writeJson(studentFile, {
    studentName,
    createdAt: existing?.createdAt ?? new Date().toISOString(),
    sourceFolders: [...new Set([...(existing?.sourceFolders ?? []), sourceFolder])],
  })
  await writeGuide(studentDir)
  if (brought > 0 && had > 0) log.info("new material files came in with this folder", { studentDir, brought })
  return { studentDir, brought, hadBefore: had }
}

async function countFiles(dir: string): Promise<number> {
  let n = 0
  for (const entry of await readdir(dir, { withFileTypes: true }).catch(() => [])) {
    if (entry.name.startsWith(".")) continue
    n += entry.isDirectory() ? await countFiles(join(dir, entry.name)) : 1
  }
  return n
}

export async function createTask(rawInput: TaskInput): Promise<Task> {
  validate(rawInput)
  const input = clean(rawInput)
  const existing = (await listTasks()).find((task) => sameApplication(task.input, input))
  if (existing) {
    log.info("reusing existing task", { taskDir: existing.taskDir })
    if (input.allowAutoLogin && existing.input.allowAutoLogin !== true) {
      const merged = { ...existing.input, allowAutoLogin: true }
      await updateTask(existing.taskDir, { input: merged })
      return { ...existing, input: merged, reusedExisting: true }
    }
    return { ...existing, reusedExisting: true }
  }

  // A folder is only required to CREATE the student. A one-click apply from the job centre reuses
  // the student's existing materials (job.json + student.json already on disk) and passes no folder.
  let ensured: { studentDir: string; brought: number; hadBefore: number }
  if (input.sourceFolder && existsSync(input.sourceFolder)) {
    ensured = await ensureStudent(input.studentName, input.sourceFolder)
  } else {
    const existingDir = join(workspacesRoot(), slugPart(input.studentName))
    if (!existsSync(join(existingDir, "student.json"))) throw new Error("学生资料文件夹不能为空")
    ensured = { studentDir: existingDir, brought: 0, hadBefore: 1 }
  }
  const taskPath = join("jobs", taskSlug(input.company, input.jobTitle))
  const taskDir = join(ensured.studentDir, taskPath)
  await mkdir(taskDir, { recursive: true })
  const task: Task = { id: randomUUID(), createdAt: new Date().toISOString(), studentDir: ensured.studentDir, taskDir, taskPath, input }
  await writeJson(join(taskDir, TASK_FILE), task)
  if (input.applicationUrl && input.platformUsername) savePlatformAccount(input.applicationUrl, input.platformUsername)
  log.info("task created", { id: task.id, student: input.studentName, company: input.company, jobTitle: input.jobTitle, taskDir })
  return ensured.hadBefore > 0 && ensured.brought > 0 ? { ...task, newMaterials: ensured.brought } : task
}

export async function listTasks(): Promise<Task[]> {
  const root = workspacesRoot()
  const tasks: Task[] = []
  for (const student of await readdir(root, { withFileTypes: true }).catch(() => [])) {
    if (!student.isDirectory() || student.name.startsWith(".")) continue
    const jobs = join(root, student.name, "jobs")
    for (const job of await readdir(jobs, { withFileTypes: true }).catch(() => [])) {
      if (!job.isDirectory()) continue
      const task = await readJson<Task>(join(jobs, job.name, TASK_FILE))
      if (!task?.id || !task.input?.company) continue
      tasks.push({ ...task, studentDir: join(root, student.name), taskDir: join(jobs, job.name), taskPath: join("jobs", job.name) })
    }
  }
  return tasks
}

export async function listStudents(): Promise<StudentGroup[]> {
  const groups = new Map<string, StudentGroup>()
  for (const task of await listTasks()) {
    const group = groups.get(task.studentDir) ?? { studentName: task.input.studentName, studentDir: task.studentDir, tasks: [] }
    group.tasks.push(task)
    groups.set(task.studentDir, group)
  }
  const recent = (t: Task) => Date.parse(t.lastOpenedAt ?? t.createdAt)
  const out = [...groups.values()]
  for (const group of out) group.tasks.sort((a, b) => a.createdAt.localeCompare(b.createdAt))
  return out.sort((a, b) => Math.max(...b.tasks.map(recent)) - Math.max(...a.tasks.map(recent)))
}

export async function getTask(taskDir: string): Promise<Task> {
  const task = (await listTasks()).find((t) => t.taskDir === taskDir)
  if (!task) throw new Error("找不到这个投递任务，它可能已被移动或删除。")
  return task
}

export async function updateTask(taskDir: string, patch: Partial<Pick<Task, "sessionID" | "lastOpenedAt" | "input">>) {
  const file = join(taskDir, TASK_FILE)
  const task = await readJson<Task>(file)
  if (!task) return
  await writeJson(file, { ...task, ...patch })
}

export async function countMaterials(studentDir: string) {
  let count = 0
  const walk = async (dir: string) => {
    for (const entry of await readdir(dir, { withFileTypes: true }).catch(() => [])) {
      if (entry.name.startsWith(".")) continue
      if (entry.isDirectory()) await walk(join(dir, entry.name))
      else if ((await stat(join(dir, entry.name)).catch(() => undefined))?.isFile()) count++
    }
  }
  await walk(join(studentDir, "materials"))
  return count
}
