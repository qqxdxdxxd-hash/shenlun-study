/**
 * 前端纯静态真题分片按需加载器 (ExamsLoader)
 * 采用“轻量索引 (~30KB) + 单卷 JSON 分片懒加载 (~25KB) + IndexedDB 二级缓存”方案。
 */
class ExamsLoader {
  static get VERSION() {
    return '2.1.0';
  }

  static get clientDB() {
    if (typeof window !== 'undefined' && window.clientDB) return window.clientDB;
    if (typeof globalThis !== 'undefined' && globalThis.clientDB) return globalThis.clientDB;
    return null;
  }

  static get fallbackExams() {
    if (typeof window !== 'undefined' && window.FALLBACK_DEFAULT_EXAMS) return window.FALLBACK_DEFAULT_EXAMS;
    if (typeof globalThis !== 'undefined' && globalThis.FALLBACK_DEFAULT_EXAMS) return globalThis.FALLBACK_DEFAULT_EXAMS;
    return [];
  }

  /**
   * 加载真题轻量索引 (优先静态分片索引，次选本地 IndexedDB，保底预置常量)
   */
  static async loadIndex() {
    // 1. 尝试拉取轻量级全局索引文件 (~50KB / 200 套题)
    try {
      const res = await fetch(`data/exams/index.json?v=${this.VERSION}`);
      if (res && res.ok) {
        const indexList = await res.json();
        if (Array.isArray(indexList) && indexList.length > 0) {
          return indexList;
        }
      }
    } catch (e) {
      console.warn("[ExamsLoader] 从 data/exams/index.json 获取索引失败，降级尝试备选源:", e.message);
    }

    // 2. 降级：尝试从 IndexedDB 读取此前已缓存的真题
    try {
      const db = this.clientDB;
      if (db && typeof db.getAll === 'function') {
        const cachedExams = await db.getAll('exams');
        if (cachedExams && cachedExams.length > 0) {
          return cachedExams.map(e => ({
            id: e.id,
            exam_name: e.exam_name,
            question_type: e.question_type || 'essay',
            question_title: e.question_title,
            target_score: e.target_score || 35,
            char_count: e.materials ? e.materials.length : 0
          }));
        }
      }
    } catch (e) {
      console.warn("[ExamsLoader] 从 IndexedDB 读取真题失败:", e.message);
    }

    // 3. 降级：尝试从原始静态大集合读取
    try {
      const fallbackRes = await fetch(`data/default_kb/exams.json?v=${this.VERSION}`);
      if (fallbackRes && fallbackRes.ok) {
        const fallbackList = await fallbackRes.json();
        if (Array.isArray(fallbackList) && fallbackList.length > 0) {
          return fallbackList;
        }
      }
    } catch (e) {
      console.warn("[ExamsLoader] 从 data/default_kb/exams.json 获取备用真题失败:", e.message);
    }

    // 4. 终极断网离线保底
    return this.fallbackExams;
  }

  /**
   * 按需获取单套真题的完整详情 (材料、题干、采分底稿)
   * @param {string} examId 试卷 ID (如 "gk2026_essay")
   */
  static async getExamDetail(examId) {
    if (!examId) return null;

    const db = this.clientDB;

    // 1. 优先从浏览器本地 IndexedDB 读取 (0ms 秒开)
    try {
      if (db && typeof db.getExamById === 'function') {
        const cached = await db.getExamById(examId);
        if (cached && (cached.materials || cached.materials_text) && (cached.prompt_text || cached.questions)) {
          return cached;
        }
      }
    } catch (e) {
      console.warn(`[ExamsLoader] 从 IndexedDB 查验试卷 ${examId} 异常:`, e.message);
    }

    // 2. 本地无缓存，按需从静态分片目录加载单卷 (~25KB)
    try {
      const res = await fetch(`data/exams/${examId}.json?v=${this.VERSION}`);
      if (res && res.ok) {
        const examDetail = await res.json();
        // 成功获取后写入 IndexedDB，下次离线/断网直接秒开
        if (db && typeof db.saveExam === 'function') {
          await db.saveExam(examDetail).catch(err => {
            console.warn(`[ExamsLoader] 试卷写入 IndexedDB 失败:`, err);
          });
        }
        return examDetail;
      }
    } catch (e) {
      console.warn(`[ExamsLoader] 远程加载试卷分片 ${examId}.json 失败:`, e.message);
    }

    // 3. 兜底判定预置静态常量库
    const fallbackList = this.fallbackExams;
    if (Array.isArray(fallbackList)) {
      const fallback = fallbackList.find(e => e.id === examId);
      if (fallback) return fallback;
    }

    return null;
  }

  /**
   * 获取题本详情及其全部小题
   */
  static async getPaperDetail(paperId) {
    return await this.getExamDetail(paperId);
  }

  /**
   * 获取某题本下指定小题的详细采分底稿与题干
   */
  static async getQuestionDetail(paperId, questionId) {
    const paper = await this.getPaperDetail(paperId);
    if (!paper) return null;
    const questions = paper.questions || [];
    const q = questions.find(item => item.id === questionId) || questions[0];
    if (!q) return null;
    return {
      ...q,
      paper_id: paper.id,
      exam_name: paper.exam_name,
      materials: paper.materials_text || paper.materials || '',
      scoring_criteria: q.scoring_criteria || '',
      reference_answer: q.reference_answer || ''
    };
  }
}

if (typeof window !== 'undefined') {
  window.ExamsLoader = ExamsLoader;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { ExamsLoader };
}
