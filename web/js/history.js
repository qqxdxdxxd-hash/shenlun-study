/**
 * 申论研习台 - 做题历史与二练复盘领域纯逻辑引擎
 * 纯函数无副作用设计，支持浏览器与 Node 测试环境
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    const helper = factory();
    helper.QuestionHistoryHelper = helper;
    module.exports = helper;
  } else {
    root.QuestionHistoryHelper = factory();
  }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  const QuestionHistoryHelper = {
    /**
     * 将 submissions 和 reports 关联，补齐缺失的字段并计算得分率
     */
    enrichSubmissions(submissions, reports = []) {
      if (!Array.isArray(submissions)) return [];
      const reportMap = new Map();
      reports.forEach(r => {
        if (r && r.submissionId) reportMap.set(r.submissionId, r);
      });

      return submissions.map(sub => {
        const rep = reportMap.get(sub.id);
        const effectiveScore = typeof sub.score === 'number' ? sub.score : (rep && typeof rep.score === 'number' ? rep.score : null);
        const effectiveTarget = typeof sub.targetScore === 'number' ? sub.targetScore : (rep && (rep.target_score || rep.targetScore) ? Number(rep.target_score || rep.targetScore) : (sub.questionType === 'essay' ? 35 : (sub.questionType === 'doc' ? 25 : 20)));
        const effectiveGrade = sub.grade || (rep && rep.grade) || '已批改';
        const effectiveCopyRatio = typeof sub.copyRatio === 'number' ? sub.copyRatio : (rep && typeof rep.copy_ratio === 'number' ? rep.copy_ratio : 0);

        let scoringRate = null;
        if (effectiveScore !== null && effectiveTarget > 0) {
          scoringRate = Math.round((effectiveScore / effectiveTarget) * 100);
        }

        const defaultTitle = sub.questionType === 'essay' ? '大作文真题作答' : (sub.questionType === 'doc' ? '公文贯彻执行作答' : '单一题作答');
        const effectiveQuestionTitle = sub.questionTitle || sub.topic || defaultTitle;
        const effectiveExamTitle = sub.examTitle || '自定义题目';

        return {
          ...sub,
          questionTitle: effectiveQuestionTitle,
          examTitle: effectiveExamTitle,
          score: effectiveScore,
          targetScore: effectiveTarget,
          grade: effectiveGrade,
          copyRatio: effectiveCopyRatio,
          scoringRate: scoringRate,
          createdAt: sub.createdAt || Date.now()
        };
      });
    },

    /**
     * 计算宏观做题统计指标
     */
    calculateStats(enrichedSubmissions) {
      const items = Array.isArray(enrichedSubmissions) ? enrichedSubmissions : [];
      const totalCount = items.length;
      let totalWords = 0;
      let scoreRateSum = 0;
      let ratedCount = 0;

      let essayCount = 0;
      let docCount = 0;
      let singleCount = 0;
      let excellentCount = 0; // 一类文/优秀

      items.forEach(item => {
        totalWords += (item.wordCount || (item.userAnswer ? item.userAnswer.length : 0));
        if (item.questionType === 'essay') essayCount++;
        else if (item.questionType === 'doc') docCount++;
        else if (item.questionType === 'single') singleCount++;

        if (typeof item.scoringRate === 'number') {
          scoreRateSum += item.scoringRate;
          ratedCount++;
        }
        if (item.grade && (item.grade.includes('一类') || item.grade.includes('优秀') || item.scoringRate >= 80)) {
          excellentCount++;
        }
      });

      const avgScoringRate = ratedCount > 0 ? Math.round(scoreRateSum / ratedCount) : 0;
      const excellentRate = totalCount > 0 ? Math.round((excellentCount / totalCount) * 100) : 0;

      return {
        totalCount,
        essayCount,
        docCount,
        singleCount,
        totalWords,
        avgScoringRate,
        excellentRate,
        excellentCount
      };
    },

    /**
     * 过滤历史列表
     */
    filterItems(items, filters = {}) {
      if (!Array.isArray(items)) return [];
      const { questionType, examId, keyword } = filters;

      return items.filter(item => {
        // 题型过滤
        if (questionType && questionType !== 'all') {
          if (item.questionType !== questionType) return false;
        }
        // 试卷过滤
        if (examId && examId !== 'all') {
          if (item.examId !== examId) return false;
        }
        // 关键词搜索（支持题目、试卷名称、答案片段）
        if (keyword && keyword.trim()) {
          const kw = keyword.trim().toLowerCase();
          const matchTitle = item.questionTitle && item.questionTitle.toLowerCase().includes(kw);
          const matchExam = item.examTitle && item.examTitle.toLowerCase().includes(kw);
          const matchAnswer = item.userAnswer && item.userAnswer.toLowerCase().includes(kw);
          if (!matchTitle && !matchExam && !matchAnswer) return false;
        }
        return true;
      });
    },

    /**
     * 排序历史列表
     */
    sortItems(items, sortBy = 'date_desc') {
      if (!Array.isArray(items)) return [];
      const copy = [...items];

      copy.sort((a, b) => {
        if (sortBy === 'date_asc') {
          return (a.createdAt || 0) - (b.createdAt || 0);
        } else if (sortBy === 'score_desc') {
          return (b.score || 0) - (a.score || 0);
        } else if (sortBy === 'score_asc') {
          return (a.score || 0) - (b.score || 0);
        } else if (sortBy === 'rate_desc') {
          return (b.scoringRate || 0) - (a.scoringRate || 0);
        } else if (sortBy === 'words_desc') {
          return (b.wordCount || 0) - (a.wordCount || 0);
        }
        // 默认 date_desc
        return (b.createdAt || 0) - (a.createdAt || 0);
      });

      return copy;
    },

    /**
     * 按同一小题提取历史多版本链
     */
    findQuestionVersions(items, questionIdOrTitle) {
      if (!Array.isArray(items) || !questionIdOrTitle) return [];
      const matched = items.filter(item => {
        return (item.questionId && item.questionId === questionIdOrTitle) ||
               (item.questionTitle && item.questionTitle === questionIdOrTitle);
      });

      // 按时间正序排列
      matched.sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));

      return matched.map((item, idx) => {
        let scoreDelta = 0;
        if (idx > 0 && typeof item.score === 'number' && typeof matched[idx - 1].score === 'number') {
          scoreDelta = Number((item.score - matched[idx - 1].score).toFixed(1));
        }
        return {
          ...item,
          versionIndex: idx + 1,
          scoreDelta
        };
      });
    },

    /**
     * 时间戳友好格式化
     */
    formatDate(timestamp) {
      if (!timestamp) return '--';
      const d = new Date(timestamp);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const hours = String(d.getHours()).padStart(2, '0');
      const minutes = String(d.getMinutes()).padStart(2, '0');
      return `${year}-${month}-${day} ${hours}:${minutes}`;
    }
  };

  return QuestionHistoryHelper;
});
