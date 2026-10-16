function popBox(wrap, cls) {
  var p = h("div", { cls: c("pop") + (cls ? " " + cls : "") });
  var off = null;
  var api = {
    node: p, open: false,
    show: function () { if (api.open) return; api.open = true; wrap.appendChild(p); off = outside(wrap, api.hide); },
    hide: function () { if (!api.open) return; api.open = false; if (p.parentNode) p.parentNode.removeChild(p); if (off) off(); if (api.onHide) api.onHide(); }
  };
  return api;
}
function listNav(e, state, n, pick, close) {
  if (e.key === "ArrowDown") { e.preventDefault(); state.i = Math.min(n - 1, state.i + 1); return true; }
  if (e.key === "ArrowUp") { e.preventDefault(); state.i = Math.max(0, state.i - 1); return true; }
  if (e.key === "Enter") { e.preventDefault(); if (state.i >= 0) pick(state.i); return false; }
  if (e.key === "Escape") { e.preventDefault(); e.stopPropagation(); close(); return false; }
  return false;
}

W.sselect = function (f, ctx) {
  var x = f.x || {}, CH = x.chunk || 10;
  var wrap = h("div", { cls: c("ss"), id: f.id });
  var face = h("div", { cls: c("ss-face"), tabindex: "0" }, [h("span", { cls: c("ss-val") }), h("span", { cls: c("ss-car"), text: "▾" })]);
  if (UI.aria) { face.setAttribute("role", "combobox"); face.setAttribute("aria-haspopup", "listbox"); face.setAttribute("aria-expanded", "false"); }
  wrap.appendChild(face);
  var pop = popBox(wrap), st = { i: -1 }, shown = 0, hits = [];
  var q = h("input", { type: "text", cls: c("inp") + " " + c("ss-q"), placeholder: x.qph || "Type to search", autocomplete: "off" });
  var list = h("div", { cls: c("ss-list") });
  if (UI.aria) list.setAttribute("role", "listbox");
  var more = h("div", { cls: c("ss-more") });
  pop.node.appendChild(q); pop.node.appendChild(list); pop.node.appendChild(more);
  function paint(v) { var s = face.firstChild; s.textContent = v || (x.blank || "Select…"); s.classList.toggle(c("muted"), !v); }
  function filter() {
    var s = q.value.trim().toLowerCase();
    hits = f.o.filter(function (o) { return !s || o.toLowerCase().indexOf(s) >= 0; });
    clear(list); shown = 0; st.i = hits.length ? 0 : -1; grow();
  }
  function grow() {
    hits.slice(shown, shown + CH).forEach(function (o, k) {
      var idx = shown + k;
      var row = h("div", { cls: c("ss-opt"), text: o, onmousedown: function (e) { e.preventDefault(); pick(idx); }, onmousemove: function () { st.i = idx; mark(); } });
      if (UI.aria) row.setAttribute("role", "option");
      list.appendChild(row);
    });
    shown = Math.min(hits.length, shown + CH);
    more.textContent = !hits.length ? (x.none || "No results found") : shown < hits.length ? (x.moreT || "Showing {0} of {1} - scroll or refine your search").replace("{0}", shown).replace("{1}", hits.length) : "";
    mark();
  }
  function mark() {
    Array.prototype.forEach.call(list.children, function (n, k) { n.classList.toggle(c("act"), k === st.i); n.classList.toggle(c("sel"), n.textContent === ctx.get()); });
    var a = list.children[st.i];
    if (a) { if (a.offsetTop < list.scrollTop) list.scrollTop = a.offsetTop; else if (a.offsetTop + a.offsetHeight > list.scrollTop + list.clientHeight) list.scrollTop = a.offsetTop + a.offsetHeight - list.clientHeight; }
  }
  function pick(i) { ctx.set(hits[i]); paint(hits[i]); pop.hide(); face.focus(); }
  function open() { pop.show(); q.value = ""; filter(); if (UI.aria) face.setAttribute("aria-expanded", "true"); setTimeout(function () { q.focus(); }, 0); }
  pop.onHide = function () { if (UI.aria) face.setAttribute("aria-expanded", "false"); };
  list.addEventListener("scroll", function () { if (shown < hits.length && list.scrollTop + list.clientHeight >= list.scrollHeight - 4) grow(); });
  q.addEventListener("input", filter);
  q.addEventListener("keydown", function (e) {
    if (e.key === "Tab") { pop.hide(); return; }
    if (e.key === "ArrowDown" && st.i >= shown - 1 && shown < hits.length) grow();
    if (listNav(e, st, shown, pick, function () { pop.hide(); face.focus(); })) mark();
  });
  face.addEventListener("click", function () { pop.open ? pop.hide() : open(); });
  face.addEventListener("keydown", function (e) { if (e.key === "Enter" || e.key === " " || e.key === "ArrowDown") { e.preventDefault(); open(); } });
  paint("");
  return { el: wrap, main: face, set: function (v) { paint(v || ""); }, focus: function () { face.focus(); } };
};

