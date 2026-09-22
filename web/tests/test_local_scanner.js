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

// 5. 换行符与软回车截断容错测试（用户反馈的真实体质健康题作答测试）
const newlineUserText = `各地的做法具体为：1. 提供学生体质健康报告书，已
含主要身体指标测评及改进建议，变抽测为统测；2. 保证
睡眠，开启校内午休探索。启用闲置校舍改造的午休宿舍
和大楼，配备完备的设施设备，床位充足并安排老师巡视
3. 丰富课间活动，采用拓宽走廊、分割足球场合理弥补
运动场地不足。分楼层按照益智、读书和科技的功能设置
课间活动区。根据季节变化和年龄不同按
排适合的活动。4. 校家合作，致力锻炼养成良好的运动习惯
5. 智能系统采集体育和健康数据，形成个性化体质画像
助力体质素质管理。6. 开拓体育学习场地，延伸课程至专
业场馆，开启馆校协同模式。`;

const realQuotes = [
  { quote: "各地的做法具体为：", type: "colloquial_flaw", label: "套话删除" },
  { quote: "提供学生体质健康报告书，已含主要身体指标测评及改进建议，变抽测为统测", type: "source_hit", label: "体质报告" },
  { quote: "保证睡眠，开启校内午休探索。启用闲置校舍改造的午休宿舍和大楼，配备完备的设施设备，床位充足并安排老师巡视", type: "source_hit", label: "午休保障" },
  { quote: "丰富课间活动，采用拓宽走廊、分割足球场合理弥补运动场地不足。分楼层按照益智、读书和科技的功能设置课间活动区。根据季节变化和年龄不同安排适合的活动", type: "source_hit", label: "课间活动" },
  { quote: "校家合作，致力锻炼养成良好的运动习惯", type: "source_hit", label: "校家合作" },
  { quote: "智能系统采集体育和健康数据，形成个性化体质画像助力体质素质管理", type: "source_hit", label: "数据采集" },
  { quote: "开拓体育学习场地，延伸课程至专业场馆，开启馆校协同模式", type: "source_hit", label: "馆校协同" }
];

const newlineResolved = LocalChromaScanner.resolveQuotesToSpans(newlineUserText, realQuotes);
assert.strictEqual(newlineResolved.length, 7, `Expected 7 spans across newlines, got ${newlineResolved.length}`);

const q3 = newlineResolved.find(s => s.label === "午休保障");
assert(q3, "午休保障 span must be found");
assert(newlineUserText.slice(q3.start, q3.end).startsWith("保证\n睡眠"));
assert(newlineUserText.slice(q3.start, q3.end).endsWith("安排老师巡视"));

const q4 = newlineResolved.find(s => s.label === "课间活动");
assert(q4, "课间活动 span must be found");
assert(newlineUserText.slice(q4.start, q4.end).startsWith("丰富课间活动"));
assert(newlineUserText.slice(q4.start, q4.end).endsWith("排适合的活动"));

// 6. 测试换行截断下的材料抄袭红线检测
const newlineMat = "各地因地制宜提供做法：提供学生体质健康报告书，已含主要身体指标测评及改进建议，变抽测为统测；保证睡眠，开启校内午休探索。启用闲置校舍改造的午休宿舍和大楼，配备完备的设施设备。";
const newlineCopy = LocalChromaScanner.detectCopyRedline(newlineUserText, newlineMat, 15);
assert(newlineCopy.spans.length >= 1, "Should detect copy redline across newlines");
assert(newlineCopy.copyRatio > 0.25, `Expected copy ratio > 0.25, got ${newlineCopy.copyRatio}`);

console.log("✓ LocalChromaScanner 算法测试全部通过！");
