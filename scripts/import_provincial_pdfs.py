# -*- coding: utf-8 -*-
"""
Provincial Shenlun PDF Ingestion Engine (江苏、上海、北京、福建)
提取全真考场材料与题目，剔除商业机构解析与版权印记，保持纯净真题与版权中立。
"""
import re
import json
from pathlib import Path
from typing import List, Dict, Any, Optional
import fitz  # PyMuPDF

DEFAULT_PROVINCE_DIRS = {
    "江苏": Path(r"D:\BaiduNetdiskDownload\【省考】2000-2025真题pdf\【15】江苏公务员考试真题pdf版"),
    "上海": Path(r"D:\BaiduNetdiskDownload\【省考】2000-2025真题pdf\【24】上海公务员考试真题pdf版"),
    "北京": Path(r"D:\BaiduNetdiskDownload\【省考】2000-2025真题pdf\【02】北京公务员考试真题pdf版"),
    "福建": Path(r"D:\BaiduNetdiskDownload\【省考】2000-2025真题pdf\【03】福建公务员考试真题pdf版"),
}

OUTPUT_JSON_PATH = Path(__file__).resolve().parent.parent / "data" / "provincial_real_papers.json"


class ProvincialPdfParser:
    def __init__(self, province_dirs: Optional[Dict[str, Path]] = None):
        self.province_dirs = province_dirs or DEFAULT_PROVINCE_DIRS

    def parse_all(self) -> List[Dict[str, Any]]:
        papers = []
        for prov, pdir in self.province_dirs.items():
            if not pdir.exists():
                continue
            shenlun_pdfs = [p for p in pdir.rglob("*.pdf") if ("申论" in p.name or "申论" in str(p.parent)) and "行测" not in p.name]
            for pdf_path in sorted(shenlun_pdfs, key=lambda x: x.name):
                paper = self.parse_single_pdf(pdf_path, prov)
                if paper:
                    papers.append(paper)
        return papers

    def parse_single_pdf(self, pdf_path: Path, province: str) -> Optional[Dict[str, Any]]:
        try:
            doc = fitz.open(pdf_path)
            full_text = "\n".join(page.get_text() for page in doc)
            doc.close()
        except Exception:
            return None

        if len(full_text) < 1500:
            return None

        meta = self._extract_metadata(pdf_path.name, province)
        if meta["year"] < 2020:
            return None

        clean_text = self._clean_raw_text(full_text)
        mat_text, q_text = self._split_materials_and_questions(clean_text)

        if len(mat_text) < 2000 or len(q_text) < 100:
            return None

        questions = self._parse_questions(q_text, meta["id"])

        if len(questions) < 2:
            return None

        paper = {
            "id": meta["id"],
            "exam_name": meta["exam_name"],
            "year": meta["year"],
            "category": province,
            "tier": meta["tier"],
            "total_score": sum(q["score"] for q in questions) or 100,
            "materials_text": mat_text,
            "questions": questions,
        }
        return paper

    def _clean_raw_text(self, text: str) -> str:
        # 去噪：商业机构页眉页脚与水印
        noise_patterns = [
            r"公众号[：:][^\n]+",
            r"微信公众号[：:][^\n]+",
            r"微信[：:][A-Za-z0-9_\-]+",
            r"QQ\s*群[：:][0-9]+",
            r"网课[：:][^\n]+",
            r"公考网[^\n]*",
            r"粉笔公考[^\n]*",
            r"中公教育[^\n]*",
            r"华图教育[^\n]*",
            r"中公[^\n]*",
            r"华图[^\n]*",
            r"第\s*\d+\s*页\s*共\s*\d+\s*页",
            r"-\s*\d+\s*-",
            r"^\s*\d+\s*$",
        ]
        cleaned = text
        for pat in noise_patterns:
            cleaned = re.sub(pat, "", cleaned, flags=re.MULTILINE)

        lines = [l.strip() for l in cleaned.splitlines() if l.strip()]
        return "\n".join(lines)

    def _split_materials_and_questions(self, text: str) -> tuple[str, str]:
        ans_patterns = [
            r"\n[^\n]*?《申论》[^\n]*?（?解析）?",
            r"\n\s*【试题一】参考答案",
            r"\n\s*【问题一参考答案】",
            r"\n\s*【第一题参考答案】",
            r"\n\s*第[一1]题参考答案",
            r"\n\s*一、参考答案",
            r"\n\s*1、参考答案",
            r"\n\s*参考答案及评分标准",
            r"\n\s*参考答案及解析",
            r"\n\s*【参考答案】",
            r"\n\s*参考答案\s*\n\s*问题一",
            r"\n\s*参考答案\s*\n\s*【问题一】",
            r"\n\s*参考答案\s*\n\s*一[、．\.]",
            r"\n\s*参考答案\s*\n\s*1[、．\.]",
            r"\n\s*参考答案\s*\n\s*[(（]一[)）]",
            r"\n\s*[(（]一[)）]\s*【?参考答案】?",
            r"\n\s*参考答案\s*$",
            r"\n\s*【参考答案与解析】",
            r"\n[^\n]*?(?:答案解析|答案及解析)[^\n]*?\n\s*[(（]一[)）]",
            r"\n[^\n]*?(?:答案解析|答案及解析)[^\n]*?\n\s*一[、．\.]",
            r"\n[^\n]*?(?:答案解析|答案及解析)[^\n]*?\n\s*1[、．\.]",
            r"\n[^\n]*?参考答案[^\n]*?\n\s*[(（]一[)）]",
            r"\n[^\n]*?参考答案[^\n]*?\n\s*一[、．\.]",
            r"\n[^\n]*?参考答案[^\n]*?\n\s*1[、．\.]",
            r"\n[^\n]*?参考答案[^\n]*?\n\s*问题[一1]",
            r"\n[^\n]*?参考答案[^\n]*?\n\s*第[一1]题",
            r"\n[^\n]*?第一题[^\n]*?\n\s*【参考答案】",
            r"\n[^\n]*?问题一[^\n]*?\n\s*【参考答案】",
        ]

        ans_pos = len(text)
        for pat in ans_patterns:
            m = re.search(pat, text, re.IGNORECASE)
            if m and 1000 < m.start() < ans_pos:
                ans_pos = m.start()
                break

        if ans_pos == len(text):
            m = re.search(r"\n\s*参考答案\s*[:：\n]", text)
            if m and m.start() > 1000:
                ans_pos = m.start()

        pre_ans = text[:ans_pos]

        q_patterns = [
            r"\n\s*[一二三四五\d]+[、．\.]\s*(?:作答要求|答题要求|申论要求)",
            r"\n\s*【(?:作答要求|答题要求|申论要求)】",
            r"\n\s*(?:作答要求|答题要求|申论要求)\s*\n",
            r"\n\s*三[．\.]\s*(?:申论要求|作答要求)",
            r"\n\s*【问题[一1]】",
            r"\n\s*问题[一1][：:\n]",
            r"\n\s*第一题\s*[\n(（]",
            r"\n\s*一、结合[“\"”]",
        ]

        q_pos = -1
        for pat in q_patterns:
            m = re.search(pat, pre_ans)
            if m:
                q_pos = m.start()
                break

        if q_pos == -1:
            m = re.search(r"\n\s*[(（]一[)）][^\n]*?[(（]\d+\s*分[)）]", pre_ans)
            if m:
                q_pos = m.start()
        if q_pos == -1:
            m = re.search(r"\n\s*1[、．\.][^\n]*?[(（]\d+\s*分[)）]", pre_ans)
            if m:
                q_pos = m.start()

        m_patterns = [
            r"\n\s*[一二三四\d]+[、．\.]\s*(?:给定[资材]料|申论材料|材料)",
            r"\n\s*【给定[资材]料】",
            r"\n\s*给定[资材]料\s*\n",
            r"\n\s*【材料[一1]】",
            r"\n\s*材料[一1][、．\.\s\n]",
            r"\n\s*给定[资材]料\s*\d+",
            r"\n\s*[(（][1１][)）]",
        ]

        m_pos = -1
        for pat in m_patterns:
            m = re.search(pat, pre_ans)
            if m:
                m_pos = m.start()
                break
        if m_pos == -1:
            m = re.search(r"\n\s*1[、．\.]", pre_ans)
            if m:
                m_pos = m.start()

        mat_text = pre_ans[m_pos:q_pos].strip() if (q_pos > m_pos and m_pos != -1) else ""
        q_text = pre_ans[q_pos:].strip() if q_pos != -1 else ""

        return mat_text, q_text

    def _parse_questions(self, q_text: str, paper_id: str) -> List[Dict[str, Any]]:
        lines = [l.strip() for l in q_text.splitlines() if l.strip()]
        text = "\n".join(lines)

        patterns = [
            r"(?:^|\n)\s*【(?:问题|试题)[一二三四五12345]】",
            r"(?:^|\n)\s*(?:问题|试题)[一二三四五12345][：:\n]",
            r"(?:^|\n)\s*第[一二三四五12345]题[、：:\n(（\s]",
            r"(?:^|\n)\s*[一二三四五][、．\.]",
            r"(?:^|\n)\s*[(（][一二三四五][)）]",
            r"(?:^|\n)\s*\d+[、．\.]",
            r"(?:^|\n)\s*[(（]\d+[)）]",
        ]

        splits = []
        for pat in patterns:
            matches = list(re.finditer(pat, text))
            if 2 <= len(matches) <= 7:
                splits = matches
                break

        if not splits:
            # Fallback: questions defined by score annotations like （20 分）
            score_matches = list(re.finditer(r"[^\n]+?[(（]\s*\d+\s*分\s*[)）]", text))
            if 2 <= len(score_matches) <= 6:
                # Use starts of lines containing score markers
                splits = score_matches

        questions = []
        if splits:
            for i in range(len(splits)):
                start = splits[i].start()
                end = splits[i + 1].start() if i + 1 < len(splits) else len(text)
                block = text[start:end].strip()

                # Discard trailing answer residual
                if i == len(splits) - 1 and len(block) < 25 and not re.search(r"\d+\s*分", block):
                    continue

                m_score = re.search(r"[(（]\s*(\d+)\s*分\s*[)）]", block)
                score = int(m_score.group(1)) if m_score else 0

                m_limit = re.search(r"(?:篇幅|字数)?[不超至为在到\-~]*?(\d+)[-~到至]*?(\d+)?\s*字(?:左右|以内|以下|以上)?", block)
                char_limit = m_limit.group(0) if m_limit else ""

                q_type = "single"
                if re.search(r"(?:自拟[标题]|大作文|写一[篇篇幅]|议论文|文章|立意)", block):
                    q_type = "essay"
                elif re.search(r"(?:简报|宣传稿|建议书|倡议书|讲话稿|公开信|通知|编者按|汇报|发言稿|调查报告|提纲|短评|宣讲稿)", block):
                    q_type = "doc"

                qid = f"{paper_id}_q{i+1}"
                first_line = block.splitlines()[0]
                q_title = f"第{i+1}题（{q_type}）"

                req_m = re.search(r"(要求[：:][\s\S]+)", block)
                prompt_reqs = req_m.group(1).strip() if req_m else ""
                prompt_text = block[:req_m.start()].strip() if req_m else block

                questions.append({
                    "id": qid,
                    "paper_id": paper_id,
                    "q_index": i + 1,
                    "type": q_type,
                    "question_title": q_title,
                    "score": score,
                    "target_score": score,
                    "char_limit": char_limit,
                    "prompt_text": prompt_text,
                    "prompt_reqs": prompt_reqs,
                    "scoring_criteria": "",
                    "reference_answer": "",
                })

        return questions

    def _extract_metadata(self, filename: str, province: str) -> Dict[str, Any]:
        m_year = re.search(r"(20\d{2})", filename)
        year = int(m_year.group(1)) if m_year else 2020

        prov_prefix_map = {
            "江苏": "sk_js",
            "上海": "sk_sh",
            "北京": "sk_bj",
            "福建": "sk_fj",
        }
        prefix = prov_prefix_map.get(province, "sk")

        tier = "通用"
        tier_tag = ""
        fn = filename.lower()

        if "a" in fn or "a类" in fn or "a卷" in fn:
            tier = "A类/省级"
            tier_tag = "a"
        elif "b" in fn or "b类" in fn or "b卷" in fn:
            tier = "B类/行政执法"
            tier_tag = "b"
        elif "c" in fn or "c类" in fn or "c卷" in fn:
            tier = "C类/乡镇"
            tier_tag = "c"
        elif "区级" in fn or "市级" in fn or "县级" in fn:
            tier = "区级及以上"
            tier_tag = "dist"
        elif "乡镇" in fn or "县乡" in fn:
            tier = "乡镇级"
            tier_tag = "town"
        elif "执法" in fn:
            tier = "行政执法"
            tier_tag = "law"

        # Check sub-season / multi-exam tags
        sub_tag = ""
        if "上半年" in filename:
            sub_tag = "h1"
        elif "下半年" in filename:
            sub_tag = "h2"
        elif "春季" in filename:
            sub_tag = "spring"
        elif "秋季" in filename:
            sub_tag = "autumn"
        else:
            m_code = re.search(r"(\d{3,4})\s*公务员联考", filename)
            if m_code:
                sub_tag = m_code.group(1)

        tags = [t for t in [tier_tag, sub_tag] if t]
        if tags:
            paper_id = f"{prefix}_{year}_{'_'.join(tags)}"
        else:
            paper_id = f"{prefix}_{year}"

        # Clean title
        clean_name = re.sub(r"[\(（]及?参考?答案[^\)）]*[\)）]", "", filename)
        clean_name = re.sub(r"[\(（]解析[\)）]", "", clean_name)
        clean_name = re.sub(r"[\(（]真题及答案[\)）]", "", clean_name)
        clean_name = clean_name.replace(".pdf", "").replace(".doc", "").strip()

        return {
            "id": paper_id,
            "exam_name": clean_name,
            "year": year,
            "tier": tier,
        }


def main():
    parser = ProvincialPdfParser()
    papers = parser.parse_all()
    OUTPUT_JSON_PATH.parent.mkdir(parents=True, exist_ok=True)
    with open(OUTPUT_JSON_PATH, "w", encoding="utf-8") as f:
        json.dump(papers, f, ensure_ascii=False, indent=2)
    print(f"Parsed {len(papers)} provincial papers successfully, saved to {OUTPUT_JSON_PATH}")


if __name__ == "__main__":
    main()