W.vselect = function (f, ctx) {
  var x = f.x || {}, RH = 30, VIS = 8;
  var wrap = h("div", { cls: c("ss"), id: f.id });
  var face = h("div", { cls: c("ss-face"), tabindex: "0" }, [h("span", { cls: c("ss-val") }), h("span", { cls: c("ss-car"), text: "▾" })]);
  wrap.appendChild(face);
  var pop = popBox(wrap), st = { i: 0 }, hits = f.o;
  var q = h("input", { type: "text", cls: c("inp") + " " + c("ss-q"), placeholder: x.qph || "Filter", autocomplete: "off" });
  var port = h("div", { cls: c("vs-port"), style: "height:" + RH * VIS + "px" });
  var space = h("div", { cls: c("vs-space") });
  port.appendChild(space);
  pop.node.appendChild(q); pop.node.appendChild(port);
  function paint(v) { var s = face.firstChild; s.textContent = v || (x.blank || "Choose an option"); s.classList.toggle(c("muted"), !v); }
  function draw() {
    space.style.height = hits.length * RH + "px";
    clear(space);
    var first = Math.max(0, Math.floor(port.scrollTop / RH) - 1), last = Math.min(hits.length, first + VIS + 3);
    for (var i = first; i < last; i++) (function (i) {
      space.appendChild(h("div", { cls: c("ss-opt") + (i === st.i ? " " + c("act") : "") + (hits[i] === ctx.get() ? " " + c("sel") : ""), style: "position:absolute;left:0;right:0;top:" + i * RH + "px;height:" + RH + "px", text: hits[i], onmousedown: function (e) { e.preventDefault(); pick(i); } }));
    })(i);
    if (!hits.length) space.appendChild(h("div", { cls: c("muted"), text: x.none || "Nothing matches" }));
  }
  function ensure() { if (st.i * RH < port.scrollTop) port.scrollTop = st.i * RH; else if ((st.i + 1) * RH > port.scrollTop + RH * VIS) port.scrollTop = (st.i + 1) * RH - RH * VIS; draw(); }
  function pick(i) { ctx.set(hits[i]); paint(hits[i]); pop.hide(); face.focus(); }
  port.addEventListener("scroll", draw);
  q.addEventListener("input", function () { var s = q.value.trim().toLowerCase(); hits = f.o.filter(function (o) { return o.toLowerCase().indexOf(s) >= 0; }); st.i = 0; port.scrollTop = 0; draw(); });
  q.addEventListener("keydown", function (e) { if (e.key === "Tab") { pop.hide(); return; } if (listNav(e, st, hits.length, pick, function () { pop.hide(); face.focus(); })) ensure(); });
  function open() { pop.show(); q.value = ""; hits = f.o; st.i = Math.max(0, hits.indexOf(ctx.get())); draw(); setTimeout(function () { q.focus(); ensure(); }, 0); }
  face.addEventListener("click", function () { pop.open ? pop.hide() : open(); });
  face.addEventListener("keydown", function (e) { if (e.key === "Enter" || e.key === " " || e.key === "ArrowDown") { e.preventDefault(); open(); } });
  paint("");
  return { el: wrap, main: face, set: function (v) { paint(v || ""); }, focus: function () { face.focus(); } };
};

W.chips = function (f, ctx) {
  var x = f.x || {};
  var wrap = h("div", { cls: c("chips"), id: f.id });
  var box = h("div", { cls: c("chips-box") });
  var q = h("input", { type: "text", cls: c("chips-q"), placeholder: x.qph || "Add…", autocomplete: "off" });
  wrap.appendChild(box);
  var pop = popBox(wrap), st = { i: 0 }, hits = [];
  function cur() { return (ctx.get() || []).slice(); }
  function draw() {
    clear(box);
    cur().forEach(function (v) {
      box.appendChild(h("span", { cls: c("chip") }, [v, h("span", { cls: c("chip-x"), text: "×", onmousedown: function (e) { e.preventDefault(); ctx.set(cur().filter(function (o) { return o !== v; })); draw(); } })]));
    });
    box.appendChild(q);
  }
  function list() {
    var s = q.value.trim().toLowerCase(), have = cur();
    hits = f.o.filter(function (o) { return have.indexOf(o) < 0 && (!s || o.toLowerCase().indexOf(s) >= 0); });
    clear(pop.node);
    if (!hits.length) pop.node.appendChild(h("div", { cls: c("muted"), text: x.none || "No more options" }));
    hits.forEach(function (o, i) { pop.node.appendChild(h("div", { cls: c("ss-opt") + (i === st.i ? " " + c("act") : ""), text: o, onmousedown: function (e) { e.preventDefault(); add(i); } })); });
    var a = pop.node.children[st.i]; if (a && a.scrollIntoView) a.scrollIntoView({ block: "nearest" });
  }
  function add(i) { var l = cur(); if (x.max && l.length >= x.max) { toast((x.mMax || "You can select up to {0}").replace("{0}", x.max), "bad"); return; } l.push(hits[i]); ctx.set(l); q.value = ""; st.i = 0; draw(); q.focus(); list(); }
  q.addEventListener("focus", function () { pop.show(); st.i = 0; list(); });
  q.addEventListener("input", function () { pop.show(); st.i = 0; list(); });
  q.addEventListener("keydown", function (e) {
    if (e.key === "Backspace" && !q.value) { var l = cur(); l.pop(); ctx.set(l); draw(); q.focus(); list(); return; }
    if (e.key === "Tab") { pop.hide(); return; }
    if (listNav(e, st, hits.length, add, function () { pop.hide(); })) list();
  });
  box.addEventListener("mousedown", function (e) { if (e.target === box) { e.preventDefault(); q.focus(); } });
  draw();
  return { el: wrap, main: q, set: draw, focus: function () { q.focus(); } };
};

