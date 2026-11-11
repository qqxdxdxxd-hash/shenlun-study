/**
 * 申论智能研习台 - 题型量规与考场评分元数据中枢 (QuestionTypeRubrics)
 * 严格对标国考、省考及事业单位申论真实阅卷标准
 */

function _pickDimReason(res, dimKey, ctx = {}) {
  const reasons = res && res.radar_reasons;
  if (reasons && typeof reasons === 'object') {
    if (reasons[dimKey]) return reasons[dimKey];
    for (const [k, v] of Object.entries(reasons)) {
      if (v && (k.includes(dimKey.slice(0, 2)) || dimKey.includes(k.slice(0, 2)))) {
        return v;
      }
    }
  }
  return null;
}

function _getDimRate(res, ctx = {}, defaultTarget = 35) {
  if (ctx && ctx.dimScore !== undefined && ctx.dimMax) {
    return ctx.dimScore / ctx.dimMax;
  }
  const target = (ctx && ctx.targetScore) || (res && res.target_score) || defaultTarget;
  return ((res && res.score) || 0) / Math.max(target, 1);
}

const QUESTION_TYPE_RUBRICS = {
  essay: {
    qType: "essay",
    name: "申论材料大作文",
    structureLabel: "立意与骨架形态",
    perspectives: {
      examiner: { title: "【考场考官前10秒第一眼定档】", desc: "前10秒首眼扫描立意是否偏题、卷面字数卡位与大致档位初判" },
      structure_expert: { title: "【大五段骨架与对策论证诊断】", desc: "诊断大五段‘1+3’架构、总分论点对仗、论证深度与事例展开是否脱节" },
      style_expert: { title: "【政务文风与语汇质检诊断】", desc: "诊断是否存在大白话、政务动宾大词密度、公文严肃语体" }
    },
    dimensions: [
      {
        key: "立意与总分论点",
        ratio: 12 / 35,
        defaultMax: 12,
        getDesc: (res, ctx) => {
          const reason = _pickDimReason(res, "立意与总分论点", ctx);
          if (reason) return reason;
          const rate = _getDimRate(res, ctx, 35);
          if (res.grade?.includes("四类") || rate < 0.6) {
            return "总论点或分论点不完整（未满足1+3骨架），或偏离材料与题干核心主题词";
          }
          if (res.grade?.includes("三类") || rate < 0.8) {
            return "总论点基本切题，但核心主题词锚定或三分论点覆盖尚不够精准完整";
          }
          return "立意源于材料，紧扣题干核心主题词，首段末句亮明总论点，三分论点醒目递进";
        }
      },
      {
        key: "结构与段落布局",
        ratio: 8 / 35,
        defaultMax: 8,
        getDesc: (res, ctx) => {
          const reason = _pickDimReason(res, "结构与段落布局", ctx);
          if (reason) return reason;
          const rate = _getDimRate(res, ctx, 35);
          if (res.grade?.includes("四类") || rate < 0.6) {
            return "分论点不足三个或正文论证段未达标杆要求，结构残缺";
          }
          if (res.grade?.includes("三类") || rate < 0.8) {
            return "骨架略欠完整或字数/段落匀称度未达标准区间，结构尚需打磨";
          }
          return "五段大五段匀称，段落字数控制合理，首尾呼应紧密";
        }
      },
      {
        key: "论据与论证深度",
        ratio: 10 / 35,
        defaultMax: 10,
        getDesc: (res, ctx) => {
          const reason = _pickDimReason(res, "论据与论证深度", ctx);
          if (reason) return reason;
          if (res.copy_redline_exceeded || res.copy_ratio > 0.15) {
            return "存在大段照抄材料原句现象，论证沦为事实搬运缺乏深度制度剖析";
          }
          const rate = _getDimRate(res, ctx, 35);
          if (res.grade?.includes("四类") || res.grade?.includes("三类") || rate < 0.7) {
            return "事例叙述与事实转述偏多，缺乏深入制度剖析与因果机理推演";
          }
          return "道理论证与事例论证结合紧密，具备事后深度因果分析";
        }
      },
      {
        key: "语言与公文规范",
        ratio: 5 / 35,
        defaultMax: 5,
        getDesc: (res, ctx) => {
          const reason = _pickDimReason(res, "语言与公文规范", ctx);
          if (reason) return reason;
          const rate = _getDimRate(res, ctx, 35);
          if (res.chroma_spans?.some(s => s.type === 'colloquial_flaw' || s.type === 'subjective_fabrication') || rate < 0.7) {
            return "存在口语化聊天大白话或语汇不够凝练，需强化政务动宾大词提炼与短句对仗";
          }
          return "公文语体规范严谨，短句对仗工整，用词庄重洗练";
        }
      }
    ],
    evaluateStructureStatus: (structScore, maxScore, grade) => {
      if (grade?.includes("四类")) return "结构残缺";
      const ratio = structScore !== null && maxScore ? (structScore / maxScore) : (grade?.includes("三类") ? 0.65 : 0.8);
      if (grade?.includes("三类") && ratio < 0.8) return "结构偏弱";
      if (ratio >= 0.8 && !grade?.includes("三类")) return "结构严整";
      if (ratio >= 0.6) return "结构尚可";
      return "结构偏弱";
    }
  },

  single: {
    qType: "single",
    name: "单一题（归纳概括/对策/理解）",
    structureLabel: "分类逻辑与条理",
    perspectives: {
      examiner: { title: "【考场考官前10秒第一眼定档】", desc: "前10秒极速扫描是否切中要素、有无总括句、序号条理与大致档位" },
      structure_expert: { title: "【要素归纳与分类逻辑诊断】", desc: "诊断是否全面提取要素、有无宏观总括句、微观序号与MECE分类无交叉重复" },
      style_expert: { title: "【作答规范与去流水账质检】", desc: "诊断是否存在抄录事例/人名/数据流水账、有无主观捏造事实、字数是否紧凑达标" }
    },
    dimensions: [
      {
        key: "内容采点覆盖度",
        ratio: 0.55,
        defaultMax: 11,
        getDesc: (res, ctx) => _pickDimReason(res, "内容采点覆盖度", ctx) || ((res.grade?.includes("四类") || _getDimRate(res, ctx, 20) < 0.5)
          ? "严重偏离题目要素，官方底稿核心要点大面积遗漏，采点命中率极低"
          : "全面覆盖给定资料核心得分点，精准命中官方采分底稿原词与要点")
      },
      {
        key: "分类逻辑与条理",
        ratio: 0.20,
        defaultMax: 4,
        getDesc: (res, ctx) => _pickDimReason(res, "分类逻辑与条理", ctx) || (res.grade?.includes("四类")
          ? "未分条列项，无宏观总括句，要点混杂杂乱无章"
          : "具备宏观总括句，微观1.2.3.序号清晰，同类项合并合理无交叉重叠")
      },
      {
        key: "提炼概括度",
        ratio: 0.15,
        defaultMax: 3,
        getDesc: (res, ctx) => _pickDimReason(res, "提炼概括度", ctx) || (res.chroma_spans?.some(s => s.type === 'story_narrative_leak')
          ? "存在抄录案例情节、人名与数据现象，缺乏规范动宾前置词凝练"
          : "前置动宾短语工整醒目，成功剔除案例冗余水分，语言凝练密度高")
      },
      {
        key: "表达与字数规范",
        ratio: 0.10,
        defaultMax: 2,
        getDesc: (res, ctx) => _pickDimReason(res, "表达与字数规范", ctx) || (res.chroma_spans?.some(s => s.type === 'colloquial_flaw')
          ? "存在大白话或主观臆造推论，字数未达最佳饱满区间"
          : "字数紧凑控制在规定格子90%~100%，无错别字，表述客观规范")
      }
    ],
    evaluateStructureStatus: (structScore, maxScore, grade) => {
      if (grade?.includes("四类")) return "散乱未分类";
      const ratio = structScore !== null && maxScore ? (structScore / maxScore) : 0.8;
      if (ratio >= 0.8) return "总分清晰";
      if (ratio >= 0.6) return "逻辑尚可";
      return "逻辑交叉";
    }
  },

  doc: {
    qType: "doc",
    name: "公文题（贯彻执行/应用文）",
    structureLabel: "公文格式与结构",
    perspectives: {
      examiner: { title: "【考场考官前10秒第一眼定档】", desc: "前10秒极速核查文种类型、三件套格式规范性、版面排布与初扫档位" },
      structure_expert: { title: "【格式规范与行文逻辑诊断】", desc: "逐项诊断标题/主送称谓/落款格式三件套；诊断‘发文缘由-主体分条-结语号召’行文逻辑" },
      style_expert: { title: "【公文语体与场景口吻质检】", desc: "核定发文身份与受众口吻匹配度、宣传倡议类感染号召力、工作总结类严肃客观度" }
    },
    dimensions: [
      {
        key: "内容要点覆盖",
        ratio: 0.60,
        defaultMax: 12,
        getDesc: (res, ctx) => _pickDimReason(res, "内容要点覆盖", ctx) || ((res.grade?.includes("四类") || _getDimRate(res, ctx, 20) < 0.5)
          ? "遗漏核心任务要点，未紧扣材料提炼措施或经验，内容充实度不足"
          : "严格依托材料提炼背景、措施、做法等要点，内容要点全面扎实")
      },
      {
        key: "格式规范三件套",
        ratio: 0.15,
        defaultMax: 3,
        getDesc: (res, ctx) => _pickDimReason(res, "格式规范三件套", ctx) || ((res.title_issues && res.title_issues.length > 0)
          ? "标题存在书名号或缺少文种/事由，或称谓与落款缺失不合规"
          : "标题居中规范，主送单位顶格冒号，落款单位与日期合规完备")
      },
      {
        key: "行文结构与层次",
        ratio: 0.15,
        defaultMax: 3,
        getDesc: (res, ctx) => _pickDimReason(res, "行文结构与层次", ctx) || (res.grade?.includes("四类")
          ? "缺少发文缘由或结尾结语，主体段落缺乏层次过渡"
          : "开头发文缘由交代清晰，主体分条列项推进，结尾收束号召有力")
      },
      {
        key: "公文语体与口吻",
        ratio: 0.10,
        defaultMax: 2,
        getDesc: (res, ctx) => _pickDimReason(res, "公文语体与口吻", ctx) || (res.chroma_spans?.some(s => s.type === 'colloquial_flaw')
          ? "语言口语化偏重，文种特定口吻（宣传号召/请示汇报）不够精准"
          : "公文语体庄重大方，契合特定发文机关身份与受众场景口吻")
      }
    ],
    evaluateStructureStatus: (structScore, maxScore, grade) => {
      if (grade?.includes("四类")) return "格式残缺";
      const ratio = structScore !== null && maxScore ? (structScore / maxScore) : 0.8;
      if (ratio >= 0.8) return "三件套完备";
      if (ratio >= 0.6) return "格式微瑕";
      return "格式残缺";
    }
  }
};

