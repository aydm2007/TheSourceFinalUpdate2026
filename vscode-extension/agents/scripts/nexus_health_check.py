import os
import re

SKILLS_DIR = r"c:\tools\workspace\TheSource\.agents\skills"
MEMORY_DIR = r"c:\tools\workspace\TheSource\.agents\memory"
MASTER_FILE = r"c:\tools\workspace\TheSource\.agents\skills\nexus-core\master.md"

def check_version(filepath, expected_version="45.0-Omega"):
    if not os.path.exists(filepath):
        return False, "File not found"
    with open(filepath, "r", encoding="utf-8") as f:
        content = f.read()
        if expected_version in content:
            return True, f"Found {expected_version}"
        return False, "Version mismatch or not found"

def main():
    print("--- AETHER-ZENITH V45.0-Omega-Nexus Health Check ---")
    
    # 1. Check Master Skill
    ok, msg = check_version(MASTER_FILE)
    print(f"[MASTER] {MASTER_FILE}: {'PASS' if ok else 'FAIL'} ({msg})")
    
    # 2. Check Sub-Skills (All 15 remaining skills)
    skills = [
        "admin-governor", "agri-specialist", "architectural-constitution", "auto-dream",
        "db-forensics", "django-doctor", "enterprise-integrator", "finance-auditor",
        "flutter-fixer", "nexus-memory", "react-surgeon", "security-audit",
        "shadow-memory", "ui-synthesizer", "zenith-nexus"
    ]
    for skill in skills:
        skill_path = os.path.join(SKILLS_DIR, skill, "SKILL.md")
        ok, msg = check_version(skill_path)
        print(f"[SKILL] {skill}: {'PASS' if ok else 'FAIL'} ({msg})")
        
    # 3. Check Memory Artifacts
    memory_files = ["decisions.md", "patterns.md", "bugs.md"]
    for mem in memory_files:
        mem_path = os.path.join(MEMORY_DIR, mem)
        exists = os.path.exists(mem_path)
        print(f"[MEMORY] {mem}: {'PASS' if exists else 'FAIL'}")

    print("---------------------------------------")

if __name__ == "__main__":
    main()
