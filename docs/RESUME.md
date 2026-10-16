# 简历工作室（LaTeX Resume）

按学生档案 `student_profile.json` + 求职目标 `job_target.json`，一键生成某方向的 LaTeX 简历并编译导出 PDF。核心在 `src/main/resume/`。

## 链路

```
学生档案 student_profile.json（名字/联系/教育/实习/项目/领导力/技能，bullets 量化优先）
  + 方向（track：general/data/engineering/marketing/finance/accounting）
        ↓ resume-core.buildLatex（纯函数，可单测）：Charter 紧凑单页模板 + 各节映射
        ↓ 写入 resume/resume-<track>-<姓名>/main.tex
        ↓ 找引擎：tectonic → pdflatex（含 /Library/TeX/texbin）→ xelatex
        ↓ 编译（tectonic 首编联网下宏包 + 3 次外层重试抗弱网；别的引擎跑两遍）
        ↓ copy 出 resume/Resume_<Track>_<Name>.pdf（工程内 main.pdf 保留）
```

简历节顺序：Heading（名字/城市/电话/邮箱/LinkedIn/GitHub/网站）→ Summary → **Professional Experience → Academic Projects → Education → Leadership & Activities → Skills**（经验/项目靠前，符合商科/求职习惯；Education 里的 GPA、核心课程、荣誉照写）。

## 两个入口

1. **界面**：首页「简历」→ 选学生 + 方向 → 生成；生成后台自动在访达里挑出 PDF。设置页有「简历」节负责引擎检测/重测。
2. **AI 对话**：`resume_compile`（MCP 工具，挂在 `/resume` 路由）——模型改完 `main.tex` 调它：给 `resume/` 或某个 `resume/<方向>-<姓名>/` 路径即编译导出。**只编译 `workspacesRoot()` 以内的路径**。

## 模板骨架（来自 resume-latex skill，尽量不偏离）

- `\documentclass[a4paper,10pt]{article}` + Charter 字体 + `fullpage/titlesec/marvosym/color/verbatim/enumitem/hyperref/fancyhdr`。
- 边距 `left=0.35in, right=0.35in, top=0.5in, bottom=0.35in`；`\flushbottom` + 首尾 `\vspace*{\fill}` 垂直居中。
- 命令 `\resumeItem` / `\resumeItemWithTitle` / `\resumeSubheading` / `\resumeSubHeadingListStart/End`。
- 内容是**纯英文**的；中文姓名/公司走拼音或官方英文名。特殊字符全部转义（`\& \% \# \$ \_ \^ \~ \{ \} \\`）。

## 引擎

| 引擎 | 优点 | 怎么来 |
|---|---|---|
| tectonic | 单文件；首次编译自动从网络下载宏包并缓存（`~/.cache/Tectonic`） | `brew install tectonic` 或 GitHub release 二进制 |
| pdflatex / xelatex | 全功能（装好常见宏包就有） | `brew install --cask mactex-no-gui` |

没有引擎时：`findEngine()` 返回 `{ kind: "none", note: "…去装一个…" }`，设置页/简历页明说怎么装；`smoke:resume` 会如实报告并跳过编译断言（不失败）。

## 修改简历的正确姿势

1. 直接改 `resume/<方向>-<姓名>/main.tex`（自己或让 AI 改）。
2. 重新编译导出：
   - 界面外：对话里说“重新编译简历”，AI 调 `resume_compile`；
   - 或者后台直接 `resume:generate` IPC。
3. 检查导出的 `Resume_<Track>_<Name>.pdf`。

注意事项：想加一页纸之外的内容，先看是否挤到第 2 页；bullets 保持**动词开头 + 数字量化**（+40%、2,000+）。

## 测试

- `bun test src/main/resume` —— `resume-core`：各节是否都在、特殊字符转义、空数据不掉链子、direction/命名辅助。
- `bun run smoke:resume` —— 真实编译断言：`main.tex` + 导出的 PDF 存在、PDF 魔数 `%PDF-`、`resume_compile` 重编不破坏。
