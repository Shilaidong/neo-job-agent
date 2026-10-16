import { existsSync } from "node:fs"
import { mkdir, readFile, writeFile } from "node:fs/promises"
import { join } from "node:path"
import { app } from "electron"
import guide from "../../resources/AGENTS.workspace.md?raw"
import profileKeys from "../../resources/profile-keys.json?raw"

export const WORKSPACES_DIRNAME = "Terra-Edu Neo Job Agent"

export function workspacesRoot() {
  return process.env.NEO_WORKSPACES_ROOT || join(app.getPath("documents"), WORKSPACES_DIRNAME, "workspaces")
}

/**
 * A workspace is just a folder the agent lives in. We create it, drop the one-page guide in,
 * and otherwise leave its layout to the model.
 */
export async function ensureWorkspace(name: string) {
  const dir = join(workspacesRoot(), name)
  await mkdir(join(dir, "materials"), { recursive: true })
  await writeGuide(dir)
  return dir
}

/** The guide is ours, not the consultant's: keep it current with the app version. */
export async function writeGuide(dir: string) {
  const guidePath = join(dir, "AGENTS.md")
  const current = existsSync(guidePath) ? await readFile(guidePath, "utf8") : ""
  if (current !== guide) await writeFile(guidePath, guide)
  // The answer bank's vocabulary travels with the guide: the model writes student_profile.json in these keys.
  const keysPath = join(dir, "profile-keys.json")
  const keysNow = existsSync(keysPath) ? await readFile(keysPath, "utf8") : ""
  if (keysNow !== profileKeys) await writeFile(keysPath, profileKeys)
}
