# 真实申请系统表单 UI 的"脏乱差"事实库（portal-facts）

> 调研日期：2026-09-20。只用公开来源（帮助中心、申请指南、PDF 截图手册、大学官网 how-to-apply 页面）；未登录任何账号、未创建账号、未提交任何表单。
> 用途：为"LLM agent 通过浏览器填写真实大学申请系统"的 benchmark 提供事实依据，重点是**二级界面**（从表单里再弹出的 modal / dialog / popup / drawer / 新窗口，必须在里面操作完再回来）。

## 0. 标注约定

- 【有出处】= 我实际读到了该页面/PDF 的正文（或截图），后面跟 URL。
- 【有出处·搜索摘要】= 该 URL 的页面本身抓取失败（403 / 需要 JS 渲染），事实来自搜索引擎对该页的摘要；可信度低一档，引用前建议人工打开核对。
- 【经验/未核实】= 我的一般性了解，本次没能在公开页面上确认。**不要把这类条目里的措辞当成真实 UI 字符串。**
- 引号内的英文均为来源中的原文 UI 字符串/原句；没有引号的描述是我的转述。
- 标 ⚠️SEND 的条目 = 该点击会**立刻给第三方（推荐人/referee）发邮件**，agent 绝不能触发。

## 1. 最值得做进 benchmark 的跨系统模式（速览）

| # | 模式 | 有出处的代表系统 |
|---|---|---|
| A | 学校/院校查找：搜索或级联下拉 → 找不到 → "Not in List"/"Unlisted Institution" → 手填 | OUAC、Liaison CAS、Cal State Apply、Common App、UCAS、Slate |
| B | Repeater：点 "+ Add …" 弹出 modal，填完点 "Add"/"Save" 回到主页，主页出现一张带编辑/删除图标的卡片 | OUAC（地址/电话/院校全是 modal）、Slate（"Add Institution" popup）、NUS GDA3（"Add Employer"）、UCAS（"Save and add another"） |
| C | 推荐人子表单：**保存即发信** vs **提交申请后才发信**，两种都大量存在 | 保存即发：Slate、Liaison、Oxford、NYU；提交后发：HKU、HKUST、UCL、Imperial、Edinburgh、NUS(文档自相矛盾) |
| D | 逐门课成绩录入网格（学期 → 课程 → 学分 → 成绩，系统自动换算） | Liaison CAS（GradCAS 等）、Cal State Apply、UC Apply、AMCAS |
| E | 会话超时：20 / 30 / 35 / 60 分钟不等，有的带 "Extend" 警告弹窗，有的直接登出丢数据 | UC 20min、HKU 30min、UCAS 35min、Slate 55→60min |
| F | 上传限制：单文件 1.5MB～10MB 不等；**文件名限制**（≤35 字符 / 不能有空格和特殊字符 / 必须英文命名） | HKU、Cambridge、Edinburgh、Oxford、UAC、LSAC、CUHK、uni-assist、UNSW |
| G | 提交后不可改（以及"上传后不可删"） | HKU、NTU、NUS、Cal State Apply、UAC、AMCAS、Common App |
| H | 姓名规则：须与护照一致；单名申请人两栏都填同一个名字；不准全大写/全小写；用户名不准带重音字符 | OUAC、UCAS、Studielink |
| I | 文章框：字数/字符数硬上限 + 最小值；粘贴后格式丢失；非拉丁字符变问号 | UCAS、Common App、UC、ApplyTexas |
| J | 身份证件 OCR 向导 + 裁剪步骤 + 确认弹窗 + "之后不能再改" | Studielink |

---

## 2. Common App（美国本科）

**读过的来源**
- https://www.commonapp.org/static/a5d59a915bdc2031e62c468ad35e0de9/Resource_FY_Activities_ENG_2025.06.25_0.pdf （官方 Activities 指南 PDF，已读全文）
- https://www.commonapp.org/static/088c92645a5827f61016fd81ac42b3f4/Resource_FY_RecProcess_ENG_2025.06.25_1.pdf （官方推荐信流程 PDF，已读全文）
- https://www.collegeessayguy.com/blog/common-app-essay-format-mistakes （第三方，已读）
- https://appsupport.commonapp.org/applicantsupport/s/article/How-can-I-change-my-FERPA-decision 、…/How-do-I-assign-my-recommenders 、…/How-can-I-remove-a-recommender 、…/Why-can-t-I-find-a-school-or-college-in-the-lookup-list 、…/Can-I-make-a-change-to-a-submitted-application （官方 Solutions Center；页面是 Salesforce SPA，抓取只得到 "CSS Error"，只能用搜索摘要）

**可记录的行为**
- Activities 是 repeater，最多 10 条："You can add up to ten activities to your application"。【有出处】Activities PDF
- 每条活动的字符上限：Position/Leadership description "50 characters"；Organization name "100 characters"；Activity details, honors won, and accomplishments "150 characters"。官方自己建议 "you may need to abbreviate words and simplify your grammar"。【有出处】Activities PDF
- 活动类型是下拉，找不到时选 "other club/activity"；另有 "hours spent per week" 与 "weeks spent per year" 两个数值字段。【有出处】Activities PDF
- Honors 最多 5 条、每条 100 字符。【有出处·搜索摘要】https://ingeniusprep.com/blog/common-app-honors-section/ （第三方）
- 学校查找：在列表里搜不到时，滚到列表最底部选 "I don't see my high school"，然后手填；在家上学者选列表底部的 "Homeschooled"（也可以直接键入 homeschooled 搜到）。【有出处·搜索摘要】https://blog.collegevine.com/a-guide-to-the-education-section-of-the-common-app 、https://empowerly.com/content-guides/a-guide-to-the-education-section-of-the-common-app/ （官方对应文章：…/Why-can-t-I-find-a-school-or-college-in-the-lookup-list，未能渲染）
- 没有 CEEB code 的学校（国际学校、新学校、homeschool）很常见，手填即可。【有出处·搜索摘要】https://www.collegeaccessprogram.in/blog/ceeb-codes-and-the-common-app-a-counselors-guide/
- FERPA 必须先签，之后才能邀请推荐人；且不可逆："Once a school form or application has been submitted, you will not be able to change your FERPA decision"。【有出处·搜索摘要】https://appsupport.commonapp.org/applicantsupport/s/article/How-can-I-change-my-FERPA-decision
- 邀请入口在 My Colleges → 任一学校的 "Recommenders and FERPA" 区："You can invite recommenders in any college's Recommenders and FERPA section"。【有出处】RecProcess PDF
- ⚠️SEND 推荐人流程分两步 "Invite" → "Assign"。搜索摘要称：Teacher / Other Recommender 类在被 assign 到某所学校之前不会收到邀请邮件（也就是 **Assign 这一下才是发信点**）；Counselor 的发信时点本次未能核实。【有出处·搜索摘要】https://appsupport.commonapp.org/applicantsupport/s/article/How-do-I-assign-my-recommenders
- 推荐人只有在对方还没提交表格时才能移除；对方一旦提交即锁定。【有出处·搜索摘要】…/How-can-I-remove-a-recommender
- 推荐人类型四种：counselors / teachers / other recommenders / advisors；Other Recommender 下拉含 "Arts Teacher, Clergy, Coach, College Access Counselor, Employer, Family Member, Peer, or Other"。Advisor 不提交任何表格但能看 "PDF preview of your application"。【有出处】RecProcess PDF
- 主文书 250–650 词，超过 650 无法提交；文本框只支持 Bold / Italic / Underline。【有出处·搜索摘要】https://www.collegetransitions.com/blog/common-app-essay-format/
- 文本框不支持缩进/Tab："does not allow indenting (tabbing), so add an empty line between paragraphs"；粘贴后平台会把字体"standardize"。【有出处】collegeessayguy
- 非英文字母（中文、日文、阿拉伯文、西里尔文等）会显示成问号；Word 的字数与平台计数可能不一致（连字符等符号）。【有出处·搜索摘要】https://www.collegetransitions.com/blog/common-app-essay-format/ （第三方）
- 保存方式：点页面底部 "Continue" 触发保存；登出前要看到顶部 "All changes saved"。【有出处·搜索摘要】https://www.collegevine.com/faq/10596/will-my-progress-be-saved-if-i-log-off-common-app （第三方）
- 已提交的申请不能再改（Common App 部分以后可改，但只影响之后提交的学校）。【有出处·搜索摘要】…/Can-I-make-a-change-to-a-submitted-application
- Review and Submit 会生成 PDF 预览、需勾选多条确认并键入全名作为签名、付款跳第三方页面；各 section 完成后出现绿色对勾；活动条目用上下箭头重排。【经验/未核实】
- 会话超时分钟数。【经验/未核实】（本次没找到任何公开数字）

