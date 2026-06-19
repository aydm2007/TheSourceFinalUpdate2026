const fs = require('fs');
const path = require('path');

function fail(msg) {
  console.error('FAIL:', msg);
  process.exitCode = 1;
}

try {
  const root = __dirname;

  // 1) package.json parses
  const pkgPath = path.join(root, 'package.json');
  if (!fs.existsSync(pkgPath)) fail('package.json missing');
  JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
  console.log('OK: package.json parsed');

  // 2) extension.js syntax
  const extPath = path.join(root, 'extension.js');
  if (!fs.existsSync(extPath)) fail('extension.js missing');
  const code = fs.readFileSync(extPath, 'utf8');
  try { new Function(code); console.log('OK: extension.js syntax'); } catch (e) { fail('extension.js syntax error: '+e.message); }

  // 3) HTML files exist and contain expected markers
  const dash = path.join(root, 'dashboard_ui.html');
  const chat = path.join(root, 'chat_ui.html');
  if (!fs.existsSync(dash)) fail('dashboard_ui.html missing');
  if (!fs.existsSync(chat)) fail('chat_ui.html missing');
  const dh = fs.readFileSync(dash,'utf8');
  const ch = fs.readFileSync(chat,'utf8');
  if (!/Target Project/.test(dh)) fail('dashboard_ui.html missing Target Project text');
  if (!/Nexus Omega/.test(ch)) fail('chat_ui.html missing Nexus Omega text');
  console.log('OK: UI files present');

  // 4) skills folder readable (optional)
  const skillsDir = path.join(root, '..', '.agents', 'skills');
  if (fs.existsSync(skillsDir)) {
    const list = fs.readdirSync(skillsDir).filter(f => fs.lstatSync(path.join(skillsDir, f)).isDirectory());
    console.log('SKILLS:', list.length);
  } else {
    console.log('SKILLS: not present (optional)');
  }

  if (process.exitCode && process.exitCode !== 0) {
    console.error('One or more checks failed');
    process.exit(process.exitCode);
  }
  console.log('All quick checks passed.');
} catch (e) {
  fail('Unexpected error: '+e.message);
}