W.tree = function (f, ctx) {
  var x = f.x || {};
  var wrap = h("div", { cls: c("ss"), id: f.id });
  var face = h("div", { cls: c("ss-face"), tabindex: "0" }, [h("span", { cls: c("ss-val") }), h("span", { cls: c("ss-car"), text: "▾" })]);
  wrap.appendChild(face);
  var pop = popBox(wrap, c("tree-pop")), openSet = {}, flat = [], st = { i: 0 };
  function paint(v) { var s = face.firstChild; s.textContent = v || (x.blank || "Browse…"); s.classList.toggle(c("muted"), !v); }
  function build() {
    flat = [];
    (function walk(nodes, depth, path) {
      nodes.forEach(function (n) { var p = path + "/" + n.t; flat.push({ n: n, d: depth, p: p }); if (n.ch && openSet[p]) walk(n.ch, depth + 1, p); });
    })(x.tree, 0, "");
    clear(pop.node);
    flat.forEach(function (r, i) {
      var leaf = !r.n.ch;
      pop.node.appendChild(h("div", { cls: c("tree-row") + (i === st.i ? " " + c("act") : "") + (leaf ? " " + c("leaf") : ""), style: "padding-left:" + (8 + r.d * 18) + "px", onmousedown: function (e) { e.preventDefault(); st.i = i; act(i); } }, [h("span", { cls: c("tree-car"), text: leaf ? "" : openSet[r.p] ? "▾" : "▸" }), h("span", { text: r.n.t })]));
    });
    var a = pop.node.children[st.i]; if (a && a.scrollIntoView) a.scrollIntoView({ block: "nearest" });
  }
  function act(i) { var r = flat[i]; if (r.n.ch) { openSet[r.p] = !openSet[r.p]; build(); } else { ctx.set(r.n.t); paint(r.n.t); pop.hide(); face.focus(); } }
  face.addEventListener("click", function () { if (pop.open) pop.hide(); else { pop.show(); build(); } });
  face.addEventListener("keydown", function (e) {
    if (!pop.open) { if (e.key === "Enter" || e.key === " " || e.key === "ArrowDown") { e.preventDefault(); pop.show(); build(); } return; }
    var r = flat[st.i];
    if (e.key === "ArrowRight" && r.n.ch && !openSet[r.p]) { e.preventDefault(); openSet[r.p] = true; build(); return; }
    if (e.key === "ArrowLeft" && r.n.ch && openSet[r.p]) { e.preventDefault(); openSet[r.p] = false; build(); return; }
    if (e.key === "Tab") { pop.hide(); return; }
    if (listNav(e, st, flat.length, act, function () { pop.hide(); })) build();
  });
  paint("");
  return { el: wrap, main: face, set: function (v) { paint(v || ""); }, focus: function () { face.focus(); } };
};

