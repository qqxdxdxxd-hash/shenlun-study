# 申论智能研习台（Shenlun Web OS）
## 产品需求文档 (PRD) 与 系统架构设计文档 (Architecture)

*版本：v2.0.0（纯客户端存储 + 无状态服务端纯算力架构）*  
*编制日期：2026-09-21*  
*产品定位：基于考场纸上手写作答、采分点多维色谱穿透、个人记忆双向复利的现代 Web 申论学习服务。严格践行“零服务端数据留存（Zero-Knowledge / Zero-Retention）”，所有作答、记忆卡片与病灶档案 100% 存储与检索于用户浏览器本地（IndexedDB），未来无缝对接用户私有云。*

---

# 第一部分：产品需求文档 (PRD)

## 1. 产品定位与核心设计哲学

### 1.1 核心转变：为什么必须是“浏览器端存储与检索”？
1. **考生隐私绝对保护（Zero-Retention）**：申论作答与个人错题具有强烈的个人心智与私密属性，考生对第三方服务器存储自己的作答内容高度敏感。新架构承诺**服务端不设任何用户数据库、不存任何答卷、不存任何记忆卡片**，用完即焚。
2. **数据资产完全归属考生**：所有个人名言金句、对策库、跨试卷病灶图谱均持久化保存在浏览器本地（IndexedDB）。提供醒目的数据体检与 JSON 备份提醒，未来支持接入用户自己的 WebDAV / GitHub Gist 云端同步（Bring Your Own Storage）。
3. **极速本地检索（In-Browser Retrieval）**：考生平时积累的记忆卡片，直接在浏览器端通过轻量分词与 BM25 算法实时检索，只有在提交批改时，才将与题目匹配的素材作为 Prompt 增强参数传给无状态后端，私密且高效。

---

## 2. 核心用户流程图

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                        考生在“申论智能研习台”的完整使用旅程                            │
│                                                                                        │
│  [1. 线下纸面作答] ──(真实试卷上手写，练时间感)──> [2. 敲入作答文本]                  │
│                                                          │                             │
│  ┌───────────────────────────────────────────────────────┴──────────────────────────┐  │
│  │ 浏览器本地客户端 (IndexedDB + 客户端检索引擎)                                     │  │
│  │  - 自动召回考生记忆库中与该题匹配的【已背名言/对策】 (Top-K)                      │  │
│  │  - 连同作答文本、题型参数，打包发起无状态批改请求                                  │  │
│  └───────────────────────────────────────┬──────────────────────────────────────────┘  │
│                                          │ HTTPS (Stateless Request / SSE Stream)      │
│  ┌───────────────────────────────────────▼──────────────────────────────────────────┐  │
│  │ 无状态 AI 服务端 (Stateless Engine - 零数据留存)                                   │  │
│  │  - 动态挂载名师 Skill (张传响材料作文/周昊公文/单一题)                             │  │
│  │  - 锚定历年真题官方采分底稿，调度 LLM 进行多维色谱计算                            │  │
│  │  - 执行记忆激活率审计，生成限制性一类文示范，生成 3 分钟靶向微练习                 │  │
│  │  - 流式推回前端，服务端内存即刻释放，不落盘、不存库！                               │  │
│  └───────────────────────────────────────┬──────────────────────────────────────────┘  │
│                                          │ 结果推回                                    │
│  ┌───────────────────────────────────────▼──────────────────────────────────────────┐  │
│  │ 浏览器本地客户端闭环消费与沉淀                                                    │  │
│  │  - 渲染【全真多维色谱】(原词绿/大词黄/漏点红/臆造紫/流水账灰)                     │  │
│  │  - 渲染【原文 vs 升华一类文】Git-style 左右对照 (标明考生记忆库调用徽章)          │  │
│  │  - 弹出【3分钟微练习靶向补丁】(当场改写大白话，即刻切除病灶)                      │  │
│  │  - 写入本地 IndexedDB：更新认知病灶图谱、记录 SM-2 复习状态                       │  │
│  │  - 顶部常驻：【💾 导出我的申论资产 JSON】及数据安全防护提示                       │  │
│  └──────────────────────────────────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. 详细功能需求规范

### 3.1 模块一：极简作答录入与真题底稿锚定
1. **题型分类选择**：
   - **单一题（小题）**：归纳概括、提出对策、词句阐释等（150~350字）；
   - **公文题（贯彻执行）**：公开信、发言稿、倡议书、简报等（300~600字）；
   - **材料大作文**：议论文/策论文（800~1200字）。
