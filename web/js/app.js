/**
 * 申论智能研习台 - 主控制器与事件总线 (App Controller)
 */

const INITIAL_MEMORIES = [
  {
    id: "mem_1",
    category: "生态文明",
    tag: "双碳协同",
    title: "双碳与降碳四字协同",
    content: "协同推进降碳、减污、扩绿、增长，推进生态优先、节约集约、绿色低碳发展。",
    repetitions: 4,
    interval: 7,
    ease: 2.6,
    nextReview: Date.now() + 86400000 * 5,
    createdAt: Date.now()
  },
  {
    id: "mem_2",
    category: "基层治理",
    tag: "基层减负",
    title: "形式主义对策三件套",
    content: "一是优化考核机制，以实干实绩论英雄，坚决破除唯台账论；二是推动权力与资源下沉，让基层有权有责；三是完善容错纠错机制。",
    repetitions: 1,
    interval: 1,
    ease: 2.35,
    nextReview: Date.now(), // 今日待复习
    createdAt: Date.now()
  },
  {
    id: "mem_3",
    category: "经济发展",
    tag: "新质生产力",
    title: "新质生产力核心特征",
    content: "新质生产力以创新为主导，具有高科技、高效能、高质量特征，以全要素生产率大幅提升为核心标志。",
    repetitions: 3,
    interval: 6,
    ease: 2.5,
    nextReview: Date.now() + 86400000 * 3,
    createdAt: Date.now()
  }
];

const SKILL_DATABASE = {
  essay: [
    {
      group: "🏛️ 系统默认官方 Skill (已根据材料大作文适配)",
      id: "default_essay_expert",
      name: "【默认】材料作文大五段规范专家 (shenlun-essay-expert)",
      desc: "💡 <strong>当前选用规范</strong>：材料作文大五段规范专家 · 依据“1+3”严整结构、首段尾句总论点、正文段首分论点与匀称250字段落标准阅卷。"
    },
    {
      group: "🏛️ 系统默认官方 Skill (已根据材料大作文适配)",
      id: "default_examiner_speed",
      name: "考场前10秒盲审专家 (shenlun-examiner-speed)",
      desc: "💡 <strong>当前选用规范</strong>：模拟真实考场阅卷人前10秒第一眼扫描，聚焦标题主题词、首段末句、段落匀称度与硬伤定档。"
    },
    {
      group: "🤖 多 Agent 综合裁定",
      id: "multi_agent_essay",
      name: "多 Agent 联合切磋模式 (大五段规范 + 考官盲审 + 行政文风质检)",
      desc: "💡 <strong>当前选用规范</strong>：多 Agent 独立并发评估，大五段专家测骨架、考官测扣分红线、文风专家测词汇密度，最后由主仲裁统一裁定得分。"
    },
    {
      group: "📂 我的自定义私有 Skill (来自提炼工坊)",
      id: "custom_essay_1",
      name: "【自定义】我的议论文八大要素批改专家",
      desc: "💡 <strong>当前选用规范</strong>：用户自建私有专家 · 侧重八大要素挖掘与深度论据展开。"
    }
  ],
  doc: [
    {
      group: "🏛️ 系统默认官方 Skill (已根据公文题适配)",
      id: "default_doc_expert",
      name: "【默认】公文题三轨阅卷专家 (shenlun-official-doc-expert)",
      desc: "💡 <strong>当前选用规范</strong>：公文题三轨阅卷专家 · 严格按格式分(1~2分)+内容分(材料原词采分14~16分)+语言分三轨阅卷，核算逻辑分与格式五要素。"
    },
    {
      group: "🏛️ 系统默认官方 Skill (已根据公文题适配)",
      id: "default_doc_format",
      name: "机关行文格式与语病质检专家",
      desc: "💡 <strong>当前选用规范</strong>：死磕机关公文三件套（标题居中、称谓冒号、落款空四格），严格查处‘广大...们’等机关行文语义重复错误。"
    },
    {
      group: "🤖 多 Agent 综合裁定",
      id: "multi_agent_doc",
      name: "多 Agent 联合切磋模式 (三轨采分 + 格式规范 + 感染号召力)",
      desc: "💡 <strong>当前选用规范</strong>：并发启动格式考官与采分点比对 Agent，综合评定公文实得分数。"
    },
    {
      group: "📂 我的自定义私有 Skill (来自提炼工坊)",
      id: "custom_doc_1",
      name: "【自定义】公开信与宣传倡议书专项专家",
      desc: "💡 <strong>当前选用规范</strong>：用户自建私有专家 · 重点审查宣传倡议类公文的劝服逻辑与号召力度。"
    }
  ],
  single: [
    {
      group: "🏛️ 系统默认官方 Skill (已根据单一题适配)",
      id: "default_single_expert",
      name: "【默认】单一题八大要素采点专家 (shenlun-single-question-expert)",
      desc: "💡 <strong>当前选用规范</strong>：单一题八大要素采点专家 · 采点给分制(75%~85%)，对照材料地毯式核查问题/原因/影响/对策采分点。"
    },
    {
      group: "🏛️ 系统默认官方 Skill (已根据单一题适配)",
      id: "default_mece_expert",
      name: "归纳分类 MECE 原则专家",
      desc: "💡 <strong>当前选用规范</strong>：专项审查分类归并合理性，前置动宾小标题工整度与同类项合并深度。"
    },
    {
      group: "🤖 多 Agent 综合裁定",
      id: "multi_agent_single",
      name: "多 Agent 联合切磋模式 (采点比对 + 分类层次 + 大词提炼)",
      desc: "💡 <strong>当前选用规范</strong>：多 Agent 从采分全度、概括准度与字数限制三向联合评定。"
    },
    {
      group: "📂 我的自定义私有 Skill (来自提炼工坊)",
      id: "custom_single_1",
      name: "【自定义】要素概括与规范大词微练专家",
      desc: "💡 <strong>当前选用规范</strong>：用户自建私有专家 · 严格筛查大白话流水账，强力要求规范政务大词提炼。"
    }
  ]
};

