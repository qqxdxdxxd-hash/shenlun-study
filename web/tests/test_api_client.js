const assert = require('assert');
const { LocalChromaScanner } = require('../js/local_scanner.js');
const { LocalMARAudit, LocalDrillEngine } = require('../js/local_drill.js');
const { ExamsLoader } = require('../js/exams_loader.js');
const { ApiClient } = require('../js/api_client.js');

global.LocalChromaScanner = LocalChromaScanner;
global.LocalMARAudit = LocalMARAudit;
global.LocalDrillEngine = LocalDrillEngine;
global.ExamsLoader = ExamsLoader;

console.log("=== 开始执行 ApiClient 纯前端集成测试 ===");

(async () => {
  // 1. 验证 preScan
  const materials = "中国式现代化是人与自然和谐共生的现代化。必须完整、准确、全面贯彻新发展理念。";
  const userText = "《浅谈绿色发展》\n中国式现代化是人与自然和谐共生的现代化。我们应该努力奋斗。";
  const preRes = await ApiClient.preScan({ user_answer: userText, materials: materials });

  assert.strictEqual(preRes.title_issues.length, 1);
  assert(preRes.title_issues[0].includes("书名号"));
  assert(preRes.copy_ratio > 0.3);
  assert.strictEqual(preRes.copy_redline_exceeded, true);
  console.log("✓ ApiClient.preScan 纯前端 1ms 规则扫描通过");

  // 2. 验证严格自持密钥 (Strict BYOK)：无 Key 报错拦截
  let caughtKeyError = false;
  try {
    await ApiClient.submitReview({
      user_answer: userText,
      materials: materials,
      question_title: "绿色发展"
    });
  } catch (err) {
    if (err.message.includes("严格自持密钥 (Strict BYOK)")) {
      caughtKeyError = true;
    }
  }
  assert.strictEqual(caughtKeyError, true);
  console.log("✓ ApiClient.submitReview 严格自持密钥 (Strict BYOK) 拦截通过");

  // 3. 验证直连大模型批改链路 (Mock Fetch)
  global.fetch = async (url, opts) => {
    if (url.includes('/chat/completions')) {
      const mockLlmResp = {
        choices: [
          {
            message: {
              content: JSON.stringify({
                score: 32.0,
                grade: "一类下 (31~32分)",
                radar_scores: { "立意与总分论点": 11.0, "结构与段落布局": 7.5, "论据与论证深度": 9.0, "语言与公文规范": 4.5 },
                quotes_evaluation: [
                  { quote: "我们应该努力奋斗", type: "colloquial_flaw", color: "purple", style: "strikethrough", label: "大白话", comment: "缺乏政务词" }
                ],
                perspectives: {
                  examiner: "立意明确，论点居首。",
                  structure_expert: "段落均匀。",
                  style_expert: "需提高政务词密度。"
                },
                rewritten_exemplar: "【标杆一类文示范】以绿色发展理念赋能新质生产力..."
              })
            }
          }
        ]
      };
      return {
        ok: true,
        json: async () => mockLlmResp
      };
    }
    return { ok: false, status: 404 };
  };

  const reviewRes = await ApiClient.submitReview({
    api_key: "sk-mock-test-key-12345",
    base_url: "https://api.deepseek.com/v1",
    model_id: "deepseek-chat",
    user_answer: userText,
    materials: materials,
    question_title: "以绿色发展引领现代化",
    question_type: "essay",
    recalled_memories: [
      { title: "绿色发展理念", content: "坚持生态优先、绿色发展，协同推进降碳、减污、扩绿、增长", category: "生态", tag: "金句" }
    ]
  });

  assert.strictEqual(reviewRes.score, 32.0);
  assert.strictEqual(reviewRes.grade, "一类下 (31~32分)");
  assert(reviewRes.chroma_spans.length >= 2); // 包含抄袭红线 span + 大白话 span
  assert(reviewRes.remediation_drills.length >= 1);
  assert.strictEqual(reviewRes.remediation_drills[0].flaw_text, "我们应该努力奋斗");
  assert(reviewRes.memory_audit.activation_rate >= 0);
  console.log("✓ ApiClient.submitReview 纯前端直连批改与色谱回填完整链路通过");

  // 4. 验证微练习秒判
  const drillRes = await ApiClient.verifyDrill("colloquial_to_formal", "村里没钱办事", "完善财政保障机制，健全权责清单");
  assert.strictEqual(drillRes.passed, true);
  assert(drillRes.score >= 90);
  console.log("✓ ApiClient.verifyDrill 纯前端微练习秒判通过");

  console.log("🎉 ApiClient 全部纯前端集成测试 100% 通过！");
})();