function drawnGroup(f, ctx, multi) {
  var el = h("div", { cls: c("dgroup"), id: f.id });
  if (UI.aria) el.setAttribute("role", multi ? "group" : "radiogroup");
  var nodes = [];
  function val() { return multi ? (ctx.get() || []) : ctx.get(); }
  function on(o) { return multi ? val().indexOf(o) >= 0 : val() === o; }
  function paint() { nodes.forEach(function (n, i) { var a = on(f.o[i]); n.classList.toggle(c("on"), a); if (UI.aria) n.setAttribute("aria-checked", a ? "true" : "false"); n.tabIndex = multi || a || (!val() && i === 0) ? 0 : -1; }); }
  function flip(o) {
    if (multi) { var l = val().slice(), k = l.indexOf(o); if (k >= 0) l.splice(k, 1); else l.push(o); ctx.set(l); }
    else ctx.set(o);
    paint();
  }
  f.o.forEach(function (o, i) {
    var n = h("div", { cls: c("dopt"), onclick: function () { flip(o); } }, [h("span", { cls: multi ? c("dchk") : c("drad") }), h("span", { cls: c("dopt-t"), text: o })]);
    if (UI.aria) n.setAttribute("role", multi ? "checkbox" : "radio");
    n.addEventListener("keydown", function (e) {
      if (e.key === " " || e.key === "Enter") { e.preventDefault(); flip(o); }
      var d = e.key === "ArrowRight" || e.key === "ArrowDown" ? 1 : e.key === "ArrowLeft" || e.key === "ArrowUp" ? -1 : 0;
      if (d) { e.preventDefault(); var t = nodes[(i + d + nodes.length) % nodes.length]; if (!multi) flip(f.o[(i + d + nodes.length) % nodes.length]); t.focus(); }
    });
    nodes.push(n); el.appendChild(n);
  });
  paint();
  return { el: el, main: el, set: paint, focus: function () { (nodes.filter(function (n) { return n.tabIndex === 0; })[0] || nodes[0]).focus(); } };
}
W.dradio = function (f, ctx) { return drawnGroup(f, ctx, false); };
W.dchecks = function (f, ctx) { return drawnGroup(f, ctx, true); };
W.dcheck = function (f, ctx) {
  var box = h("span", { cls: c("dchk"), tabindex: "0", id: f.id });
  if (UI.aria) box.setAttribute("role", "checkbox");
  function paint() { box.classList.toggle(c("on"), !!ctx.get()); if (UI.aria) box.setAttribute("aria-checked", ctx.get() ? "true" : "false"); }
  function flip() { ctx.set(!ctx.get()); paint(); }
  box.addEventListener("click", flip);
  box.addEventListener("keydown", function (e) { if (e.key === " " || e.key === "Enter") { e.preventDefault(); flip(); } });
  paint();
  return { el: box, main: box, set: paint, focus: function () { box.focus(); } };
};
W.toggle = function (f, ctx) {
  var sw = h("span", { cls: c("switch"), tabindex: "0", id: f.id }, [h("span", { cls: c("knob") })]);
  function paint() { sw.classList.toggle(c("on"), !!ctx.get()); }
  function flip() { ctx.set(!ctx.get()); paint(); }
  sw.addEventListener("click", flip);
  sw.addEventListener("keydown", function (e) { if (e.key === " " || e.key === "Enter") { e.preventDefault(); flip(); } });
  paint();
  return { el: sw, main: sw, set: paint, focus: function () { sw.focus(); } };
};

function fmtDate(iso, fmt) { if (!iso) return ""; var p = iso.split("-"); return (fmt || "DD/MM/YYYY").replace("YYYY", p[0]).replace("MM", p[1]).replace("DD", p[2]); }
W["date-cal"] = function (f, ctx) {
  var x = f.x || {}, fmt = f.fmt || "DD/MM/YYYY";
  var wrap = h("div", { cls: c("cal-w"), id: f.id + "_c" });
  var inp = h("input", { type: "text", readonly: true, id: f.id, name: f.id, cls: c("inp"), placeholder: fmt.toLowerCase() });
  wrap.appendChild(inp); wrap.appendChild(h("span", { cls: c("cal-ico"), text: "▦", onclick: function () { toggle(); } }));
  var pop = popBox(wrap, c("cal")), view = "d", cur = null, focusDay = null;
  function today() { return "2026-09-20"; }
  function iso(y, m, d) { return y + "-" + pad2(m) + "-" + pad2(d); }
  function ok(s) { return !(x.minD && s < x.minD) && !(x.maxD && s > x.maxD); }
  function draw() {
    clear(pop.node);
    var y = cur[0], m = cur[1];
    var head = h("div", { cls: c("cal-h") });
    var step = view === "d" ? function (d) { m += d; if (m < 1) { m = 12; y--; } if (m > 12) { m = 1; y++; } } : view === "m" ? function (d) { y += d; } : function (d) { y += d * 12; };
    head.appendChild(h("span", { cls: c("cal-nav"), text: "‹", onmousedown: function (e) { e.preventDefault(); step(-1); cur = [y, m]; draw(); } }));
    head.appendChild(h("span", { cls: c("cal-title"), text: view === "d" ? MONTHS[m - 1] + " " + y : view === "m" ? String(y) : (y - (y % 12)) + " - " + (y - (y % 12) + 11), onmousedown: function (e) { e.preventDefault(); view = view === "d" ? "m" : "y"; draw(); } }));
    head.appendChild(h("span", { cls: c("cal-nav"), text: "›", onmousedown: function (e) { e.preventDefault(); step(1); cur = [y, m]; draw(); } }));
    pop.node.appendChild(head);
    var grid = h("div", { cls: c("cal-g") + " " + c("cal-" + view) });
    if (view === "y") {
      var y0 = y - (y % 12);
      for (var k = 0; k < 12; k++) (function (yy) { grid.appendChild(h("span", { cls: c("cal-c") + (yy === y ? " " + c("act") : ""), text: String(yy), onmousedown: function (e) { e.preventDefault(); cur = [yy, m]; view = "m"; draw(); } })); })(y0 + k);
    } else if (view === "m") {
      MONTHS.forEach(function (name, k) { grid.appendChild(h("span", { cls: c("cal-c") + (k + 1 === m ? " " + c("act") : ""), text: name.slice(0, 3), onmousedown: function (e) { e.preventDefault(); cur = [y, k + 1]; view = "d"; draw(); } })); });
    } else {
      ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"].forEach(function (d) { grid.appendChild(h("span", { cls: c("cal-dow"), text: d })); });
      var lead = (new Date(Date.UTC(y, m - 1, 1)).getUTCDay() + 6) % 7, n = new Date(Date.UTC(y, m, 0)).getUTCDate();
      for (var b = 0; b < lead; b++) grid.appendChild(h("span", { cls: c("cal-c") + " " + c("cal-off") }));
      for (var d = 1; d <= n; d++) (function (d) {
        var s = iso(y, m, d), good = ok(s);
        grid.appendChild(h("span", { cls: c("cal-c") + (good ? "" : " " + c("cal-dis")) + (s === ctx.get() ? " " + c("sel") : "") + (s === focusDay ? " " + c("act") : "") + (s === today() ? " " + c("cal-today") : ""), text: String(d), onmousedown: function (e) { e.preventDefault(); if (good) pick(s); } }));
      })(d);
    }
    pop.node.appendChild(grid);
    pop.node.appendChild(h("div", { cls: c("cal-f") }, [h("span", { cls: c("link"), text: x.clearT || "Clear", onmousedown: function (e) { e.preventDefault(); ctx.set(""); inp.value = ""; pop.hide(); } })]));
  }
  function pick(s) { ctx.set(s); inp.value = fmtDate(s, fmt); pop.hide(); inp.focus(); }
  function open() { var v = ctx.get() || x.openAt || today(); var p = v.split("-"); cur = [+p[0], +p[1]]; focusDay = ctx.get() || null; view = "d"; pop.show(); draw(); }
  function toggle() { pop.open ? pop.hide() : open(); }
  inp.addEventListener("click", toggle);
  inp.addEventListener("keydown", function (e) {
    if (!pop.open) { if (e.key === "Enter" || e.key === " " || e.key === "ArrowDown") { e.preventDefault(); open(); } return; }
    if (e.key === "Escape") { e.preventDefault(); e.stopPropagation(); pop.hide(); return; }
    if (e.key === "Tab") { pop.hide(); return; }
    if (view !== "d") return;
    var base = focusDay || iso(cur[0], cur[1], 1), dt = new Date(base + "T00:00:00Z");
    var delta = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 }[e.key];
    if (delta) { e.preventDefault(); dt.setUTCDate(dt.getUTCDate() + delta); }
    else if (e.key === "PageUp" || e.key === "PageDown") { e.preventDefault(); dt.setUTCMonth(dt.getUTCMonth() + (e.key === "PageUp" ? -1 : 1) * (e.shiftKey ? 12 : 1)); }
    else if (e.key === "Enter") { e.preventDefault(); if (focusDay && ok(focusDay)) pick(focusDay); return; }
    else return;
    focusDay = dt.toISOString().slice(0, 10); cur = [dt.getUTCFullYear(), dt.getUTCMonth() + 1]; draw();
  });
  return { el: wrap, main: inp, set: function (v) { inp.value = fmtDate(v, fmt); }, focus: function () { inp.focus(); } };
};
W["date-cal"].check = function (f, v) { return rangeMsg(f, v); };

