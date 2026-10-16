function pseudo(scope, f, focusFn) {
  var it = { f: f, wrap: h("div"), w: { focus: focusFn }, err: h("div") };
  scope.items.push(it);
  return it;
}

HOSTS.shadow = function (sec, scope, grid) {
  var host = h("div", { cls: c("sh") });
  var sr = host.attachShadow({ mode: "closed" });
  sr.appendChild(h("link", { rel: "stylesheet", href: "style.css" }));
  var inner = h("div", { cls: c("grid") });
  sr.appendChild(inner);
  sec.fs.forEach(function (f) { inner.appendChild(mountField(f, scope).wrap); });
  grid.appendChild(host);
};

var frameCtl = null;
HOSTS.frame = function (sec, scope, grid) {
  var src = "frame.html";
  if (/^http/.test(location.protocol)) {
    var other = location.hostname === "localhost" ? "127.0.0.1" : location.hostname === "127.0.0.1" ? "localhost" : null;
    if (other) src = location.protocol + "//" + other + ":" + location.port + location.pathname.replace(/[^\/]*$/, "") + "frame.html";
  }
  var fr = h("iframe", { src: src, cls: c("frame"), scrolling: "no" });
  var items = {};
  sec.fs.forEach(function (f) { items[f.id] = pseudo(scope, f, function () { fr.focus(); post({ t: "focus", id: f.id }); }); });
  function post(m) { m.k = KEY; if (fr.contentWindow) fr.contentWindow.postMessage(m, "*"); }
  function onMsg(e) {
    if (e.source !== fr.contentWindow || !e.data || e.data.k !== KEY) return;
    var d = e.data;
    if (d.t === "ready") { var init = {}; sec.fs.forEach(function (f) { if (scope.vals[f.id] !== undefined) init[f.id] = scope.vals[f.id]; }); post({ t: "init", vals: init, lang: LANG }); }
    if (d.t === "v" && items[d.id]) scope.set(d.id, d.v, true);
    if (d.t === "h") fr.style.height = Math.max(200, d.h + 24) + "px";
  }
  if (frameCtl) window.removeEventListener("message", frameCtl.onMsg);
  window.addEventListener("message", onMsg);
  frameCtl = { onMsg: onMsg, post: post, items: items };
  grid.appendChild(fr);
};
HOSTS.frame.errors = function () {
  if (!frameCtl) return;
  var out = {};
  for (var id in frameCtl.items) out[id] = frameCtl.items[id].err.textContent || "";
  frameCtl.post({ t: "err", errs: out });
};
function bootFrame() {
  var sec = null;
  CFG.pages.forEach(function (p) { p.secs.forEach(function (s) { if (s.h === "frame") sec = s; }); });
  var local = {};
  var scope = new Scope(local, null);
  scope.parent = { vals: {}, get: function () {} };
  var host = doc.getElementById(CFG.mount);
  var grid = h("div", { cls: c("grid") });
  host.appendChild(grid);
  function post(m) { m.k = KEY; window.parent.postMessage(m, "*"); }
  function size() { post({ t: "h", h: doc.documentElement.scrollHeight }); }
  sec.fs.forEach(function (f) { grid.appendChild(mountField(f, scope).wrap); });
  scope.refresh();
  scope.onchange = function (id, v) { post({ t: "v", id: id, v: v }); size(); };
  window.addEventListener("message", function (e) {
    if (e.source !== window.parent || !e.data || e.data.k !== KEY) return;
    var d = e.data;
    if (d.t === "init") { for (var id in d.vals) { local[id] = d.vals[id]; var it = scope.find(id); if (it && it.w.set) it.w.set(d.vals[id]); } scope.refresh(); size(); }
    if (d.t === "err") { for (var k in d.errs) { var it2 = scope.find(k); if (it2) showErr(it2, d.errs[k]); } size(); }
    if (d.t === "focus") { var it3 = scope.find(d.id); if (it3 && it3.w.focus) it3.w.focus(); }
  });
  post({ t: "ready" });
  setTimeout(size, 50);
}

