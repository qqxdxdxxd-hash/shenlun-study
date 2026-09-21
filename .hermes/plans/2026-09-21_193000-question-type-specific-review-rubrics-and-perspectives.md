# 题型自适应评分量规与考官判语架构改造实施计划

> **目标**：彻底解决单一题（归纳概括/对策）与公文题（贯彻执行）在批改时被机械套用议论文【大五段骨架与对策论证诊断】及大作文四维评分维度的缺陷，建立**题型自适应的评审量规体系（大作文：大五段四维 / 单一题：采点给分四维 / 公文题：格式内容文风三轨四维）**，并在 Prompt 指引、评分明细表、指标卡片与名师视角标题上实现完全自适应精准诊断。

---

## 1. 背景与现状分析 (Context & Current Baseline)

### 1.1 现状硬伤
1. **名师判语标题硬编码**：
   在 `web/js/app.js:795` 中，视角 2 被静态写死为：
   `<strong style="color:#a855f7;">【大五段骨架与对策论证诊断】</strong>：${window.ChromaRenderer.escapeHtml(p.structure_expert)}`
   不论考题是 150 字的单一题、400 字的公文讲话稿，还是 1000 字的大作文，界面一律给考生呈现“大五段骨架与对策论证诊断”，产生严重专业认知偏差。
2. **量化评分明细表（4维）硬编码大作文指标**：
   在 `web/js/app.js:765-770` 中，`dimensions` 数组硬编码为：
   - 立意与总分论点（12分）
   - 结构与段落布局（8分）
   - 论据与论证深度（10分）
   - 语言与公文规范（5分）
   对于满分 10分 或 20分 的单一题，依然强行折算“立意总分论点”和“论证深度”，完全背离公考考场“采点给分制”与“原词踩点”的阅卷铁律。
3. **大模型 Prompt 模板缺少题型分流约束**：
   在 `web/js/api_client.js:228-236` 与 `server/src/evaluator.py` 中，返回的 JSON 示例与 `radar_scores` 示例均为大作文结构，诱导大模型在批改单一题时强行评判“大五段”、“对策段”，产生诸如“结构上采用 1+3 大五段，形式上尚算完整”的幻觉评价。
4. **顶部第 3 张核心指标卡片文案固化**：
   在 `web/index.html:224` 中，指标标签固化为“立意与骨架形态”，单一题和公文题无法直观体现“分类条理性”或“格式三件套”。

### 1.2 公考与事业单位官方阅卷标准锚点 (Ground Truth Rubrics)
依据项目内置专业阅卷 Skill 规范：
- **单一题 (`single`)**（参照 `shenlun-single-question-review`）：
  - 核心阅卷逻辑：**采点给分制（宁多勿少、原词踩点、信息检索与要点匹配）**。
  - 评判四大支柱：① **内容采点覆盖度**（~55%）；② **分类逻辑与条理（MECE、总分与序号）**（~20%）；③ **提炼概括度（前置动宾大词、去案例流水账）**（~15%）；④ **表达与字数规范（字数卡位90%~100%、无主观臆造）**（~10%）。
  - 名师视角 2：**【要素归纳与分类逻辑诊断】**（聚焦八大要素、总分结构、MECE无交叉、动宾小标题）。
  - 名师视角 3：**【作答规范与去流水账质检】**（聚焦案例与人名数据脱水、主观臆造判定、字数红线）。
- **公文题 (`doc`)**（参照 `shenlun-gongwen-review`）：
  - 核心阅卷逻辑：**格式分 + 内容分 + 语言逻辑分（三轨阅卷模型）**。
  - 评判四大支柱：① **内容要点覆盖（依据材料原词提取）**（~60%）；② **格式规范三件套（标题/称谓/落款）**（~15%）；③ **行文结构与层次（发文缘由-主体分条-结语号召）**（~15%）；④ **公文语体与口吻（身份受众匹配、宣传号召/总结严肃）**（~10%）。
  - 名师视角 2：**【格式规范与行文逻辑诊断】**（核查标题、称谓、落款三件套；核查发文缘由、主体、结语结构）。
  - 名师视角 3：**【公文语体与场景口吻质检】**（核对写作身份与受众口吻、宣传号召力或汇报总结客观度）。
