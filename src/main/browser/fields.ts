import type { FieldEvidence } from "./autofill"

/**
 * What a person sees about a form control: what is written next to it, which section it sits in, the
 * greyed-out example inside it, whether it is required or flagged, what it holds now — plus what the
 * site's developers called it. Runs inside the page, over many elements in one call.
 *
 * No site and no component library is known here; only how forms are laid out. The order of the label
 * strategies follows Chromium's autofill (InferLabelForElement): association first, then what precedes
 * the control, then table / definition-list / wrapper-div layouts, then plain geometry. A placeholder is
 * NEVER a label: it is reported as `hint`, because an agent that reads "0912 345 678" as a field name
 * will sooner or later type it in as data.
 */
export const FIELD_EVIDENCE_FN = `function(...els){
  const clean = (s) => String(s || "").replace(/\\s+/g, " ").trim()
  const cap = (s, n) => (s.length > n ? s.slice(0, n - 1) + "…" : s)
  const isControl = (n) => n.nodeType === 1 && (/^(INPUT|SELECT|TEXTAREA|BUTTON)$/.test(n.tagName) || n.isContentEditable || /^(combobox|textbox|listbox|checkbox|radio|switch|slider|spinbutton)$/.test(n.getAttribute("role") || ""))
  const hasControl = (n) => n.nodeType === 1 && (isControl(n) || !!n.querySelector("input,select,textarea,button,[contenteditable=true],[role=combobox],[role=textbox],[role=listbox],[role=checkbox],[role=radio]"))
  const visible = (n) => { const r = n.getBoundingClientRect(); return r.width > 0 && r.height > 0 }
  const usable = (t) => { const c = clean(t); return c.length >= 1 && c.length <= 160 && /[\\p{L}\\p{N}]/u.test(c) ? c : "" }
  // Text of a node without the text of controls nested in it (a <label> wrapping its own <select>).
  const ownText = (n) => {
    if (n.nodeType === 3) return n.textContent
    if (n.nodeType !== 1 || isControl(n) || /^(SCRIPT|STYLE|OPTION)$/.test(n.tagName)) return ""
    let out = ""
    for (const c of n.childNodes) out += " " + ownText(c)
    return out
  }
  const byIds = (ids) => clean(String(ids || "").split(/\\s+/).map((id) => { const n = id && document.getElementById(id); return n ? ownText(n) : "" }).join(" "))

  // What comes before the control among its siblings: text, inline wrappers, a <label>/<p>; stop at another control.
  const fromPrevious = (el) => {
    let text = ""
    for (let n = el.previousSibling, hops = 0; n && hops < 8; n = n.previousSibling, hops++) {
      if (n.nodeType === 8) continue
      if (n.nodeType === 1 && (hasControl(n) || /^(BR|HR|IMG|SVG)$/i.test(n.tagName) && text)) break
      const t = usable(ownText(n))
      if (t) { text = clean(t + " " + text); if (n.nodeType === 1 && /^(LABEL|P|DIV|SPAN|TD|TH|DT|LI|H\\d|LEGEND)$/.test(n.tagName)) break }
    }
    return text
  }
  const fromNext = (el) => {
    for (let n = el.nextSibling, hops = 0; n && hops < 4; n = n.nextSibling, hops++) {
      if (n.nodeType === 1 && hasControl(n)) break
      const t = usable(ownText(n))
      if (t) return t
    }
    return ""
  }
  // HKUST-style tables put the radio and its answer in ADJACENT cells ([F] | Full-time): fromNext stops
  // at the first control it meets, so walk the sibling cells instead (P2-7 of the 2026-10-16 report).
  const fromCell = (el) => {
    const cell = el.closest("td,th")
    if (!cell) return ""
    for (let n = cell.nextElementSibling, hops = 0; n && hops < 2; n = n.nextElementSibling, hops++) {
      if (hasControl(n)) break
      const t = usable(ownText(n))
      if (t) return t
    }
    return ""
  }
  // <td>label</td><td>[input]</td>, or the header cell of the same column.
  const fromTable = (el) => {
    const cell = el.closest("td,th")
    if (!cell) return ""
    for (let c = cell.previousElementSibling; c; c = c.previousElementSibling) { if (hasControl(c)) break; const t = usable(ownText(c)); if (t) return t }
    const row = cell.parentElement, table = cell.closest("table")
    if (!row || !table) return ""
    const index = Array.from(row.children).indexOf(cell)
    for (let r = row.previousElementSibling; r; r = r.previousElementSibling) { const above = r.children[index]; if (!above) continue; if (hasControl(above)) break; const t = usable(ownText(above)); if (t) return t }
    const head = table.tHead && table.tHead.rows[0] && table.tHead.rows[0].cells[index]
    return head ? usable(ownText(head)) : ""
  }
  // A "floating label": a sibling drawn on top of the input's own box.
  const fromOverlay = (el) => {
    const box = el.getBoundingClientRect()
    if (!box.width) return ""
    for (const n of Array.from(el.parentElement ? el.parentElement.children : [])) {
      if (n === el || hasControl(n)) continue
      const r = n.getBoundingClientRect(), t = usable(ownText(n))
      if (t && r.width && r.left >= box.left - 2 && r.right <= box.right + 2 && r.top >= box.top - 12 && r.bottom <= box.bottom + 2) return t
    }
    return ""
  }
  const fromDefinitionList = (el) => { const dd = el.closest("dd"); const dt = dd && dd.previousElementSibling; return dt && dt.tagName === "DT" ? usable(ownText(dt)) : "" }
  // <div class=row><div class=col>Surname</div><div class=col>[input]</div></div> — and any depth of wrappers around the input.
  const fromWrappers = (el) => {
    for (let n = el, hops = 0; n && n !== document.body && hops < 5; n = n.parentElement, hops++) {
      const others = n.parentElement ? Array.from(n.parentElement.querySelectorAll("input:not([type=hidden]),select,textarea,[role=combobox],[role=textbox]")).filter((c) => !n.contains(c) && c !== el) : []
      const t = fromPrevious(n)
      if (t) return t
      // Once the parent holds other fields too, whatever precedes it belongs to the whole group, not to this field.
      if (others.length) break
    }
    return ""
  }
  // Last resort, the way a person does it: the nearest text to the left on the same line, else right above.
  const fromGeometry = (el) => {
    const box = el.getBoundingClientRect()
    if (!box.width) return ""
    const scope = el.closest("form,fieldset,section,[role=dialog],main") || document.body
    const walker = document.createTreeWalker(scope, NodeFilter.SHOW_TEXT)
    const range = document.createRange()
    let best = "", bestScore = Infinity, seen = 0
    for (let n = walker.nextNode(); n && seen < 1500; n = walker.nextNode(), seen++) {
      const t = usable(n.textContent)
      const p = n.parentElement
      if (!t || !p || isControl(p) || p.closest("option,select,script,style,button,a") || el.contains(p)) continue
      range.selectNodeContents(n)
      const r = range.getBoundingClientRect()
      if (!r.width || !r.height) continue
      const sameLine = r.bottom > box.top + 2 && r.top < box.bottom - 2
      const left = sameLine && r.right <= box.left + 4 ? box.left - r.right : Infinity
      const above = r.bottom <= box.top + 4 && r.left < box.right && r.right > box.left - 8 ? (box.top - r.bottom) * 3 + Math.abs(r.left - box.left) / 4 : Infinity
      const score = Math.min(left <= 420 ? left : Infinity, above <= 240 ? above + 40 : Infinity)
      if (score < bestScore) { bestScore = score; best = t }
    }
    return best
  }
  const groupOf = (el) => {
    const fs = el.closest("fieldset")
    const legend = fs && fs.querySelector(":scope > legend")
    if (legend && usable(ownText(legend))) return clean(ownText(legend))
    const g = el.closest("[role=group],[role=radiogroup],[role=dialog],dialog,section,[aria-labelledby]")
    if (g) { const t = clean(g.getAttribute("aria-label") || byIds(g.getAttribute("aria-labelledby"))); if (t) return t }
    // The nearest heading before the control, in document order.
    const headings = Array.from((el.closest("form,main,[role=dialog],body") || document.body).querySelectorAll("h1,h2,h3,h4,h5,h6,legend,[role=heading]"))
    let found = ""
    for (const h of headings) { if (h.compareDocumentPosition(el) & Node.DOCUMENT_POSITION_FOLLOWING) { const t = usable(ownText(h)); if (t && visible(h)) found = t } else break }
    return found
  }
  const errorOf = (el) => {
    const bits = []
    if (el.getAttribute("aria-invalid") === "true") bits.push(byIds(el.getAttribute("aria-errormessage")) || byIds(el.getAttribute("aria-describedby")))
    try { if (el.willValidate && el.validity && !el.validity.valid && (el.value || el.getAttribute("aria-invalid") === "true" || el.matches(".ng-touched,.touched,.is-invalid,.error,.invalid"))) bits.push(el.validationMessage) } catch {}
    // The red sentence sites put right under a field.
    const holder = el.closest(".form-group,.field,.form-field,.form-item,.input-group,.control,td,li,div")
    const red = holder && Array.from(holder.querySelectorAll(".error,.invalid-feedback,.help-block.error,.field-error,.text-danger,.validation-message,[role=alert],.errormsg,.error-message")).find((n) => visible(n) && usable(ownText(n)))
    if (red) bits.push(clean(ownText(red)))
    return cap(clean(bits.filter(Boolean).join(" · ")), 200)
  }

  return els.map((el) => {
    if (!el || el.nodeType !== 1) return null
    const tag = el.tagName, type = (el.getAttribute("type") || "").toLowerCase(), role = el.getAttribute("role") || ""
    const tick = type === "checkbox" || type === "radio" || /^(checkbox|radio|switch)$/.test(role)
    const tries = [
      ["aria", () => byIds(el.getAttribute("aria-labelledby")) || clean(el.getAttribute("aria-label"))],
      ["for", () => el.labels && el.labels.length ? clean(Array.from(el.labels).map(ownText).join(" ")) : ""],
      ...(tick ? [["next", () => fromNext(el)], ["cell", () => fromCell(el)]] : []),
      ["overlay", () => fromOverlay(el)],
      ["previous", () => fromPrevious(el)],
      ["table", () => fromTable(el)],
      ["list", () => fromDefinitionList(el)],
      ["wrapper", () => fromWrappers(el)],
      ["geometry", () => fromGeometry(el)],
      ["title", () => clean(el.getAttribute("title"))],
    ]
    let label = "", labelSource = ""
    for (const [source, fn] of tries) { let t = ""; try { t = usable(fn()) } catch {} if (t) { label = cap(t, 140); labelSource = source; break } }
    // What the row says, even when the control has a name of its own: three "country code" selects differ only by their row.
    let context = ""
    if (labelSource === "aria" || labelSource === "for") { try { context = usable(fromTable(el)) || usable(fromWrappers(el)) } catch {} }
    const hint = clean(el.getAttribute("placeholder") || el.getAttribute("data-placeholder"))
    // A label that is nothing but the placeholder is not a label.
    if (label && hint && label.toLowerCase() === hint.toLowerCase()) { label = ""; labelSource = "" }
    const dev = [el.getAttribute("autocomplete"), el.getAttribute("name"), el.id].filter((v) => v && !/^(on|off|new-password|nope|false)$/i.test(v) && !/^[a-z]{0,3}[-_:]?[0-9a-f-]{6,}$/i.test(v) && !/^(:r|ember|react-select|mui-|headlessui|radix-)/i.test(v))
    let kind = "other"
    if (tag === "SELECT") kind = "select"
    else if (tag === "TEXTAREA" || el.isContentEditable) kind = "textarea"
    else if (type === "file") kind = "file"
    else if (type === "checkbox" || role === "checkbox" || role === "switch") kind = "checkbox"
    else if (type === "radio" || role === "radio" || role === "radiogroup") kind = "radio"
    else if (/^(date|month|week|time|datetime-local)$/.test(type) || /date|birth|dob|\\bdd\\b|yyyy/i.test(hint + " " + dev.join(" ")) || el._flatpickr) kind = "date"
    else if (role === "combobox" || role === "listbox" || el.getAttribute("aria-haspopup") || el.getAttribute("aria-autocomplete") || el.getAttribute("list")) kind = "search"
    else if (tag === "INPUT" && !/^(button|submit|reset|image|hidden)$/.test(type)) kind = "text"
    // A radio button's own label is its answer ("Yes"); the QUESTION belongs to the group: look around the smallest box holding all of them.
    let question = "", groupKey = ""
    if (kind === "radio") {
      const holder = el.closest("[role=radiogroup]")
      const mates = el.name ? Array.from((el.form || document).querySelectorAll("input[type=radio]")).filter((r) => r.name === el.name) : holder ? Array.from(holder.querySelectorAll("[role=radio],input[type=radio]")) : [el]
      let box = el.parentElement
      while (box && !mates.every((m) => box.contains(m))) box = box.parentElement
      if (box) {
        const legend = box.tagName === "FIELDSET" ? box.querySelector(":scope > legend") : null
        try { question = usable(box.getAttribute("aria-label") || byIds(box.getAttribute("aria-labelledby"))) || (legend ? usable(ownText(legend)) : "") || usable(fromPrevious(box)) || usable(fromWrappers(box)) || usable(fromTable(box)) || usable(fromGeometry(box)) } catch {}
      }
      groupKey = el.name ? "name:" + el.name : "box:" + mates.length + ":" + question
    }
    const starred = /\\*\\s*$/.test(question)
    question = question.replace(/\\s*\\*\\s*$/, "")
    let options
    if (tag === "SELECT") options = Array.from(el.options).filter((o) => o.value !== "" && clean(o.textContent)).slice(0, 12).map((o) => cap(clean(o.textContent), 60))
    const required = el.required || el.getAttribute("aria-required") === "true" || /\\*\\s*$/.test(label) || starred || !!(el.closest(".required,.is-required,[data-required=true]"))
    let value = ""
    if (tag === "SELECT") value = clean(Array.from(el.selectedOptions).filter((o) => o.value !== "").map((o) => o.textContent).join(", "))
    else if (tick) value = (tag === "INPUT" ? el.checked : el.getAttribute("aria-checked") === "true") ? "checked" : ""
    else if (type === "file") value = Array.from(el.files || []).map((f) => f.name).join(", ")
    else if (type !== "password") value = cap(clean(el.value !== undefined && tag !== "BUTTON" ? el.value : el.innerText), 120)
    // A dropdown the site drew itself shows its answer as its text — or an invitation to choose, which is not an answer.
    if (/^(select|choose|pick|please|--|—|请选择|選擇|请选|未选择)/i.test(value) || (hint && value === hint)) value = ""
    // A select showing the option it was born with holds a DEFAULT, not an answer ("+65" on a Singapore site).
    const born = tag === "SELECT" ? Math.max(0, Array.from(el.options).findIndex((o) => o.defaultSelected)) : -1
    const defaulted = tag === "SELECT" && !el.multiple && value !== "" && el.selectedIndex === born
    return { kind, defaulted, context: cap(context.replace(/\\s*\\*\\s*$/, ""), 100), question: cap(question, 140), groupKey, label: label.replace(/\\s*\\*\\s*$/, ""), labelSource, devName: cap(dev.join(" / "), 80), hint: cap(hint, 80), group: cap(groupOf(el), 80), options, required, value, maxLength: Number(el.getAttribute("maxlength")) || 0, error: errorOf(el) }
  })
}`

