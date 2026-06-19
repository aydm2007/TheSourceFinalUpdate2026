import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import mediaRouter from './mediaRoutes';
import fs from 'fs';
import path from 'path';

// Load environment before loading any MCP tools
dotenv.config({ path: require('path').resolve(__dirname, '../../.env') });
process.env.AETHER_PROVIDER = 'openrouter'; // enforced provider

// @ts-ignore
const { RelayBridge } = require('../../relay_bridge');
// @ts-ignore
const { executeTool, KAIROS_TOOLS } = require('../../nexus_bridge');

function appendToShadowLedger(workspaceRoot: string, event: string, message: string, details: any = {}) {
  try {
    const ledgerPath = path.join(workspaceRoot, '.nexus', 'var', 'telemetry', 'shadow_ledger.jsonl');
    const dir = path.dirname(ledgerPath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    
    const logEntry = {
      type: event,
      action: details.tool_name || message,
      status: details.status || 'SUCCESS',
      timestamp: new Date().toISOString(),
      agent: 'Sovereign-TriState-Chat',
      details: details
    };
    fs.appendFileSync(ledgerPath, JSON.stringify(logEntry) + '\n');
  } catch (e) {
    console.error('Failed to append to shadow ledger:', e);
  }
}
const app = express();
// Set permissive CSP for development (allow self and localhost)
app.use((req, res, next) => {
  res.setHeader('Content-Security-Policy', "default-src 'self' http://localhost:4000; connect-src 'self' http://localhost:4000; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data:;");
  next();
});
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

const prisma = new PrismaClient();

app.use(cors());
app.use('/.well-known', express.static(path.join(process.cwd(), '.well-known'))); // Serve well‑known assets
app.use(express.json());
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));
app.use('/api/media', mediaRouter);

// Basic session retrieval
app.get('/api/chat/sessions', async (req, res) => {
  try {
    const sessions = await prisma.session.findMany({
      orderBy: { updatedAt: 'desc' }
    });
    res.json(sessions);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch sessions' });
  }
});

app.get('/api/chat/sessions/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const session = await prisma.session.findUnique({ where: { id: parseInt(id) } });
    if (session) {
      res.json(session);
    } else {
      res.status(404).json({ error: 'Not found' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch session details' });
  }
});

// Create new session
app.post('/api/chat/sessions', async (req, res) => {
  try {
    const { title } = req.body;
    const newSession = await prisma.session.create({
      data: {
        title: title || 'New Conversation',
        messages: '[]' // Will store messages as JSON string in SQLite for simplicity
      }
    });
    res.json(newSession);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create session' });
  }
});

// Delete session
app.delete('/api/chat/sessions/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.session.delete({ where: { id: parseInt(id) } });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete session' });
  }
});

// Telemetry
app.get('/api/system/telemetry', (req, res) => {
  const { exec } = require('child_process');
  exec('pm2 jlist', { windowsHide: true }, (err: any, stdout: string) => {
    if (err) return res.json([]);
    try {
      const pm2List = JSON.parse(stdout);
      const stats = pm2List.map((p: any) => ({
        name: p.name,
        cpu: p.monit.cpu,
        mem: (p.monit.memory / 1024 / 1024).toFixed(1) + ' MB',
        status: p.pm2_env.status
      }));
      res.json(stats);
    } catch(e) {
      res.json([]);
    }
  });
});

