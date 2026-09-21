# 申论智能研习台（Shenlun Exam OS）
## 产品需求文档 (PRD) 与 系统架构设计文档 (Architecture)

*版本：v1.0.0*  
*编制日期：2026-09-21*  
*产品定位：拒绝单次消费型线性对话，打造基于考场手写作答、采分点全真色谱穿透、个人记忆双向复利与认知病灶追踪的申论专属操作系统。*

---

# 第一部分：产品需求文档 (PRD)

## 1. 产品背景与核心使命

### 1.1 核心问题诊断：为什么通用 AI 对话框（Hermes / Codex / Claude）无法满足申论备考？
1. **单次消费与上下文失忆**：每次在聊天框提问，AI 给出一篇 2000 字的 Markdown 报告，关掉窗口知识就沉睡了；跨试卷的历史错误、高频扣分点没有任何沉淀与追踪。
2. **缺乏多维色谱穿透**：通用 AI 只能用大段文字描述“你第2段分析不够深入”，考生必须上下反复滚动文本，在脑内艰难对应；无法在一秒内看清“漏了哪个原词、哪句话是主观臆造、哪句话大白话没大词化”。
3. **记忆库单向割裂**：考生平时背诵的大量名言、政策对策，考场写作时根本想不起来；而 AI 升华重写的示范文往往辞藻华丽、大词冷僻，考生考场上根本无法复现。
4. **评分尺度飘忽与幻觉**：通用 AI 缺乏真题官方采分底稿锚定，同一篇作答在不同时间提问，评分可能相差 5~8 分，没有参考价值。

### 1.2 申论智能研习台的本质定义
**申论学习必须在真实试卷纸上手写**（键盘打字会彻底破坏考场手感与时间节奏）。本系统定位为考生纸上完成作答后的**“诊断中枢、弹药补给站与认知手术台”**。

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                               考生的完整闭环研习旅程                                   │
│                                                                                        │
│  [真实纸质答卷] ──(手写作答完成)──> [敲入系统作答框] ──(题型锚定与采分底稿关联)        │
│                                           │                                            │
│                                           ▼                                            │
│  [靶向微练习补丁] <── [认知病灶图谱] <── [全真多维色谱批改]                            │
│  (3分钟切除病灶)      (沉淀思维基因缺陷)   ├─ 🟢 原词采中 / 🟡 大词替换                 │
│         │                                 ├─ 🔴 漏采点回显 / 🟣 臆造删除线             │
│         ▼                                 └─ ⚠️ 摘抄>20%红线 / 灰色流水账              │
│  [SM-2 艾宾浩斯复习] <────────────────────┼─ 逆向检测：记忆库金句调用率                │
│  (名言/对策/避坑卡)                       └─ 示范重写：强制调用考生已背金句 (100%复现) │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. 核心功能规范与需求细则

### 2.1 模块一：作答录入与题型基准锚定 (Input & Baseline Anchor)
* **需求目标**：不搞虚拟答题纸或划线画布等外观型功能，专注极简、高效地接收考生手写后的作答文本，并锚定评分基准。
* **功能细则**：
  1. **真题/模拟题关联**：
     - 支持从内置真题库选择（国考地市/副省级、各省省考、事业单位联考 A/B/C 类）；
     - 也支持自由输入自定义题干与给定资料。
  2. **题型自动分流**：
     - **单一题（小题）**：归纳概括、提出对策、词句理解等（150~350字）；
     - **公文题（贯彻执行）**：发言稿、公开信、倡议书、简报等（300~600字）；
     - **材料大作文**：议论文/策论文（800~1200字）。
  3. **基础物理合规初扫**：
     - 实时字数检测与超限/不足预警；
     - 标点与格式硬伤前置扫描（如标题含书名号直接标红）。

---

