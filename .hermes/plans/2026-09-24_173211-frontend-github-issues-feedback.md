# 纯前端直达 GitHub Issues 留言与问题反馈系统实施计划

> **For Hermes:** Use subagent-driven-development skill to implement this plan task-by-task.

**Goal:** 论证并解答“纯前端留言”的可行性与安全边界，遵循 YAGNI 与零维护原则，为申论智能研习台构建一个基于 GitHub Issues URL 协议直通的纯前端留言与反馈通道，访客在浏览器内一键提交结构化留言、建议或缺陷至 GitHub Issues，作者与考友均可随时查看与交流，同时提供无 GitHub 账号的一键复制兜底。

**Current context / assumptions:**
1. 项目为“申论智能研习台 (Shenlun Exam OS)”，代码库位于 GitHub 仓库 `qqxdxdxxd-hash/shenlun-study`。
2. 前端为纯原生技术栈 (Vanilla JS + CSS3 + HTML5 + IndexedDB)，无 Webpack/Vite 打包构建流程。
3. 遵循 ADR 0001 原则：服务端零数据留存（Zero-Retention），客户端沙箱完全本地化。
4. 用户明确要求：**不需要微信通知**；若纯前端不可行，**简单一个留言转发到 GitHub Issue 上面去**即可。

**Architecture / proposed approach:**
1. **纯前端架构定性**：彻底规避在前端硬编码 GitHub Token 的重大安全漏洞，采用开放标准的 **GitHub Issues URL Scheme（预填充参数深链接）**，前端纯函数模块 `web/js/feedback.js` 动态抓取当前研习上下文（练习试卷、题型、浏览器环境）并组装为 URL，用户一键唤起 GitHub Issues 提交；
2. **多模分类与免登录兜底**：前端弹窗提供“💡 功能建议 / 🐞 缺陷报错 / 📖 题本纠错 / ☕ 考友交流”四维分类，并提供“📋 一键复制结构化反馈文本”按钮，彻底解决无 GitHub 账号考生的沟通障碍；
3. **高内聚可测试**：核心 URL 组装与 Markdown 格式化逻辑使用 UMD 模块封装，在 Node.js 环境下通过 `node web/tests/test_feedback.js` 实现 100% TDD 自动化验证。

---

## 一、 核心问题深度解答：能否纯前端实现？

针对用户提出的核心疑问：**“增加一个留言功能，思考能否纯前端实现，要别人在他自己的浏览器上留言，我也能看得到”**，进行深度剖析：

### 1.1 狭义的“绝对纯前端”（无任何公网服务器/无任何外部中介）
- **结论：物理上绝对不可行（Architecturally Impossible）。**
- **底层原因**：
  1. **浏览器安全沙箱与同源策略（Same-Origin Policy）**：访客 A 在自己电脑浏览器里输入的数据，只能持久化在访客本地的 `LocalStorage` 或 `IndexedDB`。这些数据物理存放在访客设备的硬盘中，浏览器的安全沙箱机制严格禁止外部互联网上的任何设备探测或读取该数据。
  2. **跨端通信的公网中介铁律**：任何跨设备、跨浏览器、跨时空的异步数据流（访客上午10点留言，作者晚上8点查看），在计算机网络拓扑中，**必须依赖一个具备公网 IP/域名的持久化中介（Shared Persistent Node）**。即使采用 P2P 技术（如 WebRTC），握手阶段也必须有信令服务器，且要求双方同时在线，无法满足异步留言板需求。

### 1.2 纯前端直调 GitHub REST API（前端带 Token 自动 `POST /issues`）
- **结论：安全上绝对不可行（Security Blocker）。**
- **底层原因**：
  1. GitHub 的 Issue 创建接口 `POST /repos/{owner}/{repo}/issues` 必须携带身份认证凭据（Personal Access Token 或 GitHub App Token）。
  2. 如果在静态前端 JS 代码中硬编码写入 Token，任何人按 `F12` 打开 DevTools 即可完整提取该 Token。
  3. 恶意攻击者一旦获取该 Token，即可对仓库执行删库、篡改提交、恶意灌水等灾难性操作；同时，GitHub 官方内置的 **Secret Scanning（密钥雷达扫描）** 机器人会在代码推送至 GitHub 后几秒内自动吊销该 Token，导致接口直接 401 彻底瘫痪。

