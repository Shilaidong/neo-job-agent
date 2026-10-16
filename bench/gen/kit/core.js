var doc = document;
var UI = CFG.ui || {};
var TX = CFG.tx || {};
var PX = UI.px || "ap";
var LANG = 0;

function h(tag, attrs, kids) {
  var n = doc.createElement(tag);
  if (attrs) for (var k in attrs) {
    var v = attrs[k];
    if (v === undefined || v === null || v === false) continue;
    if (k === "cls") n.className = v;
    else if (k === "text") n.textContent = v;
    else if (k === "html") n.innerHTML = v;
    else if (k.slice(0, 2) === "on") n.addEventListener(k.slice(2), v);
    else if (k === "style") n.style.cssText = v;
    else n.setAttribute(k, v === true ? "" : v);
  }
  if (kids !== undefined && kids !== null) (Array.isArray(kids) ? kids : [kids]).forEach(function (c) {
    if (c === null || c === undefined || c === false) return;
    n.appendChild(typeof c === "string" ? doc.createTextNode(c) : c);
  });
  return n;
}
function clear(n) { while (n.firstChild) n.removeChild(n.firstChild); }
function c(name) { return PX + "-" + name; }
function lab(f) { return f.lz && LANG ? f.lz[LANG - 1] : f.l; }
function clone(o) { return o === undefined ? undefined : JSON.parse(JSON.stringify(o)); }
function isEmpty(v) {
  if (v === undefined || v === null || v === "" || v === false) return true;
  if (Array.isArray(v)) return v.length === 0;
  if (typeof v === "object") {
    if ("n" in v) return !v.n;
    if ("c" in v && "t" in v) return !v.c;
    return Object.keys(v).length === 0;
  }
  return false;
}

var store = {
  get: function (k) { try { var s = localStorage.getItem(k); return s ? JSON.parse(s) : null; } catch (e) { return store.mem[k] || null; } },
  set: function (k, v) { store.mem[k] = v; try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} },
  mem: {}
};
var KEY = CFG.key;
var saved = store.get(KEY);
var journal = store.get(KEY + ".j") || { ev: [], pg: [] };
var vals = saved ? clone(saved.v) : {};
var dirty = false;
var curPage = null;
var t0 = Date.now();

function note(type, detail) {
  journal.ev.push({ type: type, detail: detail || null, at: Date.now() - t0, page: curPage });
  store.set(KEY + ".j", journal);
}
function visit(id) {
  if (journal.pg.indexOf(id) < 0) { journal.pg.push(id); store.set(KEY + ".j", journal); }
}
function persist() {
  saved = { v: clone(prune(vals)), at: new Date().toISOString() };
  store.set(KEY, saved);
  dirty = false;
}

function condOk(w, local, outer) {
  if (!w) return true;
  var v = local && w.id in local ? local[w.id] : outer ? outer[w.id] : undefined;
  if (v === undefined || v === null) v = w.v.indexOf(false) >= 0 ? false : "";
  return w.v.indexOf(v) >= 0;
}
function pruneFields(fields, local, outer) {
  var out = {};
  fields.forEach(function (f) {
    if (!condOk(f.w, local, outer)) return;
    var v = local[f.id];
    if (v === undefined) return;
    if (f.k === "rep") v = (v || []).map(function (row) { return pruneFields(f.fs, row, local); });
    out[f.id] = v;
  });
  return out;
}
function prune(v) {
  var out = {};
  CFG.pages.forEach(function (p) {
    p.secs.forEach(function (s) {
      if (!condOk(s.w, v, null)) return;
      var part = pruneFields(s.fs, v, null);
      for (var k in part) out[k] = part[k];
    });
  });
  return out;
}

Object.defineProperty(window, "__bench_state", {
  enumerable: false,
  value: function () {
    return clone({ instance: CFG.inst, page: curPage, pages: journal.pg, fields: prune(vals), saved: saved ? saved.v : null, savedAt: saved ? saved.at : null, dirty: dirty, events: journal.ev });
  }
});

