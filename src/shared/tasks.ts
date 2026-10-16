export const JOB_TYPES = ["实习", "全职", "兼职", "远程", "其他"] as const
export const TASK_GOALS = ["全流程投递", "仅整理材料", "仅生成简历", "继续上次投递"] as const

/**
 * One job application the agent will do. What the consultant fills in — the rest (reading materials,
 * building the resume, filling the application form on the left, saving drafts) belongs to the AI.
 *
 * Auto-login follows the same contract as its sister app (neo-app-agent): whatever is pasted into
 * `platformLogin` rides along verbatim, the software never parses it — the model reads it and hands
 * the pair back to browser_login as arguments. A student-wide credentials memo (编辑页) works the
 * same way. Passwords land in the machine-local encrypted store, never the workspace, never the cloud.
 */
export type TaskInput = {
  studentName: string
  /** The student's original folder; its files are copied into the workspace, never moved. Required the first time, optional afterwards (一键投递 reuses the student's existing materials). */
  sourceFolder?: string
  jobType: string
  taskGoal: string
  outputLanguage: "zh" | "en"
  allowUpload: boolean
  allowAutoLogin?: boolean
  company: string
  jobTitle: string
  applicationUrl?: string
  platformUsername?: string
  platformLogin?: string
  deadline?: string
  salary?: string
  notes?: string
}

export type Task = {
  id: string
  createdAt: string
  /** <workspaces>/<student>: the agent's working directory, shared by every application of this student. */
  studentDir: string
  /** <studentDir>/jobs/<company>-<jobTitle>: this application's own folder. */
  taskDir: string
  /** `jobs/<company>-<jobTitle>` — how the agent is told where this application lives. */
  taskPath: string
  input: TaskInput
  sessionID?: string
  lastOpenedAt?: string
  reusedExisting?: boolean
  /** Only on a freshly created task: how many files this source folder brought that the student did not have yet. */
  newMaterials?: number
}

export type PlatformAccount = { platformHost: string; username: string; updatedAt: string }

export type StudentGroup = { studentName: string; studentDir: string; tasks: Task[] }
