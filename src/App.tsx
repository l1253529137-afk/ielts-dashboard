import {
  BarChart3,
  BookOpen,
  Brain,
  CalendarClock,
  Check,
  Clock3,
  Download,
  ExternalLink,
  Eye,
  EyeOff,
  FolderOpen,
  GraduationCap,
  Headphones,
  Layers,
  ListChecks,
  Mic,
  Pause,
  PenLine,
  Play,
  Plus,
  RefreshCcw,
  RotateCcw,
  Save,
  SpellCheck2,
  Target,
  Volume2,
} from "lucide-react";
import { FormEvent, useEffect, useMemo, useState } from "react";

type SkillKey = "reading" | "listening" | "writing" | "speaking" | "review";

type StudyTask = {
  id: SkillKey;
  label: string;
  minutes: number;
  done: boolean;
};

type StudySession = {
  id: string;
  date: string;
  tasks: StudyTask[];
  notes: string;
};

type ReadingPractice = {
  id: string;
  date: string;
  title: string;
  source: string;
  totalQuestions: number;
  correctAnswers: number;
  minutes: number;
  notes: string;
};

type Mistake = {
  id: string;
  practiceId: string;
  date: string;
  category: string;
  questionKeyword: string;
  originalText: string;
  reason: string;
  nextRule: string;
  reviewCount: number;
  nextReviewDate: string;
  mastered: boolean;
};

type VocabularyItem = {
  id: string;
  date: string;
  phrase: string;
  meaning: string;
  synonym: string;
  sourceSentence: string;
  type: "word" | "synonym" | "sentence";
  difficulty: number;
  reviewCount: number;
  nextReviewDate: string;
  mastered: boolean;
};

type MockTestResult = {
  id: string;
  date: string;
  reading: number;
  listening: number;
  writing: number;
  speaking: number;
  overall: number;
  notes: string;
};

type VocabProgress = {
  status: "new" | "learning" | "known";
  reviews: number;
  lastReviewed?: string;
  nextReviewDate?: string;
};

type WritingAttempt = {
  id: string;
  date: string;
  taskType: "Task 1" | "Task 2";
  prompt: string;
  essay: string;
  band: number;
  notes: string[];
};

type ListeningPractice = {
  id: string;
  date: string;
  title: string;
  source: string;
  section: string;
  correctAnswers: number;
  totalQuestions: number;
  notes: string;
};

type DashboardData = {
  sessions: StudySession[];
  readings: ReadingPractice[];
  mistakes: Mistake[];
  vocabulary: VocabularyItem[];
  mocks: MockTestResult[];
  vocabProgress: Record<string, VocabProgress>;
  writingAttempts: WritingAttempt[];
  listeningPractices: ListeningPractice[];
  courseCompletions: Record<string, boolean>;
  cambridgeProgress: Record<string, boolean>;
};

type TabKey = "dashboard" | "vocabulary" | "reading" | "writing" | "listening" | "review" | "plan" | "mocks";

const STORAGE_KEY = "ielts-6-dashboard-v1";
const START_DATE = "2026-07-08";
const MILESTONE_55_DATE = "2026-08-01";
const EXAM_DATE = "2026-09-01";
const DAILY_WORD_COUNT = 80;

const taskTemplate: StudyTask[] = [
  { id: "reading", label: "阅读精读/限时", minutes: 90, done: false },
  { id: "listening", label: "听力套题/精听", minutes: 60, done: false },
  { id: "writing", label: "写作 Task 1/2", minutes: 45, done: false },
  { id: "speaking", label: "口语录音复盘", minutes: 30, done: false },
  { id: "review", label: "错题词汇回收", minutes: 25, done: false },
];

const tabs: Array<{ id: TabKey; label: string; icon: typeof Target }> = [
  { id: "dashboard", label: "总览", icon: Target },
  { id: "vocabulary", label: "单词", icon: Brain },
  { id: "reading", label: "阅读", icon: BookOpen },
  { id: "writing", label: "写作", icon: SpellCheck2 },
  { id: "listening", label: "听力", icon: Volume2 },
  { id: "review", label: "复习", icon: RefreshCcw },
  { id: "plan", label: "计划", icon: GraduationCap },
  { id: "mocks", label: "模考", icon: BarChart3 },
];

const skillMeta: Record<SkillKey, { label: string; icon: typeof BookOpen; color: string }> = {
  reading: { label: "阅读", icon: BookOpen, color: "#2563eb" },
  listening: { label: "听力", icon: Headphones, color: "#0f766e" },
  writing: { label: "写作", icon: PenLine, color: "#b45309" },
  speaking: { label: "口语", icon: Mic, color: "#be123c" },
  review: { label: "复盘", icon: RefreshCcw, color: "#5b21b6" },
};

const mistakeCategories = ["同义替换", "定位失败", "长难句", "判断题", "细节题", "时间管理"];

const publicResources = [
  { label: "IELTS.org Academic sample questions", url: "https://ielts.org/take-a-test/preparation-resources/sample-test-questions/academic-test" },
  { label: "British Council practice tests", url: "https://takeielts.britishcouncil.org/take-ielts/prepare/free-ielts-english-practice-tests" },
  { label: "British Council Listening tests", url: "https://takeielts.britishcouncil.org/take-ielts/prepare/free-ielts-english-practice-tests/listening" },
  { label: "British Council Writing tests", url: "https://takeielts.britishcouncil.org/take-ielts/prepare/free-ielts-english-practice-tests/writing" },
  { label: "IELTS Liz Writing Task 2", url: "https://ieltsliz.com/ielts-writing-task-2/" },
  { label: "IELTS Liz Writing Task 1", url: "https://ieltsliz.com/ielts-writing-task-1-lessons-and-tips/" },
];

const coreVocab = [
  { id: "v001", word: "sustainable", meaning: "可持续的", synonym: "long-term / renewable", topic: "环境", example: "Sustainable transport can reduce urban pollution." },
  { id: "v002", word: "emission", meaning: "排放物；排放", synonym: "discharge / release", topic: "环境", example: "Vehicle emissions are a major source of air pollution." },
  { id: "v003", word: "conservation", meaning: "保护；保存", synonym: "protection / preservation", topic: "环境", example: "Wildlife conservation requires long-term funding." },
  { id: "v004", word: "habitat", meaning: "栖息地", synonym: "natural environment", topic: "环境", example: "Many species lose their habitat because of deforestation." },
  { id: "v005", word: "renewable", meaning: "可再生的", synonym: "replenishable", topic: "环境", example: "Renewable energy is becoming more affordable." },
  { id: "v006", word: "urbanisation", meaning: "城市化", synonym: "city growth", topic: "社会", example: "Rapid urbanisation places pressure on public services." },
  { id: "v007", word: "infrastructure", meaning: "基础设施", synonym: "public systems", topic: "社会", example: "Transport infrastructure affects economic growth." },
  { id: "v008", word: "inequality", meaning: "不平等", synonym: "disparity / gap", topic: "社会", example: "Education can reduce social inequality." },
  { id: "v009", word: "demographic", meaning: "人口统计的", synonym: "population-related", topic: "社会", example: "Demographic changes influence housing demand." },
  { id: "v010", word: "migration", meaning: "迁移；移民", synonym: "movement / relocation", topic: "社会", example: "Migration can bring both opportunities and challenges." },
  { id: "v011", word: "innovation", meaning: "创新", synonym: "new development", topic: "科技", example: "Technological innovation has transformed healthcare." },
  { id: "v012", word: "automation", meaning: "自动化", synonym: "machine operation", topic: "科技", example: "Automation may replace some repetitive jobs." },
  { id: "v013", word: "privacy", meaning: "隐私", synonym: "personal confidentiality", topic: "科技", example: "Online privacy is a growing concern." },
  { id: "v014", word: "device", meaning: "设备", synonym: "gadget / tool", topic: "科技", example: "Mobile devices are widely used for learning." },
  { id: "v015", word: "data", meaning: "数据", synonym: "information / figures", topic: "科技", example: "Reliable data is essential for research." },
  { id: "v016", word: "curriculum", meaning: "课程", synonym: "course content", topic: "教育", example: "The curriculum should include practical skills." },
  { id: "v017", word: "assessment", meaning: "评估", synonym: "evaluation", topic: "教育", example: "Continuous assessment can reduce exam pressure." },
  { id: "v018", word: "literacy", meaning: "读写能力；素养", synonym: "reading ability", topic: "教育", example: "Digital literacy is important in modern workplaces." },
  { id: "v019", word: "discipline", meaning: "学科；纪律", synonym: "subject / self-control", topic: "教育", example: "Science is a discipline that encourages critical thinking." },
  { id: "v020", word: "qualification", meaning: "资格；学历", synonym: "certificate / credential", topic: "教育", example: "Formal qualifications can improve employment prospects." },
  { id: "v021", word: "symptom", meaning: "症状", synonym: "sign / indication", topic: "健康", example: "Early symptoms should not be ignored." },
  { id: "v022", word: "prevention", meaning: "预防", synonym: "avoidance", topic: "健康", example: "Prevention is often cheaper than treatment." },
  { id: "v023", word: "nutrition", meaning: "营养", synonym: "dietary value", topic: "健康", example: "Good nutrition supports children's development." },
  { id: "v024", word: "obesity", meaning: "肥胖", synonym: "excessive weight", topic: "健康", example: "Obesity is linked to several chronic diseases." },
  { id: "v025", word: "therapy", meaning: "治疗", synonym: "treatment", topic: "健康", example: "Music therapy may help reduce stress." },
  { id: "v026", word: "manufacture", meaning: "制造", synonym: "produce", topic: "经济", example: "Some countries manufacture goods at lower cost." },
  { id: "v027", word: "consumption", meaning: "消费；消耗", synonym: "use / spending", topic: "经济", example: "Energy consumption rises during winter." },
  { id: "v028", word: "investment", meaning: "投资", synonym: "funding", topic: "经济", example: "Public investment can create jobs." },
  { id: "v029", word: "subsidy", meaning: "补贴", synonym: "financial support", topic: "经济", example: "Government subsidies can support clean energy." },
  { id: "v030", word: "revenue", meaning: "收入；税收", synonym: "income", topic: "经济", example: "Tourism revenue benefits local communities." },
  { id: "v031", word: "archaeology", meaning: "考古学", synonym: "study of ancient remains", topic: "历史文化", example: "Archaeology helps us understand ancient societies." },
  { id: "v032", word: "heritage", meaning: "遗产", synonym: "legacy", topic: "历史文化", example: "Cultural heritage should be protected." },
  { id: "v033", word: "artifact", meaning: "人工制品；文物", synonym: "object / relic", topic: "历史文化", example: "The museum displayed ancient artifacts." },
  { id: "v034", word: "ritual", meaning: "仪式", synonym: "ceremony", topic: "历史文化", example: "Rituals often reflect social values." },
  { id: "v035", word: "civilisation", meaning: "文明", synonym: "advanced society", topic: "历史文化", example: "The river supported an early civilisation." },
  { id: "v036", word: "species", meaning: "物种", synonym: "kind of organism", topic: "自然科学", example: "Some species adapt quickly to climate change." },
  { id: "v037", word: "evolution", meaning: "进化", synonym: "gradual development", topic: "自然科学", example: "Evolution explains how species change over time." },
  { id: "v038", word: "predator", meaning: "捕食者", synonym: "hunter", topic: "自然科学", example: "Predators help maintain ecological balance." },
  { id: "v039", word: "genetic", meaning: "基因的", synonym: "inherited", topic: "自然科学", example: "Genetic factors can influence health." },
  { id: "v040", word: "experiment", meaning: "实验", synonym: "test / trial", topic: "自然科学", example: "The experiment produced unexpected results." },
];

