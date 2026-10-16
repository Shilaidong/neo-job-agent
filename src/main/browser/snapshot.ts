import type { Cdp } from "./cdp"

/** Subset of CDP `Accessibility.AXNode` that we read. */
export type AXNode = {
  nodeId: string
  ignored?: boolean
  role?: { value?: unknown }
  name?: { value?: unknown }
  value?: { value?: unknown }
  description?: { value?: unknown }
  properties?: Array<{ name: string; value?: { value?: unknown } }>
  parentId?: string
  childIds?: string[]
  backendDOMNodeId?: number
}

/** One frame's accessibility tree plus the frames embedded in it (keyed by the iframe element's node id). */
export type FrameTree = {
  sessionId?: string
  frameId?: string
  nodes: AXNode[]
  children: Map<number, FrameTree>
}

export type RefEntry = {
  ref: string
  sessionId?: string
  frameId?: string
  backendNodeId: number
  role: string
  name: string
  /** index among same (role, name) ref-able nodes of the same frame, pre-order */
  nth: number
  /** a button that opens a list: a field to fill, not a button to press */
  popup?: boolean
  /** what a person would call it (the words next to it) when the accessibility name is empty or is only the example text */
  label?: string
}

const INTERACTIVE_ROLES = new Set([
  "button", "link", "textbox", "searchbox", "combobox", "listbox", "option", "checkbox", "radio",
  "switch", "slider", "spinbutton", "menuitem", "menuitemcheckbox", "menuitemradio", "tab", "treeitem",
  "MenuListOption", "PopUpButton", "DisclosureTriangle", "ColorWell", "Date", "DateTime", "InputTime",
])
/** Structural wrappers that carry no meaning on their own: their children are hoisted. */
const TRANSPARENT_ROLES = new Set([
  "none", "generic", "presentation", "InlineTextBox", "LineBreak", "RootWebArea", "WebArea",
  "LayoutTable", "LayoutTableRow", "LayoutTableCell", "MenuListPopup", "Section", "Pre", "Abbr", "Ruby", "Legend",
])
const SHOWN_PROPERTIES = ["checked", "selected", "expanded", "disabled", "required", "readonly", "invalid", "level", "focused", "multiselectable"]
const COMPOSITE_INPUT_ROLES = new Set(["Date", "DateTime", "DateTimeLocal", "InputTime", "Month", "Week"])
const LABEL_ECHO = "<label>"
const MAX_OPTIONS_SHOWN = 15
const MAX_SNAPSHOT_CHARS = 80_000
const MAX_FRAME_DEPTH = 4

export const roleOf = (node: AXNode) => (typeof node.role?.value === "string" ? node.role.value : "")
export const nameOf = (node: AXNode) => (typeof node.name?.value === "string" ? node.name.value.trim() : "")
const valueOf = (node: AXNode) => {
  const v = node.value?.value
  return typeof v === "string" || typeof v === "number" ? String(v) : ""
}
const prop = (node: AXNode, name: string) => node.properties?.find((p) => p.name === name)?.value?.value

export function isRefable(node: AXNode) {
  if (node.ignored || node.backendDOMNodeId === undefined) return false
  const role = roleOf(node)
  if (INTERACTIVE_ROLES.has(role)) return true
  return prop(node, "focusable") === true && !TRANSPARENT_ROLES.has(role)
}

/** Pre-order walk from the root; `visit` returns false to skip a subtree. */
export function walk(nodes: AXNode[], visit: (node: AXNode, depth: number) => boolean | void) {
  const byId = new Map(nodes.map((n) => [n.nodeId, n]))
  const root = nodes.find((n) => !n.parentId) ?? nodes[0]
  if (!root) return
  const seen = new Set<string>()
  const go = (id: string, depth: number) => {
    const node = byId.get(id)
    if (!node || seen.has(id)) return
    seen.add(id)
    if (visit(node, depth) === false) return
    for (const child of node.childIds ?? []) go(child, depth + 1)
  }
  go(root.nodeId, 0)
}

/** Fetch the AX tree of a frame and, recursively, of every iframe inside it (same-process or out-of-process). */
export async function collectFrameTree(cdp: Cdp, sessionId?: string, frameId?: string, depth = 0): Promise<FrameTree> {
  const { nodes } = await cdp.sendWithTimeout<{ nodes: AXNode[] }>(
    "Accessibility.getFullAXTree",
    frameId ? { frameId } : {},
    sessionId,
    15_000,
  )
  const tree: FrameTree = { sessionId, frameId, nodes, children: new Map() }
  if (depth >= MAX_FRAME_DEPTH) return tree
  for (const node of nodes) {
    if (node.ignored || node.backendDOMNodeId === undefined) continue
    if (roleOf(node) !== "Iframe" && roleOf(node) !== "IframePresentational") continue
    try {
      const described = await cdp.send("DOM.describeNode", { backendNodeId: node.backendDOMNodeId }, sessionId)
      const childFrameId: string | undefined = described?.node?.frameId
      if (!childFrameId) continue
      const childSession = cdp.frameSessions.get(childFrameId)
      const child = childSession
        ? await collectFrameTree(cdp, childSession, undefined, depth + 1)
        : await collectFrameTree(cdp, sessionId, childFrameId, depth + 1)
      tree.children.set(node.backendDOMNodeId, child)
    } catch {
      // frame went away mid-snapshot; ignore
    }
  }
  return tree
}

export type Snapshot = { text: string; refs: Map<string, RefEntry>; truncated: boolean }

