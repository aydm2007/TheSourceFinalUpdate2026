import os, json, re

base = r'c:\tools\workspace\TheSource'
mem = os.path.join(base, '.agents', 'memory')
skill_dir = os.path.join(base, '.agents', 'skills', 'nexus-memory')

print('='*60)
print('NEXUS-MEMORY ATOMIC BEHAVIORAL AUDIT')
print('='*60)

# 1. vector_index.json
vi_path = os.path.join(mem, 'vector_index.json')
try:
    with open(vi_path, encoding='utf-8') as f:
        vi = json.load(f)
    print(f'\n[1] vector_index.json: VALID ({len(vi)} entries)')
except Exception as e:
    print(f'\n[1] vector_index.json: INVALID ({e})')

# 2. decisions.md
d_path = os.path.join(mem, 'decisions.md')
try:
    with open(d_path, encoding='utf-8') as f:
        d = f.read()
    append_count = d.count('APPEND')
    entry_count = d.count('## [')
    print(f'[2] decisions.md: {len(d)} bytes, ~{entry_count} entries, APPEND markers: {append_count}')
except Exception as e:
    print(f'[2] decisions.md: ERROR ({e})')

# 3. patterns.md
p_path = os.path.join(mem, 'patterns.md')
try:
    with open(p_path, encoding='utf-8') as f:
        p = f.read()
    print(f'[3] patterns.md: {len(p)} bytes')
except Exception as e:
    print(f'[3] patterns.md: ERROR ({e})')

# 4. bugs.md
b_path = os.path.join(mem, 'bugs.md')
try:
    with open(b_path, encoding='utf-8') as f:
        b = f.read()
    print(f'[4] bugs.md: {len(b)} bytes')
except Exception as e:
    print(f'[4] bugs.md: ERROR ({e})')

# 5. shadow_ledger.jsonl
sl_path = os.path.join(mem, 'shadow_ledger.jsonl')
try:
    with open(sl_path, encoding='utf-8') as f:
        lines = f.readlines()
    valid = sum(1 for l in lines if l.strip())
    print(f'[5] shadow_ledger.jsonl: {len(lines)} lines, ~{valid} non-empty')
except Exception as e:
    print(f'[5] shadow_ledger.jsonl: ERROR ({e})')

# 6. Security scrub
print('\n--- SECURITY SCRUB ---')
secrets_found = 0
pattern = re.compile(r'sk-[A-Za-z0-9]{20,}|SECRET_KEY\s*=\s*["\'][^"\']+')
for root, dirs, files in os.walk(mem):
    for fn in files:
        fp = os.path.join(root, fn)
        try:
            with open(fp, encoding='utf-8', errors='ignore') as fh:
                content = fh.read()
            if pattern.search(content):
                secrets_found += 1
                print(f'  !! SECRET FOUND: {fn}')
        except:
            pass
print(f'Total secrets: {secrets_found}')

# 7. SKILL.md internal consistency
print('\n--- SKILL.md INTERNAL CONSISTENCY ---')
skill_path = os.path.join(skill_dir, 'SKILL.md')
with open(skill_path, encoding='utf-8') as f:
    sc = f.read()

ver_match = re.search(r'version:\s*(.+)', sc)
print(f'Version declared: {ver_match.group(1).strip() if ver_match else "MISSING"}')
has_bootstrap = 'Bootstrap Protocol' in sc
has_test_suite = 'Test Suite' in sc
has_security = 'Security Scrubbing' in sc
has_vector_protocol = 'Vector Indexing' in sc
has_mermaid = 'mermaid' in sc
has_flash = 'Flash-Velocity' in sc
has_opus = 'Opus-Tier' in sc
has_bridge = 'Bridge Integration' in sc
has_powershell = 'powershell' in sc.lower()
print(f'Bootstrap Protocol: {has_bootstrap}')
print(f'Test Suite: {has_test_suite}')
print(f'Security Scrubbing: {has_security}')
print(f'Vector Indexing: {has_vector_protocol}')
print(f'Mermaid Decision Maps: {has_mermaid}')
print(f'Flash-Velocity Session Mgmt: {has_flash}')
print(f'Opus-Tier Cognition: {has_opus}')
print(f'Bridge Integration: {has_bridge}')
print(f'PowerShell OS-Agnostic: {has_powershell}')

# 8. Alignment with main.tsx
print('\n--- ALIGNMENT WITH src/main.tsx ---')
main_path = os.path.join(base, 'src', 'main.tsx')
with open(main_path, encoding='utf-8') as f:
    main_head = f.read(8000)

checks = {
    'skillChangeDetector': 'skillChangeDetector' in main_head,
    'VectorSearch': 'VectorSearch' in main_head,
    'initBundledSkills': 'initBundledSkills' in main_head,
    'SandboxManager': 'SandboxManager' in main_head,
    'GrowthBook': 'GrowthBook' in main_head,
    'Kairos/Assistant': 'kairosGate' in main_head or 'assistantModule' in main_head,
    'Sovereign branding': 'sovereign' in main_head.lower(),
}
for k, v in checks.items():
    print(f'  main.tsx -> {k}: {"PRESENT" if v else "ABSENT"}')

# 9. Check tool list alignment with master.md
print('\n--- TOOL ALIGNMENT (SKILL.md vs nexus-core/master.md) ---')
master_path = os.path.join(base, '.agents', 'skills', 'nexus-core', 'master.md')
with open(master_path, encoding='utf-8') as f:
    master = f.read()

# Extract allowed-tools from both
def extract_tools(text):
    in_tools = False
    tools = []
    for line in text.split('\n'):
        if 'allowed-tools:' in line:
            in_tools = True
            continue
        if in_tools:
            stripped = line.strip()
            if stripped.startswith('- '):
                tools.append(stripped[2:])
            elif stripped.startswith('---') or (stripped and not stripped.startswith('-')):
                break
    return set(tools)

nexus_tools = extract_tools(sc)
master_tools = extract_tools(master)
missing = master_tools - nexus_tools
extra = nexus_tools - master_tools
print(f'nexus-memory tools: {len(nexus_tools)}')
print(f'master tools: {len(master_tools)}')
print(f'Missing from nexus-memory: {len(missing)} -> {sorted(missing)[:15]}')
print(f'Extra in nexus-memory: {len(extra)} -> {sorted(extra)[:5]}')

print('\n' + '='*60)
print('AUDIT COMPLETE')
