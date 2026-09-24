# GitHub Issues 极简留言与反馈通道实施计划

> **For Hermes:** Use subagent-driven-development skill to implement this plan task-by-task.

**Goal:** 遵循最简无维护（YAGNI/零外部依赖）原则，为申论智能研习台构建一个基于 GitHub Issues 的极简跨端留言与问题反馈通道，让考友在浏览器上一键直达 GitHub 提交结构化留言、建议或 Bug，作者与所有访客均可公开查看和交流。

**Architecture:** 彻底摒弃第三方 BaaS 数据库、微信 Webhook 等额外配置，基于系统已有的开源 GitHub 仓库（`qqxdxdxxd-hash/shenlun-study`），在前端构建轻量纯函数工具 `web/js/feedback.js` 动态组装预填充模版的 GitHub Issue URL（含自动采集的浏览器环境与试卷上下文）；并在 `web/index.html` 顶部操作栏新增 `💬 考友留言 / 提 Issue` 入口与结构化引导弹窗。

**Tech Stack:** Vanilla JavaScript (ES6+), GitHub Issues URL API (`/issues/new`), CSS3 (Design Tokens), Node.js (纯函数单元测试).

---

## 一、 方案重新思考与极简主义论证 (Why GitHub Issues is the Best Fit)

针对用户明确指出的需求：“**我不需要什么微信通知。如果不行的话，最简单的给我搞一个跳转到 github issue 提交问题的 link 口，告诉用户**”，本节进行重新思考与技术定性：