W["phone-cc"] = function (f, ctx) {
  var x = f.x || {}, C = CFG.db.cc;
  var wrap = h("div", { cls: c("pcc"), id: f.id + "_g" });
  var face = h("div", { cls: c("pcc-face"), tabindex: "0" });
  var num = h("input", { type: "tel", id: f.id, name: f.id, cls: c("inp"), autocomplete: "off" });
  wrap.appendChild(face); wrap.appendChild(num);
  var pop = popBox(wrap), st = { i: 0 }, hits = [];
  var q = h("input", { type: "text", cls: c("inp") + " " + c("ss-q"), placeholder: x.qph || "Search country or code", autocomplete: "off" });
  var list = h("div", { cls: c("ss-list") });
  pop.node.appendChild(q); pop.node.appendChild(list);
  function cur() { var v = ctx.get(); return v && typeof v === "object" ? v : { c: x.def || "", n: "" }; }
  function paint() {
    var v = cur(); face.textContent = (v.c || "+—") + " ▾"; num.value = v.n || "";
    var rec = C.filter(function (r) { return "+" + r[1] === v.c; })[0];
    num.placeholder = rec ? rec[2] : "";
  }
  function show() {
    var s = q.value.trim().toLowerCase().replace(/^\+/, "");
    hits = C.filter(function (r) { return !s || r[0].toLowerCase().indexOf(s) >= 0 || r[1].indexOf(s) === 0; });
    clear(list);
    hits.slice(0, 12).forEach(function (r, i) { list.appendChild(h("div", { cls: c("ss-opt") + (i === st.i ? " " + c("act") : ""), onmousedown: function (e) { e.preventDefault(); pick(i); } }, [h("span", { text: r[0] }), h("span", { cls: c("muted"), text: "  +" + r[1] })])); });
    if (hits.length > 12) list.appendChild(h("div", { cls: c("ss-more"), text: (x.moreT || "{0} more - keep typing").replace("{0}", hits.length - 12) }));
  }
  function pick(i) { var v = cur(); ctx.set({ c: "+" + hits[i][1], n: v.n }); paint(); pop.hide(); num.focus(); }
  function open() { pop.show(); q.value = ""; st.i = 0; show(); setTimeout(function () { q.focus(); }, 0); }
  face.addEventListener("click", function () { pop.open ? pop.hide() : open(); });
  face.addEventListener("keydown", function (e) { if (e.key === "Enter" || e.key === " " || e.key === "ArrowDown") { e.preventDefault(); open(); } });
  q.addEventListener("input", function () { st.i = 0; show(); });
  q.addEventListener("keydown", function (e) { if (e.key === "Tab") { pop.hide(); return; } if (listNav(e, st, Math.min(12, hits.length), pick, function () { pop.hide(); face.focus(); })) show(); });
  num.addEventListener("input", function () { var v = cur(); num.value = num.value.replace(/[^\d\s-]/g, ""); ctx.set({ c: v.c, n: num.value }, true); });
  num.addEventListener("change", function () { var v = cur(); ctx.set({ c: v.c, n: num.value.trim() }); });
  paint();
  return { el: wrap, main: num, set: paint, focus: function () { num.focus(); } };
};
W["phone-cc"].check = function (f, v) {
  if (!v.c) return "Select a country code";
  var d = (v.n || "").replace(/\D/g, "");
  if (d.length < 6 || d.length > 12) return "Enter a valid phone number without the country code";
  return null;
};

