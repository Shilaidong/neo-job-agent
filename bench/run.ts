// One benchmark run, start to finish:
//   bun bench/run.ts <portal> <student> [--seed N] [--minutes 30] [--nudges 0] [--model provider/model] [--full]
//
// No --seed: the canonical dev instance (portal-a / portal-d). With --seed: a freshly reskinned instance, which is
// the only way sealed portals (b, c, e) may be run. Sealed runs print the numbers-only scorecard unless --full.
// The app is started unattended (`electron . --run`): it gets the student's materials folder and the URL, nothing else.
import { spawn } from "node:child_process"
import { cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join, resolve } from "node:path"

const args = process.argv.slice(2)
const flag = (name: string) => (args.includes(name) ? args[args.indexOf(name) + 1] : undefined)
const [portal, student] = args.filter((a, i) => !a.startsWith("--") && !["--seed", "--minutes", "--nudges", "--model"].includes(args[i - 1]))
if (!portal || !student) {
  console.error("usage: bun bench/run.ts <portal> <student> [--seed N] [--minutes 30] [--nudges 0] [--model provider/model] [--full]")
  process.exit(2)
}
const bench = import.meta.dir
const repo = resolve(bench, "..")
const seed = flag("--seed")
const sealed = !existsSync(join(bench, "sites", portal))
if (sealed && !seed) throw new Error(`${portal} is sealed: run it with a fresh --seed`)

const stampName = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19)
const out = join(bench, "_runs", `${stampName}-${portal}-${student}${seed ? `-s${seed}` : ""}`)
mkdirSync(out, { recursive: true })
// What the model can reach lives far from bench/: its workspace, and a copy of the materials with no truth.json beside it.
const arena = mkdtempSync(join(tmpdir(), "neo-arena-"))
cpSync(join(bench, "students", student, "materials"), join(arena, "materials"), { recursive: true })

const sh = (cmd: string[], opts: { env?: Record<string, string | undefined>; quiet?: boolean } = {}) =>
  new Promise<{ code: number; text: string }>((done) => {
    const child = spawn(cmd[0], cmd.slice(1), { cwd: repo, env: { ...process.env, ...opts.env } })
    let text = ""
    const take = (chunk: Buffer) => ((text += chunk), opts.quiet || process.stdout.write(chunk))
    child.stdout.on("data", take)
    child.stderr.on("data", take)
    child.on("close", (code) => done({ code: code ?? 1, text }))
  })

let site = join(bench, "sites", portal)
let answers: string | undefined
if (seed) {
  const made = await sh(["bun", "bench/reskin.ts", portal, "--seed", seed, "--out", join(out, "instance")], { quiet: true })
  if (made.code) throw new Error(`reskin failed:\n${made.text}`)
  site = join(out, "instance", "site")
  answers = join(out, "instance", "answers")
}

const server = spawn("bun", ["bench/serve.ts", site], { cwd: repo })
const url = await new Promise<string>((ok, fail) => {
  let text = ""
  server.stdout.on("data", (chunk) => {
    text += chunk
    const m = /URL: (\S+)/.exec(text)
    if (m) ok(m[1])
  })
  server.on("close", () => fail(new Error(`serve.ts exited:\n${text}`)))
})

try {
  const title = /<title>([^<]*)/.exec(await (await fetch(url)).text())?.[1] ?? portal
  const school = title.split(/\s+[-–|·]\s+/)[0].trim()
  const task = {
    studentName: student, sourceFolder: join(arena, "materials"), applicationType: "硕士", taskGoal: "全流程执行",
    outputLanguage: "zh", allowUpload: true, school, program: "见材料里的《申请计划》", applicationUrl: url,
    notes: "把这份网申从头到尾填好、每一页都存好草稿。不要提交、不要付款、不要给推荐人发邀请。",
  }
  writeFileSync(join(out, "task.json"), JSON.stringify(task, null, 2))

  if ((await sh(["bunx", "electron-vite", "build"], { quiet: true })).code) throw new Error("build failed")
  const run = await sh(["bunx", "electron", ".", "--run"], {
    env: {
      NEO_RUN_TASK: join(out, "task.json"), NEO_RUN_OUT: out, NEO_RUN_DUMP: "JSON.stringify(window.__bench_state())",
      NEO_RUN_MINUTES: flag("--minutes") ?? "30", NEO_RUN_NUDGES: flag("--nudges") ?? "0", NEO_MODEL: flag("--model") ?? process.env.NEO_MODEL,
      NEO_WORKSPACES_ROOT: join(arena, "workspaces"),
    },
  })
  writeFileSync(join(out, "console.txt"), run.text)

  const meta = JSON.parse(readFileSync(join(out, "run.json"), "utf8"))
  writeFileSync(join(out, "harness.json"), JSON.stringify({ ...meta, said: undefined, tokensIn: meta.tokens?.input, tokensOut: meta.tokens?.output, seed: seed ?? "canon" }, null, 2))
  const scored = await sh(
    ["bun", "bench/score.ts", portal, student, join(out, "state.json"), ...(answers ? ["--answers", answers] : []), "--meta", join(out, "harness.json"), ...(sealed && !args.includes("--full") ? ["--summary"] : [])],
    { quiet: true },
  )
  writeFileSync(join(out, "score.txt"), scored.text)
  console.log(`\n${scored.text.split("\n---JSON---")[0]}\n\nresults: ${out}`)
} finally {
  server.kill()
}
