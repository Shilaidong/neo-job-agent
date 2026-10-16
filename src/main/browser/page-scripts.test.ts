import { describe, expect, test } from "bun:test"
import { readFileSync } from "node:fs"
import { join } from "node:path"
import { appRoot } from "../paths"

/**
 * Several tools hand a string of JavaScript to the page (field evidence, clickables, pop-ups, calendars, search
 * results). Every one of those calls is wrapped in a catch, so a script that does not even parse fails silently and
 * the tool just quietly stops finding anything — which is exactly what happened once: an escape was lost in an edit
 * and `/^https?:\/\//` reached the page as `/^https?:///`, and search returned nothing at all with no error anywhere.
 */
const FILES = ["browser/fields.ts", "browser/clickable.ts", "browser/controller.ts", "web.ts"]

/** Every `const NAME = \`…\`` in the file: the page scripts, as the page will actually receive them. */
function pageScripts(file: string) {
  const source = readFileSync(join(appRoot, "src/main", file), "utf8")
  const out: Array<{ name: string; code: string }> = []
  for (const match of source.matchAll(/const ([A-Z][A-Z0-9_]*) = `([\s\S]*?)`\n/g)) {
    const [, name, body] = match
    if (!/[(){};]/.test(body)) continue // a plain string constant, not code
    // Resolve the template literal the way the engine will, with any interpolation standing in as a comment.
    const code = new Function(`return \`${body.replace(/\$\{[^}]*\}/g, "/*…*/")}\``)() as string
    out.push({ name, code })
  }
  return out
}

describe("scripts we hand to the page", () => {
  for (const file of FILES) {
    const scripts = pageScripts(file)
    test(`${file} has some`, () => expect(scripts.length).toBeGreaterThan(0))
    for (const { name, code } of scripts) {
      test(`${file} · ${name} parses`, () => {
        // They come in two shapes: a function expression, and an IIFE.
        let error: unknown
        try {
          new Function(`return (${code})`)
          return
        } catch (e) {
          error = e
        }
        try {
          new Function(code)
        } catch {
          throw error
        }
      })
    }
  }
})
