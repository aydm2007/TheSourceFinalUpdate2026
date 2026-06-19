# Sovereign 100/100 Execution Checklist

## لـ GPT-OSS-120B (Planner) + MCP Tools (Execution)

### الهدف النهائي
الوصول إلى:
```
native-mcp:verify         PASS
sovereign:90-sweep        PASS
global:production-gate    PASS
live-ui:verify            PASS
streamable-http           PASS
vitest                    PASS

Final Score = 100/100
```

---

# المرحلة 0 — Boot & Governance Lock

## الهدف
إجبار النموذج على فهم المشروع قبل أي تعديل.

### Checklist
- قراءة `AGENTS.md`
- قراءة `master.md`
- قراءة `bridge.json`
- قراءة آخر تقارير readiness
- استخراج جميع البوابات الرسمية
- استخراج جميع أدوات MCP المتاحة

### MCP Tools
```
ListMcpResources
ReadMcpResource
ToolSearch
```

### Success
```
Governance Files Loaded = TRUE
Tool Inventory Generated = TRUE
```

### Failure
```
أي تعديل قبل قراءة AGENTS.md
```

---

# المرحلة 1 — Tool Discovery Audit

## الهدف
التأكد أن النموذج يرى الأدوات الفعلية.

### Checklist
- `ListMcpResources`
- `ToolSearch("developer")`
- `ToolSearch("security")`
- `ToolSearch("filesystem")`
- `ToolSearch("swarm")`
- `ToolSearch("shadow")`

### Success
```
MCP Tools Visible >= Expected
mcp-developer Visible
ShadowLedger Visible
```

### Failure
```
Tool Inventory Incomplete
```

---

# المرحلة 2 — Native MCP Certification

## الهدف
إغلاق فجوات MCP.

### Command
```
npm run native-mcp:verify
```

### Checklist
- Bootstrap PASS
- FileRead PASS
- FileWrite DENIED
- SecurityAudit DENIED
- Level5 Routing PASS
- Swarm DryRun PASS
- Authenticated MCP PASS

### Success
```
Native MCP Score = 100
```

### Failure
```
AETHER_MCP_API_KEY missing
MCP_API_KEY missing
Unauthorized access allowed
```

### Fix
```
export AETHER_MCP_API_KEY=<your_key>
```
ثم:
```
npm run native-mcp:verify
```

---

# المرحلة 3 — Production Gate

## الهدف
تشغيل جميع بوابات الإنتاج.

### Command
```
npm run global:production-gate
```

### Checklist
- Security PASS
- Secrets PASS
- MCP PASS
- Metrics PASS
- Streamable PASS
- Swarm PASS

### Success
```
Production Score >= 100
```

### Failure
```
streamableHttpProven=false
liveUiProof= 10
```
```
No DOM Evidence
No Accessibility Tree
No Screenshot
```

---

# المرحلة 6 — Streamable HTTP Proof

## الهدف
إثبات النقل الحديث.

### Checklist
- Start Streamable Transport
- Call Read-Only Tool
- Capture Response
- Save Transcript

### Evidence
```
streamable_http_proof.json
```

### Success
```
streamableHttpProven = true
```

### Failure
```
Connection Failed
No Tool Response
```

---

# المرحلة 7 — Shadow Ledger Evidence

## الهدف
تسجيل كل إثبات.

### Checklist
- DOM Hash Logged
- Screenshot Hash Logged
- Accessibility Hash Logged
- MCP Proof Logged
- Streamable Proof Logged
- Test Results Logged

### Example
```
{
  "proof": "live_ui_verified",
  "artifact": "ui.png",
  "hash": "sha256...",
  "timestamp": "..."
}
```

### Success
```
shadow_ledger.jsonl updated
```

---

# المرحلة 8 — Sovereign 90 Sweep

## Command
```
npm run sovereign:90-sweep
```

### Checklist
- Docs Audit PASS
- Native MCP PASS
- CLI Map PASS
- Vitest PASS
- UI Proof PASS

### Success
```
Score >= 100
```

### Failure
```
Any Pending Gap
```

---

# المرحلة 9 — Final Certification

## Commands
```
npm run native-mcp:verify
npm run sovereign:90-sweep
npm run global:production-gate
npm run live-ui:verify
```

### Success Criteria
All required gates PASS (Native MCP, Production Gate, Sovereign Sweep, Live UI, Streamable HTTP, Secrets, Audit, Vitest, Ledger Evidence).

---

# Decision Matrix

## إذا
```
All PASS
```
### النتيجة
```
CERTIFIED
100/100
```

## إذا
```
One Check Fails
```
### النتيجة
```
Return to corresponding phase
Patch
Verify
Re-run
```

---

# الحلقة التشغيلية الإلزامية لـ GPT-OSS-120B
```
READ GOVERNANCE
↓
DISCOVER MCP TOOLS
↓
VERIFY NATIVE MCP
↓
RUN PRODUCTION GATE
↓
RUN VITEST
↓
PROVE LIVE UI
↓
PROVE STREAMABLE HTTP
↓
LOG TO SHADOW LEDGER
↓
RE-RUN ALL GATES
↓
100/100 OR LOOP AGAIN
```

## قاعدة حوكمة نهائية
```
NEVER CLAIM SUCCESS
WITHOUT ARTIFACTS

NEVER PATCH
WITHOUT EVIDENCE

NEVER STOP
UNTIL ALL GATES PASS
```

---

*ضع هذا الملف في جذر المشروع (`EXECUTION_PROTOCOL.md`) واستخدمه كدليل تشغيل للـ Planner (GPT‑OSS‑120B) داخل VS Code أو عبر OpenRouter.*