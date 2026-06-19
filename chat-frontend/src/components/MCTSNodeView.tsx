import React from 'react';

interface MCTSNode {
  id: string;
  action: string;
  uctScore: number;
  status: 'pending' | 'success' | 'failure';
}

interface MCTSNodeViewProps {
  nodes: MCTSNode[];
}

export const MCTSNodeView: React.FC<MCTSNodeViewProps> = ({ nodes }) => {
  return (
    <div className="my-3 p-4 bg-gray-900/60 backdrop-blur-md rounded-xl border border-gray-700/50 shadow-xl" dir="rtl">
      <div className="flex items-center space-x-2 space-x-reverse mb-3">
        <span className="text-blue-400">🧠</span>
        <h4 className="text-sm font-semibold text-gray-200">شجرة التفكير الشجري (MCTS Node View)</h4>
      </div>
      <div className="flex flex-col space-y-3 relative">
        <div className="absolute left-1/2 top-0 bottom-0 w-px bg-gray-700 -translate-x-1/2 z-0 hidden md:block"></div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 z-10">
          {nodes.map((node) => (
            <div 
              key={node.id}
              className={`p-3 rounded-lg border text-sm text-center transition-all ${
                node.status === 'success' 
                  ? 'bg-green-900/30 border-green-500/50 text-green-200 shadow-[0_0_15px_rgba(34,197,94,0.15)]' 
                  : node.status === 'failure'
                    ? 'bg-red-900/30 border-red-500/50 text-red-200'
                    : 'bg-gray-800 border-gray-600 text-gray-300'
              }`}
            >
              <div className="font-medium mb-1 truncate" title={node.action}>{node.action}</div>
              <div className="text-xs opacity-80 font-mono bg-black/30 rounded px-2 py-0.5 inline-block">
                UCT: {node.uctScore.toFixed(2)}
              </div>
              <div className="mt-2 text-[10px] uppercase tracking-wider font-bold">
                {node.status === 'success' ? '✓ مسار آمن' : node.status === 'failure' ? '✗ مرفوض' : '⟳ قيد الفحص'}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