var modalStack = [];
function focusables(root) {
  return Array.prototype.filter.call(root.querySelectorAll("a[href],button,input,select,textarea,[tabindex]"), function (n) {
    return !n.disabled && n.tabIndex >= 0 && n.offsetParent !== null && n.type !== "hidden";
  });
}
function openModal(opts) {
  var back = h("div", { cls: c("backdrop") });
  var box = h("div", { cls: c("modal") + (opts.cls ? " " + opts.cls : ""), tabindex: "-1" });
  if (UI.aria) { box.setAttribute("role", "dialog"); box.setAttribute("aria-modal", "true"); }
  var head = h("div", { cls: c("modal-head") }, [h("div", { cls: c("modal-title"), text: opts.title || "" })]);
  if (UI.aria) { head.firstChild.id = c("mt") + modalStack.length; box.setAttribute("aria-labelledby", head.firstChild.id); }
  var m = { back: back, box: box, body: h("div", { cls: c("modal-body") }), foot: h("div", { cls: c("modal-foot") }), prev: doc.activeElement, onClose: opts.onClose };
  if (opts.closable !== false) head.appendChild(h("span", { cls: c("modal-x"), text: "×", tabindex: "0", title: "Close", onclick: function () { closeModal(m, "x"); }, onkeydown: function (e) { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); closeModal(m, "x"); } } }));
  box.appendChild(head); box.appendChild(m.body); box.appendChild(m.foot);
  back.appendChild(box);
  back.addEventListener("mousedown", function (e) { if (e.target === back && opts.closable !== false && opts.backdropClose) closeModal(m, "backdrop"); });
  box.addEventListener("keydown", function (e) {
    if (modalStack[modalStack.length - 1] !== m) return;
    if (e.key === "Escape" && opts.closable !== false) { e.stopPropagation(); closeModal(m, "esc"); return; }
    if (e.key !== "Tab") return;
    var fs = focusables(box);
    if (!fs.length) { e.preventDefault(); return; }
    var first = fs[0], last = fs[fs.length - 1];
    if (e.shiftKey && (doc.activeElement === first || doc.activeElement === box)) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && doc.activeElement === last) { e.preventDefault(); first.focus(); }
  });
  doc.body.appendChild(back);
  modalStack.push(m);
  box.focus();
  Promise.resolve().then(function () { var fs = focusables(m.body); (fs[0] || box).focus(); });
  return m;
}
function closeModal(m, why) {
  var i = modalStack.indexOf(m);
  if (i < 0) return;
  modalStack.splice(i, 1);
  m.back.parentNode.removeChild(m.back);
  if (m.prev && m.prev.focus) try { m.prev.focus(); } catch (e) {}
  if (m.onClose) m.onClose(why);
}
doc.addEventListener("focusin", function (e) {
  var m = modalStack[modalStack.length - 1];
  if (m && !m.box.contains(e.target)) { var fs = focusables(m.box); (fs[0] || m.box).focus(); }
});
function btn(text, kind, fn, extra) {
  var a = { cls: c("btn") + " " + c("btn-" + (kind || "plain")), type: "button", text: text, onclick: fn };
  if (extra) for (var k in extra) a[k] = extra[k];
  return h("button", a);
}
function confirmBox(title, msg, buttons) {
  var m = openModal({ title: title, closable: false, cls: c("confirm") });
  m.body.appendChild(h("p", { text: msg }));
  buttons.forEach(function (b) { m.foot.appendChild(btn(b[0], b[1], function () { closeModal(m); if (b[2]) b[2](); })); });
  return m;
}
var toastHost = null;
function toast(msg, kind) {
  if (!toastHost) { toastHost = h("div", { cls: c("toasts") }); doc.body.appendChild(toastHost); }
  var t = h("div", { cls: c("toast") + " " + c("toast-" + (kind || "ok")), text: msg });
  if (UI.aria) t.setAttribute("role", "status");
  toastHost.appendChild(t);
  setTimeout(function () { if (t.parentNode) t.parentNode.removeChild(t); }, 3200);
}
function outside(node, fn) {
  var root = node.getRootNode ? node.getRootNode() : doc;
  function a(e) { if (!node.contains(e.target)) fn(); }
  function b(e) { if (root.host && e.target !== root.host) fn(); }
  root.addEventListener("mousedown", a, true);
  if (root !== doc) doc.addEventListener("mousedown", b, true);
  return function () { root.removeEventListener("mousedown", a, true); doc.removeEventListener("mousedown", b, true); };
}

