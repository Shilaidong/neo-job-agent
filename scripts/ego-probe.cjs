// Development probe — ego lite (Plan 2), READ ONLY: it never clicks anything (a human-verification
// checkbox stays a human's job) and nothing from here ships in the app package.
//
// Three questions, in the order that decides the next phase (docs/ROADMAP.md, Plan 2):
//   1. Does the official agent path work — the ego-browser CLI talking to our vendored browser over
//      Mach bootstrap? (Measured 2026-10-05: yes, within seconds — but a FRESH profile is blocked
//      until the first-run onboarding GUI is completed; the default onboarded profile works as-is.)
//   2. Does ego lite let an EXTERNAL client attach over --remote-debugging-port? (Measured: yes,
//      even on the default profile — no Chrome 136-style refusal.)
//   3. A/B on the real UCAS login page: CLI-driven vs our CDP client attached (Runtime.enable on —
//      the posture Cloudflare flagged inside Electron). (Measured 2026-10-05: both arrive straight at
//      "Sign in | UCAS", no gate — the problem is the Electron attach, not the attach itself.)
//
//   run: node scripts/ego-probe.cjs                     (full A/B, default profile)
//        NEO_EGO_PROBE=cli ... / NEO_EGO_PROBE=cdp ...  (one side only)
//        NEO_EGO_PROBE_UD=fresh ...  (throwaway profile — the CLI side will stop at onboarding, which
//                                     is itself the measured answer to question 1's fine print)
"use strict"
const { spawn, spawnSync } = require("node:child_process")
const { existsSync, rmSync } = require("node:fs")
const path = require("node:path")

const root = path.join(__dirname, "..")
const vendored = path.join(root, "resources/vendor/ego-lite/ego lite.app")
const egoBinary = path.join(vendored, "Contents/MacOS/ego lite")
const egoCli = path.join(vendored, "Contents/Frameworks/ego Framework.framework/Versions/Current/Helpers/ego-browser")
const UCAS = "https://accounts.ucas.com/account/login"
const SETTLE_MS = 15_000 // a looping challenge announces itself within seconds; 15s is generous
const CDP_PORT = Number(process.env.NEO_EGO_PROBE_PORT || 9444)
const mode = process.env.NEO_EGO_PROBE || "ab"
const freshProfile = process.env.NEO_EGO_PROBE_UD === "fresh"

// The same page-read runs in both worlds; only the channel differs. Never a click, only a read.
const READ = String.raw`JSON.stringify({ title: document.title, url: location.href, body: ((document.body && document.body.innerText) || "").slice(0, 260), turnstile: !!document.querySelector('iframe[src*="challenges.cloudflare.com"], .cf-turnstile'), pwForm: !!document.querySelector("input[type=password]"), webdriver: navigator.webdriver, ua: navigator.userAgent })`

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const say = (line, data) => console.log(line + " " + JSON.stringify(data))
// Chromium outlives its own parent unless we sweep by path; the group kill alone has leaked before.
// After the kill, WAIT until the processes are really gone — a relaunch into a dying sibling's
// singleton lock answers nothing, and a 20-second poll then reads as "external CDP refused" (it did).
function sweep() {
  spawnSync("pkill", ["-f", "vendor/ego-lite/ego lite.app"])
  for (let i = 0; i < 20; i++) {
    const alive = spawnSync("pgrep", ["-f", "vendor/ego-lite/ego lite.app"], { encoding: "utf8" })
    if (!alive.stdout.trim()) break
    spawnSync("sleep", ["0.5"])
  }
  for (let i = 0; i < 5; i++) {
    try { rmSync("/tmp/neo-ego-probe-ud", { recursive: true, force: true }); return } catch { spawnSync("sleep", ["0.6"]) }
  }
}
function launch(extraArgs) {
  const args = freshProfile ? [`--user-data-dir=/tmp/neo-ego-probe-ud`, ...extraArgs] : extraArgs
  const child = spawn(egoBinary, ["--no-first-run", ...args], { detached: true, stdio: "ignore" })
  child.on("error", (e) => say("PROBE_LAUNCH_ERROR", { error: String(e) }))
  return child
}

