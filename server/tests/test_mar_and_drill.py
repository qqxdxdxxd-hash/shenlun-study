import pytest
from src.mar_rewriter import MemoryAugmentedRewriter
from src.drill_generator import DrillGenerator
from src.models import MemoryItemPayload

def test_memory_activation_audit():
    user_answer = "面对新时代的发展要求，我们要协同推进降碳、减污、扩绿、增长，以高品质生态支撑高质量发展。"
    mems = [
        MemoryItemPayload(id="m1", category="生态", tag="双碳", title="降碳四字协同", content="降碳、减污、扩绿、增长"),
        MemoryItemPayload(id="m2", category="治理", tag="减负", title="形式主义对策", content="坚决克服唯台账论，以实干实绩论英雄")
    ]
    audit = MemoryAugmentedRewriter.audit_memory_activation(user_answer, mems)
    assert audit["activation_rate"] == 0.5
    assert "《降碳四字协同》" in audit["activated"]
    assert len(audit["missed_opportunities"]) == 1

def test_drill_generator_and_verify():
    flaws = [{"quote": "上面天天发文件，村里没钱做不了事"}]
    drills = DrillGenerator.extract_remediation_drills(flaws)
    assert len(drills) == 1
    assert "上面天天发文件" in drills[0]["question"]

    # 测试即时秒判通过
    v_pass = DrillGenerator.verify_drill_input("colloquial_to_formal", flaws[0]["quote"], "完善基层财政保障机制，理顺权责对等关系")
    assert v_pass["passed"] is True
    assert v_pass["score"] >= 90

    # 测试未包含政务大词失败
    v_fail = DrillGenerator.verify_drill_input("colloquial_to_formal", flaws[0]["quote"], "就是没有钱干不了")
    assert v_fail["passed"] is False
