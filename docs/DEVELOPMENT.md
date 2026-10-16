# 开发指南

## 准备

- macOS，Bun 1.3.x。**不需要** Python、不需要原生编译工具链——项目里没有任何原生 Node 模块。
- 模型全在应用内部，不碰本机 OpenCode（2026-10-01 起彻底私有化）：opencode 的配置、凭据、模型目录、对话库经 `XDG_CONFIG_HOME/XDG_DATA_HOME/XDG_CACHE_HOME` 落在应用数据目录 `userData/opencode/{config,data,cache}`；`~/.agents/skills`、`~/.claude/skills` 这类按 HOME 扫的外部技能用 `OPENCODE_DISABLE_EXTERNAL_SKILLS=1` 关掉——填报模型只看得到自己的（首次起要联网下载一次模型目录，弱网有缓冲）。**配置本身写在 `userData/opencode/config/opencode/opencode.json`（0600），不再经 env 注入**（2026-10-11 评审 P2-6 改的：注入配置的 env 字符串模型 `printenv` 捞得到 provider Key）。模型入口是「设置」页：自己的服务器行（vLLM / Ollama / 局域网那类）的 baseURL 和 Key 就写进上面那份配置文件——文件 0600，模型的工具读不到自己的启动 env，这是接受过的取舍；云端服务商 Key 仍走 `client.auth.set` 交 opencode 私有凭据库，不落这个文件。日常口径（2026-10-10 用户拍板）是**本地端模型为主**；云端留兜底链 `minimax-cn/MiniMax-M3.1-Flash-Preview` → `MiniMax-M3`：**能看图**（填表要看号码牌截图）、有 thinking 档。开发自检仍可用 `local.env` 的 `NEO_LOCAL_*`（界面显示为只读行）；命令行玩私有 opencode 要带同样的 `XDG_*` 前缀。历史教训保留：`MiniMax-M2.7` 不支持图片输入——2026-09-19 两趟 NTU 实测里它"截图看页面"其实什么都没看见。**看不了图的纯文字模型现在也是跑得通的**（`NEO_LOCAL_SEES=0` 或设置里标「不能看图」）：2026-10-11 在局域网 vLLM 前架录制代理实测，图片 part 在 opencode 拼请求时就整套丢掉，服务器连"这不是多模态"的 400 都碰不到；代价是 B/C 档降级和「看原图核对」这条安全网失灵，见 BROWSER.md。

```bash
bun install
bun run dev
```

第一次运行 macOS 会问是否允许访问「文稿」文件夹（工作区在 `~/Documents/Terra-Edu Neo Job Agent/workspaces/`），点允许。

## 每次改完都要跑

```bash
bun run typecheck      # 主进程 + 渲染进程
bun test src           # 纯函数单测（189 项）
bun run smoke          # 浏览器层自检，不经过模型，约 130 项 / 一分半
bun run smoke:tasks    # 建投递 / 任务 / 工作区 / 一键投递 / 账号备忘自检，约 20 项
bun run smoke:feed     # 岗位中心：匹配 / 过滤 / 来源开关 / 调度数学，离线自检
bun run smoke:resume   # 简历：真实 LaTeX 编译导出 PDF（没有引擎会如实报告）
bun run smoke:ego      # 整套浏览器检查在 ego lite 里经 WebSocket CDP 再跑一遍
bun run smoke:jev      # Jev 一次真调用（不碰网页）
```

**改完必跑前三个**（typecheck + test + smoke），这是 AGENTS.md 里的硬规矩。动了岗位中心/简历再补 `smoke:feed` / `smoke:resume`。

动了材料读取（`src/main/materials/`、`native/`）时：

```bash
bun run smoke:materials   # 各类材料转文字，约 11 项；有 PaddleOCR 时约 70 秒（大头是加载识别模型）
```

动了浏览器工具、守则（`resources/AGENTS.workspace.md`）或 OpenCode 接入时，再跑：