W["addr-auto"] = function (f, ctx) {
  var x = f.x || {}, DB = CFG.db.addr;
  var wrap = h("div", { cls: c("ss"), id: f.id + "_a" });
  var a = { type: "text", id: f.id, name: f.id, cls: c("inp"), autocomplete: "off" };
  if (ctx.mode === "ph") a.placeholder = lab(f) + (f.r ? " *" : ""); else if (ctx.mode === "float") a.placeholder = " "; else a.placeholder = f.ph || x.qph || "Start typing your address";
  var inp = h("input", a);
  wrap.appendChild(inp);
  var pop = popBox(wrap), st = { i: -1 }, hits = [], timer = null;
  function show() {
    clear(pop.node);
    hits.forEach(function (r, i) { pop.node.appendChild(h("div", { cls: c("ss-opt") + (i === st.i ? " " + c("act") : ""), onmousedown: function (e) { e.preventDefault(); pick(i); } }, [h("span", { text: r[0] }), h("span", { cls: c("muted"), text: "  " + [r[1], r[2], r[3], r[4]].filter(Boolean).join(", ") })])); });
    pop.node.appendChild(h("div", { cls: c("ss-opt") + " " + c("link") + (st.i === hits.length ? " " + c("act") : ""), text: x.manualT || "Enter address manually", onmousedown: function (e) { e.preventDefault(); pop.hide(); } }));
  }
  function pick(i) {
    if (i >= hits.length) { pop.hide(); return; }
    var r = hits[i];
    inp.value = r[0]; ctx.set(r[0]);
    var R = f.refs || {};
    if (R.city) ctx.scope.push(R.city, r[1]);
    if (R.state) ctx.scope.push(R.state, r[2]);
    if (R.postal) ctx.scope.push(R.postal, r[3]);
    if (R.country) ctx.scope.push(R.country, r[4]);
    pop.hide();
  }
  inp.addEventListener("input", function () {
    ctx.set(inp.value, true);
    clearTimeout(timer);
    var s = inp.value.trim().toLowerCase();
    if (s.length < 3) { pop.hide(); return; }
    timer = setTimeout(function () {
      var toks = s.split(/[\s,]+/).filter(Boolean);
      hits = DB.filter(function (r) { var t = r.join(" ").toLowerCase(); return toks.some(function (k) { return k.length > 2 && t.indexOf(k) >= 0; }); }).slice(0, 5);
      st.i = -1; pop.show(); show();
    }, 250);
  });
  inp.addEventListener("change", function () { ctx.set(inp.value.trim()); });
  inp.addEventListener("keydown", function (e) { if (!pop.open) return; if (e.key === "Tab") { pop.hide(); return; } if (listNav(e, st, hits.length + 1, pick, function () { pop.hide(); })) show(); });
  return { el: wrap, main: inp, set: function (v) { inp.value = v || ""; }, focus: function () { inp.focus(); } };
};
W["addr-auto"].native = true; W["addr-auto"].text = true;