### 2.2 模块二：不同题型的【全真多维色谱穿透比对】(Chromatographic Review)
* **需求目标**：拒绝大段纯文字报告，在考生原文和材料中建立精准的字符级高亮色谱，让失分原因瞬间具象化。

#### ① 单一题（小题）色谱规范
* 🟢 **绿色实线（精准踩点）**：命中材料原词或官方评分关键词（+对应分值）。
* 🟡 **黄色波浪线（同义替换）**：虽非原词，但准确表达了规范政务大词（如材料为“没人干事”，考生写“基层治理力量不足”）。
* 🔴 **红色虚线框（漏采点回显）**：在答案右侧或材料原文处标出：“*材料第3段关键点【资金周转链断裂】考生未提取*”。
* 🟣 **紫色删除线（主观臆造）**：材料中全无依据、考生自作聪明的散点（考官阅卷直接跳过，0 分）。

#### ② 公文题（贯彻执行）色谱规范
* 🔵 **蓝色角标（格式五要素）**：
  - 标题（是否居中、是否自拟、是否含事由）；
  - 主送/称谓（顶格、冒号、杜绝“广大...们”等机关用语语病）；
  - 发文缘由（背景/目的，按意给分）；
  - 核心主体（分类逻辑与要点覆盖）；
  - 落款署名与日期（右空四格、虚实合规）。
* 🟢 **绿色高亮**：事务性核心采分点（具体对策、倡议内容）。
* 🟠 **橙色高亮**：公文美化与口吻抓手（排比对仗小标题、诚恳/号召语气）。

#### ③ 材料大作文色谱规范
* 🟢 **绿色加粗（骨架论点）**：首段尾句总论点、正文各论证段首句分论点（核验是否包含核心主题词，是否符合“1+3”结构）。
* 🔵 **天蓝底色（深度事后深入剖析）**：因果论证、假设论证、辩证剖析的文字。
* ⚪ **灰色底色（纯故事叙述流水账）**：大段罗列案例、堆砌人名的文字。
  - *阈值预警*：若论证段中灰色流水账文字占比超过 60%，系统亮黄牌警示：**“典型论据堆砌、缺乏深析，扣 2 分”**。
* ⚠️ **黄色高亮闪烁（摘抄超标红线）**：连续摘抄材料达 15 字以上的段落，计算全文抄袭占比，若超过 **20% 警戒线**，强力提示考场扣分风险。

---

### 2.3 模块三：个人申论记忆库与双向复利闭环 (Personal Memory Bank & MAR)
* **需求目标**：让考生的日常积累真正转化为考场下笔的本能，让 AI 改写成为考生自身能力的延伸。

```
┌───────────────────────────────────────────────────────────────────────────────────────┐
│                           记忆库双向复利机制 (Two-way Loop)                          │
│                                                                                       │
│  [日常背诵与积累] ──> [个人记忆库] ──(逆向激活率审计)──> 诊断："背了为何没用出？"     │
│       ▲                    │                                                          │
│       │ (SM-2 艾宾浩斯)     ▼ (限制性注入)                                             │
│  [划词一键入库] <── [考场一类文示范] (100%基于考生记忆库金句重构，杜绝空洞大词)      │
└───────────────────────────────────────────────────────────────────────────────────────┘
```

1. **结构化卡片库**：
   - 维度：政治、经济、文化、社会、生态文明、党建与基层治理；
   - 元素：名言金句、权威论述、典型时代楷模、硬核对策模板、特色动宾小标题；
   - 算法：内置 Anki SM-2 算法，根据遗忘曲线安排每日早晨 15 分钟翻卡复习。
2. **逆向记忆激活率检测（Memory Hit Rate）**：
   - 每次批改时，系统扫描考生原文，并与考生记忆库做交叉检索；
   - 产出《记忆激活诊断》：
     - 已成功激活：*命中《新质生产力核心论述》、《产业振兴对策》*；
     - 唤醒建议：*“你明明在 9 月 12 日背过《基层形式主义三痛点》，在论证段二却使用了‘工作不认真’的大白话，下次作答建议调动该卡片！”*