2. **真题官方底稿自动锚定**：
   - 选择预置真题（如国考副省/地市、各省省考、事业单位综应真题）时，系统自动挂载该题的**官方标准采分细则与原词清单**；
   - 杜绝通用大模型无据打分、前后口径不一的幻觉。
3. **录入辅助**：
   - 仅作文字输入与实时字数核算，不搞复杂虚拟格纸；
   - 快速硬伤提示：如标题含书名号即时出现醒目黄色角标。

---

### 3.2 模块二：题型专属【全真多维色谱穿透比对】
不同题型对应严谨的字符级色谱标准，让考生一眼看穿失分原因：

| 题型 | 色谱标记 | 视觉样式 | 阅卷意义与评判逻辑 |
| :--- | :--- | :--- | :--- |
| **单一题** | 🟢 命中原词 | 绿色实线底纹 | 精准踩中材料采分关键词（命中阅卷关键词库，加要点分） |
| | 🟡 规范大词 | 黄色波浪下划线 | 材料大白话成功提炼为政务公文大词（同义替换给分） |
| | 🔴 漏采要点 | 红色虚线回显框 | 标注：“*材料第X段核心采分点【……】考生未提取*” |
| | 🟣 主观臆造 | 紫色删除线 | 材料中全无支撑、自编主观论述（考官视线直接跳过，零分） |
| **公文题** | 🔵 格式五要素 | 蓝色外框标签 | 标题居中/主送称谓冒号/发文事由/正文分类/落款日期，逐项判定得分与扣分依据 |
| | 🟢 事务采分点 | 绿色实线高亮 | 具体落实措施、工作方案等硬核内容分 |
| | 🟠 口吻与排比 | 橙色实线高亮 | 对下号召力句式、对上汇报口吻、对仗小标题美化分 |
| **大作文** | 🟢 核心立意 | 绿色加粗底纹 | 首段尾句总论点、正文三段首句分论点（核对是否为“1+3”严整结构） |
| | 🔵 深度剖析 | 天蓝底色 | 事例后跟进的因果分析、假设论证、辩证剖析 |
| | ⚪ 故事流水账 | 浅灰底色 | 纯案例叙述、堆砌人名。**若某段灰底 >60%，警示：“典型事例堆砌无深析，扣2分”** |
| | ⚠️ 抄材料超标 | 黄色闪烁外框 | 连续抄录材料超 15 字处，若全文摘抄比例 **>20% 红线**，强力报警并预扣分 |

---

### 3.3 模块三：纯客户端个人申论记忆库与双向复利 (Client-Side Memory Bank & MAR)
1. **本地存储与 SM-2 艾宾浩斯复习**：
   - 卡片存储于浏览器 IndexedDB；
   - 字段包括：主题分类（政治/经济/文化/社会/生态/党建/基层治理）、标签、标题、金句/对策原文、复习次数、间隔天数、下次复习时间；
   - 提供独立“今日背诵”模块，基于 SM-2 算法调度每日复习。
2. **纯前端智能召回与 Prompt 注入**：
   - 考生输入题目后，前端在本地执行分词匹配，提取与当前作答主题最契合的 2~3 条记忆卡片；
   - 提交批改时，将这几条已背素材随作答一并发送给无状态批改后端。
3. **逆向记忆激活率审计（Memory Hit Rate）**：
   - 诊断考生：“*你在论述基层治理时，成功调用了背过的《枫桥经验三件套》；但第三段对策表述空泛，未调动你已背熟的《基层减负六字诀》*”。
4. **限制性可复现一类文示范重写**：
   - AI 在生成示范文时受强指令约束：**必须优先把考生记忆库中的素材无缝融入示范文**；
   - 每处融入点旁标有徽章（如 `[来自我的记忆库: 新质生产力]`），考生看改写范文是亲切熟悉的，考场上 100% 能够复现。
5. **划词一键入库**：
   - 无论在批改报告、色谱分析还是范文中，划选任意精彩字句，点击悬浮气泡一键存入本地记忆库。

---

