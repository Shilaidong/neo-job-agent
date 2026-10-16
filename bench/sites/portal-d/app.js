(function () {
var CFG = {"inst":"portal-d@canon","key":"app_portald_canon","mount":"app","name":"University of Aldermoor","sub":"Online application for taught postgraduate study","footer":"Aldermoor University Admissions Office. This is a secure service.","ui":{"label":"for","nav":"side","aria":true,"confirmLeave":true,"navNum":true,"px":"ad"},"tx":{"save":"Save draft","next":"Next","back":"Back","submit":"Submit","pay":"Pay fee","review":"Summary and declaration","savedMsg":"Your progress has been saved"},"pages":[{"id":"p1","t":"Personal details","secs":[{"t":"Your details","fs":[{"id":"photo","k":"photo","l":"Passport-style photo","r":1,"x":{"types":["jpg","jpeg","png"],"maxKB":2048,"asciiName":true,"maxName":50,"rules":"JPG or PNG, up to 2 MB. The file name may contain English letters, digits, spaces, hyphens and underscores only and must not exceed 50 characters.","wide":true},"wide":1},{"id":"nameLocal","k":"text","l":"Name in native script","r":1,"ph":"e.g. 陳大文"},{"id":"q6394","k":"date-native","l":"Birth date","r":1,"x":{"minD":"1950-01-01","maxD":"2012-12-31","yFrom":1950,"yTo":2012}},{"id":"familyName","k":"text","l":"Surname / Family name (as in passport)","r":1,"ph":"e.g. SMITH"},{"id":"c7573","k":"text","l":"Given names (as in passport)","r":1,"ph":"e.g. John"},{"id":"countryOfBirth","k":"select","l":"Country / region of birth","r":1,"o":["Australia","Austria","Bangladesh","Belgium","Brazil","Canada","Chile","China, Mainland","Chinese Taipei","Denmark","Egypt","Finland","France","Germany","Ghana","Greece","Hong Kong (SAR)","India","Indonesia","Ireland","Italy","Japan","Kazakhstan","Kenya","Korea, Republic of","Macao (SAR)","Malaysia","Mexico","Netherlands","New Zealand","Nigeria","Norway","Pakistan","Philippines","Poland","Portugal","Russian Federation","Saudi Arabia","Singapore","South Africa","Spain","Sri Lanka","Sweden","Switzerland","Thailand","Turkey","United Arab Emirates","United Kingdom","United States","Vietnam"]},{"id":"x3881","k":"text","l":"Town / city of birth","ph":"City"},{"id":"passportNo","k":"text","l":"Passport number","r":1,"x":{"upper":true,"max":12}},{"id":"fld2485","k":"select","l":"Passport issuing country","o":["Australia","Austria","Bangladesh","Belgium","Brazil","Canada","Chile","China, Mainland","Chinese Taipei","Denmark","Egypt","Finland","France","Germany","Ghana","Greece","Hong Kong (SAR)","India","Indonesia","Ireland","Italy","Japan","Kazakhstan","Kenya","Korea, Republic of","Macao (SAR)","Malaysia","Mexico","Netherlands","New Zealand","Nigeria","Norway","Pakistan","Philippines","Poland","Portugal","Russian Federation","Saudi Arabia","Singapore","South Africa","Spain","Sri Lanka","Sweden","Switzerland","Thailand","Turkey","United Arab Emirates","United Kingdom","United States","Vietnam"]},{"id":"ppIssued","k":"date-3sel","l":"Passport issued on","r":1,"x":{"maxD":"2026-09-20","minD":"2010-01-01","yFrom":2010,"yTo":2026,"monNum":false}},{"id":"ppExpires","k":"date-3sel","l":"Date of expiry","r":1,"x":{"minD":"2026-09-21","yFrom":2026,"yTo":2040,"monNum":false}},{"id":"title","k":"radio","l":"Title","o":["Mr.","Ms.","Mrs.","Dr.","Prof.","Other"]},{"id":"rbGender","k":"select","l":"Legal sex","r":1,"o":["Man","Woman","Another gender identity","Prefer not to answer"]},{"id":"maidenName","k":"text","l":"Previous surname"},{"id":"preferredName","k":"text","l":"Preferred name","ph":"e.g. Sam"},{"id":"citizenship","k":"select","l":"Nationality","r":1,"o":["Australia","Austria","Bangladesh","Belgium","Brazil","Canada","Chile","China, Mainland","Chinese Taipei","Denmark","Egypt","Finland","France","Germany","Ghana","Greece","Hong Kong (SAR)","India","Indonesia","Ireland","Italy","Japan","Kazakhstan","Kenya","Korea, Republic of","Macao (SAR)","Malaysia","Mexico","Netherlands","New Zealand","Nigeria","Norway","Pakistan","Philippines","Poland","Portugal","Russian Federation","Saudi Arabia","Singapore","South Africa","Spain","Sri Lanka","Sweden","Switzerland","Thailand","Turkey","United Arab Emirates","United Kingdom","United States","Vietnam"]}]}]},{"id":"p2","t":"Contact details","secs":[{"t":"How we can reach you","fs":[{"id":"email","k":"email","l":"Primary email","r":1},{"id":"c6452","k":"text","l":"Street address","r":1,"x":{"max":60}},{"id":"fld3636","k":"text","l":"Address line 2","ph":"optional","x":{"max":60}},{"id":"addrCity","k":"text","l":"City / District","r":1,"ph":"e.g. Springfield"},{"id":"fld6863","k":"text","l":"County / State / Province"},{"id":"zip","k":"text","l":"ZIP / Postcode","ph":"e.g. 90210"},{"id":"country","k":"select","l":"Country / Region","r":1,"o":["Australia","Austria","Bangladesh","Belgium","Brazil","Canada","Chile","China, Mainland","Chinese Taipei","Denmark","Egypt","Finland","France","Germany","Ghana","Greece","Hong Kong (SAR)","India","Indonesia","Ireland","Italy","Japan","Kazakhstan","Kenya","Korea, Republic of","Macao (SAR)","Malaysia","Mexico","Netherlands","New Zealand","Nigeria","Norway","Pakistan","Philippines","Poland","Portugal","Russian Federation","Saudi Arabia","Singapore","South Africa","Spain","Sri Lanka","Sweden","Switzerland","Thailand","Turkey","United Arab Emirates","United Kingdom","United States","Vietnam"]},{"id":"chkSame","k":"check","l":"Correspondence address same as permanent address"},{"id":"mailAddress1","k":"text","l":"Mailing address line 1","r":1,"w":{"id":"chkSame","v":[false]}},{"id":"mailAddress2","k":"text","l":"Mailing address line 2","w":{"id":"chkSame","v":[false]}},{"id":"city","k":"text","l":"Mailing city","r":1,"w":{"id":"chkSame","v":[false]}},{"id":"mailState","k":"text","l":"County / State","w":{"id":"chkSame","v":[false]}},{"id":"mailPostal","k":"text","l":"Postcode","w":{"id":"chkSame","v":[false]}},{"id":"q6260","k":"select","l":"Country / Region","r":1,"o":["Australia","Austria","Bangladesh","Belgium","Brazil","Canada","Chile","China, Mainland","Chinese Taipei","Denmark","Egypt","Finland","France","Germany","Ghana","Greece","Hong Kong (SAR)","India","Indonesia","Ireland","Italy","Japan","Kazakhstan","Kenya","Korea, Republic of","Macao (SAR)","Malaysia","Mexico","Netherlands","New Zealand","Nigeria","Norway","Pakistan","Philippines","Poland","Portugal","Russian Federation","Saudi Arabia","Singapore","South Africa","Spain","Sri Lanka","Sweden","Switzerland","Thailand","Turkey","United Arab Emirates","United Kingdom","United States","Vietnam"],"w":{"id":"chkSame","v":[false]}},{"id":"ctl00_3036","k":"phone","l":"Mobile phone","r":1,"hp":"Include the country code, for example +44 7400 123456."},{"id":"altPhone","k":"phone","l":"Alternative phone","ph":"optional"}]},{"t":"Person to contact in an emergency","fs":[{"id":"c5231","k":"select","l":"Relationship to you","r":1,"o":["Parent","Spouse / Partner","Sibling","Other relative","Friend","Other"]},{"id":"emergencyName","k":"text","l":"Next of kin - full name","r":1,"ph":"Full name"},{"id":"fld1239","k":"phone","l":"Next of kin telephone","r":1,"ph":"incl. country code"},{"id":"emergencyEmail","k":"email","l":"Emergency contact email","ph":"optional"}]}]},{"id":"p3","t":"Education","secs":[{"t":"Education","fs":[{"id":"educationTable","k":"rep","l":"Academic qualifications","il":"education record","ed":"modal","fs":[{"id":"current","k":"check","l":"Qualification not yet completed"},{"id":"ctl00_1135","k":"lookup","l":"Institution name","r":1,"refs":{"city":"ctl00_7025","country":"schoolCountry"},"x":{"countries":["Australia","Austria","Bangladesh","Belgium","Brazil","Canada","Chile","China, Mainland","Chinese Taipei","Denmark","Egypt","Finland","France","Germany","Ghana","Greece","Hong Kong (SAR)","India","Indonesia","Ireland","Italy","Japan","Kazakhstan","Kenya","Korea, Republic of","Macao (SAR)","Malaysia","Mexico","Netherlands","New Zealand","Nigeria","Norway","Pakistan","Philippines","Poland","Portugal","Russian Federation","Saudi Arabia","Singapore","South Africa","Spain","Sri Lanka","Sweden","Switzerland","Thailand","Turkey","United Arab Emirates","United Kingdom","United States","Vietnam"]}},{"id":"schoolCountry","k":"select","l":"Institution location (country)","r":1,"o":["Australia","Austria","Bangladesh","Belgium","Brazil","Canada","Chile","China, Mainland","Chinese Taipei","Denmark","Egypt","Finland","France","Germany","Ghana","Greece","Hong Kong (SAR)","India","Indonesia","Ireland","Italy","Japan","Kazakhstan","Kenya","Korea, Republic of","Macao (SAR)","Malaysia","Mexico","Netherlands","New Zealand","Nigeria","Norway","Pakistan","Philippines","Poland","Portugal","Russian Federation","Saudi Arabia","Singapore","South Africa","Spain","Sri Lanka","Sweden","Switzerland","Thailand","Turkey","United Arab Emirates","United Kingdom","United States","Vietnam"]},{"id":"ctl00_7025","k":"text","l":"City","r":1},{"id":"x8171","k":"text","l":"Cumulative GPA","ph":"e.g. 3.45"},{"id":"c2829","k":"select","l":"Maximum possible","o":["4.0","4.3","4.5","5.0","10","100","Other"]},{"id":"fld7099","k":"radio","l":"Language of instruction","o":["Chinese (Mandarin / Cantonese)","English","Japanese","Korean","Other language"]},{"id":"q9412","k":"text","l":"Major / field of study","r":1,"ph":"e.g. History"},{"id":"f_2979","k":"month-mask","l":"Date from","r":1,"fmt":"MM/YYYY"},{"id":"dateTo","k":"month-2sel","l":"Completion / expected completion date","r":1},{"id":"f_8643","k":"select","l":"Level of study","r":1,"o":["Undergraduate (Bachelor)","Postgraduate taught (Master)","Postgraduate research (PhD/MPhil)","Sub-degree (Diploma / Associate)","Non-award / Visiting / Exchange","High school"]},{"id":"qualification","k":"text","l":"Qualification name","r":1,"ph":"e.g. BA (Hons)"}],"sum":["ctl00_1135","f_8643","dateTo"],"min":1,"max":6,"r":1,"add":"Add education record","x":{}}]}]},{"id":"p4","t":"Experience","secs":[{"t":"Language and admissions tests","fs":[{"id":"testsList","k":"rep","l":"Standardised tests","il":"score report","ed":"modal","fs":[{"id":"reference","k":"text","l":"Registration / report number"},{"id":"x8308","k":"radio","l":"Test","r":1,"o":["GRE General","GMAT Focus / GMAT","TOEFL iBT","IELTS (Academic)","Duolingo English Test"]},{"id":"c1522","k":"date-native","l":"Date taken","r":1,"x":{"maxD":"2026-09-20","minD":"2021-01-01"}},{"id":"q3125","k":"text","l":"Overall band","r":1,"ph":"e.g. 90","w":{"id":"x8308","v":["TOEFL iBT","IELTS (Academic)","Duolingo English Test"]},"x":{"re":"^\\d{1,3}(\\.\\d{1,2})?$","reMsg":"Enter a number, for example 6.5 or 95"}},{"id":"listening","k":"text","l":"Listening","r":1,"w":{"id":"x8308","v":["TOEFL iBT","IELTS (Academic)","Duolingo English Test"]},"x":{"re":"^\\d{1,3}(\\.\\d{1,2})?$","reMsg":"Enter a number, for example 6.5 or 95"}},{"id":"subR","k":"text","l":"Reading","r":1,"w":{"id":"x8308","v":["TOEFL iBT","IELTS (Academic)","Duolingo English Test"]},"x":{"re":"^\\d{1,3}(\\.\\d{1,2})?$","reMsg":"Enter a number, for example 6.5 or 95"}},{"id":"c9344","k":"text","l":"Writing score","r":1,"w":{"id":"x8308","v":["TOEFL iBT","IELTS (Academic)","Duolingo English Test"]},"x":{"re":"^\\d{1,3}(\\.\\d{1,2})?$","reMsg":"Enter a number, for example 6.5 or 95"}},{"id":"subS","k":"text","l":"Speaking score","r":1,"w":{"id":"x8308","v":["TOEFL iBT","IELTS (Academic)","Duolingo English Test"]},"x":{"re":"^\\d{1,3}(\\.\\d{1,2})?$","reMsg":"Enter a number, for example 6.5 or 95"}},{"id":"quant","k":"text","l":"Verbal Reasoning","r":1,"ph":"130-170","w":{"id":"x8308","v":["GRE General","GMAT Focus / GMAT"]},"x":{"num":[130,170]}},{"id":"subQ","k":"text","l":"Quantitative Reasoning","r":1,"ph":"130-170","w":{"id":"x8308","v":["GRE General","GMAT Focus / GMAT"]},"x":{"num":[130,170]}},{"id":"subAW","k":"text","l":"AWA","r":1,"ph":"0.0-6.0","w":{"id":"x8308","v":["GRE General","GMAT Focus / GMAT"]},"x":{"num":[0,6]}}],"sum":["x8308","c1522"],"min":0,"max":6,"add":"Add score report","x":{}}]},{"t":"Employment history","fs":[{"id":"ctl00_4867","k":"rep","l":"Work experience","il":"employment record","ed":"modal","fs":[{"id":"fld5493","k":"check","l":"I currently work here"},{"id":"fld1329","k":"month-2sel","l":"From","r":1},{"id":"endDate","k":"month-mask","l":"Date left","r":1,"w":{"id":"fld5493","v":[false]},"fmt":"MM/YYYY"},{"id":"f_9226","k":"text","l":"Role","r":1,"ph":"e.g. Analyst"},{"id":"ctl00_2986","k":"radio","l":"Employment type","o":["Full-time","Part-time","Internship","Voluntary / Unpaid"]},{"id":"fld9334","k":"text","l":"Name of employer","r":1,"ph":"e.g. Acme Ltd"},{"id":"responsibilities","k":"textarea","l":"Brief description of duties","ph":"Describe your main responsibilities","x":{"max":600,"count":true,"rows":4,"wide":true},"wide":1},{"id":"c9563","k":"select","l":"Country","r":1,"o":["Australia","Austria","Bangladesh","Belgium","Brazil","Canada","Chile","China, Mainland","Chinese Taipei","Denmark","Egypt","Finland","France","Germany","Ghana","Greece","Hong Kong (SAR)","India","Indonesia","Ireland","Italy","Japan","Kazakhstan","Kenya","Korea, Republic of","Macao (SAR)","Malaysia","Mexico","Netherlands","New Zealand","Nigeria","Norway","Pakistan","Philippines","Poland","Portugal","Russian Federation","Saudi Arabia","Singapore","South Africa","Spain","Sri Lanka","Sweden","Switzerland","Thailand","Turkey","United Arab Emirates","United Kingdom","United States","Vietnam"]},{"id":"q1136","k":"text","l":"City"}],"sum":["fld9334","f_9226","fld1329"],"min":0,"max":6,"add":"Add employment record","x":{}}]}]},{"id":"p5","t":"References","secs":[{"t":"References","i":"Provide two referees. You may send the reference request now or at any time before you submit.","fs":[{"id":"recommendersList","k":"rep","l":"Recommenders","il":"reference","ed":"modal","fs":[{"id":"rMail","k":"email","l":"Referee email","r":1,"ph":"name@university.edu"},{"id":"fld7531","k":"radio","l":"Type of reference","r":1,"o":["Professional","Academic (teacher / supervisor)","Personal"]},{"id":"refOrg","k":"text","l":"Recommender's organisation","r":1},{"id":"ctl00_3143","k":"text","l":"Recommender's title or position","r":1},{"id":"rTel","k":"phone","l":"Referee telephone","ph":"incl. country code"},{"id":"recLastName","k":"text","l":"Recommender last name","r":1},{"id":"refLastName","k":"text","l":"First name","r":1},{"id":"refTitle","k":"select","l":"Salutation","o":["Mr.","Ms.","Mrs.","Dr.","Prof.","Other"]}],"sum":["recLastName","refOrg","rMail"],"min":2,"max":3,"r":1,"add":"Add reference","x":{"invite":{"t":"Send invitation","saveSend":"Save & invite","m":"An e-mail with a personal link will be sent to this reference immediately. This cannot be undone. Continue?","go":"Yes, send","sent":"Request sent","done":"Request sent to reference"}}}]}]},{"id":"p6","t":"Your application","secs":[{"t":"Programme","fs":[{"id":"in_2490","k":"radio","l":"Intake","r":1,"o":["January 2027","September 2027","January 2028","September 2028"]},{"id":"scholarship","k":"radio","l":"Do you wish to be considered for a scholarship?","r":1,"o":["No","Yes"]},{"id":"q9476","k":"select","l":"Where did you learn about this programme?","o":["University website","Education agent","Education fair","Friend or family","Social media","Rankings","Other"]},{"id":"x3373","k":"select","l":"Attendance","r":1,"o":["Full-time","Part-time"]},{"id":"financeSource","k":"select","l":"How will you fund your studies?","r":1,"o":["Personal savings","Parents / Family","Company sponsored","Scholarship - government","Scholarship - university","Bank loan","Other"]},{"id":"ctl00_7092","k":"select","l":"Do you have any unspent criminal convictions?","r":1,"o":["No","Yes"]},{"id":"programCode","k":"select","l":"Program of study","r":1,"o":["MSc Computer Science","MSc Computing (Conversion)","MSc Artificial Intelligence","MSc Software Engineering","MSc Cyber Security","MSc Electrical and Electronic Engineering","MSc Computer Engineering","MSc Robotics and Autonomous Systems","MSc Mechanical Engineering","MSc Statistics","MSc Data Science","MSc Data Science and Analytics","MSc Applied Mathematics","MSc Physics","MSc Finance","MSc Financial Technology","MSc Business Analytics","MSc Management","MA Education","MA TESOL","MA Applied Linguistics"]}]},{"t":"Statement of purpose","fs":[{"id":"interestArea","k":"text","l":"Area of interest","x":{"max":120,"wide":true},"wide":1},{"id":"f_8487","k":"rte","l":"Personal statement","r":1,"x":{"words":300,"ascii":true,"wide":true},"wide":1}]}]},{"id":"p7","t":"Uploads","secs":[{"t":"Supporting documents","i":"Upload your transcript, a copy of your passport and your CV. Choose a document type for each file. PDF only, up to 4 MB each.","fs":[{"id":"c7617","k":"files","l":"Supporting documents","r":1,"x":{"types":["pdf"],"maxKB":4096,"maxFiles":6,"accept":".pdf","wide":true,"docTypes":["Academic transcript","Degree certificate","Passport / ID","CV / Résumé","English test report","Other supporting document"]},"wide":1}]}]}],"rev":{"t":"Applicant's declaration","intro":"The applicant must personally confirm each of the following statements before the application can be submitted.","cs":["I authorise the University to verify my qualifications with the awarding institutions.","I have read and agree to the Terms and Conditions and the Privacy Notice."],"ids":["consent1","chkDecl2"],"ck":"native","sigId":"fullNameSign","sigL":"Electronic signature (full name)","pad":false,"cap":false,"fee":"Application fee: 120.00 (non-refundable).","need":"You must confirm every statement and sign before submitting.","doneT":"Application submitted","doneM":"Thank you. Your application has been submitted and can no longer be edited."},"db":{"inst":[["National Taiwan University","Taipei","Chinese Taipei","100000"],["National Taiwan Normal University","Taipei","Chinese Taipei","107919"],["National Taiwan University of Science and Technology","Taipei","Chinese Taipei","115838"],["National Cheng Kung University","Tainan","Chinese Taipei","123757"],["National Chengchi University","Taipei","Chinese Taipei","131676"],["National Chung Cheng University","Chiayi","Chinese Taipei","139595"],["National Chung Hsing University","Taichung","Chinese Taipei","147514"],["National Tsing Hua University","Hsinchu","Chinese Taipei","155433"],["National Yang Ming Chiao Tung University","Hsinchu","Chinese Taipei","163352"],["National Central University","Taoyuan","Chinese Taipei","171271"],["National Sun Yat-sen University","Kaohsiung","Chinese Taipei","179190"],["Tsinghua University","Beijing","China, Mainland","187109"],["Peking University","Beijing","China, Mainland","195028"],["Zhejiang University","Hangzhou","China, Mainland","202947"],["Zhejiang University of Technology","Hangzhou","China, Mainland","210866"],["Zhejiang Gongshang University","Hangzhou","China, Mainland","218785"],["Zhejiang Sci-Tech University","Hangzhou","China, Mainland","226704"],["Hangzhou Normal University","Hangzhou","China, Mainland","234623"],["Fudan University","Shanghai","China, Mainland","242542"],["Shanghai Jiao Tong University","Shanghai","China, Mainland","250461"],["Nanjing University","Nanjing","China, Mainland","258380"],["Sun Yat-sen University","Guangzhou","China, Mainland","266299"],["Wuhan University","Wuhan","China, Mainland","274218"],["Xi'an Jiaotong University","Xi'an","China, Mainland","282137"],["University of Electronic Science and Technology of China","Chengdu","China, Mainland","290056"],["Xidian University","Xi'an","China, Mainland","297975"],["The University of Hong Kong","Hong Kong","Hong Kong (SAR)","305894"],["The Chinese University of Hong Kong","Hong Kong","Hong Kong (SAR)","313813"],["The Hong Kong University of Science and Technology","Hong Kong","Hong Kong (SAR)","321732"],["The Hong Kong Polytechnic University","Hong Kong","Hong Kong (SAR)","329651"],["City University of Hong Kong","Hong Kong","Hong Kong (SAR)","337570"],["University of Macau","Macau","Macao (SAR)","345489"],["The University of Manchester","Manchester","United Kingdom","353408"],["Manchester Metropolitan University","Manchester","United Kingdom","361327"],["University of Salford","Manchester","United Kingdom","369246"],["University of Leeds","Leeds","United Kingdom","377165"],["University of Edinburgh","Edinburgh","United Kingdom","385084"],["University College London","London","United Kingdom","393003"],["Imperial College London","London","United Kingdom","400922"],["King's College London","London","United Kingdom","408841"],["London School of Economics and Political Science","London","United Kingdom","416760"],["London Business School","London","United Kingdom","424679"],["London South Bank University","London","United Kingdom","432598"],["University of Oxford","Oxford","United Kingdom","440517"],["University of Cambridge","Cambridge","United Kingdom","448436"],["University of Warwick","Coventry","United Kingdom","456355"],["Kyoto University","Kyoto","Japan","464274"],["Kyoto Institute of Technology","Kyoto","Japan","472193"],["Kyoto Sangyo University","Kyoto","Japan","480112"],["The University of Tokyo","Tokyo","Japan","488031"],["Osaka University","Osaka","Japan","495950"],["Seoul National University","Seoul","Korea, Republic of","503869"],["National University of Singapore","Singapore","Singapore","511788"],["Nanyang Technological University","Singapore","Singapore","519707"],["University of Melbourne","Melbourne","Australia","527626"],["University of Sydney","Sydney","Australia","535545"],["University of Toronto","Toronto","Canada","543464"],["University of British Columbia","Vancouver","Canada","551383"],["Massachusetts Institute of Technology","Cambridge","United States","559302"],["Stanford University","Stanford","United States","567221"],["University of California, Berkeley","Berkeley","United States","575140"],["University of California, Los Angeles","Los Angeles","United States","583059"],["University of Michigan - Ann Arbor","Ann Arbor","United States","590978"],["Carnegie Mellon University","Pittsburgh","United States","598897"],["ETH Zurich","Zurich","Switzerland","606816"],["Technical University of Munich","Munich","Germany","614735"],["Delft University of Technology","Delft","Netherlands","622654"],["KU Leuven","Leuven","Belgium","630573"]]},"idle":{"after":240,"grace":60,"t":"Are you still there?","m":"For your security you will be signed out in {0} seconds. Unsaved changes will be lost.","ok":"Stay signed in","lost":"Your session timed out. Unsaved changes were discarded."}};
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

W.rep = function (f, ctx) {
  var x = f.x || {};
  var el = h("div", { cls: c("rep"), id: f.id });
  var inlineHost = h("div");
  function rows() { return (ctx.get() || []).slice(); }
  function commit(list) { ctx.set(list); draw(); }
  function cell(fd, v) { return fmtVal(fd, v); }
  function draw() {
    clear(el);
    var list = rows();
    if (!list.length) el.appendChild(h("div", { cls: c("rep-empty"), text: x.empty || "No entries have been added yet." }));
    else {
      var tbl = h("table", { cls: c("rep-t") });
      var sumFields = f.sum.map(function (id) { return f.fs.filter(function (q) { return q.id === id; })[0]; });
      tbl.appendChild(h("tr", null, sumFields.map(function (q) { return h("th", { text: lab(q) }); }).concat([h("th", { text: "" })])));
      list.forEach(function (row, i) {
        var acts = h("td", { cls: c("rep-acts") });
        acts.appendChild(h("a", { href: "javascript:void(0)", text: x.editT || "Edit", onclick: function () { edit(i); } }));
        acts.appendChild(doc.createTextNode(" | "));
        acts.appendChild(h("a", { href: "javascript:void(0)", text: x.removeT || "Remove", onclick: function () {
          confirmBox(x.removeT || "Remove", (x.removeM || "Remove this entry? This cannot be undone."), [[TX.cancel || "Cancel", "plain", null], [x.removeT || "Remove", "warn", function () { var l = rows(); l.splice(i, 1); commit(l); }]]);
        } }));
        if (x.invite) {
          acts.appendChild(doc.createTextNode(" | "));
          if (row.__sent) acts.appendChild(h("span", { cls: c("sent"), text: x.invite.sent }));
          else acts.appendChild(h("a", { href: "javascript:void(0)", text: x.invite.t, onclick: function () { invite(i); } }));
        }
        tbl.appendChild(h("tr", null, sumFields.map(function (q) { return h("td", { text: cell(q, row[q.id]) }); }).concat([acts])));
      });
      el.appendChild(tbl);
    }
    var canAdd = list.length < (f.max || 6);
    var add = btn(f.add || "Add", "plain", function () { edit(-1); });
    if (!canAdd) add.disabled = true;
    el.appendChild(h("div", { cls: c("rep-add") }, [add]));
    el.appendChild(inlineHost);
  }
  function invite(i) {
    var row = rows()[i];
    note("invite", { stage: "open", row: i });
    confirmBox(x.invite.t, x.invite.m, [[TX.cancel || "Cancel", "plain", null], [x.invite.go, "primary", function () {
      note("invite", { stage: "confirm", row: i });
      var l = rows(); l[i] = Object.assign({}, row, { __sent: true }); commit(l); toast(x.invite.done);
    }]]);
  }
  function edit(i) {
    var list = rows();
    var rowVals = i >= 0 ? clone(list[i]) : {};
    var scope = new Scope(rowVals, ctx.scope);
    var title = (i >= 0 ? (x.editT || "Edit") : (f.add || "Add")) + (i >= 0 ? " " + (f.il || "") : "");
    var body = h("div", { cls: c("grid") });
    f.fs.forEach(function (q) { body.appendChild(mountField(q, scope, UI.repLabel).wrap); });
    scope.refresh();
    var sumHost = h("div");
    function save(thenInvite) {
      var errs = validateScope(scope, f.fs);
      clear(sumHost);
      if (errs.length) { var b = errSummary(errs); sumHost.appendChild(b); b.focus(); return false; }
      var clean = pruneFields(f.fs, rowVals, ctx.scope.vals);
      if (i >= 0 && list[i].__sent) clean.__sent = true;
      if (i >= 0) list[i] = clean; else list.push(clean);
      close();
      commit(list);
      if (thenInvite) invite(i >= 0 ? i : list.length - 1);
      return true;
    }
    var close;
    var saveT = x.saveT || "Save", cancelT = TX.cancel || "Cancel";
    if (f.ed === "inline") {
      clear(inlineHost);
      var card = h("div", { cls: c("rep-inline") }, [h("h3", { text: title }), sumHost, body]);
      var bar = h("div", { cls: c("bar") }, [btn(cancelT, "plain", function () { close(); }), btn(saveT, "primary", function () { save(false); })]);
      if (x.invite && x.invite.saveSend) bar.appendChild(btn(x.invite.saveSend, "primary", function () { save(true); }));
      card.appendChild(bar);
      inlineHost.appendChild(card);
      close = function () { clear(inlineHost); };
      card.scrollIntoView({ block: "nearest" });
      var ff = focusables(card); if (ff[0]) ff[0].focus();
    } else {
      var m = openModal({ title: title, cls: f.ed === "drawer" ? c("drawer") : c("wide-modal") });
      m.body.appendChild(sumHost);
      m.body.appendChild(body);
      close = function () { closeModal(m); };
      m.foot.appendChild(btn(cancelT, "plain", function () { close(); }));
      if (x.invite && x.invite.saveSend) m.foot.appendChild(btn(x.invite.saveSend, "primary", function () { save(true); }));
      m.foot.appendChild(btn(saveT, "primary", function () { save(false); }));
    }
  }
  draw();
  return { el: el, main: el, set: function () { draw(); }, focus: function () { var b = el.querySelector("button"); if (b) b.focus(); } };
};
W.rep.check = function (f, v) {
  if (f.min && v.length < f.min) return "Please add at least " + f.min + " " + (f.il || "entry");
  return null;
};

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

if (/frame\.html$/.test(location.pathname)) bootFrame(); else boot();
})();
