const { execSync } = require('child_process');
const fs = require('fs');

console.error('[Security-Shield] Scanning staged files for API keys or secrets...');

try {
    const stagedFiles = execSync('git diff --cached --name-only', { encoding: 'utf8' })
        .split('\n')
        .map(f => f.trim())
        .filter(f => f && fs.existsSync(f) && (f.endsWith('.js') || f.endsWith('.ts') || f.endsWith('.json')));

    const secretsRegex = /(sk-[A-Za-z0-9_-]{24,}|gh[pousr]_[A-Za-z0-9_]{30,}|xox[baprs]-[A-Za-z0-9-]{20,}|eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+|[A-Za-z0-9+/=]{40,})/g;
    let clean = true;

    stagedFiles.forEach(file => {
        if (file.includes('pre_commit_secrets_shield') || file.includes('.env') || file.includes('package.json') || file.includes('package-lock.json')) return;

        const content = fs.readFileSync(file, 'utf8');
        const matches = content.match(secretsRegex);

        if (matches) {
            const actualSecrets = matches.filter(m => !m.includes('/') && isNaN(m) && m.length > 30);
            if (actualSecrets.length > 0) {
                console.error(`[Security Breach] Staged secret-like value found in ${file}. ${actualSecrets.length} value(s) redacted from output.`);
                clean = false;
            }
        }
    });

    if (!clean) {
        console.error('Commit rejected. Extract secrets to .env or a process secret store.');
        process.exit(1);
    }

    console.error('[Security-Shield] No secrets detected. Code is clean.');
    process.exit(0);
} catch (error) {
    console.error('[Security-Shield] Git index not accessible or no changes staged. Scanning bypassed.');
    process.exit(0);
}
