import json
import httpx
import re
from typing import Dict, Any, List, Optional
from fastapi import HTTPException
from src.models import ReviewRequest, ReviewResponse, ChromaSpan
from src.skill_loader import SkillRegistry, NeutralSkill
from src.chroma_scanner import ChromaScanner
from src.mar_rewriter import MemoryAugmentedRewriter
from src.drill_generator import DrillGenerator

class ShenlunEvaluator:
    def __init__(self, registry: SkillRegistry):
        self.registry = registry

    def pre_scan(self, req: ReviewRequest) -> Dict[str, Any]:
        """
        纯本地 1ms 确定性规则扫描
        """
        title_issues = []
        lines = [line.strip() for line in req.user_answer.splitlines() if line.strip()]
        if lines:
            title_issues = ChromaScanner.scan_title_issues(lines[0])

        spans, copy_ratio = ChromaScanner.detect_copy_redline(req.user_answer, req.materials, min_chars=15)
        return {
            "word_count": len(req.user_answer.strip()),
            "copy_ratio": copy_ratio,
            "copy_redline_exceeded": copy_ratio > 0.20,
            "title_issues": title_issues,
            "copy_spans": spans
        }

    async def evaluate(self, req: ReviewRequest) -> Dict[str, Any]:
        """
        核心批改管线：无状态处理，零数据落盘
        """
        # 1. 规则前检
        pre_info = self.pre_scan(req)

        # 2. 记忆库激活率逆向审计
        memory_audit = MemoryAugmentedRewriter.audit_memory_activation(
            req.user_answer, req.recalled_memories
        )

        # 3. 严格执行 ADR 0004 纯客户端自持密钥 (Strict BYOK)：服务端零默认 Key
        api_key = (req.api_key or "").strip()
        if not api_key:
            raise HTTPException(
                status_code=401,
                detail="【严格自持密钥 (Strict BYOK)】未检测到大模型 API Key。请在网页端【⚙️ 模型配置】中输入您的 API Key（支持 DeepSeek / 火山方舟 / OpenAI 兼容端点）后发起批改。"
            )
        base_url = (req.base_url or "https://api.deepseek.com/v1").strip()
        model_id = (req.model_id or "deepseek-chat").strip()

        req.api_key = api_key
        req.base_url = base_url
        req.model_id = model_id

        # 始终执行真实大模型推理，保证 100% 真实调用
        try:
            return await self._evaluate_with_llm(req, pre_info, memory_audit)
        except Exception as e:
            import traceback
            traceback.print_exc()
            raise HTTPException(status_code=500, detail=f"大模型调用失败: {str(e)}")

    async def _evaluate_with_llm(self, req: ReviewRequest, pre_info: Dict[str, Any], memory_audit: Dict[str, Any]) -> Dict[str, Any]:
        """
        调用客户端透传的 LLM 执行深度评审
        """
        skill = self.registry.get(req.skill_id) or self.registry.get("shenlun-essay-expert")
        system_prompt = skill.assemble_system_prompt()

        mar_instruction = MemoryAugmentedRewriter.build_mar_prompt(
            req.user_answer, req.question_title, req.recalled_memories, question_type=req.question_type
        )

        target_score = req.target_score or (35 if req.question_type == "essay" else (25 if req.question_type == "doc" else 20))
        if req.question_type == "single":
            type_rule = """
## 【单一题（归纳概括/对策/理解）客观采点给分铁律】：
1. 采点给分，宁多勿少。以材料原词原意和采分点为唯一基准，严禁使用议论文“大五段”、“立意论证”等模式评判！
2. 重点审查：①内容采点覆盖度（约占55%）；②分类逻辑与条理（MECE原则、总分与序号，约占20%）；③提炼概括度（前置动宾短语小标题、去案例流水账，约占15%）；④表达与字数规范（字数控制、无主观臆造，约占10%）。
"""
            radar_example = f'{{"内容采点覆盖度": {target_score*0.55:.1f}, "分类逻辑与条理": {target_score*0.20:.1f}, "提炼概括度": {target_score*0.15:.1f}, "表达与字数规范": {target_score*0.10:.1f}}}'
            perspectives_example = """  "perspectives": {
    "examiner": "考场考官前10秒第一眼定档：审题要素是否切中、字数与排版条理初判...",
    "structure_expert": "要素归纳与分类逻辑诊断：诊断八大要素提取全面性、总分结构、MECE分类是否交叉重复、前置动宾大词是否工整醒目...",
    "style_expert": "作答规范与去流水账质检：诊断是否存在大段抄录事例/人名/数据流水账、有无主观捏造事实、字数卡位规范度..."
  }"""
        elif req.question_type == "doc":
            type_rule = """
## 【贯彻执行/公文题“格式+内容+语言逻辑”三轨阅卷铁律】：
1. 三轨给分：格式分 + 内容分 + 语言逻辑分。严禁使用议论文“大五段骨架”等模式评判！
2. 重点审查：①内容要点覆盖（材料原词提取，约占60%）；②格式规范三件套（标题/称谓/落款完备性，约占15%）；③行文结构与层次（发文缘由-主体分条-结语号召，约占15%）；④公文语体与口吻（身份场景语气匹配，约占10%）。
"""
            radar_example = f'{{"内容要点覆盖": {target_score*0.60:.1f}, "格式规范三件套": {target_score*0.15:.1f}, "行文结构与层次": {target_score*0.15:.1f}, "公文语体与口吻": {target_score*0.10:.1f}}}'
            perspectives_example = """  "perspectives": {
    "examiner": "考场考官前10秒第一眼定档：文种类型核定、格式三件套完整度、初扫档位与卷面排布...",
    "structure_expert": "格式规范与行文逻辑诊断：核验标题/主送称谓/落款三件套格式合规性；诊断‘发文缘由-主体分条-结语号召’行文脉络...",
    "style_expert": "公文语体与场景口吻质检：核查写作身份与受众口吻匹配度、宣传号召力或总结严肃度、公文语体规范..."
  }"""
        else:
            type_rule = """
## 【申论材料大作文大五段规范阅卷铁律】：
1. 立意源于材料，总分论点鲜明递进，采用标准大五段（1+3）或层层递进骨架；
2. 重点审查：①立意与总分论点（约占35%）；②结构与段落布局（大五段匀称度，约占25%）；③论据与论证深度（因果制度深度分析，约占30%）；④语言与公文规范（政务动宾大词密度，约占10%）。
"""
            radar_example = '{"立意与总分论点": 11.0, "结构与段落布局": 7.5, "论据与论证深度": 9.0, "语言与公文规范": 4.0}'
            perspectives_example = """  "perspectives": {
    "examiner": "考场考官前10秒第一眼定档：首段尾句总论点、字数卡位与第一眼档位初判...",
    "structure_expert": "大五段骨架与对策论证诊断：诊断大五段‘1+3’架构、论据深度、因果分析与案例是否脱节...",
    "style_expert": "政务文风与语汇质检诊断：诊断大白话口语瑕疵、政务动宾大词密度、公文严肃语体规范..."
  }"""

        user_prompt = f"""
待评审申论作答：
【题目/要求】：{req.question_title}（满分 {target_score} 分）
【给定材料】：
{req.materials}

【考生实际作答】：
{req.user_answer}

【前置客观指标】：实测字数 {pre_info['word_count']} 字；材料抄袭率 {pre_info['copy_ratio']*100:.1f}%；标题问题：{pre_info['title_issues']}。

{type_rule}

{mar_instruction}

请以极其严格的官方阅卷考官标准进行评审，并严格按照以下 JSON 格式返回，严禁任何额外格式废话：
```json
{{
  "target_score": {target_score},
  "word_limit": {req.word_limit or (250 if req.question_type == 'single' else (400 if req.question_type == 'doc' else 1000))},
  "score": {target_score * 0.85:.1f},
  "grade": "二类文",
  "radar_scores": {radar_example},
  "quotes_evaluation": [
    {{"quote": "准确的句子原文", "type": "main_thesis", "color": "green", "style": "solid", "label": "核心要点/论点", "comment": "准确踩中要点或亮明观点"}},
    {{"quote": "口语化句子原文", "type": "colloquial_flaw", "color": "purple", "style": "strikethrough", "label": "大白话", "comment": "口语化表达缺少政务大词"}}
  ],
{perspectives_example},
  "rewritten_exemplar": "基于考生原文结合其规范重构的考场标杆示范..."
}}
```
"""

        headers = {
            "Authorization": f"Bearer {req.api_key}",
            "Content-Type": "application/json"
        }
        payload = {
            "model": req.model_id or "gpt-4o",
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            "temperature": 0.2
        }

        base_url = req.base_url.rstrip("/")
        if not base_url.endswith("/v1") and not base_url.endswith("/v3"):
            endpoint = f"{base_url}/chat/completions"
        else:
            endpoint = f"{base_url}/chat/completions"

        async with httpx.AsyncClient(timeout=45.0) as client:
            resp = await client.post(endpoint, json=payload, headers=headers)
            resp.raise_for_status()
            data = resp.json()
            content = data["choices"][0]["message"]["content"]
            
            # 解析 JSON 代码块
            match = re.search(r"```json([\s\S]*?)```", content)
            raw_json = match.group(1).strip() if match else content.strip()
            parsed = json.loads(raw_json)

            # 回填字符跨距
            llm_quotes = parsed.get("quotes_evaluation", [])
            resolved_spans = ChromaScanner.resolve_quotes_to_spans(req.user_answer, llm_quotes)
            all_spans = pre_info["copy_spans"] + resolved_spans

            # 生成微练习
            colloquial_quotes = [q for q in llm_quotes if q.get("type") == "colloquial_flaw"]
            drills = DrillGenerator.extract_remediation_drills(colloquial_quotes)

            extracted_target_score = float(parsed.get("target_score") or target_score)
            extracted_word_limit = parsed.get("word_limit") or req.word_limit
            return {
                "word_count": pre_info["word_count"],
                "copy_ratio": pre_info["copy_ratio"],
                "copy_redline_exceeded": pre_info["copy_redline_exceeded"],
                "score": parsed.get("score", 30.0),
                "target_score": extracted_target_score,
                "word_limit": extracted_word_limit,
                "grade": parsed.get("grade", "二类文"),
                "radar_scores": parsed.get("radar_scores", {}),
                "chroma_spans": [s.model_dump() for s in all_spans],
                "perspectives": parsed.get("perspectives", {}),
                "memory_audit": memory_audit,
                "rewritten_exemplar": parsed.get("rewritten_exemplar", ""),
                "remediation_drills": drills
            }

    def _evaluate_fallback(self, req: ReviewRequest, pre_info: Dict[str, Any], memory_audit: Dict[str, Any], error_msg: Optional[str] = None) -> Dict[str, Any]:
        """
        离线/未配Key/网络异常时的高保真智能推导器
        """
        lines = [l.strip() for l in req.user_answer.splitlines() if l.strip()]
        quotes = []

        # 识别首段尾句总论点
        if len(lines) >= 2:
            quotes.append({
                "quote": lines[1][-45:] if len(lines[1]) > 45 else lines[1],
                "type": "main_thesis",
                "color": "green",
                "style": "solid",
                "label": "总论点",
                "comment": "准确置于首段末句，符合官方阅卷10秒前检标准。"
            })

        # 识别大白话典型句
        colloquial_flaws = []
        for l in lines:
            if "没钱" in l or "大家都不" in l or "天天发文件" in l or "干活" in l:
                quotes.append({
                    "quote": l,
                    "type": "colloquial_flaw",
                    "color": "purple",
                    "style": "strikethrough",
                    "label": "大白话语病",
                    "comment": "存在口语化表达，缺乏政务大词洗练。"
                })
                colloquial_flaws.append({"quote": l})

        # 识别纯故事叙述流水账
        for idx, l in enumerate(lines[2:], 2):
            if len(l) > 120 and ("曾为了" in l or "上世纪" in l or "例如" in l):
                quotes.append({
                    "quote": l[:100],
                    "type": "story_narrative_leak",
                    "color": "gray",
                    "style": "background",
                    "label": "叙述流水账",
                    "comment": "案例事实叙述过长，缺乏事后深度制度剖析，建议压缩至30字。"
                })
                break

        resolved = ChromaScanner.resolve_quotes_to_spans(req.user_answer, quotes)
        all_spans = pre_info["copy_spans"] + resolved

        drills = DrillGenerator.extract_remediation_drills(colloquial_flaws)

        target_score = req.target_score or (35 if req.question_type == "essay" else (25 if req.question_type == "doc" else 20))
        if req.question_type == "single":
            exemplar = "主要经验做法如下：\n1. 【聚力自主研发】。摆脱技术依附，聚焦核心底层原理攻坚，打破国外垄断局面。\n2. 【弘扬工匠精神】。甘坐冷板凳，历经长周期成千上万次反复校验测试，攻克精度极限。\n3. 【对接战略需求】。紧扣国家重大战略工程场景，推进科技研发与实体产业深度融合。"
            fallback_score = round(target_score * 0.825, 1) if pre_info["word_count"] >= 150 else round(target_score * 0.6, 1)
            radar = {
                "内容采点覆盖度": round(fallback_score * 0.55, 1),
                "分类逻辑与条理": round(fallback_score * 0.20, 1),
                "提炼概括度": round(fallback_score * 0.15, 1),
                "表达与字数规范": round(fallback_score * 0.10, 1)
            }
            perspectives = {
                "examiner": "10秒扫描判定：具备总括句与分条列项，要素提取方向基本正确。",
                "structure_expert": "要素归纳较为完整，条理分明，但部分散点归并尚不够MECE，建议按主体或流程整合。",
                "style_expert": "前置动宾提炼尚可，但仍有个别句子直接抄录案例材料细节，建议进一步脱水。"
            }
            grade = "二类卷" if fallback_score >= target_score * 0.75 else "三类卷"
        elif req.question_type == "doc":
            exemplar = "关于推进产业高质量发展的倡议书\n\n广大企业及从业者：\n为全面落实新发展理念，特发出如下倡议：\n一、坚定转型决心，加快技术设备迭代改造；\n二、健全长效机制，加大专业技能人才培训；\n三、优化协作生态，推动上下游产业链协同联动。\n\n推进委员会\n2026年9月"
            fallback_score = round(target_score * 0.8, 1) if pre_info["word_count"] >= 300 else round(target_score * 0.58, 1)
            radar = {
                "内容要点覆盖": round(fallback_score * 0.60, 1),
                "格式规范三件套": round(fallback_score * 0.15, 1),
                "行文结构与层次": round(fallback_score * 0.15, 1),
                "公文语体与口吻": round(fallback_score * 0.10, 1)
            }
            perspectives = {
                "examiner": "10秒扫描判定：文种结构完整，格式三件套齐备，版面排布规范。",
                "structure_expert": "发文缘由与主体对策结构清晰，层次推进合规，各要点分条列项清晰醒目。",
                "style_expert": "公文语体庄重，口吻契合发文场景，宣传倡议类文种注意强化感染号召力。"
            }
            grade = "二类卷" if fallback_score >= target_score * 0.75 else "三类卷"
        else:
            exemplar = f"《以绿色发展绘就中国式现代化生态底色》\n\n大鹏之动，非一羽之轻；骐骥之速，非一足之力。面对新时代的高质量发展要求，我们必须协同推进降碳、减污、扩绿、增长 [来自记忆库: 生态文明]，以高品质生态环境支撑高质量发展。\n\n筑牢生态屏障，必须坚持理念先行，推动生产方式绿色转型。以新旧动能转换为契机，坚决关停落后产能、大力发展清洁能源，推动传统制造业智能化改造。\n\n涵养绿色动能，必须强化制度保障，健全生态治理长效机制。针对基层治理痛点，健全多元化财政保障体系，破除“唯台账论”的浮夸之风 [来自记忆库: 基层减负]，让生态考核真正化为长效机制。"
            fallback_score = 31.5 if pre_info["word_count"] >= 900 else 24.0
            radar = {"立意与总分论点": 11.0, "结构与段落布局": 7.5, "论据与论证深度": 9.0, "语言与公文规范": 4.0}
            perspectives = {
                "examiner": "10秒扫描判定：首段尾句总论点醒目，各段排版匀称，标题对仗合格。",
                "structure_expert": "大五段骨架完整，但正文案例叙述略偏长，需加强因果论证与事后深析。",
                "style_expert": "政务用语密度尚可，部分段落出现大白话口语瑕疵，已生成靶向微练习。"
            }
            grade = "一类下 (31~32分档)" if pre_info["word_count"] >= 900 else "三类文"

        return {
            "word_count": pre_info["word_count"],
            "copy_ratio": pre_info["copy_ratio"],
            "copy_redline_exceeded": pre_info["copy_redline_exceeded"],
            "score": fallback_score,
            "target_score": float(target_score),
            "word_limit": req.word_limit,
            "grade": grade,
            "radar_scores": radar,
            "chroma_spans": [s.model_dump() for s in all_spans],
            "perspectives": perspectives,
            "memory_audit": memory_audit,
            "rewritten_exemplar": exemplar,
            "remediation_drills": drills,
            "note": "本地智能解析模式 (若在设置页输入 BYOK Key，将直接调用你配置的专属大模型)"
        }
