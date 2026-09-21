import json
from pathlib import Path
from typing import List, Dict, Any, Optional
from fastapi import APIRouter, HTTPException, Header, UploadFile, File
from src.models import ReviewRequest, PreScanResponse, DrillVerifyRequest, DrillVerifyResponse
from src.skill_loader import SkillRegistry
from src.evaluator import ShenlunEvaluator
from src.drill_generator import DrillGenerator

router = APIRouter(prefix="/api")

# 全局单例 Skill 注册表与评估器
skills_path = Path(__file__).parent.parent / "skills"
registry = SkillRegistry(str(skills_path))
evaluator = ShenlunEvaluator(registry)

@router.get("/kb/exams")
def get_default_exams():
    """
    只读分发近10年预置真题与官方标准采分底稿
    """
    kb_file = Path(__file__).parent.parent / "data" / "default_kb" / "exams.json"
    if kb_file.exists():
        return json.loads(kb_file.read_text(encoding="utf-8"))
    return []

@router.get("/skills")
def list_skills():
    """
    列出系统当前支持的中立官方阅卷规范 Skill
    """
    return registry.list_skills()

@router.post("/review/scan")
def pre_scan(req: ReviewRequest):
    """
    1ms 纯本地确定性快速预检（物理字数、格式合规、连续抄袭红线）
    """
    res = evaluator.pre_scan(req)
    return {
        "word_count": res["word_count"],
        "copy_ratio": res["copy_ratio"],
        "copy_redline_exceeded": res["copy_redline_exceeded"],
        "title_issues": res["title_issues"],
        "pre_spans": [s.model_dump() for s in res["copy_spans"]]
    }

@router.post("/review/submit")
async def submit_review(
    req: ReviewRequest,
    x_api_key: Optional[str] = Header(None),
    x_base_url: Optional[str] = Header(None),
    x_model_id: Optional[str] = Header(None)
):
    """
    无状态全真多维色谱穿透批改核心接口（支持客户端 BYOK Header 透传）
    """
    if x_api_key and not req.api_key:
        req.api_key = x_api_key
    if x_base_url and not req.base_url:
        req.base_url = x_base_url
    if x_model_id and not req.model_id:
        req.model_id = x_model_id

    result = await evaluator.evaluate(req)
    return result

@router.post("/drill/verify", response_model=DrillVerifyResponse)
def verify_drill(req: DrillVerifyRequest):
    """
    3分钟靶向微练习即时秒判
    """
    res = DrillGenerator.verify_drill_input(req.drill_type, req.flaw_text, req.user_input)
    return DrillVerifyResponse(**res)

@router.post("/workshop/extract-skill")
def extract_custom_skill(payload: Dict[str, str]):
    """
    Skill 提炼工坊：从考生上传的文本中提炼结构化 Skill 模板
    """
    text = payload.get("text", "").strip()
    name = payload.get("name", "我的私有批改专家").strip()
    if not text:
        raise HTTPException(status_code=400, detail="文本内容不能为空")

    # 结构化提炼模板
    extracted = {
        "name": name,
        "question_type": "essay",
        "description": f"基于自建资料提炼的私有批改专家：{name}",
        "prompt": f"""---
name: {name}
description: {name}
metadata:
  question_type: essay
---
# {name} 评分规范

## 核心阅卷心智：
{text[:400]}...

## 评分量规：
1. 观点明确：紧扣材料，突出核心主题；
2. 论证充分：事例后必须有深入因果制度剖析；
3. 语言规范：杜绝口语大白话，强化政务动宾表达。
"""
    }
    return extracted

@router.post("/extract-pdf")
async def extract_pdf_endpoint(file: UploadFile = File(...)):
    """
    接收用户上传的 PDF 讲义/试卷，在内存中极速提取文本图层并返回，服务端零落盘
    """
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="仅支持 PDF 文件解析")
    
    content = await file.read()
    try:
        import pymupdf
        doc = pymupdf.open(stream=content, filetype="pdf")
        pages_text = []
        for page_idx, page in enumerate(doc, 1):
            t = page.get_text().strip()
            if t:
                pages_text.append(f"--- [第 {page_idx} 页] ---\n{t}")
        full_text = "\n\n".join(pages_text)
        return {
            "filename": file.filename,
            "page_count": len(doc),
            "char_count": len(full_text),
            "text": full_text
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"PDF 解析失败: {str(e)}")
