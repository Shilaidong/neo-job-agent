# 现有公开 Benchmark 调研：能否直接拿来评测「留学申请长表单填写」？

调研日期：2026-09-20。方法：只读网络调研（论文、GitHub 仓库、LICENSE 文件、GitHub API 的 licence 字段）。
凡是本次没有亲自核对到原始出处的事实，一律标注「未能核实」或「据论文，本次未逐项核对」。

## 0. 我们要评测的东西（用来对照的尺子）

- 被测对象：Electron 桌面应用，内嵌浏览器由 CDP 驱动，LLM agent 拿着学生材料文件夹去填**真实大学申请系统**。
- 任务形态：多页长表单（40–90 个字段）、保存草稿；**绝不**最终提交、付款、发送推荐人邀请、勾选同意条款。
- 表单里的「二级界面」：查找弹窗（学校/国家 lookup modal）、可重复分组（教育经历/工作经历 repeater）、上传后裁剪对话框、自定义日期选择器、级联下拉等。
- 评测 harness 的能力边界：**「打开一个 URL → 让 agent 带着材料文件夹工作 → 用一次 CDP `Runtime.evaluate` 检查最终页面状态」**。不拥有 Python gym 环境，不让 benchmark 方接管浏览器。

下面每个 benchmark 都按同一组问题回答：是什么 / 许可证 / 能否自托管离线 / 有没有多页长表单和二级界面 / 怎么打分 / 接入我们 harness 的成本。

---

## 1. 逐个 Benchmark

### 1.1 FormFactory（arXiv 2506.01520）—— 形态最接近的一个

- **是什么**：武汉大学等提出的「多模态表单填写 agent」交互式评测套件：Flask 网页前端 + 后端打分器 + 数据集。给 agent 一份输入文档（简历、论文、自然语言描述），让它把内容填进 HTML 表单。
  论文：https://arxiv.org/abs/2506.01520 ；仓库：https://github.com/formfactory-ai/formfactory ；主页：https://formfactory-ai.github.io/
- **许可证**：论文第 7 节和 README 都写 **MIT**；但仓库根目录**实际没有 LICENSE 文件**（README 里链接的 `LICENSE` 不存在，GitHub API 的 licence 字段为空）。代码与数据同仓库，未区分。商用前建议向作者确认。
- **自托管/离线**：可以，而且很轻。`python app.py` 起 Flask，默认 `http://127.0.0.1:5000/`，Python 3.8+，无 Docker、无外网依赖。
- **表单形态（如实说）**：
  - 仓库 `templates/` 下有 **25 个表单模板**（A11–H12），论文正文写「20 个表单」，README 写「40+」，三处数字互相不一致；以仓库实际文件为准是 25 个。
  - 8 个领域（学术、商务、艺术、技术、金融、医疗、法律、制造），1,250 个实例，13,800 个字段-值对。
  - **每表字段数只有 4–22 个**（论文 Table 1），最大的是 Real Estate Rental Application（22 字段）。与我们 40–90 字段差一个量级。
  - 字段类型 9 类：日期、二选一、下拉、长文本描述、文件上传、多选、复选框、数字、字符串。25 个里有 14 个标了 Multi Page。
  - 有「Scholarship Application for Students」「Job Application for University Positions」这类主题，但都是作者自己写的简化 HTML，**不是**真实申请系统的复刻。
  - **没有**查找弹窗、repeater、上传裁剪对话框；日期选择器从论文截图看是浏览器原生 `<input type="date">`，不是自定义组件。README 提到「repeatable sections, cascading dependencies」，本次未能在模板里核实其复杂程度。
- **打分**：表单**提交后**由后端把提交值与 gold JSON 逐字段比对。指标分 Atomic（按字段类型）和 Episodic（整表端到端）两层，每层报 **Click**（点中正确 UI 元素的准确率）和 **Value**（内容正确率；长文本用 BLEU，其余 exact match）。论文自己承认 Value 指标偏松：只要值出现在模型输出里就算对，不管有没有填进正确位置。
- **接入成本：低–中**。打开本地 URL 即可，agent 无关（论文里用 PyAutoGUI 坐标点击只是他们的 baseline，不是环境要求）。障碍有两个：(a) 官方打分依赖「点 Submit」，与我们「不许提交」的 agent 规则冲突——可以改为提交前用 `Runtime.evaluate` 读所有表单控件的值，自己对 gold JSON 打分；(b) 多页表单翻页后前页的值是否还能从 DOM 读到，未能核实，可能要每页读一次。
- **结论**：能当**冒烟测试/回归集**，当不了主 benchmark——字段太少、没有二级界面、没有「禁止动作」维度。

### 1.2 Mind2Web

- **是什么**：OSU 的大规模网页操作数据集，2,000+ 任务、137 个真实网站、31 个领域，每条是人类标注的动作序列（CLICK/TYPE/SELECT）加页面快照。
  仓库：https://github.com/OSU-NLP-Group/Mind2Web
- **许可证**：代码 **MIT**；数据集 **CC BY 4.0**，并声明仅为研究目的发布。
- **自托管/离线**：是「离线」的，但意思是**静态数据集**：HTML/MHTML 快照、DOM JSON、截图、网络 trace。没有可交互环境，快照不能真正「填完再检查」。
- **长表单/二级界面**：有订机票、订餐、搜索过滤这类带表单的步骤，但都是搜索/筛选型短表单；没有 40+ 字段的多页申请表。
- **打分**：**逐步轨迹匹配**——Element Accuracy、Operation F1、Step Success Rate、任务级 SR。不是终态检查。
- **接入成本：高（实质上不适用）**。它评的是「给定快照预测下一步动作」，我们的 harness 是「放手让 agent 做完再看终态」，范式不匹配。

### 1.3 Online-Mind2Web

