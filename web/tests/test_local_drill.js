const assert = require('assert');
const { LocalDrillEngine, LocalMARAudit } = require('../js/local_drill.js');

console.log("=== 开始执行 LocalDrillEngine & LocalMARAudit 测试 ===");

// 1. 测试微练习秒判：命中政务词通过
const passRes = LocalDrillEngine.verifyDrill("colloquial_to_formal", "村里没钱办事", "完善财政保障机制，健全权责清单");
assert.strictEqual(passRes.passed, true);
assert(passRes.score >= 90);
assert(passRes.feedback.includes("机制"));

// 2. 测试微练习秒判：纯大白话未通过
const failRes = LocalDrillEngine.verifyDrill("colloquial_to_formal", "村里没钱办事", "大家都不想给钱干活");
assert.strictEqual(failRes.passed, false);
assert.strictEqual(failRes.score, 60);

// 3. 测试空作答校验
const emptyRes = LocalDrillEngine.verifyDrill("colloquial_to_formal", "村里没钱办事", "   ");
assert.strictEqual(emptyRes.passed, false);
assert.strictEqual(emptyRes.score, 0);

// 4. 测试微练习生成
const sampleQuotes = [
  { quote: "村里天天发文件搞留痕", type: "colloquial_flaw", comment: "形式主义口语" },
  { quote: "发展经济是硬道理", type: "main_thesis", comment: "论点" }
];
const drills = LocalDrillEngine.generateDrills(sampleQuotes);
assert.strictEqual(drills.length, 1);
assert.strictEqual(drills[0].flaw_text, "村里天天发文件搞留痕");

// 5. 测试 MAR 记忆激活审计
const memories = [
  { title: "生态保护补偿机制", content: "健全横向生态补偿机制，严格考核，倒逼产业绿色低碳转型", category: "生态文明", tag: "政策" },
  { title: "新质生产力内涵", content: "创新起主导作用，具有高科技、高效能、高质量特征", category: "经济发展", tag: "金句" }
];

const candidateAnswer = "在生态环境治理中，我们必须健全横向生态补偿机制，推进产业绿色低碳转型。";
const audit = LocalMARAudit.auditMemoryActivation(candidateAnswer, memories);

assert.strictEqual(audit.activation_rate, 0.5);
assert.strictEqual(audit.activated.length, 1);
assert(audit.activated[0].includes("生态保护补偿机制"));
assert.strictEqual(audit.missed_opportunities.length, 1);
assert(audit.missed_opportunities[0].includes("新质生产力内涵"));

// 6. 测试单一题提示词完全解耦系统硬编码
const singlePrompt = LocalMARAudit.buildMARPrompt("作答", "单一题", memories, "single");
assert(!singlePrompt.includes("1000~1100字"), "严禁包含硬编码大作文字数");
assert(!singlePrompt.includes("大五段"), "严禁包含硬编码大五段结构");
assert(!singlePrompt.includes("[来自记忆库"), "严禁强制标注记忆库标签");
assert(!singlePrompt.includes("32+ 分标杆"), "严禁硬编码大作文32分标杆");

// 7. 测试大作文 MAR Prompt 动态注入字数区间、核心主题词锚定与降重禁令，且不影响 single 题型
const essayPrompt = LocalMARAudit.buildMARPrompt(
  "草稿文本",
  "以“领跑新时代高质量发展”为主题写一篇文章",
  memories,
  "essay",
  { minWords: 800, maxWords: 1000 }
);
assert(essayPrompt.includes("800") && essayPrompt.includes("1000"), "大作文重写指令必须传入真实字数上下限");
assert(essayPrompt.includes("领跑新时代高质量发展"), "大作文重写指令必须锁定核心主题词");
assert(essayPrompt.includes("15字") || essayPrompt.includes("15 字"), "必须明确限制连续照抄材料原文不超过15字");

// 8. 测试微练习拒收原句照抄凑词，并支持 formal_term 精准提炼提示
const echoFail = LocalDrillEngine.verifyDrill("colloquial_to_formal", "中华民族的伟大复兴需一步一个脚印", "中华民族的伟大复兴需一步一个脚印机制");
assert.strictEqual(echoFail.passed, false, "微练习不得通过简单在原句末尾拼接一个关键词蒙混过关");

const drillsWithHint = LocalDrillEngine.generateDrills([
  { quote: "一步一个脚印", type: "colloquial_flaw", formal_term: "稳扎稳打推进" }
]);
assert(drillsWithHint[0].hint.includes("稳扎稳打推进"), "若批改返回 formal_term，微练习提示应展示规范替换方向");

console.log("✓ LocalDrillEngine & LocalMARAudit 算法测试通过！");
