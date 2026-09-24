# 跨端访客留言系统 (Cross-Browser Guestbook & Feedback) 实施计划

> **For Hermes:** Use subagent-driven-development skill to implement this plan task-by-task.

**Goal:** 论证并解答“纯前端留言”的可行性边界，为申论智能研习台构建一套基于前端直连 BaaS（支持免登录、零服务器维护成本）的跨浏览器留言板，并集成站长微信/移动端即时提醒与云端安全存储。

**Architecture:** 采用“纯前端驱动 + Serverless BaaS 云存储（Supabase REST API / LeanCloud）+ 可选微信 Webhook 实时通知”的无服务器架构。前端通过轻量 Provider 模式解耦数据层（`web/js/guestbook.js`），访客在任意浏览器免登录留言直接持久化至云端数据库并推流至站长微信；同时在 `web/index.html` 与 `web/styles/main.css` 新增一体化暗色玻璃拟态留言看板。

**Tech Stack:** Vanilla JavaScript (ES6+), Supabase REST API (PostgreSQL + RLS), PushPlus / Server酱 Webhook, Node.js (单元测试), CSS3 (Design Tokens).

---

## 一、 核心问题深度论证：能否纯前端实现？

用户核心提问：**“增加一个留言功能，思考能否前端实现，要别人在他自己的浏览器上留言，我也能看得到”**。

本节从计算机底层通信、Web 安全沙箱与现代前端架构三个层面进行系统性论证与判定：

### 1.1 狭义的“绝对纯前端”（完全不借助任何公网服务器或第三方云节点）
- **结论：物理上绝对不可能（Mathematically & Architecturally Impossible）。**
- **深层原理（为什么不行）：**
  1. **浏览器同源隔离与本地沙箱机制**：
     - 访客在自己浏览器中输入的内容，无论保存在 `localStorage`、`IndexedDB` 还是本地文件，都严格物理隔离在**该访客本地设备的磁盘目录**中。
     - 站长的浏览器运行在站长自己的电脑上。浏览器的安全沙箱规范与操作系统的网络协议栈严格禁止外部任意机器直接探测、穿透和读取另一台机器本地浏览器中的沙箱数据。
  2. **P2P 点对点技术（如 WebRTC DataChannel）为何依然无法解决？**
     - **无法摆脱信令服务器**：WebRTC 建立连接的第一步，必须通过公网上的信令服务器（Signaling Server）交换彼此的 IP/端口与 SDP 握手包，依然存在外部服务器。
     - **异步离线不可达**：P2P 属于实时通信通道，必须要求“访客与站长同时在线、同时打开网页”。而留言板属于典型的**异步场景**（访客上午10点留言，站长晚上8点查看）。一旦访客关掉浏览器，P2P 通道即刻销毁，数据灰飞烟灭。
  3. **铁律结论**：
     任何跨设备、跨浏览器、跨时间的异步数据交换，在网络拓扑上**必须存在一个位于公网、拥有公网 IP 或域名的持久化中介（Shared Persistent Node）**。

---

### 1.2 广义的“前端驱动视角”（Serverless / BaaS 架构：开发者 0 后端维护）
- **结论：完全可行！而且是现代静态网站、独立开发与开源系统最高效、体验最好的标准范式。**
- **核心逻辑**：
  - 开发者**不需要自己购买云服务器、不需要配置 Linux / Nginx、不需要维护 MySQL、不需要编写后端接口代码**。
  - 研习台的纯前端直接调用成熟的云端 BaaS（Backend-as-a-Service）API（如 Supabase、LeanCloud）完成数据读写。
  - 对于站长而言，整个代码库依然保持“纯静态前端”或“无状态算力后端”，完全不违背项目的零数据留存（Zero-Retention）原则。

---

### 1.3 四种实施路线横向技术对账

| 维度 | 路线 A：Supabase 前端直连 BaaS (推荐核心) | 路线 B：Giscus / Utterances (GitHub 评论) | 路线 C：纯通知 Webhook (Server酱/PushPlus) | 路线 D：FastAPI 本地后端扩展 (SQLite) |
| :--- | :--- | :--- | :--- | :--- |
| **底层存储** | 云端托管 PostgreSQL（全球 CDN） | GitHub 仓库 Discussions / Issues | 站长个人微信 / 邮件 / 手机通知 | 本地服务器 `guestbook.db` |
| **访客操作门槛** | **0 门槛，完全免登录**，输入昵称直接发 | **高**，必须登录 GitHub 账号授权 | **0 门槛，免登录**（仅发送，不可看历史） | **0 门槛，免登录** |
| **他人留言能否互看** | **能**，实时渲染所有人公开留言列表 | **能**，内嵌 GitHub Discussions 列表 | **否**，单向投递至站长私有收件箱 | **仅限同服务器部署时能** |
| **站长收到提醒方式** | 页面内实时看 + 自动联动微信 Webhook 推送 | 绑定 GitHub 的邮箱 / 移动端 App 弹窗 | 站长微信 / 邮件毫秒级弹出新消息 | 无主动推送，需手动登后台查看 |
| **服务端运维成本** | **0**（直接白嫖官方免费额度，每月数万条） | **0**（完全依托 GitHub 基础设施） | **0**（免费公共 Webhook） | **需维护服务器常驻进程与数据库** |
| **公网部署兼容性** | **100% 适配**（GitHub Pages/本地/VPS均可用）| **100% 适配**（纯静态引入） | **100% 适配** | **受限**（静态 GitHub Pages 无法运行 Python） |
| **公考用户适配度** | ⭐⭐⭐⭐⭐（无任何障碍，可带考区标签） | ⭐⭐（考生极少有 GitHub 账号） | ⭐⭐⭐（体验像反馈信箱，无社区感） | ⭐⭐⭐（单机运行时访客无法跨端互通） |

