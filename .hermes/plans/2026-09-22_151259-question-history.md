# 做题历史记录与二练复盘功能实施计划 (Question History & Re-drill Plan)

> **For Hermes:** Use subagent-driven-development skill to implement this plan task-by-task.

**Goal:** 为申论智能研习台新增完整的做题历史记录系统与二练复盘功能，支持历史答卷集中管理、多维检索筛选、历史色谱批改报告无损回显、一键二练重构与宏观做题统计看板。

**Architecture:** 基于纯客户端本地优先 (Local-First) 与 Strict BYOK 军工级隐私架构，利用既有 IndexedDB (`ShenlunStudyDB` 的 `submissions` 与 `reports` 表) 升级元数据快照；新增独立领域纯逻辑模块 `web/js/history.js` 处理统计与筛选；在前端新增 `📜 作答历史` Tab 与做题区关联抽屉；通过前后端零服务端持久化的原则实现高效、离线、安全的答卷资产沉淀。

**Tech Stack:** Vanilla JavaScript (ES6+), IndexedDB, CSS3 (Design Tokens), Node.js (自动化单元测试).

---

## 一、 架构支撑力深度论证 (Architecture Viability & Support Argumentation)

针对用户提出的核心疑问：“当前没有做题历史记录，论证当前架构是否能支撑，设计一个计划增加这个功能”，本节进行系统性论证与技术对账：

### 1.1 结论：当前架构完全具备支撑能力，且天然为本地历史资产设计

**核心结论：当前架构不仅完全能支撑“做题历史记录”，而且在底层持久化基础设施上已经就绪了 70% 的数据底座。无需引入任何服务端数据库，也无需重构核心流程。**

### 1.2 为什么当前架构能支撑？（四维对账）

| 架构维度 | 当前系统状态 | 对“做题历史记录”的支撑能力判定 |
| :--- | :--- | :--- |
| **1. 存储层 (IndexedDB)** | `web/js/db.js` 已创建 `submissions`（历史答卷）与 `reports`（色谱报告）两个 ObjectStore，且带有 `questionType`, `createdAt`, `submissionId` 索引。 | **原生支撑**。每当用户在 `app.js` 点击“开始批改”，系统已在静默执行 `db.put('submissions')` 和 `db.put('reports')`。数据早已在本地落盘，只是此前未向用户提供全局视图。 |
| **2. 隐私与数据主权 (Local-First)** | 系统遵循“服务端零留存、零数据库；用户数据 100% 存在浏览器本地；纯客户端持 Key (Strict BYOK)”的最高准则。 | **完美契合**。做题历史作为高价值个人隐私资产，理应 100% 存放在考生的 IndexedDB 沙箱中。若改为服务端存储，反而违背了项目隐私架构第一原则。 |
| **3. 存储容量与性能测算** | 现代浏览器 IndexedDB 配额通常可达可用磁盘空间的 50%（通常 10GB~50GB+）。 | **绰绰有余**。单篇答卷（题干+文本+批改报告结构体）约 15KB~30KB。考生即便完成 10,000 道题，总占用仅 ~250MB。在内存中对千级历史记录做过滤排序耗时 `< 3ms`。 |
| **4. 业务流转与报告反显底座** | `web/js/app.js` 中已实装 `jumpToSubmissionReport(submissionId)` 函数与全量色谱渲染引擎 `renderReviewResult()`。 | **无缝复用**。系统已经掌握“给定 `submissionId` 即可提取答卷和报告并全真重绘色谱”的核心能力，做题历史只需将该能力向用户全面开放。 |
| **5. 备份与数据安全** | `web/js/backup.js` 中 `exportFullBackup()` 和 `importBackup()` 已将 `submissions` 与 `reports` 全量纳入 JSON 导出导入。 | **无缝兼容**。做题历史记录新增字段后，现有的备份机制无需任何改造即可自动支持云端转移与跨设备迁移。 |

### 1.3 当前架构存在的 4 大断点（为什么用户感知“没有做题历史”？）

尽管底层数据表已经存在，但当前系统存在以下断点，导致做题历史功能无法被用户使用：
1. **缺口 1（入口与视图缺失）**：顶部导航仅有 5 个 Tab（批改、记忆库、真题库、短板档案、工坊），没有独立的「📜 作答历史」看板。用户唯一能接触到历史答卷的路径是在“短板档案”中看到少量切片，无法主动浏览、搜索自己的做题历史。
2. **缺口 2（元数据快照缺失）**：`app.js` 在写入 `submissions` 时只存了 `{ id, questionType, questionTitle, materials, userAnswer, wordCount, createdAt }`，丢弃了 `examId`（试卷ID）、`examTitle`（试卷名称）、`questionId`（小题编号）、`targetScore`（总分）、`score`（实得分）、`grade`（等级）。导致仅查 `submissions` 无法知道具体考了多少分、属于哪一年哪套卷子的小题。
3. **缺口 3（交互与二练闭环断裂）**：申论备考核心规律是“反复重构、一题多练（二练提分）”。当前系统无法一键载入历史原题并发起二练，也无法删除废弃作答或对比同题的不同作答版本。
4. **缺口 4（学习成效度量看板缺失）**：缺少宏观概览：累计完成多少题？题型分布比例如何？平均得分率是多少？是否有持续提分？

### 1.4 解决方案构想

保持后端纯无状态与纯客户端 IndexedDB 不变：
1. **新增领域模块**：`web/js/history.js`（实现纯函数：数据整合、统计指标计算、多维筛选过滤、时间/得分排序、同题版本聚合）。
2. **增强数据持久化**：在 `app.js` 的 `runFullReview` 批改成功后，写入补全了 `examId`, `examTitle`, `questionId`, `targetScore`, `score`, `grade`, `copyRatio` 的富元数据；同时在 `ClientDB` 提供级联删除接口。
3. **新增一级视窗**：在 `web/index.html` 增加 `📜 作答历史` Tab，包含“指标看板（累计答卷/题型分布/平均得分率/累计字数）”、“过滤搜索工具栏（题型/试卷/排序/搜索词）”以及“答卷卡片列表”。
4. **闭环业务操作**：每张答卷提供【🔍 查看完整报告】（免 Token 还原色谱报告）、【🔄 基于本题二练重构】（一键回填题干与材料并发起全新练习）、【🗑️ 删除记录】。
5. **做题区小题联动**：在做题界面切换真题时，动态计算并展示“📜 本题已练习 N 次 (最高 XX 分)”，点击可直接滑出该题的历史作答记录。

