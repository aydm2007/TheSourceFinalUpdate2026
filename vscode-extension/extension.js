const vscode = require('vscode');
const cp = require('child_process');
const path = require('path');
const fs = require('fs');
const net = require('net');

// نظام السجل السيادي (Sovereign Logger)
const Logger = {
    logs: [],
    notify: null,
    add(msg, type = 'info') {
        const entry = { timestamp: new Date().toLocaleTimeString(), msg, type };
        this.logs.push(entry);
        if (this.notify) this.notify(entry);
    }
};

function activate(context) {
    Logger.add('بدء تفعيل المنظومة السيادية V9.0-Omega...');

    const sharedState = {
        projectRoot: vscode.workspace.workspaceFolders ? vscode.workspace.workspaceFolders[0].uri.fsPath : 'C:\\tools\\workspace\\TheSource'
    };

    function getBridgePath() {
        // Resolve the bridge file using a robust multi-path search sequence.
        // This unifies the resolution by checking the active workspace root,
        // the sibling 'TheSource' folder (when active in AgriAsset),
        // the parent directory of the extension itself (when running locally/dev),
        // and the absolute default sovereign path.
        const locations = [
            path.join(__dirname, 'nexus_bridge.js'), // 1. داخل الـ VSIX نفسه (Portable Mode)
            path.join(sharedState.projectRoot, 'nexus_bridge.js'), // 2. داخل جذر المشروع النشط
            path.join(path.dirname(sharedState.projectRoot), 'TheSource', 'nexus_bridge.js'), // 3. المجلد الشقيق المصدر
            path.join(__dirname, '..', 'nexus_bridge.js'), // 4. المجلد الأب المباشر (Development Mode)
            path.join('C:\\tools\\workspace\\TheSource', 'nexus_bridge.js') // 5. المسار الافتراضي المطلق
        ];

        for (const loc of locations) {
            if (fs.existsSync(loc)) {
                return loc;
            }
        }

        Logger.add(`⚠️ لا يمكن العثور على nexus_bridge.js في أي من المسارات المعروفة`, 'warning');
        return null;
    }

    // 1. مسجل لوحة التحكم (Dashboard Provider)
    const dashboardProvider = new NexusDashboardProvider(context.extensionUri, sharedState, context);
    Logger.notify = entry => dashboardProvider.postMessage({ command: 'newLog', log: entry });
    context.subscriptions.push(
        vscode.window.registerWebviewViewProvider('nexus-explorer', dashboardProvider)
    );

    // 2. مسجل الدردشة السيادي (Chat Provider)
    const chatProvider = new NexusChatProvider(context.extensionUri, sharedState, getBridgePath, context);
    context.subscriptions.push(
        vscode.window.registerWebviewViewProvider('nexus-chat', chatProvider)
    );

    sharedState.dashboardProvider = dashboardProvider;
    sharedState.chatProvider = chatProvider;

    // 2.5 Live IPC Socket Connection
    function connectToIPCHub() {
        const client = new net.Socket();
        const config = vscode.workspace.getConfiguration('nexus');
        const host = config.get('serverHost') || '127.0.0.1';
        const ipcPort = config.get('serverPort') || 15015;
        
        client.connect(ipcPort, host, () => {
            Logger.add(`🟢 تم الاتصال بنجاح بقلب السيادة (Live IPC Socket - ${host}:${ipcPort})`, 'success');
        });

        let buffer = '';
        client.on('data', (data) => {
            buffer += data.toString();
            const lines = buffer.split('\n');
            buffer = lines.pop(); // keep incomplete part in buffer
            
            for (const line of lines) {
                if (!line.trim()) continue;
                try {
                    const msg = JSON.parse(line);
                    let displayMsg = '';
                    if (msg.type === 'SHADOW_LEDGER') {
                        displayMsg = `[SHADOW] ${msg.action || msg.status || ''}: ${msg.file || msg.error || msg.command || 'Forensic Event'}`;
                    } else {
                        displayMsg = `[DAEMON] ${msg.message || msg.event || JSON.stringify(msg)}`;
                    }
                    Logger.add(displayMsg, msg.level === 'error' || msg.severity === 'FATAL' || msg.severity === 'ERROR' ? 'error' : 'info');
                } catch(e) {
                    // Raw string fallback
                    Logger.add(`[DAEMON-RAW] ${line}`, 'info');
                }
            }
        });

        client.on('close', () => {
            Logger.add('⚠️ انقطع الاتصال بقلب السيادة. جاري إعادة المحاولة خلال 5 ثوانٍ...', 'warning');
            setTimeout(connectToIPCHub, 5000);
        });
        
        client.on('error', (err) => {
            // Suppress error logs to avoid spamming if daemon is not running yet
        });
    }
    
    connectToIPCHub();

    // 3. الأوامر وتحديث الحالة
    context.subscriptions.push(
        vscode.commands.registerCommand('nexus.updateStatus', (status) => {
            dashboardProvider.postMessage({ command: 'updateStatus', status });
        }),
        vscode.commands.registerCommand('nexus.updateUsage', (usage) => {
            dashboardProvider.postMessage({ command: 'updateUsage', usage });
        }),
        vscode.commands.registerCommand('nexus.refreshLogs', (log) => {
            dashboardProvider.postMessage({ command: 'newLog', log });
        }),
        vscode.commands.registerCommand('nexus.selectProjectRoot', async () => {
            const result = await vscode.window.showOpenDialog({
                canSelectFolders: true,
                canSelectFiles: false,
                openLabel: 'اختر مجلد المشروع'
            });
            if (result && result.length > 0) {
                const selectedPath = result[0].fsPath;
                sharedState.projectRoot = selectedPath;
                dashboardProvider._sendSettings(dashboardProvider.view.webview);
                Logger.add(`تم تحديث الجذر إلى: ${selectedPath}`, 'success');
            }
        }),
        vscode.commands.registerCommand('nexus.switchModel', async () => {
            const models = [
                { label: 'DeepSeek V3 (Free Cloud)', description: 'deepseek-ai/DeepSeek-V3', detail: 'الأقوى حالياً في البرمجة والمهام العامة (مجاني).' },
                { label: 'DeepSeek R1 (Free Cloud)', description: 'deepseek-ai/DeepSeek-V3', detail: 'نموذج التفكير المنطقي العميق (Reasoning).' },
                { label: 'Qwen 2.5-72B (Free Cloud)', description: 'deepseek-ai/DeepSeek-V3', detail: 'نموذج علي بابا العملاق والمتعدد المهام.' },
                { label: 'Qwen 2.5-Coder 32B (Free Cloud)', description: 'deepseek-ai/DeepSeek-V3', detail: 'متخصص في البرمجة السريعة والمنطق البرمجي.' },
                { label: 'GLM 4-9B (Free Cloud)', description: 'THUDM/glm-4-9b-chat', detail: 'نموذج صيني ذكي وسريع جداً.' },
                { label: 'Yi 1.5-34B (Free Cloud)', description: '01-ai/Yi-1.5-34B-Chat-16K', detail: 'أداء ممتاز في اللغات المتعددة.' },
                { label: 'Llama 3.1-405B (Premium)', description: 'meta-llama/Llama-3.1-405B-Instruct', detail: 'النموذج الأضخم والأقوى للأعمال الثقيلة (مدفوع).' },
                { label: 'DeepSeek V3 (Pro)', description: 'Pro/deepseek-ai/DeepSeek-V3', detail: 'نسخة المحترفين من V3 لضمان السرعة والاستقرار.' }
            ];
            const selection = await vscode.window.showQuickPick(models, { placeHolder: 'اختر نموذج السيادة (Aether Zenith)' });
            if (selection) {
                dashboardProvider._updateEnv({ SILICONFLOW_MODEL: selection.description });
                if (dashboardProvider.view) dashboardProvider._sendSettings(dashboardProvider.view.webview);
                if (chatProvider.view) chatProvider._sendSettings(chatProvider.view.webview);
                Logger.add(`تم تفعيل نموذج السيادة: ${selection.label}`, 'success');
            }
        }),
        vscode.commands.registerCommand('nexus.atomicRepair', () => {
            const bridge = getBridgePath();
            if (bridge) {
                Logger.add('بدء عملية الشفاء الذاتي...', 'info');
                cp.exec(`node "${bridge}" "OmegaDiagnostic"`, { cwd: sharedState.projectRoot }, (err, stdout) => {
                    vscode.window.showInformationMessage(!err ? '✅ النظام سليم!' : '❌ فشل الإصلاح.');
                });
            }
        }),
        vscode.commands.registerCommand('nexus.explainCode', () => {
            const editor = vscode.window.activeTextEditor;
            if (editor) {
                const selection = editor.document.getText(editor.selection);
                if (selection) {
                    vscode.commands.executeCommand('nexus-chat.focus');
                    chatProvider.postMessage({ command: 'receiveMessage', text: `جاري تحليل الكود المختار...\n\n\`\`\`\n${selection}\n\`\`\`` });
                    chatProvider._process(`اشرح هذا الكود بالتفصيل وقدم توصيات تحسين جنائية:\n${selection}`, 'act').then(res => {
                        chatProvider.postMessage({ command: 'receiveMessage', text: res });
                    });
                }
            }
        })
    );

    Logger.add('تم تسجيل كافة المزودات والأوامر بنجاح.', 'success');
    vscode.commands.executeCommand('nexus.atomicRepair');
}

