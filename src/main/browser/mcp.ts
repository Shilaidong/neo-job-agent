import { randomBytes } from "node:crypto"
import { createServer, type IncomingMessage, type Server, type ServerResponse } from "node:http"
import type { AddressInfo } from "node:net"
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js"
import { z } from "zod"
import { createLogger } from "../log"
import { scrubFillValues } from "../log-sanitize"
import { BrowserError, type BrowserController } from "./controller"
import { HANDOFF_TAKEOVER, HumanHeldError } from "./challenge"

const log = createLogger("tool")

type ToolResult = { content: Array<{ type: "text"; text: string } | { type: "image"; data: string; mimeType: string }>; isError?: boolean }

const REF = z.string().describe("快照里元素后面的编号，例如 e12")

/**
 * The browser tools, served over MCP on localhost so a stock `opencode` process can call them.
 * Tool names arrive in OpenCode as `browser_<name>`.
 */
function buildServer(browser: BrowserController, onActivity: (text: string) => void, web: WebLookup) {
  const server = new McpServer({ name: "neo-browser", version: "0.1.0" })

  let seq = 0
  /** Runs one tool call: tells the sidebar what is happening, and leaves a full trace in the log. */
  const call = async (name: string, args: Record<string, unknown>, label: string, fn: () => Promise<string | ToolResult>): Promise<ToolResult> => {
    const id = ++seq
    const started = Date.now()
    onActivity(label)
    // Resolve "e24" to a name now: the ref table is replaced by whatever snapshot the action returns.
    const target = typeof args.ref === "string" ? browser.describeRef(args.ref) : undefined
    // Whatever the model pushes toward the page keeps its ref+name here, not its value: with the
    // consultant's choice passwords can arrive through the CHAT, and the log file is a separate
    // persistence layer — the page guard refuses the box, the trace must not remember it (2026-10-10 review).
    const meta = { id, ...(target ? { target } : {}), args: scrubFillValues(args) }
    log.debug(`browser_${name} start`, meta)
    try {
      const out = await fn()
      const result: ToolResult = typeof out === "string" ? { content: [{ type: "text", text: out }] } : out
      const text = result.content.map((c) => (c.type === "text" ? c.text : `[image ${c.data.length}b64]`)).join("\n")
      log.info(`browser_${name} ok`, { ...meta, ms: Date.now() - started, chars: text.length, result: text.slice(0, 600) })
      return result
    } catch (error) {
      // BrowserError is feedback for the model (stale ref, blocked click…), HumanHeldError that the consultant
      // holds the page; anything else is our bug.
      const expected = error instanceof BrowserError || error instanceof HumanHeldError
      log[expected ? "warn" : "error"](`browser_${name} ${expected ? "refused" : "crashed"}`, { ...meta, ms: Date.now() - started, error })
      return { content: [{ type: "text", text: error instanceof Error ? error.message : String(error) }], isError: true }
    }
  }

  server.registerTool(
    "snapshot",
    {
      description:
        "读取左侧申请网页当前的样子：所有标题、文字、输入框、下拉框、按钮，以及每个输入框里现在的值。可操作的元素带 [ref=eN]，后续工具用这个编号指代它。页面变了就重新取；编号只在最近一次快照内有效。",
      inputSchema: {},
    },
    () => call("snapshot", {}, "正在看页面", () => browser.snapshot()),
  )

  server.registerTool(
    "navigate",
    { description: "在左侧浏览器打开一个网址，返回打开后的页面快照。", inputSchema: { url: z.string() } },
    (args) => call("navigate", args, `正在打开 ${args.url}`, () => browser.navigate(args.url)),
  )

  server.registerTool(
    "back",
    { description: "浏览器后退一页，返回后退后的页面快照。", inputSchema: {} },
    () => call("back", {}, "正在后退", () => browser.back()),
  )

  server.registerTool(
    "click",
    {
      description:
        "用真实鼠标点击一个元素（按钮、链接、单选、复选、自定义下拉的选项等），返回点击后的页面快照。最终提交、付款、发送推荐信邀请这三类按钮由顾问本人决定，点到它们时顾问会在侧边栏收到询问。",
      inputSchema: { ref: REF, doubleClick: z.boolean().optional(), force: z.boolean().optional().describe("目标被遮挡时仍然点这个位置") },
    },
    (args) => call("click", args, `正在点击 ${browser.describeRef(args.ref)}`, () => browser.click(args.ref, args)),
  )

  server.registerTool(
    "fill_page",
    {
      description:
        "**每到一页表单先调这个。** 它把这一页所有空着的格子和学生的答案库（工作区里的 student_profile.json）“对号入座”：有把握的直接填好（值原样取自答案库，不会写错字），并告诉你每个格子用了答案库的哪一条；拿不准的、需要判断的（“是否持有某种准证”）、需要撰写的，连同证据和一张带编号的页面截图交还给你——你想清楚后用 browser_fill_form 一次补完。签名栏它不会碰（打名字等于本人签字）。没有参数。",
      inputSchema: {},
    },
    () =>
      call("fill_page", {}, "正在对照答案库填这一页", async () => {
        const out = await browser.fillPage()
        return { content: [{ type: "text", text: out.text }, ...(out.image ? [{ type: "image" as const, data: out.image, mimeType: "image/jpeg" }] : [])] }
      }),
  )

  server.registerTool(
    "review",
    {
      description:
        "翻页 / 保存之前核对整页：列出这一页每个字段的名字、当前值、是否必填、页面有没有给它标错，并附一张带编号的截图。对照答案库逐项看：值对不对、**有没有填错格子**（姓和名对调这种，每一格单看都没问题）。发现错就改，再翻页。",
      inputSchema: {},
    },
    () =>
      call("review", {}, "正在核对这一页", async () => {
        const text = await browser.review()
        const shot = await browser.screenshot(false, true).catch(() => undefined)
        return { content: [{ type: "text", text }, ...(shot ? [{ type: "image" as const, data: shot.data, mimeType: "image/jpeg" }] : [])] }
      }),
  )

  server.registerTool(
    "do",
    {
      description:
        "把一段只需要“点”的路交给小模型去走，它一步只要零点几秒：比如“从这个项目页走到申请系统的登录页”“打开 Education 标签并展开每一段”“把弹出的菜单一路点到 Postgraduate › Coursework”。它只会点击，不会打字、不会选下拉值、不会上传；拿不准就停下来把候选告诉你；提交、付款、推荐信邀请照样会停下来问顾问。目标用一句话说清楚“到哪里算到了”，不要写学生的个人信息。返回它点了什么、停在哪、以及当前页面。需要填值的事用 browser_fill_form。",
      inputSchema: { goal: z.string().describe("要到达的状态，一句话"), maxSteps: z.number().int().min(1).max(20).optional() },
    },
    (args) => call("do", args, `正在前往：${args.goal}`, () => browser.do(args.goal, args.maxSteps)),
  )

  server.registerTool(
    "fill",
    {
      description:
        "往一个输入框里填内容：先真实点击聚焦，替换掉原有内容，再读回实际值告诉你。日期类原生输入框用 ISO 格式（2026-09-18）。slowly=true 时逐字敲键盘，用于带掩码或联想搜索的输入框；submit=true 时填完按 Enter。",
      inputSchema: { ref: REF, value: z.string(), slowly: z.boolean().optional(), submit: z.boolean().optional() },
    },
    (args) => call("fill", args, `正在填写 ${browser.describeRef(args.ref)}`, () => browser.fill(args.ref, args.value, args)),
  )

  server.registerTool(
    "fill_form",
    {
      description:
        "填表的主力：把页面上的一段一次交过来，每个字段给 ref 和你想要的值。字段是什么控件都行——文本框直接填；下拉（包括网站自己画的、带搜索的）、单选、勾选框按 browser_choose 的方式选，值不必和选项原文一致（“中国”“本科”“是”）。逐个返回结果：✓ 填上了，⚠ 读回和填入不一样，✗ 没填上（附原因和相近选项）；一个失败不影响其余。最后附上填完后的页面快照，选择引出的新字段就在里面。原生日期框用 ISO 格式（2026-09-18）。",
      inputSchema: { fields: z.array(z.object({ ref: REF, value: z.string() })).min(1) },
    },
    (args) => call("fill_form", args, `正在填写 ${args.fields.length} 个字段`, () => browser.fillForm(args.fields)),
  )

  server.registerTool(
    "select",
    {
      description:
        "在原生下拉框（select）里一次选多项时用；只选一项请用 browser_choose。values 传选项的文字或 value，不必和原文一致；匹配没把握会返回相近候选。返回选择后的页面快照。",
      inputSchema: { ref: REF, values: z.array(z.string()).min(1) },
    },
    (args) => call("select", args, `正在选择 ${args.values.join("、")}`, () => browser.select(args.ref, args.values)),
  )

  server.registerTool(
    "choose",
    {
      description:
        "在任何“选一个”的控件里选择：原生下拉、网站自己画的下拉（带不带搜索框都行）、单选组、勾选框。want 直接给你想要的值（如 “中国”、“本科”、“是”），不必和选项原文一致——工具会自己点开、读出全部选项、按字面或按意思匹配、点选、再读回。匹配没把握时不会乱选，会把相近的选项列给你。返回选择后的页面快照。",
      inputSchema: { ref: REF, want: z.string().describe("想选的值；勾选框用 “是” / “否”") },
    },
    (args) => call("choose", args, `正在选择 ${args.want}`, () => browser.choose(args.ref, args.want)),
  )

  server.registerTool(
    "press_key",
    { description: "按一个键，作用在当前焦点上。例：Enter、Tab、Escape、ArrowDown、Backspace，或组合键 Meta+A。", inputSchema: { key: z.string() } },
    (args) => call("press_key", args, `正在按 ${args.key}`, () => browser.pressKey(args.key)),
  )

  server.registerTool(
    "type",
    { description: "在当前焦点处直接输入一段文字（不先点击、不清空）。用于已经聚焦的搜索框、富文本编辑器等。", inputSchema: { text: z.string() } },
    (args) => call("type", args, "正在输入文字", () => browser.type(args.text)),
  )

  server.registerTool(
    "login",
    {
      description:
        "登录申请平台。仅在这个任务开了【允许自动登录】时可用，两种用法：① 不带参数——工具自己从学生资料和本机存储里认这一站的账号密码，密码不经你、你看不到也不用问；② 带上顾问刚刚在对话里给你的 username/password（或任务启动信息「平台登录」那一段里的）——原样当参数传进来，工具用它登录并顺手记进本机，往后这一站回到用法①。除这两条路之外没有第三种：往密码框打字会被拒，凭据也不要自己编。它遇到验证码/2FA 会停下交顾问（那是人的动作）；说没有凭据或这页没有密码框，就照旧交顾问登录。",
      inputSchema: { username: z.string().optional(), password: z.string().optional() },
    },
    (args) => call("login", args, "正在自动登录", () => browser.login(args.username || args.password ? { username: args.username, password: args.password } : undefined)),
  )

  server.registerTool(
    "hover",
    { description: "把鼠标移到一个元素上，用于展开悬停菜单或提示。", inputSchema: { ref: REF } },
    (args) => call("hover", args, `正在悬停 ${browser.describeRef(args.ref)}`, () => browser.hover(args.ref)),
  )

  server.registerTool(
    "upload",
    {
      description: "给上传控件选择文件。ref 可以是文件输入框，也可以是“选择文件 / Upload”按钮。paths 可用工作区内的相对路径或绝对路径。返回上传后的页面快照。",
      inputSchema: { ref: REF, paths: z.array(z.string()).min(1) },
    },
    (args) => call("upload", args, `正在上传 ${args.paths.length} 个文件`, () => browser.upload(args.ref, args.paths)),
  )

  server.registerTool(
    "handle_dialog",
    {
      description: "页面弹出 confirm / prompt / 离开页面确认 时，决定确认还是取消。普通 alert 提示框会被自动点掉，其内容会附在工具结果里告诉你。",
      inputSchema: { accept: z.boolean(), promptText: z.string().optional() },
    },
    (args) => call("handle_dialog", args, "正在处理对话框", () => browser.handleDialog(args.accept, args.promptText)),
  )

  server.registerTool(
    "wait_for",
    {
      description: "等待页面出现某段文字、某段文字消失，或单纯等几秒（最多 60）。",
      inputSchema: { text: z.string().optional(), textGone: z.string().optional(), seconds: z.number().optional() },
    },
    (args) => call("wait_for", args, "正在等待页面", () => browser.waitFor(args)),
  )

  server.registerTool(
    "screenshot",
    {
      description:
        "给页面截图（同时保存到工作区 screenshots/）。marks=true：每个可操作元素上贴着它的编号（e12），像人一样用眼睛认“这个框旁边写的是什么、那个灰字是示例”，再用编号去操作。grid=true：画上坐标刻度（视口里的 CSS 像素），给 browser_click_at 读位置用；region 只截视口里的一块并放大，小字和密集的行就看得清了（先整页定位大概在哪，再放大那一块读准坐标）。",
      inputSchema: {
        fullPage: z.boolean().optional(),
        marks: z.boolean().optional().describe("在每个可操作元素上贴编号"),
        grid: z.boolean().optional().describe("画坐标刻度"),
        region: z.object({ x: z.number(), y: z.number(), width: z.number(), height: z.number() }).optional().describe("只截视口里的这一块并放大"),
      },
    },
    (args) =>
      call("screenshot", args, "正在截图", async () => {
        const shot = await browser.screenshot(args.fullPage, args.marks, { grid: args.grid, region: args.region })
        const all = [shot, ...(shot.more ?? [])]
        const head = `${(all.length > 1 ? `整页分 ${all.length} 屏，从上到下（相邻两屏有一小段重叠）。` : "")}已保存：${all.map((s) => s.file).join("、")}${shot.handoff ? HANDOFF_TAKEOVER : ""}`
        return { content: [{ type: "text" as const, text: head }, ...all.map((s) => ({ type: "image" as const, data: s.data, mimeType: "image/jpeg" }))] }
      }),
  )

  server.registerTool(
    "click_at",
    {
      description:
        "最后的办法：按坐标点击。只用于页面上**没有编号**的区域——画在 canvas 上的表单、内嵌的文档、页面文字版里说“看不到结构”的那一块。有编号的元素一律用编号，这里会拒绝。做法：browser_screenshot grid=true 看图读坐标（密的地方再用 region 放大读准）→ browser_click_at → 要打字就 browser_type、换格用 browser_press_key Tab → 再截图确认那一格显示的值。返回点击前后画面哪里变了和一张新截图。提交、付款、推荐人邀请这类不会替你点，会先问顾问。",
      inputSchema: { x: z.number().describe("视口内的 CSS 像素"), y: z.number(), what: z.string().describe("你认为这里是什么，比如 “Family name 输入框”"), doubleClick: z.boolean().optional() },
    },
    (args) =>
      call("click_at", args, `正在点击：${args.what}`, async () => {
        const out = await browser.clickAt(args.x, args.y, args.what, { doubleClick: args.doubleClick })
        return { content: [{ type: "text", text: out.text }, ...(out.image ? [{ type: "image" as const, data: out.image, mimeType: "image/jpeg" }] : [])] }
      }),
  )

  server.registerTool(
    "search",
    {
      description:
        "上网查东西（截止日期、这个项目的要求、申请入口在哪）。**在后台的一个页面里搜，左边顾问那一页不会被动过。**返回前十几条结果的标题、网址和摘要；要看哪一条就用 browser_open 打开。别用它查学生的个人信息，搜索框不是放这些的地方。",
      inputSchema: { query: z.string().describe("要搜什么，一句话") },
    },
    (args) => call("search", args, `正在搜索：${args.query}`, () => web.search(args.query)),
  )

  server.registerTool(
    "open",
    {
      description:
        "在**后台**打开一个网址并把正文读回来（左边顾问那一页不会被动过）。用它读官网的要求页、截止日期页。要在顾问眼前打开某一页、或者要在那一页上操作，才用 browser_navigate。",
      inputSchema: { url: z.string().describe("完整网址") },
    },
    (args) => call("open", args, `正在读取：${args.url}`, () => web.open(args.url)),
  )

  // 2026-10-16 多标签: popups live as tabs; the model sees them, switches, and has the opener-preserving escape.
  server.registerTool(
    "tabs",
    {
      description:
        "列出左侧浏览器现在开着的所有标签页：第一个是申请页，站点用 window.open 弹出的窗口各自是一个标签。标出工具当前在哪一页。切换用 browser_switch_tab。",
      inputSchema: {},
    },
    () => call("tabs", {}, "正在看标签页", () => browser.tabsList()),
  )

  server.registerTool(
    "switch_tab",
    {
      description: "切到另一个标签页，返回那一页的快照。编号来自 browser_tabs。弹窗标签没有 window.opener（快照头部会说明）；要在回写父页的弹窗里操作，先 browser_switch_tab 回申请页再 browser_open_in_window。",
      inputSchema: { id: z.string().describe("browser_tabs 列表里的编号，例如 tab1") },
    },
    (args) => call("switch_tab", args, `正在切换到标签页 ${args.id}`, () => browser.switchTab(args.id)),
  )

  server.registerTool(
    "open_in_window",
    {
      description:
        "把一个网址从申请页用「真窗口」重新打开（window.opener 指向申请页）：回写父页表单的弹窗——勾选后自动关闭、父页自动填充的那种——只有在这种窗口里才生效。典型流程：机构选择弹窗开成了标签页 → 在里面勾了没反应 → browser_open_in_window 用同一个网址重开 → 在真窗口里搜索并勾选 → 回写自动完成、窗口自己关掉。窗口关了工具自动回到申请页标签。",
      inputSchema: { url: z.string().describe("弹窗自己的网址（在弹窗标签的快照里能看到）") },
    },
    (args) => call("open_in_window", args, `正在重开真窗口：${args.url}`, () => browser.openInRealWindow(args.url)),
  )

  // No "run this JavaScript" tool. On the first real site the model used it to click a calendar past our
  // read-back check (wrong month), to switch off the site's own required-field validation, and to fake an
  // upload. What a model writes never becomes script or selectors; coordinates only where the page has no structure
  // to number (browser_click_at refuses anything that has a ref) — docs/REALRUN-NTU.md B1, docs/FILLING.md tier C.

  return server
}

