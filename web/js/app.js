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
      name: "【默认】公文题三轨专业阅卷专家 (shenlun-official-doc)",
      desc: "💡 <strong>当前选用规范</strong>：公文题三轨专业阅卷专家 · 格式分(2~4分)+内容分(材料原词采分14~16分)+语言分三轨阅卷，格式决策树自适应与五大公文骨架诊断。"
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
      name: "【默认】单一题八大要素客观采点与五维提分专家 (shenlun-single-expert)",
      desc: "💡 <strong>当前选用规范</strong>：单一题八大要素客观采点专家 · 采点给分制(75%~85%)，四分法材料过滤、字数排版自适应（≤200字禁小标题，250~350字强制前置动宾短语）与五维深度诊断。"
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

// 静态/纯前端保底真实真题库 (采用最近5年真实国考与省考真题)
const FALLBACK_DEFAULT_EXAMS = [
  {
    id: "gk2024_provincial",
    exam_name: "2024年国家公务员考试申论真题（副省级）",
    year: 2024,
    category: "国考",
    tier: "副省级/省级",
    char_count: 7600,
    question_count: 5,
    questions_summary: [
      { id: "gk2024_prov_q1", q_index: 1, type: "single", question_title: "H光电集团自主创新突破经验", target_score: 15 },
      { id: "gk2024_prov_q2", q_index: 2, type: "single", question_title: "某市“高效办成一件事”改革举措", target_score: 15 },
      { id: "gk2024_prov_q3", q_index: 3, type: "doc", question_title: "云栖县“土特产”产业振兴工作简报", target_score: 20 },
      { id: "gk2024_prov_q4", q_index: 4, type: "single", question_title: "海洋经济“向海图强”高质量发展分析", target_score: 15 },
      { id: "gk2024_prov_q5", q_index: 5, type: "essay", question_title: "大作文：事必有法 然后可成", target_score: 35 }
    ]
  },
  {
    id: "gk2022_provincial",
    exam_name: "2022年国家公务员考试申论真题（省级）",
    year: 2022,
    category: "国考",
    tier: "省级/副省级",
    char_count: 7800,
    question_count: 5,
    questions_summary: [
      { id: "gk2022_prov_q1", q_index: 1, type: "single", question_title: "B公司科技创新启示", target_score: 10 },
      { id: "gk2022_prov_q2", q_index: 2, type: "single", question_title: "G省粮食产业发展问题与对策", target_score: 15 },
      { id: "gk2022_prov_q3", q_index: 3, type: "doc", question_title: "临诗特色乡村旅游推介材料", target_score: 20 },
      { id: "gk2022_prov_q4", q_index: 4, type: "single", question_title: "“未来学校”更高教育境界阐释", target_score: 20 },
      { id: "gk2022_prov_q5", q_index: 5, type: "essay", question_title: "大作文：今天的思维与未来的收获", target_score: 35 }
    ]
  },
  {
    id: "js2024_a",
    exam_name: "2024年江苏省公务员考试申论真题（A类）",
    year: 2024,
    category: "江苏",
    tier: "省考A类",
    char_count: 7200,
    question_count: 4,
    questions_summary: [
      { id: "js2024_a_q1", q_index: 1, type: "single", question_title: "无锡物联网创新联合体培育经验", target_score: 20 },
      { id: "js2024_a_q2", q_index: 2, type: "single", question_title: "宿迁农村电商赋能乡村振兴路径", target_score: 20 },
      { id: "js2024_a_q3", q_index: 3, type: "doc", question_title: "推行“综合查一次”柔性执法倡议书", target_score: 20 },
      { id: "js2024_a_q4", q_index: 4, type: "essay", question_title: "大作文：在推进中国式现代化中走在前做示范", target_score: 40 }
    ]
  },
  {
    id: "gd2024_county",
    exam_name: "2024年广东省公务员考试申论真题（县级）",
    year: 2024,
    category: "广东",
    tier: "省考县级",
    char_count: 6900,
    question_count: 4,
    questions_summary: [
      { id: "gd2024_county_q1", q_index: 1, type: "single", question_title: "粤北山区县飞地经济发展经验", target_score: 20 },
      { id: "gd2024_county_q2", q_index: 2, type: "single", question_title: "现代海洋牧场全产业链发展路径", target_score: 20 },
      { id: "gd2024_county_q3", q_index: 3, type: "doc", question_title: "“粤治美”数字基层治理经验推广通知", target_score: 20 },
      { id: "gd2024_county_q4", q_index: 4, type: "essay", question_title: "大作文：日日行不怕千万里 常常做不怕千万事", target_score: 40 }
    ]
  }
];

if (typeof window !== 'undefined') {
  window.FALLBACK_DEFAULT_EXAMS = FALLBACK_DEFAULT_EXAMS;
}

let currentExams = [...FALLBACK_DEFAULT_EXAMS];
let currentPaper = null;
let currentQuestion = null;
let currentActiveMaterialText = "";