class NexusDashboardProvider {
    constructor(extensionUri, state, context) {
        this.extensionUri = extensionUri;
        this.state = state;
        this.context = context;
    }

    resolveWebviewView(webviewView) {
        this.view = webviewView;
        webviewView.webview.options = { enableScripts: true };
        webviewView.webview.html = this._getHtml();
        this._sendSettings(webviewView.webview);
        Logger.logs.forEach(entry => this.postMessage({ command: 'newLog', log: entry }));

        webviewView.webview.onDidReceiveMessage(data => {
            switch (data.command) {
                case 'saveProvider': {
                    const envUpdates = { 
                        AETHER_PROVIDER: data.provider || 'siliconflow',
                        AETHER_API_BASE_URL: data.apiBaseUrl,
                        AETHER_MODEL: data.plannerModel || data.activeModel || 'deepseek-ai/DeepSeek-V3',
                        AETHER_PLANNER_MODEL: data.plannerModel || data.activeModel || 'deepseek-ai/DeepSeek-V3',
                        AETHER_EXECUTOR_MODEL: data.executorModel || data.activeModel || 'deepseek-ai/DeepSeek-V3',
                        AETHER_API_KEY: data.keyA,
                        AETHER_API_KEY_BETA: data.keyB
                    };
                    
                    // Save key specifically to its provider
                    const providerKeyName = `AETHER_KEY_${(data.provider || 'siliconflow').toUpperCase()}`;
                    envUpdates[providerKeyName] = data.keyA;

                    if (data.savedEndpoints) {
                        envUpdates.AETHER_SAVED_ENDPOINTS = data.savedEndpoints;
                    }
                    // Backwards compatibility
                    if (data.provider === 'github') envUpdates.GITHUB_MODELS_TOKEN = data.keyA;
                    else envUpdates.AETHER_RELAY_KEY_ALPHA = data.keyA;
                    
                    this._updateEnv(envUpdates).then(() => {
                        Logger.add(`تم حفظ إعدادات المزود (${data.provider}) بنجاح.`, 'success');
                        if (this.view) this._sendSettings(this.view.webview);
                        if (this.state.chatProvider && this.state.chatProvider.view) {
                            this.state.chatProvider._sendSettings(this.state.chatProvider.view.webview);
                        }
                    });
                    break;
                }
                case 'saveModels':
                    this._updateEnv({ 
                        AETHER_MODEL: data.plannerModel,
                        AETHER_PLANNER_MODEL: data.plannerModel,
                        AETHER_EXECUTOR_MODEL: data.executorModel
                    }).then(() => {
                        Logger.add('تم تحديث محرك التخطيط والتنفيذ بنجاح.', 'success');
                        if (this.view) this._sendSettings(this.view.webview);
                        if (this.state.chatProvider && this.state.chatProvider.view) {
                            this.state.chatProvider._sendSettings(this.state.chatProvider.view.webview);
                        }
                    });
                    break;
                case 'testConnection': {
                    const apiUrl = data.apiBaseUrl || 'https://api.siliconflow.com/v1/chat/completions';
                    const apiKey = data.apiKey;
                    const model = data.model || 'deepseek-ai/DeepSeek-V3';
                    if (!apiKey) {
                        webviewView.webview.postMessage({ command: 'connectionResult', success: false, details: 'مفتاح API فارغ' });
                        break;
                    }
                    const testScript = `node -e "fetch('${apiUrl}',{method:'POST',headers:{'Authorization':'Bearer ${apiKey}','Content-Type':'application/json','HTTP-Referer':'https://vscode.dev','X-Title':'AetherSovereign'},body:JSON.stringify({model:'${model}',messages:[{role:'user',content:'ping'}],max_tokens:5})}).then(r=>r.text().then(t=>{try{return JSON.parse(t);}catch(e){return {error:'Non-JSON Response', body:t};}})).then(d=>{if(d.choices)console.log('SUCCESS');else console.log('FAIL:'+JSON.stringify(d))}).catch(e=>console.log('FAIL:'+e.message))"`;
                    cp.exec(testScript, { timeout: 15000 }, (err, stdout) => {
                        const success = stdout && stdout.trim().startsWith('SUCCESS');
                        webviewView.webview.postMessage({ command: 'connectionResult', success, details: stdout || (err && err.message) || 'خطأ غير معروف' });
                        Logger.add(success ? '✅ اختبار الاتصال ناجح' : `❌ فشل الاتصال: ${stdout}`, success ? 'success' : 'error');
                    });
                    break;
                }
                case 'saveTargetPath':
                    this.state.projectRoot = data.path;
                    Logger.add(`تم تغيير المسار المستهدف إلى: ${data.path}`, 'success');
                    if (this.view) this._sendSettings(this.view.webview);
                    if (this.state.chatProvider && this.state.chatProvider.view) {
                        this.state.chatProvider._sendSettings(this.state.chatProvider.view.webview);
                    }
                    break;
                case 'selectTargetPath':
                    vscode.commands.executeCommand('nexus.selectProjectRoot');
                    break;
                case 'runIntegrity':
                    vscode.commands.executeCommand('nexus.atomicRepair');
                    break;
                case 'runVisualAudit': {
                    Logger.add('توليد التقرير البصري الجنائي...', 'info');
                    const bridge = path.join(this.state.projectRoot, 'nexus_bridge.js');
                    cp.exec(`node "${bridge}" "Bash node aether-console.js VisualAuditReport"`, { cwd: this.state.projectRoot }, (err, stdout) => {
                        if (!err) {
                            vscode.window.showInformationMessage('✅ تم توليد التقرير البصري.');
                            Logger.add('تم توليد التقرير البصري بنجاح.', 'success');
                        }
                    });
                    break;
                }
                case 'runSkill': {
                    const bridge = path.join(this.state.projectRoot, 'nexus_bridge.js');
                    Logger.add(`تشغيل المهارة: ${data.skill}`, 'info');
                    cp.exec(`node "${bridge}" "LoadSkill ${data.skill}"`, { cwd: this.state.projectRoot }, (err, stdout, stderr) => {
                        webviewView.webview.postMessage({ command: 'skillResult', skill: data.skill, success: !err, output: err ? stderr : stdout });
                    });
                    break;
                }
                case 'showInfo':
                    vscode.window.showInformationMessage(data.text);
                    break;
                case 'loadConstitution': {
                    const getActiveSkill = () => {
                        const sessionsDir = path.join(this.state.projectRoot, '.nexus', 'sessions');
                        const activeSkillPath = path.join(this.state.projectRoot, 'active_skill.json');
                        try {
                            if (fs.existsSync(sessionsDir)) {
                                const files = fs.readdirSync(sessionsDir).filter(f => f.endsWith('_skill.json'));
                                if (files.length > 0) {
                                    const latestFile = files.map(f => ({
                                        name: f,
                                        mtime: fs.statSync(path.join(sessionsDir, f)).mtimeMs
                                    })).sort((a, b) => b.mtime - a.mtime)[0].name;
                                    const skillData = JSON.parse(fs.readFileSync(path.join(sessionsDir, latestFile), 'utf8'));
                                    return skillData.active_skill || skillData.activeSkill;
                                }
                            }
                        } catch (e) {}
                        try {
                            if (fs.existsSync(activeSkillPath)) {
                                const skillData = JSON.parse(fs.readFileSync(activeSkillPath, 'utf8'));
                                return skillData.activeSkill || skillData.active_skill;
                            }
                        } catch (e) {}
                        return null;
                    };

                    const activeSkill = getActiveSkill() || 'nexus-core';
                    const skillDir = path.join(this.state.projectRoot, '.agents', 'skills', activeSkill);
                    const locations = [
                        path.join(skillDir, 'master.md'),
                        path.join(skillDir, 'SKILL.md'),
                        path.join(this.state.projectRoot, 'core', 'protocols', 'nexus-core', 'master.md'),
                        path.join(__dirname, 'core', 'protocols', 'nexus-core', 'master.md'),
                        path.join(__dirname, 'agents', 'skills', 'nexus-core', 'master.md')
                    ];

                    let content = '';
                    let resolvedPath = '';
                    for (const loc of locations) {
                        if (fs.existsSync(loc)) {
                            content = fs.readFileSync(loc, 'utf8');
                            resolvedPath = loc;
                            break;
                        }
                    }

                    if (content) {
                        webviewView.webview.postMessage({
                            command: 'constitutionLoaded',
                            content: content,
                            skill: activeSkill,
                            path: resolvedPath
                        });
                    } else {
                        webviewView.webview.postMessage({
                            command: 'constitutionLoaded',
                            error: 'لم يتم العثور على دستور المنظومة (master.md)'
                        });
                    }
                    break;
                }
                case 'ready':
                    this._sendSettings(webviewView.webview);
                    break;
            }
        });
    }

