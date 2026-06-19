# Bridge Executor PowerShell script
param(
    [Parameter(Mandatory=$true)][string]$payloadPath
)

# Load payload JSON
$payload = Get-Content $payloadPath -Raw | ConvertFrom-Json

# Load bridge definition
$bridgePath = "C:\tools\workspace\TheSource\.agents\memory\telepathy\bridge.json"
$bridge = Get-Content $bridgePath -Raw | ConvertFrom-Json

# Verify tool is allowed
if (-not ($bridge.allowed_tools -contains $payload.tool)) {
    Write-Error "Tool '$($payload.tool)' is not allowed by bridge.json"
    exit 1
}

# Dispatch based on tool name
switch ($payload.tool) {
    "FileRead" {
        $result = python - <<PY
import json, sys
from tools import FileRead
print(json.dumps(FileRead(**$payload.args)))
PY
    }
    "FileReadLines" {
        $result = python - <<PY
import json, sys
from tools import FileReadLines
print(json.dumps(FileReadLines(**$payload.args)))
PY
    }
    "FileWrite" {
        $result = python - <<PY
import json, sys
from tools import FileWrite
print(json.dumps(FileWrite(**$payload.args)))
PY
    }
    "FileEdit" {
        $result = python - <<PY
import json, sys
from tools import FileEdit
print(json.dumps(FileEdit(**$payload.args)))
PY
    }
    "SurgicalDiff" {
        $result = python - <<PY
import json, sys
from tools import SurgicalDiff
print(json.dumps(SurgicalDiff(**$payload.args)))
PY
    }
    "Bash" {
        $result = & $payload.args.command
    }
    "Grep" {
        $result = python - <<PY
import json, sys
from tools import Grep
print(json.dumps(Grep(**$payload.args)))
PY
    }
    "Glob" {
        $result = python - <<PY
import json, sys
from tools import Glob
print(json.dumps(Glob(**$payload.args)))
PY
    }
    "TodoWrite" {
        $result = python - <<PY
import json, sys
from tools import TodoWrite
print(json.dumps(TodoWrite(**$payload.args)))
PY
    }
    "VisualAuditReport" {
        $result = python - <<PY
import json, sys
from tools import VisualAuditReport
print(json.dumps(VisualAuditReport(**$payload.args)))
PY
    }
    "ZodSchema" {
        $result = python - <<PY
import json, sys
from tools import ZodSchema
print(json.dumps(ZodSchema(**$payload.args)))
PY
    }
    "SemanticReference" {
        $result = python - <<PY
import json, sys
from tools import SemanticReference
print(json.dumps(SemanticReference(**$payload.args)))
PY
    }
    "EnterWorktree" {
        $result = python - <<PY
import json, sys
from tools import EnterWorktree
print(json.dumps(EnterWorktree(**$payload.args)))
PY
    }
    "FeatureFlag" {
        $result = python - <<PY
import json, sys
from tools import FeatureFlag
print(json.dumps(FeatureFlag(**$payload.args)))
PY
    }
    "TaskCreate" {
        $result = python - <<PY
import json, sys
from tools import TaskCreate
print(json.dumps(TaskCreate(**$payload.args)))
PY
    }
    "ServerMode" {
        $result = python - <<PY
import json, sys
from tools import ServerMode
print(json.dumps(ServerMode(**$payload.args)))
PY
    }
    default {
        Write-Error "Unsupported tool: $($payload.tool)"
        exit 1
    }
}

# -----------------------
# سجل التنفيذ في shadow_ledger.jsonl
# -----------------------
if ($null -ne $result) {
    $logEntry = @{
        timestamp = (Get-Date -Format "o")
        tool      = $payload.tool
        args      = $payload.args
        output    = $result
    } | ConvertTo-Json -Compress
    Add-Content -Path "C:\tools\workspace\TheSource\.agents\memory\shadow_ledger.jsonl" -Value $logEntry
}

# Output result as JSON (stdout)
if ($null -ne $result) {
    $result | ConvertTo-Json -Compress
}
