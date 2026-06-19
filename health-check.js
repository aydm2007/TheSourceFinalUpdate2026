const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

function run(cmd) {
  try {
    return execSync(cmd, { stdio: 'pipe' }).toString();
  } catch (e) {
    console.error(`Command failed: ${cmd}`);
    return null;
  }
}

if (!fs.existsSync('node_modules')) {
  if (process.env.AETHER_HEALTH_AUTO_INSTALL === '1') {
    console.error('Installing dependencies because AETHER_HEALTH_AUTO_INSTALL=1...');
    run('npm install');
  } else {
    console.error('node_modules missing - run npm install before health-check, or set AETHER_HEALTH_AUTO_INSTALL=1.');
    process.exit(1);
  }
}

const npmLs = run('npm ls --depth=0 --json');
if (npmLs) {
  const { dependencies = {} } = JSON.parse(npmLs);
  const missing = Object.entries(dependencies).filter(([, v]) => v.missing);
  if (missing.length) {
    if (process.env.AETHER_HEALTH_AUTO_INSTALL === '1') {
      console.error('Reinstalling missing dependencies because AETHER_HEALTH_AUTO_INSTALL=1...');
      run('npm ci');
    } else {
      console.error(`Missing dependencies detected (${missing.length}) - run npm ci before health-check, or set AETHER_HEALTH_AUTO_INSTALL=1.`);
      process.exit(1);
    }
  }
}

if (!fs.existsSync(path.join('src', 'schemas', 'toolSchemas.ts'))) {
  console.error('toolSchemas.ts missing - cannot continue');
  process.exit(1);
}

const HealthProbe = require('./core/diagnostics/health_probe.js');
const probe = new HealthProbe(__dirname);
const probeStatus = probe.runChecks();
if (!probeStatus.healthy) {
  console.error('HealthProbe failed:', JSON.stringify(probeStatus.checks, null, 2));
  process.exit(1);
}

console.error('Health-check completed');