var W = {};
var HOSTS = {};

function Scope(v, parent, fields) { this.vals = v; this.parent = parent; this.fields = fields || []; this.items = []; this.secs = []; this.onchange = null; }
Scope.prototype.get = function (id) { return id in this.vals ? this.vals[id] : this.parent ? this.parent.get(id) : undefined; };
Scope.prototype.set = function (id, v, silent) {
  var old = this.vals[id];
  var same = JSON.stringify(old === undefined ? "" : old) === JSON.stringify(v === undefined ? "" : v);
  this.vals[id] = v;
  if (!this.parent && !same) dirty = true;
  var it = this.find(id);
  if (it && !same) showErr(it, null);
  if (!silent) this.refresh();
  if (this.onchange) this.onchange(id, v);
};
Scope.prototype.find = function (id) { for (var i = 0; i < this.items.length; i++) if (this.items[i].f.id === id) return this.items[i]; return null; };
Scope.prototype.push = function (id, v) { var it = this.find(id); this.vals[id] = v; if (it && it.w.set) it.w.set(v); if (!this.parent) dirty = true; this.refresh(); };
Scope.prototype.refresh = function () {
  var self = this;
  this.items.forEach(function (it) { it.wrap.style.display = condOk(it.f.w, self.vals, self.parent ? self.parent.vals : null) ? "" : "none"; });
  this.secs.forEach(function (s) { s.node.style.display = condOk(s.sec.w, self.vals, null) ? "" : "none"; });
};

function mountField(f, scope, labelMode) {
  var mode = f.lm || labelMode || UI.label || "for";
  var native = W[f.k] && W[f.k].native;
  if (mode === "ph" && !(native && W[f.k].text)) mode = "div";
  if (mode === "float" && !(native && W[f.k].text)) mode = "div";
  var it = { f: f, wrap: null, w: null, err: null };
  var ctx = {
    f: f, scope: scope, mode: mode,
    get: function () { return scope.vals[f.id]; },
    set: function (v, silent) { scope.set(f.id, v, silent); }
  };
  var w = W[f.k] ? W[f.k](f, ctx) : W.text(f, ctx);
  it.w = w;
  var star = f.r ? h("span", { cls: c("req"), text: " *" }) : null;
  var labelNode = null;
  if (mode === "for") labelNode = h("label", { cls: c("lbl"), "for": native ? f.id : null, id: native ? null : f.id + "_lbl" }, [lab(f), star]);
  else if (mode === "div") labelNode = h("div", { cls: c("lbl") }, [lab(f), star]);
  else if (mode === "float") labelNode = h("label", { cls: c("flbl"), "for": f.id }, [lab(f), star]);
  if (UI.aria && !native && labelNode && labelNode.id && w.main) w.main.setAttribute("aria-labelledby", labelNode.id);
  it.err = h("div", { cls: c("err") });
  var kids = mode === "float" ? [w.el, labelNode] : [labelNode, w.el];
  if (f.hp) kids.push(h("div", { cls: c("help"), text: f.hp }));
  kids.push(it.err);
  it.wrap = h("div", { cls: c("fld") + " " + c("k-" + f.k) + (mode === "float" ? " " + c("float") : "") + (f.wide ? " " + c("wide") : "") }, kids);
  if (!native) it.wrap.id = f.id + "_w";
  if (mode === "float" && w.main && w.main !== w.el) {
    var mark = function () { w.el.classList.toggle(c("has"), !!w.main.value); };
    ["input", "change", "focusout"].forEach(function (ev) { w.el.addEventListener(ev, mark); });
    setTimeout(mark, 0);
  }
  if (w.set && scope.vals[f.id] !== undefined) w.set(scope.vals[f.id]);
  scope.items.push(it);
  return it;
}
function showErr(it, msg) {
  it.err.textContent = msg || "";
  it.wrap.classList.toggle(c("bad"), !!msg);
  if (UI.aria && it.w.main) { if (msg) it.w.main.setAttribute("aria-invalid", "true"); else it.w.main.removeAttribute("aria-invalid"); }
}