## 3. UCAS（英国本科）

**读过的来源**
- https://www.ucas.com/applying/applying-to-university/filling-in-your-ucas-application
- https://www.ucas.com/applying/applying-to-university/writing-your-personal-statement/how-to-write-your-personal-statement-for-2026-entry-onwards
- https://www.ucas.com/applying/applying-to-university/writing-personal-statement/personal-statement-builder
- https://dfcdn.ucas.com/latest/pages/apply/learner/education-04-add-qualification-with-modules.html （UCAS 设计系统的**原型页**，非生产环境，措辞可能与线上不同）
- https://www.ed.ac.uk/studying/international/applying/completing-application （爱丁堡大学写的 UCAS 填写指南）

**可记录的行为**
- 2026 entry 起 Personal Statement 拆成 3 个问题；总上限 4,000 字符（含空格），**每题最少 350 字符**："Each answer will have a minimum character count of 350 characters, which is clearly labelled on the question boxes, along with an overall character counter."【有出处】UCAS how-to-write 页
- 旧版（至 2025 entry）另有 47 行限制；2026 起不再执行 47 行与每行 94 字符折行。【有出处·搜索摘要】https://www.leadingtuition.co.uk/blog/ucas-personal-statement-character-limit-2027 （第三方）
- 低于 350 保存不了、合计超过 4,000 也不行。【有出处·搜索摘要】https://wordlimit.ai/blog/ucas-personal-statement-character-limit （第三方）
- 会话超时：**35 分钟无操作**即超时，官方建议在 Word 里写好再粘贴、经常保存。【有出处·搜索摘要】https://edumentors.co.uk/blog/ucas-personal-statement-a-secret-to-uk-university-admissions/ 、https://host-students.com/information/new-students/ucas-personal-statement/ （第三方；未在 ucas.com 上找到原话）
- 姓名："enter your first name and middle name(s) exactly as they're stated on official documents, such as your passport, birth certificate, or driving licence."【有出处】UCAS filling-in 页
- 必须录入中学以来的**全部**资格（含未通过、待出分）；最多 5 个 choices；2026 entry 费用 "£28.95 for up to five choices"。【有出处】UCAS filling-in 页
- 学校搜不到：选 'my school is not listed here' 后出现自由文本框。【有出处·搜索摘要】（同一搜索批次；爱丁堡页原文是 "If not listed you can enter the details but please try to use the full, formal name of your school."【有出处】ed.ac.uk）
- 资格找不到："please choose one of the 'Other' options under 'O'"；成绩未出："select 'pending' from the drop-down list"；模块不够位置时点 "add another module" 链接。【有出处】ed.ac.uk
- 原型页上的 "添加带模块的资格" 表单结构：Qualification date 是 **MM + YYYY 两个下拉**；字段含 "Access validating agency"、"Qualification level"、"Grade"、"Practical grade"；模块区提示 "Add the modules for this qualification. You may up to 6."（原文如此，少一个词）；每个模块有 "Module title / Module qualification date / Module value / Module level / Module grade / Unit number" + "Remove"；底部按钮 "Save qualifications"、"Save and add another"、"Cancel"；添加按钮 "Add module / unit"。【有出处】dfcdn.ucas.com 原型页
- 独立申请人要先有 reference，再用借记/信用卡在线付款并发送。【有出处】UCAS filling-in 页
- 发送后不能自行修改，须联系大学或 UCAS。【有出处】UCAS filling-in 页
- 所有 PS 过相似度检测，>30% 会被标记。【有出处】UCAS builder 页
- 每个 section 要手动勾 "mark this section as complete" 才算完成；PS 不保留粗体/斜体/下划线，部分特殊字符（弯引号、长破折号、重音字母）会被替换或拒绝。【经验/未核实】

## 4. Slate（Technolutions；大量美国研究生院 + NUS GDA3 疑似）

**读过的来源**
- https://knowledge.technolutions.net/docs/custom-application-widgets
- https://knowledge.technolutions.net/docs/school-information
- https://knowledge.technolutions.net/docs/reference-overview-getting-started
- https://knowledge.technolutions.net/docs/session-expiration-troubleshooting
- https://steinhardt.nyu.edu/admissions/how-apply/graduate-students/letters-recommendation （NYU Steinhardt，Slate 申请人视角）

