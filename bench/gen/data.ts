// Reference data shared by all simulated portals: countries, option sets, institutions, programmes.
// Truth files store CODES; every portal instance renders its own LABELS, chosen by the reskinner.

import type { Rng } from "./rng";

export interface Opt {
  l: string; // visible label
  c: string[]; // truth codes that map onto this option
}

// code, default name, dial code, national-number example (used as changing placeholder)
const COUNTRY_ROWS: [string, string, string, string][] = [
  ["AU", "Australia", "61", "412 345 678"],
  ["AT", "Austria", "43", "664 123456"],
  ["BD", "Bangladesh", "880", "1812 345678"],
  ["BE", "Belgium", "32", "470 12 34 56"],
  ["BR", "Brazil", "55", "11 96123 4567"],
  ["CA", "Canada", "1", "506 234 5678"],
  ["CL", "Chile", "56", "2 2123 4567"],
  ["CN", "China", "86", "131 2345 6789"],
  ["DK", "Denmark", "45", "32 12 34 56"],
  ["EG", "Egypt", "20", "100 123 4567"],
  ["FI", "Finland", "358", "41 2345678"],
  ["FR", "France", "33", "6 12 34 56 78"],
  ["DE", "Germany", "49", "1512 3456789"],
  ["GH", "Ghana", "233", "23 123 4567"],
  ["GR", "Greece", "30", "691 234 5678"],
  ["HK", "Hong Kong", "852", "5123 4567"],
  ["IN", "India", "91", "81234 56789"],
  ["ID", "Indonesia", "62", "812 345 678"],
  ["IE", "Ireland", "353", "85 012 3456"],
  ["IT", "Italy", "39", "312 345 6789"],
  ["JP", "Japan", "81", "90 1234 5678"],
  ["KZ", "Kazakhstan", "7", "771 000 9998"],
  ["KE", "Kenya", "254", "712 123456"],
  ["KR", "Korea, Republic of", "82", "10 2000 0000"],
  ["MO", "Macau", "853", "6612 3456"],
  ["MY", "Malaysia", "60", "12 345 6789"],
  ["MX", "Mexico", "52", "222 123 4567"],
  ["NL", "Netherlands", "31", "6 12345678"],
  ["NZ", "New Zealand", "64", "21 123 4567"],
  ["NG", "Nigeria", "234", "802 123 4567"],
  ["NO", "Norway", "47", "406 12 345"],
  ["PK", "Pakistan", "92", "301 2345678"],
  ["PH", "Philippines", "63", "905 123 4567"],
  ["PL", "Poland", "48", "512 345 678"],
  ["PT", "Portugal", "351", "912 345 678"],
  ["RU", "Russian Federation", "7", "912 345 67 89"],
  ["SA", "Saudi Arabia", "966", "51 234 5678"],
  ["SG", "Singapore", "65", "8123 4567"],
  ["ZA", "South Africa", "27", "71 123 4567"],
  ["ES", "Spain", "34", "612 34 56 78"],
  ["LK", "Sri Lanka", "94", "71 234 5678"],
  ["SE", "Sweden", "46", "70 123 45 67"],
  ["CH", "Switzerland", "41", "78 123 45 67"],
  ["TW", "Taiwan", "886", "912 345 678"],
  ["TH", "Thailand", "66", "81 234 5678"],
  ["TR", "Turkey", "90", "501 234 56 78"],
  ["AE", "United Arab Emirates", "971", "50 123 4567"],
  ["GB", "United Kingdom", "44", "7400 123456"],
  ["US", "United States", "1", "201 555 0123"],
  ["VN", "Vietnam", "84", "91 234 56 78"],
];

// Naming schemes for the politically loaded entries; real portals disagree with each other.
const COUNTRY_SCHEMES: Record<string, string>[] = [
  { CN: "China", TW: "Taiwan", HK: "Hong Kong", MO: "Macau" },
  { CN: "China (People's Republic of)", TW: "Taiwan, Province of China", HK: "Hong Kong SAR, China", MO: "Macao SAR, China" },
  { CN: "China, Mainland", TW: "Chinese Taipei", HK: "Hong Kong (SAR)", MO: "Macao (SAR)" },
  { CN: "People's Republic of China", TW: "Taiwan (Republic of China)", HK: "Hong Kong S.A.R.", MO: "Macau S.A.R." },
  { CN: "Mainland China", TW: "Taiwan Region", HK: "Hong Kong SAR", MO: "Macao SAR" },
];

