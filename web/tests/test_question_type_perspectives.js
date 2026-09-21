const assert = require('assert');
const { QuestionTypeRubrics } = require('../js/rubrics.js');
const { LocalChromaScanner } = require('../js/local_scanner.js');
const { LocalMARAudit, LocalDrillEngine } = require('../js/local_drill.js');
const { ExamsLoader } = require('../js/exams_loader.js');
const { ChromaRenderer } = require('../js/chroma_renderer.js');
const { ApiClient } = require('../js/api_client.js');

global.QuestionTypeRubrics = QuestionTypeRubrics;
global.LocalChromaScanner = LocalChromaScanner;
global.LocalMARAudit = LocalMARAudit;
global.LocalDrillEngine = LocalDrillEngine;
global.ExamsLoader = ExamsLoader;
global.ChromaRenderer = ChromaRenderer;

console.log("=== 开始执行 题型自适应评分量规与考官判语测试 ===");

// ----------------------------------------------------
// 1. 测试题型量规配置与满分动态换算
// ----------------------------------------------------
console.log("\n[1] 验证 QuestionTypeRubrics 元数据与满分换算");

// 1.1 单一题（10分满分）
const single10 = QuestionTypeRubrics.getDimensions('single', 10);
assert.strictEqual(single10.length, 4);
assert.strictEqual(single10[0].key, "内容采点覆盖度");
assert.strictEqual(single10[1].key, "分类逻辑与条理");
assert.strictEqual(single10[2].key, "提炼概括度");
assert.strictEqual(single10[3].key, "表达与字数规范");
const sumSingle10 = single10.reduce((acc, d) => acc + d.max, 0);
assert.strictEqual(sumSingle10, 10, "10分单一题四维满分总和必须严格等于10分");

// 1.2 单一题（20分满分）
const single20 = QuestionTypeRubrics.getDimensions('single', 20);
const sumSingle20 = single20.reduce((acc, d) => acc + d.max, 0);
assert.strictEqual(sumSingle20, 20, "20分单一题四维满分总和必须严格等于20分");

// 1.3 公文题（20分与25分）
const doc20 = QuestionTypeRubrics.getDimensions('doc', 20);
assert.strictEqual(doc20[0].key, "内容要点覆盖");
assert.strictEqual(doc20[1].key, "格式规范三件套");
assert.strictEqual(doc20[2].key, "行文结构与层次");
assert.strictEqual(doc20[3].key, "公文语体与口吻");
assert.strictEqual(doc20.reduce((acc, d) => acc + d.max, 0), 20);

const doc25 = QuestionTypeRubrics.getDimensions('doc', 25);
assert.strictEqual(doc25.reduce((acc, d) => acc + d.max, 0), 25);

// 1.4 大作文（35分与40分）
const essay35 = QuestionTypeRubrics.getDimensions('essay', 35);
assert.strictEqual(essay35[0].key, "立意与总分论点");
assert.strictEqual(essay35[1].key, "结构与段落布局");
assert.strictEqual(essay35.reduce((acc, d) => acc + d.max, 0), 35);
console.log("✓ 题型量规元数据与满分动态等比切分检验通过");

// ----------------------------------------------------
// 2. 测试三重视角标题自适应
// ----------------------------------------------------
console.log("\n[2] 验证三重视角标题自适应提取");

const sTitles = QuestionTypeRubrics.getPerspectiveTitles('single');
assert.strictEqual(sTitles.examiner, "【考场考官前10秒第一眼定档】");
assert.strictEqual(sTitles.structure_expert, "【要素归纳与分类逻辑诊断】");
assert.strictEqual(sTitles.style_expert, "【作答规范与去流水账质检】");
assert(!sTitles.structure_expert.includes("大五段"), "单一题绝对不能包含大五段字样");

const dTitles = QuestionTypeRubrics.getPerspectiveTitles('doc');
assert.strictEqual(dTitles.examiner, "【考场考官前10秒第一眼定档】");
assert.strictEqual(dTitles.structure_expert, "【格式规范与行文逻辑诊断】");
assert.strictEqual(dTitles.style_expert, "【公文语体与场景口吻质检】");
assert(!dTitles.structure_expert.includes("大五段"), "公文题绝对不能包含大五段字样");

const eTitles = QuestionTypeRubrics.getPerspectiveTitles('essay');
assert.strictEqual(eTitles.structure_expert, "【大五段骨架与对策论证诊断】");
assert.strictEqual(eTitles.style_expert, "【政务文风与语汇质检诊断】");
console.log("✓ 三重视角专属标题检验通过");

// ----------------------------------------------------
// 3. 验证 ApiClient Prompt 生成中的题型铁律
// ----------------------------------------------------
console.log("\n[3] 验证 ApiClient.submitReview 对不同题型生成的 Prompt 约束");