- **是什么**：Mind2Web 的在线版，300 个任务、136 个真实在线网站，团队会定期替换失效任务（2025-11 换过 36 个）。
  仓库：https://github.com/OSU-NLP-Group/Online-Mind2Web
- **许可证**：代码 **MIT**；数据集 **CC BY 4.0**。
- **自托管/离线**：不能。全部是**线上真实网站**，会随时间漂移、遇到验证码和反爬。
- **长表单/二级界面**：任务以检索、筛选、加购、预订流程为主，刻意回避需要登录和产生真实后果的操作；没有长申请表。
- **打分**：**LLM-as-judge（WebJudge）**：从任务描述抽关键点 → 从轨迹里挑关键截图 → 判定成败；与人工一致率约 85–87%。另有人工评测标签。
- **接入成本：中**。不需要 gym 环境，但 judge 需要**整条轨迹的截图 + 动作历史**，而不是一次终态检查；我们得额外导出轨迹。任务形态不相关，投入不值。

### 1.4 WebArena（及 WebArena-Verified）

- **是什么**：CMU 的自托管网站沙箱：电商、电商后台 CMS（Magento）、Reddit 克隆、GitLab、地图、Wikipedia，共 812 个任务。
  仓库：https://github.com/web-arena-x/webarena ；校验版：https://github.com/ServiceNow/webarena-verified
- **许可证**：**Apache-2.0**（两个仓库都是）。各站点内嵌的第三方软件（Magento、GitLab、Postmill 等）各有自己的许可证，未逐一核实。
- **自托管/离线**：可以，Docker 镜像或官方 AWS AMI。原版镜像体积很大（具体 GB 数本次未能核实；WebArena-Verified 称其优化镜像「最多缩小 92%」）。每轮评测后需要重置站点状态。
- **长表单/二级界面**：有一些真实的后台表单——Magento 后台新建商品/修改订单、GitLab 新建 issue/项目/成员、Reddit 发帖。是**单页中等长度**表单（十来个字段），带一些真实组件（富文本、标签选择、日期）。没有多页向导式申请表，没有上传裁剪。
- **打分**：**终态/程序化检查**，三类：`string_match`（答案匹配）、`url_match`、`program_html`（在页面里执行 JS locator 取值再比对）。WebArena-Verified 改为**离线 network trace（HAR）回放 + 结构化 JSON 答案**的确定性评估，不用 LLM judge，并声明任何黑盒 agent 只要能交 HAR + JSON 就能评。
- **接入成本：高**。Docker 大镜像 + 状态重置 + Python/Playwright 评估器。值得注意的是 `program_html` 的思路（页面内 JS 取值）和我们「一次 `Runtime.evaluate`」是同一种机制，可以借鉴写法；WebArena-Verified 的 HAR 路线则要求我们额外录网络 trace。

### 1.5 VisualWebArena

- **是什么**：WebArena 的多模态版，910 个任务，新增 Classifieds（分类信息）站点，另有 Shopping、Reddit；任务需要看图。
  仓库：https://github.com/web-arena-x/visualwebarena
- **许可证**：**MIT**。
- **自托管/离线**：同 WebArena，Docker/AMI。
- **长表单/二级界面**：Classifieds 站有发布/编辑 listing、评论一类的表单任务（是否包含图片上传类任务，本次仅见二手转述，未能在任务文件里核实）。仍是短表单。
- **打分**：执行式终态检查，外加图像相似度/VQA 类评估函数。
- **接入成本：高**，理由同 WebArena。

### 1.6 WebVoyager

- **是什么**：643 个任务、15 个真实线上网站（Booking、Google Flights、ArXiv、BBC 等），另附 90 个 GAIA 任务。
  仓库：https://github.com/MinorJerry/WebVoyager
- **许可证**：**Apache-2.0**（代码与任务数据同仓库）。
- **自托管/离线**：不能，线上真实网站；不少任务带日期，已经过期失效（业界普遍要做任务修补）。
- **长表单/二级界面**：订房/查航班会碰到**真实的自定义日期选择器和自动补全**，但都属于搜索表单，不是数据录入长表单。
- **打分**：**GPT-4V 看最终截图 + agent 回答**做 judge，辅以人工评测。
- **接入成本：中**。只需要截图和最终回答，但 judge 是 LLM、站点会漂移、任务形态不相关。原版用 Selenium，不过环境本身不强制。

### 1.7 BrowserGym / WorkArena / WorkArena++

- **是什么**：BrowserGym 是 ServiceNow 的 web agent 统一 gym 框架（收录 MiniWoB、WebArena、WebArenaVerified、VisualWebArena、WorkArena、AssistantBench、WebLINX、OpenApps、TimeWarp）。WorkArena 是建在真实 **ServiceNow** 企业平台上的任务集：L1 有 33 类任务 / 19,912 个实例；WorkArena++ 有 682 个组合型长任务。
  仓库：https://github.com/ServiceNow/BrowserGym ；https://github.com/ServiceNow/WorkArena ；论文：https://arxiv.org/abs/2403.07718
- **许可证**：两个仓库的 LICENSE 均为 **Apache-2.0**（GitHub API 显示 NOASSERTION，直接读 LICENSE 文件确认）。ServiceNow 平台本身是专有软件，实例需通过 Hugging Face 上的 gated 仓库申请。
- **自托管/离线**：**不能离线**。必须连一个远程 ServiceNow 实例（官方提供的实例池或自己的开发者实例）。
- **长表单/二级界面**：这是现有 benchmark 里**表单组件最真实**的一个。L1 六大类：knowledge base、**forms**、**service catalog**、lists、dashboards、menus。表单任务是新建 incident / change request / problem / hardware asset / user 等记录（据论文，本次未逐项核对数量）：单页但分 tab，字段十几到几十个，含 **reference 字段（自动补全 + 放大镜查找弹窗）**、日期时间选择器、级联选择——和我们的「lookup modal」最像。Service catalog 任务是按规格配置并下单硬件。WorkArena++ 把这些原子任务串成需要规划/推理/记忆的长流程。缺的是：多页向导、repeater、上传裁剪。
- **打分**：**终态检查，但查的是后端**：`task.validate()` 通过 ServiceNow 的 API 查数据库记录是否按要求创建/修改（验证细节据论文，本次未读源码核实）。
- **接入成本：高**。三重障碍：(1) 必须跑 Python gym 环境，BrowserGym 用 **Playwright 自己启动并拥有 Chromium**，仓库文档里没有「attach 到外部 CDP 浏览器」的官方路径；(2) 任务的 setup/teardown（建用户、清记录）都在 Python 里调 ServiceNow API；(3) 验证不是看页面而是查后端。想绕开就等于重写它。

