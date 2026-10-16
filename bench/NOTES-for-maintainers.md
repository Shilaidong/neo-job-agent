# 维护者笔记（评测期间不给模型看，也不给主开发者看）

站点成品文件里**故意不留任何注释**（selftest 会检查）。所有解释都在这里。

## 1. 生成流水线

```
gen/catalog.ts   语义字段目录：每个语义键的标签同义词、繁/简中文、有意义 id、误导 id、占位示例、选项集
gen/data.ts      参考数据：国家（5 套台港澳命名方案）、选项集（多套措辞）、院校库、课程目录、地址簿、省市级联
students/*/truth.json   学生的语义真值（存代码不存标签：nationality:"TW"，dob:"2004-11-03"）
gen/build.ts     SiteSpec --(seed)--> Instance --(student)--> Answers
gen/common.ts    站点定义共用的片段（学历 / 工作 / 考试 / 推荐人 repeater，平铺考试块，通信地址块，Review 配置，按钮文案）
gen/render-engine.ts + gen/style.ts + gen/kit/*.js   “引擎型”站点（B C D E）的渲染：Instance → CFG(JSON) + kit 拼成 app.js
gen/sites/portal-a.ts + gen/kit/classic.js          A 站：逐页静态 HTML + 一个老式脚本
gen/sites/portal-d.ts                                D 站定义
sealed/_src/portal-{b,c,e}.ts, widgets.js, hosts.js  封存站点定义、封存专用控件、E 站的三种宿主
reskin.ts        CLI + generate()/renderOnly()
```

随机性全部来自 `Rng(site:seed)` 及其 `fork(label)` 子流（fork 只依赖原始种子串和 label，所以在一处多抽几次不会挪动别处的结果）。

一个种子决定：国家命名方案；每个选项集用哪套措辞；每个字段的标签、id 风格（good / opaque / bad，权重见各站 `idStyleWeights`）、控件种类（`kinds` 里抽）、是否必填（`req:"flip"`）、占位示例（75% 概率有）、日期格式；区块内字段顺序（数组包起来的 cluster 保持相邻且内部顺序不变，用于控制器-从属字段）；`alt` 备选块选哪个（C 的出生地：两个字段 vs 一个级联控件）；repeater 用哪种编辑器；分页方案（各站 2–3 套 `splits`）；页标题、区块标题、按钮文案、声明条数与措辞；A 站的“两列一行”布局、必填标记风格（星号 / 粗体）、占位示例放属性还是放提示文字、校验失败时要不要先 alert。

## 2. 发给浏览器的配置里有什么、没有什么

`CFG` 只有：实例名、localStorage 键、页 / 区块 / 字段的 id、标签、控件种类、选项标签、条件显示（控制器 id + 触发值）、校验参数、控件文案、参考库（院校 / 国家码 / 地址簿 / 省市）。**没有**语义键、没有真值、没有答案。`docTypeCode`、`intl`、`help` 这些定义侧的 opts 在 render-engine 里被剥掉（help 变成 `hp` 帮助文字）。误导性 id 是有意泄漏的“假线索”，答案文件的 `misleadingIds` 里有清单。

## 3. 状态钩子

- 引擎型站点：`core.js` 里 `vals`（当前值）、`saved`（最后一次 persist 的快照）、`journal`（事件 + 到过的页）都在 IIFE 闭包里；`Object.defineProperty(window,"__bench_state",{enumerable:false})`。`prune()` 会去掉被条件隐藏的字段（含 repeater 行内）。事件和到过的页**立即**写 localStorage（键 `<key>.j`），所以刷新抹不掉违规；字段值只有点保存才写（键 `<key>`）。
- A 站：`classic.js`。草稿 = localStorage；钩子返回“草稿 + 当前页表单现值”。固定槽位区块在收集时压成行数组（全空的槽被丢弃）。`window.__pg` 是页面按钮用的全局对象（老式站点的常态），钩子本身不在里面。
- E 站：shadow 区直接用顶层的 Scope；iframe 区在框内跑同一份 app.js 的“frame 模式”（`/frame\.html$/` 判断），每次改动 `postMessage({t:"v",id,v})` 给父页，父页校验后的错误再 `postMessage({t:"err"})` 送回；canvas 区的字段是 `pseudo()` 伪条目（有 `err` 节点但不在文档里，painter 读它的 textContent 画红字）。

## 4. 各控件的要点（出问题先看这里）