export interface Country {
  code: string;
  name: string;
  dial: string;
  example: string;
}

export function countries(schemeIdx: number): Country[] {
  const sch = COUNTRY_SCHEMES[schemeIdx % COUNTRY_SCHEMES.length];
  const rows = COUNTRY_ROWS.map(([code, name, dial, example]) => ({ code, name: sch[code] ?? name, dial, example }));
  rows.sort((a, b) => a.name.localeCompare(b.name));
  return rows;
}
export const COUNTRY_SCHEME_COUNT = COUNTRY_SCHEMES.length;

// ---- plain option sets: each set has several label schemes ----
const SETS: Record<string, Opt[][]> = {
  title: [
    [o("Mr", "MR"), o("Mrs", "MRS"), o("Miss", "MISS"), o("Ms", "MS"), o("Mx", "MX"), o("Dr", "DR"), o("Prof", "PROF")],
    [o("Mr.", "MR"), o("Ms.", "MS", "MISS"), o("Mrs.", "MRS"), o("Dr.", "DR"), o("Prof.", "PROF"), o("Other", "MX")],
  ],
  gender: [
    [o("Male", "M"), o("Female", "F"), o("Other", "X"), o("Prefer not to say", "U")],
    [o("Female", "F"), o("Male", "M"), o("Non-binary", "X"), o("I do not wish to disclose", "U")],
    [o("Man", "M"), o("Woman", "F"), o("Another gender identity", "X"), o("Prefer not to answer", "U")],
  ],
  yesno: [[o("Yes", "Y"), o("No", "N")], [o("No", "N"), o("Yes", "Y")]],
  relation: [
    [o("Parent", "FATHER", "MOTHER"), o("Spouse / Partner", "SPOUSE"), o("Sibling", "SIBLING"), o("Other relative", "RELATIVE"), o("Friend", "FRIEND"), o("Other", "OTHER")],
    [o("Father", "FATHER"), o("Mother", "MOTHER"), o("Husband / Wife", "SPOUSE"), o("Brother / Sister", "SIBLING"), o("Guardian", "GUARDIAN"), o("Friend", "FRIEND"), o("Other", "OTHER", "RELATIVE")],
  ],
  level: [
    [o("Bachelor's degree", "BACHELOR"), o("Master's degree", "MASTER"), o("Doctoral degree", "PHD"), o("Associate degree / Diploma", "DIPLOMA"), o("Exchange / Non-degree study", "NON_DEGREE"), o("Secondary school", "SECONDARY")],
    [o("Undergraduate (Bachelor)", "BACHELOR"), o("Postgraduate taught (Master)", "MASTER"), o("Postgraduate research (PhD/MPhil)", "PHD"), o("Sub-degree (Diploma / Associate)", "DIPLOMA"), o("Non-award / Visiting / Exchange", "NON_DEGREE"), o("High school", "SECONDARY")],
    [o("Secondary", "SECONDARY"), o("Diploma", "DIPLOMA"), o("Bachelor", "BACHELOR"), o("Master", "MASTER"), o("Doctorate", "PHD"), o("Short course / Summer school / Exchange (no award)", "NON_DEGREE")],
  ],
  gpa_scale: [
    [o("4.0", "4.0"), o("4.3", "4.3"), o("4.5", "4.5"), o("5.0", "5.0"), o("10", "10"), o("100", "100"), o("Other", "OTHER")],
    [o("Out of 4.0", "4.0"), o("Out of 4.3", "4.3"), o("Out of 4.5", "4.5"), o("Out of 5", "5.0"), o("Out of 10", "10"), o("Percentage (out of 100)", "100"), o("Other scale", "OTHER")],
  ],
  instr_lang: [
    [o("English", "EN"), o("Chinese", "ZH"), o("French", "FR"), o("German", "DE"), o("Japanese", "JA"), o("Other", "OTHER")],
    [o("Chinese (Mandarin / Cantonese)", "ZH"), o("English", "EN"), o("Japanese", "JA"), o("Korean", "KO"), o("Other language", "OTHER", "FR", "DE")],
  ],
  eng_test: [
    [o("IELTS Academic", "IELTS"), o("TOEFL iBT", "TOEFL"), o("PTE Academic", "PTE"), o("Duolingo English Test", "DET"), o("I have not taken a test", "NONE")],
    [o("TOEFL (internet-based)", "TOEFL"), o("IELTS (Academic)", "IELTS"), o("Cambridge C1 Advanced / C2 Proficiency", "CAE"), o("PTE Academic", "PTE"), o("None / Not yet taken", "NONE")],
  ],
  test_kind: [
    [o("IELTS Academic", "IELTS"), o("TOEFL iBT", "TOEFL"), o("PTE Academic", "PTE"), o("GRE General Test", "GRE"), o("GMAT", "GMAT")],
    [o("GRE General", "GRE"), o("GMAT Focus / GMAT", "GMAT"), o("TOEFL iBT", "TOEFL"), o("IELTS (Academic)", "IELTS"), o("Duolingo English Test", "DET")],
  ],
  emp_type: [
    [o("Full-time", "FT"), o("Part-time", "PT"), o("Internship", "INTERN"), o("Voluntary / Unpaid", "VOL")],
    [o("Full time employment", "FT"), o("Part time employment", "PT"), o("Internship / Placement", "INTERN"), o("Volunteer work", "VOL"), o("Self-employed", "SELF")],
  ],
  ref_type: [
    [o("Academic", "ACADEMIC"), o("Professional / Employer", "EMPLOYER"), o("Other", "OTHER")],
    [o("Professional", "EMPLOYER"), o("Academic (teacher / supervisor)", "ACADEMIC"), o("Personal", "OTHER")],
  ],
  mode: [
    [o("Full-time", "FT"), o("Part-time", "PT")],
    [o("Full time", "FT"), o("Part time", "PT"), o("Distance learning", "DL")],
  ],
  intake: [
    [o("Spring 2027", "2027-01"), o("Fall 2027", "2027-09"), o("Spring 2028", "2028-01"), o("Fall 2028", "2028-09")],
    [o("January 2027", "2027-01"), o("September 2027", "2027-09"), o("January 2028", "2028-01"), o("September 2028", "2028-09")],
    [o("2026/27 Semester 2 (January 2027)", "2027-01"), o("2027/28 Semester 1 (September 2027)", "2027-09"), o("2027/28 Semester 2 (January 2028)", "2028-01"), o("2028/29 Semester 1 (September 2028)", "2028-09")],
  ],
  funding: [
    [o("Self-funded", "SELF"), o("Family support", "FAMILY"), o("Employer sponsorship", "EMPLOYER"), o("Government scholarship", "GOV"), o("University scholarship (applying)", "UNI"), o("Loan", "LOAN")],
    [o("Personal savings", "SELF"), o("Parents / Family", "FAMILY"), o("Company sponsored", "EMPLOYER"), o("Scholarship - government", "GOV"), o("Scholarship - university", "UNI"), o("Bank loan", "LOAN"), o("Other", "OTHER")],
  ],
  language: [
    [o("Arabic", "AR"), o("Cantonese", "YUE"), o("English", "EN"), o("French", "FR"), o("German", "DE"), o("Hindi", "HI"), o("Japanese", "JA"), o("Korean", "KO"), o("Malay", "MS"), o("Mandarin Chinese", "CMN"), o("Portuguese", "PT"), o("Russian", "RU"), o("Spanish", "ES"), o("Taiwanese Hokkien", "NAN"), o("Thai", "TH"), o("Vietnamese", "VI")],
    [o("Chinese - Cantonese", "YUE"), o("Chinese - Mandarin (Putonghua)", "CMN"), o("Chinese - Min Nan / Hokkien", "NAN"), o("English", "EN"), o("French", "FR"), o("German", "DE"), o("Italian", "IT"), o("Japanese", "JA"), o("Korean", "KO"), o("Russian", "RU"), o("Spanish", "ES"), o("Other", "AR", "HI", "MS", "PT", "TH", "VI")],
  ],
  hear: [
    [o("University website", "WEB"), o("Education agent", "AGENT"), o("Education fair", "FAIR"), o("Friend or family", "FRIEND"), o("Social media", "SOCIAL"), o("Rankings", "RANK"), o("Other", "OTHER")],
  ],
  doc_type: [
    [o("Academic transcript", "TRANSCRIPT"), o("Degree certificate", "DEGREE"), o("Passport / ID", "PASSPORT"), o("CV / Résumé", "CV"), o("English test report", "ENGLISH"), o("Other supporting document", "OTHER")],
    [o("Transcript of records", "TRANSCRIPT"), o("Certificate of graduation", "DEGREE"), o("Identity document", "PASSPORT"), o("Curriculum vitae", "CV"), o("Language test score report", "ENGLISH"), o("Miscellaneous", "OTHER")],
  ],
};

