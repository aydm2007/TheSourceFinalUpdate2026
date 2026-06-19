/**
 * Sovereign MCP Healer (Global Map-Driven Recovery)
 * V51.0-Singularity
 * Wraps the execution of package/cli.js to intercept EOF and Stderr crashes.
 * Applies to ALL projects and remote clients globally.
 * Uses X-Ray Vision (source-map) for atomic error decoding.
 */
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const { SourceMapConsumer } = require('source-map');

const CLI_PATH = path.join(__dirname, 'package/cli.js');
const MAP_PATH = path.join(__dirname, 'package/cli.js.map');
const LEDGER_PATH = path.join(__dirname, '.agents/memory/shadow_ledger.jsonl');

function logToLedger(action, details) {
    const entry = {
        timestamp: new Date().toISOString(),
        action: action,
        details: details,
        enforcementMode: "STRICT",
        agent: "Sovereign_Healer"
    };
    try {
        if (!fs.existsSync(path.dirname(LEDGER_PATH))) {
            fs.mkdirSync(path.dirname(LEDGER_PATH), { recursive: true });
        }
        fs.appendFileSync(LEDGER_PATH, JSON.stringify(entry) + '\n');
    } catch (e) {
        console.error("[Healer] Failed to write to shadow ledger:", e);
    }
}

async function decodeStacktrace(errorBuffer) {
    try {
        if (!fs.existsSync(MAP_PATH)) return "Map file not found.";
        
        // Simple regex to catch standard Node.js stack traces pointing to cli.js
        const match = errorBuffer.match(/cli\.js:(\d+):(\d+)/);
        if (!match) return "Could not extract cli.js line/column from stacktrace.";
        
        const line = parseInt(match[1], 10);
        const column = parseInt(match[2], 10);

        const mapRaw = fs.readFileSync(MAP_PATH, 'utf8');
        const consumer = await new SourceMapConsumer(mapRaw);
        
        const originalPosition = consumer.originalPositionFor({
            line: line,
            column: column
        });
        
        consumer.destroy();
        
        if (originalPosition.source) {
            return `Source: ${originalPosition.source}, Line: ${originalPosition.line}, Name: ${originalPosition.name || 'N/A'}`;
        } else {
            return `Decoded position unknown for line ${line}:${column}`;
        }
    } catch (err) {
        return `Failed to decode map: ${err.message}`;
    }
}

function startMCP(args) {
    console.error("[Sovereign-Healer] Booting Global MCP Resilience Wrapper with X-Ray Vision...");
    
    const child = spawn('node', [CLI_PATH, ...args], {
        stdio: ['pipe', 'pipe', 'pipe']
    });

    process.stdin.pipe(child.stdin);
    child.stdout.pipe(process.stdout);

    let errorBuffer = "";

    child.stderr.on('data', (data) => {
        const msg = data.toString();
        errorBuffer += msg;
        process.stderr.write(data);
    });

    child.on('close', async (code) => {
        if (code !== 0 || errorBuffer.includes('EOF') || errorBuffer.includes('Error')) {
            console.error(`\n[Sovereign-Healer] 🚨 Crash detected (Code: ${code}). Initiating Map-Driven Healing...`);
            
            // X-Ray Vision: Map-Driven Healing
            let faultTrace = await decodeStacktrace(errorBuffer);
            console.error(`[Sovereign-Healer] 🔬 X-Ray Decoding Result: ${faultTrace}`);

            logToLedger("AUTO_RECONNECT", `Crash intercepted. Original Trace: ${faultTrace}. Error Context: ${errorBuffer.substring(0, 150)}...`);
            
            console.error("[Sovereign-Healer] 🔄 Auto-Reconnecting in 2000ms to preserve Zero-Downtime...");
            setTimeout(() => {
                process.stdin.unpipe(child.stdin);
                startMCP(args);
            }, 2000);
        } else {
            process.exit(code);
        }
    });

    child.on('error', (err) => {
        console.error("[Sovereign-Healer] 🚨 Child Process Error:", err);
        logToLedger("FATAL_ERROR", err.message);
        setTimeout(() => startMCP(args), 2000);
    });
}

const args = process.argv.slice(2);
startMCP(args);
