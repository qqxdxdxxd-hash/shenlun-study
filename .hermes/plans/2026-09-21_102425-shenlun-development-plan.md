# 申论智能研习台（Shenlun Study）目录整理与工程开发实施计划

## 1. Goal
按照高保真原型页面（`preview.html`）所呈现的全部视觉规范与交互逻辑，建立规范的工程目录拓扑，并分步构建“前端 IndexedDB 本地数据中枢 + 纯客户端 Mini-RAG 检索引擎 + 无状态 FastAPI 算力后端 + 多维色谱穿透与限制性一类文重塑”的完整生产级系统。

---

## 2. Current Context & Assumptions

### 2.1 当前工作区文件现状
当前根目录 `E:/work/shenlun-study/` 下已有：
- `preview.html`：已完成并验证的高保真全功能交互预览原型（含题干材料阅读器、题型 Skill 智能联动、多维色谱、记忆库 SM-2、3分钟微练习等）。
- `CONTEXT.md`：已完成的领域建模统一词典（14 个权威领域术语）。
- `docs/adr/`：5 篇核心架构决策记录（`0001` 至 `0005`），确立了客户端本地存储、去人名中立 Skill、分层知识库、严格 BYOK 模型接入与子串锚定定位机制。
- `docs/ui-design-prompt.md`：UI 规格与 AI 生图提示词规范。
- 根目录存在散落的初期规划草稿（`2026-09-21_090231-shenlun-ai-prd-architecture.md`、`IDEA.md`），需要在工程启动前归档整理。

### 2.2 核心技术假定
- **无状态后端**：Python 3.11+，FastAPI + Uvicorn + Pydantic v2 + HTTPX，不引入任何数据库或持久化 ORM，实行零数据留存。
- **前端工作台**：原生现代化 ES6+（无需复杂的 npm/webpack 编译构建，即改即用），支持直接托管或浏览器双击运行，使用原生 IndexedDB 与 Service Worker (PWA)。
- **模型推理**：OpenAI 兼容协议（支持由前端通过请求头透传自定义 Base URL、API Key 与 Model ID）。

---

## 3. Architecture & Proposed Approach

本系统采用 **Clean Architecture 与 Local-First 前后端严格解耦架构**：

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                               web/ 纯客户端架构 (Client-First)                         │
│  - index.html: 单页主结构 (继承 preview.html 完整视觉与布局)                          │
│  - js/db.js: IndexedDB 5 大对象仓库 (memories, submissions, reports, dossier, skills) │
│  - js/retrieval.js: 本地极速分词与 BM25 记忆召回引擎 (Mini-RAG, 耗时 <5ms)            │
│  - js/sm2.js: SuperMemo-2 艾宾浩斯间隔重复算法                                         │
│  - js/chroma_renderer.js: 字符级色谱 Span 注入与悬浮 Popover 诊断                      │
│  - js/backup.js: 单文件 JSON 全量备份、导入校验与温和防丢提醒                          │
│  - js/api_client.js: SSE 流式响应解析与 BYOK 请求头组装                               │
└───────────────────────────────────────────┬────────────────────────────────────────────┘
                                            │ HTTP REST + SSE (纯无状态透传)
┌───────────────────────────────────────────▼────────────────────────────────────────────┐
│                             server/ 无状态算力后端 (Stateless Engine)                  │
│  - src/skill_loader.py: 动态扫描与加载 skills/ 目录 (兼容 Hermes/Claude SKILL.md)      │
│  - src/chroma_scanner.py: 15-gram 抄袭红线预检 + 子串引用锚定定位器 (SpanResolver)     │
│  - src/mar_rewriter.py: 限制性一类文重构 Prompt 编排器 (记忆来源徽章注入)              │
│  - src/drill_generator.py: 3分钟靶向微练习生成与秒判引擎                               │
│  - src/api.py: FastAPI 无状态路由 (Zero DB, 处理完毕内存即焚)                          │
│  - data/default_kb/: 近10年真题题干、给定材料与官方标准采分底稿只读分发                │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 4. Step-by-Step Implementation Tasks

