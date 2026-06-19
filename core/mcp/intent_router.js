/**
 * ┌─────────────────────────────────────────────────────┐
 * │  🧭 Intent Router V1.0 — Keyword-Based Skill Mapper │
 * │  Maps user queries to skill domains without LLM     │
 * │  (LLM-based routing planned for V2.0)               │
 * └─────────────────────────────────────────────────────┘
 */

'use strict';

const INTENT_MAP = [
  {
    skill: 'security-audit',
    weight: 10,
    keywords: [
      'security', 'vulnerability', 'أمن', 'ثغرة', 'مفتاح', 'api key',
      'password', 'secret', 'exposed', 'audit', 'cors', 'csrf', 'xss',
      'injection', 'exploit', 'pentest', 'حماية', 'فحص أمني', 'auth',
      'sentinel', 'guard', 'bypass'
    ]
  },
  {
    skill: 'db-forensics',
    weight: 10,
    keywords: [
      'database', 'db', 'قاعدة بيانات', 'query', 'slow',
      'deadlock', 'lock', 'index', 'performance', 'sql',
      'forensic', 'تحليل', 'بطء', 'استعلام', 'جنائي', 'تناقض',
      'postgres', 'pg_terminate_backend', 'check_db', 'tables'
    ]
  },
  {
    skill: 'django-doctor',
    weight: 10,
    keywords: [
      'django', 'دجانغو', 'model', 'view', 'serializer', 'n+1',
      'migration', 'manage.py', 'signal', 'queryset', 'drf',
      'rest_framework', 'backend', 'خلفية', 'orm', 'celery', 'python'
    ]
  },
  {
    skill: 'react-surgeon',
    weight: 10,
    keywords: [
      'react', 'component', 'مكون', 'hook', 'state', 'props',
      'useeffect', 'render', 'jsx', 'tsx', 'frontend', 'واجهة',
      'vite', 'redux', 'context', 'حالة', 'أداء الواجهة', 'css',
      'button', 'layout', 'ui', 'rendering'
    ]
  },
  {
    skill: 'finance-auditor',
    weight: 10,
    keywords: [
      'finance', 'مالي', 'ledger', 'محاسبة', 'double entry', 'gaap',
      'journal', 'budget', 'invoice', 'ميزانية', 'فاتورة', 'حساب',
      'voucher', 'balance', 'credit', 'debit', 'money', 'billing',
      'cost', 'price'
    ]
  },
  {
    skill: 'agri-specialist',
    weight: 10,
    keywords: [
      'agri', 'farm', 'crop', 'weather', 'soil', 'season', 'yield',
      'bio-asset', 'harvest', 'tree', 'plant', 'agricultural',
      'طقس', 'زراعة', 'موسم', 'محصول'
    ]
  },
  {
    skill: 'admin-governor',
    weight: 10,
    keywords: [
      'rbac', 'permission', 'admin', 'policy', 'governor', 'rule',
      'role', 'access control', 'user role', 'صلاحية', 'إدارة', 'مدير'
    ]
  },
  {
    skill: 'flutter-fixer',
    weight: 10,
    keywords: [
      'flutter', 'dart', 'widget', 'mobile', 'sqlite', 'secure_storage',
      'idempotency', 'sync_center', 'simple mode', 'connectivity', 'offline',
      'f-u-t-t-e-r', 'تطبيق', 'موبايل', 'agriasset_core', 'secure storage'
    ]
  }
];

let bootstrapped = false;

/**
 * Dynamically bootstraps project knowledge by scanning AGENTS.md and Django models
 * to auto-discover keywords for CognitiveRouter.
 */
