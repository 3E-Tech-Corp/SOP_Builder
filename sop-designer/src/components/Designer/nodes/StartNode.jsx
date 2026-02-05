import React, { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { Play } from 'lucide-react';

const StartNode = memo(({ data, selected }) => {
  return (
    <div
      className={`px-4 py-3 rounded-xl border-2 shadow-lg min-w-[140px] text-center transition-all ${
        selected ? 'ring-2 ring-synthia-500 ring-offset-2 ring-offset-slate-900' : ''
      }`}
      style={{
        background: 'linear-gradient(135deg, #166534, #14532d)',
        borderColor: data.color || '#22c55e',
      }}
    >
      <div className="flex items-center justify-center gap-1.5">
        <Play className="w-3.5 h-3.5 text-green-300" />
        <span className="text-sm font-semibold text-green-100">{data.label || 'Start'}</span>
      </div>
      {data.description && (
        <p className="text-[10px] text-green-300/70 mt-1 truncate max-w-[140px]">{data.description}</p>
      )}
      <Handle
        type="source"
        position={Position.Bottom}
        className="!bg-green-500 !border-green-300"
      />
    </div>
  );
});

StartNode.displayName = 'StartNode';
export default StartNode;
