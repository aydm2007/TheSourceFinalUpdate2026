/**
 * ConsensusGate — بوابة التصويت السيادية
 * =========================================
 * بدلاً من git commit، يصوّت N وكلاء على التعديل.
 * عند الأغلبية → FileEdit/FileWrite مباشرة في البيئة الحقيقية.
 * يعمل محلياً وعبر MCP Server Tools بشكل Remote.
 *
 * الاستخدام:
 *   const { ConsensusGate } = require('./core/consensus/ConsensusGate.js');
 *   const gate = new ConsensusGate();
 *   gate.vote('fix-v1', 'architect-agent', true, { file_path: 'src/x.js', old_string: 'a', new_string: 'b' });
 */

'use strict';
const fs   = require('fs');
const path = require('path');

class ConsensusGate {
  constructor(options = {}) {
    this.threshold   = parseInt(process.env.CONSENSUS_THRESHOLD || options.threshold || '2', 10);
    this.liveEdit    = process.env.LIVE_EDIT_MODE !== 'false' && process.env.SIMULATION_DRY_RUN !== 'true';
    this.ledgerPath  = process.env.CONSENSUS_LOG_PATH
      || options.ledgerPath
      || path.join(process.cwd(), '.nexus', 'var', 'telemetry', 'consensus_log.jsonl');
    this.shadowPath  = process.env.SHADOW_LEDGER_PATH
      || path.join(process.cwd(), '.nexus', 'var', 'telemetry', 'shadow_ledger.jsonl');
    this.proposals   = new Map(); // proposalId → ProposalState
  }

  // ─── Public API ───────────────────────────────────────────────────

  /**
   * وكيل يُصوّت على مقترح تعديل
   * @param {string}  proposalId - معرف فريد للمقترح
   * @param {string}  agentName  - اسم الوكيل
   * @param {boolean} approve    - true=موافقة, false=رفض
   * @param {object|null} patch  - { file_path, old_string?, new_string?, content? }
   * @returns {{ status, proposalId, approvals?, needed?, results? }}
   */
  vote(proposalId, agentName, approve, patch = null) {
    this._ensureProposal(proposalId);
    const p = this.proposals.get(proposalId);

    // منع التصويت المزدوج
    if (p.votes.some(v => v.agent === agentName)) {
      return { status: 'ALREADY_VOTED', proposalId };
    }

    p.votes.push({ agent: agentName, approve, ts: new Date().toISOString() });
    if (patch) p.patches.push(patch);

    const approvals   = p.votes.filter(v => v.approve).length;
    const rejections  = p.votes.filter(v => !v.approve).length;
    const totalNeeded = this.threshold;

    this._log('CONSENSUS_VOTE', { proposalId, agentName, approve, approvals, rejections });

    // تحقق: رفض قاطع — فقط عندما يستحيل الوصول للعتبة
    // (عدد الرفض وصل لنفس العتبة = يستحيل الموافقة)
    if (rejections >= totalNeeded) {
      this._log('CONSENSUS_REJECTED', { proposalId, votes: p.votes });
      this.proposals.delete(proposalId);
      return { status: 'REJECTED', proposalId, rejections };
    }

    // تحقق: أغلبية تمت
    if (approvals >= totalNeeded) {
      return this._applyPatches(proposalId, p.patches);
    }

    return { status: 'PENDING', proposalId, approvals, needed: totalNeeded - approvals };
  }

  /**
   * إنشاء مقترح جديد بدون تصويت (اختياري)
   */
  propose(proposalId, description = '') {
    this._ensureProposal(proposalId);
    this.proposals.get(proposalId).description = description;
    this._log('CONSENSUS_PROPOSED', { proposalId, description });
    return { status: 'PROPOSED', proposalId };
  }

  /**
   * قائمة المقترحات النشطة
   */
  listProposals() {
    const list = [];
    for (const [id, p] of this.proposals.entries()) {
      list.push({
        id,
        description: p.description,
        approvals: p.votes.filter(v => v.approve).length,
        rejections: p.votes.filter(v => !v.approve).length,
        patches: p.patches.length,
        threshold: this.threshold
      });
    }
    return list;
  }

  // ─── Private ──────────────────────────────────────────────────────

  _ensureProposal(proposalId) {
    if (!this.proposals.has(proposalId)) {
      this.proposals.set(proposalId, {
        votes: [], patches: [], description: '', created: Date.now()
      });
    }
  }

  _applyPatches(proposalId, patches) {
    if (!this.liveEdit) {
      this._log('CONSENSUS_DRY_RUN', { proposalId, patches });
      this.proposals.delete(proposalId);
      return { status: 'DRY_RUN', proposalId, patches };
    }

    const results = [];

    for (const patch of patches) {
      try {
        const filePath = path.isAbsolute(patch.file_path)
          ? patch.file_path
          : path.join(process.cwd(), patch.file_path);

        if (patch.content !== undefined) {
          // ── FileWrite ─────────────────────────────────────────────
          const dir = path.dirname(filePath);
          if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
          fs.writeFileSync(filePath, patch.content, 'utf8');
          results.push({ file: patch.file_path, op: 'WRITE', status: 'OK' });
          this._log('CONSENSUS_WRITE', { proposalId, file: patch.file_path });

        } else if (patch.old_string !== undefined && patch.new_string !== undefined) {
          // ── FileEdit ─────────────────────────────────────────────
          if (!fs.existsSync(filePath)) {
            results.push({ file: patch.file_path, op: 'EDIT', status: 'FILE_NOT_FOUND' });
            continue;
          }
          const current = fs.readFileSync(filePath, 'utf8');
          if (!current.includes(patch.old_string)) {
            results.push({ file: patch.file_path, op: 'EDIT', status: 'OLD_STRING_NOT_FOUND' });
            continue;
          }
          const updated = current.replace(patch.old_string, patch.new_string);
          fs.writeFileSync(filePath, updated, 'utf8');
          results.push({ file: patch.file_path, op: 'EDIT', status: 'OK' });
          this._log('CONSENSUS_EDIT', { proposalId, file: patch.file_path });

        } else {
          results.push({ file: patch.file_path, op: 'UNKNOWN', status: 'INVALID_PATCH' });
        }
      } catch (err) {
        results.push({ file: patch.file_path, status: 'ERROR', error: err.message });
        this._log('CONSENSUS_ERROR', { proposalId, file: patch.file_path, error: err.message });
      }
    }

    this.proposals.delete(proposalId);
    this._log('CONSENSUS_APPLIED', { proposalId, results });
    return { status: 'APPLIED', proposalId, results };
  }

  _log(action, data) {
    const entry = JSON.stringify({
      timestamp: new Date().toISOString(),
      source: 'ConsensusGate',
      action,
      ...data
    }) + '\n';

    // كتابة في consensus_log
    try {
      const dir = path.dirname(this.ledgerPath);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      fs.appendFileSync(this.ledgerPath, entry);
    } catch { /* non-critical */ }

    // كتابة في shadow_ledger أيضاً للتوافق السيادي
    try {
      const dir = path.dirname(this.shadowPath);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      fs.appendFileSync(this.shadowPath, entry);
    } catch { /* non-critical */ }
  }
}

module.exports = { ConsensusGate };