const ieltsWordBank = [
  { id: "dw001", word: "sustainable", ipaUk: "/səˈsteɪnəbl/", meaning: "可持续的", synonym: "long-term / renewable", topic: "环境", example: "Sustainable transport can reduce urban pollution." },
  { id: "dw002", word: "emission", ipaUk: "/ɪˈmɪʃn/", meaning: "排放物；排放", synonym: "release / discharge", topic: "环境", example: "Vehicle emissions are a major source of air pollution." },
  { id: "dw003", word: "conservation", ipaUk: "/ˌkɒnsəˈveɪʃn/", meaning: "保护；保存", synonym: "protection / preservation", topic: "环境", example: "Wildlife conservation requires long-term funding." },
  { id: "dw004", word: "habitat", ipaUk: "/ˈhæbɪtæt/", meaning: "栖息地", synonym: "natural environment", topic: "环境", example: "Many species lose their habitat because of deforestation." },
  { id: "dw005", word: "renewable", ipaUk: "/rɪˈnjuːəbl/", meaning: "可再生的", synonym: "replenishable", topic: "环境", example: "Renewable energy is becoming more affordable." },
  { id: "dw006", word: "urbanisation", ipaUk: "/ˌɜːbənaɪˈzeɪʃn/", meaning: "城市化", synonym: "city growth", topic: "社会", example: "Rapid urbanisation places pressure on public services." },
  { id: "dw007", word: "infrastructure", ipaUk: "/ˈɪnfrəstrʌktʃə/", meaning: "基础设施", synonym: "public systems", topic: "社会", example: "Transport infrastructure affects economic growth." },
  { id: "dw008", word: "inequality", ipaUk: "/ˌɪnɪˈkwɒləti/", meaning: "不平等", synonym: "disparity / gap", topic: "社会", example: "Education can reduce social inequality." },
  { id: "dw009", word: "demographic", ipaUk: "/ˌdeməˈɡræfɪk/", meaning: "人口统计的", synonym: "population-related", topic: "社会", example: "Demographic changes influence housing demand." },
  { id: "dw010", word: "migration", ipaUk: "/maɪˈɡreɪʃn/", meaning: "迁移；移民", synonym: "movement / relocation", topic: "社会", example: "Migration can bring both opportunities and challenges." },
  { id: "dw011", word: "innovation", ipaUk: "/ˌɪnəˈveɪʃn/", meaning: "创新", synonym: "new development", topic: "科技", example: "Technological innovation has transformed healthcare." },
  { id: "dw012", word: "automation", ipaUk: "/ˌɔːtəˈmeɪʃn/", meaning: "自动化", synonym: "machine operation", topic: "科技", example: "Automation may replace some repetitive jobs." },
  { id: "dw013", word: "privacy", ipaUk: "/ˈprɪvəsi/", meaning: "隐私", synonym: "personal confidentiality", topic: "科技", example: "Online privacy is a growing concern." },
  { id: "dw014", word: "device", ipaUk: "/dɪˈvaɪs/", meaning: "设备", synonym: "gadget / tool", topic: "科技", example: "Mobile devices are widely used for learning." },
  { id: "dw015", word: "data", ipaUk: "/ˈdeɪtə/", meaning: "数据", synonym: "information / figures", topic: "科技", example: "Reliable data is essential for research." },
  { id: "dw016", word: "curriculum", ipaUk: "/kəˈrɪkjələm/", meaning: "课程", synonym: "course content", topic: "教育", example: "The curriculum should include practical skills." },
  { id: "dw017", word: "assessment", ipaUk: "/əˈsesmənt/", meaning: "评估", synonym: "evaluation", topic: "教育", example: "Continuous assessment can reduce exam pressure." },
  { id: "dw018", word: "literacy", ipaUk: "/ˈlɪtərəsi/", meaning: "读写能力；素养", synonym: "reading ability", topic: "教育", example: "Digital literacy is important in modern workplaces." },
  { id: "dw019", word: "discipline", ipaUk: "/ˈdɪsəplɪn/", meaning: "学科；纪律", synonym: "subject / self-control", topic: "教育", example: "Science is a discipline that encourages critical thinking." },
  { id: "dw020", word: "qualification", ipaUk: "/ˌkwɒlɪfɪˈkeɪʃn/", meaning: "资格；学历", synonym: "certificate / credential", topic: "教育", example: "Formal qualifications can improve employment prospects." },
  { id: "dw021", word: "symptom", ipaUk: "/ˈsɪmptəm/", meaning: "症状", synonym: "sign / indication", topic: "健康", example: "Early symptoms should not be ignored." },
  { id: "dw022", word: "prevention", ipaUk: "/prɪˈvenʃn/", meaning: "预防", synonym: "avoidance", topic: "健康", example: "Prevention is often cheaper than treatment." },
  { id: "dw023", word: "nutrition", ipaUk: "/njuˈtrɪʃn/", meaning: "营养", synonym: "dietary value", topic: "健康", example: "Good nutrition supports children's development." },
  { id: "dw024", word: "obesity", ipaUk: "/əʊˈbiːsəti/", meaning: "肥胖", synonym: "excessive weight", topic: "健康", example: "Obesity is linked to several chronic diseases." },
  { id: "dw025", word: "therapy", ipaUk: "/ˈθerəpi/", meaning: "治疗", synonym: "treatment", topic: "健康", example: "Music therapy may help reduce stress." },
  { id: "dw026", word: "manufacture", ipaUk: "/ˌmænjʊˈfæktʃə/", meaning: "制造", synonym: "produce", topic: "经济", example: "Some countries manufacture goods at lower cost." },
  { id: "dw027", word: "consumption", ipaUk: "/kənˈsʌmpʃn/", meaning: "消费；消耗", synonym: "use / spending", topic: "经济", example: "Energy consumption rises during winter." },
  { id: "dw028", word: "investment", ipaUk: "/ɪnˈvestmənt/", meaning: "投资", synonym: "funding", topic: "经济", example: "Public investment can create jobs." },
  { id: "dw029", word: "subsidy", ipaUk: "/ˈsʌbsədi/", meaning: "补贴", synonym: "financial support", topic: "经济", example: "Government subsidies can support clean energy." },
  { id: "dw030", word: "revenue", ipaUk: "/ˈrevənjuː/", meaning: "收入；税收", synonym: "income", topic: "经济", example: "Tourism revenue benefits local communities." },
  { id: "dw031", word: "archaeology", ipaUk: "/ˌɑːkiˈɒlədʒi/", meaning: "考古学", synonym: "study of ancient remains", topic: "历史文化", example: "Archaeology helps us understand ancient societies." },
  { id: "dw032", word: "heritage", ipaUk: "/ˈherɪtɪdʒ/", meaning: "遗产", synonym: "legacy", topic: "历史文化", example: "Cultural heritage should be protected." },
  { id: "dw033", word: "artifact", ipaUk: "/ˈɑːtɪfækt/", meaning: "人工制品；文物", synonym: "object / relic", topic: "历史文化", example: "The museum displayed ancient artifacts." },
  { id: "dw034", word: "ritual", ipaUk: "/ˈrɪtʃuəl/", meaning: "仪式", synonym: "ceremony", topic: "历史文化", example: "Rituals often reflect social values." },
  { id: "dw035", word: "civilisation", ipaUk: "/ˌsɪvəlaɪˈzeɪʃn/", meaning: "文明", synonym: "advanced society", topic: "历史文化", example: "The river supported an early civilisation." },
  { id: "dw036", word: "species", ipaUk: "/ˈspiːʃiːz/", meaning: "物种", synonym: "kind of organism", topic: "自然科学", example: "Some species adapt quickly to climate change." },
  { id: "dw037", word: "evolution", ipaUk: "/ˌiːvəˈluːʃn/", meaning: "进化", synonym: "gradual development", topic: "自然科学", example: "Evolution explains how species change over time." },
  { id: "dw038", word: "predator", ipaUk: "/ˈpredətə/", meaning: "捕食者", synonym: "hunter", topic: "自然科学", example: "Predators help maintain ecological balance." },
  { id: "dw039", word: "genetic", ipaUk: "/dʒəˈnetɪk/", meaning: "基因的", synonym: "inherited", topic: "自然科学", example: "Genetic factors can influence health." },
  { id: "dw040", word: "experiment", ipaUk: "/ɪkˈsperɪmənt/", meaning: "实验", synonym: "test / trial", topic: "自然科学", example: "The experiment produced unexpected results." },
  { id: "dw041", word: "evaluate", ipaUk: "/ɪˈvæljueɪt/", meaning: "评估", synonym: "assess / judge", topic: "学术", example: "Researchers evaluate the impact of the policy." },
  { id: "dw042", word: "significant", ipaUk: "/sɪɡˈnɪfɪkənt/", meaning: "重要的；显著的", synonym: "important / notable", topic: "学术", example: "The study found a significant difference." },
  { id: "dw043", word: "approximately", ipaUk: "/əˈprɒksɪmətli/", meaning: "大约", synonym: "roughly / about", topic: "学术", example: "Approximately half of the participants agreed." },
  { id: "dw044", word: "fluctuate", ipaUk: "/ˈflʌktʃueɪt/", meaning: "波动", synonym: "vary / change", topic: "写作", example: "The figure fluctuated throughout the period." },
  { id: "dw045", word: "proportion", ipaUk: "/prəˈpɔːʃn/", meaning: "比例", synonym: "percentage / share", topic: "写作", example: "The proportion of older people increased." },
  { id: "dw046", word: "whereas", ipaUk: "/ˌweərˈæz/", meaning: "然而；鉴于", synonym: "while / in contrast", topic: "写作", example: "Cars became more popular, whereas bicycles declined." },
  { id: "dw047", word: "consequence", ipaUk: "/ˈkɒnsɪkwəns/", meaning: "后果", synonym: "result / outcome", topic: "写作", example: "One consequence is a rise in living costs." },
  { id: "dw048", word: "allocate", ipaUk: "/ˈæləkeɪt/", meaning: "分配", synonym: "distribute / assign", topic: "写作", example: "Governments should allocate more money to education." },
  { id: "dw049", word: "alternative", ipaUk: "/ɔːlˈtɜːnətɪv/", meaning: "替代方案；可替代的", synonym: "option / substitute", topic: "写作", example: "Public transport is an alternative to private cars." },
  { id: "dw050", word: "maintain", ipaUk: "/meɪnˈteɪn/", meaning: "维持；维护", synonym: "keep / preserve", topic: "写作", example: "People should maintain a healthy lifestyle." },
  { id: "dw051", word: "accurate", ipaUk: "/ˈækjərət/", meaning: "准确的", synonym: "correct / precise", topic: "听力", example: "Accurate spelling is essential in IELTS Listening." },
  { id: "dw052", word: "accommodation", ipaUk: "/əˌkɒməˈdeɪʃn/", meaning: "住宿", synonym: "housing / lodging", topic: "听力", example: "The accommodation fee includes breakfast." },
  { id: "dw053", word: "reservation", ipaUk: "/ˌrezəˈveɪʃn/", meaning: "预订", synonym: "booking", topic: "听力", example: "The reservation was made under her name." },
  { id: "dw054", word: "destination", ipaUk: "/ˌdestɪˈneɪʃn/", meaning: "目的地", synonym: "place to go", topic: "听力", example: "The final destination is the city centre." },
  { id: "dw055", word: "available", ipaUk: "/əˈveɪləbl/", meaning: "可获得的；有空的", synonym: "accessible / free", topic: "听力", example: "Tickets are available at the front desk." },
  { id: "dw056", word: "evidence", ipaUk: "/ˈevɪdəns/", meaning: "证据", synonym: "proof / support", topic: "阅读", example: "The article provides evidence for the theory." },
  { id: "dw057", word: "indicate", ipaUk: "/ˈɪndɪkeɪt/", meaning: "表明；指出", synonym: "show / suggest", topic: "阅读", example: "The results indicate a clear trend." },
  { id: "dw058", word: "assumption", ipaUk: "/əˈsʌmpʃn/", meaning: "假设", synonym: "belief / supposition", topic: "阅读", example: "This assumption is not supported by evidence." },
  { id: "dw059", word: "interpret", ipaUk: "/ɪnˈtɜːprət/", meaning: "解释；理解", synonym: "explain / understand", topic: "阅读", example: "It is difficult to interpret the data." },
  { id: "dw060", word: "contrast", ipaUk: "/ˈkɒntrɑːst/", meaning: "对比", synonym: "difference / comparison", topic: "阅读", example: "The passage contrasts two different approaches." },
  { id: "dw061", word: "analyse", ipaUk: "/ˈænəlaɪz/", meaning: "分析", synonym: "examine / study", topic: "学术", example: "Students need to analyse the causes of the problem." },
  { id: "dw062", word: "approach", ipaUk: "/əˈprəʊtʃ/", meaning: "方法；接近", synonym: "method / strategy", topic: "学术", example: "This approach can improve learning efficiency." },
  { id: "dw063", word: "factor", ipaUk: "/ˈfæktə/", meaning: "因素", synonym: "element / cause", topic: "学术", example: "Cost is an important factor in transport choices." },
  { id: "dw064", word: "impact", ipaUk: "/ˈɪmpækt/", meaning: "影响", synonym: "effect / influence", topic: "学术", example: "Technology has a major impact on communication." },
  { id: "dw065", word: "benefit", ipaUk: "/ˈbenɪfɪt/", meaning: "好处；受益", synonym: "advantage / gain", topic: "写作", example: "One benefit of public transport is lower pollution." },
  { id: "dw066", word: "drawback", ipaUk: "/ˈdrɔːbæk/", meaning: "缺点", synonym: "disadvantage / downside", topic: "写作", example: "A major drawback is the high initial cost." },
  { id: "dw067", word: "measure", ipaUk: "/ˈmeʒə/", meaning: "措施；衡量", synonym: "action / step", topic: "写作", example: "Governments should take measures to reduce waste." },
  { id: "dw068", word: "priority", ipaUk: "/praɪˈɒrəti/", meaning: "优先事项", synonym: "main concern", topic: "写作", example: "Education should be a national priority." },
  { id: "dw069", word: "considerable", ipaUk: "/kənˈsɪdərəbl/", meaning: "相当大的", synonym: "substantial / significant", topic: "写作", example: "The project requires considerable investment." },
  { id: "dw070", word: "decline", ipaUk: "/dɪˈklaɪn/", meaning: "下降；衰退", synonym: "decrease / fall", topic: "写作", example: "The number of visitors declined after 2019." },
  { id: "dw071", word: "increase", ipaUk: "/ɪnˈkriːs/", meaning: "增加", synonym: "rise / grow", topic: "写作", example: "The proportion increased steadily over the period." },
  { id: "dw072", word: "stable", ipaUk: "/ˈsteɪbl/", meaning: "稳定的", synonym: "steady / unchanged", topic: "写作", example: "The figure remained stable for three years." },
  { id: "dw073", word: "lecture", ipaUk: "/ˈlektʃə/", meaning: "讲座", synonym: "talk / presentation", topic: "听力", example: "The lecture will focus on marine biology." },
  { id: "dw074", word: "assignment", ipaUk: "/əˈsaɪnmənt/", meaning: "作业；任务", synonym: "task / project", topic: "听力", example: "The assignment is due on Friday." },
  { id: "dw075", word: "deadline", ipaUk: "/ˈdedlaɪn/", meaning: "截止日期", synonym: "time limit", topic: "听力", example: "Students must meet the application deadline." },
  { id: "dw076", word: "registration", ipaUk: "/ˌredʒɪˈstreɪʃn/", meaning: "注册；登记", synonym: "enrolment / sign-up", topic: "听力", example: "Registration starts at nine o'clock." },
  { id: "dw077", word: "deposit", ipaUk: "/dɪˈpɒzɪt/", meaning: "押金；存款", synonym: "advance payment", topic: "听力", example: "A deposit is required to reserve the room." },
  { id: "dw078", word: "receipt", ipaUk: "/rɪˈsiːt/", meaning: "收据", synonym: "proof of payment", topic: "听力", example: "Please keep your receipt for future reference." },
  { id: "dw079", word: "facilities", ipaUk: "/fəˈsɪlətiz/", meaning: "设施", synonym: "equipment / services", topic: "听力", example: "The sports centre has excellent facilities." },
  { id: "dw080", word: "schedule", ipaUk: "/ˈʃedjuːl/", meaning: "日程；时间表", synonym: "timetable / plan", topic: "听力", example: "The schedule may change during the holiday." },
  { id: "dw081", word: "paragraph", ipaUk: "/ˈpærəɡrɑːf/", meaning: "段落", synonym: "section", topic: "阅读", example: "The answer is found in the final paragraph." },
  { id: "dw082", word: "statement", ipaUk: "/ˈsteɪtmənt/", meaning: "陈述；声明", synonym: "claim / sentence", topic: "阅读", example: "The statement is not supported by the passage." },
  { id: "dw083", word: "infer", ipaUk: "/ɪnˈfɜː/", meaning: "推断", synonym: "deduce / conclude", topic: "阅读", example: "Readers can infer the writer's attitude from the examples." },
  { id: "dw084", word: "refer", ipaUk: "/rɪˈfɜː/", meaning: "指代；提到", synonym: "mention / point to", topic: "阅读", example: "The word refers to the previous experiment." },
  { id: "dw085", word: "sequence", ipaUk: "/ˈsiːkwəns/", meaning: "顺序；序列", synonym: "order / series", topic: "阅读", example: "The questions follow the sequence of the passage." },
  { id: "dw086", word: "feature", ipaUk: "/ˈfiːtʃə/", meaning: "特征；特点", synonym: "characteristic / aspect", topic: "阅读", example: "The main feature of the system is flexibility." },
  { id: "dw087", word: "function", ipaUk: "/ˈfʌŋkʃn/", meaning: "功能；作用", synonym: "purpose / role", topic: "阅读", example: "The function of the device is to measure temperature." },
  { id: "dw088", word: "identify", ipaUk: "/aɪˈdentɪfaɪ/", meaning: "识别；确认", synonym: "recognise / find", topic: "阅读", example: "Candidates must identify the correct heading." },
  { id: "dw089", word: "community", ipaUk: "/kəˈmjuːnəti/", meaning: "社区；群体", synonym: "local group / society", topic: "社会", example: "Community projects can reduce social isolation." },
  { id: "dw090", word: "resident", ipaUk: "/ˈrezɪdənt/", meaning: "居民", synonym: "inhabitant / local", topic: "社会", example: "Residents complained about the noise." },
  { id: "dw091", word: "employment", ipaUk: "/ɪmˈplɔɪmənt/", meaning: "就业", synonym: "work / jobs", topic: "社会", example: "Employment opportunities attract young people to cities." },
  { id: "dw092", word: "poverty", ipaUk: "/ˈpɒvəti/", meaning: "贫困", synonym: "deprivation", topic: "社会", example: "Poverty can limit access to education." },
  { id: "dw093", word: "policy", ipaUk: "/ˈpɒləsi/", meaning: "政策", synonym: "government plan", topic: "社会", example: "The policy aims to improve public health." },
  { id: "dw094", word: "welfare", ipaUk: "/ˈwelfeə/", meaning: "福利；幸福", synonym: "well-being / support", topic: "社会", example: "Child welfare should be protected." },
  { id: "dw095", word: "biodiversity", ipaUk: "/ˌbaɪəʊdaɪˈvɜːsəti/", meaning: "生物多样性", synonym: "variety of life", topic: "环境", example: "Biodiversity is threatened by habitat loss." },
  { id: "dw096", word: "deforestation", ipaUk: "/diːˌfɒrɪˈsteɪʃn/", meaning: "森林砍伐", synonym: "forest clearance", topic: "环境", example: "Deforestation contributes to climate change." },
  { id: "dw097", word: "contamination", ipaUk: "/kənˌtæmɪˈneɪʃn/", meaning: "污染；污染物混入", synonym: "pollution", topic: "环境", example: "Water contamination can affect human health." },
  { id: "dw098", word: "scarce", ipaUk: "/skeəs/", meaning: "稀缺的", synonym: "limited / insufficient", topic: "环境", example: "Clean water is scarce in some regions." },
  { id: "dw099", word: "efficient", ipaUk: "/ɪˈfɪʃnt/", meaning: "高效的", synonym: "effective / productive", topic: "科技", example: "Efficient systems save both time and energy." },
  { id: "dw100", word: "virtual", ipaUk: "/ˈvɜːtʃuəl/", meaning: "虚拟的", synonym: "digital / online", topic: "科技", example: "Virtual classrooms became common during the pandemic." },
];

