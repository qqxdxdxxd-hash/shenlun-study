from pathlib import Path
import json
from scripts.build_exams_kb import split_exams

def test_build_exams_split(tmp_path):
    mock_raw = [
        {"id": "q1", "exam_name": "2026国考", "question_type": "essay", "question_title": "绿色发展", "materials": "材料内容...", "target_score": 35},
        {"id": "q2", "exam_name": "2025省考", "question_type": "single", "question_title": "基层减负", "materials": "材料内容...", "target_score": 20}
    ]
    raw_file = tmp_path / "raw.json"
    raw_file.write_text(json.dumps(mock_raw, ensure_ascii=False), encoding="utf-8")
    
    out_dir = tmp_path / "output"
    split_exams(raw_file, out_dir)

    assert (out_dir / "index.json").exists()
    assert (out_dir / "q1.json").exists()
    assert (out_dir / "q2.json").exists()
    
    idx_data = json.loads((out_dir / "index.json").read_text(encoding="utf-8"))
    assert len(idx_data) == 2
    assert "materials" not in idx_data[0]
    assert idx_data[0]["id"] == "q1"
    assert idx_data[0]["char_count"] == len("材料内容...")

    q1_detail = json.loads((out_dir / "q1.json").read_text(encoding="utf-8"))
    assert q1_detail["id"] == "q1"
    assert q1_detail["materials"] == "材料内容..."

def test_real_papers_kb_contains_all_21_papers():
    from scripts.real_exams_data import REAL_PAPERS_KB
    assert len(REAL_PAPERS_KB) >= 21
    gk_papers = [p for p in REAL_PAPERS_KB if p["category"] == "国考"]
    assert len(gk_papers) == 18
    # Verify year span 2019 to 2025
    years = {p["year"] for p in gk_papers}
    assert years == {2019, 2020, 2021, 2022, 2023, 2024, 2025}
    # Verify material integrity
    for p in gk_papers:
        assert len(p["materials_text"]) >= 5000
        assert len(p["questions"]) == 5