### 3.4 模块四：跨试卷的“申论认知病灶图谱”（浏览器端追踪思维基因缺陷）
1. **长期缺陷追踪**：
   - 数据保存在本地 IndexedDB `dossier` 表中；
   - 追踪 5 大基因缺陷发生率：
     - **要素混淆率**（问原因答对策的频率）；
     - **材料依附度**（历次作答抄袭材料比例走势）；
     - **总论点后置率**（总论点未压在首段末句的次数）；
     - **对策假大空度**（充斥“加强领导/提高认识”等无实质内容套话的密度）；
     - **叙述流水账度**（大作文论据中事实叙述占比过高）。
2. **顽固病灶锁定**：
   - 连续 3 次犯同类错误，标记为【一级顽固病灶】，并在首页及作答前置提示区强力置顶警示。

---

### 3.5 模块五：靶向微练习补丁引擎 (Remediation Drill)
* **当场切除病灶**：批改返回时，后端根据本次作答中的扣分点，即时返回 3 道微补丁题：
  - **题型 1【大白话洗练】**：将考生原文中的大白话（如“老百姓都不配合工作”）改写为 2 个 8 字以内政务规范动宾大词；
  - **题型 2【要素精炼】**：剔除材料某段 150 字案例水分，压缩为 40 字动宾对策；
  - **题型 3【动宾对仗】**：为散乱观点拟定 3 个结构对称的前置小标题。
* 考生直接在弹窗中敲入答案，无状态后端秒判，3 分钟内完成针对性纠偏。

---

### 3.6 模块六：数据安全防护与私有云备份
1. **醒目安全防线**：
   - 页面顶部常驻提示栏：“🛡️ **本地隐私模式已生效**：您的所有作答、批改报告与记忆库均安全保存在您的当前浏览器内，服务端绝不存储任何数据。”
2. **JSON 全量数据备份与还原**：
   - 支持一键导出 `shenlun_backup_YYYYMMDD.json`（包含全部记忆卡片、作答历史、病灶数据）；
   - 更换设备或清理缓存后，一键导入还原；
   - 智能提醒：检测到未备份作答超过 3 篇或距离上次备份超过 7 天，温和提示导出。
3. **未来路线：用户私有云同步 (BYOS - Bring Your Own Storage)**：
   - 预留 WebDAV（坚果云等）和 GitHub Gist 私有同步接口，由用户自主输入配置，前端直连同步，不经过我们的中心服务器。

---

# 第二部分：系统架构设计文档 (Architecture)

## 1. 整体架构拓扑图

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                        前端展现与客户端存储层 (Modern Web SPA)                         │
│                                                                                        │
│  ┌──────────────────────────┐  ┌──────────────────────────┐  ┌──────────────────────┐  │
│  │   UI 视图与交互组件      │  │    多维色谱标注渲染器    │  │  Git-style Diff 对比 │  │
│  │   (作答/复习/看板/补丁)  │  │    (Chroma Highlighting) │  │  (原文 vs 记忆范文)  │  │
│  └─────────────┬────────────┘  └─────────────┬────────────┘  └──────────┬───────────┘  │
│                │                             │                          │              │
│  ┌─────────────▼─────────────────────────────▼──────────────────────────▼───────────┐  │
│  │                    客户端数据与检索中枢 (Client Data & Retrieval Hub)            │  │
│  │                                                                                  │  │
│  │  ┌───────────────────────────────┐        ┌───────────────────────────────────┐  │  │
│  │  │   本地浏览器存储 (IndexedDB)   │        │     纯客户端检索引擎 (Mini-RAG)   │  │  │
│  │  │   - memories (记忆库与SM-2)   │        │     - 基于语义词典 + 标签权重     │  │  │
│  │  │   - submissions (作答记录)    │        │     - 针对题目毫秒级召回 Top-K   │  │  │
│  │  │   - reports (色谱报告与范文)  │        │     - 逆向匹配作答文本已用素材    │  │  │
│  │  │   - dossier (认知病灶档案)    │        │     - 零外部请求，完全离线计算    │  │  │
│  │  └───────────────────────────────┘        └───────────────────────────────────┘  │  │
│  │                                                                                  │  │
│  │  ┌────────────────────────────────────────────────────────────────────────────┐  │  │
│  │  │  数据安全管理器 (Data Safety Manager)                                      │  │  │
│  │  │  - JSON 全量导出/导入清洗验证                                              │  │  │
│  │  │  - 离线缓存 Service Worker (PWA)                                           │  │  │
│  │  │  - 未来扩展：WebDAV / GitHub Gist 私有直连同步通道                         │  │  │
│  │  └────────────────────────────────────────────────────────────────────────────┘  │  │
│  └───────────────────────────────────────────┬──────────────────────────────────────┘  │
└──────────────────────────────────────────────┼─────────────────────────────────────────┘
                                               │ HTTPS REST / Server-Sent Events (SSE)
                                               │ Payload: 作答 + 题型 + 客户端召回的记忆素材
                                               │ (不带任何用户鉴权，零会话绑定)