async function probeCli() {
  if (freshProfile) rmSync("/tmp/neo-ego-probe-ud", { recursive: true, force: true })
  const t0 = Date.now()
  launch([])
  try {
    // Question 1: can the CLI reach the vendored browser? (Fresh profiles stop at onboarding — that is
    // a finding, not a bug: the CLI itself says "complete the onboarding process first".)
    // cliLog writes to STDERR — search both streams.
    for (let i = 0; i < 12; i++) {
      await sleep(5000)
      const r = spawnSync(egoCli, ["nodejs", "-e", "cliLog('pong:' + (await listTaskSpaces()).length)"], { encoding: "utf8", timeout: 20_000, input: "" })
      const out = (r.stdout || "") + (r.stderr || "")
      if (out.includes("pong:")) {
        say("PROBE_CLI_CONNECTED", { ms: Date.now() - t0, echo: out.trim() })
        break
      }
      if (i === 3) say("PROBE_CLI_WAITING", { seconds: 20, last: out.slice(0, 200) })
    }
    // Question 3a: what page does the CLI path get on the real UCAS login? Read only.
    const script = [
      "const task = await useOrCreateTaskSpace('neo ucas read-only probe')",
      `await openOrReuseTab(${JSON.stringify(UCAS)}, { wait: true, timeout: 40 })`,
      `await new Promise(r => setTimeout(r, ${SETTLE_MS}))`,
      "cliLog('READ ' + (await js(" + JSON.stringify(READ) + ")))",
      "await closeTab()",
    ].join("\n")
    const run = spawnSync(egoCli, ["nodejs"], { encoding: "utf8", timeout: 120_000, input: script })
    const out = (run.stdout || "") + (run.stderr || "")
    const line = out.split("\n").find((l) => l.startsWith("READ "))
    return { ok: !!line, read: line ? JSON.parse(line.slice(5)) : null, stderr: line ? undefined : out.slice(0, 300) }
  } finally {
    sweep()
  }
}

async function probeCdp() {
  const base = `http://127.0.0.1:${CDP_PORT}`
  // In the A/B flow the previous instance died seconds ago; its singleton lock can swallow this launch
  // (observed: an answer that a standalone run gets in 2s never comes). Sweep, launch, poll — once more
  // on silence.
  const poll = async (rounds) => {
    for (let i = 0; i < rounds; i++) {
      await sleep(2000)
      const v = await fetch(`${base}/json/version`, { signal: AbortSignal.timeout(3000) }).then((r) => r.json()).catch(() => null)
      if (v) return v
    }
    return null
  }
  sweep()
  launch([`--remote-debugging-port=${CDP_PORT}`])
  let version = await poll(15)
  if (!version) {
    say("PROBE_CDP_RETRY", { why: "first launch answered nothing — sweeping and relaunching" })
    sweep()
    launch([`--remote-debugging-port=${CDP_PORT}`])
    version = await poll(15)
  }
  try {
    // Question 2: does ego lite answer an external /json/version at all?
    if (!version) return { ok: false, why: "no answer on /json/version on two clean launches — external CDP refused or the browser does not start" }
    say("PROBE_CDP_LISTENING", { browser: version.Browser })
    // Question 3b: attach a plain CDP client and drive the page THROUGH it — Runtime.enable is the
    // domain Cloudflare keys on, and it is exactly what cdp.ts will do for real in phase 3.
    const ws = new WebSocket(version.webSocketDebuggerUrl)
    await new Promise((r, j) => ((ws.onopen = r), (ws.onerror = () => j(new Error("ws refused")))))
    let mid = 0
    const pending = new Map()
    let navigations = 0
    ws.onmessage = (e) => {
      const m = JSON.parse(e.data)
      if (m.id && pending.has(m.id)) pending.get(m.id)(m), pending.delete(m.id)
      if (m.method === "Page.frameNavigated" && !m.params.frame.parentId) navigations++
    }
    const send = (method, params = {}, sessionId) => new Promise((r) => { const id = ++mid; pending.set(id, r); ws.send(JSON.stringify(sessionId ? { id, method, params, sessionId } : { id, method, params })) })
    await send("Target.createTarget", { url: UCAS })
    await sleep(8000)
    // UCAS first, ANY page only as a fallback — an `||` inside one find lets a restored tab win on list order.
    const targets = await fetch(`${base}/json/list`).then((r) => r.json())
    const page = targets.find((t) => t.url.includes("ucas.com")) ?? targets.find((t) => t.type === "page")
    const att = await send("Target.attachToTarget", { targetId: page.id, flatten: true })
    const sessionId = att.result.sessionId
    await send("Runtime.enable", {}, sessionId)
    await send("Page.enable", {}, sessionId)
    await sleep(SETTLE_MS)
    const read = await send("Runtime.evaluate", { expression: READ, returnByValue: true }, sessionId)
    return { ok: true, navigations, read: JSON.parse(read.result.result.value) }
  } catch (error) {
    return { ok: false, why: String(error) }
  } finally {
    sweep()
  }
}

