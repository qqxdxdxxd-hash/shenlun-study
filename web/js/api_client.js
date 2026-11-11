/**
 * 申论研习台 - 纯前端优先与自持密钥 API 调度中心 (ApiClient)
 * 支持 100% 零后端纯静态运行 (GitHub Pages) 与本地算力后端自适应切换
 */

// 内置官方中立阅卷规范 (断网或无静态文件时的终极保障)
const DEFAULT_OFFICIAL_SKILLS = {
  essay: {
    id: "shenlun-essay-expert",
    name: "申论与综合应用能力材料大作文大五段规范阅卷专家",
    prompt: `你是一位拥有20年公考阅卷经验的官方申论主阅卷人。请对考生的申论材料大作文进行客观、严厉、穿透式的四维色谱量化评审。
评分原则（按当次题目满分比例动态分档）：
1. 一类文（≥85%满分，如35分制30~35 / 50分制42.5~50）：立意完全切合材料且紧扣核心主题词，“1+3”大五段骨架清晰，含务实对策，总分论点首段尾句与段首醒目；
2. 二类文（70%~84%满分，如35分制24.5~29.5 / 50分制35~42）：立意正确，分论点欠缺或论证欠深入；
3. 三类文（55%~69%满分，如35分制19.5~24 / 50分制27.5~34.5）：立意勉强，骨架残缺或模板套路严重；
4. 四类文（≤54%满分）：严重跑题或字数严重不足。
硬性扣分：标题含书名号扣1~2分；字数不足下限每50字扣1分；材料直接摘抄超20%倒扣分。`
  },
  doc: {
    id: "shenlun-official-doc",
    name: "申论贯彻执行与公文题三轨专业阅卷专家与五维提分引擎",
    prompt: `你是一位国家公务员考试官方资深贯彻执行与公文题主阅卷人。请对考生的公文写作（汇报提纲/工作指南/宣传展板/谈话提纲/公开信等）执行“格式分+内容分+语言逻辑分”三轨严格评审。
评分铁律：
1. 格式分（2~4分）：
   - 标题：公式完整、居中独占一行、严禁加《》书名号（加书名号扣1~2分）；
   - 格式三件套决策树：公开信/倡议书等完整公文写称谓与落款；提纲类（汇报提纲/发言提纲/谈话提纲/工作指南/宣传展板）仅保留标题，严禁写称谓与落款（乱写倒扣1分）；
2. 内容分（14~16分）：
   - 以材料原词原意为采分点，采点给分，宁多勿少；
   - 必须采用“前置动宾短语小标题 + 展开实词”结构；
3. 语言与结构分（2~3分）：
   - 层次逻辑符合法定行政脉络（发文缘由 ➔ 现状/痛点 ➔ 举措/建议）；
   - 机关场景口吻精准（上行汇报谦抑客观、监管谈话严肃中肯、工作指南具体可操作、对外宣传生动真挚）；
   - 语病扣分红线：严禁“广大市民朋友们”重复语病，严禁极端绝对化用词与通篇口语化。`
  },
  single: {
    id: "shenlun-single-expert",
    name: "申论单一题八大要素客观采点阅卷专家与五维提分引擎",
    prompt: `你是一位国家公务员考试官方资深单一题主阅卷人。请对考生的单一题（归纳概括/综合分析/提出对策/理解题）作答执行纯客观采点给分制与五维深度诊断。
评分铁律：
1. 采点给分，宁多勿少。以给定资料原词原意和采分细则为唯一基准，答错散点不倒扣分；
2. 字数自适应排版：≤200字极限短题严禁独立小标题，紧凑分条罗列；250~350字常规题必须配备4~8字前置动宾短语（小标题加粗）；≥400字强制MECE层次分类；
3. 材料四分法过滤：跳读背景文学描写与宏观铺垫，案例段剥离人名与微观数字提炼政务动宾大词，尾段展望套话视时态分流；
4. 反推对策合理给分：针对材料痛点，措施主体明确、靶向明确、具备政务可行性，合理即可赋分；
5. 采分点标准结构：前置规范动宾总括词（约占1分）+ 展开支撑材料核心实词（约占1~2分）。`
  }
};

