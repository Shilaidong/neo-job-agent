export type KeyDef = { key: string; code: string; keyCode: number; text?: string }

const named: Record<string, KeyDef> = {
  Enter: { key: "Enter", code: "Enter", keyCode: 13, text: "\r" },
  Tab: { key: "Tab", code: "Tab", keyCode: 9 },
  Escape: { key: "Escape", code: "Escape", keyCode: 27 },
  Backspace: { key: "Backspace", code: "Backspace", keyCode: 8 },
  Delete: { key: "Delete", code: "Delete", keyCode: 46 },
  Space: { key: " ", code: "Space", keyCode: 32, text: " " },
  ArrowUp: { key: "ArrowUp", code: "ArrowUp", keyCode: 38 },
  ArrowDown: { key: "ArrowDown", code: "ArrowDown", keyCode: 40 },
  ArrowLeft: { key: "ArrowLeft", code: "ArrowLeft", keyCode: 37 },
  ArrowRight: { key: "ArrowRight", code: "ArrowRight", keyCode: 39 },
  Home: { key: "Home", code: "Home", keyCode: 36 },
  End: { key: "End", code: "End", keyCode: 35 },
  PageUp: { key: "PageUp", code: "PageUp", keyCode: 33 },
  PageDown: { key: "PageDown", code: "PageDown", keyCode: 34 },
}

/**
 * Letters and digits need a real `code` too: Chromium decides what a key press means from key + code, and an
 * empty code makes a modifier combination (Meta+A) land nowhere at all.
 */
const typed: Record<string, KeyDef> = Object.fromEntries([
  ..."abcdefghijklmnopqrstuvwxyz".split("").map((c) => [c, { key: c, code: `Key${c.toUpperCase()}`, keyCode: c.toUpperCase().charCodeAt(0), text: c }]),
  ..."0123456789".split("").map((d) => [d, { key: d, code: `Digit${d}`, keyCode: d.charCodeAt(0), text: d }]),
])

/**
 * What the browser does for a person when they hold the platform key: these are editing COMMANDS, not plain key
 * events — Chromium performs them in the focused editable region, and without them Meta+A does nothing at all.
 */
export const EDIT_COMMANDS: Record<string, string> = { a: "selectAll", c: "copy", v: "paste", x: "cut", z: "undo", y: "redo" }

/** Lookup by exact name or lowercase alias ("esc", "return", "down"…). */
export const KEYS: Record<string, KeyDef> = {
  ...typed,
  ...Object.fromEntries(Object.entries(typed).map(([name, def]) => [name.toUpperCase(), def])),
  ...named,
  ...Object.fromEntries(Object.entries(named).map(([name, def]) => [name.toLowerCase(), def])),
  esc: named.Escape,
  return: named.Enter,
  up: named.ArrowUp,
  down: named.ArrowDown,
  left: named.ArrowLeft,
  right: named.ArrowRight,
  " ": named.Space,
}
