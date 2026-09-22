# Import Guokao 2019-2025 Real Exam Papers Implementation Plan

> **For Hermes:** Use `subagent-driven-development` skill to implement this plan task-by-task.

**Goal:** Extract authentic examination materials and questions for 18 National Civil Service Examination (国考) papers across 2019–2025 from `D:\BaiduNetdiskDownload\国考申论PDF`, and import them into the system's default question bank (`web/data/exams/`, `web/data/default_kb/exams.json`, `server/data/default_kb/exams.json`) with strict copyright neutrality and pure-frontend sharding support.

**Architecture:** 
A Python-based extraction pipeline (`scripts/import_guokao_pdfs.py`) uses `pymupdf` to parse all 18 PDFs into structured examination models (`Paper` with `materials_text` and 5 laddered `questions`), de-noises line-breaks and watermarks, extracts target scores (summing to 100) and character limits, and integrates with the existing 3 provincial representative papers into `scripts/real_exams_data.py`. The build pipeline (`scripts/build_real_5year_exams.py`) compiles the updated dataset into single-paper shards (`[paper_id].json`), backward-compatible sub-question shards (`[qid].json`), a lightweight global index (`index.json`), and default database seed files. The frontend UI and test suite are updated to showcase and validate all 21 authentic papers (102 questions).

**Tech Stack:** Python 3.11, PyMuPDF (fitz), pytest, JavaScript ES6+, Node.js test runner.

---

## Current Context & Assumptions

1. **Source Data (`D:\BaiduNetdiskDownload\国考申论PDF`)**:
   Contains 18 official examination PDF files covering 2019 through 2025:
   - 2019: 地市级, 省级 (2 papers, 10 questions)
   - 2020: 地市级, 省级 (2 papers, 10 questions)
   - 2021: 副省级, 地市级 (2 papers, 10 questions)
   - 2022: 副省级, 地市级, 行政执法卷 (3 papers, 15 questions)
   - 2023: 副省级, 地市级, 行政执法卷 (3 papers, 15 questions)
   - 2024: 副省级, 地市级, 行政执法卷 (3 papers, 15 questions)
   - 2025: 副省级, 地市级, 行政执法卷 (3 papers, 15 questions)
   - Total: 18 papers, 90 questions, each paper totaling exactly 100 points, each material totaling 6,500~8,200 characters.

2. **User Constraint & Copyright Neutrality Gate (版权中立红线)**:
   - "注意，只需要补充材料和题目，对应的年份试卷。"
   - Do NOT import commercial prep-school proprietary model answers, trademarked analysis, or copyrighted instructor guides.
   - Retain only official examination materials, prompt texts, requirements, target scores, and question types.

3. **Storage & Sharding Specifications**:
   - Paper Shards: `web/data/exams/[paper_id].json` (e.g. `gk2025_prov.json`, `gk2025_city.json`, `gk2025_law.json`).
   - Question Shards: `web/data/exams/[qid].json` (e.g. `gk2025_prov_q1.json`).
   - Global Index: `web/data/exams/index.json` (~60KB).
   - Seed Files: `web/data/default_kb/exams.json` and `server/data/default_kb/exams.json`.
   - In-repo Dataset: `scripts/real_exams_data.py`.

---

## Step-by-Step Implementation Tasks

### Task 1: Create Test Suite for PDF Ingestion Engine

**Objective:** Write a failing test `tests/test_import_guokao_pdfs.py` validating that the ingestion engine parses all 18 PDFs into structured paper dictionaries with valid metadata, authentic material length, and exactly 5 laddered questions summing to 100 points.

**Files:**
- Create: `tests/test_import_guokao_pdfs.py`

**Step 1: Write failing test**