---

## 二、 架构设计与文件变更清单

```
web/
├── index.html                 # 修改：顶部新增 Tab，页面主体新增 tab-history 面板与统计卡片，做题区增加历史小组件
├── styles/main.css            # 修改：增加作答历史卡片、得分徽章、统计网格与操作按钮样式
├── js/
│   ├── history.js             # 新增：做题历史纯函数计算引擎（统计指标、筛选、排序、版本聚合）
│   ├── db.js                  # 修改：ClientDB 增加级联删除与富集查询辅助方法
│   └── app.js                 # 修改：批改落盘写入元数据、tab-history 渲染与事件绑定、二练重构与报告还原
└── tests/
    └── test_question_history.js # 新增：纯函数核心逻辑自动化单元测试（Node.js）
```

---

## 三、 分步骤任务清单 (Bite-sized TDD Tasks)

### Task 1: 编写做题历史核心纯函数单元测试 (TDD Red)

**Objective:** 编写针对 `QuestionHistoryHelper` 的纯函数单元测试，覆盖数据富集、统计指标核算、题型/试卷过滤、得分/时间排序以及同一小题版本聚合。

**Files:**
- Create: `web/tests/test_question_history.js`

**Step 1: 编写测试文件**

```javascript
// web/tests/test_question_history.js
const assert = require('assert');

// 导入待实现的纯逻辑模块 (Node 环境兼容)
const { QuestionHistoryHelper } = require('../js/history.js');

console.log("=== 开始执行做题历史核心功能纯函数单元测试 ===");

// 1. 模拟数据集
const mockSubmissions = [
  {
    id: "sub_1001",
    questionType: "single",
    questionTitle: "归纳小微企业融资难的表现",
    examId: "gk2024_provincial",
    examTitle: "2024年国考副省级",
    questionId: "gk2024_prov_q1",
    materials: "材料1...",
    userAnswer: "一是担保门槛高；二是审批周期长。",
    wordCount: 20,
    score: 16.0,
    targetScore: 20,
    grade: "一类文",
    copyRatio: 0.05,
    createdAt: 1710000000000
  },
  {
    id: "sub_1002",
    questionType: "single",
    questionTitle: "归纳小微企业融资难的表现",
    examId: "gk2024_provincial",
    examTitle: "2024年国考副省级",
    questionId: "gk2024_prov_q1",
    materials: "材料1...",
    userAnswer: "一是抵押物不足，二是金融产品单一。",
    wordCount: 22,
    score: 18.5,
    targetScore: 20,
    grade: "一类文",
    copyRatio: 0.04,
    createdAt: 1710100000000
  },
  {
    id: "sub_1003",
    questionType: "essay",
    questionTitle: "以‘流动与守常’为题撰写大作文",
    examId: "gk2023_provincial",
    examTitle: "2023年国考副省级",
    questionId: "gk2023_prov_q5",
    materials: "材料5...",
    userAnswer: "大作文明理立意，浩浩长河...",
    wordCount: 1050,
    score: 28.0,
    targetScore: 35,
    grade: "二类文",
    copyRatio: 0.12,
    createdAt: 1710200000000
  },
  {
    id: "sub_1004_legacy", // 兼容旧数据：未冗余 score，需从 reports 补齐
    questionType: "doc",
    questionTitle: "调研座谈会汇报发言提纲",
    materials: "材料3...",
    userAnswer: "各位领导，现将我村调研情况汇报如下...",
    wordCount: 420,
    createdAt: 1710300000000
  }
];

const mockReports = [
  {
    id: "rep_2004",
    submissionId: "sub_1004_legacy",
    score: 20.0,
    target_score: 25,
    grade: "一类文",
    copy_ratio: 0.08
  }
];

// Test 1: 元数据富集与兼容旧版本数据合并
console.log("-> 验证 Test 1: 元数据富集与旧数据合并");
const enriched = QuestionHistoryHelper.enrichSubmissions(mockSubmissions, mockReports);
assert.strictEqual(enriched.length, 4, "应当返回 4 条富集数据");
const legacyItem = enriched.find(s => s.id === "sub_1004_legacy");
assert.strictEqual(legacyItem.score, 20.0, "应当成功从 reports 中回填实得分数");
assert.strictEqual(legacyItem.targetScore, 25, "应当成功从 reports 中回填满分值");
assert.strictEqual(legacyItem.scoringRate, 80, "得分率应当正确计算为 80%");
console.log("  ✅ Test 1 通过：富集逻辑正确，完美兼容旧数据");

// Test 2: 宏观做题统计看板核算
console.log("-> 验证 Test 2: 宏观做题统计看板核算");
const stats = QuestionHistoryHelper.calculateStats(enriched);
assert.strictEqual(stats.totalCount, 4, "累计答卷应为 4");
assert.strictEqual(stats.essayCount, 1, "大作文应为 1");
assert.strictEqual(stats.singleCount, 2, "单一题应为 2");
assert.strictEqual(stats.docCount, 1, "公文题应为 1");
assert.strictEqual(stats.totalWords, 1512, "总字数应为 1512 字");
assert.strictEqual(typeof stats.avgScoringRate, 'number', "平均得分率应为数值");
assert.ok(stats.avgScoringRate > 75 && stats.avgScoringRate < 85, "平均得分率应在合理区间");
console.log("  ✅ Test 2 通过：宏观统计指标计算精准");

// Test 3: 题型与关键词筛选
console.log("-> 验证 Test 3: 题型与关键词筛选");
const singleOnly = QuestionHistoryHelper.filterItems(enriched, { questionType: "single" });
assert.strictEqual(singleOnly.length, 2, "筛选单一题应返回 2 条");

const searched = QuestionHistoryHelper.filterItems(enriched, { keyword: "融资难" });
assert.strictEqual(searched.length, 2, "按题目关键词搜索应返回 2 条");

const searchedExam = QuestionHistoryHelper.filterItems(enriched, { examId: "gk2023_provincial" });
assert.strictEqual(searchedExam.length, 1, "按真题试卷筛选应返回 1 条");
console.log("  ✅ Test 3 通过：多维筛选准确无误");

// Test 4: 排序功能
console.log("-> 验证 Test 4: 排序功能");
const sortedByDateDesc = QuestionHistoryHelper.sortItems(enriched, "date_desc");
assert.strictEqual(sortedByDateDesc[0].id, "sub_1004_legacy", "按时间降序最新的一条应在首位");

const sortedByScoreDesc = QuestionHistoryHelper.sortItems(enriched, "score_desc");
assert.strictEqual(sortedByScoreDesc[0].id, "sub_1003", "按绝对得分降序最高分 28.0 应在首位");

const sortedByRateDesc = QuestionHistoryHelper.sortItems(enriched, "rate_desc");
assert.strictEqual(sortedByRateDesc[0].id, "sub_1002", "按得分率降序 92.5% (18.5/20) 应在首位");
console.log("  ✅ Test 4 通过：时间与得分多维度排序均符合预期");

// Test 5: 同题版本聚合与二练提分分析
console.log("-> 验证 Test 5: 同题多版本聚合与二练提分分析");
const versions = QuestionHistoryHelper.findQuestionVersions(enriched, "gk2024_prov_q1");
assert.strictEqual(versions.length, 2, "gk2024_prov_q1 应当有 2 个练习版本");
assert.strictEqual(versions[0].versionIndex, 1, "最早一次作为第 1 版");
assert.strictEqual(versions[1].versionIndex, 2, "最新一次作为第 2 版");
assert.strictEqual(versions[1].scoreDelta, 2.5, "第 2 版相比第 1 版应体现 +2.5 提分");
console.log("  ✅ Test 5 通过：同一试题多轮重构版本链与提分分析正确");

console.log("🎉 做题历史核心功能全部单元测试通过！");
```