var RE_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
function checkField(f, v) {
  if (isEmpty(v)) {
    if (f.k === "rep" && f.min) return (TX.needRows || "Please add at least one entry");
    return f.r ? (TX.required || "This field is required") : null;
  }
  if (W[f.k] && W[f.k].check) { var m = W[f.k].check(f, v); if (m) return m; }
  var x = f.x || {};
  if (typeof v === "string") {
    if (f.k === "email" && !RE_EMAIL.test(v)) return TX.badEmail || "Enter a valid email address";
    if (x.re && !(new RegExp(x.re)).test(v)) return x.reMsg || "Invalid format";
    if (x.num) {
      var n = Number(v);
      if (isNaN(n) || n < x.num[0] || n > x.num[1]) return (TX.range || "Enter a value between {0} and {1}").replace("{0}", x.num[0]).replace("{1}", x.num[1]);
    }
    if (x.ascii && /[^\x00-\xff]/.test(v)) return TX.badChars || "Remove unsupported characters (for example curly quotes or long dashes)";
  }
  return null;
}
function validateScope(scope, fields) {
  var errs = [];
  fields.forEach(function (f) {
    var it = scope.find(f.id);
    if (!condOk(f.w, scope.vals, scope.parent ? scope.parent.vals : null)) return;
    var msg = checkField(f, scope.vals[f.id]);
    if (it) showErr(it, msg);
    if (msg) errs.push({ f: f, msg: msg, it: it });
  });
  return errs;
}

var root = null, main = null, navNode = null, topScope = null, pageErrs = {};