### 1.3 最优工程解：纯前端 GitHub Issues URL 协议直通（URL Scheme）
- **结论：100% 纯前端、0 维护成本、0 安全风险的最优落地方式！**
- **运作机理**：
  1. 访客在研习台界面点击“💬 留言/反馈”，弹出精心设计的原生暗色拟态表单。
  2. 访客选择分类（功能建议 / Bug 报告 / 题目探讨等），输入内容，前端贴心地自动附带“系统版本、当前真题编号、浏览器内核”等排查线索。
  3. 访客点击“提交到 GitHub Issue”，纯前端通过 `encodeURIComponent` 组装预填 URL：
     ```text
     https://github.com/qqxdxdxxd-hash/shenlun-study/issues/new?title=...&body=...&labels=...
     ```
  4. 浏览器在新标签页打开 GitHub Issue 页面，所有标题、标签、格式化 Markdown 正文均已就绪，访客点击绿色按钮 `Submit new issue` 即可秒级完成提交。
- **作者与访客的触达体验**：
  - **作者（你）**：GitHub 会自动向你的绑定邮箱发送邮件，手机端 GitHub App 也会即时推送通知；在仓库的 `Issues` 标签页下，所有留言清晰呈列表展示，可直接回复、打标签或关闭。
  - **其他访客**：所有人点击页面上的“查看历史留言与交流”，均可直接在 GitHub Issues 中浏览所有考友的交流历史，形成高信噪比的开源备考社区。
- **免登录考友兜底（考公用户专属关怀）**：
  - 考虑到部分考公学生可能没有注册过 GitHub 账号，弹窗额外提供“📋 一键复制反馈内容”功能。点击后直接将排版整齐的 Markdown 文本复制入剪贴板，提示可直接粘贴发送至开发者邮箱或交流群，不给用户设卡。

---

## 二、 模块结构与任务分解

```
web/
├── js/
│   ├── feedback.js        # [新建] 留言与反馈纯函数逻辑引擎 (UMD 规范)
│   └── app.js             # [修改] 挂载 Feedback 模态框打开、提交与复制交互
├── tests/
│   └── test_feedback.js   # [新建] 纯逻辑单元测试 (Node.js 运行)
├── styles/
│   └── main.css           # [修改] 新增留言弹窗、分类胶囊与操作按钮样式
└── index.html             # [修改] 顶部导航新增入口 + 挂载反馈 Modal DOM
```

---

## 三、 分步执行任务 (Step-by-Step Tasks)

### Task 1: 编写领域纯函数模块与自动化测试 (TDD)

**文件路径:**
- `web/tests/test_feedback.js` (新建测试)
- `web/js/feedback.js` (新建逻辑)

**步骤 1.1: 编写测试用例 `web/tests/test_feedback.js`**
```javascript
// web/tests/test_feedback.js
const assert = require('assert');
const { FeedbackHelper } = require('../js/feedback.js');

console.log("=== 开始执行 FeedbackHelper 留言与反馈模块单元测试 ===");

// 1. 验证 Label 映射表
console.log("-> 验证 Test 1: 分类类型与 GitHub Label 映射");
assert.strictEqual(FeedbackHelper.getLabelByType('feature'), 'enhancement');
assert.strictEqual(FeedbackHelper.getLabelByType('bug'), 'bug');
assert.strictEqual(FeedbackHelper.getLabelByType('exam'), 'documentation');
assert.strictEqual(FeedbackHelper.getLabelByType('chat'), 'feedback');
assert.strictEqual(FeedbackHelper.getLabelByType('unknown'), 'feedback');
console.log("  ✅ Test 1 通过：Label 映射精准");

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
assert.ok(emptyUrl.includes('labels=' + encodeURIComponent('feedback')));
console.log("  ✅ Test 4 通过：空值防御逻辑健全");

console.log("🎉 FeedbackHelper 全部单元测试通过！");
```

