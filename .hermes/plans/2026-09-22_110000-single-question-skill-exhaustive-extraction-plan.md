# 申论单一题批改规则逐行逐页完整提炼实施计划

## Goal
构建一套自动化切片对齐与逐行逐页深度萃取管线，全面提炼 6 套国考地市级/行政执法卷全部 14 道单一题中的审题定性、材料段落正反过滤、政务大词提炼、字数驱动排版、对策反推边界与真实考场采点给分规则，生成生产级单一题批改 Skill 矩阵。

---

## Current Context / Assumptions
1. **输入素材完备性**：
   - 物理路径 `D:\BaiduNetdiskDownload\申论-skill提炼材料\` 下存有 4 个完整资料夹：
     - `[题目讲解]`（6 份 `.doc` 实际为 zip/docx 格式讲稿，每份约 4.6万～5.3万字，总计约 30 万字教师真实录屏逐字讲稿）；
     - `[题目复盘]`（6 份 `.docx`，包含全题型审题要素剖析、给定资料逐段找点与废段判定逻辑）；
     - `[评分参考]`（5 份 `.docx`，包含按 1 分/2 分细拆的官方采分点明细与分值分配）；
     - `[套题答案]`（6 份 `.docx`，包含高分参考范本）。
2. **单一题范围锁定**：
   - 本阶段严格聚焦**单一题（归纳概括、单要素分析、词句理解、单一对策、复合要素对策/成效题）**，排除大公文题（讲话稿、提案完整格式）与大作文（议论文）。
   - 经扫描，6 套真题共包含 **14 道代表性单一题**：
     - **套题 1（2025地市）**：第 1 题（生态实践智慧做法归纳，10分/200字）；第 2 题（政企良性互动协同机制，15分/300字）；第 3 题（林票成效与深化建议，20分/450字）。
     - **套题 2（2024地市）**：第 1 题（三条黄河内涵与协同机制，15分/350字）；第 2 题（划线句子理解，10分/300字）；第 4 题（数据标注企业问题与建议，20分/400字）。
     - **套题 3（2023执法）**：第 1 题（高科技企业与新兴产业做法，10分/200字）；第 2 题（总工会服务新格局做法，15分/300字）。
     - **套题 4（2022执法）**：第 1 题（耀然灯饰成功经验，10分/200字）；第 2 题（网民议论问题与说明归类，20分/400字）；第 3 题（小李两难心态原因与对策，15分/350字）。
     - **套题 5（2021执法/地市）**：第 1 题（GEP核算做法，10分/200字）；第 4 题（知识产权服务案例摘要，15分/300字）。
     - **套题 6（2020地市）**：第 2 题（两省向南河共治经验做法，15分/300字）；第 3 题（数字游民社区原因分析，15分/300字）；第 4 题（农家乐重新乐起来对策，20分/350字）。
3. **技术栈与交付宿主**：
   - 提取工具链：Python 3.11（内置 `zipfile` / `xml.etree.ElementTree` / `re` / `json`）。
   - 交付目标宿主 A（Hermes 系统级 Skill）：`C:\Users\10200\AppData\Local\hermes\skills\exam\shenlun-single-question-review\`。
   - 交付目标宿主 B（系统解耦服务 Skill）：`server/skills/shenlun-single-expert/`。
   - 交付目标宿主 C（前端静态库）：`web/data/skills/skills.json`（由 `scripts/export_skills_kb.py` 导出）。

---

## Architecture / Proposed Approach
传统粗放式大模型提炼会严重遗漏名师在长达数小时视频讲稿中透露的段落取舍、微观踩点尺度与字数妥协逻辑；本方案采取**“四轨同构切片对齐 -> 五维微切片逐行逐页语义标注 -> 跨套题归纳聚类 -> 三端 Skill 矩阵封装验证”**的闭环流水线。
首先编写确定性 Python 预处理器，从 30 万字讲稿与复盘文档中把 14 道单一题切块并与官方采分点、复盘思考、参考答案四轨对其并落盘为独立语料；接着按“审题定性、字数格式红线、段落正反过滤、大词升华同义库、考官给分心理”5 个标准切片开展逐行逐页规则抽取；最后汇总产出系统性单一题阅卷规则手册与 14 套真题全要素基准案卷库。

```
Raw Multi-Modal Data Sources (4 Folders)
 ├── 题目讲解 (.doc/zip, ~300k chars)
 ├── 题目复盘 (.docx, 6 files)
 ├── 评分参考 (.docx, 5 files)
 └── 套题答案 (.docx, 6 files)
             │
             ▼ [Phase 1: Deterministic Slicing & Tri-Doc Alignment]
