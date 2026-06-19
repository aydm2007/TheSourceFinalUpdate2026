/**
 * محرك اختبار السرب الداخلي — Sovereign Labs Swarm Runner
 * =========================================================
 * يُطلق 3 وكلاء متخصصين على مشروع Labs، يجمع آراءهم عبر ConsensusGate
 * ثم يطبّق التعديلات مباشرة في البيئة الحقيقية بعد تصويت الأغلبية.
 *
 * الاستخدام:
 *   node labs/swarm_test_runner.js                    → chess-engine (افتراضي)
 *   node labs/swarm_test_runner.js todo-system
 *   node labs/swarm_test_runner.js skill-forge --skill=my-skill
 */

'use strict';
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const fs   = require('fs');
const path = require('path');
const { ConsensusGate } = require('../core/consensus/ConsensusGate.js');

// ─── تعريفات الأسراب لكل مشروع ───────────────────────────────────────────────

const SWARM_PROFILES = {
  'chess-engine': {
    description: 'لعبة شطرنج — اختبار سرب UI + Logic + Debugger',
    agents: [
      { name: 'ui-synthesizer',   role: 'واجهة المستخدم',   approve: true },
      { name: 'quantum-debugger', role: 'تتبع الأداء',      approve: true },
      { name: 'security-audit',   role: 'فحص الأمان',       approve: true }
    ],
    patches: [
      {
        file_path: 'labs/chess-engine/BOARD_STATE.json',
        content: JSON.stringify({
          board: Array(8).fill(null).map(() => Array(8).fill(null)),
          turn: 'white',
          moves: [],
          created: new Date().toISOString()
        }, null, 2)
      },
      {
        file_path: 'labs/chess-engine/index.js',
        content: `'use strict';
/**
 * Chess Engine — محرك الشطرنج السيادي
 * تم توليده بواسطة سرب: ui-synthesizer + quantum-debugger + security-audit
 * تاريخ التوليد: ${new Date().toISOString()}
 */
const BOARD_SIZE = 8;
const PIECES = { K:'♔', Q:'♕', R:'♖', B:'♗', N:'♘', P:'♙', k:'♚', q:'♛', r:'♜', b:'♝', n:'♞', p:'♟' };

function initBoard() {
  const b = Array(8).fill(null).map(() => Array(8).fill(null));
  // الصف الأول (أسود)
  b[0] = ['r','n','b','q','k','b','n','r'];
  b[1] = Array(8).fill('p');
  // الصف الأخير (أبيض)
  b[7] = ['R','N','B','Q','K','B','N','R'];
  b[6] = Array(8).fill('P');
  return b;
}

function boardToString(board) {
  return board.map((row, i) =>
    \`\${8 - i} \` + row.map(p => PIECES[p] || '·').join(' ')
  ).join('\\n') + '\\n  a b c d e f g h';
}

module.exports = { BOARD_SIZE, PIECES, initBoard, boardToString };

// تشغيل مباشر
if (require.main === module) {
  const board = initBoard();
  console.log('\\n♟️  لوحة الشطرنج السيادية:\\n');
  console.log(boardToString(board));
}
`
      }
    ]
  },

  'todo-system': {
    description: 'نظام مهام — اختبار سرب DB + API + UI',
    agents: [
      { name: 'django-doctor',  role: 'منطق الأعمال', approve: true },
      { name: 'db-forensics',   role: 'تدقيق البيانات', approve: true },
      { name: 'react-surgeon',  role: 'الواجهة',       approve: true }
    ],
    patches: [
      {
        file_path: 'labs/todo-system/schema.json',
        content: JSON.stringify({
          entities: { Task: { fields: { id:'uuid', title:'string', done:'boolean', created_at:'timestamp' } } },
          version: '1.0.0',
          generated: new Date().toISOString()
        }, null, 2)
      },
      {
        file_path: 'labs/todo-system/app.js',
        content: `'use strict';
/**
 * Todo System — نظام المهام السيادي
 * تم توليده بواسطة سرب: django-doctor + db-forensics + react-surgeon
 * تاريخ التوليد: ${new Date().toISOString()}
 */
const todos = [];
let nextId = 1;

const api = {
  add:    (title) => { const t = { id: nextId++, title, done: false, created: Date.now() }; todos.push(t); return t; },
  done:   (id)    => { const t = todos.find(x => x.id === id); if (t) t.done = true; return t; },
  remove: (id)    => { const i = todos.findIndex(x => x.id === id); if (i > -1) todos.splice(i, 1); return true; },
  list:   ()      => [...todos],
  stats:  ()      => ({ total: todos.length, done: todos.filter(t => t.done).length })
};

module.exports = { api };

if (require.main === module) {
  api.add('مهمة اختبار السرب الأولى');
  api.add('التحقق من ConsensusGate');
  api.done(1);
  console.log('📋 قائمة المهام:', api.list());
  console.log('📊 الإحصاء:', api.stats());
}
`
      }
    ]
  },

  'skill-forge': {
    description: 'ورشة بناء مهارة جديدة ذاتياً',
    agents: [
      { name: 'evolution-replicator', role: 'بناء المهارة',    approve: true },
      { name: 'documentation-governor', role: 'توثيق المهارة', approve: true },
      { name: 'security-audit',        role: 'فحص الأمان',     approve: true }
    ],
    patches: [] // يُملأ ديناميكياً حسب اسم المهارة
  }
};

