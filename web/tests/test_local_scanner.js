const assert = require('assert');
const { LocalChromaScanner } = require('../js/local_scanner.js');

console.log("=== 开始执行 LocalChromaScanner 测试 ===");

// 1. 测试标题书名号与字数检查
const issues = LocalChromaScanner.scanTitleIssues("《关于推进生态文明建设的思考》");
assert.strictEqual(issues.length, 1);
assert(issues[0].includes("书名号"));

const longTitleIssues = LocalChromaScanner.scanTitleIssues("这是一个超过二十二个字的非常非常非常非常非常非常非常长的大标题");
assert(longTitleIssues.some(i => i.includes("标题偏长")));

// 2. 测试 15-gram 连续抄袭检测
const materials = "中国式现代化是人与自然和谐共生的现代化。必须完整、准确、全面贯彻新发展理念。";
const userAnswer = "我认为，中国式现代化是人与自然和谐共生的现代化。我们要努力工作。";
const { spans, copyRatio, exceeded } = LocalChromaScanner.detectCopyRedline(userAnswer, materials, 15);

assert.strictEqual(spans.length, 1);
assert.strictEqual(spans[0].type, "copy_redline");
assert.strictEqual(spans[0].label, "抄材料超标");
assert(copyRatio > 0.3);
assert.strictEqual(exceeded, true);

// 3. 测试 Quote-Anchor 坐标回填与容错匹配
const quotes = [
  { quote: "我们要努力工作", type: "colloquial_flaw", color: "purple" },
  { quote: "中国式现代化是人与自然和谐共生的现代化", type: "main_thesis", color: "green" }
];
const resolved = LocalChromaScanner.resolveQuotesToSpans(userAnswer, quotes);
assert.strictEqual(resolved.length, 2);
assert.strictEqual(resolved[0].start, userAnswer.indexOf("中国式现代化是人与自然和谐共生的现代化"));
assert.strictEqual(resolved[1].start, userAnswer.indexOf("我们要努力工作"));

// 4. 容错首尾8字模糊对齐测试 (模拟 LLM 引用中间省略或微调标点)
const textWithGap = "广大干部群众必须牢固树立绿水青山就是金山银山的理念，坚持生态优先绿色发展不动摇。";
const fuzzyQuote = [{ quote: "广大干部群众必须牢固树立……绿色发展不动摇" }]; // 首尾均在，中间有省略
const fuzzyResolved = LocalChromaScanner.resolveQuotesToSpans(textWithGap, fuzzyQuote);
assert.strictEqual(fuzzyResolved.length, 1);
assert.strictEqual(fuzzyResolved[0].start, 0);
assert.strictEqual(fuzzyResolved[0].end, textWithGap.indexOf("不动摇") + 3);

console.log("✓ LocalChromaScanner 算法测试全部通过！");