### 1.8 MiniWoB++

- **是什么**：100+ 个合成的微型网页交互任务（160×210 像素的小页面），web agent 领域的「单元测试」。
  仓库：https://github.com/Farama-Foundation/miniwob-plusplus （已进入维护模式）
- **许可证**：**MIT**。
- **自托管/离线**：完全可以。就是一堆**静态 HTML/JS 文件**，本地 file:// 或任意静态服务器即可。
- **长表单/二级界面**：没有长表单，但**控件微任务很全**：`choose-date`、`enter-date`、`use-autocomplete`、`use-spinner`、`click-checkboxes`、`choose-list`、`login-user`、`form-sequence`、`book-flight`（自动补全 + 日期选择器 + 结果选择的迷你组合）等。日期选择器用的是 jQuery UI datepicker——正是真实申请系统里常见的那类自定义控件。
- **打分**：**页面内 JS 自己算 reward**（全局变量，如 `WOB_REWARD_GLOBAL`），带时间衰减和单集超时。
- **接入成本：低–中**。打开本地 URL、agent 操作、`Runtime.evaluate` 读 reward 变量——和我们的 harness 天然吻合。要处理的是：需要调页面里的 JS 启动一集并设随机种子；默认单集时限只有十几秒量级（对 LLM agent 太短，需要改超时/关掉时间衰减）；任务说明在页面里而不是外部给定。

### 1.9 WebLINX

- **是什么**：McGill 的「对话式网页导航」数据集：用户与 agent 多轮对话，agent 在真实网站上操作。论文称 2,300+ 条演示、150+ 个网站（本次未逐项核对；HF 页面显示约 8 万行样本）。
  仓库：https://github.com/McGill-NLP/weblinx ；数据：https://huggingface.co/datasets/McGill-NLP/WebLINX
- **许可证**：代码 **Apache-2.0**；数据集 **CC BY-NC-SA 4.0（禁止商用）**——对我们是硬伤。
- **自托管/离线**：静态数据集（后来接入了 BrowserGym，但核心仍是按轮次的离线预测）。
- **长表单/二级界面**：演示里会有填表动作，但不是以长表单为目标构造的。
- **打分**：**逐轮动作匹配**：元素 IoU、文本 chrF、意图匹配、turn-level F1。
- **接入成本：高（不适用）**。范式不匹配 + 非商用许可。

### 1.10 REAL（AGI Inc.，agisdk，arXiv 2504.11543）

- **是什么**：11 个高仿真、**确定性**的知名网站复刻（Omnizon≈Amazon、DashDish≈DoorDash、FlyUnified≈United、StayNB≈Airbnb、GoCalendar、GoMail、OpenDining、NetworkIn≈LinkedIn、UDriver、TopWork≈Upwork、Zilloft），React + Next.js。v1 有 112 个任务；仓库里 v2 任务目录约 120 个 JSON。
  论文：https://arxiv.org/abs/2504.11543 ；仓库：https://github.com/agi-inc/agisdk ；榜单：https://www.realevals.xyz/ （README 现指向 realevals.ai）
- **许可证**：SDK **Apache-2.0**。复刻网站本身的源码是否开源、以什么许可证发布——**未能核实**。
- **自托管/离线**：**不能离线**。站点托管在 Vercel 公网（v1 如 `https://evals-topwork.vercel.app`，v2 是 `real-*.vercel.app` 的部署 URL）。任何人可以直接在自己的浏览器里打开。依赖第三方持续托管是风险。
- **长表单/二级界面**：有真实感很强的现代 SPA 组件：航班/住宿的日期范围选择器、地址自动补全、结账表单、发邮件、建日历事件、TopWork 的「发布职位」多字段表单。属于**中短表单 + 多步流程**，没有 40+ 字段的申请表，没有 repeater / 上传裁剪。
- **打分**：**终态 state-diff，最对我们胃口**。每个站点有三个端点：`/config`（配置本次运行）、`/finish`（返回本次会话造成的**状态变更 JSON**）、`/submit`。v1 任务的评估器是对这个 diff 做 **JMESPath 查询**（例如 `jobsDiff.added."0".title == "Full-Stack Developer"`）；v2 改成每任务一个 Python eval 脚本。检索类任务用带 rubric 的 LLM judge。论文明确说 harness 支持黑盒 agent。
- **接入成本：中偏低**。流程是「打开 `/config` → 打开任务 URL → agent 工作 → 打开 `/finish` 读 JSON」，比我们的「一次 evaluate」多两次导航，但不需要 Python gym（SDK 自带的是 BrowserGym 分支 + Playwright，可以不用）。v1 的 JMESPath 断言很容易移植成 JS。障碍：站点不在我们手里、状态存储方式未能完全核实、任务与留学申请无关。
- **最值得借的是设计**：确定性复刻 + 会话级 state diff + 声明式断言。

### 1.11 ST-WebAgentBench（IBM，arXiv 2410.06703）—— 与「不许提交」规则最相关

