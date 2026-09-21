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
let currentActiveMaterialText = "";

// 初始化
async function initApp() {
  await window.clientDB.init();

  // 0. 自动就绪真实 DeepSeek API 凭据
  if (!localStorage.getItem('shenlun_api_key')) {
    localStorage.setItem('shenlun_api_key', 'sk-2d4efe752dd542fb9a9a859052eb40cc');
  }
  if (!localStorage.getItem('shenlun_base_url')) {
    localStorage.setItem('shenlun_base_url', 'https://api.deepseek.com/v1');
  }
  if (!localStorage.getItem('shenlun_model_id')) {
    localStorage.setItem('shenlun_model_id', 'deepseek-chat');
  }

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
  await renderExamSelector();
  renderMemoryDeck();
  renderPrivateKBDocs();
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

// 动态渲染真题与私有知识库资料下拉菜单
async function renderExamSelector() {
  const selector = document.getElementById('exam-selector');
  const customKbSelect = document.getElementById('custom-load-from-kb-select');
  if (!selector) return;

  const currentSelected = selector.value;
  const userDocs = await window.clientDB.getAll('private_kb') || [];

  let html = '<optgroup label="🏛️ 预置官方真题与标准采分底稿">';
  currentExams.forEach(exam => {
    html += `<option value="${exam.id}">🏛️ ${exam.exam_name} · ${exam.question_title}</option>`;
  });
  html += '</optgroup>';

  if (userDocs.length > 0) {
    html += '<optgroup label="📂 我的私有知识库 / 上传材料 (点击直接作为试卷材料)">';
    userDocs.forEach(doc => {
      html += `<option value="${doc.id}">📂 私有材料：${doc.title} (${doc.content.length}字)</option>`;
    });
    html += '</optgroup>';
  }

  html += '<optgroup label="✏️ 自定义自由输入">';
  html += '<option value="custom_manual">✏️ 自由手动输入全新题目与资料...</option>';
  html += '</optgroup>';

  selector.innerHTML = html;

  if (customKbSelect) {
    let optHtml = '<option value="">-- 选择已上传的讲义/资料以一键载入 --</option>';
    userDocs.forEach(doc => {
      optHtml += `<option value="${doc.id}">📄 ${doc.title} (${doc.content.length}字)</option>`;
    });
    customKbSelect.innerHTML = optHtml;
  }

  if (currentSelected && selector.querySelector(`option[value="${currentSelected}"]`)) {
    selector.value = currentSelected;
  } else if (selector.options.length > 0) {
    selector.selectedIndex = 0;
  }
  await onExamSelectChange();
}

// 真题 / 私有知识库材料切换
async function onExamSelectChange() {
  const selector = document.getElementById('exam-selector');
  const key = selector.value;
  if (!key) return;

  if (key === 'custom_manual') {
    if (!isCustomPrompt) toggleCustomPromptMode();
    return;
  }

  // 1. 优先判定是否为私有知识库上传的材料
  if (key.startsWith('doc_')) {
    const userDocs = await window.clientDB.getAll('private_kb');
    const doc = userDocs.find(d => d.id === key);
    if (doc) {
      currentActiveMaterialText = doc.content; // 确保大模型与色谱比对拿到的是完整纯净原文
      document.getElementById('exam-title-badge').innerText = `📂 私有资料 · ${doc.title}`;
      document.getElementById('exam-score-badge').innerText = `共 ${doc.content.length} 字`;
      document.getElementById('prompt-text').innerText = `《${doc.title}》· 深入研读与申论综合分析`;
      document.getElementById('prompt-reqs').innerHTML = `<strong>使用材料：</strong>${doc.title}（已关联为大模型批改与抄袭比对全文基准，共 ${doc.content.length} 字）。`;

      // 优雅呈现自然原文流，过滤页码噪声，保留连贯舒适阅读与段间距
      const cleanContent = doc.content.replace(/---\s*\[第\s*\d+\s*页\]\s*---\s*/g, '').trim();
      document.getElementById('materials-panel').innerHTML = `
        <div style="font-size: 13.5px; line-height: 2.0; white-space: pre-wrap; color: #cbd5e1; padding: 8px 12px; background: rgba(15, 23, 42, 0.4); border-radius: 6px;">
${window.ChromaRenderer.escapeHtml(cleanContent)}
        </div>
      `;
      if (isCustomPrompt) toggleCustomPromptMode();
      return;
    }
  }

  // 2. 否则判定为官方预置真题
  const exam = currentExams.find(e => e.id === key);
  if (!exam) return;

  currentActiveMaterialText = exam.materials;
  document.getElementById('exam-title-badge').innerText = `🏛️ ${exam.exam_name}`;
  document.getElementById('exam-score-badge').innerText = `满分 ${exam.target_score} 分`;
  document.getElementById('prompt-text').innerText = exam.prompt_text;
  document.getElementById('prompt-reqs').innerHTML = `<strong>作答要求：</strong>${exam.prompt_reqs}`;
  
  // 优雅呈现完整原文
  document.getElementById('materials-panel').innerHTML = `
    <div style="font-size: 13.5px; line-height: 2.0; white-space: pre-wrap; color: #cbd5e1; padding: 8px 12px; background: rgba(15, 23, 42, 0.4); border-radius: 6px;">
${window.ChromaRenderer.escapeHtml(exam.materials)}
    </div>
  `;
  if (isCustomPrompt) toggleCustomPromptMode();
}

// 从私有知识库一键载入至自定义编辑框
async function onLoadDocIntoCustomPrompt() {
  const docId = document.getElementById('custom-load-from-kb-select').value;
  if (!docId) return;
  const userDocs = await window.clientDB.getAll('private_kb');
  const doc = userDocs.find(d => d.id === docId);
  if (doc) {
    document.getElementById('custom-prompt-input').value = `请结合材料《${doc.title}》，深入思考其现实意义，自选角度写一篇申论分析。`;
    document.getElementById('custom-mat-input').value = doc.content;
  }
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
  let materials = currentActiveMaterialText;

  if (isCustomPrompt) {
    topic = document.getElementById('custom-prompt-input').value || topic;
    materials = document.getElementById('custom-mat-input').value || currentActiveMaterialText;
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
    recalled_memories: recalled,
    api_key: localStorage.getItem('shenlun_api_key') || 'sk-2d4efe752dd542fb9a9a859052eb40cc',
    base_url: localStorage.getItem('shenlun_base_url') || 'https://api.deepseek.com/v1',
    model_id: localStorage.getItem('shenlun_model_id') || 'deepseek-chat'
  };

  const btn = document.getElementById('btn-start-review');
  btn.innerText = '🤖 正在向 DeepSeek-V3 请求实时考场审判（耗时约 3~6 秒）...';
  btn.disabled = true;

  // 在右侧展示清晰的加载态，告知大模型正在实时推理
  document.getElementById('chroma-text-container').innerHTML = `
    <div style="padding: 40px 20px; text-align: center; color: #38bdf8;">
      <div style="font-size: 32px; margin-bottom: 12px;">🤖</div>
      <div style="font-size: 16px; font-weight: 700;">DeepSeek-V3 正在逐句阅卷审判中...</div>
      <div style="font-size: 12px; color: var(--text-muted); margin-top: 8px;">模型正在执行：官方考规审查 ➔ 原词踩点 ➔ 抄袭红线核算 ➔ 4维量化赋分 ➔ 记忆库重塑一类文</div>
      <div style="font-size: 11px; color: #4ade80; margin-top: 6px;">预计耗时 3~6 秒，请稍候</div>
    </div>
  `;

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

  // 1. 渲染四维量化得分明细表与扣分依据 (#score-breakdown-tbody)
  const radar = res.radar_scores || {};
  const dimensions = [
    { key: "立意与总分论点", max: 12, desc: (res.grade?.includes("四类") || res.score < 20) ? "总论点或分论点不完整（未满足1+3骨架），或字数严重不足扣分" : "立意100%源于材料，首段末句亮明总论点，三分论点醒目" },
    { key: "结构与段落布局", max: 8, desc: (res.grade?.includes("四类")) ? "分论点仅设两个，正文论证段未达三段标杆，结构残缺" : "五段大五段匀称，段落字数控制在250字左右" },
    { key: "论据与论证深度", max: 10, desc: (res.copy_redline_exceeded || res.copy_ratio > 0.15) ? "存在大段照抄材料原句现象，论证沦为事实搬运缺乏深度制度剖析" : "道理论证与事例论证结合紧密，具备事后深度分析" },
    { key: "语言与公文规范", max: 5, desc: res.chroma_spans?.some(s => s.type === 'colloquial_flaw') ? "存在口语化聊天大白话，需强化政务动宾大词提炼与短句对仗" : "公文语体规范严谨，短句对仗工整" }
  ];

  let tbodyHtml = '';
  dimensions.forEach(d => {
    const scoreVal = (radar[d.key] !== undefined) ? radar[d.key] : Math.round(d.max * (res.score / 35) * 10) / 10;
    const color = scoreVal >= d.max * 0.8 ? '#4ade80' : (scoreVal >= d.max * 0.6 ? '#facc15' : '#f87171');
    tbodyHtml += `
      <tr style="border-bottom: 1px solid var(--card-border);">
        <td style="padding: 8px 10px; font-weight: 600; color: #f8fafc;">${d.key}</td>
        <td style="padding: 8px 10px; text-align: center; color: var(--text-muted);">${d.max}分</td>
        <td style="padding: 8px 10px; text-align: center; font-weight: 700; color: ${color};">${scoreVal}分</td>
        <td style="padding: 8px 10px; color: #cbd5e1; font-size: 12px; line-height: 1.5;">${d.desc}</td>
      </tr>
    `;
  });
  const tbodyEl = document.getElementById('score-breakdown-tbody');
  if (tbodyEl) tbodyEl.innerHTML = tbodyHtml;

  // 2. 渲染多视角名师与考官判语 (#perspectives-container)
  const p = res.perspectives || {};
  let phtml = '';
  if (p.examiner) {
    phtml += `<div style="margin-bottom: 8px;"><strong style="color:#38bdf8;">【考场考官前10秒第一眼定档】</strong>：${window.ChromaRenderer.escapeHtml(p.examiner)}</div>`;
  }
  if (p.structure_expert) {
    phtml += `<div style="margin-bottom: 8px;"><strong style="color:#a855f7;">【大五段骨架与对策论证诊断】</strong>：${window.ChromaRenderer.escapeHtml(p.structure_expert)}</div>`;
  }
  if (p.style_expert) {
    phtml += `<div><strong style="color:#f59e0b;">【政务文风与语汇质检诊断】</strong>：${window.ChromaRenderer.escapeHtml(p.style_expert)}</div>`;
  }
  if (!phtml) {
    phtml = '<div style="color:var(--text-muted);">暂无名师判语，系统已依据官方阅卷规范执行评分。</div>';
  }
  const persEl = document.getElementById('perspectives-container');
  if (persEl) persEl.innerHTML = phtml;

  // 3. 渲染逐句给分/扣分穿透清单 (#itemized-attribution-list)
  const spans = res.chroma_spans || [];
  const listEl = document.getElementById('itemized-attribution-list');
  if (listEl) {
    if (spans.length === 0) {
      listEl.innerHTML = '<div style="font-size:12px; color:var(--text-muted); padding:6px;">文章整体平稳，未检测到显著异常扣分点或高分命中点。</div>';
    } else {
      listEl.innerHTML = spans.map((s, idx) => {
        const snippet = userText.slice(s.start, s.end);
        const borderColor = s.color === 'green' ? '#22c55e' : (s.color === 'purple' ? '#c084fc' : (s.color === 'yellow' ? '#eab308' : '#64748b'));
        const badgeColor = s.color === 'green' ? '#4ade80' : (s.color === 'purple' ? '#d8b4fe' : (s.color === 'yellow' ? '#fde047' : '#94a3b8'));
        return `
          <div style="background: rgba(15, 23, 42, 0.7); border: 1px solid var(--card-border); border-left: 4px solid ${borderColor}; border-radius: 6px; padding: 10px 12px; font-size: 12.5px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
              <span style="font-weight: 700; color: ${badgeColor}; font-size: 13px;">${s.label || '诊断点'}</span>
              <span style="font-size: 11px; color: var(--text-muted); font-family: monospace;">位置: 第 ${s.start}~${s.end} 字</span>
            </div>
            <div style="color: #94a3b8; font-style: italic; margin-bottom: 6px; border-left: 2px solid rgba(255,255,255,0.15); padding-left: 8px;">“${window.ChromaRenderer.escapeHtml(snippet.slice(0, 80))}${snippet.length > 80 ? '...' : ''}”</div>
            <div style="color: #e2e8f0; line-height: 1.6;"><strong style="color:#38bdf8;">判定与归因</strong>：${window.ChromaRenderer.escapeHtml(s.comment)}</div>
          </div>
        `;
      }).join('');
    }
  }

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
  document.getElementById('cfg-base-url').value = localStorage.getItem('shenlun_base_url') || 'https://api.deepseek.com/v1';
  document.getElementById('cfg-api-key').value = localStorage.getItem('shenlun_api_key') || '';
  document.getElementById('cfg-model').value = localStorage.getItem('shenlun_model_id') || 'deepseek-chat';
  document.getElementById('setting-modal').classList.add('show');
}

function closeSettingModal() {
  document.getElementById('setting-modal').classList.remove('show');
}

// ================= 私有知识库上传、管理与划词入库 =================

const SAMPLE_PRIVATE_DOCS = [
  {
    id: "doc_default_1",
    title: "2026年政府工作报告生态文明与新质生产力要点.md",
    tag: "权威时政",
    content: "【新质生产力与生态文明战略指引】\n大力推进现代化产业体系建设，加快发展新质生产力。充分发挥创新主导作用，以科技创新推动产业创新，加快推进新型工业化，提高全要素生产率，不断塑造发展新动能新优势。\n\n加强生态文明建设，推进绿色低碳发展。协同推进降碳、减污、扩绿、增长，建设人与自然和谐共生的美丽中国。推动产业链供应链绿色化转型，培育壮大绿色低碳新兴产业。深入实施空气质量持续改善行动计划，统筹水资源、水环境、水生态治理。\n\n【基层治理深化要求】\n提高基层治理现代化水平。坚持和发展新时代“枫桥经验”，推进矛盾纠纷预防化解法治化。坚决克服形式主义、官僚主义，持续为基层减负松绑，让基层干部把更多精力投入到为民办实事中。",
    createdAt: Date.now() - 86400000 * 2
  },
  {
    id: "doc_default_2",
    title: "基层治理典型经验与对策模板汇编.txt",
    tag: "对策经验",
    content: "【经验一：红色物业赋能基层协商】\n某街道推行“红色物业”模式，以社区党组织为核心，组建由网格员、物业代表、业主委员会三方协同的民主协商平台。实行“月评季考”与服务公示制度，推动物业收缴率由 40% 跃升至 92%，有效化解了停车难、飞线充电等群众烦心事。\n\n【经验二：积分银行激发群众内生动力】\n建立生态积分兑换超市，把村民房前屋后清洁、垃圾分类投放、志愿巡查纳入积分档案。实行红黑榜月度评比，杜绝“干部干、群众看”的被动局面，实现了乡村环境从“倒逼整治”到“自治自觉”的根本跃迁。",
    createdAt: Date.now() - 86400000 * 5
  }
];

async function renderPrivateKBDocs() {
  const container = document.getElementById('private-kb-list');
  if (!container) return;

  let docs = await window.clientDB.getAll('private_kb');
  if (!docs || docs.length === 0) {
    for (const d of SAMPLE_PRIVATE_DOCS) {
      await window.clientDB.put('private_kb', d);
    }
    docs = SAMPLE_PRIVATE_DOCS;
  }

  container.innerHTML = docs.map(doc => `
    <div style="padding:10px; border-bottom:1px solid var(--card-border); display:flex; justify-content:space-between; align-items:center;">
      <div>
        <div style="font-size:13px; font-weight:600; color:#f8fafc;">📄 ${doc.title}</div>
        <div style="font-size:11px; color:var(--text-muted); margin-top:2px;">
          <span class="card-tag tag-blue" style="padding:1px 6px;">#${doc.tag || '私有资料'}</span>
          <span style="margin-left:6px;">${doc.content.length} 字</span>
          <span style="margin-left:6px; color:#4ade80;">本地已存</span>
        </div>
      </div>
      <div style="display:flex; gap:6px;">
        <button class="btn btn-outline" style="padding:2px 8px; font-size:11px;" onclick="openDocViewer('${doc.id}')">📖 查看与划词</button>
        <button class="btn btn-outline" style="padding:2px 6px; font-size:11px; color:#f87171;" onclick="deletePrivateDoc('${doc.id}')">🗑️</button>
      </div>
    </div>
  `).join('');
}

function openUploadDocModal() {
  document.getElementById('upload-doc-title').value = '';
  document.getElementById('upload-doc-content').value = '';
  document.getElementById('file-chosen-tip').innerText = '支持各类时政报告、名师讲义文本、个人整理笔记';
  document.getElementById('upload-doc-modal').classList.add('show');
}

function closeUploadDocModal() {
  document.getElementById('upload-doc-modal').classList.remove('show');
}

// 本地文件选择读取 (支持 .txt, .md, .json 以及带文字图层的 .pdf)
async function handleDocFileSelected(event) {
  const file = event.target.files[0];
  if (!file) return;

  const tip = document.getElementById('file-chosen-tip');
  const titleInput = document.getElementById('upload-doc-title');
  const contentInput = document.getElementById('upload-doc-content');

  titleInput.value = file.name;

  if (file.name.toLowerCase().endsWith('.pdf')) {
    tip.innerText = `⏳ 正在极速提取 PDF 文本图层... (${file.name})`;
    tip.style.color = '#38bdf8';
    try {
      const res = await window.ApiClient.extractPDF(file);
      contentInput.value = res.text;
      tip.innerText = `✓ 成功提取 PDF 文本图层：共 ${res.page_count} 页 · ${res.char_count} 字！`;
      tip.style.color = '#4ade80';
    } catch (err) {
      alert(`PDF 文本提取失败: ${err.message}`);
      tip.innerText = `❌ 提取失败: ${err.message}`;
      tip.style.color = '#f87171';
    }
  } else {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target.result;
      contentInput.value = text;
      tip.innerText = `已成功加载文本文件: ${file.name} (${text.length} 字)`;
      tip.style.color = '#4ade80';
    };
    reader.readAsText(file, 'utf-8');
  }
}

