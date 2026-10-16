/**
 * Things a person can plainly click that the site never declared as clickable: a "Change" text that opens the
 * file picker, the day cells of a calendar, a card that selects a plan. The accessibility tree shows them as
 * plain text, so an agent sees them and cannot touch them. Judged by behaviour, not by markup (the order follows
 * browser-use's detector): a real click listener, an onclick attribute, a tabindex, or a hand cursor — outermost
 * element only, so a card is one target, not five.
 *
 * Runs with the DevTools command-line API (getEventListeners). Frameworks that delegate every event to the root
 * (React) show no listeners on the element itself; there the hand cursor is the witness.
 */
export const CLICKABLE_FN = `(() => {
  const clean = (s) => String(s || "").replace(/\\s+/g, " ").trim()
  const declared = (el) => /^(A|BUTTON|INPUT|SELECT|TEXTAREA|LABEL|SUMMARY|OPTION|IFRAME)$/.test(el.tagName) || el.isContentEditable ||
    /^(button|link|checkbox|radio|switch|tab|menuitem|menuitemradio|menuitemcheckbox|option|combobox|textbox|listbox|slider|spinbutton|treeitem|gridcell)$/.test(el.getAttribute("role") || "")
  const all = document.body ? document.body.getElementsByTagName("*") : []
  if (all.length > 12000) return []
  const vw = innerWidth, vh = innerHeight
  const found = []
  const listens = (el) => { try { const l = getEventListeners(el); return !!(l.click || l.mousedown || l.mouseup || l.pointerdown || l.pointerup) } catch { return false } }
  for (const el of all) {
    if (found.length >= 150) break
    if (declared(el) || el.closest("a,button,label,summary,[role=button],[role=link],[role=option],[role=menuitem],[role=tab],select")) continue
    const r = el.getBoundingClientRect()
    if (r.width < 8 || r.height < 8 || r.width * r.height > vw * vh * 0.35) continue
    const style = getComputedStyle(el)
    if (style.visibility === "hidden" || style.display === "none" || style.pointerEvents === "none") continue
    const how = listens(el) ? "listener" : el.hasAttribute("onclick") ? "onclick" : el.tabIndex >= 0 && el.hasAttribute("tabindex") ? "tabindex" : style.cursor === "pointer" && (!el.parentElement || getComputedStyle(el.parentElement).cursor !== "pointer") ? "cursor" : ""
    if (!how) continue
    // Outermost only: skip an element inside one we already took.
    if (found.some((f) => f.el.contains(el))) continue
    const text = clean(el.innerText || el.getAttribute("aria-label") || el.getAttribute("title") || (el.querySelector("img[alt]") || {}).alt || "")
    if (text.length > 90) continue
    found.push({ el, name: text || (el.querySelector("svg,img,i") || /icon/i.test(el.className) ? "（图标）" : ""), how })
  }
  return found.filter((f) => f.name)
})()`
