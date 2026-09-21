/**
 * 纯前端确定性色谱预检与 SpanResolver 算法引擎 (LocalChromaScanner)
 * 无需 Python 后端，100% 运行于当前浏览器 V8 引擎。
 */
class LocalChromaScanner {
  /**
   * 标题合规性极速检测 (书名号、字数预警)
   */
  static scanTitleIssues(title) {
    const issues = [];
    if (!title) return issues;
    const cleanTitle = title.trim();
    if (cleanTitle.includes('《') || cleanTitle.includes('》')) {
      issues.push("申论标题严禁加书名号（考场扣1~2分）");
    }
    if (cleanTitle.length > 22) {
      issues.push("标题偏长，考场黄金标题建议在15~16字以内");
    }
    return issues;
  }

  /**
   * 15-gram 连续抄袭红线检测与全文摘抄比例精算
   * @param {string} userText 考生作答
   * @param {string} materials 给定资料
   * @param {number} minChars 连续抄袭触发阈值 (默认15字)
   */
  static detectCopyRedline(userText, materials, minChars = 15) {
    if (!userText || !materials) {
      return { spans: [], copyRatio: 0, exceeded: false };
    }

    const cleanMat = materials.replace(/\s+/g, '');
    const spans = [];
    let totalCopied = 0;
    const n = userText.length;
    let i = 0;

    while (i <= n - minChars) {
      let matchedLen = 0;
      // 贪婪匹配最长重合子串
      for (let w = minChars; w <= n - i; w++) {
        const sub = userText.substring(i, i + w);
        if (cleanMat.includes(sub)) {
          matchedLen = w;
        } else {
          break;
        }
      }

      if (matchedLen >= minChars) {
        spans.push({
          start: i,
          end: i + matchedLen,
          type: "copy_redline",
          color: "yellow",
          style: "blink_border",
          label: "抄材料超标",
          comment: `连续摘抄材料原文达 ${matchedLen} 字，需结合观点转化为规范政务大词`
        });
        totalCopied += matchedLen;
        i += matchedLen;
      } else {
        i++;
      }
    }

    const cleanUserLen = userText.trim().length;
    const copyRatio = cleanUserLen > 0 ? Number((totalCopied / cleanUserLen).toFixed(3)) : 0;
    return {
      spans,
      copyRatio,
      exceeded: copyRatio > 0.20
    };
  }

  /**
   * Quote-Anchor 物理字符坐标回填定位器
   * 将大模型输出的字面引用 (quote) 转换为精确的 [start, end] 字符下标，附带首尾容错
   * @param {string} userText 考生原始文本
   * @param {Array} llmQuotes 模型评审提取的引用集合
   */
  static resolveQuotesToSpans(userText, llmQuotes) {
    if (!userText || !Array.isArray(llmQuotes)) return [];
    const resolved = [];

    for (const item of llmQuotes) {
      const quote = (item.quote || '').trim();
      if (!quote) continue;

      // 1. 优先精确下标检索
      let idx = userText.indexOf(quote);
      if (idx !== -1) {
        resolved.push({
          start: idx,
          end: idx + quote.length,
          type: item.type || "normal",
          color: item.color || "green",
          style: item.style || "solid",
          label: item.label || "",
          comment: item.comment || ""
        });
      } else if (quote.length >= 16) {
        // 2. 容错模糊对齐：首尾 6~8 字双向锚定 (自动过滤省略号与头尾标点)
        let head = quote.slice(0, 8).replace(/[……\s，。、“”"']+$/g, '');
        let tail = quote.slice(-8).replace(/^[……\s，。、“”"']+/g, '');
        if (head.length >= 4 && tail.length >= 4) {
          const headIdx = userText.indexOf(head);
          if (headIdx !== -1) {
            const tailIdx = userText.indexOf(tail, headIdx + head.length);
            if (tailIdx !== -1) {
              resolved.push({
                start: headIdx,
                end: tailIdx + tail.length,
                type: item.type || "normal",
                color: item.color || "green",
                style: item.style || "solid",
                label: item.label || "",
                comment: item.comment || ""
              });
            }
          }
        }
      }
    }

    // 按起始位置升序排序
    resolved.sort((a, b) => a.start - b.start);
    return resolved;
  }
}

if (typeof window !== 'undefined') {
  window.LocalChromaScanner = LocalChromaScanner;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { LocalChromaScanner };
}