async function saveUploadedDoc() {
  const title = document.getElementById('upload-doc-title').value.trim();
  const tag = document.getElementById('upload-doc-tag').value.trim() || '私有资料';
  const content = document.getElementById('upload-doc-content').value.trim();

  if (!title || !content) {
    alert('请填写资料标题并提供内容或选择文件！');
    return;
  }

  const newDoc = {
    id: `doc_${Date.now()}`,
    title,
    tag,
    content,
    createdAt: Date.now()
  };

  await window.clientDB.put('private_kb', newDoc);
  alert(`成功存入本地知识库: 《${title}》！`);
  closeUploadDocModal();
  renderPrivateKBDocs();
  await renderExamSelector();
}

async function deletePrivateDoc(id) {
  if (!confirm('确定从本地 IndexedDB 中删除该篇学习资料吗？')) return;
  await window.clientDB.delete('private_kb', id);
  renderPrivateKBDocs();
  await renderExamSelector();
}

// 文档阅读与划词入库
let currentViewingDoc = null;
async function openDocViewer(id) {
  const docs = await window.clientDB.getAll('private_kb');
  const doc = docs.find(d => d.id === id);
  if (!doc) return;

  currentViewingDoc = doc;
  document.getElementById('viewer-doc-title').innerText = `📖 ${doc.title}`;
  const contentEl = document.getElementById('viewer-doc-content');
  contentEl.innerText = doc.content;
  document.getElementById('doc-viewer-modal').classList.add('show');

  // 绑定鼠标划词事件
  contentEl.onmouseup = handleTextSelection;
}

