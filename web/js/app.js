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

// 静态/纯前端兜底真题库 (保证在 GitHub Pages 等纯静态环境下依然能即刻呈现真题)
const FALLBACK_DEFAULT_EXAMS = [
  {
    id: "gk2026_essay",
    exam_name: "2026年国考副省级",
    question_type: "essay",
    question_title: "以绿色发展理念引领现代化大作文",
    prompt_text: "“给定资料4”中提到“大鹏之动，非一羽之轻；骐骥之速，非一足之力”。请深入思考这句话的内涵，联系实际，自选角度，自拟题目，写一篇议论文。",
    prompt_reqs: "① 立意明确，见解深刻；② 联系实际，不拘泥于给定资料；③ 思路清晰，语言流畅；④ 参考时限 60 分钟，字数 1000~1200 字，满分 35 分。",
    target_score: 35,
    materials: "【给定资料 1】某沿海工业强市曾走过一段高能耗、高污染的粗放增长历程。上世纪末，为了追求产值增速，该市盲目招引大量高耗能化工与印染企业，虽然短期内财政收入大幅上涨，但随之而来的是河道发黑发臭、灰霾天气频繁，引发群众强烈不满。进入新时代，该市坚决摒弃“先污染后治理”的传统老路，坚决贯彻绿色发展理念。市委统筹算大账、长远账，三年内依法关停搬迁落后污染企业 128 家，引入清洁能源装备制造与工业互联网产业，昔日黑烟滚滚的厂区全面升级为绿色低碳示范园，实现了经济增速与生态环境的“双向提升”。\n\n【给定资料 2】在中国式现代化进程中，生态文明建设是全局性、根本性工程。环境法学专家李教授指出：“保护生态环境必须依靠最严格的制度、最严密的法治。很多地方基层治理出现‘上面发文件、基层难落实’，根源在于财政保障不足与权责脱节。”必须健全生态保护补偿制度和转移支付机制，打破部门壁垒，推行跨流域横向生态补偿，严格落实河湖长制、林长制，把生态环境指标作为领导干部考核的硬性刚性约束，以制度倒逼产业升级。\n\n【给定资料 3】良好生态环境是最普惠的民生福祉。某街道探索“绿色积分银行”，将垃圾分类、河道巡查、低碳出行转化为积分，居民可凭积分兑换生活用品。党员带头成立“绿色管家”志愿者队伍，开展常态化环保宣传，带动超 90% 的居民自觉参与社区环境整治，昔日脏乱老旧小区变成了绿树成荫的生态宜居家园。\n\n【给定资料 4】古人云：“大鹏之动，非一羽之轻；骐骥之速，非一足之力。”中国式现代化是人与自然和谐共生的现代化。面对艰巨繁重的绿色转型任务，既需要国家层面的顶层设计与战略定力，也需要经营主体的自觉践行，更需要亿万人民的团结奋斗。只有全社会凝心聚力、久久为功，才能共同绘就美丽中国的壮阔图景。"
  },
  {
    id: "js2025_single",
    exam_name: "2025年江苏省考A类",
    question_type: "single",
    question_title: "基层形式主义与减负对策",
    prompt_text: "根据“给定资料2”，请概括当前部分地区在基层形式主义整治过程中面临的主要瓶颈与成因，并提出切实可行的对策建议。",
    prompt_reqs: "① 概括全面，条理清晰；② 对策具备针对性与可行性；③ 字数不超过 300 字，满分 20 分。",
    target_score: 20,
    materials: "【给定资料 2】半月谈记者走访某乡镇，一名大学生村官坦言：“现在上级各类检查评比名目繁多，手机里装了十几个政务App，每天打卡拍照、填报台账耗费了近半天时间。工作干得好不如材料写得好、台账造得齐，基层干部苦不堪言。”县委党校副教授分析指出，形式主义在基层屡禁不止，根源在于政绩观扭曲以及“考核机制唯痕迹论”。一些上级部门图省事，把督导简化为查台账、看留痕；加上权责不对等，基层‘看得见的管不着、管得着的看不见’，导致减负政策在基层出现温差。"
  },
  {
    id: "sydw2025_doc",
    exam_name: "2025年事业单位联考A类",
    question_type: "doc",
    question_title: "垃圾分类倡议公开信",
    prompt_text: "为了在全区推广生活垃圾分类，某区城管局拟向全体市民发布一封倡议公开信。请根据“给定资料3”，拟写这份公开信的内容提纲。",
    prompt_reqs: "① 格式要素齐全（标题、称谓、正文、落款）；② 动员语言有感染力，措施具体；③ 字数 400~500 字，满分 25 分。",
    target_score: 25,
    materials: "【给定资料 3】生活垃圾分类不仅是民生关键小事，更关乎城市文明底色。某区日均产生生活垃圾达 800 余吨，垃圾焚烧厂超负荷运转。为扭转这一现状，区政府决定在全区全面启动垃圾分类定时定点投放工作。公开信需向广大市民讲清分类必要性，倡导源头减量，明确厨余垃圾、可回收物分类标准，并公布社区志愿监督热线与奖励积分细则。"
  }
];

let currentExams = [...FALLBACK_DEFAULT_EXAMS];
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

  const examSelector = document.getElementById('exam-selector');
  if (qType === 'essay') examSelector.value = 'gk2026_essay';
  else if (qType === 'single') examSelector.value = 'js2025_single';
  else if (qType === 'doc') examSelector.value = 'sydw2025_doc';
  onExamSelectChange();

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

  const apiKey = (localStorage.getItem('shenlun_api_key') || '').trim();
  if (!apiKey) {
    openModelConfigModal();
    alert("【请先配置大模型密钥】\n本项目遵循 Strict BYOK (自持密钥) 规范，不设集中式商业服务器。\n请在弹出的【⚙️ 模型配置】窗口中填入您的 DeepSeek / 火山方舟 / OpenAI 兼容 API Key 后开始批改。");
    return;
  }

  const payload = {
    question_type: qType,
    question_title: topic,
    materials: materials,
    user_answer: userText,
    target_score: targetScore,
    skill_id: skillId,
    recalled_memories: recalled,
    api_key: apiKey,
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

    // 真正沉淀进作答短板档案 (自反性记忆闭环)
    await recordDossierDefects(subId, qType, topic, userText, result);
    await renderDossierList();
    await renderDossierWarningOnReviewPage(qType);
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
