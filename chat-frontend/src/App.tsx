import React, { useEffect, useState, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { Send, Paperclip, MessageSquare, Shield, ShieldCheck, Activity, Trash2, Plus, Zap, Users } from 'lucide-react';
import { MCTSNodeView } from './components/MCTSNodeView';
import { WorkTreeDashboard } from './components/WorkTreeDashboard';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

interface Message {
  id: string;
  role: 'user' | 'ai';
  content: string | any[];
  attachment?: string;
  timestamp: string;
}

interface ProgressEvent {
  status: 'working' | 'completed';
  progress: number;
  text: string;
  icon: string;
  evaluation?: string;
}

const SOCKET_URL = window.location.protocol + '//' + window.location.hostname + ':4000';

function App() {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [chatMode, setChatMode] = useState<'strict'|'commander'|'executive'>('strict');
  const [sessionId, setSessionId] = useState('1');
  const [progress, setProgress] = useState<ProgressEvent | null>(null);
  const [attachment, setAttachment] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [telemetry, setTelemetry] = useState<any[]>([]);
  const [previewContent, setPreviewContent] = useState<string | null>(null);
  
  // Sovereign States
  const [mctsNodes, setMctsNodes] = useState<any[]>([]);
  const [sandboxes, setSandboxes] = useState<any[]>([]);
  const [vramUsage, setVramUsage] = useState(15);
  const [isShieldActive, setIsShieldActive] = useState(true); // Default true based on policy

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [sessionsList, setSessionsList] = useState<any[]>([]);

  const fetchSessions = async () => {
    try {
      const res = await fetch(SOCKET_URL + '/api/chat/sessions');
      const data = await res.json();
      if (Array.isArray(data)) setSessionsList(data);
    } catch(e) {}
  };

  const loadSession = async (id: string) => {
    setSessionId(id);
    try {
      const res = await fetch(SOCKET_URL + '/api/chat/sessions/' + id);
      const data = await res.json();
      const parsed = data.messages ? JSON.parse(data.messages) : [];
      const mapped: Message[] = [];
      parsed.forEach((m: any) => {
         if (m.role === 'user' && typeof m.content === 'string') {
            mapped.push({ id: Math.random().toString(), role: 'user', content: m.content, timestamp: '' });
         } else if (m.role === 'assistant' && Array.isArray(m.content)) {
            m.content.forEach((c: any) => {
               if (c.type === 'text') {
                 mapped.push({ id: Math.random().toString(), role: 'ai', content: c.text, timestamp: '' });
               } else if (c.type === 'tool_use') {
                 mapped.push({ id: Math.random().toString(), role: 'ai', content: `[Swarm Logic] Executing Tool: ${c.name}...`, timestamp: '' });
               }
            });
         }
      });
      setMessages(mapped);
    } catch(e) {}
  };

  const createNewSession = async () => {
    try {
      const res = await fetch(SOCKET_URL + '/api/chat/sessions', { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({title: 'New Mission'}) });
      const data = await res.json();
      await fetchSessions();
      await loadSession(data.id.toString());
    } catch(e) {}
  };

  const deleteSession = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    try {
      await fetch(SOCKET_URL + '/api/chat/sessions/' + id, { method: 'DELETE' });
      await fetchSessions();
    } catch(e) {}
  };

  useEffect(() => {
    fetchSessions();
    const fetchTel = async () => {
      try {
        const res = await fetch(SOCKET_URL + '/api/system/telemetry');
        const data = await res.json();
        setTelemetry(data);
      } catch(e) {}
    };
    fetchTel();
    const telInterval = setInterval(fetchTel, 5000);
    return () => clearInterval(telInterval);
  }, []);

  useEffect(() => {
    const newSocket = io(SOCKET_URL);
    setSocket(newSocket);

    newSocket.on('connect', () => {
      console.log('Connected to Chat Backend');
      newSocket.emit('join_session', sessionId);
    });

    newSocket.on('session_updated', () => {
      fetchSessions();
    });

    newSocket.on('receive_message', (message: Message) => {
      setMessages((prev) => [...prev, message]);
      scrollToBottom();
    });

    newSocket.on('receive_progress', (evt: ProgressEvent) => {
      setProgress(evt);
      if (evt.status === 'completed') {
        setTimeout(() => setProgress(null), 8000); // Hide after 8s
      }
    });

    return () => {
      newSocket.close();
    };
  }, [sessionId]);

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const sendMessage = async () => {
    if ((!input.trim() && !attachment) || !socket) return;
    
    const trimmed = input.trim();
    if (trimmed === '/clear') {
       setMessages([]);
       setInput('');
       return;
    }
    if (trimmed === '/mcp') {
       setMessages(prev => [...prev, {id: Date.now().toString(), role: 'ai', content: '**المتوفر حالياً عبر MCP:**\n`FileRead`, `FileWrite`, `Bash`, `Glob`, `ServerMode`, `WebSearch`, `TaskOutput`, `Agent`', timestamp: new Date().toISOString()}]);
       setInput('');
       return;
    }
    if (trimmed === '/scan') {
       setMessages(prev => [...prev, {id: Date.now().toString(), role: 'user', content: '/scan', timestamp: new Date().toISOString()}]);
       setMessages(prev => [...prev, {id: (Date.now()+1).toString(), role: 'ai', content: '🛡️ تم استدعاء بروتوكول الفحص السريع... (هذه الوظيفة تتطلب ربط الأسراب الجنائية)', timestamp: new Date().toISOString()}]);
       setInput('');
       return;
    }
    
    let attachmentUrl = undefined;
    if (attachment) {
      setUploading(true);
      const formData = new FormData();
      formData.append('file', attachment);
      try {
        const res = await fetch(window.location.protocol + '//' + window.location.hostname + ':4000/api/media/upload', {
          method: 'POST',
          body: formData
        });
        const data = await res.json();
        attachmentUrl = data.url;
      } catch (err) {
        console.error('Upload failed', err);
      }
      setUploading(false);
      setAttachment(null);
    }

    socket.emit('send_message', {
      sessionId,
      role: 'user',
      content: input.trim(),
      attachment: attachmentUrl,
      chatMode
    });
    setInput('');
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const rawVal = e.target.value;
    // Scrubbing Shield: Local Regex Redaction
    const scrubbedVal = rawVal.replace(/(sk-[a-zA-Z0-9]{20,}|eyJ[a-zA-Z0-9]{10,}\.[a-zA-Z0-9]{10,}\.[a-zA-Z0-9_-]{10,})/g, '[REDACTED_SECRET]');
    
    if (rawVal !== scrubbedVal) {
      // Secret detected and scrubbed
      setIsShieldActive(true);
    }
    
    setInput(scrubbedVal);
    
    // Simulate VRAM context filling
    if (rawVal.length > 0 && rawVal.length % 15 === 0) {
      setVramUsage(prev => {
        const next = prev + 1;
        if (next >= 75) {
          // Trigger autoCompact logic
          setTimeout(() => setVramUsage(15), 1500); // Visual flush
        }
        return next;
      });
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setAttachment(e.target.files[0]);
    }
  };

  const mockEmergencyRollback = (taskId: string) => {
    setSandboxes(prev => prev.filter(s => s.taskId !== taskId));
    setMessages(prev => [...prev, {
      id: Date.now().toString(),
      role: 'ai',
      content: `🚨 تم تفعيل بروتوكول الهدم الفوري لشجرة العمل [${taskId}] وتم مسحها بالكامل.`,
      timestamp: new Date().toISOString()
    }]);
  };

  const cycleMode = () => {
    if (chatMode === 'strict') setChatMode('commander');
    else if (chatMode === 'commander') setChatMode('executive');
    else setChatMode('strict');
  };

  return (
    <div className="flex h-screen bg-slate-900 text-slate-200 font-sans">
      {/* Sidebar */}
      <div className="w-56 bg-slate-800 border-r border-slate-700 flex flex-col p-3 shadow-xl z-10">
        <h1 className="text-lg font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400 mb-6 flex items-center justify-between gap-2">
          <span>✨ Sovereign</span>
          <button onClick={createNewSession} className="p-1.5 bg-blue-600/20 text-blue-400 hover:bg-blue-600 hover:text-white rounded-lg transition" title="New Session">
            <Plus className="w-4 h-4" />
          </button>
        </h1>
        <div className="flex-1 overflow-y-auto space-y-1 pr-1">
          {sessionsList.map(s => (
            <div 
              key={s.id} 
              onClick={() => loadSession(s.id.toString())}
              className={`group flex items-center justify-between p-3 rounded-lg cursor-pointer text-sm transition-colors ${sessionId === s.id.toString() ? 'bg-blue-600 text-white' : 'bg-slate-700/50 text-slate-300 hover:bg-slate-700'}`}
            >
              <div className="truncate flex-1 font-medium">{s.title || `Session ${s.id}`}</div>
              <button 
                onClick={(e) => deleteSession(e, s.id.toString())}
                className={`p-1.5 rounded-md opacity-0 group-hover:opacity-100 transition-all ${sessionId === s.id.toString() ? 'hover:bg-blue-500 text-blue-200 hover:text-white' : 'hover:bg-slate-600 text-slate-400 hover:text-red-400'}`}
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col relative bg-slate-900 overflow-hidden">
        
        <div className="bg-slate-800 p-4 border-b border-slate-700 flex justify-between items-center z-10 shadow-md">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-emerald-500 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-lg">
              S
            </div>
            <div>
              <h2 className="font-bold text-slate-100 flex items-center gap-2">
                Sovereign Central
                <span className="text-[10px] bg-slate-700 text-slate-300 px-2 py-0.5 rounded-full border border-slate-600">v1.2 Apex</span>
              </h2>
              <p className="text-xs text-emerald-400 font-mono">Agentic Development Nexus Active</p>
            </div>
          </div>
          <button 
            onClick={cycleMode} 
            className={`p-2 rounded-lg flex items-center gap-2 transition-all shadow-md font-semibold text-xs ${
              chatMode === 'strict' ? 'bg-red-500/20 text-red-400 border border-red-500/50' : 
              chatMode === 'commander' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/50' :
              'bg-emerald-500/20 text-emerald-400 border border-emerald-500/50'
            }`}
            title="Toggle Operation Mode"
          >
            {chatMode === 'strict' && <><Shield className="w-5 h-5" /> STRICT MODE</>}
            {chatMode === 'commander' && <><Users className="w-5 h-5" /> SWARM COMMANDER</>}
            {chatMode === 'executive' && <><ShieldCheck className="w-5 h-5" /> EXECUTIVE MODE</>}
          </button>
        </div>

        {/* WorkTree Sandbox Dashboard */}
        <WorkTreeDashboard sandboxes={sandboxes} onRollback={mockEmergencyRollback} />
        
        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {messages.length === 0 && (
            <div className="h-full flex items-center justify-center text-slate-500">
              No messages yet. Send a message to start!
            </div>
          )}
          {messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] p-3 text-sm rounded-2xl shadow-sm ${
                msg.role === 'user' 
                  ? 'bg-gradient-to-br from-blue-600 to-blue-500 text-white rounded-br-none border border-blue-400/30' 
                  : 'bg-slate-800 text-slate-200 rounded-bl-none border border-slate-700 shadow-[0_4px_20px_rgba(0,0,0,0.2)]'
              }`}>
                {msg.attachment && (
                  <img src={window.location.protocol + '//' + window.location.hostname + ':4000' + msg.attachment} alt="Attachment" className="max-w-xs rounded-lg mb-2" />
                )}
                {typeof msg.content === 'string' ? (
                  <div className="prose prose-invert max-w-none text-sm font-sans leading-relaxed">
                    <ReactMarkdown 
                      remarkPlugins={[remarkGfm]}
                      components={{
                        code({node, inline, className, children, ...props}: any) {
                          const match = /language-(\w+)/.exec(className || '')
                          const codeString = String(children).replace(/\n$/, '');
                          const isPreviewable = match && ['html', 'javascript', 'js', 'css'].includes(match[1]);
                          return !inline && match ? (
                            <div className="relative group my-3">
                              {isPreviewable && (
                                <button 
                                  onClick={() => setPreviewContent(codeString)} 
                                  className="absolute top-2 right-2 bg-blue-600/80 hover:bg-blue-500 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition z-10 shadow-lg"
                                >
                                  ▶ تشغيل (Preview)
                                </button>
                              )}
                              <SyntaxHighlighter
                                {...props}
                                children={codeString}
                                style={vscDarkPlus}
                                language={match[1]}
                                PreTag="div"
                                className="rounded-lg shadow-inner text-xs m-0"
                              />
                            </div>
                          ) : (
                            <code {...props} className={`${className} bg-slate-900/50 text-emerald-300 px-1.5 py-0.5 rounded text-[0.8em] font-mono border border-slate-700/50`}>
                              {children}
                            </code>
                          )
                        },
                        table: ({node, ...props}: any) => <div className="overflow-x-auto my-4"><table className="min-w-full divide-y divide-slate-700 border border-slate-700 rounded-lg overflow-hidden" {...props} /></div>,
                        th: ({node, ...props}: any) => <th className="bg-slate-800/80 px-4 py-2 text-right text-xs font-semibold text-slate-300 uppercase tracking-wider" {...props} />,
                        td: ({node, ...props}: any) => <td className="px-4 py-2 text-sm border-t border-slate-700/50" {...props} />,
                        a: ({node, ...props}: any) => <a className="text-blue-400 hover:text-blue-300 underline underline-offset-2" target="_blank" rel="noreferrer" {...props} />,
                        p: ({node, ...props}: any) => <p className="mb-3 last:mb-0" {...props} />,
                        ul: ({node, ...props}: any) => <ul className="list-disc list-inside mb-3 space-y-1" {...props} />,
                        ol: ({node, ...props}: any) => <ol className="list-decimal list-inside mb-3 space-y-1" {...props} />,
                        h1: ({node, ...props}: any) => <h1 className="text-xl font-bold text-white mb-4 mt-6 border-b border-slate-700 pb-2 flex items-center gap-2" {...props} />,
                        h2: ({node, ...props}: any) => <h2 className="text-lg font-bold text-slate-100 mb-3 mt-5 flex items-center gap-2" {...props} />,
                        h3: ({node, ...props}: any) => <h3 className="text-md font-semibold text-slate-200 mb-2 mt-4 flex items-center gap-2" {...props} />
                      }}
                    >
                      {msg.content}
                    </ReactMarkdown>
                  </div>
                ) : (
                  <pre className="text-xs overflow-x-auto whitespace-pre-wrap">{JSON.stringify(msg.content, null, 2)}</pre>
                )}
              </div>
            </div>
          ))}
          {mctsNodes.length > 0 && <MCTSNodeView nodes={mctsNodes} />}
          <div ref={messagesEndRef} />
        </div>

        {/* Progress Overlay */}
        {progress && (
          <div className="absolute top-20 right-4 z-50 p-3 rounded-2xl border border-slate-600 bg-slate-800/95 backdrop-blur-xl shadow-[0_10px_40px_rgba(0,0,0,0.5)] transition-all duration-500 w-72">
            <div className="flex items-center gap-3 mb-2">
              <div className="text-2xl animate-bounce">{progress.icon}</div>
              <div className="font-bold text-sm flex-1 text-slate-200">{progress.text}</div>
              <div className="text-blue-400 font-mono font-bold">{progress.progress}%</div>
            </div>
            <div className="w-full bg-slate-700 h-2 rounded-full overflow-hidden mb-3">
              <div 
                className={`h-full rounded-full transition-all duration-700 ${progress.status === 'completed' ? 'bg-green-500' : 'bg-blue-500'}`}
                style={{ width: `${progress.progress}%` }}
              />
            </div>
            {progress.evaluation && (
              <div className="text-xs text-slate-400 italic border-t border-slate-700 pt-2">
                " {progress.evaluation} "
              </div>
            )}
          </div>
        )}
        {/* System Telemetry & VRAM AutoCompact */}
        <div className="px-6 py-2 bg-slate-800/50 border-t border-slate-700/50 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
            <Activity className={`w-4 h-4 ${vramUsage >= 75 ? 'text-red-400 animate-pulse' : 'text-blue-400'}`} />
            <span>VRAM:</span>
            <div className="w-24 h-2 bg-slate-700 rounded-full overflow-hidden flex">
              <div 
                className={`h-full transition-all duration-300 ${vramUsage >= 75 ? 'bg-red-500' : 'bg-blue-500'}`} 
                style={{ width: `${vramUsage}%` }}
              />
            </div>
            <span>{vramUsage}%</span>
          </div>
          
          {telemetry.length > 0 && (
            <div className="flex items-center gap-4 text-xs font-mono text-slate-400">
              {telemetry.map(t => (
                <div key={t.name} className="flex items-center gap-1 bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
                  <div className={`w-2 h-2 rounded-full ${t.status === 'online' ? 'bg-green-500' : 'bg-red-500 animate-pulse'}`}></div>
                  <span className="font-bold text-slate-300 truncate max-w-[80px]" title={t.name}>{t.name}</span>
                  <span className="text-emerald-400">{t.cpu}% CPU</span>
                  <span className="text-purple-400">{t.mem}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Input Box */}
        <div className="p-4 bg-slate-800 border-t border-slate-700 flex flex-col gap-2">
          
          {attachment && (
            <div className="flex items-center justify-between px-2 mb-1">
              <div className="text-xs bg-slate-700 text-slate-300 px-3 py-1 rounded-full flex items-center gap-2">
                📎 {attachment.name}
                <button onClick={() => setAttachment(null)} className="text-red-400 hover:text-red-300">✕</button>
              </div>
            </div>
          )}

          {/* Smart Suggestions */}
          <div className="flex gap-2 px-2 pb-1 overflow-x-auto no-scrollbar">
            {['✨ بناء ميزة جديدة', '🛡️ فحص أمني شامل', '⚡ تحليل الأداء', '🐛 اكتشاف الأخطاء'].map(s => (
              <button 
                key={s} 
                onClick={() => setInput(s)}
                className="whitespace-nowrap px-3 py-1.5 bg-slate-800/80 border border-slate-700 text-slate-300 text-xs font-semibold rounded-full hover:bg-blue-600 hover:text-white hover:border-blue-500 transition-all shadow-sm flex items-center gap-1"
              >
                {s}
              </button>
            ))}
          </div>

          <div className="max-w-full flex items-end gap-2 bg-slate-900 p-2 rounded-xl border border-slate-600 focus-within:border-blue-500 transition-colors">
            <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileChange} />
            <button 
              className="p-2 text-slate-400 hover:text-blue-400 transition-colors"
              onClick={() => fileInputRef.current?.click()}
            >
              <Paperclip className="w-5 h-5" />
            </button>
            <textarea
              className="flex-1 bg-transparent border-none outline-none resize-none max-h-32 min-h-[44px] py-2 px-2 text-slate-200 placeholder-slate-500"
              placeholder="اكتب أمرك الهندسي هنا (سياق ملف CLAUDE.md نشط دائماً)..."
              value={input}
              onChange={handleInputChange}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage();
                }
              }}
            />
            <button 
              className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition-colors disabled:opacity-50"
              onClick={sendMessage}
              disabled={(!input.trim() && !attachment) || uploading}
            >
              {uploading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : <Send className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>
      {/* Artifacts Preview Pane */}
      {previewContent && (
        <div className="w-[450px] bg-slate-100 border-l border-slate-700 flex flex-col z-20 shadow-[-10px_0_30px_rgba(0,0,0,0.5)]">
           <div className="bg-slate-800 text-slate-300 p-3 flex justify-between items-center text-sm font-bold border-b border-slate-700">
             <span className="flex items-center gap-2">🖼️ Live Preview (Artifact)</span>
             <button onClick={() => setPreviewContent(null)} className="hover:text-red-400 bg-slate-700 hover:bg-slate-600 px-2 py-1 rounded transition">إغلاق</button>
           </div>
           <iframe 
             className="w-full flex-1 border-none bg-white" 
             srcDoc={previewContent} 
             sandbox="allow-scripts allow-same-origin allow-popups" 
           />
        </div>
      )}
    </div>
  );
}

export default App;
