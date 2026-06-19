const API_BASE = 'http://localhost:3851/api';
let currentSessionId = localStorage.getItem('sovereign_chat_session_id') || null;

const messagesContainer = document.getElementById('chat-messages');
const chatInput = document.getElementById('chat-input');
const sendBtn = document.getElementById('chat-send');
const closeBtn = document.getElementById('chat-close');
const tacticalToggle = document.getElementById('tactical-mode-toggle');
const modeLabel = document.getElementById('mode-label');

// Auto-adjust layout RTL direction
document.documentElement.dir = 'rtl';
document.documentElement.lang = 'ar';

async function initializeChat() {
    if (!currentSessionId) {
        await createNewSession();
    } else {
        await loadSessionMessages();
    }
}

async function createNewSession() {
    try {
        const response = await fetch(`${API_BASE}/chat/sessions/new`, { method: 'POST' });
        const data = await response.json();
        if (data.id) {
            currentSessionId = data.id;
            localStorage.setItem('sovereign_chat_session_id', currentSessionId);
            appendSystemMessage('بدء جلسة حوار سيادية جديدة مع النائب سيقما.');
        }
    } catch (err) {
        console.error('Failed to create session:', err);
        appendSystemMessage('تعذر الاتصال بخادم لوحة التحكم. تأكد من أن المنفذ 3851 يعمل.');
    }
}

async function loadSessionMessages() {
    try {
        const response = await fetch(`${API_BASE}/chat/sessions?sessionId=${currentSessionId}`);
        if (!response.ok) {
            // If session not found on server, create a new one
            await createNewSession();
            return;
        }
        const data = await response.json();
        messagesContainer.innerHTML = '';
        if (data.messages && data.messages.length > 0) {
            data.messages.forEach(msg => {
                if (typeof msg.content === 'string') {
                    appendMessage(msg.role, msg.content);
                } else if (Array.isArray(msg.content)) {
                    msg.content.forEach(sub => {
                        if (sub.type === 'text') {
                            appendMessage(msg.role, sub.text);
                        } else if (sub.type === 'tool_use') {
                            appendMessage('tool', `[استدعاء أداة]: ${sub.name}`);
                        }
                    });
                }
            });
        } else {
            appendSystemMessage('مرحباً بك في دردشة السيادة. اكتب استفسارك أو أمرك البرمجي للنائب سيقما.');
        }
    } catch (err) {
        console.error('Error loading session:', err);
        appendSystemMessage('تعذر تحميل الجلسة السابقة. تم بدء جلسة جديدة.');
        await createNewSession();
    }
}

function appendMessage(role, text) {
    const bubble = document.createElement('div');
    bubble.className = `message ${role}`;
    
    // Convert newlines to breaks or preserve spacing
    bubble.style.whiteSpace = 'pre-wrap';
    bubble.textContent = text;
    
    messagesContainer.appendChild(bubble);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

function appendSystemMessage(text) {
    const systemDiv = document.createElement('div');
    systemDiv.className = 'message assistant';
    systemDiv.style.background = 'rgba(255, 255, 255, 0.02)';
    systemDiv.style.border = '1px solid rgba(255, 255, 255, 0.05)';
    systemDiv.style.color = 'var(--text-muted)';
    systemDiv.style.alignSelf = 'center';
    systemDiv.style.maxWidth = '90%';
    systemDiv.style.borderRadius = '10px';
    systemDiv.textContent = text;
    messagesContainer.appendChild(systemDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

async function sendMessage() {
    const text = chatInput.value.trim();
    if (!text) return;
    
    // Intercept Tactical Slash Commands
    if (text.startsWith('/run ')) {
        const cmd = text.substring(5).trim();
        appendMessage('user', text);
        chatInput.value = '';
        executeTacticalAction('/api/tactical/cli', { command: cmd }, 'جاري تنفيذ الأمر...');
        return;
    }
    
    if (text.startsWith('/ledger')) {
        appendMessage('user', text);
        chatInput.value = '';
        executeTacticalAction('/api/tactical/ledger', {}, 'جاري قراءة السجل الجنائي...');
        return;
    }

    appendMessage('user', text);
    chatInput.value = '';
    
    // Show typing placeholder
    const typingIndicator = document.createElement('div');
    typingIndicator.className = 'message assistant';
    typingIndicator.textContent = 'جاري التفكير ومعالجة الأمر...';
    typingIndicator.id = 'typing-indicator';
    messagesContainer.appendChild(typingIndicator);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;

    try {
        const response = await fetch(`${API_BASE}/chat/message`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                sessionId: currentSessionId,
                message: text,
                planMode: false,
                tacticalMode: tacticalToggle ? tacticalToggle.checked : true
            })
        });
        
        // Remove typing indicator
        const indicator = document.getElementById('typing-indicator');
        if (indicator) indicator.remove();
        
        const data = await response.json();
        if (data.response) {
            appendMessage('assistant', data.response);
        } else {
            appendMessage('assistant', 'تم تنفيذ الأمر بنجاح.');
        }
    } catch (err) {
        console.error('Error sending message:', err);
        const indicator = document.getElementById('typing-indicator');
        if (indicator) indicator.remove();
        appendMessage('assistant', 'حدث خطأ أثناء الاتصال بالخادم.');
    }
}