- **是什么**：在 WebArena（GitLab、ShoppingAdmin）和 SuiteCRM 上给每个任务叠加**安全与可信（ST）策略**的评测套件，建在 BrowserGym 上。仓库 README 写 **375 个任务、3,057 条策略实例**（平均每任务 8.2 条）；arXiv 摘要页写的是 222 个任务——版本不同，以仓库为新。
  仓库：https://github.com/segev-shlomov/ST-WebAgentBench ；论文：https://arxiv.org/abs/2410.06703
- **许可证**：LICENSE 文件写明「All code and data is licensed under the **Apache License**」，并列出对 BrowserGym/WebArena 的署名。
- **自托管/离线**：可以但重：WebArena 的 Docker/AMI + 自建 SuiteCRM。
- **长表单/二级界面**：SuiteCRM 的新建/编辑联系人、线索、商机等 CRM 表单（单页中等长度）；不是长申请表。
- **打分**：核心贡献在这里。
  - **CR**：不看策略的完成率；**CuP（Completion under Policy）**：零违规前提下的完成率；**pCuP**：部分完成且零违规；**Risk Ratio**：按维度统计的违规率。
  - 六个策略维度：用户同意（敏感/不可逆操作前先问）、边界与范围、严格执行（不编造输入）、层级遵从（组织 > 用户 > 任务）、鲁棒与安全（不泄露凭据、抗注入）、错误处理。
  - 论文结论：agent 的平均 CuP 不到名义完成率的三分之二。
  - **违规检测靠轨迹**：11 类评估器检查整条动作序列（有没有调 `ask_user`、有没有访问禁止的 URL、点击次数预算、动作顺序、是否出现编造的值），不是只看终态。
- **接入成本：高**（BrowserGym + Docker + 轨迹级评估器）。但**指标体系可以原样搬走**。对我们的提醒：「没有点 Submit」这类禁止动作，单靠终态 `Runtime.evaluate` 不一定看得出来（提交后页面可能跳走），需要 CDP 层面的网络拦截/事件记录来配合。

### 1.12 AssistantBench

- **是什么**：TAU 的开放网页**信息检索**类长耗时任务（如「附近哪家健身房周末早上 7 点前有课」），据论文 214 个任务（本次未重新核对）。
  仓库：https://github.com/oriyor/assistantbench ；论文：https://arxiv.org/abs/2407.15711
- **许可证**：仓库 LICENSE 是 **AI Pubs Open RAIL-S**（带使用限制的 responsible-AI 许可证，非标准 OSI）。HF 数据集的许可证未能核实。
- **自托管/离线**：不能，开放互联网。
- **长表单**：**没有**。纯信息检索，不写入任何东西。
- **打分**：答案匹配（字符串/数字/字典的 F1 与准确率）。
- **接入成本**：低，但**完全不相关**。

### 1.13 WebCanvas / Mind2Web-Live

- **是什么**：iMean AI 的在线评测框架；Mind2Web-Live 是把 Mind2Web 的 542 个任务搬到真实线上网站，并标了 2,439 个「关键节点」中间状态。
  仓库：https://github.com/iMeanAI/WebCanvas
- **许可证**：**MIT**。
- **自托管/离线**：不能，线上真实网站，靠社区持续维护任务有效性（仓库最近一次推送 2025-07）。
- **长表单**：同 Mind2Web，搜索/筛选型短表单。
- **打分**：**关键节点匹配**——在轨迹中途检查 URL 匹配、元素路径匹配、元素值匹配。介于终态检查和轨迹匹配之间，对路径不唯一的任务更宽容。
- **接入成本：中–高**。评估器要在每一步挂钩（Playwright 事件），不是终态一次检查。「关键节点」思想可借。

### 1.14 WebChoreArena

- **是什么**：东大等在 WebArena 四个站点上新写的 532 个「繁琐苦活」任务：海量记忆、计算、跨页长期记忆。
  仓库：https://github.com/WebChoreArena/WebChoreArena
- **许可证**：**Apache-2.0**。
- **自托管/离线**：同 WebArena。
- **长表单**：重点在读和算，不在填。与我们相关的只有「跨页记住大量信息再使用」这个能力点。
- **打分**：沿用 WebArena 的终态/答案匹配。
- **接入成本：高**（同 WebArena）。

### 1.15 TheAgentCompany

- **是什么**：CMU 的「模拟软件公司」：自托管 GitLab、ownCloud、Plane、RocketChat + LLM 扮演的同事，175 个职业任务。
  仓库：https://github.com/TheAgentCompany/TheAgentCompany ；论文：https://arxiv.org/abs/2412.14161
- **许可证**：**MIT**。
- **自托管/离线**：可以，Docker，官方建议 30GB+ 磁盘；同事 NPC 和部分评分需要 LLM API。
- **长表单**：有一个很对口的任务 `admin-mass-forms-filling`：从 CSV 读员工数据，给每个人填一份 **I-9 PDF 表**（要求格式转换，如日期/号码格式）。这是「从材料到表单」的真实文书工作，但填的是 PDF，不是网页表单。
- **打分**：**检查点制**（部分得分）：确定性脚本检查产物 + 部分用 LLM grader。
- **接入成本：高**。任务以 Docker 容器镜像为单位，agent 要在它的沙箱里跑。
- **可借**：检查点式部分得分；「同一份材料批量填 N 份表」的任务构造；格式转换陷阱。

### 1.16 OSWorld

- **是什么**：真实操作系统（Ubuntu/Windows VM）里的 369 个桌面任务（据论文），含 Chrome、LibreOffice、VS Code 等。
  仓库：https://github.com/xlang-ai/OSWorld
- **许可证**：**Apache-2.0**。
- **自托管/离线**：可以，VMware/VirtualBox/Docker(KVM)/AWS；部分任务要 Google 账号和代理。
- **长表单**：Chrome 任务以设置和导航为主，没有长网页表单。
- **打分**：每任务一个**执行式终态检查脚本**（读文件、读应用状态）。
- **接入成本：高，且不相关**（它评的是整机 computer-use，我们评的是内嵌浏览器）。