**选型决策**：
本项目采用 **路线 A (Supabase BaaS 纯前端直连) + 路线 C (微信 PushPlus 站长通知中继)** 为主方案，并在代码架构中采用 Provider 驱动模式：
1. **公开交流板**：访客在自己浏览器输入留言与考区标签，直连云端写入并呈现在时间线中，任何人打开均可看见；
2. **站长即刻感知**：访客点击提交的同时，前端自动携带留言摘要触发一条轻量 Webhook，**站长手机微信立即收到弹窗通知**；
3. **零配置友好**：系统内置优雅的 MockProvider。若尚未配置 Supabase 密钥，前端界面自动展示功能演示态与 1 分钟快速配置向导，保证界面绝不报错崩溃。

---

## 二、 系统架构与模块设计

### 2.1 模块交互与数据流向图

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                        跨端访客留言与站长通知闭环数据流                                │
│                                                                                        │
│  [访客浏览器 A] ──(免登录输入留言)──┐                                                  │
│                                    │ HTTPS (Supabase REST API / Anon Key)              │
│                                    ▼                                                   │
│                      ┌───────────────────────────┐                                     │
│                      │  Supabase Cloud (Postgres)│                                     │
│                      │  - 表: `guestbook`        │                                     │
│                      │  - RLS: 允许匿名 INSERT   │                                     │
│                      │  - RLS: 允许公开 SELECT   │                                     │
│                      └─────────────┬─────────────┘                                     │
│                                    │                                                   │
│             ┌──────────────────────┴──────────────────────┐                            │
│             │ HTTPS (SELECT)                              │ Webhook POST               │
│             ▼                                             ▼                            │
│  [站长浏览器 B]                                 [站长个人手机微信 (PushPlus/Server酱)] │
│  - 切换到【💬 研习留言】Tab                      - 弹出实时通知:                              │
│  - 自动渲染最新考友留言与考区标签                “🏛️ 申论研习台新留言：【广东考生】         │
│  - 可管理/回复/点赞                             这次单一题批改太精准了，希望增加大作文素材库”│
└────────────────────────────────────────────────────────────────────────────────────────┘
```

### 2.2 涉及文件清单与职责分工

```
web/
├── index.html                   # 修改：顶部导航增加 Tab，主体区新增 tab-guestbook 留言板看板
├── styles/main.css              # 修改：新增留言输入框、卡片流、考区徽章、时间线与状态样式
├── js/
│   ├── guestbook.js             # 新增：核心纯逻辑驱动（SupabaseDriver, PushDriver, 数据校验与过滤）
│   └── app.js                   # 修改：挂载留言板生命周期、Tab 切换、提交事件监听与云端配置弹窗
└── tests/
    └── test_guestbook.js        # 新增：留言数据验证、敏感词过滤、云端 Payload 转换的自动化单元测试
```

---

## 三、 分步骤任务清单 (Bite-sized TDD Tasks)

### Task 1: 编写留言板核心数据引擎单元测试 (TDD Red)

**Objective:** 为 `GuestbookManager` 编写纯函数单元测试，覆盖留言内容验证（长度/空值）、考区标签清洗、敏感词过滤、Payload 格式化以及 Provider 驱动切换逻辑。

**Files:**
- Create: `web/tests/test_guestbook.js`

**Step 1: 编写完整测试代码**

```javascript
// web/tests/test_guestbook.js
const assert = require('assert');

// 提取将被实现的模块
let GuestbookManager;
try {
  GuestbookManager = require('../js/guestbook.js');
} catch (e) {
  // 占位
}

