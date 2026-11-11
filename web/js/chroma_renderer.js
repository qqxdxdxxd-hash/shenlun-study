/**
 * 多维色谱富文本渲染引擎 (Chroma Renderer)
 * 将字符偏移量跨距切片注入文本，并支持悬浮诊断气泡交互
 */
class ChromaRenderer {
  static getPriority(type) {
    const order = {
      copy_redline: 6,
      subjective_fabrication: 5,
      colloquial_flaw: 4,
      story_narrative_leak: 3,
      formal_phrase: 2,
      main_thesis: 1,
      source_hit: 1,
      title_correct: 1
    };
    return order[type] || 1;
  }

  static render(userText, spans) {
    if (!userText) return "";
    if (!spans || !spans.length) {
      return this.escapeHtml(userText);
    }

    const validSpans = spans
      .map(s => ({
        ...s,
        start: Math.max(0, Math.min(userText.length, s.start)),
        end: Math.max(0, Math.min(userText.length, s.end))
      }))
      .filter(s => s.start < s.end);

    if (!validSpans.length) {
      return this.escapeHtml(userText);
    }

    // 收集全部端点构建无重叠离散原子区间 [p_i, p_{i+1}]，彻底杜绝字符重复拼接
    const pointsSet = new Set([0, userText.length]);
    validSpans.forEach(s => {
      pointsSet.add(s.start);
      pointsSet.add(s.end);
    });
    const points = [...pointsSet].sort((a, b) => a - b);

    let html = "";
    for (let i = 0; i < points.length - 1; i++) {
      const segStart = points[i];
      const segEnd = points[i + 1];
      if (segStart >= segEnd) continue;

      const snippet = this.escapeHtml(userText.slice(segStart, segEnd));
      const covering = validSpans.filter(s => s.start <= segStart && s.end >= segEnd);

      if (covering.length === 0) {
        html += snippet;
      } else {
        covering.sort((a, b) => this.getPriority(b.type) - this.getPriority(a.type));
        const primary = covering[0];
        const cssClass = this.mapSpanClass(primary);
        const tips = covering.map(s => {
          const termHint = s.formal_term ? `（建议规范词：【${s.formal_term}】）` : "";
          return `【${s.label || "诊断"}】${s.comment || ""}${termHint}`;
        });
        const tipAttr = this.escapeHtml(tips.join(" ｜ "));
        html += `<span class="c-span ${cssClass}" data-tip="${tipAttr}">${snippet}</span>`;
      }
    }

    return html;
  }

  static mapSpanClass(span) {
    switch (span.type) {
      case "main_thesis":
      case "source_hit":
      case "title_correct":
        return "c-hit";
      case "formal_phrase":
        return "c-formal";
      case "story_narrative_leak":
        return "c-story";
      case "colloquial_flaw":
        return "c-colloquial";
      case "subjective_fabrication":
        return "c-fake";
      case "copy_redline":
        return "c-redline";
      case "missed_point":
        return "c-leak";
      default:
        return "c-hit";
    }
  }

  static escapeHtml(text) {
    return (text || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  static bindPopovers(containerId, popoverId) {
    const container = document.getElementById(containerId);
    const pop = document.getElementById(popoverId);
    if (!container || !pop) return;

    container.querySelectorAll('.c-span').forEach(span => {
      span.addEventListener('mouseenter', (e) => {
        const tip = span.getAttribute('data-tip');
        if (!tip) return;
        pop.innerHTML = tip;
        pop.style.display = 'block';
        const rect = span.getBoundingClientRect();
        pop.style.top = (window.scrollY + rect.bottom + 6) + 'px';
        pop.style.left = (window.scrollX + rect.left) + 'px';
      });
      span.addEventListener('mouseleave', () => {
        pop.style.display = 'none';
      });
    });
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { ChromaRenderer };
}
if (typeof window !== 'undefined') {
  window.ChromaRenderer = ChromaRenderer;
}