- **大作文 (`essay`)**（参照 `shenlun-essay-review`）：
  - 核心阅卷逻辑：**立意与大五段骨架定档**。
  - 评判四大支柱：① **立意与总分论点**（~35%）；② **结构与段落布局（大五段匀称度）**（~25%）；③ **论据与论证深度（因果制度剖析）**（~30%）；④ **语言与公文规范（政务动宾大词密度）**（~10%）。
  - 名师视角 2：**【大五段骨架与对策论证诊断】**。
  - 名师视角 3：**【政务文风与语汇质检诊断】**。

---

## 2. 总体架构与设计方案 (Architecture & Proposed Approach)

通过统一的题型量规配置中心（`QuestionTypeRubrics`），打通从 **Prompt 指引生成 ➔ 大模型推理约束 ➔ 前端指标卡渲染 ➔ 四维量化表格计算 ➔ 多视角判语标题定制 ➔ 离线推导器兜底** 的全链路自适应闭环。

```
                       ┌──────────────────────────────────────────────┐
                       │  QuestionTypeRubrics (题型量规元数据中枢)      │
                       │  - 题型名称与考场阅卷铁律                      │
                       │  - 4维量化维度、满分比例与评价判定依据模板     │
                       │  - 顶部指标卡 Label 与档位文案映射表          │
                       │  - 三重视角专属判语标题与诊断要求              │
                       └──────────────────────┬───────────────────────┘
                                              │
        ┌─────────────────────────────────────┼─────────────────────────────────────┐
        ▼                                     ▼                                     ▼
┌──────────────────────┐          ┌──────────────────────┐          ┌──────────────────────┐
│  大作文 (essay)      │          │  单一题 (single)     │          │  公文题 (doc)        │
│                      │          │                      │          │                      │
│ 4维量化：            │          │ 4维量化：            │          │ 4维量化：            │
│ 1. 立意与总分论点    │          │ 1. 内容采点覆盖度    │          │ 1. 内容要点覆盖      │
│ 2. 结构与段落布局    │          │ 2. 分类逻辑与条理    │          │ 2. 格式规范三件套    │
│ 3. 论据与论证深度    │          │ 3. 提炼概括度        │          │ 3. 行文结构与层次    │
│ 4. 语言与公文规范    │          │ 4. 表达与字数规范    │          │ 4. 公文语体与口吻    │
│                      │          │                      │          │                      │
│ 视角 2 标题：        │          │ 视角 2 标题：        │          │ 视角 2 标题：        │
│ 【大五段骨架与对策   │          │ 【要素归纳与分类     │          │ 【格式规范与行文     │
│   论证诊断】         │          │   逻辑诊断】         │          │   逻辑诊断】         │
│                      │          │                      │          │                      │
│ 视角 3 标题：        │          │ 视角 3 标题：        │          │ 视角 3 标题：        │
│ 【政务文风与语汇     │          │ 【作答规范与去流水   │          │ 【公文语体与场景     │
│   质检诊断】         │          │   账质检】           │          │   口吻质检】         │
│                      │          │                      │          │                      │
│ 指标卡 3：           │          │ 指标卡 3：           │          │ 指标卡 3：           │
│ 立意与骨架形态       │          │ 分类逻辑与条理       │          │ 公文格式与结构       │
└──────────────────────┘          └──────────────────────┘          └──────────────────────┘
```

---

## 3. 分步实施任务清单 (Step-by-Step Tasks)

### 任务 1：创建题型量规元数据中枢 (`web/js/rubrics.js`)
- **文件路径**：`web/js/rubrics.js`
- **工作内容**：
  封装统一的 `QuestionTypeRubrics`，输出 `getRubric(qType)`、`computeRadarDimensions(qType, targetScore, radarScores, result)` 等核心逻辑。