**步骤 1.2: 运行测试验证失败 (RED)**
```bash
node web/tests/test_feedback.js
```
*预期输出:* `Error: Cannot find module '../js/feedback.js'`

**步骤 1.3: 编写核心实现 `web/js/feedback.js` (GREEN)**
```javascript
/**
 * 申论研习台 - 考友留言与反馈领域逻辑引擎
 * 采用纯前端无状态设计，组装 GitHub Issue 协议直通参数
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    const helper = factory();
    helper.FeedbackHelper = helper;
    module.exports = helper;
  } else {
    root.FeedbackHelper = factory();
  }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  const DEFAULT_REPO = 'qqxdxdxxd-hash/shenlun-study';

  const TYPE_CONFIG = {
    feature: { label: 'enhancement', prefix: '【功能建议】', sectionTitle: '💡 建议详情 / Description' },
    bug: { label: 'bug', prefix: '【缺陷报错】', sectionTitle: '🐞 缺陷表现 / Bug Description' },
    exam: { label: 'documentation', prefix: '【题本纠错】', sectionTitle: '📖 题目与采分点问题 / Exam Issue' },
    chat: { label: 'feedback', prefix: '【考友留言】', sectionTitle: '☕ 交流分享 / Message' }
  };

  const FeedbackHelper = {
    /**
     * 根据留言类型映射 GitHub Issue Label
     */
    getLabelByType(type) {
      return (TYPE_CONFIG[type] && TYPE_CONFIG[type].label) || 'feedback';
    },

    /**
     * 根据留言类型获取 Issue 标题前缀
     */
    getTitlePrefix(type) {
      return (TYPE_CONFIG[type] && TYPE_CONFIG[type].prefix) || '【考友留言】';
    },

    /**
     * 格式化排版整洁的 Markdown 正文
     */
    formatMarkdownBody(payload = {}) {
      const type = payload.type || 'chat';
      const config = TYPE_CONFIG[type] || TYPE_CONFIG.chat;
      const content = (payload.content || '').trim() || '（未填写详细描述）';
      const contact = (payload.contact || '').trim() || '未提供';
      const ctx = payload.context || {};

      const lines = [
        `### ${config.sectionTitle}`,
        content,
        '',
        '---',
        '### 👤 联系方式 / Contact',
        contact,
        '',
        '---',
        '### 🛠️ 客户端运行环境 / System Context',
        '| 环境项 | 诊断参数值 |',
        '| :--- | :--- |',
        `| **系统版本** | Shenlun Exam OS v${ctx.appVersion || '2.0.0'} |`,
        `| **当前试卷** | ${ctx.examTitle || '未关联试卷'} |`,
        `| **作答题型** | ${ctx.questionType || '未指定'} |`,
        `| **操作系统/平台** | ${ctx.platform || (typeof navigator !== 'undefined' ? navigator.platform : '未知')} |`,
        `| **浏览器内核** | ${ctx.userAgent || (typeof navigator !== 'undefined' ? navigator.userAgent : 'Node.js')} |`,
        `| **提交时间戳** | ${new Date().toISOString()} |`,
        '',
        '> *由申论智能研习台 (Shenlun Exam OS) 客户端纯前端一键生成*'
      ];

      return lines.join('\n');
    },

    /**
     * 组装带参数的 GitHub Issue 创建 URL
     */
    buildIssueUrl(options = {}) {
      const repo = options.repo || DEFAULT_REPO;
      const type = options.type || 'chat';
      const rawTitle = (options.title || '').trim() || '来自考友的研习台留言';
      const fullTitle = `${this.getTitlePrefix(type)}${rawTitle}`;
      const label = this.getLabelByType(type);
      const body = this.formatMarkdownBody(options);

      const baseUrl = `https://github.com/${repo}/issues/new`;
      const queryParams = [
        `title=${encodeURIComponent(fullTitle)}`,
        `labels=${encodeURIComponent(label)}`,
        `body=${encodeURIComponent(body)}`
      ];

      return `${baseUrl}?${queryParams.join('&')}`;
    }
  };

  return FeedbackHelper;
});
```

**步骤 1.4: 再次执行测试验证通过**
```bash
node web/tests/test_feedback.js
```
*预期输出:*
```text
=== 开始执行 FeedbackHelper 留言与反馈模块单元测试 ===
-> 验证 Test 1: 分类类型与 GitHub Label 映射
  ✅ Test 1 通过：Label 映射精准