**可记录的行为**
- Repeater = popup："Add Institution" 链接点开后 "a pop-up opens for them to enter information about the item"；弹窗字段含 school name、CEEB code、address、level of study；保存后 "Slate creates a new entry, displays it in the form widget on the application page"（主页面出现一行表格）。【有出处】custom-application-widgets
- 学校查找是 autosuggest（"School Name Search"）：可按校名、CEEB code 或地点搜索；选中后校名填入，配套的 "School: CEEB" 字段通过 "School Key" 自动带出 CEEB。官方提醒同名学校很多，CEEB 才是准确匹配的依据。【有出处】school-information
- 搜不到学校时能否自由输入，官方文档未写。【经验/未核实】：多数 Slate 实例允许直接保留键入的文本作为未匹配学校。
- ⚠️SEND 推荐人：References 页点 "Add Reference" 类链接 → 弹窗 → 填完点 **"Send to Recommender"**，"Slate sends the reference a system email"，内含外部推荐表链接。【有出处】reference-overview-getting-started
- ⚠️SEND NYU 的申请人说明："An email will be immediately sent to the recommender"；waiver 选项 "Once you make your selection, it cannot be changed."；改错邮箱的办法是在字段里填新邮箱再点 "Send Reminder"（= 再发一封）；"Exclude" 按钮可排除未完成的推荐人并另行登记；"You cannot revoke/cancel or exclude a recommendation letter once it has been submitted by the recommender."【有出处】NYU Steinhardt
- 会话：60 分钟无操作过期；"After 55 minutes of inactivity, the user receives a timeout warning"，可点 "Extend" 重置；过期后须重新认证。客户端时钟不准会导致误报过期。【有出处】session-expiration-troubleshooting（文档针对已认证用户，未明说是否同样适用于申请人）
- 典型结构：左侧页面导航、每页底部 "Continue" 保存；Review 页列出缺失项并可点回对应页；Signature 页键入全名；提交后进入 Application Status / checklist 页再付款；日期多为月/年下拉；Test 弹窗按考试类型显示不同子分数字段。【经验/未核实】

## 5. Liaison CAS 家族（GradCAS / EngineeringCAS / CASPA / CSDCAS / PTCAS / SOPHAS…）

**读过的来源**
- https://help.liaisonedu.com/EngineeringCAS_Applicant_Help_Center/Filling_Out_Your_EngineeringCAS_Application/EngineeringCAS_Academic_History/01_Colleges_Attended
- https://help.liaisonedu.com/GradCAS_Applicant_Help_Center/Filling_Out_Your_GradCAS_Application/GradCAS_Academic_History/3_Transcript_Entry
- https://help.liaisonedu.com/CSDCAS_Applicant_Help_Center/Filling_Out_Your_CSDCAS_Application/Supporting_Information/01_Evaluations
- https://help.liaisonedu.com/CASPA_Applicant_Help_Center/Filling_Out_Your_CASPA_Application/CASPA_Academic_History/8_Standardized_Tests
- https://help.liaisonedu.com/CASPA_Applicant_Help_Center/Starting_Your_CASPA_Application/Creating_and_Managing_Your_CASPA_Account/CASPA_Technical_Requirements
- https://help.liaisonedu.com/GradCAS_Applicant_Help_Center/Filling_Out_Your_GradCAS_Application/GradCAS_Supporting_Information/7_Documents

**可记录的行为**
- Colleges Attended：点 "Add College or University"（2026-27 周期；2025-26 周期叫 "Add a College or University"——**同一按钮跨年改名**）→ "Type and select your college or university"；官方承认 "It may take several tries to find your school"；搜不到时点 "Unlisted Institution"（2025-26 周期叫 "Can't find your school?"），再从下拉选国家。【有出处】EngineeringCAS Colleges Attended
- 同一弹层里还要填：是否 primary institution、学位信息、"Secondary Major"（双学位用）、只能一个 minor、term system 下拉（"found on the back of your official transcripts"）、是否仍在读、首末学期；最后 "Continue" → "Save"。【有出处】同上
- 逐课程成绩单录入：先点 "Start" → 加学期（term + year + academic status：Freshman…Senior / Post-Baccalaureate / Graduate）→ 标记 "Planned/In Progress" 或已完成 → "Save"；每门课填 course subject（下拉）、course code（须与成绩单完全一致）、course title、credits、grade（含 +/-）；"CAS Grade" 自动生成且不可编辑；勾 "Add Another" 连续录入。【有出处】GradCAS Transcript Entry
- 录完还有一步 "Review & Finalize My Transcripts"：标记 Primary College、Repeated Classes、Advanced Placement Credit、Other Test Credit、Honors Courses、Study Abroad Courses。【有出处】同上
- 可付费让人代录："Professional Transcript Entry Service (PTE)"。【有出处·搜索摘要】https://help.liaisonedu.com/CASPA_Applicant_Help_Center/Filling_Out_Your_CASPA_Application/CASPA_Academic_History/3_Transcript_Entry
- ⚠️SEND Evaluations：点加号 → 填 evaluator 姓名/邮箱、期望完成日期、留言、waiver、用**滑块**表示同意联系 → "Click **Save** to submit it"——"Once you do so, an email is immediately sent to the evaluator"。也就是 **"Save" = 发信**。【有出处】CSDCAS Evaluations
- Waiver 选定后不可改（"you can't change it, so consider the choices carefully"）；邮箱填错不能改，只能删掉重建；重发：点铅笔图标 → "Re-send"；CSDCAS 最少 3 封最多 5 封。【有出处】同上
- Standardized Tests：点 "Add Standardized Tests"/"Add Test Score" → 选 "Yes, I've taken this test" 或 "No, I am planning to take this test."；后者填计划考试日期，按钮文字变成 "Save This Test"；"After submitting your application, you can continue to add new test entries to this section, but you cannot update or delete previous entries."【有出处】CASPA Standardized Tests
- 技术要求："Confirm that Cookies, JavaScript, and Pop-ups are enabled within your browser."；推荐 Chrome/Firefox；IE 全系不兼容；要把 support@…myliaison.com、donotreply@webadmit.org、@sendgrid.me 加白名单。【有出处】CASPA Technical Requirements
- 文档上传：单文件 ≤5 MB；接受 .doc/.docx、JPG、PNG、RTF、PDF、TXT。【有出处·搜索摘要】https://help.liaisonedu.com/GradCAS_Applicant_Help_Center/Filling_Out_Your_GradCAS_Application/GradCAS_Program_Materials/GradCAS_Program_Materials
- 上传前须自行遮盖敏感信息（如 SSN）。【有出处】GradCAS Documents
- 四象限首页（Personal Information / Academic History / Supporting Information / Program Materials）带进度环；会话超时数值。【经验/未核实】

## 6. Cal State Apply（Liaison 平台的 CSU 版）

**读过的来源**
- https://help.liaisonedu.com/Cal_State_Apply_Applicant_Help_Center/Filling_Out_Your_Cal_State_Apply_Application/Cal_State_Apply_Academic_History/03_High_School_Coursework
- https://help.liaisonedu.com/Cal_State_Apply_Applicant_Help_Center/Submitting_and_Monitoring_Your_Cal_State_Apply_Application/Before_and_After_You_Submit_Your_Cal_State_Apply_Application/01_Submitting_and_Completing_Your_Cal_State_Apply_Application
- https://www.calstate.edu/apply/freshman/Documents/cal-state-apply-freshman-application-guide.pdf （仅搜索摘要）

