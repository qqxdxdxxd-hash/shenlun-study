#!/usr/bin/env python3
"""
构建最近 5 年（2020-2024）真实国考与各省省考申论题库
结合高教公考 (sanlianbook.com) 真实真题与采分底稿数据
"""
import json
import re
import sys
from pathlib import Path
from typing import Dict, List, Any

sys.path.insert(0, str(Path(__file__).parent.parent))

# 引入权威全真试卷与采分点底稿库 (涵盖国考省级/市地级/行政执法，及江苏/浙江/山东/广东/北京/四川等省考最近5年)
from scripts.real_exams_data import REAL_PAPERS_KB

def build_real_exams(output_dir: Path, default_kb_file: Path):
    output_dir.mkdir(parents=True, exist_ok=True)
    default_kb_file.parent.mkdir(parents=True, exist_ok=True)

    papers = REAL_PAPERS_KB
    print(f"=== 开始构建真实真题库（共 {len(papers)} 套完整真实题本）===")

    index_list = []
    total_questions = 0

    # 兼容平铺题目列表 (用于纯平铺模式兼容旧接口)
    flat_questions = []

    for paper in papers:
        paper_id = paper["id"]
        exam_name = paper["exam_name"]
        year = paper.get("year", 2022)
        category = paper.get("category", "国考")
        tier = paper.get("tier", "省级")
        materials_text = paper.get("materials_text", "")
        questions = paper.get("questions", [])
        total_questions += len(questions)

        # 1. 构建试卷元信息索引
        q_summaries = []
        for q in questions:
            q_summaries.append({
                "id": q["id"],
                "q_index": q.get("q_index", 1),
                "type": q.get("type", "single"),
                "question_title": q.get("question_title", ""),
                "target_score": q.get("target_score", 20),
                "char_limit": q.get("char_limit", "")
            })

            # 平铺条目
            flat_item = {
                "id": q["id"],
                "paper_id": paper_id,
                "exam_name": exam_name,
                "year": year,
                "category": category,
                "tier": tier,
                "q_index": q.get("q_index", 1),
                "question_type": q.get("type", "single"),
                "question_title": q.get("question_title", ""),
                "prompt_text": q.get("prompt_text", ""),
                "prompt_reqs": q.get("prompt_reqs", ""),
                "target_score": q.get("target_score", 20),
                "materials": materials_text,
                "scoring_criteria": q.get("scoring_criteria", ""),
                "reference_answer": q.get("reference_answer", "")
            }
            flat_questions.append(flat_item)

        # 写入轻量试卷索引
        index_list.append({
            "id": paper_id,
            "exam_name": exam_name,
            "year": year,
            "category": category,
            "tier": tier,
            "char_count": len(materials_text),
            "question_count": len(questions),
            "questions_summary": q_summaries
        })

        # 2. 单卷分片独立落盘 (包含题本全部材料与全部小题采分底稿)
        paper_file = output_dir / f"{paper_id}.json"
        paper_file.write_text(json.dumps(paper, ensure_ascii=False, indent=2), encoding="utf-8")

        # 同时也为每个小题单独生成分片，实现 100% 向下兼容旧版 ExamsLoader.getExamDetail(qid)
        for q in questions:
            qid = q["id"]
            q_file = output_dir / f"{qid}.json"
            q_detail = {
                "id": qid,
                "paper_id": paper_id,
                "exam_name": exam_name,
                "question_type": q.get("type", "single"),
                "question_title": q.get("question_title", ""),
                "prompt_text": q.get("prompt_text", ""),
                "prompt_reqs": q.get("prompt_reqs", ""),
                "target_score": q.get("target_score", 20),
                "materials": materials_text,
                "scoring_criteria": q.get("scoring_criteria", ""),
                "reference_answer": q.get("reference_answer", "")
            }
            q_file.write_text(json.dumps(q_detail, ensure_ascii=False, indent=2), encoding="utf-8")

    # 3. 写入全局轻量索引 index.json
    index_file = output_dir / "index.json"
    index_file.write_text(json.dumps(index_list, ensure_ascii=False, indent=2), encoding="utf-8")

    # 4. 写回 web/data/default_kb/exams.json 与 server/data/default_kb/exams.json
    default_kb_file.write_text(json.dumps(flat_questions, ensure_ascii=False, indent=2), encoding="utf-8")
    server_kb_file = Path("server/data/default_kb/exams.json")
    if server_kb_file.parent.exists():
        server_kb_file.write_text(json.dumps(flat_questions, ensure_ascii=False, indent=2), encoding="utf-8")

    index_kb = index_file.stat().st_size / 1024
    print(f"✓ 真实题库构建完成！")
    print(f"  - 完整真实题本: {len(papers)} 套")
    print(f"  - 真实考场题目: {total_questions} 道（全量覆盖概括/综合/对策/公文/大作文）")
    print(f"  - 轻量索引文件: {index_file} ({index_kb:.2f} KB)")
    print(f"  - 默认题库种子: {default_kb_file} ({default_kb_file.stat().st_size / 1024:.2f} KB)")

if __name__ == "__main__":
    build_real_exams(Path("web/data/exams"), Path("web/data/default_kb/exams.json"))