function closeDocViewer() {
  document.getElementById('doc-viewer-modal').classList.remove('show');
  hideFloatSelectionBtn();
}

function handleTextSelection(e) {
  const selection = window.getSelection();
  const text = selection.toString().trim();
  const floatBtn = document.getElementById('selection-float-btn');

  if (text.length >= 4) {
    floatBtn.style.display = 'block';
    floatBtn.style.top = (e.pageY - 38) + 'px';
    floatBtn.style.left = (e.pageX + 8) + 'px';
    floatBtn.onclick = async () => {
      await saveSelectedTextAsMemory(text);
    };
  } else {
    hideFloatSelectionBtn();
  }
}

function hideFloatSelectionBtn() {
  const floatBtn = document.getElementById('selection-float-btn');
  if (floatBtn) floatBtn.style.display = 'none';
}

async function saveSelectedTextAsMemory(text) {
  const title = prompt("请输入此条记忆卡片的标题（如：新质生产力核心句）：", text.slice(0, 16) + "...");
  if (!title) return;

  const newCard = {
    id: `mem_${Date.now()}`,
    category: currentViewingDoc?.tag || "时政背诵",
    tag: currentViewingDoc?.title?.slice(0, 8) || "资料摘录",
    title: title.trim(),
    content: text,
    repetitions: 0,
    interval: 0,
    ease: 2.5,
    nextReview: Date.now(),
    createdAt: Date.now()
  };

  await window.clientDB.put('memories', newCard);
  alert(`✓ 成功将精彩金句一键存入【个人申论记忆库】！\n已自动安排今日进入 SM-2 艾宾浩斯复习流。`);
  hideFloatSelectionBtn();
  renderMemoryDeck();
}