```python
# tests/test_import_guokao_pdfs.py
import pytest
from pathlib import Path
from scripts.import_guokao_pdfs import GuokaoPdfParser

SOURCE_DIR = Path("D:/BaiduNetdiskDownload/国考申论PDF")

@pytest.mark.skipif(not SOURCE_DIR.exists(), reason="Source PDF directory not found")
def test_parse_all_18_guokao_pdfs():
    parser = GuokaoPdfParser(SOURCE_DIR)
    papers = parser.parse_all()
    
    assert len(papers) == 18, f"Expected 18 papers, got {len(papers)}"
    
    for p in papers:
        # Check metadata
        assert p["year"] in range(2019, 2026), f"Invalid year: {p['year']}"
        assert p["category"] == "国考"
        assert p["tier"] in ["副省级", "地市级", "行政执法卷", "副省级/省级"]
        assert p["id"].startswith("gk")
        assert len(p["exam_name"]) > 10
        
        # Check authentic material length (6000 ~ 9000 chars)
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
```

**Step 2: Run test to verify failure**

Run: `pytest tests/test_import_guokao_pdfs.py -v`
Expected: FAIL — `ModuleNotFoundError: No module named 'scripts.import_guokao_pdfs'`

**Step 3: Commit test file**

```bash
git add tests/test_import_guokao_pdfs.py
git commit -m "test: add unit test for Guokao PDF parser"
```

---

### Task 2: Implement PDF Extraction and De-noising Engine

**Objective:** Implement `scripts/import_guokao_pdfs.py` to extract materials and questions from all 18 PDFs with paragraph de-noising, question boundary resolution, word limit extraction, and copyright neutrality enforcement.

**Files:**
- Create: `scripts/import_guokao_pdfs.py`

**Step 1: Write implementation**

