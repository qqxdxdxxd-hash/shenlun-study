const assert = require('assert');
const { ExamsLoader } = require('../js/exams_loader.js');

console.log("=== 开始执行 ExamsLoader 单元测试 ===");

// 模拟全局环境
const mockDBStore = {};
global.clientDB = {
  async getExamById(id) {
    return mockDBStore[id] || null;
  },
  async saveExam(exam) {
    mockDBStore[exam.id] = exam;
    return exam;
  },
  async getAll(store) {
    return Object.values(mockDBStore);
  }
};

global.FALLBACK_DEFAULT_EXAMS = [
  { id: "fallback_1", exam_name: "保底试卷1", materials: "保底材料", prompt_text: "保底题干", target_score: 35 }
];

// 1. 测试从 Mock fetch 获取 index
global.fetch = async (url) => {
  if (url.includes("data/exams/index.json")) {
    return {
      ok: true,
      json: async () => [
        { id: "exam_001", exam_name: "2026国考", question_type: "essay", question_title: "绿色发展", target_score: 35 },
        { id: "exam_002", exam_name: "2025省考", question_type: "single", question_title: "基层减负", target_score: 20 }
      ]
    };
  }
  if (url.includes("data/exams/exam_001.json")) {
    return {
      ok: true,
      json: async () => ({
        id: "exam_001",
        exam_name: "2026国考",
        prompt_text: "大鹏之动...",
        prompt_reqs: "1000字",
        materials: "这是2026国考完整材料...",
        target_score: 35
      })
    };
  }
  return { ok: false, status: 404 };
};

(async () => {
  // 测试 loadIndex
  const index = await ExamsLoader.loadIndex();
  assert.strictEqual(index.length, 2);
  assert.strictEqual(index[0].id, "exam_001");
  console.log("✓ loadIndex 从静态分片索引加载成功");

  // 测试 getExamDetail 首次从远程 fetch 并写入 clientDB 缓存
  const detail = await ExamsLoader.getExamDetail("exam_001");
  assert.strictEqual(detail.id, "exam_001");
  assert(detail.materials.includes("完整材料"));
  assert.strictEqual(mockDBStore["exam_001"].id, "exam_001");
  console.log("✓ getExamDetail 分片拉取并写入 IndexedDB 缓存成功");

  // 测试第二次直接命中 clientDB 本地缓存 (断开 fetch)
  global.fetch = async () => { throw new Error("Network offline"); };
  const cachedDetail = await ExamsLoader.getExamDetail("exam_001");
  assert.strictEqual(cachedDetail.id, "exam_001");
  assert(cachedDetail.materials.includes("完整材料"));
  console.log("✓ getExamDetail 断网时命中 IndexedDB 本地缓存成功");

  // 测试兜底回退 FALLBACK_DEFAULT_EXAMS
  const fallback = await ExamsLoader.getExamDetail("fallback_1");
  assert.strictEqual(fallback.id, "fallback_1");
  assert.strictEqual(fallback.materials, "保底材料");
  console.log("✓ getExamDetail 终极离线兜底常量生效");

  console.log("🎉 ExamsLoader 测试全部通过！");
})();
