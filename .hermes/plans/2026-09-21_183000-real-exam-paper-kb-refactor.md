# 申论真实题本与采分底稿题库重构实施计划 (Real Exam Paper & Ground Truth KB Refactor Plan)

> **For Hermes:** 根据用户指令，针对当前题库为合成假数据、缺乏整套题本与真实采分底稿的问题，基于高教公考真题库 (`sanlianbook.com`) 真实结构，将系统默认题库全量改造为“真实考场完整题本（材料1~N）+ 阶梯小题联动（单一题/公文/大作文）+ 官方评分细则采分底稿（Ground Truth）”的现代化公考研习中枢。

**Goal:** 彻底淘汰基于模板循环合成的虚构真题，建立 100% 来源真实的历年国考（省级/市地级/行政执法）与各省省考真题库，实现“整套题本大材料全局阅读 + 小题分级即时切换 + 官方采分底稿穿透批改”的全新题库与交互架构。

**Architecture:** 数据层采用“整卷题本（Paper - 全局给定资料）+ 关联试题数组（Questions - 各小题题干/分值/采分细则/参考答案）”的层级结构；网络层继续采用“轻量试卷索引（~30KB）+ 单卷分片懒加载 + IndexedDB 二级持久化”；交互层实现“试卷选择器 + 题目切换标签组（Pills）”二级联动，作答时自动将对应小题的官方采分底稿注入大模型评审 Prompt，实现官方级精准采分。

**Tech Stack:** 原生 ES6+ JavaScript, IndexedDB (IDB API), Python 3.11 (BeautifulSoup4 / httpx / regex), GitHub Pages, DeepSeek-V3 OpenAPI (BYOK).

---

## 1. 现状痛点审计与重构目标 (Problem Analysis & Target State)

### 1.1 当前系统题库的四大严重偏差
1. **偏差一：数据全为合成伪造，严重脱离考场实际**
   - 现状：当前 200 套题中的大部分是由脚本填充“某地立足新发展阶段...”模板假材料生成的虚构单题，缺乏真实申论案例与时代背景。
   - 目标：100% 采用历年国考与省考真题原卷（如 2022 国考省级热效率与未来学校、2021 国考省级小谷村扶贫、2020 国考市地级制造业等）。
2. **偏差二：题卷混淆，一套试卷被割裂为孤立单题**
   - 现状：将一套真题的第1题或第5题独立成一个试卷文件，破坏了考生对照全局材料审题答题的完整考场体验。
   - 目标：以“题本（Paper）”为最小单元，一套试卷包含完整给定材料（材料1~5，6000~8000字），下挂 4~5 道真实考场题目。
3. **偏差三：缺少官方采分底稿（Ground Truth）**
   - 现状：原题库只有题干和材料，没有参考答案和采分细则，大模型批改时只能无锚点主观发挥。
   - 目标：将 `sanlianbook.com` 等权威渠道的【评分细则】（扣分标准、按点给分关键词、分值权重）完整沉淀至每道小题元数据中，批改时作为 Ground Truth 直接约束 LLM。
4. **偏差四：界面缺少小题联动体验**
   - 现状：用户切换题型时下拉框只能生硬跳转到某个写死的合成题。
   - 目标：选定一套试卷后，顶部动态展示题目 Pill 栏（例如：`第1题:启示概括(10分)` | `第2题:问题对策(15分)` | `第3题:推介公文(20分)` | `第4题:综合分析(20分)` | `第5题:大作文(35分)`），点击即刻无缝切换题干、字数与阅卷 Skill。

---

## 2. 真实题库层级数据契约规范 (New KB Data Schema)

