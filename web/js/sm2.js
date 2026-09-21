/**
 * SuperMemo-2 (SM-2) 艾宾浩斯间隔重复算法
 * 专用于个人申论名言、对策卡片的遗忘曲线调度
 */
class SM2Engine {
  static rate(card, rating) {
    const now = Date.now();
    let repetitions = card.repetitions || 0;
    let interval = card.interval || 0;
    let ease = card.ease || 2.5;

    if (rating === 1) {
      // 遗忘：10分钟后重现
      repetitions = 0;
      interval = 0;
      ease = Math.max(1.3, ease - 0.3);
      return {
        ...card,
        repetitions,
        interval,
        ease: parseFloat(ease.toFixed(2)),
        nextReview: now + 10 * 60 * 1000,
        lastReviewedAt: now
      };
    } else if (rating === 2) {
      // 良好：逐步拉长
      repetitions += 1;
      if (repetitions === 1) interval = 1;
      else if (repetitions === 2) interval = 3;
      else interval = Math.round(interval * 1.2);
      ease = Math.max(1.3, ease - 0.15);
      return {
        ...card,
        repetitions,
        interval,
        ease: parseFloat(ease.toFixed(2)),
        nextReview: now + interval * 86400000,
        lastReviewedAt: now
      };
    } else {
      // 秒答：熟练掌握
      repetitions += 1;
      if (repetitions === 1) interval = 1;
      else if (repetitions === 2) interval = 6;
      else interval = Math.round(interval * ease);
      ease += 0.1;
      return {
        ...card,
        repetitions,
        interval,
        ease: parseFloat(ease.toFixed(2)),
        nextReview: now + interval * 86400000,
        lastReviewedAt: now
      };
    }
  }
}

window.SM2Engine = SM2Engine;
