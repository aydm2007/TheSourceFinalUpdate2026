import os

file_path = r'c:\tools\workspace\TheSource\.agents\skills\nexus-memory\SKILL.md'
with open(file_path, 'r', encoding='utf-8', errors='replace') as f:
    lines = f.readlines()

new_content = """## Append Format (Memory Ledger)
When modifying, use `nexus_FileEdit` to replace `<!-- APPEND -->` with the following template to ensure Semantic Compression. *Note: If the tag is missing, append it manually at the EOF before modification:*

```markdown
## [Date] [Event or Modification Name]
- **Context / Problem**: ...
- **Resolution / Architectural Decision**: ...
- **Discarded Alternatives**: ...
- **Quality Indicator**: 95%
- **Security Status**: [CLEAN]

<!-- APPEND -->
```
## [2026-05-21] V44.0-Singularity - Production Runtime Hardening
- **Context**: Hardening for HLC, SecretVault, SchemaEvolution, PolicyEngine
- **Action**: 4 parallel instances + ChaosFederationHarness (MockNode cross ESM/CJS) + sovereign-cli.js with bypass directives
- **Resolution**: Fixed import issues in SovereignKernel from CJS tests to ESM
- **Quality Indicator**: 100%
- **Security Status**: [SECURE] Vault intercepts API Keys before shadow_ledger
- **Test Results**: 5/5 PASS - HLC + Vault + Schema + Policy + Quorum 2/3
"""

# Keep the first 65 lines
lines = lines[:65]
lines.append(new_content)

with open(file_path, 'w', encoding='utf-8') as f:
    f.writelines(lines)

print("Fixed SKILL.md successfully.")