const listeningMaterials = [
  { title: "British Council Listening Test 1", source: "British Council", section: "Part 1-4", url: "https://takeielts.britishcouncil.org/take-ielts/prepare/free-ielts-english-practice-tests/listening", focus: "完整听力套题；适合每周2次计时训练。" },
  { title: "IELTS.org Listening sample tasks", source: "IELTS.org", section: "Question types", url: "https://ielts.org/take-a-test/preparation-resources/sample-test-questions/academic-test", focus: "熟悉题型：选择、地图、表格、摘要填空。" },
  { title: "IDP free Listening practice questions", source: "IDP IELTS", section: "Skill drills", url: "https://ielts.idp.com/prepare/article-free-listening-practice-questions", focus: "做题后记录拼写、数字、单复数和定位失败。" },
  { title: "British Council IELTS videos", source: "British Council", section: "Strategy", url: "https://takeielts.britishcouncil.org/take-ielts/prepare/videos", focus: "网课型技巧课：听前预测、关键词、答案转写。" },
];

const coursePlan = [
  { id: "course-1", day: "周一", title: "写作 Task 2 基础结构", source: "IELTS Liz", minutes: 35, url: "https://ieltsliz.com/ielts-writing-task-2/" },
  { id: "course-2", day: "周二", title: "阅读题型与定位", source: "IELTS.org / British Council", minutes: 35, url: "https://takeielts.britishcouncil.org/take-ielts/prepare/free-ielts-english-practice-tests/reading" },
  { id: "course-3", day: "周三", title: "听力 Part 1-2 拼写与数字", source: "British Council", minutes: 40, url: "https://takeielts.britishcouncil.org/take-ielts/prepare/free-ielts-english-practice-tests/listening" },
  { id: "course-4", day: "周四", title: "写作 Task 1 图表描述", source: "IELTS Liz", minutes: 35, url: "https://ieltsliz.com/ielts-writing-task-1-lessons-and-tips/" },
  { id: "course-5", day: "周五", title: "听力 Part 3-4 学术场景", source: "IDP IELTS", minutes: 40, url: "https://ielts.idp.com/prepare/all-test-types/listening" },
  { id: "course-6", day: "周六", title: "整套模考与复盘", source: "IELTS.org sample tests", minutes: 120, url: "https://ielts.org/take-a-test/preparation-resources/sample-test-questions/academic-test" },
  { id: "course-7", day: "周日", title: "错题、词汇、口语录音回收", source: "本地复习", minutes: 60, url: "" },
];

const writingPrompts = [
  "Some people think that children should start school at a very early age. Others believe they should begin later. Discuss both views and give your opinion.",
  "In many cities, traffic congestion is becoming a serious problem. What are the causes, and what solutions can be suggested?",
  "The chart/table/graph shows changes in a topic over time. Summarise the main features and make comparisons where relevant.",
];

const PAN_SHARE_URL = "https://pan.baidu.com/s/1YhS8IePg2I6NwQ6GvoD5fA";
const PAN_CODE = "nbxa";
const PAN_ROOT = "/sharelink2953814183-874881636249993/雅思全套资料";

const panResources = [
  {
    category: "入门和规划",
    priority: "第1-3天先看",
    items: [
      { label: "01.小白指南", path: `${PAN_ROOT}/01.小白指南`, note: "了解考试、答题卡、四科学习指导。" },
      { label: "02.计划+学习方法", path: `${PAN_ROOT}/02.计划+学习方法`, note: "100天/30天/2个月计划，挑一个做主线。" },
      { label: "08.总结", path: `${PAN_ROOT}/08.总结`, note: "同义替换、题型技巧、听力场景词汇，作为复盘库。" },
    ],
  },
  {
    category: "基础预备",
    priority: "第1-2周主攻",
    items: [
      { label: "雅思语法", path: `${PAN_ROOT}/03.雅思基础预备课程/01.雅思语法（推荐）`, note: "简单句、并列句、复合句、长难句。" },
      { label: "雅思词汇", path: `${PAN_ROOT}/03.雅思基础预备课程/02.雅思词汇`, note: "单词、拼写、阅读/写作/口语词汇考核。" },
      { label: "100个句子记完7000词", path: `${PAN_ROOT}/03.雅思基础预备课程/03.【新东方视频版】《100个句子记完7000个单词》（推荐）`, note: "每天5句，配合单词页背诵。" },
      { label: "王陆语料库", path: `${PAN_ROOT}/03.雅思基础预备课程/05.王陆语料库pdf＋自动改错excel`, note: "听力拼写和场景词训练。" },
    ],
  },
  {
    category: "四科网课",
    priority: "每天40-60分钟",
    items: [
      { label: "阅读网课", path: `${PAN_ROOT}/04.雅思网课/01.雅思阅读网课`, note: "优先看阅读题型、定位、同义替换。" },
      { label: "听力网课", path: `${PAN_ROOT}/04.雅思网课/02.雅思听力网课`, note: "优先王陆语料库和Part 1-4技巧。" },
      { label: "写作网课", path: `${PAN_ROOT}/04.雅思网课/03.雅思写作网课`, note: "Task 2结构、Task 1概览和数据表达。" },
      { label: "口语网课", path: `${PAN_ROOT}/04.雅思网课/04.雅思口语网课`, note: "Part 1/2/3素材和录音复盘。" },
    ],
  },
  {
    category: "真题和音频",
    priority: "第3周开始主攻",
    items: [
      { label: "剑桥雅思真题A类", path: `${PAN_ROOT}/05.剑雅真题（含视频讲解）/01.【真题】剑桥雅思真题A类`, note: "已看到剑雅10-18 PDF和听力音频目录。" },
      { label: "剑雅听力音频", path: `${PAN_ROOT}/05.剑雅真题（含视频讲解）/01.【真题】剑桥雅思真题A类/【听力音频】剑桥雅思听力音频`, note: "剑10-18听力音频。" },
      { label: "剑19真题A+G", path: `${PAN_ROOT}/05.剑雅真题（含视频讲解）/00.《剑19》真题A+G类`, note: "冲刺阶段模考。" },
      { label: "剑20抢先版", path: `${PAN_ROOT}/05.剑雅真题（含视频讲解）/剑桥20真题（抢先版）`, note: "冲刺阶段模考，含Test 1-4和听力音频。" },
      { label: "真题精讲解析", path: `${PAN_ROOT}/05.剑雅真题（含视频讲解）/02.【精讲解析】剑桥雅思真题精讲pdf`, note: "做完题后只看错题解析。" },
    ],
  },
  {
    category: "口语和词书",
    priority: "每天20-30分钟",
    items: [
      { label: "2025口语题库", path: `${PAN_ROOT}/06.2025年口语题库`, note: "按Part 1/2/3录音复盘。" },
      { label: "精选单词书", path: `${PAN_ROOT}/07.书籍+资料/2.精选单词书`, note: "含雅思词汇真经等词书，建议只做查漏。" },
      { label: "书籍+资料", path: `${PAN_ROOT}/07.书籍+资料`, note: "真经、Collins、Simon、顾家北、听说读写备考资料。" },
      { label: "2026最新资料", path: `${PAN_ROOT}/09.2026年最新资料（持续更新中）`, note: "口语题库和语法击破，考前更新检查。" },
    ],
  },
];

const orderedStudyTracks = [
  {
    skill: "单词",
    accent: "#5b21b6",
    steps: [
      { title: "1. 今日核心词", requirement: "先背网页推送的80个词，只听英音，完成后点已背进入遗忘曲线。", path: `${PAN_ROOT}/03.雅思基础预备课程/02.雅思词汇` },
      { title: "2. 句子记词", requirement: "每天5句，重点抄搭配和可用于写作的句型。", path: `${PAN_ROOT}/03.雅思基础预备课程/03.【新东方视频版】《100个句子记完7000个单词》（推荐）` },
      { title: "3. 词书查漏", requirement: "雅思词汇真经等词书只用来补不会的主题词，不整本硬啃。", path: `${PAN_ROOT}/07.书籍+资料/2.精选单词书` },
      { title: "4. 场景回收", requirement: "把阅读同义替换、听力拼写词、写作表达放回复习队列。", path: `${PAN_ROOT}/08.总结` },
    ],
  },
  {
    skill: "阅读",
    accent: "#2563eb",
    steps: [
      { title: "1. 先看方法课", requirement: "只看题型、定位、同义替换；每天最多1节，立刻做题验证。", path: `${PAN_ROOT}/04.雅思网课/01.雅思阅读网课` },
      { title: "2. 做剑雅A类真题", requirement: "按剑10开始，每天1篇Passage，20分钟限时。", path: `${PAN_ROOT}/05.剑雅真题（含视频讲解）/01.【真题】剑桥雅思真题A类` },
      { title: "3. 查精讲和答案", requirement: "只查错题，不整本看解析；把错因写到阅读页。", path: `${PAN_ROOT}/05.剑雅真题（含视频讲解）/02.【精讲解析】剑桥雅思真题精讲pdf` },
      { title: "4. 背同义替换", requirement: "当天错题里的同义替换至少整理5组。", path: `${PAN_ROOT}/08.总结` },
      { title: "5. 看视频讲解", requirement: "错题超过4题时，再看对应剑雅视频解析。", path: `${PAN_ROOT}/05.剑雅真题（含视频讲解）/03.新东方真题4-18视频解析（精品）` },
    ],
  },
  {
    skill: "听力",
    accent: "#0f766e",
    steps: [
      { title: "1. 先补场景词", requirement: "王陆语料库/听力词汇每天20分钟，先拼写后听音。", path: `${PAN_ROOT}/03.雅思基础预备课程/05.王陆语料库pdf＋自动改错excel` },
      { title: "2. 看听力技巧课", requirement: "只看关键词预测、地图题、填空题、Part 3干扰项。", path: `${PAN_ROOT}/04.雅思网课/02.雅思听力网课` },
      { title: "3. 做剑雅音频", requirement: "每天1个Section，不暂停；错题按拼写/单复数/定位/干扰分类。", path: `${PAN_ROOT}/05.剑雅真题（含视频讲解）/01.【真题】剑桥雅思真题A类/【听力音频】剑桥雅思听力音频` },
      { title: "4. 查答案解析", requirement: "对答案后精听错题前后30秒，第二天重听。", path: `${PAN_ROOT}/05.剑雅真题（含视频讲解）/02.【精讲解析】剑桥雅思真题精讲pdf` },
      { title: "5. 回收场景词", requirement: "把错过的数字、地址、名词复数加入复习页。", path: `${PAN_ROOT}/08.总结` },
    ],
  },
  {
    skill: "写作",
    accent: "#b45309",
    steps: [
      { title: "1. 先看结构课", requirement: "Task 2先学观点句、主体段、例证；Task 1先学概览。", path: `${PAN_ROOT}/04.雅思网课/03.雅思写作网课` },
      { title: "2. 读高分素材", requirement: "每天只积累1个话题的观点、原因、例子，不背整篇。", path: `${PAN_ROOT}/07.书籍+资料/Simon 写作视频+资料` },
      { title: "3. 写一段或一篇", requirement: "周一三五写Task 2主体段，周二四写Task 1概览+主体段。", path: `${PAN_ROOT}/05.剑雅真题（含视频讲解）/01.【真题】剑桥雅思真题A类` },
      { title: "4. 用网页打分纠错", requirement: "粘贴到写作页，看结构/词汇/语法反馈，再改第二版。", path: `${PAN_ROOT}/04.雅思网课/03.雅思写作网课` },
      { title: "5. 对照范文总结", requirement: "只总结3个可复用表达和1个论证方式。", path: `${PAN_ROOT}/08.总结` },
    ],
  },
];

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function daysBetween(from: string, to: string) {
  const start = new Date(`${from}T00:00:00`).getTime();
  const end = new Date(`${to}T00:00:00`).getTime();
  return Math.ceil((end - start) / 86400000);
}

