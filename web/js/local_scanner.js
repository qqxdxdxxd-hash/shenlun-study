/**
 * 客户端轻量级色谱扫描器 (Local Chroma Scanner)
 * 纯客户端 1ms 执行确定性规则：标题病灶识别、15-gram 连续抄袭红线、模型引用坐标回填
 * 天然免疫换行符与多余空格
 */
class LocalChromaScanner {
  /**
   * 标题病灶规则前检 (扣分项预警)
   * @param {string} title 考生作答第一行/拟定标题
   */
  static scanTitleIssues(title) {
    const issues = [];
    if (!title) return issues;
    if (title.includes("《") || title.includes("》")) {
      issues.push("申论标题严禁加书名号（扣1~2分）");
    }
    if (title.length > 22) {
      issues.push("标题偏长，考场黄金标题建议在15~16字以内");
    }
    return issues;
  }

  /**
   * 15-gram 连续抄袭红线检测与全文摘抄比例精算
   * 采用非空白字符物理坐标映射，天然免疫文本中的换行符与多余空格
   * @param {string} userText 考生作答
   * @param {string} materials 给定资料
   * @param {number} minChars 连续抄袭触发阈值 (默认15字)
   */
  static detectCopyRedline(userText, materials, minChars = 15) {
    if (!userText || !materials) {
      return { spans: [], copyRatio: 0, exceeded: false };
    }

    const origIndices = [];
    const cleanChars = [];
    for (let i = 0; i < userText.length; i++) {
      const ch = userText[i];
      if (!/\s/.test(ch)) {
        cleanChars.push(ch);
        origIndices.push(i);
      }
    }
    const cleanUser = cleanChars.join('');
    const cleanMat = materials.replace(/\s+/g, '');
    const spans = [];
    let totalCopied = 0;
    const n = cleanUser.length;
    let i = 0;

    while (i <= n - minChars) {
      let matchedLen = 0;
      // 贪婪匹配最长重合子串
      for (let w = minChars; w <= n - i; w++) {
        const sub = cleanUser.substring(i, i + w);
        if (cleanMat.includes(sub)) {
          matchedLen = w;
        } else {
          break;
        }
      }

      if (matchedLen >= minChars) {
        const start = origIndices[i];
        const end = origIndices[i + matchedLen - 1] + 1;
        spans.push({
          start,
          end,
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

    const copyRatio = n > 0 ? Number((totalCopied / n).toFixed(3)) : 0;
    return {
      spans,
      copyRatio,
      exceeded: copyRatio > 0.20
    };
  }

  /**
   * Quote-Anchor 物理字符坐标回填定位器
   * 将大模型输出的字面引用 (quote) 转换为精确的 [start, end] 字符下标
   * 采用多阶容错策略：
   * 1. 原始文本精确匹配 (Exact Substring)
   * 2. 空白/换行容错映射匹配 (Whitespace-Agnostic Clean Index Mapping)
   * 3. 渐进式首尾双向锚点对齐 (Progressive Head-Tail Dual Anchor)
   * @param {string} userText 考生原始文本
   * @param {Array} llmQuotes 模型评审提取的引用集合
   */
  static resolveQuotesToSpans(userText, llmQuotes) {
    if (!userText || !Array.isArray(llmQuotes)) return [];

    const origIndices = [];
    const cleanChars = [];
    for (let i = 0; i < userText.length; i++) {
      const ch = userText[i];
      if (!/\s/.test(ch)) {
        cleanChars.push(ch);
        origIndices.push(i);
      }
    }
    const cleanUser = cleanChars.join('');
    const resolved = [];

    for (const item of llmQuotes) {
      const quote = (item.quote || '').trim();
      if (!quote) continue;

      // 1. 优先原文本精确查找
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
        continue;
      }

      // 2. 空白/换行免疫匹配：在去空白字符流中精确定位
      const cleanQ = quote.replace(/\s+/g, '');
      if (!cleanQ) continue;

      const cIdx = cleanUser.indexOf(cleanQ);
      if (cIdx !== -1) {
        resolved.push({
          start: origIndices[cIdx],
          end: origIndices[cIdx + cleanQ.length - 1] + 1,
          type: item.type || "normal",
          color: item.color || "green",
          style: item.style || "solid",
          label: item.label || "",
          comment: item.comment || ""
        });
        continue;
      }

      // 3. 渐进式首尾双向锚点容错对齐：去除两端标点后首尾双向锚定 (8, 6, 5, 4 字渐进)
      const hasEllipsis = cleanQ.includes("……") || cleanQ.includes("...") || cleanQ.includes("···");
      const strippedQ = cleanQ.replace(/^[……\s，。、“”"':：；;！!？?—-]+|[……\s，。、“”"':：；;！!？?—-]+$/g, '');
      if (strippedQ.length >= 6) {
        let matched = false;
        for (const anchorLen of [8, 6, 5, 4]) {
          if (anchorLen > Math.floor(strippedQ.length / 2)) continue;
          const head = strippedQ.slice(0, anchorLen);
          const tail = strippedQ.slice(-anchorLen);
          const hIdx = cleanUser.indexOf(head);
          if (hIdx !== -1) {
            const tIdx = cleanUser.indexOf(tail, hIdx + head.length);
            if (tIdx !== -1) {
              const spanLen = (tIdx + tail.length) - hIdx;
              const lenDiff = Math.abs(spanLen - cleanQ.length);
              const maxDiff = hasEllipsis ? 200 : Math.max(15, Math.floor(cleanQ.length * 0.35));
              if (lenDiff <= maxDiff) {
                resolved.push({
                  start: origIndices[hIdx],
                  end: origIndices[tIdx + tail.length - 1] + 1,
                  type: item.type || "normal",
                  color: item.color || "green",
                  style: item.style || "solid",
                  label: item.label || "",
                  comment: item.comment || ""
                });
                matched = true;
                break;
              }
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
