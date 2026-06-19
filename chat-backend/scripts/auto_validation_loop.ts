import { execSync } from 'child_process';
import path from 'path';

function run(command: string) {
  console.log(`\n=== Running: ${command} ===`);
  execSync(command, { stdio: 'inherit', cwd: path.resolve(__dirname, '..') });
}

try {
  // 1. Ensure DB schema is in sync (apply migrations if any)
  run('npx prisma db push');

  // 2. Start the backend with PM2 (restart to apply any changes)
  // Use a distinct PM2 process name to avoid conflicts
  run('pm2 delete Chat-Backend || true');
  run('pm2 start src/server.ts --name Chat-Backend');

  // Give the server a moment to start
  console.log('Waiting for server to start...');
  execSync('timeout 5', { stdio: 'ignore' });

  // 3. Run full certification suite
  run('npm run mcp-tools:certify:strict -- --full');
  run('npm run sovereign:90-sweep');
  run('npm run global:production-gate');

  console.log('\n✅ All certification commands completed successfully. System is 100/100 ready!');
  process.exit(0);
} catch (err) {
  console.error('\n❌ Validation loop failed:', err);
  process.exit(1);
}
