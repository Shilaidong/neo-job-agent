(function () {
  var PG = window.PG;
  var KEY = PG.key;
  var mem = {};
  function rd(k) { try { var s = localStorage.getItem(k); return s ? JSON.parse(s) : null; } catch (e) { return mem[k] || null; } }
  function wr(k, v) { mem[k] = v; try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  var draft = rd(KEY) || { v: {}, at: null };
  var journal = rd(KEY + ".j") || { ev: [], pg: [] };
  var t0 = Date.now();
  function note(type, detail) { journal = rd(KEY + ".j") || journal; journal.ev.push({ type: type, detail: detail || null, at: Date.now() - t0, page: PG.id }); wr(KEY + ".j", journal); }
  if (journal.pg.indexOf(PG.id) < 0) { journal.pg.push(PG.id); wr(KEY + ".j", journal); }
  function $(id) { return document.getElementById(id); }
  function byName(n) { return document.getElementsByName(n); }
  var uploads = {};

  function elemVal(f, sfx) {
    var id = f.id + (sfx || "");
    if (f.k === "radio") { var rs = byName(id); for (var i = 0; i < rs.length; i++) if (rs[i].checked) return rs[i].value; return ""; }
    if (f.k === "check") return !!($(id) && $(id).checked);
    if (f.k === "date-3sel") { var y = $(id + "_y").value, m = $(id + "_m").value, d = $(id + "_d").value; return y && m && d ? y + "-" + m + "-" + d : y || m || d ? { partial: [y, m, d] } : ""; }
    if (f.k === "month-2sel") { var yy = $(id + "_y").value, mm = $(id + "_m").value; return yy && mm ? yy + "-" + mm : yy || mm ? { partial: [yy, mm] } : ""; }
    if (f.k === "file") return uploads[id] || "";
    var el = $(id);
    return el ? el.value.replace(/^\s+|\s+$/g, "") : "";
  }
  function setElem(f, v, sfx) {
    var id = f.id + (sfx || "");
    if (v === undefined || v === null) return;
    if (f.k === "radio") { var rs = byName(id); for (var i = 0; i < rs.length; i++) rs[i].checked = rs[i].value === v; return; }
    if (f.k === "check") { $(id).checked = !!v; return; }
    if (f.k === "date-3sel") { if (typeof v !== "string") return; var p = v.split("-"); $(id + "_y").value = p[0]; $(id + "_m").value = p[1]; $(id + "_d").value = p[2]; return; }
    if (f.k === "month-2sel") { if (typeof v !== "string") return; var q = v.split("-"); $(id + "_y").value = q[0]; $(id + "_m").value = q[1]; return; }
    if (f.k === "file") { uploads[id] = v || null; paintFile(id); return; }
    if ($(id)) $(id).value = v;
  }
  function shown(f, vals) {
    if (!f.w) return true;
    var v = vals[f.w.id];
    if (v === undefined || v === null) v = f.w.v.indexOf(false) >= 0 ? false : "";
    return f.w.v.indexOf(v) >= 0;
  }
  function collect() {
    var vals = {};
    PG.F.forEach(function (f) {
      if (f.k === "slots") {
        var rows = [];
        for (var s = 1; s <= f.n; s++) {
          var row = {}, any = false;
          f.fs.forEach(function (c) { row[c.id] = elemVal(c, "_" + s); });
          f.fs.forEach(function (c) { if (!shown(c, row)) delete row[c.id]; });
          for (var k in row) if (row[k] !== "" && row[k] !== false) any = true;
          if (any) rows.push(row);
        }
        vals[f.id] = rows;
      } else vals[f.id] = elemVal(f);
    });
    PG.F.forEach(function (f) { if (f.k !== "slots" && !shown(f, vals)) delete vals[f.id]; });
    return vals;
  }
  function applyRules() {
    var vals = {};
    PG.F.forEach(function (f) { if (f.k !== "slots") vals[f.id] = elemVal(f); });
    PG.F.forEach(function (f) {
      if (f.k === "slots") {
        for (var s = 1; s <= f.n; s++) {
          var row = {};
          f.fs.forEach(function (c) { row[c.id] = elemVal(c, "_" + s); });
          f.fs.forEach(function (c) { if (c.w) { var r = $("row_" + c.id + "_" + s); if (r) r.style.display = shown(c, row) ? "" : "none"; } });
        }
      } else if (f.w) { var r2 = $("row_" + f.id); if (r2) r2.style.display = shown(f, vals) ? "" : "none"; }
    });
  }
  function save() {
    draft = rd(KEY) || draft;
    PG.F.forEach(function (f) { delete draft.v[f.id]; });
    var vals = collect();
    for (var k in vals) draft.v[k] = vals[k];
    draft.at = new Date().toISOString();
    wr(KEY, draft);
    return vals;
  }
  function parseFmt(v, fmt) {
    var re = fmt.replace("DD", "(\\d{2})").replace("MM", "(\\d{2})").replace("YYYY", "(\\d{4})");
    var m = new RegExp("^" + re + "$").exec(v);
    if (!m) return null;
    var order = fmt.replace(/[^DMY]/g, "").replace(/D+/, "D").replace(/M+/, "M").replace(/Y+/, "Y");
    var parts = {}; for (var i = 0; i < 3; i++) parts[order.charAt(i)] = m[i + 1];
    var dt = new Date(Date.UTC(+parts.Y, +parts.M - 1, +parts.D));
    if (dt.getUTCMonth() !== +parts.M - 1 || dt.getUTCDate() !== +parts.D) return null;
    return parts.Y + "-" + parts.M + "-" + parts.D;
  }
  function problem(f, v) {
    var empty = v === "" || v === false || v === undefined || v === null;
    if (empty) return f.r ? "is required" : null;
    var x = f.x || {};
    if (typeof v === "object" && v.partial) return "is incomplete";
    if (f.k === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v)) return "is not a valid e-mail address";
    if (f.k === "date-mask") { var iso = parseFmt(v, f.fmt); if (!iso) return "must be a valid date in the format " + f.fmt; v = iso; }
    if (f.k === "month-mask" && !/^(0[1-9]|1[0-2])\/(19|20)\d\d$/.test(v)) return "must be in the format MM/YYYY";
    if (f.k === "date-3sel") { var p = v.split("-"); var d2 = new Date(Date.UTC(+p[0], +p[1] - 1, +p[2])); if (d2.getUTCDate() !== +p[2]) return "is not a valid calendar date"; }
    if ((f.k === "date-mask" || f.k === "date-3sel") && x.minD && v < x.minD) return "must not be earlier than " + x.minD;
    if ((f.k === "date-mask" || f.k === "date-3sel") && x.maxD && v > x.maxD) return "must not be later than " + x.maxD;
    if (x.re && !(new RegExp(x.re)).test(v)) return x.reMsg ? "- " + x.reMsg : "has an invalid format";
    if (x.num) { var n = Number(v); if (isNaN(n) || n < x.num[0] || n > x.num[1]) return "must be between " + x.num[0] + " and " + x.num[1]; }
    return null;
  }
  function validate(vals) {
    var errs = [];
    PG.F.forEach(function (f) {
      if (f.k === "slots") {
        var rows = vals[f.id] || [];
        if (f.min && rows.length < f.min) errs.push({ row: "row_" + f.fs[0].id + "_1", msg: f.l + ": at least " + f.min + " entry is required" });
        for (var s = 1; s <= f.n; s++) {
          var row = {}, any = false;
          f.fs.forEach(function (c) { row[c.id] = elemVal(c, "_" + s); if (row[c.id] !== "" && row[c.id] !== false) any = true; });
          if (!any) continue;
          f.fs.forEach(function (c) { if (!shown(c, row)) return; var m = problem(c, row[c.id]); if (m) errs.push({ row: "row_" + c.id + "_" + s, msg: f.il + " " + s + " - " + c.l + " " + m }); });
        }
      } else if (f.id in vals) { var m2 = problem(f, vals[f.id]); if (m2) errs.push({ row: "row_" + f.id, msg: f.l + " " + m2 }); }
    });
    return errs;
  }
  function showErrors(errs) {
    var box = $("errbox");
    box.innerHTML = "";
    var marked = document.querySelectorAll(".rowerr");
    for (var i = 0; i < marked.length; i++) marked[i].className = marked[i].className.replace(/\s*rowerr/, "");
    if (!errs.length) { box.style.display = "none"; return; }
    var b = document.createElement("b"); b.appendChild(document.createTextNode("The following errors were found (" + errs.length + "):")); box.appendChild(b);
    var ul = document.createElement("ul");
    errs.forEach(function (e) {
      var li = document.createElement("li"), a = document.createElement("a");
      a.href = "#" + e.row; a.appendChild(document.createTextNode(e.msg));
      a.onclick = function () { var r = $(e.row); if (r) { var t = r.querySelector("input,select,textarea"); if (t) setTimeout(function () { t.focus(); }, 0); } };
      li.appendChild(a); ul.appendChild(li);
      var r = $(e.row); if (r) r.className += " rowerr";
    });
    box.appendChild(ul);
    box.style.display = "block";
    window.scrollTo(0, 0);
  }
  function paintFile(id) {
    var st = $(id + "_st"); if (!st) return;
    st.innerHTML = "";
    var u = uploads[id];
    if (!u) { st.appendChild(document.createTextNode("No file uploaded.")); return; }
    st.appendChild(document.createTextNode("Uploaded: " + u.name + " (" + Math.ceil(u.size / 1024) + " KB) "));
    var a = document.createElement("a"); a.href = "javascript:void(0)"; a.appendChild(document.createTextNode("[Remove]"));
    a.onclick = function () { if (window.confirm("Remove the uploaded file " + u.name + "?")) { uploads[id] = null; paintFile(id); } };
    st.appendChild(a);
  }
  function mask(el, pattern) {
    el.addEventListener("input", function () {
      var d = el.value.replace(/\D/g, ""), out = "", di = 0;
      for (var i = 0; i < pattern.length && di < d.length; i++) out += pattern.charAt(i) === "#" ? d.charAt(di++) : pattern.charAt(i);
      el.value = out;
    });
  }

  window.__pg = {
    init: function () {
      PG.F.forEach(function (f) {
        if (f.k === "slots") {
          var rows = draft.v[f.id] || [];
          for (var s = 1; s <= f.n; s++) f.fs.forEach(function (c) { if (rows[s - 1]) setElem(c, rows[s - 1][c.id], "_" + s); if (c.k === "month-mask") mask($(c.id + "_" + s), "##/####"); if (c.k === "date-mask") mask($(c.id + "_" + s), c.fmt.replace(/[DMY]/g, "#")); });
        } else {
          setElem(f, draft.v[f.id]);
          if (f.k === "date-mask") mask($(f.id), f.fmt.replace(/[DMY]/g, "#"));
          if (f.k === "month-mask") mask($(f.id), "##/####");
          if (f.k === "file") paintFile(f.id);
          if (f.x && f.x.upper) $(f.id).addEventListener("input", function () { this.value = this.value.toUpperCase(); });
          if (f.x && f.x.count) { var el = $(f.id), cn = $(f.id + "_cnt"); var up = function () { cn.innerHTML = String(f.x.max - el.value.length); }; el.addEventListener("input", up); up(); }
        }
      });
      document.forms[0].addEventListener("change", applyRules);
      document.forms[0].addEventListener("click", function (e) { if (e.target && e.target.type === "radio") applyRules(); });
      applyRules();
    },
    upload: function (id) {
      var inp = $(id), msg = $(id + "_msg"), fdef = null;
      PG.F.forEach(function (f) { if (f.id === id) fdef = f; });
      msg.innerHTML = "";
      if (!inp.files || !inp.files.length) { msg.innerHTML = "Please choose a file first, then press Upload."; return; }
      var file = inp.files[0], x = fdef.x || {};
      var ext = (/\.([A-Za-z0-9]+)$/.exec(file.name) || [0, ""])[1].toLowerCase();
      if (x.types && x.types.indexOf(ext) < 0) { msg.innerHTML = "Invalid file type. Allowed: " + x.types.join(", ").toUpperCase(); return; }
      if (x.maxKB && file.size > x.maxKB * 1024) { msg.innerHTML = "File exceeds the maximum size of " + x.maxKB + " KB."; return; }
      if (x.maxName && file.name.length > x.maxName) { msg.innerHTML = "File name too long (max " + x.maxName + " characters)."; return; }
      uploads[id] = { name: file.name, size: file.size, type: file.type };
      inp.value = "";
      paintFile(id);
    },
    save: function () { save(); var m = $("savemsg"); m.innerHTML = "Your data has been saved at " + new Date().toLocaleTimeString() + "."; m.style.display = "block"; showErrors([]); },
    next: function () {
      var vals = save(), errs = validate(vals);
      if (errs.length) { if (PG.alert) window.alert("Please correct the errors listed at the top of the page."); showErrors(errs); return; }
      location.href = PG.next;
    },
    event: note,
    draft: function () { return rd(KEY) || draft; }
  };

  Object.defineProperty(window, "__bench_state", {
    enumerable: false,
    value: function () {
      var d = rd(KEY) || { v: {}, at: null };
      var live = {}, k;
      for (k in d.v) live[k] = d.v[k];
      var dirty = false;
      if (PG.F.length) {
        PG.F.forEach(function (f) { delete live[f.id]; });
        var cur = collect();
        for (k in cur) { live[k] = cur[k]; }
        PG.F.forEach(function (f) { if (JSON.stringify(normal(cur[f.id])) !== JSON.stringify(normal(d.v[f.id]))) dirty = true; });
      }
      var j = rd(KEY + ".j") || journal;
      return JSON.parse(JSON.stringify({ instance: PG.inst, page: PG.id, pages: j.pg, fields: live, saved: d.at ? d.v : null, savedAt: d.at, dirty: dirty, events: j.ev }));
    }
  });
  function normal(v) { return v === undefined || v === null || v === false || (v && v.length === 0) ? "" : v; }
})();