async function executeTacticalAction(endpoint, payload, loadingMsg) {
    const indicator = document.createElement('div');
    indicator.className = 'message assistant';
    indicator.textContent = loadingMsg;
    indicator.id = 'typing-indicator';
    messagesContainer.appendChild(indicator);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;

    try {
        const response = await fetch(`${API_BASE}${endpoint.replace('/api', '')}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        
        const ind = document.getElementById('typing-indicator');
        if (ind) ind.remove();
        
        const data = await response.json();
        if (data.output) {
            appendMessage('cli-output', data.output);
        } else if (data.message) {
            appendMessage('assistant', data.message);
        } else if (data.errors) {
            const errText = data.errors.length > 0 
                ? data.errors.map(e => `[${e.timestamp}] ${e.action}: ${e.status}\n${e.goal || ''}`).join('\n\n')
                : 'لا توجد أخطاء حديثة في السجل.';
            appendMessage('cli-output', errText);
        }
    } catch (err) {
        const ind = document.getElementById('typing-indicator');
        if (ind) ind.remove();
        appendMessage('assistant', 'حدث خطأ تكتيكي: ' + err.message);
    }
}

sendBtn.addEventListener('click', sendMessage);
chatInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        sendMessage();
    }
});

if (tacticalToggle && modeLabel) {
    tacticalToggle.addEventListener('change', (e) => {
        if (e.target.checked) {
            modeLabel.textContent = '⚡ تدخّل تكتيكي (Tactician)';
            modeLabel.className = 'mode-label tactical';
        } else {
            modeLabel.textContent = '🛡️ الالتزام الدستوري (Sovereign)';
            modeLabel.className = 'mode-label sovereign';
        }
    });
}

// Tactical Buttons Listeners
document.getElementById('btn-purge-swarm')?.addEventListener('click', () => {
    if(confirm('هل أنت متأكد من قتل جميع عمليات Node.js التابعة للأسراب؟')) {
        executeTacticalAction('/api/tactical/purge', {}, 'جاري الإعدام الفوري للأسراب...');
    }
});

document.getElementById('btn-free-ports')?.addEventListener('click', () => {
    executeTacticalAction('/api/tactical/free-ports', {}, 'جاري البحث عن العمليات المحتجزة للمنافذ وتدميرها...');
});

document.getElementById('btn-ledger-radar')?.addEventListener('click', () => {
    executeTacticalAction('/api/tactical/ledger', {}, 'جاري جلب أحدث الأخطاء من السجل الجنائي...');
});

document.getElementById('btn-amnesia')?.addEventListener('click', async () => {
    if(confirm('هل أنت متأكد من مسح الذاكرة وبدء سياق جديد؟')) {
        localStorage.removeItem('sovereign_chat_session_id');
        currentSessionId = null;
        messagesContainer.innerHTML = '';
        await createNewSession();
    }
});

closeBtn.addEventListener('click', () => {
    // Hide or close action (if integrated in a dashboard container)
    window.parent.postMessage('close-chat', '*');
});

// Initialize on load
initializeChat();