**可记录的行为**
- 高中查找：点 "Add a High School" → 选国家 → 填州/城市/邮编/CEEB 任一 → 在搜索框键入校名；搜不到先试缩写或校名第二个词，仍没有才手填；最多 5 所高中。【有出处·搜索摘要】calstate.edu freshman guide
- 高中课程网格：先 "Add Grade Level"，学年下拉由前面 High Schools Attended 自动带出；每门课选类型（"None" / "Advanced Placement" / "International Baccalaureate" / "Honors"），成绩可选字母成绩或 "In Progress" / "Planned" / "No Grade" / "No Course" / "Pass"；"Is this a Summer Course" 是滑块；暑期两个成绩要在课名后手写 'Summer 1' / 'Summer 2'。【有出处】High School Coursework
- 提交："You cannot make any changes once you submit your application."【有出处】Submitting 页
- PayPal 付款后**必须回到申请页再点一次** "Submit Application(s)" 才算提交（跨站往返 + 二次确认，很容易漏）。【有出处】Submitting 页
- 付款方式含 PayPal 与银行卡；"Credit card payments cannot be made over the phone."【有出处】Submitting 页

## 7. University of California Application（UC Apply）

**读过的来源**
- https://admission.universityofcalifornia.edu/how-to-apply/applying-as-a-first-year/filling-out-the-application.html
- https://askmssun.com/uc-application-available-now/ （第三方）

**可记录的行为**
- 超时：**20 分钟**——"20-minute inactivity period after which the application will automatically sign you out"；必须点每页底部 "Save & continue" 才保存。【有出处】UC 官网
- 八个 section：About you / Campuses & majors / Academic history / Test scores / Activities & awards / Scholarships & support programs / Personal insight questions / Review & submit。【有出处】UC 官网
- Academic history 要按成绩单逐校逐课逐成绩录入，含 7–8 年级修的高中水平数学/外语，以及高中期间修的大学课。【有出处】UC 官网
- Activities & awards 分 6 类（Award or honor / Educational preparation programs / Extracurricular activity / Other coursework / Volunteering/Community service / Work Experience），类别不同字段与字符上限不同；最多 20 条。【有出处】UC 官网（分类）+【有出处·搜索摘要】https://collegewise.com/blog/10-tips-to-ace-your-uc-application （20 条）
- PIQ：新生 8 选 4；转学生 1 必答 + 7 选 3。【有出处】UC 官网
- Academic history 末尾 "Additional comments" 框上限 550 字符。【有出处·搜索摘要】https://askmssun.com/uc-app-additional-comments/
- SAT/ACT 成绩只能在提交**之后**补报（"may only be reported in your application post-submission"）——条件性/时序性字段。【有出处】UC 官网
- "Very few changes can be made after submission"。【有出处】UC 官网
- 每道 PIQ 上限 350 词；文本框纯文本、粘贴后格式全丢。【经验/未核实】

## 8. ApplyTexas

**读过的来源**
- https://tams.unt.edu/admissions/forms/tams_applytexas_text_instructions.pdf （UNT TAMS 写的逐步说明，已读全文）
- 第三方：https://ingeniusprep.com/blog/applytexas-application/ 、https://blog.getintocollege.com/blogs/applytexas-essay-requirements （搜索摘要）

**可记录的行为**
- 密码至少 14 位；且 "ApplyTexas will randomly decide that it needs verification/authentication and send a code to your email"——**随机出现的邮箱验证码**会打断 agent 流程。【有出处】TAMS PDF
- 流程分 Core Questions（按页保存）→ "Select a School and Apply"（学校补充问题）→ Review；选错申请类型会导致后面选不到目标项目（条件分支决定可选项）。【有出处】TAMS PDF
- 会冒出无关的推销/增值入口（"Enroll in ADVi – the virtual advisor"），须拒绝。【有出处】TAMS PDF
- 学校卡片右下角要点 "View details" 才能继续。【有出处】TAMS PDF
- Review Application：缺必填项时无法前进，"You will see a red mark next to the section that has a question that is not answered."【有出处】TAMS PDF
- 提交前有 Terms、同意被联系（默认要不要勾需要看清）、付款说明勾选框；右下角 "big SUBMIT button"；误付的 $75 不退。【有出处】TAMS PDF
- 三种地址（permanent / residential / mailing）分别填；多处要求勾"信息已核对"确认框；容易混淆 county 与 country。【有出处】TAMS PDF
- 文书上限 "120 eighty-character lines"（按行 × 每行 80 字符计）。【有出处·搜索摘要】blog.getintocollege.com
- 学校库里没有的学校要发邮件给 Help Desk 添加，"the system updates overnight"（即当场无法手填）。【有出处·搜索摘要】https://www.collegeessayguy.com/blog/apply-texas-guide

## 9. OUAC（安大略，105 申请）——本次证据最扎实的一个

**读过的来源**
- https://go2.ouac.on.ca/wp-content/uploads/105_screenshot_create_2025_e.pdf （OUAC 官方 "Undergrad 105 Application Screenshots April 15, 2025"，114 页截图；我逐页看了 p.2–9、18–61）
- https://www.ouac.on.ca/guide/105-after-you-submit/ （仅搜索摘要）

