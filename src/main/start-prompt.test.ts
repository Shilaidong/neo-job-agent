import { describe, expect, test } from "bun:test"
import type { Task } from "../shared/tasks"
import { buildStartPrompt } from "./start-prompt"

const task = (patch: Partial<Task["input"]> = {}): Task => ({
  id: "t1",
  createdAt: "2026-10-17T00:00:00.000Z",
  studentDir: "/w/陈昊天",
  taskDir: "/w/陈昊天/jobs/Google_Data-Science-Intern",
  taskPath: "jobs/Google_Data-Science-Intern",
  input: { studentName: "陈昊天", sourceFolder: "/src", jobType: "实习", taskGoal: "全流程投递", outputLanguage: "zh", allowUpload: true, company: "Google", jobTitle: "Data Science Intern", ...patch },
})

describe("start prompt (job agent)", () => {
  test("opens bilingually for the consultant, then states the rules bilingually", () => {
    const text = buildStartPrompt(task(), 0)
    expect(text).toContain("【开场 · Opening】")
    expect(text).toContain("这份投递（陈昊天 · Google · Data Science Intern）由我来办")
    expect(text).toContain("I'm taking this application (陈昊天 · Google · Data Science Intern)")
    expect(text).toContain("这几样始终是您的事")
    expect(text).toContain("final submission, payment, signature fields")
    expect(text).toContain("【系统规则 · System rules】")
    expect(text).toContain("绝不编造")
    expect(text).toContain("never invent or guess one")
    expect(text).toContain("【本投递信息 · This application】")
  })

  test("states the facts and points at the task folder", () => {
    const text = buildStartPrompt(task({ applicationUrl: "https://careers.google.com/jobs/xyz", platformUsername: "chen@x.com", deadline: "2026-12-01", salary: "8000/month" }), 12)
    expect(text).toContain("陈昊天")
    expect(text).toContain("`jobs/Google_Data-Science-Intern/`")
    expect(text).toContain("共 12 个文件")
    expect(text).toContain("https://careers.google.com/jobs/xyz（已经在左边打开）")
    expect(text).toContain("chen@x.com（密码由顾问自己在页面上输入）")
    expect(text).toContain("2026-12-01")
    expect(text).toContain("8000/month")
    expect(text).not.toContain("undefined")
  })

  test("an auto-login task says the app signs in, and keeps codes/submission with the human", () => {
    const text = buildStartPrompt(task({ applicationUrl: "https://careers.google.com/jobs/xyz", platformUsername: "chen@x.com", allowAutoLogin: true }), 0)
    expect(text).toContain("这一份开了自动登录")
    expect(text).toContain("到登录页直接调 browser_login")
    expect(text).toContain("全程不经这段对话")
    expect(text).toContain("验证码/短信邮箱验证、最终提交、付款、签名栏")
    expect(text).toContain("This application has auto-login on")
    expect(text).toContain("nothing passes through this chat")
    expect(text).not.toContain("密码由顾问自己在页面上输入")
    expect(buildStartPrompt(task({ applicationUrl: "https://careers.google.com/jobs/xyz", platformUsername: "chen@x.com" }), 0)).not.toContain("开了自动登录")
  })

  test("a pasted 平台登录 blob rides to the model verbatim — we parse nothing", () => {
    const text = buildStartPrompt(task({ applicationUrl: "https://careers.google.com/jobs/xyz", allowAutoLogin: true, platformLogin: "chen@example.com | Chloe123456!\n备用邮箱 chen.d@gmail.com" }), 0)
    expect(text).toContain("平台登录（顾问原样贴在这条任务里的一段，软件没拆过它")
    expect(text).toContain("chen@example.com | Chloe123456!")
    expect(text).toContain("原样当 username/password 参数带过去")
    expect(text).not.toContain("undefined")
  })

  test("a credentials memo rides into the opening as-is; the model works out which account fits which site", () => {
    const text = buildStartPrompt(task({ allowAutoLogin: true }), 0, undefined, false, false, "Google 账号 chen@example.com / smoke-pass-1")
    expect(text).toContain("平台登录（这个学生全部网站的账号密码备忘")
    expect(text).toContain("Google 账号 chen@example.com / smoke-pass-1")
    expect(text).toContain("哪个账号哪段密码")
    expect(buildStartPrompt(task(), 0, undefined, false, false, "")).not.toContain("这个学生全部网站的账号密码备忘")
  })

  test("adapts to missing links, no-upload, goals, profile and resume state", () => {
    expect(buildStartPrompt(task(), 0)).toContain("顾问没有提供链接")
    expect(buildStartPrompt(task({ allowUpload: false }), 0)).toContain("这次不要上传任何文件")
    expect(buildStartPrompt(task({ taskGoal: "仅整理材料" }), 0)).toContain("不要打开招聘页投递")
    expect(buildStartPrompt(task({ taskGoal: "仅生成简历" }), 0)).toContain("只生成/修改简历")
    expect(buildStartPrompt(task({ taskGoal: "仅生成简历" }), 0)).not.toContain("不要打开招聘页投递")
    expect(buildStartPrompt(task(), 0)).toContain("还没有答案库：读完材料，先照 `profile-keys.json` 写好 `student_profile.json`")
    expect(buildStartPrompt(task(), 0, undefined, false, false)).toContain("写成 `job_target.json`")
    expect(buildStartPrompt(task(), 0, undefined, true)).toContain("直接用，不要重做")
    expect(buildStartPrompt(task(), 0, undefined, true, true)).toContain("resume_compile")
  })
})
