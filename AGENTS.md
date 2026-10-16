# 给接手这个仓库的人（或 AI）

**刚接手？先读 `docs/HANDOFF.md`**——背景、用户的要求和已拍板的决定、现在的状态、没验证的口子、到新工作区先做什么、下一步。

然后是 `docs/ROADMAP.md`（做到哪了、下一步是什么）、`docs/FEED.md`（岗位中心）与 `docs/RESUME.md`（简历引擎），`docs/DEVELOPMENT.md`（怎么跑、约定、踩过的坑）。排查问题先看 `docs/LOGGING.md`。

- 这是 Terra-Edu **求职投递**工作台的薄层重写：左边招聘网页、右边 AI 对话，原版 OpenCode CLI + 自研内嵌浏览器工具。姊妹项目是 `Shilaidong/neo-app-agent`（留学申请填报，同壳同浏览器层），只作参考，**不要往回搬它的选校清单、顾问登录/额度**。ego-browser 口径跟随旧版：被 Cloudflare 判机器人的站点可走外部 ego lite 浏览器（`resources/vendor/ego-lite`，`bun run fetch:ego` 拉取），其余照常内嵌。
- 本仓库新增、旧版没有的东西：**岗位中心**（`src/main/feed/`：数据源 → 归一化去重 → 规则匹配 → 定时调度 → 睡醒补抓）、**简历工作室**（`src/main/resume/`：档案 → LaTeX → PDF，`resume_compile` MCP 工具）。
- 改完必跑：`bun run typecheck && bun test src && bun run smoke`（动了岗位/简历/任务层再补 `smoke:feed` / `smoke:resume` / `smoke:tasks`）。
- 新功能先写进 ROADMAP 再动手；做完勾掉，没做完的不许勾。
- `resources/AGENTS.workspace.md` 是另一份东西：那是写给**填表模型**的一页纸守则，会被拷进每个学生工作区。它要保持一页纸。
- 用 Bun，不用 npm。不要引入原生 Node 模块。