### 2.1 单卷分片结构 (`web/data/exams/[paper_id].json`)
```json
{
  "id": "gk2022_provincial",
  "exam_name": "2022年国家公务员考试申论真题（省级）",
  "year": 2022,
  "category": "国考",
  "tier": "省级",
  "exam_date": "2021-11-28",
  "time_limit": 180,
  "total_score": 100,
  "materials": [
    {
      "index": 1,
      "title": "材料1",
      "content": "B公司是我国一家著名的装备制造企业，研制出了全球首款热效率突破50%的商业化柴油机..."
    },
    {
      "index": 2,
      "title": "材料2",
      "content": "G省的光澜米业公司是一家以水稻种植、稻米加工为主业的国家级农业产业化重点龙头企业..."
    }
  ],
  "materials_text": "【给定资料 1】B公司是我国一家著名的装备制造企业...\\n\\n【给定资料 2】G省的光澜米业公司...",
  "questions": [
    {
      "id": "gk2022_prov_q1",
      "q_index": 1,
      "type": "single",
      "type_name": "单一题（概括启示）",
      "score": 10,
      "char_limit": "不超过200字",
      "prompt_text": "根据“给定资料1”，请你谈谈 B 公司的案例为企业科技创新提供了哪些启示。",
      "prompt_reqs": "分析全面，条理清晰，不超过200字。",
      "ref_materials": [1],
      "scoring_criteria": "【扣分项】：无条理扣1分，错别字每字扣0.5分；【采分点】：1.超前研发与差异化竞争(2分)；2.以市场和客户需求为导向，开源节流(2分)；3.宽容科研失败，实施前置奖励激励机制(2分)；4.加大基础研究投入与科技人才重奖(2分)；5.开放合作与全球协同研发(2分)。",
      "reference_answer": "启示如下：1. 强化超前研发：做别人没做过的，以差异化竞争构筑护城河；2. 坚持市场导向：围绕客户开源节流痛点开展针对性创新；3. 完善激励机制：将奖励前置，宽容科研失败，建立灵活容错机制；4. 敢于基础投入：保障研发经费自主支配，重奖科研人才；5. 拓展全球协同：不关门、不违反，善意收购整合全球资源，搭建数字化协同研发平台。"
    },
    {
      "id": "gk2022_prov_q5",
      "q_index": 5,
      "type": "essay",
      "type_name": "材料大作文",
      "score": 35,
      "char_limit": "1000~1200字",
      "prompt_text": "“给定资料5”中说“今天的思维和播种，决定了我们未来的收获”，请结合对这句话的理解，参考给定资料，联系实际，自选角度，自拟题目，写一篇文章。",
      "prompt_reqs": "（1）观点明确，见解深刻；（2）参考给定资料，但不拘泥于给定资料；（3）思路清晰，语言流畅；（4）字数1000～1200字。",
      "ref_materials": [1, 2, 3, 4, 5],
      "scoring_criteria": "【定档基准】：一类文(30-35分)：立意精准切合“以前瞻思维谋划当下发展，赢得未来主动”，采用1+3大五段结构；二类文(25-29分)：观点正确但论证泛化；三类文(19-24分)：套话严重；四类文(18分以下)：跑题偏题；【硬性扣分】：字数不足每50字扣1分，标题加书名号扣1-2分，摘抄原文超20%扣分。",
      "reference_answer": "《播撒前瞻之种 收获未来之实》..."
    }
  ]
}
```

### 2.2 轻量索引结构 (`web/data/exams/index.json`)
```json
[
  {
    "id": "gk2022_provincial",
    "exam_name": "2022年国考申论真题（省级）",
    "year": 2022,
    "category": "国考",
    "tier": "省级",
    "char_count": 7840,
    "question_count": 5,
    "questions_summary": [
      { "id": "gk2022_prov_q1", "q_index": 1, "type": "single", "title": "B公司科技创新启示", "score": 10 },
      { "id": "gk2022_prov_q2", "q_index": 2, "type": "single", "title": "G省粮食产业问题与对策", "score": 15 },
      { "id": "gk2022_prov_q3", "q_index": 3, "type": "doc", "title": "临诗特色乡村旅游推介材料", "score": 20 },
      { "id": "gk2022_prov_q4", "q_index": 4, "type": "single", "title": "未来学校的教育境界与体现", "score": 20 },
      { "id": "gk2022_prov_q5", "q_index": 5, "type": "essay", "title": "大作文：今天的思维与未来的收获", "score": 35 }
    ]
  }
]
```

---

## 3. 分步实施落地计划 (Step-by-Step Implementation Tasks)

