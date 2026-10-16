import { existsSync } from "node:fs"
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises"
import os from "node:os"
import path from "node:path"

// ego lite (Plan 2, 2026-10-05): the closed-source Chromium fork UCAS pages are going to run in on the
// consultant's Mac. Like the other extraResources, this must run before `package:mac:x64`: it stages
// the app bundle into resources/vendor/ego-lite/ (gitignored), where electron-builder picks it up.
// Honest record lives in docs/ROADMAP.md's Plan 2 entry — including that the ego repo's MIT covers the
// repo's contents only, not this browser download, which we ship inside our own internal installer.
const url = "https://cdn.ego.app/setup/macos/x64/egolite.dmg"
const outDir = path.resolve("resources/vendor/ego-lite")
const target = path.join(outDir, "ego lite.app")
const stampFile = path.join(outDir, ".ego-version")

async function run(command: string[], capture = false) {
  const child = Bun.spawn(command, { cwd: path.resolve("."), stdout: capture ? "pipe" : "inherit", stderr: "inherit" })
  const out = capture ? await new Response(child.stdout).text() : ""
  if ((await child.exited) !== 0) throw new Error(`Command failed: ${command.join(" ")}`)
  return out
}

// A half-copied bundle can already carry the right Info.plist, so a trusted copy is one whose CLI
// helper is present too. Throwing is never an answer here: an unreadable bundle just means "re-fetch".
const versionOf = async (app: string) => {
  if (!existsSync(path.join(app, "Contents", "Frameworks", "ego Framework.framework"))) return ""
  try {
    return (await run(["plutil", "-extract", "CFBundleShortVersionString", "raw", path.join(app, "Contents", "Info.plist")], true)).trim()
  } catch {
    return ""
  }
}

if (process.platform !== "darwin") throw new Error("ego lite is staged into macOS customer packages only.")

// Re-run cheap: a stamp file (written only after a complete extract) says what is already in place.
// An interrupted earlier run is the case to survive: kill the stamp before touching the copy, so a
// leftover partial bundle can never be believed again — the worst outcome is a broken ego shipping
// inside the installer.
if (existsSync(stampFile)) {
  const have = await versionOf(target)
  if (have && have === (await readFile(stampFile, "utf8")).trim()) {
    console.log(`ego lite ${have} already staged at ${target} — nothing to do`)
    process.exit(0)
  }
  await rm(stampFile, { force: true })
}

const tmp = await mkdtemp(path.join(os.tmpdir(), "ego-fetch-"))
const dmg = path.join(tmp, "egolite.dmg")
try {
  // This machine's uplink drops requests (today has proven it many times): let curl retry rather than the caller.
  await run(["curl", "-fL", "--retry", "3", "--retry-delay", "5", "-o", dmg, url])
  const attached = await run(["hdiutil", "attach", "-nobrowse", "-readonly", "-noautoopen", dmg], true)
  const mount = attached.trim().split("\n").at(-1)!.split("\t").at(-1)!.trim()
  try {
    // Usually "ego lite.app" sits at the volume root; search rather than assume (install.sh handles a pkg too).
    const root = path.join(mount, "ego lite.app")
    let found = root
    if (!existsSync(root)) {
      const listing = await run(["find", mount, "-maxdepth", "3", "-name", "ego lite.app", "-type", "d"], true)
      found = listing.trim().split("\n")[0] ?? ""
      if (!found) throw new Error(`the mounted DMG holds no "ego lite.app" — mounted at ${mount}`)
    }
    await rm(target, { recursive: true, force: true })
    await mkdir(outDir, { recursive: true })
    await run(["ditto", found, target])
  } finally {
    await run(["hdiutil", "detach", mount, "-force"])
  }
  const version = await versionOf(target)
  if (!version) throw new Error("extracted bundle has no version — the DMG layout changed, check it by hand")
  await writeFile(stampFile, version)
  console.log(`ego lite ${version} staged at ${target}`)
} finally {
  await rm(tmp, { recursive: true, force: true })
}