3. **基于记忆库的限制性点石成金重写（100% 可复现一类文）**：
   - AI 在重构考生文章时，受到**系统硬约束**：必须优先使用考生已背熟的素材进行重塑；
   - 重构范文每处关键句旁标注卡片来源徽章（如 `[来自你的记忆库 #42]`）；
   - 确保考生读完范文后能即刻记忆并在下次考场上真正写出来。
4. **批改报告“一键划词入库”**：
   - 在批改报告或示范文中发现精彩的动宾小标题或规范表述，鼠标选中文本即可一键存入个人记忆库，自动打上对应分类标签。

---

### 2.4 模块四：跨试卷的“申论认知病灶图谱” (Diagnostic Dossier)
* **需求目标**：跨试卷追踪考生的思维基因缺陷，不再停留在单次孤立的分数涨跌。
* **功能细则**：
  1. **五大核心病灶雷达**：
     - **要素混淆率**：题干问“原因”误写成“对策”、问“表现”误写成“危害”的历史频率；
     - **材料依附度**：历次作答对材料原文的摘抄比例折线走势；
     - **论点隐蔽率**：大作文总论点未压在首段尾句、分论点未压在段首的概率；
     - **对策空心率**：对策段中只写“提高认识/加大投入/加强监管”等假大空套话的比例；
     - **论证流水账率**：事实叙述文字占比过高的频率。
  2. **顽固病灶锁定与强制预警**：
     - 连续 2 篇作答出现同类失分，系统自动将其打标为**【二级顽固病灶】**；
     - 连续 3 篇出现，自动打标为**【一级顽固病灶】**，并在下次作答页面顶部展示红字警示（如：“⚠️ 注意：你已连续 3 篇大作文总论点后置，本次必须压在首段末句！”）。

---

### 2.5 模块五：靶向微练习补丁引擎 (Remediation Drill)
* **需求目标**：拒绝“批改完就结束”的断头学习，当场针对扣分点生成 3 分钟即时切除病灶的微训练。
* **功能细则**：
  1. **大白话政务大词化补丁**：
     - 提取本次作答中被判定为“大白话”的 2~3 个原句；
     - 生成题目：*“请将你的原话‘村里没有钱，什么事都办不成’改写为 2 个 8 字以内规范动宾短语。”*
  2. **要素提炼与去粗取精补丁**：
     - 截取材料中一段长案例（200字）；
     - 要求考生在 50 字内只提炼动宾对策，当场提交，系统秒判是否剔除了案例水分。
  3. **前置小标题对仗训练**：
     - 针对考生散乱的分条，要求考生现场写出 3 个结构对称的前置小标题。

---

### 2.6 模块六：真题官方采分底稿锚定 (Ground Truth Anchor)
* **需求目标**：彻底消除通用大模型的打分幻觉与前后矛盾。
* **功能细则**：
  1. 系统本地内置/导入历年真题的**官方赋分细则表**（采分点原词、赋分分值、同义替换范围、形式分扣分标准）；
  2. 考生作答真题时，大模型**只作为信息抽取比对工具**，严格按照底稿执行采点累计与形式分扣减，打分结果附带严格的踩分溯源，前后口径绝对一致。

---

### 2.7 模块七：多名师流派切磋与中间态仲裁 (Multi-Teacher Debate)
* **需求目标**：避免被单一辅导机构或老师的模板套死，博采众长。
* **功能细则**：
  1. 同一篇材料大作文或公文，系统支持并排切换展示不同流派的批改报告：
     - **【粉笔张传响流派】**：死磕“1+3”大五段论、匀称250字段落、首段尾句总论点、对策要素落地；
     - **【周昊公文流派】**：死磕公文格式规范、去个体化原词采分；
     - **【考场阅卷员视角】**：只展现前 10 秒第一印象扫描（定档、硬伤、标题吸引力）；
  2. **考场折中公约数仲裁**：
     - 系统自动对比流派分歧，给出最优考场策略（如：“张老师建议增加对策段，周老师强调材料核心词全覆盖；建议分论点采用‘意义+对策’折中组合”）。