/** `materials_extract` — lets the model refresh the text versions after the consultant adds files. */
function buildMaterialsServer(extract: () => Promise<string>, onActivity: (text: string) => void) {
  const server = new McpServer({ name: "neo-materials", version: "0.1.0" })
  server.registerTool(
    "extract",
    {
      description:
        "把 materials/ 里的材料转成文字版（materials_text/，含 INDEX.md）：电子版 PDF、Word、Excel 直接取原文，扫描件和照片做 OCR。只处理新增或改动过的文件。顾问说补了材料之后调用它，然后读 INDEX.md 看新增了什么。",
      inputSchema: {},
    },
    async () => {
      onActivity("正在读取新材料")
      const started = Date.now()
      try {
        const text = await extract()
        log.info("materials_extract ok", { ms: Date.now() - started, result: text.slice(0, 600) })
        return { content: [{ type: "text" as const, text }] }
      } catch (error) {
        log.error("materials_extract crashed", { ms: Date.now() - started, error })
        return { content: [{ type: "text" as const, text: error instanceof Error ? error.message : String(error) }], isError: true }
      }
    },
  )
  return server
}

/** `resume_compile` — the LaTeX resume engine as a tool the model can call on its own. */
function buildResumeServer(compileResume: (folder: string) => Promise<string>, onActivity: (text: string) => void) {
  const server = new McpServer({ name: "neo-resume", version: "0.1.0" })
  server.registerTool(
    "compile",
    {
      description:
        "用 LaTeX 生成或更新学生的简历并导出 PDF。把工作区里你想用的那个文件夹路径给我（`resume/resume-<方向>-<姓名>` 或 `resume/`）：如果里面已有 main.tex 我就编译它（先改好 main.tex 再调用）；没有就照 student_profile.json 和 job_target.json 生成一份（方向从路径或目标岗位判断）。编译完我把工程路径和导出的 PDF 路径告诉你。改简历的流程：改 main.tex → 调用本工具 → 检查导出。",
      inputSchema: { folder: z.string().describe("工作区里的简历文件夹路径，例如 resume/resume-data-xxx 或 resume/") },
    },
    (args) => {
      onActivity("正在编译简历")
      const started = Date.now()
      return compileResume(args.folder)
        .then((text) => {
          log.info("resume_compile ok", { ms: Date.now() - started, result: text.slice(0, 300) })
          return { content: [{ type: "text" as const, text }] }
        })
        .catch((error) => {
          log.error("resume_compile crashed", { ms: Date.now() - started, error })
          return { content: [{ type: "text" as const, text: error instanceof Error ? error.message : String(error) }], isError: true }
        })
    },
  )
  return server
}

