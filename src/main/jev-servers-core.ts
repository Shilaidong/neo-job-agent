/**
 * Which Jev answers — the consultant's choice, on the settings screen (2026-10-08).
 * Two rows ship inside the app, keys and all: TypeSafe's own cloud (2026-10-10 用户点单「线上 jev 的 key
 * 默认打包进去」— the subscription key rides in the package; local.env still wins when the row's own
 * box is emptied, so per-machine setups keep working) and the LAN cluster (its key is public knowledge,
 * a placeholder the server barely checks). The default is the official cloud (2026-10-12 用户点单「把 jev
 * 默认调成官方的」): it answers anywhere there is a network; the LAN row stays fully available on the
 * settings screen for machines on that LAN, and Jev with no reachable server simply falls back to the
 * big model (jev-core's contract).
 *
 * Every row is editable (name / URL / key / model id) and deletable — "可编辑" is the point of the screen.
 * Pure and testable apart from Electron; `jev-servers.ts` holds it in the store.
 */
import type { JevServer } from "../shared/types"

export type { JevServer }

export const JEV_SEED: JevServer[] = [
  // The key goes in the package on purpose (2026-10-10 user call). It is a subscription key, not an account secret.
  { id: "seed-cloud-jev", name: "Jev（官方云 TypeSafe）", baseURL: "https://api.typesafe.ai/v1", apiKey: "apikey_215be11a517d1c940be941d5133bbc760fa_f2ad3a139dcc0e52009f193dcde97aeaa96a350142d72dc30681199ab1293605", model: "jev-latest" },
  { id: "seed-lan-jev", name: "Jev（局域网集群）", baseURL: "http://10.0.0.109/v1", apiKey: "123456789", model: "jev-latest" },
]

/** Which seed row is which, wherever it later lives (renamed, key filled in). */
export const LAN_JEV_ID = "seed-lan-jev"
export const CLOUD_JEV_ID = "seed-cloud-jev"

/** The door a row answers on: the row holds its `/v1`, we append the system-one endpoint. */
export function jevDoor(baseURL: string): string {
  return `${baseURL.trim().replace(/\/+$/, "")}/systemone`
}

/** Put the seed rows in unless hidden or already present (same URL+model counts as the same Jev). */
export function seedJevServers(existing: JevServer[], hidden: string[]): JevServer[] {
  const next = [...existing]
  for (const seed of JEV_SEED) {
    if (hidden.includes(seed.id!)) continue
    // Still there (even renamed/key-filled), or the machine keeps its own row for that server already.
    if (next.some((s) => s.id === seed.id || (s.baseURL === seed.baseURL && s.model === seed.model))) continue
    next.push({ ...seed })
  }
  return next
}

/**
 * The row a request should use: `defaultId` picks it, `"off"` turns Jev away, and a default that no
 * longer exists (deleted row) falls back to the first row on screen — an orphaned default should not
 * silently switch the machine to a different Jev than what the list shows.
 */
export function activeJevServer(servers: JevServer[], defaultId: string | null | undefined): JevServer | undefined {
  if (defaultId === "off") return undefined
  return servers.find((s) => s.id === defaultId) ?? servers[0]
}