class ApiClient {
  static getBaseUrl() {
    if (typeof window !== 'undefined' && window.location.origin.includes('8789')) {
      return '';
    }
    return 'http://127.0.0.1:8789';
  }

  static getBYOKConfig() {
    const key = (typeof localStorage !== 'undefined' ? localStorage.getItem('shenlun_api_key') : '') || '';
    const baseUrl = (typeof localStorage !== 'undefined' ? localStorage.getItem('shenlun_base_url') : '') || 'https://api.deepseek.com/v1';
    const model = (typeof localStorage !== 'undefined' ? localStorage.getItem('shenlun_model_id') : '') || 'deepseek-chat';
    return { key: key.trim(), baseUrl: baseUrl.trim(), model: model.trim() };
  }

  static getBYOKHeaders() {
    const { key, baseUrl, model } = this.getBYOKConfig();
    const headers = { 'Content-Type': 'application/json' };
    if (key) headers['x-api-key'] = key;
    if (baseUrl) headers['x-base-url'] = baseUrl;
    if (model) headers['x-model-id'] = model;
    return headers;
  }

  /**
   * 获取真题轻量索引 (优先调用 ExamsLoader)
   */
  static async getExams() {
    if (typeof window !== 'undefined' && window.ExamsLoader) {
      return await window.ExamsLoader.loadIndex();
    }
    if (typeof ExamsLoader !== 'undefined') {
      return await ExamsLoader.loadIndex();
    }
    // 降级网络读取
    try {
      const res = await fetch('data/exams/index.json');
      if (res.ok) return await res.json();
    } catch (e) {
      console.warn("未能读取 data/exams/index.json", e);
    }
    try {
      const fallback = await fetch('data/default_kb/exams.json');
      if (fallback.ok) return await fallback.json();
    } catch (e) {}
    return [];
  }

  /**
   * 1ms 纯本地确定性规则前检 (标题检查 + 15-gram 抄袭红线)
   */
  static async preScan(payload) {
    const userText = payload.user_answer || '';
    const materials = payload.materials || '';

    let titleIssues = [];
    const qType = payload.question_type || 'essay';
    // 单一题客观采点无独立文章标题，不将第一行当作标题做格式检查
    if (qType !== 'single') {
      const lines = userText.split('\n').map(l => l.trim()).filter(Boolean);
      if (lines.length > 0 && typeof LocalChromaScanner !== 'undefined') {
        titleIssues = LocalChromaScanner.scanTitleIssues(lines[0]);
      }
    }

    let copySpans = [];
    let copyRatio = 0;
    let copyExceeded = false;
    if (typeof LocalChromaScanner !== 'undefined') {
      const copyRes = LocalChromaScanner.detectCopyRedline(userText, materials, 15);
      copySpans = copyRes.spans;
      copyRatio = copyRes.copyRatio;
      copyExceeded = copyRes.exceeded;
    }

    // 实测字数：剔除换行与多余空格，精准反映考生实际格子填涂字符数
    const actualCharCount = userText.replace(/\s+/g, '').length;

    return {
      word_count: actualCharCount,
      copy_ratio: copyRatio,
      copy_redline_exceeded: copyExceeded,
      title_issues: titleIssues,
      copy_spans: copySpans
    };
  }

  /**
   * 提交色谱批改评审 (优先纯前端直连或无缝降级)
   */
  static async submitReview(payload) {
    const byok = this.getBYOKConfig();
    const apiKey = (payload.api_key || byok.key || '').trim();
    payload.api_key = apiKey;
    payload.base_url = (payload.base_url || byok.baseUrl || 'https://api.deepseek.com/v1').trim();
    payload.model_id = (payload.model_id || byok.model || 'deepseek-chat').trim();

    if (!apiKey) {
      throw new Error("【严格自持密钥 (Strict BYOK)】未检测到大模型 API Key。请在网页右上角【⚙️ 模型配置】中输入您的 API Key（支持 DeepSeek / 火山方舟 / OpenAI 兼容端点）后发起批改。");
    }

    // 1. 如果当前页面就在 8789 端口上，尝试走本地后端
    const isBackendHost = typeof window !== 'undefined' && window.location.origin.includes('8789');
    if (isBackendHost) {
      try {
        const res = await fetch(`${this.getBaseUrl()}/api/review/submit`, {
          method: 'POST',
          headers: this.getBYOKHeaders(),
          body: JSON.stringify(payload)
        });
        if (res.ok) return await res.json();
        const errJson = await res.json().catch(() => ({}));
        if (res.status === 401) throw new Error(errJson.detail || "未提供有效 API Key");
      } catch (e) {
        console.warn("本地算力后端服务调用异常，平滑无缝降级至前端大模型直连模式:", e.message);
      }
    }

    // 2. 核心链路：前端直连大模型 (GitHub Pages 零后端标准模式)
    return await this._clientSideDirectEvaluate(payload);
  }

