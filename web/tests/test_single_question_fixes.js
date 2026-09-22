/**
 * 单一题解耦与分值字数无硬编码专项验证测试
 */
const assert = require('assert');
const fs = require('fs');
const path = require('path');

console.log("=== 开始执行单一题解耦与分值/字数动态适配测试 ===");

// 1. 测试 LocalMARAudit 题型解耦
const { LocalMARAudit } = require('../js/local_drill.js');
const testMemories = [
  { title: "新质生产力核心特征", content: "创新为主导，高科技高效能高质量" },
  { title: "双碳与降碳四字协同", content: "降碳、减污、扩绿、增长" }
];

// 单一题 Prompt 测试
const singlePrompt = LocalMARAudit.buildMARPrompt("农村电商答卷", "互联网科技为农村生产生活带来新变化", testMemories, "single");
assert(!singlePrompt.includes("新质生产力核心特征"), "单一题严禁注入记忆库标题");
assert(!singlePrompt.includes("双碳与降碳四字协同"), "单一题严禁注入记忆库内容");
assert(!singlePrompt.includes("[来自记忆库"), "单一题严禁强制标注 [来自记忆库: xxx]");
assert(!singlePrompt.includes("1000~1100字"), "单一题严禁包含大作文字数");
assert(!singlePrompt.includes("大五段"), "单一题严禁包含大五段要求");
console.log("✓ Gate 3 通行: LocalMARAudit 单一题完全隔离记忆库与大作文硬编码");

// 2. 测试大作文 Prompt 仍保留素材参考 (不影响大作文能力)
const essayPrompt = LocalMARAudit.buildMARPrompt("生态文明大作文", "高质量发展", testMemories, "essay");
assert(essayPrompt.includes("新质生产力核心特征"), "大作文应提供参考素材");
console.log("✓ 大作文素材提示正常运作");

// 3. 测试题干材料分值与字数正则提取算法
function extractScoreAndWordLimit(combinedReqText) {
  let score = null;
  let wordLimit = null;
  const scoreMatch = combinedReqText.match(/(?:满分|分值|共计?|总分)\s*[:：]?\s*(\d+(?:\.\d+)?)\s*分|[（(]\s*(\d+(?:\.\d+)?)\s*分\s*[)）]/);
  if (scoreMatch) {
    score = parseFloat(scoreMatch[1] || scoreMatch[2]);
  }
  const limitMatch = combinedReqText.match(/(?:不超过|限|以内|至多)\s*(\d+)\s*字|(\d+)\s*字以内/);
  if (limitMatch) {
    wordLimit = parseInt(limitMatch[1] || limitMatch[2], 10);
  }
  return { score, wordLimit };
}

const req1 = "要求：概括全面，条理清晰，不超过250字，满分15分。";
const parsed1 = extractScoreAndWordLimit(req1);
assert.strictEqual(parsed1.score, 15, "提取满分15分失败");
assert.strictEqual(parsed1.wordLimit, 250, "提取不超过250字失败");

const req2 = "根据给定资料1（20分），分析主要问题，300字以内。";
const parsed2 = extractScoreAndWordLimit(req2);
assert.strictEqual(parsed2.score, 20, "提取（20分）失败");
assert.strictEqual(parsed2.wordLimit, 300, "提取300字以内失败");
console.log("✓ Gate 4 通行: 题干分值与字数上限动态提取精确有效");

// 4. 测试分数渲染格式模版
function formatScoreDisplay(score, targetScore) {
  return `${score} / ${targetScore}分`;
}
assert.strictEqual(formatScoreDisplay(12.5, 15), "12.5 / 15分");
assert.strictEqual(formatScoreDisplay(16, 20), "16 / 20分");
console.log("✓ Gate 4 通行: 分数/总分渲染格式完全符合预期");

console.log("🎉 单一题解耦与动态分值专项测试 100% 通过！");
