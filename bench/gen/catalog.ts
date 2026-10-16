// Semantic field catalogue: what a field MEANS, independent of how any portal draws it.
// The reskinner picks one label / id / placeholder per instance from the tables below.

export type VT = "text" | "email" | "select" | "multi" | "date" | "month" | "phone" | "bool" | "essay" | "file" | "photo" | "order" | "prog";

export interface Sem {
  vt: VT;
  labels: string[];
  zh?: [string, string]; // [zh-Hant, zh-Hans]
  good: string[]; // meaningful ids
  bad?: string[]; // MISLEADING ids (flagged in answers)
  ph?: string[]; // placeholder examples; must never equal any student's truth
  set?: string; // option set name for select / multi
  help?: string[];
}

const S = (vt: VT, labels: string[], good: string[], extra: Partial<Sem> = {}): Sem => ({ vt, labels, good, ...extra });

export const CATALOG: Record<string, Sem> = {
  title: S("select", ["Title", "Salutation", "Prefix"], ["title", "salutation", "ddlTitle"], { set: "title", zh: ["稱謂", "称谓"] }),
  family_name: S("text", ["Surname", "Family name", "Last name", "Surname / Family name (as in passport)"], ["surname", "familyName", "txtLastName", "last_name"], {
    bad: ["firstname", "name1", "given"],
    ph: ["e.g. SMITH", "Doe", "As shown on passport"],
    zh: ["姓氏", "姓"],
  }),
  given_name: S("text", ["Given name(s)", "First name", "Forename(s)", "Given names (as in passport)"], ["givenName", "firstName", "txtFirstName", "forename"], {
    bad: ["lastname", "name2", "surname2"],
    ph: ["e.g. John", "Jane Mary", "As shown on passport"],
    zh: ["名字", "名"],
  }),
  middle_name: S("text", ["Middle name", "Middle name(s)", "Other names"], ["middleName", "txtMiddle", "middle_name"], { ph: ["if any", "Optional"], zh: ["中間名", "中间名"] }),
  preferred_name: S("text", ["Preferred name", "Known as", "Preferred first name", "Nickname"], ["preferredName", "knownAs", "nickname"], { ph: ["e.g. Sam"], zh: ["常用名", "常用名"] }),
  native_name: S("text", ["Name in native script", "Name in Chinese characters (if any)", "Name in original language"], ["nativeName", "nameLocal", "chineseName"], {
    ph: ["e.g. 陳大文", "e.g. 王小明"],
    zh: ["中文姓名", "中文姓名"],
  }),
  former_name: S("text", ["Former / maiden name", "Previous surname", "Any other name used"], ["formerName", "maidenName", "prevSurname"], { bad: ["surname"], ph: ["if applicable"], zh: ["曾用名", "曾用名"] }),
  gender: S("select", ["Gender", "Sex", "Legal sex"], ["gender", "sex", "rbGender"], { set: "gender", zh: ["性別", "性别"] }),
  dob: S("date", ["Date of birth", "DOB", "Birth date"], ["dob", "birthDate", "dateOfBirth"], { bad: ["issueDate"], zh: ["出生日期", "出生日期"] }),
  birth_country: S("select", ["Country of birth", "Country / region of birth", "Place of birth (country)"], ["birthCountry", "countryOfBirth", "cob"], { set: "country", zh: ["出生國家/地區", "出生国家/地区"] }),
  birth_city: S("text", ["City of birth", "Town / city of birth", "Place of birth (city)"], ["birthCity", "placeOfBirth", "pob"], { ph: ["e.g. Lisbon", "City"], zh: ["出生城市", "出生城市"] }),
  nationality: S("select", ["Nationality", "Country of citizenship", "Citizenship", "Country / region of nationality"], ["nationality", "citizenship", "ddlNationality"], {
    bad: ["residenceCountry"],
    set: "country",
    zh: ["國籍/地區", "国籍/地区"],
  }),
  second_nationality: S("select", ["Second nationality", "Dual citizenship (if any)", "Other citizenship"], ["nationality2", "dualCitizenship", "otherCitizenship"], { set: "country", zh: ["第二國籍", "第二国籍"] }),
  passport_no: S("text", ["Passport number", "Passport no.", "Travel document number"], ["passportNo", "passportNumber", "txtPassport"], {
    bad: ["nationalId"],
    ph: ["e.g. X1234567", "A00000000"],
    zh: ["護照號碼", "护照号码"],
  }),
  passport_issue: S("date", ["Passport issue date", "Date of issue", "Passport issued on"], ["passportIssue", "issueDate", "ppIssued"], { bad: ["expiry"], zh: ["護照簽發日期", "护照签发日期"] }),
  passport_expiry: S("date", ["Passport expiry date", "Date of expiry", "Passport valid until"], ["passportExpiry", "expiryDate", "ppExpires"], { bad: ["issue"], zh: ["護照到期日", "护照有效期至"] }),
  passport_country: S("select", ["Passport issuing country", "Country / region of issue", "Issuing authority (country)"], ["passportCountry", "issuingCountry", "ppCountry"], { set: "country", zh: ["護照簽發地", "护照签发地"] }),
  email: S("email", ["Email address", "E-mail", "Primary email"], ["email", "emailAddress", "txtEmail"], { ph: ["name@example.org", "you@domain.com"], zh: ["電郵地址", "电子邮箱"] }),
  alt_email: S("email", ["Alternative email", "Secondary e-mail", "Other email address"], ["altEmail", "email2", "secondaryEmail"], { bad: ["email"], ph: ["optional"], zh: ["備用電郵", "备用邮箱"] }),
  phone: S("phone", ["Mobile phone", "Mobile number", "Telephone (mobile)", "Contact number"], ["mobile", "phone", "txtMobile", "telephone"], { ph: ["0912 345 678", "+44 7400 123456", "e.g. +1 201 555 0123"], zh: ["手提電話", "手机号码"] }),
  alt_phone: S("phone", ["Alternative phone", "Other telephone", "Home / daytime phone"], ["altPhone", "phone2", "homePhone"], { bad: ["mobile"], ph: ["optional"], zh: ["其他電話", "其他电话"] }),
  addr_line1: S("text", ["Address line 1", "Street address", "Address (line 1)", "House number and street"], ["address1", "addrLine1", "street"], { ph: ["e.g. 10 Downing Close", "Flat / house no., street"], zh: ["地址第一行", "地址第一行"] }),
  addr_line2: S("text", ["Address line 2", "Address (line 2)", "Apartment, suite, district"], ["address2", "addrLine2", "street2"], { ph: ["optional"], zh: ["地址第二行", "地址第二行"] }),
  addr_city: S("text", ["City", "Town / City", "City / District"], ["city", "town", "addrCity"], { ph: ["e.g. Springfield"], zh: ["城市", "城市"] }),
  addr_state: S("text", ["State / Province", "County / State / Province", "Region"], ["state", "province", "region"], { ph: ["if applicable"], zh: ["州/省", "州/省"] }),
  addr_postal: S("text", ["Postal code", "ZIP / Postcode", "Postcode"], ["postalCode", "zip", "postcode"], { ph: ["e.g. 90210", "AB1 2CD"], zh: ["郵政編碼", "邮政编码"] }),
  addr_country: S("select", ["Country", "Country / Region", "Country of residence"], ["country", "addrCountry", "countryOfResidence"], { bad: ["nationality"], set: "country", zh: ["國家/地區", "国家/地区"] }),
  mail_same: S("bool", ["Mailing address is the same as home address", "Correspondence address same as permanent address", "Use my home address for correspondence"], ["sameAddress", "chkSame", "mailSame"], {
    zh: ["通訊地址與住址相同", "通讯地址与住址相同"],
  }),
  mail_line1: S("text", ["Mailing address line 1", "Correspondence address (line 1)", "Street address"], ["mailAddress1", "corrLine1", "mStreet"], { bad: ["address1"], zh: ["通訊地址第一行", "通讯地址第一行"] }),
  mail_line2: S("text", ["Mailing address line 2", "Correspondence address (line 2)", "Address line 2"], ["mailAddress2", "corrLine2", "mStreet2"], { zh: ["通訊地址第二行", "通讯地址第二行"] }),
  mail_city: S("text", ["City", "Town / City", "Mailing city"], ["mailCity", "corrCity", "mTown"], { bad: ["city"], zh: ["城市", "城市"] }),
  mail_state: S("text", ["State / Province", "County / State", "Region"], ["mailState", "corrState", "mRegion"], { zh: ["州/省", "州/省"] }),
  mail_postal: S("text", ["Postal code", "ZIP / Postcode", "Postcode"], ["mailPostal", "corrPostcode", "mZip"], { zh: ["郵政編碼", "邮政编码"] }),
  mail_country: S("select", ["Country", "Country / Region", "Mailing country"], ["mailCountry", "corrCountry", "mCountry"], { set: "country", zh: ["國家/地區", "国家/地区"] }),
  ec_name: S("text", ["Emergency contact name", "Next of kin - full name", "Name of contact person"], ["ecName", "nokName", "emergencyName"], { bad: ["fullName"], ph: ["Full name"], zh: ["緊急聯絡人姓名", "紧急联系人姓名"] }),
  ec_relation: S("select", ["Relationship to you", "Relationship", "Relationship to applicant"], ["ecRelation", "nokRelationship", "relationship"], { set: "relation", zh: ["與申請人關係", "与申请人关系"] }),
  ec_phone: S("phone", ["Emergency contact phone", "Next of kin telephone", "Contact person's phone"], ["ecPhone", "nokPhone", "emergencyTel"], { bad: ["phone"], ph: ["incl. country code"], zh: ["緊急聯絡人電話", "紧急联系人电话"] }),
  ec_email: S("email", ["Emergency contact email", "Next of kin e-mail", "Contact person's email"], ["ecEmail", "nokEmail", "emergencyEmail"], { ph: ["optional"], zh: ["緊急聯絡人電郵", "紧急联系人邮箱"] }),

  // education rows
  institution: S("text", ["Institution", "Name of university / college", "School attended", "Institution name"], ["institution", "schoolName", "university"], { ph: ["Search or type the institution name"], zh: ["院校名稱", "院校名称"] }),
  inst_country: S("select", ["Country of institution", "Country / region", "Institution location (country)"], ["instCountry", "schoolCountry", "eduCountry"], { set: "country", zh: ["院校所在國家/地區", "院校所在国家/地区"] }),
  inst_city: S("text", ["City", "Institution city", "Campus location"], ["instCity", "schoolCity", "eduCity"], { zh: ["院校所在城市", "院校所在城市"] }),
  level: S("select", ["Level of study", "Qualification level", "Type of study"], ["level", "qualLevel", "studyLevel"], { set: "level", zh: ["學歷程度", "学历层次"] }),
  degree_title: S("text", ["Degree / qualification title", "Qualification name", "Degree awarded (or expected)"], ["degreeTitle", "qualification", "award"], { ph: ["e.g. BA (Hons)", "e.g. Bachelor of Arts"], zh: ["學位名稱", "学位名称"] }),
  major: S("text", ["Major / field of study", "Subject", "Programme of study", "Discipline"], ["major", "subject", "fieldOfStudy"], { ph: ["e.g. History"], zh: ["主修科目", "专业"] }),
  start: S("month", ["Start date", "Date from", "Enrolled from"], ["startDate", "dateFrom", "eduFrom"], { bad: ["endDate"], zh: ["入學年月", "入学年月"] }),
  end: S("month", ["End date (or expected)", "Date to", "Completion / expected completion date"], ["endDate", "dateTo", "eduTo"], { bad: ["startDate"], zh: ["畢業年月（或預計）", "毕业年月（或预计）"] }),
  in_progress: S("bool", ["I am currently studying here", "Still in progress", "Qualification not yet completed"], ["inProgress", "current", "chkOngoing"], { zh: ["仍在就讀", "仍在就读"] }),
  gpa: S("text", ["GPA / average mark", "Cumulative GPA", "Overall result", "Final grade / average"], ["gpa", "cgpa", "overallGrade"], { ph: ["e.g. 3.45", "e.g. 68"], zh: ["平均成績/GPA", "平均成绩/GPA"] }),
  gpa_scale: S("select", ["GPA scale", "Out of", "Maximum possible"], ["gpaScale", "gradeScale", "maxGpa"], { set: "gpa_scale", zh: ["滿分", "满分"] }),
  instr_lang: S("select", ["Language of instruction", "Medium of instruction", "Teaching language"], ["instructionLanguage", "moi", "teachLang"], { set: "instr_lang", zh: ["授課語言", "授课语言"] }),

  // course rows
  c_code: S("text", ["Course code", "Module code", "Code"], ["courseCode", "moduleCode"], {}),
  c_title: S("text", ["Course title", "Module title", "Course name"], ["courseTitle", "moduleTitle"], {}),
  c_credits: S("text", ["Credits", "Credit hours", "Units"], ["credits", "units"], {}),
  c_grade: S("text", ["Grade", "Mark", "Result"], ["grade", "mark"], {}),
  c_term: S("text", ["Term", "Semester taken", "Academic period"], ["term", "semester"], {}),

  // tests (flat)
  eng_test_type: S("select", ["English language test", "English proficiency test taken", "Type of English test"], ["englishTest", "engTestType", "ddlEnglish"], { set: "eng_test", zh: ["英語考試類別", "英语考试类别"] }),
  eng_test_date: S("date", ["Test date", "Date of test", "Date taken"], ["testDate", "engTestDate", "examDate"], { bad: ["dob"], zh: ["考試日期", "考试日期"] }),
  eng_overall: S("text", ["Overall score", "Total score", "Overall band / total"], ["overall", "totalScore", "engTotal"], { ph: ["e.g. 6.5", "e.g. 90"], zh: ["總分", "总分"] }),
  eng_l: S("text", ["Listening", "Listening score"], ["listening", "scoreL"], { bad: ["reading"], zh: ["聆聽", "听力"] }),
  eng_r: S("text", ["Reading", "Reading score"], ["reading", "scoreR"], { bad: ["listening"], zh: ["閱讀", "阅读"] }),
  eng_w: S("text", ["Writing", "Writing score"], ["writing", "scoreW"], { bad: ["speaking"], zh: ["寫作", "写作"] }),
  eng_s: S("text", ["Speaking", "Speaking score"], ["speaking", "scoreS"], { bad: ["writing"], zh: ["口語", "口语"] }),
  eng_ref: S("text", ["Test report / registration number", "TRF number / Registration ID", "Candidate / reference number"], ["trfNumber", "testRef", "registrationNo"], { ph: ["e.g. 00XX000000XXXX000X"], zh: ["成績單編號", "成绩单编号"] }),
  gre_taken: S("select", ["Have you taken the GRE?", "GRE General Test taken?", "Do you have a GRE score?"], ["greTaken", "hasGre", "rbGre"], { set: "yesno", zh: ["是否已考GRE", "是否已考GRE"] }),
  gre_date: S("date", ["GRE test date", "Date of GRE", "GRE taken on"], ["greDate", "greTestDate"], { zh: ["GRE考試日期", "GRE考试日期"] }),
  gre_v: S("text", ["GRE Verbal Reasoning", "Verbal", "GRE Verbal score"], ["greVerbal", "greV"], { bad: ["greQ"], ph: ["130-170"], zh: ["GRE語文", "GRE语文"] }),
  gre_q: S("text", ["GRE Quantitative Reasoning", "Quantitative", "GRE Quant score"], ["greQuant", "greQ"], { bad: ["greV"], ph: ["130-170"], zh: ["GRE數學", "GRE数学"] }),
  gre_aw: S("text", ["GRE Analytical Writing", "Analytical Writing", "GRE AWA score"], ["greAw", "greWriting"], { ph: ["0.0-6.0"], zh: ["GRE寫作", "GRE写作"] }),

  // test rows (repeater form)
  t_kind: S("select", ["Test", "Test type", "Which test?"], ["testType", "examType"], { set: "test_kind" }),
  t_date: S("date", ["Test date", "Date taken", "Date of test"], ["testDate", "dateTaken"], {}),
  t_overall: S("text", ["Overall / total score", "Total", "Overall band"], ["overall", "total"], { ph: ["e.g. 6.5", "e.g. 90"] }),
  t_l: S("text", ["Listening", "Listening score"], ["listening", "subL"], { bad: ["reading"] }),
  t_r: S("text", ["Reading", "Reading score"], ["reading", "subR"], { bad: ["listening"] }),
  t_w: S("text", ["Writing", "Writing score"], ["writing", "subW"], { bad: ["speaking"] }),
  t_s: S("text", ["Speaking", "Speaking score"], ["speaking", "subS"], { bad: ["writing"] }),
  t_v: S("text", ["Verbal Reasoning", "Verbal"], ["verbal", "subV"], { bad: ["quant"], ph: ["130-170"] }),
  t_q: S("text", ["Quantitative Reasoning", "Quantitative"], ["quant", "subQ"], { bad: ["verbal"], ph: ["130-170"] }),
  t_aw: S("text", ["Analytical Writing", "AWA"], ["analytical", "subAW"], { ph: ["0.0-6.0"] }),
  t_ref: S("text", ["Registration / report number", "Reference number", "Candidate number"], ["regNo", "reference"], {}),

  // employment rows
  employer: S("text", ["Employer", "Organisation", "Company name", "Name of employer"], ["employer", "company", "orgName"], { ph: ["e.g. Acme Ltd"], zh: ["僱主名稱", "雇主名称"] }),
  job_title: S("text", ["Job title", "Position held", "Role"], ["jobTitle", "position", "role"], { ph: ["e.g. Analyst"], zh: ["職位", "职位"] }),
  emp_country: S("select", ["Country", "Country / Region of employment", "Location (country)"], ["empCountry", "workCountry"], { set: "country", zh: ["工作國家/地區", "工作国家/地区"] }),
  emp_city: S("text", ["City", "Work location (city)", "Town / City"], ["empCity", "workCity"], { zh: ["工作城市", "工作城市"] }),
  emp_start: S("month", ["Start date", "From", "Date started"], ["empFrom", "workStart", "startDate"], { bad: ["workEnd"], zh: ["開始年月", "开始年月"] }),
  emp_end: S("month", ["End date", "To", "Date left"], ["empTo", "workEnd", "endDate"], { bad: ["workStart"], zh: ["結束年月", "结束年月"] }),
  emp_current: S("bool", ["I currently work here", "Current position", "This is my present employment"], ["empCurrent", "isCurrent", "chkPresent"], { zh: ["目前在職", "目前在职"] }),
  emp_type: S("select", ["Employment type", "Nature of employment", "Full-time / part-time"], ["empType", "workType"], { set: "emp_type", zh: ["工作性質", "工作性质"] }),
  duties: S("text", ["Main duties", "Responsibilities", "Brief description of duties"], ["duties", "responsibilities", "jobDesc"], { ph: ["Describe your main responsibilities"], zh: ["主要職責", "主要职责"] }),

  // recommenders
  r_title: S("select", ["Title", "Referee title", "Salutation"], ["refTitle", "rTitle"], { set: "title", zh: ["稱謂", "称谓"] }),
  r_family: S("text", ["Referee surname", "Recommender last name", "Family name"], ["refSurname", "recLastName", "rFamily"], { bad: ["refFirstName"], zh: ["推薦人姓氏", "推荐人姓"] }),
  r_given: S("text", ["Referee given name", "Recommender first name", "First name"], ["refGivenName", "recFirstName", "rGiven"], { bad: ["refLastName"], zh: ["推薦人名字", "推荐人名"] }),
  r_org: S("text", ["Institution / organisation", "Recommender's organisation", "Place of work"], ["refOrg", "recOrganisation", "rInstitution"], { zh: ["推薦人機構", "推荐人单位"] }),
  r_position: S("text", ["Position / job title", "Recommender's title or position", "Role"], ["refPosition", "recPosition", "rRole"], { zh: ["推薦人職位", "推荐人职位"] }),
  r_email: S("email", ["Referee email", "Recommender's e-mail (institutional preferred)", "Email address"], ["refEmail", "recEmail", "rMail"], { ph: ["name@university.edu"], zh: ["推薦人電郵", "推荐人邮箱"] }),
  r_phone: S("phone", ["Referee telephone", "Recommender's phone", "Phone number"], ["refPhone", "recPhone", "rTel"], { ph: ["incl. country code"], zh: ["推薦人電話", "推荐人电话"] }),
  r_relation: S("select", ["Type of reference", "Referee type", "Relationship"], ["refType", "recType", "rKind"], { set: "ref_type", zh: ["推薦人類別", "推荐人类别"] }),

  // programme etc.
  prog: S("prog", ["Programme", "Programme applied for", "Program of study", "Course"], ["programme", "programCode", "ddlProgram"], { zh: ["申請課程", "申请课程"] }),
  intake: S("select", ["Intake", "Entry term", "Proposed start", "Admission term"], ["intake", "entryTerm", "startTerm"], { set: "intake", zh: ["入學學期", "入学学期"] }),
  mode: S("select", ["Mode of study", "Study mode", "Attendance"], ["studyMode", "mode", "attendance"], { set: "mode", zh: ["修讀模式", "修读模式"] }),
  prefs: S("order", ["Programme preferences (in order)", "Rank your programme choices", "Order of preference"], ["preferences", "choiceOrder"], { zh: ["課程志願次序", "课程志愿顺序"] }),
  languages: S("multi", ["Languages spoken", "Languages you speak", "Language skills"], ["languages", "spokenLanguages"], { set: "language", zh: ["使用語言", "使用语言"] }),
  funding: S("select", ["Source of funding", "How will you fund your studies?", "Main source of finance"], ["funding", "financeSource", "ddlFunding"], { set: "funding", zh: ["學費來源", "学费来源"] }),
  scholarship: S("select", ["Do you wish to be considered for a scholarship?", "Apply for scholarship?", "Scholarship consideration"], ["scholarship", "applyScholarship"], { set: "yesno", zh: ["是否申請獎學金", "是否申请奖学金"] }),
  conviction: S("select", ["Do you have any unspent criminal convictions?", "Have you ever been convicted of a criminal offence?", "Criminal record"], ["conviction", "criminalRecord"], {
    set: "yesno",
    zh: ["有否刑事定罪紀錄", "有无刑事定罪记录"],
  }),
  hear_about: S("select", ["How did you hear about us?", "Where did you learn about this programme?"], ["hearAbout", "source", "referral"], { set: "hear", zh: ["從何得知本校", "从何得知本校"] }),
  research_title: S("text", ["Proposed research topic / area of interest", "Area of interest", "Title of proposed project"], ["researchTitle", "interestArea", "topic"], { ph: ["One line"], zh: ["研究興趣/題目", "研究兴趣/题目"] }),
  essay: S("essay", ["Personal statement", "Statement of purpose", "Why do you want to study this programme?"], ["personalStatement", "sop", "statement"], { zh: ["個人陳述", "个人陈述"] }),
  photo: S("photo", ["Photograph", "Passport-style photo", "Applicant photo"], ["photo", "applicantPhoto"], { zh: ["證件相片", "证件照片"] }),
  doc_transcript: S("file", ["Academic transcript", "Transcript(s)", "Official transcript"], ["transcriptFile", "docTranscript"], { zh: ["成績單", "成绩单"] }),
  doc_passport: S("file", ["Passport copy", "Copy of passport information page", "Identity document"], ["passportFile", "docPassport"], { zh: ["護照副本", "护照复印件"] }),
  doc_cv: S("file", ["CV / Résumé", "Curriculum vitae", "Résumé"], ["cvFile", "docCv"], { zh: ["履歷", "简历"] }),
  docs: S("file", ["Supporting documents", "Upload documents", "Documents"], ["documents", "uploads"], { zh: ["證明文件", "证明文件"] }),
};

export const OPAQUE_PREFIXES = ["f_", "fld", "ctl00_", "q", "x", "in_", "c"];