    postMessage(msg) {
        if (this.view) this.view.webview.postMessage(msg);
    }

    async _sendSettings(webview) {
        const envPath = path.join(this.state.projectRoot, '.env');
        const settings = { projectRoot: this.state.projectRoot };
        if (fs.existsSync(envPath)) {
            const content = fs.readFileSync(envPath, 'utf8');
            settings.apiBaseUrl = content.match(/AETHER_API_BASE_URL=(.*)/)?.[1] || 'https://api.siliconflow.com/v1/chat/completions';
            settings.plannerModel = content.match(/AETHER_PLANNER_MODEL=(.*)/)?.[1] || content.match(/AETHER_MODEL=(.*)/)?.[1] || 'deepseek-ai/DeepSeek-V3';
            settings.executorModel = content.match(/AETHER_EXECUTOR_MODEL=(.*)/)?.[1] || content.match(/AETHER_MODEL=(.*)/)?.[1] || 'deepseek-ai/DeepSeek-V3';
            settings.activeModel = content.match(/AETHER_MODEL=(.*)/)?.[1] || settings.plannerModel;
            settings.provider = content.match(/AETHER_PROVIDER=(.*)/)?.[1] || 'siliconflow';
            settings.savedEndpoints = content.match(/AETHER_SAVED_ENDPOINTS=(.*)/)?.[1];
        } else {
            settings.apiBaseUrl = 'https://api.siliconflow.com/v1/chat/completions';
            settings.activeModel = 'deepseek-ai/DeepSeek-V3';
            settings.plannerModel = 'deepseek-ai/DeepSeek-V3';
            settings.executorModel = 'deepseek-ai/DeepSeek-V3';
            settings.provider = 'siliconflow';
        }

        // Fetch secrets securely
        settings.keyA = await this.context.secrets.get('AETHER_API_KEY') || await this.context.secrets.get('AETHER_RELAY_KEY_ALPHA') || '';
        settings.keyB = await this.context.secrets.get('AETHER_API_KEY_BETA') || '';
        
        settings.savedKeys = {
            siliconflow: await this.context.secrets.get('AETHER_KEY_SILICONFLOW') || settings.keyA,
            openrouter: await this.context.secrets.get('AETHER_KEY_OPENROUTER') || '',
            sambanova: await this.context.secrets.get('AETHER_KEY_SAMBANOVA') || '',
            github: await this.context.secrets.get('AETHER_KEY_GITHUB') || await this.context.secrets.get('GITHUB_MODELS_TOKEN') || '',
            custom: await this.context.secrets.get('AETHER_KEY_CUSTOM') || ''
        };

        if (settings.provider === 'github' && !settings.keyA) {
            settings.keyA = settings.savedKeys.github;
        }
        
        const skillsDir = path.join(this.state.projectRoot, '.agents', 'skills');
        let skills = [];
        if (fs.existsSync(skillsDir)) {
            const dirs = fs.readdirSync(skillsDir).filter(f => fs.lstatSync(path.join(skillsDir, f)).isDirectory());
            skills = dirs.map(s => {
                let desc = '';
                const skillMd = path.join(skillsDir, s, 'SKILL.md');
                try { if (fs.existsSync(skillMd)) desc = fs.readFileSync(skillMd, 'utf8').split('\n')[0].replace(/[#*]+/g, '').trim(); } catch(e){}
                return { name: s, description: desc };
            });
        }
        webview.postMessage({ command: 'loadSettings', ...settings, skills });
    }

    async _updateEnv(updates) {
        const envPath = path.join(this.state.projectRoot, '.env');
        let content = fs.existsSync(envPath) ? fs.readFileSync(envPath, 'utf8') : '';
        for (let [key, value] of Object.entries(updates)) {
            if (key.includes('KEY') || key.includes('TOKEN')) {
                if (value) {
                    await this.context.secrets.store(key, value);
                }
            } else {
                const regex = new RegExp(`^${key}=.*`, 'm');
                content = content.match(regex) ? content.replace(regex, `${key}=${value}`) : `${content}\n${key}=${value}`;
                process.env[key] = value;
            }
        }
        fs.writeFileSync(envPath, content.trim() + '\n');
    }

    _getHtml() {
        return fs.readFileSync(path.join(this.extensionUri.fsPath, 'dashboard_ui.html'), 'utf8');
    }
}

class NexusChatProvider {
    constructor(extensionUri, state, getBridgePath, context) {
        this.extensionUri = extensionUri;
        this.state = state;
        this.getBridgePath = getBridgePath;
        this.context = context;
    }

    resolveWebviewView(webviewView) {
        this.view = webviewView;
        webviewView.webview.options = { enableScripts: true, localResourceRoots: [this.extensionUri] };
        webviewView.webview.html = fs.readFileSync(path.join(this.extensionUri.fsPath, 'chat_ui.html'), 'utf8');
        webviewView.webview.onDidReceiveMessage(async data => {
            if (data.command === 'sendMessage') {
                const response = await this._process(data.text, data.mode);
                webviewView.webview.postMessage({ command: 'receiveMessage', text: response });
            } else if (data.command === 'requestHistory') {
                this._sendHistory(webviewView.webview);
                this._sendSettings(webviewView.webview);
            } else if (data.command === 'clearChat') {
                this._clearHistory();
            } else if (data.command === 'ready') {
                this._sendSettings(webviewView.webview);
            }
        });
    }

    postMessage(msg) {
        if (this.view) this.view.webview.postMessage(msg);
    }

    async _sendSettings(webview) {
        const envPath = path.join(this.state.projectRoot, '.env');
        const settings = { projectRoot: this.state.projectRoot };
        if (fs.existsSync(envPath)) {
            const content = fs.readFileSync(envPath, 'utf8');
            settings.plannerModel = content.match(/AETHER_PLANNER_MODEL=(.*)/)?.[1] || content.match(/AETHER_MODEL=(.*)/)?.[1] || 'deepseek-ai/DeepSeek-V3';
            settings.executorModel = content.match(/AETHER_EXECUTOR_MODEL=(.*)/)?.[1] || content.match(/AETHER_MODEL=(.*)/)?.[1] || 'deepseek-ai/DeepSeek-V3';
            settings.activeModel = content.match(/AETHER_MODEL=(.*)/)?.[1] || settings.plannerModel;
        } else {
            settings.plannerModel = 'deepseek-ai/DeepSeek-V3';
            settings.executorModel = 'deepseek-ai/DeepSeek-V3';
            settings.activeModel = 'deepseek-ai/DeepSeek-V3';
        }

        const skillsDir = path.join(this.state.projectRoot, '.agents', 'skills');
        let skills = [];
        if (fs.existsSync(skillsDir)) {
            const dirs = fs.readdirSync(skillsDir).filter(f => fs.lstatSync(path.join(skillsDir, f)).isDirectory());
            skills = dirs.map(s => {
                let desc = '';
                const skillMd = path.join(skillsDir, s, 'SKILL.md');
                try { if (fs.existsSync(skillMd)) desc = fs.readFileSync(skillMd, 'utf8').split('\n')[0].replace(/[#*]+/g, '').trim(); } catch(e){}
                return { name: s, description: desc };
            });
        }
        webview.postMessage({ command: 'loadSettings', ...settings, skills });
    }

    _sendHistory(webview) {
        const historyPath = path.join(this.state.projectRoot, 'scratch', 'chat_history.json');
        if (fs.existsSync(historyPath)) {
            try {
                const history = JSON.parse(fs.readFileSync(historyPath, 'utf8'));
                webview.postMessage({ command: 'loadHistory', history: history.slice(-10) });
            } catch (e) {}
        }
    }

    _clearHistory() {
        const historyPath = path.join(this.state.projectRoot, 'scratch', 'chat_history.json');
        try {
            fs.mkdirSync(path.dirname(historyPath), { recursive: true });
            fs.writeFileSync(historyPath, JSON.stringify([], null, 2), 'utf8');
            Logger.add('تم مسح سجل الدردشة السيادية وتطهير السياق بنجاح.', 'success');
        } catch (e) {
            Logger.add(`❌ فشل مسح سجل الدردشة: ${e.message}`, 'error');
        }
    }

    async _process(text, mode) {
        const bridge = this.getBridgePath();
        if (!bridge) return "🔴 خطأ: ملف الجسر مفقود.";
        
        return new Promise(async resolve => {
            const envPath = path.join(this.state.projectRoot, '.env');
            let apiBaseUrl = process.env.AETHER_API_BASE_URL;
            let plannerModel = process.env.AETHER_PLANNER_MODEL;
            let executorModel = process.env.AETHER_EXECUTOR_MODEL;
            let provider = process.env.AETHER_PROVIDER || 'siliconflow';

            if (fs.existsSync(envPath)) {
                const content = fs.readFileSync(envPath, 'utf8');
                apiBaseUrl = content.match(/AETHER_API_BASE_URL=(.*)/)?.[1] || apiBaseUrl;
                plannerModel = content.match(/AETHER_PLANNER_MODEL=(.*)/)?.[1] || plannerModel;
                executorModel = content.match(/AETHER_EXECUTOR_MODEL=(.*)/)?.[1] || executorModel;
                provider = content.match(/AETHER_PROVIDER=(.*)/)?.[1] || provider;
            }

            // Secure key retrieval from VS Code Secrets based on active provider
            let alphaKey = '';
            if (provider === 'openrouter') {
                alphaKey = await this.context.secrets.get('AETHER_KEY_OPENROUTER') || '';
            } else if (provider === 'siliconflow') {
                alphaKey = await this.context.secrets.get('AETHER_KEY_SILICONFLOW') || '';
            } else if (provider === 'github') {
                alphaKey = await this.context.secrets.get('AETHER_KEY_GITHUB') || await this.context.secrets.get('GITHUB_MODELS_TOKEN') || '';
            } else if (provider === 'sambanova') {
                alphaKey = await this.context.secrets.get('AETHER_KEY_SAMBANOVA') || '';
            } else if (provider === 'custom') {
                alphaKey = await this.context.secrets.get('AETHER_KEY_CUSTOM') || '';
            }

            // Fallback to legacy/generic secrets
            if (!alphaKey) {
                alphaKey = await this.context.secrets.get('AETHER_API_KEY') || await this.context.secrets.get('AETHER_RELAY_KEY_ALPHA') || '';
            }
            
            let betaKey = await this.context.secrets.get('AETHER_API_KEY_BETA') || '';

            // Dual-Engine: Plan mode uses Planner, Act mode uses Executor
            const activeModel = (mode === 'plan') ? (plannerModel || 'deepseek-ai/DeepSeek-V3') : (executorModel || 'deepseek-ai/DeepSeek-V3');

            const env = { 
                ...process.env, 
                AETHER_PROVIDER: provider,
                AETHER_API_BASE_URL: apiBaseUrl,
                AETHER_PLANNER_MODEL: plannerModel,
                AETHER_EXECUTOR_MODEL: executorModel,
                SILICONFLOW_MODEL: activeModel,
                AETHER_MODEL: activeModel
            };

            // Only overwrite if keys are truthy to prevent overwriting valid .env fallbacks with empty strings
            if (alphaKey) {
                env.AETHER_API_KEY = alphaKey;
                env.AETHER_RELAY_KEY_ALPHA = alphaKey;
            }
            if (betaKey) {
                env.AETHER_API_KEY_BETA = betaKey;
                env.AETHER_RELAY_KEY_BETA = betaKey;
            }

            const proc = cp.spawn('node', [bridge, text], { 
                cwd: this.state.projectRoot,
                env: env
            });

            let stdout = '';
            let stderr = '';
            let stdoutBuffer = '';

            proc.stdout.on('data', d => {
                const chunk = d.toString();
                stdout += chunk;
                stdoutBuffer += chunk;

                const lines = stdoutBuffer.split('\n');
                stdoutBuffer = lines.pop(); // Keep partial line in buffer

                for (const line of lines) {
                    if (line.includes('[KAIROS]:')) {
                        const thought = line.substring(line.indexOf('[KAIROS]:') + 9).trim();
                        if (thought) {
                            Logger.add(`🧠 [تفكر/تخاطر]: ${thought}`, 'info');
                            if (this.view) {
                                this.view.webview.postMessage({ command: 'updateStep', text: `تفكير: ${thought}` });
                            }
                        }
                    } else if (line.includes('[KAIROS-TOOL]:')) {
                        const toolCall = line.substring(line.indexOf('[KAIROS-TOOL]:') + 14).trim();
                        if (toolCall) {
                            Logger.add(`🛠️ [استدعاء أداة]: ${toolCall}`, 'success');
                            if (this.view) {
                                this.view.webview.postMessage({ command: 'updateStep', text: `جاري استدعاء الأداة: ${toolCall}` });
                            }
                        }
                    } else if (line.includes('[Diagnostic]')) {
                        Logger.add(line.trim(), 'info');
                    }
                }
            });

            proc.stderr.on('data', d => stderr += d.toString());

            proc.on('close', code => {
                const diagMatches = stdout.match(/\[Diagnostic\]:(.*)/g);
                if (diagMatches) diagMatches.forEach(m => Logger.add(m, 'info'));

                if (code !== 0 && !stdout.includes('[Agent]:')) {
                    resolve(`🔴 خطأ جسر (Code ${code}): ${stderr || stdout}`);
                } else {
                    const match = stdout.match(/\[Agent\]:(.*)/s);
                    const usageMatch = stdout.match(/\[Usage\]:(.*)/);
                    if (usageMatch) vscode.commands.executeCommand('nexus.updateUsage', JSON.parse(usageMatch[1]));
                    resolve(match ? match[1].trim() : stdout);
                }
            });
        });
    }
}

module.exports = { activate, deactivate: () => {} };
