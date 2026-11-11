const assert = require('assert');
const { ExemplarFormatter } = require('../js/local_drill.js');
const { LocalChromaScanner } = require('../js/local_scanner.js');

console.log("=== 开始执行 ExemplarFormatter 纯净范文与质检测试 ===");

const rawExemplar = `以国家战略为牵引 谱写高质量发展新篇

上海唯有强化全球资源配置功能与科创策源能力，方能领跑新时代高质量发展。[来自记忆库: 新质生产力核心特征]

某段内容以新质生产力铸就高质量发展新优势。[来自记忆库: 双碳与降碳四字协同]`;

// 1. 测试剥离记忆标签得到考场纯净文本
const cleanText = ExemplarFormatter.stripMemoryTags(rawExemplar);
assert(!cleanText.includes("[来自记忆库:"), "纯净文本不得包含记忆库标签");
assert(!cleanText.includes("新质生产力核心特征"), "纯净文本不得包含卡片名");
assert(cleanText.includes("方能领跑新时代高质量发展。"), "应保留正常标点");

// 2. 测试 HTML 渲染将标签转为不可选中的 .memory-badge
const html = ExemplarFormatter.renderExemplarHtml(rawExemplar);
assert(html.includes('class="memory-badge"'), "应渲染为可视化徽章");
assert(html.includes('新质生产力核心特征'), "UI 中仍可读到所用卡片名");
assert(!html.includes('<script'), "必须完成 HTML 转义");

// 3. 测试范文质量门禁（字数区间、核心主题词、15-gram抄袭率）
const audit = ExemplarFormatter.auditExemplar(
  rawExemplar,
  "加快实施创新驱动发展战略，以国家战略需求为导向，集聚力量进行原创性科技攻关。",
  "以“领跑新时代高质量发展”为主题写一篇文章",
  800,
  1000,
  LocalChromaScanner
);
assert.strictEqual(audit.cleanCharCount < 800, true);
assert.strictEqual(audit.withinLimit, false);
assert.strictEqual(audit.titleHasTheme, false, "标题未包含完整核心主题词应检出");

console.log("✓ ExemplarFormatter 全部质检与纯净复制测试通过！");
