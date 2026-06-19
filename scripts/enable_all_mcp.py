#!/usr/bin/env python3
import json, subprocess, sys, pathlib

# Path to tools definition
TOOLS_PATH = pathlib.Path(__file__).resolve().parents[1] / 'config' / 'mcp' / 'tools.json'

if not TOOLS_PATH.is_file():
    print(f"Error: {TOOLS_PATH} not found", file=sys.stderr)
    sys.exit(1)

with TOOLS_PATH.open() as f:
    data = json.load(f)

tools = [t['name'] for t in data.get('tools', [])]
if not tools:
    print('No tools defined in tools.json', file=sys.stderr)
    sys.exit(1)

for tool in tools:
    print(f'Enabling {tool}...')
    result = subprocess.run(['mcp', 'enable', tool], capture_output=True, text=True)
    if result.returncode != 0:
        print(f'Failed to enable {tool}: {result.stderr}', file=sys.stderr)
        sys.exit(1)

print('All MCP tools enabled.')