### 1.17 ClawBench（arXiv 2604.08523）—— 本次调研中最值得注意的新发现

- **是什么**：UBC / TIGER-AI-Lab 的 153 个「日常线上事务」任务，跨 **144 个真实线上平台**、15 个类别，**专门针对写操作密集、有真实后果的任务**：下单、预订、**提交求职申请**、填写大量细节表单。
  论文：https://arxiv.org/abs/2604.08523 ；仓库：https://github.com/TIGER-AI-Lab/ClawBench （原 reacher-z/ClawBench 已迁移）
- **许可证**：**Apache-2.0**。
- **自托管/离线**：不能离线——它的卖点就是真实线上网站。运行在 Docker/Podman 容器里的隔离 Chromium 中。
- **关键机制：拦截最终请求**。用 CDP 的 **`Fetch` 域**，按人工标注的 schema（URL 正则 + HTTP 方法 + 可选 body/参数）**只拦截那一个不可逆的终端请求**（结账、表单提交、发邮件），把请求体存成 `interception.json`，然后终止会话。其它请求（页面加载、AJAX、图片）全部放行，所以 agent 面对的是真实网站行为，却不会产生真实后果。
- **长表单/二级界面**：因为是真实网站，所以**天然包含**真实的多页表单、上传、自定义控件；每次运行给 agent 一份合成人设（`alex_green_personal_info.json`：姓名、地址、电话、生日）和一个一次性邮箱。求职申请类任务的具体数量、字段规模未能核实；没有大学申请系统。
- **打分**：两段式。**阶段 1（确定性）**：被拦截的最终请求是否匹配任务的 URL/方法 schema；**阶段 2（LLM judge / agentic evaluator）**：把 agent 的五层记录（录屏、逐步截图、HTTP 流量、浏览器动作、agent 消息）与**人类参考轨迹**对齐比较，检查字段值与 payload。最高分 33.3%。
- **接入成本：中–高**。harness 可插拔（支持 Playwright MCP、原生 CDP 工具、browser-use、claude-code 等，可注册自定义 harness），但整套跑在它的容器 + 扩展 + 拦截服务里，浏览器归它管；阶段 2 需要完整轨迹。
- **对我们的意义**：任务不能直接用，但「**CDP Fetch 拦截终端请求 + 校验 payload**」几乎就是为我们「填真实申请系统但绝不提交」的约束量身定做的安全网和打分点，而且我们本来就是 CDP 驱动，移植成本低。

### 1.18 Web Bench（Halluminate × Skyvern）与 Skyvern / Browser-use 的评测集

- **Web Bench**：约 5,750 个任务 / 452 个真实网站，其中 2,454 个开源。按 READ(64.4%) / CREATE(20.9%) / UPDATE(7.1%) / DELETE(6.1%) / FILE_MANIPULATION(1.5%) 分类。结论与我们的体感一致：**写操作（登录、填表、下载）是所有 agent 的短板**，最好的全自动 agent 在非 READ 任务上只有 46.6%。
  来源：https://www.halluminate.ai/blog/benchmark ；仓库 https://github.com/Halluminate/WebBench （GitHub API 显示 **MIT**）。线上真实网站；**人工标注员看录屏打分**，LLM judge 尚在计划中。接入成本：中（任务只是 URL + 指令的 CSV），但没有自动打分器、任务短、站点漂移。
- **Skyvern**：自己主要报 WebVoyager（85.85%）和 Web Bench 成绩，没有发现它公开了专门的「申请表单」评测集。Skyvern 本体是 **AGPL-3.0**。
  来源：https://www.skyvern.com/blog/web-bench-a-new-way-to-compare-ai-browser-agents/
- **Browser-use 的 BU Bench**：V1 100 个 / V2 200 个任务，取自 Custom、WebBench、Mind2Web 2、GAIA、BrowseComp；**任务文本加密发布**以防进入训练语料；LLM judge 与人工标注一致率 87%。
  来源：https://github.com/browser-use/benchmark ；https://browser-use.com/posts/ai-browser-agent-benchmark 。仓库未检测到 LICENSE（未能核实许可证）。任务形态以检索/通用浏览为主，不相关；但「**加密任务防污染**」的做法对盲测 benchmark 有参考价值。

### 1.19 其它顺带查到的

- **TurkingBench**（JHU，NAACL 2025）：把真实 MTurk 众包任务的 HTML 模板当作评测页面，任务就是填单选/复选/文本框，本地用 Turkle 在 `localhost:8000` 托管，拿提交值对 gold 标注打分。**Apache-2.0**。https://github.com/JHU-CLSP/turking-bench 。离线、终态字段比对、接入成本低–中；但都是单页标注表单，不是申请表。
- **WARC-Bench**（arXiv 2510.09872）：438 个基于 **Web ARChive 回放**的短程 GUI 子任务（论文点名了「在日期选择器里选对日期」「在容器内滚动」）。用真实网页的存档做沙箱，思路可借；代码仓库与许可证未能核实。
- **WebForge**（arXiv 2604.10988）：用四 agent 流水线**自动生成**自包含的交互式网站环境，934 个任务、7 个领域、3 档难度。https://github.com/yuandaxia2001/WebForge 。是否含表单任务、代码许可证均未能核实（arXiv 论文本身是 CC BY 4.0）。与「自建 benchmark 时用 LLM 批量生成站点」直接相关。
- **FormGym**（arXiv 2506.14079）：填**PDF/图片形态**的纸质表单（给人设 + 空表，用编辑 API 填），不是网页 GUI。只在「人设→字段映射」层面相关。
- **「WebForms」「ApplyBench」**：按这些名字检索，**没有找到**对应的公开 benchmark。也没有找到任何以大学/研究生申请系统为对象的公开 benchmark。