---

# 第二部分：系统架构设计文档 (Architecture)

## 1. 整体技术选型与拓扑架构

为确保系统的**极度轻量、零外部云服务依赖、数据绝对隐私本地化、以及对大模型 API 的高效调度**，系统采用 **Local-First 服务端/客户端一体化架构**。

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                              前端展现层 (Single Page Application)                       │
│  - 纯原生现代 JavaScript (ES6+ / Web Components / CSS Flex & Grid)                     │
│  - 零重型框架编译负担 (即开即改)，支持 PWA 离线运行                                     │
│  - 模块：作答工作区、全真色谱渲染器、Diff 对比器、记忆库抽屉、病灶图谱雷达、微补丁弹窗 │
└───────────────────────────────────────────┬────────────────────────────────────────────┘
                                            │ HTTP REST / Server-Sent Events (SSE)
┌───────────────────────────────────────────▼────────────────────────────────────────────┐
│                              应用服务层 (Python FastAPI Engine)                         │
│  ┌───────────────────────┐  ┌─────────────────────────┐  ┌───────────────────────────┐ │
│  │   API 路由与会话网关   │  │   流式事件分发器 (SSE)  │  │    任务编排器 (Pipeline)  │ │
│  └───────────┬───────────┘  └────────────┬────────────┘  └─────────────┬─────────────┘ │
│              │                           │                             │               │
│  ┌───────────▼───────────────────────────▼─────────────────────────────▼─────────────┐ │
│  │                              核心领域引擎层 (Core Domain)                          │ │
│  │                                                                                   │ │
│  │  ┌───────────────────────┐ ┌───────────────────────┐ ┌──────────────────────────┐ │ │
│  │  │  Skill 解析与加载器   │ │ 多维色谱与规则前检器  │ │ 记忆增强重构引擎 (MAR)   │ │ │
│  │  │  (SkillLoader)        │ │ (ChromaEvaluator)     │ │ (MemoryAugmentedRewriter)│ │ │
│  │  │  - 解析 SKILL.md      │ │ - 20%抄袭红线计算     │ │ - 检索考生个人记忆库     │ │ │
│  │  │  - 加载 references    │ │ - 字符偏移量 Span 提取│ │ - 强制注入考生背诵词库   │ │ │
│  │  └───────────────────────┘ └───────────────────────┘ └──────────────────────────┘ │ │
│  │  ┌───────────────────────┐ ┌───────────────────────┐ ┌──────────────────────────┐ │ │
│  │  │  认知病灶追踪引擎     │ │ 靶向微练习补丁引擎    │ │ 真题官方采分锚定器       │ │ │
│  │  │  (DossierTracker)     │ │ (RemediationEngine)   │ │ (GroundTruthAnchor)      │ │ │
│  │  │  - 统计5大基因缺陷    │ │ - 提取本次错因大白话  │ │ - 绑定官方采分点词库     │ │ │
│  │  │  - 顽固病灶打标警示   │ │ - 现场生成针对性小题  │ │ - 杜绝大模型即兴幻觉     │ │ │
│  │  └───────────────────────┘ └───────────────────────┘ └──────────────────────────┘ │ │
│  └───────────────────────────────────────┬───────────────────────────────────────────┘ │
│                                          │                                             │
│  ┌───────────────────────────────────────▼───────────────────────────────────────────┐ │
│  │                             数据持久化与检索层 (Storage & Retrieval)              │ │
│  │                                                                                   │ │
│  │  ┌─────────────────────────────────┐      ┌────────────────────────────────────┐  │ │
│  │  │    SQLite3 核心关系数据库       │      │       SQLite FTS5 全文检索引擎     │  │ │
│  │  │  - submissions / review_reports │      │  - kb_materials (历年真题与资料)   │  │ │
│  │  │  - personal_memories (SM-2卡片) │      │  - official_rubrics (官方赋分点)   │  │ │
│  │  │  - error_dossier (病灶基因库)   │      │  - personal_memories_fts (记忆检索)│  │ │
│  │  └─────────────────────────────────┘      └────────────────────────────────────┘  │ │
│  └───────────────────────────────────────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. 数据库设计 (SQLite Database Schema)

