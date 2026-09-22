#!/usr/bin/env python3
"""
scripts/extract_doc_question_corpus.py
公文题四轨切片对齐提取脚本：从讲稿、复盘、评分参考、参考答案中抽取 8 道公文题/贯彻执行题完整台账
包含宏观审题 (Pass 1) 与逐段精讲 (Pass 2) 的全量录音转写切片。
"""
import os
import re
import json
import zipfile
import xml.etree.ElementTree as ET
from pathlib import Path

BASE_DIR = Path(r"D:\BaiduNetdiskDownload\申论-skill提炼材料")
OUTPUT_DIR = Path("data/doc_question_corpus")
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

def read_docx_paras(path: Path) -> list[str]:
    if not path.exists():
        return []
    with zipfile.ZipFile(path) as z:
        xml_content = z.read('word/document.xml')
        root = ET.fromstring(xml_content)
        paras = []
        for p in root.iter('{http://schemas.openxmlformats.org/wordprocessingml/2006/main}p'):
            texts = [node.text for node in p.iter('{http://schemas.openxmlformats.org/wordprocessingml/2006/main}t') if node.text]
            if texts:
                paras.append(''.join(texts))
        return paras

def get_lecture_fulltext(path: Path) -> str:
    paras = read_docx_paras(path)
    return "\n".join(paras)

