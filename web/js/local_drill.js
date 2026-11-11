/**
 * 纯前端 MAR (Memory-Augmented Rewriting) 审计与 3 分钟微练习秒判规则引擎
 * 零 Python 后端依赖，100% 运行于浏览器前端。
 */

class LocalMARAudit {
  /**
   * 逆向记忆激活率审计：核验考生是否在作答中调动了本地召回的已背素材
   * @param {string} userAnswer 考生作答全文
   * @param {Array} recalledMemories 本地检索召回的记忆卡片列表
   */
  static auditMemoryActivation(userAnswer, recalledMemories = []) {
    if (!recalledMemories || recalledMemories.length === 0) {
      return {
        activation_rate: 0.0,
        activated: [],
        missed_opportunities: ["本地记忆库暂无匹配卡片，可在批改中一键收集金句入库"],
        activated_count: 0,
        total_recalled: 0
      };
    }

    const activated = [];
    const missed = [];
    const text = userAnswer || "";

    for (const m of recalledMemories) {
      const rawTitle = m.title || "";
      const titleClean = rawTitle.replace(/[《》]/g, "").trim();
      const content = m.content || "";
      // 提取内容中 4 字以上的意群短语
      const keyPhrases = content
        .split(/[，。；;,!\n]/)
        .map(p => p.trim())
        .filter(p => p.length >= 4);

      let hit = false;
      if (titleClean && text.includes(titleClean)) {
        hit = true;
      } else {
        for (const kp of keyPhrases) {
          if (text.includes(kp)) {
            hit = true;
            break;
          }
        }
      }

      if (hit) {
        activated.push(rawTitle.startsWith("《") ? rawTitle : `《${rawTitle}》`);
      } else {
        missed.push(`你在论述相关主题时用词较平，本可直接调动已背熟的《${titleClean}》`);
      }
    }

    const total = recalledMemories.length;
    const rate = Number((activated.length / Math.max(total, 1)).toFixed(2));
    return {
      activation_rate: rate,
      activated,
      missed_opportunities: missed,
      activated_count: activated.length,
      total_recalled: total
    };
  }

  /**
   * 题型解耦的标杆示范重写指引生成器
   */
  static buildMARPrompt(userAnswer, questionTitle, recalledMemories = [], questionType = 'essay', options = {}) {
    if (questionType === 'single') {
      return `
## 【标杆示范重写指引】：
请严格遵循已加载的单一题阅卷 Skill 规范，基于给定资料提炼的客观采分点，对考生作答进行考场标杆示范重写。
【严禁事项】：单一题严格以材料为唯一依凭，严禁注入未在材料中出现的外部时政理论或记忆库内容，字数严格控制在题目所限定的范围内。
`;
    }

    if (questionType === 'doc') {
      return `
## 【标杆示范重写指引】：
请严格遵循公文贯彻执行题阅卷规范，基于给定资料重构格式规范、内容完备、语体得当的考场公文范本。
`;
    }

    // essay 场景：动态字数区间 + 主题词全锚定 + 15字防照抄红线 + 真实记忆化用
    const minW = (options && options.minWords) ? Number(options.minWords) : 900;
    const maxW = (options && options.maxWords) ? Number(options.maxWords) : 1100;
    const targetLow = Math.max(minW, Math.round(maxW * 0.88));
    const targetHigh = Math.min(maxW, Math.round(maxW * 0.96));
    const theme = (typeof ExemplarFormatter !== 'undefined')
      ? ExemplarFormatter.extractCoreTheme(questionTitle)
      : (questionTitle || '').trim();

    const memBlock = [];
    if (recalledMemories && recalledMemories.length > 0) {
      memBlock.push("## 【考生个人已背诵素材库（仅在与段落语义契合时化用，严禁空挂伪标注）】：");
      recalledMemories.forEach((m, idx) => {
        memBlock.push(`${idx + 1}. 《${m.title}》：${m.content}`);
      });
    }
    const memStr = memBlock.length > 0 ? memBlock.join("\n") : "";

    return `
${memStr}
## 【大作文标杆示范重写指引】：
1. **严格字数红线（绝对硬约束）**：重塑后的纯正文总字数（含标题与标点，不含任何 [来自记忆库: ...] 标注）必须严格控制在 **${minW}~${maxW} 字** 之间（最佳目标 **${targetLow}~${targetHigh} 字**），绝对禁止超过 ${maxW} 字上限！
2. **核心主题词全锚定**：题干核心主题为【${theme}】。重写范文的**标题、首段尾句总论点以及正文三个分论点段首句**必须自然嵌入该核心主题词（或完整核心短语），不得被原稿偏置措辞带离题干；
3. **开头三步完整**：开头段必须包含“点题（引述/案例/背景）→ 解题（深入阐释主题词内涵与时代意义）→ 亮明含三大支柱的总论点”；
4. **材料深度改写禁止照抄**：对给定资料中的案例与政策表述进行缩写提纯与政务化转述，**禁止出现连续超过 15 字照抄材料原文的句子**；
5. **结尾完整收拢**：结尾段简练归纳前文三大分论点并回扣核心主题词；记忆库卡片仅在真正化用该卡片核心表述的句末标注 \`[来自记忆库: 卡片名]\`（无真正化用则不标注）。
`;
  }
}