- **完整代码**：
```javascript
/**
 * 申论智能研习台 - 题型量规与考场评分元数据中枢 (QuestionTypeRubrics)
 * 严格对标国考、省考及事业单位申论真实阅卷标准
 */

const QUESTION_TYPE_RUBRICS = {
  essay: {
    qType: "essay",
    name: "申论材料大作文",
    structureLabel: "立意与骨架形态",
    perspectives: {
      examiner: { title: "【考场考官前10秒第一眼定档】", desc: "前10秒首眼扫描立意是否偏题、卷面字数卡位与大致档位初判" },
      structure_expert: { title: "【大五段骨架与对策论证诊断】", desc: "诊断大五段‘1+3’架构、总分论点对仗、论证深度与事例展开是否脱节" },
      style_expert: { title: "【政务文风与语汇质检诊断】", desc: "诊断是否存在大白话、政务动宾大词密度、公文严肃语体" }
    },
    dimensions: [
      {
        key: "立意与总分论点",
        ratio: 12 / 35,
        defaultMax: 12,
        getDesc: (res) => (res.grade?.includes("四类") || res.score < 20)
          ? "总论点或分论点不完整（未满足1+3骨架），或偏离材料核心主旨"
          : "立意源于材料，首段末句亮明总论点，三分论点醒目且递进"
      },
      {
        key: "结构与段落布局",
        ratio: 8 / 35,
        defaultMax: 8,
        getDesc: (res) => (res.grade?.includes("四类"))
          ? "分论点不足三个或正文论证段未达标杆要求，结构残缺"
          : "五段大五段匀称，段落字数控制合理，首尾呼应紧密"
      },
      {
        key: "论据与论证深度",
        ratio: 10 / 35,
        defaultMax: 10,
        getDesc: (res) => (res.copy_redline_exceeded || res.copy_ratio > 0.15)
          ? "存在大段照抄材料原句现象，论证沦为事实搬运缺乏深度制度剖析"
          : "道理论证与事例论证结合紧密，具备事后深度因果分析"
      },
      {
        key: "语言与公文规范",
        ratio: 5 / 35,
        defaultMax: 5,
        getDesc: (res) => res.chroma_spans?.some(s => s.type === 'colloquial_flaw')
          ? "存在口语化聊天大白话，需强化政务动宾大词提炼与短句对仗"
          : "公文语体规范严谨，短句对仗工整，用词庄重洗练"
      }
    ],
    evaluateStructureStatus: (structScore, maxScore, grade) => {
      if (grade?.includes("四类")) return "结构残缺";
      const ratio = structScore !== null && maxScore ? (structScore / maxScore) : 0.8;
      if (ratio >= 0.8) return "结构严整";
      if (ratio >= 0.6) return "结构尚可";
      return "结构松散";
    }
  },

  single: {
    qType: "single",
    name: "单一题（归纳概括/对策/理解）",
    structureLabel: "分类逻辑与条理",
    perspectives: {
      examiner: { title: "【考场考官前10秒第一眼定档】", desc: "前10秒极速扫描是否切中要素、有无总括句、序号条理与大致档位" },
      structure_expert: { title: "【要素归纳与分类逻辑诊断】", desc: "诊断是否全面提取要素、有无宏观总括句、微观序号与MECE分类无交叉重复" },
      style_expert: { title: "【作答规范与去流水账质检】", desc: "诊断是否存在抄录事例/人名/数据流水账、有无主观捏造事实、字数是否紧凑达标" }
    },
    dimensions: [
      {
        key: "内容采点覆盖度",
        ratio: 0.55,
        defaultMax: 11,
        getDesc: (res) => (res.grade?.includes("四类") || res.score < (res.target_score || 20) * 0.5)
          ? "严重偏离题目要素，官方底稿核心要点大面积遗漏，采点命中率极低"
          : "全面覆盖给定资料核心得分点，精准命中官方采分底稿原词与要点"
      },
      {
        key: "分类逻辑与条理",
        ratio: 0.20,
        defaultMax: 4,
        getDesc: (res) => res.grade?.includes("四类")
          ? "未分条列项，无宏观总括句，要点混杂杂乱无章"
          : "具备宏观总括句，微观1.2.3.序号清晰，同类项合并合理无交叉重叠"
      },
      {
        key: "提炼概括度",
        ratio: 0.15,
        defaultMax: 3,
        getDesc: (res) => res.chroma_spans?.some(s => s.type === 'story_narrative_leak')
          ? "存在抄录案例情节、人名与数据现象，缺乏规范动宾前置词凝练"
          : "前置动宾短语工整醒目，成功剔除案例冗余水分，语言凝练密度高"
      },
      {
        key: "表达与字数规范",
        ratio: 0.10,
        defaultMax: 2,
        getDesc: (res) => res.chroma_spans?.some(s => s.type === 'colloquial_flaw')
          ? "存在大白话或主观臆造推论，字数未达最佳饱满区间"
          : "字数紧凑控制在规定格子90%~100%，无错别字，表述客观规范"
      }
    ],
    evaluateStructureStatus: (structScore, maxScore, grade) => {
      if (grade?.includes("四类")) return "散乱未分类";
      const ratio = structScore !== null && maxScore ? (structScore / maxScore) : 0.8;
      if (ratio >= 0.8) return "总分清晰";
      if (ratio >= 0.6) return "逻辑尚可";
      return "逻辑交叉";
    }
  },

  doc: {
    qType: "doc",
    name: "公文题（贯彻执行/应用文）",
    structureLabel: "公文格式与结构",
    perspectives: {
      examiner: { title: "【考场考官前10秒第一眼定档】", desc: "前10秒极速核查文种类型、三件套格式规范性、版面排布与初扫档位" },
      structure_expert: { title: "【格式规范与行文逻辑诊断】", desc: "逐项诊断标题/主送称谓/落款格式三件套；诊断‘发文缘由-主体分条-结语号召’行文逻辑" },
      style_expert: { title: "【公文语体与场景口吻质检】", desc: "核定发文身份与受众口吻匹配度、宣传倡议类感染号召力、工作总结类严肃客观度" }
    },
    dimensions: [
      {
        key: "内容要点覆盖",
        ratio: 0.60,
        defaultMax: 12,
        getDesc: (res) => (res.grade?.includes("四类") || res.score < (res.target_score || 20) * 0.5)
          ? "遗漏核心任务要点，未紧扣材料提炼措施或经验，内容充实度不足"
          : "严格依托材料提炼背景、措施、做法等要点，内容要点全面扎实"
      },
      {
        key: "格式规范三件套",
        ratio: 0.15,
        defaultMax: 3,
        getDesc: (res) => (res.title_issues && res.title_issues.length > 0)
          ? "标题存在书名号或缺少文种/事由，或称谓与落款缺失不合规"
          : "标题居中规范，主送单位顶格冒号，落款单位与日期合规完备"
      },
      {
        key: "行文结构与层次",
        ratio: 0.15,
        defaultMax: 3,
        getDesc: (res) => res.grade?.includes("四类")
          ? "缺少发文缘由或结尾结语，主体段落缺乏层次过渡"
          : "开头发文缘由交代清晰，主体分条列项推进，结尾收束号召有力"
      },
      {
        key: "公文语体与口吻",
        ratio: 0.10,
        defaultMax: 2,
        getDesc: (res) => res.chroma_spans?.some(s => s.type === 'colloquial_flaw')
          ? "语言口语化偏重，文种特定口吻（宣传号召/请示汇报）不够精准"
          : "公文语体庄重大方，契合特定发文机关身份与受众场景口吻"
      }
    ],
    evaluateStructureStatus: (structScore, maxScore, grade) => {
      if (grade?.includes("四类")) return "格式残缺";
      const ratio = structScore !== null && maxScore ? (structScore / maxScore) : 0.8;
      if (ratio >= 0.8) return "三件套完备";
      if (ratio >= 0.6) return "格式微瑕";
      return "格式残缺";
    }
  }
};

class QuestionTypeRubrics {
  static getRubric(qType) {
    return QUESTION_TYPE_RUBRICS[qType] || QUESTION_TYPE_RUBRICS.essay;
  }

  static getDimensions(qType, targetScore = 20) {
    const rubric = this.getRubric(qType);
    let remaining = targetScore;
    return rubric.dimensions.map((dim, idx) => {
      let maxScore;
      if (idx === rubric.dimensions.length - 1) {
        maxScore = Math.max(1, Math.round(remaining * 10) / 10);
      } else {
        maxScore = Math.max(1, Math.round(targetScore * dim.ratio * 2) / 2);
        remaining -= maxScore;
      }
      return {
        key: dim.key,
        max: maxScore,
        getDesc: dim.getDesc
      };
    });
  }

  static getPerspectiveTitles(qType) {
    const rubric = this.getRubric(qType);
    return {
      examiner: rubric.perspectives.examiner.title,
      structure_expert: rubric.perspectives.structure_expert.title,
      style_expert: rubric.perspectives.style_expert.title
    };
  }

  static getStructureCardLabel(qType) {
    return this.getRubric(qType).structureLabel;
  }

  static getStructureStatus(qType, structScore, maxScore, grade) {
    return this.getRubric(qType).evaluateStructureStatus(structScore, maxScore, grade);
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { QuestionTypeRubrics, QUESTION_TYPE_RUBRICS };
}
if (typeof window !== 'undefined') {
  window.QuestionTypeRubrics = QuestionTypeRubrics;
}
```
- **验证命令**：
  `node -e "const { QuestionTypeRubrics } = require('./web/js/rubrics.js'); console.log(QuestionTypeRubrics.getPerspectiveTitles('single')); console.log(QuestionTypeRubrics.getDimensions('single', 10));"`
