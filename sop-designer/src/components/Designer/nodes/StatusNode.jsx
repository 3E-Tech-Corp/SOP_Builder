import React, { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { Circle, Bell, Clock } from 'lucide-react';

const StatusNode = memo(({ data, selected }) => {
  const color = data.color || '#8B5CF6';
  const hasNotifications = data.notifications && Object.values(data.notifications).some(n => n?.enabled);
  const hasSLA = data.slaHours && data.slaHours > 0;

  return (
    <div
      className={`px-4 py-3 rounded-xl border-2 shadow-lg min-w-[160px] transition-all ${
        selected ? 'ring-2 ring-synthia-500 ring-offset-2 ring-offset-slate-900' : ''
      } ${data._active ? 'node-active' : ''}`}
      style={{
        background: `linear-gradient(135deg, ${color}22, ${color}11)`,
        borderColor: data._active ? '#fff' : color,
        backgroundColor: `${color}15`,
      }}
    >
      <Handle type="target" position={Position.Top} />
      <div className="flex items-center justify-center gap-1.5">
        <Circle className="w-3 h-3" style={{ color }} fill={color} />
        <span className="text-sm font-semibold text-slate-100">{data.label || 'Status'}</span>
      </div>
      {data.description && (
        <p className="text-[10px] text-slate-400 mt-1 truncate max-w-[160px] text-center">{data.description}</p>
      )}
      <div className="flex items-center justify-center gap-2 mt-1.5">
        {hasSLA && (
          <span className="flex items-center gap-0.5 text-[9px] text-amber-400">
            <Clock className="w-2.5 h-2.5" />
            {data.slaHours}h
          </span>
        )}
        {hasNotifications && (
          <span className="flex items-center gap-0.5 text-[9px] text-blue-400">
            <Bell className="w-2.5 h-2.5" />
          </span>
        )}
      </div>
      <Handle type="source" position={Position.Bottom} />
    </div>
  );
});

StatusNode.displayName = 'StatusNode';
export default StatusNode;
