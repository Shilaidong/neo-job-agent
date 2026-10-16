import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { app, safeStorage } from "electron"
import { createLogger } from "./log"

const log = createLogger("store")

/**
 * Small JSON files under userData. `secret: true` encrypts the file with the OS keychain
 * (Electron safeStorage) — used for the advisor's login session.
 */
export function openStore<T extends Record<string, unknown>>(name: string, options: { secret?: boolean } = {}) {
  const path = () => join(app.getPath("userData"), `${name}.${options.secret ? "bin" : "json"}`)
  let cache: T | undefined

  const read = (): T => {
    if (cache) return cache
    try {
      if (!existsSync(path())) return (cache = {} as T)
      const raw = readFileSync(path())
      const text = options.secret ? safeStorage.decryptString(raw) : raw.toString("utf8")
      cache = JSON.parse(text) as T
    } catch (error) {
      // An unreadable store (keychain changed, truncated write) must not brick the app: start clean.
      log.warn("store unreadable, starting empty", { name, error })
      cache = {} as T
    }
    return cache
  }

  const write = (next: T) => {
    cache = next
    const text = JSON.stringify(next, null, options.secret ? 0 : 2)
    if (options.secret && !safeStorage.isEncryptionAvailable()) {
      log.warn("keychain unavailable; keeping secret store in memory only", { name })
      return
    }
    mkdirSync(dirname(path()), { recursive: true })
    const tmp = `${path()}.tmp`
    writeFileSync(tmp, options.secret ? safeStorage.encryptString(text) : text, { mode: 0o600 })
    renameSync(tmp, path())
  }

  return {
    get: <K extends keyof T>(key: K): T[K] | undefined => read()[key],
    set: <K extends keyof T>(key: K, value: T[K]) => write({ ...read(), [key]: value }),
    delete: <K extends keyof T>(key: K) => {
      const next = { ...read() }
      delete next[key]
      write(next)
    },
    all: () => ({ ...read() }),
  }
}