**可记录的行为（均【有出处】，来自上述截图 PDF）**
- 建号是 4 步向导（顶部 1—2—3—4 步进条）：Basic Information → Add Your Email → Create a Username and Password → Terms；最后一步**勾选** "I have read and agree to the OUAC Account Terms and Conditions." 之前 "Create My Account" 按钮是灰的。
- 出生日期是**三个下拉** Year / Month / Day，标签写 "Date of Birth (Format: yyyy-mm-dd)"。其他日期（入境日期、入学/毕业年月）是 Year + Month 两个下拉，且每个下拉自带搜索框。
- 用户名："Do not use accented characters (e.g., é, è, ê, ë)."；密码 "must be between 7 and 30 characters and include an upper case character, a number and a symbol."
- 邮箱要输两遍（"Confirm Email"）；未验证邮箱不能提交："You will not be able to submit your application until you verify your email address."；联系信息卡片上显示 "Email has not been verified" + 重发图标。
- 姓名规则："Enter your name as it is written on your passport, health card or other official document. Do not use all capital or all lower case letters. **If you have only 1 name, enter it as both your first/given name and your last/family name.**"；姓名/生日建号后自己改不了（"contact the OUAC for assistance"）。另有 "Former Last Name/Family Name" 和 "What first name do you use every day?"。
- 每个字段旁的 "?" 图标打开 "Help | 字段名" **帮助弹层**（带 × 关闭），部分帮助内部还有可折叠手风琴和滚动条——agent 容易把它误当成数据录入弹窗。
- 主界面三栏：左 "Quick Links" 树形导航、中间表单、右侧 "Application Status" 五步（My Personal Details / My Background / My Choices / My Supporting Documents / Review and Payment），状态文字 "Not started" / "In progress" / "Complete"。
- **地址、电话、院校全部是 modal repeater**：主页只有 "+ Add My Home Address"、"+ Add My Mailing Address"、"+ Add Telephone"、"+ Postsecondary"、"+ High School"、"+ Add Other Information" 按钮；弹窗底部 "Cancel" / "Add"（院校弹窗是 "Add Institution"，Tell Us More 弹窗是 "Save"——**同一模式三种确认按钮文字**）；保存后主页出现卡片，右下角是编辑/删除（或复制）**纯图标**按钮。
- 地址弹窗：Country 下拉（带搜索框，Canada 置顶并用 "--------------" 分隔线隔开）、City、Address Line 1–3、Postal Code；邮编提示 "For Canada, do not include a space. For the United States, separate the zip extension with a hyphen."；复选框 "My mailing address is the same"（Mailing 弹窗里对应为 "My home address is the same"）。
- 电话弹窗：Telephone Type 下拉 + Telephone Number；"For phone numbers in Canada or the US, use the following format: 5195551234. Do not enter spaces or hyphens, or include extension numbers."；最多 3 个号码（Cell / permanent / alternate）。
- 改邮箱弹窗要求同时再输一次密码（"Confirm Password"）。
- **级联院校查找（在 modal 内）**：Institution Country → 选 Canada 后才出现 "Institution Province or Territory" → 再出现 "Institution Name" 下拉（带搜索框、按 "Universities" 等分组）。找不到时："choose \"Not in List\" and provide the full institution name (do not use an acronym) and address in the \"Unlisted Institution\" section."；还提示 "Choose the main campus from the drop-down list, not an affiliate or alternative location."
- 但安省**高中**找不到时**没有手填出口**："If your Ontario high school is not in this list, contact the OUAC for assistance."（同一控件两种兜底策略）
- 条件展开：高中弹窗里先问 "Will you be taking courses at this school anytime from Sep 01, 2024 to Aug 31, 2025?"，选了 Yes/No 后才出现起止年月、"Highest Year Level Achieved"、"Diploma/Degree Type" 等字段；大专弹窗里选了 Diploma/Degree Status = "Conferred" 才出现 "Diploma/Degree Date"。
- "Have you attended a postsecondary institution?" 选 Yes 后整块 Postsecondary repeater 才出现。
- 单选 + 内嵌下拉的组合控件："Do you identify as a First Nation … person?" 的 "Yes" 单选右边紧跟一个下拉（First Nations / Métis / Inuit）。
- Applicant Diversity Census：4 个必答的**折叠面板**（点 + 展开），多选框里夹着"其他请注明"文本框，每题都有 "Prefer not to answer"；族裔选项里写着 "Chinese (including Mainland China, Hong Kong, Macau, and Taiwan)"。
- 下拉里存在语义相近的兜底选项："No Declaration"、"No/Undeclared"、"Not Applicable"（"If this question does not apply to you, choose \"Not Applicable\"."）、"Prefer not to answer"。
- 页面右上角有 "Français" 语言切换。
- 登录页提示 "Do not create more than 1 account."——重复建号会使申请失效。
- Program Choices 页可增删改并**排序**志愿。【有出处·搜索摘要】https://www.ouac.on.ca/guide/105-after-you-submit/
- 会话超时、后退键、多标签页限制。【经验/未核实】（ouac.on.ca 指南页对抓取返回 403，没读到）

## 10. Studielink（荷兰）

**读过的来源**
- https://filelist.tudelft.nl/TUDelft/Onderwijs/Toelating_en_aanmelding/Exchange/Studielink%20User%20Guide.pdf （TU Delft 逐步指南，已读全文）
- https://info.studielink.nl/en/how-to-use-studielink/verification-personal-details-studielink （仅搜索摘要）

**可记录的行为（除注明外均【有出处】TU Delft PDF）**
- 首页右上角先选语言（Dutch / English / German）。
- 无 DigiD 的建号 = **证件扫描向导**：选国籍 → "<Scan passport/ID>" → 向导 "<Start>" → 选证件类型（"non-European identity cards can't be uploaded"）→ 上传（"Allowed formats are: JPEG, PNG, BMP and PDF"）→ **可裁剪** → "<Continue>" → 选证件版本 → "<Submit>"。
- OCR 读出的个人信息要逐项核对；页底选"与证件一致"后**弹出确认 pop-up**，要勾复选框再点 "<OK>"；"You can't change them afterwards."；若想改，必须反过来声明"与证件不一致"才能编辑，但这样学校日后会要求你出示证件。
- 希腊/意大利/法国身份证没有（完整的）MRZ，会读取失败，须改用护照；MRZ 不清晰的扫描件会被拒。【有出处】TU Delft PDF +【有出处·搜索摘要】info.studielink.nl
- 住址不能是荷兰地址（有荷兰地址就必须走 DigiD 登录）。
- 邮箱在 Studielink 内必须唯一；建号最后一步 "Click the right image to prove you are not a robot"（**图片式人机验证**）；然后邮件激活链接。
- 账号要等第一份 enrolment application 提交后才算"完整"，之前看不到 dashboard。
- Previous education：毕业日期 → 取得国家 → 文凭类型；"<Add previous education>" 追加；列表里没有的文凭可手填名称。【有出处·搜索摘要】https://www.utwente.nl/en/education/student-services/upcoming-students/enrolment/faq-studielink/
- 选专业：搜索 + 过滤器；同名项目很多（TU Delft 交换生要在 31 个 "Exchange" 选项里选对，且类型固定显示为 WO Master）。之后还有院校自定义的 "Institutional Questions"，最后 "<confirm>"，再跳到学校自己的 OSIRIS 系统继续。

## 11. uni-assist（德国）

**读过的来源**
- https://www.uni-assist.de/en/faqs/apply-online/
- https://www.uni-assist.de/en/how-to-apply/send-track/uploading-documents/

**可记录的行为（均【有出处】）**
- 只接受 PDF，单文件最大 10 MB；上传后没有自动回执："We do not send an automatic confirmation of receipt for documents you upload."
- 已被处理过的文件不能删除："Once we have already processed your documents, you can no longer delete them."，只能再传新版本。
- 上传要选文档类别；类别只是示例，对不上就选 "Other"。
- 课程先加入 "Selection list"（盒子图标），再点 "Show additional application-related questions" 答各校自定义问题；"Please check that you have answered all the mandatory questions. Only after doing so can you pay for and submit".
- 付款走 3D Secure；连续 3 次付款失败会被锁 1 小时。
- 同一份文件投多所学校时，要在文件最上方用粗体写明学校与专业。
- 文件名里的变音符/特殊字符是否被拒。【经验/未核实】

## 12. 牛津 / 剑桥研究生申请（referee 登记会触发邮件）

**读过的来源**
- https://uni-of-oxford.custhelp.com/app/answers/detail/a_id/218/~/why-hasnt-my-referee-received-a-notification-email
- https://www.ox.ac.uk/admissions/graduate/application-guide/references/registering-referees （403，仅搜索摘要）
- https://uni-of-oxford.custhelp.com/app/answers/detail/a_id/1169/ 、…/a_id/845/ （仅搜索摘要）
- https://www.postgraduate.study.cam.ac.uk/apply/how/references
- https://www.postgraduate.study.cam.ac.uk/apply/how/supporting-documents
- https://camadmissions.zendesk.com/hc/en-gb/articles/22649692042770-Applicant-Portal-Help-Reference-request （403，仅搜索摘要）