var canvasCtls = [];
function maskOf(f) { var x = f.x || {}; return x.mask || (f.k === "date-mask" ? (f.fmt || "DD/MM/YYYY").replace(/[DMY]/g, "#") : f.k === "month-mask" ? "##/####" : null); }
function hintOf(f) { return f.k === "date-mask" ? (f.fmt || "DD/MM/YYYY") : f.k === "month-mask" ? "MM/YYYY" : (f.ph || ""); }
HOSTS.canvas = function (sec, scope, grid) {
  var CW = 760, COLS = 2, GAP = 24, PADX = 4, LH = 22, BH = 34, ROW = 86, OPT = 28, MAXO = 7;
  var colW = (CW - GAP * (COLS - 1) - PADX * 2) / COLS;
  var cv = h("canvas", { cls: c("cv") });
  var ta = h("textarea", { cls: c("cv-ta"), autocomplete: "off", autocapitalize: "off", spellcheck: "false", rows: "1" });
  var wrap = h("div", { cls: c("cv-w") }, [cv, ta]);
  var g = cv.getContext("2d");
  var items = {}, focus = -1, caret = 0, selAll = false, dd = null, blink = true, boxes = [];
  sec.fs.forEach(function (f, i) { items[f.id] = pseudo(scope, f, function () { setFocus(vis().indexOf(f)); }); });
  function vis() { return sec.fs.filter(function (f) { return condOk(f.w, scope.vals, null); }); }
  function kindOf(f) { return f.k === "select" || f.k === "radio" ? "sel" : f.k === "check" ? "chk" : "txt"; }
  function val(f) { var v = scope.vals[f.id]; return v === undefined || v === null ? "" : v; }
  function font(b) { return (b ? "600 " : "") + "14px -apple-system, 'Segoe UI', Roboto, Arial, sans-serif"; }
  function layout() {
    var list = vis(); boxes = [];
    var avail = wrap.parentNode && wrap.parentNode.clientWidth;
    if (avail) { CW = Math.max(320, Math.min(760, avail)); COLS = CW < 560 ? 1 : 2; colW = (CW - GAP * (COLS - 1) - PADX * 2) / COLS; wrap.style.width = CW + "px"; }
    list.forEach(function (f, i) {
      var col = i % COLS, row = Math.floor(i / COLS);
      boxes.push({ f: f, x: PADX + col * (colW + GAP), y: 8 + row * ROW + LH, w: kindOf(f) === "chk" ? 20 : colW, h: kindOf(f) === "chk" ? 20 : BH, ly: 8 + row * ROW });
    });
    var rows = Math.ceil(list.length / COLS);
    return 8 + rows * ROW + (dd ? OPT * MAXO : 0) + 12;
  }
  function paint() {
    var H = layout(), dpr = window.devicePixelRatio || 1;
    if (cv.width !== CW * dpr || cv.height !== H * dpr) { cv.width = CW * dpr; cv.height = H * dpr; cv.style.width = CW + "px"; cv.style.height = H + "px"; }
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    g.clearRect(0, 0, CW, H);
    g.textBaseline = "middle";
    boxes.forEach(function (b, i) {
      var f = b.f, k = kindOf(f), on = i === focus, err = items[f.id].err.textContent;
      g.font = font(true); g.fillStyle = "#1f2a37";
      var label = lab(f) + (f.r ? " *" : "");
      if (k === "chk") {
        g.strokeStyle = on ? "#0b63ce" : "#7a8594"; g.lineWidth = on ? 2 : 1; g.strokeRect(b.x + 0.5, b.y + 0.5, 20, 20);
        if (val(f)) { g.strokeStyle = "#0b63ce"; g.lineWidth = 3; g.beginPath(); g.moveTo(b.x + 4, b.y + 11); g.lineTo(b.x + 9, b.y + 16); g.lineTo(b.x + 17, b.y + 5); g.stroke(); }
        g.fillText(label, b.x + 30, b.y + 10);
      } else {
        g.fillText(label, b.x, b.ly + LH / 2);
        g.fillStyle = "#fff"; g.fillRect(b.x, b.y, b.w, b.h);
        g.strokeStyle = err ? "#b42318" : on ? "#0b63ce" : "#7a8594"; g.lineWidth = on ? 2 : 1; g.strokeRect(b.x + 0.5, b.y + 0.5, b.w, b.h);
        g.font = font(false);
        var text = String(val(f)), shown = text;
        if (!text) { g.fillStyle = "#9aa4b2"; shown = k === "sel" ? ((f.x && f.x.blank) || "Select") : hintOf(f); } else g.fillStyle = "#111";
        g.save(); g.beginPath(); g.rect(b.x + 4, b.y, b.w - (k === "sel" ? 28 : 8), b.h); g.clip();
        if (on && selAll && text) { g.fillStyle = "#cfe3ff"; g.fillRect(b.x + 7, b.y + 6, g.measureText(text).width + 2, b.h - 12); g.fillStyle = "#111"; }
        g.fillText(shown, b.x + 8, b.y + b.h / 2);
        if (on && k === "txt" && blink && !selAll) { var cx = b.x + 8 + g.measureText(text.slice(0, caret)).width; g.fillStyle = "#111"; g.fillRect(cx, b.y + 7, 1.2, b.h - 14); }
        g.restore();
        if (k === "sel") { g.fillStyle = "#475467"; g.beginPath(); g.moveTo(b.x + b.w - 20, b.y + 14); g.lineTo(b.x + b.w - 10, b.y + 14); g.lineTo(b.x + b.w - 15, b.y + 21); g.fill(); }
      }
      if (err) { g.font = "12px Arial, sans-serif"; g.fillStyle = "#b42318"; g.fillText(err, b.x, b.y + b.h + 10); }
    });
    if (dd) {
      var b = boxes[dd.i]; if (!b) { dd = null; return; }
      var n = Math.min(MAXO, b.f.o.length), top = b.y + b.h + 2;
      g.fillStyle = "#fff"; g.fillRect(b.x, top, b.w, n * OPT); g.strokeStyle = "#475467"; g.lineWidth = 1; g.strokeRect(b.x + 0.5, top + 0.5, b.w, n * OPT);
      g.font = font(false);
      for (var r = 0; r < n; r++) {
        var oi = dd.top + r, o = b.f.o[oi];
        if (oi === dd.hi) { g.fillStyle = "#e4efff"; g.fillRect(b.x + 1, top + r * OPT + 1, b.w - 2, OPT - 1); }
        g.fillStyle = "#111"; g.fillText(o, b.x + 8, top + r * OPT + OPT / 2);
      }
      if (b.f.o.length > n) { var th = n * OPT * n / b.f.o.length, ty = top + (n * OPT - th) * dd.top / (b.f.o.length - n); g.fillStyle = "#c2c9d3"; g.fillRect(b.x + b.w - 6, ty, 4, th); }
    }
  }
  function commit(f, v) { scope.set(f.id, v, true); scope.refresh(); }
  function setFocus(i, atEnd) {
    dd = null; selAll = false;
    focus = i;
    if (i < 0) { paint(); return; }
    var b = boxes[i]; if (!b) { focus = -1; paint(); return; }
    var k = kindOf(b.f);
    ta.value = k === "txt" ? String(val(b.f)) : "";
    if (k === "txt") { caret = atEnd === false ? caret : ta.value.length; ta.setSelectionRange(caret, caret); }
    ta.style.left = b.x + "px"; ta.style.top = b.y + "px";
    ta.focus({ preventScroll: true });
    paint();
  }
  function openDD(i) { var f = boxes[i].f, at = Math.max(0, f.o.indexOf(val(f))); dd = { i: i, hi: at, top: Math.max(0, Math.min(at, f.o.length - MAXO)) }; paint(); }
  function ddMove(d) { var f = boxes[dd.i].f; dd.hi = Math.max(0, Math.min(f.o.length - 1, dd.hi + d)); if (dd.hi < dd.top) dd.top = dd.hi; if (dd.hi >= dd.top + MAXO) dd.top = dd.hi - MAXO + 1; paint(); }
  function pickDD() { var f = boxes[dd.i].f; commit(f, f.o[dd.hi]); dd = null; paint(); }
  function hit(e) { var r = cv.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; }
  cv.addEventListener("mousedown", function (e) {
    e.preventDefault();
    var p = hit(e);
    if (dd) {
      var b0 = boxes[dd.i], top = b0.y + b0.h + 2, n = Math.min(MAXO, b0.f.o.length);
      if (p.x >= b0.x && p.x <= b0.x + b0.w && p.y >= top && p.y <= top + n * OPT) { dd.hi = dd.top + Math.floor((p.y - top) / OPT); pickDD(); ta.focus({ preventScroll: true }); return; }
    }
    for (var i = 0; i < boxes.length; i++) {
      var b = boxes[i], k = kindOf(b.f), wHit = k === "chk" ? 30 + 8 * (lab(b.f).length) : b.w;
      if (p.x >= b.x && p.x <= b.x + wHit && p.y >= b.y && p.y <= b.y + b.h) {
        if (k === "chk") { setFocus(i); commit(b.f, !val(b.f)); paint(); return; }
        if (k === "sel") { var wasOpen = dd && dd.i === i; setFocus(i); if (!wasOpen) openDD(i); return; }
        g.font = font(false);
        var text = String(val(b.f)), best = text.length;
        for (var q = 0; q <= text.length; q++) { if (b.x + 8 + g.measureText(text.slice(0, q)).width >= p.x - 3) { best = q; break; } }
        caret = best; setFocus(i, false); return;
      }
    }
    setFocus(-1); ta.blur();
  });
  cv.addEventListener("dblclick", function () { if (focus >= 0 && kindOf(boxes[focus].f) === "txt") { selAll = true; ta.select(); paint(); } });
  cv.addEventListener("wheel", function (e) { if (!dd) return; e.preventDefault(); var f = boxes[dd.i].f; dd.top = Math.max(0, Math.min(f.o.length - MAXO, dd.top + (e.deltaY > 0 ? 1 : -1))); paint(); }, { passive: false });
  cv.addEventListener("mousemove", function (e) {
    if (!dd) return; var p = hit(e), b0 = boxes[dd.i], top = b0.y + b0.h + 2;
    if (p.x >= b0.x && p.x <= b0.x + b0.w && p.y >= top && p.y < top + Math.min(MAXO, b0.f.o.length) * OPT) { var hi = dd.top + Math.floor((p.y - top) / OPT); if (hi !== dd.hi) { dd.hi = hi; paint(); } }
  });
  ta.addEventListener("input", function () {
    if (focus < 0) return;
    var f = boxes[focus].f, k = kindOf(f), x = f.x || {};
    if (k !== "txt") {
      var ch = ta.value.slice(-1).toLowerCase(); ta.value = "";
      if (ch && k === "sel") { var from = dd ? dd.hi : f.o.indexOf(val(f)); for (var s = 1; s <= f.o.length; s++) { var oi = (from + s) % f.o.length; if (f.o[oi].toLowerCase().charAt(0) === ch) { if (dd) { dd.hi = oi; ddMove(0); } else commit(f, f.o[oi]); break; } } paint(); }
      return;
    }
    var v = ta.value.replace(/[\r\n]+/g, " ");
    var mk = maskOf(f);
    if (mk) v = applyMask(mk, v);
    if (x.upper) v = v.toUpperCase();
    if (x.max && v.length > x.max) v = v.slice(0, x.max);
    if (v !== ta.value) { var at = ta.selectionStart; ta.value = v; at = Math.min(v.length, mk ? v.length : at); ta.setSelectionRange(at, at); }
    caret = ta.selectionStart; selAll = false; commit(f, v); paint();
  });
  function syncCaret() { if (focus >= 0 && kindOf(boxes[focus].f) === "txt") { caret = ta.selectionStart; selAll = ta.selectionEnd - ta.selectionStart > 0 && ta.selectionEnd - ta.selectionStart === ta.value.length; blink = true; paint(); } }
  ta.addEventListener("keyup", syncCaret);
  ta.addEventListener("select", syncCaret);
  ta.addEventListener("keydown", function (e) {
    if (focus < 0) return;
    var f = boxes[focus].f, k = kindOf(f);
    if (e.key === "Tab") {
      var nx = focus + (e.shiftKey ? -1 : 1);
      if (nx >= 0 && nx < boxes.length) { e.preventDefault(); setFocus(nx); }
      else { dd = null; }
      return;
    }
    if (k === "sel") {
      if (dd) {
        if (e.key === "ArrowDown") { e.preventDefault(); ddMove(1); } else if (e.key === "ArrowUp") { e.preventDefault(); ddMove(-1); }
        else if (e.key === "PageDown") { e.preventDefault(); ddMove(MAXO); } else if (e.key === "PageUp") { e.preventDefault(); ddMove(-MAXO); }
        else if (e.key === "Enter") { e.preventDefault(); pickDD(); } else if (e.key === "Escape") { e.preventDefault(); e.stopPropagation(); dd = null; paint(); }
      } else if (e.key === "Enter" || e.key === " " || e.key === "ArrowDown") { e.preventDefault(); openDD(focus); }
      return;
    }
    if (k === "chk") { if (e.key === " " || e.key === "Enter") { e.preventDefault(); commit(f, !val(f)); paint(); } return; }
    if (e.key === "Enter") e.preventDefault();
  });
  ta.addEventListener("blur", function () { setTimeout(function () { if (doc.activeElement !== ta) { if (focus >= 0) { var f = boxes[focus] && boxes[focus].f; if (f && kindOf(f) === "txt") scope.set(f.id, String(val(f)).trim(), true); } focus = -1; dd = null; paint(); } }, 0); });
  var prev = scope.onchange;
  scope.onchange = function (id, v) { if (prev) prev(id, v); if (!items[id]) paint(); };
  canvasCtls = canvasCtls.filter(function (q) { if (q.live && !q.cv.isConnected) { clearInterval(q.iv); return false; } return true; });
  var me = { paint: paint, cv: cv, live: false, iv: setInterval(function () { if (!cv.isConnected) return; me.live = true; blink = !blink; if (focus >= 0) paint(); }, 530) };
  canvasCtls.push(me);
  grid.appendChild(wrap);
  paint();
  setTimeout(paint, 0);
  window.addEventListener("resize", function () { if (cv.isConnected) paint(); });
};
HOSTS.canvas.errors = function () { canvasCtls.forEach(function (q) { if (q.cv.isConnected) q.paint(); }); };
