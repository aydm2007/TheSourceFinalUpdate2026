#!/usr/bin/env bash
# Placeholder script: rebuild vector_index.json from all .md files
# In production this would invoke the TS‑Native VectorAdapter

ROOT=".agents/memory"
INDEX_FILE="${ROOT}/vector_index.json"

# Gather all .md files
FILES=$(find "${ROOT}" -type f -name "*.md")
# Simple JSON array of file paths (placeholder)
echo "[" > "${INDEX_FILE}"
first=1
for f in $FILES; do
  if [ $first -eq 0 ]; then echo "," >> "${INDEX_FILE}"; fi
  echo "\"${f}\"" >> "${INDEX_FILE}"
  first=0
done
echo "]" >> "${INDEX_FILE}"
echo "Vector index rebuilt with $(echo "$FILES" | wc -l) files."