---

## 2. 对比表

图例：✔ 有 / ◐ 部分 / ✘ 无。接入成本指接入「打开 URL → agent 工作 → 一次 `Runtime.evaluate` 查终态」的 Electron+CDP harness。

| Benchmark | 许可证（代码 / 数据） | 可离线自托管 | 多页长表单（40+ 字段） | 二级界面（lookup/repeater/上传裁剪/自定义日期） | 禁止动作（安全）计分 | 打分方式 | 接入成本 |
|---|---|---|---|---|---|---|---|
| FormFactory | MIT（自述；仓库无 LICENSE 文件） | ✔ Flask 本地 | ✘ 多页有，但仅 4–22 字段 | ✘ 基本是原生控件 | ✘ | 提交后逐字段比对 gold；Click/Value，BLEU | 低–中 |
| Mind2Web | MIT / CC BY 4.0 | ◐ 静态快照，不可交互 | ✘ | ✘ | ✘ | 逐步轨迹匹配 | 高（不适用） |
| Online-Mind2Web | MIT / CC BY 4.0 | ✘ 线上网站 | ✘ | ◐ 真实站点控件 | ✘ | LLM judge（WebJudge）+ 人工 | 中 |
| WebArena / -Verified | Apache-2.0 | ✔ Docker/AMI，体积大 | ✘ 单页中等表单 | ◐ | ✘ | 终态程序化检查；Verified 用 HAR 回放 | 高 |
| VisualWebArena | MIT | ✔ Docker/AMI | ✘ | ◐ | ✘ | 终态检查 + 图像评估 | 高 |
| WebVoyager | Apache-2.0 | ✘ 线上网站 | ✘ | ◐ 真实日期选择器/补全 | ✘ | GPT-4V 看截图 judge + 人工 | 中 |
| WorkArena / ++ | Apache-2.0（平台专有） | ✘ 需远程 ServiceNow 实例 | ◐ 单页分 tab，十几到几十字段 | ◐ reference 查找弹窗、日期时间控件；无 repeater/裁剪 | ✘ | 终态，但查后端数据库 | 高 |
| MiniWoB++ | MIT | ✔ 静态 HTML | ✘ 微任务 | ◐ 日期选择器/补全/spinner 微任务 | ✘ | 页面内 JS reward | 低–中 |
| WebLINX | Apache-2.0 / **CC BY-NC-SA 4.0** | ◐ 静态数据集 | ✘ | ✘ | ✘ | 逐轮动作匹配 | 高（不适用） |
| REAL (agisdk) | Apache-2.0 / 站点源码未能核实 | ✘ Vercel 公网托管 | ✘ 中短表单 + 多步流程 | ◐ 日期范围、地址补全 | ✘ | **会话 state-diff + JMESPath/脚本断言**；检索类 LLM judge | 中偏低 |
| ST-WebAgentBench | Apache（代码与数据） | ✔ 但重（WebArena + SuiteCRM） | ✘ CRM 单页表单 | ◐ | **✔ CuP / pCuP / Risk Ratio** | 终态 + **轨迹级策略评估器** | 高 |
| AssistantBench | Open RAIL-S / 数据未能核实 | ✘ | ✘ 纯检索 | ✘ | ✘ | 答案匹配 F1 | 低（不相关） |
| WebCanvas / Mind2Web-Live | MIT | ✘ 线上网站 | ✘ | ◐ | ✘ | 关键节点匹配（URL/元素/值） | 中–高 |
| WebChoreArena | Apache-2.0 | ✔ 同 WebArena | ✘ | ◐ | ✘ | 终态/答案匹配 | 高 |
| TheAgentCompany | MIT | ✔ Docker 30GB+ | ◐ 批量填 I-9 PDF（非网页） | ✘ | ✘ | 检查点部分得分（脚本 + LLM） | 高 |
| OSWorld | Apache-2.0 | ✔ VM | ✘ | ✘ | ✘ | 终态检查脚本 | 高（不相关） |
| ClawBench | Apache-2.0 | ✘ 线上网站（容器内） | ◐ 真实站点的真实表单，无大学申请 | ✔ 真实站点自带 | ◐ **拦截终端请求**（防后果，非违规计分） | 拦截请求 schema 匹配 + LLM 对照人类轨迹 | 中–高 |
| Web Bench | MIT（API 显示） | ✘ 线上网站 | ✘ 短任务 | ◐ | ✘ | 人工看录屏 | 中 |
| BU Bench | 未能核实 | ✘ | ✘ | ✘ | ✘ | LLM judge（87% 一致） | 中（不相关） |
| TurkingBench | Apache-2.0 | ✔ 本地 Turkle | ✘ 单页标注表单 | ✘ | ✘ | 提交值对 gold | 低–中 |

---

## 3. 结论

**没有一个现成 benchmark 能替代我们要建的东西。** 说得直白一点：

1. **形态不对**。现有 benchmark 的「表单」要么是搜索/筛选短表单（Mind2Web 系、WebVoyager、Online-Mind2Web），要么是企业后台的单页中等表单（WebArena、WorkArena、SuiteCRM），要么是十几个字段的合成表单（FormFactory，最多 22 字段）。**40–90 字段、多页、带保存草稿、带 lookup 弹窗 + repeater + 上传裁剪 + 自定义日期控件的申请系统，公开 benchmark 里不存在**；以大学申请为对象的 benchmark 一个也没找到。
2. **约束不对**。我们的核心规则是「填完、保存草稿、但**绝不**提交/付款/发推荐信邀请/勾同意」。只有 ST-WebAgentBench 系统性地给「违规」计分，只有 ClawBench 认真处理了「真实网站上不产生后果」。其它 benchmark 恰恰以「点了提交」为成功标志（FormFactory 甚至必须提交才打分）。
3. **接入方式不对**。最对口的几个（WorkArena、ST-WebAgentBench、WebArena 系）都要求 Python gym + Playwright **由 benchmark 方拥有浏览器**，外加 Docker 大镜像或远程 ServiceNow 实例，与我们「Electron 内嵌浏览器 + CDP、只能开 URL 和查终态」的 harness 根本冲突。能低成本接入的（FormFactory、MiniWoB++、TurkingBench、REAL）又都太短太简单。
4. **盲测要求**。公开 benchmark 的任务与答案都在网上（BU Bench 为此专门加密任务），拿来做「盲」评测本身就打折扣。

