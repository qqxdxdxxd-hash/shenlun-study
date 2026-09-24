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