export type PageField = FieldEvidence & { role: string; axName: string; error?: string; question?: string; groupKey?: string; context?: string; defaulted?: boolean }

/** The radios of one question become one field: its name is the question, its options are the answers. */
export function mergeRadios(fields: PageField[]): PageField[] {
  const out: PageField[] = []
  const groups = new Map<string, PageField>()
  for (const f of fields) {
    if (f.kind !== "radio" || !f.groupKey) { out.push(f); continue }
    const key = `${f.group}|${f.groupKey}`
    const head = groups.get(key)
    const answer = f.label || f.axName
    if (!head) {
      const merged: PageField = { ...f, label: f.question || f.group || "", labelSource: f.question ? "group" : f.labelSource, options: answer ? [answer] : [], value: f.value === "checked" ? answer : "" }
      groups.set(key, merged)
      out.push(merged)
    } else {
      if (answer) head.options = [...(head.options ?? []), answer]
      if (f.value === "checked") head.value = answer
      head.required = head.required || f.required
      head.error = head.error || f.error
    }
  }
  return out
}

/** Roles of a snapshot that are form fields (things that hold an answer), as opposed to things you press. */
export const FIELD_ROLES = new Set(["textbox", "searchbox", "combobox", "listbox", "checkbox", "radio", "switch", "slider", "spinbutton", "Date", "DateTime", "DateTimeLocal", "InputTime", "Month", "Week"])