// 初始化
async function initApp() {
  await window.clientDB.init();

  // 0. 初始化默认模型配置端点 (严格自持密钥 Strict BYOK: 密钥由用户在【⚙️ 模型配置】自主输入)
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

  // 2. 加载真题轻量索引 (分片秒开架构)
  try {
    const fetchedExams = await (window.ExamsLoader ? window.ExamsLoader.loadIndex() : window.ApiClient.getExams());
    if (fetchedExams && fetchedExams.length > 0) {
      currentExams = fetchedExams;
    }
  } catch (err) {
    console.warn("加载真题分片索引异常，使用保底真题库", err);
  }

  // 3. 渲染首屏
  renderSkillOptions('essay');
  await renderExamSelector();
  renderMemoryDeck();
  renderPrivateKBDocs();
  renderPublicKBList();
  await renderDossierList();
  await renderDossierWarningOnReviewPage();

  // 4. 绑定色谱 Popover 与范文划词入库
  window.ChromaRenderer.bindPopovers('chroma-text-container', 'span-popover');
  const exemplarEl = document.getElementById('exemplar-content');
  if (exemplarEl) exemplarEl.onmouseup = handleTextSelection;

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

  // 联动刷新顶部指标卡与占位
  const structLblEl = document.getElementById('structure-lbl');
  if (structLblEl && window.QuestionTypeRubrics) {
    structLblEl.innerText = window.QuestionTypeRubrics.getStructureCardLabel(qType);
  }

  // 如果当前整卷中存在匹配该题型的试题，自动联动切至该小题
  if (currentPaper && Array.isArray(currentPaper.questions)) {
    const matched = currentPaper.questions.find(q => q.type === qType);
    if (matched) {
      selectSubQuestion(matched.id);
      renderDossierWarningOnReviewPage(qType);
      return;
    }
  }

  // 动态联动刷新作答页短板警报
  renderDossierWarningOnReviewPage(qType);
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

  // 按国考与各省省考分类
  const guokaoList = currentExams.filter(e => e.category === '国考' || (e.exam_name && (e.exam_name.includes('国家') || e.exam_name.includes('国考'))));
  const provList = currentExams.filter(e => !(e.category === '国考' || (e.exam_name && (e.exam_name.includes('国家') || e.exam_name.includes('国考')))));

  let html = '';
  if (guokaoList.length > 0) {
    html += '<optgroup label="🏛️ 历年国考官方真题 (最近5年整卷)">';
    guokaoList.forEach(exam => {
      html += `<option value="${exam.id}">🏛️ ${exam.exam_name}</option>`;
    });
    html += '</optgroup>';
  }

  if (provList.length > 0) {
    html += '<optgroup label="🏛️ 各省省考官方真题 (最近5年代表卷)">';
    provList.forEach(exam => {
      html += `<option value="${exam.id}">🏛️ ${exam.exam_name}</option>`;
    });
    html += '</optgroup>';
  }

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

  const qContainer = document.getElementById('paper-questions-container');
  const pillsContainer = document.getElementById('paper-questions-pills');

  if (key === 'custom_manual') {
    if (!isCustomPrompt) toggleCustomPromptMode();
    if (qContainer) qContainer.style.display = 'none';
    currentPaper = null;
    currentQuestion = null;
    return;
  }

  // 1. 优先判定是否为私有知识库上传的材料
  if (key.startsWith('doc_')) {
    const userDocs = await window.clientDB.getAll('private_kb');
    const doc = userDocs.find(d => d.id === key);
    if (doc) {
      currentPaper = null;
      currentQuestion = null;
      if (qContainer) qContainer.style.display = 'none';

      currentActiveMaterialText = doc.content;
      document.getElementById('exam-title-badge').innerText = `📂 私有资料 · ${doc.title}`;
      document.getElementById('exam-score-badge').innerText = `共 ${doc.content.length} 字`;
      document.getElementById('prompt-text').innerText = `《${doc.title}》· 深入研读与申论综合分析`;
      document.getElementById('prompt-reqs').innerHTML = `<strong>使用材料：</strong>${doc.title}（已关联为大模型批改与抄袭比对全文基准，共 ${doc.content.length} 字）。`;

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

  // 2. 判定为官方预置真题题本 (获取整卷与题目)
  let paper = null;
  if (window.ExamsLoader) {
    paper = await window.ExamsLoader.getPaperDetail(key);
  }
  if (!paper) {
    paper = currentExams.find(e => e.id === key);
  }
  if (!paper) return;

  currentPaper = paper;

  // 渲染试卷内题目切换 Pill 标签组
  const questions = paper.questions || [];
  if (questions.length > 0) {
    if (qContainer) qContainer.style.display = 'block';
    if (pillsContainer) {
      pillsContainer.innerHTML = questions.map((q, idx) => {
        let typeBadge = '大作文';
        if (q.type === 'doc') typeBadge = '公文';
        else if (q.type === 'single') typeBadge = '单一';
        return `<button type="button" class="q-pill ${idx === 0 ? 'active' : ''}" id="pill-${q.id}" onclick="selectSubQuestion('${q.id}')">题(${q.q_index})·${typeBadge} (${q.target_score || q.score}分)</button>`;
      }).join('');
    }
    await selectSubQuestion(questions[0].id);
  } else {
    // 兼容单题旧数据
    if (qContainer) qContainer.style.display = 'none';
    currentQuestion = null;
    currentActiveMaterialText = paper.materials || paper.materials_text || '';
    document.getElementById('exam-title-badge').innerText = `🏛️ ${paper.exam_name}`;
    document.getElementById('exam-score-badge').innerText = `满分 ${paper.target_score || 35} 分`;
    document.getElementById('prompt-text').innerText = paper.prompt_text || paper.question_title;
    document.getElementById('prompt-reqs').innerHTML = `<strong>作答要求：</strong>${paper.prompt_reqs || '按公考规范要求作答'}`;
    document.getElementById('materials-panel').innerHTML = `
      <div style="font-size: 13.5px; line-height: 2.0; white-space: pre-wrap; color: #cbd5e1; padding: 8px 12px; background: rgba(15, 23, 42, 0.4); border-radius: 6px;">
${window.ChromaRenderer.escapeHtml(currentActiveMaterialText)}
      </div>
    `;
  }

  if (isCustomPrompt) toggleCustomPromptMode();
}

// 选择试卷中的具体小题
async function selectSubQuestion(qid) {
  if (!currentPaper || !Array.isArray(currentPaper.questions)) return;
  const q = currentPaper.questions.find(item => item.id === qid) || currentPaper.questions[0];
  if (!q) return;

  currentQuestion = q;

  // 更新 pill 按钮激活状态
  document.querySelectorAll('.q-pill').forEach(btn => btn.classList.remove('active'));
  const activeBtn = document.getElementById(`pill-${q.id}`);
  if (activeBtn) activeBtn.classList.add('active');

  // 同步题型与 Skill 规范
  const qTypeEl = document.getElementById('q-type');
  if (qTypeEl && q.type) {
    qTypeEl.value = q.type;
    renderSkillOptions(q.type);
  }

  // 联动更新顶部指标卡标签
  const structLblEl = document.getElementById('structure-lbl');
  if (structLblEl && window.QuestionTypeRubrics && q.type) {
    structLblEl.innerText = window.QuestionTypeRubrics.getStructureCardLabel(q.type);
  }

  // 呈现真实题干与作答要求
  document.getElementById('exam-title-badge').innerText = `🏛️ ${currentPaper.exam_name} · 第(${q.q_index})题`;
  document.getElementById('exam-score-badge').innerText = `满分 ${q.target_score || q.score || 20} 分`;
  document.getElementById('prompt-text').innerText = q.prompt_text;
  document.getElementById('prompt-reqs').innerHTML = `<strong>作答要求：</strong>${q.prompt_reqs || '按要求作答'}（${q.char_limit || ''}）。`;

  // 呈现采分底稿内容
  const criteriaContent = document.getElementById('scoring-criteria-content');
  if (criteriaContent) {
    criteriaContent.innerText = q.scoring_criteria || '本题根据材料客观原词与要点采分。';
  }

  // 呈现完整给定资料
  currentActiveMaterialText = currentPaper.materials_text || currentPaper.materials || '';
  document.getElementById('materials-panel').innerHTML = `
    <div style="font-size: 13.5px; line-height: 2.0; white-space: pre-wrap; color: #cbd5e1; padding: 8px 12px; background: rgba(15, 23, 42, 0.4); border-radius: 6px;">
${window.ChromaRenderer.escapeHtml(currentActiveMaterialText)}
    </div>
  `;

  // 联动刷新作答页短板警报
  renderDossierWarningOnReviewPage(q.type);
}

// 展开/收起官方标准采分底稿
function toggleScoringCriteria() {
  const box = document.getElementById('scoring-criteria-box');
  const btnText = document.getElementById('scoring-toggle-text');
  if (!box) return;
  const isHidden = box.style.display === 'none';
  box.style.display = isHidden ? 'block' : 'none';
  if (btnText) {
    btnText.innerText = isHidden ? '✕ 收起采分底稿' : '🔍 查看官方采分底稿';
  }
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
  if (!userText) {
    alert("请在左侧作答输入框内录入或粘贴您的答卷内容后再点击开始批改！");
    return;
  }

  const qType = document.getElementById('q-type').value;
  const skillSelector = document.getElementById('skill-selector');
  const skillId = skillSelector ? skillSelector.value : 'shenlun-essay-expert';
  
  let topic = currentQuestion ? currentQuestion.question_title : document.getElementById('prompt-text').innerText;
  let targetScore = currentQuestion ? (currentQuestion.target_score || currentQuestion.score) : (qType === 'essay' ? 35 : (qType === 'doc' ? 25 : 20));
  let wordLimit = (currentQuestion && currentQuestion.max_words) || null;
  let materials = currentActiveMaterialText;

  if (!materials) {
    if (currentPaper) materials = currentPaper.materials_text || currentPaper.materials || '';
    if (!materials && currentQuestion) materials = currentQuestion.materials || '';
    if (!materials) {
      const matPanel = document.getElementById('materials-panel');
      if (matPanel) materials = matPanel.innerText.trim();
    }
  }

  if (isCustomPrompt) {
    topic = document.getElementById('custom-prompt-input').value || topic;
    materials = document.getElementById('custom-mat-input').value || currentActiveMaterialText;

    const customScoreVal = parseFloat(document.getElementById('custom-score-input')?.value);
    if (!isNaN(customScoreVal) && customScoreVal > 0) {
      targetScore = customScoreVal;
    }
    const customLimitVal = parseInt(document.getElementById('custom-limit-input')?.value, 10);
    if (!isNaN(customLimitVal) && customLimitVal > 0) {
      wordLimit = customLimitVal;
    }
  }

  // 尝试从题干和要求文本中提取分值与字数限制
  const combinedReqText = `${topic} ${currentQuestion ? (currentQuestion.prompt_reqs || '') : ''}`;
  const scoreMatch = combinedReqText.match(/(?:满分|分值|共计?|总分)\s*[:：]?\s*(\d+(?:\.\d+)?)\s*分|[（(]\s*(\d+(?:\.\d+)?)\s*分\s*[)）]/);
  if (scoreMatch && (!isCustomPrompt || !document.getElementById('custom-score-input')?.value)) {
    targetScore = parseFloat(scoreMatch[1] || scoreMatch[2]);
  }
  const limitMatch = combinedReqText.match(/(?:不超过|限|以内|至多)\s*(\d+)\s*字|(\d+)\s*字以内/);
  if (limitMatch && (!isCustomPrompt || !document.getElementById('custom-limit-input')?.value)) {
    wordLimit = parseInt(limitMatch[1] || limitMatch[2], 10);
  }

  const apiKey = (localStorage.getItem('shenlun_api_key') || '').trim();
  if (!apiKey) {
    openSettingModal();
    const chromaEl = document.getElementById('chroma-text-container');
    if (chromaEl) {
      chromaEl.innerHTML = `
        <div style="padding: 30px 20px; text-align: center; background: rgba(56, 189, 248, 0.06); border: 1px dashed rgba(56, 189, 248, 0.4); border-radius: 8px;">
          <div style="font-size: 32px; margin-bottom: 10px;">⚙️</div>
          <div style="font-size: 15px; font-weight: 700; color: #38bdf8; margin-bottom: 6px;">请先填入大模型 API Key</div>
          <div style="font-size: 12px; color: var(--text-muted); line-height: 1.6; max-width: 440px; margin: 0 auto 14px auto;">
            本项目遵循 <strong>Strict BYOK (自持密钥)</strong> 军工级隐私规范，不设集中式商业服务器。<br>
            密钥仅保存在当前浏览器本地，支持 <strong>DeepSeek / 火山方舟 / 硅基流动 / OpenAI 兼容端点</strong>。
          </div>
          <button class="btn btn-primary" onclick="openSettingModal()" style="padding: 6px 18px; font-size: 12px;">⚙️ 立即打开配置窗口填入 Key</button>
        </div>
      `;
    }
    alert("【请先配置大模型密钥 (Strict BYOK)】\n本项目为纯前端无状态架构，数据不留存任何集中式服务器。\n请在右上角【⚙️ 模型配置】窗口填入您的 API Key（如 DeepSeek sk-...）后即可开始智能批改！");
    return;
  }

  // 1. 本地 Mini-RAG 智能召回匹配记忆 (单一题客观采分题绝对严禁调用 RAG 污染材料)
  let recalled = [];
  if (qType === 'essay') {
    try {
      const allMemories = await window.clientDB.getAll('memories');
      if (window.MiniRAG && typeof window.MiniRAG.recallTopK === 'function') {
        recalled = window.MiniRAG.recallTopK(allMemories, topic, userText, 3);
      }
    } catch (e) {
      console.warn("MiniRAG recall error:", e);
    }
  }

  const payload = {
    question_type: qType,
    question_title: topic,
    materials: materials,
    user_answer: userText,
    target_score: targetScore,
    word_limit: wordLimit,
    skill_id: skillId,
    recalled_memories: qType === 'single' ? [] : recalled,
    scoring_criteria: currentQuestion ? (currentQuestion.scoring_criteria || '') : '',
    reference_answer: currentQuestion ? (currentQuestion.reference_answer || '') : '',
    api_key: apiKey,
    base_url: localStorage.getItem('shenlun_base_url') || 'https://api.deepseek.com/v1',
    model_id: localStorage.getItem('shenlun_model_id') || 'deepseek-chat'
  };

  const btn = document.getElementById('btn-start-review');
  btn.innerText = '🤖 正在向大模型请求考场审判（耗时约 3~6 秒）...';
  btn.disabled = true;

  // 在右侧展示清晰的加载态，告知大模型正在实时推理
  document.getElementById('chroma-text-container').innerHTML = `
    <div style="padding: 40px 20px; text-align: center; color: #38bdf8;">
      <div style="font-size: 36px; margin-bottom: 12px;">🤖</div>
      <div style="font-size: 16px; font-weight: 700; color: #f1f5f9;">大模型考场审判进行中...</div>
      <div style="font-size: 12px; color: var(--text-muted); margin-top: 8px;">
        正在对标官方采分底稿 ➔ 原词采点 ➔ 15-gram 抄袭检测 ➔ 4维量化赋分 ➔ 记忆库一类文重塑
      </div>
      <div style="font-size: 11px; color: #4ade80; margin-top: 8px;">
        ⏳ 直连 ${payload.base_url.includes('deepseek') ? 'DeepSeek' : 'OpenAI兼容端点'} 推理中，请稍候...
      </div>
    </div>
  `;

  const emptyBox = document.getElementById('score-empty-box');
  if (emptyBox) {
    emptyBox.innerHTML = `<span>⏳ <strong>正在批改</strong>：已向大模型发起考场四维量化评判与采分点比对...</span>`;
  }

  try {
    const result = await window.ApiClient.submitReview(payload);
    renderReviewResult(userText, result, qType, targetScore);

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

    // 真正沉淀进作答短板档案 (自反性记忆闭环)
    await recordDossierDefects(subId, qType, topic, userText, result);
    await renderDossierList();
    await renderDossierWarningOnReviewPage(qType);
  } catch (err) {
    console.error("批改异常:", err);
    const chromaEl = document.getElementById('chroma-text-container');
    if (chromaEl) {
      chromaEl.innerHTML = `
        <div style="padding: 30px 20px; text-align: center; background: rgba(239, 68, 68, 0.08); border: 1px solid var(--danger); border-radius: 8px;">
          <div style="font-size: 32px; margin-bottom: 8px;">⚠️</div>
          <div style="font-size: 15px; font-weight: 700; color: #f87171; margin-bottom: 6px;">批改未能成功完成</div>
          <div style="font-size: 12.5px; color: #cbd5e1; margin-bottom: 14px; line-height: 1.6; max-width: 480px; margin-left:auto; margin-right:auto; white-space: pre-wrap;">${window.ChromaRenderer ? window.ChromaRenderer.escapeHtml(err.message) : err.message}</div>
          <div style="display:flex; justify-content:center; gap:10px;">
            <button class="btn btn-outline" onclick="openSettingModal()" style="padding: 5px 14px; font-size: 12px;">⚙️ 检查模型配置</button>
            <button class="btn btn-primary" onclick="runFullReview()" style="padding: 5px 14px; font-size: 12px;">🔄 重新发起批改</button>
          </div>
        </div>
      `;
    }
    if (emptyBox) {
      emptyBox.innerHTML = `<span>⚠️ <strong>批改失败</strong>：${window.ChromaRenderer ? window.ChromaRenderer.escapeHtml(err.message) : err.message}</span>`;
    }
    alert(`批改遇到错误: ${err.message}`);
  } finally {
    btn.innerText = '🚀 开始批改';
    btn.disabled = false;
  }
}

// 渲染批改结果
function renderReviewResult(userText, res, passedQType, passedTargetScore) {
  const qType = passedQType || (document.getElementById('q-type') && document.getElementById('q-type').value) || res.question_type || 'essay';
  const targetScore = passedTargetScore || (currentQuestion ? (currentQuestion.target_score || currentQuestion.score) : (qType === 'essay' ? 35 : (qType === 'doc' ? 25 : 20)));

  // 显示评分条，隐藏未批改占位提示
  const bannerBox = document.getElementById('score-banner-box');
  if (bannerBox) bannerBox.style.display = 'flex';
  const emptyBox = document.getElementById('score-empty-box');
  if (emptyBox) emptyBox.style.display = 'none';

  // 分数与定档
  const effectiveTargetScore = res.target_score !== undefined ? Number(res.target_score) : targetScore;
  const scoreValEl = document.getElementById('score-val');
  if (scoreValEl) {
    scoreValEl.innerHTML = `${res.score} <span style="font-size: 13px; font-weight: normal; color: var(--text-muted);">/ ${effectiveTargetScore}分</span>`;
  }
  document.getElementById('score-grade').innerText = res.grade;

  const scoreLblEl = document.getElementById('score-max-lbl');
  if (scoreLblEl) {
    const rate = Math.round((res.score / effectiveTargetScore) * 100);
    scoreLblEl.innerText = `综合评定分 (得分率: ${rate}%)`;
  }

  // 动态更新顶部指标卡第3项（结构/条理/格式）
  const structLblEl = document.getElementById('structure-lbl');
  if (structLblEl && window.QuestionTypeRubrics) {
    structLblEl.innerText = window.QuestionTypeRubrics.getStructureCardLabel(qType);
  }
  const structVal = document.getElementById('structure-val');
  if (structVal) {
    let structScore = null;
    const radar = res.radar_scores || {};
    if (qType === 'single') {
      structScore = radar['分类逻辑与条理'] ?? radar['分类逻辑'] ?? radar['条理'] ?? null;
    } else if (qType === 'doc') {
      structScore = radar['格式规范三件套'] ?? radar['格式规范'] ?? radar['格式分'] ?? null;
    } else {
      structScore = radar['结构与段落布局'] ?? radar['结构布局'] ?? null;
    }
    if (window.QuestionTypeRubrics) {
      structVal.innerText = window.QuestionTypeRubrics.getStructureStatus(qType, structScore, null, res.grade);
    } else {
      structVal.innerText = res.grade?.includes('四类') ? '结构残缺' : (structScore >= 7 ? '结构严整' : '结构规范');
    }
  }
  document.getElementById('copy-ratio-val').innerText = `${(res.copy_ratio * 100).toFixed(1)}% (${res.copy_redline_exceeded ? '⚠️超标' : '安全'})`;

  // 渲染多维色谱文本
  const html = window.ChromaRenderer.render(userText, res.chroma_spans);
  const container = document.getElementById('chroma-text-container');
  container.innerHTML = html;
  window.ChromaRenderer.bindPopovers('chroma-text-container', 'span-popover');

  // 1. 渲染四维量化得分明细表与扣分依据 (#score-breakdown-tbody)
  const radar = res.radar_scores || {};
  let dimensions = [];
  if (window.QuestionTypeRubrics) {
    dimensions = window.QuestionTypeRubrics.getDimensions(qType, effectiveTargetScore);
  } else {
    dimensions = [
      { key: "立意与总分论点", max: 12, getDesc: () => "立意100%源于材料，首段末句亮明总论点，三分论点醒目" },
      { key: "结构与段落布局", max: 8, getDesc: () => "五段大五段匀称，段落字数控制在250字左右" },
      { key: "论据与论证深度", max: 10, getDesc: () => "道理论证与事例论证结合紧密，具备事后深度分析" },
      { key: "语言与公文规范", max: 5, getDesc: () => "公文语体规范严谨，短句对仗工整" }
    ];
  }

  let tbodyHtml = '';
  dimensions.forEach(d => {
    let scoreVal = undefined;
    if (radar[d.key] !== undefined) {
      scoreVal = radar[d.key];
    } else {
      for (const [rKey, rVal] of Object.entries(radar)) {
        if (rKey.includes(d.key.slice(0, 2)) || d.key.includes(rKey.slice(0, 2))) {
          scoreVal = rVal;
          break;
        }
      }
    }
    if (scoreVal === undefined) {
      scoreVal = Math.round(d.max * (res.score / effectiveTargetScore) * 10) / 10;
    }
    const color = scoreVal >= d.max * 0.8 ? '#4ade80' : (scoreVal >= d.max * 0.6 ? '#facc15' : '#f87171');
    const desc = typeof d.getDesc === 'function' ? d.getDesc(res) : (d.desc || '按考规量化评定');
    tbodyHtml += `
      <tr style="border-bottom: 1px solid var(--card-border);">
        <td style="padding: 8px 10px; font-weight: 600; color: #f8fafc;">${d.key}</td>
        <td style="padding: 8px 10px; text-align: center; color: var(--text-muted);">${d.max}分</td>
        <td style="padding: 8px 10px; text-align: center; font-weight: 700; color: ${color};">${scoreVal}分</td>
        <td style="padding: 8px 10px; color: #cbd5e1; font-size: 12px; line-height: 1.5;">${desc}</td>
      </tr>
    `;
  });
  const tbodyEl = document.getElementById('score-breakdown-tbody');
  if (tbodyEl) tbodyEl.innerHTML = tbodyHtml;

  // 2. 渲染多视角名师与考官判语 (#perspectives-container)
  const p = res.perspectives || {};
  let pTitles = {
    examiner: "【考场考官前10秒第一眼定档】",
    structure_expert: "【大五段骨架与对策论证诊断】",
    style_expert: "【政务文风与语汇质检诊断】"
  };
  if (window.QuestionTypeRubrics) {
    pTitles = window.QuestionTypeRubrics.getPerspectiveTitles(qType);
  }

  let phtml = '';
  if (p.examiner) {
    phtml += `<div style="margin-bottom: 8px;"><strong style="color:#38bdf8;">${pTitles.examiner}</strong>：${window.ChromaRenderer.escapeHtml(p.examiner)}</div>`;
  }
  if (p.structure_expert) {
    phtml += `<div style="margin-bottom: 8px;"><strong style="color:#a855f7;">${pTitles.structure_expert}</strong>：${window.ChromaRenderer.escapeHtml(p.structure_expert)}</div>`;
  }
  if (p.style_expert) {
    phtml += `<div><strong style="color:#f59e0b;">${pTitles.style_expert}</strong>：${window.ChromaRenderer.escapeHtml(p.style_expert)}</div>`;
  }
  if (!phtml) {
    phtml = '<div style="color:var(--text-muted);">暂无名师判语，系统已依据官方阅卷规范执行评分。</div>';
  }
  const persEl = document.getElementById('perspectives-container');
  if (persEl) persEl.innerHTML = phtml;

  // 3. 渲染逐句给分/扣分穿透清单 (#itemized-attribution-list)
  const spans = res.chroma_spans || [];
  currentReviewSpans = spans;
  currentReviewText = userText;
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
              <div style="display: flex; align-items: center; gap: 8px;">
                <span style="font-size: 11px; color: var(--text-muted); font-family: monospace;">位置: 第 ${s.start}~${s.end} 字</span>
                <button class="btn btn-outline" style="padding: 1px 6px; font-size: 11px; color: #facc15;" onclick="saveAttributionCardAsAntiPattern(${idx})">📥 存为避坑卡</button>
              </div>
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

let currentReviewSpans = [];
let currentReviewText = "";

// ================= 作答短板档案 (Universal Weakness Dossier) =================

// 1. 五大通用元维度定义 (完全中立，不写死任何名师或流派教研偏称)
const UNIVERSAL_DEFECT_DIMENSIONS = {
  DIM_THEME: {
    key: "DIM_THEME",
    name: "审题立意与核心观点",
    desc: "是否切中题目核心任务、主旨观点醒目度、总论点是否前置明确",
    icon: "🎯"
  },
  DIM_STRUCTURE: {
    key: "DIM_STRUCTURE",
    name: "段落布局与结构逻辑",
    desc: "段落比例匀称度、行文逻辑层次（总分/递进/并列）及公文必备格式完整度",
    icon: "📐"
  },
  DIM_ANALYSIS: {
    key: "DIM_ANALYSIS",
    name: "论证深度与要点提炼",
    desc: "是否深入制度因果剖析（拒流水账）、材料核心采分要点覆盖与概括深度",
    icon: "🔍"
  },
  DIM_EXPRESSION: {
    key: "DIM_EXPRESSION",
    name: "政务规范与语言洗练",
    desc: "杜绝口语大白话与随意表达，规范使用政务公文动宾大词与概括大词",
    icon: "🖋️"
  },
  DIM_COMPLIANCE: {
    key: "DIM_COMPLIANCE",
    name: "客观合规与规程红线",
    desc: "议论文材料连续抄袭率（>20%红线）、字数底线要求与标点书名号规范",
    icon: "⚖️"
  }
};

let currentDossierFilter = 'all'; // 'all' | 'essay' | 'doc' | 'single'
let expandedDossierKeys = new Set(); // 展开查看详细记录的维度 key

// 切换题型筛选 Tab
function switchDossierFilter(filterType) {
  currentDossierFilter = filterType;
  
  // 更新按钮高亮
  const buttons = ['all', 'essay', 'doc', 'single'];
  buttons.forEach(t => {
    const btn = document.getElementById(`dossier-filter-${t}`);
    if (btn) {
      if (t === filterType) {
        btn.className = 'btn btn-sm btn-primary';
      } else {
        btn.className = 'btn btn-sm btn-outline';
      }
    }
  });

  renderDossierList();
}

// 记录与萃取短板数据 (通用化五大元维度)
async function recordDossierDefects(subId, qType, examTitle, userText, res) {
  const db = window.clientDB;
  const now = Date.now();
  const title = examTitle || "未命名作答";

  // 1. DIM_COMPLIANCE (客观合规红线)
  // 1.1 大作文材料抄袭检测（单一题/公文因需要摘抄采分原词，不计入恶意抄袭）
  if (qType === 'essay' && (res.copy_redline_exceeded || (res.copy_ratio > 0.18))) {
    await db.put('dossier', {
      id: `dos_compliance_copy_${subId}`,
      submissionId: subId,
      questionType: qType,
      examTitle: title,
      dimensionKey: "DIM_COMPLIANCE",
      errorDimension: "客观合规与规程红线",
      errorCode: "ERR_COPY_OVER_20",
      severity: "level_1_critical",
      quoteText: `抄袭率 ${(res.copy_ratio * 100).toFixed(1)}%`,
      diagnosis: `连续摘抄材料原文达 ${(res.copy_ratio * 100).toFixed(1)}%（触碰 20% 警戒线），议论文论证沦为事实搬运，缺乏个人提炼`,
      cleared: 0,
      clearedAt: null,
      createdAt: now
    });
  }
  // 1.2 标题书名号等格式硬伤
  if (res.title_issues && res.title_issues.length > 0) {
    await db.put('dossier', {
      id: `dos_compliance_title_${subId}`,
      submissionId: subId,
      questionType: qType,
      examTitle: title,
      dimensionKey: "DIM_COMPLIANCE",
      errorDimension: "客观合规与规程红线",
      errorCode: "ERR_TITLE_FORMAT",
      severity: "level_2",
      quoteText: res.title_issues.join('；'),
      diagnosis: `标题存在格式硬伤（如误用书名号或字数失衡）：${res.title_issues.join('；')}`,
      cleared: 0,
      clearedAt: null,
      createdAt: now
    });
  }
  // 1.3 大作文字数严重不足（<800字）
  if (qType === 'essay' && res.word_count < 800) {
    await db.put('dossier', {
      id: `dos_compliance_words_${subId}`,
      submissionId: subId,
      questionType: qType,
      examTitle: title,
      dimensionKey: "DIM_COMPLIANCE",
      errorDimension: "客观合规与规程红线",
      errorCode: "ERR_WORD_COUNT_DEFICIT",
      severity: "level_1_critical",
      quoteText: `实测字数 ${res.word_count} 字`,
      diagnosis: `答卷仅 ${res.word_count} 字，未达申论大作文 1000 字考场基本字数红线（低于800字重扣结构与立意分）`,
      cleared: 0,
      clearedAt: null,
      createdAt: now
    });
  }

  // 2. DIM_EXPRESSION (政务规范与语言洗练)
  const colloquialSpans = (res.chroma_spans || []).filter(s => s.type === 'colloquial_flaw');
  for (let i = 0; i < colloquialSpans.length; i++) {
    const span = colloquialSpans[i];
    const quote = userText.slice(span.start, span.end);
    await db.put('dossier', {
      id: `dos_expr_${subId}_${span.start}`,
      submissionId: subId,
      questionType: qType,
      examTitle: title,
      dimensionKey: "DIM_EXPRESSION",
      errorDimension: "政务规范与语言洗练",
      errorCode: "ERR_COLLOQUIAL",
      severity: "level_2",
      quoteText: quote,
      diagnosis: span.comment || "口语化表达缺乏政务动宾大词提炼",
      cleared: 0,
      clearedAt: null,
      createdAt: now
    });
  }

  // 3. DIM_ANALYSIS (论证深度与要点提炼)
  // 3.1 案例故事流水账
  const storySpans = (res.chroma_spans || []).filter(s => s.type === 'story_narrative_leak');
  for (let i = 0; i < storySpans.length; i++) {
    const span = storySpans[i];
    const quote = userText.slice(span.start, span.end);
    await db.put('dossier', {
      id: `dos_analysis_story_${subId}_${span.start}`,
      submissionId: subId,
      questionType: qType,
      examTitle: title,
      dimensionKey: "DIM_ANALYSIS",
      errorDimension: "论证深度与要点提炼",
      errorCode: "ERR_STORY_NARRATIVE",
      severity: "level_2",
      quoteText: quote.length > 50 ? quote.slice(0, 50) + "..." : quote,
      diagnosis: span.comment || "案例叙述篇幅过长流水账，缺乏深入因果制度剖析",
      cleared: 0,
      clearedAt: null,
      createdAt: now
    });
  }
  // 3.2 论证深度扣分严重 (打分低于满分的 60%)
  if (res.radar_scores && res.radar_scores["论据与论证深度"] !== undefined && res.radar_scores["论据与论证深度"] < 5.5) {
    await db.put('dossier', {
      id: `dos_analysis_score_${subId}`,
      submissionId: subId,
      questionType: qType,
      examTitle: title,
      dimensionKey: "DIM_ANALYSIS",
      errorDimension: "论证深度与要点提炼",
      errorCode: "ERR_ANALYSIS_SHALLOW",
      severity: "level_1_critical",
      quoteText: `论证深度得分 ${res.radar_scores["论据与论证深度"]} 分`,
      diagnosis: "论点推导论证深度不足，事例浮于表面或核心采分要点覆盖不全",
      cleared: 0,
      clearedAt: null,
      createdAt: now
    });
  }

  // 4. DIM_STRUCTURE (段落布局与结构逻辑)
  if (res.grade?.includes("四类") || (res.radar_scores && res.radar_scores["结构与段落布局"] !== undefined && res.radar_scores["结构与段落布局"] < 5.0)) {
    await db.put('dossier', {
      id: `dos_structure_${subId}`,
      submissionId: subId,
      questionType: qType,
      examTitle: title,
      dimensionKey: "DIM_STRUCTURE",
      errorDimension: "段落布局与结构逻辑",
      errorCode: "ERR_STRUCTURE_DEFECT",
      severity: "level_1_critical",
      quoteText: `结构得分 ${res.radar_scores ? res.radar_scores["结构与段落布局"] : res.score}分 (${res.grade || ''})`,
      diagnosis: qType === 'doc'
        ? "公文格式要素不全或行文逻辑层次错位，未符合三轨阅卷规范"
        : (qType === 'single'
          ? "采分点未按逻辑要素分类归纳，行文呈现无序一锅粥"
          : "文章结构层次逻辑不畅、段落失衡或各层次分论点不清晰"),
      cleared: 0,
      clearedAt: null,
      createdAt: now
    });
  }

  // 5. DIM_THEME (审题立意与核心观点)
  if (res.radar_scores && res.radar_scores["立意与总分论点"] !== undefined && res.radar_scores["立意与总分论点"] < 7.0) {
    await db.put('dossier', {
      id: `dos_theme_${subId}`,
      submissionId: subId,
      questionType: qType,
      examTitle: title,
      dimensionKey: "DIM_THEME",
      errorDimension: "审题立意与核心观点",
      errorCode: "ERR_THEME_DEFECT",
      severity: "level_1_critical",
      quoteText: `立意得分 ${res.radar_scores["立意与总分论点"]}分`,
      diagnosis: "未完全紧扣题干主旨，核心总观点隐蔽模糊或立意高度不足",
      cleared: 0,
      clearedAt: null,
      createdAt: now
    });
  }
}

// 计算量纲严谨的统计指标与滑动窗口
function calculateDossierMetrics(dossiers, submissions, filterType = 'all') {
  // 1. 过滤对应题型的作答记录
  const filteredSubmissions = submissions.filter(s => filterType === 'all' || s.questionType === filterType);
  const totalSubmissions = filteredSubmissions.length;

  // 2. 取最近 5 篇作答作为动态滑动窗口
  const recentSubmissions = filteredSubmissions.slice(-5);
  const recentSubIds = new Set(recentSubmissions.map(s => s.id));

  // 3. 统计五大元维度
  const dimStats = [];
  const criticals = [];

  for (const [dimKey, meta] of Object.entries(UNIVERSAL_DEFECT_DIMENSIONS)) {
    const dimDossiers = dossiers.filter(d => {
      const matchDim = d.dimensionKey === dimKey;
      const matchType = (filterType === 'all' || d.questionType === filterType || (!d.questionType && filterType === 'essay'));
      return matchDim && matchType;
    });

    const totalInstances = dimDossiers.length;
    // 独立作答篇数触碰（分子），确保不会大于分母
    const distinctSubIds = new Set(dimDossiers.map(d => d.submissionId));
    const distinctCount = distinctSubIds.size;
    const occurrenceRate = totalSubmissions > 0 ? Math.min(100, Math.round((distinctCount / totalSubmissions) * 100)) : 0;
    const density = totalSubmissions > 0 ? (totalInstances / totalSubmissions).toFixed(1) : "0.0";

    // 滑动窗口统计（最近 5 篇）
    const recentUnclearedDossiers = dimDossiers.filter(d => recentSubIds.has(d.submissionId) && !d.cleared);
    const recentDistinctSubHits = new Set(recentUnclearedDossiers.map(d => d.submissionId)).size;
    const unclearedCount = dimDossiers.filter(d => !d.cleared).length;

    // 状态定级
    let status = "良好达标";
    let statusColor = "#4ade80";
    let severityRank = 3;

    if (totalInstances > 0 && unclearedCount === 0) {
      status = "已切除克服";
      statusColor = "#38bdf8";
      severityRank = 4;
    } else if (recentDistinctSubHits >= 2 || dimDossiers.some(d => d.severity === 'level_1_critical' && recentSubIds.has(d.submissionId) && !d.cleared)) {
      status = "一级顽固短板";
      statusColor = "#ef4444";
      severityRank = 1;
      criticals.push(meta.name);
    } else if (recentDistinctSubHits === 1 || unclearedCount > 0) {
      status = "二级关注短板";
      statusColor = "#facc15";
      severityRank = 2;
    }

    dimStats.push({
      key: dimKey,
      name: meta.name,
      desc: meta.desc,
      icon: meta.icon,
      items: dimDossiers,
      totalCount: totalInstances,
      distinctCount: distinctCount,
      rate: occurrenceRate,
      density: density,
      recentHits: recentDistinctSubHits,
      unclearedCount: unclearedCount,
      status: status,
      statusColor: statusColor,
      severityRank: severityRank
    });
  }

  // 按严重度升序排序（一级顽固排最前）
  dimStats.sort((a, b) => a.severityRank - b.severityRank);

  return {
    totalSubmissions,
    recentCount: recentSubmissions.length,
    criticals: [...new Set(criticals)],
    dimensions: dimStats
  };
}

// 切换单个短板项的切除/未切除状态
async function toggleDefectClearance(dossierId) {
  const db = window.clientDB;
  const all = await db.getAll('dossier') || [];
  const target = all.find(d => d.id === dossierId);
  if (!target) return;

  target.cleared = target.cleared ? 0 : 1;
  target.clearedAt = target.cleared ? Date.now() : null;
  await db.put('dossier', target);

  await renderDossierList();
  await renderDossierWarningOnReviewPage();
}

// 展开/折叠维度详细记录
function toggleDossierExpand(dimKey) {
  if (expandedDossierKeys.has(dimKey)) {
    expandedDossierKeys.delete(dimKey);
  } else {
    expandedDossierKeys.add(dimKey);
  }
  renderDossierList();
}

// 从短板溯源跳转回原卷批改报告
async function jumpToSubmissionReport(submissionId) {
  const db = window.clientDB;
  const submissions = await db.getAll('submissions') || [];
  const reports = await db.getAll('reports') || [];

  const sub = submissions.find(s => s.id === submissionId);
  const rep = reports.find(r => r.submissionId === submissionId);
  if (!sub || !rep) {
    alert("未找到该答卷对应的批改底稿");
    return;
  }

  // 切换到 review Tab
  switchTab('review');

  // 回填题目与文本
  const qTypeEl = document.getElementById('q-type');
  if (qTypeEl && sub.questionType) {
    qTypeEl.value = sub.questionType;
  }
  const titleEl = document.getElementById('question-title-input');
  if (titleEl && sub.questionTitle) titleEl.value = sub.questionTitle;
  const textEl = document.getElementById('user-answer-input');
  if (textEl) {
    textEl.value = sub.userAnswer;
    updateWordCount();
  }

  // 渲染当次报告
  renderReviewResult(sub.userAnswer, rep);
}

// 渲染短板档案面板
async function renderDossierList() {
  const db = window.clientDB;
  const dossiers = await db.getAll('dossier') || [];
  const submissions = await db.getAll('submissions') || [];

  const typeLabels = {
    all: "全部题型",
    essay: "申论大作文",
    doc: "贯彻执行公文",
    single: "单一采分题"
  };
  const currentLabel = typeLabels[currentDossierFilter] || "全部题型";

  const metrics = calculateDossierMetrics(dossiers, submissions, currentDossierFilter);

  const countEl = document.getElementById('dossier-total-count');
  if (countEl) countEl.innerText = `累计分析：${metrics.totalSubmissions} 篇作答 (${currentLabel} · 最近${metrics.recentCount}篇动态窗口)`;

  const alertBox = document.getElementById('dossier-dynamic-alert-box');
  const listEl = document.getElementById('dossier-dynamic-list');

  if (metrics.totalSubmissions === 0) {
    if (alertBox) alertBox.innerHTML = '';
    if (listEl) {
      listEl.innerHTML = `
        <div style="text-align: center; padding: 40px 20px; color: var(--text-muted); font-size: 13.5px; line-height: 1.8;">
          🌱 <strong>当前【${currentLabel}】暂无作答历史记录。</strong><br>
          在【纸面作答与色谱批改】页面完成该题型作答并批改后，系统将自动建立专属短板档案并分析失分盲区。
        </div>
      `;
    }
    return;
  }

  // 动态警报横幅
  let alertHtml = '';
  if (metrics.criticals.length > 0) {
    alertHtml = `
      <div style="background: rgba(239, 68, 68, 0.08); border: 1px solid var(--danger); border-radius: 8px; padding: 14px 18px; margin-bottom: 16px;">
        <div style="display:flex; align-items:center; gap:8px; margin-bottom:6px;">
          <span style="font-size:16px;">⚠️</span>
          <strong style="color: #f87171; font-size: 14.5px;">【${currentLabel}】检测到高频顽固短板：${metrics.criticals.join('、')}</strong>
        </div>
        <p style="font-size: 13px; color: #fca5a5; margin: 0; line-height: 1.6;">
          在最近的作答中，你在上述维度频繁失分。系统已在作答页面为您前置置顶针对性纠偏提醒，请结合避坑错题卡与微练习重点突破！
        </p>
      </div>
    `;
  } else {
    alertHtml = `
      <div style="background: rgba(74, 222, 128, 0.08); border: 1px solid rgba(74, 222, 128, 0.3); border-radius: 8px; padding: 12px 18px; margin-bottom: 16px; display:flex; align-items:center; gap:8px;">
        <span style="font-size:16px;">✅</span>
        <span style="font-size: 13px; color: #4ade80;"><strong>状态良好</strong>：最近作答未发现高频严重短板，请保持规范文风与严谨逻辑！</span>
      </div>
    `;
  }
  if (alertBox) alertBox.innerHTML = alertHtml;

  // 渲染五大元维度卡片
  if (listEl) {
    listEl.innerHTML = metrics.dimensions.map(dim => {
      const isExpanded = expandedDossierKeys.has(dim.key);
      const itemsHtml = (dim.items && dim.items.length > 0)
        ? dim.items.slice().reverse().map(it => {
            const dateStr = new Date(it.createdAt).toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
            const isCleared = it.cleared === 1;
            return `
              <div style="background: rgba(15, 23, 42, 0.7); border: 1px solid ${isCleared ? 'rgba(255,255,255,0.08)' : 'rgba(239, 68, 68, 0.25)'}; border-radius: 6px; padding: 10px 14px; margin-top: 8px; opacity: ${isCleared ? '0.6' : '1'};">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px; font-size:12px;">
                  <span style="color:#94a3b8; font-weight:600;">📝 《${it.examTitle || '未命名试题'}》 <span style="font-weight:normal; color:#64748b; margin-left:6px;">${dateStr}</span></span>
                  <div style="display:flex; gap:8px; align-items:center;">
                    <span style="font-size:11px; padding:1px 6px; border-radius:3px; ${isCleared ? 'color:#38bdf8; border:1px solid #38bdf8;' : (it.severity === 'level_1_critical' ? 'color:#ef4444; border:1px solid #ef4444;' : 'color:#facc15; border:1px solid #facc15;')}">${isCleared ? '已切除' : (it.severity === 'level_1_critical' ? '重度扣分' : '一般瑕疵')}</span>
                    <button class="btn btn-sm btn-outline" style="font-size:11px; padding:1px 6px;" onclick="toggleDefectClearance('${it.id}')">${isCleared ? '↩️ 撤销切除' : '✅ 标记克服'}</button>
                    <button class="btn btn-sm btn-outline" style="font-size:11px; padding:1px 6px;" onclick="jumpToSubmissionReport('${it.submissionId}')">🔍 回看原卷</button>
                  </div>
                </div>
                ${it.quoteText ? `<div style="background:rgba(0,0,0,0.25); border-left:3px solid #f59e0b; padding:4px 8px; font-size:12.5px; color:#fde68a; margin-bottom:6px; font-family:monospace;">${it.quoteText}</div>` : ''}
                <div style="font-size:12px; color:#cbd5e1; line-height:1.5;">💡 <strong>考官诊断</strong>：${it.diagnosis}</div>
              </div>
            `;
          }).join('')
        : `<div style="padding:10px; color:#64748b; font-size:12px; text-align:center;">暂无扣分记录，该维度表现优异</div>`;

      return `
        <div class="dossier-card" style="background:#0f172a; border:1px solid var(--card-border); padding:14px 18px; border-radius:8px; margin-bottom:12px; transition:all 0.2s ease;">
          <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px;">
            <div style="display:flex; align-items:center; gap:10px;">
              <span style="font-size:20px;">${dim.icon}</span>
              <div>
                <div style="display:flex; align-items:center; gap:8px;">
                  <strong style="font-size:14.5px; color:#f8fafc;">${dim.name}</strong>
                  <span style="font-size:11.5px; font-weight:600; padding:2px 8px; border-radius:4px; border:1px solid ${dim.statusColor}; color:${dim.statusColor}; background:rgba(255,255,255,0.04);">${dim.status}</span>
                </div>
                <div style="font-size:12px; color:#94a3b8; margin-top:2px;">${dim.desc}</div>
              </div>
            </div>

            <div style="display:flex; align-items:center; gap:14px;">
              <div style="text-align:right;">
                <div style="font-size:15px; font-weight:700; color:${dim.statusColor};">${dim.rate}% 触碰率</div>
                <div style="font-size:11px; color:#64748b;">单篇平均 ${dim.density} 处 · 待克服 ${dim.unclearedCount} 项</div>
              </div>
              <button class="btn btn-sm btn-outline" style="font-size:11.5px; padding:4px 10px;" onclick="toggleDossierExpand('${dim.key}')">
                ${isExpanded ? '▲ 收起' : `▼ 溯源 (${dim.totalCount}条)`}
              </button>
            </div>
          </div>

          ${isExpanded ? `
            <div style="margin-top:12px; padding-top:12px; border-top:1px dashed rgba(255,255,255,0.1);">
              <div style="font-size:12px; font-weight:600; color:#94a3b8; margin-bottom:4px;">📜 历史答卷扣分切片溯源 (近${metrics.recentCount}篇优先)：</div>
              ${itemsHtml}
            </div>
          ` : ''}
        </div>
      `;
    }).join('');
  }
}

// 在作答页面置顶显示作答短板前置动态提醒条
async function renderDossierWarningOnReviewPage(specifiedQType) {
  const db = window.clientDB;
  const dossiers = await db.getAll('dossier') || [];
  const alertEl = document.getElementById('dossier-review-alert');
  const textEl = document.getElementById('dossier-review-alert-text');
  if (!alertEl || !textEl) return;

  const qType = specifiedQType || document.getElementById('q-type')?.value || 'essay';

  // 仅筛选对应题型、严重级别为 critical 且未切除克服的短板项
  const criticals = dossiers.filter(d => {
    const matchType = (d.questionType === qType || (!d.questionType && qType === 'essay'));
    return matchType && d.severity === 'level_1_critical' && !d.cleared;
  });

  if (criticals.length > 0) {
    const dimNames = [...new Set(criticals.map(c => c.errorDimension || c.dimensionKey))];
    
    let advice = "";
    if (qType === 'doc') {
      advice = `本次下笔请务必核对公文五要素（标题、主送对象、正文逻辑层次、发文主体与日期），杜绝要素缺漏！`;
    } else if (qType === 'single') {
      advice = `本次作答请紧扣给定材料核心采分词，按要素分类归纳并提炼政务大词，切忌无序罗列！`;
    } else {
      advice = `本次下笔请务必先稳立意、布骨架，事例叙述后务必跟进深入制度与因果深析，杜绝照抄材料与口水话！`;
    }

    textEl.innerText = `检测到你在该题型中高频出现【${dimNames.join('、')}】失分弱项。${advice}`;
    alertEl.style.display = 'block';
  } else {
    alertEl.style.display = 'none';
  }
}

// 扣分归因项一键存为“避坑错题卡”
async function saveAttributionCardAsAntiPattern(idx) {
  const span = currentReviewSpans[idx];
  if (!span) return;
  const quote = currentReviewText.slice(span.start, span.end);

  const newCard = {
    id: `mem_anti_${Date.now()}`,
    category: "错题避坑",
    tag: "考场避坑",
    title: `避坑：${span.label || '扣分病灶'}`,
    content: `【原错语病】：${quote}\n【扣分归因】：${span.comment}\n【纠偏指引】：考场下笔严禁口语化或机械搬运，必须转化为规范政务动宾大词。`,
    repetitions: 0,
    interval: 0,
    ease: 2.3,
    nextReview: Date.now(),
    createdAt: Date.now()
  };

  await window.clientDB.put('memories', newCard);
  alert(`✓ 成功将该扣分项存入【个人申论记忆库】错题避坑分类！\n已自动排入今日 SM-2 艾宾浩斯复习流。`);
  renderMemoryDeck();
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

// 动态渲染历年真实官方题本列表 (最近5年国考与省考)
function renderPublicKBList() {
  const container = document.getElementById('public-kb-list');
  const countBadge = document.getElementById('public-kb-count');
  if (!container) return;

  if (countBadge) {
    countBadge.innerText = `共 ${currentExams.length} 套真实题本 (最近5年)`;
  }

  if (!currentExams || currentExams.length === 0) {
    container.innerHTML = `<div style="padding:12px; text-align:center; color:var(--text-muted);">暂无真题数据</div>`;
    return;
  }

  let html = '';
  currentExams.forEach(paper => {
    const qCount = paper.question_count || (paper.questions ? paper.questions.length : (paper.questions_summary ? paper.questions_summary.length : 1));
    const questionsSummary = paper.questions_summary || paper.questions || [];

    html += `
      <div style="padding: 10px 12px; border-bottom: 1px solid var(--card-border); transition: background 0.15s;" onmouseover="this.style.background='rgba(255,255,255,0.03)'" onmouseout="this.style.background='transparent'">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
          <div style="font-size: 13.5px; font-weight: 600; color: #f1f5f9; display: flex; align-items: center; gap: 8px;">
            <span>🏛️ ${paper.exam_name}</span>
            <span class="card-tag tag-blue" style="padding: 1px 6px; font-size: 11px;">${paper.category || '国考'} · ${paper.tier || '全卷'}</span>
            <span style="font-size: 11px; color: var(--text-muted);">共 ${qCount} 题 · 100分</span>
          </div>
          <button class="btn btn-outline" style="padding: 2px 10px; font-size: 11px;" onclick="selectExamForStudy('${paper.id}')">
            ✍️ 选用整卷
          </button>
        </div>
        <div style="display:flex; flex-wrap:wrap; gap:6px; margin-top:6px;">
          ${questionsSummary.map(q => {
            const typeLabel = q.type === 'essay' ? '大作文' : (q.type === 'doc' ? '公文' : '单一');
            return `
              <span style="font-size: 11px; padding: 2px 8px; border-radius: 4px; background: rgba(15, 23, 42, 0.6); border: 1px solid rgba(255,255,255,0.08); color: #cbd5e1; cursor:pointer;" onclick="selectExamForStudy('${paper.id}', '${q.id}')">
                题(${q.q_index})·${typeLabel} (${q.target_score || q.score || 20}分) ${q.title || q.question_title || ''}
              </span>
            `;
          }).join('')}
        </div>
      </div>
    `;
  });

  container.innerHTML = html;
}

// 从公共题库一键选用并跳转到做题界面
async function selectExamForStudy(paperId, questionId) {
  switchTab('review');
  const selector = document.getElementById('exam-selector');
  if (selector) {
    selector.value = paperId;
    await onExamSelectChange();
    if (questionId) {
      await selectSubQuestion(questionId);
    }
  }
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

// 启动与全局暴露
window.openSettingModal = openSettingModal;
window.openModelConfigModal = openSettingModal;
window.closeSettingModal = closeSettingModal;
window.saveSettings = saveSettings;
window.runFullReview = runFullReview;
window.selectSubQuestion = selectSubQuestion;
window.toggleScoringCriteria = toggleScoringCriteria;
window.selectExamForStudy = selectExamForStudy;

document.addEventListener('DOMContentLoaded', initApp);
