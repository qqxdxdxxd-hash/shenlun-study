#!/usr/bin/env python3
"""
真题分片与轻量索引构建流水线 (Exams KB Sharding & Index Pipeline)
构建最近5年真实国考与代表省份省考真题，支持整卷题本与多道试题联动。
"""
import argparse
import json
import sys
from pathlib import Path
from typing import List, Dict, Any, Union

sys.path.insert(0, str(Path(__file__).parent.parent))

def split_exams(raw_json_path: Union[Path, str], output_dir: Union[Path, str]) -> int:
    """
    切分题库并生成轻量索引 index.json 及独立试卷/题目分片
    """
    raw_path = Path(raw_json_path)
    out_dir = Path(output_dir)
    out_dir.mkdir(parents=True, exist_ok=True)

    if not raw_path.exists():
        print(f"[Warn] 原始真题文件不存在: {raw_path}")
        return 0

    raw_data: List[Dict[str, Any]] = json.loads(raw_path.read_text(encoding="utf-8"))
    index_meta = []

    for item in raw_data:
        item_id = item.get("id")
        if not item_id:
            continue

        # 索引只保留轻量检索元信息 (~120 字节/条目)
        index_meta.append({
            "id": item_id,
            "exam_name": item.get("exam_name", ""),
            "question_type": item.get("question_type", item.get("type", "essay")),
            "question_title": item.get("question_title", ""),
            "target_score": item.get("target_score", 35),
            "char_count": len(item.get("materials", item.get("materials_text", "")))
        })

        # 分片单独落盘
        exam_file = out_dir / f"{item_id}.json"
        exam_file.write_text(json.dumps(item, ensure_ascii=False, indent=2), encoding="utf-8")

    index_file = out_dir / "index.json"
    index_file.write_text(json.dumps(index_meta, ensure_ascii=False, indent=2), encoding="utf-8")
    return len(raw_data)

def main():
    parser = argparse.ArgumentParser(description="真题分片与索引生成工具")
    parser.add_argument("--output", default="web/data/exams", help="分片产物输出目录")
    parser.add_argument("--default-kb", default="web/data/default_kb/exams.json", help="默认平铺真题种子路径")
    args = parser.parse_args()

    from scripts.build_real_5year_exams import build_real_exams
    build_real_exams(Path(args.output), Path(args.default_kb))

if __name__ == "__main__":
    main()