数据库文件存储于系统根目录 `data/shenlun.db`，由系统首次启动时自动建表并迁移。

```sql
-- 1. 个人记忆库表 (包含 SM-2 艾宾浩斯调度参数)
CREATE TABLE IF NOT EXISTS personal_memories (
    id TEXT PRIMARY KEY,
    category TEXT NOT NULL,          -- 政治/经济/文化/社会/生态/党建/对策/金句
    tag TEXT NOT NULL,               -- 标签：新质生产力、基层减负、人居环境
    title TEXT NOT NULL,             -- 标题或核心大词
    content TEXT NOT NULL,           -- 金句原文或对策内容
    source TEXT DEFAULT '自主背诵',   -- 来源：张传响讲义/周昊公文/真题范文
    repetitions INTEGER DEFAULT 0,   -- 连续成功复习次数
    interval INTEGER DEFAULT 0,      -- 当前复习间隔天数
    ease REAL DEFAULT 2.5,           -- 难度系数因子
    next_review INTEGER NOT NULL,    -- 下次复习时间戳 (ms)
    created_at INTEGER NOT NULL
);

-- 2. 记忆库全文检索虚拟表 (FTS5)
CREATE VIRTUAL TABLE IF NOT EXISTS personal_memories_fts USING fts5(
    title,
    tag,
    category,
    content,
    tokenize = 'unicode61'
);

-- 3. 真题题库与官方采分底稿表 (消除大模型打分幻觉的核心底稿)
CREATE TABLE IF NOT EXISTS official_questions (
    id TEXT PRIMARY KEY,
    source_exam TEXT NOT NULL,       -- 例：2026年国考副省/2025年江苏省考
    question_type TEXT NOT NULL,     -- single / official_doc / essay
    question_title TEXT NOT NULL,    -- 题干要求
    limit_words INTEGER,             -- 限字数
    materials TEXT NOT NULL,         -- 给定资料
    ground_truth_rubric TEXT NOT NULL, -- JSON格式的官方标准采分点清单及分值
    created_at INTEGER NOT NULL
);

-- 4. 考生作答记录表
CREATE TABLE IF NOT EXISTS submissions (
    id TEXT PRIMARY KEY,
    question_id TEXT,                -- 关联 official_questions(id)，可为空(自定义题)
    question_type TEXT NOT NULL,     -- single / official_doc / essay
    question_title TEXT NOT NULL,
    materials TEXT,
    user_answer TEXT NOT NULL,
    word_count INTEGER NOT NULL,
    created_at INTEGER NOT NULL
);

-- 5. 批改综合报告表
CREATE TABLE IF NOT EXISTS review_reports (
    id TEXT PRIMARY KEY,
    submission_id TEXT NOT NULL,
    total_score REAL NOT NULL,
    grade TEXT NOT NULL,             -- 一类文 / 二类文 / 三类文 / 四类文
    radar_json TEXT NOT NULL,        -- JSON: {立意: 12, 结构: 8, 论据: 9.5, 文风: 4.5}
    perspectives_json TEXT NOT NULL, -- JSON: 包含张传响/周昊/考官多视角报告
    chroma_spans_json TEXT NOT NULL, -- JSON: 字符级色谱标注数组
    memory_audit_json TEXT NOT NULL, -- JSON: 记忆库激活率审计结果
    rewritten_exemplar TEXT NOT NULL,-- 结合考生记忆库重写的可复现一类文
    created_at INTEGER NOT NULL,
    FOREIGN KEY(submission_id) REFERENCES submissions(id)
);

-- 6. 考生认知病灶基因库 (跨试卷追踪)
CREATE TABLE IF NOT EXISTS error_dossier (
    id TEXT PRIMARY KEY,
    submission_id TEXT NOT NULL,
    error_dimension TEXT NOT NULL,   -- 要素混淆 / 材料依附 / 论点后置 / 对策虚化 / 流水账
    error_code TEXT NOT NULL,        -- 细分代码：ERR_ELEMENT_MISMATCH, ERR_COPY_EXCEED_20
    severity TEXT NOT NULL,          -- warning / level_2 / level_1_critical (顽固病灶)
    quote_text TEXT,                 -- 考生犯错原句
    diagnosis TEXT NOT NULL,         -- 诊断说明
    cleared INTEGER DEFAULT 0,       -- 是否已被微练习治愈
    created_at INTEGER NOT NULL
);

-- 7. 靶向微练习补丁表
CREATE TABLE IF NOT EXISTS remediation_drills (
    id TEXT PRIMARY KEY,
    submission_id TEXT NOT NULL,
    error_id TEXT NOT NULL,
    drill_type TEXT NOT NULL,        -- 大白话大词化 / 要素压缩 / 小标题对仗
    question_text TEXT NOT NULL,     -- 靶向题目
    user_answer TEXT,                -- 考生当场提交答案
    is_passed INTEGER DEFAULT 0,     -- 是否通过
    ai_feedback TEXT,
    created_at INTEGER NOT NULL
);
```

