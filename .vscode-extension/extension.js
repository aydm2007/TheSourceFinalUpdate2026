const vscode = require("vscode");
const WebSocket = require("ws");

let wsClient = null;
let isConnected = false;

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {
  console.log("Sovereign Nervous System extension is now active!");

  let connectCmd = vscode.commands.registerCommand(
    "sovereign-nervous-system.connect",
    () => {
      connectToMCP();
    },
  );

  let webviewCmd = vscode.commands.registerCommand(
    "sovereign-nervous-system.showWebView",
    () => {
      const panel = vscode.window.createWebviewPanel(
        "mcpWebView",
        "Sovereign MCP View",
        vscode.ViewColumn.Two,
        { enableScripts: true },
      );
      panel.webview.html = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>MCP</title></head>
<body style="background-color:#1e1e1e; color:white; font-family:sans-serif; padding: 20px;">
    <h2>Sovereign Agent Control</h2>
    <p id="content">Awaiting MCP Commands...</p>
    <script>
        window.addEventListener('message', event => {
            const message = event.data;
            if (message.type === 'updateContent') {
                document.getElementById('content').innerHTML = message.html;
            }
        });
    </script>
</body>
</html>`;
      // Store panel globally to allow MCP to push updates to it
      global.mcpWebviewPanel = panel;
    },
  );

  context.subscriptions.push(connectCmd, webviewCmd);

  // Auto-connect on activation
  connectToMCP();

  // 1. Ghost Text (Inline Completion Provider)
  const provider = {
    provideInlineCompletionItems(document, position, context, token) {
      // Check if MCP has provided a ghost text for this location
      if (
        global.mcpGhostText &&
        global.mcpGhostText.file === document.fileName &&
        global.mcpGhostText.line === position.line
      ) {
        const item = new vscode.InlineCompletionItem(global.mcpGhostText.text);
        item.range = new vscode.Range(position, position);
        return [item];
      }
      return [];
    },
  };
  vscode.languages.registerInlineCompletionItemProvider(
    { pattern: "**" },
    provider,
  );

  // 2. Terminal Interception
  vscode.window.onDidWriteTerminalData((event) => {
    if (isConnected) {
      sendEvent("ide.terminal_output", {
        data: event.data,
        terminalName: event.terminal.name,
      });
    }
  });

  // Listen to OS/IDE Events and stream to MCP
  vscode.window.onDidChangeActiveTextEditor(
    (editor) => {
      if (editor && isConnected) {
        sendEvent("ide.active_editor_changed", {
          file: editor.document.fileName,
        });
      }
    },
    null,
    context.subscriptions,
  );

  vscode.window.onDidChangeTextEditorSelection(
    (event) => {
      if (isConnected && event.selections.length > 0) {
        const pos = event.selections[0].active;
        sendEvent("ide.cursor_moved", {
          line: pos.line,
          character: pos.character,
          file: event.textEditor.document.fileName,
        });
      }
    },
    null,
    context.subscriptions,
  );

  vscode.workspace.onDidSaveTextDocument(
    (doc) => {
      if (isConnected) {
        sendEvent("ide.file_saved", { file: doc.fileName });
      }
    },
    null,
    context.subscriptions,
  );
}

function connectToMCP() {
  if (wsClient && wsClient.readyState === WebSocket.OPEN) return;

  vscode.window.showInformationMessage(
    "Connecting to Sovereign MCP Nervous System...",
  );

  // Connect to local MCP Websocket Server (we will create this endpoint in TheSource)
  wsClient = new WebSocket("ws://localhost:9999/nervous-system");

  wsClient.on("open", () => {
    isConnected = true;
    vscode.window.showInformationMessage(
      "Sovereign MCP: Connected to UI Nervous System. 150/150 Supremacy Enabled.",
    );
    sendEvent("ide.connected", { message: "IDE GUI Bridge Established" });
  });

  wsClient.on("message", (data) => {
    try {
      const msg = JSON.parse(data.toString());
      handleMCPCommand(msg);
    } catch (e) {
      console.error("Failed to parse MCP message", e);
    }
  });

  wsClient.on("close", () => {
    isConnected = false;
    setTimeout(connectToMCP, 5000); // Auto-reconnect
  });

  wsClient.on("error", (err) => {
    console.error("MCP WS Error:", err);
  });
}

function sendEvent(type, payload) {
  if (wsClient && isConnected) {
    wsClient.send(JSON.stringify({ type, timestamp: Date.now(), payload }));
  }
}

function handleMCPCommand(msg) {
  if (msg.action === "show_information") {
    vscode.window.showInformationMessage(`[MCP-SOVEREIGN] ${msg.text}`);
  } else if (msg.action === "highlight_lines") {
    // Example: Highlight lines in the active editor
    const editor = vscode.window.activeTextEditor;
    if (editor && editor.document.fileName === msg.file) {
      const decorationType = vscode.window.createTextEditorDecorationType({
        backgroundColor: msg.color || "rgba(255, 0, 0, 0.3)",
      });
      const range = new vscode.Range(msg.startLine, 0, msg.endLine, 0);
      editor.setDecorations(decorationType, [range]);
    }
  } else if (msg.action === "open_file_dialog") {
    vscode.window.showOpenDialog({}).then((uris) => {
      if (uris && uris.length > 0) {
        sendEvent("ide.dialog_result", { file: uris[0].fsPath });
      }
    });
  } else if (msg.action === "push_ghost_text") {
    global.mcpGhostText = {
      file: msg.file,
      line: msg.line,
      text: msg.text,
    };
    // Trigger inline suggestions to refresh
    vscode.commands.executeCommand("editor.action.inlineSuggest.trigger");
  } else if (msg.action === "open_webview") {
    vscode.commands.executeCommand("sovereign-nervous-system.showWebView");
  } else if (msg.action === "update_webview") {
    if (global.mcpWebviewPanel) {
      global.mcpWebviewPanel.webview.postMessage({
        type: "updateContent",
        html: msg.html,
      });
    }
  }
}

function deactivate() {
  if (wsClient) {
    wsClient.close();
  }
}

module.exports = {
  activate,
  deactivate,
};