DOC_QUESTION_SPECS = [
    {
        "set_id": "set1",
        "set_name": "第一套（2025年国考地市卷）",
        "q_num": 4,
        "slug": "yuan_science_popularization_proposal",
        "doc_category": "建议提案类（政协提案）",
        "ans_file": "20251009申论套题第一节答案.docx",
        "rev_file": "第一套题目思路复盘.docx",
        "rub_file": "第二套题目得分参考.docx",
        "lec_file": "20251009 申论1讲解.doc",
        "ans_pattern": r'(?:四、|4、)(?:假如你是S市政协委员|.*元科普)',
        "rev_pattern": r'(?:四、|4、)(?:假如你是S市政协委员|.*元科普)',
        "rub_pattern": r'(?:四、|4、).*',
        "macro_start": 3800,
        "macro_end": 5700,
        "detail_start": 31832,
        "detail_end": 39731
    },
    {
        "set_id": "set2",
        "set_name": "第二套（2025年国考行政执法卷）",
        "q_num": 3,
        "slug": "jinzhou_granary_propaganda_board",
        "doc_category": "宣传展示类（展板文稿）",
        "ans_file": "20251013申论套题第二节答案.docx",
        "rev_file": "第二套题目复盘.docx",
        "rub_file": "第二套题目得分参考.docx",
        "lec_file": "20251013 申论2讲解.doc",
        "ans_pattern": r'(?:三、|3、).*今州粮仓',
        "rev_pattern": r'(?:三、|3、).*今州粮仓',
        "rub_pattern": r'(?:三、|3、).*今州粮仓',
        "macro_start": 3800,
        "macro_end": 5200,
        "detail_start": 27228,
        "detail_end": 33211
    },
    {
        "set_id": "set3",
        "set_name": "第三套（2024年国考行政执法卷）",
        "q_num": 3,
        "slug": "night_market_safety_patrol_guide",
        "doc_category": "工作规程类（巡查工作指南）",
        "ans_file": "20251017申论套题第三节答案.docx",
        "rev_file": "第三套题目思路复盘.docx",
        "rub_file": "第三套题目评分参考.docx",
        "lec_file": "20251017 申论3讲解.doc",
        "ans_pattern": r'(?:三、|3、).*安全巡查工作指南',
        "rev_pattern": r'(?:三、|3、).*安全巡查工作指南',
        "rub_pattern": r'(?:三、|3、).*安全巡查工作指南',
        "macro_start": 3500,
        "macro_end": 5200,
        "detail_start": 23448,
        "detail_end": 31500
    },
    {
        "set_id": "set3",
        "set_name": "第三套（2024年国考行政执法卷）",
        "q_num": 4,
        "slug": "pharmaceutical_conversation_outline",
        "doc_category": "面对面沟通类（当面谈话提纲）",
        "ans_file": "20251017申论套题第三节答案.docx",
        "rev_file": "第三套题目思路复盘.docx",
        "rub_file": "第三套题目评分参考.docx",
        "lec_file": "20251017 申论3讲解.doc",
        "ans_pattern": r'(?:四、|4、).*谈话内容提纲',
        "rev_pattern": r'(?:四、|4、).*谈话内容提纲',
        "rub_pattern": r'(?:四、|4、).*谈话内容提纲',
        "macro_start": 5200,
        "macro_end": 6650,
        "detail_start": 31500,
        "detail_end": 39632
    },
    {
        "set_id": "set4",
        "set_name": "第四套（2023年国考行政执法卷）",
        "q_num": 4,
        "slug": "research_report_and_improvement_outline",
        "doc_category": "调研汇报类（调研情况与建议提纲）",
        "ans_file": "20251021申论套题第四节答案.docx",
        "rev_file": "第四套题目复盘.docx",
        "rub_file": "第四套题目评分参考.docx",
        "lec_file": "20251021 申论4讲解.doc",
        "ans_pattern": r'(?:四、|4、).*汇报调研情况',
        "rev_pattern": r'(?:四、|4、).*汇报调研情况',
        "rub_pattern": r'(?:四、|4、).*汇报调研情况',
        "macro_start": 4200,
        "macro_end": 5726,
        "detail_start": 33096,
        "detail_end": 40621
    },
    {
        "set_id": "set5",
        "set_name": "第五套（2022年国考行政执法卷）",
        "q_num": 2,
        "slug": "unmanned_economy_symposium_speech",
        "doc_category": "会议交流类（座谈会发言提纲）",
        "ans_file": "20251025申论套题第五节答案.docx",
        "rev_file": "第五套题目思路复盘.docx",
        "rub_file": "第五套题目评分参考.docx",
        "lec_file": "20251025 申论5讲解.doc",
        "ans_pattern": r'(?:二、|2、).*无人经济.*发言提纲',
        "rev_pattern": r'(?:二、|2、).*无人经济.*发言提纲',
        "rub_pattern": r'(?:二、|2、).*无人经济.*发言提纲',
        "macro_start": 1800,
        "macro_end": 3700,
        "detail_start": 14131,
        "detail_end": 22019
    },
    {
        "set_id": "set5",
        "set_name": "第五套（2022年国考行政执法卷）",
        "q_num": 3,
        "slug": "language_rectification_report_outline",
        "doc_category": "整治行动类（联合整治思路汇报提纲）",
        "ans_file": "20251025申论套题第五节答案.docx",
        "rev_file": "第五套题目思路复盘.docx",
        "rub_file": "第五套题目评分参考.docx",
        "lec_file": "20251025 申论5讲解.doc",
        "ans_pattern": r'(?:三、|3、).*整治工作.*汇报提纲',
        "rev_pattern": r'(?:三、|3、).*整治工作.*汇报提纲',
        "rub_pattern": r'(?:三、|3、).*整治工作.*汇报提纲',
        "macro_start": 3700,
        "macro_end": 5500,
        "detail_start": 22019,
        "detail_end": 31131
    },
    {
        "set_id": "set6",
        "set_name": "第六套（2021年国考地市卷）",
        "q_num": 1,
        "slug": "community_governance_recommendation_points",
        "doc_category": "典型推荐类（优秀案例推荐要点）",
        "ans_file": "20251029申论套题第六节答案.docx",
        "rev_file": "第六套题目复盘.docx",
        "rub_file": "第六套题目评分参考.docx",
        "lec_file": "20251029 申论6讲解.doc",
        "ans_pattern": r'(?:一、|1、).*推荐材料.*要点',
        "rev_pattern": r'(?:一、|1、).*推荐材料.*要点',
        "rub_pattern": r'(?:一、|1、).*推荐材料.*要点',
        "macro_start": 124,
        "macro_end": 1800,
        "detail_start": 5464,
        "detail_end": 13358
    }
]

