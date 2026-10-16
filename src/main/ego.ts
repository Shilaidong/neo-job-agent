import { spawn } from "node:child_process"
import { existsSync, readFileSync, writeFileSync, rmSync } from "node:fs"
import { mkdir } from "node:fs/promises"
import path from "node:path"
import { app } from "electron"
import { createLogger } from "./log"

const log = createLogger("ego")

/**
 * ego lite (Plan 2, 2026-10-05): a closed-source Chromium fork shipped inside our installer — UCAS pages
 * are going to run inside it on the consultant's Mac, where a challenge (if one ever appears) is also
 * something a person can pass with their own hands in a real browser window.
 *
 * THIS FILE ONLY INSTALLS. It copies the bundle out of the installer into our own runtime directory
 * (the same shape the old Terra app used) and clears the quarantine attribute, because a nested
 * un-notarised app would otherwise get blocked by Gatekeeper on the consultant's machine. Nothing here
 * ever starts the browser; the dev probe in scripts/ is the only thing allowed to run it until the
 * control path is decided (docs/ROADMAP.md, Plan 2). `NEO_EGO=off` disables even the copy.
 */

export type EgoPaths = { app: string; cli: string; version: string }

/** The CLI lives inside the app bundle (a Rust helper that talks to the browser over Mach bootstrap). */
export const egoCliIn = (appDir: string) => path.join(appDir, "Contents", "Frameworks", "ego Framework.framework", "Versions", "Current", "Helpers", "ego-browser")

const versionOf = (appDir: string) => {
  try {
    const plist = readFileSync(path.join(appDir, "Contents", "Info.plist"), "latin1")
    return plist.match(/<key>CFBundleShortVersionString<\/key>\s*<string>([^<]+)<\/string>/)?.[1] ?? ""
  } catch {
    return ""
  }
}

/** The runtime copy this app installed earlier (stage 3 starts exactly this bundle). */
export function installedEgoApp(): string | null {
  return existsSync(runtimeApp()) && versionOf(runtimeApp()) ? runtimeApp() : null
}

/** Where the installer left it (packaged) or where fetch:ego staged it (dev). Null when neither has it. */
export function bundledEgoApp(): { app: string; version: string } | null {
  const root = app.isPackaged ? path.join(process.resourcesPath, "ego-lite") : path.join(app.getAppPath(), "resources", "vendor", "ego-lite")
  const bundle = path.join(root, "ego lite.app")
  const version = versionOf(bundle)
  return existsSync(bundle) && version ? { app: bundle, version } : null
}

/** Our own runtime copy — under userData, so a dev run with --user-data-dir keeps the copy out of the real app's folder. */
const runtimeDir = () => path.join(app.getPath("userData"), "ego-runtime")
const runtimeApp = () => path.join(runtimeDir(), "ego lite.app")
const stampFile = () => path.join(runtimeDir(), ".ego-version")

const run = (command: string[]) =>
  new Promise<void>((resolve, reject) => {
    const child = spawn(command[0], command.slice(1), { stdio: "ignore" })
    child.on("error", reject)
    child.on("exit", (code) => (code === 0 ? resolve() : reject(new Error(`${command.join(" ")} exited with ${code}`))))
  })

/**
 * Copy the bundled ego lite into our runtime directory unless the right version is already there,
 * then clear the quarantine attribute on the copy. 400MB, so: run it in the background at boot,
 * never await it on the UI path, and tell the log what happened.
 */
export async function installEgoRuntime(): Promise<EgoPaths | null> {
  if (process.env.NEO_EGO === "off") {
    log.info("ego runtime install skipped", { why: "NEO_EGO=off" })
    return null
  }
  const bundled = bundledEgoApp()
  if (!bundled) {
    log.warn("no ego lite bundled with this build — nothing to install")
    return null
  }
  const target = runtimeApp()
  // A missing or unreadable stamp only means "check again", never "installation failed" — a good copy
  // without a stamp falls into the copy branch and re-stamps itself. (A throwing readFileSync inside
  // the `&&` here once meant every launch logged a failure and never repaired. Never trust the stamp
  // alone: a half-copied bundle can carry the right Info.plist, so the CLI helper is the integrity check.)
  const stamped = () => {
    try {
      return readFileSync(stampFile(), "utf8").trim() === bundled.version && existsSync(egoCliIn(target))
    } catch {
      return false
    }
  }
  try {
    if (versionOf(target) === bundled.version && stamped()) {
      log.info("ego runtime already current", { version: bundled.version })
    } else {
      await mkdir(runtimeDir(), { recursive: true })
      rmSync(target, { recursive: true, force: true })
      const started = Date.now()
      await run(["ditto", bundled.app, target])
      // Gatekeeper: the nested bundle carries a team signature but no notarisation ticket; inside an
      // archive it also picks up com.apple.quarantine. Clear it on OUR copy (the same command the
      // vendor's own install.sh runs).
      await run(["xattr", "-dr", "com.apple.quarantine", target])
      writeFileSync(stampFile(), bundled.version)
      log.info("ego runtime installed", { version: bundled.version, ms: Date.now() - started })
    }
    const cli = egoCliIn(target)
    if (!existsSync(cli)) throw new Error(`ego-browser helper missing under ${target}`)
    return { app: target, cli, version: bundled.version }
  } catch (error) {
    // An unfinished copy must not be read as a good one by the next launch.
    rmSync(stampFile(), { force: true })
    log.error("ego runtime install failed", { error })
    return null
  }
}
