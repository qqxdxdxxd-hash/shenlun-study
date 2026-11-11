const assert = require('assert');
const { ChromaRenderer } = require('../js/chroma_renderer.js');

console.log("=== 开始执行 ChromaRenderer 离散切片防重复测试 ===");

const stripTags = (html) => html
  .replace(/<[^>]+>/g, '')
  .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&')
  .replace(/&quot;/g, '"').replace(/&#039;/g, "'");

// 1. 复现真实 HTML 快照中引发重复拼接的重叠 span 场景
const text = "以国家战略需求为导向，上海应进一步加强国际影响力。";
const overlappingSpans = [
  { start: 0, end: text.length, type: "main_thesis", color: "green", label: "分论点一", comment: "方向正确" },
  { start: 0, end: 10, type: "formal_phrase", color: "yellow", label: "政务规范表述", comment: "略显机械" }
];
const rendered = ChromaRenderer.render(text, overlappingSpans);
assert.strictEqual(stripTags(rendered), text, "重叠 span 渲染后还原纯文本必须与原文一字不差，绝不允许重复拼接！");

// 2. 测试完全嵌套与交叉重叠
const text2 = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const complexSpans = [
  { start: 2, end: 12, type: "story_narrative_leak", label: "案例", comment: "偏长" },
  { start: 5, end: 18, type: "copy_redline", label: "抄袭", comment: "连续摘抄" },
  { start: 8, end: 10, type: "colloquial_flaw", label: "大白话", comment: "口语" }
];
assert.strictEqual(stripTags(ChromaRenderer.render(text2, complexSpans)), text2);

// 3. 测试大白话与主观臆造样式分离
assert.strictEqual(ChromaRenderer.mapSpanClass({ type: "colloquial_flaw" }), "c-colloquial");
assert.strictEqual(ChromaRenderer.mapSpanClass({ type: "subjective_fabrication" }), "c-fake");

console.log("✓ ChromaRenderer 离散区间防重复与样式解耦测试通过！");