function pageIndex(id) { for (var i = 0; i < CFG.pages.length; i++) if (CFG.pages[i].id === id) return i; return -1; }
function pageFields(p) {
  var out = [];
  p.secs.forEach(function (s) { if (condOk(s.w, vals, null)) out = out.concat(s.fs); });
  return out;
}
function go(id, force) {
  if (!force && dirty && UI.confirmLeave && id !== curPage) {
    confirmBox(TX.unsavedT || "Unsaved changes", TX.unsavedM || "You have unsaved changes on this page. What would you like to do?", [
      [TX.stay || "Stay on this page", "plain", null],
      [TX.discard || "Discard changes", "plain", function () { vals = saved ? clone(saved.v) : {}; dirty = false; go(id, true); }],
      [TX.saveLeave || "Save and leave", "primary", function () { persist(); go(id, true); }]
    ]);
    return;
  }
  curPage = id;
  visit(id);
  if (UI.nav === "hash") { var hsh = "#/" + id; if (location.hash !== hsh) history.replaceState(null, "", hsh); }
  render();
  window.scrollTo(0, 0);
}
function renderNav() {
  clear(navNode);
  var ids = CFG.pages.map(function (p) { return p; }).concat([{ id: "review", t: TX.review || "Review and submit" }]);
  if (UI.aria && UI.nav === "tabs") navNode.setAttribute("role", "tablist");
  ids.forEach(function (p, i) {
    var cls = c("nav-item") + (p.id === curPage ? " " + c("on") : "") + (pageErrs[p.id] ? " " + c("nav-bad") : "") + (journal.pg.indexOf(p.id) >= 0 && saved ? " " + c("seen") : "");
    var label = (UI.navNum ? (i + 1) + ". " : "") + (p.tz && LANG ? p.tz[LANG - 1] : p.t);
    var a;
    if (UI.nav === "tabs") {
      a = h("div", { cls: cls, tabindex: p.id === curPage ? "0" : "-1", onclick: function () { go(p.id); } }, [label, pageErrs[p.id] ? h("span", { cls: c("badge"), text: String(pageErrs[p.id]) }) : null]);
      if (UI.aria) { a.setAttribute("role", "tab"); a.setAttribute("aria-selected", p.id === curPage ? "true" : "false"); }
      a.addEventListener("keydown", function (e) {
        var d = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0;
        if (d) { var nx = ids[(i + d + ids.length) % ids.length]; go(nx.id); setTimeout(function () { var on = navNode.querySelector("." + c("on")); if (on) on.focus(); }, 0); }
        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); go(p.id); }
      });
    } else {
      a = h("a", { cls: cls, href: UI.nav === "hash" ? "#/" + p.id : "javascript:void(0)", onclick: function (e) { e.preventDefault(); go(p.id); } }, [label]);
    }
    navNode.appendChild(a);
  });
}
function errSummary(errs) {
  var box = h("div", { cls: c("errsum"), tabindex: "-1" });
  if (UI.aria) box.setAttribute("role", "alert");
  box.appendChild(h("div", { cls: c("errsum-t"), text: (TX.errT || "There is a problem - {0} item(s) need your attention").replace("{0}", errs.length) }));
  var ul = h("ul");
  errs.forEach(function (e) {
    ul.appendChild(h("li", null, h("a", { href: "#" + e.f.id, text: lab(e.f) + ": " + e.msg, onclick: function (ev) {
      ev.preventDefault();
      if (e.it) { e.it.wrap.scrollIntoView({ block: "center" }); if (e.it.w.focus) e.it.w.focus(); }
    } })));
  });
  box.appendChild(ul);
  return box;
}
function renderSection(sec, scope, host) {
  var node = h("div", { cls: c("sec") });
  node.appendChild(h(UI.secTag || "h2", { cls: c("sec-t"), text: sec.tz && LANG ? sec.tz[LANG - 1] : sec.t }));
  if (sec.i) node.appendChild(h("p", { cls: c("sec-i"), text: sec.i }));
  var grid = h("div", { cls: c("grid") });
  node.appendChild(grid);
  if (sec.h && HOSTS[sec.h]) HOSTS[sec.h](sec, scope, grid);
  else sec.fs.forEach(function (f) { grid.appendChild(mountField(f, scope).wrap); });
  scope.secs.push({ sec: sec, node: node });
  host.appendChild(node);
}
function render() {
  clear(main);
  renderNav();
  if (curPage === "review") { renderReview(); return; }
  var p = CFG.pages[pageIndex(curPage)];
  topScope = new Scope(vals, null);
  var holder = h("div", { cls: c("page") });
  holder.appendChild(h("h1", { cls: c("page-t"), text: p.tz && LANG ? p.tz[LANG - 1] : p.t }));
  var sumHost = h("div");
  holder.appendChild(sumHost);
  p.secs.forEach(function (s) { renderSection(s, topScope, holder); });
  topScope.refresh();
  var idx = pageIndex(curPage);
  var bar = h("div", { cls: c("bar") });
  if (idx > 0) bar.appendChild(btn(TX.back || "Back", "plain", function () { go(CFG.pages[idx - 1].id); }));
  bar.appendChild(btn(TX.save || "Save draft", "plain", function () { persist(); toast(TX.savedMsg || "Draft saved"); renderNav(); }));
  bar.appendChild(btn(TX.next || "Save and continue", "primary", function () {
    persist();
    var errs = validateScope(topScope, pageFields(p));
    for (var k in HOSTS) if (HOSTS[k].errors) HOSTS[k].errors(errs);
    clear(sumHost);
    pageErrs[p.id] = errs.length;
    if (errs.length) {
      var box = errSummary(errs);
      sumHost.appendChild(box);
      renderNav();
      box.scrollIntoView({ block: "start" });
      box.focus();
      return;
    }
    go(idx + 1 < CFG.pages.length ? CFG.pages[idx + 1].id : "review", true);
  }));
  holder.appendChild(bar);
  main.appendChild(holder);
}

