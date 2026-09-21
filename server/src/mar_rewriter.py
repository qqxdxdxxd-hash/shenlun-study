from typing import List, Dict, Any
from src.models import MemoryItemPayload

class MemoryAugmentedRewriter:
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
    def build_mar_prompt(user_answer: str, question_title: str, recalled_memories: List[MemoryItemPayload]) -> str:
        """
        限制性一类文重构 Prompt：强约束融入考生记忆库，打上 [来自记忆库: xxx] 标记
        """
        mem_block = []
        if recalled_memories:
            mem_block.append("## 【考生个人已背诵记忆库（在重构范文时，必须优先无缝融合以下素材）】：")
            for idx, m in enumerate(recalled_memories, 1):
                mem_block.append(f"{idx}. [{m.category}·{m.tag}] 《{m.title}》：{m.content}")
        
        mem_str = "\n".join(mem_block) if mem_block else "（考生未注入特定记忆，请按照考场一类文标准重塑）"

        return f"""
你是一名资深公职阅卷名师。请基于考生的原始立意与素材脉络，重构一篇考场标杆一类文（1000~1100字）：

{mem_str}

【考生原始作答】：
{user_answer}

【重构硬性铁律】：
1. 100% 保持考生的立意主线与材料方向，绝不天马行空另起新论点；
2. 论点必须置于段首，采用“1+3”严整大五段结构；
3. 凡在行文中成功融入上述考生已背素材的句子，必须在句末清晰标注：[来自记忆库: 卡片标题]；
4. 语言规范化、公文化、短句化，打造 32+ 分标杆示范。
"""