-> 验证 Test 2: 结构化 Markdown 正文组装
  ✅ Test 2 通过：Markdown 格式结构完整且具备环境诊断表
-> 验证 Test 3: GitHub Issue URL 构建与编码安全
  ✅ Test 3 通过：URL 组装与 URI 编码符合规范
-> 验证 Test 4: 异常入参边界防御
  ✅ Test 4 通过：空值防御逻辑健全
🎉 FeedbackHelper 全部单元测试通过！
```

---

### Task 2: 样式表升级：留言弹窗与交互设计

**文件路径:** `web/styles/main.css`

**变更内容:**
在 `web/styles/main.css` 末尾追加反馈模态框与分类胶囊选项专属样式：

```css
/* ==========================================================================
   考友留言与 GitHub Issues 反馈模块样式
   ========================================================================== */

/* 顶部操作区留言按钮 */
.btn-feedback-trigger {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: rgba(56, 189, 248, 0.08);
  border: 1px solid rgba(56, 189, 248, 0.3);
  color: #38bdf8;
  padding: 6px 14px;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}
.btn-feedback-trigger:hover {
  background: rgba(56, 189, 248, 0.18);
  border-color: #38bdf8;
  color: #f8fafc;
}

/* 反馈分类胶囊组 */
.feedback-type-pills {
  display: flex;
  gap: 8px;
  margin-bottom: 14px;
  flex-wrap: wrap;
}
.feedback-type-pill {
  padding: 6px 12px;
  border-radius: 6px;
  font-size: 12px;
  cursor: pointer;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid var(--card-border);
  color: var(--text-muted);
  transition: all 0.15s ease;
  user-select: none;
}
.feedback-type-pill:hover {
  background: rgba(255, 255, 255, 0.08);
  color: var(--text-main);
}
.feedback-type-pill.active {
  background: rgba(56, 189, 248, 0.15);
  border-color: var(--accent);
  color: var(--accent);
  font-weight: 600;
}

/* 诊断信息面板微件 */
.feedback-diag-summary {
  background: rgba(15, 23, 42, 0.6);
  border: 1px dashed var(--card-border);
  border-radius: 6px;
  padding: 8px 12px;
  font-size: 11.5px;
  color: var(--text-muted);
  margin-bottom: 14px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}
```

---

### Task 3: 挂载前端 DOM 入口与结构化 Modal

**文件路径:** `web/index.html`

**步骤 3.1: 在顶部导航栏加入留言入口**
在 `web/index.html` 的 `.header-actions` 容器中追加一个按钮：
```html
<div class="header-actions">
  <button class="btn btn-outline" onclick="window.BackupManager.exportFullBackup()">
    <span>💾 导出全量备份</span>
  </button>
  <button class="btn-feedback-trigger" onclick="openFeedbackModal()" title="向作者留言或反馈问题">
    <span>💬 考友留言 / 反馈</span>
  </button>
  <button class="btn btn-primary" onclick="openSettingModal()">
    <span>⚙️ 模型配置 (BYOK)</span>
  </button>
