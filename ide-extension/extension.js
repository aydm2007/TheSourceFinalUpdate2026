const vscode = require('vscode');
const WebSocket = require('ws');

let ws;
let isConnected = false;

function activate(context) {
    console.log('AgriAsset Synapse is now active!');

    let disposable = vscode.commands.registerCommand('agriasset-synapse.connect', function () {
        connectToMCP();
    });

    context.subscriptions.push(disposable);

    // Auto-connect on startup
    connectToMCP();

    // Setup IDE telemetry listeners
    setupIdeListeners(context);
}

function connectToMCP() {
    if (ws && (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING)) {
        return;
    }

    const config = vscode.workspace.getConfiguration('agriasset-synapse');
    const host = config.get('serverHost') || 'localhost';
    const port = config.get('serverPort') || 9999;

    console.log(`Synapse: Connecting to MCP Nervous System at ws://${host}:${port}...`);
    ws = new WebSocket(`ws://${host}:${port}`);

    ws.on('open', () => {
        isConnected = true;
        vscode.window.showInformationMessage('Synapse: Connected to MCP Nervous System (100% GUI Sovereign)');
        
        ws.send(JSON.stringify({
            type: 'IDE_TELEMETRY',
            payload: {
                event: 'IDE_CONNECTED',
                timestamp: Date.now()
            }
        }));
    });

    ws.on('message', (data) => {
        try {
            const message = JSON.parse(data);
            handleMcpCommand(message);
        } catch (e) {
            console.error('Failed to parse MCP message', e);
        }
    });

    ws.on('close', () => {
        isConnected = false;
        // vscode.window.showWarningMessage('Synapse: Disconnected from MCP. Retrying in 5s...');
        setTimeout(connectToMCP, 5000);
    });

    ws.on('error', (err) => {
        console.error('Synapse WebSocket Error:', err);
    });
}

function handleMcpCommand(message) {
    if (message.type !== 'GUI_ACTION') return;

    switch (message.action) {
        case 'SHOW_INFORMATION':
            vscode.window.showInformationMessage(`[MCP]: ${message.payload.text}`);
            break;
        case 'SHOW_WARNING':
            vscode.window.showWarningMessage(`[MCP]: ${message.payload.text}`);
            break;
        case 'SHOW_ERROR':
            vscode.window.showErrorMessage(`[MCP]: ${message.payload.text}`);
            break;
        case 'OPEN_WEBVIEW':
            openWebview(message.payload);
            break;
        case 'OPEN_DIFF':
            vscode.commands.executeCommand('vscode.diff', 
                vscode.Uri.file(message.payload.original), 
                vscode.Uri.file(message.payload.modified), 
                message.payload.title || 'Sovereign AI Proposed Changes'
            );
            break;
        case 'INSERT_SNIPPET':
            if (vscode.window.activeTextEditor) {
                vscode.window.activeTextEditor.insertSnippet(
                    new vscode.SnippetString(message.payload.snippet)
                );
            } else {
                vscode.window.showErrorMessage('[MCP]: No active text editor for snippet injection.');
            }
            break;
        case 'GET_DIAGNOSTICS':
            sendDiagnostics();
            break;
        default:
            console.log(`Unknown MCP action: ${message.action}`);
    }
}

function sendDiagnostics() {
    if (!isConnected || !ws) return;
    const allDiagnostics = vscode.languages.getDiagnostics();
    const squiggles = allDiagnostics.map(([uri, diagnostics]) => ({
        file: uri.fsPath,
        issues: diagnostics.map(d => ({
            message: d.message,
            severity: d.severity,
            line: d.range.start.line,
            character: d.range.start.character
        }))
    }));

    ws.send(JSON.stringify({
        type: 'IDE_TELEMETRY',
        payload: {
            event: 'LINTER_SQUIGGLES',
            diagnostics: squiggles
        }
    }));
}

function openWebview(payload) {
    const panel = vscode.window.createWebviewPanel(
        'mcpWebview', 
        payload.title || 'Sovereign View', 
        vscode.ViewColumn.Two, 
        { enableScripts: true }
    );
    panel.webview.html = payload.html || `<h1>No Content</h1>`;
}

function setupIdeListeners(context) {
    vscode.window.onDidChangeTextEditorSelection(event => {
        if (!isConnected) return;
        const editor = event.textEditor;
        const document = editor.document;
        const selection = event.selections[0];
        
        ws.send(JSON.stringify({
            type: 'IDE_TELEMETRY',
            payload: {
                event: 'CURSOR_MOVE',
                file: document.uri.fsPath,
                line: selection.active.line,
                character: selection.active.character
            }
        }));
    });

    vscode.window.onDidChangeActiveTextEditor(editor => {
        if (!isConnected || !editor) return;
        ws.send(JSON.stringify({
            type: 'IDE_TELEMETRY',
            payload: {
                event: 'ACTIVE_EDITOR_CHANGE',
                file: editor.document.uri.fsPath
            }
        }));
    });

    // Send diagnostics dynamically on change
    vscode.languages.onDidChangeDiagnostics(e => {
        if (!isConnected) return;
        sendDiagnostics();
    });
}

function deactivate() {
    if (ws) {
        ws.close();
    }
}

module.exports = {
    activate,
    deactivate
};
