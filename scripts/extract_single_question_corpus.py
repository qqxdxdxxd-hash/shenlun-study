#!/usr/bin/env python3
"""
scripts/extract_single_question_corpus.py
四轨切片对齐提取脚本：从讲稿、复盘、评分参考、参考答案中抽取 16 道单一题完整台账
包含宏观审题 (Pass 1) 与逐段精讲 (Pass 2) 的全量录音转写切片。
"""
import os
import re
import json
import zipfile
import xml.etree.ElementTree as ET
from pathlib import Path

BASE_DIR = Path(r"D:\BaiduNetdiskDownload\申论-skill提炼材料")
OUTPUT_DIR = Path("data/single_question_corpus")
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

def read_docx_paras(path: Path) -> list[str]:
    """读取 docx 或以 .doc 命名的 zip-xml 文档段落"""
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

# 16道单一题双切片定位定义
QUESTION_SPECS = [
    # 第一套 (2025地市)
    {
        "set_id": "set1",
        "set_name": "2025年国考地市级",
        "q_num": 1,
        "slug": "grape_ecological_wisdom",
        "type": "做法归纳",
        "ans_file": "20251009申论套题第一节答案.docx",
        "review_file": "第一套题目思路复盘.docx",
        "rubric_file": None,
        "lecture_file": "20251009 申论1讲解.doc",
        "macro_range": (165, 961),
        "detail_range": (5725, 15170),
    },
    {
        "set_id": "set1",
        "set_name": "2025年国考地市级",
        "q_num": 2,
        "slug": "water_governance_interaction",
        "type": "协同机制/分析与做法",
        "ans_file": "20251009申论套题第一节答案.docx",
        "review_file": "第一套题目思路复盘.docx",
        "rubric_file": None,
        "lecture_file": "20251009 申论1讲解.doc",
        "macro_range": (961, 2268),
        "detail_range": (15170, 22932),
    },
    {
        "set_id": "set1",
        "set_name": "2025年国考地市级",
        "q_num": 3,
        "slug": "forest_ticket_reform",
        "type": "成效与建议复合单一题",
        "ans_file": "20251009申论套题第一节答案.docx",
        "review_file": "第一套题目思路复盘.docx",
        "rubric_file": None,
        "lecture_file": "20251009 申论1讲解.doc",
        "macro_range": (2268, 3455),
        "detail_range": (22932, 31832),
    },

    # 第二套 (2024地市)
    {
        "set_id": "set2",
        "set_name": "2024年国考地市级",
        "q_num": 1,
        "slug": "three_yellow_rivers",
        "type": "概念内涵与协同做法",
        "ans_file": "20251013申论套题第二节答案.docx",
        "review_file": "第二套题目复盘.docx",
        "rubric_file": "第二套题目得分参考.docx",
        "lecture_file": "20251013 申论2讲解.doc",
        "macro_range": (387, 2656),
        "detail_range": (7158, 17441),
    },
    {
        "set_id": "set2",
        "set_name": "2024年国考地市级",
        "q_num": 2,
        "slug": "not_industry_became_industry",
        "type": "词句理解/综合分析",
        "ans_file": "20251013申论套题第二节答案.docx",
        "review_file": "第二套题目复盘.docx",
        "rubric_file": "第二套题目得分参考.docx",
        "lecture_file": "20251013 申论2讲解.doc",
        "macro_range": (2656, 3987),
        "detail_range": (17441, 27228),
    },
    {
        "set_id": "set2",
        "set_name": "2024年国考地市级",
        "q_num": 4,
        "slug": "data_annotation_problems_and_measures",
        "type": "问题与对策复合单一题",
        "ans_file": "20251013申论套题第二节答案.docx",
        "review_file": "第二套题目复盘.docx",
        "rubric_file": "第二套题目得分参考.docx",
        "lecture_file": "20251013 申论2讲解.doc",
        "macro_range": (4808, 6819),
        "detail_range": (33211, 40000),
    },

    # 第三套 (2023执法)
    {
        "set_id": "set3",
        "set_name": "2023年国考行政执法卷",
        "q_num": 1,
        "slug": "hightech_industry_measures",
        "type": "做法归纳",
        "ans_file": "20251017申论套题第三节答案.docx",
        "review_file": "第三套题目思路复盘.docx",
        "rubric_file": "第三套题目评分参考.docx",
        "lecture_file": "20251017 申论3讲解.doc",
        "macro_range": (479, 1285),
        "detail_range": (6650, 14476),
    },
    {
        "set_id": "set3",
        "set_name": "2023年国考行政执法卷",
        "q_num": 2,
        "slug": "trade_union_service_pattern",
        "type": "做法机制/单一分析",
        "ans_file": "20251017申论套题第三节答案.docx",
        "review_file": "第三套题目思路复盘.docx",
        "rubric_file": "第三套题目评分参考.docx",
        "lecture_file": "20251017 申论3讲解.doc",
        "macro_range": (1285, 1947),
        "detail_range": (14476, 23448),
    },

    # 第四套 (2022执法)
    {
        "set_id": "set4",
        "set_name": "2022年国考行政执法卷",
        "q_num": 1,
        "slug": "lighting_firm_experience",
        "type": "经验做法归纳",
        "ans_file": "20251021申论套题第四节答案.docx",
        "review_file": "第四套题目复盘.docx",
        "rubric_file": "第四套题目评分参考.docx",
        "lecture_file": "20251021 申论4讲解.doc",
        "macro_range": (472, 1104),
        "detail_range": (5726, 12850),
    },
    {
        "set_id": "set4",
        "set_name": "2022年国考行政执法卷",
        "q_num": 2,
        "slug": "folk_music_problem_categorization",
        "type": "问题归类说明/MECE归纳",
        "ans_file": "20251021申论套题第四节答案.docx",
        "review_file": "第四套题目复盘.docx",
        "rubric_file": "第四套题目评分参考.docx",
        "lecture_file": "20251021 申论4讲解.doc",
        "macro_range": (1104, 2191),
        "detail_range": (12850, 21596),
    },
    {
        "set_id": "set4",
        "set_name": "2022年国考行政执法卷",
        "q_num": 3,
        "slug": "dilemma_reason_and_measures",
        "type": "原因与对策复合单一题",
        "ans_file": "20251021申论套题第四节答案.docx",
        "review_file": "第四套题目复盘.docx",
        "rubric_file": "第四套题目评分参考.docx",
        "lecture_file": "20251021 申论4讲解.doc",
        "macro_range": (2191, 4119),
        "detail_range": (21596, 33096),
    },

    # 第五套 (2021执法/地市)
    {
        "set_id": "set5",
        "set_name": "2021年国考行政执法/地市卷",
        "q_num": 1,
        "slug": "gep_accounting_realization",
        "type": "做法归纳",
        "ans_file": "20251025申论套题第五节答案.docx",
        "review_file": "第五套题目思路复盘.docx",
        "rubric_file": "第五套题目评分参考.docx",
        "lecture_file": "20251025 申论5讲解.doc",
        "macro_range": (180, 629),
        "detail_range": (7387, 14131),
    },
    {
        "set_id": "set5",
        "set_name": "2021年国考行政执法/地市卷",
        "q_num": 4,
        "slug": "ip_service_case_summary",
        "type": "案例摘要提炼",
        "ans_file": "20251025申论套题第五节答案.docx",
        "review_file": "第五套题目思路复盘.docx",
        "rubric_file": "第五套题目评分参考.docx",
        "lecture_file": "20251025 申论5讲解.doc",
        "macro_range": (3997, 5025),
        "detail_range": (31131, 35765),
    },

    # 第六套 (2020地市)
    {
        "set_id": "set6",
        "set_name": "2020年国考地市卷",
        "q_num": 2,
        "slug": "cross_province_river_governance",
        "type": "经验做法归纳",
        "ans_file": "20251029申论套题第六节答案.docx",
        "review_file": "第六套题目复盘.docx",
        "rubric_file": "第六套题目评分参考.docx",
        "lecture_file": "20251029 申论6讲解.doc",
        "macro_range": (1002, 1338),
        "detail_range": (13358, 21273),
    },
    {
        "set_id": "set6",
        "set_name": "2020年国考地市卷",
        "q_num": 3,
        "slug": "digital_nomad_reason",
        "type": "原因分析",
        "ans_file": "20251029申论套题第六节答案.docx",
        "review_file": "第六套题目复盘.docx",
        "rubric_file": "第六套题目评分参考.docx",
        "lecture_file": "20251029 申论6讲解.doc",
        "macro_range": (1338, 2686),
        "detail_range": (21273, 26900),
    },
    {
        "set_id": "set6",
        "set_name": "2020年国考地市卷",
        "q_num": 4,
        "slug": "agritainment_revival_measures",
        "type": "对策提炼",
        "ans_file": "20251029申论套题第六节答案.docx",
        "review_file": "第六套题目复盘.docx",
        "rubric_file": "第六套题目评分参考.docx",
        "lecture_file": "20251029 申论6讲解.doc",
        "macro_range": (2686, 3171),
        "detail_range": (26900, 35513),
    },
]