const STRENGTH: Record<string, number> = { aria: 5, for: 5, group: 5, overlay: 4, next: 4, cell: 4, previous: 4, table: 3, list: 3, wrapper: 3, title: 2, geometry: 1 }

/**
 * One text, one field. When two fields claim the same words and one claim is weaker (geometry reaching for the
 * caption of the box above), the weaker one gets no name at all — an honest blank beats a borrowed label.
 * Claims of equal strength (three "Telephone country code" selects) are told apart by section, then by position.
 */
export function disambiguate(input: PageField[]): PageField[] {
  const strongest = new Map<string, number>()
  for (const f of input) if (f.label) strongest.set(f.label, Math.max(strongest.get(f.label) ?? 0, STRENGTH[f.labelSource ?? ""] ?? 0))
  const fields = input.map((f) => (f.label && (STRENGTH[f.labelSource ?? ""] ?? 0) < (strongest.get(f.label) ?? 0) ? { ...f, label: "", labelSource: "" } : f))
  const count = new Map<string, number>()
  for (const f of fields) if (f.label) count.set(f.label, (count.get(f.label) ?? 0) + 1)
  const seen = new Map<string, number>()
  return fields.map((f) => {
    if (!f.label || (count.get(f.label) ?? 0) < 2) return f
    const where = f.context && f.context !== f.label ? f.context : f.group && f.group !== f.label ? f.group : ""
    const withGroup = where ? `${where} › ${f.label}` : f.label
    const n = (seen.get(withGroup) ?? 0) + 1
    seen.set(withGroup, n)
    return { ...f, label: n > 1 ? `${withGroup} (${n})` : withGroup }
  })
}