/** Pure: turn collected AX trees into the text the model reads, minting `eN` refs for actionable elements. */
/**
 * Numbers that stay put. A model often sends several actions in one turn, all written against the snapshot it last
 * saw; if every new snapshot renumbered the page, "e92" would quietly come to mean a different element (a real run
 * picked "Doctorate" that way). With a ledger, an element keeps its number for as long as it lives, new elements
 * get new numbers, and a number is never handed to another element.
 */
export type RefLedger = { ids: Map<string, string>; next: number }
export const newLedger = (): RefLedger => ({ ids: new Map(), next: 0 })

export function renderSnapshot(tree: FrameTree, ledger: RefLedger = newLedger()): Snapshot {
  const refs = new Map<string, RefEntry>()
  const lines: string[] = []

  const renderFrame = (frame: FrameTree, baseIndent: number) => {
    const byId = new Map(frame.nodes.map((n) => [n.nodeId, n]))
    const occurrences = new Map<string, number>()
    const root = frame.nodes.find((n) => !n.parentId) ?? frame.nodes[0]
    if (!root) return

    const render = (id: string, indent: number, parentName: string) => {
      const node = byId.get(id)
      if (!node) return
      const role = roleOf(node)
      const name = nameOf(node)
      const children = node.childIds ?? []

      // A <label>'s text is already the name of the control it labels; keep the control, drop the echo.
      if (role === "LabelText") {
        for (const child of children) render(child, indent, LABEL_ECHO)
        return
      }
      if (node.ignored || (TRANSPARENT_ROLES.has(role) && !isRefable(node))) {
        for (const child of children) render(child, indent, parentName)
        return
      }
      if (role === "StaticText") {
        if (name && parentName !== LABEL_ECHO && !parentName.includes(name)) lines.push(`${"  ".repeat(indent)}- text: ${name}`)
        return
      }

      let line = `${"  ".repeat(indent)}- ${role || "node"}`
      if (name) line += ` ${JSON.stringify(name)}`
      if (isRefable(node)) {
        const key = `${role}\n${name}`
        const nth = occurrences.get(key) ?? 0
        occurrences.set(key, nth + 1)
        const identity = `${frame.sessionId ?? ""}|${frame.frameId ?? ""}|${node.backendDOMNodeId}`
        const ref = ledger.ids.get(identity) ?? `e${++ledger.next}`
        ledger.ids.set(identity, ref)
        const opens = prop(node, "hasPopup")
        refs.set(ref, { ref, sessionId: frame.sessionId, frameId: frame.frameId, backendNodeId: node.backendDOMNodeId!, role, name, nth, popup: Boolean(opens && opens !== "false") })
        line += ` [ref=${ref}]`
      }
      for (const key of SHOWN_PROPERTIES) {
        const v = prop(node, key)
        if (v === undefined || v === false || v === "false" || v === "") continue
        line += v === true || v === "true" ? ` [${key}]` : ` [${key}=${String(v)}]`
      }
      // A button that opens a list is a field to fill, not a button to press: say so, or the model clicks its way through it.
      const popup = prop(node, "hasPopup")
      if (role === "button" && popup && popup !== "false") line += " [下拉，用 fill_form / choose 选]"
      const value = valueOf(node)
      if (value && value !== name) line += `: ${value}`
      lines.push(line)

      const embedded = node.backendDOMNodeId !== undefined ? frame.children.get(node.backendDOMNodeId) : undefined
      if (embedded) {
        renderFrame(embedded, indent + 1)
        return
      }

      // Native date/time pickers expose their inner spinners; the control itself is what gets filled.
      if (COMPOSITE_INPUT_ROLES.has(role)) return

      // Long option lists (country pickers…) would drown the page; show a window around what matters.
      const flat = children.flatMap((child) => expand(byId, child))
      const isOption = (id: string) => ["option", "MenuListOption"].includes(roleOf(byId.get(id)!))
      const optionCount = flat.filter(isOption).length
      if (optionCount > MAX_OPTIONS_SHOWN) {
        let shown = 0
        for (const child of flat) {
          if (isOption(child) && prop(byId.get(child)!, "selected") !== true && shown++ >= MAX_OPTIONS_SHOWN) continue
          render(child, indent + 1, `${name}\n${value}`)
        }
        lines.push(`${"  ".repeat(indent + 1)}- text: …共 ${optionCount} 个选项，未全部列出；用 browser_select 传选项文字即可，匹配不到时会返回相近候选`)
        return
      }
      for (const child of children) render(child, indent + 1, `${name}\n${value}`)
    }
    render(root.nodeId, baseIndent, "")
  }

  renderFrame(tree, 0)
  let text = lines.join("\n")
  const truncated = text.length > MAX_SNAPSHOT_CHARS
  if (truncated) text = `${text.slice(0, MAX_SNAPSHOT_CHARS)}\n…(页面过长，已截断；滚动或用 browser_find 定位后再取快照)`
  return { text, refs, truncated }
}

/** Children as the model sees them: wrappers that render nothing are replaced by their own children. */
function expand(byId: Map<string, AXNode>, id: string): string[] {
  const node = byId.get(id)
  if (!node) return []
  if (node.ignored || (TRANSPARENT_ROLES.has(roleOf(node)) && !isRefable(node))) return (node.childIds ?? []).flatMap((child) => expand(byId, child))
  return [id]
}

/** Re-find an element whose cached node id went stale, by the same (role, name, nth) that minted its ref. */
export function findByRoleNameNth(nodes: AXNode[], entry: Pick<RefEntry, "role" | "name" | "nth">): number | undefined {
  let count = 0
  let found: number | undefined
  walk(nodes, (node) => {
    if (found !== undefined) return false
    if (isRefable(node) && roleOf(node) === entry.role && nameOf(node) === entry.name) {
      if (count === entry.nth) {
        found = node.backendDOMNodeId
        return false
      }
      count++
    }
  })
  return found
}
