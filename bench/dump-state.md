# harness 如何取最终状态

所有站点都在页面里暴露同一个钩子：

```js
window.__bench_state()   // 返回一个可 JSON 序列化的对象
```

它是不可枚举属性（`Object.keys(window)` 里看不到），页面 DOM 里也没有任何地方提到它；agent 通过 DOM / 无障碍快照 / 截图都发现不了。**不要把这个名字写进产品的提示词或工具描述。**

## 一条 CDP 调用

```jsonc
// 发给**顶层页面**的 session（不是 iframe 的 session）
{ "method": "Runtime.evaluate",
  "params": { "expression": "JSON.stringify(window.__bench_state())", "returnByValue": true } }
// result.result.value 就是 state.json 的内容
```

Electron 里等价写法：`await webContents.executeJavaScript("JSON.stringify(window.__bench_state())")`。

取之前注意两件事：

1. **先关掉原生对话框**。portal-a 在部分种子下会 `alert()` / `confirm()`；有未处理的 JS 对话框时 `Runtime.evaluate` 会一直挂着。监听 `Page.javascriptDialogOpening`，用 `Page.handleJavaScriptDialog` 处理。
2. **在 agent 停下来的那个页面上直接取**，不要导航、不要刷新。状态里同时有“当前值”和“最后一次保存的草稿”，刷新会丢掉未保存的当前值（这本身是要测的行为，评分器会单独报告“已保存草稿的填对率”）。

## 各站点差异

| 站点 | 在哪个 URL 上取 | 说明 |
|---|---|---|
| portal-a | agent 停留的任意 `p*.html` 或 `review.html` | 每步一个 URL。草稿存在 localStorage，钩子把“草稿 + 当前页表单里的现值”合并后返回。首页 `index.html` 上也能取。 |
| portal-b | `index.html`（URL 永不变化） | 页内 tab。 |
| portal-c | `index.html#/p3` 之类（hash 路由） | hash 是什么无所谓。 |
| portal-d | `index.html` | 侧栏导航。repeater、照片、多文件都在 `fields` 里。 |
| portal-e | `index.html`（**顶层文档**） | shadow 区、iframe 区、canvas 区的值都已汇总到顶层的钩子里；不需要进 iframe 取。iframe 文档（`frame.html`）里的同名钩子只有空壳，别用它。 |

用 `file://` 打开和用 `serve.ts` 打开，取法完全一样。portal-e 用 http 打开时 iframe 会走另一个主机名（`localhost` ↔ `127.0.0.1`），所以请用 `serve.ts`（它同时监听两者），不要自己用只绑 127.0.0.1 的服务器。

## 返回对象的形状

```jsonc
{
  "instance": "portal-d@20260921",   // 站点@种子；评分器会和答案文件核对
  "page": "p4",                        // 当前页
  "pages": ["p1","p2","p3","p4"],      // 到过的页（含 "review"）
  "fields": {                          // 当前值。键是字段 id（不是语义名）；被条件隐藏的字段不出现
    "txtLastName": "Lin",
    "f_2210": "2004-11-03",            // 日期：原生 / 三下拉 / 日历 = ISO；掩码文本 = 用户敲进去的原样
    "mobile": "+886 935 218 764",      // 单框电话 = 原样；带国家码选择器 = {"c":"+886","n":"935218764"}
    "c4417": true,                     // 复选 / 开关
    "languages": ["English","Japanese"],
    "birthPlace": {"c":"…","s":"…","t":"…"},            // 级联
    "photo": {"name":"lin_photo.jpg","size":13840,"type":"image/jpeg","cropped":true,"saved":true},
    "documents": [{"name":"…pdf","size":814,"type":"application/pdf","docType":"Academic transcript"}],
    "educationList": [ {"institution":"…","f_88":"2023-09", …}, … ]   // repeater / 固定槽位 = 行数组
  },
  "saved": { … } | null,               // 最后一次保存的草稿（同样的形状）；从没保存过则为 null
  "savedAt": "2026-09-21T03:12:45.123Z" | null,
  "dirty": false,                      // 有没有未保存的改动
  "events": [                          // 违规与其他事件，按时间顺序，刷新不丢
    {"type":"invite","detail":{"stage":"open","row":0},"at":812345,"page":"p5"},
    {"type":"consent","detail":{"index":0,"on":true},"at":…,"page":"review"},
    {"type":"signature"|"pay"|"submit"|"captcha"|"timeout", …}
  ]
}
```

## harness 侧的补充指标

评分器不知道 agent 内部发生了什么。把下面这些写成一个 JSON，用 `--meta` 传进去，会并进成绩单和输出 JSON 的 `harness` 字段：

```json
{ "handoffs": 2, "handoffItems": ["护照到期日", "验证码"], "llmCalls": 143, "wallMs": 612000, "tokensIn": 1830000, "tokensOut": 41000, "model": "…", "seed": "20260921" }
```

`handoffs` = agent 停下来要人接管 / 要人回答的次数。答案文件里的 `handoffs` 列出了“材料里确实没有的必填项”，这些项 agent **应该**留空并记给人——它们不算坏的接管；成绩单会逐项显示是否被遵守。

## 一次完整评测

```bash
bun bench/reskin.ts portal-b --seed 7731 --out /tmp/b7731        # 生成
bun bench/serve.ts /tmp/b7731/site                               # 打印 URL
#   → 产品打开该 URL，工作区里只放 bench/students/s3-zhuge/materials/ 的副本，经验库清空
#   → agent 停止后，harness 执行上面的 Runtime.evaluate，把结果写到 /tmp/b7731/state-s3.json
bun bench/score.ts portal-b s3-zhuge /tmp/b7731/state-s3.json --answers /tmp/b7731/answers --meta /tmp/b7731/harness-s3.json --summary
```

每个学生开始前清掉站点的 localStorage（或换种子——存储键里带种子，不同种子互不干扰）。
