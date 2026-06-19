#!/usr/bin/env bash
# Updated to call Python script for enabling all MCP tools
# Enable all MCP tools defined in config/mcp/tools.json
set -e
# Parse tools.json with bash utilities and enable each tool
TOOLS_FILE="$(dirname "$0")/../config/mcp/tools.json"
if [[ ! -f "$TOOLS_FILE" ]]; then
  echo "tools.json not found" >&2
  exit 1
fi
# Extract tool names (assumes "name": "tool" pattern)
mapfile -t TOOL_NAMES < <(grep -o '"name" *: *"[^"]*"' "$TOOLS_FILE" | cut -d '"' -f4)
for tool in "${TOOL_NAMES[@]}"; do
  echo "Enabling $tool..."
  mcp enable "$tool"
  if [[ $? -ne 0 ]]; then
    echo "Failed to enable $tool" >&2
    exit 1
  fi
done

echo "All MCP tools enabled."

if [[ ! -f config/mcp/tools.json ]]; then
  echo "tools.json not found" >&2
  exit 1
fi
for tool in $(jq -r '.tools[].name' config/mcp/tools.json); do
  echo "Enabling $tool..."
  mcp enable "$tool"
done

echo "All MCP tools enabled."
