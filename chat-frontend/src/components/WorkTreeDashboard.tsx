import React from 'react';

interface SandboxStatus {
  taskId: string;
  filesLocked: string[];
  status: 'active' | 'merging' | 'rolled_back';
}

interface WorkTreeDashboardProps {
  sandboxes: SandboxStatus[];
  onRollback: (taskId: string) => void;
}

export const WorkTreeDashboard: React.FC<WorkTreeDashboardProps> = ({ sandboxes, onRollback }) => {
  if (sandboxes.length === 0) return null;

  return (
    <div className="fixed top-20 right-4 w-72 bg-slate-900/80 backdrop-blur-xl border border-slate-700/60 rounded-xl p-4 shadow-2xl z-50 transition-all duration-500 hover:bg-slate-900/95" dir="rtl">
      <div className="flex items-center justify-between mb-4 border-b border-slate-700 pb-2">
        <h3 className="text-sm font-bold text-slate-200 flex items-center">
          <span className="ml-2 text-orange-400">🛡️</span> البيئات المعزولة النشطة
        </h3>
        <span className="bg-orange-500/20 text-orange-400 text-[10px] px-2 py-0.5 rounded-full font-bold tracking-widest">
          LIVE
        </span>
      </div>

      <div className="space-y-3 max-h-[60vh] overflow-y-auto custom-scrollbar">
        {sandboxes.map(sandbox => (
          <div key={sandbox.taskId} className="bg-slate-800/60 rounded-lg p-3 border border-slate-700/50">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs font-mono text-slate-300">#{sandbox.taskId}</span>
              <span className={`text-[10px] px-1.5 py-0.5 rounded-sm ${
                sandbox.status === 'active' ? 'bg-blue-500/20 text-blue-400' :
                sandbox.status === 'merging' ? 'bg-purple-500/20 text-purple-400' :
                'bg-red-500/20 text-red-400'
              }`}>
                {sandbox.status.toUpperCase()}
              </span>
            </div>
            
            <div className="mb-3">
              <div className="text-[10px] text-slate-400 mb-1">أقفال AST النشطة (Locks):</div>
              <ul className="text-[11px] text-slate-300 font-mono bg-black/40 rounded p-1.5 list-disc list-inside space-y-1">
                {sandbox.filesLocked.map((file, i) => (
                  <li key={i} className="truncate" title={file}>{file}</li>
                ))}
                {sandbox.filesLocked.length === 0 && (
                  <li className="text-slate-500 italic">لا توجد أقفال</li>
                )}
              </ul>
            </div>

            <button
              onClick={() => onRollback(sandbox.taskId)}
              disabled={sandbox.status !== 'active'}
              className="w-full bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 text-xs py-1.5 rounded transition-colors flex items-center justify-center space-x-1 space-x-reverse disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span>🚨</span>
              <span>هدم فوري (Emergency Rollback)</span>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
