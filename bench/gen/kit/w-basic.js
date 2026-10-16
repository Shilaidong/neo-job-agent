function applyMask(mask, raw) {
  var digits = raw.replace(/\D/g, ""), out = "", di = 0;
  for (var i = 0; i < mask.length && di < digits.length; i++) {
    if (mask[i] === "#") out += digits[di++];
    else out += mask[i];
  }
  return out;
}
function textLike(tag, type) {
  var fn = function (f, ctx) {
    var x = f.x || {};
    var a = { id: f.id, name: f.id, cls: c("inp"), autocomplete: "off" };
    if (tag === "input") a.type = type;
    if (x.max) a.maxlength = String(x.max);
    if (x.rows) a.rows = String(x.rows);
    if (ctx.mode === "ph") a.placeholder = lab(f) + (f.r ? " *" : "");
    else if (ctx.mode === "float") a.placeholder = " ";
    else if (f.ph) a.placeholder = f.ph;
    var inp = h(tag, a);
    if (ctx.mode === "float" && f.ph) {
      inp.addEventListener("focus", function () { inp.placeholder = f.ph; });
      inp.addEventListener("blur", function () { inp.placeholder = " "; });
    }
    inp.addEventListener("input", function () {
      var v = inp.value;
      if (x.mask) { v = applyMask(x.mask, v); inp.value = v; }
      if (x.upper) { v = v.toUpperCase(); inp.value = v; }
      ctx.set(v, true);
    });
    inp.addEventListener("change", function () {
      if (x.trim !== false) inp.value = inp.value.trim();
      ctx.set(inp.value);
    });
    var el = inp;
    if (x.count) {
      var cnt = h("div", { cls: c("count") });
      var upd = function () { cnt.textContent = inp.value.length + " / " + x.max; };
      inp.addEventListener("input", upd);
      el = h("div", null, [inp, cnt]);
      setTimeout(upd, 0);
    }
    return { el: el, main: inp, set: function (v) { inp.value = v || ""; }, focus: function () { inp.focus(); } };
  };
  fn.native = true; fn.text = true;
  return fn;
}
W.text = textLike("input", "text");
W.email = textLike("input", "text");
W.textarea = textLike("textarea");
W.phone = textLike("input", "tel");
W["date-mask"] = function (f, ctx) {
  var fmt = f.fmt || "DD/MM/YYYY";
  var g = { f: f };
  f = Object.create(f);
  f.x = Object.assign({}, g.f.x || {}, { mask: fmt.replace(/[DMY]/g, "#") });
  if (!g.f.ph && ctx.mode !== "ph") f.ph = fmt;
  return W.text(f, ctx);
};
W["date-mask"].native = true; W["date-mask"].text = true;
W["date-mask"].check = function (f, v) {
  var fmt = f.fmt || "DD/MM/YYYY";
  var iso = parseFmt(v, fmt);
  if (!iso) return (TX.badDate || "Enter a valid date in the format {0}").replace("{0}", fmt);
  return rangeMsg(f, iso);
};
W["month-mask"] = function (f, ctx) {
  var g = f; f = Object.create(f);
  f.x = Object.assign({}, g.x || {}, { mask: "##/####" });
  if (ctx.mode !== "ph") f.ph = "MM/YYYY";
  return W.text(f, ctx);
};
W["month-mask"].native = true; W["month-mask"].text = true;
W["month-mask"].check = function (f, v) { return /^(0[1-9]|1[0-2])\/(19|20)\d\d$/.test(v) ? null : "Enter month and year as MM/YYYY"; };
function parseFmt(v, fmt) {
  var re = fmt.replace("DD", "(?<d>\\d{2})").replace("MM", "(?<m>\\d{2})").replace("YYYY", "(?<y>\\d{4})");
  var m = new RegExp("^" + re + "$").exec(v);
  if (!m) return null;
  var y = +m.groups.y, mo = +m.groups.m, d = +m.groups.d;
  var dt = new Date(Date.UTC(y, mo - 1, d));
  if (dt.getUTCFullYear() !== y || dt.getUTCMonth() !== mo - 1 || dt.getUTCDate() !== d) return null;
  return m.groups.y + "-" + m.groups.m + "-" + m.groups.d;
}
function rangeMsg(f, iso) {
  var x = f.x || {};
  if (x.minD && iso < x.minD) return (TX.tooEarly || "Date must be on or after {0}").replace("{0}", x.minD);
  if (x.maxD && iso > x.maxD) return (TX.tooLate || "Date must be on or before {0}").replace("{0}", x.maxD);
  return null;
}
W["date-native"] = function (f, ctx) {
  var x = f.x || {};
  var inp = h("input", { type: "date", id: f.id, name: f.id, cls: c("inp"), min: x.minD, max: x.maxD, onchange: function () { ctx.set(inp.value); }, oninput: function () { ctx.set(inp.value, true); } });
  return { el: inp, main: inp, set: function (v) { inp.value = v || ""; }, focus: function () { inp.focus(); } };
};
W["date-native"].native = true;
W["date-native"].check = function (f, v) { return rangeMsg(f, v); };
var MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
function sel(id, opts, blank, fn) {
  var s = h("select", { id: id, name: id, cls: c("inp"), onchange: fn });
  s.appendChild(h("option", { value: "", text: blank }));
  opts.forEach(function (o) { s.appendChild(h("option", { value: o[0], text: o[1] })); });
  return s;
}
function pad2(n) { return (n < 10 ? "0" : "") + n; }
function years(x, span) {
  var now = 2026, from = (x && x.yFrom) || now - (span || 80), to = (x && x.yTo) || now + 12, out = [];
  for (var y = to; y >= from; y--) out.push([String(y), String(y)]);
  return out;
}
W["date-3sel"] = function (f, ctx) {
  var x = f.x || {};
  var days = []; for (var i = 1; i <= 31; i++) days.push([pad2(i), String(i)]);
  var mons = MONTHS.map(function (m, i) { return [pad2(i + 1), x.monNum ? pad2(i + 1) : m.slice(0, 3)]; });
  function upd() { ctx.set(y.value && m.value && d.value ? y.value + "-" + m.value + "-" + d.value : y.value || m.value || d.value ? { partial: [y.value, m.value, d.value] } : ""); }
  var d = sel(f.id + "_d", days, "Day", upd), m = sel(f.id + "_m", mons, "Month", upd), y = sel(f.id + "_y", years(x), "Year", upd);
  var order = x.mdy ? [m, d, y] : [d, m, y];
  var el = h("div", { cls: c("trio"), id: f.id }, order);
  return { el: el, main: order[0], set: function (v) { var p = typeof v === "string" ? v.split("-") : ["", "", ""]; y.value = p[0] || ""; m.value = p[1] || ""; d.value = p[2] || ""; }, focus: function () { order[0].focus(); } };
};
W["date-3sel"].check = function (f, v) {
  if (typeof v !== "string") return TX.badDate3 || "Select day, month and year";
  var p = v.split("-"), dt = new Date(Date.UTC(+p[0], +p[1] - 1, +p[2]));
  if (dt.getUTCDate() !== +p[2]) return TX.noSuchDate || "This date does not exist";
  return rangeMsg(f, v);
};
W["month-2sel"] = function (f, ctx) {
  var x = f.x || {};
  var mons = MONTHS.map(function (m, i) { return [pad2(i + 1), m]; });
  function upd() { ctx.set(y.value && m.value ? y.value + "-" + m.value : y.value || m.value ? { partial: [y.value, m.value] } : ""); }
  var m = sel(f.id + "_m", mons, "Month", upd), y = sel(f.id + "_y", years(x, 40), "Year", upd);
  var el = h("div", { cls: c("trio"), id: f.id }, [m, y]);
  return { el: el, main: m, set: function (v) { var p = typeof v === "string" ? v.split("-") : ["", ""]; y.value = p[0] || ""; m.value = p[1] || ""; }, focus: function () { m.focus(); } };
};
W["month-2sel"].check = function (f, v) { return typeof v === "string" ? null : "Select both month and year"; };
W.select = function (f, ctx) {
  var s = sel(f.id, f.o.map(function (o) { return [o, o]; }), (f.x && f.x.blank) || "-- Please select --", function () { ctx.set(s.value); });
  return { el: s, main: s, set: function (v) { s.value = v || ""; }, focus: function () { s.focus(); } };
};
W.select.native = true;
W.radio = function (f, ctx) {
  var inputs = [];
  var el = h("div", { cls: c("radios"), id: f.id });
  if (UI.aria) el.setAttribute("role", "radiogroup");
  f.o.forEach(function (o, i) {
    var id = f.id + "_" + i;
    var r = h("input", { type: "radio", name: f.id, id: id, value: o, onchange: function () { if (r.checked) ctx.set(o); } });
    inputs.push(r);
    el.appendChild(h("span", { cls: c("radio") }, [r, h("label", { "for": id, text: " " + o })]));
  });
  return { el: el, main: el, set: function (v) { inputs.forEach(function (r) { r.checked = r.value === v; }); }, focus: function () { inputs[0].focus(); } };
};
W.check = function (f, ctx) {
  var cb = h("input", { type: "checkbox", id: f.id, name: f.id, onchange: function () { ctx.set(cb.checked); } });
  return { el: cb, main: cb, set: function (v) { cb.checked = !!v; }, focus: function () { cb.focus(); } };
};
W.check.native = true;
W.checks = function (f, ctx) {
  var boxes = [];
  var el = h("div", { cls: c("radios"), id: f.id });
  function upd() { ctx.set(boxes.filter(function (b) { return b.checked; }).map(function (b) { return b.value; })); }
  f.o.forEach(function (o, i) {
    var id = f.id + "_" + i;
    var b = h("input", { type: "checkbox", name: f.id, id: id, value: o, onchange: upd });
    boxes.push(b);
    el.appendChild(h("span", { cls: c("radio") }, [b, h("label", { "for": id, text: " " + o })]));
  });
  return { el: el, main: el, set: function (v) { boxes.forEach(function (b) { b.checked = (v || []).indexOf(b.value) >= 0; }); }, focus: function () { boxes[0].focus(); } };
};