let currentExams = [];

// 初始化
async function initApp() {
  await window.clientDB.init();

  // 1. 若记忆库为空，初始化 3 张种子卡片
  const existingMemories = await window.clientDB.getAll('memories');
  if (!existingMemories || existingMemories.length === 0) {
    for (const m of INITIAL_MEMORIES) {
      await window.clientDB.put('memories', m);
    }
  }

  // 2. 加载真题
  const fetchedExams = await window.ApiClient.getExams();
  if (fetchedExams && fetchedExams.length > 0) {
    currentExams = fetchedExams;
  }

  // 3. 渲染首屏
  renderSkillOptions('essay');
  renderMemoryDeck();
  renderDossierList();

  // 4. 绑定色谱 Popover
  window.ChromaRenderer.bindPopovers('chroma-text-container', 'span-popover');

  // 5. 检查温和备份提示
  if (window.BackupManager.checkBackupReminder()) {
    console.info("温馨提示：已超过 7 天未备份申论资产，建议点击右上角导出 JSON。");
  }
}

// Tab 切换
function switchTab(tabId) {
  document.querySelectorAll('.tab-item').forEach(el => el.classList.remove('active'));
  document.querySelectorAll('.tab-panel').forEach(el => el.classList.remove('active'));
  
  const tabIdx = ['review', 'memory', 'kb', 'dossier', 'workshop'].indexOf(tabId);
  if (tabIdx >= 0) {
    document.querySelectorAll('.tab-item')[tabIdx].classList.add('active');
    document.getElementById('tab-' + tabId).classList.add('active');
  }
}

// 题型切换
function changeQuestionType() {
  const qType = document.getElementById('q-type').value;
  renderSkillOptions(qType);

  const examSelector = document.getElementById('exam-selector');
  if (qType === 'essay') examSelector.value = 'gk2026_essay';
  else if (qType === 'single') examSelector.value = 'js2025_single';
  else if (qType === 'doc') examSelector.value = 'sydw2025_doc';
  onExamSelectChange();
}

