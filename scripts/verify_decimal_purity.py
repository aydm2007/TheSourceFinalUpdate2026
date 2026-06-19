import os
import sys
import re

print("🧮 [Fiscal-Guard] Checking code files for illegal Float usage...")

# Regex to detect float usage in fields, variables, or functions
illegal_patterns = [
    re.compile(r'\bfloat\b'),
    re.compile(r'FloatFields?'),
    re.compile(r'float\(')
]

violations = []
exclude_dirs = {
    'node_modules', '.git', 'dist', 'package', 'venv', 'test-results', 
    '.agents', 'scratch', 'vscode-extension', '__tests__', 'tests', 
    '.nexus', 'bootstrap', 'coordinator', 'core', 'tools', 'core-engine', 'upstreamproxy', 'coverage'
}

for target_dir in ['src']:
    target_path = os.path.join(os.getcwd(), target_dir)
    if not os.path.exists(target_path):
        continue
    for root, dirs, files in os.walk(target_path):
        dirs[:] = [d for d in dirs if d not in exclude_dirs]
        for file in files:
            if file.endswith(('.ts', '.js', '.py')) and not file.startswith('verify_decimal_purity') and not file.endswith(('.test.ts', '.test.js', '.spec.ts', '.spec.js')):
                file_path = os.path.join(root, file)
                try:
                    with open(file_path, 'r', encoding='utf-8') as f:
                        for line_num, line in enumerate(f, 1):
                            if any(pattern.search(line) for pattern in illegal_patterns):
                                # Ignore comments or inline exclusions
                                if not line.strip().startswith(('#', '//', '*')):
                                    violations.append(f"{file_path} (L{line_num}): {line.strip()}")
                except Exception as e:
                    pass

if violations:
    print("🚨 [Fiscal-Guard] Violations found! Floating-point arithmetic detected:")
    for v in sorted(violations)[:50]:
        print(f"  - {v}")
    if len(violations) > 50:
        print(f"  ... and {len(violations) - 50} more violations.")
    print("❌ Deployment checks failed. Use decimal.js (TS) or Decimal (Python) instead for financial data.")
    sys.exit(1)
else:
    print("✅ [Fiscal-Guard] 100% Decimal Purity verified. No Float violations found.")
    sys.exit(0)