**Step 2: 运行测试以确认失败 (Red)**

Run: `node web/tests/test_question_history.js`
Expected output: FAIL — `Cannot find module '../js/history.js'`

---

### Task 2: 实现做题历史领域核心纯逻辑模块 (TDD Green)

**Objective:** 创建 `web/js/history.js`，实现 `QuestionHistoryHelper` 纯函数集合，提供元数据富集、指标统计、筛选、排序、版本聚合，支持浏览器与 Node.js 双运行环境。

**Files:**
- Create: `web/js/history.js`
- Test: `web/tests/test_question_history.js`

**Step 1: 编写实现代码**

```javascript
// web/js/history.js
/**
 * 申论研习台 - 做题历史与二练复盘领域纯逻辑引擎
 * 纯函数无副作用设计，支持浏览器与 Node 测试环境
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.QuestionHistoryHelper = factory();
  }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  const QuestionHistoryHelper = {
    /**
     * 将 submissions 和 reports 关联，补齐缺失的字段并计算得分率
     */
    enrichSubmissions(submissions, reports = []) {
      if (!Array.isArray(submissions)) return [];
      const reportMap = new Map();
      reports.forEach(r => {
        if (r && r.submissionId) reportMap.set(r.submissionId, r);
      });

      return submissions.map(sub => {
        const rep = reportMap.get(sub.id);
        const effectiveScore = typeof sub.score === 'number' ? sub.score : (rep && typeof rep.score === 'number' ? rep.score : null);
        const effectiveTarget = typeof sub.targetScore === 'number' ? sub.targetScore : (rep && (rep.target_score || rep.targetScore) ? Number(rep.target_score || rep.targetScore) : (sub.questionType === 'essay' ? 35 : (sub.questionType === 'doc' ? 25 : 20)));
        const effectiveGrade = sub.grade || (rep && rep.grade) || '已批改';
        const effectiveCopyRatio = typeof sub.copyRatio === 'number' ? sub.copyRatio : (rep && typeof rep.copy_ratio === 'number' ? rep.copy_ratio : 0);

        let scoringRate = null;
        if (effectiveScore !== null && effectiveTarget > 0) {
          scoringRate = Math.round((effectiveScore / effectiveTarget) * 100);
        }

        return {
          ...sub,
          score: effectiveScore,
          targetScore: effectiveTarget,
          grade: effectiveGrade,
          copyRatio: effectiveCopyRatio,
          scoringRate: scoringRate,
          createdAt: sub.createdAt || Date.now()
        };
      });
    },

    /**
     * 计算宏观做题统计指标
     */
    calculateStats(enrichedSubmissions) {
      const items = Array.isArray(enrichedSubmissions) ? enrichedSubmissions : [];
      const totalCount = items.length;
      let totalWords = 0;
      let scoreRateSum = 0;
      let ratedCount = 0;

      let essayCount = 0;
      let docCount = 0;
      let singleCount = 0;
      let excellentCount = 0; // 一类文/优秀

      items.forEach(item => {
        totalWords += (item.wordCount || (item.userAnswer ? item.userAnswer.length : 0));
        if (item.questionType === 'essay') essayCount++;
        else if (item.questionType === 'doc') docCount++;
        else if (item.questionType === 'single') singleCount++;

        if (typeof item.scoringRate === 'number') {
          scoreRateSum += item.scoringRate;
          ratedCount++;
        }
        if (item.grade && (item.grade.includes('一类') || item.grade.includes('优秀') || item.scoringRate >= 80)) {
          excellentCount++;
        }
      });

      const avgScoringRate = ratedCount > 0 ? Math.round(scoreRateSum / ratedCount) : 0;
      const excellentRate = totalCount > 0 ? Math.round((excellentCount / totalCount) * 100) : 0;

      return {
        totalCount,
        essayCount,
        docCount,
        singleCount,
        totalWords,
        avgScoringRate,
        excellentRate,
        excellentCount
      };
    },

    /**
     * 过滤历史列表
     */
    filterItems(items, filters = {}) {
      if (!Array.isArray(items)) return [];
      const { questionType, examId, keyword } = filters;

      return items.filter(item => {
        // 题型过滤
        if (questionType && questionType !== 'all') {
          if (item.questionType !== questionType) return false;
        }
        // 试卷过滤
        if (examId && examId !== 'all') {
          if (item.examId !== examId) return false;
        }
        // 关键词搜索（支持题目、试卷名称、答案片段）
        if (keyword && keyword.trim()) {
          const kw = keyword.trim().toLowerCase();
          const matchTitle = item.questionTitle && item.questionTitle.toLowerCase().includes(kw);
          const matchExam = item.examTitle && item.examTitle.toLowerCase().includes(kw);
          const matchAnswer = item.userAnswer && item.userAnswer.toLowerCase().includes(kw);
          if (!matchTitle && !matchExam && !matchAnswer) return false;
        }
        return true;
      });
    },

    /**
     * 排序历史列表
     */
    sortItems(items, sortBy = 'date_desc') {
      if (!Array.isArray(items)) return [];
      const copy = [...items];

      copy.sort((a, b) => {
        if (sortBy === 'date_asc') {
          return (a.createdAt || 0) - (b.createdAt || 0);
        } else if (sortBy === 'score_desc') {
          return (b.score || 0) - (a.score || 0);
        } else if (sortBy === 'score_asc') {
          return (a.score || 0) - (b.score || 0);
        } else if (sortBy === 'rate_desc') {
          return (b.scoringRate || 0) - (a.scoringRate || 0);
        } else if (sortBy === 'words_desc') {
          return (b.wordCount || 0) - (a.wordCount || 0);
        }
        // 默认 date_desc
        return (b.createdAt || 0) - (a.createdAt || 0);
      });

      return copy;
    },

    /**
     * 按同一小题提取历史多版本链
     */
    findQuestionVersions(items, questionIdOrTitle) {
      if (!Array.isArray(items) || !questionIdOrTitle) return [];
      const matched = items.filter(item => {
        return (item.questionId && item.questionId === questionIdOrTitle) ||
               (item.questionTitle && item.questionTitle === questionIdOrTitle);
      });

      // 按时间正序排列
      matched.sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));

      return matched.map((item, idx) => {
        let scoreDelta = 0;
        if (idx > 0 && typeof item.score === 'number' && typeof matched[idx - 1].score === 'number') {
          scoreDelta = Number((item.score - matched[idx - 1].score).toFixed(1));
        }
        return {
          ...item,
          versionIndex: idx + 1,
          scoreDelta
        };
      });
    },

    /**
     * 时间戳友好格式化
     */
    formatDate(timestamp) {
      if (!timestamp) return '--';
      const d = new Date(timestamp);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const hours = String(d.getHours()).padStart(2, '0');
      const minutes = String(d.getMinutes()).padStart(2, '0');
      return `${year}-${month}-${day} ${hours}:${minutes}`;
    }
  };

  return QuestionHistoryHelper;
});
```

