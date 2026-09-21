from typing import List, Dict, Any

class DrillGenerator:
    @staticmethod
    def extract_remediation_drills(colloquial_spans: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        根据批改中识别出的口语大白话或语病，现场生成 3 分钟靶向微练习
        """
        drills = []
        if not colloquial_spans:
            # 兜底生成典型微练习
            drills.append({
                "id": "drill_1",
                "type": "colloquial_to_formal",
                "flaw_text": "村里没钱做不了事，老百姓都不想管",
                "question": "请将大白话‘村里没钱做不了事，老百姓都不想管’改写为 2 个 8 字以内的规范政务动宾大词。",
                "hint": "建议从‘财政保障’、‘内生动力’等维度提炼。"
            })
            return drills

        for idx, item in enumerate(colloquial_spans[:3], 1):
            flaw = item.get("quote") or item.get("comment") or "大白话口语表达"
            drills.append({
                "id": f"drill_{idx}",
                "type": "colloquial_to_formal",
                "flaw_text": flaw,
                "question": f"请将你作答中出现的口语表述‘{flaw}’改写为规范政务动宾短语。",
                "hint": "提示：围绕机制、保障、动员或权责等维度提炼大词。"
            })
        return drills

    @staticmethod
    def verify_drill_input(drill_type: str, flaw_text: str, user_input: str) -> Dict[str, Any]:
        """
        3分钟微练习即时秒判规则引擎
        """
        user_clean = user_input.strip()
        if not user_clean:
            return {
                "passed": False,
                "score": 0,
                "feedback": "作答不能为空，请输入改写后的政务大词。"
            }

        # 检查政务高频大词命中
        formal_keywords = [
            "保障", "机制", "健全", "完善", "匮乏", "权责", "统筹", "协同", "推进",
            "内生动力", "长效机制", "精细化", "制度约束", "引导", "落实", "规范",
            "短板", "瓶颈", "滞后", "拓宽", "优化", "赋能"
        ]

        hit_words = [w for w in formal_keywords if w in user_clean]
        if len(hit_words) >= 1 and len(user_clean) <= 40:
            return {
                "passed": True,
                "score": 90 + min(len(hit_words) * 3, 10),
                "feedback": f"✓ 提炼精准！命中核心政务大词【{'】【'.join(hit_words)}】，已成功切除思维病灶！"
            }
        else:
            return {
                "passed": False,
                "score": 60,
                "feedback": "⚠️ 建议提炼更具公文色彩的紧凑动宾短语（如：【强化财政保障】【健全激励机制】），剔除口语修饰词。"
            }