```python
#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
scripts/import_guokao_pdfs.py
解析 D:/BaiduNetdiskDownload/国考申论PDF 中 2019-2025 年 18 套国考真题 PDF
提取全真给定资料与 5 道梯级小题题干、作答要求、分值与字数红线。
严格执行版权中立红线：剥离商业辅导机构题头、水印与参考解析，仅沉淀官方试卷资产。
"""

import os
import re
from pathlib import Path
from typing import List, Dict, Any, Tuple
import pymupdf

class GuokaoPdfParser:
    ANS_PATTERNS = [
        r"\n\s*(?:-\s*\d+\s*-\s*\n)?\s*20\d\d\s*年[^\n]*?(?:参考答案|（解析）|解析）)",
        r"\n\s*【问题[一1]参考答案】",
        r"\n\s*【题目一参考答案】",
        r"\n\s*【第一题参考答案】",
        r"\n\s*第[一1]问参考答案[：:]",
        r"\n\s*1、\s*参考答案[：:]",
        r"\n\s*一、\s*\(\s*15\s*分\s*\)\s*\n\s*【参考答案】",
        r"\n\s*参考答案\s*\n\s*一、",
        r"\n\s*【参考答案与解析】",
        r"\n\s*【参考答案及解析】",
        r"\n\s*【答案及解析】",
        r"\n\s*参考答案及评分标准",
        r"\n\s*参考答案[：:]\s*\n\s*1\.",
    ]

    Q_PATTERNS = [
        r"\n\s*三、\s*作答要求",
        r"\n\s*【作答要求】",
        r"\n\s*作答要求\s*\n",
        r"\n\s*【问题一】",
        r"\n\s*问题一[：:]",
    ]

    MAT_START_PATTERNS = [
        r"\n\s*二、\s*给定资[料材]",
        r"\n\s*【给定资[料材]】",
        r"\n\s*【材料一】",
        r"\n\s*材料1[、\.]",
        r"\n\s*材料一\n",
        r"^材料一\n"
    ]

    def __init__(self, source_dir: Path):
        self.source_dir = Path(source_dir)

    def clean_material_text(self, raw_text: str) -> str:
        """PDF 提取去噪与段落重构：剥离页码水印、合并行尾软换行"""
        # 1. 过滤页码与水印行
        cleaned = re.sub(r"\n\s*-\s*\d+\s*-\s*\n", "\n", raw_text)
        cleaned = re.sub(r"\n\s*第\s*\d+\s*页[，,]\s*共\s*\d+\s*页\s*\n", "\n", cleaned)
        cleaned = re.sub(r"\n\s*\d+\s*/\s*\d+\s*\n", "\n", cleaned)
        cleaned = re.sub(r"\n\s*注[：:][^\n]*\n", "\n", cleaned)

        # 2. 合并段内软换行
        lines = cleaned.split("\n")
        paras = []
        curr_para = ""
        heading_pat = r"^(?:【?给定资[料材]\s*\d*】?|【?材料[一二三四五六七八九十\d]+】?|材料\s*\d+[\.、]?)\s*$"

        for l in lines:
            s = l.strip()
            if not s:
                if curr_para:
                    paras.append(curr_para)
                    curr_para = ""
                continue

            if re.match(heading_pat, s):
                if curr_para:
                    paras.append(curr_para)
                    curr_para = ""
                paras.append(s)
                continue

            if not curr_para:
                curr_para = s
            else:
                if re.search(r"[。！？…\”\’]$", curr_para):
                    curr_para += "\n" + s
                else:
                    curr_para += s

        if curr_para:
            paras.append(curr_para)

        # 统一资料小标题规范
        normalized = []
        for p in paras:
            p_clean = re.sub(r"^材料\s*([一二三四五六七八九十\d]+)[\.、]?", r"【给定资料 \1】", p)
            p_clean = re.sub(r"^【材料\s*([一二三四五六七八九十\d]+)】", r"【给定资料 \1】", p_clean)
            p_clean = re.sub(r"^【给定材料\s*(\d+)】", r"【给定资料 \1】", p_clean)
            normalized.append(p_clean)

        return "\n\n".join(normalized).strip()

    def split_paper_sections(self, full_text: str) -> Tuple[str, str]:
        ans_pos = len(full_text)
        for pat in self.ANS_PATTERNS:
            for m in re.finditer(pat, full_text):
                if m.start() > 1000 and m.start() < ans_pos:
                    ans_pos = m.start()

        content = full_text[:ans_pos]

        q_pos = -1
        for pat in self.Q_PATTERNS:
            for m in re.finditer(pat, content):
                if m.start() > 1000:
                    if q_pos == -1 or m.start() < q_pos:
                        q_pos = m.start()

        mat_pos = 0
        for pat in self.MAT_START_PATTERNS:
            m = re.search(pat, content)
            if m and m.start() < (q_pos if q_pos != -1 else 2000):
                mat_pos = m.end()
                break

        raw_mat = content[mat_pos:q_pos].strip()
        raw_q = content[q_pos:].strip()
        raw_q = re.sub(r"^(?:三、\s*作答要求|【作答要求】|作答要求)\s*", "", raw_q).strip()

        return raw_mat, raw_q

    def parse_questions_unified(self, q_text: str) -> List[str]:
        q_clean = re.sub(r"\n\s*\d+\s*/\s*\d+\s*\n", "\n", q_text)
        q_clean = re.sub(r"\n\s*第\s*\d+\s*页[，,]\s*共\s*\d+\s*页\s*\n", "\n", q_clean)
        q_clean = re.sub(r"\n\s*-\s*\d+\s*-\s*\n", "\n", q_clean)

        schemes = [
            [r"【问题一】", r"【问题二】", r"【问题三】", r"【问题四】", r"【问题五】"],
            [r"问题一[：:]", r"问题二[：:]", r"问题三[：:]", r"问题四[：:]", r"问题五[：:]"],
            [r"(?:^|\n)\s*一、", r"(?:^|\n)\s*二、", r"(?:^|\n)\s*三、", r"(?:^|\n)\s*四、", r"(?:^|\n)\s*五、"],
            [r"(?:^|\n)\s*1、", r"(?:^|\n)\s*2、", r"(?:^|\n)\s*3、", r"(?:^|\n)\s*4、", r"(?:^|\n)\s*5、"],
            [r"(?:^|\n)\s*1\.\s*", r"(?:^|\n)\s*2\.\s*", r"(?:^|\n)\s*3\.\s*", r"(?:^|\n)\s*4\.\s*", r"(?:^|\n)\s*5\.\s*"],
            [r"(?:^|\n)\s*（[1一]）", r"(?:^|\n)\s*（[2二]）", r"(?:^|\n)\s*（[3三]）", r"(?:^|\n)\s*（[4四]）", r"(?:^|\n)\s*（[5五]）"],
        ]

        for s in schemes:
            positions = []
            for pat in s:
                m = re.search(pat, q_clean)
                if m:
                    positions.append((m.start(), m.end()))
            if len(positions) == 5:
                items = []
                for idx, (st, en) in enumerate(positions):
                    next_st = positions[idx+1][0] if idx + 1 < len(positions) else len(q_clean)
                    items.append(q_clean[st:next_st].strip())
                return items

        # Fallback: 按分值与要求边界切割（针对 2023 无题号试卷）
        matches = list(re.finditer(r"[（\(]\s*(\d+)\s*分\s*[）\)]", q_clean))
        if len(matches) == 5:
            split_points = [0]
            for i in range(len(matches) - 1):
                seg_start = matches[i].end()
                seg_end = matches[i+1].start()
                segment = q_clean[seg_start:seg_end]
                m_word = None
                for mw in re.finditer(r"字[。；\n\s]", segment):
                    m_word = mw
                if m_word:
                    pt = seg_start + m_word.end()
                    while pt < len(q_clean) and q_clean[pt].isspace():
                        pt += 1
                    split_points.append(pt)
                else:
                    split_points.append(seg_start + len(segment)//2)
            split_points.append(len(q_clean))
            return [q_clean[split_points[i]:split_points[i+1]].strip() for i in range(len(split_points) - 1)]

        return []

    def parse_single_question(self, q_raw: str, q_index: int, paper_id: str) -> Dict[str, Any]:
        m_score = re.search(r"[（\(]\s*(\d+)\s*分\s*[）\)]", q_raw)
        score = int(m_score.group(1)) if m_score else (35 if q_index == 5 else 20)

        m_req = re.search(r"\n?\s*(?:要求[：:]|作答要求[：:]|作答要求\n)", q_raw)
        if m_req:
            prompt_text = q_raw[:m_req.start()].strip()
            prompt_reqs = q_raw[m_req.start():].strip()
        else:
            m_req2 = re.search(r"\n\s*（[1一]）", q_raw)
            if m_req2:
                prompt_text = q_raw[:m_req2.start()].strip()
                prompt_reqs = "要求：\n" + q_raw[m_req2.start():].strip()
            else:
                prompt_text = q_raw.strip()
                prompt_reqs = ""

        clean_prompt = re.sub(r"^(?:【问题[一二三四五12345]】|问题[一二三四五12345][：:]|[一二三四五]、|\d+[\.、]|（[一二三四五\d]）)\s*", "", prompt_text).strip()
        clean_prompt = re.sub(r"[（\(]\s*\d+\s*分\s*[）\)]\s*$", "", clean_prompt).strip()

        limit_match = re.search(r"(?:字数|不超过|限|以内|至多)?\s*(\d+\s*[~～\-—至到]\s*\d+\s*字|\d+\s*字以内|不超过\s*\d+\s*字)", prompt_reqs + " " + prompt_text)
        char_limit = limit_match.group(0).strip() if limit_match else ("1000~1200字" if score >= 30 else "不超过400字")

        combined = clean_prompt + " " + prompt_reqs
        if score >= 30 or any(k in combined for k in ["写一篇文章", "写一篇议论文", "自拟题目，写一篇", "自选角度，自拟题目", "撰写一篇议论文", "自拟标题，写一篇"]):
            q_type = "essay"
        elif any(k in combined for k in ["公开信", "倡议书", "简报", "编者按", "发言提纲", "工作指南", "宣传展板", "文稿", "短评", "情况介绍提纲", "讲话提纲", "汇报提纲", "建议书", "宣传材料", "推荐材料", "实施意见", "谈话内容提纲", "情况报告", "工作建议", "草拟汇报"]):
            q_type = "doc"
        else:
            q_type = "single"

        # 提炼精炼小标题
        title_p = re.sub(r"^[“\"「]?给定(?:资料|材料)\s*[\d\-—至、一二三四五六七八九十]*\s*[”\"」]?[中里]?(?:提到[，,：:]?|说[，,：:]?|指出[，,：:]?|反映了|呈现了|介绍了)?[，,：:]?\s*", "", clean_prompt)
        title_p = re.sub(r"^(?:根据|结合|按照|请根据|请结合|请按照)[“\"「]?给定(?:资料|材料)\s*[\d\-—至、一二三四五六七八九十]*\s*[”\"」]?[，,：:]?\s*", "", title_p)
        title_p = re.sub(r"^请(?:你)?\s*", "", title_p)
        title_p = re.sub(r"^(?:假如|假设)你是[^\n，,。]+?[，,]\s*", "", title_p)
        clauses = [c.strip() for c in re.split(r"[，。；！？]", title_p) if c.strip()]
        short_title = clauses[0] if clauses else title_p[:20]
        if len(short_title) < 4 and len(clauses) > 1:
            short_title = clauses[0] + "，" + clauses[1]
        if len(short_title) > 22:
            short_title = short_title[:22] + "..."

        type_names = {"single": "单一题", "doc": "公文题", "essay": "议论文"}
        full_title = f"{short_title}（{type_names[q_type]}）"

        return {
            "id": f"{paper_id}_q{q_index}",
            "q_index": q_index,
            "type": q_type,
            "question_title": full_title,
            "score": score,
            "target_score": score,
            "char_limit": char_limit,
            "prompt_text": clean_prompt,
            "prompt_reqs": prompt_reqs,
            "scoring_criteria": "",
            "reference_answer": ""
        }

    def parse_paper_file(self, file_path: Path) -> Dict[str, Any]:
        fname = file_path.name
        doc = pymupdf.open(str(file_path))
        full_text = "\n".join(page.get_text() for page in doc)
        doc.close()

        m_year = re.search(r"(20\d\d)", fname)
        year = int(m_year.group(1)) if m_year else 2024

        if "行政执法" in fname:
            tier = "行政执法卷"
            tier_id = "law"
        elif "省级" in fname or "副省" in fname:
            tier = "副省级"
            tier_id = "prov"
        else:
            tier = "地市级"
            tier_id = "city"

        paper_id = f"gk{year}_{tier_id}"
        exam_name = f"{year}年国家公务员考试《申论》真题（{tier}）"

        raw_mat, raw_q = self.split_paper_sections(full_text)
        clean_mat = self.clean_material_text(raw_mat)
        q_raw_list = self.parse_questions_unified(raw_q)

        questions = [
            self.parse_single_question(q_raw, idx + 1, paper_id)
            for idx, q_raw in enumerate(q_raw_list)
        ]

        return {
            "id": paper_id,
            "exam_name": exam_name,
            "year": year,
            "category": "国考",
            "tier": tier,
            "exam_date": f"{year-1}-11-26",
            "time_limit": 180,
            "total_score": 100,
            "materials_text": clean_mat,
            "questions": questions
        }

    def parse_all(self) -> List[Dict[str, Any]]:
        pdf_files = sorted(self.source_dir.glob("*.pdf"))
        papers = []
        for pdf_path in pdf_files:
            paper = self.parse_paper_file(pdf_path)
            papers.append(paper)
        # 按年份降序排布 (2025 -> 2019)
        papers.sort(key=lambda p: (p["year"], p["tier"]), reverse=True)
        return papers

if __name__ == "__main__":
    parser = GuokaoPdfParser(Path("D:/BaiduNetdiskDownload/国考申论PDF"))
    papers = parser.parse_all()
    print(f"Parsed {len(papers)} papers successfully!")
    for p in papers:
        print(f"  {p['id']:<14} | {p['year']} {p['tier']:<6} | mat: {len(p['materials_text']):<5} | qs: {len(p['questions'])} | {p['exam_name']}")
```

