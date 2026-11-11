const assert = require('assert');
const { QuestionTypeRubrics } = require('../js/rubrics.js');

console.log("Testing QuestionTypeRubrics...");

// 1. Single
const singleTitles = QuestionTypeRubrics.getPerspectiveTitles('single');
assert.strictEqual(singleTitles.structure_expert, "【要素归纳与分类逻辑诊断】");
assert.strictEqual(singleTitles.style_expert, "【作答规范与去流水账质检】");
assert.strictEqual(QuestionTypeRubrics.getStructureCardLabel('single'), "分类逻辑与条理");

const singleDims10 = QuestionTypeRubrics.getDimensions('single', 10);
assert.strictEqual(singleDims10.length, 4);
const sum10 = singleDims10.reduce((acc, d) => acc + d.max, 0);
assert.strictEqual(sum10, 10);
assert.strictEqual(singleDims10[0].key, "内容采点覆盖度");

// 2. Doc
const docTitles = QuestionTypeRubrics.getPerspectiveTitles('doc');
assert.strictEqual(docTitles.structure_expert, "【格式规范与行文逻辑诊断】");
assert.strictEqual(docTitles.style_expert, "【公文语体与场景口吻质检】");
assert.strictEqual(QuestionTypeRubrics.getStructureCardLabel('doc'), "公文格式与结构");

const docDims20 = QuestionTypeRubrics.getDimensions('doc', 20);
assert.strictEqual(docDims20.length, 4);
const sum20 = docDims20.reduce((acc, d) => acc + d.max, 0);
assert.strictEqual(sum20, 20);
assert.strictEqual(docDims20[0].key, "内容要点覆盖");
assert.strictEqual(docDims20[1].key, "格式规范三件套");

// 3. Essay
const essayTitles = QuestionTypeRubrics.getPerspectiveTitles('essay');
assert.strictEqual(essayTitles.structure_expert, "【大五段骨架与对策论证诊断】");
assert.strictEqual(essayTitles.style_expert, "【政务文风与语汇质检诊断】");
assert.strictEqual(QuestionTypeRubrics.getStructureCardLabel('essay'), "立意与骨架形态");

const essayDims35 = QuestionTypeRubrics.getDimensions('essay', 35);
assert.strictEqual(essayDims35.length, 4);
const sum35 = essayDims35.reduce((acc, d) => acc + d.max, 0);
assert.strictEqual(sum35, 35);

// 4. 字数区间解析测试
const r1 = QuestionTypeRubrics.parseWordLimits("总字数800-1000 字。", "essay");
assert.strictEqual(r1.minWords, 800);
assert.strictEqual(r1.maxWords, 1000);

const r2 = QuestionTypeRubrics.parseWordLimits("字数1000～1200字，满分40分", "essay");
assert.strictEqual(r2.minWords, 1000);
assert.strictEqual(r2.maxWords, 1200);

const r3 = QuestionTypeRubrics.parseWordLimits("不超过200 字", "single");
assert.strictEqual(r3.minWords, 160);
assert.strictEqual(r3.maxWords, 200);

const r4 = QuestionTypeRubrics.parseWordLimits("篇幅1000 字左右", "essay");
assert.strictEqual(r4.minWords, 900);
assert.strictEqual(r4.maxWords, 1100);
console.log("✓ parseWordLimits 全部字数区间格式解析通过！");

// 5. 50分制三类文（34.5/50）绝不得输出一类文正面评语，且优先采用 radar_reasons
const shanghaiDims = QuestionTypeRubrics.getDimensions('essay', 50);
const structDim = shanghaiDims.find(d => d.key === "结构与段落布局");
assert.strictEqual(
  QuestionTypeRubrics.getStructureStatus('essay', 9.0, structDim.max, '三类文'),
  '结构偏弱',
  "三类文结构分低于80%或定档三类时不得误报'结构严整'"
);

const mockThreeTierRes = {
  score: 34.5,
  target_score: 50,
  grade: "三类文",
  copy_ratio: 0.087,
  radar_scores: { "立意与总分论点": 13.5, "结构与段落布局": 9.0, "论据与论证深度": 8.5, "语言与公文规范": 3.5 },
  radar_reasons: { "结构与段落布局": "缺失第三个分论点段，全文字数仅770字不足900字" }
};
const structDescWithReason = structDim.getDesc(mockThreeTierRes, { dimMax: structDim.max, dimScore: 9.0, targetScore: 50 });
assert(structDescWithReason.includes("缺失第三个分论点段"), "应优先采用模型返回的 radar_reasons");

const themeDim = shanghaiDims.find(d => d.key === "立意与总分论点");
const themeDescFallback = themeDim.getDesc(
  { score: 34.5, target_score: 50, grade: "三类文" },
  { dimMax: themeDim.max, dimScore: 10.5, targetScore: 50 }
);
assert(!themeDescFallback.includes("三分论点醒目且递进"), "三类文或维度得分率低于80%时不得输出一类文表扬模板");
console.log("✓ 四维评语比例适配、radar_reasons 与结构状态防误报测试通过！");

console.log("✓ QuestionTypeRubrics 核心逻辑全部测试通过！");
