# 交接文档

> 初稿 2026-10-17（版本 `0.1.0`）。写给接手这个仓库的下一个会话（人或 AI）。
> 姊妹项目 `Shilaidong/neo-app-agent` 的会话记忆带不过来——这份文档 + 引用的文档就是全部背景。

读的顺序：本文 → [ROADMAP.md](ROADMAP.md)（做到哪、下一步）→ [FEED.md](FEED.md)（岗位中心怎么改）→ [RESUME.md](RESUME.md)（简历引擎怎么改）→ [DEVELOPMENT.md](DEVELOPMENT.md)（怎么跑、约定、坑表）→ [LOGGING.md](LOGGING.md)（排查问题）。

## 1. 这是什么、为什么做

**Terra-Edu Neo Job Agent**：给求职顾问（或学生本人）用的 macOS 桌面应用。左边是真实的招聘网页，右边是和 AI 的对话。AI 读学生材料、写学生档案和求职目标、用 LaTeX 生成/修改简历导出 PDF、每天固定时间抓取最新实习/全职岗位并按学生画像筛好，点「投递」就为这位学生建任务并打开工作台，AI 全自动把表填好存草稿。

它是 `neo-app-agent`（留学申请填报工作台）的**薄层重写 + 三个新东西**。用户 2026-10-16 晚上拍板：做成「和现在那个申请的那个差不多」的**职业版**，功能清单（原话概括）：

1. 点开一个学生的文件夹；用 Skill 读材料、改简历、做 LaTeX 简历、导出 PDF；
2. 学生跟 AI 对话，AI 读懂求职目标、读简历定位「你要找什么岗位、什么公司」；
3. AI 每天 **北京时间 13:00** 和 **美东时间 13:00** 自动去平台拉最新实习/全职岗位，自动按学生筛好，全部保存在本机；
4. 可以接自己的 AI 或别的 AI，**用 Key 或不用 Key** 都行（和申请的差不多）；
5. 有设置页：密码编辑、材料更新那些界面都有；
6. 注册引导：每注册一个平台，可以把密码存本机（不上传云端），手动填或用问答填；
7. 依据学生信息和简历自动填申请表；每天看到一个适合岗位的列表，点开看详情，想投就点「投递」→ 全自动开始投递。

**已拍板的决定：**

| 问题 | 决定 |
|---|---|
| 架构 | 完全妹妹版复用 `neo-app-agent`：同一个 Electron 壳、同一套 `src/main/browser/` 浏览器工具（21 个浏览器工具一行没动）、同一份 OpenCode 集成、同一个工作台 UI。数据模型从「学校/专业」换成「公司/岗位」。 |
| 顾问登录 / 额度 | **砍掉**。本地模式永远开着：`resources/supabase-public.json` 置 `configured:false`，AppState.auth 恒为未登录本地态。所有数据存本机。 |
| 选校清单 / 批量导入 | **砍掉**。不再有 Excel 清单、reimport、batch。 |
| 岗位来源 | 先上不鉴权的免费源：LinkedIn RSS、Indeed RSS、Greenhouse / Lever / Ashby 公开招聘板、通用 RSS/JSON；默认开 LinkedIn + Indeed。Handshake 一类要登录的，交给「在浏览器里打开」人工投或后续加登录化来源。 |
| 抓取时间 | **北京 13:00 + 美东 13:00**，睡醒/错过补抓，可关闭、可改；每次抓取全部保存本机 JSON。 |
| 匹配 | 规则打分（标题/描述关键词、目标公司、地点/排除地点、实习/全职开关、技能加分），纯函数、可单测；不经过模型（快、可离线、可钉死）。`job_target.json` 由 AI 在对话里写，也可在岗位中心手编。 |
| 简历 | 用 `resume-latex` skill 的模板（Charter 紧凑单页）做骨架，`src/main/resume/`：档案 `student_profile.json` → `.tex` → 编译 → `Resume_<Track>_<Name>.pdf`。引擎自动找 tectonic → pdflatex → xelatex。也挂成 `resume_compile` MCP 工具，AI 在对话里就能改 main.tex 再编译导出。 |
| 一键投递 | 岗位中心每条岗位「投递」→ 用 `feed:applyToJob` 给这位学生建任务（复用已有材料文件夹，不用再选文件夹）并自动打开工作台。 |
| 密码 | 沿用旧版口径：软件不拆账号密码，靠学生「账号备忘」（整段贴，存钥匙串加密）+ 任务「平台登录」框 + 材料扫描三条路，`browser_login` 自动登录；最终提交/付款/验证码/签名永远交人。 |

## 2. 现在做到哪了

M0 骨架（copy `neo-app-agent` HEAD → 更名）→ M1 数据模型换成求职（jobs/ 目录、company/title、start-prompt、一页纸守则、profile-keys）→ M2 岗位中心（feed-core + sources + feed 存储 + scheduler + IPC + 岗位中心 UI + 求职目标编辑器）→ M3 简历引擎（resume-core + 编译 + MCP 工具 + 简历工作室 UI + 设置节）→ M4 本地模式（Supabase off）→ M5 测试与文档。

**已实机验证（2026-10-17，本机 Intel Mac）：**

