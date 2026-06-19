import subprocess, sys, os, glob, re

os.chdir(r'C:\tools\workspace\AgriAsset_YECO_Enterprise_Final2\backend')

base = r'C:\tools\workspace\AgriAsset_YECO_Enterprise_Final2\backend'
output_path = r'C:\tools\workspace\TheSource\agri_full_diag.txt'

# --- Django Check ---
r = subprocess.run([sys.executable, 'manage.py', 'check'], capture_output=True, text=True)
django_result = r.stdout + r.stderr

# --- Migration status ---
r2 = subprocess.run([sys.executable, 'manage.py', 'showmigrations', '--plan'], capture_output=True, text=True)
migrations_result = r2.stdout[-3000:] if len(r2.stdout) > 3000 else r2.stdout

# --- Grep helper ---
def grep_files(pattern, ext='py', limit=10):
    matches = []
    for fpath in glob.glob(f'{base}/**/*.{ext}', recursive=True):
        try:
            with open(fpath, encoding='utf-8', errors='ignore') as f:
                for i, line in enumerate(f, 1):
                    if re.search(pattern, line):
                        short = fpath.replace(base, '').replace('\\', '/')
                        matches.append(f'{short}:{i}: {line.strip()[:120]}')
                        if len(matches) >= limit:
                            return matches
        except Exception:
            pass
    return matches

# --- Scans ---
n1_risks   = grep_files(r'for .+objects\.all\(\)')
float_risk = grep_files(r'FloatField|float\(.*\) \*')
debug_on   = grep_files(r'DEBUG\s*=\s*True', ext='py')
hardcoded  = grep_files(r'SECRET_KEY\s*=\s*[\"\'][\w\-]+', ext='py')
csrf_ex    = grep_files(r'@csrf_exempt')
raw_sql    = grep_files(r'\.raw\(|cursor\.execute\(')
pop_risk   = grep_files(r'validated_data\.pop\(')

def fmt(label, items):
    if not items:
        return f'=== {label} ===\nCLEAN ✅\n'
    return f'=== {label} ({len(items)} found) ===\n' + '\n'.join(items) + '\n'

report = '\n'.join([
    '=== DJANGO STRUCTURAL CHECK ===',
    django_result,
    fmt('N+1 QUERY RISKS', n1_risks),
    fmt('FLOAT PRECISION RISKS', float_risk),
    fmt('DEBUG=True IN SETTINGS', debug_on),
    fmt('HARDCODED SECRETS', hardcoded),
    fmt('CSRF EXEMPT USAGE', csrf_ex),
    fmt('RAW SQL INJECTION RISK', raw_sql),
    fmt('VALIDATED_DATA.POP() RISK', pop_risk),
    '=== MIGRATION STATUS (last 3000 chars) ===',
    migrations_result,
])

with open(output_path, 'w', encoding='utf-8') as f:
    f.write(report)

print(f'Diagnosis complete. Written to {output_path}')
print(f'Django check: {"OK" if "no issues" in django_result else "ISSUES FOUND"}')
print(f'N+1 risks: {len(n1_risks)}')
print(f'Float risks: {len(float_risk)}')
print(f'DEBUG on: {len(debug_on)}')
print(f'Hardcoded secrets: {len(hardcoded)}')
print(f'CSRF exempt: {len(csrf_ex)}')
print(f'Raw SQL: {len(raw_sql)}')
print(f'pop() risks: {len(pop_risk)}')
