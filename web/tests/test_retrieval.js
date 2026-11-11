const assert = require('assert');
const { MiniRAG } = require('../js/retrieval.js');

console.log("=== 开始执行 MiniRAG 语义召回精度测试 ===");

const memories = [
  { id: "m1", category: "生态文明", tag: "双碳协同", title: "双碳与降碳四字协同", content: "协同推进降碳、减污、扩绿、增长，推进生态优先、节约集约、绿色低碳发展。", repetitions: 4 },
  { id: "m2", category: "基层治理", tag: "基层减负", title: "形式主义对策三件套", content: "优化考核机制，破除唯台账论，推动权力与资源下沉。", repetitions: 1 },
  { id: "m3", category: "经济发展", tag: "新质生产力", title: "新质生产力核心特征", content: "新质生产力以创新为主导，具有高科技、高效能、高质量特征，以全要素生产率大幅提升为核心标志。", repetitions: 3 }
];

// 1. 测试：一篇只谈“数字经济与人工智能发展”的作文，不应仅因“发展”二字误召回生态文明卡片
const techEssay = "以科技创新引领人工智能发展，打造具有国际竞争力的数字产业集群，建设现代化经济体系。";
const recalledTech = MiniRAG.recallTopK(memories, "以人工智能引领产业升级", techEssay, 3);
assert(!recalledTech.some(m => m.id === "m1"), "不应仅因泛词'发展'误召回双碳生态卡片");

// 2. 测试：明确提及“绿色低碳/降碳/生态”或“创新/高质量发展”时准确召回对应卡片
const greenEssay = "推进绿色低碳转型，协同推进降碳减污扩绿增长，培育新质生产力。";
const recalledGreen = MiniRAG.recallTopK(memories, "领跑新时代高质量发展", greenEssay, 3);
assert(recalledGreen.some(m => m.id === "m1"), "含绿色低碳/降碳语境时应准确召回 m1");
assert(recalledGreen.some(m => m.id === "m3"), "含高质量发展/新质生产力语境时应准确召回 m3");

console.log("✓ MiniRAG 停用词过滤与精准召回测试通过！");
