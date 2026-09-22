#!/usr/bin/env python3
"""
官方阅卷 Skill 静态导出器
将 server/skills/ 下的 Markdown 规范导出为前端直接可消费的 JSON 文件。
"""
from pathlib import Path
import json
import yaml

def export_skills(skills_dir: Path, output_file: Path):
    output_file.parent.mkdir(parents=True, exist_ok=True)
    skills_data = {}

    for sdir in sorted(skills_dir.iterdir()):
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

        skill_id = meta.get("name", sdir.name)
        skills_data[skill_id] = {
            "id": skill_id,
            "name": meta.get("description", skill_id),
            "question_type": meta.get("metadata", {}).get("question_type", "essay"),
            "prompt": body
        }

    output_file.write_text(json.dumps(skills_data, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"✓ 成功导出 {len(skills_data)} 个官方中立阅卷规范到: {output_file}")

if __name__ == "__main__":
    export_skills(Path("server/skills"), Path("web/data/skills/skills.json"))