// ─── محرك التشغيل الرئيسي ─────────────────────────────────────────────────────

async function runLabsSwarm(projectName = 'chess-engine', options = {}) {
  const profile = SWARM_PROFILES[projectName];
  if (!profile) {
    const available = Object.keys(SWARM_PROFILES).join(', ');
    throw new Error(`مشروع غير معروف: "${projectName}". المتاح: ${available}`);
  }

  const gate        = new ConsensusGate();
  const proposalId  = `labs-${projectName}-${Date.now()}`;
  const labsRoot    = process.env.LABS_ROOT || './labs';

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`🐝  Sovereign Labs Swarm Runner`);
  console.log(`📁  المشروع   : ${projectName}`);
  console.log(`🎯  الهدف     : ${profile.description}`);
  console.log(`🗳️  عتبة التصويت: ${gate.threshold} وكيل`);
  console.log(`📝  معرف المقترح: ${proposalId}`);
  console.log(`⚙️  وضع التشغيل: ${gate.liveEdit ? 'LIVE (تعديل حقيقي)' : 'DRY-RUN'}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  // إنشاء مجلد المشروع إن لم يوجد
  const projectPath = path.join(labsRoot, projectName);
  if (!fs.existsSync(projectPath)) {
    fs.mkdirSync(projectPath, { recursive: true });
    console.log(`📂 تم إنشاء مجلد: ${projectPath}`);
  }

  // تصويت الوكلاء بالتوالي
  let finalResult = null;
  for (let i = 0; i < profile.agents.length; i++) {
    const agent = profile.agents[i];
    const isFirstAgent = i === 0;

    console.log(`🤖 [وكيل ${i + 1}/${profile.agents.length}] ${agent.name} — ${agent.role}`);

    let result;
    if (isFirstAgent && profile.patches.length > 0) {
      // الوكيل الأول: يقترح المشروع ويُضيف جميع الـ patches دفعة واحدة
      gate.propose(proposalId, profile.description);
      // أضف الـ patches للمقترح يدوياً قبل التصويت
      const proposal = gate.proposals.get(proposalId);
      if (proposal) {
        profile.patches.forEach(p => proposal.patches.push(p));
      }
      // صوّت بدون patch (تم إضافتها يدوياً)
      result = gate.vote(proposalId, agent.name, agent.approve, null);
    } else {
      result = gate.vote(proposalId, agent.name, agent.approve, null);
    }

    console.log(`   الحالة: ${result?.status || 'VOTED'}\n`);
    finalResult = result;

    if (result?.status === 'APPLIED' || result?.status === 'DRY_RUN') break;
    if (result?.status === 'REJECTED') break;

    await new Promise(r => setTimeout(r, 100));
  }

  // ─── النتيجة النهائية ──────────────────────────────────────────────
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  if (finalResult?.status === 'APPLIED') {
    console.log('✅ تم تطبيق التعديلات مباشرة في البيئة الحقيقية!\n');
    if (finalResult.results) {
      console.log('📄 الملفات المعدّلة:');
      finalResult.results.forEach(r => {
        const icon = r.status === 'OK' ? '✅' : '❌';
        console.log(`   ${icon} [${r.op}] ${r.file} — ${r.status}`);
      });
    }
  } else if (finalResult?.status === 'DRY_RUN') {
    console.log('🔍 Dry-Run: لم تُطبَّق أي تعديلات (SIMULATION_DRY_RUN=true)');
  } else if (finalResult?.status === 'REJECTED') {
    console.log('❌ المقترح رُفض من قبل السرب');
  } else {
    console.log(`⏳ الحالة: ${finalResult?.status} — يحتاج ${finalResult?.needed} أصوات إضافية`);
  }

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  return finalResult;
}

// ─── نقطة الدخول ───────────────────────────────────────────────────────────────
if (require.main === module) {
  const args       = process.argv.slice(2);
  const project    = args[0] || 'chess-engine';
  const skillFlag  = args.find(a => a.startsWith('--skill='));
  const skillName  = skillFlag ? skillFlag.split('=')[1] : null;

  runLabsSwarm(project, { skillName })
    .then(result => {
      process.exit(result?.status === 'APPLIED' || result?.status === 'DRY_RUN' ? 0 : 1);
    })
    .catch(err => {
      console.error('💥 خطأ في تشغيل السرب:', err.message);
      process.exit(1);
    });
}

module.exports = { runLabsSwarm, SWARM_PROFILES };