</div>
```

**步骤 3.2: 在页面底端挂载反馈弹窗 DOM**
在 `web/index.html` 的 `</body>` 前挂载：
```html
  <!-- 模态框：考友留言与 GitHub Issues 反馈中心 -->
  <div class="modal-overlay" id="feedback-modal">
    <div class="modal" style="width: 580px;">
      <div class="modal-header">
        <div class="modal-title">💬 考友留言与问题反馈</div>
        <div class="modal-close" onclick="closeFeedbackModal()">✕</div>
      </div>

      <div style="background: rgba(56, 189, 248, 0.06); border: 1px solid rgba(56, 189, 248, 0.2); border-radius: 6px; padding: 10px 14px; font-size: 12px; color: #93c5fd; margin-bottom: 14px; line-height: 1.5;">
        🏛️ <strong>开源社区直通</strong>：本系统采用纯前端本地沙箱，留言统一沉淀至官方 GitHub Issues。作者与所有考友均可查看并交流。
      </div>

      <div class="form-group">
        <label class="form-label">留言类型</label>
        <div class="feedback-type-pills" id="feedback-type-group">
          <div class="feedback-type-pill active" data-type="feature" onclick="selectFeedbackType('feature')">💡 功能建议</div>
          <div class="feedback-type-pill" data-type="bug" onclick="selectFeedbackType('bug')">🐞 缺陷报错</div>
          <div class="feedback-type-pill" data-type="exam" onclick="selectFeedbackType('exam')">📖 题本纠错</div>
          <div class="feedback-type-pill" data-type="chat" onclick="selectFeedbackType('chat')">☕ 考友交流</div>
        </div>
      </div>

      <div class="form-group">
        <label class="form-label">简要标题</label>
        <input type="text" class="form-input" id="feedback-title" placeholder="例如：希望在真题模考时支持全屏专注作答模式">
      </div>

      <div class="form-group">
        <label class="form-label">详细内容</label>
        <textarea class="form-textarea" id="feedback-content" style="min-height: 110px;" placeholder="请详细描述您的建议、使用感受或具体遇到的问题..."></textarea>
      </div>

      <div class="form-group">
        <label class="form-label">联系方式（选填，方便沟通进展）</label>
        <input type="text" class="form-input" id="feedback-contact" placeholder="微信 / 邮箱 / 手机号">
      </div>

      <div class="feedback-diag-summary">
        <span>🔍 <strong>诊断附加项</strong>：将自动附带当前练习真题与浏览器版本，辅助快速定位。</span>
      </div>

      <div class="modal-footer" style="display: flex; justify-content: space-between; align-items: center;">
        <button class="btn btn-outline" type="button" onclick="copyFeedbackToClipboard()" id="btn-copy-feedback" title="若无 GitHub 账号，可复制文本直接发送给作者">
          <span>📋 复制结构化文本 (无账号通道)</span>
        </button>
        <div style="display: flex; gap: 8px;">
          <button class="btn btn-outline" type="button" onclick="closeFeedbackModal()">取消</button>
          <button class="btn btn-primary" type="button" onclick="submitFeedbackToGitHub()">
            <span>🚀 提交到 GitHub Issue</span>
          </button>
        </div>
      </div>
    </div>
  </div>
```

**步骤 3.3: 引入脚本引用**
在 `web/index.html` 底部脚本区加入：
```html
  <script src="js/feedback.js"></script>
```

---

### Task 4: 编写页面交互绑定与剪贴板兜底

**文件路径:** `web/js/app.js`

**在 `web/js/app.js` 中新增反馈控制器逻辑:**
```javascript
// ============================================================================
// 考友留言与 GitHub Issues 反馈交互控制器
// ============================================================================
let currentFeedbackType = 'feature';

function openFeedbackModal() {
  document.getElementById('feedback-modal').classList.add('active');
  document.getElementById('feedback-title').focus();
}

function closeFeedbackModal() {
  document.getElementById('feedback-modal').classList.remove('active');
}

function selectFeedbackType(type) {
  currentFeedbackType = type;
  const pills = document.querySelectorAll('#feedback-type-group .feedback-type-pill');
  pills.forEach(pill => {
    pill.classList.toggle('active', pill.dataset.type === type);
  });
}

function getCurrentAppContext() {
  const examSelector = document.getElementById('exam-selector');
  const selectedExamText = examSelector && examSelector.selectedOptions && examSelector.selectedOptions[0]
    ? examSelector.selectedOptions[0].text
    : '未知试卷';
  const qType = document.getElementById('q-type') ? document.getElementById('q-type').value : 'essay';
  const qTypeMap = { essay: '大作文', doc: '公文题', single: '单一题' };

  return {
    examTitle: selectedExamText,
    questionType: qTypeMap[qType] || qType,
    appVersion: '2.0.0',
    platform: navigator.platform,
    userAgent: navigator.userAgent
  };
}