┌──────────────────────────────────────────────▼─────────────────────────────────────────┐
│                    无状态算力服务端 (Stateless Fast AI Engine - Zero DB)                │
│                                                                                        │
│  ┌──────────────────────────────────────────────────────────────────────────────────┐  │
│  │ 1. 动态 Skill 仓库挂载器 (Skill Registry)                                       │  │
│  │    - 解析本地 skills/ 目录下的 SKILL.md (张传响大作文 / 周昊公文 / 单一题)        │  │
│  │    - 提取评分细则、20%抄袭红线、四维打分量化表                                   │  │
│  ├──────────────────────────────────────────────────────────────────────────────────┤  │
│  │ 2. 真题采分底稿仓库 (Ground Truth Rubrics)                                       │  │
│  │    - 内置历年国考/省考/联考官方标准采分清单，消除模型打分幻觉                    │  │
│  ├──────────────────────────────────────────────────────────────────────────────────┤  │
│  │ 3. 多维色谱与规则前检器 (Chroma Engine)                                          │  │
│  │    - 快速计算字数、标题格式硬伤、连续抄袭材料比例（>20%红线预警）                │  │
│  │    - 生成字符偏移量 [start, end, type, color, comment] 标注数组                  │  │
│  ├──────────────────────────────────────────────────────────────────────────────────┤  │
│  │ 4. 记忆增强一类文重塑器 (MAR - Memory-Augmented Rewriter)                        │  │
│  │    - 接收客户端注入的记忆素材，强制重塑一类文，打上 [来自记忆库] 角标            │  │
│  ├──────────────────────────────────────────────────────────────────────────────────┤  │
│  │ 5. 靶向微练习补丁生成器 (Remediation Generator)                                  │  │
│  │    - 提取作答中的大白话与漏点，现场生成 3 道靶向微练习                           │  │
│  └──────────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                        │
│   处理完毕即刻通过 SSE / JSON 流式推回前端，服务端内存瞬间销毁，不写任何本地或云端数据库 │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. 客户端存储设计 (IndexedDB Schema)

前端使用原生 IndexedDB（数据库名：`ShenlunExamDB`，版本：1）：

```javascript
// web/db.js - 客户端数据库结构定义
const DB_NAME = 'ShenlunExamDB';
const DB_VERSION = 1;

function openDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = (event) => {
      const db = event.target.result;

      // 1. 个人申论记忆库表 (含 SM-2 艾宾浩斯参数)
      if (!db.objectStoreNames.contains('memories')) {
        const memStore = db.createObjectStore('memories', { keyPath: 'id' });
        memStore.createIndex('category', 'category', { unique: false });
        memStore.createIndex('tag', 'tag', { unique: false });
        memStore.createIndex('nextReview', 'nextReview', { unique: false });
      }

      // 2. 作答记录表
      if (!db.objectStoreNames.contains('submissions')) {
        const subStore = db.createObjectStore('submissions', { keyPath: 'id' });
        subStore.createIndex('questionType', 'questionType', { unique: false });
        subStore.createIndex('createdAt', 'createdAt', { unique: false });
      }

      // 3. 批改色谱与报告表
      if (!db.objectStoreNames.contains('reports')) {
        const repStore = db.createObjectStore('reports', { keyPath: 'id' });
        repStore.createIndex('submissionId', 'submissionId', { unique: true });
        repStore.createIndex('createdAt', 'createdAt', { unique: false });
      }

      // 4. 认知病灶图谱表 (跨试卷缺陷)
      if (!db.objectStoreNames.contains('dossier')) {
        const dosStore = db.createObjectStore('dossier', { keyPath: 'id' });
        dosStore.createIndex('errorDimension', 'errorDimension', { unique: false });
        dosStore.createIndex('severity', 'severity', { unique: false });
      }

      // 5. 靶向微练习记录表
      if (!db.objectStoreNames.contains('drills')) {
        const drillStore = db.createObjectStore('drills', { keyPath: 'id' });
        drillStore.createIndex('submissionId', 'submissionId', { unique: false });
        drillStore.createIndex('isPassed', 'isPassed', { unique: false });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}
```