class LocalDrillEngine {
  /**
   * 根据批改中识别出的口语大白话或语病，现场生成 3 分钟靶向微练习
   * @param {Array} quotesEvaluation 批改报告中的引用评注列表
   */
  static generateDrills(quotesEvaluation = []) {
    const drills = [];
    const colloquialQuotes = quotesEvaluation.filter(q => q.type === "colloquial_flaw");

    if (colloquialQuotes.length === 0) {
      // 兜底生成典型微练习
      drills.push({
        id: "drill_1",
        type: "colloquial_to_formal",
        flaw_text: "村里没钱做不了事，老百姓都不想管",
        question: "请将大白话‘村里没钱做不了事，老百姓都不想管’改写为 2 个 8 字以内的规范政务动宾大词。",
        hint: "建议从‘财政保障’、‘内生动力’等维度提炼。"
      });
      return drills;
    }

    colloquialQuotes.slice(0, 3).forEach((item, idx) => {
      const flaw = item.quote || item.comment || "大白话口语表达";
      drills.push({
        id: `drill_${idx + 1}`,
        type: "colloquial_to_formal",
        flaw_text: flaw,
        question: `请将你作答中出现的口语表述‘${flaw}’改写为规范政务动宾短语。`,
        hint: "提示：围绕机制、保障、动员或权责等维度提炼大词。"
      });
    });

    return drills;
  }

  /**
   * 3 分钟微练习即时秒判引擎 (确定性纯前端匹配)
   */
  static verifyDrill(drillType, flawText, userInput) {
    const userClean = (userInput || "").trim();
    if (!userClean) {
      return {
        passed: false,
        score: 0,
        feedback: "作答不能为空，请输入改写后的政务大词。"
      };
    }

    // 核心政务高频大词表
    const formalKeywords = [
      "保障", "机制", "健全", "完善", "匮乏", "权责", "统筹", "协同", "推进",
      "内生动力", "长效机制", "精细化", "制度约束", "引导", "落实", "规范",
      "短板", "瓶颈", "滞后", "拓宽", "优化", "赋能", "强化", "构建", "夯实",
      "提升", "深化", "盘活", "激活", "动能", "靶向", "闭环", "防范", "化解"
    ];

    const hitWords = formalKeywords.filter(w => userClean.includes(w));
    if (hitWords.length >= 1 && userClean.length <= 50) {
      return {
        passed: true,
        score: 90 + Math.min(hitWords.length * 3, 10),
        feedback: `✓ 提炼精准！命中核心政务大词【${hitWords.join("】【")}】，已成功切除思维病灶！`
      };
    } else {
      return {
        passed: false,
        score: 60,
        feedback: "⚠️ 建议提炼更具公文色彩的紧凑动宾短语（如：【强化财政保障】【健全激励机制】），剔除口语修饰词。"
      };
    }
  }
}

class ExemplarFormatter {
  static stripMemoryTags(text) {
    return (text || '')
      .replace(/\s*[\[【]来自记忆库\s*[:：]\s*[^\]】]+[\]】]/g, '')
      .replace(/[ \t]+\n/g, '\n')
      .trim();
  }

  static escapeHtml(text) {
    return (text || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  static renderExemplarHtml(text) {
    const escaped = this.escapeHtml(text || '');
    const withBadges = escaped.replace(
      /[\[【]来自记忆库\s*[:：]\s*([^\]】]+)[\]】]/g,
      '<span class="memory-badge" title="仅UI展示，复制纯净范文时自动过滤">🧠 记忆库：$1</span>'
    );
    return withBadges.replace(/\n/g, '<br>');
  }

  static extractCoreTheme(questionTitle) {
    const t = (questionTitle || '').trim();
    const m = t.match(/[“"《]([^”"》]{2,24})[”"》]/);
    return m ? m[1] : t.replace(/^(?:大作文[：:]\s*|第\d+题[（(][^）)]+[）)][：:]\s*|【问题[一二三四五]】\s*)/, '').slice(0, 24);
  }

  static auditExemplar(exemplarText, materials, questionTitle, minWords, maxWords, scanner) {
    const cleanText = this.stripMemoryTags(exemplarText);
    const cleanCharCount = cleanText.replace(/\s+/g, '').length;
    const minW = minWords || 800;
    const maxW = maxWords || 1100;
    const withinLimit = cleanCharCount >= minW && cleanCharCount <= maxW;

    const lines = cleanText.split('\n').map(l => l.trim()).filter(Boolean);
    const title = lines[0] || '';
    const theme = this.extractCoreTheme(questionTitle);
    const titleHasTheme = theme ? title.includes(theme) : true;

    let copyRatio = 0;
    let copySpansCount = 0;
    if (scanner && typeof scanner.detectCopyRedline === 'function' && materials) {
      const scanRes = scanner.detectCopyRedline(cleanText, materials, 15);
      copyRatio = scanRes.copyRatio || 0;
      copySpansCount = (scanRes.spans || []).length;
    }

    return {
      cleanText,
      cleanCharCount,
      minWords: minW,
      maxWords: maxW,
      withinLimit,
      overBy: cleanCharCount > maxW ? cleanCharCount - maxW : 0,
      shortBy: cleanCharCount < minW ? minW - cleanCharCount : 0,
      theme,
      titleHasTheme,
      copyRatio,
      copySpansCount
    };
  }
}

if (typeof window !== 'undefined') {
  window.LocalMARAudit = LocalMARAudit;
  window.LocalDrillEngine = LocalDrillEngine;
  window.ExemplarFormatter = ExemplarFormatter;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { LocalMARAudit, LocalDrillEngine, ExemplarFormatter };
}