function o(l: string, ...c: string[]): Opt {
  return { l, c };
}

export function optionSet(name: string, rng: Rng, countryScheme: number): Opt[] {
  if (name === "country") return countries(countryScheme).map((c) => ({ l: c.name, c: [c.code] }));
  const schemes = SETS[name];
  if (!schemes) throw new Error(`unknown option set ${name}`);
  return rng.pick(schemes);
}

// ---- institutions for lookup widgets ----
export interface Inst {
  name: string;
  city: string;
  country: string; // code
  code: string; // fake lookup code
}
const INST_ROWS: [string, string, string][] = [
  ["National Taiwan University", "Taipei", "TW"],
  ["National Taiwan Normal University", "Taipei", "TW"],
  ["National Taiwan University of Science and Technology", "Taipei", "TW"],
  ["National Cheng Kung University", "Tainan", "TW"],
  ["National Chengchi University", "Taipei", "TW"],
  ["National Chung Cheng University", "Chiayi", "TW"],
  ["National Chung Hsing University", "Taichung", "TW"],
  ["National Tsing Hua University", "Hsinchu", "TW"],
  ["National Yang Ming Chiao Tung University", "Hsinchu", "TW"],
  ["National Central University", "Taoyuan", "TW"],
  ["National Sun Yat-sen University", "Kaohsiung", "TW"],
  ["Tsinghua University", "Beijing", "CN"],
  ["Peking University", "Beijing", "CN"],
  ["Zhejiang University", "Hangzhou", "CN"],
  ["Zhejiang University of Technology", "Hangzhou", "CN"],
  ["Zhejiang Gongshang University", "Hangzhou", "CN"],
  ["Zhejiang Sci-Tech University", "Hangzhou", "CN"],
  ["Hangzhou Normal University", "Hangzhou", "CN"],
  ["Fudan University", "Shanghai", "CN"],
  ["Shanghai Jiao Tong University", "Shanghai", "CN"],
  ["Nanjing University", "Nanjing", "CN"],
  ["Sun Yat-sen University", "Guangzhou", "CN"],
  ["Wuhan University", "Wuhan", "CN"],
  ["Xi'an Jiaotong University", "Xi'an", "CN"],
  ["University of Electronic Science and Technology of China", "Chengdu", "CN"],
  ["Xidian University", "Xi'an", "CN"],
  ["The University of Hong Kong", "Hong Kong", "HK"],
  ["The Chinese University of Hong Kong", "Hong Kong", "HK"],
  ["The Hong Kong University of Science and Technology", "Hong Kong", "HK"],
  ["The Hong Kong Polytechnic University", "Hong Kong", "HK"],
  ["City University of Hong Kong", "Hong Kong", "HK"],
  ["University of Macau", "Macau", "MO"],
  ["The University of Manchester", "Manchester", "GB"],
  ["Manchester Metropolitan University", "Manchester", "GB"],
  ["University of Salford", "Manchester", "GB"],
  ["University of Leeds", "Leeds", "GB"],
  ["University of Edinburgh", "Edinburgh", "GB"],
  ["University College London", "London", "GB"],
  ["Imperial College London", "London", "GB"],
  ["King's College London", "London", "GB"],
  ["London School of Economics and Political Science", "London", "GB"],
  ["London Business School", "London", "GB"],
  ["London South Bank University", "London", "GB"],
  ["University of Oxford", "Oxford", "GB"],
  ["University of Cambridge", "Cambridge", "GB"],
  ["University of Warwick", "Coventry", "GB"],
  ["Kyoto University", "Kyoto", "JP"],
  ["Kyoto Institute of Technology", "Kyoto", "JP"],
  ["Kyoto Sangyo University", "Kyoto", "JP"],
  ["The University of Tokyo", "Tokyo", "JP"],
  ["Osaka University", "Osaka", "JP"],
  ["Seoul National University", "Seoul", "KR"],
  ["National University of Singapore", "Singapore", "SG"],
  ["Nanyang Technological University", "Singapore", "SG"],
  ["University of Melbourne", "Melbourne", "AU"],
  ["University of Sydney", "Sydney", "AU"],
  ["University of Toronto", "Toronto", "CA"],
  ["University of British Columbia", "Vancouver", "CA"],
  ["Massachusetts Institute of Technology", "Cambridge", "US"],
  ["Stanford University", "Stanford", "US"],
  ["University of California, Berkeley", "Berkeley", "US"],
  ["University of California, Los Angeles", "Los Angeles", "US"],
  ["University of Michigan - Ann Arbor", "Ann Arbor", "US"],
  ["Carnegie Mellon University", "Pittsburgh", "US"],
  ["ETH Zurich", "Zurich", "CH"],
  ["Technical University of Munich", "Munich", "DE"],
  ["Delft University of Technology", "Delft", "NL"],
  ["KU Leuven", "Leuven", "BE"],
];
export const INSTITUTIONS: Inst[] = INST_ROWS.map(([name, city, country], i) => ({
  name,
  city,
  country,
  code: String(100000 + ((i * 7919) % 899999)).slice(0, 6),
}));