**Step 2: 运行测试验证通过 (Green)**

Run: `node web/tests/test_question_history.js`
Expected output:
```
=== 开始执行做题历史核心功能纯函数单元测试 ===
-> 验证 Test 1: 元数据富集与旧数据合并
  ✅ Test 1 通过：富集逻辑正确，完美兼容旧数据
-> 验证 Test 2: 宏观做题统计看板核算
  ✅ Test 2 通过：宏观统计指标计算精准
-> 验证 Test 3: 题型与关键词筛选
  ✅ Test 3 通过：多维筛选准确无误
-> 验证 Test 4: 排序功能
  ✅ Test 4 通过：时间与得分多维度排序均符合预期
-> 验证 Test 5: 同题多版本聚合与二练提分分析
  ✅ Test 5 通过：同一试题多轮重构版本链与提分分析正确
🎉 做题历史核心功能全部单元测试通过！
```

---

### Task 3: 增强数据存储层元数据快照与级联删除 API

**Objective:** 在 `web/js/db.js` 中新增针对 `submissions` 的辅助方法：级联删除 `deleteSubmissionWithReport(subId)`，并支持安全查询关联报告。

**Files:**
- Modify: `web/js/db.js`

**Step 1: 在 ClientDB 类中增加级联删除与关联查询方法**

在 `web/js/db.js` 的 `ClientDB` 类中（`clear(storeName)` 之后）添加：

```javascript
  /**
   * 级联删除作答记录及其关联的批改报告与短板索引
   */
  async deleteSubmissionWithCascade(submissionId) {
    const db = await this.init();
    return new Promise(async (resolve, reject) => {
      try {
        const tx = db.transaction(['submissions', 'reports', 'dossier'], 'readwrite');
        const subStore = tx.objectStore('submissions');
        const repStore = tx.objectStore('reports');
        const dosStore = tx.objectStore('dossier');

        // 1. 删除 submission
        subStore.delete(submissionId);

        // 2. 删除对应的 report (通过 submissionId 索引或遍历)
        const repIndex = repStore.index('submissionId');
        const repReq = repIndex.getKey(submissionId);
        repReq.onsuccess = () => {
          if (repReq.result) {
            repStore.delete(repReq.result);
          }
        };

        // 3. 将 dossier 中关联该次提交的短板记录清除引用或标记
        const dosIndex = dosStore.index('submissionId');
        const dosReq = dosIndex.openCursor(IDBKeyRange.only(submissionId));
        dosReq.onsuccess = (e) => {
          const cursor = e.target.result;
          if (cursor) {
            cursor.delete();
            cursor.continue();
          }
        };

        tx.oncomplete = () => resolve(true);
        tx.onerror = () => reject(tx.error);
      } catch (err) {
        reject(err);
      }
    });
  }
```

**Step 2: 验证命令**

Run: `node -e "const fs = require('fs'); const content = fs.readFileSync('web/js/db.js', 'utf8'); console.log(content.includes('deleteSubmissionWithCascade') ? 'PASS' : 'FAIL');"`
Expected output: `PASS`

---

### Task 4: 升级批改成功落盘逻辑，注入完整试卷与得分元数据

**Objective:** 在 `web/js/app.js` 的 `runFullReview()` 批改成功逻辑中，将 `examId`, `examTitle`, `questionId`, `targetScore`, `score`, `grade`, `copyRatio` 冗余写入 `submissions` 表，并自动刷新历史列表与本题历史小标。

**Files:**
- Modify: `web/js/app.js:725-750`

**Step 1: 修改落盘保存代码**

在 `web/js/app.js` 的 `runFullReview()` 中：
替换原有的 `await window.clientDB.put('submissions', {...});` 逻辑：

