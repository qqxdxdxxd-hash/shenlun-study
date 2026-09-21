# 申论智能研习台（Shenlun Study）前端界面设计规范与 AI 绘图 Prompt

本文件导出当前系统的全部前端功能分区、视觉色谱规范、以及可直接复制投喂给生图 AI（如 Midjourney / Flux / DALL-E 3 / Stable Diffusion）的高精度 UI Mockup 提示词。

---

## 一、AI 绘图生图专用 Prompt（可直接复制投喂 Midjourney / Flux）

### 1. 核心批改工作台（全真多维色谱 + 双栏对比）Prompt

#### 英文 Prompt (Midjourney / Flux / DALL-E 3 最佳)：
```text
A high-fidelity modern desktop web application UI mockup for an intelligent Chinese civil service essay study platform called "Shenlun Study" (申论研习台).
Layout style: Clean modern B2B SaaS dashboard, Figma UI design, 8k resolution, minimalist aesthetic, subtle drop shadows, refined borders, premium typography (PingFang SC, Inter).
Top Navigation Bar: Clean white or dark slate header. Left side: modern ink-stone emblem logo with text "申论研习台". Center: dropdown selector "2025年国考副省级·真题卷". Right side: green security badge with shield icon saying "🛡️ 本地隐私沙箱已生效 (0云端存储)", button for "个人记忆库 (SM-2)", and "设置 (BYOK Key)".
Main Content: Two-column split-screen layout (50/50 ratio):
- Left Column (Essay Submission & Pre-scan Panel): Clean card container. Top shows question prompt and word counter "1042 / 1000字". A clean text area displaying the candidate's Chinese handwritten-style input. Underneath, a pre-scan status bar showing green/yellow tags: "摘抄率 14% (安全)", "标题规范: 合规", "自动匹配个人已背记忆卡片: 2条". A floating segmented control to toggle between "单Skill极速批改" and "多Agent协同切磋". A primary CTA button "开始考场级多方位深度批改".
- Right Column (Chromatographic Diagnostic & Exemplar Panel):
  1. Score overview header with an overall score badge "32.5 / 35分 (一类文)" and a compact 5-axis radar chart.
  2. The candidate's text highlighted with distinct chromatographic review colors:
     - Emerald green solid underlines for matched source keywords (精准踩中原词)
     - Amber yellow wavy underlines for government formal terms (规范大词替换)
     - Dotted red inline tags for missed key points (漏采点回显)
     - Muted purple strikethrough for fabricated text (主观臆造)
     - Subtle light-gray background blocks for story-telling narrative leaks (流水账预警)
  3. Reverse Memory Audit Card: highlighting "已调动背诵记忆: 《新质生产力论述》".
  4. Memory-Augmented Exemplar Box: polished exemplar essay with small purple badges like "[来自记忆库 #42]".
  5. 3-Minute Remediation Drill card at bottom with a quick input box to fix colloquial words.
Color Palette: Elegant Chinese academic slate blue (#1e293b), emerald green (#10b981), amber (#f59e0b), coral red (#ef4444), soft indigo (#6366f1), clean white cards on subtle light gray background (#f8fafc). --ar 16:9 --v 6.1 --q 2
```

---

### 2. 个人记忆库与 SM-2 艾宾浩斯复习看板 Prompt

