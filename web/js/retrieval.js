/**
 * 纯客户端 Mini-RAG 检索引擎
 * 在浏览器内存中毫秒级分词与加权匹配，召回与题目匹配的个人记忆卡片
 * 过滤高频泛词噪音，避免仅因“发展/建设”等通用词误召回无关领域卡片
 */
const MINIRAG_STOPWORDS = new Set([
  "发展", "建设", "推进", "加强", "提高", "提升", "强化", "实现", "坚持",
  "推动", "加快", "促进", "完善", "健全", "全面", "深入", "国家", "战略",
  "城市", "社会", "中国", "时代", "新时代", "工作", "问题", "方面", "重要",
  "体系", "机制", "水平", "能力", "高质量", "高质量发展"
]);

class MiniRAG {
  static tokenize(text) {
    const raw = (text || "")
      .replace(/[^\u4e00-\u9fa5a-zA-Z0-9]/g, " ")
      .split(/\s+/)
      .filter(w => w.length >= 2);
    const tokens = new Set();
    for (const seg of raw) {
      if (seg.length <= 4) {
        if (!MINIRAG_STOPWORDS.has(seg)) tokens.add(seg);
      } else {
        for (let i = 0; i <= seg.length - 2; i++) {
          const bi = seg.slice(i, i + 2);
          if (!MINIRAG_STOPWORDS.has(bi)) tokens.add(bi);
          if (i <= seg.length - 3) {
            const tri = seg.slice(i, i + 3);
            if (!MINIRAG_STOPWORDS.has(tri)) tokens.add(tri);
          }
        }
      }
    }
    return [...tokens];
  }

  static recallTopK(memories, topic, userText, topK = 3) {
    if (!memories || !memories.length) return [];

    const queryText = `${topic || ""} ${(userText || "").slice(0, 600)}`;
    const queryTokens = this.tokenize(queryText);

    const scored = memories.map(mem => {
      let score = 0;
      const corpus = `${mem.category || ""} ${mem.tag || ""} ${mem.title || ""} ${mem.content || ""}`;

      // 1. 专属领域特征词命中计分（3字词权重更高）
      queryTokens.forEach(t => {
        if (corpus.includes(t)) {
          score += t.length >= 3 ? 3 : 2;
        }
      });

      // 2. 领域分类与标签强命中加权
      if ((mem.category && queryText.includes(mem.category)) || (mem.tag && queryText.includes(mem.tag))) {
        score += 6;
      }

      // 3. 门槛保护：至少达到 4 分（至少 2 个有效特征词或直接命中分类/标签），过滤单泛词噪音
      if (score < 4) {
        return { mem, score: 0 };
      }

      // 4. SM-2 熟练度加权
      if ((mem.repetitions || 0) >= 2) {
        score += 1;
      }

      return { mem, score };
    });

    scored.sort((a, b) => b.score - a.score);
    return scored.filter(s => s.score > 0).slice(0, topK).map(s => s.mem);
  }
}

if (typeof window !== 'undefined') {
  window.MiniRAG = MiniRAG;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { MiniRAG };
}
