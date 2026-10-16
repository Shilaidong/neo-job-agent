import type { Task } from "../shared/tasks"

/**
 * The first message of a new job application — sent for the consultant, so they never have to type "开始".
 * Three labelled parts: a bilingual 对话 opening that says plainly what will happen and where a human is
 * still needed, a bilingual 系统规则 line the model works by, and the facts of this application below
 * (how to work in detail is still the workspace's AGENTS.md).
 */
export function buildStartPrompt(task: Task, materialCount: number, extraction?: string, hasProfile = false, hasResume = false, studentMemo?: string) {
  const i = task.input
  const lines = [
    `【开场 · Opening】`,
    `您好！这份投递（${i.studentName} · ${i.company} · ${i.jobTitle}）由我来办：先读材料、整理学生档案和求职目标，再检查/生成简历，最后到左边那张招聘/申请页上能填的都填好、存草稿，进度随时记。`,
    i.allowAutoLogin
      ? `这一份开了自动登录：到登录页直接调 browser_login——软件自己从学生资料和本机缓存里认这一站的账号密码登进去，全程不经这段对话；若是顾问在「平台登录」框里或对话里给了这一站的账号密码，工具也接你原样带过去的参数（登成一次它会替你存进本机）。资料里认不出的站点，还是停下来交给您登。这几样仍是您来：验证码/短信邮箱验证、最终提交、付款、签名栏——到这一步我停下等您。`
      : `这几样始终是您的事，我会停下等您：登录和密码、验证码/人机验证、最终提交、付款、签名栏。`,
    `Hello! I'm taking this application (${i.studentName} · ${i.company} · ${i.jobTitle}): I will read the student's materials, build their profile and job target, check/generate the resume, then fill everything fillable on the job page at the left and save it as draft, logging progress as I go.`,
    i.allowAutoLogin
      ? `This application has auto-login on: at the sign-in page call browser_login — the software reads this site's record in the student's materials or the machine's own store and signs in itself (nothing passes through this chat); if the consultant pasted this site's credentials in the task's 「平台登录」 box or sent them in conversation, the tool also accepts them back from you as arguments (one success and it stores the pair locally). Sites it can't name still stop and hand back to you. These still stay yours, and I stop for them: CAPTCHA / SMS or email codes, final submission, payment, signature fields.`
      : `These stay yours, and I stop and ask before them: sign-in and passwords, CAPTCHA/human checks, final submission, payment, signature fields.`,
    ``,
    `【系统规则 · System rules】`,
    `只填学生材料里确实有的内容，绝不编造；材料里有、页面要的是另一种语言，就翻译着填（原文和译文一起记进答案库）；材料里根本没有的记成"缺"，生成待补清单；每一步填完就存草稿并更新进度记录。简历：工作区 resume/ 里已有 LaTeX 工程就先读懂 main.tex 再用它，没有就按学生档案和求职目标用 resume_compile 生成一份；导出的 PDF 就在 resume/ 文件夹里。`,
    `Only fill in values that exist in the student's materials — never invent or guess one; when a value exists but the page wants another language, translate it (keep original and translation together in the answer bank); anything truly absent gets logged for the to-supply list; after every step, save as draft and update the progress log. Resume: if a LaTeX project already exists under resume/, read its main.tex and keep working on it; otherwise generate one from the profile and job target with resume_compile; the exported PDF lives in the resume/ folder.`,
    ``,
    `【本投递信息 · This application】`,
    `- 学生：${i.studentName}`,
    `- 投递：${i.company} · ${i.jobTitle}（${i.jobType}）`,
    `- 这份投递自己的文件夹：\`${task.taskPath}/\`（任务信息在里面的 task.json；这家公司、这个岗位的要求、进度、缺什么，都记在这个文件夹里）`,
    `- 学生材料：\`materials/\`（共 ${materialCount} 个文件，是顾问原文件夹的副本）`,
    extraction ? `- ${extraction.split("\n").join("\n  ")}` : undefined,
    i.applicationUrl
      ? `- 投递页面：${i.applicationUrl}（已经在左边打开）`
      : `- 顾问没有提供链接。先查到这个岗位的官方招聘页和投递入口，再在左边打开。`,
    i.platformUsername
      ? i.allowAutoLogin
        ? `- 平台账号：${i.platformUsername}（这一份开了自动登录：到登录页先调一次零参数的 browser_login，软件从资料和本机里认；若它说没有记录而这段启动信息里「平台登录」那行给了这站的凭据，原样当参数调它）`
        : `- 平台账号：${i.platformUsername}（密码由顾问自己在页面上输入）`
      : undefined,
    i.platformLogin
      ? `- 平台登录（顾问原样贴在这条任务里的一段，软件没拆过它——哪个是账号哪个是密码你自己认）：\n${i.platformLogin.split("\n").join("\n  ")}\n  到登录页调 browser_login 时，把这上面的账号和密码原样当 username/password 参数带过去；它登成一次就会替你记进本机，往后这一站不用再带。`
      : undefined,
    studentMemo
      ? `- 平台登录（这个学生全部网站的账号密码备忘，顾问整段贴在这，软件没拆过它——哪个账号哪段密码、对的是哪个站，你自己认）：\n${studentMemo.split("\n").join("\n  ")}\n  到登录页调 browser_login 时，把这里对应的账号和密码原样当 username/password 参数带过去；登成一次它会替你存进本机，往后这一站不用再带。`
      : undefined,
    i.deadline ? `- 截止日期：${i.deadline}` : undefined,
    i.salary ? `- 薪资/待遇：${i.salary}` : undefined,
    i.notes ? `- 顾问备注：${i.notes}` : undefined,
    `- 上传材料：${i.allowUpload ? "可以上传用途明确的材料" : "这次不要上传任何文件"}`,
    i.outputLanguage === "en" ? `- 写给顾问和学生看的文档用英文。` : undefined,
    ``,
    goalLine(i.taskGoal),
    ``,
    hasProfile
      ? `工作区里已经有答案库 \`student_profile.json\`（之前做别的投递时做的）：直接用，不要重做；只补这次需要的部分。`
      : `工作区里还没有答案库：读完材料，先照 \`profile-keys.json\` 写好 \`student_profile.json\`（和给顾问看的 \`student_profile.md\`），并判断这个学生的求职目标，写成 \`job_target.json\`。`,
    hasResume ? `\`resume/\` 里已有 LaTeX 简历工程：直接在里面接着改（先读 main.tex），改完调用 resume_compile 重新导出 PDF。` : undefined,
  ]
  return lines.filter((line) => line !== undefined).join("\n")
}

function goalLine(goal: string) {
  switch (goal) {
    case "仅整理材料":
      return "这次只整理材料、写好学生档案和求职目标、列出还缺什么。不要打开招聘页投递。"
    case "仅生成简历":
      return "这次只生成/修改简历：根据学生档案和求职目标写 LaTeX、编译导出 PDF，并把这份简历的内容记进答案库。不要投递。"
    case "继续上次投递":
      return "这份投递之前已经做过一部分。先看这个文件夹里留下的记录和招聘平台上现在的状态，从断开的地方接着做。"
    default:
      return "从整理材料一直做到把招聘/申请页上能填的都填好、存成草稿，再把简历导出好。最终提交由顾问来点。"
  }
}
