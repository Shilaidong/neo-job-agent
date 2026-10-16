/** Plain-language names for what the AI is doing; the consultant never needs to see tool ids. */
const TOOL_LABELS: Record<string, string> = {
  browser_snapshot: "看页面",
  browser_navigate: "打开网址",
  browser_back: "后退",
  browser_click: "点击",
  browser_fill: "填写",
  browser_fill_form: "填写多个字段",
  browser_select: "选择下拉选项",
  browser_choose: "选择",
  browser_do: "连续点击前往",
  browser_fill_page: "对照答案库填这一页",
  browser_review: "核对这一页",
  browser_press_key: "按键",
  browser_type: "输入文字",
  browser_hover: "悬停",
  browser_upload: "上传文件",
  browser_handle_dialog: "处理弹窗",
  browser_wait_for: "等待页面",
  browser_screenshot: "截图",
  browser_evaluate: "执行页面脚本",
  materials_extract: "读取新材料",
  resume_compile: "编译简历",
  read: "读取文件",
  write: "写入文件",
  edit: "修改文件",
  apply_patch: "修改文件",
  glob: "查找文件",
  grep: "搜索内容",
  list: "查看文件夹",
  bash: "运行命令",
  webfetch: "读取网页",
  websearch: "搜索网络",
  todowrite: "更新计划",
  task: "分派子任务",
  skill: "查阅技能",
}

export function toolLabel(tool: string) {
  return TOOL_LABELS[tool] ?? tool
}

export function toolDetail(tool: string, input: Record<string, any> | undefined) {
  if (!input) return ""
  if (tool === "browser_fill") return `${input.value ?? ""}`
  if (tool === "browser_fill_form") return (input.fields ?? []).map((f: any) => f.value).join("、")
  if (tool === "browser_select") return (input.values ?? []).join("、")
  if (tool === "browser_choose") return input.want ?? ""
  if (tool === "browser_do") return input.goal ?? ""
  if (tool === "browser_navigate") return input.url ?? ""
  if (tool === "browser_press_key") return input.key ?? ""
  if (tool === "browser_upload") return (input.paths ?? []).join("、")
  if (tool === "bash") return input.description ?? input.command ?? ""
  return input.filePath ?? input.path ?? input.pattern ?? input.url ?? input.query ?? ""
}