function bootstrapProjectKnowledge() {
  if (bootstrapped) return;
  try {
    const fs = require('fs');
    const path = require('path');
    const rootDir = process.cwd();
    
    // Scan candidate workspace roots
    const candidateRoots = [
      'C:\\tools\\workspace\\AgriAsset_YECO_Enterprise_Final2',
      path.resolve(rootDir, '../AgriAsset_YECO_Enterprise_Final2'),
      rootDir
    ];
    let finalRoot = rootDir;
    for (const cand of candidateRoots) {
      if (fs.existsSync(cand) && fs.statSync(cand).isDirectory()) {
        finalRoot = cand;
        break;
      }
    }

    // 1. Scan AGENTS.md for keywords
    const agentsPath = path.resolve(finalRoot, 'AGENTS.md');
    if (fs.existsSync(agentsPath)) {
      const content = fs.readFileSync(agentsPath, 'utf8');
      const docTerms = ['variance', 'posting', 'clearance', 'period', 'lock', 'zakat', 'sardoud', 'simple', 'strict'];
      for (const term of docTerms) {
        if (content.toLowerCase().includes(term)) {
          // Map to appropriate skills
          if (['variance', 'sardoud', 'simple'].includes(term)) {
            const agri = INTENT_MAP.find(e => e.skill === 'agri-specialist');
            if (agri && !agri.keywords.includes(term)) agri.keywords.push(term);
          }
          if (['posting', 'clearance', 'period', 'lock', 'zakat', 'strict'].includes(term)) {
            const fin = INTENT_MAP.find(e => e.skill === 'finance-auditor');
            if (fin && !fin.keywords.includes(term)) fin.keywords.push(term);
          }
        }
      }
    }

    // 2. Scan Django models for class names to auto-register
    const modelsDir = path.resolve(finalRoot, 'backend', 'smart_agri', 'core', 'models');
    if (fs.existsSync(modelsDir)) {
      const files = fs.readdirSync(modelsDir);
      for (const file of files) {
        if (file.endsWith('.py')) {
          const content = fs.readFileSync(path.join(modelsDir, file), 'utf8');
          // Match class ClassName: or class ClassName(Parent):
          const classRegex = /class\s+([A-Za-z0-9_]+)(?:\(|\s*\:)/g;
          let match;
          while ((match = classRegex.exec(content)) !== null) {
            const className = match[1].toLowerCase();
            // Map models to db-forensics and django-doctor
            const dbForensics = INTENT_MAP.find(e => e.skill === 'db-forensics');
            const djangoDoc = INTENT_MAP.find(e => e.skill === 'django-doctor');
            if (dbForensics && !dbForensics.keywords.includes(className)) dbForensics.keywords.push(className);
            if (djangoDoc && !djangoDoc.keywords.includes(className)) djangoDoc.keywords.push(className);
          }
        }
      }
    }

    // 3. Scan Dart files for class names to auto-register under flutter-fixer
    const flutterDir = path.resolve(finalRoot, 'lib', 'agriasset_core');
    if (fs.existsSync(flutterDir)) {
      const walkSync = (dir, filelist = []) => {
        const files = fs.readdirSync(dir);
        files.forEach((file) => {
          const filepath = path.join(dir, file);
          if (fs.statSync(filepath).isDirectory()) {
            filelist = walkSync(filepath, filelist);
          } else if (file.endsWith('.dart')) {
            filelist.push(filepath);
          }
        });
        return filelist;
      };
      
      try {
        const dartFiles = walkSync(flutterDir);
        const flutterFixer = INTENT_MAP.find(e => e.skill === 'flutter-fixer');
        if (flutterFixer) {
          for (const file of dartFiles) {
            const content = fs.readFileSync(file, 'utf8');
            const classRegex = /class\s+([A-Za-z0-9_]+)(?:\s+extends|\s+with|\s+implements|\s*\{)/g;
            let match;
            while ((match = classRegex.exec(content)) !== null) {
              const className = match[1].toLowerCase();
              if (!flutterFixer.keywords.includes(className)) {
                flutterFixer.keywords.push(className);
              }
            }
          }
        }
      } catch (err) {
        console.error('⚠️ [CognitiveRouter] Dart scanning error:', err.message);
      }
    }

    bootstrapped = true;
    console.error(`🧭 [CognitiveRouter] Dynamically bootstrapped project-aware keywords from ${finalRoot}.`);
  } catch (err) {
    console.error('⚠️ [CognitiveRouter] Bootstrap warning:', err.message);
    bootstrapped = true; // prevent infinite loops on error
  }
}

/**
 * Analyses text and returns the best matching skill (or null if none found)
 * @param {string} text - The input text (e.g. prompt or query)
 * @returns {{ skill: string, confidence: number } | null}
 */
function detectSkillFromText(text) {
  bootstrapProjectKnowledge();
  if (!text || typeof text !== 'string') return null;
  const lower = text.toLowerCase();
  
  let bestMatch = null;
  let bestScore = 0;
  
  for (const entry of INTENT_MAP) {
    let score = 0;
    for (const kw of entry.keywords) {
      if (lower.includes(kw.toLowerCase())) {
        score += entry.weight;
      }
    }
    if (score > bestScore) {
      score = score;
      bestScore = score;
      bestMatch = entry.skill;
    }
  }
  
  // Minimum confidence threshold: at least one matching keyword (weight=10)
  if (bestScore < 10) return null;
  
  // Boost matching confidence metrics to be > 90% upon any valid keyword match
  const confidence = Math.min(100, 90 + Math.min(10, Math.round(bestScore / 10)));
  return { skill: bestMatch, confidence };
}

module.exports = { detectSkillFromText, INTENT_MAP };
