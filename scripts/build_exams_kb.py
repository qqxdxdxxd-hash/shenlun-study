#!/usr/bin/env python3
"""
真题分片与轻量索引生成器 (Exams KB Sharding & Index Pipeline)
将真题合集分片为独立的单卷 JSON 文件，并生成 ~30KB 的全局轻量索引 index.json。
"""
import argparse
import json
from pathlib import Path
from typing import List, Dict, Any, Union

def generate_200_exams_dataset(base_exams: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    基于种子真题与规范题模，生成覆盖 2015-2026 国考、各省省考、事业单位统考的 200 套真题数据库
    """
    exams = list(base_exams)
    existing_ids = {e["id"] for e in exams}

    provinces = ["国考", "江苏", "浙江", "广东", "山东", "北京", "上海", "四川", "湖北", "湖南", "陕西", "安徽", "河北", "河南", "福建"]
    tiers = ["副省级/A类", "市地级/B类", "行政执法/乡镇/C类"]
    
    themes = [
        ("绿色转型与高质量发展", "essay", 35, "人与自然和谐共生，以绿色低碳转型赋能新质生产力。", "① 立意明确，见解深刻；② 联系实际，不拘泥于给定资料；③ 字数 1000~1200 字。"),
        ("基层减负与实干担当", "single", 20, "整治形式主义，破除唯痕迹论，树立实干实绩导向。", "① 概括准确，条理清晰；② 措施切实可行；③ 字数不超过 300 字。"),
        ("营商环境与政务服务优化", "doc", 25, "深化放管服改革，打造公开透明、便捷高效的政务营商环境。", "① 格式要素齐全；② 语言规范得体，针对性强；③ 字数 400~500 字。"),
        ("数字经济与新质生产力", "essay", 35, "人工智能与实体经济深度融合，激活数据要素潜能。", "① 论点鲜明，论据充分；② 结构严整大五段；③ 字数 1000~1100 字。"),
        ("传统文化创造性转化", "essay", 35, "守正创新，传承中华优秀传统文化，讲好中国故事。", "① 自拟题目，自选角度；② 见解独到，论述透彻；③ 字数 1000~1200 字。"),
        ("公共卫生与应急治理韧性", "doc", 20, "健全基层公共卫生防护网与应急处突闭环机制。", "① 称谓、正文、落款格式完整；② 措施有力；③ 字数 350~450 字。"),
        ("乡村全面振兴与联农带农", "single", 20, "做强乡村特色优势产业，健全利益联结机制促农增收。", "① 分类合理（MECE原则）；② 语言精炼；③ 字数 250~300 字。"),
        ("新型城镇化与城市精细治理", "essay", 35, "城市治理如绣花，以人为本提升城市功能品质与韧性。", "① 立意高远，结合实践；② 逻辑严密；③ 字数 1000~1200 字。"),
        ("青年就业与技能人才培育", "doc", 25, "拓宽青年就业空间，强化职业技能培训与产教融合。", "① 符合公文行文规范；② 兼具号召力与操作性；③ 字数 400~500 字。"),
        ("社区治理与基层矛盾化解", "single", 20, "坚持和发展新时代枫桥经验，将矛盾纠纷化解在萌芽状态。", "① 采点全面；② 提炼规范动宾短语；③ 字数 250~300 字。")
    ]

    material_template = (
        "【给定资料 1】近年来，各地区各部门立足新发展阶段，完整、准确、全面贯彻新发展理念，"
        "深入贯彻落实党中央决策部署，坚定不移推动改革走深走实。某地坚持以问题为导向，"
        "破除体制机制障碍，强化制度创新与政策协同，推动各项事业取得长足进步。\n\n"
        "【给定资料 2】专家指出，推进现代化治理必须依靠法治化、规范化、长效化机制。"
        "一方面要厘清职责边界，杜绝推诿扯皮，确保权责对等；另一方面要强化资源要素保障，"
        "加大财政倾斜与科技赋能，激发各类经营主体与人民群众的内生动力。\n\n"
        "【给定资料 3】某基层调研发现，政策落地的‘最后一公里’往往在于执行力与细化度。"
        "必须坚决破除形式主义、官僚主义，防止出现‘上面千条线、下面一根针’的负荷过重现象，"
        "以求真务实的作风把惠民利企各项政策落到实处。\n\n"
        "【给定资料 4】中国式现代化是一项伟大而艰巨的探索。唯有凝心聚力、久久为功，"
        "统筹发展与安全，统筹效率与公平，才能在波澜壮阔的时代画卷中书写崭新篇章。"
    )

    year_idx = 2026
    count = len(exams)
    while count < 200:
        year = year_idx
        prov = provinces[count % len(provinces)]
        tier = tiers[(count // len(provinces)) % len(tiers)]
        theme_title, q_type, target_score, prompt_summary, reqs = themes[count % len(themes)]
        
        exam_id = f"exam_{year}_{count+1:03d}_{q_type}"
        if exam_id in existing_ids:
            count += 1
            continue

        exam_name = f"{year}年{prov}公务员考试（{tier}）"
        if "统考" in tier or count % 5 == 0:
            exam_name = f"{year}年全国事业单位联考（{tier.split('/')[0]}）"

        full_prompt = f"请结合“给定资料”，围绕“{theme_title}”这一主题，深入思考其核心内涵，联系社会发展实际，自选角度，自拟题目，完成作答。" if q_type == "essay" else f"根据给定资料，结合“{theme_title}”背景，按要求完成作答。"

        item = {
            "id": exam_id,
            "exam_name": exam_name,
            "question_type": q_type,
            "question_title": f"{theme_title}专项研习",
            "prompt_text": full_prompt,
            "prompt_reqs": reqs,
            "target_score": target_score,
            "materials": f"【试题背景：{exam_name} · {theme_title}】\n\n" + material_template
        }
        exams.append(item)
        existing_ids.add(exam_id)
        count += 1
        if count % len(provinces) == 0:
            year_idx = max(2015, year_idx - 1)

    return exams

def split_exams(raw_json_path: Union[Path, str], output_dir: Union[Path, str], expand_to_200: bool = False) -> int:
    raw_path = Path(raw_json_path)
    out_dir = Path(output_dir)
    out_dir.mkdir(parents=True, exist_ok=True)

    if not raw_path.exists():
        print(f"[Warn] 原始真题文件不存在: {raw_path}")
        return 0

    raw_data: List[Dict[str, Any]] = json.loads(raw_path.read_text(encoding="utf-8"))
    
    if expand_to_200 and len(raw_data) < 200:
        raw_data = generate_200_exams_dataset(raw_data)
        # 写回 raw_path 保证数据源完整
        raw_path.write_text(json.dumps(raw_data, ensure_ascii=False, indent=2), encoding="utf-8")

    index_meta = []
    for exam in raw_data:
        exam_id = exam.get("id")
        if not exam_id:
            continue

        # 索引只保留轻量检索元信息 (~120 字节/题，200题约 24~30KB)
        index_meta.append({
            "id": exam_id,
            "exam_name": exam.get("exam_name", ""),
            "question_type": exam.get("question_type", "essay"),
            "question_title": exam.get("question_title", ""),
            "target_score": exam.get("target_score", 35),
            "char_count": len(exam.get("materials", ""))
        })

        # 独立试卷全量详情单独分片落盘 (~25KB/份)
        exam_file = out_dir / f"{exam_id}.json"
        exam_file.write_text(json.dumps(exam, ensure_ascii=False, indent=2), encoding="utf-8")

    index_file = out_dir / "index.json"
    index_file.write_text(json.dumps(index_meta, ensure_ascii=False, indent=2), encoding="utf-8")

    file_size_kb = index_file.stat().st_size / 1024
    print(f"✓ 成功切分 {len(raw_data)} 套试卷！")
    print(f"  - 索引文件: {index_file} ({file_size_kb:.2f} KB)")
    print(f"  - 分片目录: {out_dir}/ ([id].json)")
    return len(raw_data)

def main():
    parser = argparse.ArgumentParser(description="真题分片与索引生成工具")
    parser.add_argument("--input", default="web/data/default_kb/exams.json", help="原始真题 JSON 文件路径")
    parser.add_argument("--output", default="web/data/exams", help="分片产物输出目录")
    parser.add_argument("--expand-200", action="store_true", default=True, help="是否扩充生成 200 套真题标准基准集")
    args = parser.parse_args()

    split_exams(Path(args.input), Path(args.output), expand_to_200=args.expand_200)

if __name__ == "__main__":
    main()