export type BrowserMcp = { url: string; materialsUrl: string; resumeUrl: string; token: string; close: () => void }

/** Looking things up on the web, away from the page the consultant is filling in (src/main/web.ts). */
export type WebLookup = { search: (query: string) => Promise<string>; open: (url: string) => Promise<string> }

export async function startBrowserMcp(
  browser: BrowserController,
  onActivity: (text: string) => void,
  extractMaterials: () => Promise<string>,
  web: WebLookup,
  compileResume: (folder: string) => Promise<string>,
): Promise<BrowserMcp> {
  const token = randomBytes(24).toString("hex")

  const handle = async (req: IncomingMessage, res: ServerResponse) => {
    if (req.headers.authorization !== `Bearer ${token}`) {
      res.writeHead(401).end()
      return
    }
    if (req.method !== "POST") {
      // Stateless server: no standalone SSE stream, no session to delete.
      res.writeHead(405, { Allow: "POST" }).end()
      return
    }
    const chunks: Buffer[] = []
    for await (const chunk of req) chunks.push(chunk as Buffer)
    const body = JSON.parse(Buffer.concat(chunks).toString("utf8") || "null")

    const server = req.url?.startsWith("/materials")
      ? buildMaterialsServer(extractMaterials, onActivity)
      : req.url?.startsWith("/resume")
        ? buildResumeServer(compileResume, onActivity)
        : buildServer(browser, onActivity, web)
    const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined, enableJsonResponse: true })
    res.on("close", () => {
      void transport.close()
      void server.close()
    })
    await server.connect(transport)
    await transport.handleRequest(req, res, body)
  }

  const http: Server = createServer((req, res) => {
    handle(req, res).catch((error) => {
      log.error("mcp request failed", { method: req.method, error })
      if (!res.headersSent) res.writeHead(500, { "content-type": "application/json" })
      res.end(JSON.stringify({ jsonrpc: "2.0", error: { code: -32603, message: String(error?.message || error) }, id: null }))
    })
  })
  // A risk confirmation can keep a tool call open for as long as the consultant takes to decide.
  http.requestTimeout = 0
  http.headersTimeout = 0
  await new Promise<void>((done) => http.listen(0, "127.0.0.1", done))
  const { port } = http.address() as AddressInfo
  return { url: `http://127.0.0.1:${port}/mcp`, materialsUrl: `http://127.0.0.1:${port}/materials`, resumeUrl: `http://127.0.0.1:${port}/resume`, token, close: () => http.close() }
}
