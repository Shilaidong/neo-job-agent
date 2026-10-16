(function () {
var CFG = {"inst":"portal-b@canon","key":"app_portalb_canon","mount":"app","name":"KIT Graduate School","sub":"Apply online","footer":"Kestrel Institute of Technology - Admissions. Need help? Use the chat in the corner.","ui":{"label":"float","nav":"tabs","aria":true,"confirmLeave":true,"repLabel":"float","px":"kx"},"tx":{"save":"Save for later","next":"Save and continue","back":"Previous","submit":"Submit application","pay":"Pay fee","review":"Review and submit","savedMsg":"Draft saved"},"pages":[{"id":"p1","t":"Profile","secs":[{"t":"Personal data","fs":[{"id":"title","k":"select","l":"Salutation","o":["Mr.","Ms.","Mrs.","Dr.","Prof.","Other"]},{"id":"gender","k":"radio","l":"Legal sex","r":1,"o":["Female","Male","Non-binary","I do not wish to disclose"]},{"id":"c4851","k":"sselect","l":"Country / region of birth","r":1,"o":["Australia","Austria","Bangladesh","Belgium","Brazil","Canada","Chile","Denmark","Egypt","Finland","France","Germany","Ghana","Greece","Hong Kong S.A.R.","India","Indonesia","Ireland","Italy","Japan","Kazakhstan","Kenya","Korea, Republic of","Macau S.A.R.","Malaysia","Mexico","Netherlands","New Zealand","Nigeria","Norway","Pakistan","People's Republic of China","Philippines","Poland","Portugal","Russian Federation","Saudi Arabia","Singapore","South Africa","Spain","Sri Lanka","Sweden","Switzerland","Taiwan (Republic of China)","Thailand","Turkey","United Arab Emirates","United Kingdom","United States","Vietnam"]},{"id":"ctl00_5143","k":"text","l":"Place of birth (city)","ph":"City"},{"id":"ctl00_9870","k":"text","l":"Name in native script","ph":"e.g. 陳大文"},{"id":"residenceCountry","k":"sselect","l":"Country / region of nationality","r":1,"o":["Australia","Austria","Bangladesh","Belgium","Brazil","Canada","Chile","Denmark","Egypt","Finland","France","Germany","Ghana","Greece","Hong Kong S.A.R.","India","Indonesia","Ireland","Italy","Japan","Kazakhstan","Kenya","Korea, Republic of","Macau S.A.R.","Malaysia","Mexico","Netherlands","New Zealand","Nigeria","Norway","Pakistan","People's Republic of China","Philippines","Poland","Portugal","Russian Federation","Saudi Arabia","Singapore","South Africa","Spain","Sri Lanka","Sweden","Switzerland","Taiwan (Republic of China)","Thailand","Turkey","United Arab Emirates","United Kingdom","United States","Vietnam"]},{"id":"fld4773","k":"sselect","l":"Dual citizenship (if any)","o":["Australia","Austria","Bangladesh","Belgium","Brazil","Canada","Chile","Denmark","Egypt","Finland","France","Germany","Ghana","Greece","Hong Kong S.A.R.","India","Indonesia","Ireland","Italy","Japan","Kazakhstan","Kenya","Korea, Republic of","Macau S.A.R.","Malaysia","Mexico","Netherlands","New Zealand","Nigeria","Norway","Pakistan","People's Republic of China","Philippines","Poland","Portugal","Russian Federation","Saudi Arabia","Singapore","South Africa","Spain","Sri Lanka","Sweden","Switzerland","Taiwan (Republic of China)","Thailand","Turkey","United Arab Emirates","United Kingdom","United States","Vietnam"]},{"id":"in_7575","k":"date-mask","l":"Date of birth","r":1,"fmt":"DD/MM/YYYY","x":{"minD":"1950-01-01","maxD":"2012-12-31"}},{"id":"preferredName","k":"text","l":"Preferred name","ph":"e.g. Sam"},{"id":"in_6371","k":"text","l":"Forename(s)","r":1,"ph":"Jane Mary"},{"id":"in_9912","k":"text","l":"Surname / Family name (as in passport)","r":1,"ph":"As shown on passport"}]},{"t":"Reach me at","fs":[{"id":"f_6558","k":"check","l":"Mailing address is the same as home address"},{"id":"fld3537","k":"text","l":"Street address","r":1,"w":{"id":"f_6558","v":[false]}},{"id":"mailAddress2","k":"text","l":"Address line 2","w":{"id":"f_6558","v":[false]}},{"id":"fld4497","k":"text","l":"City","r":1,"w":{"id":"f_6558","v":[false]}},{"id":"mRegion","k":"text","l":"State / Province","w":{"id":"f_6558","v":[false]}},{"id":"mZip","k":"text","l":"Postcode","w":{"id":"f_6558","v":[false]},"lm":"ph"},{"id":"fld5737","k":"sselect","l":"Country / Region","r":1,"o":["Australia","Austria","Bangladesh","Belgium","Brazil","Canada","Chile","Denmark","Egypt","Finland","France","Germany","Ghana","Greece","Hong Kong S.A.R.","India","Indonesia","Ireland","Italy","Japan","Kazakhstan","Kenya","Korea, Republic of","Macau S.A.R.","Malaysia","Mexico","Netherlands","New Zealand","Nigeria","Norway","Pakistan","People's Republic of China","Philippines","Poland","Portugal","Russian Federation","Saudi Arabia","Singapore","South Africa","Spain","Sri Lanka","Sweden","Switzerland","Taiwan (Republic of China)","Thailand","Turkey","United Arab Emirates","United Kingdom","United States","Vietnam"],"w":{"id":"f_6558","v":[false]}},{"id":"fld9236","k":"phone","l":"Telephone (mobile)","r":1,"ph":"e.g. +1 201 555 0123","x":{"re":"^\\+?[\\d\\s-]{8,20}$","reMsg":"Use digits, spaces or hyphens; start with + and the country code"}},{"id":"mobile","k":"phone","l":"Other telephone"},{"id":"f_5714","k":"email","l":"Primary email","r":1,"ph":"you@domain.com"},{"id":"email2","k":"email","l":"Other email address","ph":"optional"},{"id":"in_4285","k":"text","l":"Street address","r":1,"x":{"max":40},"lm":"ph"},{"id":"x9759","k":"text","l":"Apartment, suite, district","ph":"optional","x":{"max":40},"lm":"ph"},{"id":"town","k":"text","l":"Town / City","r":1,"ph":"e.g. Springfield"},{"id":"q7064","k":"text","l":"Region"},{"id":"fld3317","k":"text","l":"Postal code","ph":"e.g. 90210","lm":"ph"},{"id":"fld1006","k":"sselect","l":"Country","r":1,"o":["Australia","Austria","Bangladesh","Belgium","Brazil","Canada","Chile","Denmark","Egypt","Finland","France","Germany","Ghana","Greece","Hong Kong S.A.R.","India","Indonesia","Ireland","Italy","Japan","Kazakhstan","Kenya","Korea, Republic of","Macau S.A.R.","Malaysia","Mexico","Netherlands","New Zealand","Nigeria","Norway","Pakistan","People's Republic of China","Philippines","Poland","Portugal","Russian Federation","Saudi Arabia","Singapore","South Africa","Spain","Sri Lanka","Sweden","Switzerland","Taiwan (Republic of China)","Thailand","Turkey","United Arab Emirates","United Kingdom","United States","Vietnam"]}]}]},{"id":"p2","t":"Documents","secs":[{"t":"Passport","fs":[{"id":"q3097","k":"text","l":"Passport no.","r":1,"ph":"A00000000","x":{"upper":true,"max":12}},{"id":"c3944","k":"sselect","l":"Country / region of issue","r":1,"o":["Australia","Austria","Bangladesh","Belgium","Brazil","Canada","Chile","Denmark","Egypt","Finland","France","Germany","Ghana","Greece","Hong Kong S.A.R.","India","Indonesia","Ireland","Italy","Japan","Kazakhstan","Kenya","Korea, Republic of","Macau S.A.R.","Malaysia","Mexico","Netherlands","New Zealand","Nigeria","Norway","Pakistan","People's Republic of China","Philippines","Poland","Portugal","Russian Federation","Saudi Arabia","Singapore","South Africa","Spain","Sri Lanka","Sweden","Switzerland","Taiwan (Republic of China)","Thailand","Turkey","United Arab Emirates","United Kingdom","United States","Vietnam"]},{"id":"ctl00_8319","k":"date-mask","l":"Passport issued on","fmt":"DD.MM.YYYY","x":{"maxD":"2026-09-20","minD":"2010-01-01"}},{"id":"q6899","k":"date-mask","l":"Passport valid until","r":1,"fmt":"DD/MM/YYYY","x":{"minD":"2026-09-21"}}]},{"t":"Emergency contact","fs":[{"id":"phone","k":"phone","l":"Contact person's phone","r":1},{"id":"ctl00_7405","k":"select","l":"Relationship to applicant","r":1,"o":["Parent","Spouse / Partner","Sibling","Other relative","Friend","Other"]},{"id":"emergencyEmail","k":"email","l":"Emergency contact email","ph":"optional"},{"id":"emergencyName","k":"text","l":"Emergency contact name","r":1,"ph":"Full name"}]}]},{"id":"p3","t":"Studies","secs":[{"t":"Education","fs":[{"id":"x9065","k":"rep","l":"Academic qualifications","il":"institution","ed":"drawer","fs":[{"id":"q3808","k":"text","l":"Programme of study","r":1,"ph":"e.g. History"},{"id":"fld4703","k":"text","l":"Degree / qualification title","r":1,"ph":"e.g. BA (Hons)"},{"id":"ctl00_4742","k":"lookup2","l":"School attended","r":1,"refs":{"city":"fld8055","country":"schoolCountry"},"x":{"countries":["Australia","Austria","Bangladesh","Belgium","Brazil","Canada","Chile","Denmark","Egypt","Finland","France","Germany","Ghana","Greece","Hong Kong S.A.R.","India","Indonesia","Ireland","Italy","Japan","Kazakhstan","Kenya","Korea, Republic of","Macau S.A.R.","Malaysia","Mexico","Netherlands","New Zealand","Nigeria","Norway","Pakistan","People's Republic of China","Philippines","Poland","Portugal","Russian Federation","Saudi Arabia","Singapore","South Africa","Spain","Sri Lanka","Sweden","Switzerland","Taiwan (Republic of China)","Thailand","Turkey","United Arab Emirates","United Kingdom","United States","Vietnam"],"t":{}}},{"id":"schoolCountry","k":"sselect","l":"Institution location (country)","r":1,"o":["Australia","Austria","Bangladesh","Belgium","Brazil","Canada","Chile","Denmark","Egypt","Finland","France","Germany","Ghana","Greece","Hong Kong S.A.R.","India","Indonesia","Ireland","Italy","Japan","Kazakhstan","Kenya","Korea, Republic of","Macau S.A.R.","Malaysia","Mexico","Netherlands","New Zealand","Nigeria","Norway","Pakistan","People's Republic of China","Philippines","Poland","Portugal","Russian Federation","Saudi Arabia","Singapore","South Africa","Spain","Sri Lanka","Sweden","Switzerland","Taiwan (Republic of China)","Thailand","Turkey","United Arab Emirates","United Kingdom","United States","Vietnam"]},{"id":"fld8055","k":"text","l":"Institution city"},{"id":"f_3276","k":"text","l":"GPA / average mark"},{"id":"ctl00_5065","k":"select","l":"GPA scale","o":["4.0","4.3","4.5","5.0","10","100","Other"]},{"id":"fld7219","k":"check","l":"I am currently studying here"},{"id":"moi","k":"select","l":"Language of instruction","o":["Chinese (Mandarin / Cantonese)","English","Japanese","Korean","Other language"]},{"id":"in_5626","k":"month-2sel","l":"Enrolled from","r":1},{"id":"eduTo","k":"month-2sel","l":"End date (or expected)","r":1},{"id":"level","k":"sselect","l":"Qualification level","r":1,"o":["Undergraduate (Bachelor)","Postgraduate taught (Master)","Postgraduate research (PhD/MPhil)","Sub-degree (Diploma / Associate)","Non-award / Visiting / Exchange","High school"]}],"sum":["ctl00_4742","level","eduTo"],"min":1,"max":6,"r":1,"add":"Add institution","x":{}}]},{"t":"Tests","fs":[{"id":"x8747","k":"select","l":"Type of English test","r":1,"o":["TOEFL (internet-based)","IELTS (Academic)","Cambridge C1 Advanced / C2 Proficiency","PTE Academic","None / Not yet taken"]},{"id":"x4767","k":"date-mask","l":"Date taken","r":1,"w":{"id":"x8747","v":["TOEFL (internet-based)","IELTS (Academic)","Cambridge C1 Advanced / C2 Proficiency","PTE Academic"]},"fmt":"DD.MM.YYYY","x":{"maxD":"2026-09-20","minD":"2021-01-01"}},{"id":"x8887","k":"text","l":"Total score","r":1,"w":{"id":"x8747","v":["TOEFL (internet-based)","IELTS (Academic)","Cambridge C1 Advanced / C2 Proficiency","PTE Academic"]},"x":{"re":"^\\d{1,3}(\\.\\d{1,2})?$","reMsg":"Enter a number, for example 6.5 or 95"}},{"id":"x7713","k":"text","l":"Listening score","r":1,"w":{"id":"x8747","v":["TOEFL (internet-based)","IELTS (Academic)","Cambridge C1 Advanced / C2 Proficiency","PTE Academic"]},"x":{"re":"^\\d{1,3}(\\.\\d{1,2})?$","reMsg":"Enter a number, for example 6.5 or 95"}},{"id":"listening","k":"text","l":"Reading","r":1,"w":{"id":"x8747","v":["TOEFL (internet-based)","IELTS (Academic)","Cambridge C1 Advanced / C2 Proficiency","PTE Academic"]},"x":{"re":"^\\d{1,3}(\\.\\d{1,2})?$","reMsg":"Enter a number, for example 6.5 or 95"},"lm":"ph"},{"id":"writing","k":"text","l":"Writing","r":1,"w":{"id":"x8747","v":["TOEFL (internet-based)","IELTS (Academic)","Cambridge C1 Advanced / C2 Proficiency","PTE Academic"]},"x":{"re":"^\\d{1,3}(\\.\\d{1,2})?$","reMsg":"Enter a number, for example 6.5 or 95"},"lm":"ph"},{"id":"speaking","k":"text","l":"Speaking score","r":1,"w":{"id":"x8747","v":["TOEFL (internet-based)","IELTS (Academic)","Cambridge C1 Advanced / C2 Proficiency","PTE Academic"]},"x":{"re":"^\\d{1,3}(\\.\\d{1,2})?$","reMsg":"Enter a number, for example 6.5 or 95"}},{"id":"in_2193","k":"text","l":"Test report / registration number","ph":"e.g. 00XX000000XXXX000X","w":{"id":"x8747","v":["TOEFL (internet-based)","IELTS (Academic)","Cambridge C1 Advanced / C2 Proficiency","PTE Academic"]},"lm":"ph"},{"id":"f_1610","k":"radio","l":"Do you have a GRE score?","r":1,"o":["Yes","No"]},{"id":"x4748","k":"date-mask","l":"Date of GRE","r":1,"w":{"id":"f_1610","v":["Yes"]},"fmt":"DD.MM.YYYY","x":{"maxD":"2026-09-20","minD":"2021-01-01"}},{"id":"in_8170","k":"text","l":"GRE Verbal Reasoning","r":1,"ph":"130-170","w":{"id":"f_1610","v":["Yes"]},"x":{"num":[130,170]}},{"id":"f_1507","k":"text","l":"GRE Quant score","r":1,"ph":"130-170","w":{"id":"f_1610","v":["Yes"]},"x":{"num":[130,170]}},{"id":"c4435","k":"text","l":"GRE Analytical Writing","r":1,"ph":"0.0-6.0","w":{"id":"f_1610","v":["Yes"]},"x":{"num":[0,6]},"lm":"ph"}]}]},{"id":"p4","t":"Career","secs":[{"t":"Work experience","fs":[{"id":"ctl00_2769","k":"rep","l":"Employment history","il":"employment record","ed":"drawer","fs":[{"id":"c6081","k":"text","l":"Organisation","r":1},{"id":"workCountry","k":"sselect","l":"Location (country)","r":1,"o":["Australia","Austria","Bangladesh","Belgium","Brazil","Canada","Chile","Denmark","Egypt","Finland","France","Germany","Ghana","Greece","Hong Kong S.A.R.","India","Indonesia","Ireland","Italy","Japan","Kazakhstan","Kenya","Korea, Republic of","Macau S.A.R.","Malaysia","Mexico","Netherlands","New Zealand","Nigeria","Norway","Pakistan","People's Republic of China","Philippines","Poland","Portugal","Russian Federation","Saudi Arabia","Singapore","South Africa","Spain","Sri Lanka","Sweden","Switzerland","Taiwan (Republic of China)","Thailand","Turkey","United Arab Emirates","United Kingdom","United States","Vietnam"]},{"id":"c1961","k":"text","l":"Work location (city)","lm":"ph"},{"id":"fld6540","k":"sselect","l":"Full-time / part-time","o":["Full time employment","Part time employment","Internship / Placement","Volunteer work","Self-employed"]},{"id":"c1806","k":"check","l":"I currently work here"},{"id":"x7305","k":"month-2sel","l":"Date started","r":1},{"id":"f_7700","k":"month-mask","l":"To","r":1,"w":{"id":"c1806","v":[false]},"fmt":"MM/YYYY"},{"id":"c7645","k":"textarea","l":"Main duties","ph":"Describe your main responsibilities","x":{"max":600,"count":true,"rows":4,"wide":true},"wide":1},{"id":"f_5608","k":"text","l":"Role","r":1,"ph":"e.g. Analyst"}],"sum":["c6081","f_5608","x7305"],"min":0,"max":6,"add":"Add employment record","x":{}}]}]},{"id":"p5","t":"Application","secs":[{"t":"Programme choice","fs":[{"id":"x6987","k":"radio","l":"Do you have any unspent criminal convictions?","r":1,"o":["Yes","No"]},{"id":"fld7150","k":"sselect","l":"Main source of finance","r":1,"o":["Personal savings","Parents / Family","Company sponsored","Scholarship - government","Scholarship - university","Bank loan","Other"]},{"id":"in_1394","k":"sselect","l":"Course","r":1,"o":["MSc Computer Science","MSc Computing (Conversion)","MSc Artificial Intelligence","MSc Software Engineering","MSc Cyber Security","MSc Electrical and Electronic Engineering","MSc Computer Engineering","MSc Robotics and Autonomous Systems","MSc Mechanical Engineering","MSc Statistics","MSc Data Science","MSc Data Science and Analytics","MSc Applied Mathematics","MSc Physics","MSc Finance","MSc Financial Technology","MSc Business Analytics","MSc Management","MA Education","MA TESOL","MA Applied Linguistics"]},{"id":"c1883","k":"radio","l":"Apply for scholarship?","r":1,"o":["Yes","No"]},{"id":"ctl00_3113","k":"checks","l":"Languages you speak","r":1,"o":["Chinese - Cantonese","Chinese - Mandarin (Putonghua)","Chinese - Min Nan / Hokkien","English","French","German","Italian","Japanese","Korean","Russian","Spanish","Other"],"x":{"wide":true},"wide":1},{"id":"startTerm","k":"radio","l":"Admission term","r":1,"o":["January 2027","September 2027","January 2028","September 2028"]},{"id":"f_3840","k":"radio","l":"Study mode","r":1,"o":["Full-time","Part-time"]},{"id":"c9984","k":"select","l":"How did you hear about us?","o":["University website","Education agent","Education fair","Friend or family","Social media","Rankings","Other"]}]},{"t":"Statement","fs":[{"id":"f_5219","k":"text","l":"Area of interest","x":{"max":80,"wide":true},"wide":1},{"id":"in_6848","k":"textarea","l":"Why do you want to study this programme?","r":1,"x":{"max":1500,"count":true,"rows":12,"ascii":true,"wide":true},"wide":1}]},{"t":"Attachments","fs":[{"id":"in_4950","k":"file","l":"Academic transcript","r":1,"x":{"types":["pdf"],"maxKB":2048,"plainTrigger":true,"accept":".pdf"}},{"id":"q6804","k":"file","l":"Passport copy","r":1,"x":{"types":["pdf"],"maxKB":2048,"plainTrigger":true,"accept":".pdf"}},{"id":"in_9932","k":"file","l":"CV / Résumé","r":1,"x":{"types":["pdf"],"maxKB":2048,"plainTrigger":true,"accept":".pdf"}}]}]}],"rev":{"t":"Declaration and signature","intro":"Please read the statements below carefully. They must be completed by the applicant in person.","cs":["I authorise the University to verify my qualifications with the awarding institutions.","I have read and agree to the Terms and Conditions and the Privacy Notice.","I declare that the information given in this application is true, complete and accurate to the best of my knowledge."],"ids":["c1","c2","consent3"],"ck":"native","sigId":"s_77","sigL":"Type your full legal name as your electronic signature","pad":false,"cap":false,"fee":"A non-refundable application fee of 75.00 will be charged to your card.","need":"You must confirm every statement and sign before submitting.","doneT":"Application submitted","doneM":"Thank you. Your application has been submitted and can no longer be edited."},"db":{"inst":[["National Taiwan University","Taipei","Taiwan (Republic of China)","100000"],["National Taiwan Normal University","Taipei","Taiwan (Republic of China)","107919"],["National Taiwan University of Science and Technology","Taipei","Taiwan (Republic of China)","115838"],["National Cheng Kung University","Tainan","Taiwan (Republic of China)","123757"],["National Chengchi University","Taipei","Taiwan (Republic of China)","131676"],["National Chung Cheng University","Chiayi","Taiwan (Republic of China)","139595"],["National Chung Hsing University","Taichung","Taiwan (Republic of China)","147514"],["National Tsing Hua University","Hsinchu","Taiwan (Republic of China)","155433"],["National Yang Ming Chiao Tung University","Hsinchu","Taiwan (Republic of China)","163352"],["National Central University","Taoyuan","Taiwan (Republic of China)","171271"],["National Sun Yat-sen University","Kaohsiung","Taiwan (Republic of China)","179190"],["Tsinghua University","Beijing","People's Republic of China","187109"],["Peking University","Beijing","People's Republic of China","195028"],["Zhejiang University","Hangzhou","People's Republic of China","202947"],["Zhejiang University of Technology","Hangzhou","People's Republic of China","210866"],["Zhejiang Gongshang University","Hangzhou","People's Republic of China","218785"],["Zhejiang Sci-Tech University","Hangzhou","People's Republic of China","226704"],["Hangzhou Normal University","Hangzhou","People's Republic of China","234623"],["Fudan University","Shanghai","People's Republic of China","242542"],["Shanghai Jiao Tong University","Shanghai","People's Republic of China","250461"],["Nanjing University","Nanjing","People's Republic of China","258380"],["Sun Yat-sen University","Guangzhou","People's Republic of China","266299"],["Wuhan University","Wuhan","People's Republic of China","274218"],["Xi'an Jiaotong University","Xi'an","People's Republic of China","282137"],["University of Electronic Science and Technology of China","Chengdu","People's Republic of China","290056"],["Xidian University","Xi'an","People's Republic of China","297975"],["The University of Hong Kong","Hong Kong","Hong Kong S.A.R.","305894"],["The Chinese University of Hong Kong","Hong Kong","Hong Kong S.A.R.","313813"],["The Hong Kong University of Science and Technology","Hong Kong","Hong Kong S.A.R.","321732"],["The Hong Kong Polytechnic University","Hong Kong","Hong Kong S.A.R.","329651"],["City University of Hong Kong","Hong Kong","Hong Kong S.A.R.","337570"],["University of Macau","Macau","Macau S.A.R.","345489"],["The University of Manchester","Manchester","United Kingdom","353408"],["Manchester Metropolitan University","Manchester","United Kingdom","361327"],["University of Salford","Manchester","United Kingdom","369246"],["University of Leeds","Leeds","United Kingdom","377165"],["University of Edinburgh","Edinburgh","United Kingdom","385084"],["University College London","London","United Kingdom","393003"],["Imperial College London","London","United Kingdom","400922"],["King's College London","London","United Kingdom","408841"],["London School of Economics and Political Science","London","United Kingdom","416760"],["London Business School","London","United Kingdom","424679"],["London South Bank University","London","United Kingdom","432598"],["University of Oxford","Oxford","United Kingdom","440517"],["University of Cambridge","Cambridge","United Kingdom","448436"],["University of Warwick","Coventry","United Kingdom","456355"],["Kyoto University","Kyoto","Japan","464274"],["Kyoto Institute of Technology","Kyoto","Japan","472193"],["Kyoto Sangyo University","Kyoto","Japan","480112"],["The University of Tokyo","Tokyo","Japan","488031"],["Osaka University","Osaka","Japan","495950"],["Seoul National University","Seoul","Korea, Republic of","503869"],["National University of Singapore","Singapore","Singapore","511788"],["Nanyang Technological University","Singapore","Singapore","519707"],["University of Melbourne","Melbourne","Australia","527626"],["University of Sydney","Sydney","Australia","535545"],["University of Toronto","Toronto","Canada","543464"],["University of British Columbia","Vancouver","Canada","551383"],["Massachusetts Institute of Technology","Cambridge","United States","559302"],["Stanford University","Stanford","United States","567221"],["University of California, Berkeley","Berkeley","United States","575140"],["University of California, Los Angeles","Los Angeles","United States","583059"],["University of Michigan - Ann Arbor","Ann Arbor","United States","590978"],["Carnegie Mellon University","Pittsburgh","United States","598897"],["ETH Zurich","Zurich","Switzerland","606816"],["Technical University of Munich","Munich","Germany","614735"],["Delft University of Technology","Delft","Netherlands","622654"],["KU Leuven","Leuven","Belgium","630573"]]}};
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

if (/frame\.html$/.test(location.pathname)) bootFrame(); else boot();
})();