---

## 3. 核心算法与数据协议规范

### 3.1 字符级多维色谱标注协议 (Span Annotation Protocol)
为了让前端能在考生作答文本上精确画出“绿色实线、黄色波浪线、红色虚线框、紫色删除线、灰色流水账”，后端统一返回标准化的 `chroma_spans` 结构：

```json
[
  {
    "start": 0,
    "end": 16,
    "type": "title_correct",
    "color": "green",
    "style": "solid",
    "label": "高分对仗标题",
    "comment": "16字对仗工整，准确包含核心主题词‘乡村振兴’"
  },
  {
    "start": 142,
    "end": 178,
    "type": "main_thesis",
    "color": "green",
    "style": "bold_underline",
    "label": "总论点",
    "comment": "准确置于首段最后一句，符合张传响考场阅卷10秒扫描规范"
  },
  {
    "start": 210,
    "end": 285,
    "type": "story_narrative_leak",
    "color": "gray",
    "style": "background",
    "label": "纯叙述流水账",
    "comment": "连续75字罗列张某个人经历，缺少事后深入制度剖析，建议压缩至30字"
  },
  {
    "start": 412,
    "end": 448,
    "type": "copy_redline",
    "color": "yellow",
    "style": "blink_border",
    "label": "摘抄超标",
    "comment": "直接摘抄材料第4段达36字，全篇累计摘抄率已达24.5%，触犯>20%扣分红线"
  },
  {
    "start": 620,
    "end": 632,
    "type": "colloquial_flaw",
    "color": "purple",
    "style": "strikethrough",
    "label": "大白话",
    "comment": "‘大家都不想干这活’属于口语化聊天表达，应转为政务大词‘群众参与积极性不足’"
  }
]
```

---