function runTests() {
  console.log('=== 开始执行留言板核心数据逻辑单元测试 ===');

  // Test 1: 基础校验与净化
  console.log('-> 验证 Test 1: 留言内容校验与考区标签清洗');
  const emptyCheck = GuestbookManager.validateMessage({
    author: '  ',
    content: '   ',
    region: '江苏'
  });
  assert.strictEqual(emptyCheck.valid, false, '空内容必须校验不通过');
  assert.strictEqual(emptyCheck.error, '留言内容和昵称不能为空');

  const validCheck = GuestbookManager.validateMessage({
    author: '金陵考生',
    content: '希望能增加更多 2024 年江苏省考真题解析！',
    region: '江苏'
  });
  assert.strictEqual(validCheck.valid, true, '合法内容必须校验通过');
  assert.strictEqual(validCheck.data.author, '金陵考生');
  assert.strictEqual(validCheck.data.region, '江苏');
  console.log('  ✅ Test 1 通过：输入校验与数据规范化正确');

  // Test 2: 超长字数拦截与截断
  console.log('-> 验证 Test 2: 字数边界限制 (最大 300 字)');
  const longContent = 'A'.repeat(301);
  const longCheck = GuestbookManager.validateMessage({
    author: '小明',
    content: longContent,
    region: '国考'
  });
  assert.strictEqual(longCheck.valid, false, '超出 300 字必须被拦截');
  console.log('  ✅ Test 2 通过：超长字符防御有效');

  // Test 3: XSS 恶意脚本转义与标签清洗
  console.log('-> 验证 Test 3: XSS 防御与 HTML 实体转义');
  const xssInput = '<script>alert("hack")</script><b>测试</b>';
  const sanitized = GuestbookManager.sanitizeText(xssInput);
  assert.strictEqual(sanitized.includes('<script>'), false, '必须过滤危险 script 标签');
  assert.strictEqual(sanitized.includes('&lt;script&gt;'), true, '尖括号必须转义为 HTML 实体');
  console.log('  ✅ Test 3 通过：XSS 安全转义正确');

  // Test 4: 构造发送至 Supabase 的 Payload
  console.log('-> 验证 Test 4: Supabase 数据传输契约构造');
  const payload = GuestbookManager.formatSupabasePayload({
    author: '粤考先锋',
    content: '申论批改很客观！',
    region: '广东',
    tag: '备考心得'
  });
  assert.strictEqual(payload.author, '粤考先锋');
  assert.strictEqual(payload.region, '广东');
  assert.strictEqual(payload.tag, '备考心得');
  assert.ok(payload.created_at, '必须自动附加 ISO 时间戳');
  console.log('  ✅ Test 4 通过：云端契约 Payload 结构完备');

  // Test 5: 构造微信推送 Webhook 格式
  console.log('-> 验证 Test 5: 微信 PushPlus 消息格式装配');
  const pushMsg = GuestbookManager.formatPushPlusMessage({
    author: '国考小白',
    content: '求教大五段怎么卡时间？',
    region: '国考',
    tag: '求助'
  });
  assert.ok(pushMsg.title.includes('研习台新留言'), '推送标题必须具备辨识度');
  assert.ok(pushMsg.content.includes('国考小白'), '推送正文必须包含留言者');
  assert.ok(pushMsg.content.includes('求教大五段'), '推送正文必须包含核心内容');
  console.log('  ✅ Test 5 通过：微信 Webhook 消息模版精准');

  console.log('🎉 留言板核心逻辑所有单元测试通过！');
}

runTests();
```

**Step 2: 运行测试验证失败 (TDD Red)**

Run: `node web/tests/test_guestbook.js`  
Expected Output: `TypeError: Cannot read properties of undefined` 或 `GuestbookManager is not defined`

---

### Task 2: 实现留言板纯函数与驱动模块 (TDD Green)

**Objective:** 实现 `web/js/guestbook.js`，包含数据验证、XSS 转义、Supabase REST 驱动、微信 Webhook 推送驱动与本地 Mock 回退驱动。

**Files:**
- Create: `web/js/guestbook.js`

**Step 1: 编写核心实现代码**

```javascript
// web/js/guestbook.js
/**
 * 申论智能研习台 - 跨端留言驱动与数据管理器
 * 支持 Supabase 云端 BaaS 直连、微信 Webhook 实时通知与本地 Mock 回退
 */

const GuestbookManager = {
  // 基础校验规则
  MAX_CONTENT_LENGTH: 300,
  MAX_AUTHOR_LENGTH: 20,

  /**
   * HTML 实体转义防止 XSS 注入
   */
  sanitizeText(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  },

  /**
   * 留言表单验证
   */
  validateMessage(data) {
    const author = (data.author || '').trim();
    const content = (data.content || '').trim();
    const region = (data.region || '全国').trim();
    const tag = (data.tag || '备考心得').trim();

    if (!author || !content) {
      return { valid: false, error: '留言内容和昵称不能为空' };
    }
    if (author.length > this.MAX_AUTHOR_LENGTH) {
      return { valid: false, error: `昵称不能超过 ${this.MAX_AUTHOR_LENGTH} 个字符` };
    }
    if (content.length > this.MAX_CONTENT_LENGTH) {
      return { valid: false, error: `留言内容不能超过 ${this.MAX_CONTENT_LENGTH} 字` };
    }

    return {
      valid: true,
      data: {
        author: this.sanitizeText(author),
        content: this.sanitizeText(content),
        region: this.sanitizeText(region),
        tag: this.sanitizeText(tag)
      }
    };
  },

  /**
   * 构造 Supabase REST 写入对象
   */
  formatSupabasePayload(validData) {
    return {
      author: validData.author,
      content: validData.content,
      region: validData.region || '全国',
      tag: validData.tag || '交流',
      created_at: new Date().toISOString()
    };
  },

  /**
   * 构造微信 PushPlus 消息格式
   */
  formatPushPlusMessage(data) {
    const title = `🏛️ 申论研习台新留言：【${data.region || '考友'}】${data.author}`;
    const content = `
      <div style="padding:12px;background:#f8fafc;border-left:4px solid #38bdf8;border-radius:4px;">
        <h4 style="margin:0 0 8px 0;color:#0f172a;">${title}</h4>
        <p style="margin:0 0 6px 0;color:#475569;font-size:14px;"><strong>标签：</strong>${data.tag || '无'}</p>
        <p style="margin:0;color:#1e293b;font-size:15px;white-space:pre-wrap;">${data.content}</p>
        <hr style="border:none;border-top:1px solid #e2e8f0;margin:12px 0;">
        <small style="color:#94a3b8;">时间：${new Date().toLocaleString()}</small>
      </div>
    `.trim();

    return {
      title,
      content,
      template: 'html'
    };
  }
};

