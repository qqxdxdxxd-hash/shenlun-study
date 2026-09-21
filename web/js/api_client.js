/**
 * 无状态算力后端 API 客户端 (含 BYOK 密钥透传)
 */
class ApiClient {
  static getBaseUrl() {
    return window.location.origin.includes('8789') ? '' : 'http://127.0.0.1:8789';
  }

  static getBYOKHeaders() {
    const key = localStorage.getItem('shenlun_api_key') || '';
    const baseUrl = localStorage.getItem('shenlun_base_url') || '';
    const model = localStorage.getItem('shenlun_model_id') || '';
    const headers = { 'Content-Type': 'application/json' };
    if (key) headers['x-api-key'] = key;
    if (baseUrl) headers['x-base-url'] = baseUrl;
    if (model) headers['x-model-id'] = model;
    return headers;
  }

  static async getExams() {
    try {
      const res = await fetch(`${this.getBaseUrl()}/api/kb/exams`);
      if (res.ok) return await res.json();
    } catch (e) {
      console.warn("未能连接到后端 /api/kb/exams，尝试从静态目录读取", e);
    }
    try {
      const staticRes = await fetch('data/default_kb/exams.json');
      if (staticRes.ok) return await staticRes.json();
    } catch (e) {
      console.warn("未能读取静态真题数据", e);
    }
    return null;
  }

  static async preScan(payload) {
    const res = await fetch(`${this.getBaseUrl()}/api/review/scan`, {
      method: 'POST',
      headers: this.getBYOKHeaders(),
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error("预检请求失败");
    return await res.json();
  }

  static async submitReview(payload) {
    try {
      const res = await fetch(`${this.getBaseUrl()}/api/review/submit`, {
        method: 'POST',
        headers: this.getBYOKHeaders(),
        body: JSON.stringify(payload)
      });
      if (res.ok) return await res.json();
      const errJson = await res.json().catch(() => ({}));
      if (res.status === 401) throw new Error(errJson.detail || "未提供有效 API Key");
      throw new Error(errJson.detail || "批改请求失败");
    } catch (e) {
      if (e.message.includes("API Key")) throw e;
      console.warn("后端算力服务未连通，启动纯前端大模型直连模式 (GitHub Pages 模式)", e);
      if (payload.api_key) {
        return await this._clientSideDirectEvaluate(payload);
      }
      throw new Error("未能连接到本地算力后端 (http://127.0.0.1:8789)。若处于 GitHub Pages 纯静态预览模式，请在【⚙️ 模型配置】输入您的 API Key 即可前端直连批改！");
    }
  }

  static async _clientSideDirectEvaluate(payload) {
    const baseUrl = (payload.base_url || 'https://api.deepseek.com/v1').replace(/\/$/, '');
    const endpoint = `${baseUrl}/chat/completions`;
    const model = payload.model_id || 'deepseek-chat';

    const systemPrompt = `你是一位拥有20年公考阅卷经验的官方申论主阅卷人。请对考生的申论作答进行客观、严厉、穿透式的四维色谱量化评审，严格以 JSON 格式输出，杜绝任何格式外说明。`;
    const userPrompt = `待评审试卷：
【题目】：${payload.question_title}（满分 ${payload.target_score} 分）
【给定资料】：
${payload.materials}

【考生实际作答】：
${payload.user_answer}

请严格按以下 JSON 格式输出：
\`\`\`json
{
  "score": 30.5,
  "grade": "一类下 (31~32分)",
  "radar_scores": {"立意与总分论点": 10.5, "结构与段落布局": 7.0, "论据与论证深度": 8.5, "语言与公文规范": 4.5},
  "quotes_evaluation": [
    {"quote": "总论点或主旨句子", "type": "main_thesis", "color": "green", "style": "solid", "label": "总论点", "comment": "立意明确"},
    {"quote": "口语化原句", "type": "colloquial_flaw", "color": "purple", "style": "strikethrough", "label": "大白话", "comment": "缺乏政务动宾大词提炼"}
  ],
  "perspectives": {
    "examiner": "考官扫描诊断：首段明确立意，各段排版尚可。",
    "structure_expert": "段落结构逻辑评价：层次清晰，论据展开较好。",
    "style_expert": "公文语言风貌评价：政务词汇密度适中，个别口水话需提升。"
  },
  "rewritten_exemplar": "基于考场规范重写的一类文高分示范段落..."
}
\`\`\``;

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
      throw new Error(`大模型接口调用失败 (${res.status}): ${err.error?.message || res.statusText}`);
    }

    const data = await res.json();
    let content = data.choices[0].message.content.trim();
    if (content.includes("```json")) {
      content = content.split("```json")[1].split("```")[0].trim();
    } else if (content.includes("```")) {
      content = content.split("```")[1].split("```")[0].trim();
    }

    const parsed = JSON.parse(content);

    const userText = payload.user_answer;
    const chromaSpans = [];
    const quotes = parsed.quotes_evaluation || [];
    quotes.forEach((q) => {
      if (!q.quote) return;
      const start = userText.indexOf(q.quote);
      if (start !== -1) {
        chromaSpans.push({
          start: start,
          end: start + q.quote.length,
          type: q.type || 'quote_original',
          color: q.color || 'green',
          style: q.style || 'solid',
          label: q.label || '采分点',
          comment: q.comment || ''
        });
      }
    });

    const colloquialFlaws = quotes.filter(q => q.type === 'colloquial_flaw');
    const drills = colloquialFlaws.map(f => ({
      drill_type: "colloquial_to_normative",
      prompt: `【考场微练习】将口语大白话“${f.quote}”改写为政务动宾大词：`,
      original_sentence: f.quote,
      flaw_text: f.quote,
      target_direction: "使用规范动宾搭配",
      reference_answer: `健全机制，强化落实`
    }));

    return {
      word_count: userText.length,
      copy_ratio: 0.05,
      copy_redline_exceeded: false,
      score: parsed.score || 30.0,
      grade: parsed.grade || "二类上",
      radar_scores: parsed.radar_scores || {"立意与总分论点": 10.0, "结构与段落布局": 7.0, "论据与论证深度": 8.0, "语言与公文规范": 4.5},
      chroma_spans: chromaSpans,
      perspectives: parsed.perspectives || {},
      memory_audit: { activation_rate: 0.6, activated_count: 1, total_recalled: 2 },
      rewritten_exemplar: parsed.rewritten_exemplar || "",
      remediation_drills: drills,
      note: "前端大模型直连批改模式 (用于 GitHub Pages 静态无后端运行)"
    };
  }

  static async verifyDrill(drillType, flawText, userInput) {
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

  static async extractCustomSkill(name, text) {
    const res = await fetch(`${this.getBaseUrl()}/api/workshop/extract-skill`, {
      method: 'POST',
      headers: this.getBYOKHeaders(),
      body: JSON.stringify({ name, text })
    });
    if (!res.ok) throw new Error("提炼 Skill 失败");
    return await res.json();
  }

  static async extractPDF(file) {
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

window.ApiClient = ApiClient;
