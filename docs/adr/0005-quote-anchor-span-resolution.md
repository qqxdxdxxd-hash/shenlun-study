# 0005. 子串引用锚定色谱定位机制 (Quote-Anchor Span Resolution)

## Context
在多维色谱穿透批改中，系统需要在考生的千字作答文本上精确高亮“命中原词”、“规范大词”、“主观臆造删除线”、“纯故事流水账”等。
大模型内部基于 Token（如 BPE）进行自回归推理，对自然语言文本中的绝对字符偏移量（Character Offset, 即 start/end 索引）极度不敏感，如果直接要求大模型输出物理字符索引数字，在长中文场景下的错误率高达 80% 以上，会导致前端高亮严重错位或截断文字。

## Decision
我们决定采用**“确定性规则 + 大模型精准子串引用 + 本地锚定对齐（Quote-Anchor Span Resolution）”**的三层混合工程机制：
1. **纯规则层（本地即时计算）**：
   - 物理字数统计、标题书名号检测；
   - 连续材料抄袭率（>20%红线）：通过滑动窗口 N-gram 直接在考生作答与材料间做本地比对，100% 准确获取字符坐标。
2. **大模型语义层（精准引用非坐标）**：
   - Prompt 严禁要求大模型计算字符索引数字；
   - 约束大模型输出作答中的**完整字面原句（Exact Substring Quote）**，结合语义赋予其标签（如 `type: colloquial_flaw`、`type: story_narrative_leak`）。
3. **本地定位器（Span Resolver）**：
   - 本地程序（Python/JavaScript）拿到大模型返回的 `quote` 列表，在考生的原文字符串中执行精确子串匹配或模糊文本对齐（Diff-Match-Patch / Levenshtein），计算出物理级 `[start, end]` 跨距；
   - 前端接收标准 `Span` 数组进行绝对位置切片与富文本高亮。

## Consequences
- **优势**：彻底根除大模型数字符翻车导致的“高亮错位”顽疾；对大模型版本极度鲁棒，即使 DeepSeek、Qwen、GPT-4o 也能 100% 稳定输出结构化引用。
- **代价**：若作答中存在多处一模一样的原句，需借助前后文上下文窗口（Context Window）做消歧判定。