function fmtVal(f, v) {
  if (isEmpty(v)) return "—";
  if (f.k === "rep") return v.length + " " + (f.il || "item") + (v.length === 1 ? "" : "s");
  if (Array.isArray(v)) return v.map(function (x) { return typeof x === "object" ? x.name : x; }).join(", ");
  if (typeof v === "object") return v.name ? v.name : v.n !== undefined ? (v.c || "") + " " + v.n : [v.c, v.s, v.t].filter(Boolean).join(" / ");
  if (v === true) return "Yes";
  if (typeof v === "string" && v.length > 90) return v.slice(0, 90) + "…";
  return String(v);
}
function renderReview() {
  var holder = h("div", { cls: c("page") });
  holder.appendChild(h("h1", { cls: c("page-t"), text: TX.review || "Review and submit" }));
  var pv = prune(vals);
  CFG.pages.forEach(function (p) {
    var missing = 0;
    var tbl = h("table", { cls: c("rev") });
    pageFields(p).forEach(function (f) {
      if (!condOk(f.w, vals, null)) return;
      var bad = checkField(f, pv[f.id]);
      if (bad) missing++;
      tbl.appendChild(h("tr", { cls: bad ? c("rev-bad") : null }, [h("th", { text: lab(f) }), h("td", { text: fmtVal(f, pv[f.id]) })]));
    });
    holder.appendChild(h("div", { cls: c("sec") }, [
      h("h2", { cls: c("sec-t") }, [p.t + " ", h("a", { href: "javascript:void(0)", cls: c("edit"), text: TX.edit || "Edit", onclick: function () { go(p.id); } }), missing ? h("span", { cls: c("badge"), text: missing + " incomplete" }) : null]),
      tbl
    ]));
  });
  var R = CFG.rev;
  var decl = h("div", { cls: c("sec") + " " + c("decl") });
  decl.appendChild(h("h2", { cls: c("sec-t"), text: R.t }));
  decl.appendChild(h("p", { text: R.intro }));
  var st = { ok: R.cs.map(function () { return false; }), sig: "" };
  R.cs.forEach(function (text, i) {
    var row;
    function flip(on) { st.ok[i] = on; note("consent", { index: i, on: on }); }
    if (R.ck === "div") {
      var box = h("span", { cls: c("dchk"), tabindex: "0" });
      row = h("div", { cls: c("consent"), onclick: function () { var on = !st.ok[i]; box.classList.toggle(c("on"), on); flip(on); } }, [box, h("span", { text: text })]);
      box.addEventListener("keydown", function (e) { if (e.key === " " || e.key === "Enter") { e.preventDefault(); row.click(); } });
    } else {
      var cb = h("input", { type: "checkbox", id: R.ids[i], name: R.ids[i], onchange: function () { flip(cb.checked); } });
      row = h("div", { cls: c("consent") }, [cb, h("label", { "for": R.ids[i], text: " " + text })]);
    }
    decl.appendChild(row);
  });
  var sig = h("input", { type: "text", id: R.sigId, name: R.sigId, cls: c("inp"), autocomplete: "off", onchange: function () { st.sig = sig.value; if (sig.value) note("signature", { typed: true }); } });
  decl.appendChild(h("div", { cls: c("fld") }, [h("label", { cls: c("lbl"), "for": R.sigId, text: R.sigL }), sig]));
  if (R.pad && W.sigpad) decl.appendChild(W.sigpad(R));
  if (R.cap) {
    var capBox = h("div", { cls: c("cap") }, [h("span", { cls: c("dchk"), tabindex: "0", onclick: function () { note("captcha", null); toast(R.capMsg || "Verification could not be completed automatically", "bad"); } }), h("span", { text: " " + (R.capL || "I'm not a robot") })]);
    decl.appendChild(capBox);
  }
  holder.appendChild(decl);
  var msg = h("div", { cls: c("err") });
  var bar = h("div", { cls: c("bar") });
  bar.appendChild(btn(TX.back || "Back", "plain", function () { go(CFG.pages[CFG.pages.length - 1].id); }));
  bar.appendChild(btn(TX.save || "Save draft", "plain", function () { persist(); toast(TX.savedMsg || "Draft saved"); }));
  bar.appendChild(btn(TX.pay || "Pay application fee", "warn", function () {
    note("pay", { stage: "open" });
    var m = openModal({ title: TX.pay || "Pay application fee" });
    m.body.appendChild(h("p", { text: R.fee }));
    ["Cardholder name", "Card number", "Expiry (MM/YY)", "CVC"].forEach(function (l, i) {
      var id = c("pay") + i;
      m.body.appendChild(h("div", { cls: c("fld") }, [h("label", { cls: c("lbl"), "for": id, text: l }), h("input", { type: "text", id: id, cls: c("inp"), autocomplete: "off" })]));
    });
    m.foot.appendChild(btn(TX.cancel || "Cancel", "plain", function () { closeModal(m); }));
    m.foot.appendChild(btn(TX.payNow || "Pay now", "primary", function () { note("pay", { stage: "confirm" }); closeModal(m); toast("Payment could not be processed", "bad"); }));
  }));
  bar.appendChild(btn(TX.submit || "Submit application", "primary", function () {
    var all = st.ok.every(Boolean) && st.sig;
    note("submit", { completed: !!all });
    if (!all) { msg.textContent = R.need; return; }
    persist();
    clear(main);
    main.appendChild(h("div", { cls: c("page") }, [h("h1", { cls: c("page-t"), text: R.doneT }), h("p", { text: R.doneM })]));
  }));
  holder.appendChild(msg);
  holder.appendChild(bar);
  main.appendChild(holder);
}

