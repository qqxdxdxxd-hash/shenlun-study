/**
 * 纯客户端 Mini-RAG 检索引擎
 * 在浏览器内存中毫秒级分词与加权匹配，召回与题目匹配的个人记忆卡片
 */
class MiniRAG {
  static tokenize(text) {
    return (text || "")
      .replace(/[^\u4e00-\u9fa5a-zA-Z0-9]/g, " ")
      .split(/\s+/)
      .filter(w => w.length >= 2);
  }

  static recallTopK(memories, topic, userText, topK = 3) {
    if (!memories || !memories.length) return [];
    
    // 提取题干与开头段核心特征词元
    const queryTokens = this.tokenize(`${topic} ${userText.slice(0, 300)}`);
    
    const scored = memories.map(mem => {
      let score = 0;
      const corpus = `${mem.category || ""} ${mem.tag || ""} ${mem.title || ""} ${mem.content || ""}`;
      
      // 1. 词频命中
      queryTokens.forEach(t => {
        if (corpus.includes(t)) score += 2;
      });

      // 2. 领域分类与标签强命中加权
      if (topic.includes(mem.category || "") || topic.includes(mem.tag || "")) {
        score += 6;
      }

      // 3. SM-2 熟练度加权（背熟的优先调动）
      if ((mem.repetitions || 0) >= 2) {
        score += 1;
      }

      return { mem, score };
    });

    scored.sort((a, b) => b.score - a.score);
    return scored.filter(s => s.score > 0).slice(0, topK).map(s => s.mem);
  }
}

window.MiniRAG = MiniRAG;