// A challenge that loops looks like: repeated main-frame navigations, or the settle window still
// ending on gate wording. Real UCAS login = title "Sign in | UCAS" (plus the password form).
const verdict = (r) => {
  const read = r && r.read
  if (!read) return r && r.why ? `FAILED: ${r.why}` : "FAILED"
  if ((r.navigations ?? 0) > 3) return `LOOPING (${r.navigations} main-frame navigations in the settle window)`
  if (read.turnstile || /one more step|verify you are|请稍候|正在验证|just a moment/i.test(read.body + " " + read.title)) return "GATE (challenge page after settle)"
  if (read.pwForm || /sign in/i.test(read.title)) return "LOGIN PAGE (no gate)"
  return "UNKNOWN — read the dump above"
}

async function main() {
  if (!existsSync(egoBinary)) throw new Error(`vendored ego lite missing — run \`bun run fetch:ego\` first`)
  // The vendored copy shares the DEFAULT profile (and its singleton lock) with any ego lite the machine
  // already runs — and it is that instance's CLI the probe would then be talking to. sweep() pkills by
  // vendor path only. So refuse to measure anything but our own copy, and say so.
  const running = spawnSync("pgrep", ["-fl", "ego lite.app"], { encoding: "utf8" }).stdout
  const foreign = running.split("\n").filter((l) => l.trim() && !l.includes("vendor/ego-lite"))
  if (foreign.length) {
    say("PROBE_ABORT", { why: "an ego lite outside resources/vendor is running — it would answer (or swallow) what this probe measures", pids: foreign.map((l) => l.trim().split(" ")[0]) })
    process.exit(2)
  }
  const cli = mode === "cdp" ? null : await probeCli()
  if (cli) say("PROBE_CLI_RESULT", { verdict: verdict(cli), ...cli })
  const cdp = mode === "cli" ? null : await probeCdp()
  if (cdp) say("PROBE_CDP_RESULT", { verdict: verdict(cdp), ...cdp })
  if (cli && cdp) {
    say("PROBE_AB", {
      cli: verdict(cli),
      cdp: verdict(cdp),
      conclusion:
        verdict(cdp).startsWith("GATE") && !verdict(cli).startsWith("GATE")
          ? "external CDP attach reintroduces the gate — the CLI bridge is the control path"
          : verdict(cli) === verdict(cdp)
            ? "both paths see the same thing (" + verdict(cli) + ")"
            : "mixed — read both dumps above before deciding",
    })
  }
  process.exit(0)
}
main().catch((e) => (console.error(e), process.exit(1)))
