const fs = require('fs');
const path = require('path');

const scratchDir = path.join(__dirname, '../scratch');
const workspaceDir = path.join(__dirname, '..');

function extractAndHeal() {
    console.log("🛠️ [Sovereign Healer] Scanning agent scratch files for hallucinated FileWrite tools...");
    
    if (!fs.existsSync(scratchDir)) return;
    
    const files = fs.readdirSync(scratchDir).filter(f => f.startsWith('task_agent_') && f.endsWith('.json'));
    let healedCount = 0;
    
    for (const file of files) {
        const filePath = path.join(scratchDir, file);
        try {
            const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
            const content = data.error || data.output || "";
            
            // Find "[Final Response]: " or similar indicator
            let jsonStart = content.indexOf('{"tool":"FileWrite"');
            if (jsonStart === -1) jsonStart = content.indexOf('{\n  "tool": "FileWrite"');
            if (jsonStart === -1) jsonStart = content.indexOf('{\n  "tool":"FileWrite"');
            
            if (jsonStart !== -1) {
                // Try to parse the rest of the string as JSON.
                // We'll extract substring starting from jsonStart, and find the matching closing brace.
                let braceCount = 0;
                let jsonEnd = -1;
                for (let i = jsonStart; i < content.length; i++) {
                    if (content[i] === '{') braceCount++;
                    if (content[i] === '}') {
                        braceCount--;
                        if (braceCount === 0) {
                            jsonEnd = i + 1;
                            break;
                        }
                    }
                }
                
                if (jsonEnd !== -1) {
                    try {
                        const toolCall = JSON.parse(content.substring(jsonStart, jsonEnd));
                        if (toolCall.args && toolCall.args.file_path && toolCall.args.content) {
                            const targetPath = path.join(workspaceDir, toolCall.args.file_path);
                            const targetDir = path.dirname(targetPath);
                            
                            if (!fs.existsSync(targetDir)) {
                                fs.mkdirSync(targetDir, { recursive: true });
                            }
                            
                            fs.writeFileSync(targetPath, toolCall.args.content);
                            console.log(`✅ [HEALED] Extracted and wrote file: ${toolCall.args.file_path}`);
                            healedCount++;
                        }
                    } catch(e) {}
                }
            }
        } catch(e) {}
    }
    
    console.log(`\n🎉 [Sovereign Healer] Auto-healing loop complete. Fixed ${healedCount} files.`);
}

extractAndHeal();