- **预期输出**：
  正确输出单一题专属标题 `【要素归纳与分类逻辑诊断】` 及总分为 10 分的 4 维量化细分。

---

### 任务 2：将 `rubrics.js` 引入 `web/index.html` 并增加自适应 ID 锚点
- **文件路径**：`web/index.html`
- **修改点**：
  1. 在 `<script src="js/exams_loader.js"></script>` 前后引入 `<script src="js/rubrics.js"></script>`；
  2. 给顶部指标卡第 3 项的 label 增加 `id="structure-lbl"`；
  3. 将 `#perspectives-container` 的初始占位提示更新为通用题型自适应文案；
  4. 检查所有相关标签的对应语义。
- **验证命令**：
  `node -e "const fs = require('fs'); const html = fs.readFileSync('web/index.html','utf8'); if (!html.includes('rubrics.js') || !html.includes('id=\"structure-lbl\"')) throw new Error('Missing tags in index.html'); console.log('index.html tags verified!');"`
- **预期输出**：`index.html tags verified!`

---

### 任务 3：升级前端请求中心 `web/js/api_client.js` 的 Prompt 指引与 Schema
- **文件路径**：`web/js/api_client.js`
- **工作内容**：
  在 `submitReview` 构建 `userPrompt` 时，按 `qType` 动态切换评卷考官原则说明、`radar_scores` 示例与 `perspectives` 诊断规范：
  - **`qType === 'single'`**：
    - 明确铁律：“本题为单一题（归纳概括/提出对策/理解题），采点给分制为唯一判分铁律，**严禁使用大作文‘大五段’、‘分论点’等模式评判**！重点审查：1.内容采点覆盖度；2.总分结构与MECE分类；3.前置动宾短语提炼；4.脱水去案例流水账与字数红线。”
    - JSON 格式示例中的 `radar_scores`：
      `"radar_scores": {"内容采点覆盖度": 8.0, "分类逻辑与条理": 3.0, "提炼概括度": 2.5, "表达与字数规范": 1.5}`
    - JSON 格式中的 `perspectives`：
      `"examiner"`: "考场考官前10秒第一眼定档（审题要素判定、字数与条理第一眼初评）...",
      `"structure_expert"`: "要素归纳与分类逻辑诊断（是否涵盖八大要素、有无总分结构、分类MECE无交叉、前置动宾大词是否醒目）...",
      `"style_expert"`: "作答规范与去流水账质检（去案例化、语言紧凑度、有无主观捏造、字数卡位）..."
  - **`qType === 'doc'`**：
    - 明确铁律：“本题为公文题/贯彻执行题，采用‘格式分+内容分+语言逻辑分’三轨模型，**严禁使用大作文‘大五段’模式评判**！重点审查：1.内容要点覆盖；2.标题/称谓/落款格式三件套；3.发文缘由-主体要点-结语层次；4.公文语体与场景口吻。”
    - JSON 格式示例中的 `radar_scores`：
      `"radar_scores": {"内容要点覆盖": 12.0, "格式规范三件套": 3.0, "行文结构与层次": 3.0, "公文语体与口吻": 2.0}`
    - JSON 格式中的 `perspectives`：
      `"examiner"`: "考场考官前10秒第一眼定档（文种类型、格式三件套完整度、初扫档位）...",
      `"structure_expert"`: "格式规范与行文逻辑诊断（核验标题/称谓/落款三件套；诊断缘由-主体-结语脉络）...",
      `"style_expert"`: "公文语体与场景口吻质检（身份与对象口吻匹配度、号召感染力或总结严肃度）..."
  - **`qType === 'essay'`**：
    - 维持大五段议论文模型与四维评分规范（立意总分论点、结构大五段、论据深度、公文规范）。