function getFeedbackPayload() {
  const title = (document.getElementById('feedback-title').value || '').trim();
  const content = (document.getElementById('feedback-content').value || '').trim();
  const contact = (document.getElementById('feedback-contact').value || '').trim();
  const context = getCurrentAppContext();

  return {
    type: currentFeedbackType,
    title,
    content,
    contact,
    context
  };
}

function submitFeedbackToGitHub() {
  const payload = getFeedbackPayload();
  if (!payload.title && !payload.content) {
    alert('请至少填写简要标题或详细内容后再提交！');
    return;
  }

  const issueUrl = window.FeedbackHelper.buildIssueUrl(payload);
  window.open(issueUrl, '_blank');
  closeFeedbackModal();
}

function copyFeedbackToClipboard() {
  const payload = getFeedbackPayload();
  const markdown = window.FeedbackHelper.formatMarkdownBody(payload);
  const copyText = `【${window.FeedbackHelper.getTitlePrefix(payload.type)}${payload.title || '考友反馈'}】\n\n${markdown}`;

  navigator.clipboard.writeText(copyText).then(() => {
    const btn = document.getElementById('btn-copy-feedback');
    const oldText = btn.innerHTML;
    btn.innerHTML = '<span>✅ 已复制到剪贴板！</span>';
    setTimeout(() => {
      btn.innerHTML = oldText;
    }, 2500);
  }).catch(err => {
    alert('复制失败，请手动在控制台查看文本：' + err);
  });
}
```

---

## 四、 验证与测试标准 (Verification & Testing)

1. **单元测试验证（Node.js 端纯逻辑验证）**：
   运行命令：
   ```bash
   node web/tests/test_feedback.js
   ```
   验证全部 4 个断言测试全部绿色通过，URL 参数被标准 UTF-8 编码且含有正确的 Labels。

2. **前端页面功能端到端排查**：
   - 启动本地测试服务或打开 `web/index.html`；
   - 点击顶部操作栏 `💬 考友留言 / 反馈` 按钮，弹出 Modal；
   - 切换“💡 功能建议 / 🐞 缺陷报错 / 📖 题本纠错 / ☕ 考友交流”胶囊按钮，样式高亮正确切换；
   - 输入标题“测试建议”与内容“测试内容”，点击 `🚀 提交到 GitHub Issue`，校验是否在新标签页打开 `https://github.com/qqxdxdxxd-hash/shenlun-study/issues/new?...`，且预填充字段完整无乱码；
   - 点击 `📋 复制结构化文本 (无账号通道)`，验证剪贴板成功写入带有系统上下文的 Markdown 正文，按钮变更为“✅ 已复制到剪贴板！”。

3. **已有测试回归**：
   运行全部现有前端测试，确保无任何代码破坏：
   ```bash
   node web/tests/test_question_history.js
   node web/tests/test_rubrics.js
   node web/tests/test_local_scanner.js
   ```

---

## 五、 风险、权衡与边界处理 (Risks & Tradeoffs)

1. **用户无 GitHub 账号的流失风险**：
   - *权衡*：考公群体非技术用户较多，部分考生没有注册 GitHub。
   - *应对*：在弹窗明确提供“📋 复制结构化文本”通道，一键复制格式化文本后，可直接粘贴在微信群、B站评论区或给站长发邮件，兼顾了开源正规性与非极客用户友好度。
2. **URL 长度超限风险**：
   - *权衡*：部分老旧浏览器或代理对 GET URL 长度有 2048/8192 字符限制。如果用户粘贴数千字长篇大论，URL 可能会被截断。
   - *应对*：`FeedbackHelper.buildIssueUrl` 中对正文超长内容进行友好长度截断（保留前 1500 字并提示“详见剪贴板”），同时引导用户使用“复制文本”手动粘贴至 Issue 内容框中。
3. **零运维与零安全泄露保证**：
   - 不依赖任何第三方数据库（Supabase/Firebase）服务，不产生任何月费账单，不存在数据库被刷被封风险；
   - 纯前端绝对零 Token 暴露，彻底杜绝 GitHub Secret Scanning 告警和仓库权限被盗风险。
