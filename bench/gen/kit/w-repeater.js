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
