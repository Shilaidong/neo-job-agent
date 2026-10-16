import { execFileSync, spawn, type ChildProcess } from "node:child_process"
import { randomBytes } from "node:crypto"
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs"
import { createServer } from "node:net"
import { createRequire } from "node:module"
import { dirname, join } from "node:path"
import { app } from "electron"
import { createOpencodeClient, type OpencodeClient } from "@opencode-ai/sdk/v2/client"
import type { BrowserMcp } from "./browser/mcp"
import { createLogger } from "./log"
import { cloudModels, ownConfigs } from "./model-servers"
import { cloudProviderConfigs } from "./model-server-core"
import { waitForHealth } from "./ready"

const log = createLogger("opencode")

const nodeRequire = createRequire(import.meta.url)

/**
 * The stock OpenCode CLI binary for this machine's architecture. We never bundle a fork:
 * `opencode-ai` ships one prebuilt binary per platform/arch (darwin-x64, darwin-arm64, …)
 * and the package manager installs the one matching the build machine.
 */
export function findOpencodeBinary() {
  const override = process.env.NEO_OPENCODE_BIN
  if (override) return override
  const pkg = `opencode-${process.platform}-${process.arch}`
  const packaged = join(process.resourcesPath || "", "opencode", "opencode")
  if (app.isPackaged && existsSync(packaged)) return packaged
  try {
    return join(dirname(nodeRequire.resolve(`${pkg}/package.json`)), "bin", "opencode")
  } catch {
    return "opencode" // fall back to whatever is on PATH
  }
}

function freePort() {
  return new Promise<number>((resolve, reject) => {
    const probe = createServer()
    probe.once("error", reject)
    probe.listen(0, "127.0.0.1", () => {
      const { port } = probe.address() as { port: number }
      probe.close(() => resolve(port))
    })
  })
}

const pidFile = () => join(app.getPath("userData"), "opencode.pid")

/**
 * A crash or force-quit cannot run our shutdown code, so the server it started would live on.
 * Remember its pid and, next launch, put down whatever a previous run left behind.
 */
function reapPreviousServer() {
  try {
    const pid = Number(readFileSync(pidFile(), "utf8"))
    // Only ever signal something that is still an `opencode serve` we could have started.
    const command = pid > 1 ? execFileSync("ps", ["-o", "command=", "-p", String(pid)], { encoding: "utf8" }) : ""
    if (/opencode(\S*)? serve\b/.test(command)) {
      log.warn("reaping server left by a previous run", { pid })
      process.kill(pid)
    }
  } catch {
    // no pid file, or the process is already gone
  }
  rmSync(pidFile(), { force: true })
}

export type OpencodeHandle = {
  client: OpencodeClient
  directory: string
  binary: string
  stop: () => void
}

