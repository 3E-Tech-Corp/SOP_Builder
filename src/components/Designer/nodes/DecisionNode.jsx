import React, { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { GitBranch } from 'lucide-react';

const DecisionNode = memo(({ data, selected }) => {
  const color = data.color || '#f59e0b';

  return (
    <div
      className={`px-4 py-3 rounded-xl border-2 shadow-lg min-w-[160px] text-center transition-all ${
        selected ? 'ring-2 ring-synthia-500 ring-offset-2 ring-offset-slate-900' : ''
      } ${data._active ? 'node-active' : ''}`}
      style={{
        background: `linear-gradient(135deg, ${color}22, ${color}11)`,
        borderColor: data._active ? '#fff' : color,
        clipPath: 'none',
      }}
    >
      <Handle type="target" position={Position.Top} />
      <div className="flex items-center justify-center gap-1.5">
        <GitBranch className="w-3.5 h-3.5" style={{ color }} />
        <span className="text-sm font-semibold text-slate-100">{data.label || 'Decision'}</span>
      </div>
      {data.description && (
        <p className="text-[10px] text-slate-400 mt-1 truncate max-w-[160px]">{data.description}</p>
      )}
      <Handle type="source" position={Position.Bottom} id="bottom" />
      <Handle type="source" position={Position.Left} id="left" style={{ top: '50%' }} />
      <Handle type="source" position={Position.Right} id="right" style={{ top: '50%' }} />
    </div>
  );
});

DecisionNode.displayName = 'DecisionNode';
export default DecisionNode;
