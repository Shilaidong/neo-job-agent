# 日志

**原则：出了问题，先看日志，再看代码。** 日志要能回答：模型调了什么、页面回了什么、哪一步慢、哪一步错。

## 在哪

- 应用内：侧边栏右上角「日志」→ 在访达中定位**本次运行**的日志文件。报 Bug 时发这个文件。
- 磁盘：`~/Library/Logs/Terra-Edu Neo Application Agent/neo-<日期>-<时间>-<pid>.log`
- 每次启动一个文件，保留最近 20 个。`NEO_LOG_DIR=<目录>` 可改位置（自检时用）。
- 开发模式下 info 及以上同时打到终端；`NEO_DEBUG=1` 连 debug 一起打。`NEO_LOG_LEVEL=info` 可降低文件里的详细度（默认 debug）。

## 格式

一行一个 JSON：

```json
{"t":"2026-09-18T16:23:39.412Z","lvl":"info","mod":"tool","msg":"browser_select ok","id":6,"target":"Country of citizenship *","args":{"ref":"e5","values":["[omitted]"]},"ms":394,"chars":2103,"result":"“Country of citizenship *” 已选：China。…"}
```

工具调用行里的 `args` 在落日志前先过一遍 `scrubFillValues`（`log-sanitize.ts`）：凡是往页面里写的自由文本——`value` / `text` / `query` / `want` / `promptText`，`values` 数组里的每一项——都换成 `[omitted]`；坐标、ref、计数照旧留着。成功行照旧带 600 字结果文字（学生信息还是看得见，见「脱敏」末段）。

| 字段 | 含义 |
|---|---|
| `t` | UTC 时间 |
| `lvl` | `debug` 细节 · `info` 正常经过 · `warn` 预期内的不顺（模型可自行处理）· `error` 我们的 Bug 或外部故障 |
| `mod` | 模块，见下表 |
| `msg` | 固定短语，便于 grep；可变内容都在其余字段里 |

## 模块

| `mod` | 记什么 | 源码 |
|---|---|---|
| `app` | 启动各阶段及耗时、就绪、启动失败、IPC 失败、未捕获异常 | `src/main/index.ts` |
| `opencode` | 二进制路径、端口、pid、服务自身输出、健康检查耗时、退出码、清理上次残留进程 | `src/main/opencode.ts` |
| `session` | 顾问发的指令、模型说的话、每步 token 与费用、非浏览器工具调用、提问与回答、重试、报错、上下文压缩 | `logSessionEvent()` |
| `tool` | **每一次浏览器工具调用**：入参、`target`（编号对应的元素名）、耗时、返回文字前 600 字；`refused` = 给模型的反馈（编号失效、被遮挡…），`crashed` = 我们的 Bug | `src/main/browser/mcp.ts` |
| `browser` | 快照规模（编号数 / 字符数 / iframe 数）、填写各步耗时、遮挡、编号失效重找、页面弹窗与处理结果、**三类保留动作及顾问的决定** | `src/main/browser/controller.ts` |
| `cdp` | CDP 命令超时、调试器断开、iframe 子会话 | `src/main/browser/cdp.ts` |
| `page` | 申请网页的跳转与 HTTP 状态、加载失败、渲染进程崩溃、无响应、网站自己的 console 报错（debug） | `src/main/index.ts` |
| `ui` | 侧边栏（渲染进程）的未捕获错误 | `src/renderer/src/main.tsx` |
| `auth` | 登录成功 / 被拒、会话续期失败、额度读取失败、每次扣了多少额度 | `src/main/auth.ts` |
| `task` | 任务创建 / 复用、材料拷贝耗时、选校清单导入结果 | `src/main/tasks/tasks.ts` |
| `materials` | 每次抽取的文件数 / 新处理数 / 复用数 / 失败数 / 引擎 / 耗时 / 各方法计数；单个文件失败原因；PaddleOCR 退出码与 stderr | `src/main/materials/extract.ts` |
| `store` | 本地存储读不出来（钥匙串变更、文件损坏） | `src/main/store.ts` |
| `models` | 模型服务器条目的新增 / 修改 / 删除（名字、地址、模型 ID、思考档、是否默认；key 从不入日志） | `src/main/model-servers.ts` |
| `web` | 后台隐藏搜索页：每次搜索的引擎、查询串**长度**（查询内容本身不进日志——2026-10-11 评审 P2-1 之后 `tool` 入口行里那个键也打上了码）、抓到的结果数、加载失败 | `src/main/web.ts` |
| `jev` | 每次 askJev：走了哪条路由、几道题、耗时、每题选了什么 / 把握多少、超时与限流 | `src/main/jev.ts` |
| `jev-servers` | 设置界面 Jev 行的增 / 改 / 删与当前选中的是哪条（key 从不入日志） | `src/main/jev-servers.ts` |
| `ego` | 启动时往 userData 装 ego lite 运行时：跳过（`NEO_EGO=off`）、首启拷贝、清 quarantine | `src/main/ego.ts` |
| `ego-host` | 运行期 ego 实例的拉起 / 收养 / 退出、task space 建 / 交还 / 夺回、所有权轮询和交接结果 | `src/main/ego-host.ts`（CLI 那侧也记这里） |

