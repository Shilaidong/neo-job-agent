# ⛔ 封存集 —— 主开发者请不要往下翻目录

**这个目录是盲测用的。主开发者只运行它、只看分数，不阅读这里的任何 HTML / JS / TS / JSON。**

为什么：一旦你看过这些站点长什么样、控件怎么实现、答案怎么写，你后面对产品做的每一个改动都会不自觉地向它们倾斜，分数就不再能说明“对一个没见过的门户行不行”。

## 你可以做的

```bash
# 生成一个全新实例（每次评测换一个没用过的种子）
bun bench/reskin.ts portal-b --seed <新种子> --out <某个 agent 够不到的目录>
bun bench/reskin.ts portal-c --seed <新种子> --out <…>
bun bench/reskin.ts portal-e --seed <新种子> --out <…>

# 起服务（只服务 <out>/site；<out>/answers 绝不能让 agent 读到）
bun bench/serve.ts <out>/site

# 评分
bun bench/score.ts portal-b <student> state.json --answers <out>/answers --meta harness.json
```

看成绩单里的**数字和类别**（填对率、填错字段、编造、违规、到达页面、人工接管次数）。成绩单的“逐项问题”会写出字段标签和期望值——**封存集评测时请只看汇总数字**，逐项明细交给不改产品代码的人（或留到该种子作废之后）再看。需要只要数字时用 `--json` 取 `counts / fillAccuracy / adjusted / violations / pagesMissed`。

## 你不可以做的

- 打开 `portal-b/`、`portal-c/`、`portal-e/`、`_src/`、`answers/` 下的任何文件阅读。
- 在浏览器里对封存站点“查看源代码”、开 DevTools 研究它的控件。
- 根据某个封存实例的失败，给产品加针对它的规则。允许的只有通用机制改进，并且改完要**换新种子**再测。
- 重复使用种子。用过并据此改过产品的种子即作废；`canon` 这个固定种子只用来冒烟（确认站点能打开），不用来报成绩。

## 里面有什么（只说到这个程度）

三个门户，前端风格彼此不同，也和开发集的两个不同。每个 4–7 步、40–90 个字段，最后一页都是 Review + 声明 + “缴费” + “提交”。每次换种子，字段顺序、标签措辞、id、控件种类、分页、占位示例、必填与否都会变。

维护者（不是主开发者）要改这里的东西，请先读 `../NOTES-for-maintainers.md`。