```javascript
    // 持久化到客户端 IndexedDB (补齐丰富元数据快照)
    const subId = `sub_${Date.now()}`;
    const effectiveTargetScore = result.target_score !== undefined ? Number(result.target_score) : targetScore;
    await window.clientDB.put('submissions', {
      id: subId,
      questionType: qType,
      questionTitle: topic,
      examId: currentPaper ? currentPaper.id : null,
      examTitle: currentPaper ? currentPaper.exam_name : (topic || '自定义作答'),
      questionId: currentQuestion ? currentQuestion.id : null,
      materials: materials,
      userAnswer: userText,
      wordCount: userText.length,
      score: result.score,
      targetScore: effectiveTargetScore,
      grade: result.grade,
      copyRatio: result.copy_ratio,
      createdAt: Date.now()
    });
    await window.clientDB.put('reports', {
      id: `rep_${Date.now()}`,
      submissionId: subId,
      ...result,
      createdAt: Date.now()
    });

    // 真正沉淀进作答短板档案 (自反性记忆闭环)
    await recordDossierDefects(subId, qType, topic, userText, result);
    await renderDossierList();
    await renderDossierWarningOnReviewPage(qType);

    // 实时更新做题历史与本题历史小组件
    if (typeof renderHistoryList === 'function') {
      await renderHistoryList();
    }
    if (typeof updateQuestionHistoryBadge === 'function') {
      await updateQuestionHistoryBadge();
    }
```

---

### Task 5: 在 HTML 中添加独立的「📜 作答历史」Tab 与看板结构

**Objective:** 在 `web/index.html` 的顶部导航条中新增「📜 作答历史」Tab 按钮；在 `<main>` 中新增 `#tab-history` 完整 DOM 结构；在做题区小题栏新增本题历史快捷入口；在 `web/index.html` 底部引入 `js/history.js` 脚本。

**Files:**
- Modify: `web/index.html`

**Step 1: 顶部导航条增加 Tab**

在 `web/index.html` 的 `<!-- 导航 Tabs -->` 中：
```html
    <!-- 导航 Tabs -->
    <div class="tab-bar">
      <div class="tab-item active" onclick="switchTab('review')">✏️ 纸面作答与色谱批改</div>
      <div class="tab-item" onclick="switchTab('history')">📜 作答历史与二练复盘</div>
      <div class="tab-item" onclick="switchTab('memory')">📖 个人申论记忆库 (SM-2)</div>
      <div class="tab-item" onclick="switchTab('kb')">🏛️ 官方真题与知识库</div>
      <div class="tab-item" onclick="switchTab('dossier')">🎯 作答短板档案</div>
      <div class="tab-item" onclick="switchTab('workshop')">🛠️ Skill 提炼工坊</div>
    </div>
```

**Step 2: 做题区小题栏增加快捷提示徽章**

在 `web/index.html` 的 `#paper-questions-container` 内：
```html
              <div style="font-size: 11px; color: var(--text-muted); margin-bottom: 5px; display:flex; justify-content:space-between; align-items:center;">
                <div style="display:flex; align-items:center; gap:8px;">
                  <span>🎯 试卷各题快速直达：</span>
                  <span id="question-history-badge" style="display:none; cursor:pointer; font-size:11px; color:#38bdf8; background:rgba(56,189,248,0.12); padding:1px 6px; border-radius:4px; border:1px solid rgba(56,189,248,0.3);" onclick="filterHistoryByCurrentQuestion()">📜 本题已练 0 次</span>
                </div>
                <button type="button" class="btn btn-outline" style="padding: 1px 8px; font-size: 10.5px; border-color: rgba(56,189,248,0.4); color: #38bdf8;" onclick="toggleScoringCriteria()">
                  <span id="scoring-toggle-text">🔍 查看官方采分底稿</span>
                </button>
              </div>
```

**Step 3: 添加 `#tab-history` 完整看板容器**

在 `web/index.html` 的 `<!-- TAB 1: 纸面作答与色谱批改 -->` 之后添加：
```html
    <!-- TAB: 📜 作答历史与二练复盘 -->
    <div id="tab-history" class="tab-panel">
      <div class="card">
        <div class="card-title" style="display:flex; justify-content:space-between; align-items:center;">
          <div style="display:flex; align-items:center; gap:8px;">
            <span>📜 做题历史档案与二练复盘台</span>
            <span style="font-size:12px; color:var(--text-muted); font-weight:normal;">(100% 留存浏览器本地)</span>
          </div>
          <button class="btn btn-outline" style="padding:3px 10px; font-size:12px;" onclick="renderHistoryList()">🔄 刷新列表</button>
        </div>

        <!-- 1. 宏观做题成效统计网格 -->
        <div class="history-stats-grid" id="history-stats-container">
          <div class="history-stat-card">
            <div class="history-stat-val" id="stat-total-count" style="color: #38bdf8;">0</div>
            <div class="history-stat-lbl">累计完成答卷</div>
          </div>
          <div class="history-stat-card">
            <div class="history-stat-val" id="stat-type-dist" style="font-size: 15px; line-height: 28px; color: #f8fafc;">
              大作:0 | 公文:0 | 单一:0
            </div>
            <div class="history-stat-lbl">各题型练题分布</div>
          </div>
          <div class="history-stat-card">
            <div class="history-stat-val" id="stat-avg-rate" style="color: #4ade80;">0%</div>
            <div class="history-stat-lbl">综合平均得分率</div>
          </div>
          <div class="history-stat-card">
            <div class="history-stat-val" id="stat-total-words" style="color: #facc15;">0 字</div>
            <div class="history-stat-lbl">实战手写敲入总字数</div>
          </div>
        </div>

        <!-- 2. 多维筛选与检索工具栏 -->
        <div class="history-toolbar">
          <div class="history-filter-group">
            <button class="btn btn-sm btn-primary filter-type-btn" data-type="all" onclick="setHistoryTypeFilter('all')">🌐 全部题型</button>
            <button class="btn btn-sm btn-outline filter-type-btn" data-type="essay" onclick="setHistoryTypeFilter('essay')">✍️ 大作文</button>
            <button class="btn btn-sm btn-outline filter-type-btn" data-type="doc" onclick="setHistoryTypeFilter('doc')">📜 贯彻公文</button>
            <button class="btn btn-sm btn-outline filter-type-btn" data-type="single" onclick="setHistoryTypeFilter('single')">🎯 单一采分题</button>
          </div>

          <div style="display:flex; gap:8px; align-items:center; flex-wrap:wrap;">
            <input type="text" class="form-input" id="history-search-input" placeholder="🔍 搜索试卷、题目标题或作答内容..." style="width: 260px; padding: 4px 10px; font-size: 12px;" oninput="onHistorySearchInput()">
            <select class="form-select" id="history-sort-select" style="width: 140px; padding: 4px 8px; font-size: 12px;" onchange="onHistorySortChange()">
              <option value="date_desc">🕒 作答时间 (最新)</option>
              <option value="date_asc">🕒 作答时间 (最早)</option>
              <option value="score_desc">🏆 实得分 (最高)</option>
              <option value="rate_desc">📈 得分率 (最高)</option>
              <option value="words_desc">📝 字数 (最多)</option>
            </select>
          </div>
        </div>

        <!-- 3. 答卷历史卡片列表 -->
        <div id="history-list-container" style="display:flex; flex-direction:column; gap:12px;">
          <!-- 动态由 app.js 渲染 -->
        </div>
      </div>
    </div>
```