### 3.2 逆向记忆激活率审计算法 (Reverse Memory Audit Engine)
```python
def audit_memory_activation(user_text: str, memories: List[MemoryItem]) -> Dict[str, Any]:
    """
    审计考生是否在本次写作中调用了自己的背诵积累
    """
    activated = []
    missed_opportunities = []
    
    # 对考生作答分句/分词提取主题特征
    topic_keywords = extract_semantic_tags(user_text)
    
    for mem in memories:
        # 1. 严格字面或高度同义覆盖判定为已激活
        if mem.title in user_text or mem.key_phrase in user_text:
            activated.append({
                "memory_id": mem.id,
                "title": mem.title,
                "category": mem.category,
                "matched_snippet": extract_context_window(user_text, mem.key_phrase)
            })
        else:
            # 2. 属于相同主题领域（如基层治理），且用户文章出现了大白话对策，但未调动已背卡片
            if mem.tag in topic_keywords and has_colloquial_countermeasure(user_text, mem.tag):
                missed_opportunities.append({
                    "memory_id": mem.id,
                    "title": mem.title,
                    "category": mem.category,
                    "content": mem.content,
                    "advice": f"你在本次作答中论及【{mem.tag}】时表述较空，本可直接引用你已背熟的卡片《{mem.title}》"
                })
                
    activation_rate = len(activated) / max(len(activated) + len(missed_opportunities), 1)
    return {
        "activation_rate": round(activation_rate, 2),
        "activated_count": len(activated),
        "activated_items": activated,
        "missed_items": missed_opportunities[:3] # 挑最典型的3个提醒
    }
```

---