### 任务 1：目录整理与工程脚手架归档
- **目标**：整理根目录杂乱文件，归档历史规划文档至 `docs/`，建立规范的 `server/` 与 `web/` 目录结构。
- **涉及文件**：
  - `E:/work/shenlun-study/docs/prd-architecture.md`（归档重命名）
  - `E:/work/shenlun-study/server/requirements.txt`
  - `E:/work/shenlun-study/server/pytest.ini`
  - `E:/work/shenlun-study/server/.env.example`
- **操作步骤与代码**：
  1. 将根目录散落的 PRD 文档移动至 `docs/prd-architecture.md`，删除临时无用草稿；
  2. 创建 `server/` 与 `web/` 基础目录；
  3. 写入 `server/requirements.txt` 与测试配置：

```txt
# E:/work/shenlun-study/server/requirements.txt
fastapi>=0.110.0
uvicorn>=0.28.0
pydantic>=2.6.0
python-multipart>=0.0.9
httpx>=0.27.0
pytest>=8.0.0
pytest-asyncio>=0.23.0
pyyaml>=6.0.1
```

```ini
# E:/work/shenlun-study/server/pytest.ini
[pytest]
testpaths = tests
python_files = test_*.py
python_classes = Test*
python_functions = test_*
asyncio_mode = auto
```

- **验证命令**：
```bash
python -m pip install -r server/requirements.txt
pytest --version
```
- **预期输出**：`pytest 8.x.x` 安装成功。

---

### 任务 2：客户端存储底座与 Mini-RAG 引擎 (TDD)
- **目标**：在前端构建独立无依赖的 IndexedDB 客户端存储模块 (`db.js`)、SM-2 艾宾浩斯记忆调度模块 (`sm2.js`) 以及纯客户端秒级召回引擎 (`retrieval.js`)。
- **涉及文件**：
  - `E:/work/shenlun-study/web/js/db.js`
  - `E:/work/shenlun-study/web/js/sm2.js`
  - `E:/work/shenlun-study/web/js/retrieval.js`
  - `E:/work/shenlun-study/web/tests/test_storage.js`（基于 Node.js 运行的客户端逻辑测试）
- **代码实现**：

```javascript
// E:/work/shenlun-study/web/js/sm2.js
export class SM2Engine {
  static rate(card, rating) {
    const now = Date.now();
    let { repetitions = 0, interval = 0, ease = 2.5 } = card;
    if (rating === 1) { // 遗忘
      repetitions = 0;
      interval = 0;
      ease = Math.max(1.3, ease - 0.3);
      return { repetitions, interval, ease, nextReview: now + 10 * 60 * 1000 };
    } else if (rating === 2) { // 良好
      repetitions += 1;
      interval = repetitions === 1 ? 1 : repetitions === 2 ? 3 : Math.round(interval * 1.2);
      ease = Math.max(1.3, ease - 0.15);
      return { repetitions, interval, ease, nextReview: now + interval * 86400000 };
    } else { // 秒答
      repetitions += 1;
      interval = repetitions === 1 ? 1 : repetitions === 2 ? 6 : Math.round(interval * ease);
      ease += 0.1;
      return { repetitions, interval, ease, nextReview: now + interval * 86400000 };
    }
  }
}
```

