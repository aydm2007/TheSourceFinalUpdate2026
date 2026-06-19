const fileHandlers = require('./core/bridge/handlers/file_handlers.js');
const fs = require('fs');
const path = require('path');

const context = {
    AgentContext: { register: () => {}, readFiles: new Set([path.resolve('test_escalation.js')]) },
    logShadow: console.error,
    applyTokenGuard: (text) => text,
    orchestrator: { fileWrite: () => {} }
};

async function test() {
    console.error("=== Test FileRead Auto-Dependency ===");
    fs.writeFileSync('test_escalation.js', 'import { x } from "y";\nconsole.error("hello");', 'utf8');
    const readRes = await fileHandlers.FileRead({ file_path: 'test_escalation.js', limit: 10 }, context);
    console.error(readRes);

    console.error("=== Test FileEdit Escalation 1 ===");
    const res1 = await fileHandlers.FileEdit({ file_path: 'test_escalation.js', old_string: 'console.error("hello");', new_string: 'console.error("hello"' }, context);
    console.error(res1);

    console.error("=== Test FileEdit Escalation 2 ===");
    const res2 = await fileHandlers.FileEdit({ file_path: 'test_escalation.js', old_string: 'console.error("hello");', new_string: 'console.error("hello"' }, context);
    console.error(res2);
}
test();