14 Single-Question Aligned Data Ledgers (data/single_question_corpus/*.json)
   ├── prompt & word limits
   ├── gold_rubric (sub-points & weights)
   ├── mentor_review (paragraph breakdown)
   └── verbatim_lecture_slice (full speech text)
             │
             ▼ [Phase 2: Line-by-Line & Segment Semantic Extraction]
Structured Micro-Rule Assertions (5 Standard Dimensions)
   ├── [A] Question Prompt & Element Classification
   ├── [B] Word-Count Thresholds & Heading Decision Matrix
   ├── [C] Paragraph-by-Paragraph Hunting & Signal/Noise Filtering
   ├── [D] Government Lexicon Distillation & Synonyms Equivalence
   └── [E] Real Examiner 8-15s Cognitive Double-Check & Point Rubric
             │
             ▼ [Phase 3: Synthesis & Skill Artifact Generation]
Production-Ready Skill Architecture
   ├── SKILL.md (Core review engine & prompt contract)
   ├── references/material-filtering-heuristics.md (材料逐段寻点与正反过滤)
   ├── references/single-question-taxonomy.md (单一题八大要素与变体题型定性)
   ├── references/word-budget-and-formatting.md (字数红线与小标题取舍准则)
   ├── references/synonym-and-lexicon-handbook.md (采分点大词化与同义词库)
   ├── references/inferred-measures-boundary.md (问题反推对策合理性判别法)
   └── references/14-exam-ground-truth-corpus.md (14道真题官方采分点全对齐案例库)
             │
             ▼ [Phase 4: Sync, Test & Build]
Hermes Skill + Server Skill + Web Static Export + Automated Pytest
```

---

## Step-by-Step Tasks

### Task 1: 编写四轨切片对齐提取脚本并生成 14 道单一题独立语料台账
- **文件路径**：`scripts/extract_single_question_corpus.py`
- **目标**：从 `D:\BaiduNetdiskDownload\申论-skill提炼材料\` 的 4 个目录中读取 Word 文件，准确识别并切片出全部 14 道单一题的内容，组装为标准化 JSON 语料文件，落盘到 `data/single_question_corpus/`。
- **具体实现**：
  - 用 Python 标准库 `zipfile` + `xml.etree.ElementTree` 稳健读取所有 `.docx` 与命名为 `.doc` 的 zip-xml 讲稿文件。
  - 根据正则切分题干，匹配题号与题型特征，提取题干要求、评分参考采分点、复盘材料逐段剖析，以及讲稿中对应的完整讲解段落。
  - 针对 14 道单一题分别生成：
    - `data/single_question_corpus/set1_q1_grape.json`（宣化葡萄园生态实践智慧）
    - `data/single_question_corpus/set1_q2_water.json`（政企良性互动治水）
    - `data/single_question_corpus/set1_q3_forest.json`（林票成效与建议）
    - `data/single_question_corpus/set2_q1_yellow_river.json`（三条黄河协同机制）
    - `data/single_question_corpus/set2_q2_industry_quote.json`（不是产业竟是产业理解）
    - `data/single_question_corpus/set2_q4_data_label.json`（数据标注问题与建议）
    - `data/single_question_corpus/set3_q1_hightech.json`（A市高科技新兴产业做法）
    - `data/single_question_corpus/set3_q2_union.json`（S市工会服务新格局做法）
    - `data/single_question_corpus/set4_q1_lighting.json`（耀然灯饰成功经验）
    - `data/single_question_corpus/set4_q2_folkmusic.json`（新民乐走红问题归类说明）
    - `data/single_question_corpus/set4_q3_dilemma.json`（小李两难原因与走出困境对策）
    - `data/single_question_corpus/set5_q1_gep.json`（GEP核算做法）
    - `data/single_question_corpus/set5_q4_ip_summary.json`（知识产权服务案例摘要）
    - `data/single_question_corpus/set6_q2_river_gov.json`（两省治理向南河经验）
    - `data/single_question_corpus/set6_q3_nomad.json`（数字游民社区原因）
    - `data/single_question_corpus/set6_q4_agritainment.json`（农家乐重新乐起来对策）
- **验证命令**：
  ```bash
  python scripts/extract_single_question_corpus.py
  ```
- **预期输出**：
  ```
  ✓ 成功提取并对齐 16 个单一题子卷语料到 data/single_question_corpus/
  ✓ 每个语料均包含 prompt, word_limit, score, gold_answer, mentor_review, lecture_transcript
  ```

---

### Task 2: 建立自动化微切片语义抽取器（按五维提取模型逐行逐页深挖）
- **文件路径**：`scripts/mine_single_question_rules.py`
- **目标**：对 `data/single_question_corpus/*.json` 中的讲稿文本和复盘文本，按照名师逐行逐页剖析材料的脉络，自动抽取五大核心维度的细粒度规则，输出结构化规则条目：
  1. `question_understanding_rules`:
     - 题干指令（“体现在哪些方面”=做法；“是如何实现的”=做法机制；“谈谈理解”=内涵+表现+启示；“有哪些问题并予以简要说明”=核心问题归类+具体说明）。
  2. `word_limit_and_layout_rules`:
     - 200字以内短题：**严禁加独立小标题**（小标题占用宝贵字符导致采分实词丢失，直接以 `1. 2. 3.` 罗列核心动宾短语与材料实词）。
     - 300~400字题目 / 明文要求“归类合理、条理清晰”：**必须加 4~8 字前置动宾短语作为小标题并加粗**，支撑考官 8 秒快速勾选得分点。
     - 复合要素题（成效+建议 / 原因+对策 / 问题+建议）的版面比例法则：成效/原因/问题占 35%~40%，对策/建议占 60%~65%。
  3. `paragraph_filtering_rules`（材料逐段寻点与正反过滤）：
     - 背景段过滤特征：宏观历史演进、泛泛铺垫（如城市车水马龙、万龙河水清澈等画面描摹），判为废段；
     - 案例段转化特征：具体人名（如张某）、投资数字（如200万）、具体农产品名字，须剔除案例枝节，提炼上位政务表述；
     - 总结段过滤特征：前瞻性、号召性口号（如“下一步我们还将继续…”）若题干问的是已取得的成效或已有经验，一律剔除。
  4. `lexicon_and_synonym_rules`（采分词规范化与同义替换标准）：
     - 动宾搭配提炼模板：`规范动词`（健全、拓展、搭建、强化、规范、深化）+ `核心名词`（制度体系、资金渠道、智慧平台、人才支撑）。
     - 阅卷采分容错与同义认可清单（例如“修旧如旧/保留原貌/突出青红瓦”等价给分；“反推对策合理即可给分”的判分边界）。
  5. `examiner_cognition_and_scoring_rules`（考官阅卷心理与批改尺度）：
     - 8~15 秒机器辅助双评；
     - 评分公式：实得分 = 内容采分点得分（75%~85%） + 结构条理分（15%~25%） - 扣分项；
     - 给分铁律：以点给分，宁多勿少，答对给分，不倒扣分。
- **验证命令**：
  ```bash
  python scripts/mine_single_question_rules.py
  ```
- **预期输出**：
  ```
  ✓ 成功提炼 16 个试题语料的五维微观规则
  ✓ 生成中间规则库 data/mined_rules_aggregated.json
  ```

---

### Task 3: 提炼与产出《材料逐段寻点与正反过滤实战手册》（Material Hunting & Noise Filtering）
- **文件路径**：`server/skills/shenlun-single-expert/references/material-filtering-heuristics.md`
- **目标**：将名师讲稿与复盘中逐段评讲“为什么这一段选、为什么那一段不选”的实操经验完整系统化，成为 AI 批改与试卷诊断的核心过滤引擎。
- **核心章节**：
  1. **材料段落四分法模型**：
     - **背景引入段**：识别特征（宏观历史背景、政策号召、自然环境风貌）与跳读过滤规则；
     - **典型案例段**：案例要素（主体、数字、过程、琐碎细节）向规范政务行为的“剥洋葱”提炼算法；
     - **观点与领导讲话段**：专家观点、领导批示、群众反映中的隐性要点抓取准则；
     - **工作推进与总结段**：现状做法 vs 下一步展望的要素边界判定。
  2. **14 道国考真题逐段取舍实证全景对照表**：
     - 列出每道真题材料第 1 段至第 N 段老师的明确批注（例如：宣化葡萄园第1段背景特例提取、第2段优点略过、第5段描述语言不用写、第12段下一步做法因属总结不提炼）。
  3. **AI 批改诊断映射**：
     - 考生将“案例细节/背景数据”大段抄入答案的扣分诊断逻辑；
     - 考生漏掉“转折后核心实词”或“尾段隐藏对策”的病灶透视逻辑。

---

### Task 4: 提炼与产出《字数红线与小标题决策矩阵》（Word Budget & Layout Heuristics）
- **文件路径**：`server/skills/shenlun-single-expert/references/word-budget-and-formatting.md`
- **目标**：彻底解决申论单一题“要不要写小标题、要不要总括句、双要素如何分栏”等长期模糊、考生极易失分的痛点。
- **核心内容规范**：
  1. **三档字数极限排版决策树**：
     - **≤200字极限短题**（如宣化葡萄园、耀然灯饰、GEP核算）：
       - 规则：**坚决不写独立前置小标题**！总括句控制在 10 字以内或直接省去，全篇采用 `1. 2. 3. 4.`，文字密度拉满，直接输出“动宾短语+材料实词”。
     - **250～350字常规题**（如合力治水、三条黄河、总工会新格局）：
       - 规则：**必须配备 4～8 字精炼前置词**。总括句独立或紧跟第1点，采用 `1.【前置动宾短语】+ 展开支撑实词` 格式。
     - **≥400字长题 / 明文要求“归类合理”**（如新民乐走红议论归类、数据标注问题与建议）：
       - 规则：**强制要求 MECE 分类与层次化小标题**。每个大分类必须有上位概括词，各分条之间不得有交叉重叠。
  2. **复合多要素单一题篇幅黄金分割率**：
     - 成效+建议（如林票2.0）：成效占 35%（约 150 字），深化建议占 65%（约 300 字）；
     - 问题+建议（如数据标注）：问题占 40%（约 160 字），发展建议占 60%（约 240 字）；
     - 原因+对策（如小李两难）：原因占 45%（约 150 字），化解对策占 55%（约 200 字）。
  3. **阅卷人视角版面失分红线**：
     - 未分条列项（成坨作答）：直接扣 2~3 分形式分；
     - 200字题盲目写小标题导致后半截采分点无法写出：直接损失 3~5 分内容分；
     - 复合题只答一问或各占一半导致对策单薄：扣 3~4 分权重分。

---

### Task 5: 提炼与产出《采分点大词化与同义替换速查词典》（Lexicon & Synonym Handbook）
- **文件路径**：`server/skills/shenlun-single-expert/references/synonym-and-lexicon-handbook.md`
- **目标**：构建单一题官方评分标准级别的政务大词提炼库，明确大模型在打分时判定“踩中、同义替换、部分踩中、脱离材料臆造”的客观判定尺度。
- **核心内容规范**：
  1. **真题采分动宾大词库（按政务职能聚类）**：
     - **机制体制类**：完善协调机制、健全联动网络、理顺权责清单、推行闭环管理、共商统一标准；
     - **要素保障类**：强化人才支撑、拓宽融资渠道、争取专项补贴、配备先进设备、打造专业团队；
     - **科技赋能类**：搭建智慧平台、开展同步仿真、研发指挥系统、推进数据采集、强化数字监测；
     - **产业与市场类**：延长产业链条、打造特色品牌、降低投资门槛、盘活存量资产、培育新兴业态；
     - **监管与服务类**：优化审批流程、简化贷款程序、实行双人双锁、加强行业准入、建立投诉响应。
  2. **同义替换等价给分判定表**：
     - 从 14 道真题 5 份评分参考中提取 80+ 组考场认可的同义词对（如“修旧如旧 = 保留风貌 = 原址修缮”；“拓宽融资渠道 = 多方筹措资金 = 引入社会资本”；“提升技能 = 开展专项培训 = 增强专业水准”）。
  3. **反推对策的合理性给分边界（Inferred Countermeasures Boundary）**：
     - 严格界定何时允许反推对策（材料只有问题、且题干要求提出建议时）；
     - 合理给分标准：“主体明确 + 动宾针对痛点 + 逻辑闭环”可给满分；泛泛空谈“加强思想建设”不给分。

---

### Task 6: 提炼与产出《14 道国考真题全要素基准案卷库》（Ground-Truth Corpus）
- **文件路径**：`server/skills/shenlun-single-expert/references/14-exam-ground-truth-corpus.md`
- **目标**：将 6 套题 14 道单一题整理为完全对齐的标杆案卷库，作为大模型批改调优、Few-shot 示范以及系统端到端测试的标准基准数据。
- **案卷条目结构**：
  每道题严格包含：
  - `【题干与要求】`：题目、分值、字数、命题任务；
  - `【要素定性】`：八大要素分类归属；
  - `【材料逐段寻点指引】`：段落废/存分析，核心关键词定位；
  - `【官方量化采分表】`：前置词分值、展开词分值、赋分关键词清单；
  - `【考场标杆范本】`：符合字数红线的满分答卷；
  - `【典型易错病灶剖析】`：考官阅卷中考生最常见的 3 处失分点。

---

### Task 7: 重构与升级核心批改 Skill 规范（SKILL.md）
- **文件路径**：
  - 主文件 A：`server/skills/shenlun-single-expert/SKILL.md`
  - 主文件 B：`C:\Users\10200\AppData\Local\hermes\skills\exam\shenlun-single-question-review\SKILL.md`
- **目标**：将 Task 3~6 萃取出的全套批改智慧融合进现有的 `SKILL.md`，使其具备考官级 8~15 秒快速定档、五维诊断、字数排版自适应、采点精准赋分以及满分重塑能力。
- **核心结构与提示词更新**：
  1. YAML Frontmatter 维护标准元数据与关联引用；
  2. 第一部分：**考场阅卷心智模型与采点赋分法则**（机器双评、分值切分比、不倒扣分）；
  3. 第二部分：**字数红线驱动的作答与排版自适应规则**（≤200字禁小标题，≥300字强小标题）；
  4. 第三部分：**材料段落正反过滤与去粗取精机制**；
  5. 第四部分：**采分点地毯式对齐表生成规范**（采分点、分值、考生原句、判定、实得、失分根因）；
  6. 第五部分：**五维病灶深度诊断框架**（审题定性、找点全面、提炼概括、分类逻辑、表达规范）；
  7. 第六部分：**考场满分标杆范本重构准则**（严格基于考生原思路点石成金，卡死字数红线）；
  8. 第七部分：**关联引用文档索引（references/）**。

---

### Task 8: 运行 Skill 静态导出与双端同步验证
- **文件路径**：`scripts/export_skills_kb.py` 与 `server/tests/test_single_question_skill_extraction.py`
- **目标**：编写自动化验证测试，校验 Skill 的完整性、引用有效性与无缝加载，并更新前端静态技能库 `web/data/skills/skills.json`。
- **测试用例设计**：
  - `test_skill_markdown_integrity()`: 校验 `SKILL.md` 包含 YAML 头且 metadata 齐全；
  - `test_references_files_exist_and_not_empty()`: 校验 `references/` 下 4 个新文件全部存在且字数 > 1500 字；
  - `test_14_exam_cases_coverage()`: 校验 14 道真题全部在案卷库中有完备覆盖；
  - `test_export_skills_kb()`: 校验导出工具能够正常输出 `web/data/skills/skills.json` 且大小增加。
- **验证命令**：
  ```bash
  pytest server/tests/test_single_question_skill_extraction.py -v
  python scripts/export_skills_kb.py
  ```
- **预期输出**：
  ```
  collected 4 items
  server/tests/test_single_question_skill_extraction.py::test_skill_markdown_integrity PASSED
  server/tests/test_single_question_skill_extraction.py::test_references_files_exist_and_not_empty PASSED
  server/tests/test_single_question_skill_extraction.py::test_14_exam_cases_coverage PASSED
  server/tests/test_single_question_skill_extraction.py::test_export_skills_kb PASSED
  ✓ 成功导出 3 个官方中立阅卷规范到: web/data/skills/skills.json
  ```

---

## Tests / Validation
1. **语料完整性测试**：
   - 运行 `python -c "import json, glob; files = glob.glob('data/single_question_corpus/*.json'); assert len(files) == 16; print('Corpus count verified:', len(files))"` 确保 16 个单一题切片无一遗漏。
2. **知识引用链与解耦测试**：
   - 运行项目现有测试集：
     ```bash
     pytest server/tests/test_skill_decoupling.py server/tests/test_api.py -v
     ```
   - 确保原有的 API 评测与 Skill 解耦机制在注入强化版单一题 Skill 后 100% 保持通过。
3. **前端兼容测试**：
   - 检查 `web/data/skills/skills.json` 中的 `shenlun-single-expert` 提示词内容是否完整包含五步法、排版规则与参考标准。

---

## Risks, Tradeoffs, and Open Questions
1. **风险：讲稿文字中口语化断句与口误干扰**
   - *应对方案*：四轨对齐策略中，始终以 `[套题答案]` 和 `[评分参考]` 的文字作为客观锚点，讲稿文本作为“思路与因果解释器”，由脚本过滤无意义口头禅（如“同学们”、“哈”、“这个这个”）。
2. **权衡：大模型上下文容量 vs 细粒度规则注入**
   - *权衡考量*：如果在系统提示词中一次性填塞 14 道真题的所有全文，会导致 API 消耗激增并稀释指令遵从度。
   - *解决方案*：采用系统既有的分层解耦架构，核心 `SKILL.md` 承载通用的五维诊断流程、字数红线决策树与赋分模型；微观真题案卷与词典下沉到 `references/`，由前端或后端按需召回。
3. **开放问题**：
   - 是否需要为事业单位统考《综合应用能力》（A/B/C类）定制针对性的单一题微调参数？（答：可在后续 Phase 2 基于公务员国考地市级单一题主干体系平滑延展）。
