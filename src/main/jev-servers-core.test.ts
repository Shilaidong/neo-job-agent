import { describe, expect, test } from "bun:test"
import { activeJevServer, jevDoor, seedJevServers, type JevServer } from "./jev-servers-core"

describe("seedJevServers", () => {
  test("a fresh machine starts with the official cloud and the LAN cluster, cloud first (2026-10-12)", () => {
    const s = seedJevServers([], [])
    expect(s.map((x) => x.id)).toEqual(["seed-cloud-jev", "seed-lan-jev"])
    expect(s[0]!.baseURL).toBe("https://api.typesafe.ai/v1")
    expect(s[0]!.apiKey.startsWith("apikey_")).toBe(true) // the subscription key rides in too (2026-10-10 用户点单); emptying the box falls back to local.env
    expect(s[1]!.apiKey).toBe("123456789") // public LAN key: it rides in the package on purpose (2026-10-08)
  })

  test("seeding twice does not grow a third Jev", () => {
    const once = seedJevServers([], [])
    expect(seedJevServers(once, [])).toHaveLength(2)
  })

  test("an edited seed row (renamed, key filled) is not duplicated back", () => {
    const edited: JevServer[] = [{ id: "seed-lan-jev", name: "我们的 Jev", baseURL: "http://10.0.0.109/v1", apiKey: "123456789", model: "jev-latest" }]
    expect(seedJevServers(edited, [])).toHaveLength(2)
    expect(seedJevServers(edited, [])[0]!.name).toBe("我们的 Jev") // the machine's own edited row keeps its place; the cloud seed appends after it
  })

  test("a deleted (hidden) seed row stays deleted across restarts", () => {
    expect(seedJevServers([], ["seed-lan-jev"]).map((x) => x.id)).toEqual(["seed-cloud-jev"])
  })

  test("a hand-built row for the same server counts as the seed already being there", () => {
    const hand: JevServer[] = [{ id: "own-1", name: "手搭的", baseURL: "http://10.0.0.109/v1", apiKey: "x", model: "jev-latest" }]
    const next = seedJevServers(hand, [])
    expect(next.filter((s) => s.baseURL === "http://10.0.0.109/v1")).toHaveLength(1)
  })
})

describe("jevDoor", () => {
  test("the row holds its /v1, the door appends the endpoint", () => {
    expect(jevDoor("http://10.0.0.109/v1")).toBe("http://10.0.0.109/v1/systemone")
    expect(jevDoor("https://api.typesafe.ai/v1/")).toBe("https://api.typesafe.ai/v1/systemone")
  })
})

describe("activeJevServer", () => {
  // Same shape/order as the real seed: official cloud first, LAN second (2026-10-12).
  const rows: JevServer[] = [
    { id: "seed-cloud-jev", name: "Cloud", baseURL: "https://api.typesafe.ai/v1", model: "jev-latest" },
    { id: "seed-lan-jev", name: "LAN", baseURL: "http://10.0.0.109/v1", model: "jev-latest" },
  ]

  test("the chosen row answers", () => {
    expect(activeJevServer(rows, "seed-cloud-jev")!.id).toBe("seed-cloud-jev")
  })

  test('"off" turns Jev away — tools fall back to the big model', () => {
    expect(activeJevServer(rows, "off")).toBeUndefined()
  })

  test("no pick (or a deleted pick) lands on the first row on screen — the official cloud", () => {
    expect(activeJevServer(rows, undefined)!.id).toBe("seed-cloud-jev")
    expect(activeJevServer(rows, "gone")!.id).toBe("seed-cloud-jev")
  })
})
