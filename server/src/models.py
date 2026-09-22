from pydantic import BaseModel, Field
from typing import List, Dict, Optional, Any

class MemoryItemPayload(BaseModel):
    id: str
    category: Optional[str] = ""
    tag: Optional[str] = ""
    title: str
    content: str

class ReviewRequest(BaseModel):
    question_type: str = Field(..., description="essay | doc | single")
    question_title: str
    materials: str
    user_answer: str
    target_score: Optional[int] = Field(None, description="若前端或题干未指定，由大模型自主识别")
    word_limit: Optional[int] = Field(None, description="若前端未指定，由大模型自主识别")
    skill_id: str = "shenlun-essay-expert"
    recalled_memories: List[MemoryItemPayload] = []
    # 纯客户端 BYOK 凭据（内存临时透传）
    api_key: Optional[str] = None
    base_url: Optional[str] = None
    model_id: Optional[str] = None

class ChromaSpan(BaseModel):
    start: int
    end: int
    type: str         # main_thesis | story_narrative_leak | copy_redline | colloquial_flaw | formal_phrase | format_item
    color: str        # green | yellow | gray | purple | blue
    style: str        # solid | wavy | background | strikethrough | blink_border
    label: str
    comment: str

class PreScanResponse(BaseModel):
    word_count: int
    copy_ratio: float
    copy_redline_exceeded: bool
    title_issues: List[str]
    pre_spans: List[ChromaSpan]

class ReviewResponse(BaseModel):
    word_count: int
    copy_ratio: float
    copy_redline_exceeded: bool
    score: float
    target_score: float = 35.0
    word_limit: Optional[int] = None
    grade: str
    radar_scores: Dict[str, float]
    chroma_spans: List[ChromaSpan]
    perspectives: Dict[str, Any]
    memory_audit: Dict[str, Any]
    rewritten_exemplar: str
    remediation_drills: List[Dict[str, Any]]
    note: Optional[str] = None

class DrillVerifyRequest(BaseModel):
    drill_type: str
    flaw_text: str
    user_input: str

class DrillVerifyResponse(BaseModel):
    passed: bool
    score: int
    feedback: str