class QuestionTypeRubrics {
  static parseWordLimits(text, qType = 'essay') {
    const clean = (text || '').replace(/\s+/g, '');
    // 1. 范围格式: 800-1000字 / 1000～1200字 / 1000—1200字
    const rangeMatch = clean.match(/(\d{3,4})\s*[-~～—–到至]\s*(\d{3,4})\s*字/);
    if (rangeMatch) {
      const a = parseInt(rangeMatch[1], 10);
      const b = parseInt(rangeMatch[2], 10);
      return { minWords: Math.min(a, b), maxWords: Math.max(a, b) };
    }
    // 2. 上限格式: 不超过200字 / 限300字 / 250字以内 / 至多400字
    const maxMatch = clean.match(/(?:不超过|限|以内|至多|少于)\s*(\d{2,4})\s*字|(\d{2,4})\s*字以内/);
    if (maxMatch) {
      const maxW = parseInt(maxMatch[1] || maxMatch[2], 10);
      return { minWords: Math.round(maxW * 0.8), maxWords: maxW };
    }
    // 3. 左右/约格式: 1000字左右
    const approxMatch = clean.match(/(\d{3,4})\s*字左右/);
    if (approxMatch) {
      const mid = parseInt(approxMatch[1], 10);
      return { minWords: Math.round(mid * 0.9), maxWords: Math.round(mid * 1.1) };
    }
    // 4. 题型兜底
    if (qType === 'single') return { minWords: 180, maxWords: 250 };
    if (qType === 'doc') return { minWords: 320, maxWords: 450 };
    return { minWords: 900, maxWords: 1100 };
  }

