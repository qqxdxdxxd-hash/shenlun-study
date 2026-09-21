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
      console.warn("未能连接到本地后端，使用本地兜底真题", e);
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
    const res = await fetch(`${this.getBaseUrl()}/api/review/submit`, {
      method: 'POST',
      headers: this.getBYOKHeaders(),
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error("批改请求失败，请检查网络或后端状态");
    return await res.json();
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
}

window.ApiClient = ApiClient;