- **验证命令**：
  `node -c web/js/api_client.js`
- **预期输出**：语法检查通过，无错误。

---

### 任务 4：重构前端报告渲染器 `web/js/app.js` 的指标卡、4维表格与名师视角标题
- **文件路径**：`web/js/app.js`
- **工作内容**：
  1. 在 `changeQuestionType()` 和 `selectSubQuestion(qid)` 中：
     根据切换后的题型动态更新：
     - `#structure-lbl` 的标题（如单一题更新为 `分类逻辑与条理`，公文题更新为 `公文格式与结构`，大作文更新为 `立意与骨架形态`）；
     - `#perspectives-container` 在未批改状态下的引导文案。
  2. 在 `renderReviewResult(userText, res)` 中：
     - **动态渲染第 3 张指标卡**：
       使用 `QuestionTypeRubrics.getStructureCardLabel(qType)` 更新 `#structure-lbl`；
       根据对应题型的主指标得分（单一题取“分类逻辑与条理”，公文题取“格式规范三件套”，大作文取“结构与段落布局”），结合 `QuestionTypeRubrics.getStructureStatus()` 计算卡片状态（如 `总分清晰` / `三件套完备` / `结构严整`）。
     - **动态渲染 4 维量化表格**：
       使用 `QuestionTypeRubrics.getDimensions(qType, targetScore)` 动态生成表格行；支持模糊匹配大模型返回的 key 或按比例降级兼容，展示量纲精准的实得分与 `desc`。
     - **动态渲染名师判语标题**：
       使用 `QuestionTypeRubrics.getPerspectiveTitles(qType)` 动态呈现：
       - `examiner` -> 【考场考官前10秒第一眼定档】
       - `structure_expert` -> 单一题呈现 `【要素归纳与分类逻辑诊断】`；公文题呈现 `【格式规范与行文逻辑诊断】`；大作文呈现 `【大五段骨架与对策论证诊断】`
       - `style_expert` -> 单一题呈现 `【作答规范与去流水账质检】`；公文题呈现 `【公文语体与场景口吻质检】`；大作文呈现 `【政务文风与语汇质检诊断】`