- `bun run typecheck` ✅ · `bun test src` ✅（189 项）
- `bun run build` ✅
- `bun run smoke:tasks` ✅（建投递、分组、工作区、评论区、一键投递复用、坏链接拒绝）
- `bun run smoke:feed` ✅（匹配/过滤/排除地点、来源开关、调度数学、目标持久化）
- `bun run smoke:resume` ✅（真 tectonic 编译出 PDF、导出命名 PDF、resume_compile 重编）
- `bun run smoke:materials` ✅（含真实 PaddleOCR）
- `bun run smoke` ✅（浏览器层全部，约 130 项）
- 界面：home / new / settings 三屏截图生成无报错（home.png / new.png / settings.png）

**还开着的口子（没验证/没做完）：**

1. **真平台跑通**：还没用任何真实招聘网站跑过一遍自动填表+投递。练习表 fixture/form.html 证明浏览器层充分，ATS 特有控件（技能选择、评分问题、预设下拉）要靠真实平台验证——接手后第一件事。
2. **岗位抓取的真实来源联通**：默认 LinkedIn RSS 常被反爬/改版，需要真抓一次确认当前形态；Indeed RSS 同样。`smoke:feed` 是离线的（种子数据），**没真联网抓过**。
3. **OpenCode/模型**：这台机器 `NEO_LOCAL_*` 指向用户的 DGX 服务器（deepseek-v4-flash-0731，纯文字、看不了图）。真跑 `smoke:e2e` / `smoke:agent` 要用 `NEO_MODEL=...` 指一个能用的模型。e2e 没在这台跑过。
4. **package**：没出过 dmg；要发版跑 `bun run package:mac:x64`（Intel 机）。ego lite 需要 `bun run fetch:ego`；不投 UCAS 类站点其实可以不带 ego。
5. **简历引擎装机**：tectonic 已装在这台（`/usr/local/bin/tectonic`，0.17.0，宏包已缓存）。别的机器要自己装；装不上时设置页/简历页会明说怎么装。
6. **UI 细节**：岗位中心/简历工作室是新的 SolidJS 视图，走了一遍截图没细看像素级；表单交互可以再打磨。
7. 旧版遗留的 `docs/BROWSER.md` / `docs/FILLING.md` / `docs/LOGGING.md` / `docs/UI-REDESIGN-PLAN.md` 原样保留（浏览器层和设计系统没变，术语仍是「申请」，读的时候心里换算成「投递」）。

## 3. 东西都在哪

```
src/main/index.ts        窗口、视图切换、全部 IPC、feed scheduler 启动、feed/resume IPC
src/main/tasks/          建投递、按学生分组、平台账号/密码记忆、账号备忘（沿用旧版改字段）
src/main/feed/           ★ 岗位中心：feed-core（id/解析/分类/匹配，纯函数）· sources（抓取适配）
                          feed（本地存储 + runOnceNow + overview）· scheduler（定时+补抓）
src/main/resume/         ★ 简历：resume-core（档案→LaTeX，纯函数）· resume（引擎发现/编译/导出/列表）
src/main/browser/        ★ 原样复用：CDP 浏览器层、browser_* 工具 MCP（新增 /resume 路由挂 resume_compile）
src/main/start-prompt.ts    投递版开场白
resources/AGENTS.workspace.md  ★ 求职版一页纸守则（拷进每个学生工作区）
resources/profile-keys.json   ★ 求职版答案库词表
resources/supabase-public.json  configured:false（本地模式）
src/renderer/src/views/  Home（列表+入口）· NewTask（新建投递）· JobCenter ★ 岗位中心 ·
                         ResumeStudio ★ 简历 · StudentEditor（账号备忘/简历）· Settings（模型+岗位+简历）· Workbench
smoke：runTaskSmoke / runFeedSmoke ★ / runResumeSmoke ★ / runMaterialsSmoke / runSmoke / runAgentSmoke / runEgoSmoke
```

学生工作区（运行时生成，`~/Documents/Terra-Edu Neo Job Agent/workspaces/`）：

```
<学生>/
  AGENTS.md                一页纸守则（每次打开刷新）
  student.json             身份 + 材料来源
  materials/ materials_text/  材料副本与文字版
  student_profile.json     答案库（档案）   student_profile.md  给顾问看的档案
  job_target.json          ★ 求职目标（岗位中心按它筛）
  resume/                  ★ resume-<方向>-<姓名>/main.tex + Resume_<Track>_<Name>.pdf
  jobs/<公司>_<岗位>/task.json   每份投递一个文件夹
```

## 4. 接手后先做这些

1. `git log --oneline` 看最新提交；`git status` 应干净。
2. 跑一遍三件套 `bun run typecheck && bun test src && bun run smoke`，再 `bun run smoke:feed && bun run smoke:resume`。
3. 打开应用 `bun run dev`，建一位学生、新建一份投递、看工作台自动开工；到岗位中心点「立即抓取」（联网）看真数据。
4. 找一家真实 ATS 试自动填表（口子 1）——最大的未验证项。
5. 按 ROADMAP 勾项，把没做完的补完（不要提前打勾）。