**Step 4: 引入脚本**

在 `web/index.html` 底部（在 `js/db.js` 之后、`js/app.js` 之前）引入：
```html
  <script src="js/history.js"></script>
```

---

### Task 6: 在 CSS 中添加作答历史专用设计规范

**Objective:** 在 `web/styles/main.css` 中增加历史看板度量网格、筛选工具条、答卷卡片、提分徽章等样式，严格遵循已有颜色变量（Design Tokens）。

**Files:**
- Modify: `web/styles/main.css`

**Step 1: 增加历史样式代码**

在 `web/styles/main.css` 末尾追加：

```css
/* ================= 做题历史与二练复盘看板样式 ================= */
.history-stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
  margin-bottom: 16px;
}
@media (max-width: 768px) {
  .history-stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
.history-stat-card {
  background: rgba(15, 23, 42, 0.6);
  border: 1px solid var(--card-border);
  border-radius: 8px;
  padding: 12px 16px;
  text-align: center;
}
.history-stat-val {
  font-size: 22px;
  font-weight: 800;
  margin-bottom: 2px;
}
.history-stat-lbl {
  font-size: 11.5px;
  color: var(--text-muted);
}
.history-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
  padding-bottom: 14px;
  margin-bottom: 14px;
  border-bottom: 1px solid var(--card-border);
}
.history-filter-group {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}
.history-item-card {
  background: rgba(30, 41, 59, 0.45);
  border: 1px solid var(--card-border);
  border-radius: 8px;
  padding: 14px 16px;
  transition: all 0.2s ease;
}
.history-item-card:hover {
  border-color: rgba(56, 189, 248, 0.4);
  background: rgba(30, 41, 59, 0.7);
}
.history-item-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 10px;
  margin-bottom: 8px;
}
.history-item-title {
  font-size: 14px;
  font-weight: 700;
  color: #f1f5f9;
}
.history-item-meta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: var(--text-muted);
  margin-bottom: 8px;
}
.history-item-snippet {
  font-size: 12.5px;
  line-height: 1.6;
  color: #94a3b8;
  background: rgba(15, 23, 42, 0.5);
  padding: 8px 12px;
  border-radius: 6px;
  margin-bottom: 10px;
  border-left: 3px solid var(--card-border);
  white-space: pre-wrap;
  max-height: 80px;
  overflow: hidden;
  text-overflow: ellipsis;
}
.history-item-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  align-items: center;
}
.score-badge-highlight {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  background: rgba(34, 197, 94, 0.12);
  border: 1px solid rgba(34, 197, 94, 0.3);
  color: #4ade80;
  padding: 2px 8px;
  border-radius: 4px;
  font-weight: 700;
  font-size: 12.5px;
}
.score-delta-badge {
  display: inline-flex;
  align-items: center;
  font-size: 11px;
  font-weight: 700;
  padding: 1px 6px;
  border-radius: 4px;
}
.delta-positive {
  background: rgba(34, 197, 94, 0.15);
  color: #4ade80;
}
.delta-negative {
  background: rgba(239, 68, 68, 0.15);
  color: #f87171;
}
```

---

### Task 7: 在 `web/js/app.js` 中实装历史列表渲染、多维筛选、二练与级联删除

**Objective:** 在 `web/js/app.js` 中实装完整的历史记录业务流：`renderHistoryList`、`setHistoryTypeFilter`、`onHistorySearchInput`、`onHistorySortChange`、`reDrillSubmission`（二练重写）、`deleteSubmissionRecord`（级联删除）、以及做题界面的本题历史小组件联动。

**Files:**
- Modify: `web/js/app.js`

**Step 1: 声明历史管理状态与过滤响应函数**

在 `web/js/app.js` 的状态区增加：
```javascript
// 做题历史状态
let currentHistoryTypeFilter = 'all';
let currentHistorySearch = '';
let currentHistorySort = 'date_desc';
```

并在 `switchTab(tabId)` 函数中，将 Tab 列表扩展并支持自动刷新历史：
```javascript
function switchTab(tabId) {
  document.querySelectorAll('.tab-item').forEach(el => el.classList.remove('active'));
  document.querySelectorAll('.tab-panel').forEach(el => el.classList.remove('active'));
  
  const tabs = ['review', 'history', 'memory', 'kb', 'dossier', 'workshop'];
  const tabIdx = tabs.indexOf(tabId);
  if (tabIdx >= 0) {
    document.querySelectorAll('.tab-item')[tabIdx].classList.add('active');
    document.getElementById('tab-' + tabId).classList.add('active');
  }
  if (tabId === 'history') {
    renderHistoryList();
  }
}
```

**Step 2: 实装 `renderHistoryList()` 与各项交互方法**