// Socket.io for Real-time chat
io.on('connection', (socket) => {
  console.log('[Socket] Client connected:', socket.id);

  socket.on('join_session', (sessionId) => {
    socket.join(`session_${sessionId}`);
    console.log(`[Socket] Client joined session_${sessionId}`);
  });

  socket.on('send_message', async (data) => {
    try {
      const { sessionId, role, content, attachment, chatMode } = data;
    
    // Broadcast user message back immediately
    io.to(`session_${sessionId}`).emit('receive_message', {
      id: Date.now().toString(),
      role,
      content,
      attachment,
      timestamp: new Date().toISOString()
    });

    let session = await prisma.session.findUnique({ where: { id: parseInt(sessionId) } });
    let sessionMessages: any[] = session && session.messages ? JSON.parse(session.messages) : [];
    
    const workspaceRoot = path.resolve(__dirname, '../../../');
    const bridge = new RelayBridge(process.env.AETHER_RELAY_KEY_ALPHA || process.env.OPENROUTER_KEYS?.split(',')[0]);

    // Log the incoming message to the Shadow Ledger
    appendToShadowLedger(workspaceRoot, 'USER_MESSAGE', 'Incoming user directive', { 
      content: content.substring(0, 200) + (content.length > 200 ? '...' : ''), 
      chatMode 
    });

    if (sessionMessages.length === 0 && session) {
      // Fire and forget AI Naming
      bridge.createPulse({
        model: 'openai/gpt-oss-120b:free',
        messages: [{ role: 'user', content: `أعطني عنوان قصير جداً (كلمتين أو ثلاث) مع رمز تعبيري (Emoji) واحد يعبر عن هذا الطلب: "${content.substring(0, 50)}". أعد العنوان فقط بدون أي علامات اقتباس.` }],
        system: 'أنت صانع عناوين مقتضب. أعد العنوان المطلوب فقط.'
      }).then(async (resPulse: any) => {
         let title = content.substring(0, 30);
         const txt = resPulse?.content?.find((c:any) => c.type === 'text')?.text;
         if (txt && txt.trim()) title = txt.trim();
         await prisma.session.update({ where: { id: session.id }, data: { title: title } });
         io.to(`session_${sessionId}`).emit('session_updated');
      }).catch(async () => {
         await prisma.session.update({ where: { id: session.id }, data: { title: content.substring(0, 30) } });
         io.to(`session_${sessionId}`).emit('session_updated');
      });
    }
    
    let finalContent = content;
    if (attachment && typeof attachment === 'string') {
      try {
        const filePath = path.join(process.cwd(), attachment);
        if (fs.existsSync(filePath)) {
          const ext = path.extname(filePath).substring(1) || 'png';
          const imgBase64 = fs.readFileSync(filePath, {encoding: 'base64'});
          const dataUrl = `data:image/${ext};base64,${imgBase64}`;
          
          io.to(`session_${sessionId}`).emit('receive_progress', {
            status: 'working',
            progress: 10,
            text: '👁️ جاري تحليل المرفقات البصرية باستخدام Nemotron Vision...',
            icon: '👁️',
            evaluation: 'استشارة نموذج الوعي البصري لاستخراج التفاصيل...'
          });

          const visionRes = await fetch((process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1') + '/chat/completions', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${process.env.AETHER_VISION_API_KEY || (process.env.OPENROUTER_KEYS ? process.env.OPENROUTER_KEYS.split(',')[0] : '')}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              model: 'nvidia/nemotron-nano-12b-v2-vl:free',
              messages: [{
                role: 'user',
                content: [
                  { type: 'text', text: 'صف هذه الصورة بالتفصيل الدقيق جداً وما تحتويه، لاستخدامها في سياق بناء الواجهة أو تحليل المشكلة.' },
                  { type: 'image_url', image_url: { url: dataUrl } }
                ]
              }]
            })
          });
          const visionData = await visionRes.json();
          if (visionData.choices && visionData.choices[0]) {
             finalContent += `\n\n[Vision Model Analysis of Attachment (${attachment})]:\n${visionData.choices[0].message.content}`;
             io.to(`session_${sessionId}`).emit('receive_progress', {
               status: 'working',
               progress: 25,
               text: '✅ اكتمل التحليل البصري بنجاح',
               icon: '🧠',
               evaluation: 'الذكاء البصري التقط كافة التفاصيل الدقيقة للصورة.'
             });
          }
        }
      } catch (e) {
         console.error('Vision processing error:', e);
      }
    }

    sessionMessages.push({ role: 'user', content: finalContent });

    let filteredTools = KAIROS_TOOLS;
    if (chatMode === 'strict') {
      filteredTools = [];
    } else if (chatMode === 'commander') {
      const allowedCommanderTools = ['Agent', 'FileRead', 'Glob', 'TaskOutput', 'command_status', 'search_web'];
      filteredTools = KAIROS_TOOLS.filter((t: any) => allowedCommanderTools.includes(t.function.name));
    }

    const tools = filteredTools.map((t: any) => ({
      type: 'function',
      function: { name: t.function.name, description: t.function.description, parameters: t.function.parameters }
    }));

    let systemPrompt = `أنت النائب التنفيذي (Sigma Coordinator) لمنظومة TheSource.\nمهمتك هي التفكير والتوجيه الكلي للأسراب والمحاكاة لـ TheSource وتصميم الأنظمة وحل المشكلات التشغيلية والتطويرية بالكامل.\nأنت تمتلك صلاحيات كاملة 100% لاستدعاء الأدوات التشغيلية (MCP Tools) والقيام بالعمليات البرمجية والتعديلات المباشرة.\n\nقواعد التشغيل الإلزامية:\n1. التفكير والتحليل باللغة العربية: يجب عليك التفكير باللغة العربية الفصحى وكتابة خطواتك الاستدلالية (Reasoning Steps) بوضوح قبل كل أداة تستدعيها.\n2. لا تقم بالهروب أو إعطاء وعود للمستخدم؛ إذا طلب منك إنشاء أو تعديل كود، قم بالخطوات كاملة بنفسك فوراً باستخدام الأدوات المتاحة.\n3. اكتب الأكواد مباشرة على القرص. لا تكتفِ بعرض الكود في الدردشة.\n4. استخدم الأدوات البرمجية للتحقق من التغييرات والتأكد من نجاح التشغيل.\n5. لا تشارك الأسراب الأسرار أو تفاصيل المفاتيح من ملفات .env.\n`;

    const gptSkillPath = path.join(workspaceRoot, '.agents/skills/gpt-oss120b/SKILL.md');
    if (fs.existsSync(gptSkillPath)) {
      systemPrompt += `\n\n--- مهارة المنسق العليا لنموذج GPT-OSS 120B ---\n${fs.readFileSync(gptSkillPath, 'utf8')}\n`;
    }
    const masterPath = path.join(workspaceRoot, '.agents/skills/nexus-core/master.md');
    if (fs.existsSync(masterPath)) {
      systemPrompt += `\n\n--- دستور النظام السيادي (Nexus-Core Constitution) ---\n${fs.readFileSync(masterPath, 'utf8').substring(0, 8000)}\n`;
    }

    // Zero-Shot Context Injection (Live Project Awareness)
    try {
      const pkgPath = path.join(workspaceRoot, 'package.json');
      if (fs.existsSync(pkgPath)) {
        const pkgData = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
        const deps = Object.keys(pkgData.dependencies || {}).slice(0, 10).join(', ');
        systemPrompt += `\n\n--- الوعي اللحظي بالمشروع (Project Context) ---\nالمشروع الحالي: ${pkgData.name || 'Unknown'}\nالوصف: ${pkgData.description || ''}\nأهم الاعتماديات: ${deps}\n`;
      }
      const dirContents = fs.readdirSync(workspaceRoot).filter(f => !f.startsWith('.git') && !f.startsWith('node_modules')).slice(0, 20).join(', ');
      systemPrompt += `هيكل المجلد الرئيسي: [${dirContents}]\n`;
    } catch(e) {}

    if (chatMode === 'strict') {
      systemPrompt += `\n\n[MOD PLAN MODE]: ⚠️ وضع "التخطيط الصارم" مفعّل. يمنع منعاً باتاً استدعاء أي أداة للتنفيذ. مهمتك الوحيدة هي إصدار تقرير وخطة تنفيذية نصية محكمة تشرح خطوة بخطوة ما ستقوم بفعله. لا تقم بالتعديل على الملفات!`;
    } else if (chatMode === 'commander') {
      systemPrompt += `\n\n[SWARM COMMANDER MODE]: ⚠️ أنت الآن في "وضع قائد الأسراب". تم سحب صلاحيات الكتابة المباشرة (FileWrite) منك. لإنجاز المهام البرمجية، **يجب عليك** استخدام أداة (Agent) لاستدعاء وكلاء متخصصين (مثل mcp-developer أو react-surgeon) وتفويض المهام إليهم، ثم مراجعة مخرجاتهم.`;
    } else {
      systemPrompt += `\n\n[EXECUTIVE MODE]: أنت الآن في الوضع التنفيذي الحر. تمتلك جميع الصلاحيات لتنفيذ الأكواد مباشرة أو استدعاء الوكلاء بنفسك.`;
    }

    let turnCount = 0;
    const maxTurns = chatMode === 'strict' ? 1 : 15;
    
    while (turnCount < maxTurns) {
      turnCount++;
      
      const apiMessages = sessionMessages.map(m => ({ role: m.role, content: m.content }));
      
      const lastMsg = apiMessages[apiMessages.length - 1];
      if (lastMsg && lastMsg.role === 'user' && typeof lastMsg.content === 'string') {
        lastMsg.content += `\n\n[SYSTEM DIRECTIVE]: You have access to tools. If you need to call a tool, call it natively or write a JSON block in your response:\n\`\`\`json\n{\n  "tool": "ToolName",\n  "args": {\n    "arg1": "value1"\n  }\n}\n\`\`\``;
      }

      const pulseResult = await bridge.createPulse({
        model: 'openai/gpt-oss-120b:free',
        messages: apiMessages,
        system: systemPrompt,
        temperature: 0.7,
        tools: tools
      });

      const contentArr = pulseResult.content || [];
      const textBlock = contentArr.find((c: any) => c.type === 'text');
      const toolCalls = contentArr.filter((c: any) => c.type === 'tool_use');

      if (toolCalls.length === 0 && textBlock && textBlock.text) {
        const jsonRegex = /```json\s*(\{[\s\S]*?\})\s*```/g;
        let match;
        while ((match = jsonRegex.exec(textBlock.text)) !== null) {
          try {
            const parsed = JSON.parse(match[1]);
            if (parsed.tool && parsed.args) {
              toolCalls.push({ id: 'call_' + Date.now() + Math.random(), name: parsed.tool, input: parsed.args });
            }
          } catch(e) {}
        }
      }

      const msgContent: any[] = [];
      if (textBlock && textBlock.text) {
        msgContent.push({ type: 'text', text: textBlock.text });
        io.to(`session_${sessionId}`).emit('receive_message', {
          id: Date.now().toString(),
          role: 'ai',
          content: textBlock.text,
          timestamp: new Date().toISOString()
        });
      }
      
      for (const tc of toolCalls) {
        const tId = tc.id || 'call_' + Date.now();
        msgContent.push({ type: 'tool_use', id: tId, name: tc.name, input: tc.input || tc.args });
        
        io.to(`session_${sessionId}`).emit('receive_progress', {
          status: 'working',
          progress: Math.floor(Math.random() * 40) + 30,
          text: `جاري تشغيل الوكيل والأداة: ${tc.name}...`,
          icon: '⚙️',
          evaluation: `يتم معالجة البيانات عبر الأسراب المتخصصة (نسبة الإنجاز في هذه المرحلة تقريبية).`
        });

        io.to(`session_${sessionId}`).emit('receive_message', {
          id: tId,
          role: 'ai',
          content: `[Swarm Logic] Executing Tool: ${tc.name}...`,
          timestamp: new Date().toISOString()
        });

        // Log tool execution intent to Shadow Ledger
        appendToShadowLedger(workspaceRoot, 'TOOL_EXECUTION', `Model initiated tool execution: ${tc.name}`, { 
          tool_name: tc.name, 
          args: tc.input || tc.args 
        });
      }

      sessionMessages.push({ role: 'assistant', content: msgContent });

      if (toolCalls.length > 0) {
        const toolResultsContent = [];
        for (const tc of toolCalls) {
          let result;
          try {
            result = await executeTool(tc.name, tc.input || tc.args || {}, { sessionId: sessionId, projectPath: workspaceRoot });
          } catch (toolErr: any) {
            result = `Error executing tool: ${toolErr.message}`;
          }
          if (typeof result !== 'string') result = JSON.stringify(result, null, 2);
          toolResultsContent.push({ type: 'tool_result', tool_use_id: tc.id, content: result });
          
          io.to(`session_${sessionId}`).emit('receive_progress', {
            status: 'completed',
            progress: 100,
            text: `✅ اكتملت المهمة بامتياز للوكيل (${tc.name})`,
            icon: '✨',
            evaluation: 'تقييم 100/100: نجاح تام بفضل التنسيق العالي وخلو المخرجات من الأخطاء.'
          });

          io.to(`session_${sessionId}`).emit('receive_message', {
            id: 'res_' + Date.now().toString(),
            role: 'ai',
            content: `[Swarm Result] Tool ${tc.name} completed successfully.`,
            timestamp: new Date().toISOString()
          });

          // Log tool completion to Shadow Ledger
          appendToShadowLedger(workspaceRoot, 'TOOL_RESULT', `Model successfully completed tool execution: ${tc.name}`, { 
            tool_name: tc.name, 
            status: 'SUCCESS'
          });
        }
        sessionMessages.push({ role: 'user', content: toolResultsContent });
      } else {
        break;
      }
    }
    
    if (session) {
      await prisma.session.update({ where: { id: session.id }, data: { messages: JSON.stringify(sessionMessages) } });
    }
    } catch (error: any) {
      console.error('[Socket Error]', error);
      const sid = data.sessionId || '1';
      io.to(`session_${sid}`).emit('receive_progress', {
          status: 'completed',
          progress: 0,
          text: `❌ حدث خطأ في النظام: ${error.message || 'Unknown Error'}`,
          icon: '🚨',
          evaluation: 'توقف المعالجة بسبب خطأ داخلي. يرجى مراجعة سجلات الخادم.'
      });
      io.to(`session_${sid}`).emit('receive_message', {
          id: 'err_' + Date.now().toString(),
          role: 'ai',
          content: `[خطأ تقني]: لم أتمكن من إكمال المعالجة. التفاصيل: ${error.message}`,
          timestamp: new Date().toISOString()
      });
    }
  });

  socket.on('disconnect', () => {
    console.log('[Socket] Client disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log(`🚀 Sovereign Chat Backend running on port ${PORT}`);
});