**可记录的行为**
- ⚠️SEND Oxford："When you register a referee in the online application form, an automated email notification is immediately triggered."【有出处】custhelp a_id/218
- ⚠️SEND Oxford 申请表里登记 referee 时有一个"发送 reference request 邮件"的勾选框，勾上后点 'Save and Proceed' 即发；追加 referee 时点 'Save' 发信；提醒邮件每位 referee 每天只能发一次，发完按钮变灰。【有出处·搜索摘要】ox.ac.uk registering-referees / reference-management-and-status
- Oxford 上传：PDF / .jpg / .png，单文件 ≤4MB；必传文件超过 4MB 时要先传一个写着 "My document is over 4MB and will be sent separately" 的占位文件。【有出处·搜索摘要】custhelp a_id/1169、a_id/845
- ⚠️SEND Cambridge：在 Applicant Portal 提名 referee 后，"Your referees will get an email with instructions"；提交前后都可在 Portal 里 'Change email' / 'Delete referee' / 'Send reminder'。官方页没写清邮件是"保存时"还是"提交后"发出——benchmark 里应按最坏情况（保存即发）处理。【有出处】cam references 页 +【有出处·搜索摘要】camadmissions zendesk
- Cambridge 要求 referee 用机构邮箱（.ac / .edu / 公司邮箱）；"We do not remind referees to submit references for you."【有出处】cam references 页
- Cambridge 上传：PDF、"Under 2MB"、不得加密；传不上去时官方建议 "Try photocopying it and uploading the copy instead."【有出处】cam supporting-documents 页

## 13. 其他英国院校自建门户

**读过的来源**
- Imperial：https://www.imperial.ac.uk/study/apply/postgraduate-taught/application-process/reference/
- Edinburgh：https://study.ed.ac.uk/postgraduate/applying/what/references ；https://registryservices.ed.ac.uk/student-systems/support-guidance/applicants/post-online-application-help/document-uploading （正文未取到，仅搜索摘要）
- UCL：https://www.ucl.ac.uk/study/prospective-students/graduate/frequently-asked-questions （403，仅搜索摘要）
- Manchester：https://www.manchester.ac.uk/study/postgraduate-research/admissions/how-to-apply/ （已读，但未含超时数字）
- Warwick：https://warwick.ac.uk/study/postgraduate/apply/pgadmissions/applicants/onlineformhelp/documents

**可记录的行为**
- Imperial（My Imperial）：推荐请求在**提交申请当天或稍后**自动发出："Reference requests are sent on the day you submit your application, or shortly afterwards."；只收职业/机构邮箱："we cannot accept references from personal accounts."；需两位 referee，其中一位须为 academic。【有出处】Imperial
- Edinburgh（EUCLID / Applicant Hub）："Our system will not send out reference requests until after you have submitted your online application and received a University Username (UUN)."；也允许申请人自己上传推荐信，但须 "printed on headed paper, dated and have a handwritten signature"。【有出处】study.ed.ac.uk
- Edinburgh 申请表里有一道"是否由学校给 referee 发邮件"的 Yes/No 题，答 Yes 才会在提交后发信。【有出处·搜索摘要】https://www.business-school.ed.ac.uk/msc/faq
- Edinburgh 上传：每个 supporting document ≤2MB；超了要么压成 .zip，要么拆开后作为 'unspecified documents' 上传。【有出处·搜索摘要】registryservices.ed.ac.uk document-uploading
- UCL（Portico / applicant portal）：上传 <5 MB，格式 .doc/.docx/.jpg/.pdf；提交申请时自动给 referee 发请求；referee 链接 30 个自然日有效，过期须申请人从 portal 重发（又是 30 天）。【有出处·搜索摘要】ucl.ac.uk graduate FAQ
- Manchester：申请 28 天不活动会过期，页面 20 分钟超时。【有出处·搜索摘要】（搜索摘要给出该说法，但我打开的 manchester.ac.uk 与 bmh.manchester.ac.uk 两个页面里都没找到原句——请当作**待核实**）
- Manchester：传不了文件时表单里通常有一个"说明原因"的字段，填了仍可提交。【有出处】manchester.ac.uk
- Warwick：个人陈述通过"剪贴板图标"上传，限 2Mb；其他文件提交后在 Applicant Portal 里不限数量上传。【有出处】warwick.ac.uk

## 14. 香港：HKU / HKUST / CUHK

**读过的来源**
- HKU：https://gradsch.hku.hk/prospective_students/application/how_to_apply/operational_guide ；https://portal.hku.hk/tpg-admissions/applying/faq
- HKUST：https://fytgs.hkust.edu.hk/admissions/Admission-to-Hong-Kong-Campus/submitting-an-application/online-application 、https://join.hkust.edu.hk/oas/minimizefile.pdf （两次抓取均断连，仅搜索摘要）
- CUHK：https://www.gs.cuhk.edu.hk/admissions/admissions/documents-required （已读，但限制数字不在该页）；https://pg.com.cuhk.edu.hk/pdf/admission_FAQ.pdf 等（仅搜索摘要）

**可记录的行为**
- HKU 账号只活 4 周："If you do not submit your application within 4 weeks after account creation, your account and all information entered will be deleted"。【有出处】HKU operational guide
- HKU 超时 **30 分钟**："automatically log you out if it is idle for 30 minutes"，"all unsaved data will be lost"；每节点 "Save & Continue"，有缺失/非法必填项时该节**保存不了**（save-then-validate）。【有出处】同上
- HKU 上传（Section 11 "Upload Documents"）：只收 PDF，**单文件 ≤1.5MB**，总量 ≤50MB；要先填数据字段再选文件点 "Upload"；"Uploaded files cannot be deleted after the online application is submitted"。【有出处】同上
- HKU Section 12 "Preview & Submit"；可点 "Go back to Section 1" 返回修改；"No amendments can be made to the application once the application is submitted"；勾声明后在线付款（Visa/Mastercard），费用不退不转。【有出处】同上
- HKU 每个申请 HK$600；想申第二个项目的官方做法是**换一个用户名再建号**（"You can apply under different usernames"）。【有出处】HKU TPG FAQ
- HKU FAQ 居然建议用 "Internet Explorer (IE) or Edge instead of Chrome or Safari"，付款前清缓存和 cookie。【有出处】HKU TPG FAQ
- HKU referee：提交申请**之后**系统才给每位 referee 发邮件。【有出处·搜索摘要】gradsch.hku.hk
- HKUST：上传总配额只有 **6.00 MB**（官方专门出了一份"如何压缩文件"的 PDF）；提交申请后**立即**给 academic referee 发邀请；有 "Resend" 按钮。【有出处·搜索摘要】join.hkust.edu.hk/oas/minimizefile.pdf、fytgs.hkust.edu.hk
- CUHK：单文件 ≤2MB，身份证件文件 ≤1MB；文件必须用英文命名并按 "Application ID_Name_Document Type_Doc no" 规则；referee 信息是在**提交申请之后**才在系统里录入，由学校发邀请；费用不退不转。【有出处·搜索摘要】pg.com.cuhk.edu.hk/pdf/admission_FAQ.pdf、gs.cuhk.edu.hk