  static getRubric(qType) {
    return QUESTION_TYPE_RUBRICS[qType] || QUESTION_TYPE_RUBRICS.essay;
  }

  static getDimensions(qType, targetScore = 20) {
    const rubric = this.getRubric(qType);
    let remaining = targetScore;
    return rubric.dimensions.map((dim, idx) => {
      let maxScore;
      if (idx === rubric.dimensions.length - 1) {
        maxScore = Math.max(1, Math.round(remaining * 10) / 10);
      } else {
        maxScore = Math.max(1, Math.round(targetScore * dim.ratio * 2) / 2);
        remaining -= maxScore;
      }
      return {
        key: dim.key,
        max: maxScore,
        getDesc: dim.getDesc
      };
    });
  }

  static getPerspectiveTitles(qType) {
    const rubric = this.getRubric(qType);
    return {
      examiner: rubric.perspectives.examiner.title,
      structure_expert: rubric.perspectives.structure_expert.title,
      style_expert: rubric.perspectives.style_expert.title
    };
  }

  static getStructureCardLabel(qType) {
    return this.getRubric(qType).structureLabel;
  }

  static getStructureStatus(qType, structScore, maxScore, grade) {
    return this.getRubric(qType).evaluateStructureStatus(structScore, maxScore, grade);
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { QuestionTypeRubrics, QUESTION_TYPE_RUBRICS };
}
if (typeof window !== 'undefined') {
  window.QuestionTypeRubrics = QuestionTypeRubrics;
}