```bash
NEO_MODEL=minimax-cn/MiniMax-M3 bun run smoke:agent   # 真模型照指令把练习表填完，约 40 秒
NEO_MODEL=minimax-cn/MiniMax-M3 bun run smoke:e2e     # 真模型走产品主路径：建任务 → 自动开工 → 读材料 → 填表 → 重开续聊
```

自检一律使用临时工作区、关闭登录（`NEO_AUTH=off`），不碰 `~/Documents`，不消耗顾问额度（会消耗你自己的模型额度）。

自检失败先看日志（[LOGGING.md](LOGGING.md)），自检时可用 `NEO_LOG_DIR=/tmp/neo-logs` 把日志单独放。

## 一次填表请求是怎么走的

```
顾问在侧边栏打字
  → renderer  neo.send()                       src/renderer/src/App.tsx
  → preload   ipcRenderer.invoke("chat:send")  src/preload/index.ts
  → main      session.promptAsync()            src/main/index.ts
  → opencode serve（独立进程，cwd = 任务工作区，读工作区里的 AGENTS.md）
      模型决定调 browser_fill_form（一次一段表单）
  → HTTP POST 127.0.0.1:<port>/mcp（Bearer token） src/main/browser/mcp.ts
  → BrowserController.fillForm()               src/main/browser/controller.ts
      遇到“选哪个”的小问题（下拉对不上、弹层点哪个）→ askJev()   src/main/jev.ts（约 0.3 秒；走哪条路由见「环境变量」Jev 三行，不可用就把候选退给模型）
  → CDP → 左侧 WebContentsView 里的真实网页      src/main/browser/cdp.ts
  ← 读回的实际值 → 工具结果 → 模型
  ← SSE 事件流 → main.pumpEvents() → renderer 渲染气泡 / 工具行 / 提问卡片
```

浏览器层的分工（大模型 / 工具 / Jev）、每种控件的坑和对策、什么叫“跑通”：见 [BROWSER.md](BROWSER.md)。**改 `src/main/browser/` 之前先读它。**

## 文字识别引擎