#### 英文 Prompt (Midjourney / Flux / DALL-E 3 最佳)：
```text
A modern desktop SaaS dashboard UI mockup for a personal memorization and flashcard system in an exam preparation tool called "Personal Memory Hub" (个人申论记忆库).
Layout: Bento grid layout with elegant soft pastel accent cards on a clean light gray canvas (#f8fafc).
Header: "个人申论记忆库 · 艾宾浩斯双向复利闭环", with search bar "检索已背金句、对策、典故", and an action button "+ 新增记忆卡片 / 导入".
Top Summary Cards:
- Card 1: "今日待复习卡片: 12张", circular progress ring 65% completed.
- Card 2: "已收录金句对策: 156条", categorized by tags (#基层治理, #新质生产力, #生态文明, #乡村振兴).
- Card 3: "考场写作调动率: 78%", showing an upward sparkline trend.
Main Section:
- Left Sub-panel: Category filter tabs (全部, 政治理论, 经济高质量发展, 社会民生, 生态文明, 基层对策, 考场金句).
- Center Sub-panel: An interactive Anki SM-2 flashcard card being reviewed: front shows "【基层治理·形式主义】枫桥经验对策三件套", back flipped showing bullet points with key phrases highlighted in blue. Bottom has 3 rating buttons: "❌ 遗忘 (10分钟后)", "🟡 模糊 (3天后)", "🟢 秒答 (6天后)".
- Right Sub-panel: "近期作答自动唤醒建议" list showing which essays successfully utilized memorized cards.
Design Style: Notion-like minimal aesthetic, clean cards with rounded corners, subtle shadows, crisp icons, high legibility typography. --ar 16:9 --v 6.1 --q 2
```

---

### 3. 跨试卷认知病灶图谱与 3 分钟微练习补丁 Prompt

#### 英文 Prompt (Midjourney / Flux / DALL-E 3 最佳)：
```text
A modern SaaS analytics and remediation dashboard UI mockup for "Cognitive Defect Dossier" (申论认知病灶图谱).
Layout: Diagnostic healthcare-style report aesthetic for learning disabilities and exam habits.
Top Section: Alert banner in light crimson background with warning icon: "⚠️ 发现【一级顽固病灶】：大作文总论点后置率达 66% (近3篇有2篇未压在首段末句)".
Middle Section (Analytics Grid):
- Chart 1: 5-dimension Cognitive Defect Radar (要素混淆率, 材料过度依附度, 论点后置率, 对策假大空度, 叙述流水账度).
- Chart 2: Material Copy Ratio trendline over 10 essays, with a dashed red line at "20% 扣分警戒红线", showing current essays staying safely at 14%.
Bottom Section (Remediation Drills):
- An interactive card "3分钟靶向微练习 · 当场切除病灶":
  - Prompt: "请将你在作答中出现的口语大白话‘老百姓都不想干这活’改写为两个8字以内的政务动宾规范大词。"
  - An input box with candidate's typed answer "基层动员不足，群众参与度低".
  - A green badge "✓ 判定通过 (秒判得分: 95分) · 已切除本次语言病灶".
Design Style: Dark/Light hybrid slate blue dashboard, high contrast, clean typography, scientific diagnostic feel. --ar 16:9 --v 6.1 --q 2
```

---

## 二、前端全页面 UI 规格与视觉布局详解（中文对照版）

整个系统界面分为 **1 个全局顶栏 + 4 大核心工作区**：

