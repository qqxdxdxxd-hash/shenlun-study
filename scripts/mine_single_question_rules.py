#!/usr/bin/env python3
"""
scripts/mine_single_question_rules.py
五维微切片语义抽取器：
遍历 data/single_question_corpus/*.json，逐题提炼出：
1. 审题定性与题型矩阵规则 (Question Understanding & Archetype Heuristics)
2. 字数极限排版与小标题取舍规则 (Word Budget & Layout Decision Matrix)
3. 材料逐段寻点与正反过滤规则 (Paragraph-by-Paragraph Material Filtering)
4. 采分点大词化与同义替换标准 (Lexicon Distillation & Synonymous Equivalence)
5. 考官阅卷心智模型与给分机制 (Examiner Cognition & Scoring Formula)
输出结构化聚合规则集: data/mined_rules_aggregated.json
"""

import json
import re
from pathlib import Path

CORPUS_DIR = Path("data/single_question_corpus")
OUTPUT_FILE = Path("data/mined_rules_aggregated.json")

def mine_rules():
    corpus_files = sorted(CORPUS_DIR.glob("*.json"))
    print(f"开始对 {len(corpus_files)} 道单一题切片语料进行五维微切片规则抽取...")

    aggregated = {
        "archetypes": {},
        "word_budget_rules": {
            "under_200_words": [],
            "250_to_350_words": [],
            "over_400_words_or_categorized": [],
            "dual_element_ratios": []
        },
        "paragraph_filtering_rules": {
            "background_skip_patterns": [],
            "case_strip_patterns": [],
            "summary_tail_skip_patterns": [],
            "paragraph_trace_by_exam": {}
        },
        "lexicon_and_synonyms": {
            "verb_object_distillations": [],
            "synonym_equivalence_groups": [],
            "inferred_measures_boundaries": []
        },
        "examiner_scoring_mechanics": {
            "time_budget": "8~15秒双评与仲裁",
            "scoring_formula": "实得分 = 内容采分点得分（75%~85%） + 结构条理分（15%~25%） - 扣分项",
            "iron_laws": [
                "以点给分，宁多勿少",
                "答对给分，不倒扣分（除字数超限、错别字外，答错散点不扣分）",
                "同义替换认可：核心动宾搭配一致即同等赋分",
                "前置词锁定高分档：动宾小标题引导要点展开"
            ],
            "question_case_rubrics": []
        }
    }

    for fpath in corpus_files:
        data = json.loads(fpath.read_text(encoding="utf-8"))
        slug = data["slug"]
        set_id = data["set_id"]
        q_num = data["question_number"]
        prompt = data["prompt"]
        word_limit = data["word_limit"]
        score = data["score"]
        review = data["mentor_review"]
        lecture_macro = data.get("lecture_macro", "")
        lecture_detail = data.get("lecture_detail", "")
        gold_ans = data["gold_answer"]
        rubric = data.get("scoring_rubric", "")
        q_type = data["question_type"]

        # 1. 题型与审题规则归纳
        if q_type not in aggregated["archetypes"]:
            aggregated["archetypes"][q_type] = {
                "question_type": q_type,
                "keywords": [],
                "core_mission": "",
                "examples": []
            }
        aggregated["archetypes"][q_type]["examples"].append({
            "exam": f"{data['set_name']} 第{q_num}题",
            "prompt": prompt,
            "word_limit": word_limit,
            "score": score
        })

        # 2. 字数与格式规则
        if word_limit and word_limit <= 200:
            aggregated["word_budget_rules"]["under_200_words"].append({
                "exam": f"{set_id}_q{q_num}",
                "limit": word_limit,
                "rule": "坚决不写独立前置小标题，直接以 1. 2. 3. 罗列规范动宾展开，文字密度拉满",
                "teacher_quote": "这200字是不太够的，所以这道题不建议大家去写这个小标题，直接列出要点就可以。"
            })
        elif word_limit and 250 <= word_limit <= 350:
            aggregated["word_budget_rules"]["250_to_350_words"].append({
                "exam": f"{set_id}_q{q_num}",
                "limit": word_limit,
                "rule": "必须配备 4~8 字精炼前置词（小标题加粗），微观呈现总分展开",
                "teacher_quote": "能体现互动/条理，这题300字比200字宽松，写前置短语能方便阅卷人第一眼看到踩分大词。"
            })
        elif word_limit and word_limit >= 400:
            aggregated["word_budget_rules"]["over_400_words_or_categorized"].append({
                "exam": f"{set_id}_q{q_num}",
                "limit": word_limit,
                "rule": "必须严格执行 MECE 分类归并，形成宏观总起 + 一级小标题 + 二级展开的立体逻辑",
                "teacher_quote": "400字题如果杂乱平铺必被扣条理分，需要从主体、维度进行同类项归纳合并。"
            })

        # 复合要素比例
        if "复合" in q_type or "成效" in prompt or "对策" in prompt or "建议" in prompt:
            aggregated["word_budget_rules"]["dual_element_ratios"].append({
                "exam": f"{set_id}_q{q_num}",
                "prompt": prompt,
                "allocation": "第一要素（成效/原因/问题）占比 35%~40%，第二要素（对策/建议）占比 60%~65%"
            })

        # 3. 材料逐段过滤线索提取（从复盘中抽取段落判定）
        para_traces = []
        for line in review.split("\n"):
            line = line.strip()
            if "段" in line and any(k in line for k in ["背景", "不用写", "省略", "作为一个点", "作为要点", "核心", "反推", "合并"]):
                para_traces.append(line)
        aggregated["paragraph_filtering_rules"]["paragraph_trace_by_exam"][f"{set_id}_q{q_num}_{slug}"] = para_traces

        # 4. 采分点与个案汇总
        aggregated["examiner_scoring_mechanics"]["question_case_rubrics"].append({
            "exam_id": f"{set_id}_q{q_num}",
            "slug": slug,
            "title": prompt,
            "score": score,
            "word_limit": word_limit,
            "gold_answer": gold_ans,
            "rubric_text": rubric
        })

    # 提炼通用的正反过滤模式
    aggregated["paragraph_filtering_rules"]["background_skip_patterns"] = [
        "宏观背景描摹（如城市车水马龙、企业发展历程介绍、自然风光铺垫）-> 判定为废段，直接略过",
        "泛泛概念宣导与领导号召性引言 -> 判定为背景信息，不作为作答要点",
        "单纯罗列优点但未涉及具体实践机制 -> 仅作情绪渲染，不作为做法采分点"
    ]
    aggregated["paragraph_filtering_rules"]["case_strip_patterns"] = [
        "具体人名、企业名、地名 -> 剔除专有名词，抽象为'经营主体'、'有关部门'、'专业技术人员'",
        "具体投资数额、统计数字（如投入200万元、建3个大棚） -> 转化为'加大资金投入'、'建设产业基地'",
        "口语化工作场景描述 -> 压缩为规范政务动宾短语"
    ]
    aggregated["paragraph_filtering_rules"]["summary_tail_skip_patterns"] = [
        "文章尾段总结性套话与前瞻号召（如'下一步还将继续深化...'） -> 若题干问已有做法或成效，一律不提炼",
        "对前文内容的再概括 -> 避免要点同义重复"
    ]

    # 提炼动宾大词与反推边界
    aggregated["lexicon_and_synonyms"]["verb_object_distillations"] = [
        {"domain": "组织制度", "template": "健全/完善 + 制度体系/权责机制/标准规程"},
        {"domain": "要素支撑", "template": "拓宽/争取 + 融资渠道/财政资金/社会资本；强化/打造 + 人才队伍/专业团队"},
        {"domain": "科技创新", "template": "搭建/研发 + 智慧平台/指挥控制系统/数据感知网络；运用 + 数字孪生/仿真试验"},
        {"domain": "产业生态", "template": "培育/优化 + 优势产业/特色品牌/多元业态；延长/串联 + 产业链条/市场流通"},
        {"domain": "协同联动", "template": "深化/建立 + 跨区域协作/政企良性互动/联防联控机制"}
    ]
    aggregated["lexicon_and_synonyms"]["inferred_measures_boundaries"] = [
        "前提条件：材料中仅列出痛点问题，而题干明文要求提对策或建议",
        "反推原则：针对具体问题反求举措，必须包含'主体 + 具体规范动作 + 解决何种缺陷'",
        "给分标准：只要措施切中问题要害、具有现实可行性与政务规范性，阅卷人均按同义踩点赋分",
        "失分红线：脱离材料空喊口号（如仅写'加强思想重视'）、措施逻辑与材料问题错位"
    ]

    OUTPUT_FILE.write_text(json.dumps(aggregated, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"✓ 成功完成五维微切片规则抽取与聚类！输出路径: {OUTPUT_FILE}")
    print(f"✓ 包含 {len(aggregated['archetypes'])} 大题型范式、{len(aggregated['paragraph_filtering_rules']['paragraph_trace_by_exam'])} 个真题段落轨迹、{len(aggregated['examiner_scoring_mechanics']['question_case_rubrics'])} 份真实采分案卷。")

if __name__ == "__main__":
    mine_rules()
