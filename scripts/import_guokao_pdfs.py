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
            if paper["year"] >= 2020:
                papers.append(paper)
        # 按年份降序排布 (2025 -> 2020)
        papers.sort(key=lambda p: (p["year"], p["tier"]), reverse=True)
        return papers

if __name__ == "__main__":
    import json
    source_dir = Path("D:/BaiduNetdiskDownload/国考申论PDF")
    parser = GuokaoPdfParser(source_dir)
    papers = parser.parse_all()
    print(f"Parsed {len(papers)} papers successfully!")
    for p in papers:
        print(f"  {p['id']:<14} | {p['year']} {p['tier']:<6} | mat: {len(p['materials_text']):<5} | qs: {len(p['questions'])} | {p['exam_name']}")
    
    out_file = Path(__file__).parent.parent / "data" / "guokao_real_papers.json"
    out_file.parent.mkdir(parents=True, exist_ok=True)
    out_file.write_text(json.dumps(papers, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"✓ Cached to {out_file} ({out_file.stat().st_size / 1024:.2f} KB)")