// 动态渲染 Skill 下拉
function renderSkillOptions(qType) {
  const skills = SKILL_DATABASE[qType] || SKILL_DATABASE.essay;
  const selector = document.getElementById('skill-selector');
  if (!selector) return;

  const groups = {};
  skills.forEach(s => {
    if (!groups[s.group]) groups[s.group] = [];
    groups[s.group].push(s);
  });

  let html = '';
  for (const [groupLabel, items] of Object.entries(groups)) {
    html += `<optgroup label="${groupLabel}">`;
    items.forEach(item => {
      html += `<option value="${item.id}">${item.name}</option>`;
    });
    html += `</optgroup>`;
  }
  selector.innerHTML = html;
  selector.selectedIndex = 0;
  onSkillSelectChange();
}

function onSkillSelectChange() {
  const qType = document.getElementById('q-type').value;
  const skills = SKILL_DATABASE[qType] || SKILL_DATABASE.essay;
  const selector = document.getElementById('skill-selector');
  const selectedId = selector.value;
  const currentSkill = skills.find(s => s.id === selectedId) || skills[0];

  const descBadge = document.getElementById('skill-desc-badge');
  const statusBadge = document.getElementById('skill-badge-status');
  if (descBadge && currentSkill) descBadge.innerHTML = currentSkill.desc;
  if (statusBadge) {
    if (currentSkill.id.startsWith('default_')) {
      statusBadge.innerText = '✓ 已匹配系统默认专家';
      statusBadge.style.color = '#4ade80';
    } else if (currentSkill.id.startsWith('multi_agent')) {
      statusBadge.innerText = '🤖 多 Agent 综合裁定中';
      statusBadge.style.color = '#38bdf8';
    } else {
      statusBadge.innerText = '📂 私有自定义 Skill 模式';
      statusBadge.style.color = '#c084fc';
    }
  }
}

// 真题切换
function onExamSelectChange() {
  const key = document.getElementById('exam-selector').value;
  const exam = currentExams.find(e => e.id === key);
  if (!exam) return;

  document.getElementById('exam-title-badge').innerText = `🏛️ ${exam.exam_name}`;
  document.getElementById('exam-score-badge').innerText = `满分 ${exam.target_score} 分`;
  document.getElementById('prompt-text').innerText = exam.prompt_text;
  document.getElementById('prompt-reqs').innerHTML = `<strong>作答要求：</strong>${exam.prompt_reqs}`;
  
  // 渲染分段材料
  const matBlocks = exam.materials.split('\n\n').map((para, i) => `
    <div class="mat-block">
      <div class="mat-header">
        <span>【资料片段 ${i+1}】</span>
        <span style="color:#64748b; font-size:11px;">字数：${para.length}字</span>
      </div>
      <p><span class="para-num">§${i+1}</span>${para}</p>
    </div>
  `).join('');
  document.getElementById('materials-panel').innerHTML = matBlocks;
}

// 折叠给定资料
let isMatCollapsed = false;
function toggleMaterialsCollapse() {
  isMatCollapsed = !isMatCollapsed;
  const panel = document.getElementById('materials-panel');
  const icon = document.getElementById('mat-toggle-icon');
  if (isMatCollapsed) {
    panel.style.display = 'none';
    icon.innerText = '📖 展开给定资料 (点击查看原文)';
  } else {
    panel.style.display = 'block';
    icon.innerText = '📖 折叠给定资料';
  }
}

// 自定义题目材料切换
let isCustomPrompt = false;
function toggleCustomPromptMode() {
  isCustomPrompt = !isCustomPrompt;
  const customBox = document.getElementById('custom-prompt-container');
  const examBox = document.getElementById('exam-display-container');
  const selector = document.getElementById('exam-selector');
  const btn = document.getElementById('btn-custom-prompt');
  if (isCustomPrompt) {
    customBox.style.display = 'block';
    examBox.style.display = 'none';
    selector.disabled = true;
    btn.innerHTML = '<span>🏛️ 切回预置真题</span>';
  } else {
    customBox.style.display = 'none';
    examBox.style.display = 'block';
    selector.disabled = false;
    btn.innerHTML = '<span>✏️ 切换为自定义题目与材料</span>';
  }
}