**建议：自建 benchmark**——做一组确定性的、本地静态托管的「申请系统复刻站」，终态用一次 `Runtime.evaluate` 取出，按字段比对 gold，并把禁止动作单独计分。现有 benchmark 只当两种用途：

- **可以直接拿来跑的小配菜（可选）**：MiniWoB++ 的控件微任务（MIT、静态 HTML、页面内 reward）和 FormFactory 的 25 个表单（提交前读 DOM 自行比对）作为**回归/冒烟集**，成本低，能及早发现「日期控件不会用」「下拉选不中」这类基础退化。REAL 的公开站点可以偶尔手动跑一下看现代 SPA 控件的表现，但不要让 CI 依赖别人的 Vercel 部署。
- **借设计，不借数据**：见下一节。

---

## 4. 值得借鉴的任务/设计 IDEA（只借思路，不借数据）

### 来自 FormFactory
- **字段类型分类法**：string / 长文本 / 下拉 / 单选 / 复选 / 多选 / 日期 / 数字 / 文件上传。我们在此基础上补「二级界面」类型：lookup 弹窗、级联下拉、repeater 行、上传 + 裁剪、自定义日期选择器、带格式掩码的输入（电话、邮编）。
- **双层指标**：Atomic（按字段类型分桶的准确率，一眼看出哪类控件是短板）+ Episodic（整表端到端）。
- **长文本与短值分开计分**：短值 exact/规范化匹配，长文本（个人陈述摘要、工作描述）用相似度而不是 exact。
- **难度随字段数和类型数上升的曲线**：论文图 5–7 表明准确率随字段数单调下降——我们应当按 20/40/60/90 字段分档出题，画同样的曲线。
- **反面教训**：它的 Value 指标「值出现在输出里就算对」太松。我们必须检查**值落在了正确的字段里**（姓/名互换、占位符被当数据填进去，正是我们 NTU 实测里出过的错）。

### 来自 ST-WebAgentBench
- **CR vs CuP 两个数并排报**：完成率，以及「零违规前提下的完成率」。再加 **pCuP**（部分完成且零违规）和按维度的 **Risk Ratio**。
- **把我们的四条禁令写成策略实例**：不最终提交、不付款、不发推荐人邀请、不勾同意条款；每条单独统计违规率。
- **「严格执行/不编造」维度**：材料里没有的信息（如 GRE 分数、第二推荐人电话）必须留空并上报，填了就算 hallucination 违规——这对顾问场景是致命错误，值得单独一个指标。
- **「用户同意」维度**：遇到不可逆或含糊的步骤，正确行为是停下来问人（对应它的 `ask_user`），而不是自己决定。
- **同一任务叠加不同策略负载的难度分层**（Easy/Medium/Hard 为严格超集）：用来区分「任务难」和「规矩多」。
- **提醒**：违规检测要靠轨迹/事件，不能只靠终态。

### 来自 ClawBench
- **CDP `Fetch` 域拦截终端请求**：在复刻站和（将来的）真实站点上，把最终提交/付款/发邀请的请求按「URL 正则 + 方法」拦下来，记录 payload 后阻断。既是安全网，又是「违规」的确定性证据，还能顺便拿到完整提交 payload 做字段级比对。
- **合成人设 + 一次性邮箱**：每次运行用合成学生档案，不碰真实学生数据。
- **与人类参考运行对照**：每个任务留一份人工填写的参考终态，用于校准 gold 和评分器。

### 来自 REAL
- **确定性复刻站 + 会话级 state diff**：站点自己记录「本次会话相对初始状态改了什么」，暴露成一个 JSON（对我们就是一个 `window.__benchState()` 之类的全局函数，正好一次 `Runtime.evaluate` 取走）。
- **声明式断言**：每个任务的评估器是一组「JSON 路径 + 期望值 + 描述」的断言（它用 JMESPath），而不是手写脚本；新增任务只写数据，不写代码。
- **`/config` 式的运行配置**：用 URL 参数决定本次运行的种子、初始数据、延迟、是否注入干扰——让同一个站点产出多个变体，支撑盲测。
- **动作类与检索类任务分开**：我们也可以加少量「核对类」任务（让 agent 报告哪些字段因材料缺失而未填）。

### 来自 WorkArena / WorkArena++
- **reference 字段的两种填法**：输入后从自动补全里选，或点放大镜开查找弹窗再搜索选择——两条路径都要出题（学校名、国家、专业代码）。
- **表单 tab 与必填校验**：必填项分散在不同 tab，保存时才报错，考察 agent 是否会读错误提示并回去补。
- **service catalog 式「按规格配置」任务**：对应我们的「按选校单选择学位项目 / 入学学期 / 校区」。
- **原子任务 → 组合任务**：先有每类控件的原子题，再组合成整份申请（WorkArena++ 的 L1→L2/L3 思路）。
- **同一任务海量实例化**：33 类任务 × 参数采样出近 2 万实例——我们用「学生档案 × 申请系统 × 变体种子」做同样的事，防止对固定题目过拟合。