function dayIndexFromStart() {
  return Math.max(0, daysBetween(START_DATE, todayISO()));
}

function getDailyWords(count: number) {
  const start = (dayIndexFromStart() * count) % ieltsWordBank.length;
  return Array.from({ length: count }, (_, offset) => ieltsWordBank[(start + offset) % ieltsWordBank.length]);
}

function getDueReviewWords(progress: Record<string, VocabProgress>, date = todayISO()) {
  return ieltsWordBank.filter((word) => {
    const item = progress[word.id];
    if (!item || item.reviews <= 0) return false;
    return (item.nextReviewDate ?? date) <= date && item.lastReviewed !== date;
  });
}

function getReviewedTodayCount(words: Array<{ id: string }>, progress: Record<string, VocabProgress>, date = todayISO()) {
  return words.filter((word) => progress[word.id]?.lastReviewed === date).length;
}

function speakWord(word: string) {
  if (!("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(word);
  utterance.lang = "en-GB";
  utterance.rate = 0.82;
  const voices = window.speechSynthesis.getVoices();
  const voice = voices.find((item) => item.lang === "en-GB") ?? voices.find((item) => item.lang.startsWith("en-GB"));
  if (voice) utterance.voice = voice;
  window.speechSynthesis.speak(utterance);
}

function uid(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function addDays(date: string, days: number) {
  const value = new Date(`${date}T00:00:00`);
  value.setDate(value.getDate() + days);
  return value.toISOString().slice(0, 10);
}

function formatMinutes(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  const rest = seconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(rest).padStart(2, "0")}`;
}

function bandScore(correct: number, total: number) {
  if (!total) return 0;
  const percent = correct / total;
  if (percent >= 0.9) return 8;
  if (percent >= 0.825) return 7.5;
  if (percent >= 0.75) return 7;
  if (percent >= 0.65) return 6.5;
  if (percent >= 0.575) return 6;
  if (percent >= 0.475) return 5.5;
  if (percent >= 0.375) return 5;
  return 4.5;
}

function nextReviewDate(date: string, reviewCount: number) {
  const intervals = [1, 2, 4, 7, 14, 30];
  return addDays(date, intervals[Math.min(reviewCount, intervals.length - 1)]);
}

function getTodaySprintPlan(date = todayISO()) {
  const day = dayIndexFromStart() + 1;
  const isFirstStage = date <= MILESTONE_55_DATE;
  const targetDate = isFirstStage ? MILESTONE_55_DATE : EXAM_DATE;
  const daysLeft = Math.max(0, daysBetween(date, targetDate));
  const week = Math.floor((day - 1) / 7) + 1;
  const dayInWeek = ((day - 1) % 7) + 1;
  const camBook = Math.min(20, isFirstStage ? 10 + Math.floor((day - 1) / 5) : 14 + Math.floor((day - 1) / 4));
  const test = ((day - 1) % 4) + 1;
  const passage = ((day - 1) % 3) + 1;
  const section = ((day - 1) % 4) + 1;
  const writingTask = day % 2 === 0 ? "Task 1 图表概览+主体段" : "Task 2 主体段+结论";
  const mockDay = dayInWeek === 6 || (!isFirstStage && dayInWeek === 3);

  return {
    phase: isFirstStage ? "第一阶段：冲刺5.5" : "第二阶段：冲刺6.0",
    targetDate,
    targetBand: isFirstStage ? "5.5" : "6.0",
    daysLeft,
    headline: isFirstStage ? "先把阅读听力稳定到5.5区间" : "用真题模考把四科拉到6.0节奏",
    weekLabel: `第${week}周 Day ${dayInWeek}`,
    checkpoint: mockDay
      ? isFirstStage
        ? "今天做半套计时检测：阅读2篇+听力2个Section，晚上复盘错因。"
        : "今天做完整或接近完整模考，重点看总分是否接近6.0。"
      : isFirstStage
        ? "今日验收：阅读1篇正确率达到6/13以上，听力Section达到5/10以上。"
        : "今日验收：阅读1篇正确率达到8/13以上，听力Section达到6/10以上。",
    tasks: [
      {
        title: "单词",
        minutes: 55,
        detail: `背${DAILY_WORD_COUNT}个新词 + 复习到期词，只保留英音。`,
        target: "完成后点已背，让遗忘曲线自动滚动。",
        tone: "#5b21b6",
      },
      {
        title: "阅读",
        minutes: isFirstStage ? 85 : 95,
        detail: mockDay ? `剑雅${camBook} Test ${test} 阅读限时2篇。` : `剑雅${camBook} Test ${test} Passage ${passage}，20分钟限时。`,
        target: "错题按 题干关键词 -> 原文同义表达 -> 错因 -> 下次规则 记录。",
        tone: skillMeta.reading.color,
      },
      {
        title: "听力",
        minutes: isFirstStage ? 55 : 70,
        detail: mockDay ? `剑雅${camBook} Test ${test} 听力做2个Section。` : `剑雅${camBook} Test ${test} Section ${section}，不暂停完成。`,
        target: "错因只分四类：拼写、单复数、定位、干扰项。",
        tone: skillMeta.listening.color,
      },
      {
        title: "写作",
        minutes: isFirstStage ? 45 : 60,
        detail: isFirstStage ? writingTask : `${writingTask}，写完放入写作页估分纠错。`,
        target: isFirstStage ? "先保证段落完整和观点清楚。" : "必须改第二版，保留3个可复用表达。",
        tone: skillMeta.writing.color,
      },
      {
        title: "口语+复盘",
        minutes: 35,
        detail: isFirstStage ? "Part 1录音3题，复盘卡顿词。" : "Part 2录音1题 + Part 3追问2题。",
        target: "当天只修一个最明显问题：停顿、语法、词汇或展开。",
        tone: skillMeta.speaking.color,
      },
    ],
  };
}

function createTodaySession(date = todayISO()): StudySession {
  return {
    id: uid("session"),
    date,
    tasks: taskTemplate.map((task) => ({ ...task })),
    notes: "",
  };
}

function createInitialData(): DashboardData {
  const today = todayISO();
  return {
    sessions: [createTodaySession(today)],
    readings: [
      {
        id: "reading-sample-1",
        date: addDays(today, -2),
        title: "Cambridge Reading Passage 精读样例",
        source: "Cambridge IELTS",
        totalQuestions: 13,
        correctAnswers: 7,
        minutes: 27,
        notes: "重点看题干名词和原文动词替换，先保证定位准确。",
      },
    ],
    mistakes: [
      {
        id: "mistake-sample-1",
        practiceId: "reading-sample-1",
        date: addDays(today, -2),
        category: "同义替换",
        questionKeyword: "rapid growth",
        originalText: "expanded quickly",
        reason: "只盯住原词，没有识别动词短语替换。",
        nextRule: "题干形容词+名词常被原文动词短语改写，先找语义再找词形。",
        reviewCount: 0,
        nextReviewDate: today,
        mastered: false,
      },
    ],
    vocabulary: [
      {
        id: "vocab-sample-1",
        date: addDays(today, -1),
        phrase: "account for",
        meaning: "解释；占比",
        synonym: "explain / make up",
        sourceSentence: "These factors account for the difference in results.",
        type: "synonym",
        difficulty: 4,
        reviewCount: 0,
        nextReviewDate: today,
        mastered: false,
      },
    ],
    mocks: [
      {
        id: "mock-sample-1",
        date: addDays(today, -14),
        reading: 4.5,
        listening: 4.5,
        writing: 4,
        speaking: 4,
        overall: 4.5,
        notes: "基线测试：阅读定位慢，听力易漏数字和拼写。",
      },
      {
        id: "mock-sample-2",
        date: addDays(today, -7),
        reading: 5,
        listening: 5,
        writing: 4.5,
        speaking: 4.5,
        overall: 5,
        notes: "阅读正确率提升，写作需要固定结构和例证。",
      },
    ],
    vocabProgress: {},
    writingAttempts: [],
    listeningPractices: [],
    courseCompletions: {},
    cambridgeProgress: {},
  };
}

function useStoredData() {
  const [data, setData] = useState<DashboardData>(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (!stored) return createInitialData();
    try {
      const parsed = { ...createInitialData(), ...(JSON.parse(stored) as Partial<DashboardData>) } as DashboardData;
      if (!parsed.sessions.some((session) => session.date === todayISO())) {
        parsed.sessions.unshift(createTodaySession());
      }
      parsed.vocabProgress = parsed.vocabProgress ?? {};
      parsed.writingAttempts = parsed.writingAttempts ?? [];
      parsed.listeningPractices = parsed.listeningPractices ?? [];
      parsed.courseCompletions = parsed.courseCompletions ?? {};
      parsed.cambridgeProgress = parsed.cambridgeProgress ?? {};
      return parsed;
    } catch {
      return createInitialData();
    }
  });

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }, [data]);

  return [data, setData] as const;
}

export default function App() {
  const [data, setData] = useStoredData();
  const [activeTab, setActiveTab] = useState<TabKey>("dashboard");
  const today = todayISO();
  const todaySession = data.sessions.find((session) => session.date === today) ?? data.sessions[0];
  const examDays = Math.max(0, Math.ceil((new Date(`${EXAM_DATE}T00:00:00`).getTime() - Date.now()) / 86400000));
  const dueMistakes = data.mistakes.filter((item) => !item.mastered && item.nextReviewDate <= today);
  const dueVocabulary = data.vocabulary.filter((item) => !item.mastered && item.nextReviewDate <= today);
  const readingAverage = useMemo(() => {
    if (!data.readings.length) return 0;
    const total = data.readings.reduce((sum, item) => sum + item.correctAnswers / Math.max(item.totalQuestions, 1), 0);
    return Math.round((total / data.readings.length) * 100);
  }, [data.readings]);
  const streak = useMemo(() => calculateStreak(data.sessions), [data.sessions]);

  function updateTodayTask(taskId: SkillKey) {
    setData((current) => ({
      ...current,
      sessions: current.sessions.map((session) =>
        session.date === today
          ? {
              ...session,
              tasks: session.tasks.map((task) => (task.id === taskId ? { ...task, done: !task.done } : task)),
            }
          : session,
      ),
    }));
  }

  function setSessionNotes(notes: string) {
    setData((current) => ({
      ...current,
      sessions: current.sessions.map((session) => (session.date === today ? { ...session, notes } : session)),
    }));
  }

  function addReading(practice: ReadingPractice) {
    setData((current) => ({ ...current, readings: [practice, ...current.readings] }));
  }

  function addMistake(mistake: Mistake) {
    setData((current) => ({ ...current, mistakes: [mistake, ...current.mistakes] }));
  }

  function addVocabulary(item: VocabularyItem) {
    setData((current) => ({ ...current, vocabulary: [item, ...current.vocabulary] }));
  }

  function addMock(mock: MockTestResult) {
    setData((current) => ({ ...current, mocks: [mock, ...current.mocks] }));
  }

  function updateVocabProgress(id: string, status: VocabProgress["status"]) {
    setData((current) => ({
      ...current,
      vocabProgress: (() => {
        const previous = current.vocabProgress[id];
        const reviews = (previous?.reviews ?? 0) + 1;
        const nextStatus = status === "known" && reviews >= 5 ? "known" : status === "known" ? "learning" : status;
        return {
          ...current.vocabProgress,
          [id]: {
            status: nextStatus,
            reviews,
            lastReviewed: today,
            nextReviewDate: status === "learning" ? addDays(today, 1) : nextReviewDate(today, reviews - 1),
          },
        };
      })(),
    }));
  }

  function addWritingAttempt(attempt: WritingAttempt) {
    setData((current) => ({ ...current, writingAttempts: [attempt, ...current.writingAttempts] }));
  }

  function addListeningPractice(practice: ListeningPractice) {
    setData((current) => ({ ...current, listeningPractices: [practice, ...current.listeningPractices] }));
  }

  function toggleCourse(id: string) {
    setData((current) => ({
      ...current,
      courseCompletions: { ...current.courseCompletions, [id]: !current.courseCompletions[id] },
    }));
  }

  function toggleCambridgeItem(id: string) {
    setData((current) => ({
      ...current,
      cambridgeProgress: { ...current.cambridgeProgress, [id]: !current.cambridgeProgress[id] },
    }));
  }

  function reviewMistake(id: string, mastered = false) {
    setData((current) => ({
      ...current,
      mistakes: current.mistakes.map((item) =>
        item.id === id
          ? {
              ...item,
              mastered,
              reviewCount: item.reviewCount + 1,
              nextReviewDate: mastered ? item.nextReviewDate : nextReviewDate(today, item.reviewCount + 1),
            }
          : item,
      ),
    }));
  }

  function reviewVocabulary(id: string, mastered = false) {
    setData((current) => ({
      ...current,
      vocabulary: current.vocabulary.map((item) =>
        item.id === id
          ? {
              ...item,
              mastered,
              reviewCount: item.reviewCount + 1,
              nextReviewDate: mastered ? item.nextReviewDate : nextReviewDate(today, item.reviewCount + 1),
            }
          : item,
      ),
    }));
  }

  function exportData() {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `ielts-dashboard-${today}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">IELTS Academic · 4.0 到 6.0</p>
          <h1>9月雅思冲刺工作台</h1>
        </div>
        <button className="icon-button" type="button" onClick={exportData} title="导出学习数据">
          <Download size={20} />
        </button>
      </header>

      <nav className="tabbar" aria-label="主导航">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              type="button"
              className={activeTab === tab.id ? "tab active" : "tab"}
              onClick={() => setActiveTab(tab.id)}
            >
              <Icon size={18} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </nav>

      {activeTab === "dashboard" && (
        <Dashboard
          data={data}
          session={todaySession}
          examDays={examDays}
          streak={streak}
          readingAverage={readingAverage}
          dueCount={dueMistakes.length + dueVocabulary.length}
          onToggleTask={updateTodayTask}
          onNotesChange={setSessionNotes}
        />
      )}

      {activeTab === "vocabulary" && (
        <VocabularyPanel progress={data.vocabProgress} userVocabulary={data.vocabulary} onReview={updateVocabProgress} />
      )}

      {activeTab === "reading" && (
        <ReadingPanel
          readings={data.readings}
          mistakes={data.mistakes}
          vocabulary={data.vocabulary}
          onAddReading={addReading}
          onAddMistake={addMistake}
          onAddVocabulary={addVocabulary}
        />
      )}

      {activeTab === "writing" && <WritingPanel attempts={data.writingAttempts} onAddAttempt={addWritingAttempt} />}

      {activeTab === "listening" && (
        <ListeningPanel practices={data.listeningPractices} onAddPractice={addListeningPractice} />
      )}

      {activeTab === "review" && (
        <ReviewPanel
          mistakes={dueMistakes}
          vocabulary={dueVocabulary}
          onReviewMistake={reviewMistake}
          onReviewVocabulary={reviewVocabulary}
        />
      )}

      {activeTab === "plan" && (
        <PlanPanel
          cambridgeProgress={data.cambridgeProgress}
          courseCompletions={data.courseCompletions}
          onToggleCambridge={toggleCambridgeItem}
          onToggleCourse={toggleCourse}
        />
      )}

      {activeTab === "mocks" && <MockPanel mocks={data.mocks} onAddMock={addMock} />}
    </main>
  );
}

function Dashboard({
  data,
  session,
  examDays,
  streak,
  readingAverage,
  dueCount,
  onToggleTask,
  onNotesChange,
}: {
  data: DashboardData;
  session: StudySession;
  examDays: number;
  streak: number;
  readingAverage: number;
  dueCount: number;
  onToggleTask: (taskId: SkillKey) => void;
  onNotesChange: (notes: string) => void;
}) {
  const completedMinutes = session.tasks.filter((task) => task.done).reduce((sum, task) => sum + task.minutes, 0);
  const totalMinutes = session.tasks.reduce((sum, task) => sum + task.minutes, 0);
  const todayWords = getDailyWords(DAILY_WORD_COUNT);
  const dueReviewWords = getDueReviewWords(data.vocabProgress);
  const todayWordDone = getReviewedTodayCount(todayWords, data.vocabProgress);
  const taskDone = (id: SkillKey) => session.tasks.find((task) => task.id === id)?.done ?? false;
  const sprintPlan = getTodaySprintPlan();
  const checklist = [
    { label: "新词必背", detail: `${todayWordDone}/${todayWords.length}个`, done: todayWordDone >= todayWords.length, tone: "#2563eb" },
    { label: "到期复习词", detail: `${dueReviewWords.length}个待复习`, done: dueReviewWords.length === 0, tone: "#5b21b6" },
    { label: "阅读训练", detail: "90分钟", done: taskDone("reading"), tone: skillMeta.reading.color },
    { label: "听力训练", detail: "60分钟", done: taskDone("listening"), tone: skillMeta.listening.color },
    { label: "写作训练", detail: "45分钟", done: taskDone("writing"), tone: skillMeta.writing.color },
    { label: "口语录音", detail: "30分钟", done: taskDone("speaking"), tone: skillMeta.speaking.color },
    { label: "错题复盘", detail: `${dueCount}条待处理`, done: taskDone("review") || dueCount === 0, tone: skillMeta.review.color },
  ];

  return (
    <section className="grid-page">
      <div className="metric-row">
        <Metric icon={CalendarClock} label="距离6分目标" value={`${examDays}天`} detail={EXAM_DATE} />
        <Metric icon={Clock3} label="今日完成" value={`${completedMinutes}/${totalMinutes}分钟`} detail="目标4小时以上" />
        <Metric icon={Target} label="连续学习" value={`${streak}天`} detail="完成任一任务计入" />
        <Metric icon={BookOpen} label="阅读平均正确率" value={`${readingAverage}%`} detail="来自练习记录" />
      </div>

      <section className="panel wide-panel sprint-panel">
        <div className="sprint-head">
          <div>
            <p className="eyebrow">{sprintPlan.phase}</p>
            <h2>{todayISO()} · {sprintPlan.weekLabel}</h2>
            <p className="hint-text">{sprintPlan.headline}</p>
          </div>
          <div className="sprint-target">
            <span>目标{sprintPlan.targetBand}</span>
            <strong>{sprintPlan.daysLeft}天</strong>
            <small>{sprintPlan.targetDate}</small>
          </div>
        </div>
        <div className="sprint-task-grid">
          {sprintPlan.tasks.map((task) => (
            <article className="sprint-task" key={task.title} style={{ borderTopColor: task.tone }}>
              <div className="daily-plan-head">
                <strong>{task.title}</strong>
                <span className="tag">{task.minutes}分钟</span>
              </div>
              <p>{task.detail}</p>
              <small>{task.target}</small>
            </article>
          ))}
        </div>
        <p className="sprint-checkpoint">{sprintPlan.checkpoint}</p>
      </section>

      <section className="panel hero-panel">
        <div>
          <p className="eyebrow">今日节奏</p>
          <h2>先稳住阅读闭环，再让四科一起涨</h2>
        </div>
        <div className="task-list">
          {session.tasks.map((task) => {
            const Icon = skillMeta[task.id].icon;
            return (
              <button
                key={task.id}
                type="button"
                className={task.done ? "task done" : "task"}
                onClick={() => onToggleTask(task.id)}
              >
                <span className="task-icon" style={{ color: skillMeta[task.id].color }}>
                  <Icon size={20} />
                </span>
                <span>
                  <strong>{task.label}</strong>
                  <small>{task.minutes}分钟</small>
                </span>
                <Check size={18} />
              </button>
            );
          })}
        </div>
      </section>

      <section className="panel wide-panel">
        <div className="section-title">
          <h2>每日打卡清单</h2>
          <span>{checklist.filter((item) => item.done).length}/{checklist.length}完成</span>
        </div>
        <div className="checklist-grid">
          {checklist.map((item) => (
            <article className={item.done ? "check-item done" : "check-item"} key={item.label}>
              <span className="check-dot" style={{ backgroundColor: item.done ? item.tone : "#cbd5e1" }}>
                <Check size={16} />
              </span>
              <div>
                <strong>{item.label}</strong>
                <small>{item.detail}</small>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="panel">
        <div className="section-title">
          <h2>四科进度</h2>
          <span>{dueCount}条待复习</span>
        </div>
        <div className="progress-stack">
          {session.tasks.map((task) => (
            <div className="progress-item" key={task.id}>
              <div>
                <strong>{skillMeta[task.id].label}</strong>
                <span>{task.done ? "今日已完成" : "等待开始"}</span>
              </div>
              <div className="progress-track">
                <div
                  className="progress-fill"
                  style={{
                    width: task.done ? "100%" : "8%",
                    backgroundColor: skillMeta[task.id].color,
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="panel">
        <div className="section-title">
          <h2>模考趋势</h2>
          <span>目标6.0</span>
        </div>
        <MiniChart mocks={data.mocks} />
      </section>

      <section className="panel">
        <div className="section-title">
          <h2>今日复盘</h2>
          <span>一句话就够</span>
        </div>
        <textarea
          value={session.notes}
          onChange={(event) => onNotesChange(event.target.value)}
          placeholder="今天最容易丢分的原因是什么？明天用什么规则避免？"
        />
      </section>
    </section>
  );
}

function ReadingPanel({
  readings,
  mistakes,
  vocabulary,
  onAddReading,
  onAddMistake,
  onAddVocabulary,
}: {
  readings: ReadingPractice[];
  mistakes: Mistake[];
  vocabulary: VocabularyItem[];
  onAddReading: (practice: ReadingPractice) => void;
  onAddMistake: (mistake: Mistake) => void;
  onAddVocabulary: (item: VocabularyItem) => void;
}) {
  const [seconds, setSeconds] = useState(0);
  const [running, setRunning] = useState(false);
  const [readingForm, setReadingForm] = useState({
    title: "",
    source: "Cambridge IELTS",
    totalQuestions: 13,
    correctAnswers: 0,
    minutes: 20,
    notes: "",
  });
  const [mistakeForm, setMistakeForm] = useState({
    practiceId: readings[0]?.id ?? "",
    category: mistakeCategories[0],
    questionKeyword: "",
    originalText: "",
    reason: "",
    nextRule: "",
  });
  const [vocabForm, setVocabForm] = useState({
    phrase: "",
    meaning: "",
    synonym: "",
    sourceSentence: "",
    type: "synonym" as VocabularyItem["type"],
    difficulty: 3,
  });

  useEffect(() => {
    if (!running) return;
    const timer = window.setInterval(() => setSeconds((value) => value + 1), 1000);
    return () => window.clearInterval(timer);
  }, [running]);

  function submitReading(event: FormEvent) {
    event.preventDefault();
    if (!readingForm.title.trim()) return;
    onAddReading({
      id: uid("reading"),
      date: todayISO(),
      title: readingForm.title.trim(),
      source: readingForm.source.trim() || "Reading practice",
      totalQuestions: readingForm.totalQuestions,
      correctAnswers: Math.min(readingForm.correctAnswers, readingForm.totalQuestions),
      minutes: readingForm.minutes,
      notes: readingForm.notes.trim(),
    });
    setReadingForm({ title: "", source: "Cambridge IELTS", totalQuestions: 13, correctAnswers: 0, minutes: 20, notes: "" });
  }

  function submitMistake(event: FormEvent) {
    event.preventDefault();
    if (!mistakeForm.questionKeyword.trim() || !mistakeForm.nextRule.trim()) return;
    onAddMistake({
      id: uid("mistake"),
      date: todayISO(),
      practiceId: mistakeForm.practiceId,
      category: mistakeForm.category,
      questionKeyword: mistakeForm.questionKeyword.trim(),
      originalText: mistakeForm.originalText.trim(),
      reason: mistakeForm.reason.trim(),
      nextRule: mistakeForm.nextRule.trim(),
      reviewCount: 0,
      nextReviewDate: nextReviewDate(todayISO(), 0),
      mastered: false,
    });
    setMistakeForm({ ...mistakeForm, questionKeyword: "", originalText: "", reason: "", nextRule: "" });
  }

  function submitVocabulary(event: FormEvent) {
    event.preventDefault();
    if (!vocabForm.phrase.trim() || !vocabForm.meaning.trim()) return;
    onAddVocabulary({
      id: uid("vocab"),
      date: todayISO(),
      phrase: vocabForm.phrase.trim(),
      meaning: vocabForm.meaning.trim(),
      synonym: vocabForm.synonym.trim(),
      sourceSentence: vocabForm.sourceSentence.trim(),
      type: vocabForm.type,
      difficulty: vocabForm.difficulty,
      reviewCount: 0,
      nextReviewDate: nextReviewDate(todayISO(), 0),
      mastered: false,
    });
    setVocabForm({ phrase: "", meaning: "", synonym: "", sourceSentence: "", type: "synonym", difficulty: 3 });
  }

  return (
    <section className="reading-layout">
      <ModuleResourcePanel skill="阅读" subtitle="网盘路径：阅读网课、剑雅真题、精讲答案、视频解析" />

      <section className="panel timer-panel">
        <p className="eyebrow">Reading timer</p>
        <div className="timer-value">{formatMinutes(seconds)}</div>
        <div className="button-row">
          <button className="primary-button" type="button" onClick={() => setRunning((value) => !value)}>
            {running ? <Pause size={18} /> : <Play size={18} />}
            {running ? "暂停" : "开始"}
          </button>
          <button className="ghost-button" type="button" onClick={() => setReadingForm((form) => ({ ...form, minutes: Math.max(1, Math.round(seconds / 60)) }))}>
            <Save size={18} />
            写入分钟
          </button>
          <button className="icon-button" type="button" onClick={() => { setSeconds(0); setRunning(false); }} title="重置计时器">
            <RotateCcw size={18} />
          </button>
        </div>
      </section>

      <form className="panel form-panel" onSubmit={submitReading}>
        <div className="section-title">
          <h2>新增阅读练习</h2>
          <span>记录正确率</span>
        </div>
        <label>
          文章/Passage
          <input value={readingForm.title} onChange={(event) => setReadingForm({ ...readingForm, title: event.target.value })} placeholder="例如 Cambridge 18 Test 2 Passage 1" />
        </label>
        <label>
          来源
          <input value={readingForm.source} onChange={(event) => setReadingForm({ ...readingForm, source: event.target.value })} />
        </label>
        <div className="form-grid">
          <label>
            总题数
            <input type="number" min="1" value={readingForm.totalQuestions} onChange={(event) => setReadingForm({ ...readingForm, totalQuestions: Number(event.target.value) })} />
          </label>
          <label>
            正确数
            <input type="number" min="0" value={readingForm.correctAnswers} onChange={(event) => setReadingForm({ ...readingForm, correctAnswers: Number(event.target.value) })} />
          </label>
          <label>
            用时
            <input type="number" min="1" value={readingForm.minutes} onChange={(event) => setReadingForm({ ...readingForm, minutes: Number(event.target.value) })} />
          </label>
        </div>
        <textarea value={readingForm.notes} onChange={(event) => setReadingForm({ ...readingForm, notes: event.target.value })} placeholder="精读笔记：定位、同义替换、长难句、时间问题" />
        <button className="primary-button" type="submit">
          <Plus size={18} />
          保存练习
        </button>
      </form>

      <form className="panel form-panel" onSubmit={submitMistake}>
        <div className="section-title">
          <h2>错题复盘</h2>
          <span>{mistakes.length}条</span>
        </div>
        <label>
          关联练习
          <select value={mistakeForm.practiceId} onChange={(event) => setMistakeForm({ ...mistakeForm, practiceId: event.target.value })}>
            <option value="">未关联</option>
            {readings.map((reading) => (
              <option key={reading.id} value={reading.id}>{reading.title}</option>
            ))}
          </select>
        </label>
        <label>
          错因类型
          <select value={mistakeForm.category} onChange={(event) => setMistakeForm({ ...mistakeForm, category: event.target.value })}>
            {mistakeCategories.map((item) => <option key={item}>{item}</option>)}
          </select>
        </label>
        <input value={mistakeForm.questionKeyword} onChange={(event) => setMistakeForm({ ...mistakeForm, questionKeyword: event.target.value })} placeholder="题干关键词" />
        <input value={mistakeForm.originalText} onChange={(event) => setMistakeForm({ ...mistakeForm, originalText: event.target.value })} placeholder="原文同义表达" />
        <textarea value={mistakeForm.reason} onChange={(event) => setMistakeForm({ ...mistakeForm, reason: event.target.value })} placeholder="这题为什么错？" />
        <textarea value={mistakeForm.nextRule} onChange={(event) => setMistakeForm({ ...mistakeForm, nextRule: event.target.value })} placeholder="下次识别规则" />
        <button className="primary-button" type="submit">
          <Plus size={18} />
          加入复习
        </button>
      </form>

      <form className="panel form-panel" onSubmit={submitVocabulary}>
        <div className="section-title">
          <h2>同义替换词库</h2>
          <span>{vocabulary.length}条</span>
        </div>
        <input value={vocabForm.phrase} onChange={(event) => setVocabForm({ ...vocabForm, phrase: event.target.value })} placeholder="词组/句子" />
        <input value={vocabForm.meaning} onChange={(event) => setVocabForm({ ...vocabForm, meaning: event.target.value })} placeholder="中文含义" />
        <input value={vocabForm.synonym} onChange={(event) => setVocabForm({ ...vocabForm, synonym: event.target.value })} placeholder="同义替换" />
        <textarea value={vocabForm.sourceSentence} onChange={(event) => setVocabForm({ ...vocabForm, sourceSentence: event.target.value })} placeholder="原句/例句" />
        <div className="form-grid">
          <label>
            类型
            <select value={vocabForm.type} onChange={(event) => setVocabForm({ ...vocabForm, type: event.target.value as VocabularyItem["type"] })}>
              <option value="synonym">同义替换</option>
              <option value="word">词汇</option>
              <option value="sentence">长难句</option>
            </select>
          </label>
          <label>
            难度
            <input type="number" min="1" max="5" value={vocabForm.difficulty} onChange={(event) => setVocabForm({ ...vocabForm, difficulty: Number(event.target.value) })} />
          </label>
        </div>
        <button className="primary-button" type="submit">
          <Plus size={18} />
          保存词条
        </button>
      </form>

      <section className="panel wide-panel">
        <div className="section-title">
          <h2>最近阅读记录</h2>
          <span>{readings.length}次</span>
        </div>
        <div className="record-list">
          {readings.map((reading) => (
            <article className="record" key={reading.id}>
              <div>
                <strong>{reading.title}</strong>
                <span>{reading.date} · {reading.source}</span>
              </div>
              <b>{reading.correctAnswers}/{reading.totalQuestions}</b>
              <small>{bandScore(reading.correctAnswers, reading.totalQuestions).toFixed(1)}分 · {reading.minutes}分钟</small>
            </article>
          ))}
        </div>
      </section>
    </section>
  );
}

function VocabularyPanel({
  progress,
  userVocabulary,
  onReview,
}: {
  progress: Record<string, VocabProgress>;
  userVocabulary: VocabularyItem[];
  onReview: (id: string, status: VocabProgress["status"]) => void;
}) {
  const topics = ["全部", ...Array.from(new Set(ieltsWordBank.map((item) => item.topic)))];
  const [topic, setTopic] = useState("全部");
  const [index, setIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const filtered = ieltsWordBank.filter((item) => topic === "全部" || item.topic === topic);
  const current = filtered[index % filtered.length];
  const knownCount = ieltsWordBank.filter((item) => progress[item.id]?.status === "known").length;
  const learningCount = ieltsWordBank.filter((item) => progress[item.id]?.status === "learning").length;
  const todayWords = getDailyWords(DAILY_WORD_COUNT);
  const dueReviewWords = getDueReviewWords(progress);
  const todayWordDone = getReviewedTodayCount(todayWords, progress);

  function nextCard() {
    setShowAnswer(false);
    setIndex((value) => (value + 1) % filtered.length);
  }

  function changeTopic(value: string) {
    setTopic(value);
    setIndex(0);
    setShowAnswer(false);
  }

  return (
    <section className="study-layout">
      <ModuleResourcePanel skill="单词" subtitle="网盘路径：雅思词汇、句子记词、精选单词书、总结回收" />

      <section className="panel flashcard-panel">
        <div className="section-title">
          <h2>今日必背单词</h2>
          <span>{todayWordDone}/{todayWords.length} 今日完成</span>
        </div>
        <div className="daily-word-grid">
          {todayWords.map((word) => (
            <article className="daily-word" key={word.id}>
              <div>
                <strong>{word.word}</strong>
                <span>英音 {word.ipaUk}</span>
              </div>
              <p>{word.meaning}</p>
              <small>{word.synonym}</small>
              <div className="button-row">
                <button className="mini-button" type="button" onClick={() => speakWord(word.word)}>英音</button>
                <button className="mini-button done" type="button" onClick={() => onReview(word.id, "known")}>已背</button>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="panel flashcard-panel">
        <div className="section-title">
          <h2>遗忘曲线复习</h2>
          <span>{dueReviewWords.length}个到期</span>
        </div>
        {dueReviewWords.length === 0 ? (
          <EmptyState text="今天没有到期复习词。背完新词后，它们会按1/2/4/7/14/30天自动回来。" />
        ) : (
          <div className="daily-word-grid">
            {dueReviewWords.map((word) => (
              <article className="daily-word review-due" key={word.id}>
                <div>
                  <strong>{word.word}</strong>
                  <span>第{progress[word.id]?.reviews ?? 0}轮 · 下次 {progress[word.id]?.nextReviewDate ?? "今天"}</span>
                </div>
                <p>{word.meaning}</p>
                <small>{word.synonym}</small>
                <div className="button-row">
                  <button className="mini-button" type="button" onClick={() => speakWord(word.word)}>英音</button>
                  <button className="mini-button" type="button" onClick={() => onReview(word.id, "learning")}>不熟</button>
                  <button className="mini-button done" type="button" onClick={() => onReview(word.id, "known")}>掌握</button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="panel flashcard-panel">
        <div className="section-title">
          <h2>抽卡复习</h2>
          <span>{learningCount}个学习中 · {knownCount}个稳定</span>
        </div>
        <div className="button-row">
          {topics.map((item) => (
            <button key={item} className={topic === item ? "chip active" : "chip"} type="button" onClick={() => changeTopic(item)}>
              {item}
            </button>
          ))}
        </div>
        <article className="word-card">
          <p className="tag">{current.topic}</p>
          <h3>{current.word}</h3>
          <p className="ipa-line">英音 {current.ipaUk}</p>
          {showAnswer ? (
            <div className="answer-block">
              <p><strong>含义：</strong>{current.meaning}</p>
              <p><strong>替换：</strong>{current.synonym}</p>
              <p><strong>例句：</strong>{current.example}</p>
            </div>
          ) : (
            <p className="hint-text">先自己回忆中文、同义替换和例句，再点开答案。</p>
          )}
        </article>
        <div className="button-row">
          <button className="ghost-button" type="button" onClick={() => speakWord(current.word)}>
            <Volume2 size={18} />
            英音
          </button>
          <button className="primary-button" type="button" onClick={() => setShowAnswer((value) => !value)}>
            {showAnswer ? <EyeOff size={18} /> : <Eye size={18} />}
            {showAnswer ? "隐藏答案" : "查看答案"}
          </button>
          <button className="ghost-button" type="button" onClick={() => { onReview(current.id, "learning"); nextCard(); }}>
            <RefreshCcw size={18} />
            还不熟
          </button>
          <button className="primary-button" type="button" onClick={() => { onReview(current.id, "known"); nextCard(); }}>
            <Check size={18} />
            已掌握
          </button>
        </div>
      </section>

      <section className="panel">
        <div className="section-title">
          <h2>背诵进度</h2>
          <span>{learningCount}个学习中</span>
        </div>
        <div className="progress-stack">
          {topics.filter((item) => item !== "全部").map((item) => {
            const topicWords = ieltsWordBank.filter((word) => word.topic === item);
            const topicKnown = topicWords.filter((word) => progress[word.id]?.status === "known").length;
            return (
              <div className="progress-item" key={item}>
                <div>
                  <strong>{item}</strong>
                  <span>{topicKnown}/{topicWords.length}</span>
                </div>
                <div className="progress-track">
                  <div className="progress-fill" style={{ width: `${Math.max(8, (topicKnown / topicWords.length) * 100)}%`, backgroundColor: "#2563eb" }} />
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="panel wide-panel">
        <div className="section-title">
          <h2>我的阅读词库</h2>
          <span>来自阅读页录入</span>
        </div>
        <div className="record-list">
          {userVocabulary.map((item) => (
            <article className="record" key={item.id}>
              <div>
                <strong>{item.phrase}</strong>
                <span>{item.meaning} · {item.synonym || "暂无替换"}</span>
              </div>
              <b>{item.type === "sentence" ? "句" : item.type === "word" ? "词" : "替"}</b>
              <small>难度 {item.difficulty}</small>
            </article>
          ))}
        </div>
      </section>
    </section>
  );
}

function WritingPanel({ attempts, onAddAttempt }: { attempts: WritingAttempt[]; onAddAttempt: (attempt: WritingAttempt) => void }) {
  const [taskType, setTaskType] = useState<WritingAttempt["taskType"]>("Task 2");
  const [prompt, setPrompt] = useState(writingPrompts[0]);
  const [essay, setEssay] = useState("");
  const [mode, setMode] = useState("点评+纠错");
  const analysis = useMemo(() => analyseWriting(essay, taskType), [essay, taskType]);

  function submit(event: FormEvent) {
    event.preventDefault();
    if (!essay.trim()) return;
    onAddAttempt({
      id: uid("writing"),
      date: todayISO(),
      taskType,
      prompt: prompt.trim(),
      essay: essay.trim(),
      band: analysis.band,
      notes: analysis.notes,
    });
  }

  return (
    <section className="writing-layout">
      <ModuleResourcePanel skill="写作" subtitle="网盘路径：写作网课、Simon资料、剑雅写作题、范文总结" />

      <form className="panel form-panel" onSubmit={submit}>
        <div className="section-title">
          <h2>写作自动点评</h2>
          <span>本地评分 {analysis.band.toFixed(1)}</span>
        </div>
        <div className="form-grid">
          <label>
            任务
            <select value={taskType} onChange={(event) => setTaskType(event.target.value as WritingAttempt["taskType"])}>
              <option>Task 2</option>
              <option>Task 1</option>
            </select>
          </label>
          <label>
            模式
            <select value={mode} onChange={(event) => setMode(event.target.value)}>
              <option>点评+纠错</option>
              <option>只看结构</option>
              <option>只看语法词汇</option>
            </select>
          </label>
        </div>
        <label>
          题目
          <textarea value={prompt} onChange={(event) => setPrompt(event.target.value)} />
        </label>
        <label>
          作文
          <textarea className="essay-input" value={essay} onChange={(event) => setEssay(event.target.value)} placeholder="把你的Task 1或Task 2作文粘贴到这里，系统会按字数、结构、连接、词汇和常见错误给出估分。" />
        </label>
        <button className="primary-button" type="submit">
          <Save size={18} />
          保存本次作文
        </button>
      </form>

      <section className="panel">
        <div className="section-title">
          <h2>评分与指导</h2>
          <span>{analysis.wordCount}词</span>
        </div>
        <div className="score-grid">
          <Metric icon={Target} label="综合估分" value={analysis.band.toFixed(1)} detail="启发式估分" />
          <Metric icon={ListChecks} label="结构" value={analysis.structure.toFixed(1)} detail="段落与论证" />
          <Metric icon={Layers} label="词汇" value={analysis.lexical.toFixed(1)} detail="主题词与重复" />
          <Metric icon={SpellCheck2} label="语法" value={analysis.grammar.toFixed(1)} detail="句式与错误" />
        </div>
        <div className="card-list compact">
          {analysis.notes
            .filter((note) => mode === "点评+纠错" || (mode === "只看结构" ? note.includes("段") || note.includes("观点") || note.includes("结论") : !note.includes("段")))
            .map((note) => <p className="feedback-line" key={note}>{note}</p>)}
        </div>
      </section>

      <section className="panel wide-panel">
        <div className="section-title">
          <h2>历史作文</h2>
          <span>{attempts.length}篇</span>
        </div>
        <div className="record-list">
          {attempts.map((item) => (
            <article className="record" key={item.id}>
              <div>
                <strong>{item.date} · {item.taskType}</strong>
                <span>{item.prompt}</span>
              </div>
              <b>{item.band.toFixed(1)}</b>
              <small>{item.essay.split(/\s+/).filter(Boolean).length}词</small>
            </article>
          ))}
        </div>
      </section>
    </section>
  );
}

function ListeningPanel({ practices, onAddPractice }: { practices: ListeningPractice[]; onAddPractice: (practice: ListeningPractice) => void }) {
  const [form, setForm] = useState({ title: "", source: "British Council", section: "Part 1", correctAnswers: 0, totalQuestions: 10, notes: "" });

  function submit(event: FormEvent) {
    event.preventDefault();
    if (!form.title.trim()) return;
    onAddPractice({ id: uid("listening"), date: todayISO(), ...form, title: form.title.trim(), notes: form.notes.trim() });
    setForm({ title: "", source: "British Council", section: "Part 1", correctAnswers: 0, totalQuestions: 10, notes: "" });
  }

  return (
    <section className="listening-layout">
      <ModuleResourcePanel skill="听力" subtitle="网盘路径：王陆语料库、听力网课、剑雅音频、精讲答案" />

      <section className="panel wide-panel">
        <div className="section-title">
          <h2>听力素材库</h2>
          <span>官方/公开练习入口</span>
        </div>
        <div className="resource-grid">
          {listeningMaterials.map((item) => (
            <a className="resource-card" key={item.title} href={item.url} target="_blank" rel="noreferrer">
              <span className="tag">{item.source}</span>
              <strong>{item.title}</strong>
              <small>{item.section}</small>
              <p>{item.focus}</p>
              <ExternalLink size={18} />
            </a>
          ))}
        </div>
      </section>

      <form className="panel form-panel" onSubmit={submit}>
        <div className="section-title">
          <h2>听力练习记录</h2>
          <span>拼写也算错</span>
        </div>
        <input value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} placeholder="例如 British Council Listening Test 1" />
        <div className="form-grid">
          <label>
            来源
            <input value={form.source} onChange={(event) => setForm({ ...form, source: event.target.value })} />
          </label>
          <label>
            Part
            <select value={form.section} onChange={(event) => setForm({ ...form, section: event.target.value })}>
              <option>Part 1</option>
              <option>Part 2</option>
              <option>Part 3</option>
              <option>Part 4</option>
              <option>Full Test</option>
            </select>
          </label>
        </div>
        <div className="form-grid">
          <label>
            正确数
            <input type="number" min="0" value={form.correctAnswers} onChange={(event) => setForm({ ...form, correctAnswers: Number(event.target.value) })} />
          </label>
          <label>
            总题数
            <input type="number" min="1" value={form.totalQuestions} onChange={(event) => setForm({ ...form, totalQuestions: Number(event.target.value) })} />
          </label>
        </div>
        <textarea value={form.notes} onChange={(event) => setForm({ ...form, notes: event.target.value })} placeholder="错因：数字、拼写、单复数、地图方向、干扰项、答案转写" />
        <button className="primary-button" type="submit">
          <Plus size={18} />
          保存听力
        </button>
      </form>

      <section className="panel">
        <div className="section-title">
          <h2>听力练习法</h2>
          <span>60分钟</span>
        </div>
        <div className="card-list compact">
          <p className="feedback-line">1. 先完整计时做题，不暂停音频。</p>
          <p className="feedback-line">2. 对答案后只精听错题附近30-60秒。</p>
          <p className="feedback-line">3. 把拼写、数字、单复数、干扰项分别记录。</p>
          <p className="feedback-line">4. 第二天只重听错题片段，直到能提前预测答案词性。</p>
        </div>
      </section>

      <section className="panel wide-panel">
        <div className="section-title">
          <h2>最近听力记录</h2>
          <span>{practices.length}次</span>
        </div>
        <div className="record-list">
          {practices.map((item) => (
            <article className="record" key={item.id}>
              <div>
                <strong>{item.title}</strong>
                <span>{item.date} · {item.source} · {item.section}</span>
              </div>
              <b>{item.correctAnswers}/{item.totalQuestions}</b>
              <small>{Math.round((item.correctAnswers / item.totalQuestions) * 100)}%</small>
            </article>
          ))}
        </div>
      </section>
    </section>
  );
}

function PlanPanel({
  cambridgeProgress,
  courseCompletions,
  onToggleCambridge,
  onToggleCourse,
}: {
  cambridgeProgress: Record<string, boolean>;
  courseCompletions: Record<string, boolean>;
  onToggleCambridge: (id: string) => void;
  onToggleCourse: (id: string) => void;
}) {
  const schedule = generateCambridgeSchedule();
  const completed = schedule.filter((item) => cambridgeProgress[item.id]).length;
  const todayCourse = coursePlan[new Date().getDay() === 0 ? 6 : new Date().getDay() - 1];

  return (
    <section className="plan-layout">
      <section className="panel hero-panel">
        <div>
          <p className="eyebrow">Daily course</p>
          <h2>{todayCourse.day} · {todayCourse.title}</h2>
          <p className="hint-text">{todayCourse.source} · {todayCourse.minutes}分钟</p>
        </div>
        <div className="button-row">
          {todayCourse.url && (
            <a className="primary-button link-button" href={todayCourse.url} target="_blank" rel="noreferrer">
              <ExternalLink size={18} />
              打开课程
            </a>
          )}
          <button className="ghost-button" type="button" onClick={() => onToggleCourse(todayCourse.id)}>
            <Check size={18} />
            {courseCompletions[todayCourse.id] ? "已完成" : "标记完成"}
          </button>
        </div>
      </section>

      <section className="panel">
        <div className="section-title">
          <h2>每日网课内容</h2>
          <span>{coursePlan.filter((item) => courseCompletions[item.id]).length}/7</span>
        </div>
        <div className="card-list compact">
          {coursePlan.map((item) => (
            <button key={item.id} className={courseCompletions[item.id] ? "task done" : "task"} type="button" onClick={() => onToggleCourse(item.id)}>
              <span>
                <strong>{item.day} · {item.title}</strong>
                <small>{item.source} · {item.minutes}分钟</small>
              </span>
              <Check size={18} />
            </button>
          ))}
        </div>
      </section>

      <section className="panel">
        <div className="section-title">
          <h2>公开资源入口</h2>
          <span>合法练习</span>
        </div>
        <ResourceList resources={publicResources} />
      </section>

      <section className="panel wide-panel">
        <div className="section-title">
          <h2>剑雅10-20真题安排</h2>
          <span>{completed}/{schedule.length}项</span>
        </div>
        <div className="plan-grid">
          {schedule.map((item) => (
            <button key={item.id} className={cambridgeProgress[item.id] ? "plan-item done" : "plan-item"} type="button" onClick={() => onToggleCambridge(item.id)}>
              <strong>{item.label}</strong>
              <span>{item.focus}</span>
              <small>{item.week}</small>
            </button>
          ))}
        </div>
      </section>
    </section>
  );
}

function BaiduResourcesPanel() {
  const dailyPlan = generateBaiduDailyPlan();
  return (
    <section className="resources-layout">
      <section className="panel hero-panel">
        <div>
          <p className="eyebrow">Baidu Pan</p>
          <h2>雅思全套资料整理</h2>
          <p className="hint-text">提取码：{PAN_CODE}。链接只指向目录，学习时用你网盘里的正版/已有资料打开对应文件。</p>
        </div>
        <div className="button-row">
          <a className="primary-button link-button" href={PAN_SHARE_URL} target="_blank" rel="noreferrer">
            <ExternalLink size={18} />
            打开网盘
          </a>
          <a className="ghost-button link-button" href={panFolderUrl(PAN_ROOT)} target="_blank" rel="noreferrer">
            <FolderOpen size={18} />
            打开根目录
          </a>
        </div>
      </section>

      <section className="panel wide-panel">
        <div className="section-title">
          <h2>资料分类</h2>
          <span>{panResources.reduce((sum, group) => sum + group.items.length, 0)}个入口</span>
        </div>
        <div className="resource-category-grid">
          {panResources.map((group) => (
            <article className="resource-category" key={group.category}>
              <div className="section-title">
                <h3>{group.category}</h3>
                <span>{group.priority}</span>
              </div>
              <div className="resource-list">
                {group.items.map((item) => (
                  <a className="resource-link tall" key={item.path} href={panFolderUrl(item.path)} target="_blank" rel="noreferrer">
                    <span>
                      <strong>{item.label}</strong>
                      <small>{item.note}</small>
                    </span>
                    <ExternalLink size={16} />
                  </a>
                ))}
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="panel wide-panel">
        <div className="section-title">
          <h2>听力/阅读/写作顺序路径</h2>
          <span>含讲解和答案</span>
        </div>
        <div className="track-grid">
          {orderedStudyTracks.map((track) => (
            <article className="track-card" key={track.skill} style={{ borderTopColor: track.accent }}>
              <h3>{track.skill}</h3>
              <div className="track-steps">
                {track.steps.map((step) => (
                  <a className="track-step" key={`${track.skill}-${step.title}`} href={panFolderUrl(step.path)} target="_blank" rel="noreferrer">
                    <strong>{step.title}</strong>
                    <span>{step.requirement}</span>
                    <small>打开资料/讲解/答案</small>
                  </a>
                ))}
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="panel wide-panel">
        <div className="section-title">
          <h2>56天每日学习安排</h2>
          <span>4分到6分冲刺</span>
        </div>
        <div className="daily-plan-list">
          {dailyPlan.map((day) => (
            <article className="daily-plan-card" key={day.day}>
              <div className="daily-plan-head">
                <span className="tag">Day {day.day}</span>
                <strong>{day.date} · {day.phase}</strong>
              </div>
              <div className="daily-task-grid">
                {day.tasks.map((task) => (
                  <a className="daily-task" href={panFolderUrl(task.path)} target="_blank" rel="noreferrer" key={`${day.day}-${task.title}`}>
                    <strong>{task.title}</strong>
                    <span>{task.requirement}</span>
                    <small>{task.minutes}分钟 · 打开资料</small>
                  </a>
                ))}
              </div>
            </article>
          ))}
        </div>
      </section>
    </section>
  );
}

function ReviewPanel({
  mistakes,
  vocabulary,
  onReviewMistake,
  onReviewVocabulary,
}: {
  mistakes: Mistake[];
  vocabulary: VocabularyItem[];
  onReviewMistake: (id: string, mastered?: boolean) => void;
  onReviewVocabulary: (id: string, mastered?: boolean) => void;
}) {
  return (
    <section className="review-layout">
      <section className="panel">
        <div className="section-title">
          <h2>今日错题</h2>
          <span>{mistakes.length}条</span>
        </div>
        <div className="card-list">
          {mistakes.length === 0 && <EmptyState text="今天没有到期错题，去阅读页新增一条即可开始循环复习。" />}
          {mistakes.map((item) => (
            <article className="review-card" key={item.id}>
              <p className="tag">{item.category}</p>
              <h3>{item.questionKeyword}</h3>
              <p><strong>原文：</strong>{item.originalText || "未填写"}</p>
              <p><strong>错因：</strong>{item.reason || "未填写"}</p>
              <p><strong>规则：</strong>{item.nextRule}</p>
              <div className="button-row">
                <button className="ghost-button" type="button" onClick={() => onReviewMistake(item.id)}>
                  <RefreshCcw size={18} />
                  下次再背
                </button>
                <button className="primary-button" type="button" onClick={() => onReviewMistake(item.id, true)}>
                  <Check size={18} />
                  已掌握
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="panel">
        <div className="section-title">
          <h2>今日词汇/长难句</h2>
          <span>{vocabulary.length}条</span>
        </div>
        <div className="card-list">
          {vocabulary.length === 0 && <EmptyState text="今天没有到期词条。继续把阅读里的同义替换收进来。" />}
          {vocabulary.map((item) => (
            <article className="review-card" key={item.id}>
              <p className="tag">{item.type === "sentence" ? "长难句" : item.type === "word" ? "词汇" : "同义替换"}</p>
              <h3>{item.phrase}</h3>
              <p><strong>含义：</strong>{item.meaning}</p>
              <p><strong>替换：</strong>{item.synonym || "未填写"}</p>
              <p><strong>例句：</strong>{item.sourceSentence || "未填写"}</p>
              <div className="button-row">
                <button className="ghost-button" type="button" onClick={() => onReviewVocabulary(item.id)}>
                  <RefreshCcw size={18} />
                  下次再背
                </button>
                <button className="primary-button" type="button" onClick={() => onReviewVocabulary(item.id, true)}>
                  <Check size={18} />
                  已掌握
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>
    </section>
  );
}

function MockPanel({ mocks, onAddMock }: { mocks: MockTestResult[]; onAddMock: (mock: MockTestResult) => void }) {
  const [form, setForm] = useState({ reading: 5, listening: 5, writing: 4.5, speaking: 4.5, notes: "" });
  const overall = Math.round(((form.reading + form.listening + form.writing + form.speaking) / 4) * 2) / 2;

  function submit(event: FormEvent) {
    event.preventDefault();
    onAddMock({ id: uid("mock"), date: todayISO(), ...form, overall });
    setForm({ reading: 5, listening: 5, writing: 4.5, speaking: 4.5, notes: "" });
  }

  return (
    <section className="mock-layout">
      <section className="panel">
        <div className="section-title">
          <h2>模考趋势</h2>
          <span>第4周/第8周对比</span>
        </div>
        <MiniChart mocks={mocks} />
      </section>

      <form className="panel form-panel" onSubmit={submit}>
        <div className="section-title">
          <h2>新增模考</h2>
          <span>总分 {overall.toFixed(1)}</span>
        </div>
        <div className="form-grid">
          {(["reading", "listening", "writing", "speaking"] as const).map((key) => (
            <label key={key}>
              {skillMeta[key].label}
              <input type="number" min="0" max="9" step="0.5" value={form[key]} onChange={(event) => setForm({ ...form, [key]: Number(event.target.value) })} />
            </label>
          ))}
        </div>
        <textarea value={form.notes} onChange={(event) => setForm({ ...form, notes: event.target.value })} placeholder="这次最该修的一个问题" />
        <button className="primary-button" type="submit">
          <Plus size={18} />
          保存模考
        </button>
      </form>

      <section className="panel wide-panel">
        <div className="section-title">
          <h2>模考记录</h2>
          <span>{mocks.length}次</span>
        </div>
        <div className="record-list">
          {[...mocks].sort((a, b) => b.date.localeCompare(a.date)).map((mock) => (
            <article className="record" key={mock.id}>
              <div>
                <strong>{mock.date}</strong>
                <span>{mock.notes || "暂无备注"}</span>
              </div>
              <b>{mock.overall.toFixed(1)}</b>
              <small>R{mock.reading} L{mock.listening} W{mock.writing} S{mock.speaking}</small>
            </article>
          ))}
        </div>
      </section>
    </section>
  );
}

function MiniChart({ mocks }: { mocks: MockTestResult[] }) {
  const sorted = [...mocks].sort((a, b) => a.date.localeCompare(b.date)).slice(-8);
  if (sorted.length === 0) return <EmptyState text="保存第一次模考后，这里会显示趋势。" />;
  const width = 520;
  const height = 180;
  const points = sorted.map((mock, index) => {
    const x = sorted.length === 1 ? width / 2 : (index / (sorted.length - 1)) * (width - 40) + 20;
    const y = height - ((mock.overall - 3) / 6) * (height - 28) - 14;
    return `${x},${y}`;
  }).join(" ");

  return (
    <div className="chart-wrap">
      <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label="雅思模考总分趋势图">
        <line x1="20" y1="104" x2="500" y2="104" className="chart-goal" />
        <polyline points={points} className="chart-line" />
        {sorted.map((mock, index) => {
          const x = sorted.length === 1 ? width / 2 : (index / (sorted.length - 1)) * (width - 40) + 20;
          const y = height - ((mock.overall - 3) / 6) * (height - 28) - 14;
          return (
            <g key={mock.id}>
              <circle cx={x} cy={y} r="5" className="chart-dot" />
              <text x={x} y={y - 12} textAnchor="middle">{mock.overall.toFixed(1)}</text>
            </g>
          );
        })}
        <text x="24" y="98" className="goal-label">6.0</text>
      </svg>
    </div>
  );
}

function analyseWriting(essay: string, taskType: WritingAttempt["taskType"]) {
  const words = essay.trim().split(/\s+/).filter(Boolean);
  const wordCount = words.length;
  const paragraphs = essay.split(/\n+/).map((item) => item.trim()).filter(Boolean).length;
  const lower = essay.toLowerCase();
  const connectors = ["however", "therefore", "moreover", "in addition", "for example", "as a result", "although", "whereas", "overall"];
  const connectorCount = connectors.filter((item) => lower.includes(item)).length;
  const topicWords = coreVocab.filter((item) => lower.includes(item.word)).length;
  const sentenceCount = Math.max(1, essay.split(/[.!?]+/).filter((item) => item.trim()).length);
  const avgSentence = wordCount / sentenceCount;
  const repeatedStarts = (essay.match(/\bI think\b/gi) ?? []).length;
  const likelyErrors = [
    { pattern: /\bpeople is\b/i, message: "people 通常接 are，不接 is。" },
    { pattern: /\bmore better\b/i, message: "more better 应改为 better。" },
    { pattern: /\ba important\b/i, message: "元音音素前用 an important。" },
    { pattern: /\bthe society\b/i, message: "泛指社会通常写 society，不写 the society。" },
    { pattern: /\bnowaday\b/i, message: "常用 nowadays，不是 nowaday。" },
    { pattern: /\badvices\b/i, message: "advice 不可数，不能写 advices。" },
  ].filter((item) => item.pattern.test(essay));

  let structure = 4.5;
  if (paragraphs >= 4 && taskType === "Task 2") structure += 0.8;
  if (paragraphs >= 3 && taskType === "Task 1") structure += 0.8;
  if (connectorCount >= 4) structure += 0.6;
  if (lower.includes("in conclusion") || lower.includes("overall")) structure += 0.4;

  let lexical = 4.5 + Math.min(1.2, topicWords * 0.18);
  const uniqueRatio = new Set(words.map((word) => word.toLowerCase().replace(/[^a-z]/g, ""))).size / Math.max(1, wordCount);
  if (uniqueRatio > 0.52) lexical += 0.5;
  if (repeatedStarts >= 3) lexical -= 0.4;

  let grammar = 4.5;
  if (avgSentence >= 12 && avgSentence <= 24) grammar += 0.6;
  if (connectorCount >= 3) grammar += 0.3;
  grammar -= Math.min(1, likelyErrors.length * 0.25);

  const targetWords = taskType === "Task 2" ? 250 : 150;
  let task = 4.5;
  if (wordCount >= targetWords) task += 0.8;
  if (wordCount >= targetWords + 30) task += 0.3;
  if (lower.includes("because") || lower.includes("for example")) task += 0.4;
  if (wordCount > 0 && wordCount < targetWords * 0.75) task -= 0.8;

  const band = clampBand((structure + lexical + grammar + task) / 4);
  const notes = [
    wordCount < targetWords ? `字数不足：${taskType}建议至少${targetWords}词，目前${wordCount}词。` : `字数达标：目前${wordCount}词。`,
    paragraphs < (taskType === "Task 2" ? 4 : 3) ? "段落偏少：建议引言、主体段、结论/概览分开写。" : "段落结构基本清楚。",
    connectorCount < 3 ? "连接词偏少：加入 however, therefore, for example 等逻辑标记。" : "衔接信号可见，继续减少机械重复。",
    topicWords < 4 ? "主题词不足：尝试加入更具体的学术词汇和同义替换。" : "主题词覆盖不错，注意准确性。",
    avgSentence > 28 ? "句子偏长：拆分长句，减少语法失误。" : "句长基本可控。",
    repeatedStarts >= 3 ? "I think 重复较多：改用 It is argued that / This essay will discuss 等表达。" : "观点表达没有明显单一开头问题。",
    ...likelyErrors.map((item) => `纠错：${item.message}`),
  ];

  return { band, wordCount, structure: clampBand(structure), lexical: clampBand(lexical), grammar: clampBand(grammar), notes };
}

function clampBand(value: number) {
  return Math.max(3.5, Math.min(8, Math.round(value * 2) / 2));
}

function generateCambridgeSchedule() {
  const items: Array<{ id: string; label: string; focus: string; week: string }> = [];
  let slot = 0;
  for (let book = 10; book <= 20; book += 1) {
    for (let test = 1; test <= 4; test += 1) {
      const week = Math.floor(slot / 5) + 1;
      const day = (slot % 5) + 1;
      items.push({
        id: `cam-${book}-${test}-reading`,
        label: `剑雅${book} Test ${test} 阅读`,
        focus: "1篇限时20分钟 + 精读错题 + 同义替换入库",
        week: `第${week}周 Day ${day}`,
      });
      items.push({
        id: `cam-${book}-${test}-writing`,
        label: `剑雅${book} Test ${test} 写作`,
        focus: test % 2 === 0 ? "Task 2 写一篇并用写作页点评" : "Task 1 图表概览+主体段训练",
        week: `第${week}周 Day ${day}`,
      });
      slot += 1;
    }
  }
  return items;
}

function panFolderUrl(path: string) {
  const parent = path.split("/").slice(0, -1).join("/");
  return `${PAN_SHARE_URL}#list/path=${encodeURIComponent(path)}&parentPath=${encodeURIComponent(parent)}`;
}

function generateBaiduDailyPlan() {
  const start = todayISO();
  const base = {
    intro: `${PAN_ROOT}/01.小白指南`,
    methods: `${PAN_ROOT}/02.计划+学习方法`,
    grammar: `${PAN_ROOT}/03.雅思基础预备课程/01.雅思语法（推荐）`,
    vocab: `${PAN_ROOT}/03.雅思基础预备课程/02.雅思词汇`,
    vocabBook: `${PAN_ROOT}/07.书籍+资料/2.精选单词书`,
    readingCourse: `${PAN_ROOT}/04.雅思网课/01.雅思阅读网课`,
    listeningCourse: `${PAN_ROOT}/04.雅思网课/02.雅思听力网课`,
    writingCourse: `${PAN_ROOT}/04.雅思网课/03.雅思写作网课`,
    speakingCourse: `${PAN_ROOT}/04.雅思网课/04.雅思口语网课`,
    cambridgeA: `${PAN_ROOT}/05.剑雅真题（含视频讲解）/01.【真题】剑桥雅思真题A类`,
    cambridgeAudio: `${PAN_ROOT}/05.剑雅真题（含视频讲解）/01.【真题】剑桥雅思真题A类/【听力音频】剑桥雅思听力音频`,
    cambridge19: `${PAN_ROOT}/05.剑雅真题（含视频讲解）/00.《剑19》真题A+G类`,
    cambridge20: `${PAN_ROOT}/05.剑雅真题（含视频讲解）/剑桥20真题（抢先版）`,
    analysis: `${PAN_ROOT}/05.剑雅真题（含视频讲解）/02.【精讲解析】剑桥雅思真题精讲pdf`,
    speakingBank: `${PAN_ROOT}/06.2025年口语题库`,
    summary: `${PAN_ROOT}/08.总结`,
    latest: `${PAN_ROOT}/09.2026年最新资料（持续更新中）`,
  };

  return Array.from({ length: 56 }, (_, index) => {
    const day = index + 1;
    const week = Math.floor(index / 7) + 1;
    const date = addDays(start, index);
    const camBook = Math.min(20, 10 + Math.floor(Math.max(0, index - 14) / 4));
    const test = (index % 4) + 1;

    if (week <= 2) {
      return {
        day,
        date,
        phase: "基础补齐",
        tasks: [
          { title: "语法/长难句", requirement: `看语法课第${Math.min(12, day)}节，做3句长难句拆分。`, minutes: 45, path: base.grammar },
          { title: "词汇", requirement: "背核心词30个，整理5组同义替换到单词页。", minutes: 45, path: day <= 7 ? base.vocab : base.vocabBook },
          { title: "阅读方法", requirement: "看阅读题型/定位课，精读1篇短文章，不限时。", minutes: 60, path: day <= 3 ? base.intro : base.readingCourse },
          { title: "听写/口语", requirement: "语料库或听力词汇20分钟，口语题库录音1题。", minutes: 45, path: day % 2 ? base.listeningCourse : base.speakingBank },
        ],
      };
    }

    if (week <= 6) {
      return {
        day,
        date,
        phase: `真题提分 · 剑${camBook} Test ${test}`,
        tasks: [
          { title: "阅读真题", requirement: `剑${camBook} Test ${test} 阅读做1篇，20分钟限时，错题入复习页。`, minutes: 70, path: base.cambridgeA },
          { title: "听力真题", requirement: `剑${camBook} Test ${test} 听力做1个Section，记录拼写/单复数错因。`, minutes: 55, path: base.cambridgeAudio },
          { title: "写作", requirement: index % 2 ? "Task 2写主体段+结论，用写作页估分。" : "Task 1写概览+主体段，用写作页纠错。", minutes: 55, path: base.writingCourse },
          { title: "解析复盘", requirement: "只看错题解析，总结3条同义替换或定位规则。", minutes: 35, path: index % 2 ? base.analysis : base.summary },
        ],
      };
    }

    return {
      day,
      date,
      phase: week === 7 ? "模考冲刺 · 剑19" : "考前冲刺 · 剑20",
      tasks: [
        { title: "完整模考", requirement: week === 7 ? "剑19任选1套，阅读+听力严格计时。" : "剑20任选1套，阅读+听力严格计时。", minutes: 120, path: week === 7 ? base.cambridge19 : base.cambridge20 },
        { title: "写作成篇", requirement: "Task 2完整写一篇，输入写作页查看评分和纠错。", minutes: 55, path: base.writingCourse },
        { title: "口语题库", requirement: "Part 2录音1题，Part 3追问2题，复盘卡顿表达。", minutes: 35, path: week === 8 ? base.latest : base.speakingBank },
        { title: "错题回收", requirement: "复习所有到期错题、同义替换和听力场景词。", minutes: 40, path: base.summary },
      ],
    };
  });
}

function ModuleResourcePanel({ skill, subtitle }: { skill: string; subtitle: string }) {
  const track = orderedStudyTracks.find((item) => item.skill === skill);
  if (!track) return null;

  return (
    <section className="panel wide-panel module-resource-panel" style={{ borderTopColor: track.accent }}>
      <div className="module-resource-head">
        <div>
          <p className="eyebrow">Baidu Pan · 提取码 {PAN_CODE}</p>
          <h2>{skill}学习路径</h2>
          <p className="hint-text">{subtitle}</p>
        </div>
        <div className="button-row">
          <a className="primary-button link-button" href={PAN_SHARE_URL} target="_blank" rel="noreferrer">
            <ExternalLink size={18} />
            打开网盘
          </a>
          <a className="ghost-button link-button" href={panFolderUrl(PAN_ROOT)} target="_blank" rel="noreferrer">
            <FolderOpen size={18} />
            根目录
          </a>
        </div>
      </div>
      <div className="module-step-grid">
        {track.steps.map((step) => (
          <a className="module-step" key={`${track.skill}-${step.title}`} href={panFolderUrl(step.path)} target="_blank" rel="noreferrer">
            <strong>{step.title}</strong>
            <span>{step.requirement}</span>
            <small>打开资料、讲解或答案</small>
          </a>
        ))}
      </div>
    </section>
  );
}

function ResourceList({ resources }: { resources: Array<{ label: string; url: string }> }) {
  return (
    <div className="resource-list">
      {resources.map((item) => (
        <a className="resource-link" key={item.url} href={item.url} target="_blank" rel="noreferrer">
          <span>{item.label}</span>
          <ExternalLink size={16} />
        </a>
      ))}
    </div>
  );
}

function Metric({ icon: Icon, label, value, detail }: { icon: typeof Target; label: string; value: string; detail: string }) {
  return (
    <section className="metric">
      <Icon size={22} />
      <div>
        <span>{label}</span>
        <strong>{value}</strong>
        <small>{detail}</small>
      </div>
    </section>
  );
}

function EmptyState({ text }: { text: string }) {
  return <p className="empty-state">{text}</p>;
}

function calculateStreak(sessions: StudySession[]) {
  const completedDates = new Set(
    sessions.filter((session) => session.tasks.some((task) => task.done)).map((session) => session.date),
  );
  let count = 0;
  let cursor = todayISO();
  while (completedDates.has(cursor)) {
    count += 1;
    cursor = addDays(cursor, -1);
  }
  return count;
}