def extract_section_by_qnum(paras: list[str], q_num: int) -> dict:
    """从复盘/答案/评分参考段落中提取指定题号的内容"""
    q_prefixes = ["一、", "二、", "三、", "四、", "五、", "1、", "2、", "3、", "4、", "5、", "1.", "2.", "3.", "4.", "5."]
    target_prefixes = [
        ["一、", "1、", "1."],
        ["二、", "2、", "2."],
        ["三、", "3、", "3."],
        ["四、", "4、", "4."],
        ["五、", "5、", "5."]
    ][q_num - 1]

    start_idx = -1
    end_idx = len(paras)

    for i, p in enumerate(paras):
        pt = p.strip()
        if any(pt.startswith(pfx) for pfx in target_prefixes) and ("题" in pt or "（" in pt or "分" in pt or len(pt) < 100):
            start_idx = i
            break

    if start_idx == -1:
        return {"title": "", "full_text": "", "paragraphs": []}

    for i in range(start_idx + 1, len(paras)):
        pt = paras[i].strip()
        if any(pt.startswith(pfx) for pfx in q_prefixes) and ("题" in pt or "（" in pt or "分" in pt or "大作文" in pt or len(pt) < 80):
            end_idx = i
            break

    matched_paras = paras[start_idx:end_idx]
    return {
        "title": matched_paras[0] if matched_paras else "",
        "full_text": "\n".join(matched_paras),
        "paragraphs": matched_paras
    }

