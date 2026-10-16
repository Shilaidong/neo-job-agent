# 岗位中心（Job Feed）

每天自动把各平台的岗位拉回**本机**保存，按每个学生的求职目标筛好，供查看和「一键投递」。

## 几条链路

```
数据源（设置 · 岗位中心 / feed/sources.json）
  ├─ rss         LinkedIn / Indeed…… 任意 RSS/Atom → 迷你解析器（feed-core.parseRss）→ 条目
  ├─ greenhouse  boards-api.greenhouse.io/v1/boards/<slug>/jobs?content=true
  ├─ lever       api.lever.co/v0/postings/<slug>?mode=json
  ├─ ashby       api.ashbyhq.com/posting-api/job-board/<slug>
  └─ json        通用 JSON（接受 { … } / { jobs:[…] } / { items:[…] } / 数组）
        ↓ normalizeEntry：剥 HTML、抽公司（"Title at Company" / 来源名）、分类（实习/全职/远程）、
          规范地点、sha1(来源+URL) 做去重 id
        ↓ runOnceNow()：所有源并发抓取，按 id 合并（新的赢），60 天裁剪，留最新 500 条
          存 userData/feed/snapshot.json
        ↓ 对每个学生：job_target.json × matchEntry() → 契合分 + 命中原因（存 feeds[studentDir].matches）
        ↓ overview() → 岗位中心界面；「投递」→ feed:applyToJob → 建任务并打开工作台
```

定时（`feed/scheduler.ts` + 纯调度数学 `feed/schedule-core.ts`）：

- **北京 13:00**（比较基准 `Asia/Shanghai`）和 **美国东部 13:00**（`America/New_York`，DST 正确）各一条 setTimeout。
- 错过的时间点：启动后 4 秒 + 每次 mac 睡醒（`powerMonitor.on("resume")`）检查——本次的槽已经过去且没有更新的完成时间就补抓一次。
- 时间可关、可改（设置页 / 岗位中心状态栏）。补抓可关（`catchUpOnLaunch`）。

## 匹配打分（`feed-core.matchEntry`，纯函数）

每个词都小写、去空白后按子串命中：

| 项目 | 加分 | 说明 |
|---|---|---|
| 标题命中关键词 | +35/个，封顶 +70 | `job_target.roleKeywords` 任一出现在标题 |
| 仅描述命中 | +15/个，封顶 +45 | 标题没有才看描述 |
| 目标公司 | +30 | `companies` 任一在公司名里 |
| 地点符合 | +25 | `locations` 任一出现在岗位地点 |
| 排除地点 | **−100** | `locationExclude` 命中 → 必失败 |
| 只看实习但这是全职 | −25 | `internshipsOnly` 时 |
| 只看全职但这是实习 | −20 | `fullTimeOnly` 时 |
| 技能命中 | +6/个，封顶 +25 | `skills` 出现在标题+描述 |

`matched = score ≥ 35`。空了的目标（什么都没填）永远不匹配、不报错。

## 数据都在哪

- `userData/feed/sources.json` —— 数据源（`JobSource[]`）
- `userData/feed/schedule.json` —— 抓取时间（`FeedSchedule`）
- `userData/feed/snapshot.json` —— 快照 + 上次运行结果（`Snapshot`）
- `<学生>/job_target.json` —— 这位学生的求职目标（工作区里，AI 写 / 界面手编）

## 加一个来源

1. `shared/jobs.ts` 的 `JobSourceKind` 要新类型就在 `sources.ts` 加一个 `fetchXxx` 分支。
2. 默认来源加进 `shared/jobs.ts` 的 `DEFAULT_SOURCES`。
3. 设置页/岗位中心的来源下拉加选项（`Settings.tsx` 的 `modelKind`、`JobCenter` 不用改）。
4. 真联网抓一次（口子：这些源会改），把样例存成 fixture 当确定性测试。

## 测试

- `bun test src/main/feed` —— feed-core（解析/分类/匹配/排除）与 schedule-core（时区/DST/补抓判定）纯函数单测。
- `bun run smoke:feed` —— 离线种子数据的全链路（建学生 → 写目标 → 匹配 → 来源开关 → 调度数学）。

## 心里有数

- 默认的 LinkedIn RSS 会被反爬或改版，不一定天天稳。UI 上失败会被记进 `lastRun.failed` 并显示，不影响其他源。
- 摘要只留最多 40_000 字符；快照最多 500 条、60 天。descriptions 带纯文本（HTML 已剥）。
- 匹配是**筛选**不是**精排**：契合分高 ≠ 一定合适，合适与否让 AI 看岗位详情再判断。