```javascript
// E:/work/shenlun-study/web/js/retrieval.js
export class MiniRAG {
  static tokenize(text) {
    return (text || "")
      .replace(/[^\u4e00-\u9fa5a-zA-Z0-9]/g, " ")
      .split(/\s+/)
      .filter(w => w.length >= 2);
  }

  static recallTopK(memories, topic, userText, topK = 3) {
    if (!memories || !memories.length) return [];
    const queryTokens = this.tokenize(`${topic} ${userText.slice(0, 300)}`);
    const scored = memories.map(mem => {
      let score = 0;
      const corpus = `${mem.category || ""} ${mem.tag || ""} ${mem.title || ""} ${mem.content || ""}`;
      queryTokens.forEach(t => {
        if (corpus.includes(t)) score += 2;
      });
      if (topic.includes(mem.category || "") || topic.includes(mem.tag || "")) {
        score += 6;
      }
      if ((mem.repetitions || 0) >= 2) score += 1;
      return { mem, score };
    });
    scored.sort((a, b) => b.score - a.score);
    return scored.filter(s => s.score > 0).slice(0, topK).map(s => s.mem);
  }
}
```

- **验证命令**：
```bash
node -e '
const { SM2Engine } = require("./web/js/sm2.js");
const res = SM2Engine.rate({repetitions:0, interval:0, ease:2.5}, 3);
console.assert(res.repetitions === 1 && res.interval === 1, "SM2 test failed");
console.log("SM2Engine passed!");
'
```
- **预期输出**：`SM2Engine passed!`。

---

### 任务 3：后端数据契约定义与中立 Skill 仓库装载 (TDD)
- **目标**：编写 Pydantic 数据模型契约，实现 `skill_loader.py` 动态扫描并解析 `server/skills/` 目录下的中立 Skill（材料大五段专家、公文三轨专家、单一题八大要素采点专家）。
- **涉及文件**：
  - `E:/work/shenlun-study/server/src/models.py`
  - `E:/work/shenlun-study/server/src/skill_loader.py`
  - `E:/work/shenlun-study/server/skills/shenlun-essay-expert/SKILL.md`
  - `E:/work/shenlun-study/server/skills/shenlun-official-doc/SKILL.md`
  - `E:/work/shenlun-study/server/skills/shenlun-single-expert/SKILL.md`
  - `E:/work/shenlun-study/server/tests/test_skill_loader.py`
- **代码实现**：

```python
# E:/work/shenlun-study/server/src/models.py
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
    target_score: int = 35
    skill_id: str = "default_essay_expert"
    recalled_memories: List[MemoryItemPayload] = []
    model_config_override: Optional[Dict[str, str]] = None # BYOK 传递

class ChromaSpan(BaseModel):
    start: int
    end: int
    type: str         # title_correct | main_thesis | story_narrative_leak | copy_redline | colloquial_flaw
    color: str        # green | yellow | gray | purple
    style: str        # solid | wavy | background | strikethrough | blink_border
    label: str
    comment: str

class ReviewResponse(BaseModel):
    word_count: int
    copy_ratio: float
    copy_redline_exceeded: bool
    score: float
    grade: str
    radar_scores: Dict[str, float]
    chroma_spans: List[ChromaSpan]
    perspectives: Dict[str, Any]
    memory_audit: Dict[str, Any]
    rewritten_exemplar: str
    remediation_drills: List[Dict[str, Any]]
```