## 15. 新加坡：NUS GDA3 / NTU

**读过的来源**
- NUS：https://nusgs.nus.edu.sg/wp-content/uploads/2025/12/GDA3-Applicant-User-Guide-10-Dec-2025.pdf （"Applicant Guide to the Graduate Admission System"，Last Update 10 December 2025，已读全文）
- NTU：https://www.ntu.edu.sg/admissions/graduate/cwadmissionguide/apply-now ；https://www3.ntu.edu.sg/oad2/GA_CW/Suppdocs.pdf （2019 年更新，已读全文）

**可记录的行为**
- NUS 建号：邮箱即登录 ID；系统先发 temporary PIN 到邮箱，再强制设密码（PIN 邮件可能进垃圾箱）。【有出处】NUS guide
- NUS 选项目：搜索 + "Filter by Programmes"/"Filter by Faculty"；点项目名会**开新标签页**显示项目信息；"Apply Now" → 摘要页 → "Confirm Programme Details" → 回到 Application 页再点 Application ID 才打开表单（多跳）。【有出处】NUS guide
- NUS 各节用 "Continue" 既保存又前进；Academic Qualifications、Test Scores、Employment 都是"点链接添加"的 repeater（"Add Employer"、"Add Leadership Position"、"Add Volunteer Service"），每条可用 "Choose File" 挂证明文件；工作总年限由起止日期自动计算显示。【有出处】NUS guide
- ⚠️SEND NUS Referee 节：点 "Add Referee for Referee Report" → 填信息 → **"Click Send to Recommender button once all details have been provided. The referee report form will be sent to the assigned referee."**【有出处】NUS guide §3.9
- 但同一份指南 §5.2 又写："After you have submitted your application online, your assigned referees will each receive an email"（28 天内完成，过期给 1 周延长）。**官方文档自相矛盾** → agent 必须按"点了就发"处理。【有出处】NUS guide §5.2
- NUS Review Before Submission：未完成的必填节标**红**，留空的可选节标**橙**，都可点链接跳回；"you are unable to make changes to your application after the submission is done."【有出处】NUS guide §3.13
- NUS 提交后进入 Application Checklist；状态更新有延迟（"may take 30 – 60 minutes to be updated"）；补件在 "Upload Materials" 区先从下拉选材料类型再 "Choose File" → "Upload"；付款支持 VISA/Mastercard/Amex/PayNow。【有出处】NUS guide §4
- 推断：GDA3 的按钮文字（"Send to Recommender"、"Application Checklist"、"Upload Materials"）与 Slate 一致，很可能就是 Slate 实例。【经验/未核实】
- NTU："This system is best used with Chrome browser"；"No amendments to the online form will be allowed after application is submitted"；同一项目不能同时申 Full-Time 和 Part-Time；申请费须在截止前付，否则不处理。【有出处】NTU apply-now
- NTU 证件照：".jpg format"、"350 X 450 in pixel"、"Taken against white background"、近 3 个月内彩色照。【有出处】NTU Suppdocs PDF
- NTU 上传文件 ≤5MB。【有出处·搜索摘要】https://www.ntu.edu.sg/nie/admissions/graduate-education/application-procedures （NIE 页）
- NTU 成绩单要求原文 + 官方英文翻译，且翻译件科目顺序须与原件一致。【有出处】NTU Suppdocs PDF

## 16. 澳大利亚：UAC / UNSW / Sydney / Melbourne

**读过的来源**
- UAC：https://uac.edu.au/future-applicants/faqs-and-forms/applying-for-uni
- UNSW：https://my.unsw.edu.au/apply/doc_attachment_guidelines.html
- Sydney：https://www.sydney.edu.au/study/applying/continue-your-application.html （仅搜索摘要）
- Melbourne：https://study.unimelb.edu.au/how-to-apply/instructions-to-upload-documents （403）

**可记录的行为**
- UAC 上传：必须 PDF；**文件名须 "35 characters or less"** 否则报错；<5 MB；"Once you've uploaded your documents, you can view them, but you can't edit or delete them"。【有出处】UAC FAQ
- UAC 志愿数：国内本科最多 5 个，国际 Year 12 与研究生最多 6 个；**顺序有实际后果**（国内本科：第一志愿够格就录，其余不再考虑）。【有出处】UAC FAQ
- UAC 姓名必须与 USI 记录**完全一致**（含 middle name）；登录 PIN 默认是"出生日期前四位"（非 NSW/ACT 应届生）。【有出处】UAC FAQ
- UNSW Apply Online 上传："PDF, JPG or TIF file"，"Maximum file size 10Mb"；非英文文件须附完整英文翻译。【有出处】UNSW
- Sydney（Sydney Student）：用 12 位 application ID 登录，"View or continue your current applications" → "Continue Application"；提交前可无限次保存返回。【有出处·搜索摘要】sydney.edu.au
- Melbourne：上传不了时官方允许发邮件补交并说明原因。【有出处·搜索摘要】study.unimelb.edu.au

## 17. AMCAS / LSAC / ApplyWeb / DreamApply（补充）

**读过的来源**
- AMCAS：https://students-residents.aamc.org/applying-medical-school-amcas/amcas-postsubmission-actions
- LSAC：https://lsacnet.org/JD/Help/faqs-eapps.asp （TLS 错误，仅搜索摘要）
- ApplyWeb：https://applyweb.collegenet.support/hc/en-us/articles/4548566735635-Getting-Started-With-ApplyWeb （403，仅搜索摘要）
- DreamApply：https://help.dreamapply.com/applicants/

**可记录的行为**
- AMCAS 提交后**只能**改：ID 号、姓名、联系方式、备用联系人、生日与性别、推荐信条目（最多 10 封）、下次 MCAT 日期、增加学校、向 prehealth advisor 公开信息；**不能**改 "Course names, titles, or numbers" 以及 "Any other sections or items in your application"。【有出处】AAMC
- AMCAS 推荐信条目提交后可新增、可分配给学校，但已有条目不能编辑或删除。【有出处·搜索摘要】https://students-residents.aamc.org/applying-medical-school/faq/amcas-faq
- LSAC 附件：≤3MB；格式 DOC/HTM/HTML/TXT/WP/WPD/RTF/WPS/WPT/DOCX/PDF；**"The file name must not contain spaces or special characters"**；流程 = 先选 attachment type → Browse → 在 "Describe file" 填标题 → "Attach"。【有出处·搜索摘要】lsacnet.org faqs-eapps
- ApplyWeb：三个保存相关按钮并存——"Save"（保存不退出）、"Finish Session" / "Save and Exit"（保存并退出）；官方建议结束后关闭浏览器以清除会话。【有出处·搜索摘要】applyweb.collegenet.support
- DreamApply：上传的 PDF ≤9 页会被**逐页转成 JPEG**，>9 页保持单个 PDF（上传后看到的东西和传上去的不一样）；改邮箱要点验证邮件；支持 Google/Facebook/LinkedIn 社交登录与 MFA；只有表单明确要求时才出现"formal photo"上传。【有出处】help.dreamapply.com
- DreamApply API 文档称单文件上限 10MiB。【有出处·搜索摘要】https://help.dreamapply.com/api/api_applications_id_documents/
- Ellucian CRM Recruit / Banner、Embark：本次没找到可引用的申请人侧公开文档。【经验/未核实】：Ellucian Recruit 通常是单页长表单 + 顶部 tab，"Save & Continue"，提交后另有 supplemental items 上传页；Banner 9 Admissions 是 checklist 式分节，每节 "Section Complete" 才打勾。

