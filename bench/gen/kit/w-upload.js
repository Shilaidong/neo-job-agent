function fileProblem(file, x) {
  var ext = (/\.([A-Za-z0-9]+)$/.exec(file.name) || [, ""])[1].toLowerCase();
  if (x.types && x.types.indexOf(ext) < 0) return (x.mType || "File type not allowed. Accepted: {0}").replace("{0}", x.types.join(", ").toUpperCase());
  if (x.maxKB && file.size > x.maxKB * 1024) return (x.mSize || "File is too large (maximum {0} KB)").replace("{0}", x.maxKB);
  if (x.asciiName && /[^\x20-\x7e]/.test(file.name)) return x.mAscii || "File name may only contain English letters, numbers, spaces, hyphens and underscores.";
  if (x.maxName && file.name.length > x.maxName) return (x.mName || "File name is too long (maximum {0} characters including extension).").replace("{0}", x.maxName);
  return null;
}
function kb(n) { return n < 1024 ? n + " B" : Math.round(n / 102.4) / 10 + " KB"; }
function picker(id, accept, multiple, fn) {
  var inp = h("input", { type: "file", id: id, name: id, cls: c("file-raw"), accept: accept, multiple: multiple, onchange: function () { var fs = Array.prototype.slice.call(inp.files); inp.value = ""; if (fs.length) fn(fs); } });
  return inp;
}
W.file = function (f, ctx) {
  var x = f.x || {};
  var err = h("div", { cls: c("err") }), info = h("div", { cls: c("file-info") });
  var inp = picker(f.id, x.accept, false, function (fs) {
    var p = fileProblem(fs[0], x);
    err.textContent = p || "";
    if (p) return;
    ctx.set({ name: fs[0].name, size: fs[0].size, type: fs[0].type });
    draw();
  });
  var trigger = x.plainTrigger ? h("span", { cls: c("link"), text: x.chooseT || "Choose file", onclick: function () { inp.click(); } }) : h("label", { cls: c("btn") + " " + c("btn-plain"), "for": f.id, text: x.chooseT || "Choose file", tabindex: "0", onkeydown: function (e) { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); inp.click(); } } });
  function draw() {
    clear(info);
    var v = ctx.get();
    if (v && v.name) {
      info.appendChild(h("span", { text: v.name + " (" + kb(v.size) + ") " }));
      info.appendChild(h("span", { cls: c("link"), text: x.removeT || "Remove", tabindex: "0", onclick: function () { ctx.set(""); draw(); } }));
    } else info.appendChild(h("span", { cls: c("muted"), text: x.noneT || "No file chosen" }));
  }
  draw();
  return { el: h("div", { cls: c("file") }, [inp, trigger, info, err]), main: inp, set: draw, focus: function () { trigger.focus(); } };
};
W.files = function (f, ctx) {
  var x = f.x || {};
  var err = h("div", { cls: c("err") }), listNode = h("div");
  function list() { return (ctx.get() || []).slice(); }
  function addFiles(fs) {
    var l = list(), problems = [];
    fs.forEach(function (file) {
      var p = fileProblem(file, x);
      if (!p && x.maxFiles && l.length >= x.maxFiles) p = (x.mCount || "You can upload at most {0} files.").replace("{0}", x.maxFiles);
      if (!p && l.some(function (q) { return q.name === file.name; })) p = x.mDup || "A file with this name has already been added.";
      if (p) problems.push(file.name + ": " + p); else l.push({ name: file.name, size: file.size, type: file.type, docType: "" });
    });
    err.textContent = problems.join(" ");
    ctx.set(l); draw();
  }
  var inp = picker(f.id, x.accept, true, addFiles);
  var drop = h("div", { cls: c("drop"), tabindex: "0", onclick: function () { inp.click(); }, onkeydown: function (e) { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); inp.click(); } } }, [h("span", { text: x.dropT || "Drag files here or " }), h("span", { cls: c("link"), text: x.browseT || "browse" })]);
  drop.addEventListener("dragover", function (e) { e.preventDefault(); drop.classList.add(c("on")); });
  drop.addEventListener("dragleave", function () { drop.classList.remove(c("on")); });
  drop.addEventListener("drop", function (e) { e.preventDefault(); drop.classList.remove(c("on")); var fs = Array.prototype.slice.call(e.dataTransfer.files); if (fs.length) addFiles(fs); });
  function draw() {
    clear(listNode);
    var l = list();
    if (!l.length) return;
    var tbl = h("table", { cls: c("rep-t") }, [h("tr", null, [h("th", { text: x.cFile || "File" }), h("th", { text: x.cSize || "Size" }), h("th", { text: x.cType || "Document type" }), h("th")])]);
    l.forEach(function (q, i) {
      var s = h("select", { cls: c("inp"), id: f.id + "_t" + i, onchange: function () { var l2 = list(); l2[i] = Object.assign({}, l2[i], { docType: s.value }); ctx.set(l2, true); } }, [h("option", { value: "", text: x.typeBlank || "Select type…" })].concat((x.docTypes || []).map(function (t) { return h("option", { value: t, text: t }); })));
      s.value = q.docType || "";
      tbl.appendChild(h("tr", null, [h("td", { text: q.name }), h("td", { text: kb(q.size) }), h("td", null, s), h("td", null, h("span", { cls: c("link"), tabindex: "0", text: x.removeT || "Remove", onclick: function () { var l2 = list(); l2.splice(i, 1); ctx.set(l2); draw(); } }))]));
    });
    listNode.appendChild(tbl);
  }
  draw();
  return { el: h("div", { cls: c("files"), id: f.id + "_box" }, [inp, drop, err, listNode]), main: drop, set: draw, focus: function () { drop.focus(); } };
};
W.files.check = function (f, v) {
  if (v.some(function (q) { return !q.docType; })) return (f.x && f.x.mNeedType) || "Select a document type for every file.";
  return null;
};
W.photo = function (f, ctx) {
  var x = f.x || {}, T = x.t || {};
  var thumb = h("div", { cls: c("ph-thumb") });
  var acts = h("div", { cls: c("ph-acts") });
  var el = h("div", { cls: c("photo"), id: f.id }, [thumb, acts]);
  var dataUrl = null;
  function draw() {
    clear(thumb); clear(acts);
    var v = ctx.get();
    if (v && v.saved) {
      if (dataUrl) thumb.appendChild(h("img", { src: dataUrl, alt: "" })); else thumb.appendChild(h("div", { cls: c("ph-ok"), text: v.name }));
      acts.appendChild(h("span", { cls: c("link"), text: T.change || "Change", onclick: open }));
      acts.appendChild(doc.createTextNode("  "));
      acts.appendChild(h("span", { cls: c("link"), text: T.remove || "Remove", onclick: function () { dataUrl = null; ctx.set(""); draw(); } }));
    } else {
      thumb.appendChild(h("div", { cls: c("ph-none"), text: T.none || "No photo" }));
      acts.appendChild(btn(T.upload || "Upload photo", "plain", open));
    }
  }
  function open() {
    var m = openModal({ title: T.title || "Upload photo", cls: c("wide-modal") });
    var file = null, img = null, crop = { x: 0.1, y: 0.05, s: 0.8 }, zoom = 1, out = null;
    var steps = [T.s1 || "1. Choose file", T.s2 || "2. Crop", T.s3 || "3. Save"];
    var stepBar = h("div", { cls: c("steps") });
    var pane = h("div");
    m.body.appendChild(stepBar); m.body.appendChild(pane);
    function setStep(n) {
      clear(stepBar);
      steps.forEach(function (s, i) { stepBar.appendChild(h("span", { cls: c("step") + (i === n ? " " + c("on") : ""), text: s })); });
      clear(pane); clear(m.foot);
      [step0, step1, step2][n]();
    }
    function step0() {
      var err = h("div", { cls: c("err") });
      var inp = picker(f.id + "_file", "image/*", false, function (fs) {
        var p = fileProblem(fs[0], x);
        if (p) { err.textContent = p; return; }
        var url = URL.createObjectURL(fs[0]);
        var im = new Image();
        im.onload = function () {
          if (x.minPx && (im.naturalWidth < x.minPx || im.naturalHeight < x.minPx)) { err.textContent = (T.small || "Image is too small (minimum {0} x {0} pixels).").replace(/\{0\}/g, x.minPx); return; }
          file = fs[0]; img = im; setStep(1);
        };
        im.onerror = function () { err.textContent = T.badImg || "This file could not be read as an image."; };
        im.src = url;
      });
      pane.appendChild(h("p", { text: x.rules || "" }));
      pane.appendChild(inp);
      pane.appendChild(h("div", { cls: c("drop") }, [h("span", { text: (T.pick1 || "Select an image from your computer: ") }), h("span", { cls: c("link"), tabindex: "0", text: T.browse || "Browse", onclick: function () { inp.click(); }, onkeydown: function (e) { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); inp.click(); } } })]));
      pane.appendChild(err);
      m.foot.appendChild(btn(TX.cancel || "Cancel", "plain", function () { closeModal(m); }));
    }
    function step1() {
      var S = 300;
      var cv = h("canvas", { width: String(S), height: String(S), cls: c("crop-cv"), tabindex: "0" });
      var g = cv.getContext("2d");
      function paint() {
        g.fillStyle = "#222"; g.fillRect(0, 0, S, S);
        var base = Math.min(S / img.naturalWidth, S / img.naturalHeight) * zoom;
        var w = img.naturalWidth * base, hh = img.naturalHeight * base;
        g.drawImage(img, (S - w) / 2, (S - hh) / 2, w, hh);
        g.fillStyle = "rgba(0,0,0,.55)";
        var cx = crop.x * S, cy = crop.y * S, cs = crop.s * S;
        g.fillRect(0, 0, S, cy); g.fillRect(0, cy + cs, S, S - cy - cs); g.fillRect(0, cy, cx, cs); g.fillRect(cx + cs, cy, S - cx - cs, cs);
        g.strokeStyle = "#fff"; g.lineWidth = 2; g.strokeRect(cx, cy, cs, cs);
      }
      var drag = null;
      cv.addEventListener("mousedown", function (e) { var r = cv.getBoundingClientRect(); drag = { mx: e.clientX - r.left, my: e.clientY - r.top, x: crop.x, y: crop.y }; });
      window.addEventListener("mousemove", function (e) {
        if (!drag || !cv.isConnected) return;
        var r = cv.getBoundingClientRect();
        crop.x = Math.max(0, Math.min(1 - crop.s, drag.x + (e.clientX - r.left - drag.mx) / S));
        crop.y = Math.max(0, Math.min(1 - crop.s, drag.y + (e.clientY - r.top - drag.my) / S));
        paint();
      });
      window.addEventListener("mouseup", function () { drag = null; });
      cv.addEventListener("keydown", function (e) {
        var d = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] }[e.key];
        if (!d) return;
        e.preventDefault();
        crop.x = Math.max(0, Math.min(1 - crop.s, crop.x + d[0] * 0.02));
        crop.y = Math.max(0, Math.min(1 - crop.s, crop.y + d[1] * 0.02));
        paint();
      });
      var zr = h("input", { type: "range", min: "1", max: "3", step: "0.1", value: String(zoom), id: f.id + "_zoom", oninput: function () { zoom = +zr.value; paint(); } });
      pane.appendChild(h("p", { text: T.cropHelp || "Drag the square to frame your face. Use the slider to zoom." }));
      pane.appendChild(cv);
      pane.appendChild(h("div", { cls: c("fld") }, [h("label", { "for": zr.id, cls: c("lbl"), text: T.zoom || "Zoom" }), zr]));
      paint();
      m.foot.appendChild(btn(T.back || "Back", "plain", function () { setStep(0); }));
      m.foot.appendChild(btn(T.crop || "Crop", "primary", function () {
        var o = h("canvas", { width: "200", height: "200" });
        o.getContext("2d").drawImage(cv, crop.x * S, crop.y * S, crop.s * S, crop.s * S, 0, 0, 200, 200);
        out = o.toDataURL("image/jpeg", 0.85);
        setStep(2);
      }));
    }
    function step2() {
      pane.appendChild(h("p", { text: T.preview || "Preview. If you are happy with the result, save the photo." }));
      pane.appendChild(h("img", { src: out, cls: c("ph-prev"), alt: "" }));
      m.foot.appendChild(btn(T.back || "Back", "plain", function () { setStep(1); }));
      m.foot.appendChild(btn(T.save || "Save photo", "primary", function () {
        dataUrl = out;
        ctx.set({ name: file.name, size: file.size, type: file.type, cropped: true, saved: true });
        closeModal(m); draw(); toast(T.saved || "Photo saved");
      }));
    }
    setStep(0);
  }
  draw();
  return { el: el, main: el, set: draw, focus: function () { var b = el.querySelector("button"); if (b) b.focus(); } };
};