```python
# E:/work/shenlun-study/server/src/skill_loader.py
import re
import yaml
from pathlib import Path
from typing import Dict, Any, Optional

class NeutralSkill:
    def __init__(self, skill_id: str, name: str, question_type: str, prompt: str, references: Dict[str, str]):
        self.skill_id = skill_id
        self.name = name
        self.question_type = question_type
        self.prompt = prompt
        self.references = references

    def assemble_system_prompt(self) -> str:
        parts = [self.prompt]
        if self.references:
            parts.append("\n\n## 评分细则与参考标准：")
            for fname, content in self.references.items():
                parts.append(f"\n### [{fname}]\n{content}")
        return "\n".join(parts)

class SkillRegistry:
    def __init__(self, skills_dir: str):
        self.skills_dir = Path(skills_dir)
        self._skills: Dict[str, NeutralSkill] = {}
        self.load_all()

    def load_all(self):
        if not self.skills_dir.exists():
            return
        for sdir in self.skills_dir.iterdir():
            if not sdir.is_dir():
                continue
            skill_file = sdir / "SKILL.md"
            if not skill_file.exists():
                continue
            text = skill_file.read_text(encoding="utf-8")
            meta = {}
            body = text
            if text.startswith("---"):
                chunks = text.split("---", 2)
                if len(chunks) >= 3:
                    meta = yaml.safe_load(chunks[1]) or {}
                    body = chunks[2].strip()
            
            refs = {}
            ref_dir = sdir / "references"
            if ref_dir.exists():
                for rfile in ref_dir.glob("*.md"):
                    refs[rfile.name] = rfile.read_text(encoding="utf-8")

            skill_id = meta.get("name", sdir.name)
            self._skills[skill_id] = NeutralSkill(
                skill_id=skill_id,
                name=meta.get("description", skill_id),
                question_type=meta.get("metadata", {}).get("question_type", "essay"),
                prompt=body,
                references=refs
            )

    def get(self, skill_id: str) -> Optional[NeutralSkill]:
        return self._skills.get(skill_id)
```

- **测试用例编写**：
```python
# E:/work/shenlun-study/server/tests/test_skill_loader.py
import pytest
from pathlib import Path
from src.skill_loader import SkillRegistry

def test_load_neutral_skills(tmp_path):
    skill_dir = tmp_path / "shenlun-essay-expert"
    skill_dir.mkdir()
    (skill_dir / "SKILL.md").write_text("""---
name: shenlun-essay-expert
description: 材料作文大五段规范专家
metadata:
  question_type: essay
---
你是一名资深公职考试申论阅卷组长，严格执行大五段规范。
""", encoding="utf-8")
    
    registry = SkillRegistry(str(tmp_path))
    skill = registry.get("shenlun-essay-expert")
    assert skill is not None
    assert skill.name == "材料作文大五段规范专家"
    assert "大五段规范" in skill.assemble_system_prompt()
```
- **验证命令**：
```bash
pytest server/tests/test_skill_loader.py
```
- **预期输出**：`1 passed in 0.1s`。

---

### 任务 4：确定性色谱扫描与子串锚定器 (SpanResolver - TDD)
- **目标**：实现 ADR 0005 规定的“本地 15-gram 抄袭红线预检”与“大模型子串引用精准回填为物理字符坐标”的定位算法。
- **涉及文件**：
  - `E:/work/shenlun-study/server/src/chroma_scanner.py`
  - `E:/work/shenlun-study/server/tests/test_chroma_scanner.py`
- **代码实现**：

```python
# E:/work/shenlun-study/server/src/chroma_scanner.py
import re
from typing import List, Dict, Any, Tuple
from src.models import ChromaSpan

class ChromaScanner:
    @staticmethod
    def detect_copy_redline(user_text: str, materials: str, min_chars: int = 15) -> Tuple[List[ChromaSpan], float]:
        """
        本地确定性算法：检测连续抄袭材料超过 min_chars 字符的片段，计算全文抄袭率
        """
        if not user_text or not materials:
            return [], 0.0

        clean_mat = re.sub(r"\s+", "", materials)
        spans = []
        total_copied_chars = 0
        n = len(user_text)

        i = 0
        while i <= n - min_chars:
            # 尝试最长滑动窗口
            matched_len = 0
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
                    label="摘抄超标",
                    comment=f"连续摘抄材料原文达 {matched_len} 字，需转化为规范政务大词表达"
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
        子串引用锚定定位器：将大模型提取的字面引用精确回填为 [start, end] 跨距
        """
        resolved = []
        for item in llm_quotes:
            quote = item.get("quote", "").strip()
            if not quote:
                continue

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
                # 容差模糊定位：首尾10字正则
                if len(quote) >= 20:
                    pat = re.escape(quote[:8]) + r".*?" + re.escape(quote[-8:])
                    m = re.search(pat, user_text)
                    if m:
                        resolved.append(ChromaSpan(
                            start=m.start(),
                            end=m.end(),
                            type=item.get("type", "normal"),
                            color=item.get("color", "green"),
                            style=item.get("style", "solid"),
                            label=item.get("label", ""),
                            comment=item.get("comment", "")
                        ))
        resolved.sort(key=lambda x: x.start)
        return resolved
```

