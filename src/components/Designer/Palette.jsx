import React from 'react';
import { Play, Circle, GitBranch, Square } from 'lucide-react';

const nodeTypes = [
  {
    type: 'start',
    label: 'Start',
    icon: Play,
    color: '#22c55e',
    bgColor: 'bg-green-500/10',
    borderColor: 'border-green-500/30',
    textColor: 'text-green-400',
    description: 'Entry point',
  },
  {
    type: 'status',
    label: 'Status',
    icon: Circle,
    color: '#8B5CF6',
    bgColor: 'bg-synthia-500/10',
    borderColor: 'border-synthia-500/30',
    textColor: 'text-synthia-400',
    description: 'State node',
  },
  {
    type: 'decision',
    label: 'Decision',
    icon: GitBranch,
    color: '#f59e0b',
    bgColor: 'bg-amber-500/10',
    borderColor: 'border-amber-500/30',
    textColor: 'text-amber-400',
    description: 'Conditional branch',
  },
  {
    type: 'end',
    label: 'End',
    icon: Square,
    color: '#ef4444',
    bgColor: 'bg-red-500/10',
    borderColor: 'border-red-500/30',
    textColor: 'text-red-400',
    description: 'Terminal state',
  },
];

export default function Palette() {
  const onDragStart = (event, nodeType) => {
    event.dataTransfer.setData('application/reactflow', nodeType);
    event.dataTransfer.effectAllowed = 'move';
  };

  return (
    <div className="w-48 bg-slate-800/50 border-r border-slate-700 p-3 flex-shrink-0 overflow-y-auto">
      <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
        Node Palette
      </h3>
      <div className="space-y-2">
        {nodeTypes.map(nt => {
          const Icon = nt.icon;
          return (
            <div
              key={nt.type}
              className={`palette-item flex items-center gap-2 px-3 py-2.5 rounded-lg border ${nt.bgColor} ${nt.borderColor} hover:border-opacity-60 transition-all cursor-grab active:cursor-grabbing active:scale-95`}
              draggable
              onDragStart={(e) => onDragStart(e, nt.type)}
            >
              <Icon className={`w-4 h-4 ${nt.textColor}`} fill={nt.type === 'end' ? 'currentColor' : 'none'} />
              <div>
                <span className={`text-xs font-medium ${nt.textColor}`}>{nt.label}</span>
                <p className="text-[9px] text-slate-500">{nt.description}</p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-6 p-3 bg-slate-800 rounded-lg border border-slate-700">
        <h4 className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
          Tips
        </h4>
        <ul className="text-[10px] text-slate-500 space-y-1.5">
          <li>• Drag nodes onto canvas</li>
          <li>• Connect via handles</li>
          <li>• Click to configure</li>
          <li>• Use Decision for branches</li>
        </ul>
      </div>
    </div>
  );
}
