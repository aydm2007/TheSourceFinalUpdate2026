"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.activate = activate;
exports.deactivate = deactivate;
const vscode = require("vscode");
const telemetrySocket_1 = require("./telemetrySocket");
const ghostTextProvider_1 = require("./ghostTextProvider");
const weapons_1 = require("./weapons");
function activate(context) {
    console.log('Sovereign Client Activated.');
    const socket = new telemetrySocket_1.TelemetrySocket();
    socket.connect();
    const ghostProvider = new ghostTextProvider_1.GhostTextProvider(socket);
    const providerRegistration = vscode.languages.registerInlineCompletionItemProvider({ pattern: '**' }, ghostProvider);
    vscode.window.onDidChangeTextEditorVisibleRanges((e) => {
        socket.send({ type: 'SCROLL_SYNC', file: e.textEditor.document.uri.fsPath, ranges: e.visibleRanges });
    });
    let cmdOpt = vscode.commands.registerCommand('sovereign.optimizeBlock', () => {
        vscode.window.showInformationMessage('Sovereign: Analyzing Block...');
        socket.send({ type: 'CONTEXT_MENU', action: 'optimize' });
    });
    let cmdSec = vscode.commands.registerCommand('sovereign.securityAudit', () => {
        vscode.window.showInformationMessage('Sovereign: Running Security Audit...');
        socket.send({ type: 'CONTEXT_MENU', action: 'audit' });
    });
    let cmdInline = vscode.commands.registerCommand('sovereign.inlineChat', () => {
        vscode.window.showInformationMessage('Sovereign: Opening Inline Chat...');
        // Real implementation triggers CommentController
    });
    let cmdDiff = vscode.commands.registerCommand('sovereign.diffView', async () => {
        const uri1 = vscode.Uri.parse('sovereign-diff:original');
        const uri2 = vscode.Uri.parse('sovereign-diff:optimized');
        await vscode.commands.executeCommand('vscode.diff', uri1, uri2, 'Sovereign 3D Diff Review');
    });
    const weapons = new weapons_1.WeaponsRegistry(socket);
    weapons.deploy(context);
    context.subscriptions.push(providerRegistration, cmdOpt, cmdSec, cmdInline, cmdDiff);
}
function deactivate() { }
//# sourceMappingURL=extension.js.map