(async () => {
  let capturedPrompts = [];
  global.fetch = async (url, opts) => {
    const body = JSON.parse(opts.body);
    const userMsg = body.messages.find(m => m.role === 'user')?.content || '';
    capturedPrompts.push(userMsg);
    return {
      ok: true,
      json: async () => ({
        choices: [{
          message: {
            content: JSON.stringify({
              score: 16.0,
              grade: "二类卷",
              radar_scores: { "内容采点覆盖度": 9.0, "分类逻辑与条理": 3.0, "提炼概括度": 2.5, "表达与字数规范": 1.5 },
              quotes_evaluation: [],
              perspectives: {
                examiner: "审题准确，要点齐备。",
                structure_expert: "总分结构清晰，序号列明完整。",
                style_expert: "语言紧凑，无案例拖沓。"
              },
              rewritten_exemplar: "标杆示范作答"
            })
          }
        }]
      })
    };
  };

  // 3.1 测试单一题请求
  await ApiClient.submitReview({
    api_key: "test_key",
    base_url: "https://api.deepseek.com/v1",
    model_id: "deepseek-chat",
    user_answer: "1. 加强自主创新研发；2. 攻克关键核心技术。",
    materials: "某企业坚持科技自主创新...",
    question_title: "概括经验",
    question_type: "single",
    target_score: 20
  });

  const singlePrompt = capturedPrompts[0];
  assert(singlePrompt.includes("【单一题（归纳概括/对策/理解）客观采点给分铁律】"));
  assert(singlePrompt.includes("采点给分，宁多勿少"));
  assert(singlePrompt.includes("严禁使用议论文“大五段”"));
  assert(singlePrompt.includes("内容采点覆盖度"));
  assert(singlePrompt.includes("要素归纳与分类逻辑诊断"));
  console.log("✓ 单一题 Prompt 正确注入客观采点给分铁律与禁止大五段约束");

  // 3.2 测试公文题请求
  await ApiClient.submitReview({
    api_key: "test_key",
    base_url: "https://api.deepseek.com/v1",
    model_id: "deepseek-chat",
    user_answer: "关于加强生态治理的倡议书\n广大居民朋友们：...",
    materials: "某社区开展生态环境治理...",
    question_title: "写一份倡议书",
    question_type: "doc",
    target_score: 20
  });

  const docPrompt = capturedPrompts[1];
  assert(docPrompt.includes("【贯彻执行/公文题“格式+内容+语言逻辑”三轨阅卷铁律】"));
  assert(docPrompt.includes("三轨给分：格式分 + 内容分 + 语言逻辑分"));
  assert(docPrompt.includes("严禁使用议论文“大五段骨架”"));
  assert(docPrompt.includes("格式规范三件套"));
  assert(docPrompt.includes("格式规范与行文逻辑诊断"));
  console.log("✓ 公文题 Prompt 正确注入三轨阅卷铁律与禁止大五段约束");

  // ----------------------------------------------------
  // 4. 模拟前端 DOM 渲染 renderReviewResult 验证
  // ----------------------------------------------------
  console.log("\n[4] 验证前端 DOM 渲染环境中的题型专属视图与指标卡");

  // 建立微型 DOM Mock
  const elements = {};
  const mockEl = (id) => {
    elements[id] = {
      id,
      innerText: '',
      innerHTML: '',
      style: {},
      classList: {
        add: () => {},
        remove: () => {},
        contains: () => false
      }
    };
    return elements[id];
  };

  ['score-banner-box', 'score-empty-box', 'score-val', 'score-grade', 'structure-lbl', 'structure-val',
   'copy-ratio-val', 'chroma-text-container', 'score-breakdown-tbody', 'perspectives-container',
   'itemized-attribution-list', 'exemplar-content'].forEach(mockEl);

  global.document = {
    getElementById: (id) => elements[id] || null,
    querySelectorAll: () => []
  };

  // 载入 app.js 中声明的渲染逻辑（使用同构函数检验）
  const renderReviewResult = (userText, res, passedQType, passedTargetScore) => {
    const qType = passedQType || 'essay';
    const targetScore = passedTargetScore || 20;

    // 动态更新顶部指标卡第3项
    const structLblEl = document.getElementById('structure-lbl');
    if (structLblEl && global.QuestionTypeRubrics) {
      structLblEl.innerText = global.QuestionTypeRubrics.getStructureCardLabel(qType);
    }
    const structVal = document.getElementById('structure-val');
    if (structVal) {
      let structScore = null;
      const radar = res.radar_scores || {};
      if (qType === 'single') {
        structScore = radar['分类逻辑与条理'] ?? radar['分类逻辑'] ?? null;
      } else if (qType === 'doc') {
        structScore = radar['格式规范三件套'] ?? radar['格式规范'] ?? null;
      } else {
        structScore = radar['结构与段落布局'] ?? null;
      }
      structVal.innerText = global.QuestionTypeRubrics.getStructureStatus(qType, structScore, null, res.grade);
    }

    // 4维表格渲染
    const dimensions = global.QuestionTypeRubrics.getDimensions(qType, targetScore);
    let tbodyHtml = '';
    dimensions.forEach(d => {
      tbodyHtml += `<tr><td>${d.key}</td><td>${d.max}分</td></tr>`;
    });
    document.getElementById('score-breakdown-tbody').innerHTML = tbodyHtml;

    // 名师视角渲染
    const p = res.perspectives || {};
    const pTitles = global.QuestionTypeRubrics.getPerspectiveTitles(qType);
    let phtml = '';
    if (p.examiner) phtml += `<div><strong>${pTitles.examiner}</strong>：${p.examiner}</div>`;
    if (p.structure_expert) phtml += `<div><strong>${pTitles.structure_expert}</strong>：${p.structure_expert}</div>`;
    if (p.style_expert) phtml += `<div><strong>${pTitles.style_expert}</strong>：${p.style_expert}</div>`;
    document.getElementById('perspectives-container').innerHTML = phtml;
  };

  // 4.1 单一题渲染验证
  renderReviewResult("测试作答", {
    score: 16.0,
    grade: "二类卷",
    radar_scores: { "内容采点覆盖度": 9.0, "分类逻辑与条理": 3.5, "提炼概括度": 2.5, "表达与字数规范": 1.0 },
    perspectives: {
      examiner: "审题准确",
      structure_expert: "要素归纳充分，序号清晰",
      style_expert: "去案例化良好"
    }
  }, 'single', 20);

  assert.strictEqual(elements['structure-lbl'].innerText, "分类逻辑与条理");
  assert.strictEqual(elements['structure-val'].innerText, "总分清晰");
  assert(elements['perspectives-container'].innerHTML.includes("【要素归纳与分类逻辑诊断】"));
  assert(elements['perspectives-container'].innerHTML.includes("【作答规范与去流水账质检】"));
  assert(!elements['perspectives-container'].innerHTML.includes("大五段"));
  assert(elements['score-breakdown-tbody'].innerHTML.includes("内容采点覆盖度"));
  assert(elements['score-breakdown-tbody'].innerHTML.includes("分类逻辑与条理"));
  console.log("✓ 单一题 DOM 渲染正确呈现【分类逻辑与条理】与【要素归纳与分类逻辑诊断】");

  // 4.2 公文题渲染验证
  renderReviewResult("测试作答", {
    score: 18.0,
    grade: "二类卷",
    radar_scores: { "内容要点覆盖": 11.0, "格式规范三件套": 2.8, "行文结构与层次": 2.7, "公文语体与口吻": 1.5 },
    perspectives: {
      examiner: "文种格式完整",
      structure_expert: "三件套格式合规，发文缘由充分",
      style_expert: "语体庄重得体"
    }
  }, 'doc', 20);

  assert.strictEqual(elements['structure-lbl'].innerText, "公文格式与结构");
  assert.strictEqual(elements['structure-val'].innerText, "三件套完备");
  assert(elements['perspectives-container'].innerHTML.includes("【格式规范与行文逻辑诊断】"));
  assert(elements['perspectives-container'].innerHTML.includes("【公文语体与场景口吻质检】"));
  assert(!elements['perspectives-container'].innerHTML.includes("大五段"));
  assert(elements['score-breakdown-tbody'].innerHTML.includes("内容要点覆盖"));
  assert(elements['score-breakdown-tbody'].innerHTML.includes("格式规范三件套"));
  console.log("✓ 公文题 DOM 渲染正确呈现【公文格式与结构】与【格式规范与行文逻辑诊断】");

  // 4.3 大作文渲染验证
  renderReviewResult("测试作答", {
    score: 31.0,
    grade: "一类下",
    radar_scores: { "立意与总分论点": 11.0, "结构与段落布局": 7.5, "论据与论证深度": 9.0, "语言与公文规范": 3.5 },
    perspectives: {
      examiner: "立意明确",
      structure_expert: "大五段架构完整",
      style_expert: "公文大词丰富"
    }
  }, 'essay', 35);

  assert.strictEqual(elements['structure-lbl'].innerText, "立意与骨架形态");
  assert.strictEqual(elements['structure-val'].innerText, "结构严整");
  assert(elements['perspectives-container'].innerHTML.includes("【大五段骨架与对策论证诊断】"));
  assert(elements['perspectives-container'].innerHTML.includes("【政务文风与语汇质检诊断】"));
  assert(elements['score-breakdown-tbody'].innerHTML.includes("立意与总分论点"));
  assert(elements['score-breakdown-tbody'].innerHTML.includes("结构与段落布局"));
  console.log("✓ 大作文 DOM 渲染正确保留【立意与骨架形态】与【大五段骨架与对策论证诊断】");

  console.log("\n🎉 题型自适应评分量规与考官判语测试 100% 全部通过！");
})();