def partition_text_by_pattern(paras: list[str], pattern: str) -> str:
    full = "\n".join(paras)
    matches = list(re.finditer(r'\n(?=[一二三四五]、|\d+、)', full))
    if not matches:
        return full
    
    sections = []
    starts = [0] + [m.start() for m in matches] + [len(full)]
    for i in range(len(starts) - 1):
        sec = full[starts[i]:starts[i+1]].strip()
        if re.search(pattern, sec):
            sections.append(sec)
    return "\n\n".join(sections) if sections else ""

def main():
    print("=== 开始提取 8 道公文题/贯彻执行题四轨同构切片 ===")
    total_lecture_chars = 0

    for spec in DOC_QUESTION_SPECS:
        sid = spec["set_id"]
        qnum = spec["q_num"]
        slug = spec["slug"]

        ans_path = BASE_DIR / "套题答案" / spec["ans_file"]
        rev_path = BASE_DIR / "题目复盘" / spec["rev_file"]
        rub_path = BASE_DIR / "评分参考" / spec["rub_file"]
        lec_path = BASE_DIR / "题目讲解" / spec["lec_file"]

        ans_paras = read_docx_paras(ans_path)
        rev_paras = read_docx_paras(rev_path)
        rub_paras = read_docx_paras(rub_path)
        lec_full = get_lecture_fulltext(lec_path)

        ans_sec = partition_text_by_pattern(ans_paras, spec["ans_pattern"])
        rev_sec = partition_text_by_pattern(rev_paras, spec["rev_pattern"])
        rub_sec = partition_text_by_pattern(rub_paras, spec["rub_pattern"])

        # 提取审题要求与字数限制
        limit_match = re.search(r'(?:不超过|限|以内|至多)?\s*(\d+)\s*字', rev_sec or ans_sec)
        word_limit = int(limit_match.group(1)) if limit_match else 450

        score_match = re.search(r'（(\d+)\s*分）', rev_sec or ans_sec)
        score = int(score_match.group(1)) if score_match else 20

        # 双切片拼接：宏观审题 (Pass 1) + 逐段精讲 (Pass 2)
        lec_macro = lec_full[spec["macro_start"]:spec["macro_end"]].strip()
        lec_detail = lec_full[spec["detail_start"]:spec["detail_end"]].strip()
        lec_combined = f"【Part 1: 题型速判与审题宏观透视】\n{lec_macro}\n\n【Part 2: 给定材料逐段精讲与采分点拆解】\n{lec_detail}"
        total_lecture_chars += len(lec_combined)

        dossier = {
            "set_id": sid,
            "set_name": spec["set_name"],
            "q_num": qnum,
            "slug": slug,
            "question_type": "doc",
            "doc_category": spec["doc_category"],
            "target_score": score,
            "word_limit": word_limit,
            "prompt": rev_sec.split("\n")[0] if rev_sec else "",
            "gold_answer": ans_sec,
            "mentor_review": rev_sec,
            "scoring_rubric": rub_sec,
            "lecture_macro": lec_macro,
            "lecture_detail": lec_detail,
            "lecture_transcript_slice": lec_combined
        }

        out_path = OUTPUT_DIR / f"{sid}_q{qnum}_{slug}.json"
        out_path.write_text(json.dumps(dossier, ensure_ascii=False, indent=2), encoding="utf-8")
        print(f"✓ [{sid} Q{qnum}] {spec['doc_category']} -> {out_path.name} (讲稿: {len(lec_combined)} 字)")

    print(f"\n✓ 8 道公文题四轨切片提取完毕！总讲稿文字: {total_lecture_chars:,} 字。")

if __name__ == "__main__":
    main()
