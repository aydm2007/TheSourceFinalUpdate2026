console.log('Running test:worktree');
require('child_process').execSync('npm test', { stdio: 'inherit' });