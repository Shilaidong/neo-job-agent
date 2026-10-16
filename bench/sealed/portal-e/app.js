(function () {
var CFG = {"inst":"portal-e@canon","key":"app_portale_canon","mount":"app","name":"Meridian Pacific University - Graduate Admissions","sub":"Application for admission","footer":"Meridian Pacific University. For technical support contact the admissions helpdesk.","ui":{"label":"for","nav":"side","aria":false,"confirmLeave":false,"px":"mp"},"tx":{"save":"Save progress","next":"Save and continue","back":"Back","submit":"Submit","pay":"Proceed to payment","review":"Summary and declaration","savedMsg":"Your progress has been saved"},"pages":[{"id":"p1","t":"Personal","secs":[{"t":"Applicant details","h":"shadow","fs":[{"id":"q3160","k":"sselect","l":"Citizenship","r":1,"o":["Australia","Austria","Bangladesh","Belgium","Brazil","Canada","Chile","Denmark","Egypt","Finland","France","Germany","Ghana","Greece","Hong Kong SAR","India","Indonesia","Ireland","Italy","Japan","Kazakhstan","Kenya","Korea, Republic of","Macao SAR","Mainland China","Malaysia","Mexico","Netherlands","New Zealand","Nigeria","Norway","Pakistan","Philippines","Poland","Portugal","Russian Federation","Saudi Arabia","Singapore","South Africa","Spain","Sri Lanka","Sweden","Switzerland","Taiwan Region","Thailand","Turkey","United Arab Emirates","United Kingdom","United States","Vietnam"]},{"id":"countryOfBirth","k":"select","l":"Country / region of birth","r":1,"o":["Australia","Austria","Bangladesh","Belgium","Brazil","Canada","Chile","Denmark","Egypt","Finland","France","Germany","Ghana","Greece","Hong Kong SAR","India","Indonesia","Ireland","Italy","Japan","Kazakhstan","Kenya","Korea, Republic of","Macao SAR","Mainland China","Malaysia","Mexico","Netherlands","New Zealand","Nigeria","Norway","Pakistan","Philippines","Poland","Portugal","Russian Federation","Saudi Arabia","Singapore","South Africa","Spain","Sri Lanka","Sweden","Switzerland","Taiwan Region","Thailand","Turkey","United Arab Emirates","United Kingdom","United States","Vietnam"]},{"id":"ctl00_6462","k":"text","l":"Place of birth (city)","r":1,"ph":"e.g. Lisbon"},{"id":"ctl00_8586","k":"date-mask","l":"Date of birth","r":1,"fmt":"DD/MM/YYYY","x":{"minD":"1950-01-01","maxD":"2012-12-31","yFrom":1950,"yTo":2012}},{"id":"in_9973","k":"select","l":"Legal sex","r":1,"o":["Man","Woman","Another gender identity","Prefer not to answer"]},{"id":"familyName","k":"text","l":"Surname / Family name (as in passport)","r":1,"ph":"e.g. SMITH"},{"id":"firstName","k":"text","l":"Given name(s)","r":1,"ph":"As shown on passport"},{"id":"nationalId","k":"text","l":"Travel document number","r":1,"ph":"e.g. X1234567","x":{"upper":true,"max":12}},{"id":"c2772","k":"date-3sel","l":"Passport expiry date","r":1,"x":{"minD":"2026-09-21","yFrom":2026,"yTo":2040}},{"id":"q4257","k":"text","l":"Name in native script","ph":"e.g. 陳大文"},{"id":"fld4169","k":"radio","l":"Prefix","o":["Mr","Mrs","Miss","Ms","Mx","Dr","Prof"]}]}]},{"id":"p2","t":"Contact","secs":[{"t":"Contact and address","h":"frame","fs":[{"id":"address1","k":"text","l":"Address line 1","r":1,"ph":"e.g. 10 Downing Close","x":{"max":50}},{"id":"ctl00_5506","k":"text","l":"Apartment, suite, district","x":{"max":50}},{"id":"x8994","k":"text","l":"Town / City","r":1,"ph":"e.g. Springfield"},{"id":"fld7386","k":"text","l":"State / Province","ph":"if applicable"},{"id":"fld3157","k":"text","l":"Postcode","ph":"e.g. 90210"},{"id":"countryOfResidence","k":"select","l":"Country","r":1,"o":["Australia","Austria","Bangladesh","Belgium","Brazil","Canada","Chile","Denmark","Egypt","Finland","France","Germany","Ghana","Greece","Hong Kong SAR","India","Indonesia","Ireland","Italy","Japan","Kazakhstan","Kenya","Korea, Republic of","Macao SAR","Mainland China","Malaysia","Mexico","Netherlands","New Zealand","Nigeria","Norway","Pakistan","Philippines","Poland","Portugal","Russian Federation","Saudi Arabia","Singapore","South Africa","Spain","Sri Lanka","Sweden","Switzerland","Taiwan Region","Thailand","Turkey","United Arab Emirates","United Kingdom","United States","Vietnam"]},{"id":"phone","k":"phone","l":"Telephone (mobile)","r":1,"hp":"Include the country code."},{"id":"fld6263","k":"email","l":"Email address","r":1,"ph":"you@domain.com"},{"id":"emergencyName","k":"text","l":"Next of kin - full name","r":1,"ph":"Full name"},{"id":"nokRelationship","k":"select","l":"Relationship to applicant","r":1,"o":["Father","Mother","Husband / Wife","Brother / Sister","Guardian","Friend","Other"]},{"id":"x1333","k":"phone","l":"Contact person's phone","r":1,"ph":"incl. country code"}]}]},{"id":"p3","t":"Qualification","secs":[{"t":"Highest / current qualification","i":"Give details of your most recent degree-level study (completed or in progress).","h":"canvas","fs":[{"id":"q9201","k":"text","l":"Final grade / average","r":1},{"id":"f_2502","k":"select","l":"GPA scale","r":1,"o":["Out of 4.0","Out of 4.3","Out of 4.5","Out of 5","Out of 10","Percentage (out of 100)","Other scale"]},{"id":"qualLevel","k":"select","l":"Level of study","r":1,"o":["Bachelor's degree","Master's degree","Doctoral degree","Associate degree / Diploma","Exchange / Non-degree study","Secondary school"]},{"id":"in_7170","k":"month-mask","l":"Date from","r":1,"fmt":"MM/YYYY"},{"id":"x8131","k":"month-mask","l":"End date (or expected)","r":1,"fmt":"MM/YYYY"},{"id":"ctl00_9459","k":"text","l":"School attended","r":1},{"id":"q5739","k":"select","l":"Country of institution","r":1,"o":["Australia","Austria","Bangladesh","Belgium","Brazil","Canada","Chile","Denmark","Egypt","Finland","France","Germany","Ghana","Greece","Hong Kong SAR","India","Indonesia","Ireland","Italy","Japan","Kazakhstan","Kenya","Korea, Republic of","Macao SAR","Mainland China","Malaysia","Mexico","Netherlands","New Zealand","Nigeria","Norway","Pakistan","Philippines","Poland","Portugal","Russian Federation","Saudi Arabia","Singapore","South Africa","Spain","Sri Lanka","Sweden","Switzerland","Taiwan Region","Thailand","Turkey","United Arab Emirates","United Kingdom","United States","Vietnam"]},{"id":"q8239","k":"text","l":"Major / field of study","r":1},{"id":"inProgress","k":"check","l":"Still in progress"}]}]},{"id":"p4","t":"Tests","secs":[{"t":"English proficiency","h":"canvas","fs":[{"id":"in_9680","k":"select","l":"English language test","r":1,"o":["IELTS Academic","TOEFL iBT","PTE Academic","Duolingo English Test","I have not taken a test"]},{"id":"testDate","k":"date-mask","l":"Test date","r":1,"w":{"id":"in_9680","v":["IELTS Academic","TOEFL iBT","PTE Academic","Duolingo English Test"]},"fmt":"YYYY-MM-DD"},{"id":"in_7961","k":"text","l":"Total score","r":1,"w":{"id":"in_9680","v":["IELTS Academic","TOEFL iBT","PTE Academic","Duolingo English Test"]},"x":{"re":"^\\d{1,3}(\\.\\d{1,2})?$","reMsg":"Enter a number, for example 6.5 or 95"}},{"id":"fld6122","k":"text","l":"Listening","r":1,"w":{"id":"in_9680","v":["IELTS Academic","TOEFL iBT","PTE Academic","Duolingo English Test"]},"x":{"re":"^\\d{1,3}(\\.\\d{1,2})?$","reMsg":"Enter a number, for example 6.5 or 95"}},{"id":"x8223","k":"text","l":"Reading","r":1,"w":{"id":"in_9680","v":["IELTS Academic","TOEFL iBT","PTE Academic","Duolingo English Test"]},"x":{"re":"^\\d{1,3}(\\.\\d{1,2})?$","reMsg":"Enter a number, for example 6.5 or 95"}},{"id":"fld3440","k":"text","l":"Writing score","r":1,"w":{"id":"in_9680","v":["IELTS Academic","TOEFL iBT","PTE Academic","Duolingo English Test"]},"x":{"re":"^\\d{1,3}(\\.\\d{1,2})?$","reMsg":"Enter a number, for example 6.5 or 95"}},{"id":"speaking","k":"text","l":"Speaking score","r":1,"w":{"id":"in_9680","v":["IELTS Academic","TOEFL iBT","PTE Academic","Duolingo English Test"]},"x":{"re":"^\\d{1,3}(\\.\\d{1,2})?$","reMsg":"Enter a number, for example 6.5 or 95"}}]},{"t":"Graduate admissions test","fs":[{"id":"f_4844","k":"radio","l":"GRE General Test taken?","r":1,"o":["No","Yes"]},{"id":"x4226","k":"date-mask","l":"GRE taken on","r":1,"w":{"id":"f_4844","v":["Yes"]},"fmt":"YYYY-MM-DD","x":{"maxD":"2026-09-20","minD":"2021-01-01"}},{"id":"x9858","k":"text","l":"GRE Verbal Reasoning","r":1,"w":{"id":"f_4844","v":["Yes"]},"x":{"num":[130,170]}},{"id":"fld8599","k":"text","l":"GRE Quant score","r":1,"w":{"id":"f_4844","v":["Yes"]},"x":{"num":[130,170]}},{"id":"c1483","k":"text","l":"GRE AWA score","r":1,"w":{"id":"f_4844","v":["Yes"]},"x":{"num":[0,6]}}]}]},{"id":"p5","t":"Programme","secs":[{"t":"Programme applied for","fs":[{"id":"q2502","k":"radio","l":"Criminal record","r":1,"o":["No","Yes"]},{"id":"in_8699","k":"select","l":"Proposed start","r":1,"o":["January 2027","September 2027","January 2028","September 2028"]},{"id":"f_2632","k":"select","l":"How will you fund your studies?","r":1,"o":["Self-funded","Family support","Employer sponsorship","Government scholarship","University scholarship (applying)","Loan"]},{"id":"c6852","k":"sselect","l":"Programme applied for","r":1,"o":["MSc Computer Science","MSc Computing (Conversion)","MSc Artificial Intelligence","MSc Software Engineering","MSc Cyber Security","MSc Electrical and Electronic Engineering","MSc Computer Engineering","MSc Robotics and Autonomous Systems","MSc Mechanical Engineering","MSc Statistics","MSc Data Science","MSc Data Science and Analytics","MSc Applied Mathematics","MSc Physics","MSc Finance","MSc Financial Technology","MSc Business Analytics","MSc Management","MA Education","MA TESOL","MA Applied Linguistics"]},{"id":"studyMode","k":"select","l":"Study mode","r":1,"o":["Full-time","Part-time"]}]},{"t":"Personal statement","fs":[{"id":"x7553","k":"text","l":"Area of interest","x":{"max":120,"wide":true},"wide":1},{"id":"fld2698","k":"rte","l":"Why do you want to study this programme?","r":1,"x":{"words":350,"wide":true},"wide":1}]}]},{"id":"p6","t":"Documents","secs":[{"t":"Uploads","fs":[{"id":"docCv","k":"file","l":"Curriculum vitae","r":1,"x":{"types":["pdf"],"maxKB":4096,"accept":".pdf"}},{"id":"q8544","k":"file","l":"Academic transcript","r":1,"x":{"types":["pdf"],"maxKB":4096,"accept":".pdf"}}]}]}],"rev":{"t":"Applicant's declaration","intro":"Please read the statements below carefully. They must be completed by the applicant in person.","cs":["I have read and agree to the Terms and Conditions and the Privacy Notice.","I authorise the University to verify my qualifications with the awarding institutions."],"ids":["agree1","c2"],"ck":"div","sigId":"s_77","sigL":"Signed (type full name)","pad":true,"cap":true,"fee":"Application fee: 120.00 (non-refundable).","need":"You must confirm every statement and sign before submitting.","doneT":"Application submitted","doneM":"Thank you. Your application has been submitted and can no longer be edited."},"db":{}};
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

function plainOf(node) {
  var out = "";
  (function walk(n) {
    for (var ch = n.firstChild; ch; ch = ch.nextSibling) {
      if (ch.nodeType === 3) out += ch.nodeValue;
      else if (ch.nodeName === "BR") out += "\n";
      else { var block = /^(DIV|P|LI|UL|OL|H\d)$/.test(ch.nodeName); if (block && out && !/\n$/.test(out)) out += "\n"; walk(ch); if (block && !/\n$/.test(out)) out += "\n"; }
    }
  })(node);
  return out.replace(/ /g, " ").replace(/\n{3,}/g, "\n\n").trim();
}
function wordCount(s) { var m = s.trim().match(/\S+/g); return m ? m.length : 0; }
W.rte = function (f, ctx) {
  var x = f.x || {};
  var ed = h("div", { cls: c("rte-ed"), contenteditable: "true", id: f.id, tabindex: "0" });
  if (UI.aria) { ed.setAttribute("role", "textbox"); ed.setAttribute("aria-multiline", "true"); }
  var cnt = h("div", { cls: c("count") });
  function cmd(name) { return function (e) { e.preventDefault(); ed.focus(); doc.execCommand(name, false, null); sync(); }; }
  var bar = h("div", { cls: c("rte-bar") }, [
    h("span", { cls: c("rte-b"), title: "Bold", html: "<b>B</b>", onmousedown: cmd("bold") }),
    h("span", { cls: c("rte-b"), title: "Italic", html: "<i>I</i>", onmousedown: cmd("italic") }),
    h("span", { cls: c("rte-b"), title: "Bulleted list", text: "•", onmousedown: cmd("insertUnorderedList") }),
    h("span", { cls: c("rte-b"), title: "Clear formatting", text: "Tx", onmousedown: cmd("removeFormat") })
  ]);
  function sync() {
    var t = plainOf(ed);
    var n = x.words ? wordCount(t) : t.length;
    var lim = x.words || x.chars;
    cnt.textContent = n + " / " + lim + (x.words ? " words" : " characters");
    cnt.classList.toggle(c("over"), n > lim);
    ctx.set(t, true);
  }
  ed.addEventListener("input", sync);
  ed.addEventListener("blur", function () { ctx.set(plainOf(ed)); });
  ed.addEventListener("paste", function (e) {
    e.preventDefault();
    var t = (e.clipboardData || window.clipboardData).getData("text/plain") || "";
    t = t.replace(/\r\n?/g, "\n").replace(/[ --]/g, "");
    if (x.flatten) t = t.replace(/\n{2,}/g, "\n");
    doc.execCommand("insertText", false, t);
    sync();
  });
  setTimeout(sync, 0);
  return { el: h("div", { cls: c("rte") }, [bar, ed, cnt]), main: ed, set: function (v) { ed.textContent = ""; (v || "").split("\n").forEach(function (line, i) { if (i) ed.appendChild(h("br")); ed.appendChild(doc.createTextNode(line)); }); sync(); }, focus: function () { ed.focus(); } };
};
W.rte.check = function (f, v) {
  var x = f.x || {};
  if (x.words && wordCount(v) > x.words) return "Your text is over the limit of " + x.words + " words.";
  if (x.chars && v.length > x.chars) return "Your text is over the limit of " + x.chars + " characters.";
  if (x.minWords && wordCount(v) < x.minWords) return "Please write at least " + x.minWords + " words.";
  return null;
};

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

if (/frame\.html$/.test(location.pathname)) bootFrame(); else boot();
})();
