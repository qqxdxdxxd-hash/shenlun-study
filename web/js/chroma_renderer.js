/**
 * 多维色谱富文本渲染引擎 (Chroma Renderer)
 * 将字符偏移量跨距切片注入文本，并支持悬浮诊断气泡交互
 */
class ChromaRenderer {
  static render(userText, spans) {
    if (!spans || !spans.length) {
      return this.escapeHtml(userText);
    }

    // 按 start 升序排序
    const sorted = [...spans].sort((a, b) => a.start - b.start);
    let html = "";
    let cursor = 0;

    sorted.forEach(span => {
      const start = Math.max(0, span.start);
      const end = Math.min(userText.length, span.end);

      if (start > cursor) {
        html += this.escapeHtml(userText.slice(cursor, start));
      }

      if (start < end) {
        const snippet = this.escapeHtml(userText.slice(start, end));
        const cssClass = this.mapSpanClass(span);
        const tipAttr = this.escapeHtml(`【${span.label || "诊断"}】${span.comment || ""}`);
        html += `<span class="c-span ${cssClass}" data-tip="${tipAttr}">${snippet}</span>`;
        cursor = end;
      }
    });

    if (cursor < userText.length) {
      html += this.escapeHtml(userText.slice(cursor));
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