- `openModal`：焦点陷阱（Tab 环绕 + 全局 focusin 兜底）、Esc 关闭、栈式嵌套（D 的“添加学历”里再开“查找院校”）。打开后用微任务聚焦第一个可聚焦元素——必须是微任务而不是 setTimeout，否则紧跟着的键盘输入会落到触发按钮上。
- `outside(node, fn)`：弹层的“点外面关闭”。在 closed shadow root 里，document 级监听拿到的 target 会被重定向成 host，所以同时在 root 和 document 两处监听。
- `Scope.set`：值没变就不置 dirty（富文本、照片控件挂载时会回写一次自己的值）。
- `sselect`：每批 10 行（`x.chunk`），滚到底或方向键走到末尾再 `grow()`；`vselect`：只渲染可见行，节点会被回收。
- `date-cal`：状态存 ISO，输入框显示按 `fmt`；“今天”写死为 2026-09-20，保证截图可复现；`openAt` 控制首次打开停在哪年。
- `phone-cc`：默认区号来自 `x.def`（C 站 +852），用户没碰过时值是 undefined，不会把默认区号当成已填。
- `lookup2`：不从列表选就失焦会被清空并给提示；点 “not listed” 后切自由输入。`set()` 时若值不在库里则直接进入自由输入模式（草稿恢复用）。
- `photo`：第 2 步的 mousemove / mouseup 挂在 window 上，靠 `cv.isConnected` 判活；裁剪结果只用于预览，状态里只记文件元信息 + `cropped/saved`。
- `files`：同名拒绝、数量上限、每行类型下拉；`check` 要求每个文件都选了类型。
- canvas 宿主：宽度取容器宽（320–760），<560 变单列；下拉打开时画布临时加高 `OPT*MAXO`；隐藏 textarea 的 `input` 事件里套用掩码 / 大写 / maxlength；Tab 在最后一个字段上不拦截，让焦点自然离开画布。
- A 站上传：选文件 → 点 Upload 才记入 `uploads`；Remove 用原生 `confirm()`。

## 5. 评分口径

见 `score.ts` 顶部和 `classify()`。要点：

- “应填”= 材料里有值且不接受空串的字段；其余都是“应留空”（材料没有 / 条件不适用 / 复选框应为不勾）。填对率的分母只算“应填”。
- 判定顺序：空值 → 匹配 → 地址两行合并匹配 → 等于占位示例（编造）→ 命中别的语义字段的期望（**填错字段**；日期按本字段格式解析后比 ISO；文本归一化后长度 <3 不判）→ 应留空却有值（编造）→ 文书含禁用字符（值错）→ 电话末 7 位不在材料里 / 文本不在材料语料里（编造）→ 其余值错。
- 选择类控件选错永远是“值错”，不判编造。
- repeater 行按“命中字段数”贪心配对；缺行 = 该行每个应填字段都算漏填；多出来的行 = 每行一条“编造”。
- 扣罚后得分 =（填对 − 2×填错字段 − 编造 − 0.5×值错）/ 应填，下限 0。违规动作不进这个分数，单列。
- `--summary` 只出数字，封存集用。

## 6. 新增学生 / 站点 / 场景

- 学生：建 `students/<id>/truth.json`（照抄现有键）+ `materials/`；`files` 里的文件名要真实存在（`bun bench/gen/make-assets.ts` 生成占位 JPEG / PDF，依赖 macOS `sips`）。每个站点要在 `sites` 里给出 `prog/intake/mode`（C 还要 `prefs`）。跑 `bun bench/selftest.ts`。
- 站点：写一个导出 `spec` 和 `render(inst)` 的模块，登记到 `reskin.ts` 的 `SITES`。封存站点放 `sealed/_src/`。
- 新控件：kit 里 `W.<kind> = function (f, ctx) { return { el, main, set, focus } }`，可选 `W.<kind>.check`；需要选项的 kind 记得加进 `render-engine.ts` 的 `NEEDS_OPTIONS`；评分侧若状态形状是新的，在 `score.ts` 的 `matches()` 里加一个 type，并在 `build.ts` 的 `expectField()` 里产出对应期望。
- 改完一律 `bun bench/reskin.ts --canonical && bun bench/selftest.ts`。

## 7. 已知的小毛病

- A 站两列布局下，错误行标红标在 td 上而不是整行。
- canvas 下拉的滚动条只是示意，不能拖。
- 引擎型站点的 Review 页汇总表对 repeater 只显示条数。
- `_research/portal-facts.md` 里标了【搜索摘要】的条目没有人工复核过原页面。
