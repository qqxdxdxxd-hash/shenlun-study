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

def test_newline_broken_quotes_resolution():
    # 用户反馈的带有换行符真实考题作答
    user_text = """各地的做法具体为：1. 提供学生体质健康报告书，已
含主要身体指标测评及改进建议，变抽测为统测；2. 保证
睡眠，开启校内午休探索。启用闲置校舍改造的午休宿舍
和大楼，配备完备的设施设备，床位充足并安排老师巡视
3. 丰富课间活动，采用拓宽走廊、分割足球场合理弥补
运动场地不足。分楼层按照益智、读书和科技的功能设置
课间活动区。根据季节变化和年龄不同按
排适合的活动。4. 校家合作，致力锻炼养成良好的运动习惯
5. 智能系统采集体育和健康数据，形成个性化体质画像
助力体质素质管理。6. 开拓体育学习场地，延伸课程至专
业场馆，开启馆校协同模式。"""

    quotes = [
        {"quote": "各地的做法具体为：", "type": "colloquial_flaw", "label": "套话删除"},
        {"quote": "提供学生体质健康报告书，已含主要身体指标测评及改进建议，变抽测为统测", "type": "source_hit", "label": "体质报告"},
        {"quote": "保证睡眠，开启校内午休探索。启用闲置校舍改造的午休宿舍和大楼，配备完备的设施设备，床位充足并安排老师巡视", "type": "source_hit", "label": "午休保障"},
        {"quote": "丰富课间活动，采用拓宽走廊、分割足球场合理弥补运动场地不足。分楼层按照益智、读书和科技的功能设置课间活动区。根据季节变化和年龄不同安排适合的活动", "type": "source_hit", "label": "课间活动"},
        {"quote": "校家合作，致力锻炼养成良好的运动习惯", "type": "source_hit", "label": "校家合作"},
        {"quote": "智能系统采集体育和健康数据，形成个性化体质画像助力体质素质管理", "type": "source_hit", "label": "数据采集"},
        {"quote": "开拓体育学习场地，延伸课程至专业场馆，开启馆校协同模式", "type": "source_hit", "label": "馆校协同"}
    ]

    spans = ChromaScanner.resolve_quotes_to_spans(user_text, quotes)
    assert len(spans) == 7, f"Expected 7 resolved spans across newlines, got {len(spans)}"
    # 验证跨越多行换行的 quote 3 和 4 是否被精准定位
    q3_span = [s for s in spans if s.label == "午休保障"][0]
    assert user_text[q3_span.start:q3_span.end].startswith("保证\n睡眠")
    assert user_text[q3_span.start:q3_span.end].endswith("安排老师巡视")

    q4_span = [s for s in spans if s.label == "课间活动"][0]
    assert user_text[q4_span.start:q4_span.end].startswith("丰富课间活动")
    assert user_text[q4_span.start:q4_span.end].endswith("排适合的活动")

def test_newline_broken_copy_redline():
    materials = "各地区因地制宜探索做法：提供学生体质健康报告书，已含主要身体指标测评及改进建议，变抽测为统测；保证睡眠，开启校内午休探索。启用闲置校舍改造的午休宿舍和大楼，配备完备的设施设备。"
    user_text = "各地的做法具体为：1. 提供学生体质健康报告书，已\n含主要身体指标测评及改进建议，变抽测为统测；2. 保证\n睡眠，开启校内午休探索。启用闲置校舍改造的午休宿舍\n和大楼，配备完备的设施设备，床位充足。"

    spans, ratio = ChromaScanner.detect_copy_redline(user_text, materials, min_chars=15)
    assert len(spans) >= 1
    assert ratio > 0.3
    # 验证跨行抄录定位没有被换行符阻断
    assert any("变抽测为统测" in user_text[s.start:s.end] for s in spans)

