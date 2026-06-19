"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GhostTextProvider = void 0;
const vscode = require("vscode");
class GhostTextProvider {
    constructor(socket) {
        this.socket = socket;
    }
    async provideInlineCompletionItems(document, position, context, token) {
        const lineText = document.lineAt(position.line).text;
        // Telepathy Broadcast: Send context to MCP
        this.socket.send({ type: 'GHOST_TEXT_REQUEST', file: document.uri.fsPath, line: position.line, text: lineText });
        // Simulate Ghost Text predictive injection
        if (lineText.trim().endsWith('{')) {
            return [new vscode.InlineCompletionItem('\n  // Sovereign Gen 7 Prediction\n  return true;\n', new vscode.Range(position, position))];
        }
        return [];
    }
}
exports.GhostTextProvider = GhostTextProvider;
//# sourceMappingURL=ghostTextProvider.js.map