/** Run `opencode serve` headless inside the workspace, with our browser tools plugged in over MCP. */
export async function startOpencode(input: { workspace: string; mcp: BrowserMcp }): Promise<OpencodeHandle> {
  reapPreviousServer()
  const binary = findOpencodeBinary()

  // The consultant's own model servers, one provider each: the settings screen's entries plus the one from
  // local.env (NEO_LOCAL_*), which the self-tests still run on. Shapes are built and tested in model-server-core.ts.
  // Cloud rows merge model definitions into opencode's OWN providers (ids newer than its catalog, like MiniMax
  // M3.1): no address, no key — the login is opencode's and we never touch it. Own providers spread last, so
  // a hand-typed provider id on a cloud row can never clobber a real server entry.
  const owns = ownConfigs()
  const provider = { ...cloudProviderConfigs(cloudModels()), ...Object.fromEntries(owns.map((own) => [own.providerID, own.provider])) }
  const config = {
    $schema: "https://opencode.ai/config.json",
    ...(Object.keys(provider).length ? { provider } : {}),
    autoupdate: false,
    share: "disabled",
    // 先全部放开：能跑起来之后再按需要收紧。
    permission: "allow",
    mcp: {
      browser: {
        type: "remote",
        url: input.mcp.url,
        headers: { Authorization: `Bearer ${input.mcp.token}` },
        oauth: false,
        // 点到“提交/付款/推荐信”时工具调用会一直等顾问做决定。
        timeout: 30 * 60 * 1000,
      },
      materials: {
        type: "remote",
        url: input.mcp.materialsUrl,
        headers: { Authorization: `Bearer ${input.mcp.token}` },
        oauth: false,
        // a stack of scanned pages takes minutes
        timeout: 30 * 60 * 1000,
      },
      resume: {
        type: "remote",
        url: input.mcp.resumeUrl,
        headers: { Authorization: `Bearer ${input.mcp.token}` },
        oauth: false,
        // LaTeX compiles are slow the first time (package downloads under tectonic)
        timeout: 30 * 60 * 1000,
      },
    },
  }

  /** One spawn + client + clean-up, ready to be thrown away and retried. */
  const boot = (port: number, password: string) => {
    let exited: string | undefined
    // The config carries provider keys and the MCP bearer — it goes where OpenCode reads it from
    // (its own XDG_CONFIG_HOME file, which the model's shell cannot printenv), never into the
    // environment the shell tool inherits (2026-10-11 review P2-6).
    const configHome = join(app.getPath("userData"), "opencode", "config")
    const globalConfig = join(configHome, "opencode", "opencode.json")
    try {
      mkdirSync(dirname(globalConfig), { recursive: true })
      writeFileSync(globalConfig, JSON.stringify(config, null, 2), { mode: 0o600 })
    } catch (error) {
      log.error("cannot write the opencode global config — model servers may not show up", { error })
    }
    const child: ChildProcess = spawn(binary, ["serve", "--hostname", "127.0.0.1", "--port", String(port)], {
      cwd: input.workspace,
      env: {
        ...process.env,
        // Ours, not the model's: OpenCode's shell tool inherits this environment.
        NEO_JEV_KEY: undefined,
        NEO_TYPESAFE_KEY: undefined,
        NEO_LOCAL_KEY: undefined,
        // Everything OpenCode reads and writes belongs to this app: its global config (and the skills next to it),
        // credentials, the model catalog and conversations live under userData — not the machine's ~/.config /
        // ~/.local / ~/.cache. A machine's own skills (~/.agents/skills, ~/.claude/skills) are scanned off HOME,
        // not XDG, so that door is shut by name too: the fill model sees its own workspace's skills, nothing else.
        XDG_CONFIG_HOME: configHome,
        XDG_DATA_HOME: join(app.getPath("userData"), "opencode", "data"),
        XDG_CACHE_HOME: join(app.getPath("userData"), "opencode", "cache"),
        OPENCODE_DISABLE_EXTERNAL_SKILLS: "1",
        OPENCODE_SERVER_PASSWORD: password,
        OPENCODE_ENABLE_QUESTION_TOOL: "1",
        OPENCODE_DISABLE_AUTOUPDATE: "1",
      },
      stdio: ["ignore", "pipe", "pipe"],
    })
    log.info("spawn", { binary, port, pid: child.pid, cwd: input.workspace, mcp: input.mcp.url })
    // The server's own output: quiet when healthy, the first place to look when a model call fails.
    const pipe = (stream: "stdout" | "stderr") => (chunk: Buffer) => {
      for (const line of chunk.toString("utf8").split("\n")) if (line.trim()) log[stream === "stderr" ? "warn" : "info"](`${stream}: ${line.trimEnd()}`)
    }
    child.stdout?.on("data", pipe("stdout"))
    child.stderr?.on("data", pipe("stderr"))

    if (child.pid) writeFileSync(pidFile(), String(child.pid))
    const stop = () => {
      if (child.exitCode === null && !child.killed) child.kill()
      rmSync(pidFile(), { force: true })
    }
    // `app.exit()`, Ctrl+C in dev and SIGTERM all skip Electron's quit events; this does not.
    process.once("exit", stop)
    for (const signal of ["SIGINT", "SIGTERM", "SIGHUP"] as const) process.once(signal, () => (stop(), process.exit(0)))

    child.once("exit", (code, signal) => {
      exited = `opencode 退出（code=${code} signal=${signal}）`
      log[code === 0 || signal === "SIGTERM" ? "info" : "error"]("exit", { code, signal, pid: child.pid })
    })
    child.once("error", (error) => {
      exited = `无法启动 opencode（${binary}）：${error.message}`
      log.error("spawn failed", { binary, error })
    })

    const client = createOpencodeClient({
      baseUrl: `http://127.0.0.1:${port}`,
      directory: input.workspace,
      headers: { Authorization: `Basic ${Buffer.from(`opencode:${password}`).toString("base64")}` },
    })
    return { client, stop, exited: () => exited }
  }

  // A stale network can stall opencode's startup for minutes (the models.dev catalog fetch has no
  // timeout of its own); a fresh process gets out of that state, so a deadline miss restarts once
  // before giving up. Seen on the Intel Mac: two e2e runs hit a ~30-minute bad window and failed
  // only because there was no retry.
  for (let attempt = 1; ; attempt++) {
    const port = await freePort()
    const password = randomBytes(24).toString("hex")
    const { client, stop, exited } = boot(port, password)
    const started = Date.now()
    const health = await waitForHealth(() => client.global.health().then((h) => (h as { data?: unknown })?.data), { deadlineMs: 40_000, exited })
    if (health) {
      log.info("healthy", { ms: Date.now() - started, version: (health as { version?: unknown }).version })
      return { client, directory: input.workspace, binary, stop }
    }
    log.warn("opencode 服务 40 秒内没有就绪，杀掉重启再试一次", { attempt })
    stop()
    if (attempt >= 2) break
    await new Promise((resolve) => setTimeout(resolve, 400))
  }
  throw new Error("opencode 服务 40 秒内没有就绪（重启重试后仍未就绪）。")
}