### Task 1: 编写真实真题采集与标准清洗脚本 (Data Acquisition & Ingestion)
**Objective:** 针对 `sanlianbook.com` 等权威真题源，编写爬虫与清洗解析脚本，提取真实历年国考（2018~2024）与核心省考真实试卷全文与评分细则。
**Files:**
- Create: `scripts/crawl_sanlian_exams.py`
- Create: `data/raw_exams/`
- Test: `tests/test_crawler_pipeline.py`

**Step 1: 编写测试验证真实 HTML 解析逻辑**
```python
# tests/test_crawler_pipeline.py
from pathlib import Path
from scripts.crawl_sanlian_exams import parse_exam_html, parse_answer_html

def test_parse_exam_html_structure():
    mock_html = """
    <h1>2022年（2021-11-28）国家公务员考试申论真题（省级）</h1>
    <div>**二、给定资料**<br>**材料1**<br>B公司是我国装备企业...<br>**材料2**<br>G省光澜米业...<br>**三、作答要求**<br>（一）谈谈B公司启示（10分）<br>（二）写一篇文章（35分）</div>
    """
    parsed = parse_exam_html(mock_html, "gk2022_provincial")
    assert parsed["year"] == 2022
    assert len(parsed["materials"]) >= 2
    assert len(parsed["questions"]) >= 2
```

**Step 2: 运行测试验证失败**
Run: `pytest tests/test_crawler_pipeline.py`

**Step 3: 实现 `scripts/crawl_sanlian_exams.py`**
- 抓取与解析真题 HTML（提取注意事项、给定资料、作答要求）；
- 抓取与解析对应答案/评分标准 HTML（提取采分点、评分细则、参考答案）；
- 对齐合并为标准的 Paper JSON。

**Step 4: 运行爬取与校验**
Run: `python scripts/crawl_sanlian_exams.py`
Expected: 生成真实的国考（2020~2024 省级/市地级/行政执法）和多省代表真题。

---

### Task 2: 升级 `scripts/build_exams_kb.py` 生成整卷分片与轻量索引
**Objective:** 支持处理真实的 Paper JSON 结构，输出单卷懒加载分片与轻量级全局索引。
**Files:**
- Modify: `scripts/build_exams_kb.py`
- Modify: `web/data/default_kb/exams.json`
- Test: `tests/test_exams_pipeline.py`

**Step 1: 编写测试**
- 验证分片输出包含 `materials_text`、`materials` 列表以及 `questions` 列表；
- 验证 `index.json` 体积在 30~50KB 以内，包含题本概要与下挂小题概要。

**Step 2: 执行测试并升级脚本**
Run: `pytest tests/test_exams_pipeline.py`

**Step 3: 生成全量分片**
Run: `python scripts/build_exams_kb.py`
Expected: `web/data/exams/index.json` 更新，真实试卷分片生成完成。

---

### Task 3: 升级前端数据层 `ExamsLoader` 与 `db.js`
**Objective:** 使前端加载器支持读取整套题本，并能获取特定小题的采分底稿。
**Files:**
- Modify: `web/js/exams_loader.js`
- Modify: `web/js/db.js`
- Test: `web/tests/test_exams_loader.js`

**Step 1: 编写单元测试**
```javascript
// web/tests/test_exams_loader.js
// 验证 loadIndex 返回试卷列表及其题目概要
// 验证 getExamDetail 返回完整试卷及下属 questions
// 验证 getQuestionDetail(paperId, questionId) 精准提取小题及其 scoring_criteria
```

**Step 2: 升级 `ExamsLoader` 实现**
- 新增 `getQuestion(paperId, qId)` 方法；
- 自动维护本地 IndexedDB 缓存；
- 向下兼容旧调用接口。

**Step 3: 运行 Node 测试**
Run: `node web/tests/test_exams_loader.js`
Expected: PASS

---

### Task 4: 升级工作台交互：试卷-小题二级联动面板 (UI Refactor)
**Objective:** 在作答工作台顶部增加题目切换 Pill 栏，彻底打通“选试卷 -> 选小题 -> 自动匹配题型与Skill -> 注入采分底稿”的全流程。
**Files:**
- Modify: `web/index.html`
- Modify: `web/styles/main.css`
- Modify: `web/js/app.js`