W.cascade = function (f, ctx) {
  var x = f.x || {}, R = CFG.db.regions;
  var el = h("div", { cls: c("trio"), id: f.id });
  function cur() { var v = ctx.get(); return v && typeof v === "object" ? v : { c: "", s: "", t: "" }; }
  function mk(id, blank, fn) { return sel(id, [], blank, fn); }
  var sc = sel(f.id + "_c", f.o.map(function (o) { return [o, o]; }), x.b1 || "Country / region", function () { ctx.set({ c: sc.value, s: "", t: "" }); load(1); });
  var slot2 = h("span"), slot3 = h("span");
  el.appendChild(sc); el.appendChild(slot2); el.appendChild(slot3);
  var s2 = null, s3 = null;
  function fill(slot, id, items, blank, val, fn, delay) {
    clear(slot);
    var node;
    if (items === null) { node = h("input", { type: "text", id: id, name: id, cls: c("inp"), placeholder: blank, onchange: function () { fn(node.value.trim()); } }); node.value = val || ""; slot.appendChild(node); return node; }
    node = sel(id, [], x.loading || "Loading…", function () { fn(node.value); });
    node.disabled = true;
    slot.appendChild(node);
    setTimeout(function () {
      clear(node);
      node.appendChild(h("option", { value: "", text: blank }));
      items.forEach(function (o) { node.appendChild(h("option", { value: o, text: o })); });
      node.disabled = false; node.value = val || "";
    }, delay);
    return node;
  }
  function load(level, instant) {
    var v = cur(), reg = R[v.c];
    if (level <= 1) {
      if (!v.c) { clear(slot2); clear(slot3); return; }
      s2 = fill(slot2, f.id + "_s", reg ? Object.keys(reg) : null, reg ? (x.b2 || "State / province") : (x.b2t || "State / province (type)"), v.s, function (val) { var q = cur(); ctx.set({ c: q.c, s: val, t: "" }); load(2); }, instant ? 0 : 450);
    }
    var cities = reg && v.s ? reg[v.s] : null;
    if (reg && !v.s) { clear(slot3); return; }
    s3 = fill(slot3, f.id + "_t", cities, cities ? (x.b3 || "City") : (x.b3t || "City (type)"), v.t, function (val) { var q = cur(); ctx.set({ c: q.c, s: q.s, t: val }); }, instant ? 0 : 450);
  }
  return { el: el, main: sc, set: function (v) { sc.value = (v && v.c) || ""; load(1, true); }, focus: function () { sc.focus(); } };
};
W.cascade.check = function (f, v) { return v.c && v.t ? null : "Complete country, state / province and city"; };

W.order = function (f, ctx) {
  var x = f.x || {};
  var el = h("div", { cls: c("order"), id: f.id });
  var adder = sel(f.id + "_add", f.o.map(function (o) { return [o, o]; }), x.blank || "Select a programme to add…", function () {});
  var addB = btn(x.addT || "Add to list", "plain", function () {
    var l = cur(); if (!adder.value || l.indexOf(adder.value) >= 0) return;
    if (x.max && l.length >= x.max) { toast((x.mMax || "You can rank at most {0} choices").replace("{0}", x.max), "bad"); return; }
    l.push(adder.value); adder.value = ""; ctx.set(l); draw();
  });
  var listNode = h("div", { cls: c("order-l") });
  el.appendChild(h("div", { cls: c("order-add") }, [adder, addB])); el.appendChild(listNode);
  function cur() { return (ctx.get() || []).slice(); }
  function move(i, d) { var l = cur(), j = i + d; if (j < 0 || j >= l.length) return; var t = l[i]; l[i] = l[j]; l[j] = t; ctx.set(l); draw(); var hs = listNode.querySelectorAll("." + c("order-h")); if (hs[j]) hs[j].focus(); }
  function draw() {
    clear(listNode);
    cur().forEach(function (v, i) {
      var handle = h("span", { cls: c("order-h"), tabindex: "0", text: "☰", title: x.dragT || "Drag to reorder" });
      var row = h("div", { cls: c("order-r") }, [handle, h("span", { cls: c("order-n"), text: (i + 1) + "." }), h("span", { cls: c("order-t"), text: v }),
        h("span", { cls: c("order-b"), text: "▲", onclick: function () { move(i, -1); } }), h("span", { cls: c("order-b"), text: "▼", onclick: function () { move(i, 1); } }),
        h("span", { cls: c("order-b"), text: "×", onclick: function () { var l = cur(); l.splice(i, 1); ctx.set(l); draw(); } })]);
      handle.addEventListener("keydown", function (e) { if (e.key === "ArrowUp") { e.preventDefault(); move(i, -1); } if (e.key === "ArrowDown") { e.preventDefault(); move(i, 1); } });
      handle.addEventListener("mousedown", function (e) {
        e.preventDefault();
        var from = i, rows = Array.prototype.slice.call(listNode.children);
        row.classList.add(c("dragging"));
        function mm(ev) {
          var over = -1;
          rows.forEach(function (r, k) { var b = r.getBoundingClientRect(); if (ev.clientY >= b.top && ev.clientY <= b.bottom) over = k; });
          rows.forEach(function (r, k) { r.classList.toggle(c("drop-t"), k === over && over !== from); });
          mm.over = over;
        }
        function mu() {
          doc.removeEventListener("mousemove", mm, true); doc.removeEventListener("mouseup", mu, true);
          var to = mm.over;
          if (to !== undefined && to >= 0 && to !== from) { var l = cur(); var it = l.splice(from, 1)[0]; l.splice(to, 0, it); ctx.set(l); }
          draw();
        }
        doc.addEventListener("mousemove", mm, true); doc.addEventListener("mouseup", mu, true);
      });
      listNode.appendChild(row);
    });
  }
  draw();
  return { el: el, main: adder, set: draw, focus: function () { adder.focus(); } };
};
W.order.check = function (f, v) { var x = f.x || {}; return x.min && v.length < x.min ? "Rank at least " + x.min + " choices" : null; };