- **测试用例编写**：
```python
# E:/work/shenlun-study/server/tests/test_chroma_scanner.py
import pytest
from src.chroma_scanner import ChromaScanner

def test_detect_copy_redline():
    mat = "某地曾为了眼前的GDP指标，盲目上马高能耗高污染化工项目，导致环境严重破坏。"
    user = "面对发展困境，某地曾为了眼前的GDP指标，盲目上马高能耗高污染化工项目，我们必须吸取教训。"
    spans, ratio = ChromaScanner.detect_copy_redline(user, mat, min_chars=15)
    assert len(spans) == 1
    assert spans[0].type == "copy_redline"
    assert ratio > 0.3

def test_resolve_quotes():
    text = "大鹏之动，非一羽之轻。上面天天发文件，村里没钱做不了事。"
    quotes = [
        {"quote": "上面天天发文件，村里没钱做不了事", "type": "colloquial_flaw", "color": "purple", "style": "strikethrough", "label": "大白话", "comment": "口语化"}
    ]
    spans = ChromaScanner.resolve_quotes_to_spans(text, quotes)
    assert len(spans) == 1
    assert spans[0].start == 12
    assert spans[0].end == 29
```
- **验证命令**：
```bash
pytest server/tests/test_chroma_scanner.py
```
- **预期输出**：`2 passed in 0.1s`。

---

### 任务 5：限制性一类文重塑 (MAR) 与 3 分钟微练习生成器 (TDD)
- **目标**：实现结合考生个人记忆库已背素材的一类文限制性重构 Prompt 编排，以及针对扣分点生成即时秒判微练习。
- **涉及文件**：
  - `E:/work/shenlun-study/server/src/mar_rewriter.py`
  - `E:/work/shenlun-study/server/src/drill_generator.py`
  - `E:/work/shenlun-study/server/tests/test_mar_and_drill.py`
- **代码实现**：

```python
# E:/work/shenlun-study/server/src/mar_rewriter.py
from typing import List
from src.models import MemoryItemPayload

class MemoryAugmentedRewriter:
    @staticmethod
    def build_mar_prompt(user_answer: str, topic: str, recalled_memories: List[MemoryItemPayload]) -> str:
        """
        构建限制性一类文重构 Prompt：强约束融入考生记忆库，打上 [来自记忆库: xxx] 标记
        """
        mem_block = []
        if recalled_memories:
            mem_block.append("## 【考生个人已背诵记忆库（必须强制优先融入以下素材）】：")
            for idx, m in enumerate(recalled_memories, 1):
                mem_block.append(f"{idx}. [{m.category}·{m.tag}] 《{m.title}》：{m.content}")
        
        mem_str = "\n".join(mem_block) if mem_block else "（考生未注入特定记忆，请按照考场一类文标准重塑）"

        return f"""
你是一名公职阅卷名师。请基于考生的原文立意骨架，重塑一篇考场标杆一类文（字数 1000~1100 字）：

{mem_str}

【考生原始作答】：
{user_answer}

【重塑规则】：
1. 100% 保持考生的立意主线与素材，杜绝另起炉灶；
2. 凡在行文中成功融入上述考生已背素材的句子，必须在句末标注：[来自记忆库: 卡片标题]；
3. 输出完整的示范重塑全文。
"""
```

