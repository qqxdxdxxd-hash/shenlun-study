const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { ExamsLoader } = require('../js/exams_loader.js');
const { ApiClient } = require('../js/api_client.js');

console.log("=== 开始执行 真实真题题本与小题采分底稿集成测试 ===");

// 1. 验证真实 index.json
const indexPath = path.join(__dirname, '../data/exams/index.json');
assert(fs.existsSync(indexPath), "web/data/exams/index.json 必须存在");
const indexData = JSON.parse(fs.readFileSync(indexPath, 'utf-8'));
assert(indexData.length >= 48, `真题题本数量应>=48套，实测: ${indexData.length}`);

// 验证每一套题本都必须具备年份、分类与小题概要，且严格在 2020~2025 之间
indexData.forEach(paper => {
  assert(paper.id, "试卷必须包含 id");
  assert(paper.exam_name, "试卷必须包含 exam_name");
  assert(paper.year >= 2020 && paper.year <= 2025, `试卷年份必须为 2020~2025，实测: ${paper.year}`);
  assert(paper.questions_summary && paper.questions_summary.length >= 2, `试卷至少包含2道小题，实测: ${paper.questions_summary?.length}`);
});
console.log(`✓ 验证通过：共载入 ${indexData.length} 套真实国考与省考题本索引`);

// 2. 验证 2022 国考省级真题题本分片内容与采分底稿 (高教公考 1371 / 1370)
const gk2022Path = path.join(__dirname, '../data/exams/gk2022_provincial.json');
assert(fs.existsSync(gk2022Path), "2022国考省级真题分片必须存在");
const gk2022 = JSON.parse(fs.readFileSync(gk2022Path, 'utf-8'));

assert(gk2022.materials_text.includes("热效率突破50%"), "给定资料必须为B公司柴油机热效率真实材料");
assert(gk2022.materials_text.includes("光澜米业公司"), "给定资料必须包含G省米业真实材料");
assert(gk2022.materials_text.includes("未来学校"), "给定资料必须包含未来学校真实材料");
assert.strictEqual(gk2022.questions.length, 5, "2022国考省级真题必须包含5道真实试题");

const q1 = gk2022.questions[0];
assert.strictEqual(q1.q_index, 1);
assert.strictEqual(q1.target_score, 10);
assert(q1.scoring_criteria.includes("超前") || q1.scoring_criteria.includes("差异化"), "Q1必须包含官方采分底稿（超前/差异化）");

const q5 = gk2022.questions[4];
assert.strictEqual(q5.q_index, 5);
assert.strictEqual(q5.target_score, 35);
assert(q5.prompt_text.includes("今天的思维和播种"), "Q5必须为“今天的思维和播种”真实大作文题干");
assert(q5.scoring_criteria.includes("一类文"), "Q5必须包含官方大五段定档标准");
console.log("✓ 验证通过：2022国考省级全真资料与5道小题采分底稿检验完整");

// 3. 验证 2024 国考副省级真题题本
const gk2024Path = path.join(__dirname, '../data/exams/gk2024_provincial.json');
assert(fs.existsSync(gk2024Path));
const gk2024 = JSON.parse(fs.readFileSync(gk2024Path, 'utf-8'));
assert(gk2024.materials_text.includes("H光电集团"), "必须包含H光电精密光学真实材料");
assert.strictEqual(gk2024.questions.length, 5);
console.log("✓ 验证通过：2024国考副省级全真资料与采分底稿检验完整");

// 4. 验证平铺小题分片兼容性 (gk2022_prov_q1.json)
const q1Path = path.join(__dirname, '../data/exams/gk2022_prov_q1.json');
assert(fs.existsSync(q1Path), "小题兼容分片必须存在");
const q1Json = JSON.parse(fs.readFileSync(q1Path, 'utf-8'));
assert.strictEqual(q1Json.target_score, 10);
assert(q1Json.materials.includes("热效率突破50%"));
console.log("✓ 验证通过：小题平铺分片向下兼容性检验完整");

// 5. 验证大模型评审 Prompt 成功编排 Ground Truth 采分细则
(async () => {
  let capturedUserPrompt = "";
  global.fetch = async (url, opts) => {
    if (url.includes('/chat/completions')) {
      const body = JSON.parse(opts.body);
      capturedUserPrompt = body.messages[1].content;
      return {
        ok: true,
        json: async () => ({
          choices: [{ message: { content: '{"score": 9.5, "grade": "优", "quotes_evaluation": []}' } }]
        })
      };
    }
    return { ok: false };
  };

  await ApiClient.submitReview({
    api_key: "sk-test",
    user_answer: "B公司强化超前研发与前置奖励激励。",
    materials: gk2022.materials_text,
    question_title: q1.question_title,
    question_type: "single",
    target_score: 10,
    scoring_criteria: q1.scoring_criteria
  });

  assert(capturedUserPrompt.includes("【官方客观标准采分底稿与判分细则 (Ground Truth)】"), "Prompt 必须编排 Ground Truth 采分段落");
  assert(capturedUserPrompt.includes("超前研发"), "Prompt 必须包含该小题的采分实词");
  console.log("✓ 验证通过：大模型评审成功以 Ground Truth 采分底稿作为铁律约束");

  console.log("🎉 真实真题题本与采分底稿题库测试 100% 全部通过！");
})();
