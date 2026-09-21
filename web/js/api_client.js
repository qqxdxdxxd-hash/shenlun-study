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
评分原则：
1. 一类文（30~35分）：立意完全切合材料，“1+3”大五段骨架清晰，总分论点首段与段首醒目；
2. 二类文（25~29分）：立意正确，分论点欠缺或论证欠深入；
3. 三类文（19~24分）：立意勉强，模板套路严重；
4. 四类文（18分以下）：严重跑题或字数严重不足。
硬性扣分：标题含书名号扣1~2分；字数不足每50字扣1分；材料直接摘抄超20%倒扣分。`
  },
  doc: {
    id: "shenlun-official-doc",
    name: "申论贯彻执行与公文题三轨专业阅卷专家",
    prompt: `你是一位公考贯彻执行与公文题官方资深主阅卷人。
评分模型（三轨）：
1. 格式分（1~2分）：标题、主送称谓、落款；
2. 内容分（14~16分）：严格以材料原词原意为采分点；
3. 语言与逻辑分（2~3分）：行文号召力、排比对仗、分类清晰度（MECE原则）。`
  },
  single: {
    id: "shenlun-single-expert",
    name: "申论单一题八大要素客观采点阅卷专家",
    prompt: `你是一位公职考试单一题（归纳概括、提出对策、理解题）官方阅卷专家。
评分铁律：采点给分，宁多勿少。
采分标准：前置动宾总括词 + 展开支撑实词。全面、准确、简明、有条理。`
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
    const lines = userText.split('\n').map(l => l.trim()).filter(Boolean);
    if (lines.length > 0 && typeof LocalChromaScanner !== 'undefined') {
      titleIssues = LocalChromaScanner.scanTitleIssues(lines[0]);
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

    return {
      word_count: userText.trim().length,
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

    // 3. 获取官方中立阅卷规范 System Prompt
    const qType = payload.question_type || 'essay';
    let systemPrompt = DEFAULT_OFFICIAL_SKILLS[qType]?.prompt || DEFAULT_OFFICIAL_SKILLS.essay.prompt;

    try {
      const skillsRes = await fetch('data/skills/skills.json');
      if (skillsRes.ok) {
        const skillsData = await skillsRes.json();
        const matched = Object.values(skillsData).find(s => s.question_type === qType);
        if (matched && matched.prompt) {
          systemPrompt = matched.prompt;
        }
      }
    } catch (e) {
      // 保持内置规范
    }

    // 4. 组装 MAR 约束与评卷 User Prompt
    let marPromptStr = "";
    if (typeof LocalMARAudit !== 'undefined') {
      marPromptStr = LocalMARAudit.buildMARPrompt(payload.user_answer, payload.question_title, payload.recalled_memories || []);
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

    const userPrompt = `
待评审申论试卷：
【题目】：${payload.question_title || '申论作答'}（满分 ${payload.target_score || 35} 分）
【题型】：${qType}
【给定资料】：
${payload.materials}

【考生实际作答】：
${payload.user_answer}

【前置客观指标】：实测字数 ${preInfo.word_count} 字；材料摘抄率 ${(preInfo.copy_ratio * 100).toFixed(1)}%；标题合规问题：${preInfo.title_issues.length > 0 ? preInfo.title_issues.join('；') : '无'}。

${criteriaSection}

${marPromptStr}

请以极其严格的官方阅卷考官标准进行评审，并严格按照以下 JSON 格式返回，严禁任何额外格式废话：
\`\`\`json
{
  "score": 31.5,
  "grade": "一类下 (31~32分)",
  "radar_scores": {"立意与总分论点": 11.0, "结构与段落布局": 7.5, "论据与论证深度": 9.0, "语言与公文规范": 4.0},
  "quotes_evaluation": [
    {"quote": "准确的句子原文", "type": "main_thesis", "color": "green", "style": "solid", "label": "总论点", "comment": "首段末句亮明总论点"},
    {"quote": "口语化句子原文", "type": "colloquial_flaw", "color": "purple", "style": "strikethrough", "label": "大白话", "comment": "口语化表达缺少政务大词"}
  ],
  "perspectives": {
    "examiner": "模拟考官前10秒第一眼扫描诊断...",
    "structure_expert": "关于立意骨架与段落匀称度的深度评价...",
    "style_expert": "关于政务公文文风与词汇密度的评价..."
  },
  "rewritten_exemplar": "基于考生原文结合其记忆库重构的一类文示范..."
}
\`\`\`
`;

    // 5. 直连大模型 OpenAPI
    const baseUrl = (payload.base_url || 'https://api.deepseek.com/v1').replace(/\/+$/, '');
    const endpoint = `${baseUrl}/chat/completions`;
    const model = payload.model_id || 'deepseek-chat';

    const res = await fetch(endpoint, {
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

    return {
      word_count: preInfo.word_count,
      copy_ratio: preInfo.copy_ratio,
      copy_redline_exceeded: preInfo.copy_redline_exceeded,
      title_issues: preInfo.title_issues,
      score: parsed.score || 30.0,
      grade: parsed.grade || "二类文",
      radar_scores: parsed.radar_scores || { "立意与总分论点": 10.0, "结构与段落布局": 7.0, "论据与论证深度": 8.0, "语言与公文规范": 4.5 },
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
