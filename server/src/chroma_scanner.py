import re
from typing import List, Dict, Any, Tuple
from src.models import ChromaSpan

class ChromaScanner:
    @staticmethod
    def scan_title_issues(title: str) -> List[str]:
        issues = []
        if "《" in title or "》" in title:
            issues.append("申论标题严禁加书名号（扣1~2分）")
        if len(title) > 22:
            issues.append("标题偏长，考场黄金标题建议在15~16字以内")
        return issues

    @staticmethod
    def detect_copy_redline(user_text: str, materials: str, min_chars: int = 15) -> Tuple[List[ChromaSpan], float]:
        """
        本地确定性算法：检测连续抄录材料超过 min_chars 字符的片段，并计算全文抄录比例
        """
        if not user_text or not materials:
            return [], 0.0

        # 清洗材料空白
        clean_mat = re.sub(r"\s+", "", materials)
        spans = []
        total_copied_chars = 0
        n = len(user_text)

        i = 0
        while i <= n - min_chars:
            matched_len = 0
            # 贪婪寻找最长重合子串
            for window in range(min_chars, n - i + 1):
                sub = user_text[i:i + window]
                if sub in clean_mat:
                    matched_len = window
                else:
                    break
            if matched_len >= min_chars:
                spans.append(ChromaSpan(
                    start=i,
                    end=i + matched_len,
                    type="copy_redline",
                    color="yellow",
                    style="blink_border",
                    label="抄材料超标",
                    comment=f"连续摘抄材料原文达 {matched_len} 字，需结合观点转化为规范政务大词"
                ))
                total_copied_chars += matched_len
                i += matched_len
            else:
                i += 1

        copy_ratio = round(total_copied_chars / max(len(user_text.strip()), 1), 3)
        return spans, copy_ratio

    @staticmethod
    def resolve_quotes_to_spans(user_text: str, llm_quotes: List[Dict[str, str]]) -> List[ChromaSpan]:
        """
        子串引用锚定定位器 (Quote-Anchor SpanResolver):
        将大模型提取的字面引用，精准回填为物理字符坐标 [start, end]
        """
        resolved: List[ChromaSpan] = []
        for item in llm_quotes:
            quote = item.get("quote", "").strip()
            if not quote:
                continue

            # 1. 优先精确查找
            idx = user_text.find(quote)
            if idx != -1:
                resolved.append(ChromaSpan(
                    start=idx,
                    end=idx + len(quote),
                    type=item.get("type", "normal"),
                    color=item.get("color", "green"),
                    style=item.get("style", "solid"),
                    label=item.get("label", ""),
                    comment=item.get("comment", "")
                ))
            else:
                # 2. 容错模糊对齐：首尾8字锚定
                if len(quote) >= 16:
                    pattern = re.escape(quote[:8]) + r"[\s\S]*?" + re.escape(quote[-8:])
                    match = re.search(pattern, user_text)
                    if match:
                        resolved.append(ChromaSpan(
                            start=match.start(),
                            end=match.end(),
                            type=item.get("type", "normal"),
                            color=item.get("color", "green"),
                            style=item.get("style", "solid"),
                            label=item.get("label", ""),
                            comment=item.get("comment", "")
                        ))

        resolved.sort(key=lambda x: x.start)
        return resolved
