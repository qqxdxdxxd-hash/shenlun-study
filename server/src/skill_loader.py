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
    def __init__(self, skills_dir: Optional[str] = None):
        if skills_dir:
            self.skills_dir = Path(skills_dir)
        else:
            self.skills_dir = Path(__file__).parent.parent / "skills"
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

    def list_skills(self) -> Dict[str, Any]:
        return {k: {"id": v.skill_id, "name": v.name, "question_type": v.question_type} for k, v in self._skills.items()}
