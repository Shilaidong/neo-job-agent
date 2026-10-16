import { spawn } from "node:child_process"

/**
 * The official ego-browser CLI as our task-space channel (Plan 2 stage 4, docs/ROADMAP.md).
 * Page control stays on WS-CDP — the 21 tools never come through here. This file only speaks
 * ego's OWN language for what only ego can answer: does the browser accept the channel at all,
 * which task spaces exist, who owns one right now, and handing it over / taking it back.
 *
 * Measured 2026-10-06, all of it, on our runtime copy:
 * - The CLI takes `--ego-server-name=<name>` and the browser takes the same flag; a NAMED pair
 *   binds to each other deterministically (with two instances up, the named CLI only sees its own).
 *   An UNNAMED CLI that finds nothing spawns a hidden `--startup-ego-browser-service` instance —
 *   so every call here is named, no exceptions.
 * - Each call is its own process (the heredoc body is read off stdin to EOF; a persistent bridge
 *   was tried and does not work). A warm round costs 0.4-0.75s; the full lifecycle in ONE round
 *   (list → create space → open a real page → hand off → take back → complete) measured 1.71s.
 * - On a profile whose first-run wizard nobody has clicked, EVERY call — even `listTaskSpaces` —
 *   is refused with "Please complete the onboarding process first. A setup window has opened…"
 *   (ego itself shows the window; we only wait and retry). That refusal is `needsOnboarding`.
 * - `handOffTaskSpace` resolves {done:true} and KILLS the rest of the round — the hard stop
 *   replaces all later output. So handOff prints its marker BEFORE calling, or we would read a
 *   success as an error.
 */

/** The one server name pairing OUR browser with OUR CLI calls. Up to 64 ASCII [-_.] allowed. */
export const EGO_SERVER_NAME = "neo-app-agent"

export type EgoCliResult<T> = { ok: true; value: T } | { ok: false; error: string; needsOnboarding: boolean }

export const isOnboardingRefusal = (text: string) => /complete the onboarding/i.test(text)

/** The body sets NEO_OUT; we print it under the marker the parser looks for. */
export const wrapEgoScript = (body: string) => `let NEO_OUT\n${body}\ncliLog('NEO_RESULT:' + JSON.stringify(NEO_OUT))\n`

/**
 * Pick the last marker line (cliLog is the only output mechanism; later beats earlier).
 * cliLog lands on STDERR (measured against the real binary — the first REAL run proved it):
 * stdout carries whatever else the CLI prints. Markers are searched on stdout first, then stderr.
 */
export function parseEgoCliOutput(stdout: string, stderr: string): EgoCliResult<unknown> {
  for (const stream of [stdout, stderr]) {
    const lines = stream.split("\n")
    for (let i = lines.length - 1; i >= 0; i--) {
      const at = lines[i].indexOf("NEO_RESULT:")
      if (at < 0) continue
      try {
        return { ok: true, value: JSON.parse(lines[i].slice(at + "NEO_RESULT:".length)) as unknown }
      } catch {
        break // a corrupt marker is as good as none — try the other stream
      }
    }
  }
  const error = [stdout, stderr].map((t) => t.trim()).filter(Boolean).join("\n") || "ego-cli returned nothing"
  return { ok: false, error, needsOnboarding: isOnboardingRefusal(error) }
}

export class EgoCli {
  constructor(private readonly cliPath: string) {}

  /** One call = one CLI process: write the script, close stdin, read until it exits. */
  round<T>(script: string, timeoutMs = 15_000): Promise<EgoCliResult<T>> {
    return new Promise((resolve) => {
      let child: ReturnType<typeof spawn>
      try {
        child = spawn(this.cliPath, [`--ego-server-name=${EGO_SERVER_NAME}`, "nodejs"], { stdio: ["pipe", "pipe", "pipe"] })
      } catch (error) {
        resolve({ ok: false, error: String(error), needsOnboarding: false })
        return
      }
      let stdout = ""
      let stderr = ""
      child.stdout?.on("data", (d) => (stdout += d))
      child.stderr?.on("data", (d) => (stderr += d))
      // ego-browser reads the script before answering; a stuck call must not hang the app.
      const timer = setTimeout(() => {
        try {
          child.kill("SIGKILL")
        } catch {
          /* already gone */
        }
      }, timeoutMs)
      child.on("error", (error) => {
        clearTimeout(timer)
        resolve({ ok: false, error: String(error), needsOnboarding: false })
      })
      child.on("close", () => {
        clearTimeout(timer)
        resolve(parseEgoCliOutput(stdout, stderr) as EgoCliResult<T>)
      })
      child.stdin?.on("error", () => undefined) // dying early mid-write is read from the exit + text
      child.stdin?.write(script)
      child.stdin?.end()
    })
  }

