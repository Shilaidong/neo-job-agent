# Terra-Edu Neo Job Agent

给求职顾问（或学生本人）用的**求职投递工作台**：**左边是真实的招聘/申请网页，右边是和 AI 的对话。**
AI 读学生材料、定位求职目标、用 LaTeX 生成/修改简历并导出 PDF、每天按时抓岗位、按学生画像筛好，点「投递」就在左边的网页里一步步填表、存草稿；顾问看着它做，随时可以自己动手。**最终提交、付款永远由顾问本人来点。** 一切数据都保存在本机。

这是 [Terra-Edu Neo Application Agent](https://github.com/Shilaidong/neo-app-agent) 的姊妹薄层重写：同一个壳、同一套浏览器工具、同一种对话工作台，只是把「留学申请」换成「求职投递」，并新增了**岗位中心**（定时抓取 + 画像筛岗）和**简历工作室**（LaTeX 一键生成）。

## 它做什么

| 你要的 | 在哪儿 |
|---|---|
| 打开学生的资料文件夹、读材料、整理档案 | 新建投递后 AI 在工作台自动做；扫描件走 OCR |
| 和 AI 对话了解求职目标，AI 读简历定位岗位/公司 | 任何投递的工作台对话；AI 会写 `job_target.json` |
| 基于 LaTeX 生成/修改简历并导出 PDF | 首页「简历」工作室，或者对话里让 AI 调 `resume_compile` |
| 每天自动抓最新实习/岗位，按学生筛选，存本机 | 「岗位中心」+「设置 · 岗位中心」；北京时间 13:00 / 美东 13:00 |
| 看每天的平台 → 岗位列表/详情 → 一键投递全自动填表 | 岗位中心点「投递」→ 工作台（左边网页右边对话），AI 自动填 |
| 接自己的 AI、接别的 AI、可以用 Key 也可以不用 | 「设置 · 模型」，自有服务器 / 云端行 / 兜底模型 |
| 密码编辑、材料更新、注册引导 | 学生「编辑」页（账号备忘）、材料文件夹、对话里补材料 |

## 三个主界面

1. **首页（投递列表）**：每个学生一个文件夹，全部已建/在建的投递按学生分组；入口：新建投递、岗位中心、简历、设置、自由对话。
2. **岗位中心**：每天的岗位快照 + 每个学生的匹配结果（契合分、命中原因），带「立即抓取」、抓取计划、数据源、求职目标编辑器；每条岗位可「投递」。
3. **工作台**：左边是真实网页（内嵌 Electron 浏览器，走 CDP），右边是对话。AI 用 `browser_*` 工具 21 个真点真敲；小模型 Jev 管「选哪个」。最终提交/付款/签名/验证码交给人。

## 一天的工作流（对顾问/学生）

1. 首页「新建投递」：填学生、公司、岗位、链接（第一次要选资料文件夹）。
2. AI 自动开工：材料 → `student_profile.json` + `job_target.json` → 检查/生成简历 → 在左边的招聘页填表存草稿。缺什么用它攒的问题一次问完。
3. 每天（北京 13:00 与美东 13:00）岗位中心自动拉取，按每个学生的目标筛好；错过就下次打开补抓。
4. 看到合适的点「投递」：为这位学生建任务并打开工作台，AI 全自动继续。
5. 注册引导：顾问或学生在对话里把平台账号密码整段贴一次（或学生「编辑」页的账号备忘整段贴），软件不拆、只存本机加密；下次自动登录。

## 和旧版（neo-app-agent）的区别

- 数据模型从「学校/专业/申请」变「公司/岗位/投递」；文件夹 `schools/` → `jobs/`。
- 去掉选校清单 Excel、顾问额度（Supabase）——全部本机，`resources/supabase-public.json` 已置 `configured:false`（本地模式）。
- 新增：岗位抓取（数据源 + 归一化去重 + 规则匹配 + 定时调度 + 睡醒补抓）、LaTeX 简历引擎（`resume_compile` MCP 工具）。
- 保留：OpenCode 原生 CLI（私有 XDG，不碰本机 OpenCode）、内嵌浏览器 CDP 层、对号入座 + 看图 + 校对、Jev、自动登录（资料扫描/钥匙串/对话三条路）、材料转文字（PaddleOCR）、job 工作区一页纸守则。

## 开发

```bash
bun install
bun run dev            # 打开应用
bun run typecheck
bun test src           # 纯函数单测（189 项）
bun run smoke:tasks    # 建投递 / 任务 / 工作区结构自检
bun run smoke:feed     # 岗位中心的匹配/调度/存储自检（离线，无网络）
bun run smoke:resume   # 简历：真实 LaTeX 编译导出 PDF（装有 tectonic/pdflatex 时；没有会如实报告并说明怎么装）
bun run smoke:materials# 各类材料转文字自检（含 OCR）
bun run smoke          # 浏览器层自检（约 130 项，1 分半，不经过模型）
NEO_MODEL=<model> bun run smoke:e2e  # 真模型：建投递 → 自动开工 → 读材料 → 填表 → 重开续聊
```

**改完必跑 `typecheck && test && smoke` 三件套**（动了哪层再补哪层的自检，全链见 docs/DEVELOPMENT.md）。

模型入口唯一是「设置 · 模型」：自己的服务器（局域网/公网 vLLM 都算）一条一张卡片，云端行可带服务商 Key（存本机凭据库），也可以不配 Key 直接用兜底链。侧边栏右上角选模型，选择会记住。

环境变量：`NEO_MODEL`（自检用模型）、`NEO_WORKSPACES_ROOT`（工作区根目录，默认 `~/Documents/Terra-Edu Neo Job Agent/workspaces`）、`NEO_START_URL`、`NEO_OPENCODE_BIN`、`NEO_EGO=off`、`NEO_JEV=off|fake`、`NEO_DEBUG=1`——其余见 docs/DEVELOPMENT.md。

### 岗位抓取的引擎（LaTeX）

简历导出需要一个 LaTeX 引擎，找到哪个用哪个，顺序：`tectonic` → `pdflatex`（含 MacTeX 的 `/Library/TeX/texbin`）→ `xelatex`。

```bash
brew install tectonic          # 推荐：单文件，首次编译自动下载宏包（网络），之后全缓存
# 或
brew install --cask mactex-no-gui   # 完整 TeX 发行版
```

## 文档

- [docs/HANDOFF.md](docs/HANDOFF.md) — 交接：背景、已拍板的决定、现状、待验证项、接手后先做什么
- [docs/ROADMAP.md](docs/ROADMAP.md) — 做到哪了、下一步是什么
- [docs/FEED.md](docs/FEED.md) — 岗位中心：数据源、归一化去重、匹配打分、定时与补抓、扩展新来源
- [docs/RESUME.md](docs/RESUME.md) — 简历工作室：档案 → LaTeX → PDF，`resume_compile` 工具，如何改模板
- [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md) — 怎么跑、约定、踩过的坑
- [docs/BROWSER.md](docs/BROWSER.md) — 浏览器层分工、坑清单（改 `src/main/browser/` 前必读）
- [docs/FILLING.md](docs/FILLING.md) — 填表层设计：对号入座 + 看图 + 校对
- [docs/LOGGING.md](docs/LOGGING.md) — 日志在哪、怎么查

## 现状

见 [docs/ROADMAP.md](docs/ROADMAP.md)。
