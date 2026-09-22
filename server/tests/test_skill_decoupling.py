"""
全链路解耦验证：确保系统代码不越权硬编码，保证纯净材料流与 Skill 权威生效
"""
from pathlib import Path
import pytest
from src.evaluator import ShenlunEvaluator
from src.skill_loader import SkillRegistry
from src.models import ReviewRequest, MemoryItemPayload
from src.mar_rewriter import MemoryAugmentedRewriter

def test_single_question_mar_prompt_is_clean():
    """验证单一题 Prompt 绝不渗漏大五段、1000字或记忆库内容"""
    memories = [
        MemoryItemPayload(id="m1", title="新质生产力核心特征", content="创新为主导，高科技高效能高质量"),
        MemoryItemPayload(id="m2", title="双碳与降碳四字协同", content="降碳、减污、扩绿、增长")
    ]
    prompt = MemoryAugmentedRewriter.build_mar_prompt(
        user_answer="某县依托互联网大力发展智慧农业与电商平台。",
        question_title="互联网科技为农村生产生活带来新变化",
        recalled_memories=memories,
        question_type="single"
    )
    assert "1000~1100字" not in prompt
    assert "大五段" not in prompt
    assert "[来自记忆库" not in prompt
    assert "新质生产力核心特征" not in prompt
    assert "双碳与降碳四字协同" not in prompt
    assert "单一题" in prompt

def test_single_question_fallback_exemplar_is_not_essay():
    """验证单一题离线兜底示范不再是千字议论文，字数在限额内且无记忆库标记"""
    skills_path = Path(__file__).parent.parent / "skills"
    registry = SkillRegistry(str(skills_path))
    evaluator = ShenlunEvaluator(registry)

    req = ReviewRequest(
        question_type="single",
        question_title="概括经验做法",
        materials="某企业专注自主研发，弘扬工匠精神，对接重大需求。",
        user_answer="做法有：一是自主研发，二是工匠精神，三是战略需求。",
        target_score=15,
        word_limit=200,
        skill_id="shenlun-single-expert"
    )
    pre_info = {"word_count": 180, "copy_ratio": 0.1, "copy_redline_exceeded": False}
    memory_audit = {"activated_memories": [], "missed_opportunities": [], "activation_rate": 0.0}
    res = evaluator._evaluate_fallback(req, pre_info, memory_audit)

    assert res["target_score"] == 15.0
    assert res["word_limit"] == 200
    assert "[来自记忆库" not in res["rewritten_exemplar"]
    assert "大鹏之动" not in res["rewritten_exemplar"]
    assert len(res["rewritten_exemplar"]) < 250
    assert "1." in res["rewritten_exemplar"] or "【" in res["rewritten_exemplar"]

def test_essay_fallback_preserves_essay_rubrics():
    """验证大作文离线兜底依然保持完整大作文逻辑"""
    skills_path = Path(__file__).parent.parent / "skills"
    registry = SkillRegistry(str(skills_path))
    evaluator = ShenlunEvaluator(registry)

    req = ReviewRequest(
        question_type="essay",
        question_title="以绿色发展绘就底色",
        materials="关于绿色发展的材料",
        user_answer="大鹏之动，非一羽之轻。我们需要推进绿色发展转型。" * 20,
        target_score=35,
        skill_id="shenlun-essay-expert"
    )
    pre_info = {"word_count": 1050, "copy_ratio": 0.05, "copy_redline_exceeded": False}
    memory_audit = {"activated_memories": [], "missed_opportunities": [], "activation_rate": 0.0}
    res = evaluator._evaluate_fallback(req, pre_info, memory_audit)

    assert res["target_score"] == 35.0
    assert "大五段" in res["perspectives"].get("structure_expert", "") or "骨架" in res["perspectives"].get("structure_expert", "")