---

## 3. 纯客户端智能检索引擎 (In-Browser Mini-RAG)

无需服务端与向量数据库，前端直接运行轻量高效的语义相关性评分，实现完全私密的记忆召回：

```javascript
// web/retrieval.js - 客户端检索与记忆召回器
export class ClientMemoryEngine {
  constructor(db) {
    this.db = db;
  }

  /**
   * 根据题干与考生作答，毫秒级召回最相关的个人记忆素材
   */
  async recallTopMemories(topic, userText, topK = 3) {
    const allMemories = await this.getAllMemories();
    if (!allMemories.length) return [];

    // 提取题干与开头段核心实词词元
    const tokens = this.tokenize(`${topic} ${userText.slice(0, 300)}`);

    const scored = allMemories.map(mem => {
      let score = 0;
      const memCorpus = `${mem.category} ${mem.tag} ${mem.title} ${mem.content}`;

      // 1. 词频匹配
      tokens.forEach(tok => {
        if (memCorpus.includes(tok)) score += 2;
      });

      // 2. 标签与领域强命中加权
      if (topic.includes(mem.category) || topic.includes(mem.tag)) {
        score += 6;
      }

      // 3. SM-2 熟练度加权（背得更熟的素材优先推荐调用）
      if (mem.repetitions >= 2) score += 1;

      return { mem, score };
    });

    scored.sort((a, b) => b.score - a.score);
    return scored.filter(s => s.score > 0).slice(0, topK).map(s => s.mem);
  }

  tokenize(text) {
    return text
      .replace(/[^\u4e00-\u9fa5a-zA-Z0-9]/g, ' ')
      .split(/\s+/)
      .filter(w => w.length >= 2);
  }

  async getAllMemories() {
    const tx = this.db.transaction('memories', 'readonly');
    const store = tx.objectStore('memories');
    return new Promise(resolve => {
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result || []);
    });
  }
}
```

---

## 4. 无状态算力服务端接口规范 (Stateless API)

服务端基于 Python FastAPI 实现，只接收计算请求，内存处理后推回，**零持久化层**。

### 4.1 核心批改接口
* **Endpoint**: `POST /api/stateless/review`（支持 SSE 推流）
* **Request Payload**:
  ```json
  {
    "question_type": "essay",
    "question_title": "以绿色发展理念引领中国式现代化",
    "materials": "给定资料...",
    "user_answer": "考生纸面手写后录入的文字...",
    "recalled_memories": [
      {
        "id": "mem_101",
        "title": "生态优先论述",
        "content": "协同推进降碳、减污、扩绿、增长..."
      }
    ],
    "ground_truth_id": "gk_2025_01" 
  }
  ```
* **Response Event Stream (SSE)**:
  1. `event: pre_scan`:
     ```json
     {"word_count": 1042, "copy_ratio": 0.16, "copy_redline_exceeded": false, "title_issues": []}
     ```
  2. `event: chroma_spans`:
     ```json
     [
       {"start": 0, "end": 16, "color": "green", "label": "精准对仗标题"},
       {"start": 120, "end": 156, "color": "green", "label": "首段末句总论点"},
       {"start": 210, "end": 280, "color": "gray", "label": "纯故事叙述(缺乏深析)"},
       {"start": 410, "end": 435, "color": "yellow", "label": "照搬材料原句"}
     ]
     ```
  3. `event: multi_perspectives`:
     ```json
     {
       "zhang_chuanxiang": {"score": 32, "grade": "一类文", "diagnosis": "..."},
       "zhou_hao": {"score": 31.5, "comments": "..."},
       "examiner_speed": {"impression": "结构整齐，分论点醒目"}
     }
     ```
  4. `event: memory_audit`:
     ```json
     {
       "activation_rate": 0.5,
       "activated": ["生态优先论述"],
       "missed_opportunities": ["你在第3段对策本可引用已背熟的《人居环境三件套》"]
     }
     ```
  5. `event: exemplar_rewritten`:
     ```json
     {
       "text": "升华后的一类文示范全文...",
       "memory_badges": [{"offset": 230, "memory_title": "生态优先论述"}]
     }
     ```
  6. `event: remediation_drills`:
     ```json
     [
       {"id": "drill_1", "type": "colloquial_to_formal", "question": "请将原句‘上面钱发不下来’改为规范政务动宾大词"}
     ]
     ```

