# دليل التوافق الشامل لـ MCP SERVER TOOLS
## TheSource V100.0 — يعمل مع كل IDE وكل نموذج
**آخر تحديث:** 2026-06-12

---

## 🔌 كيف يتصل أي IDE بـ MCP SERVER TOOLS

### قناة 1: HTTP/SSE (الأفضل — يعمل مع الجميع)
```
URL:     http://localhost:3847/mcp
Auth:    Bearer sovereign_nexus_key_2026
Protocol: Streamable HTTP (MCP 2024-11-05)
```

### قناة 2: stdio (VSCode + Antigravity + Claude Desktop)
```
Command: node C:\tools\workspace\TheSource\mcp_bridge_server.js
Env:     AETHER_DEFAULT_SKILL=mcp-developer
```

---

## ⚙️ إعداد كل IDE

### Antigravity IDE
ملف `.mcp.json` في جذر المشروع → **مُعدَّل وجاهز** ✅

### VSCode (Copilot / Cline / Continue)
انسخ محتوى `.mcp.json` إلى:
- **إعداد المشروع:** `.mcp.json` في جذر المشروع (يعمل مع VSCode 1.99+)
- **إعداد عالمي:** `%APPDATA%\Code\User\mcp.json`

### Cursor IDE
أضف في `~/.cursor/mcp.json`:
```json
{
  "mcpServers": {
    "thesource": {
      "url": "http://localhost:3847/mcp",
      "headers": { "Authorization": "Bearer sovereign_nexus_key_2026" }
    }
  }
}
```

### Claude Desktop
أضف في `%APPDATA%\Claude\claude_desktop_config.json`:
```json
{
  "mcpServers": {
    "thesource": {
      "command": "node",
      "args": ["C:\\tools\\workspace\\TheSource\\mcp_bridge_server.js"],
      "env": { "AETHER_DEFAULT_SKILL": "mcp-developer" }
    }
  }
}
```

### نماذج خارجية (OpenRouter / SiliconFlow / أي API)
```
URL:    http://localhost:3847/v1/chat/completions
Auth:   Bearer sovereign_nexus_key_2026
Model:  openai/gpt-oss-120b:free (عبر OpenRouter)
```
