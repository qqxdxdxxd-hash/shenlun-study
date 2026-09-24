// web/tests/test_feedback.js
const assert = require('assert');
const { FeedbackHelper } = require('../js/feedback.js');

console.log("=== 开始执行 FeedbackHelper 留言与反馈模块单元测试 ===");

// 1. 验证 Label 映射表（仅保留 功能建议 和 缺陷报错 两个类型）
console.log("-> 验证 Test 1: 分类类型与 GitHub Label 映射");
assert.strictEqual(FeedbackHelper.getLabelByType('feature'), 'enhancement');
assert.strictEqual(FeedbackHelper.getLabelByType('bug'), 'bug');
assert.strictEqual(FeedbackHelper.getLabelByType('unknown'), 'enhancement'); // 兜底为 feature
console.log("  ✅ Test 1 通过：仅支持 feature 与 bug 两大核心类型，Label 映射精准");

// 2. 验证 Markdown 正文格式化 (含上下文诊断信息)
console.log("-> 验证 Test 2: 结构化 Markdown 正文组装");
const mockPayload = {
  type: 'feature',
  title: '希望增加真题打印功能',
  content: '建议提供 PDF 导出可以直接打印方格纸。',
  contact: 'test@example.com',
  context: {
    examTitle: '2024年国考副省级',
    questionType: '大作文',
    appVersion: '2.0.0',
    platform: 'Win32'
  }
};
const markdown = FeedbackHelper.formatMarkdownBody(mockPayload);
assert.ok(markdown.includes('### 💡 建议详情 / Description'));
assert.ok(markdown.includes('建议提供 PDF 导出可以直接打印方格纸。'));
assert.ok(markdown.includes('test@example.com'));
assert.ok(markdown.includes('2024年国考副省级'));
assert.ok(markdown.includes('大作文'));
assert.ok(markdown.includes('Win32'));
console.log("  ✅ Test 2 通过：Markdown 格式结构完整且具备环境诊断表");

// 3. 验证 GitHub Issues URL 构建
console.log("-> 验证 Test 3: GitHub Issue URL 构建与编码安全");
const targetUrl = FeedbackHelper.buildIssueUrl({
  repo: 'qqxdxdxxd-hash/shenlun-study',
  type: 'bug',
  title: '批改色谱在换行符处偏移',
  content: '当输入作答包含连续换行时，高亮跨距出现漂移。',
  contact: '',
  context: {
    examTitle: '自定义题目',
    questionType: '单一题'
  }
});

assert.ok(targetUrl.startsWith('https://github.com/qqxdxdxxd-hash/shenlun-study/issues/new'));
assert.ok(targetUrl.includes('title=' + encodeURIComponent('【缺陷报错】批改色谱在换行符处偏移')));
assert.ok(targetUrl.includes('labels=' + encodeURIComponent('bug')));
assert.ok(targetUrl.includes('body='));
console.log("  ✅ Test 3 通过：URL 组装与 URI 编码符合规范");

// 4. 验证防空与默认参数边界
console.log("-> 验证 Test 4: 异常入参边界防御");
const emptyUrl = FeedbackHelper.buildIssueUrl({});
assert.ok(emptyUrl.includes('https://github.com/qqxdxdxxd-hash/shenlun-study/issues/new'));
assert.ok(emptyUrl.includes('labels=' + encodeURIComponent('enhancement')));
console.log("  ✅ Test 4 通过：空值防御逻辑健全");

console.log("🎉 FeedbackHelper 全部单元测试通过！");