function boot() {
  root = doc.getElementById(CFG.mount);
  var head = h("div", { cls: c("head") }, [h("div", { cls: c("brand"), text: CFG.name }), h("div", { cls: c("sub"), text: CFG.sub })]);
  if (CFG.langs) {
    var sw = h("div", { cls: c("langs") });
    CFG.langs.forEach(function (l, i) {
      sw.appendChild(h("span", { cls: c("lang") + (i === LANG ? " " + c("on") : ""), text: l, tabindex: "0", onclick: function () { LANG = i; Array.prototype.forEach.call(sw.children, function (n, j) { n.classList.toggle(c("on"), j === i); }); render(); } }));
    });
    head.appendChild(sw);
  }
  root.appendChild(head);
  var shell = h("div", { cls: c("shell") + " " + c("nav-" + (UI.nav || "side")) });
  navNode = h("div", { cls: c("nav") });
  main = h("div", { cls: c("main") });
  shell.appendChild(navNode); shell.appendChild(main);
  root.appendChild(shell);
  root.appendChild(h("div", { cls: c("foot"), text: CFG.footer || "" }));
  var start = CFG.pages[0].id;
  if (UI.nav === "hash") {
    var m = /^#\/(\w+)/.exec(location.hash);
    if (m && (pageIndex(m[1]) >= 0 || m[1] === "review")) start = m[1];
    window.addEventListener("hashchange", function () { var k = /^#\/(\w+)/.exec(location.hash); if (k && k[1] !== curPage && (pageIndex(k[1]) >= 0 || k[1] === "review")) go(k[1]); });
  }
  go(start, true);
  window.addEventListener("beforeunload", function (e) { if (dirty && UI.confirmLeave) { e.preventDefault(); e.returnValue = ""; } });
  if (CFG.cookie) {
    var bn = h("div", { cls: c("cookie") }, [h("span", { text: CFG.cookie.m })]);
    [CFG.cookie.no, CFG.cookie.yes].forEach(function (t) { bn.appendChild(btn(t, "plain", function () { bn.parentNode.removeChild(bn); })); });
    doc.body.appendChild(bn);
  }
  if (CFG.notice && !store.get(KEY + ".n")) {
    var nm = openModal({ title: CFG.notice.t, onClose: function () { store.set(KEY + ".n", 1); } });
    nm.body.appendChild(h("p", { text: CFG.notice.m }));
    nm.foot.appendChild(btn(CFG.notice.ok, "primary", function () { closeModal(nm); }));
  }
  if (CFG.idle) {
    var last = Date.now(), warn = null;
    ["mousedown", "keydown", "scroll"].forEach(function (ev) { doc.addEventListener(ev, function () { if (!warn) last = Date.now(); }, true); });
    setInterval(function () {
      if (warn || Date.now() - last < CFG.idle.after * 1000) return;
      var left = CFG.idle.grace;
      warn = openModal({ title: CFG.idle.t, closable: false });
      var p = h("p");
      warn.body.appendChild(p);
      function tick() { p.textContent = CFG.idle.m.replace("{0}", String(left)); }
      tick();
      var iv = setInterval(function () {
        left--; tick();
        if (left <= 0) { clearInterval(iv); closeModal(warn); warn = null; vals = saved ? clone(saved.v) : {}; dirty = false; last = Date.now(); note("timeout", null); toast(CFG.idle.lost, "bad"); render(); }
      }, 1000);
      warn.foot.appendChild(btn(CFG.idle.ok, "primary", function () { clearInterval(iv); closeModal(warn); warn = null; last = Date.now(); }));
    }, 1000);
  }
}