- **验证命令**：
  `node -c web/js/app.js`
- **预期输出**：语法检查通过，无报错。

---

### 任务 5：同步升级后端推导器 `server/src/evaluator.py`
- **文件路径**：`server/src/evaluator.py`
- **工作内容**：
  1. 在 `evaluate()` 的在线大模型提示词中同步更新 `qType` 对应的 `radar_scores` 示例与 `perspectives` 诊断维度提示词；
  2. 在 `_evaluate_fallback()` 中根据 `req.question_type` 产出自适应的离线四维得分与三重视角诊断（单一题产出要素归纳与条理分析，公文题产出三件套格式与行文脉络分析，大作文产出大五段骨架分析）。
- **验证命令**：
  `pytest server/tests/ -q`
- **预期输出**：全部通过。

---

### 任务 6：编写题型自适应端到端自动化测试套件 (`web/tests/test_question_type_perspectives.js`)
- **文件路径**：`web/tests/test_question_type_perspectives.js`
- **测试场景覆盖**：
  1. **单一题场景验证**：
     - Mock 或调用单一题（`qType = 'single'`）；
     - 断言指标卡呈现 `分类逻辑与条理`；
     - 断言四维量化表格包含 `内容采点覆盖度` 与 `分类逻辑与条理`；
     - 断言名师视角 2 标题为 `【要素归纳与分类逻辑诊断】`，绝无 `大五段` 字样；
     - 断言名师视角 3 标题为 `【作答规范与去流水账质检】`。
  2. **公文题场景验证**：
     - Mock 或调用公文题（`qType = 'doc'`）；
     - 断言指标卡呈现 `公文格式与结构`；
     - 断言四维量化表格包含 `内容要点覆盖` 与 `格式规范三件套`；
     - 断言名师视角 2 标题为 `【格式规范与行文逻辑诊断】`，绝无 `大五段` 字样；
     - 断言名师视角 3 标题为 `【公文语体与场景口吻质检】`。
  3. **大作文场景验证**：
     - 保持大五段议论文四维量化与 `【大五段骨架与对策论证诊断】`；
     - 确保既有功能零回归。