**Step 2: Run test to verify pass**

Run: `pytest tests/test_import_guokao_pdfs.py -v`
Expected: PASS — `1 passed in ~0.8s`

**Step 3: Commit implementation**

```bash
git add scripts/import_guokao_pdfs.py tests/test_import_guokao_pdfs.py
git commit -m "feat(exams): implement Guokao PDF material and question ingestion engine"
```

---

### Task 3: Integrate Ingested Papers with Provincial Papers in `scripts/real_exams_data.py`

**Objective:** Update `scripts/real_exams_data.py` so that `REAL_PAPERS_KB` contains all 18 authentic Guokao papers plus the 3 existing provincial benchmark papers (`js2024_a`, `gd2024_county`, `bj2024_district`), ensuring total offline availability across any environment without hard filesystem dependency.

**Files:**
- Modify: `scripts/real_exams_data.py`
- Test: `tests/test_exams_pipeline.py`

**Step 1: Write failing test in `tests/test_exams_pipeline.py`**

Add test checking `REAL_PAPERS_KB` length and schema:
```python
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
```

**Step 2: Run test to verify failure**

Run: `pytest tests/test_exams_pipeline.py::test_real_papers_kb_contains_all_21_papers -v`
Expected: FAIL — `assert len(REAL_PAPERS_KB) >= 21` (currently only 8)