```javascript
// 切换题型过滤
function setHistoryTypeFilter(type) {
  currentHistoryTypeFilter = type;
  document.querySelectorAll('.filter-type-btn').forEach(btn => {
    if (btn.dataset.type === type) {
      btn.classList.add('btn-primary');
      btn.classList.remove('btn-outline');
    } else {
      btn.classList.remove('btn-primary');
      btn.classList.add('btn-outline');
    }
  });
  renderHistoryList();
}

function onHistorySearchInput() {
  const el = document.getElementById('history-search-input');
  currentHistorySearch = el ? el.value : '';
  renderHistoryList();
}

function onHistorySortChange() {
  const el = document.getElementById('history-sort-select');
  currentHistorySort = el ? el.value : 'date_desc';
  renderHistoryList();
}

// 核心渲染做题历史列表
async function renderHistoryList() {
  const container = document.getElementById('history-list-container');
  if (!container) return;

  const db = window.clientDB;
  const submissions = await db.getAll('submissions') || [];
  const reports = await db.getAll('reports') || [];

  // 利用 QuestionHistoryHelper 纯逻辑富集与计算
  const enriched = window.QuestionHistoryHelper ? window.QuestionHistoryHelper.enrichSubmissions(submissions, reports) : submissions;

  // 1. 刷新宏观统计卡片
  if (window.QuestionHistoryHelper) {
    const stats = window.QuestionHistoryHelper.calculateStats(enriched);
    const totalEl = document.getElementById('stat-total-count');
    if (totalEl) totalEl.innerText = stats.totalCount;
    const distEl = document.getElementById('stat-type-dist');
    if (distEl) distEl.innerText = `大作:${stats.essayCount} | 公文:${stats.docCount} | 单一:${stats.singleCount}`;
    const rateEl = document.getElementById('stat-avg-rate');
    if (rateEl) rateEl.innerText = `${stats.avgScoringRate}%`;
    const wordsEl = document.getElementById('stat-total-words');
    if (wordsEl) wordsEl.innerText = `${stats.totalWords.toLocaleString()} 字`;
  }

  // 2. 筛选与排序
  let filtered = window.QuestionHistoryHelper ? window.QuestionHistoryHelper.filterItems(enriched, {
    questionType: currentHistoryTypeFilter,
    keyword: currentHistorySearch
  }) : enriched;

  let sorted = window.QuestionHistoryHelper ? window.QuestionHistoryHelper.sortItems(filtered, currentHistorySort) : filtered;

  if (sorted.length === 0) {
    container.innerHTML = `
      <div style="padding: 40px 20px; text-align: center; color: var(--text-muted); background: rgba(15, 23, 42, 0.4); border-radius: 8px; border: 1px dashed var(--card-border);">
        <div style="font-size: 32px; margin-bottom: 8px;">📜</div>
        <div style="font-size: 14px; color: #cbd5e1;">暂无匹配的做题作答记录</div>
        <div style="font-size: 12px; margin-top: 6px;">在【纸面作答与色谱批改】页面完成一次真实批改后，答卷将自动归档至此。</div>
      </div>
    `;
    return;
  }

  // 3. 生成卡片 HTML
  const typeMap = {
    essay: { label: "大作文", color: "#38bdf8" },
    doc: { label: "公文题", color: "#818cf8" },
    single: { label: "单一题", color: "#4ade80" }
  };

  container.innerHTML = sorted.map(item => {
    const typeInfo = typeMap[item.questionType] || { label: item.questionType || "申论", color: "#94a3b8" };
    const dateStr = window.QuestionHistoryHelper ? window.QuestionHistoryHelper.formatDate(item.createdAt) : new Date(item.createdAt).toLocaleString();
    const scoreDisplay = item.score !== null ? `${item.score} / ${item.targetScore || '--'}分` : '批改处理中';
    const rateDisplay = item.scoringRate !== null ? `(${item.scoringRate}%)` : '';
    const examBadge = item.examTitle ? `🏛️ ${item.examTitle}` : '自定义题目';
    const previewSnippet = item.userAnswer ? (item.userAnswer.slice(0, 160) + (item.userAnswer.length > 160 ? '...' : '')) : '无作答文本';

    return `
      <div class="history-item-card" id="hist-card-${item.id}">
        <div class="history-item-header">
          <div>
            <div style="display:flex; align-items:center; gap:8px; margin-bottom:4px;">
              <span style="background: rgba(56,189,248,0.12); color: ${typeInfo.color}; border: 1px solid rgba(56,189,248,0.3); font-size:11px; padding:1px 6px; border-radius:4px; font-weight:700;">${typeInfo.label}</span>
              <span class="history-item-title">${window.ChromaRenderer ? window.ChromaRenderer.escapeHtml(item.questionTitle) : item.questionTitle}</span>
            </div>
            <div class="history-item-meta">
              <span>${examBadge}</span>
              <span>•</span>
              <span>🕒 ${dateStr}</span>
              <span>•</span>
              <span>📝 ${item.wordCount || item.userAnswer.length} 字</span>
              <span>•</span>
              <span>抄袭率: ${(item.copyRatio * 100).toFixed(1)}%</span>
            </div>
          </div>
          <div style="text-align:right;">
            <div class="score-badge-highlight">
              <span>🏆 ${scoreDisplay}</span>
              <span style="font-size:11px; font-weight:normal; opacity:0.85;">${rateDisplay}</span>
            </div>
            <div style="font-size:11px; color:var(--text-muted); margin-top:3px;">${item.grade || ''}</div>
          </div>
        </div>

        <div class="history-item-snippet">${window.ChromaRenderer ? window.ChromaRenderer.escapeHtml(previewSnippet) : previewSnippet}</div>

        <div class="history-item-actions">
          <button class="btn btn-outline btn-sm" style="font-size:11.5px; padding:3px 10px;" onclick="jumpToSubmissionReport('${item.id}')">🔍 查看批改色谱底稿</button>
          <button class="btn btn-primary btn-sm" style="font-size:11.5px; padding:3px 10px;" onclick="reDrillFromSubmission('${item.id}')">🔄 基于本题二练重写</button>
          <button class="btn btn-outline btn-sm" style="font-size:11.5px; padding:3px 8px; color:#f87171; border-color:rgba(239,68,68,0.3);" onclick="deleteSubmissionRecord('${item.id}')">🗑️ 删除</button>
        </div>
      </div>
    `;
  }).join('');
}

// 基于历史答卷发起二练重构
async function reDrillFromSubmission(submissionId) {
  const db = window.clientDB;
  const submissions = await db.getAll('submissions') || [];
  const sub = submissions.find(s => s.id === submissionId);
  if (!sub) {
    alert("未找到该答卷");
    return;
  }

  // 1. 切换回 review Tab
  switchTab('review');

  // 2. 还原题型
  const qTypeEl = document.getElementById('q-type');
  if (qTypeEl && sub.questionType) {
    qTypeEl.value = sub.questionType;
    if (typeof changeQuestionType === 'function') changeQuestionType();
  }

  // 3. 还原试卷或题目关联
  if (sub.examId) {
    const examSelector = document.getElementById('exam-selector');
    if (examSelector) {
      examSelector.value = sub.examId;
      await onExamSelectChange();
    }
    if (sub.questionId && typeof selectSubQuestion === 'function') {
      await selectSubQuestion(sub.questionId);
    }
  } else {
    // 自定义题目
    if (!isCustomPrompt) toggleCustomPromptMode();
    const titleEl = document.getElementById('question-title-input');
    if (titleEl) titleEl.value = sub.questionTitle;
    const matEl = document.getElementById('custom-materials-input');
    if (matEl && sub.materials) matEl.value = sub.materials;
  }

  // 4. 清空作答输入框，准备进行全新二练
  const textEl = document.getElementById('user-answer-input');
  if (textEl) {
    textEl.value = '';
    textEl.focus();
    updateWordCount();
  }

  // 5. 提示用户已进入二练模式
  alert(`🎯 已就绪：进入【${sub.questionTitle}】二次重构练习！\n原题干与给定材料已还原，作答框已清空，请结合上轮批改教训开始二练。`);
}

// 级联删除单条作答记录
async function deleteSubmissionRecord(submissionId) {
  if (!confirm("⚠️ 确定要删除该条做题记录吗？\n将同步清理对应的批改报告。该操作不可撤销。")) {
    return;
  }
  try {
    if (window.clientDB.deleteSubmissionWithCascade) {
      await window.clientDB.deleteSubmissionWithCascade(submissionId);
    } else {
      await window.clientDB.delete('submissions', submissionId);
    }
    await renderHistoryList();
    await renderDossierList();
    if (typeof updateQuestionHistoryBadge === 'function') {
      await updateQuestionHistoryBadge();
    }
  } catch (err) {
    alert("删除失败: " + err.message);
  }
}

// 更新做题区顶部“本题已练 N 次”徽章
async function updateQuestionHistoryBadge() {
  const badge = document.getElementById('question-history-badge');
  if (!badge) return;

  if (!currentQuestion && !isCustomPrompt) {
    badge.style.display = 'none';
    return;
  }

  const db = window.clientDB;
  const submissions = await db.getAll('submissions') || [];
  const qId = currentQuestion ? currentQuestion.id : null;
  const qTitle = currentQuestion ? currentQuestion.question_title : (document.getElementById('question-title-input') ? document.getElementById('question-title-input').value : '');

  const matched = submissions.filter(s => (qId && s.questionId === qId) || (qTitle && s.questionTitle === qTitle));

  if (matched.length > 0) {
    const scores = matched.map(m => m.score).filter(s => typeof s === 'number');
    const maxScore = scores.length > 0 ? Math.max(...scores) : null;
    badge.style.display = 'inline-block';
    badge.innerText = `📜 本题已练 ${matched.length} 次${maxScore !== null ? ` (最高 ${maxScore}分)` : ''}`;
  } else {
    badge.style.display = 'none';
  }
}

function filterHistoryByCurrentQuestion() {
  const qTitle = currentQuestion ? currentQuestion.question_title : '';
  switchTab('history');
  const searchInput = document.getElementById('history-search-input');
  if (searchInput && qTitle) {
    searchInput.value = qTitle;
    onHistorySearchInput();
  }
}
```

