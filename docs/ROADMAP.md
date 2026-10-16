# 路线图

> 配色/术语随旧版：勾号 = 完成并在本机实机验证过；🚧 = 代码完成、部分验证或待真平台；不用「预期完成」给日期。
> 最新更新 2026-10-17（Neo Job Agent 首版 `0.1.0`）。

## M0 骨架（✅ 2026-10-17）

- [x] 从 `neo-app-agent` HEAD 复制工作树，更名 `Terra-Edu Neo Job Agent`（package / app.setName / 工作区目录 / 窗口标题 / about）
- [x] 保留整个 `src/main/browser/` 浏览器层、OpenCode 接入、设置/模型/Jev、材料转文字、日志、keychain 存储原封不动
- [x] `resources/supabase-public.json` 置 `configured:false`：本地模式（无登录、无额度，`authStatus()` 恒 `configured:false`）
- [x] base 构建通过：typecheck / 189 单测 / build / smoke（浏览器层 ~130 项）

## M1 数据模型换成求职（✅）

- [x] `shared/tasks.ts` → `TaskInput`：`company / jobTitle / jobType / salary`；去掉 school/program/applicationType、选校清单、batch、reimport
- [x] 任务文件夹 `schools/` → `jobs/`；`taskSlug(company, jobTitle)`；`sameApplication` 按 学生+公司+岗位
- [x] 一键投递复用：`sourceFolder` 变可选，已有学生时不重拷材料
- [x] 投递版开场白 `start-prompt.ts`（含 4 种 goal、账号备忘、简历状态）
- [x] `resources/AGENTS.workspace.md` 求职版一页纸守则；`resources/profile-keys.json` 求职版词表（含 resume 用的 bullets、job_target.*）
- [x] 投递版任务自检 `smoke:tasks`（✅ 本机通过）

## M2 岗位中心（✅ 代码+自检；🔴 待真实来源联通）

- [x] `feed-core`（纯函数）：sha1 去重 id、迷你 RSS/Atom 解析、HTML 剥除、实习/全职/远程分类、地点规范化、**规则匹配打分**（标题/描述关键词、目标公司、地点/排除、实习/全职开关、技能加分）+ 命中原因
- [x] `sources`：RSS（LinkedIn/Indeed 通用）+ Greenhouse / Lever / Ashby 招聘板 + 通用 JSON；`validateSource`
- [x] `feed`（本机 userData JSON 存储）：去重合并、60 天裁剪、最新 500 条快照、每学生 `job_target.json` 读写、`overview()` / `feedForStudent()`
- [x] `scheduler`（纯调度数学 + electron 包装）：**北京 13:00 + 美东 13:00**，睡醒/启动补抓（`powerMonitor resume`），每来源一条 timer
- [x] IPC + preload：overview / 来源 / 时间 / 立即抓取 / 保存目标 / **一键投递（applyToJob）** / resume:* / os:reveal / os:openExternal
- [x] 界面：Home 入口 + JobCenter（状态栏、学生切换、求职目标编辑、岗位列表：契合分/原因/详情/在浏览器打开/投递）+ Settings 的岗位节
- [x] 默认来源 LinkedIn RSS + Indeed RSS（离线可跑，真联网待验）
- [ ] 🔴 **真实来源联通验证**：2026-10-17 只离线测过（种子数据）。要真联网抓一次 LinkedIn/Indeed/一家招聘板，确认真实字段形态、反爬、限流（为此预留了 `feed/sources.ts` 的适配层）
- [ ] 更多默认实习来源：Handshake（要登录，走浏览器侧）、“Who's Hiring” 解析、公司校招页板列表模板

## M3 简历引擎（✅ 本机 tectonic 真编译验证）

- [x] `resume-core`（纯函数）：`student_profile.json` + track → Charter 紧凑单页 LaTeX（HEADING / Summary / Experience / Projects / Education / Leadership / Skills），特殊字符转义
- [x] `resume`：引擎发现（tectonic → pdflatex → xelatex，含 MacTeX 路径）、编译（tectonic 联网首编译 + 3 次外层重试抗弱网）、导出 `Resume_<Track>_<Name>.pdf`（copy 保留工程内 main.pdf）、列表
- [x] `resume_compile` MCP 工具（`/resume` 路由，只编译工作区内路径）——AI 对话里改 main.tex → 编译 → 导出
- [x] 界面：ResumeStudio（选学生/方向/生成）、Settings 简历节（引擎检测/重测）、StudentEditor 简历列表
- [x] `smoke:resume`（✅ 本机真编译出 PDF）
- [ ] 多方向一鱼多吃模板细调；简历页数守卫（超过一页给提示）

## M4 收尾与文档（✅ 2026-10-17）

- [x] README / AGENTS / docs(HANDOFF · ROADMAP · DEVELOPMENT · FEED · RESUME)
- [x] 全绿：typecheck / test(189) / smoke / smoke:tasks / smoke:feed / smoke:resume / smoke:materials / build
- [x] home / new / settings 三屏截图（未细看像素）

## 待办 / 待议

1. **真实 ATS 自动填表跑通**（口子 1，最大未验证项）：找一家真实招聘站（LinkedIn Apply、Greenhouse 板、Lever 板）建一份投递，看 `browser_fill_page` / 答案库对号入座在 ATS 控件上的表现；撞到的新控件先复现进 `fixtures/form.html` 再修。
2. **真联网抓取**（口子 2）：确认默认来源当前形态；把抓下来的样例存一份 fixtures 当确定性测试。
3. **真模型 e2e**（口子 3）：`NEO_MODEL=<能用的模型> bun run smoke:e2e`。
4. **打包**（口子 4）：需要时 `bun run package:mac:x64` + `fetch:ego`。
5. 岗位中心 UI 打磨：来源编辑交互、学生 tab 样式、契合分可视化。
6. JobCenter 里现在“打开岗位描述”只显示文字；可以给贴了岗位详情的大图（截图）模式。

## 原因备忘录（为什么这么设计）

- **面试官判杀死匹配不经过模型**：每天一次、几百条 × 几个学生，全走大模型太贵也太慢；规则打分可离线、可测试、确定性。复杂判断（这个岗位到底合不合适）留给对话里让 AI 细看。
- **抓取存 userData 而不是工作区**：岗位中心是全机的数据，不是某个学生的；按学生只是“视图”不同。
- **`job_target.json` 由 AI 在对话里写**：符合「学生跟 AI 对话，AI 定位求职目标」的产品要求，界面只负责手编覆盖。
- **简历复用 `student_profile.json` 而不是单独一份**：档案只写一次，简历和填表都从它出，改动一处多处生效。