// ---- programmes ----
export interface Prog {
  code: string;
  name: string;
  faculty: string;
  dept: string;
}
export const PROGRAMMES: Prog[] = [
  p("MSC_CS", "MSc Computer Science", "Engineering and Computing", "Computer Science"),
  p("MSC_CS_CONV", "MSc Computing (Conversion)", "Engineering and Computing", "Computer Science"),
  p("MSC_AI", "MSc Artificial Intelligence", "Engineering and Computing", "Computer Science"),
  p("MSC_SE", "MSc Software Engineering", "Engineering and Computing", "Computer Science"),
  p("MSC_CYBER", "MSc Cyber Security", "Engineering and Computing", "Computer Science"),
  p("MSC_EE", "MSc Electrical and Electronic Engineering", "Engineering and Computing", "Electrical and Electronic Engineering"),
  p("MSC_CE", "MSc Computer Engineering", "Engineering and Computing", "Electrical and Electronic Engineering"),
  p("MSC_ROB", "MSc Robotics and Autonomous Systems", "Engineering and Computing", "Electrical and Electronic Engineering"),
  p("MSC_ME", "MSc Mechanical Engineering", "Engineering and Computing", "Mechanical Engineering"),
  p("MSC_STAT", "MSc Statistics", "Science", "Mathematics and Statistics"),
  p("MSC_DS", "MSc Data Science", "Science", "Mathematics and Statistics"),
  p("MSC_DSA", "MSc Data Science and Analytics", "Science", "Mathematics and Statistics"),
  p("MSC_AM", "MSc Applied Mathematics", "Science", "Mathematics and Statistics"),
  p("MSC_PHY", "MSc Physics", "Science", "Physics"),
  p("MSC_FIN", "MSc Finance", "Business School", "Finance"),
  p("MSC_FINTECH", "MSc Financial Technology", "Business School", "Finance"),
  p("MSC_BA", "MSc Business Analytics", "Business School", "Management"),
  p("MSC_MGT", "MSc Management", "Business School", "Management"),
  p("MA_EDU", "MA Education", "Arts and Social Sciences", "Education"),
  p("MA_TESOL", "MA TESOL", "Arts and Social Sciences", "Education"),
  p("MA_LING", "MA Applied Linguistics", "Arts and Social Sciences", "Linguistics"),
];
function p(code: string, name: string, faculty: string, dept: string): Prog {
  return { code, name, faculty, dept };
}

