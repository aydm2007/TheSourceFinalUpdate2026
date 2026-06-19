#!/usr/bin/env bash
# Performance monitor for bridge commands
# Logs execution time of Bash/PowerShell commands executed via MCP bridge

LOG_FILE="$(dirname "$0")/performance.log"

monitor() {
  local cmd="$*"
  local start=$(date +%s%3N)
  eval "$cmd"
  local status=$?
  local end=$(date +%s%3N)
  local duration=$((end - start))
  echo "$(date '+%Y-%m-%d %H:%M:%S') | $cmd | exit:$status | ${duration}ms" >> "$LOG_FILE"
  return $status
}

# Example usage (uncomment to test):
# monitor "ls -la"

export -f monitor