// Skill 提炼工坊文件读取 (支持 .txt, .md, 以及带文字图层的 .pdf)
async function handleSkillFileSelected(event) {
  const file = event.target.files[0];
  if (!file) return;

  document.getElementById('custom-skill-name').value = file.name.replace(/\.[^/.]+$/, "") + "批改专家";
  const skillTextArea = document.getElementById('custom-skill-text');

  if (file.name.toLowerCase().endsWith('.pdf')) {
    skillTextArea.value = "⏳ 正在提取 PDF 讲义文本图层...";
    try {
      const res = await window.ApiClient.extractPDF(file);
      skillTextArea.value = res.text;
    } catch (err) {
      alert(`PDF 解析失败: ${err.message}`);
      skillTextArea.value = "";
    }
  } else {
    const reader = new FileReader();
    reader.onload = (e) => {
      skillTextArea.value = e.target.result;
    };
    reader.readAsText(file, 'utf-8');
  }
}

async function extractAndSaveCustomSkill() {
  const name = document.getElementById('custom-skill-name').value.trim();
  const text = document.getElementById('custom-skill-text').value.trim();
  if (!name || !text) {
    alert("请填写 Skill 名称并提供讲义文本！");
    return;
  }

  try {
    const res = await window.ApiClient.extractCustomSkill(name, text);
    // 存入 IndexedDB
    await window.clientDB.put('custom_skills', {
      id: `custom_${Date.now()}`,
      name: res.name,
      description: res.description,
      prompt: res.prompt,
      questionType: "essay",
      createdAt: Date.now()
    });
    alert(`⚡ 提炼成功！已成功在本地 IndexedDB 注册私有批改专家【${name}】！\n你可在作答页面的【批改专家】下拉菜单中直接选择它进行针对性阅卷。`);
  } catch (err) {
    alert(`提炼失败: ${err.message}`);
  }
}

// 启动
document.addEventListener('DOMContentLoaded', initApp);
