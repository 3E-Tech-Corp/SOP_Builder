import React, { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { Square } from 'lucide-react';

const EndNode = memo(({ data, selected }) => {
  return (
    <div
      className={`px-4 py-3 rounded-xl border-2 shadow-lg min-w-[140px] text-center transition-all ${
        selected ? 'ring-2 ring-synthia-500 ring-offset-2 ring-offset-slate-900' : ''
      } ${data._active ? 'node-active' : ''}`}
      style={{
        background: 'linear-gradient(135deg, #7f1d1d, #991b1b)',
        borderColor: data._active ? '#fff' : (data.color || '#ef4444'),
      }}
    >
      <Handle type="target" position={Position.Top} />
      <div className="flex items-center justify-center gap-1.5">
        <Square className="w-3 h-3 text-red-300" fill="currentColor" />
        <span className="text-sm font-semibold text-red-100">{data.label || 'End'}</span>
      </div>
      {data.description && (
        <p className="text-[10px] text-red-300/70 mt-1 truncate max-w-[140px]">{data.description}</p>
      )}
    </div>
  );
});

EndNode.displayName = 'EndNode';
export default EndNode;
