/**
 * Which pages belong to ego lite (Plan 2 stage 3). Pure and tiny on purpose — the routing
 * decision is the one thing a wrong host string would quietly break, so it is unit tested.
 * Same host-matching shape as the UA whitelist in index.ts: the host itself and its subdomains.
 */
export function egoMatches(url: string | undefined, hosts: string[]): boolean {
  if (!url || !/^https?:/i.test(url)) return false
  try {
    const host = new URL(url).hostname.toLowerCase()
    return hosts.some((h) => {
      const root = h.toLowerCase().trim()
      return root && (host === root || host.endsWith("." + root))
    })
  } catch {
    return false
  }
}