def main():
    print("开始四轨双切片对齐提取...")
    total_chars_all = 0

    for qdef in QUESTION_SPECS:
        set_id = qdef["set_id"]
        q_num = qdef["q_num"]
        slug = qdef["slug"]
        out_filename = f"{set_id}_q{q_num}_{slug}.json"

        ans_paras = read_docx_paras(BASE_DIR / "套题答案" / qdef["ans_file"])
        review_paras = read_docx_paras(BASE_DIR / "题目复盘" / qdef["review_file"])
        rubric_paras = read_docx_paras(BASE_DIR / "评分参考" / qdef["rubric_file"]) if qdef["rubric_file"] else []
        lecture_text = get_lecture_fulltext(BASE_DIR / "题目讲解" / qdef["lecture_file"])

        ans_data = extract_section_by_qnum(ans_paras, q_num)
        review_data = extract_section_by_qnum(review_paras, q_num)
        rubric_data = extract_section_by_qnum(rubric_paras, q_num) if rubric_paras else {"full_text": "参见复盘与讲稿采分点"}

        m_s, m_e = qdef["macro_range"]
        d_s, d_e = qdef["detail_range"]

        lecture_macro = lecture_text[m_s:m_e].strip()
        lecture_detail = lecture_text[d_s:d_e].strip()
        full_lecture_slice = f"【宏观审题与题型速判】\n{lecture_macro}\n\n【材料逐段寻点与采分精讲】\n{lecture_detail}"

        prompt_line = ans_data["title"] or review_data["title"]
        score_match = re.search(r'（(\d+)分）', prompt_line)
        score = int(score_match.group(1)) if score_match else None

        limit_match = re.search(r'不超过(\d+)字', review_data.get("full_text", "") + ans_data.get("full_text", ""))
        word_limit = int(limit_match.group(1)) if limit_match else None

        item = {
            "set_id": set_id,
            "set_name": qdef["set_name"],
            "question_number": q_num,
            "slug": slug,
            "question_type": qdef["type"],
            "prompt": prompt_line,
            "score": score,
            "word_limit": word_limit,
            "gold_answer": ans_data["full_text"],
            "mentor_review": review_data["full_text"],
            "scoring_rubric": rubric_data.get("full_text", ""),
            "lecture_macro": lecture_macro,
            "lecture_detail": lecture_detail,
            "lecture_transcript_slice": full_lecture_slice,
            "metrics": {
                "lecture_macro_chars": len(lecture_macro),
                "lecture_detail_chars": len(lecture_detail),
                "lecture_total_chars": len(full_lecture_slice),
                "review_chars": len(review_data["full_text"]),
                "answer_chars": len(ans_data["full_text"])
            }
        }

        total_chars_all += len(full_lecture_slice)
        target_file = OUTPUT_DIR / out_filename
        target_file.write_text(json.dumps(item, ensure_ascii=False, indent=2), encoding="utf-8")
        print(f"✓ 已生成 [{out_filename}] (讲稿宏观: {len(lecture_macro)}, 详讲: {len(lecture_detail)}, 总计: {len(full_lecture_slice)}字)")

    print(f"\n==========================================")
    print(f"✓ 成功完成 16 道单一题四轨对齐双切片提取！")
    print(f"✓ 累计提取讲稿文字: {total_chars_all} 字")
    print(f"✓ 保存目录: {OUTPUT_DIR}")
    print(f"==========================================")

if __name__ == "__main__":
    main()