并在 `selectSubQuestion(qid)` 的末尾追加调用：
```javascript
  if (typeof updateQuestionHistoryBadge === 'function') {
    await updateQuestionHistoryBadge();
  }
```

---

### Task 8: 运行全量自动化测试与回归验证

**Objective:** 运行 Node.js 单元测试集与 pytest，确认做题历史新增功能零破坏性，全套流程严丝合缝。

**Commands:**
1. 运行做题历史纯函数测试：
   `node web/tests/test_question_history.js`
   Expected: 5/5 测试通过。
2. 运行短板档案指标测试（验证数据一致性与题型隔离）：
   `node web/tests/test_dossier_metrics.js`
   Expected: 全部 3 组测试通过。
3. 运行公文题与单一题阅卷规则测试：
   `node web/tests/test_rubrics.js`
   `node web/tests/test_single_question_fixes.js`
   Expected: 全部通过。
4. 运行后端无状态 API 与规则提取测试：
   `pytest`
   Expected: 28 passed。

---

## 四、 风险、权衡与考量 (Risks & Tradeoffs)

1. **历史旧数据字段缺失兼容 (Schema Evolution)**：
   - *风险*：用户在此前版本中保存的 `submissions` 没有 `score`、`targetScore`、`examId` 等字段。
   - *对策*：`QuestionHistoryHelper.enrichSubmissions` 采用动态补齐机制：若 `submission` 缺少 `score`，主动通过 `submissionId` 在 `reports` 中关联索取；若缺少 `targetScore` 则依据 `questionType` 默认赋分。绝不强行要求老数据做破坏性 migration。
2. **本地存储容量防护**：
   - *考虑*：单条作答体积小（< 30KB），即使用户高强度做题 1000 套，IndexedDB 占用不到 30MB。完全无需设置容量上限；用户随时可通过 `BackupManager.exportFullBackup()` 单文件全量导出。
3. **严格遵守纯客户端隐私铁律**：
   - *原则*：绝不在 FastAPI 服务端引入 SQLite 或 PostgreSQL 记录答卷。所有历史记录、统计指标计算 100% 在考生浏览器本地完成，严守零服务端数据留存的安全红线。
4. **二练重构版本提升体验**：
   - *价值*：不仅支持单次看报告，还通过同一小题多版本关联，直观计算出提分增量（如 `+2.5分`），契合申论学习中通过反思二练实现质变的学习心理。