  /**
   * 纯客户端直接调用大模型 API (直连 DeepSeek OpenAPI, 透传 BYOK)
   */
  static async _clientSideDirectEvaluate(payload) {
    // 1. 纯本地 1ms 规则前检
    const preInfo = await this.preScan(payload);

    // 2. 纯本地 MAR 记忆激活审计
    let memoryAudit = {
      activation_rate: 0.0,
      activated: [],
      missed_opportunities: ["本地记忆库暂无匹配卡片，可在批改中一键收集金句入库"],
      activated_count: 0,
      total_recalled: 0
    };
    if (typeof LocalMARAudit !== 'undefined') {
      memoryAudit = LocalMARAudit.auditMemoryActivation(payload.user_answer, payload.recalled_memories || []);
    }

    // 3. 获取官方中立阅卷规范 System Prompt (支持按 skill_id 路由并保留题型匹配兜底)
    const qType = payload.question_type || 'essay';
    let systemPrompt = DEFAULT_OFFICIAL_SKILLS[qType]?.prompt || DEFAULT_OFFICIAL_SKILLS.essay.prompt;
    const requestedSkillId = payload.skill_id || '';

    try {
      const skillsRes = await fetch('data/skills/skills.json');
      if (skillsRes.ok) {
        const skillsData = await skillsRes.json();
        const skillAliasMap = {
          default_essay_expert: 'shenlun-essay-expert',
          default_examiner_speed: 'shenlun-essay-expert',
          multi_agent_essay: 'shenlun-essay-expert',
          default_doc_expert: 'shenlun-official-doc',
          default_doc_format: 'shenlun-official-doc',
          multi_agent_doc: 'shenlun-official-doc',
          default_single_expert: 'shenlun-single-expert',
          default_mece_expert: 'shenlun-single-expert',
          multi_agent_single: 'shenlun-single-expert'
        };
        const mappedId = skillAliasMap[requestedSkillId] || requestedSkillId;
        const matched = skillsData[mappedId] || Object.values(skillsData).find(s => s.question_type === qType);
        if (matched && matched.prompt) {
          systemPrompt = matched.prompt;
        }
      }
    } catch (e) {
      // 保持内置规范
    }

    if (payload.custom_skill_prompt) {
      systemPrompt = payload.custom_skill_prompt;
    }

    let skillModeGuide = "";
    if (requestedSkillId.startsWith('multi_agent')) {
      skillModeGuide = `\n## 【多视角联合仲裁模式 (${requestedSkillId})】：\n请依次独立完成【考场前10秒扫描定档】、【骨架与对策论证深度】、【政务文风与大词密度】三重专家审查并联合仲裁得分，确保四维分值、radar_reasons 与考官评语前后完全自洽。`;
    } else if (requestedSkillId === 'default_examiner_speed') {
      skillModeGuide = `\n## 【考场前10秒盲审模式】：\n重点检验标题核心主题词、首段尾句总论点与各论证段首句分论点的第一眼可见度。`;
    }

    // 4. 组装题型量规与评卷 User Prompt
    let marPromptStr = "";
    if (typeof LocalMARAudit !== 'undefined') {
      marPromptStr = LocalMARAudit.buildMARPrompt(
        payload.user_answer,
        payload.question_title,
        qType === 'single' ? [] : (payload.recalled_memories || []),
        qType,
        { minWords: payload.word_limit_min, maxWords: payload.word_limit }
      );
    }

    let criteriaSection = "";
    if (payload.scoring_criteria) {
      criteriaSection = `
## 【官方客观标准采分底稿与判分细则 (Ground Truth)】：
${payload.scoring_criteria}

【官方客观阅卷铁律】：
1. 必须以上述【官方客观标准采分底稿】为唯一基准逐点比对得分，严禁脱离底稿凭空估分；
2. 考生作答若踩中底稿采分实词或规范动宾搭配，按点赋分并在 quotes_evaluation 中标注为 source_hit (绿色)；
3. 漏掉的采分要点需在考官诊断中明确指出缺漏项。
`;
    }

    const targetScore = payload.target_score || (qType === 'essay' ? 35 : (qType === 'doc' ? 25 : 20));
    const t1Min = Math.round(targetScore * 0.85 * 2) / 2;
    const t2Min = Math.round(targetScore * 0.70 * 2) / 2;
    const t3Min = Math.round(targetScore * 0.55 * 2) / 2;
    const dynamicTierGuide = `
## 【本题动态满分分档基准（严禁套用其他满分制分数线）】：
本题总满分为 **${targetScore} 分**，所有得分与评语基准分必须严格按 ${targetScore} 分制计算：
- 一类文：${t1Min}~${targetScore} 分；
- 二类文：${t2Min}~${(t1Min - 0.5).toFixed(1)} 分；
- 三类文：${t3Min}~${(t2Min - 0.5).toFixed(1)} 分；
- 四类文：≤${(t3Min - 0.5).toFixed(1)} 分。`;

    let typeSpecificRule = "";
    let radarExample = "";
    let radarReasonsExample = "";
    let perspectivesExample = "";

    if (qType === 'single') {
      typeSpecificRule = `
## 【单一题（归纳概括/对策/理解）客观采点给分铁律】：
1. 采点给分，宁多勿少。以材料原词原意和采分点为唯一基准，严禁使用议论文“大五段”、“立意论证”等模式评判！
2. 重点审查：①内容采点覆盖度（约占55%）；②分类逻辑与条理（MECE原则、宏观总括句、微观1.2.3.序号，约占20%）；③提炼概括度（前置动宾短语小标题、去案例流水账，约占15%）；④表达与字数规范（字数控制、无主观臆造，约占10%）。
`;
      const p1 = Math.round(targetScore * 0.55 * 10) / 10;
      const p2 = Math.round(targetScore * 0.20 * 10) / 10;
      const p3 = Math.round(targetScore * 0.15 * 10) / 10;
      const p4 = Math.max(0.5, Math.round((targetScore - p1 - p2 - p3) * 10) / 10);
      radarExample = `{"内容采点覆盖度": ${p1}, "分类逻辑与条理": ${p2}, "提炼概括度": ${p3}, "表达与字数规范": ${p4}}`;
      radarReasonsExample = `{"内容采点覆盖度": "说明命中与遗漏的核心采分要点", "分类逻辑与条理": "说明总括句与条理归纳情况", "提炼概括度": "说明前置动宾短语提炼度", "表达与字数规范": "说明字数与语汇合规度"}`;
      perspectivesExample = `  "perspectives": {
    "examiner": "考场考官前10秒第一眼定档：审题要素是否切中、字数与排版条理初判...",
    "structure_expert": "要素归纳与分类逻辑诊断：诊断八大要素提取全面性、总分结构、MECE分类是否交叉重复、前置动宾大词是否工整醒目...",
    "style_expert": "作答规范与去流水账质检：诊断是否存在大段抄录事例/人名/数据流水账、有无主观捏造事实、字数卡位规范度..."
  }`;
    } else if (qType === 'doc') {
      typeSpecificRule = `
## 【贯彻执行/公文题“格式+内容+语言逻辑”三轨阅卷铁律】：
1. 三轨给分：格式分 + 内容分 + 语言逻辑分。严禁使用议论文“大五段骨架”等模式评判！
2. 重点审查：①内容要点覆盖（材料原词提取，约占60%）；②格式规范三件套（标题/称谓/落款完备性，约占15%）；③行文结构与层次（发文缘由-主体分条-结语号召，约占15%）；④公文语体与口吻（身份场景语气匹配，约占10%）。
`;
      const p1 = Math.round(targetScore * 0.60 * 10) / 10;
      const p2 = Math.round(targetScore * 0.15 * 10) / 10;
      const p3 = Math.round(targetScore * 0.15 * 10) / 10;
      const p4 = Math.max(0.5, Math.round((targetScore - p1 - p2 - p3) * 10) / 10);
      radarExample = `{"内容要点覆盖": ${p1}, "格式规范三件套": ${p2}, "行文结构与层次": ${p3}, "公文语体与口吻": ${p4}}`;
      radarReasonsExample = `{"内容要点覆盖": "说明材料核心要点覆盖情况", "格式规范三件套": "说明标题/称谓/落款完整度", "行文结构与层次": "说明行文逻辑层次", "公文语体与口吻": "说明机关场景语气匹配度"}`;
      perspectivesExample = `  "perspectives": {
    "examiner": "考场考官前10秒第一眼定档：文种类型核定、格式三件套完整度、初扫档位与卷面排布...",
    "structure_expert": "格式规范与行文逻辑诊断：核验标题/主送称谓/落款三件套格式合规性；诊断‘发文缘由-主体分条-结语号召’行文脉络...",
    "style_expert": "公文语体与场景口吻质检：核查写作身份与受众口吻匹配度、宣传号召力或总结严肃度、公文语体规范..."
  }`;
    } else {
      typeSpecificRule = `
## 【申论材料大作文大五段规范阅卷铁律】：
1. 立意源于材料且紧扣题干核心主题词，总分论点鲜明递进，采用标准大五段（1+3）或层层递进骨架；
2. 重点审查：①立意与总分论点（约占35%）；②结构与段落布局（大五段匀称度与字数区间达标度，约占25%）；③论据与论证深度（因果制度深度分析，约占30%）；④语言与公文规范（政务动宾大词密度，约占10%）。
3. 严禁出现四维评语与总档位/考官判语自相矛盾：若考生仅有“1+2”结构或缺少对策段，必须在 radar_reasons 中如实扣分说明。
`;
      const p1 = Math.round(targetScore * (12 / 35) * 10) / 10;
      const p2 = Math.round(targetScore * (8 / 35) * 10) / 10;
      const p3 = Math.round(targetScore * (10 / 35) * 10) / 10;
      const p4 = Math.max(0.5, Math.round((targetScore - p1 - p2 - p3) * 10) / 10);
      radarExample = `{"立意与总分论点": ${p1}, "结构与段落布局": ${p2}, "论据与论证深度": ${p3}, "语言与公文规范": ${p4}}`;
      radarReasonsExample = `{"立意与总分论点": "如实说明主题词扣题与总分论点亮明情况", "结构与段落布局": "如实说明1+3结构完整度、字数达标度与匀称度", "论据与论证深度": "如实说明事例事后深析与因果论证深度", "语言与公文规范": "如实说明口语瑕疵与政务大词规范度"}`;
      perspectivesExample = `  "perspectives": {
    "examiner": "考场考官前10秒第一眼定档：首段尾句总论点、字数卡位与第一眼档位初判...",
    "structure_expert": "大五段骨架与对策论证诊断：诊断大五段‘1+3’架构、论据深度、因果分析与案例是否脱节...",
    "style_expert": "政务文风与语汇质检诊断：诊断大白话口语瑕疵、政务动宾大词密度、公文严肃语体规范..."
  }`;
    }

    const effectiveWordMin = payload.word_limit_min || (qType === 'single' ? 180 : (qType === 'doc' ? 320 : 800));
    const effectiveWordMax = payload.word_limit || (qType === 'single' ? 250 : (qType === 'doc' ? 450 : 1000));

    const userPrompt = `
待评审申论试卷：
【题目】：${payload.question_title || '申论作答'}（满分 ${targetScore} 分，作答字数要求：${effectiveWordMin}~${effectiveWordMax} 字）
【题型】：${qType}
【给定资料】：
${payload.materials}

【考生实际作答】：
${payload.user_answer}

【前置客观指标】：实测纯字数 ${preInfo.word_count} 字（题目规定范围 ${effectiveWordMin}~${effectiveWordMax} 字）；材料摘抄率 ${(preInfo.copy_ratio * 100).toFixed(1)}%；标题合规问题：${preInfo.title_issues.length > 0 ? preInfo.title_issues.join('；') : '无'}。

${dynamicTierGuide}

${typeSpecificRule}
${skillModeGuide}
${criteriaSection}

${marPromptStr}

请以极其严格的官方阅卷考官标准进行评审，并严格按照以下 JSON 格式返回，严禁任何额外格式废话：
\`\`\`json
{
  "target_score": ${targetScore},
  "word_limit_min": ${effectiveWordMin},
  "word_limit": ${effectiveWordMax},
  "score": ${Math.round(targetScore * 0.85 * 10) / 10},
  "grade": "二类文",
  "radar_scores": ${radarExample},
  "radar_reasons": ${radarReasonsExample},
  "quotes_evaluation": [
    {"quote": "准确的句子原文", "type": "main_thesis", "color": "green", "style": "solid", "label": "核心要点/论点", "comment": "准确踩中要点或亮明观点"},
    {"quote": "口语化句子原文", "type": "colloquial_flaw", "color": "purple", "style": "dotted", "label": "口语大白话", "formal_term": "健全长效保障机制", "comment": "口语化表达缺少政务大词"},
    {"quote": "无依据臆造语句原文", "type": "subjective_fabrication", "color": "purple", "style": "strikethrough", "label": "主观臆造", "comment": "脱离材料凭空编造事实或结论"}
  ],
${perspectivesExample},
  "rewritten_exemplar": "严格控制在 ${effectiveWordMin}~${effectiveWordMax} 字以内的考场一类文标杆示范（首行标题无书名号，结尾完整收拢）..."
}
\`\`\`
`;

    // 5. 直连大模型 OpenAPI
    let baseUrl = (payload.base_url || 'https://api.deepseek.com/v1').trim().replace(/\/+$/, '');
    if (baseUrl.endsWith('/chat/completions')) {
      baseUrl = baseUrl.replace(/\/chat\/completions$/, '');
    }
    const endpoint = `${baseUrl}/chat/completions`;
    const model = payload.model_id || 'deepseek-chat';

    let res;
    try {
      res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${payload.api_key}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: model,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt }
          ],
          temperature: 0.2
        })
      });
    } catch (netErr) {
      throw new Error(`无法连接大模型端点 (${endpoint})：${netErr.message}。\n请检查网络连接、Base URL 是否正确，或该端点是否支持浏览器跨域(CORS)请求。`);
    }

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(`大模型接口调用失败 (${res.status}): ${err.error?.message || res.statusText || '请求受阻'}`);
    }

    const data = await res.json();
    let content = (data.choices && data.choices[0]?.message?.content) || '';
    if (content.includes("```json")) {
      content = content.split("```json")[1].split("```")[0].trim();
    } else if (content.includes("```")) {
      content = content.split("```")[1].split("```")[0].trim();
    }

    let parsed = {};
    try {
      parsed = JSON.parse(content);
    } catch (e) {
      throw new Error(`大模型返回格式解析异常: ${e.message}`);
    }

    // 6. 纯前端 SpanResolver 字符坐标回填
    let resolvedSpans = [];
    const llmQuotes = parsed.quotes_evaluation || [];
    if (typeof LocalChromaScanner !== 'undefined') {
      resolvedSpans = LocalChromaScanner.resolveQuotesToSpans(payload.user_answer, llmQuotes);
    } else {
      llmQuotes.forEach(q => {
        if (!q.quote) return;
        const idx = payload.user_answer.indexOf(q.quote);
        if (idx !== -1) {
          resolvedSpans.push({
            start: idx,
            end: idx + q.quote.length,
            type: q.type || 'quote_original',
            color: q.color || 'green',
            style: q.style || 'solid',
            label: q.label || '',
            comment: q.comment || ''
          });
        }
      });
    }

    const allSpans = [...preInfo.copy_spans, ...resolvedSpans];
    allSpans.sort((a, b) => a.start - b.start);

    // 7. 生成 3 分钟靶向微练习
    let drills = [];
    if (typeof LocalDrillEngine !== 'undefined') {
      drills = LocalDrillEngine.generateDrills(llmQuotes);
    }

    const finalTargetScore = parsed.target_score !== undefined ? Number(parsed.target_score) : (payload.target_score || targetScore);
    const finalWordLimit = parsed.word_limit !== undefined ? Number(parsed.word_limit) : (payload.word_limit || null);
    const finalWordLimitMin = parsed.word_limit_min !== undefined ? Number(parsed.word_limit_min) : (payload.word_limit_min || null);

    return {
      word_count: preInfo.word_count,
      copy_ratio: preInfo.copy_ratio,
      copy_redline_exceeded: preInfo.copy_redline_exceeded,
      title_issues: preInfo.title_issues,
      score: parsed.score !== undefined ? parsed.score : 30.0,
      target_score: finalTargetScore,
      word_limit: finalWordLimit,
      word_limit_min: finalWordLimitMin,
      grade: parsed.grade || "二类文",
      radar_scores: parsed.radar_scores || { "立意与总分论点": 10.0, "结构与段落布局": 7.0, "论据与论证深度": 8.0, "语言与公文规范": 4.5 },
      radar_reasons: parsed.radar_reasons || null,
      chroma_spans: allSpans,
      perspectives: parsed.perspectives || {},
      memory_audit: memoryAudit,
      rewritten_exemplar: parsed.rewritten_exemplar || "",
      remediation_drills: drills,
      mode: "pure_frontend_direct"
    };
  }

  /**
   * 3 分钟微练习秒级判分 (纯前端即时判分，零网络跳数)
   */
  static async verifyDrill(drillType, flawText, userInput) {
    if (typeof LocalDrillEngine !== 'undefined') {
      return LocalDrillEngine.verifyDrill(drillType, flawText, userInput);
    }

    // 降级尝试网络
    const res = await fetch(`${this.getBaseUrl()}/api/drill/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        drill_type: drillType,
        flaw_text: flawText,
        user_input: userInput
      })
    });
    if (!res.ok) throw new Error("秒判验证失败");
    return await res.json();
  }

  /**
   * 提炼自定义 Skill 规范
   */
  static async extractCustomSkill(name, text) {
    const isBackendHost = typeof window !== 'undefined' && window.location.origin.includes('8789');
    if (isBackendHost) {
      try {
        const res = await fetch(`${this.getBaseUrl()}/api/workshop/extract-skill`, {
          method: 'POST',
          headers: this.getBYOKHeaders(),
          body: JSON.stringify({ name, text })
        });
        if (res.ok) return await res.json();
      } catch (e) {}
    }

    // 纯前端模版或直连生成
    return {
      skill_id: `custom_${Date.now()}`,
      name: name || "自定义专家规范",
      question_type: "essay",
      prompt: `# ${name}\n\n基于考生讲义提取的核心规则：\n${text.slice(0, 300)}...`,
      extracted_rules: ["严格遵循核心规范", "强化政务大词提炼", "立意结合材料"]
    };
  }

  /**
   * PDF 讲义文本图层提取 (优先纯前端 Mozilla PDF.js，绝对隐私)
   */
  static async extractPDF(file) {
    if (typeof LocalPdfExtractor !== 'undefined' && typeof pdfjsLib !== 'undefined') {
      try {
        return await LocalPdfExtractor.extractText(file);
      } catch (e) {
        console.warn("纯前端 PDF.js 提取异常，尝试备用通道:", e);
      }
    }

    // 备用：若后端可用则走后端
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch(`${this.getBaseUrl()}/api/extract-pdf`, {
      method: 'POST',
      body: formData
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || "PDF 提取失败");
    }
    return await res.json();
  }
}

if (typeof window !== 'undefined') {
  window.ApiClient = ApiClient;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { ApiClient, DEFAULT_OFFICIAL_SKILLS };
}