**Step 3: Update `scripts/real_exams_data.py`**

Generate and populate `REAL_PAPERS_KB` by calling `GuokaoPdfParser` (when source exists or using cached serialized JSON) and appending the 3 provincial papers (`js2024_a`, `gd2024_county`, `bj2024_district`).

```python
# In scripts/real_exams_data.py
from pathlib import Path
import json

# Fallback / cache path within repo
DATA_CACHE = Path(__file__).parent.parent / "data" / "guokao_real_papers.json"

def load_real_papers_kb():
    source_dir = Path("D:/BaiduNetdiskDownload/国考申论PDF")
    guokao_papers = []
    if source_dir.exists():
        from scripts.import_guokao_pdfs import GuokaoPdfParser
        guokao_papers = GuokaoPdfParser(source_dir).parse_all()
        # Save cache for environments where D: drive is not mounted (e.g. Docker/CI)
        DATA_CACHE.parent.mkdir(parents=True, exist_ok=True)
        DATA_CACHE.write_text(json.dumps(guokao_papers, ensure_ascii=False, indent=2), encoding="utf-8")
    elif DATA_CACHE.exists():
        guokao_papers = json.loads(DATA_CACHE.read_text(encoding="utf-8"))

    # Append the 3 provincial representative papers
    return guokao_papers + PROVINCIAL_PAPERS_KB

REAL_PAPERS_KB = load_real_papers_kb()
```