  private body<T>(body: string, timeoutMs = 15_000) {
    return this.round<T>(wrapEgoScript(body), timeoutMs)
  }

  /** Does the official channel answer at all on this browser? A refusal carries the wizard gate. */
  ready() {
    return this.body<unknown[]>(`NEO_OUT = await listTaskSpaces()`)
  }

  /**
   * Create — or (across rounds and task reopens) reuse — the task's space.
   * A stale entry from a DEAD instance can sit in the registry under the same name (measured);
   * the reopen-when-numeric rule means it comes back alive, but if anything else refuses the
   * name we retry once under a unique one rather than trusting the ghost.
   */
  async ensureSpace(name: string): Promise<EgoCliResult<{ id: number; ownership: string }>> {
    const first = await this.body<{ id: number; ownership: string }>(`NEO_OUT = await useOrCreateTaskSpace(${JSON.stringify(name)})`)
    if (first.ok || first.needsOnboarding) return first
    const fresh = `${name} #${Date.now() % 1_000_000}`
    console.warn(`[ego-cli] task space "${name}" refused (${first.error.slice(0, 160)}) — retrying under "${fresh}"`)
    return this.body<{ id: number; ownership: string }>(`NEO_OUT = await useOrCreateTaskSpace(${JSON.stringify(fresh)})`)
  }

  /**
   * Open `url` in the space and return the tab's targetId — which is the SAME string our
   * `/json/list` shows for the page (measured), so the CDP side binds to it unchanged.
   * Numeric useOrCreateTaskSpace(id) selects an EXISTING space (it never creates) — every
   * round must select first, the CLI process carries nothing between calls.
   */
  async openTab(spaceId: number, url: string) {
    return this.body<{ id: string | null }>(
      `await useOrCreateTaskSpace(${spaceId})
NEO_OUT = { id: (await openOrReuseTab(${JSON.stringify(url)}, { wait: true, timeout: 30 }))?.targetId ?? null }`,
      45_000,
    )
  }

  /** Who holds the space right now: agent / agentDelegatedToUser / user / missing. */
  async ownership(spaceId: number) {
    return this.body<string>(
      `let own = 'missing'
try {
  await useOrCreateTaskSpace(${spaceId})
  const s = (await listTaskSpaces()).find((x) => x.id === ${spaceId})
  if (s) own = s.ownership
} catch {}
NEO_OUT = own`,
    )
  }

  /**
   * Hand the space to the human. handOffTaskSpace terminates the whole round (hard stop), so the
   * marker goes out FIRST — the call's own outcome is already "handed", whatever follows is noise.
   */
  handOff(spaceId: number) {
    return this.round<{ done: boolean }>(
      `await useOrCreateTaskSpace(${spaceId})
cliLog('NEO_RESULT:' + JSON.stringify({ done: true }))
await handOffTaskSpace(${spaceId})
`,
    )
  }

  /**
   * Take the space back. Ego gives NO ownership check here — so this is called only behind the
   * consultant's explicit 【我操作完了，交回 AI】; never on our own initiative.
   */
  takeOver(spaceId: number) {
    return this.body<{ done?: boolean; ownership?: string }>(
      `await useOrCreateTaskSpace(${spaceId})
NEO_OUT = await takeOverTaskSpace(${spaceId})`,
    )
  }

  /** Close the space (smoke only — production never calls it; the consultant may still be looking). */
  complete(spaceId: number) {
    return this.body<{ done: boolean }>(`await useOrCreateTaskSpace(${spaceId})
NEO_OUT = await completeTaskSpace(${spaceId}, { keep: false })`)
  }
}