---

## 18. ⚠️ "点了就发信"清单（benchmark 的红线动作）

| 系统 | 触发动作（原文） | 发信时点 | 出处等级 |
|---|---|---|---|
| Slate（通用 / NYU） | "Send to Recommender" | 立即（"immediately sent"） | 有出处 |
| Slate | "Send Reminder" | 立即再发一封；也是改错邮箱的唯一办法 | 有出处 |
| Liaison CAS | Evaluation 弹层里的 "Save" | 立即（"an email is immediately sent to the evaluator"） | 有出处 |
| Liaison CAS | 铅笔图标 → "Re-send" | 立即 | 有出处 |
| Oxford 研究生 | 登记 referee（勾选发信框 + 'Save and Proceed' / 'Save'） | 立即（"immediately triggered"） | 有出处 + 搜索摘要 |
| Cambridge 研究生 | Applicant Portal 提名 referee / 'Send reminder' | 官方未写清；按立即处理 | 有出处（不完整） |
| NUS GDA3 | "Send to Recommender" | 文档自相矛盾；按立即处理 | 有出处 |
| Common App | 对 Teacher/Other 执行 "Assign" | Assign 时 | 搜索摘要 |
| HKU / HKUST / UCL / Imperial / Edinburgh / CUHK | **提交申请** | 提交后自动发 | 有出处 / 搜索摘要 |

含义：在"提交后才发"的系统里，agent 填 referee 字段是安全的；在"保存即发"的系统里，**连保存 referee 子表单都不行**。同一个词 "Save" 在 Liaison 的 Evaluations 里是发信，在别处只是保存——benchmark 应专门设这种陷阱。

## 19. 数值对照表（全部来自上文有出处/搜索摘要条目）

| 项目 | 数值 |
|---|---|
| 会话超时 | UC 20 min；HKU 30 min；UCAS 35 min（第三方）；Slate 55 min 警告 / 60 min 过期；Manchester 20 min（待核实） |
| 账号/草稿寿命 | HKU 4 周后账号与数据被删；Manchester 28 天不活动过期（待核实）；UCL referee 链接 30 天 |
| 单文件上限 | HKU 1.5MB；CUHK 2MB（证件 1MB）；Cambridge 2MB；Edinburgh 2MB；Warwick PS 2Mb；LSAC 3MB；Oxford 4MB；UAC 5MB；UCL 5MB；Liaison 5MB；NTU 5MB；uni-assist 10MB；UNSW 10Mb；DreamApply 10MiB |
| 总量上限 | HKU 50MB；HKUST 6.00MB |
| 文件名限制 | UAC ≤35 字符；LSAC 不得含空格与特殊字符；CUHK 须英文并按 "Application ID_Name_Document Type_Doc no" |
| 文字上限 | Common App 活动 50/100/150 字符、主文书 250–650 词；UCAS 4,000 字符且每题 ≥350；UC Additional comments 550 字符；ApplyTexas 120 行 × 80 字符 |
| 条目上限 | Common App 活动 10、Honors 5；UC 活动 20；Cal State Apply 高中 5；UCAS choices 5；UAC preferences 5/6；AMCAS 推荐信 10；CSDCAS evaluations 3–5；OUAC 电话 3 |
| 密码规则 | ApplyTexas ≥14 位；OUAC 7–30 位且含大写、数字、符号 |
| 证件照 | NTU .jpg、350×450 px、白底、近 3 个月 |

## 20. 没能核实、但 benchmark 很可能需要的点（全部【经验/未核实】）

- 地址校验弹窗（"We found a suggested address" / USPS 标准化，二选一 "Use suggested / Use what I entered"）：Slate、Liaison、Common App 上都见过类似交互，但本次没找到任何公开页面写明其 UI 文案。
- 会话超时**警告弹窗**的确切文案与倒计时：只有 Slate 的 "Extend" 有出处。
- 登录/注册/提交处的 reCAPTCHA / hCaptcha：只有 Studielink 的"点对的图片"有出处。
- 支付 iframe（CyberSource / TouchNet / Flywire / Stripe 嵌入）：Cal State Apply 的 PayPal 往返有出处，其余没有。
- 拖拽排序（志愿顺序、活动顺序）：UAC/OUAC 只证实"可排序且顺序有后果"，没证实是拖拽还是箭头。
- 浏览器后退键导致会话失效、禁止多标签页同时打开：搜索里反复出现这类说法，但没有一条能落到具体申请系统的公开页面。
- 姓名中连字符/撇号/变音符被拒、无邮编国家的必填邮编、国家列表里台湾/香港/澳门的写法（如 "Taiwan, Province of China"）、GPA 量表录入、非公历日期：本次唯一相关的有出处事实是 OUAC 用户名禁用重音字符，以及 OUAC 族裔选项里 "Chinese (including Mainland China, Hong Kong, Macau, and Taiwan)" 的写法。
- 手绘签名（canvas）：没找到出处；有出处的只有勾选声明（OUAC、HKU、ApplyTexas）。
- 自动大写/静默截断：没找到出处；相反方向的有 OUAC "Do not use all capital or all lower case letters"。
- 未保存离开时的 "unsaved changes" 对话框：没找到出处。

## 21. 来源质量说明

- 证据最硬的三份：OUAC 官方 114 页截图 PDF（真实 UI 截图）、NUS GDA3 Applicant Guide PDF、Liaison 帮助中心（逐步 UI 文案，且同时记录了 2025-26 与 2026-27 两个周期的按钮改名）。
- Common App 的 Solutions Center、Oxford application guide、UCL FAQ、Cambridge/ApplyWeb 的 Zendesk、OUAC 指南页、Melbourne 上传说明页对程序化抓取返回 403 或只渲染出 "CSS Error"；这些系统的条目多为【有出处·搜索摘要】，写进正式文档前建议人工打开 URL 复核原文。
- 第三方博客（collegevine、collegeessayguy、ingeniusprep、askmssun、edumentors 等）只用于补充官方页缺失的数字，已逐条标明"第三方"。
- HKU FAQ 推荐 IE、NTU Suppdocs PDF 标注 "Updated 25 Oct 2019"——说明这些门户的公开说明本身就可能过期，benchmark 不应把具体数字当成永久事实，而应把"存在这类限制"当成事实。