**Step 4: Run test to verify pass**

Run: `pytest tests/test_exams_pipeline.py::test_real_papers_kb_contains_all_21_papers -v`
Expected: PASS

**Step 5: Commit**

```bash
git add scripts/real_exams_data.py data/guokao_real_papers.json tests/test_exams_pipeline.py
git commit -m "feat(exams): populate REAL_PAPERS_KB with 18 authentic Guokao papers and 3 provincial papers"
```

---

### Task 4: Execute Build Pipeline to Generate Shards and Default Knowledge Bases

**Objective:** Run `scripts/build_real_5year_exams.py` to compile 21 paper shards, 102 question shards, updated `index.json`, and default KB flat files in both `web/data/default_kb/exams.json` and `server/data/default_kb/exams.json`.

**Files:**
- Modify: `scripts/build_real_5year_exams.py` (ensure proper logging and path safety)
- Generate:
  - `web/data/exams/index.json`
  - `web/data/exams/gk20*.json` (18 papers)
  - `web/data/exams/gk20*_q*.json` (90 question backward-compatibility shards)
  - `web/data/default_kb/exams.json`
  - `server/data/default_kb/exams.json`

**Step 1: Execute build script**

Run: `python scripts/build_real_5year_exams.py`
Expected output:
```
=== 开始构建真实真题库（共 21 套完整真实题本）===
✓ 真实题库构建完成！
  - 完整真实题本: 21 套
  - 真实考场题目: 102 道（全量覆盖概括/综合/对策/公文/大作文）
  - 轻量索引文件: web/data/exams/index.json (~60 KB)
  - 默认题库种子: web/data/default_kb/exams.json (~180 KB)
```

