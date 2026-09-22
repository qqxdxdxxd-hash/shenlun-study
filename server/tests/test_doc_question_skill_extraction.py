import json
import pytest
from pathlib import Path
import yaml

try:
    from src.skill_loader import SkillRegistry
except ImportError:
    from server.src.skill_loader import SkillRegistry

def test_doc_skill_markdown_integrity():
    skill_file = Path("server/skills/shenlun-official-doc/SKILL.md")
    assert skill_file.exists()
    content = skill_file.read_text(encoding="utf-8")
    chunks = content.split("---", 2)
    assert len(chunks) >= 3
    meta = yaml.safe_load(chunks[1])
    assert meta["name"] == "shenlun-official-doc"
    assert meta["version"] == "2.1.0"
    assert meta["metadata"]["question_type"] == "doc"
    assert "三轨给分模型" in content
    assert "格式三件套取舍决策树" in content
    assert "五大类核心公文行文骨架" in content

def test_doc_reference_files_exist_and_rich():
    ref_dir = Path("server/skills/shenlun-official-doc/references")
    assert ref_dir.exists()
    expected_files = [
        "doc-format-decision-tree.md",
        "doc-archetype-and-skeleton-handbook.md",
        "doc-tone-and-government-register.md",
        "8-real-exam-doc-ground-truth-corpus.md"
    ]
    for fname in expected_files:
        f = ref_dir / fname
        assert f.exists(), f"Missing expected doc reference: {fname}"
        text = f.read_text(encoding="utf-8")
        assert len(text) > 2000, f"File {fname} too short: {len(text)} chars"

def test_doc_corpus_coverage():
    corpus_dir = Path("data/doc_question_corpus")
    assert corpus_dir.exists()
    files = list(corpus_dir.glob("*.json"))
    assert len(files) == 8, f"Expected 8 doc questions, found {len(files)}"

    total_lecture_chars = 0
    for f in files:
        data = json.loads(f.read_text(encoding="utf-8"))
        assert data["question_type"] == "doc"
        assert len(data["prompt"]) > 5
        assert len(data["gold_answer"]) > 50
        assert len(data["mentor_review"]) > 50
        assert len(data["lecture_transcript_slice"]) > 3000
        total_lecture_chars += len(data["lecture_transcript_slice"])
    assert total_lecture_chars > 50000

def test_mined_doc_rules_aggregated_schema():
    agg_file = Path("data/mined_doc_rules_aggregated.json")
    assert agg_file.exists()
    data = json.loads(agg_file.read_text(encoding="utf-8"))
    assert "format_rules" in data
    assert "archetype_skeletons" in data
    assert "register_and_tone_rules" in data
    assert "examiner_scoring_mechanics" in data
    assert len(data["archetype_skeletons"]) >= 5

def test_skill_registry_loader_doc():
    registry = SkillRegistry(Path("server/skills"))
    skill = registry.get("shenlun-official-doc")
    assert skill is not None
    assert skill.question_type == "doc"
    assert len(skill.references) >= 4
    prompt = skill.assemble_system_prompt()
    assert "公文题三轨专业阅卷专家" in prompt
    assert "doc-format-decision-tree.md" in prompt