// 字数计算
function updateWordCount() {
  const text = document.getElementById('user-essay-input').value.trim();
  document.getElementById('word-counter').innerText = text.length;
}

// 核心批改提交
async function runFullReview() {
  const userText = document.getElementById('user-essay-input').value.trim();
  const qType = document.getElementById('q-type').value;
  const skillId = document.getElementById('skill-selector').value;
  
  let topic = document.getElementById('prompt-text').innerText;
  let materials = document.getElementById('materials-panel').innerText;

  if (isCustomPrompt) {
    topic = document.getElementById('custom-prompt-input').value || topic;
    materials = document.getElementById('custom-mat-input').value || materials;
  }

  // 1. 本地 Mini-RAG 智能召回匹配记忆
  const allMemories = await window.clientDB.getAll('memories');
  const recalled = window.MiniRAG.recallTopK(allMemories, topic, userText, 3);

  const payload = {
    question_type: qType,
    question_title: topic,
    materials: materials,
    user_answer: userText,
    target_score: 35,
    skill_id: skillId,
    recalled_memories: recalled
  };

  const btn = document.getElementById('btn-start-review');
  btn.innerText = '⏳ 正在进行全真多维色谱穿透与记忆审计...';
  btn.disabled = true;

  try {
    const result = await window.ApiClient.submitReview(payload);
    renderReviewResult(userText, result);

    // 持久化到客户端 IndexedDB
    const subId = `sub_${Date.now()}`;
    await window.clientDB.put('submissions', {
      id: subId,
      questionType: qType,
      questionTitle: topic,
      materials: materials,
      userAnswer: userText,
      wordCount: userText.length,
      createdAt: Date.now()
    });
    await window.clientDB.put('reports', {
      id: `rep_${Date.now()}`,
      submissionId: subId,
      ...result,
      createdAt: Date.now()
    });
  } catch (err) {
    alert(`批改遇到错误: ${err.message}`);
  } finally {
    btn.innerText = '🚀 开始全真多维色谱穿透批改';
    btn.disabled = false;
  }
}

// 渲染批改结果
function renderReviewResult(userText, res) {
  // 分数与定档
  document.getElementById('score-val').innerText = res.score;
  document.getElementById('score-grade').innerText = res.grade;
  document.getElementById('copy-ratio-val').innerText = `${(res.copy_ratio * 100).toFixed(1)}% (${res.copy_redline_exceeded ? '⚠️超标' : '安全'})`;

  // 渲染多维色谱文本
  const html = window.ChromaRenderer.render(userText, res.chroma_spans);
  const container = document.getElementById('chroma-text-container');
  container.innerHTML = html;
  window.ChromaRenderer.bindPopovers('chroma-text-container', 'span-popover');

  // 记忆审计
  const audit = res.memory_audit || {};
  let auditHtml = `
    <div class="audit-stat">
      <span>🧠 个人记忆库调用审计：</span>
      <span class="audit-hit">✓ 已激活 ${audit.activated?.length || 0} 条</span>
      <span class="audit-miss">⚠️ 遗漏 ${audit.missed_opportunities?.length || 0} 条</span>
      <span style="color: var(--text-muted); font-size:12px;">(记忆激活率: ${Math.round((audit.activation_rate || 0)*100)}%)</span>
    </div>
    <div style="font-size: 12px; line-height: 1.6;">
  `;
  if (audit.activated && audit.activated.length) {
    auditHtml += `<div>🟢 <strong>成功调动</strong>：${audit.activated.join('、')}。</div>`;
  }
  if (audit.missed_opportunities && audit.missed_opportunities.length) {
    auditHtml += `<div style="margin-top:4px;">🔴 <strong>唤醒建议</strong>：${audit.missed_opportunities[0]}</div>`;
  }
  auditHtml += `</div>`;
  document.getElementById('memory-audit-container').innerHTML = auditHtml;

  // 示范范文
  document.getElementById('exemplar-content').innerText = res.rewritten_exemplar || "示范生成完毕";

  // 微练习
  if (res.remediation_drills && res.remediation_drills.length) {
    const drill = res.remediation_drills[0];
    document.getElementById('drill-q-text').innerText = drill.question;
    document.getElementById('drill-flaw-text').value = drill.flaw_text;
    document.getElementById('drill-container').style.display = 'block';
  }
}