### 来自 MiniWoB++
- **控件级单元测试**：`choose-date` / `enter-date`（jQuery UI datepicker）、`use-autocomplete`、`use-spinner`、`click-checkboxes`、`choose-list`、`form-sequence`、`book-flight`。在做长表单之前，先确保每种控件单独能过；长表单失败时用它们定位是「不会操作控件」还是「不会映射信息」。
- **页面内自带 reward 变量**：与「一次 `Runtime.evaluate`」天然契合，我们的复刻站应采用同样的约定。
- **随机种子**：同一任务每次渲染不同的值/布局。

### 来自 WebArena / WebArena-Verified
- **`program_html` 评估器写法**：每条检查 = 页面内一个 JS locator + 期望值 + 匹配方式（exact / must_include / fuzzy）。
- **Verified 的教训**：原版 WebArena 有大量评估器误判，后来靠「类型感知的规范化 + 结构化比较」修复。我们从第一天就要做**值规范化**（日期格式、电话国家码、大小写、全半角、学校别名）再比较，并人工审计 gold。
- **每轮重置状态**：草稿保存在哪里、如何在运行之间清空，要在站点设计时就定好。

### 来自 Mind2Web-Live / WebCanvas
- **关键节点（key nodes）**：除终态外，定义少量必须经过的中间状态（如「教育经历 repeater 至少新增到 2 行」「上传裁剪对话框点了确认」），用于部分得分和失败归因；对路径不唯一的长任务比整条轨迹匹配公平。

### 来自 Online-Mind2Web / WebVoyager / BU Bench / Web Bench
- **LLM judge 只做补充**：它们的 judge 与人工一致率约 85–87%，对 90 个字段的表单来说误差太大；字段级确定性比对才是主分，LLM judge 只用于长文本质量和「是否合理地留空并上报」。
- **任务会过期**：WebVoyager 的带日期任务大面积失效——我们的学生档案和申请季日期要相对化（如「下一个秋季入学」），或固定站点时钟。
- **加密发布任务与答案**（BU Bench）：盲测集的 gold 不进仓库明文，防止进入训练语料或被 agent 在材料文件夹里翻到。
- **READ / CREATE / UPDATE / DELETE 分类**（Web Bench）：除了「从空表填起」，还应有 UPDATE 类任务——**接着一份填了一半的草稿继续填、并纠正其中的错值**，这是顾问的真实日常。

### 来自 TheAgentCompany / WebChoreArena / TurkingBench / WARC-Bench / WebForge
- **检查点式部分得分**（TheAgentCompany）：长任务不是 0/1，而是按页/按分组给分。
- **格式转换陷阱**（TheAgentCompany 的 I-9 任务）：材料里的日期、电话、GPA 制式与表单要求的格式不同，必须转换。
- **批量任务**：同一学生填多个学校，或同一系统填多个学生，考察跨任务的信息一致性。
- **跨页长期记忆**（WebChoreArena）：第 1 页填的信息决定第 5 页出现哪些字段；材料分散在多个文件里（成绩单 PDF、护照扫描件、简历），需要汇总后使用。
- **真实页面存档回放**（WARC-Bench）与**真实模板本地托管**（TurkingBench）：复刻站可以从真实申请系统的页面结构出发（只取结构与控件行为，不取其受版权保护的文案与品牌），保证控件的「脏」和真实世界一致。
- **LLM 流水线批量生成站点**（WebForge 的 Plan→Generate→Refine→Validate）：用来低成本地产出多个风格各异的申请系统变体，再人工审核。

---

## 5. 主要来源

- FormFactory：https://arxiv.org/abs/2506.01520 ，https://github.com/formfactory-ai/formfactory
- Mind2Web：https://github.com/OSU-NLP-Group/Mind2Web ；Online-Mind2Web：https://github.com/OSU-NLP-Group/Online-Mind2Web
- WebArena：https://github.com/web-arena-x/webarena ；WebArena-Verified：https://github.com/ServiceNow/webarena-verified ；VisualWebArena：https://github.com/web-arena-x/visualwebarena
- WebVoyager：https://github.com/MinorJerry/WebVoyager
- BrowserGym：https://github.com/ServiceNow/BrowserGym ；WorkArena：https://github.com/ServiceNow/WorkArena ，https://arxiv.org/abs/2403.07718
- MiniWoB++：https://github.com/Farama-Foundation/miniwob-plusplus
- WebLINX：https://github.com/McGill-NLP/weblinx ，https://huggingface.co/datasets/McGill-NLP/WebLINX
- REAL：https://arxiv.org/abs/2504.11543 ，https://github.com/agi-inc/agisdk ，https://www.realevals.xyz/
- ST-WebAgentBench：https://arxiv.org/abs/2410.06703 ，https://github.com/segev-shlomov/ST-WebAgentBench （LICENSE：https://raw.githubusercontent.com/segev-shlomov/ST-WebAgentBench/main/LICENSE ）
- AssistantBench：https://github.com/oriyor/assistantbench ，https://arxiv.org/abs/2407.15711
- WebCanvas / Mind2Web-Live：https://github.com/iMeanAI/WebCanvas
- WebChoreArena：https://github.com/WebChoreArena/WebChoreArena
- TheAgentCompany：https://github.com/TheAgentCompany/TheAgentCompany ，https://arxiv.org/abs/2412.14161
- OSWorld：https://github.com/xlang-ai/OSWorld
- ClawBench：https://arxiv.org/abs/2604.08523 ，https://github.com/TIGER-AI-Lab/ClawBench
- Web Bench：https://www.halluminate.ai/blog/benchmark ，https://github.com/Halluminate/WebBench ；Skyvern：https://www.skyvern.com/blog/web-bench-a-new-way-to-compare-ai-browser-agents/
- BU Bench：https://github.com/browser-use/benchmark ，https://browser-use.com/posts/ai-browser-agent-benchmark
- TurkingBench：https://github.com/JHU-CLSP/turking-bench ；WARC-Bench：https://arxiv.org/abs/2510.09872 ；WebForge：https://arxiv.org/abs/2604.10988 ；FormGym：https://arxiv.org/abs/2506.14079
