import json
import pytest
from pathlib import Path
import yaml
try:
    from src.skill_loader import SkillRegistry
except ImportError:
    from server.src.skill_loader import SkillRegistry

def test_skill_markdown_integrity():
    skill_file = Path("server/skills/shenlun-single-expert/SKILL.md")
    assert skill_file.exists(), "SKILL.md must exist"
    text = skill_file.read_text(encoding="utf-8")
    assert text.startswith("---"), "SKILL.md must start with YAML frontmatter"
    parts = text.split("---", 2)
    assert len(parts) >= 3, "Frontmatter must be closed"
    meta = yaml.safe_load(parts[1])
    assert meta["name"] == "shenlun-single-expert"
    assert meta["metadata"]["question_type"] == "single"
    assert "8～15秒" in parts[2]
    assert "字数红线驱动的排版自适应准则" in parts[2]
    assert "四分法过滤" in parts[2]

def test_references_files_exist_and_rich():
    ref_dir = Path("server/skills/shenlun-single-expert/references")
    assert ref_dir.exists(), "references dir must exist"
    
    expected_files = [
        "material-filtering-heuristics.md",
        "word-budget-and-formatting.md",
        "synonym-and-lexicon-handbook.md",
        "14-exam-ground-truth-corpus.md"
    ]
    for fname in expected_files:
        fpath = ref_dir / fname
        assert fpath.exists(), f"Reference file {fname} must exist"
        content = fpath.read_text(encoding="utf-8")
        assert len(content) > 3000, f"Reference file {fname} must be rich (>3000 chars, got {len(content)})"

def test_single_question_corpus_coverage():
    corpus_dir = Path("data/single_question_corpus")
    assert corpus_dir.exists(), "Corpus dir must exist"
    json_files = list(corpus_dir.glob("*.json"))
    assert len(json_files) == 16, f"Must have 16 single question files, got {len(json_files)}"
    
    for jf in json_files:
        data = json.loads(jf.read_text(encoding="utf-8"))
        assert data["prompt"], f"Prompt missing in {jf.name}"
        assert data["gold_answer"], f"Gold answer missing in {jf.name}"
        assert data["mentor_review"], f"Mentor review missing in {jf.name}"
        assert len(data["lecture_transcript_slice"]) > 5000, f"Lecture slice too short in {jf.name}"

def test_mined_rules_aggregated_schema():
    agg_file = Path("data/mined_rules_aggregated.json")
    assert agg_file.exists(), "Aggregated rules file must exist"
    data = json.loads(agg_file.read_text(encoding="utf-8"))
    assert "archetypes" in data
    assert "word_budget_rules" in data
    assert "paragraph_filtering_rules" in data
    assert "lexicon_and_synonyms" in data
    assert "examiner_scoring_mechanics" in data
    assert len(data["word_budget_rules"]["under_200_words"]) >= 3
    assert len(data["examiner_scoring_mechanics"]["question_case_rubrics"]) == 16

def test_skill_registry_loader():
    registry = SkillRegistry()
    skill = registry.get("shenlun-single-expert")
    assert skill is not None, "shenlun-single-expert must be loaded"
    assert skill.question_type == "single"
    # Check references loaded
    assert "material-filtering-heuristics.md" in skill.references
    assert "word-budget-and-formatting.md" in skill.references
    assert "synonym-and-lexicon-handbook.md" in skill.references
    assert "14-exam-ground-truth-corpus.md" in skill.references
    
    prompt = skill.assemble_system_prompt()
    assert "【≤200字：极限短题】" in prompt
    assert "四分法过滤" in prompt