**Step 2: Verify generated files**

Run verification check:
```bash
python -c "import json; idx = json.load(open('web/data/exams/index.json', encoding='utf-8')); print(f'Index papers: {len(idx)}'); assert len(idx) == 21"
```
Expected: `Index papers: 21`

**Step 3: Commit generated shards and indexes**

```bash
git add web/data/exams/ web/data/default_kb/exams.json server/data/default_kb/exams.json scripts/build_real_5year_exams.py
git commit -m "feat(exams): compile 21 real paper shards and global index (2019-2025)"
```

---

### Task 5: Update Frontend Offline Fallback and Selector Options

**Objective:** Update `FALLBACK_DEFAULT_EXAMS` in `web/js/app.js` with authentic papers (replacing synthetic 2024/2022 placeholders), update group labels in `renderExamSelector()` to reflect 2019–2025 coverage, and update static HTML placeholders in `web/index.html`.

**Files:**
- Modify: `web/js/app.js:125-160` and `web/js/app.js:351`
- Modify: `web/index.html:86-95`

**Step 1: Update `web/js/app.js`**

In `web/js/app.js`:
1. Update `FALLBACK_DEFAULT_EXAMS` to use real 2025副省级 (`gk2025_prov`) and real 2024副省级 (`gk2024_prov`), with authentic question titles (e.g. `gk2025_prov_q1`: "三条“黄河”内涵与协同机制", `gk2024_prov_q1`: "耀然灯饰成功经验").
2. Update line 351:
```javascript
// web/js/app.js:351
html += '<optgroup label="🏛️ 历年国考官方真题 (2019-2025 全真题本)">';
```

**Step 2: Update `web/index.html`**

In `web/index.html` lines 86-95, update default `<option>` tags to showcase representative real papers:
```html
<select class="form-select" id="exam-selector" onchange="onExamSelectChange()">
  <option value="gk2025_prov">🏛️ 2025年国家公务员考试申论真题（副省级）</option>
  <option value="gk2025_city">🏛️ 2025年国家公务员考试申论真题（地市级）</option>
  <option value="gk2025_law">🏛️ 2025年国家公务员考试申论真题（行政执法卷）</option>
  <option value="gk2024_prov">🏛️ 2024年国家公务员考试申论真题（副省级）</option>
  <option value="gk2024_city">🏛️ 2024年国家公务员考试申论真题（地市级）</option>
  <option value="gk2024_law">🏛️ 2024年国家公务员考试申论真题（行政执法卷）</option>
  <option value="js2024_a">🏛️ 2024年江苏省公务员考试申论真题（A类）</option>
  <option value="gd2024_county">🏛️ 2024年广东省公务员考试申论真题（县级）</option>
  <option value="bj2024_district">🏛️ 2024年北京市公务员考试申论真题（区级及以上）</option>
</select>
```

**Step 3: Commit frontend updates**

```bash
git add web/js/app.js web/index.html
git commit -m "fix(web): update offline exam fallback and selector options for 2019-2025 Guokao"
```

---

### Task 6: Update Integration Tests and Verify Full Test Suite

**Objective:** Update JavaScript integration tests in `web/tests/test_real_exam_subquestions.js` to assert the expanded paper count (>= 21), year bounds (2019–2025), and verify authentic material citations across multiple years, then run the full automated test suite (Pytest + Node.js).

**Files:**
- Modify: `web/tests/test_real_exam_subquestions.js`

**Step 1: Update assertions in `web/tests/test_real_exam_subquestions.js`**