### 3.3 限制性点石成金重写工作流 (Memory-Augmented Rewriter - MAR)

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                          一类文升华重构工作流 (Prompt 组装)                            │
│                                                                                        │
│  [考生原文思路与素材] + [材料核心采分点] + [考生记忆库召回素材 (Top-K 已背卡片)]        │
│                                       │                                                │
│                                       ▼                                                │
│                    ┌───────────────────────────────────────┐                           │
│                    │         LLM 强约束指令引擎            │                           │
│                    │ 1. 100%保留考生立意主线，严禁推倒另起 │                           │
│                    │ 2. 论点必须使用"1+3"严整大五段结构    │                           │
│                    │ 3. 强制在论证段注入考生背过的卡片内容 │                           │
│                    │ 4. 关键重构句标注 [记忆库 #ID] 角标   │                           │
│                    └───────────────────┬───────────────────┘                           │
│                                        │                                               │
│                                        ▼                                               │
│                     [100% 可复现的考场标杆一类文示范]                                  │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 4. API 接口规范与契约设计

系统提供高内聚、易于前端消费的 REST API 与 SSE 实时通道：

### 4.1 作答与批改接口
* `POST /api/submissions`
  - **请求体**：
    ```json
    {
      "question_id": "gk_2025_01",
      "question_type": "essay",
      "question_title": "以绿色转型赋能高质量发展",
      "materials": "给定资料...",
      "user_answer": "考生纸面手写后录入的文本..."
    }
    ```
  - **返回**：`{"submission_id": "sub_1001", "word_count": 1052}`
* `POST /api/review/run`（支持 SSE 流式推流）
  - **返回流**：
    - `event: pre_scan` -> 返回字数、标题格式、摘抄率红线前检；
    - `event: chroma_spans` -> 返回字符级多维色谱高亮数组；
    - `event: multi_perspectives` -> 返回张传响/周昊/考官多视角报告；
    - `event: memory_audit` -> 返回记忆库激活率审计；
    - `event: exemplar` -> 返回限制性重写一类文示范；
    - `event: remediation` -> 返回 3 道靶向微练习题目。

### 4.2 个人记忆库管理接口
* `GET /api/memories?category=生态文明` -> 列出卡片
* `POST /api/memories` -> 录入新卡片（支持划词入库）
* `POST /api/memories/{id}/review` -> 提交 SM-2 翻卡复习反馈（rating: 1=遗忘, 2=良好, 3=秒答）
* `GET /api/memories/due` -> 获取今日到期需背诵卡片清单

### 4.3 认知病灶与微练习接口
* `GET /api/dossier/stats` -> 获取 5 大病灶历史发生率与顽固病灶清单
* `POST /api/drills/{id}/submit` -> 提交 3 分钟微练习答题，即刻判定是否切除病灶

---

## 5. 项目工程结构设计 (Directory Structure)

在 `E:/work/exam/shenlun-ai` 下建立的标准项目拓扑：

```
E:/work/exam/shenlun-ai/
├── data/
│   ├── shenlun.db                # SQLite 核心数据库文件
│   └── rubrics/                  # 历年真题官方采分底稿 JSON
├── skills/                       # 动态名师 Skill 仓库 (兼容 Hermes/Claude 规范)
│   ├── shenlun-essay-review/     # 张传响材料作文批改专家
│   ├── shenlun-gongwen-review/   # 周昊公文题判分专家
│   └── shenlun-single-question/  # 单一题采点专家
├── src/
│   ├── __init__.py
│   ├── config.py                 # 大模型 API Key / Base URL / 端口配置
│   ├── models.py                 # Pydantic 数据实体定义
│   ├── db.py                     # SQLite 访问与 FTS5 检索封装
│   ├── skill_loader.py           # Skill 动态解析与装载器
│   ├── chroma_engine.py          # 多维色谱高亮与跨距标注引擎
│   ├── memory_engine.py          # 个人记忆库管理、SM-2 调度与逆向审计
│   ├── dossier_tracker.py        # 认知病灶图谱与思维基因缺陷追踪器
│   ├── remediation_engine.py     # 3分钟靶向微练习补丁生成器
│   ├── evaluator.py              # 多名师协同评审编排器
│   ├── api.py                    # FastAPI 路由控制器
│   └── server.py                 # 主服务入口 (uvicorn)
├── web/                          # 纯原生前端 SPA 工作台
│   ├── index.html                # 主页面结构
│   ├── styles.css                # 现代极简考场风格样式
│   ├── app.js                    # 交互、色谱渲染、Diff对比、微练习弹窗
│   ├── sm2.js                    # 前端 SM-2 辅助算法
│   └── manifest.json             # PWA 离线桌面配置
├── tests/                        # 完备的 TDD 单元测试集
│   ├── test_db.py
│   ├── test_skill_loader.py
│   ├── test_chroma_engine.py
│   ├── test_memory_engine.py
│   ├── test_dossier.py
│   └── test_api.py
├── requirements.txt
├── pytest.ini
└── start.bat                     # Windows 一键启动批处理脚本
```

---

## 6. 实施路线图与交付计划 (Roadmap)

| 阶段 | 周期 | 核心里程碑 | 验收标准 |
| :--- | :--- | :--- | :--- |
| **Phase 1: 底座与存储** | Day 1 | SQLite 数据库、FTS5 虚拟表、Pydantic 实体、TDD 基础库 | `pytest tests/test_db.py` 全部绿色通过 |
| **Phase 2: 规则与色谱** | Day 2 | 题型专属色谱跨距算法、20%摘抄红线检测、格式合规前检 | `test_chroma_engine.py` 准确输出字符 offset 标注 |
| **Phase 3: 记忆与重写** | Day 3 | 记忆库 CRUD、SM-2 调度、逆向激活率审计、限制性重写 Prompt 编排 | 成功根据考生记忆库生成带来源角标的一类文 |
| **Phase 4: 病灶与补丁** | Day 4 | 认知病灶图谱追踪、顽固病灶预警、3分钟微练习靶向生成器 | 提交作答后自动产出 3 道大白话转大词微练习 |
| **Phase 5: 服务与前端** | Day 5 | FastAPI 路由、纯前端 SPA 工作台（色谱渲染器、Diff对比、卡片抽屉） | 在浏览器中实现完整“纸上手写录入->多维色谱->记忆复利->微练习”闭环 |
| **Phase 6: 联调与验收** | Day 6 | 挂载张传响、周昊真实真题，全链路压力测试与端到端验收 | 产出一篇真题深度批改示范，验证打分严谨性与复现度 |