W.sigpad = function (R) {
  var cv = h("canvas", { width: "420", height: "120", cls: c("sig") });
  var g = cv.getContext("2d"), down = false, drew = false;
  g.strokeStyle = "#123"; g.lineWidth = 2;
  function pos(e) { var r = cv.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; }
  cv.addEventListener("mousedown", function (e) { down = true; var p = pos(e); g.beginPath(); g.moveTo(p[0], p[1]); });
  cv.addEventListener("mousemove", function (e) { if (!down) return; var p = pos(e); g.lineTo(p[0], p[1]); g.stroke(); if (!drew) { drew = true; note("signature", { drawn: true }); } });
  window.addEventListener("mouseup", function () { down = false; });
  return h("div", { cls: c("fld") }, [h("div", { cls: c("lbl"), text: R.padL || "Signature (draw with your mouse or finger)" }), cv, h("span", { cls: c("link"), text: "Clear", onclick: function () { g.clearRect(0, 0, 420, 120); } })]);
};

W.lookup2 = function (f, ctx) {
  var x = f.x || {}, T = x.t || {}, DB = CFG.db.inst;
  var wrap = h("div", { cls: c("ss"), id: f.id + "_l" });
  var a = { type: "text", id: f.id, name: f.id, cls: c("inp"), autocomplete: "off" };
  if (ctx.mode === "ph") a.placeholder = lab(f) + (f.r ? " *" : ""); else if (ctx.mode === "float") a.placeholder = " "; else a.placeholder = f.ph || "";
  var inp = h("input", a);
  var hint = h("div", { cls: c("help") });
  wrap.appendChild(inp); wrap.appendChild(hint);
  var pop = popBox(wrap), st = { i: -1 }, hits = [], lim = 6, manual = false, timer = null, chosen = null;
  function rowsN() { return Math.min(lim, hits.length) + (hits.length > lim ? 1 : 0) + 1; }
  function show() {
    clear(pop.node);
    var k = 0;
    hits.slice(0, lim).forEach(function (r) { var i = k++; pop.node.appendChild(h("div", { cls: c("ss-opt") + (i === st.i ? " " + c("act") : ""), onmousedown: function (e) { e.preventDefault(); act(i); } }, [h("span", { text: r[0] }), h("span", { cls: c("muted"), text: "  " + r[1] + ", " + r[2] })])); });
    if (hits.length > lim) { var i2 = k++; pop.node.appendChild(h("div", { cls: c("ss-opt") + " " + c("link") + (i2 === st.i ? " " + c("act") : ""), text: (T.more || "Show more results ({0})").replace("{0}", hits.length - lim), onmousedown: function (e) { e.preventDefault(); act(i2); } })); }
    var i3 = k++;
    pop.node.appendChild(h("div", { cls: c("ss-opt") + " " + c("link") + (i3 === st.i ? " " + c("act") : ""), text: T.cant || "My institution is not listed", onmousedown: function (e) { e.preventDefault(); act(i3); } }));
  }
  function act(i) {
    var n = Math.min(lim, hits.length);
    if (i < n) {
      var r = hits[i]; chosen = r[0]; inp.value = r[0]; ctx.set(r[0]); hint.textContent = "";
      var R = f.refs || {}; if (R.city) ctx.scope.push(R.city, r[1]); if (R.country) ctx.scope.push(R.country, r[2]);
      pop.hide(); return;
    }
    if (hits.length > lim && i === n) { lim += 6; show(); return; }
    manual = true; pop.hide(); hint.textContent = T.manual || "Type the full official name of your institution in English."; inp.focus();
  }
  inp.addEventListener("input", function () {
    if (manual) { ctx.set(inp.value, true); return; }
    chosen = null; ctx.set("", true);
    clearTimeout(timer);
    var s = inp.value.trim().toLowerCase();
    if (s.length < 2) { pop.hide(); return; }
    timer = setTimeout(function () {
      var toks = s.split(/\s+/);
      hits = DB.filter(function (r) { var n = r[0].toLowerCase(); return toks.every(function (t) { return n.indexOf(t) >= 0; }); });
      lim = 6; st.i = -1; pop.show(); show();
    }, 300);
  });
  inp.addEventListener("blur", function () {
    setTimeout(function () {
      if (manual) { ctx.set(inp.value.trim()); return; }
      if (!chosen && inp.value) { inp.value = ""; ctx.set(""); hint.textContent = T.mustPick || "Please choose an institution from the list, or select “My institution is not listed”."; }
    }, 200);
  });
  inp.addEventListener("keydown", function (e) { if (!pop.open) return; if (e.key === "Tab") { pop.hide(); return; } if (listNav(e, st, rowsN(), act, function () { pop.hide(); })) show(); });
  return { el: wrap, main: inp, set: function (v) { inp.value = v || ""; chosen = v || null; if (v && !DB.some(function (r) { return r[0] === v; })) manual = true; }, focus: function () { inp.focus(); } };
};
W.lookup2.native = true; W.lookup2.text = true;
