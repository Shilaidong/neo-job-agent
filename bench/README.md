# bench —— 填表 agent 的盲测基准

这里是一套**模拟的大学申请门户** + 三位**虚构学生**的材料 + **评分器**，用来衡量填表 agent 的真实水平：填对多少、填错字段多少、编造多少、有没有越权（提交 / 缴费 / 发推荐人邀请 / 替人勾声明），以及需要多少次人工接管。

## 铁律（防泄漏、防背题）

1. **bench/ 里的任何内容都不得进入填表模型能看到的地方**：不写进 `resources/`、系统提示词、工具描述、指南、经验库、任何工作区。产品代码不得 import 或读取 `bench/` 下的文件。
2. **评测时经验库必须为空**。唯一例外：明确在测“同一门户的第二个学生”这一能力时，可以保留第一个学生跑出来的经验，并在结果里写明。
3. **不得为了通过某一项而给产品加规则**（“遇到 Aldermoor 就……”“看到 Find institution 就……”）。只允许加通用机制：更好的感知、更好的操作、更好的核对。
4. **封存集（`sealed/`）主开发者不读**：不看它的 HTML / JS / 生成器源码 / 答案，只运行、只看分数。详见 `sealed/README.md`。
5. **封存集评测永远用新种子**（`reskin.ts --seed <没用过的数>`）。同一个种子跑过并据此改过产品，这个种子就作废。
6. 学生材料夹（`students/<id>/materials/`）是给 agent 看的；同级的 `truth.json` 和所有 `answers/` **不是**，评测时不要把它们放进 agent 的工作区。
7. 下列文件评测期间**不给模型看，也不给主开发者看**：`NOTES-for-maintainers.md`、`sealed/` 全部、`SCENARIOS.md` 中对封存站点的描述、`_research/`。

## 目录

| 路径 | 内容 | 谁可以看 |
|---|---|---|
| `sites/portal-a`, `sites/portal-d` | 开发集两个门户（固定种子 `canon` 的成品） | 主开发者可以看、可以调试 |
| `answers/<site>/<student>.json` | 开发集答案 | 主开发者可以看 |
| `sealed/portal-b`, `-c`, `-e` | 封存集三个门户（种子 `canon` 的成品，仅用于冒烟） | **只运行不阅读** |
| `sealed/answers/`, `sealed/_src/` | 封存集答案与生成器源码 | **不阅读** |
| `students/<id>/materials/` | 三位虚构学生的材料（给 agent） | 都可以 |
| `students/<id>/truth.json` | 语义层面的标准答案 | 不给 agent |
| `reskin.ts` | 换皮生成器（按种子确定性生成站点 + 答案） | — |
| `serve.ts` | 静态服务器（自动选空闲端口） | — |
| `score.ts` | 评分器（中文成绩单 + JSON） | — |
| `selftest.ts` | 无浏览器自检 | — |
| `dump-state.md` | harness 如何取最终状态 | — |
| `SCENARIOS.md` | 难缠场景目录与出处 | 人看 |
| `EXISTING-BENCHMARKS.md` | 现有公开基准调研与结论 | 人看 |
| `REPORT.md` | 总报告：做了什么、怎么跑、覆盖矩阵、已知缺口 | 人看 |
| `NOTES-for-maintainers.md` | 站点内部机制说明（站点文件里不留注释，说明都在这） | **仅维护者** |
| `gen/` | 生成器库（目录、数据、构建、开发集站点定义、控件 kit） | 维护者 |

## 最短上手

```bash
# 1) 开发集：直接起服务
bun bench/serve.ts bench/sites/portal-d            # 打印 URL，如 http://127.0.0.1:53127/
# 2) 让 agent 拿 bench/students/s1-lin/materials 去填；结束后按 dump-state.md 取状态存成 state.json
# 3) 评分
bun bench/score.ts portal-d s1-lin state.json

# 封存集：每次新种子
bun bench/reskin.ts portal-c --seed 20260921 --out /tmp/run1
bun bench/serve.ts /tmp/run1/site
bun bench/score.ts portal-c s2-auyeung state.json --answers /tmp/run1/answers --meta harness.json

# 自检
bun bench/selftest.ts
```

全部站点既能用 `file://` 直接打开，也能经 `serve.ts` 打开；没有任何外部网络请求。
