import { existsSync, readFileSync } from "node:fs"
import { join } from "node:path"
import { parseEnv } from "node:util"
import { app } from "electron"
import { appRoot } from "./paths"

/**
 * Keys and endpoints that belong to this machine, not to the code: the Jev key, the consultant's own model server.
 * Dev: `.env.local` at the repo root (gitignored). Installed app: `local.env` in the app's data folder
 * (~/Library/Application Support/Terra-Edu Neo Application Agent/). The environment wins over both.
 * A settings screen replaces this file with M5.
 */
export const localEnvFile = () => (app.isPackaged ? join(app.getPath("userData"), "local.env") : join(appRoot, ".env.local"))

let cached: Record<string, string | undefined> | undefined
export function localEnv(name: string): string | undefined {
  if (!cached) {
    const file = localEnvFile()
    try {
      cached = existsSync(file) ? parseEnv(readFileSync(file, "utf8")) : {}
    } catch {
      cached = {}
    }
  }
  return process.env[name] || cached[name]
}
