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
   * 构建限制性一类文重构 Prompt，强制融入考生记忆库并标注 [来自记忆库: 卡片标题]
   */
  static buildMARPrompt(userAnswer, questionTitle, recalledMemories = []) {
    const memBlock = [];
    if (recalledMemories && recalledMemories.length > 0) {
      memBlock.push("## 【考生个人已背诵记忆库（在重构范文时，必须优先无缝融合以下素材）】：");
      recalledMemories.forEach((m, idx) => {
        memBlock.push(`${idx + 1}. [${m.category || '申论'}·${m.tag || '素材'}] 《${m.title}》：${m.content}`);
      });
    }

    const memStr = memBlock.length > 0 ? memBlock.join("\n") : "（考生未注入特定记忆，请按照考场一类文标准重塑）";

    return `
你是一名资深公职阅卷名师。请基于考生的原始立意与素材脉络，重构一篇考场标杆一类文（1000~1100字）：

${memStr}

【题目】：${questionTitle || '申论综合研习'}
【考生原始作答】：
${userAnswer}

【重构硬性铁律】：
1. 100% 保持考生的立意主线与材料方向，绝不天马行空另起新论点；
2. 论点必须置于段首，采用“1+3”严整大五段结构；
3. 凡在行文中成功融入上述考生已背素材的句子，必须在句末清晰标注：[来自记忆库: 卡片标题]；
4. 语言规范化、公文化、短句化，打造 32+ 分标杆示范。
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

if (typeof window !== 'undefined') {
  window.LocalMARAudit = LocalMARAudit;
  window.LocalDrillEngine = LocalDrillEngine;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { LocalMARAudit, LocalDrillEngine };
}
