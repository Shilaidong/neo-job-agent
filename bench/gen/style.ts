// Stylesheet for engine-driven portals. One template, several themes; class prefix differs per site.

export interface Theme {
  px: string;
  font: string;
  bg: string;
  panel: string;
  ink: string;
  accent: string;
  accentInk: string;
  line: string;
  radius: number;
  headBg: string;
  headInk: string;
  dense?: boolean;
  underline?: boolean; // underline-style inputs (material-like)
}

export function css(t: Theme): string {
  const p = "." + t.px + "-";
  const r = t.radius;
  const inputBase = t.underline
    ? `border:0;border-bottom:1px solid ${t.line};border-radius:0;background:transparent;padding:18px 2px 6px;`
    : `border:1px solid ${t.line};border-radius:${r}px;background:#fff;padding:${t.dense ? 5 : 8}px 10px;`;
  return `
*{box-sizing:border-box}
html,body{margin:0;padding:0}
body{font:${t.dense ? 13 : 15}px/1.45 ${t.font};color:${t.ink};background:${t.bg}}
${p}head{background:${t.headBg};color:${t.headInk};padding:14px 24px;display:flex;align-items:baseline;gap:16px}
${p}brand{font-size:20px;font-weight:700}
${p}sub{opacity:.85;flex:1}
${p}langs{display:flex;gap:4px}
${p}lang{padding:2px 8px;border:1px solid currentColor;border-radius:${r}px;cursor:pointer;font-size:12px;opacity:.7}
${p}lang${p}on{opacity:1;background:${t.headInk};color:${t.headBg}}
${p}shell{max-width:1080px;margin:18px auto;padding:0 16px}
${p}shell${p}nav-side{display:grid;grid-template-columns:220px 1fr;gap:20px;align-items:start}
${p}nav{display:flex;gap:2px;flex-wrap:wrap;margin-bottom:14px}
${p}nav-side>${p}nav{flex-direction:column;background:${t.panel};border:1px solid ${t.line};border-radius:${r}px;padding:6px}
${p}nav-item{padding:9px 14px;cursor:pointer;color:${t.ink};text-decoration:none;border-radius:${r}px;position:relative;outline-offset:2px}
${p}nav-tabs ${p}nav,${p}nav-hash ${p}nav{border-bottom:2px solid ${t.line}}
${p}nav-tabs ${p}nav-item,${p}nav-hash ${p}nav-item{border-radius:${r}px ${r}px 0 0;margin-bottom:-2px;border-bottom:2px solid transparent}
${p}nav-item${p}on{color:${t.accent};font-weight:600;border-bottom-color:${t.accent};background:${t.panel}}
${p}nav-item${p}seen::after{content:"";display:inline-block;width:7px;height:7px;border-radius:50%;background:#2e9d5b;margin-left:6px}
${p}nav-item${p}nav-bad::after{background:#c0392b}
${p}badge{background:#c0392b;color:#fff;border-radius:10px;font-size:11px;padding:1px 7px;margin-left:6px;font-weight:600}
${p}main{min-width:0}
${p}page{background:${t.panel};border:1px solid ${t.line};border-radius:${r}px;padding:${t.dense ? 14 : 24}px}
${p}page-t{margin:0 0 12px;font-size:22px}
${p}sec{margin:0 0 22px}
${p}sec-t{font-size:16px;margin:0 0 6px;padding-bottom:6px;border-bottom:1px solid ${t.line}}
${p}sec-i{margin:4px 0 10px;opacity:.8}
${p}grid{display:grid;grid-template-columns:1fr 1fr;gap:${t.dense ? 8 : 16}px 24px}
${p}grid>${p}wide,${p}grid>${p}k-rep,${p}grid>${p}k-rte,${p}grid>${p}k-files,${p}grid>${p}k-order,${p}grid>${p}k-textarea,${p}grid>${p}k-cascade,${p}grid>${p}sh,${p}grid>${p}frame,${p}grid>${p}cv-w{grid-column:1/-1}
${p}fld{position:relative;min-width:0}
${p}lbl{display:block;font-weight:600;margin-bottom:4px;font-size:.93em}
${p}req{color:#c0392b}
${p}inp{width:100%;font:inherit;color:inherit;${inputBase}}
${p}inp:focus,${p}ss-face:focus,${p}pcc-face:focus,${p}rte-ed:focus,${p}drop:focus,[tabindex]:focus-visible{outline:2px solid ${t.accent};outline-offset:1px}
textarea${p}inp{min-height:90px;resize:vertical}
${p}float ${p}flbl{position:absolute;left:4px;top:16px;pointer-events:none;transition:all .12s;opacity:.7}
${p}float ${p}inp:focus+${p}flbl,${p}float ${p}inp:not(:placeholder-shown)+${p}flbl,${p}float ${p}ss${p}has+${p}flbl{top:0;font-size:11px;opacity:1;color:${t.accent}}
${p}float ${p}ss:focus-within+${p}flbl{top:0;font-size:11px;opacity:1;color:${t.accent}}
${p}vs-space ${p}ss-opt{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
${p}help{font-size:12px;opacity:.75;margin-top:3px}
${p}err{color:#b42318;font-size:12.5px;min-height:0;margin-top:3px}
${p}bad ${p}inp,${p}bad ${p}ss-face,${p}bad ${p}rte-ed{border-color:#b42318}
${p}errsum{border:2px solid #b42318;background:#fff4f2;border-radius:${r}px;padding:12px 16px;margin:0 0 16px}
${p}errsum-t{font-weight:700;margin-bottom:6px}
${p}errsum ul{margin:0;padding-left:18px}
${p}errsum a{color:#b42318}
${p}bar{display:flex;gap:10px;justify-content:flex-end;margin-top:18px;flex-wrap:wrap}
${p}btn{font:inherit;padding:8px 16px;border-radius:${r}px;border:1px solid ${t.line};background:#fff;color:${t.ink};cursor:pointer;display:inline-block}
${p}btn:disabled{opacity:.45;cursor:not-allowed}
${p}btn-primary{background:${t.accent};border-color:${t.accent};color:${t.accentInk}}
${p}btn-warn{background:#fff;border-color:#b54708;color:#b54708}
${p}link{color:${t.accent};text-decoration:underline;cursor:pointer}
${p}muted{opacity:.6}
${p}radios{display:flex;gap:16px;flex-wrap:wrap;padding:4px 0}
${p}trio{display:flex;gap:8px}
${p}trio>*{flex:1;min-width:0}
${p}count{font-size:12px;text-align:right;opacity:.75}
${p}count${p}over{color:#b42318;font-weight:700;opacity:1}
${p}backdrop{position:fixed;inset:0;background:rgba(16,24,40,.5);display:flex;align-items:flex-start;justify-content:center;z-index:1000;overflow:auto;padding:40px 12px}
${p}modal{background:#fff;color:${t.ink};border-radius:${Math.max(r, 4)}px;min-width:340px;max-width:520px;width:100%;box-shadow:0 20px 50px rgba(0,0,0,.3);outline:0}
${p}wide-modal{max-width:760px}
${p}drawer{position:fixed;right:0;top:0;bottom:0;max-width:520px;border-radius:0;display:flex;flex-direction:column;overflow:auto}
${p}modal-head{display:flex;justify-content:space-between;align-items:center;padding:14px 18px;border-bottom:1px solid ${t.line}}
${p}modal-title{font-weight:700;font-size:17px}
${p}modal-x{cursor:pointer;font-size:22px;line-height:1;padding:0 6px}
${p}modal-body{padding:16px 18px}
${p}modal-foot{padding:12px 18px;border-top:1px solid ${t.line};display:flex;justify-content:flex-end;gap:10px}
${p}toasts{position:fixed;right:16px;bottom:16px;z-index:2000;display:flex;flex-direction:column;gap:8px}
${p}toast{background:#12372a;color:#fff;padding:10px 16px;border-radius:${r}px;box-shadow:0 6px 20px rgba(0,0,0,.25)}
${p}toast-bad{background:#7a271a}
${p}rep-t{width:100%;border-collapse:collapse;margin:6px 0}
${p}rep-t th,${p}rep-t td{border:1px solid ${t.line};padding:6px 8px;text-align:left;vertical-align:top;font-size:.93em}
${p}rep-t th{background:${t.bg}}
${p}rep-empty{padding:12px;border:1px dashed ${t.line};border-radius:${r}px;opacity:.75}
${p}rep-add{margin-top:8px}
${p}rep-inline{border:1px solid ${t.accent};border-radius:${r}px;padding:14px;margin-top:12px;background:${t.bg}}
${p}rep-inline h3{margin:0 0 10px}
${p}sent{color:#2e9d5b;font-weight:600}
${p}lookup{display:flex;gap:8px;align-items:center}
${p}lookup ${p}inp{flex:1;cursor:pointer;background:${t.bg}}
${p}lk-bar{display:grid;grid-template-columns:auto 1fr 200px auto;gap:8px;align-items:center;margin-bottom:10px}
${p}lk-bar ${p}lbl{margin:0}
${p}lk-cant{margin:14px 0 8px}
${p}lk-manual{border-top:1px dashed ${t.line};padding-top:10px}
${p}pager{display:flex;align-items:center;gap:8px;justify-content:center}
${p}file-raw{position:absolute;width:1px;height:1px;opacity:0;overflow:hidden}
${p}file{display:flex;gap:10px;align-items:center;flex-wrap:wrap}
${p}drop{border:2px dashed ${t.line};border-radius:${r}px;padding:16px;text-align:center;cursor:pointer}
${p}drop${p}on{border-color:${t.accent};background:${t.bg}}
${p}photo{display:flex;gap:14px;align-items:center}
${p}ph-thumb{width:96px;height:96px;border:1px solid ${t.line};border-radius:${r}px;display:flex;align-items:center;justify-content:center;overflow:hidden;background:${t.bg};font-size:12px;text-align:center}
${p}ph-thumb img{width:100%;height:100%;object-fit:cover}
${p}ph-prev{width:200px;height:200px;border:1px solid ${t.line}}
${p}steps{display:flex;gap:6px;margin-bottom:12px}
${p}step{padding:4px 10px;border-radius:12px;background:${t.bg};font-size:12px}
${p}step${p}on{background:${t.accent};color:${t.accentInk}}
${p}crop-cv{display:block;cursor:move;margin:0 auto 8px}
${p}rte{border:1px solid ${t.line};border-radius:${r}px;background:#fff}
${p}rte-bar{display:flex;gap:2px;border-bottom:1px solid ${t.line};padding:4px;background:${t.bg}}
${p}rte-b{padding:2px 9px;cursor:pointer;border-radius:3px;user-select:none}
${p}rte-b:hover{background:${t.line}}
${p}rte-ed{min-height:170px;max-height:360px;overflow:auto;padding:10px;outline:0;white-space:pre-wrap}
${p}rte ${p}count{padding:2px 8px}
${p}ss{position:relative}
${p}ss-face,${p}pcc-face{${inputBase}display:flex;justify-content:space-between;align-items:center;cursor:pointer;min-height:${t.dense ? 28 : 38}px;user-select:none}
${p}pop{position:absolute;left:0;right:0;top:100%;z-index:50;background:#fff;border:1px solid ${t.line};border-radius:${r}px;box-shadow:0 10px 30px rgba(0,0,0,.18);margin-top:2px;min-width:240px}
${p}ss-q{border-radius:0;border-width:0 0 1px 0}
${p}ss-list{max-height:${10 * 32}px;overflow:auto}
${p}ss-opt{padding:6px 10px;cursor:pointer;min-height:30px}
${p}ss-opt${p}act{background:${t.bg}}
${p}ss-opt${p}sel{font-weight:700}
${p}ss-more{font-size:12px;opacity:.7;padding:4px 10px}
${p}vs-port{overflow:auto;position:relative}
${p}vs-space{position:relative}
${p}tree-pop{max-height:320px;overflow:auto}
${p}tree-row{padding:6px 8px;cursor:pointer;display:flex;gap:6px}
${p}tree-row${p}act{background:${t.bg}}
${p}tree-car{width:12px;display:inline-block}
${p}chips-box{${inputBase}display:flex;flex-wrap:wrap;gap:6px;cursor:text;min-height:${t.dense ? 28 : 38}px}
${p}chips-q{border:0;outline:0;font:inherit;flex:1;min-width:80px;background:transparent}
${p}chip{background:${t.bg};border:1px solid ${t.line};border-radius:14px;padding:1px 4px 1px 10px;display:inline-flex;gap:6px;align-items:center}
${p}chip-x{cursor:pointer;font-weight:700;padding:0 4px}
${p}dgroup{display:flex;gap:10px;flex-wrap:wrap}
${p}dopt{display:flex;gap:8px;align-items:center;cursor:pointer;padding:6px 12px;border:1px solid ${t.line};border-radius:${r}px;user-select:none}
${p}dopt${p}on{border-color:${t.accent};background:${t.bg}}
${p}drad{width:16px;height:16px;border-radius:50%;border:2px solid ${t.line};display:inline-block;flex:none}
${p}on>${p}drad{border-color:${t.accent};background:radial-gradient(${t.accent} 45%,#fff 50%)}
${p}dchk{width:18px;height:18px;border:2px solid ${t.line};border-radius:3px;display:inline-block;cursor:pointer;flex:none;vertical-align:middle}
${p}dchk${p}on,${p}on>${p}dchk{background:${t.accent};border-color:${t.accent};box-shadow:inset 0 0 0 3px #fff}
${p}switch{width:40px;height:22px;border-radius:11px;background:${t.line};display:inline-block;position:relative;cursor:pointer}
${p}switch${p}on{background:${t.accent}}
${p}knob{position:absolute;top:2px;left:2px;width:18px;height:18px;border-radius:50%;background:#fff;transition:left .12s}
${p}on>${p}knob{left:20px}
${p}consent{display:flex;gap:10px;align-items:flex-start;margin:8px 0;cursor:pointer}
${p}cap{border:1px solid ${t.line};border-radius:${r}px;padding:12px;display:inline-flex;gap:10px;align-items:center;margin:10px 0;background:#fafafa}
${p}cal-w{position:relative;display:flex;align-items:center}
${p}cal-w ${p}inp{cursor:pointer}
${p}cal-ico{margin-left:-26px;cursor:pointer;opacity:.6}
${p}cal{padding:8px;width:280px;right:auto}
${p}cal-h{display:flex;justify-content:space-between;align-items:center;margin-bottom:6px}
${p}cal-nav,${p}cal-title{cursor:pointer;padding:2px 10px;border-radius:${r}px;user-select:none}
${p}cal-title{font-weight:700}
${p}cal-nav:hover,${p}cal-title:hover{background:${t.bg}}
${p}cal-g{display:grid;gap:2px}
${p}cal-d{grid-template-columns:repeat(7,1fr)}
${p}cal-m,${p}cal-y{grid-template-columns:repeat(3,1fr)}
${p}cal-c{text-align:center;padding:6px 0;cursor:pointer;border-radius:${r}px;user-select:none}
${p}cal-c:hover{background:${t.bg}}
${p}cal-dow{text-align:center;font-size:11px;opacity:.6}
${p}cal-dis{opacity:.3;cursor:not-allowed;text-decoration:line-through}
${p}cal-today{outline:1px dashed ${t.accent}}
${p}cal-c${p}sel{background:${t.accent};color:${t.accentInk}}
${p}cal-c${p}act{box-shadow:inset 0 0 0 2px ${t.accent}}
${p}cal-f{text-align:right;margin-top:4px}
${p}pcc{display:flex;gap:6px;position:relative}
${p}pcc-face{flex:0 0 92px}
${p}order-add{display:flex;gap:8px;margin-bottom:8px}
${p}order-r{display:flex;gap:10px;align-items:center;border:1px solid ${t.line};border-radius:${r}px;padding:6px 10px;margin-bottom:4px;background:#fff}
${p}order-h{cursor:grab;opacity:.6}
${p}order-t{flex:1}
${p}order-b{cursor:pointer;padding:0 6px;opacity:.7}
${p}dragging{opacity:.5}
${p}drop-t{border-color:${t.accent};box-shadow:0 0 0 2px ${t.accent}}
${p}sig{border:1px solid ${t.line};background:#fff;display:block;cursor:crosshair}
${p}rev{width:100%;border-collapse:collapse}
${p}rev th{text-align:left;width:40%;font-weight:600;padding:4px 8px;border-bottom:1px solid ${t.line};vertical-align:top}
${p}rev td{padding:4px 8px;border-bottom:1px solid ${t.line};word-break:break-word}
${p}rev-bad td,${p}rev-bad th{background:#fff4f2}
${p}edit{font-size:13px;font-weight:400;margin-left:8px}
${p}cookie{position:fixed;left:0;right:0;bottom:0;background:#1d2939;color:#fff;padding:12px 20px;display:flex;gap:12px;align-items:center;z-index:900}
${p}cookie span{flex:1}
${p}foot{max-width:1080px;margin:10px auto 40px;padding:0 16px;font-size:12px;opacity:.6}
${p}frame{width:100%;border:0;min-height:320px;display:block}
${p}cv-w{position:relative;max-width:100%;overflow:hidden}
${p}cv{display:block;cursor:text}
${p}cv-ta{position:absolute;width:2px;height:20px;opacity:0;border:0;padding:0;margin:0;resize:none;overflow:hidden;pointer-events:none}
@media(max-width:760px){${p}grid{grid-template-columns:1fr}${p}shell${p}nav-side{grid-template-columns:1fr}}
`;
}
