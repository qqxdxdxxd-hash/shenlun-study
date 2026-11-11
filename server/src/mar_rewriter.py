import re
from typing import List, Dict, Any, Optional
from src.models import MemoryItemPayload

class MemoryAugmentedRewriter:
    @staticmethod
    def _extract_core_theme(question_title: str) -> str:
        t = (question_title or "").strip()
        m = re.search(r'[“"《]([^”"》]{2,24})[”"》]', t)
        if m:
            return m.group(1)
        cleaned = re.sub(r'^(?:大作文[：:]\s*|第\d+题[（(][^）)]+[）)][：:]\s*|【问题[一二三四五]】\s*)', '', t)
        return cleaned[:24]

    @staticmethod
    def audit_memory_activation(user_answer: str, recalled_memories: List[MemoryItemPayload]) -> Dict[str, Any]:
        """
        逆向记忆激活率审计：核验考生是否在作答中调动了本地召回的已背素材
        """
        if not recalled_memories:
            return {
                "activation_rate": 0.0,
                "activated": [],
                "missed_opportunities": ["本地记忆库暂无匹配卡片，可在批改中一键收集金句入库"]
            }

        activated = []
        missed = []

        for m in recalled_memories:
            # 检查关键实词是否在作答中出现
            title_clean = m.title.replace("《", "").replace("》", "")
            # 提取卡片内容中4字以上短语
            key_phrases = [p for p in m.content.split("，") if len(p) >= 4]
            hit = False
            if title_clean in user_answer:
                hit = True
            else:
                for kp in key_phrases:
                    if kp.strip() in user_answer:
                        hit = True
                        break

            if hit:
                activated.append(f"《{m.title}》")
            else:
                missed.append(f"你在论述相关主题时用词较平，本可直接调动已背熟的《{m.title}》")

        total = len(recalled_memories)
        rate = round(len(activated) / max(total, 1), 2)
        return {
            "activation_rate": rate,
            "activated": activated,
            "missed_opportunities": missed
        }

    @staticmethod
    def build_mar_prompt(
        user_answer: str,
        question_title: str,
        recalled_memories: List[MemoryItemPayload],
        question_type: str = "essay",
        word_limit_min: Optional[int] = None,
        word_limit: Optional[int] = None,
    ) -> str:
        """
        纯净范本重构上下文发生器：
        - single: 彻底不注入记忆库，不硬编码字数与结构，完全由 Skill 指引大模型；
        - doc: 仅提示基于材料与公文规范重塑；
        - essay: 注入动态字数区间、核心主题词锚定、15字降重红线与记忆参考素材。
        """
        if question_type == "single":
            return """
## 【标杆示范重写指引】：
请严格遵循已加载的单一题阅卷 Skill 规范，基于给定资料提炼的采分点，对考生作答进行考场标杆示范重写。
【严禁事项】：单一题严格忠实于材料，严禁注入未在材料中出现的外部时政理论或记忆库内容，字数严格控制在题目所限定的范围内。
"""

        elif question_type == "doc":
            return """
## 【标杆示范重写指引】：
请严格遵循公文贯彻执行题阅卷规范，基于给定资料重构格式规范、内容完备、语体得当的考场公文范本。
"""

        else:
            min_w = word_limit_min or 900
            max_w = word_limit or 1100
            target_low = max(min_w, round(max_w * 0.88))
            target_high = min(max_w, round(max_w * 0.96))
            theme = MemoryAugmentedRewriter._extract_core_theme(question_title)

            mem_block = []
            if recalled_memories:
                mem_block.append("## 【考生个人已背诵素材库（仅在与段落语义契合时化用，严禁空挂伪标注）】：")
                for idx, m in enumerate(recalled_memories, 1):
                    mem_block.append(f"{idx}. 《{m.title}》：{m.content}")
            mem_str = "\n".join(mem_block) if mem_block else ""
            return f"""
{mem_str}
## 【大作文标杆示范重写指引】：
1. **严格字数红线（绝对硬约束）**：重塑后的纯正文总字数（含标题与标点，不含任何 [来自记忆库: ...] 标注）必须严格控制在 **{min_w}~{max_w} 字** 之间（最佳目标 **{target_low}~{target_high} 字**），绝对禁止超过 {max_w} 字上限！
2. **核心主题词全锚定**：题干核心主题为【{theme}】。重写范文的**标题、首段尾句总论点以及正文三个分论点段首句**必须自然嵌入该核心主题词，不得被原稿偏置措辞带离题干；
3. **开头三步完整**：开头段必须包含“点题（引述/案例/背景）→ 解题（阐释主题内涵与时代价值）→ 亮明含三大支柱的总论点”；
4. **材料深度改写禁止照抄**：对给定资料中的案例与政策表述进行缩写与政务化转述，**禁止出现连续超过 15字 照抄材料原文的句子**；
5. **结尾完整收拢**：结尾段简练归纳前文三大分论点并回扣核心主题词；记忆库卡片仅在真正化用该卡片核心表述的句末标注 `[来自记忆库: 卡片名]`。
"""