| 引擎 | 在哪 | 怎么来 |
|---|---|---|
| `neo-ocr`（macOS Vision + PDFKit） | `resources/bin/neo-ocr`，已入库，Intel / Apple Silicon 通用 | 改了 `native/neo-ocr/main.swift` 后 `bun run build:native`（需要 Xcode 命令行工具） |
| PaddleOCR | `resources/vendor/terra-paddleocr/`，**不入库**，~700MB | 每台打包机自己构建：`bun run build:ocr`（需要 [uv](https://docs.astral.sh/uv/)；Intel 上自动降到 paddle 2.6.2 + paddleocr 2.7） |

没有 PaddleOCR 时应用照常工作，只是扫描件改由 Vision 识别并标注“低可信”。为什么不只用 Vision：见 ROADMAP 的 M3（它会把人名认错）。

## 工作区长什么样

```
~/Documents/Terra-Edu Neo Job Agent/workspaces/
  陈昊天/                          ← OpenCode 的工作目录（一个学生一个）
    AGENTS.md                      一页纸守则（我们的，每次打开刷新）
    student.json                   学生名、材料来源文件夹
    materials/                     顾问文件夹的副本；只增不覆盖
    materials_text/                软件生成的文字版 + INDEX.md（模型从这里读材料）
    student_profile.md             模型写的学生档案（答案库见下面）
    student_profile.json           答案库：名字、联系、教育/实习/项目数组……照 profile-keys.json 写
    job_target.json                ★ 求职目标（岗位中心按它筛）：目标岗位/关键词/公司/地点/实习开关
    resume/                        ★ 简历：resume-<方向>-<姓名>/main.tex + Resume_<Track>_<Name>.pdf
    jobs/
      Google_Data-Science-Intern/   ← 每份投递一个文件夹
        task.json                  顾问填的投递信息 + 对话 id
        …                          这家公司这个岗位的要求 / 进度 / 缺什么（模型自己安排）
```

顾问的原始文件夹永远只读；模型只在学生文件夹里活动。

## 岗位中心 / 简历引擎怎么改

见 [docs/FEED.md](FEED.md)（岗位来源、归一化去重、匹配打分、定时与补抓）与 [docs/RESUME.md](RESUME.md)（档案 → LaTeX → PDF、`resume_compile` 工具）。核心逻辑都在 `src/main/feed/` 和 `src/main/resume/` 的**纯函数文件**（feed-core / schedule-core / resume-core）里，单测钉住它们。

## 约定

- **薄。** 外壳只做四件事：窗口、任务与工作区、把浏览器变成工具、把对话显示出来。申请怎么做，写在给模型的一页纸守则里，不写进代码。
- **工具说人话。** 工具失败时返回“发生了什么 + 可以怎么办”，让模型自己处理；不要为每种失败加一条规则或一道闸门。给模型看的文字一律中文。
- **Jev 是加速器，不是依赖。** 任何用到 Jev 的地方，Jev 不可用时都必须自动走没有它的老路；把握低于 0.8 不动手，连同候选退给大模型。只发当前这道题需要的片段，不发整页快照和学生档案。
- **先跑通。** 现阶段只有一个用户：不为没遇到过的控件提前写代码；真实平台上撞到了，先加进 `fixtures/form.html` 复现，再修。试几次不行的字段交给顾问手动填。
- **唯一的硬规则**在 `src/main/browser/risk.ts`：最终提交 / 付款 / 推荐信邀请问顾问。要加第二条之前先在 ROADMAP 里写理由。
- **渲染进程不碰 Node。** 只通过 `window.neo`（`src/shared/types.ts` 的 `NeoApi`）。新增能力三处同步：`types.ts`、`preload/index.ts`、`main` 里的 `handle()`。
- **IPC 一律用 `handle()` 注册**（不是 `ipcMain.handle`），失败会自动进日志。
- 给顾问看的文字：说学生、公司、岗位、材料、页面；不说 JSON、ref、工具名（工具名翻译表在 `src/renderer/src/labels.ts`）。
- 注释写“为什么”，不写“是什么”。
- 架构相关的东西只有 Electron 本体和 OpenCode 二进制，都跟打包机器走；**不要引入原生 Node 模块**（否则 Intel / Apple Silicon 要各编一份）。

## 踩过的坑（别再踩）

- **OpenCode 的 `tools: { webfetch: false }` 写在注入配置里不起作用**（2026-09-22 实测）：模型照样能调 `webfetch` 并成功。有效的是**在每条消息上**传同名字段（`session.promptAsync` 的 `tools`，见 `src/main/index.ts` 的 `sendPrompt`）——这样模型的工具表里干脆没有它，它自己会说“我这边没有叫 webfetch 的工具”。`smoke:e2e` 末尾有一条行为断言守着这件事：让模型去用 webfetch，看它是不是真的用不了。顺带：`/experimental/tool` 那个列表**只列内置工具**，我们的 `browser_*` / `materials_*` 不在里面，别拿它判断模型手里有什么。
- **交给页面执行的脚本是字符串，写错了不会有人告诉你**：调用处都有 catch，一个少写的反斜杠会让整条功能安静地失效（搜索因此一条结果都返回不了）。`src/main/browser/page-scripts.test.ts` 会把源码里所有页面脚本逐个解析一遍。

| 现象 | 原因 | 处理 |
|---|---|---|
| preload 报 `module not found: child_process` | electron-vite 5 只支持 Vite ≤ 7；Vite 8 会把 `electron` 打进 preload | `vite@^7` |
| 启动即 `Identifier 'require' has already been declared` | electron-vite 在 ESM 产物里注入了自己的 `require` | 自己的叫 `nodeRequire` |
| 所有 CDP 命令挂死 | `WebContentsView` 还没加载任何页面 | 先 `loadURL` 再 `debugger.attach` |
| 点击后整个工具卡死 | `confirm()` / `prompt()` 冻结页面，连带冻结触发它的那条 CDP 命令 | 所有动页面的命令与“弹窗出现”赛跑：`BrowserController.input()` |
| 每次点击卡 5 秒；顾问一打字网页下拉就收起 | 网页半边没有焦点 | `Emulation.setFocusEmulationEnabled` |
| 遮挡检测误报 | `DOM.getNodeForLocation` 坐标系不可靠 | 在元素自己的文档里 `elementFromPoint` |
| 注入的点击全部没反应 | `WebContentsView.setVisible(false)` 的网页不做命中测试 | 操作网页前必须处在任务视图（`state.view = "task"` + `layout()`） |
| 自检里“扫描 PDF”是空白页 | `data:` 页面不允许加载 `file://` 图片 | 先写成临时 html 文件再 `loadURL("file://…")` |
| 旧版 `terra-ocr` 中文全是乱码 | Vision 默认只认英文 | `recognitionLanguages = ["zh-Hans","zh-Hant","en-US"]` |
| 退出后残留 `opencode serve` | `app.exit()`、Ctrl+C、SIGTERM 不触发 `before-quit` | `process.on("exit")` + 信号处理 + pid 文件，下次启动清理 |
| 自检卡住无输出 | 写 `~/Documents` 触发 macOS 文件夹授权弹窗 | 自检用临时目录（`NEO_WORKSPACES_ROOT`） |
| 真实网页字段名带星号 `"First name *"` | CSS `::after` 的内容算进无障碍名称 | 匹配字段名用前缀，不用全等 |

## 环境变量

| 变量 | 作用 |
|---|---|
| `NEO_MODEL` | 自检用模型，如 `minimax-cn/MiniMax-M3` |
| `NEO_WORKSPACES_ROOT` | 工作区根目录 |
| （这些放哪） | 开发时：仓库根目录 `.env.local`（不入库）。**装好的应用**：`~/Library/Application Support/Terra-Edu Neo Job Agent/local.env`，同样的写法（`src/main/local-env.ts`）；环境变量优先于两者。模型服务器自 2026-09-30 起由「设置」界面管，不必再写进这个文件；其余开关（下面这些 `NEO_*`）还是从这里读 |
| `NEO_LOCAL_BASE_URL` / `NEO_LOCAL_MODEL` / `NEO_LOCAL_KEY` | **自己的模型服务器**（vLLM、Ollama、LM Studio、中转——只要是 OpenAI Chat Completions 接口）。三项写在 `.env.local`（不入库）；设了就会作为一个叫“自己的模型”的来源出现在模型列表里，顾问可以在选择器里选它，模型 id 是 `own/<模型名>`，比如 `NEO_MODEL=own/qwen3.8-flash-next`。局域网地址只在那个网络里通，出门换成 Tailscale / 公网地址。**现在平时的入口是首页「设置」界面**（2026-09-30 起管**所有模型**：自己的服务器多条并存、各是一个 provider `own-<id>`；云端模型行只注入模型定义到 opencode 自己的 provider，地址/key/登录一概不碰；「设为默认」是每张卡片的一级按钮，统一存 `model-servers.json` 的 `default: "provider/model"`；云端「删除」= 隐藏、可在列表底部恢复；无论默认是什么，兜底链永远是 `minimax-cn/MiniMax-M3.1-Flash-Preview` → `MiniMax-M3`，默认那台用不了就自动落到兜底并提示一句）。这些环境变量照旧有效——自检和老装机靠它，界面会把它显示成一条只读条目。`NEO_LOCAL_DEFAULT=1` 只在做默认迁移那一次被采纳（存储里从没设过默认时），此后默认只听界面的 |
| `NEO_LOCAL_THINKING` | 让它用哪个思考档，默认 `medium`（这类服务器不传就按最高档想，很慢）。可选档位用 `NEO_LOCAL_THINKING_LEVELS` 列出，默认 `low,medium,xhigh`——**只列服务器认的**，Qwen 不认 `high` / `max`，传了直接 400 |
| `NEO_LOCAL_CONTEXT` / `NEO_LOCAL_OUTPUT` / `NEO_LOCAL_SEES` | 上下文总长（默认 262144）、单次最大输出（默认 65536，思考内容也算在里面）、`NEO_LOCAL_SEES=0` 表示这个模型看不了图——2026-10-11 经录制代理实测这样跑得通：opencode 拼请求时把图片 part 整套丢弃，不会撞"不是多模态"的 400，代价见 BROWSER.md「纯文字模型」一节 |
| `NEO_JEV_BASE_URL` / `NEO_JEV_MODEL` | Jev 走哪个地址、哪个模型名（局域网集群或自建）。`BASE_URL` 设了就优先于设置界面那条，是开发和自检的明确门 |
| `NEO_TYPESAFE_KEY` | Jev 的 TypeSafe 官方云 Key（直连，约 0.3 秒一次）。现在日常入口是「设置」的 Jev 行，Key 就在行里（2026-10-10 用户拍板随包分发，见 ROADMAP）；这个环境变量留给开发覆盖 |
| `NEO_JEV_KEY` | 兜底档：一把 Vercel AI Gateway 的 key，只有上面两路都没有时才用它。没有它一切照常，只是没有提速。`bun run smoke:jev` 用当前接得上的一条做一次真调用 |
| `NEO_JEV_TIMEOUT_MS` | 等 Jev 的上限，默认 3000 |
| `NEO_JEV=fake\|off` | `fake`：用内置的假 Jev（自检用，不联网）；`off`：完全关闭，优先级高于设置界面 |
| `NEO_EGO=off` | 完全不装 ego lite 运行时（也不开 UCAS 那类站点的自动路由）；`NEO_EGO_BIN` / `NEO_EGO_PROFILE` 指定二进制 / 专用 profile |
| `NEO_AUTH=off` | 跳过顾问登录与额度（仅开发用）。本仓库默认本地模式：`resources/supabase-public.json` 已置 `configured:false`，顾问登录/额度整条不启用 |
| `NEO_START_URL` | 启动时左侧打开的网址 |
| `NEO_OPENCODE_BIN` | 指定 OpenCode 二进制 |
| `NEO_LOG_DIR` / `NEO_LOG_LEVEL` / `NEO_DEBUG` | 日志位置 / 级别 / 终端也打 debug |
| `NEO_DO_URL` / `NEO_DO_GOAL` / `NEO_DO_STEPS` | `bun run smoke:do`：用**真 Jev** 在一个公开页面上跑一趟 `browser_do`（不登录、不打字、不经过大模型），看它点了什么、停在哪、用了几秒 |
| `NEO_TASK_FILE=<json>` | 开发辅助：按这个文件里的任务信息（`TaskInput`）建任务并直接打开，窗口照常显示；配合 `NEO_WORKSPACES_ROOT` 做不碰正式工作区的试跑。打包后无效 |
| `NEO_SHOT=<目录>` + `NEO_SHOT_VIEW=login\|home\|new\|settings\|settings-new\|student\|task` | 开发辅助：把指定界面截图存下来（改界面后自己先看一眼；`settings-new` 直接打开「添加模型服务器」的表单，`student` 打开第一个学生的编辑页） |
| `NEO_MODEL_SERVER_TEST=<json>` | 开发辅助（打包后无效）：开一段自由对话 → 按设置界面同样的路保存这台服务器（原地重启）→ 从模型列表里点名它发一句话 → 打印 PASS/FAIL 并退出。配 `--user-data-dir=<临时目录>` 跑，别碰真存储 |

## 提交

小步提交，一步一个 commit，`main` 始终可运行。提交前：typecheck + test + smoke。不打 release 包，不打 tag（除非另说）。
工作树里可能有别的会话留下的改动：`git status` 逐个看，只 `git add` 自己改的文件。
