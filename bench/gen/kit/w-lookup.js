W.lookup = function (f, ctx) {
  var x = f.x || {};
  var T = x.t || {};
  var DB = CFG.db[x.db || "inst"];
  var disp = h("input", { type: "text", id: f.id, name: f.id, cls: c("inp"), readonly: true, placeholder: f.ph || "" });
  var findB = btn(T.find || "Find institution", "plain", open);
  var clr = h("span", { cls: c("link"), text: T.clear || "Clear", onclick: function () { ctx.set(""); disp.value = ""; } });
  var el = h("div", { cls: c("lookup") }, [disp, findB, clr]);
  disp.addEventListener("click", open);
  disp.addEventListener("keydown", function (e) { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); open(); } });
  function choose(rec) {
    ctx.set(rec[0]);
    disp.value = rec[0];
    if (f.refs) {
      if (f.refs.city && rec[1]) ctx.scope.push(f.refs.city, rec[1]);
      if (f.refs.country && rec[2]) ctx.scope.push(f.refs.country, rec[2]);
    }
  }
  function open() {
    var m = openModal({ title: T.title || "Find your institution", cls: c("wide-modal") });
    var q = h("input", { type: "text", cls: c("inp"), id: f.id + "_q", placeholder: T.qph || "Institution name or part of it" });
    var cs = ["", ].concat(DB.map(function (r) { return r[2]; }).filter(function (v, i, a) { return a.indexOf(v) === i; }).sort());
    var country = h("select", { cls: c("inp"), id: f.id + "_qc" }, cs.map(function (v) { return h("option", { value: v, text: v || (T.any || "Any country / region") }); }));
    var out = h("div", { cls: c("lk-out") });
    var page = 0, hits = [], per = x.per || 5;
    function run() {
      var s = q.value.trim().toLowerCase();
      clear(out);
      if (s.length < 3) { out.appendChild(h("div", { cls: c("err"), text: T.short || "Enter at least 3 characters to search." })); return; }
      out.appendChild(h("div", { cls: c("muted"), text: T.wait || "Searching…" }));
      setTimeout(function () {
        var toks = s.split(/\s+/);
        hits = DB.filter(function (r) { var n = r[0].toLowerCase(); return (!country.value || r[2] === country.value) && toks.every(function (t) { return n.indexOf(t) >= 0; }); });
        page = 0; show();
      }, 350);
    }
    function show() {
      clear(out);
      if (!hits.length) { out.appendChild(h("div", { cls: c("muted"), text: T.none || "No institutions match your search." })); return; }
      var tbl = h("table", { cls: c("rep-t") }, [h("tr", null, [h("th", { text: T.cName || "Institution" }), h("th", { text: T.cCity || "City" }), h("th", { text: T.cCountry || "Country / region" }), h("th", { text: T.cCode || "Code" }), h("th")])]);
      hits.slice(page * per, page * per + per).forEach(function (r) {
        tbl.appendChild(h("tr", null, [h("td", { text: r[0] }), h("td", { text: r[1] }), h("td", { text: r[2] }), h("td", { text: r[3] }), h("td", null, h("a", { href: "javascript:void(0)", text: T.pick || "Select", onclick: function () { choose(r); closeModal(m); } }))]));
      });
      out.appendChild(tbl);
      var pages = Math.ceil(hits.length / per);
      var pg = h("div", { cls: c("pager") });
      var prev = btn("‹ " + (T.prev || "Previous"), "plain", function () { page--; show(); }); prev.disabled = page === 0;
      var next = btn((T.next || "Next") + " ›", "plain", function () { page++; show(); }); next.disabled = page >= pages - 1;
      pg.appendChild(prev); pg.appendChild(h("span", { text: " " + (T.pageOf || "Page {0} of {1}").replace("{0}", page + 1).replace("{1}", pages) + " (" + hits.length + ") " })); pg.appendChild(next);
      out.appendChild(pg);
    }
    q.addEventListener("keydown", function (e) { if (e.key === "Enter") { e.preventDefault(); run(); } });
    m.body.appendChild(h("div", { cls: c("lk-bar") }, [h("label", { "for": q.id, cls: c("lbl"), text: T.q || "Search" }), q, country, btn(T.go || "Search", "primary", run)]));
    m.body.appendChild(out);
    var manual = h("div", { cls: c("lk-manual"), style: "display:none" });
    var mn = h("input", { type: "text", cls: c("inp"), id: f.id + "_mn" }), mc = h("input", { type: "text", cls: c("inp"), id: f.id + "_mc" });
    var mk = h("select", { cls: c("inp"), id: f.id + "_mk" }, [h("option", { value: "", text: "" })].concat((x.countries || []).map(function (v) { return h("option", { value: v, text: v }); })));
    var merr = h("div", { cls: c("err") });
    manual.appendChild(h("div", { cls: c("grid") }, [
      h("div", { cls: c("fld") }, [h("label", { cls: c("lbl"), "for": mn.id, text: T.mName || "Institution name (in English)" }), mn]),
      h("div", { cls: c("fld") }, [h("label", { cls: c("lbl"), "for": mc.id, text: T.mCity || "City" }), mc]),
      h("div", { cls: c("fld") }, [h("label", { cls: c("lbl"), "for": mk.id, text: T.mCountry || "Country / region" }), mk])
    ]));
    manual.appendChild(merr);
    manual.appendChild(btn(T.mUse || "Use this institution", "primary", function () {
      if (!mn.value.trim() || !mk.value) { merr.textContent = T.mNeed || "Enter the institution name and select its country / region."; return; }
      choose([mn.value.trim(), mc.value.trim(), mk.value, ""]); closeModal(m);
    }));
    m.body.appendChild(h("div", { cls: c("lk-cant") }, [h("span", { cls: c("link"), tabindex: "0", text: T.cant || "I can't find my institution", onclick: function () { manual.style.display = manual.style.display === "none" ? "" : "none"; if (manual.style.display === "") mn.focus(); }, onkeydown: function (e) { if (e.key === "Enter") this.click(); } })]));
    m.body.appendChild(manual);
    m.foot.appendChild(btn(TX.cancel || "Cancel", "plain", function () { closeModal(m); }));
  }
  return { el: el, main: disp, set: function (v) { disp.value = v || ""; }, focus: function () { findB.focus(); } };
};
