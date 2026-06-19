#!/usr/bin/env bash
# ------------------------------------------------------------
# rollback_changes.sh
# Utility script to rollback a file to its last safe version
# recorded in shadow_ledger.jsonl using the MCP tool `UndoChanges`.
# ------------------------------------------------------------

set -euo pipefail

if [[ $# -lt 1 ]]; then
  echo "Usage: $0 <file_path>"
  exit 1
fi

FILE_PATH="$1"

# Call the MCP tool via the bridge (uses the native tool wrapper)
# The tool is invoked through the `mcp` command line if available.
# Fallback to direct tool call via JSON RPC is handled by the bridge.

# Using the MCP native tool `UndoChanges`
# The tool expects a JSON payload with the target file.

# Prepare JSON payload
PAYLOAD=$(cat <<EOF
{
  "file_path": "${FILE_PATH}"
}
EOF
)

# Execute the tool via the bridge's CLI helper (assumes `mcp` binary is in PATH)
# If the binary is not present, the bridge will route the request.

if command -v mcp >/dev/null 2>&1; then
  echo "[rollback] Invoking MCP UndoChanges for ${FILE_PATH}"
  echo "${PAYLOAD}" | mcp tool UndoChanges
else
  echo "[rollback] MCP CLI not found, invoking via bridge HTTP endpoint"
  curl -s -X POST -H "Content-Type: application/json" \
    -d "${PAYLOAD}" \
    http://localhost:3847/mcp/tools/UndoChanges
fi

echo "Rollback completed for ${FILE_PATH}"