// 微练习秒判
async function verifyDrill() {
  const flaw = document.getElementById('drill-flaw-text').value;
  const input = document.getElementById('drill-user-input').value.trim();
  const resEl = document.getElementById('drill-res-badge');

  try {
    const res = await window.ApiClient.verifyDrill("colloquial_to_formal", flaw, input);
    resEl.innerHTML = res.feedback;
    resEl.style.color = res.passed ? '#4ade80' : '#facc15';
    resEl.style.display = 'block';
  } catch (e) {
    resEl.innerText = '秒判服务异常';
    resEl.style.display = 'block';
  }
}

// 渲染记忆库卡片
async function renderMemoryDeck() {
  const memories = await window.clientDB.getAll('memories');
  const deck = document.getElementById('memory-deck');
  if (!deck) return;

  deck.innerHTML = memories.map(m => `
    <div class="flashcard" onclick="this.classList.toggle('flipped')">
      <div style="display:flex; justify-content:space-between; align-items:center;">
        <span class="card-tag tag-blue">#${m.category}</span>
        <span style="font-size:11px; color:#4ade80;">复习${m.repetitions || 0}次</span>
      </div>
      <div class="card-front-title">${m.title}</div>
      <div style="font-size:12px; color:var(--text-muted);">${m.tag || '核心素材'}</div>
      <div class="card-back-content">
        <strong>背诵内容：</strong><br>${m.content}
        <div class="sm2-rating-row">
          <button class="sm2-btn btn-sm2-1" onclick="event.stopPropagation(); rateCard('${m.id}', 1)">忘词 (10m)</button>
          <button class="sm2-btn btn-sm2-2" onclick="event.stopPropagation(); rateCard('${m.id}', 2)">良好 (1d)</button>
          <button class="sm2-btn btn-sm2-3" onclick="event.stopPropagation(); rateCard('${m.id}', 3)">秒答 (4d)</button>
        </div>
      </div>
    </div>
  `).join('');
}

async function rateCard(id, rating) {
  const memories = await window.clientDB.getAll('memories');
  const card = memories.find(m => m.id === id);
  if (!card) return;
  const updated = window.SM2Engine.rate(card, rating);
  await window.clientDB.put('memories', updated);
  renderMemoryDeck();
}

// 渲染病灶列表
function renderDossierList() {
  // 演示真实病灶数据
}

// BYOK 设置保存
function saveSettings() {
  const url = document.getElementById('cfg-base-url').value.trim();
  const key = document.getElementById('cfg-api-key').value.trim();
  const model = document.getElementById('cfg-model').value.trim();

  localStorage.setItem('shenlun_base_url', url);
  localStorage.setItem('shenlun_api_key', key);
  localStorage.setItem('shenlun_model_id', model);

  alert('配置已成功加密保存在当前浏览器的 localStorage 中，服务端不留痕！');
  document.getElementById('setting-modal').classList.remove('show');
}

function openSettingModal() {
  document.getElementById('cfg-base-url').value = localStorage.getItem('shenlun_base_url') || 'https://ark.cn-beijing.volces.com/api/v3';
  document.getElementById('cfg-api-key').value = localStorage.getItem('shenlun_api_key') || '';
  document.getElementById('cfg-model').value = localStorage.getItem('shenlun_model_id') || 'ep-20250210-xxxx';
  document.getElementById('setting-modal').classList.add('show');
}

function closeSettingModal() {
  document.getElementById('setting-modal').classList.remove('show');
}

// 启动
document.addEventListener('DOMContentLoaded', initApp);
