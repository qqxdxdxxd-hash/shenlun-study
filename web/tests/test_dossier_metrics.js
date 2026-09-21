// 自动化验证：通用化作答短板档案指标计算与题型隔离测试
const assert = require('assert');

// 模拟导入五大元维度定义
const UNIVERSAL_DEFECT_DIMENSIONS = {
  DIM_THEME: { key: "DIM_THEME", name: "审题立意与核心观点" },
  DIM_STRUCTURE: { key: "DIM_STRUCTURE", name: "段落布局与结构逻辑" },
  DIM_ANALYSIS: { key: "DIM_ANALYSIS", name: "论证深度与要点提炼" },
  DIM_EXPRESSION: { key: "DIM_EXPRESSION", name: "政务规范与语言洗练" },
  DIM_COMPLIANCE: { key: "DIM_COMPLIANCE", name: "客观合规与规程红线" }
};

// 复制待测的核心纯函数 calculateDossierMetrics
function calculateDossierMetrics(dossiers, submissions, filterType = 'all') {
  const filteredSubmissions = submissions.filter(s => filterType === 'all' || s.questionType === filterType);
  const totalSubmissions = filteredSubmissions.length;
  const recentSubmissions = filteredSubmissions.slice(-5);
  const recentSubIds = new Set(recentSubmissions.map(s => s.id));

  const dimStats = [];
  const criticals = [];

  for (const [dimKey, meta] of Object.entries(UNIVERSAL_DEFECT_DIMENSIONS)) {
    const dimDossiers = dossiers.filter(d => {
      const matchDim = d.dimensionKey === dimKey;
      const matchType = (filterType === 'all' || d.questionType === filterType || (!d.questionType && filterType === 'essay'));
      return matchDim && matchType;
    });

    const totalInstances = dimDossiers.length;
    const distinctSubIds = new Set(dimDossiers.map(d => d.submissionId));
    const distinctCount = distinctSubIds.size;
    const occurrenceRate = totalSubmissions > 0 ? Math.min(100, Math.round((distinctCount / totalSubmissions) * 100)) : 0;
    const density = totalSubmissions > 0 ? (totalInstances / totalSubmissions).toFixed(1) : "0.0";

    const recentUnclearedDossiers = dimDossiers.filter(d => recentSubIds.has(d.submissionId) && !d.cleared);
    const recentDistinctSubHits = new Set(recentUnclearedDossiers.map(d => d.submissionId)).size;
    const unclearedCount = dimDossiers.filter(d => !d.cleared).length;

    let status = "良好达标";
    let statusColor = "#4ade80";
    let severityRank = 3;

    if (totalInstances > 0 && unclearedCount === 0) {
      status = "已切除克服";
      statusColor = "#38bdf8";
      severityRank = 4;
    } else if (recentDistinctSubHits >= 2 || dimDossiers.some(d => d.severity === 'level_1_critical' && recentSubIds.has(d.submissionId) && !d.cleared)) {
      status = "一级顽固短板";
      statusColor = "#ef4444";
      severityRank = 1;
      criticals.push(meta.name);
    } else if (recentDistinctSubHits === 1 || unclearedCount > 0) {
      status = "二级关注短板";
      statusColor = "#facc15";
      severityRank = 2;
    }

    dimStats.push({
      key: dimKey,
      name: meta.name,
      items: dimDossiers,
      totalCount: totalInstances,
      distinctCount: distinctCount,
      rate: occurrenceRate,
      density: density,
      recentHits: recentDistinctSubHits,
      unclearedCount: unclearedCount,
      status: status,
      statusColor: statusColor,
      severityRank: severityRank
    });
  }

  dimStats.sort((a, b) => a.severityRank - b.severityRank);

  return {
    totalSubmissions,
    recentCount: recentSubmissions.length,
    criticals: [...new Set(criticals)],
    dimensions: dimStats
  };
}

console.log("=== 开始执行通用作答短板档案指标测试 ===");

// 测试用例 1：数学计算不穿帮（单篇作答包含 3 个口语瑕疵时，触碰率不得超过 100%）
const submissions1 = [
  { id: "sub_1", questionType: "essay" }
];
const dossiers1 = [
  { id: "d1", submissionId: "sub_1", questionType: "essay", dimensionKey: "DIM_EXPRESSION", severity: "level_2", cleared: 0 },
  { id: "d2", submissionId: "sub_1", questionType: "essay", dimensionKey: "DIM_EXPRESSION", severity: "level_2", cleared: 0 },
  { id: "d3", submissionId: "sub_1", questionType: "essay", dimensionKey: "DIM_EXPRESSION", severity: "level_2", cleared: 0 }
];
const res1 = calculateDossierMetrics(dossiers1, submissions1, 'essay');
const expr1 = res1.dimensions.find(d => d.key === "DIM_EXPRESSION");
assert.strictEqual(expr1.rate, 100, "单篇答卷多处瑕疵时，触碰率必须严格封顶 100%，不能出现 300% 穿帮");
assert.strictEqual(expr1.density, "3.0", "单篇平均密度应准确反映为 3.0 处/篇");
console.log("✅ 测试 1 通过：量纲严谨，触碰率绝不超 100%");

// 测试用例 2：题型隔离（大作文抄袭不渗漏至单一题或公文题）
const submissions2 = [
  { id: "sub_essay_1", questionType: "essay" },
  { id: "sub_single_1", questionType: "single" },
  { id: "sub_single_2", questionType: "single" }
];
const dossiers2 = [
  { id: "d_copy", submissionId: "sub_essay_1", questionType: "essay", dimensionKey: "DIM_COMPLIANCE", severity: "level_1_critical", cleared: 0 }
];
// 过滤单一题
const resSingle = calculateDossierMetrics(dossiers2, submissions2, 'single');
assert.strictEqual(resSingle.totalSubmissions, 2, "单一题总答卷数应为 2");
const complianceSingle = resSingle.dimensions.find(d => d.key === "DIM_COMPLIANCE");
assert.strictEqual(complianceSingle.rate, 0, "大作文的抄袭红线在单一题下触碰率必须为 0%");
assert.strictEqual(complianceSingle.status, "良好达标");
console.log("✅ 测试 2 通过：题型隔离生效，大作文抄袭不渗漏至单一题");

// 测试用例 3：动态切除流转（标记 cleared: 1 后脱帽降级）
const submissions3 = [
  { id: "sub_1", questionType: "essay" }
];
const dossiers3 = [
  { id: "d_cleared", submissionId: "sub_1", questionType: "essay", dimensionKey: "DIM_THEME", severity: "level_1_critical", cleared: 1 }
];
const res3 = calculateDossierMetrics(dossiers3, submissions3, 'essay');
const theme3 = res3.dimensions.find(d => d.key === "DIM_THEME");
assert.strictEqual(theme3.status, "已切除克服", "全部瑕疵均被标记 cleared 后，状态应为已切除克服");
assert.strictEqual(theme3.unclearedCount, 0);
console.log("✅ 测试 3 通过：切除流转生效，已切除短板成功脱帽");

console.log("🎉 全部 3 组短板档案指标测试 100% 通过！");