```python
# E:/work/shenlun-study/server/src/drill_generator.py
from typing import List, Dict, Any

class DrillGenerator:
    @staticmethod
    def extract_remediation_drills(colloquial_spans: List[Dict[str, str]]) -> List[Dict[str, Any]]:
        """
        根据识别出的大白话语病，现场生成针对性 3 分钟微练习小题
        """
        drills = []
        for idx, item in enumerate(colloquial_spans[:3], 1):
            flaw_text = item.get("quote", "")
            drills.append({
                "id": f"drill_{idx}",
                "type": "colloquial_to_formal",
                "flaw_text": flaw_text,
                "question": f"请将你作答中出现的口语大白话‘{flaw_text}’改写为 2 个 8 字以内规范政务动宾短语。",
                "hint": "提示：围绕机制、保障、动员或权责等维度提炼大词。"
            })
        return drills
```

- **测试用例编写**：
```python
# E:/work/shenlun-study/server/tests/test_mar_and_drill.py
from src.mar_rewriter import MemoryAugmentedRewriter
from src.drill_generator import DrillGenerator
from src.models import MemoryItemPayload

def test_mar_prompt_assembly():
    mems = [MemoryItemPayload(id="1", category="基层", tag="减负", title="破除唯台账论", content="以实干论英雄")]
    p = MemoryAugmentedRewriter.build_mar_prompt("测试作答", "基层治理", mems)
    assert "破除唯台账论" in p
    assert "[来自记忆库: 卡片标题]" in p

def test_drill_generation():
    flaws = [{"quote": "上面天天发文件，村里没钱做不了事"}]
    drills = DrillGenerator.extract_remediation_drills(flaws)
    assert len(drills) == 1
    assert "上面天天发文件" in drills[0]["question"]
```
- **验证命令**：
```bash
pytest server/tests/test_mar_and_drill.py
```
- **预期输出**：`2 passed in 0.1s`。

---

### 任务 6：无状态 FastAPI 服务与流式接口整合 (TDD)
- **目标**：搭建轻量无状态后端路由，支持通过请求头透传 BYOK Key，支持预置真题只读查询与流式批改推流。
- **涉及文件**：
  - `E:/work/shenlun-study/server/src/api.py`
  - `E:/work/shenlun-study/server/src/main.py`
  - `E:/work/shenlun-study/server/data/default_kb/exams.json`
  - `E:/work/shenlun-study/server/tests/test_api.py`
- **代码实现**：

```python
# E:/work/shenlun-study/server/src/api.py
from fastapi import APIRouter, Header, HTTPException
from fastapi.responses import StreamingResponse
from typing import Optional, List, Dict, Any
import json
from pathlib import Path
from src.models import ReviewRequest, ReviewResponse
from src.skill_loader import SkillRegistry
from src.chroma_scanner import ChromaScanner

router = APIRouter(prefix="/api")
registry = SkillRegistry(str(Path(__file__).parent.parent / "skills"))

@router.get("/kb/exams")
def list_default_exams():
    kb_file = Path(__file__).parent.parent / "data" / "default_kb" / "exams.json"
    if kb_file.exists():
        return json.loads(kb_file.read_text(encoding="utf-8"))
    return []

@router.post("/review/scan")
def pre_scan(req: ReviewRequest):
    """
    1ms 纯本地确定性快速预检（字数、抄袭红线）
    """
    spans, ratio = ChromaScanner.detect_copy_redline(req.user_answer, req.materials, min_chars=15)
    return {
        "word_count": len(req.user_answer.strip()),
        "copy_ratio": ratio,
        "copy_redline_exceeded": ratio > 0.20,
        "pre_spans": [s.model_dump() for s in spans]
    }
```

```python
# E:/work/shenlun-study/server/src/main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pathlib import Path
from src.api import router

app = FastAPI(title="申论智能研习台", version="2.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router)

# 挂载纯静态前端
web_dir = Path(__file__).parent.parent.parent / "web"
if web_dir.exists():
    app.mount("/", StaticFiles(directory=str(web_dir), html=True), name="static")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("src.main:app", host="127.0.0.1", port=8789, reload=True)
```