/** One line per field, the way the big model and the consultant read it. */
export function describeField(f: PageField): string {
  const name = f.label ? `“${f.label}”` : f.axName ? `“${f.axName}”` : "（页面上找不到它的名字）"
  const bits = [
    f.kind === "file" ? "上传入口（材料里有对应的文件就用 browser_upload 传上去，这不是要留给顾问的事）" : f.kind,
    f.required ? "必填" : "",
    f.maxLength ? `至多 ${f.maxLength} 字（超了会被截断）` : "",
    f.value ? `当前值：${f.value}${f.defaulted ? "（页面默认值，不是填的）" : ""}` : "空",
    f.hint ? `示例：${f.hint}（不是数据）` : "",
    f.devName ? `开发者命名：${f.devName}` : "",
    f.group ? `所在分组：${f.group}` : "",
    f.error ? `⚠ 页面报错：${f.error}` : "",
  ].filter(Boolean)
  return `[${f.ref}] ${name} — ${bits.join("；")}`
}

/**
 * What the page says is wrong, page-wide: live alerts and the blocks sites use for validation summaries and inline
 * errors. Visible text only, shortest first so a summary does not swallow its own items. Returns a JSON string[].
 */
export const PAGE_COMPLAINTS = `(() => {
  const seen = new Set(), out = []
  const visible = (el) => { const r = el.getBoundingClientRect(), s = getComputedStyle(el); return r.width > 0 && r.height > 0 && s.visibility !== "hidden" && s.display !== "none" && Number(s.opacity) > 0.05 }
  const nodes = document.querySelectorAll('[role="alert"], [aria-live="assertive"], [aria-invalid="true"] ~ [id], [class*="error" i], [class*="invalid-feedback" i], [class*="validation" i], [class*="alert-danger" i], [class*="help-block" i][class*="err" i]')
  for (const el of nodes) {
    if (el.matches("input, select, textarea, form, body, html, label") || !visible(el)) continue
    const text = (el.innerText || "").replace(/\\s+/g, " ").trim()
    if (text.length < 3 || text.length > 300 || seen.has(text)) continue
    seen.add(text)
    out.push(text)
    if (out.length >= 15) break
  }
  return JSON.stringify(out.filter((t) => !out.some((other) => other !== t && other.length < t.length && t.includes(other) && other.length > 12)))
})()`
