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
    def build_mar_prompt(
        user_answer: str,
        question_title: str,
        recalled_memories: List[MemoryItemPayload],
        question_type: str = "essay"
    ) -> str:
        """
        纯净范本重构上下文发生器：
        - single: 彻底不注入记忆库，不硬编码字数与结构，完全由 Skill 指引大模型；
        - doc: 仅提示基于材料与公文规范重塑；
        - essay: 提供背诵素材供大模型参考（不使用霸道排他性措辞）。
        """
        if question_type == "single":
            return """
## 【标杆示范重写指引】：
请严格遵循上述已加载的单一题阅卷 Skill 规范，基于给定资料提炼的采分点，对考生作答进行考场标杆示范重写。
【严禁事项】：单一题严格忠实于材料，严禁注入未在材料中出现的外部时政理论或记忆库内容，字数严格控制在题目所限定的范围内。
"""

        elif question_type == "doc":
            return """
## 【标杆示范重写指引】：
请严格遵循公文贯彻执行题阅卷规范，基于给定资料重构格式规范、内容完备、语体得当的考场公文范本。
"""

        else:
            # 仅大作文提供记忆库素材参考
            mem_block = []
            if recalled_memories:
                mem_block.append("## 【考生个人已背诵素材库（撰写大作文时可供参考化用）】：")
                for idx, m in enumerate(recalled_memories, 1):
                    mem_block.append(f"{idx}. 《{m.title}》：{m.content}")
            mem_str = "\n".join(mem_block) if mem_block else ""
            return f"""
{mem_str}
## 【大作文标杆示范重写指引】：
请基于考生原始立意与上述参考素材，撰写考场标杆示范议论文。
"""