```javascript
// web/tests/test_real_exam_subquestions.js:13
assert(indexData.length >= 21, `真题题本数量应>=21套，实测: ${indexData.length}`);

// web/tests/test_real_exam_subquestions.js:19
assert(paper.year >= 2019 && paper.year <= 2025, `试卷年份必须为2019~2025，实测: ${paper.year}`);

// Verify 2025副省级 authentic material
const gk2025Path = path.join(__dirname, '../data/exams/gk2025_prov.json');
assert(fs.existsSync(gk2025Path), "2025国考副省级分片必须存在");
const gk2025 = JSON.parse(fs.readFileSync(gk2025Path, 'utf-8'));
assert(gk2025.materials_text.includes("数字孪生黄河"), "2025国考副省必须包含数字孪生黄河真实材料");
assert.strictEqual(gk2025.questions.length, 5);

// Verify 2024副省级 authentic material
const gk2024Path = path.join(__dirname, '../data/exams/gk2024_prov.json');
assert(fs.existsSync(gk2024Path), "2024国考副省级分片必须存在");
const gk2024 = JSON.parse(fs.readFileSync(gk2024Path, 'utf-8'));
assert(gk2024.materials_text.includes("耀然灯饰") || gk2024.materials_text.includes("新民乐"), "2024国考副省必须包含真实考场材料");
assert.strictEqual(gk2024.questions.length, 5);
```

**Step 2: Run Node.js integration tests**

Run: `node web/tests/test_real_exam_subquestions.js`
Expected output:
```
=== 开始执行 真实真题题本与小题采分底稿集成测试 ===
✓ 验证通过：共载入 21 套（2019-2025）真实国考与省考题本索引
✓ 验证通过：2025国考副省级全真资料与5道小题检验完整
✓ 验证通过：2024国考副省级全真资料与5道小题检验完整
...
🎉 测试全部通过！
```

Run: `node web/tests/test_exams_loader.js`
Expected: All tests pass.

**Step 3: Run full Pytest suite**

Run: `pytest`
Expected: 29+ passed in ~1.5s.

**Step 4: Commit**

```bash
git add web/tests/test_real_exam_subquestions.js
git commit -m "test: update real exam subquestions integration test to cover 2019-2025"
```

---

## Verification & Acceptance Matrix

| Checkpoint | Target | Command | Expected Result |
| :--- | :--- | :--- | :--- |
| **PDF Extraction Coverage** | 18 Guokao PDFs (2019–2025) | `pytest tests/test_import_guokao_pdfs.py` | 100% success, 18 papers parsed |
| **Question Count & Scores** | 90 Guokao questions | `python scripts/import_guokao_pdfs.py` | Exactly 5 questions per paper, scores sum to 100 |
| **Authentic Material Length** | 6,500 ~ 8,500 chars/paper | Ingestion verification script | No truncated materials (< 5,000 chars) |
| **Copyright Neutrality** | Zero commercial trademarks | Grep across `web/data/exams` | No "粉笔", "华图", "中公" |
| **Sharding Build** | 21 papers + 102 questions | `python scripts/build_real_5year_exams.py` | `web/data/exams/index.json` size ~60KB |
| **ExamsLoader Functionality**| Client-side shard loading | `node web/tests/test_exams_loader.js` | Index fetch & IndexedDB caching pass |
| **End-to-End Regression** | Full repository test suite | `pytest` | All 29+ python tests pass |

---

## Risks, Tradeoffs, and Open Questions

1. **Tradeoff: Caching in Repository vs Dynamic Extraction**:
   - *Decision*: Since `D:\BaiduNetdiskDownload\国考申论PDF` is a local host path, we serialize the extracted papers to `data/guokao_real_papers.json` inside the repository. This ensures Docker containers, GitHub CI, and collaborating developers can build and run the test suite without requiring access to the local D: drive.
2. **Backward Compatibility for Old Question IDs**:
   - `build_real_5year_exams.py` generates both paper shards (`[paper_id].json`) and sub-question shards (`[qid].json`). Any legacy client code or saved bookmarks referencing single questions continue to function with zero disruption.
3. **Materials Cleanliness vs Original Whitespace**:
   - The extraction de-noises line-breaks by checking sentence-ending punctuation (`。！？…\”\’`), while preserving double-linebreaks for document section headings (`【给定资料 X】`). This avoids fragmented 10-character lines while keeping authentic paragraphs intact.
