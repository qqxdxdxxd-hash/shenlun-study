import pytest
from pathlib import Path
from src.skill_loader import SkillRegistry

def test_load_neutral_skills():
    registry = SkillRegistry()
    skills = registry.list_skills()
    assert len(skills) >= 3
    assert "shenlun-essay-expert" in skills
    assert "shenlun-official-doc" in skills
    assert "shenlun-single-expert" in skills

    essay_skill = registry.get("shenlun-essay-expert")
    assert essay_skill is not None
    assert "大五段" in essay_skill.name
    # 铁律验证：严禁出现任何商业培训名师姓名
    forbidden_names = ["张传响", "周昊", "李梦娇", "粉笔", "华图", "中公"]
    prompt_text = essay_skill.assemble_system_prompt()
    for name in forbidden_names:
        assert name not in prompt_text, f"Skill 文本中发现侵权老师/机构名称: {name}"