- **运行命令**：
  `node web/tests/test_question_type_perspectives.js`
- **预期输出**：全部 3 组断言通过，打印 `🎉 题型自适应评分量规与考官判语测试 100% 通过！`。

---

### 任务 7：主从工作区快进同步与端口服务验证
- **工作内容**：
  1. 运行全部单元与集成测试（`pytest` 与 `web/tests/*.js`）；
  2. 验证端口 `8789` 最新静态资源与服务响应；
  3. 保持分支整洁。

---

## 4. 测试与验证策略 (Tests & Validation)

| 阶段 | 验证命令 | 预期效果 |
| :--- | :--- | :--- |
| 规则中枢单元测试 | `node -e "require('./web/js/rubrics.js')"` | 模块语法正确，元数据结构完整 |
| 后端全套测试 | `pytest` | 11 个测试用例全部绿色通过 |
| 前端既有测试集 | `node web/tests/test_api_client.js && node web/tests/test_real_exam_subquestions.js` | 既有前检与题本加载 100% 通过 |
| 题型自适应专项测试 | `node web/tests/test_question_type_perspectives.js` | 单一题、公文题、大作文各题型视角与量规精准对齐 |

---

## 5. 风险、权衡与防范 (Risks, Tradeoffs & Countermeasures)

1. **大模型返回 key 不一致的容错处理**：
   - **风险**：大模型有时返回微小变体的 key（如将 `内容采点覆盖度` 简写为 `内容采点`）。
   - **对策**：在 `app.js` 渲染 `radar_scores` 时建立模糊匹配机制（若精确 key 不存在，检测是否包含核心字词，如 `采点` / `格式` / `逻辑` / `语体`），并兜底基于题目满分与总分按比例智能补全，防止 UI 出现 `undefined`。
2. **整卷小题满分动态换算**：
   - **风险**：不同年份省考国考小题满分不同（10分、15分、20分、25分、35分）。
   - **对策**：`QuestionTypeRubrics.getDimensions(qType, targetScore)` 采用比例换算（如单一题内容采点占 55%），总分动态自适应 10~35 分的任何分值，避免硬编码固定满分。
3. **旧历史报告缓存兼容**：
   - **风险**：用户 IndexedDB 中已保存的历史批改报告可能使用的是旧四维 key。
   - **对策**：`renderReviewResult` 在读取历史记录时，若检测到旧版 key 则无缝自适应展示，不破坏历史报告渲染。