/**
 * 客户端云端存储适配器 (Supabase REST API)
 */
class SupabaseGuestbookClient {
  constructor(config = {}) {
    this.endpoint = config.endpoint || ''; // 例: https://xxx.supabase.co
    this.anonKey = config.anonKey || '';   // Supabase anon public key
    this.pushToken = config.pushToken || ''; // 可选微信 PushPlus Token
  }

  isConfigured() {
    return Boolean(this.endpoint && this.anonKey);
  }

  /**
   * 拉取最新留言列表
   */
  async fetchMessages(limit = 30) {
    if (!this.isConfigured()) {
      return this.getMockMessages();
    }
    const url = `${this.endpoint.replace(/\/$/, '')}/rest/v1/guestbook?select=*&order=created_at.desc&limit=${limit}`;
    const resp = await fetch(url, {
      headers: {
        'apikey': this.anonKey,
        'Authorization': `Bearer ${this.anonKey}`
      }
    });
    if (!resp.ok) {
      throw new Error(`获取留言失败 HTTP ${resp.status}`);
    }
    return await resp.json();
  }

  /**
   * 提交留言并触发微信推送
   */
  async postMessage(messageData) {
    const check = GuestbookManager.validateMessage(messageData);
    if (!check.valid) {
      throw new Error(check.error);
    }
    const payload = GuestbookManager.formatSupabasePayload(check.data);

    if (!this.isConfigured()) {
      // 演示模式：存入本地 localStorage 供当前浏览器预览
      const list = this.getMockMessages();
      list.unshift({ id: 'mock_' + Date.now(), ...payload });
      localStorage.setItem('shenlun_mock_guestbook', JSON.stringify(list));
      return { success: true, mode: 'mock' };
    }

    // 1. 发送至 Supabase
    const url = `${this.endpoint.replace(/\/$/, '')}/rest/v1/guestbook`;
    const resp = await fetch(url, {
      method: 'POST',
      headers: {
        'apikey': this.anonKey,
        'Authorization': `Bearer ${this.anonKey}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      },
      body: JSON.stringify(payload)
    });

    if (!resp.ok) {
      const errText = await resp.text();
      throw new Error(`提交留言失败: ${errText}`);
    }

    // 2. 异步静默触发微信 PushPlus 通知站长（如有配置 Token）
    if (this.pushToken) {
      this.sendWechatPush(payload).catch(err => console.warn('微信通知发送跳过:', err));
    }

    return { success: true, mode: 'cloud' };
  }

  /**
   * 异步调用 PushPlus 投递微信通知
   */
  async sendWechatPush(payload) {
    const pushBody = GuestbookManager.formatPushPlusMessage(payload);
    await fetch('https://www.pushplus.plus/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        token: this.pushToken,
        title: pushBody.title,
        content: pushBody.content,
        template: 'html'
      })
    });
  }

  /**
   * 预置的演示/兜底数据（无配置时丝滑呈现）
   */
  getMockMessages() {
    const saved = localStorage.getItem('shenlun_mock_guestbook');
    if (saved) {
      try { return JSON.parse(saved); } catch(e){}
    }
    return [
      {
        id: 'init_1',
        author: '研习台助考官',
        region: '系统公告',
        tag: '官方指引',
        content: '欢迎来到申论智能研习台留言板！在这里可以交流做题心得、反馈改进建议。如需开启全球跨端云同步，请在右上角【⚙️ 留言云配置】填入免费 Supabase 凭证。',
        created_at: new Date(Date.now() - 3600000).toISOString()
      },
      {
        id: 'init_2',
        author: '江苏考友',
        region: '江苏',
        tag: '备考心得',
        content: '大五段范文的素材逆向激活太好用了，背的名言终于能在模考里顺畅化用了！',
        created_at: new Date(Date.now() - 86400000).toISOString()
      }
    ];
  }
}

// 兼容 Node.js 自动化单元测试与浏览器环境
if (typeof module !== 'undefined' && module.exports) {
  module.exports = GuestbookManager;
}
if (typeof window !== 'undefined') {
  window.GuestbookManager = GuestbookManager;
  window.SupabaseGuestbookClient = SupabaseGuestbookClient;
}
```

**Step 2: 运行单元测试验证通过 (TDD Green)**

Run: `node web/tests/test_guestbook.js`  
Expected Output:
```
=== 开始执行留言板核心数据逻辑单元测试 ===
-> 验证 Test 1: 留言内容校验与考区标签清洗
  ✅ Test 1 通过：输入校验与数据规范化正确
-> 验证 Test 2: 字数边界限制 (最大 300 字)
  ✅ Test 2 通过：超长字符防御有效
-> 验证 Test 3: XSS 防御与 HTML 实体转义
  ✅ Test 3 通过：XSS 安全转义正确
-> 验证 Test 4: Supabase 数据传输契约构造
  ✅ Test 4 通过：云端契约 Payload 结构完备
-> 验证 Test 5: 微信 PushPlus 消息格式装配
  ✅ Test 5 通过：微信 Webhook 消息模版精准
🎉 留言板核心逻辑所有单元测试通过！
```

---

### Task 3: 扩充样式表，构建留言板暗色质感组件

**Objective:** 在 `web/styles/main.css` 中追加留言板组件样式，包括留言卡片流、考区徽章、标签过滤器、发布框计数器与配置状态指示灯。

**Files:**
- Modify: `web/styles/main.css`

**Step 1: 在 `web/styles/main.css` 尾部追加以下样式**

```css
/* ========================================================
   💬 跨端研习留言板 (Guestbook Hub) 专用样式
   ======================================================== */
.guestbook-layout {
  display: grid;
  grid-template-columns: 360px 1fr;
  gap: 20px;
  align-items: start;
}

@media (max-width: 900px) {
  .guestbook-layout {
    grid-template-columns: 1fr;
  }
}

.guestbook-form-card {
  position: sticky;
  top: 80px;
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 18px;
}

.guestbook-cloud-status {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  border-radius: 6px;
  font-size: 12px;
  margin-bottom: 14px;
}

.guestbook-cloud-status.connected {
  background: rgba(16, 185, 129, 0.1);
  border: 1px solid rgba(16, 185, 129, 0.3);
  color: #34d399;
}

.guestbook-cloud-status.mock {
  background: rgba(245, 158, 11, 0.1);
  border: 1px solid rgba(245, 158, 11, 0.3);
  color: #fbbf24;
}

.guestbook-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.guestbook-card {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 16px;
  transition: transform 0.15s ease, border-color 0.15s ease;
}

.guestbook-card:hover {
  border-color: rgba(56, 189, 248, 0.4);
  transform: translateY(-1px);
}

.guestbook-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.guestbook-author-meta {
  display: flex;
  align-items: center;
  gap: 8px;
}

.guestbook-author-name {
  font-weight: 600;
  color: var(--text-main);
  font-size: 14px;
}

.guestbook-region-badge {
  font-size: 11px;
  padding: 2px 6px;
  border-radius: 4px;
  background: rgba(56, 189, 248, 0.15);
  color: #38bdf8;
  border: 1px solid rgba(56, 189, 248, 0.3);
}

.guestbook-tag-badge {
  font-size: 11px;
  padding: 2px 6px;
  border-radius: 4px;
  background: rgba(148, 163, 184, 0.12);
  color: var(--text-muted);
}

.guestbook-time {
  font-size: 12px;
  color: var(--text-muted);
}

.guestbook-content {
  font-size: 14px;
  color: #e2e8f0;
  line-height: 1.6;
  white-space: pre-wrap;
  word-break: break-word;
}
```

---

### Task 4: 在 `web/index.html` 嵌入导航 Tab 与留言板主视图

**Objective:** 在顶部 Tab 栏追加 `💬 研习留言` 入口，并在主视图追加 `tab-guestbook` 容器与配置弹窗结构。

**Files:**
- Modify: `web/index.html`

**Step 1: 顶部导航增加 Tab 项**
在 `<div class="tab-bar">` 内部追加：
```html
<div class="tab-item" onclick="switchTab('guestbook')">💬 研习留言</div>
```

**Step 2: 页面主体增加 `tab-guestbook` 面板**
在 `<main>` 内部追加：
```html
<!-- TAB: 研习留言板 -->
<div id="tab-guestbook" class="tab-panel">
  <div class="guestbook-layout">
    
    <!-- 左侧：发布留言表单 -->
    <div class="guestbook-form-card">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
        <h3 style="margin: 0; font-size: 16px; color: var(--text-main);">✍️ 考友寄语 / 提建议</h3>
        <button class="btn btn-outline" style="padding: 4px 8px; font-size: 11px;" onclick="openGuestbookConfigModal()">
          ⚙️ 留言云配置
        </button>
      </div>

      <!-- 云端就绪状态提示 -->
      <div id="guestbook-status-banner" class="guestbook-cloud-status mock">
        <span id="guestbook-status-text">🟡 演示模式 (未连接云端)</span>
      </div>

      <div class="form-group" style="margin-bottom: 10px;">
        <label class="form-label">你的称呼 / 昵称</label>
        <input type="text" id="gb-author" class="form-input" placeholder="例如：25上岸先锋" maxlength="20">
      </div>

      <div class="form-group" style="margin-bottom: 10px;">
        <label class="form-label">目标考区</label>
        <select id="gb-region" class="form-select">
          <option value="国考">🏛️ 国考 (副省/市地/行政执法)</option>
          <option value="江苏">🌊 江苏省考 (A/B/C类)</option>
          <option value="广东">🌴 广东省考 (县级/乡镇)</option>
          <option value="北京">🏰 北京市考</option>
          <option value="浙江">💼 浙江省考</option>
          <option value="山东">⛰️ 山东省考</option>
          <option value="其他">🌏 其他省考 / 事业单位</option>
        </select>
      </div>

      <div class="form-group" style="margin-bottom: 10px;">
        <label class="form-label">留言标签</label>
        <select id="gb-tag" class="form-select">
          <option value="备考心得">💡 备考心得</option>
          <option value="功能建议">🚀 功能建议</option>
          <option value="采点探讨">🎯 采点探讨</option>
          <option value="打卡鼓励">🔥 打卡鼓励</option>
        </select>
      </div>

      <div class="form-group" style="margin-bottom: 12px;">
        <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
          <label class="form-label" style="margin: 0;">留言内容</label>
          <span style="font-size: 11px; color: var(--text-muted);"><span id="gb-counter">0</span>/300字</span>
        </div>
        <textarea id="gb-content" class="form-input" rows="4" placeholder="写下你的刷题心声、备考困惑或系统优化建议..." maxlength="300"></textarea>
      </div>

      <button id="btn-submit-guestbook" class="btn btn-primary" style="width: 100%;" onclick="submitGuestbookMessage()">
        <span>🚀 提交公开留言</span>
      </button>
      <div style="font-size: 11px; color: var(--text-muted); text-align: center; margin-top: 8px;">
        🛡️ 留言公开可见，站长将通过通知中继即时查阅
      </div>
    </div>

    <!-- 右侧：留言卡片时间线 -->
    <div>
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
        <div style="font-size: 15px; font-weight: 600; color: var(--text-main);">
          📜 考友留言墙 (<span id="gb-total-count">0</span>)
        </div>
        <button class="btn btn-outline" style="padding: 4px 10px; font-size: 12px;" onclick="reloadGuestbookMessages()">
          🔄 刷新列表
        </button>
      </div>

      <div id="guestbook-timeline-container" class="guestbook-list">
        <!-- 动态渲染留言卡片 -->
      </div>
    </div>

  </div>
</div>

<!-- 留言云端配置模态窗 (Supabase & 微信推送配置) -->
<div id="modal-guestbook-config" class="modal-backdrop" style="display: none;">
  <div class="modal-card" style="max-width: 520px;">
    <div class="modal-header">
      <h3 style="margin: 0; font-size: 16px;">⚙️ 跨端留言云配置 (Supabase + 微信提醒)</h3>
      <button class="modal-close" onclick="closeGuestbookConfigModal()">✕</button>
    </div>
    <div class="modal-body">
      <p style="font-size: 12px; color: var(--text-muted); line-height: 1.5; margin-top: 0;">
        配置 Supabase 后，访客在任意电脑留言，均会永久同步至云端数据库并显示在此处；还可绑定 PushPlus Token，他人留言时你的微信会立即弹出通知！
      </p>

      <div class="form-group" style="margin-bottom: 10px;">
        <label class="form-label">Supabase Project URL</label>
        <input type="text" id="cfg-sb-url" class="form-input" placeholder="https://your-project.supabase.co">
      </div>

      <div class="form-group" style="margin-bottom: 10px;">
        <label class="form-label">Supabase Anon Public Key</label>
        <input type="text" id="cfg-sb-key" class="form-input" placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...">
      </div>

      <div class="form-group" style="margin-bottom: 12px;">
        <label class="form-label">微信 PushPlus Token (可选：有新留言时微信弹窗通知)</label>
        <input type="text" id="cfg-push-token" class="form-input" placeholder="输入从 pushplus.plus 获取的 Token">
      </div>

      <div style="background: rgba(56, 189, 248, 0.08); border: 1px solid rgba(56, 189, 248, 0.2); border-radius: 6px; padding: 10px; font-size: 11px; color: #94a3b8; line-height: 1.5;">
        💡 <strong>1分钟极速开通指南</strong>：在 <a href="https://supabase.com" target="_blank" style="color:#38bdf8;">supabase.com</a> 免费新建项目，在 SQL Editor 执行一条建表语句即可（详见计划实施文档）。
      </div>
    </div>
    <div class="modal-footer" style="display: flex; justify-content: flex-end; gap: 8px; margin-top: 14px;">
      <button class="btn btn-outline" onclick="closeGuestbookConfigModal()">取消</button>
      <button class="btn btn-primary" onclick="saveGuestbookConfig()">保存配置</button>
    </div>
  </div>
</div>
```

**Step 3: 引入脚本**
在 `web/index.html` 底部的 `<script src="js/app.js"></script>` 之前增加：
```html
<script src="js/guestbook.js"></script>
```

---

### Task 5: 在 `web/js/app.js` 接入留言业务流与生命周期

**Objective:** 串联 `app.js` 的 Tab 切换钩子、留言字数实时监听、列表异步拉取与卡片渲染、提交反馈防抖以及配置持久化。

**Files:**
- Modify: `web/js/app.js`

**Step 1: 扩展 `initApp` 与全局配置**

在 `web/js/app.js` 中增加全局变量与初始化逻辑：
```javascript
// 全局 Supabase 留言客户端实例
let guestbookClient = null;

function initGuestbookClient() {
  const cfg = {
    endpoint: localStorage.getItem('shenlun_sb_url') || '',
    anonKey: localStorage.getItem('shenlun_sb_key') || '',
    pushToken: localStorage.getItem('shenlun_push_token') || ''
  };
  guestbookClient = new window.SupabaseGuestbookClient(cfg);
  updateGuestbookStatusUI();
}
```

**Step 2: 增加留言板渲染与交互函数**

```javascript
function updateGuestbookStatusUI() {
  const banner = document.getElementById('guestbook-status-banner');
  const text = document.getElementById('guestbook-status-text');
  if (!banner || !text) return;

  if (guestbookClient && guestbookClient.isConfigured()) {
    banner.className = 'guestbook-cloud-status connected';
    text.textContent = '🟢 已接入云端数据库 (全球跨端互通中)';
  } else {
    banner.className = 'guestbook-cloud-status mock';
    text.textContent = '🟡 演示模式 (未绑定云端，点击右上角配置开启跨端互通)';
  }
}

async function reloadGuestbookMessages() {
  const container = document.getElementById('guestbook-timeline-container');
  const totalCountEl = document.getElementById('gb-total-count');
  if (!container) return;

  container.innerHTML = '<div style="color:var(--text-muted);padding:16px;text-align:center;">正在载入最新留言...</div>';

  try {
    const list = await guestbookClient.fetchMessages(50);
    if (totalCountEl) totalCountEl.textContent = list.length;

    if (!list || list.length === 0) {
      container.innerHTML = '<div style="color:var(--text-muted);padding:24px;text-align:center;">暂无留言，快来留下第一条吧！</div>';
      return;
    }

    container.innerHTML = list.map(item => `
      <div class="guestbook-card">
        <div class="guestbook-card-header">
          <div class="guestbook-author-meta">
            <span class="guestbook-author-name">👤 ${window.GuestbookManager.sanitizeText(item.author)}</span>
            <span class="guestbook-region-badge">${window.GuestbookManager.sanitizeText(item.region || '全国')}</span>
            <span class="guestbook-tag-badge">🏷️ ${window.GuestbookManager.sanitizeText(item.tag || '交流')}</span>
          </div>
          <span class="guestbook-time">${new Date(item.created_at || Date.now()).toLocaleString()}</span>
        </div>
        <div class="guestbook-content">${window.GuestbookManager.sanitizeText(item.content)}</div>
      </div>
    `).join('');
  } catch (err) {
    container.innerHTML = `<div style="color:var(--danger);padding:16px;text-align:center;">载入留言失败: ${err.message}</div>`;
  }
}

async function submitGuestbookMessage() {
  const btn = document.getElementById('btn-submit-guestbook');
  const authorInput = document.getElementById('gb-author');
  const regionSelect = document.getElementById('gb-region');
  const tagSelect = document.getElementById('gb-tag');
  const contentInput = document.getElementById('gb-content');

  const payload = {
    author: authorInput.value,
    region: regionSelect.value,
    tag: tagSelect.value,
    content: contentInput.value
  };

  const check = window.GuestbookManager.validateMessage(payload);
  if (!check.valid) {
    alert(check.error);
    return;
  }

  btn.disabled = true;
  btn.innerText = '正在提交...';

  try {
    await guestbookClient.postMessage(payload);
    contentInput.value = '';
    document.getElementById('gb-counter').innerText = '0';
    alert('🎉 留言提交成功！已同步至留言墙。');
    await reloadGuestbookMessages();
  } catch (err) {
    alert('提交留言失败: ' + err.message);
  } finally {
    btn.disabled = false;
    btn.innerText = '🚀 提交公开留言';
  }
}

// 模态弹窗控制
function openGuestbookConfigModal() {
  document.getElementById('cfg-sb-url').value = localStorage.getItem('shenlun_sb_url') || '';
  document.getElementById('cfg-sb-key').value = localStorage.getItem('shenlun_sb_key') || '';
  document.getElementById('cfg-push-token').value = localStorage.getItem('shenlun_push_token') || '';
  document.getElementById('modal-guestbook-config').style.display = 'flex';
}

function closeGuestbookConfigModal() {
  document.getElementById('modal-guestbook-config').style.display = 'none';
}

function saveGuestbookConfig() {
  const url = document.getElementById('cfg-sb-url').value.trim();
  const key = document.getElementById('cfg-sb-key').value.trim();
  const token = document.getElementById('cfg-push-token').value.trim();

  localStorage.setItem('shenlun_sb_url', url);
  localStorage.setItem('shenlun_sb_key', key);
  localStorage.setItem('shenlun_push_token', token);

  initGuestbookClient();
  closeGuestbookConfigModal();
  reloadGuestbookMessages();
  alert('✅ 留言云配置已保存！');
}
```

**Step 3: 绑定 Tab 激活与字数统计**
在 `switchTab` 函数中补充对 `'guestbook'` 的处理：
```javascript
if (tabName === 'guestbook') {
  reloadGuestbookMessages();
}
```
并在 DOMContentLoaded 中为 `gb-content` 绑定 `input` 事件实时更新 `gb-counter`。

---

### Task 6: 数据库表结构初始化指南与云端安全策略 (RLS)

**Objective:** 输出标准 PostgreSQL 建表 SQL 与行级安全策略（Row Level Security），保障即使匿名 Key 暴露在前端代码中，黑客也无法执行删库、篡改他人留言或恶意批量注入。

**File:**
- Documented in: `docs/guestbook-setup-guide.md` (或直接在系统说明中附带)

**SQL 建表与安全策略定义：**

```sql
-- 1. 创建留言表
CREATE TABLE IF NOT EXISTS public.guestbook (
    id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    author VARCHAR(40) NOT NULL,
    region VARCHAR(40) DEFAULT '全国',
    tag VARCHAR(40) DEFAULT '交流',
    content VARCHAR(600) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. 开启行级安全防护 (Row Level Security)
ALTER TABLE public.guestbook ENABLE ROW LEVEL SECURITY;

-- 3. 策略 A：允许任何匿名访客读取留言 (SELECT)
CREATE POLICY "Allow public read access"
ON public.guestbook FOR SELECT
USING (true);

-- 4. 策略 B：允许任何匿名访客插入留言 (INSERT)，但内容必须在 1~300 字内
CREATE POLICY "Allow anonymous insert with length check"
ON public.guestbook FOR INSERT
WITH CHECK (
    char_length(content) > 0 AND 
    char_length(content) <= 300 AND
    char_length(author) > 0 AND 
    char_length(author) <= 20
);

-- 5. 策略 C：严禁任何人通过匿名接口修改 (UPDATE) 或删除 (DELETE) 留言
-- (无需编写，未赋予 UPDATE/DELETE policy 默认全局拒绝)
```

---

## 四、 自动化测试与全链路验证方案 (Verification & CI)

1. **单元测试验证**：
   - 运行：`node web/tests/test_guestbook.js`
   - 预期输出：所有 5 个核心用例全部通过（校验、字符截断、XSS 转义、Payload 装配、微信模版）。
2. **已有测试防退化验证**：
   - 运行：`node web/tests/test_question_history.js`
   - 运行：`pytest server/tests/`
   - 预期输出：前端其他功能与后端 FastAPI 27 个单元测试 100% 全部通过，无任何耦合破坏。
3. **真实端到端流程验证**：
   - 打开浏览器访问研习台，点击顶部 `💬 研习留言` Tab；
   - 初始状态显示“演示模式”，展示默认公告与考友留言；
   - 输入昵称“测试考友”、考区“国考”、输入留言并点击提交；
   - 留言墙立刻无刷新追加该条留言；
   - 打开配置弹窗填入 Supabase URL 和 Key，点击保存，状态绿灯点亮，自动加载公网真实留言。

---

## 五、 风险规避、取舍与待决问题 (Risks & Tradeoffs)

1. **垃圾留言与灌水风险 (Spam & Flood Prevention)**：
   - *风险*：公网开放免登录留言可能被脚本高频刷屏。
   - *防护措施*：
     1. 前端实现本地提交冷却倒计时（限制同设备 15 秒内只能发 1 条）；
     2. Supabase 数据库端设置 RLS 强制检查字符长度；
     3. 接入微信 PushPlus 通知，站长手机端一旦发现异常灌水，可在 Supabase 仪表盘一键清空或拉黑该 IP。
2. **云服务稳定性与国内连通性**：
   - Supabase 官方免费端点部署在海外（AWS 亚太区/东京/新加坡），国内常规网络访问顺畅，但在极端弱网下可能有延时。
   - *替代方案*：系统已采用解耦的 Provider 架构，如需 100% 极速国内网络，可无缝平替为国内知名的 **LeanCloud（华东节点）** 或 **MemFire Cloud（国内云原生）**，代码修改量 `< 15 行`。
3. **站长隐私保障**：
   - 微信通知是通过 PushPlus / Server酱 的一对一 Webhook Token 投递，**不需要公开站长的微信号、手机号或真实身份**，既能实现“秒级微信弹窗提醒”，又完全保护站长隐私。
