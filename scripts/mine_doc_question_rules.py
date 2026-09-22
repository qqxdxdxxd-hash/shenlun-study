#!/usr/bin/env python3
"""
scripts/mine_doc_question_rules.py
公文题三轨微切片规则抽取器：
遍历 data/doc_question_corpus/*.json，系统化提取：
1. 格式三件套决策树 (Title, Salutation, Inscription rules)
2. 五大类文种行文骨架 (Document Archetype Skeletons)
3. 机关身份、场景口吻与语体边界 (Government Tone & Register)
4. 内容采分点与政务动宾大词 (Rubric Points & Lexicon)
5. 考场三轨赋分与扣分陷阱 (Examiner Scoring Mechanics)
"""
import json
import re
from pathlib import Path

CORPUS_DIR = Path("data/doc_question_corpus")
OUTPUT_FILE = Path("data/mined_doc_rules_aggregated.json")

def main():
    print("=== 开始对 8 道公文题切片语料进行三轨规则抽取 ===")
    files = sorted(CORPUS_DIR.glob("*.json"))

    doc_cases = []
    for f in files:
        data = json.loads(f.read_text(encoding="utf-8"))
        doc_cases.append(data)

    aggregated = {
        "format_rules": {
            "title_formula": {
                "standard": "发文主体 + 关于 + 事由 + 的 + 文种",
                "rules": [
                    "第一行居中书写，字体工整",
                    "严禁添加《》书名号（加书名号直接扣 1～2 分格式分）",
                    "提纲类文种如题干已有明确限定，可直接使用给定标题（如《语言文字规范化联合整治工作思路汇报提纲》）",
                    "宣传展板类标题可采用‘主标题（文学性）+ 副标题（政务说明）’或直接政务主题式标题"
                ]
            },
            "salutation_rules": {
                "require_salutation": ["公开信", "倡议书", "宣传稿", "致辞", "会议发言稿"],
                "omit_salutation": ["汇报提纲", "工作指南", "工作要点", "宣传展板文稿", "提案案由及建议", "谈话提纲"],
                "salutation_pitfalls": [
                    "‘广大’与‘们’不得重复连用（如‘广大市民朋友们：’在严肃公文中属于语法语病）",
                    "顶格书写，后跟中文全角冒号‘：’"
                ]
            },
            "inscription_rules": {
                "require_inscription": ["公开信", "倡议书", "通知", "通报"],
                "omit_inscription": ["各类提纲（发言提纲/汇报提纲/谈话提纲）", "宣传展板", "工作指南", "工作方案"],
                "inscription_structure": [
                    "右下角靠右排列，发文主体在上一行，成文日期在下一行",
                    "日期右空两格或四格，严禁使用‘相关部门’等模糊主体，须严格依据题干设定的发文身份落款"
                ]
            }
        },
        "archetype_skeletons": {
            "outline_report": {
                "name": "汇报提纲类（上行工作汇报）",
                "applicable": ["调研汇报提纲", "工作思路汇报提纲", "整治情况汇报提纲"],
                "skeleton": [
                    "一、基本情况与整治/调研背景（发文缘由）",
                    "二、主要成效/存在痛点（现状与问题剖析）",
                    "三、工作举措/深化建议（具体工作思路与下步对策）"
                ],
                "cases": ["set4_q4", "set5_q3"]
            },
            "work_guide": {
                "name": "工作规程与指南类（操作规范型）",
                "applicable": ["安全巡查工作指南", "工作规程", "操作指引"],
                "skeleton": [
                    "一、工作目的与基本原则",
                    "二、巡查/核查重点事项（分门别类，按要素分项）",
                    "三、处置流程与纪律要求"
                ],
                "cases": ["set3_q3"]
            },
            "propaganda_board": {
                "name": "宣传展板与宣讲文稿类（对外展示型）",
                "applicable": ["宣传展板文稿", "事迹宣讲稿", "成果展出文稿"],
                "skeleton": [
                    "一、导言（园区/项目简介与设立宗旨）",
                    "二、前世（历史渊源、原貌与传承脉络）",
                    "三、今生（创新利用、业态焕新与现代价值）",
                    "四、结语（发展愿景与号召展望）"
                ],
                "cases": ["set2_q3"]
            },
            "conversation_outline": {
                "name": "面对面沟通与谈话提纲类（面对面监管与指导型）",
                "applicable": ["谈话内容提纲", "约谈提纲", "督查反馈提纲"],
                "skeleton": [
                    "一、开场肯定成绩（肯定企业/部门已有投入与成效，奠定沟通基调）",
                    "二、直指核心问题与风险隐患（严肃指出检查中发现的具体违法违规漏洞）",
                    "三、提出整改要求与推进时限（明确自查自纠、规范管理、合规经营的硬性要求）"
                ],
                "cases": ["set3_q4"]
            },
            "symposium_speech": {
                "name": "座谈会与会议交流发言提纲类（交流研讨型）",
                "applicable": ["座谈会发言提纲", "研讨会交流发言"],
                "skeleton": [
                    "一、称谓与开场（亮明参会身份与发言主题）",
                    "二、新业态/新实践成效与特征（肯定价值与活力）",
                    "三、面临的治理挑战与主要痛点（行业隐患与监管空白）",
                    "四、下步监管与赋能举措（多方协同、规范治理、促进健康发展）"
                ],
                "cases": ["set5_q2"]
            },
            "recommendation_material": {
                "name": "优秀典型案例推荐材料要点类（推荐申报型）",
                "applicable": ["优秀案例推荐材料要点", "典型经验申报要点"],
                "skeleton": [
                    "一、推荐理由与背景综述",
                    "二、核心治理经验与特色做法（分维度归纳）",
                    "三、取得的显著治理成效与示范推广价值"
                ],
                "cases": ["set6_q1"]
            }
        },
        "register_and_tone_rules": {
            "government_tone_matrix": {
                "upward_report": "客气谦逊、实事求是、用词严谨、条理分明，禁用空洞抒情与过激言辞",
                "downward_guide": "清晰明了、指令具体、操作性强、责任到人，以动宾短语开头",
                "regulatory_talk": "严肃诚恳、有礼有节、先肯定后指出问题、整改要求硬性具体、彰显法律权威与服务意识",
                "outward_propaganda": "通俗生动、感情真挚、富于感染力与吸引力、具有自豪感与召唤力"
            },
            "language_pitfalls": [
                "机关语病：广大群众们（重复）、必须一定要（语义重叠）、彻底根治（夸大口号）",
                "通篇大白话：把‘健全机制’写成‘大家商量好章程’，把‘规范经营’写成‘别乱卖东西’",
                "文种混淆：把‘工作指南’写成抒情散文，把‘宣传展板’写成干瘪条规"
            ]
        },
        "examiner_scoring_mechanics": {
            "tri_track_breakdown": {
                "format_score": "1～3分（标题居中无书名号、称谓与落款取舍正确）",
                "content_score": "14～16分（材料原词原意地毯式采点，前置动宾大词+支撑实词）",
                "language_structure_score": "2～3分（逻辑分层MECE、语体契合度、首尾呼应度）"
            },
            "golden_rules": [
                "提纲类（汇报提纲/发言提纲/谈话提纲）一律不用写主送称谓和落款！写了倒扣 1 分格式分！",
                "标题严禁加《》书名号，居中独占一行，字数过长可双行居中成菱形或梯形！",
                "分条列项必须采用标准序数词：‘一、’ ➔ ‘（一）’ ➔ ‘1.’ ➔ ‘（1）’，层次分明！",
                "所有内容采分点必须严格源于给定材料，绝不允许凭空背诵公文套话占格子！"
            ]
        },
        "cases_metadata": [
            {
                "id": d["slug"],
                "title": d["prompt"],
                "category": d["doc_category"],
                "word_limit": d["word_limit"],
                "score": d["target_score"]
            }
            for d in doc_cases
        ]
    }

    OUTPUT_FILE.write_text(json.dumps(aggregated, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"✓ 成功完成公文题三轨规则挖掘与聚类！输出路径: {OUTPUT_FILE}")

if __name__ == "__main__":
    main()
