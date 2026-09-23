import pytest
from pathlib import Path

SOURCE_DIR = Path("D:/BaiduNetdiskDownload/国考申论PDF")

@pytest.mark.skipif(not SOURCE_DIR.exists(), reason="Source PDF directory not found")
def test_parse_all_18_guokao_pdfs():
    from scripts.import_guokao_pdfs import GuokaoPdfParser

    parser = GuokaoPdfParser(SOURCE_DIR)
    papers = parser.parse_all()

    assert len(papers) == 16, f"Expected 16 papers (2020-2025), got {len(papers)}"

    for p in papers:
        # Check metadata
        assert p["year"] in range(2020, 2026), f"Invalid year: {p['year']}"
        assert p["category"] == "国考"
        assert p["tier"] in ["副省级", "地市级", "行政执法卷", "副省级/省级"]
        assert p["id"].startswith("gk")
        assert len(p["exam_name"]) > 10

        # Check authentic material length (5000 ~ 9000 chars)
        assert len(p["materials_text"]) >= 5000, f"Materials too short for {p['id']}: {len(p['materials_text'])}"
        assert "【给定" in p["materials_text"] or "材料" in p["materials_text"]

        # Check subquestions
        questions = p["questions"]
        assert len(questions) == 5, f"Expected 5 questions for {p['id']}, got {len(questions)}"

        total_score = sum(q["target_score"] for q in questions)
        assert total_score == 100, f"Score sum must be 100 for {p['id']}, got {total_score}"

        for q in questions:
            assert q["id"].startswith(p["id"])
            assert q["type"] in ["single", "doc", "essay"]
            assert len(q["prompt_text"]) > 10
            assert q["target_score"] in [10, 15, 20, 25, 30, 35, 40]
            assert len(q["char_limit"]) > 0
            # Copyright neutrality: no commercial commentary
            assert "粉笔" not in q["prompt_text"]
            assert "华图" not in q["prompt_text"]