## 脱敏

`src/main/log-sanitize.ts`：键名像密码 / token / authorization / api key / cookie 的值一律写成 `[redacted]`；超过 2000 字的字符串截断；数组最多 30 项；`auth:*` 的 IPC 参数整体不记（密码是位置参数，没有键名可识别）；Error 压平成 name / message / 前 8 行 stack；URL 里的查询串和像令牌的长路径段打码。

往上还叠了几道**按动作而不是按键名**的纪律，2026-10-11 之后这些和键名打码同等重要：

- **浏览器工具入参**：`scrubFillValues` 把往页面写的自由文本整套抹成 `[omitted]`（`values` 数组逐项抹）——旧版 sanitize 只按 key 名打码，`value` / `text` 这种键名根本不命中，模型往框里敲什么日志里就有什么。
- **`browser_login`**：工具零参数，mcp 日志想记也没东西可记；资料扫描认出的密码只进钥匙串，报错语句里最多出现**文件名**，值从不进日志、也不经模型的手。
- **OpenCode 子进程**：启动配置 2026-10-11 起从 env 挪进 userData 里的配置文件，模型 `printenv` 再也捞不到 provider Key——别把配置内容塞回任何 env 字段，日志里看到 `env` 字样也不该有它。

日志**会**包含学生信息（填表的值在结果文字里、模型的回答），只存在本机；发给别人前自己过一眼。

## 常用查法

```bash
LOG="$(ls -t ~/Library/Logs/"Terra-Edu Neo Application Agent"/neo-*.log | head -1)"

# 只看出问题的
jq -c 'select(.lvl=="warn" or .lvl=="error")' "$LOG"

# 模型这一轮都干了什么（时间 / 工具 / 目标 / 耗时）
jq -r 'select(.mod=="tool" and .lvl!="debug") | [.t[11:19], .msg, (.target // ""), (.ms|tostring)+"ms"] | @tsv' "$LOG"

# 哪一步慢（超过 2 秒的）
jq -c 'select(.ms != null and .ms > 2000) | {t, mod, msg, ms}' "$LOG"

# 顾问说了什么、模型答了什么
jq -r 'select(.msg=="prompt" or .msg=="assistant text") | .t[11:19] + "  " + .msg + "  " + .text' "$LOG"

# 三类保留动作的记录
jq -c 'select(.msg=="reserved action")' "$LOG"
```

## 加日志的规矩

1. `const log = createLogger("<模块>")`，一个文件一个模块名。
2. `msg` 用固定短语；学校名、字段值、报错对象放进第二个参数。
3. 外部调用（网络、子进程、CDP、文件）用 `log.time("做什么", fn)`，自动记耗时和失败。
4. 分级：模型能自己消化的不顺 → `warn`；需要我们改代码的 → `error`；每秒多次的细节 → `debug`。
5. 别记流式增量（`message.part.delta`）、别记整页快照全文、别记密钥。

> 实例：日志上线当天就抓到“每填一个字段卡 5 秒”——`fill steps` 显示时间全耗在鼠标点击上，原因是网页半边没有焦点；打开 `Emulation.setFocusEmulationEnabled` 后 5100ms → 89ms。