// Small address book behind the address-autocomplete widget. None of these is a student's exact address
// except where a student truth says so; suggestions near a student's street are deliberate distractors.
export const ADDRESS_BOOK: { line1: string; city: string; state: string; postal: string; country: string }[] = [
  { line1: "No. 27, Lane 124, Dongning Road", city: "Tainan City", state: "", postal: "701", country: "TW" },
  { line1: "No. 27, Lane 142, Dongning Road", city: "Tainan City", state: "", postal: "701", country: "TW" },
  { line1: "No. 72, Dongning Road", city: "Tainan City", state: "", postal: "701", country: "TW" },
  { line1: "8 Lung Poon Street, Diamond Hill", city: "Kowloon", state: "", postal: "", country: "HK" },
  { line1: "8 Lung Cheung Road, Wong Tai Sin", city: "Kowloon", state: "", postal: "", country: "HK" },
  { line1: "25 Sackville Street", city: "Manchester", state: "England", postal: "M1 3WE", country: "GB" },
  { line1: "25 Sackville Gardens", city: "Hove", state: "England", postal: "BN3 4GJ", country: "GB" },
  { line1: "218 Wensan Road, Xihu District", city: "Hangzhou", state: "Zhejiang", postal: "310012", country: "CN" },
  { line1: "218 Wenyi Road, Xihu District", city: "Hangzhou", state: "Zhejiang", postal: "310012", country: "CN" },
  { line1: "128 Wensan Road, Xihu District", city: "Hangzhou", state: "Zhejiang", postal: "310013", country: "CN" },
  { line1: "10 Downing Close", city: "Cambridge", state: "England", postal: "CB2 1DQ", country: "GB" },
  { line1: "1 Example Avenue", city: "Singapore", state: "", postal: "119077", country: "SG" },
];

