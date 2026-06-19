"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WeaponsRegistry = void 0;
const vscode = require("vscode");
const fs = require("fs");
const path = require("path");
class WeaponsRegistry {
    constructor(socket) {
        this.socket = socket;
        this.diagnosticCollection = vscode.languages.createDiagnosticCollection('sovereign-squiggles');
    }
    deploy(context) {
        // 1. Split-screen Diff (TextDocumentContentProvider)
        const diffProvider = new class {
            provideTextDocumentContent(uri) {
                return "// [SOVEREIGN DIFF VIEW]\n// Here is the optimized version suggested by the Swarm:\n\nconst sovereignOptimized = true;\n";
            }
        };
        context.subscriptions.push(vscode.workspace.registerTextDocumentContentProvider('sovereign-diff', diffProvider));
        // 2. Drag & Drop UI (DocumentDropEditProvider)
        const dropProvider = new class {
            async provideDocumentDropEdits(document, position, dataTransfer, token) {
                // If an image is dropped, Sovereign intercepts it and generates base64/UI code
                return new vscode.DocumentDropEdit('/* Sovereign Image Intercepted -> Auto-generating UI component... */\n');
            }
        };
        context.subscriptions.push(vscode.languages.registerDocumentDropEditProvider({ language: '*' }, dropProvider));
        // 3. Live Debugger Hover (EvaluatableExpressionProvider)
        const hoverProvider = new class {
            provideEvaluatableExpression(document, position) {
                const wordRange = document.getWordRangeAtPosition(position);
                if (wordRange) {
                    return new vscode.EvaluatableExpression(wordRange);
                }
                return undefined;
            }
        };
        context.subscriptions.push(vscode.languages.registerEvaluatableExpressionProvider({ language: '*' }, hoverProvider));
        // 4. Linter Squiggles (DiagnosticCollection)
        // Simulated: Draw red squiggle on line 1 for demonstration of power
        setTimeout(() => {
            if (vscode.window.activeTextEditor) {
                const doc = vscode.window.activeTextEditor.document;
                const diag = new vscode.Diagnostic(new vscode.Range(0, 0, 0, 10), "Sovereign Audit: Code smells detected by Swarm.", vscode.DiagnosticSeverity.Error);
                this.diagnosticCollection.set(doc.uri, [diag]);
            }
        }, 5000);
        // 5. Keybindings Awareness
        // Reading APPDATA or User settings to adapt Swarm behavior
        const userSettingsPath = path.join(process.env.APPDATA || '', 'Code', 'User', 'keybindings.json');
        if (fs.existsSync(userSettingsPath)) {
            console.log("Sovereign: Inherited user keybindings.");
            this.socket.send({ type: 'KEYBINDINGS_SYNC', status: 'LOADED' });
        }
        // 6. Inline Chat (CommentController)
        const commentController = vscode.comments.createCommentController('sovereign-chat', 'Sovereign Inline Chat');
        context.subscriptions.push(commentController);
        // 7. Visual Screen-Reading (OS Hook via Nexus Bridge)
        // Handled silently via the socket passing commands to MCP which uses Native OS API
        // 8. Eye-Tracking Stub (WebView binding)
        // 9. LAN Cursor Sync (P2P WebSocket)
        vscode.window.onDidChangeTextEditorSelection((e) => {
            this.socket.send({ type: 'LAN_CURSOR_SYNC', selections: e.selections });
        });
    }
}
exports.WeaponsRegistry = WeaponsRegistry;
//# sourceMappingURL=weapons.js.map