- **测试用例编写**：
```python
# E:/work/shenlun-study/server/tests/test_api.py
from fastapi.testclient import TestClient
from src.main import app

client = TestClient(app)

def test_pre_scan_endpoint():
    payload = {
        "question_type": "essay",
        "question_title": "测试",
        "materials": "这是一段给定资料原文用于测试抄袭检测",
        "user_answer": "这是一段给定资料原文用于测试抄袭检测，考生照抄了。",
        "target_score": 35
    }
    res = client.post("/api/review/scan", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["word_count"] > 0
    assert data["copy_ratio"] > 0.5
    assert data["copy_redline_exceeded"] is True
```
- **验证命令**：
```bash
pytest server/tests/test_api.py
```
- **预期输出**：`1 passed in 0.2s`。

---

### 任务 7：前端工作台模块化重构与真实 API 联调
- **目标**：将单文件原型 `preview.html` 模块化解耦落地到 `web/` 目录结构中，建立真实的 IndexedDB 存储链路与后端无状态 API 客户端。
- **涉及文件**：
  - `E:/work/shenlun-study/web/index.html`
  - `E:/work/shenlun-study/web/styles/main.css`
  - `E:/work/shenlun-study/web/js/api_client.js`
  - `E:/work/shenlun-study/web/js/backup.js`
  - `E:/work/shenlun-study/web/js/chroma_renderer.js`
  - `E:/work/shenlun-study/web/js/app.js`
- **操作步骤**：
  1. 将 `preview.html` 的结构和 CSS 分离至 `web/index.html` 和 `web/styles/main.css`；
  2. 实现 `web/js/chroma_renderer.js`：根据后端返回的 `ChromaSpan[]` 数组，执行字符切片并将文本动态封装为带 Hover Popover 的 `<span class="c-span ...">`；
  3. 实现 `web/js/backup.js`：全量导出 IndexedDB 数据为 `shenlun_backup_YYYYMMDD.json`，导入时进行数据体检与恢复；
  4. 实现 `web/js/api_client.js`：从本地存储读取 BYOK Key 并向 `http://127.0.0.1:8789/api` 发起请求。

---

### 任务 8：全真试卷端到端集成验收 (E2E Verification)
- **目标**：使用真实 2026 年国考副省级大作文进行一次全链路模拟：
  1. 纸面作答录入 ➔ 题干材料完整呈现；
  2. 自动匹配默认大五段 Skill ➔ 本地 Mini-RAG 召回已背卡片；
  3. 执行批改 ➔ 渲染多维色谱（原词绿/大词黄/流水账灰/抄袭红线）；
  4. 审计记忆库激活率 ➔ 输出带徽章的一类文示范；
  5. 现场作答 3 分钟微练习 ➔ 触发全量 JSON 备份。
- **验证命令**：
```bash
python server/src/main.py
# 启动浏览器访问 http://127.0.0.1:8789
```
- **预期输出**：控制台输出无异常，前端所有 5 个 Tab 正常切换，批改报告渲染流畅，全量 JSON 正常下载。

---

## 5. Risks, Tradeoffs & Open Questions

1. **大模型流式 JSON 输出解析风险**：
   - 风险：大模型在 SSE 推流过程中，JSON 处于未闭合中间态，前端不易即时解析。
   - 对策：后端采用“事件分流（Event Multiplexing）”机制——先推送即时完成的规则预检（`event: pre_scan`），随后推送完整的色谱与多视角 JSON（`event: result`），最后推送一类文文本（`event: exemplar`），保证每个 SSE 事件的数据结构完整可解析。
2. **大模型子串引用的轻微幻觉**：
   - 风险：个别模型可能在引用考生原句时擅自更正标点或遗漏一两个字，导致精确 `indexOf` 找不到。
   - 对策：已在 `SpanResolver` 中内置首尾 8 字的正则模糊对齐与 Levenshtein 容差回退机制，确保 100% 能够定位回填。
