import pytest
from fastapi.testclient import TestClient
from src.main import app

client = TestClient(app)

def test_api_get_exams():
    res = client.get("/api/kb/exams")
    assert res.status_code == 200
    exams = res.json()
    assert len(exams) >= 3
    assert any("2026年国考" in e["exam_name"] for e in exams)

def test_api_get_skills():
    res = client.get("/api/skills")
    assert res.status_code == 200
    skills = res.json()
    assert "shenlun-essay-expert" in skills

def test_api_pre_scan():
    payload = {
        "question_type": "essay",
        "question_title": "测试",
        "materials": "某市曾为了眼前的GDP指标盲目招商，导致水体发黑发臭严重破坏生态。",
        "user_answer": "《绿色发展》\n某市曾为了眼前的GDP指标盲目招商，导致水体发黑发臭严重破坏生态。我们要引以为戒。",
        "target_score": 35
    }
    res = client.post("/api/review/scan", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["word_count"] > 0
    assert data["copy_ratio"] > 0.4
    assert len(data["title_issues"]) >= 1

def test_api_submit_review_without_key_returns_401():
    payload = {
        "question_type": "essay",
        "question_title": "以绿色发展绘就中国式现代化底色",
        "materials": "给定材料文字...",
        "user_answer": "以绿色发展绘就中国式现代化生态底色\n\n大鹏之动非一羽之轻。面对新时代的高质量发展，必须协同推进降碳、减污、扩绿、增长。\n\n筑牢生态屏障，必须坚持理念先行。上面天天发文件，村里没钱做不了事。\n\n蓝图绘就奋进正当其时！",
        "target_score": 35,
        "recalled_memories": [
            {"id": "m1", "title": "降碳四字协同", "content": "降碳、减污、扩绿、增长"}
        ]
    }
    res = client.post("/api/review/submit", json=payload)
    assert res.status_code == 401
    assert "严格自持密钥" in res.json()["detail"]

def test_api_submit_review_with_byok_key(monkeypatch):
    from src.api import evaluator
    payload = {
        "question_type": "essay",
        "question_title": "以绿色发展绘就中国式现代化底色",
        "materials": "给定材料文字...",
        "user_answer": "以绿色发展绘就中国式现代化生态底色\n\n大鹏之动非一羽之轻。面对新时代的高质量发展，必须协同推进降碳、减污、扩绿、增长。\n\n筑牢生态屏障，必须坚持理念先行。上面天天发文件，村里没钱做不了事。\n\n蓝图绘就奋进正当其时！",
        "target_score": 35,
        "api_key": "sk-test-client-byok-key",
        "recalled_memories": [
            {"id": "m1", "title": "降碳四字协同", "content": "降碳、减污、扩绿、增长"}
        ]
    }

    async def mock_eval_with_llm(req, pre_info, memory_audit):
        return evaluator._evaluate_fallback(req, pre_info, memory_audit)

    monkeypatch.setattr(evaluator, "_evaluate_with_llm", mock_eval_with_llm)

    res = client.post("/api/review/submit", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert "score" in data
    assert "chroma_spans" in data
    assert len(data["chroma_spans"]) >= 1
    assert data["memory_audit"]["activation_rate"] > 0
    assert len(data["remediation_drills"]) >= 1
