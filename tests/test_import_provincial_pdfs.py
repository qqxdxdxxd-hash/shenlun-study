# -*- coding: utf-8 -*-
import pytest
from pathlib import Path
import json

PROVINCE_DIRS = {
    "江苏": Path(r"D:\BaiduNetdiskDownload\【省考】2000-2025真题pdf\【15】江苏公务员考试真题pdf版"),
    "上海": Path(r"D:\BaiduNetdiskDownload\【省考】2000-2025真题pdf\【24】上海公务员考试真题pdf版"),
    "北京": Path(r"D:\BaiduNetdiskDownload\【省考】2000-2025真题pdf\【02】北京公务员考试真题pdf版"),
    "福建": Path(r"D:\BaiduNetdiskDownload\【省考】2000-2025真题pdf\【03】福建公务员考试真题pdf版"),
}

@pytest.mark.skipif(not any(d.exists() for d in PROVINCE_DIRS.values()), reason="本地四省真题 PDF 目录不存在")
def test_parse_provincial_pdfs():
    from scripts.import_provincial_pdfs import ProvincialPdfParser
    parser = ProvincialPdfParser(PROVINCE_DIRS)
    papers = parser.parse_all()
    
    # 至少成功解析出 100 套以上的真实省考题本
    assert len(papers) >= 100, f"解析得到的省考题本数量应>=100套，实测: {len(papers)}"
    
    for paper in papers:
        assert paper["id"], "必须具备试卷唯一 ID"
        assert paper["exam_name"], "必须具备试卷名称"
        assert paper["year"] >= 2003 and paper["year"] <= 2025, f"年份范围异常: {paper['year']}"
        assert paper["category"] in ["江苏", "上海", "北京", "福建"], f"分类异常: {paper['category']}"
        assert len(paper["materials_text"]) >= 2000, f"{paper['id']} 材料长度过短: {len(paper['materials_text'])}"
        assert len(paper["questions"]) >= 2, f"{paper['id']} 题目数量过少: {len(paper['questions'])}"
        
        # 验证版权中立性：试卷和题目中严禁残留答案和商业机构解析
        for q in paper["questions"]:
            assert q["id"], "小题必须有 id"
            assert q["prompt_text"], "小题必须有题干"
            assert q["scoring_criteria"] == "", "根据版权中立原则，不得收录机构采分底稿"
            assert q["reference_answer"] == "", "根据版权中立原则，不得收录机构参考答案"
            assert "中公" not in q["prompt_text"] and "粉笔" not in q["prompt_text"] and "华图" not in q["prompt_text"]