### 4.2 3分钟微练习秒判接口
* **Endpoint**: `POST /api/stateless/verify-drill`
* **Request Payload**:
  ```json
  {
    "drill_type": "colloquial_to_formal",
    "original_flaw": "村里没钱做不了事",
    "user_input": "基层财政保障不足"
  }
  ```
* **Response**:
  ```json
  {"passed": true, "score": 95, "feedback": "提炼精准，准确将大白话转换为规范政务术语。"}
  ```

---

## 5. 项目工程拓扑 (Directory Layout)

```
E:/work/exam/shenlun-web/
├── web/                           # 纯静态前端 (托管于任何静态托管/本地浏览器)
│   ├── index.html                 # 主单页结构
│   ├── styles.css                 # 考场风格极简样式
│   ├── app.js                     # 视图路由与事件总线
│   ├── db.js                      # IndexedDB 客户端存储底座
│   ├── retrieval.js               # 纯客户端 Mini-RAG 检索引擎
│   ├── chroma_renderer.js         # 全真多维色谱标记高亮引擎
│   ├── diff_viewer.js             # 原文 vs 记忆一类文对比器
│   ├── backup.js                  # JSON 导出/导入/体检告警模块
│   └── manifest.json              # PWA 桌面应用配置
├── server/                        # 极轻量无状态 AI 算力后端 (Zero DB)
│   ├── skills/                    # 动态挂载名师 Skill 仓库
│   │   ├── shenlun-essay-review/
│   │   ├── shenlun-gongwen-review/
│   │   └── shenlun-single-question/
│   ├── rubrics/                   # 历年真题官方采分底稿 JSON
│   ├── src/
│   │   ├── config.py              # LLM Base URL & API Key
│   │   ├── skill_loader.py        # SKILL.md 解析器
│   │   ├── chroma_scanner.py      # 字符级色谱与抄袭率红线扫描
│   │   ├── mar_rewriter.py        # 限制性一类文重构器 (Prompt Assembly)
│   │   ├── drill_generator.py     # 靶向微练习生成器
│   │   ├── api.py                 # FastAPI 无状态接口
│   │   └── main.py                # 服务启动入口
│   ├── tests/                     # 完备单元测试
│   └── requirements.txt           # 仅需 fastapi, uvicorn, pydantic, httpx
└── start.bat                      # 本地一键唤起前端与算力引擎
```

---

## 6. 实施任务与阶段规划 (Roadmap)

| 阶段 | 周期 | 核心里程碑 | 验收标准 |
| :--- | :--- | :--- | :--- |
| **M1: 客户端存储与检索** | Day 1 | 完成 `web/db.js` (IndexedDB) 与 `web/retrieval.js` (Mini-RAG) | 单元测试通过：支持存储 500+ 张记忆卡片，输入主题能在 5ms 内准确召回对应素材 |
| **M2: 数据备份与安全** | Day 2 | 完成 `web/backup.js` 全量 JSON 导出导入、数据清洗、安全合规提示徽章 | 成功导出并在无痕模式浏览器中 100% 还原作答与记忆库数据 |
| **M3: 无状态色谱引擎** | Day 3 | 完成 `server/src/chroma_scanner.py`，实现原词命中、大词替换、20%抄袭率红线前检 | 单元测试通过：准确输出字符偏移量数组，抄袭超 20% 精准触发警告 |
| **M4: 限制性重写与微练习** | Day 4 | 完成 `mar_rewriter.py` 与 `drill_generator.py`，打通名师 Skill 与客户端注入素材 | 成功根据考生注入的卡片生成带徽章的一类文示范，并产出 3 道微补丁题 |
| **M5: 前端色谱高亮与工作台** | Day 5 | 完成 `web/chroma_renderer.js` 与 `diff_viewer.js`，实现题型专属色谱视觉穿透与 Diff 对比 | 页面呈现绿色命中、黄色波浪大词、红色虚线漏点、紫色删除线臆造与灰色流水账 |
| **M6: 全链路联调与真题实测** | Day 6 | 用一篇真实申论作答进行完整端到端实测，验证“零服务端数据留存”与“本地复利闭环” | 成功完成一次完整作业流，确认服务端无任何用户数据落盘 |
