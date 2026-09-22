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
        采用非空白字符物理映射，天然免疫正文中任意位置的换行符与空格
        """
        if not user_text or not materials:
            return [], 0.0

        # 构建非空白字符与其在原文本中的物理偏移量映射
        orig_indices = []
        clean_chars = []
        for i, ch in enumerate(user_text):
            if not ch.isspace():
                clean_chars.append(ch)
                orig_indices.append(i)

        clean_user = "".join(clean_chars)
        clean_mat = re.sub(r"\s+", "", materials)
        spans = []
        total_copied = 0
        n = len(clean_user)

        i = 0
        while i <= n - min_chars:
            matched_len = 0
            # 贪婪寻找最长重合子串
            for w in range(min_chars, n - i + 1):
                sub = clean_user[i:i + w]
                if sub in clean_mat:
                    matched_len = w
                else:
                    break
            if matched_len >= min_chars:
                start = orig_indices[i]
                end = orig_indices[i + matched_len - 1] + 1
                spans.append(ChromaSpan(
                    start=start,
                    end=end,
                    type="copy_redline",
                    color="yellow",
                    style="blink_border",
                    label="抄材料超标",
                    comment=f"连续摘抄材料原文达 {matched_len} 字，需结合观点转化为规范政务大词"
                ))
                total_copied += matched_len
                i += matched_len
            else:
                i += 1

        copy_ratio = round(total_copied / max(len(clean_user), 1), 3)
        return spans, copy_ratio

    @staticmethod
    def resolve_quotes_to_spans(user_text: str, llm_quotes: List[Dict[str, str]]) -> List[ChromaSpan]:
        """
        子串引用锚定定位器 (Quote-Anchor SpanResolver):
        将大模型提取的字面引用，精准回填为物理字符坐标 [start, end]
        采用多阶容错策略：
        1. 原始文本精确匹配 (Exact Substring)
        2. 空白/换行容错映射匹配 (Whitespace-Agnostic Clean Index Mapping)
        3. 渐进式首尾锚点模糊对齐 (Progressive Head-Tail Dual Anchor)
        """
        if not user_text or not llm_quotes:
            return []

        # 预构建用户文本的非空白字符物理映射
        orig_indices = []
        clean_chars = []
        for i, ch in enumerate(user_text):
            if not ch.isspace():
                clean_chars.append(ch)
                orig_indices.append(i)
        clean_user = "".join(clean_chars)

        resolved: List[ChromaSpan] = []
        for item in llm_quotes:
            quote = item.get("quote", "").strip()
            if not quote:
                continue

            # 1. 优先原文本精确查找
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
                continue

            # 2. 空白/换行免疫匹配：在非空白字符流中精确定位
            clean_q = re.sub(r"\s+", "", quote)
            if not clean_q:
                continue

            c_idx = clean_user.find(clean_q)
            if c_idx != -1:
                start = orig_indices[c_idx]
                end = orig_indices[c_idx + len(clean_q) - 1] + 1
                resolved.append(ChromaSpan(
                    start=start,
                    end=end,
                    type=item.get("type", "normal"),
                    color=item.get("color", "green"),
                    style=item.get("style", "solid"),
                    label=item.get("label", ""),
                    comment=item.get("comment", "")
                ))
                continue

            # 3. 渐进式首尾锚点容错对齐：去除两端标点后首尾双向锚定 (8, 6, 5, 4 字渐进)
            has_ellipsis = ("……" in clean_q) or ("..." in clean_q) or ("···" in clean_q)
            stripped_q = re.sub(r"^[……\s，。、“”\"'：:；;！!？?—-]+|[……\s，。、“”\"'：:；;！!？?—-]+$", "", clean_q)
            if len(stripped_q) >= 6:
                matched = False
                for anchor_len in (8, 6, 5, 4):
                    if anchor_len > len(stripped_q) // 2:
                        continue
                    head = stripped_q[:anchor_len]
                    tail = stripped_q[-anchor_len:]

                    h_idx = clean_user.find(head)
                    if h_idx != -1:
                        t_idx = clean_user.find(tail, h_idx + len(head))
                        if t_idx != -1:
                            span_len = (t_idx + len(tail)) - h_idx
                            len_diff = abs(span_len - len(clean_q))
                            max_diff = 200 if has_ellipsis else max(15, int(len(clean_q) * 0.35))
                            if len_diff <= max_diff:
                                start = orig_indices[h_idx]
                                end = orig_indices[t_idx + len(tail) - 1] + 1
                                resolved.append(ChromaSpan(
                                    start=start,
                                    end=end,
                                    type=item.get("type", "normal"),
                                    color=item.get("color", "green"),
                                    style=item.get("style", "solid"),
                                    label=item.get("label", ""),
                                    comment=item.get("comment", "")
                                ))
                                matched = True
                                break

        resolved.sort(key=lambda x: x.start)
        return resolved