### 1.1 为什么放弃 BaaS / 微信通知方案？
1. **违背 YAGNI (You Aren't Gonna Need It)**：
   BaaS（如 Supabase）需要站长去第三方平台注册账号、建表、配置 RLS 权限，微信通知还需要配置 PushPlus Token。一旦密钥过期或配置错误，就会增加运维负担。
2. **免除垃圾信息审核风险**：
   公网匿名留言极易招致网络爬虫批量灌水或违规广告，而 GitHub 原生自带严密的风控、验证码与垃圾账号封禁机制。

### 1.2 为什么 GitHub Issues 是最极简且最优雅的解法？
1. **0 服务端代码、0 数据库、0 成本**：
   完全依托当前项目的开源仓库 `https://github.com/qqxdxdxxd-hash/shenlun-study`。
2. **作者天然能看到并收到通知**：
   作为 GitHub 仓库的所有者，任何访客在 Issues 提交留言，你的 GitHub 绑定邮箱和手机 GitHub App **会自动触发原生通知**，无需编写一行推送代码。
3. **访客之间公开透明互看**：
   所有考友提交的留言、讨论、新题型需求，所有人点击 `https://github.com/qqxdxdxxd-hash/shenlun-study/issues` 均可完整查阅并跟帖，具备天然的社区沉淀效应。
4. **全环境 100% 兼容**：
   无论系统是部署在 GitHub Pages 纯静态托管、Docker 容器、云服务器还是考友本地 `start.bat` 单机运行，跳转 GitHub Issue 均 100% 可用。

---

## 二、 交互流程与架构设计

### 2.1 用户操作流向图

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                        考友点击留言与 GitHub Issue 流向                                │
│                                                                                        │
│  [考友在研习台任意页面]                                                                │
│         │                                                                              │
│         ▼ 点击顶部栏 【💬 考友留言 / 提 Issue】                                        │
│  ┌───────────────────────────────────────────────────────────────────────────┐         │
│  │ 弹窗：💬 考友留言与问题反馈引导 (Feedback Modal)                          │         │
│  │                                                                           │         │
│  │  - 明确文案告知：“申论智能研习台为开源项目，所有留言统一在 GitHub 交流”    │         │
│  │  - 智能四通道：                                                          │         │
│  │    [💡 功能建议 / 留言]  -> 预填充【功能建议】模版，打 enhancement 标签   │         │
│  │    [🐛 作答/批改 Bug]    -> 预填充【Bug反馈】模版，自动附带环境/题型信息  │         │
│  │    [🎯 采分探讨 / 切磋]  -> 预填充【真题探讨】模版，打 discussion 标签   │         │
│  │    [📜 查看考友留言墙]   -> 直达全部历史 Issues 列表                      │         │
│  └───────────────────────────────────────────────────────────────────────────┘         │
│         │ 用户选择任一通道点击                                                         │
│         ▼                                                                              │
│  [在新标签页直接调起 GitHub 提交页面]                                                  │
│  URL: https://github.com/qqxdxdxxd-hash/shenlun-study/issues/new?title=...&body=...    │
│         │                                                                              │
│         ▼ 用户点击 "Submit new issue"                                                  │
│  [GitHub 官方数据库持久化] ──(自动触发)──> [作者邮箱 / 手机 GitHub App 实时收到新消息]  │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

### 2.2 涉及文件变更清单

```
web/
├── index.html                   # 修改：顶部操作栏追加按钮；底部追加 feedback-modal 弹窗结构；引入 feedback.js
├── styles/main.css              # 修改：追加反馈通道网格卡片样式（暗色磨砂玻璃微拟物风格）
├── js/
│   ├── feedback.js              # 新增：纯函数工具类（Issue URL 装配、模版管理、环境信息自采集）
│   └── app.js                   # 修改：挂载 openFeedbackModal() 与 closeFeedbackModal()
└── tests/
    └── test_feedback.js         # 新增：Issue URL 生成、URL 编码、参数契约的自动化单元测试
```

---

## 三、 分步骤任务清单 (Bite-sized TDD Tasks)

### Task 1: 编写 GitHub Issue 构造引擎单元测试 (TDD Red)

**Objective:** 为 `FeedbackHelper` 编写纯函数单元测试，覆盖各类 Issue（功能建议、Bug 反馈、采分探讨、列表直达）的 URL 生成、参数转义与环境上下文组装。

**Files:**
- Create: `web/tests/test_feedback.js`

**Step 1: 编写完整测试代码**

```javascript
// web/tests/test_feedback.js
const assert = require('assert');

// 引用待实现的模块
let FeedbackHelper;
try {
  FeedbackHelper = require('../js/feedback.js');
} catch (e) {
  // 占位
}

function runTests() {
  console.log('=== 开始执行 GitHub Issue 反馈通道核心单元测试 ===');

  // Test 1: 基础仓库与 Issues 列表 URL
  console.log('-> 验证 Test 1: 默认仓库配置与全量列表链接');
  assert.strictEqual(FeedbackHelper.REPO_URL, 'https://github.com/qqxdxdxxd-hash/shenlun-study');
  const issuesUrl = FeedbackHelper.getIssuesListUrl();
  assert.strictEqual(issuesUrl, 'https://github.com/qqxdxdxxd-hash/shenlun-study/issues');
  console.log('  ✅ Test 1 通过：基础仓库与 Issues URL 正确');

  // Test 2: 生成功能建议 (Feature Request) Issue 链接
  console.log('-> 验证 Test 2: 功能建议 URL 与标签装配');
  const featureUrl = FeedbackHelper.buildIssueUrl('feature');
  assert.ok(featureUrl.startsWith('https://github.com/qqxdxdxxd-hash/shenlun-study/issues/new'));
  assert.ok(featureUrl.includes('labels=enhancement'), '必须包含 enhancement 标签');
  assert.ok(decodeURIComponent(featureUrl).includes('【功能建议/留言】'), '标题必须包含建议标识');
  assert.ok(decodeURIComponent(featureUrl).includes('建议描述'), '正文必须包含建议引导模版');
  console.log('  ✅ Test 2 通过：功能建议 URL 构建精准');

  // Test 3: 生成 Bug 反馈 Issue 链接 (带环境上下文)
  console.log('-> 验证 Test 3: Bug 反馈 URL 与环境信息自动注入');
  const mockContext = {
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
    qType: 'single',
    examTitle: '2024年国考副省级'
  };
  const bugUrl = FeedbackHelper.buildIssueUrl('bug', mockContext);
  assert.ok(bugUrl.includes('labels=bug'), '必须包含 bug 标签');
  const decodedBug = decodeURIComponent(bugUrl);
  assert.ok(decodedBug.includes('【Bug反馈】'), '标题必须包含 Bug 标识');
  assert.ok(decodedBug.includes('Mozilla/5.0'), '正文必须自动携带系统环境');
  assert.ok(decodedBug.includes('2024年国考副省级'), '正文必须自动携带关联试卷');
  console.log('  ✅ Test 3 通过：Bug 反馈与环境上下文成功注入');

  // Test 4: 生成采分探讨 (Discussion) 链接
  console.log('-> 验证 Test 4: 采分探讨 Issue URL');
  const rubricUrl = FeedbackHelper.buildIssueUrl('rubric');
  assert.ok(rubricUrl.includes('labels=discussion'), '必须包含 discussion 标签');
  assert.ok(decodeURIComponent(rubricUrl).includes('【真题采分探讨】'), '标题必须包含探讨标识');
  console.log('  ✅ Test 4 通过：采分探讨 URL 构建正确');

  // Test 5: 非法类别安全降级
  console.log('-> 验证 Test 5: 未知类别优雅降级为基础新建链接');
  const fallbackUrl = FeedbackHelper.buildIssueUrl('unknown_type');
  assert.strictEqual(fallbackUrl, 'https://github.com/qqxdxdxxd-hash/shenlun-study/issues/new');
  console.log('  ✅ Test 5 通过：非法类型降级稳健');

  console.log('🎉 GitHub Issue 反馈通道核心单元测试全部通过！');
}

runTests();
```

**Step 2: 运行测试验证失败 (TDD Red)**

Run: `node web/tests/test_feedback.js`  
Expected Output: `TypeError: Cannot read properties of undefined` 或 `FeedbackHelper is not defined`

---

### Task 2: 实现 GitHub Issue 链接构建引擎 (TDD Green)

**Objective:** 实现 `web/js/feedback.js`，包含静态仓库配置、多通道 Issue 模版生成、环境感知与浏览器跳转封装。

**Files:**
- Create: `web/js/feedback.js`

**Step 1: 编写核心实现代码**

```javascript
// web/js/feedback.js
/**
 * 申论智能研习台 - GitHub Issues 极简留言与反馈辅助引擎
 * 零外部依赖，动态装配携带环境与题型上下文的 GitHub Issue 直达 URL
 */

const FeedbackHelper = {
  REPO_URL: 'https://github.com/qqxdxdxxd-hash/shenlun-study',

  /**
   * 获取全部 Issues 列表页面 URL
   */
  getIssuesListUrl() {
    return `${this.REPO_URL}/issues`;
  },

  /**
   * 采集当前运行环境上下文 (用于 Bug 报告自动填充)
   */
  collectRuntimeContext() {
    let qType = 'essay';
    let examTitle = '未知试卷';

    if (typeof document !== 'undefined') {
      const qSelect = document.getElementById('q-type');
      if (qSelect) qType = qSelect.value;
      const examSelect = document.getElementById('exam-selector');
      if (examSelect && examSelect.options[examSelect.selectedIndex]) {
        examTitle = examSelect.options[examSelect.selectedIndex].text;
      }
    }

    return {
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'Node.js Test Env',
      qType,
      examTitle,
      appVersion: 'v2.0 (Shenlun Exam OS)'
    };
  },

  /**
   * 构造直达 GitHub New Issue 的完整链接
   * @param {'feature' | 'bug' | 'rubric'} type 
   * @param {Object} [overrideContext] 可选覆盖上下文
   */
  buildIssueUrl(type, overrideContext = null) {
    const base = `${this.REPO_URL}/issues/new`;
    const ctx = overrideContext || this.collectRuntimeContext();

    if (type === 'feature') {
      const title = '【功能建议/留言】：在此简述您的想法或期望';
      const body = [
        '### 💡 您的称呼 / 目标考区',
        '（例如：江苏考生 / 2025国考先锋）',
        '',
        '### 📝 留言内容 / 功能建议详情',
        '请详细描述您的想法或希望研习台改进的地方：',
        '',
        '### 🎯 为什么需要这个改进？（预期效果）',
        '例如：在练习单一题时希望能有XXX辅助...'
      ].join('\n');

      return `${base}?title=${encodeURIComponent(title)}&labels=enhancement&body=${encodeURIComponent(body)}`;
    }

    if (type === 'bug') {
      const title = '【Bug反馈】：在此简要概括遇到的问题';
      const body = [
        '### 🐛 问题现象与复现步骤',
        '1. 进入【纸面作答与色谱批改】',
        '2. ...',
        '3. 出现异常：...',
        '',
        '### 💻 运行环境与上下文（自动采集）',
        `- 客户端/浏览器：${ctx.userAgent}`,
        `- 研习台版本：${ctx.appVersion || 'v2.0'}`,
        `- 作答题型：${ctx.qType}`,
        `- 关联真题：${ctx.examTitle}`,
        '',
        '### 📷 截图或报错提示（如有请粘贴于此）',
        '（支持直接 Ctrl+V 粘贴截图）'
      ].join('\n');

      return `${base}?title=${encodeURIComponent(title)}&labels=bug&body=${encodeURIComponent(body)}`;
    }

    if (type === 'rubric') {
      const title = '【真题采分探讨】：关于采分点与阅卷标准的商榷';
      const body = [
        '### 🏛️ 涉及真题与题号',
        `真题名称：${ctx.examTitle}`,
        '',
        '### 🎯 采分商榷与判语探讨',
        '（请在此指出哪个采分点存在疑义，或哪处官方判语值得深入探讨...）',
        '',
        '### 📚 参考佐证或官方题解出处',
        '...'
      ].join('\n');

      return `${base}?title=${encodeURIComponent(title)}&labels=discussion&body=${encodeURIComponent(body)}`;
    }

    // 默认或未知类别
    return base;
  },

  /**
   * 在新标签页打开指定类型的 Issue 提交页
   */
  openIssue(type) {
    const url = this.buildIssueUrl(type);
    if (typeof window !== 'undefined') {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
    return url;
  }
};

// 兼容 Node.js 单元测试与浏览器环境
if (typeof module !== 'undefined' && module.exports) {
  module.exports = FeedbackHelper;
}
if (typeof window !== 'undefined') {
  window.FeedbackHelper = FeedbackHelper;
}
```

**Step 2: 运行单元测试验证通过 (TDD Green)**

Run: `node web/tests/test_feedback.js`  
Expected Output:
```
=== 开始执行 GitHub Issue 反馈通道核心单元测试 ===
-> 验证 Test 1: 默认仓库配置与全量列表链接
  ✅ Test 1 通过：基础仓库与 Issues URL 正确
-> 验证 Test 2: 功能建议 URL 与标签装配
  ✅ Test 2 通过：功能建议 URL 构建精准
-> 验证 Test 3: Bug 反馈 URL 与环境信息自动注入
  ✅ Test 3 通过：Bug 反馈与环境上下文成功注入
-> 验证 Test 4: 采分探讨 Issue URL
  ✅ Test 4 通过：采分探讨 URL 构建正确
-> 验证 Test 5: 未知类别优雅降级为基础新建链接
  ✅ Test 5 通过：非法类型降级稳健
🎉 GitHub Issue 反馈通道核心单元测试全部通过！
```

---

### Task 3: 扩充样式表，构建反馈弹窗与通道卡片网格

**Objective:** 在 `web/styles/main.css` 中追加反馈模态弹窗的样式，包括四通道网格卡片、Hover 高亮光效、图标与排版规范，完全融合研习台暗色科技风格。

**Files:**
- Modify: `web/styles/main.css`

**Step 1: 在 `web/styles/main.css` 尾部追加以下样式**

```css
/* ========================================================
   💬 GitHub Issues 留言与问题反馈弹窗样式
   ======================================================== */
.feedback-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  margin-bottom: 16px;
}

@media (max-width: 600px) {
  .feedback-grid {
    grid-template-columns: 1fr;
  }
}

.feedback-channel-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid var(--border);
  border-radius: 8px;
  text-decoration: none;
  cursor: pointer;
  transition: all 0.2s ease;
}

.feedback-channel-card:hover {
  background: rgba(56, 189, 248, 0.08);
  border-color: rgba(56, 189, 248, 0.4);
  transform: translateY(-2px);
}

.channel-icon {
  font-size: 26px;
  line-height: 1;
  flex-shrink: 0;
}

.channel-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.channel-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-main);
}

.channel-desc {
  font-size: 11px;
  color: var(--text-muted);
  line-height: 1.3;
}

.feedback-repo-banner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: rgba(15, 23, 42, 0.6);
  border: 1px solid var(--border);
  border-radius: 6px;
  padding: 10px 14px;
  font-size: 12px;
  color: var(--text-muted);
}

.feedback-repo-banner a {
  color: var(--accent);
  text-decoration: none;
  font-weight: 500;
}

.feedback-repo-banner a:hover {
  text-decoration: underline;
}
```

---

### Task 4: 在 `web/index.html` 嵌入顶部入口与弹窗结构

**Objective:** 在 `web/index.html` 的顶部操作栏增加 `💬 考友留言 / 提 Issue` 按钮，并在文档末尾增加引导弹窗与 `feedback.js` 引用。

**Files:**
- Modify: `web/index.html:26-34`
- Modify: `web/index.html:600-632`

**Step 1: 顶部操作栏增加入口按钮**

定位到 `web/index.html` 的 `<div class="header-actions">`：
```html
      <div class="header-actions">
        <button class="btn btn-outline" onclick="window.BackupManager.exportFullBackup()">
          <span>💾 导出全量备份</span>
        </button>
        <button class="btn btn-outline" onclick="openFeedbackModal()" title="提建议、留言或反馈Bug">
          <span>💬 考友留言 / 提 Issue</span>
        </button>
        <button class="btn btn-primary" onclick="openSettingModal()">
          <span>⚙️ 模型配置 (BYOK)</span>
        </button>
      </div>
```

**Step 2: 页面末尾增加弹窗结构**

在 `<div class="modal-backdrop" id="setting-modal">` 之后追加：

```html
  <!-- 💬 考友留言与问题反馈模态窗 (GitHub Issues 直达) -->
  <div class="modal-backdrop" id="feedback-modal" style="display: none;">
    <div class="modal" style="max-width: 580px;">
      <div class="modal-header">
        <div class="modal-title">💬 考友留言与问题反馈 (GitHub Issues)</div>
        <div class="modal-close" onclick="closeFeedbackModal()">✕</div>
      </div>

      <div style="font-size: 13px; color: var(--text-muted); line-height: 1.6; margin-bottom: 16px;">
        <p style="margin: 0 0 8px 0;">
          🏛️ <strong>申论智能研习台为开源项目</strong>。为了让所有考友的留言、复习心得、新功能建议以及批改 Bug 都能被公开讨论、永久留存并由作者快速跟进，系统已将所有反馈统一汇聚在 <strong>GitHub Issues</strong>。
        </p>
        <p style="margin: 0; color: #38bdf8; font-size: 12px;">
          💡 点击下方对应通道，将自动为您填充格式化模版，在新窗口直达 GitHub 提交：
        </p>
      </div>

      <!-- 四大直达通道卡片网格 -->
      <div class="feedback-grid">
        <!-- 通道 1: 功能建议 / 留言 -->
        <a class="feedback-channel-card" href="javascript:void(0)" onclick="window.FeedbackHelper.openIssue('feature')">
          <div class="channel-icon">💡</div>
          <div class="channel-info">
            <div class="channel-title">功能建议 / 留言</div>
            <div class="channel-desc">提出新功能、新真题或备考心声</div>
          </div>
        </a>

        <!-- 通道 2: Bug 缺陷反馈 -->
        <a class="feedback-channel-card" href="javascript:void(0)" onclick="window.FeedbackHelper.openIssue('bug')">
          <div class="channel-icon">🐛</div>
          <div class="channel-info">
            <div class="channel-title">缺陷反馈 (Bug Report)</div>
            <div class="channel-desc">批改异常、判分错乱或排版问题</div>
          </div>
        </a>

        <!-- 通道 3: 真题采分探讨 -->
        <a class="feedback-channel-card" href="javascript:void(0)" onclick="window.FeedbackHelper.openIssue('rubric')">
          <div class="channel-icon">🎯</div>
          <div class="channel-info">
            <div class="channel-title">真题采分探讨</div>
            <div class="channel-desc">官方采分点商榷与判语切磋</div>
          </div>
        </a>

        <!-- 通道 4: 浏览所有考友留言墙 -->
        <a class="feedback-channel-card" href="https://github.com/qqxdxdxxd-hash/shenlun-study/issues" target="_blank" rel="noopener noreferrer">
          <div class="channel-icon">📜</div>
          <div class="channel-info">
            <div class="channel-title">查看考友留言墙</div>
            <div class="channel-desc">浏览全部历史 Issues 与作者回复</div>
          </div>
        </a>
      </div>

      <!-- 底部仓库直达链接 -->
      <div class="feedback-repo-banner">
        <span>⭐ 开源仓库：<a href="https://github.com/qqxdxdxxd-hash/shenlun-study" target="_blank" rel="noopener noreferrer">qqxdxdxxd-hash/shenlun-study</a></span>
        <span style="font-size: 11px;">欢迎在 GitHub 随手点个 Star 鼓励作者！</span>
      </div>

      <div class="modal-footer" style="margin-top: 16px;">
        <button class="btn btn-primary" onclick="closeFeedbackModal()">关闭</button>
      </div>
    </div>
  </div>
```

**Step 3: 引入脚本**
在 `web/index.html` 底部的 `<script src="js/app.js"></script>` 之前增加：
```html
<script src="js/feedback.js"></script>
```

---

### Task 5: 在 `web/js/app.js` 接入弹窗控制逻辑

**Objective:** 在 `web/js/app.js` 中挂载 `openFeedbackModal()` 与 `closeFeedbackModal()`，支持点击遮罩层背景快速关闭。

**Files:**
- Modify: `web/js/app.js`

**Step 1: 追加弹窗控制函数**

在 `web/js/app.js` 的 `openSettingModal` / `closeSettingModal` 附近追加：

```javascript
function openFeedbackModal() {
  const modal = document.getElementById('feedback-modal');
  if (modal) modal.style.display = 'flex';
}

function closeFeedbackModal() {
  const modal = document.getElementById('feedback-modal');
  if (modal) modal.style.display = 'none';
}

// 支持点击遮罩背景关闭反馈弹窗
window.addEventListener('click', (e) => {
  const fbModal = document.getElementById('feedback-modal');
  if (e.target === fbModal) {
    closeFeedbackModal();
  }
});
```

---

### Task 6: 全面验证与回归测试 (Verification)

**Objective:** 执行自动化测试与端到端链路核对，确保新增代码不影响现有 27 个后端单元测试及前端已有功能。

**Step 1: 运行自动化测试**
- 运行新写的前端测试：
  ```bash
  node web/tests/test_feedback.js
  ```
  预期输出：所有 5 个测试用例全部通过。

- 运行前端历史测试防退化：
  ```bash
  node web/tests/test_question_history.js
  ```
  预期输出：`🎉 做题历史核心功能全部单元测试通过！`

- 运行后端 pytest 防退化：
  ```bash
  pytest server/tests/
  ```
  预期输出：`27 passed in ~0.8s`。

**Step 2: 浏览器端端交互验证**
1. 启动本地服务（或双击 `start.bat`）；
2. 观察顶部栏出现 `💬 考友留言 / 提 Issue`；
3. 点击按钮，弹窗平滑弹出，背景变暗；
4. 点击 `💡 功能建议 / 留言`，浏览器新建标签页打开 GitHub Issues，URL 中已正确预填充好建议模版并带有 `enhancement` 标签；
5. 点击 `🐛 缺陷反馈`，URL 中已自动带上考友当前所用的浏览器信息与当前所选的申论真题；
6. 点击空白遮罩处，弹窗自动关闭。

---

## 四、 风险规避与对比总结 (Risks & Comparison)

| 考量维度 | 本方案（GitHub Issues 极简直达） | 原方案（BaaS 云数据库 + 微信通知） |
| :--- | :--- | :--- |
| **代码量与复杂度** | 极小（约 120 行 JS + 30 行 HTML/CSS），0 外部依赖 | 较大（需引入 Supabase SDK、配置建表、PushPlus） |
| **作者能否收到提醒** | **能**，GitHub 官方原生邮件与 App 推送，100% 稳定可靠 | 依赖 PushPlus 微信 Webhook，需配置 Token |
| **访客操作与门槛** | 需拥有 GitHub 账号或注册登录 | 免登录（但面临匿名灌水风险） |
| **数据安全性与持久性** | 微软 GitHub 云端永久保存，自带防垃圾与封禁机制 | 需自行维护 Supabase RLS 防刷策略 |
| **部署维护成本** | **0**（完全不需要维护任何数据库或第三方 Key） | 需管理 Supabase 项目生命周期与调用配额 |

本方案完全满足**“不需要微信通知、极简、跳转到 GitHub Issue 提交问题、清晰告诉用户”**的全部核心意图。
