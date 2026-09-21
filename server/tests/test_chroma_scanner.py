import pytest
from src.chroma_scanner import ChromaScanner

def test_copy_redline_detection():
    materials = "进入新时代，该市坚决摒弃先污染后治理的传统老路，坚决贯彻绿色发展理念。统筹算大账、长远账。"
    user_answer = "在现实发展中，进入新时代，该市坚决摒弃先污染后治理的传统老路，坚决贯彻绿色发展理念。我们应该以此为榜样。"
    
    spans, ratio = ChromaScanner.detect_copy_redline(user_answer, materials, min_chars=15)
    assert len(spans) == 1
    assert spans[0].type == "copy_redline"
    assert ratio > 0.4
    assert spans[0].start >= 6

def test_span_resolver_quotes():
    text = "以绿色发展绘就新篇章。上面天天发文件，村里没钱做不了事。我们要健全财政保障机制。"
    quotes = [
        {
            "quote": "上面天天发文件，村里没钱做不了事",
            "type": "colloquial_flaw",
            "color": "purple",
            "style": "strikethrough",
            "label": "大白话",
            "comment": "口语化表达"
        },
        {
            "quote": "以绿色发展绘就新篇章",
            "type": "main_thesis",
            "color": "green",
            "style": "solid",
            "label": "标题/论点",
            "comment": "亮明论点"
        }
    ]
    spans = ChromaScanner.resolve_quotes_to_spans(text, quotes)
    assert len(spans) == 2
    # 验证排序与字符位置准确
    assert spans[0].start == 0
    assert spans[0].end == 10
    assert spans[1].start == 11
    assert spans[1].end == 27