```
┌─────────────────────────────────────────────────────────────────────────────────────────────────┐
│ [Logo 申论智能研习台]   [真题选择下拉框 ▾]   [知识库]   [记忆库]   [🛡️本地隐私沙箱生效]   [⚙️设置BYOK]  │
├────────────────────────────────────────────────┬────────────────────────────────────────────────┤
│            【左栏：作答与预检工作区】            │           【右栏：全真多维色谱批改工作区】       │
│                                                │                                                │
│ 📌 题目：2025年国考地市级·大作文               │ 🏆 综合评定：32.5分 / 35分 (一类文)            │
│ 题干：围绕“平衡与发展”自拟标题写一篇议论文。   │ [立意11.5] [结构7.5] [论据9.5] [文风4.0]       │
│                                                │ ────────────────────────────────────────────── │
│ ✍️ 考生纸面手写后录入的文本：                 │ 🌈 原文逐句色谱穿透高亮：                      │
│ ┌────────────────────────────────────────────┐ │  以生态底色绘就高质量发展新卷 (🟢高分标题)    │
│ │ 《以生态底色绘就高质量发展新卷》           │ │  ……良好生态本身就是生产力(🟢首段末句总论点)  │
│ │ ……（考生手写后录入的完整文本）            │ │  张某投身乡村种植果树…… (⚪灰底：纯叙述流水账)│
│ │                                            │ │  大力推进绿色循环农业…… (🟡黄波浪：规范大词)  │
│ └────────────────────────────────────────────┘ │  老百姓不爱参与 (🟣删除线：大白话语病)         │
│                                                │  [第3段遗漏点：资金链断裂] (🔴红色虚线框回显)   │
│ 📊 实时前置扫描状态条：                        │ ────────────────────────────────────────────── │
│ • 实测字数：1042 字 (合规区间)                 │ 💡 逆向记忆激活率审计：                         │
│ • 材料摘抄率：14.2% (🟢安全，未触犯20%红线)    │ • 成功调动已背卡片：《新质生产力论述》         │
│ • 格式扫描：标题合规、无书名号                 │ • 未调动提示：第3段可调用《人居环境三件套》    │
│ • 本地记忆库自动召回：2条匹配素材              │ ────────────────────────────────────────────── │
│                                                │ ✨ 限制性一类文示范 (100%基于考生记忆库重塑)   │
│ 🎛️ 批改模式切换：                              │ “……协同推进降碳减污 [🏷️记忆库#42]……”          │
│ (•) 单Skill极速模式   ( ) 多Agent切磋综合评定  │ ────────────────────────────────────────────── │
│                                                │ 🎯 3分钟靶向微练习 (当场切除语言病灶)          │
│ [ 🚀 开始考场级多视角深度批改 ]                │ “请将‘老百姓不爱参与’改写为8字内规范大词：”    │
│                                                │ [ 群众主体参与积极性不足 ] [ 提交即时秒判 ]    │
└────────────────────────────────────────────────┴────────────────────────────────────────────────┘
```

---

## 三、视觉色谱全真规范表（供前端开发与 UI 审阅）

| 视觉标记 | 界面渲染样式 | 对应阅卷规则与心理模型 |
| :--- | :--- | :--- |
| **🟢 命中原词** | 浅翠绿背景底色 (`#d1fae5`) + 墨绿文字 (`#065f46`) | 精准踩中采分点关键词库，考官直接在评分软件勾选加分。 |
| **🟡 规范大词** | 亮金黄文字 + 金黄色波浪下划线 (`#d97706 wavy`) | 考生成功将材料口语提炼为政务大词（同义替换给分）。 |
| **🔴 漏采要点** | 红色虚线方框 (`#ef4444 dashed`) + 右侧浮动提示 | 材料中明明存在的硬分值要点，考生漏采，直接回显警示。 |
| **🟣 主观臆造** | 淡紫色删除线 (`#8b5cf6 line-through`) | 材料中毫无依据、考生自作聪明凭常识编写的散点，考官零分跳过。 |
| **⚪ 故事流水账** | 柔和浅灰色实心背景块 (`#f1f5f9`) | 大段叙述人物故事、罗列案例细节，缺乏事后深入制度剖析。 |
| **⚠️ 抄袭超标** | 琥珀黄外框闪烁 (`#f59e0b 2px pulse`) | 连续摘抄材料超 15 字且全文摘抄率突破 **20% 扣分红线**。 |

---

## 四、如何使用这些内容让 AI 生成效果图？

1. **如果你使用 Midjourney / Flux / DALL-E 3**：
   - 直接将上方 **第一部分** 中的 `英文 Prompt` 复制并发送给生成工具；
   - 建议使用 `--ar 16:9`（宽屏仪表盘比例）以获得完整的双栏排版。
2. **如果你使用 Claude Artifacts / v0.dev 等前端代码生成工具**：
   - 将整份文档完整贴入，输入指令：“*请根据这份 PRD 与视觉布局描述，使用原生 HTML + Tailwind CSS 生成一个可交互的高保真单页原型！*”
3. **如果你用于人工设计评审**：
   - 对照 **第二部分** 的 ASCII 布局图和 **第三部分** 的色谱规范表，确认双栏工作区和色谱视觉是否完全符合预期。
