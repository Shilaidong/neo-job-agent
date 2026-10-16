import { appendFileSync, mkdirSync, readdirSync, rmSync } from "node:fs"
import { join } from "node:path"
import { app } from "electron"
import { sanitize } from "./log-sanitize"

export { sanitize }

/**
 * One log file per launch, one JSON object per line:
 *   {"t":"2026-09-19T00:41:07.512Z","lvl":"info","mod":"tool","msg":"browser_fill ok","ms":412,...}
 * Written synchronously so the last lines before a crash are on disk. See docs/LOGGING.md.
 */
export type Level = "debug" | "info" | "warn" | "error"
const ORDER: Record<Level, number> = { debug: 10, info: 20, warn: 30, error: 40 }
const KEEP_FILES = 20

let file: string | undefined
let threshold: number = ORDER.debug
let mirror = false

export function initLogging() {
  const dir = process.env.NEO_LOG_DIR || app.getPath("logs")
  mkdirSync(dir, { recursive: true })
  const stamp = new Date().toISOString().replace(/[-:]/g, "").replace("T", "-").slice(0, 15)
  file = join(dir, `neo-${stamp}-${process.pid}.log`)
  threshold = ORDER[(process.env.NEO_LOG_LEVEL as Level) || "debug"] ?? ORDER.debug
  mirror = Boolean(process.env.NEO_DEBUG) || !app.isPackaged

  try {
    const old = readdirSync(dir).filter((name) => /^neo-.*\.log$/.test(name)).sort()
    for (const name of old.slice(0, Math.max(0, old.length - (KEEP_FILES - 1)))) rmSync(join(dir, name), { force: true })
  } catch {
    // pruning is best-effort
  }

  const log = createLogger("app")
  process.on("uncaughtException", (error) => log.error("uncaught exception", { error }))
  process.on("unhandledRejection", (reason) => log.error("unhandled rejection", { error: reason }))
  log.info("launch", {
    version: app.getVersion(),
    electron: process.versions.electron,
    chrome: process.versions.chrome,
    platform: process.platform,
    arch: process.arch,
    packaged: app.isPackaged,
    argv: process.argv.slice(1),
    logFile: file,
  })
  return file
}

export const currentLogFile = () => file

function write(level: Level, mod: string, msg: string, data?: Record<string, unknown>) {
  if (ORDER[level] < threshold) return
  const line = JSON.stringify({ t: new Date().toISOString(), lvl: level, mod, msg, ...(sanitize(data ?? {}) as object) })
  if (file) {
    try {
      appendFileSync(file, `${line}\n`)
    } catch {
      // a full disk must not take the app down
    }
  }
  if (mirror && (level !== "debug" || process.env.NEO_DEBUG)) process.stderr.write(`[${mod}] ${level} ${msg}${data ? ` ${JSON.stringify(sanitize(data))}` : ""}\n`)
}

export type Logger = ReturnType<typeof createLogger>

export function createLogger(mod: string) {
  const at = (level: Level) => (msg: string, data?: Record<string, unknown>) => write(level, mod, msg, data)
  return {
    debug: at("debug"),
    info: at("info"),
    warn: at("warn"),
    error: at("error"),
    /** Time an operation: logs `<msg> ok` with `ms`, or `<msg> failed` with the error, and rethrows. */
    async time<T>(msg: string, fn: () => Promise<T>, data?: Record<string, unknown>, describe?: (result: T) => Record<string, unknown>): Promise<T> {
      const started = Date.now()
      try {
        const result = await fn()
        write("info", mod, `${msg} ok`, { ms: Date.now() - started, ...data, ...describe?.(result) })
        return result
      } catch (error) {
        write("error", mod, `${msg} failed`, { ms: Date.now() - started, ...data, error })
        throw error
      }
    },
  }
}