**Step 1: 界面改造**
- 在 `exam-selector` 下方增加 `<div id="paper-questions-bar" class="questions-pill-bar"></div>`；
- 显示当前试卷的每道小题按钮（如：`【题1·单一】启示分析 (10分)` | `【题5·大作文】思维与收获 (35分)`）；
- 并在题干区域展示当前小题关联的【官方采分重点提示】展开抽屉。

**Step 2: 控制器 `app.js` 联动改造**
- 选择试卷时，自动渲染小题 Pill 按钮组，默认激活第 1 题；
- 点击小题 Pill 时：
  1. 切换内部选中小题 `currentQuestion`；
  2. 自动同步更新题型下拉框 `q-type`；
  3. 自动匹配对应的阅卷专家规范（大五段 / 三轨制 / 采点制）；
  4. 题干框精准显示该题真实题干与要求；
  5. 满分徽章实时变更为当前小题满分（如 10分、15分、20分、35分）。

---

### Task 5: 升级 `api_client.js`：将真实采分底稿注入大模型评审
**Objective:** 让前端在大模型评审时将当前题目的 `scoring_criteria`（采分点标准）无缝编排进 Prompt。
**Files:**
- Modify: `web/js/api_client.js`
- Test: `web/tests/test_api_client.js`

**Step 1: 编写测试**
- 验证当 payload 包含 `scoring_criteria` 时，Prompt 中正确包含 `【官方客观采分底稿与判分标准（Ground Truth）】` 约束段落。

**Step 2: 升级 `api_client.js` Prompt 编排**
```javascript
let groundTruthSection = "";
if (payload.scoring_criteria) {
  groundTruthSection = `
## 【官方客观采分底稿与判分细则（Ground Truth，严禁脱离底稿凭空打分）】：
${payload.scoring_criteria}
`;
}
```
大模型依据真实采分点进行对比判定，色谱高亮能够精确对应采分原词！

**Step 3: 运行集成测试**
Run: `node web/tests/test_api_client.js`
Expected: PASS

---

### Task 6: 更新公共题库展示与一键选做 (Public KB Tab)
**Objective:** 在“🏛️ 官方真题与知识库” Tab 优雅展示历年国考与省考真题卡片，支持按年份、类别筛选，并展示各试卷下的小题列表。
**Files:**
- Modify: `web/js/app.js` (升级 `renderPublicKBList`)
- Modify: `web/index.html`

---

## 4. 迁移后成效对比 (Impact Matrix)

| 指标 | 重构前（假题合成） | 重构后（真题题本+采分底稿联动） |
| :--- | :--- | :--- |
| **题目真实性** | 模版占位假题，材料千篇一律 | **100% 官方历年真题**，真实国考与省考材料 |
| **试卷完整度** | 孤立割裂的单题，无整卷概念 | **完整题本 (Paper)**，一套卷包含材料1~5与4~5道小题 |
| **采分客观性** | 无官方答案，大模型纯主观估分 | **绑定权威采分底稿 (Ground Truth)**，按点赋分精准客观 |
| **备考训练感** | 假题练习毫无实战价值 | **全真模拟真实考场**，覆盖概括、综合分析、公文、大作文全题型 |
| **资源体积与秒开** | 50KB 假数据 | **~30KB 轻量索引 + 单卷分片秒级懒加载**，保持零后端极速秒开 |

---

## 5. 风险与防御策略 (Risks & Mitigations)

1. **外部网站防爬或结构变动风险**：
   - *对策*：脚本内嵌权威真题静态数据集（涵盖 2020~2024 国考省级/市地级/执法类及江苏/浙江/山东/广东代表卷）作为离线保底，确保无论外部网络状态如何，本系统均能 100% 自主生成完整的高质量真实真题库。
2. **小题分值与总分一致性风险**：
   - *对策*：在 `build_exams_kb.py` 中增加总分校验（各小题分值之和等于 100 分，如 10+15+20+20+35 = 100 分），杜绝数据笔误。
3. **数据向下兼容风险**：
   - *对策*：在数据加载层自动将 Paper 下的小题暴露为平铺题目，旧有接口直接读取 `exam.questions[0]`，不破坏现有任何功能与自动化测试。