// State / city cascades used by the cascading-select widget.
export const REGIONS: Record<string, Record<string, string[]>> = {
  CN: {
    Beijing: ["Beijing"],
    Shanghai: ["Shanghai"],
    Guangdong: ["Guangzhou", "Shenzhen", "Dongguan", "Foshan", "Zhuhai"],
    Zhejiang: ["Hangzhou", "Ningbo", "Wenzhou", "Shaoxing", "Jiaxing"],
    Jiangsu: ["Nanjing", "Suzhou", "Wuxi"],
    Sichuan: ["Chengdu", "Mianyang"],
    Hubei: ["Wuhan", "Yichang"],
    Shaanxi: ["Xi'an", "Xianyang"],
  },
  TW: {
    "Northern Taiwan": ["Taipei", "New Taipei", "Keelung", "Taoyuan", "Hsinchu"],
    "Central Taiwan": ["Taichung", "Miaoli", "Changhua", "Nantou"],
    "Southern Taiwan": ["Chiayi", "Tainan", "Kaohsiung", "Pingtung"],
    "Eastern Taiwan": ["Yilan", "Hualien", "Taitung"],
  },
  HK: {
    "Hong Kong Island": ["Central and Western", "Wan Chai", "Eastern", "Southern"],
    Kowloon: ["Kowloon City", "Kwun Tong", "Sham Shui Po", "Wong Tai Sin", "Yau Tsim Mong"],
    "New Territories": ["Sha Tin", "Tai Po", "Tsuen Wan", "Tuen Mun", "Yuen Long"],
  },
  GB: {
    England: ["London", "Manchester", "Birmingham", "Leeds", "Cambridge", "Oxford"],
    Scotland: ["Edinburgh", "Glasgow", "Aberdeen"],
    Wales: ["Cardiff", "Swansea"],
    "Northern Ireland": ["Belfast"],
  },
  US: {
    California: ["Los Angeles", "San Francisco", "San Diego", "Berkeley"],
    Massachusetts: ["Boston", "Cambridge"],
    "New York": ["New York", "Ithaca", "Buffalo"],
    Pennsylvania: ["Pittsburgh", "Philadelphia"],
  },
  JP: { Kyoto: ["Kyoto"], Tokyo: ["Tokyo"], Osaka: ["Osaka"] },
  SG: { Singapore: ["Singapore"] },
};
