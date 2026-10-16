/**
 * Waiting for a local server to answer, with a hard deadline — extracted from `opencode.ts`
 * so the retry-on-timeout policy can be unit tested without Electron or a real server.
 *
 * A hostile network can stall a server's startup for minutes (models.dev catalog fetch has
 * no timeout); the caller treats a deadline miss as "restart and try once more" rather than
 * giving up, because a fresh process gets out of the stalled state.
 */
export async function waitForHealth<T>(
  probe: () => Promise<T | undefined>,
  options: { deadlineMs: number; betweenMs?: number; exited?: () => string | undefined },
): Promise<T | undefined> {
  const betweenMs = options.betweenMs ?? 250
  const deadline = Date.now() + options.deadlineMs
  for (;;) {
    if (options.exited?.()) return undefined
    const value = await probe().catch(() => undefined as T | undefined)
    if (value) return value
    if (Date.now() > deadline) return undefined
    await new Promise((resolve) => setTimeout(resolve, betweenMs))
  }
}
