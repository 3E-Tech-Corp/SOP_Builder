import React from 'react';
import { X, Trash2, Plus } from 'lucide-react';
import useSopStore from '../../store/sopStore';
import NotificationConfig, { EDGE_EVENTS } from './NotificationConfig';

export default function PropertiesPanel({ nodes, edges, setNodes, setEdges }) {
  const selectedNode = useSopStore(s => s.selectedNode);
  const selectedEdge = useSopStore(s => s.selectedEdge);
  const clearSelection = useSopStore(s => s.clearSelection);

  if (selectedNode) {
    return (
      <NodeProperties
        node={selectedNode}
        onClose={clearSelection}
        onUpdate={(updates) => {
          setNodes(nds => nds.map(n =>
            n.id === selectedNode.id
              ? { ...n, data: { ...n.data, ...updates } }
              : n
          ));
        }}
        onDelete={() => {
          setNodes(nds => nds.filter(n => n.id !== selectedNode.id));
          setEdges(eds => eds.filter(e => e.source !== selectedNode.id && e.target !== selectedNode.id));
          clearSelection();
        }}
      />
    );
  }

  if (selectedEdge) {
    return (
      <EdgeProperties
        edge={selectedEdge}
        nodes={nodes}
        onClose={clearSelection}
        onUpdate={(updates) => {
          setEdges(eds => eds.map(e =>
            e.id === selectedEdge.id
              ? { ...e, data: { ...e.data, ...updates } }
              : e
          ));
        }}
        onDelete={() => {
          setEdges(eds => eds.filter(e => e.id !== selectedEdge.id));
          clearSelection();
        }}
      />
    );
  }

  return (
    <div className="w-72 bg-slate-800/50 border-l border-slate-700 p-4 flex-shrink-0 overflow-y-auto">
      <div className="text-center text-slate-500 mt-8">
        <p className="text-sm">Click a node or edge to configure</p>
        <p className="text-xs mt-2 text-slate-600">Or drag nodes from the palette</p>
      </div>
    </div>
  );
}

function NodeProperties({ node, onClose, onUpdate, onDelete }) {
  const data = node.data || {};
  const isStart = node.type === 'start';
  const isEnd = node.type === 'end';
  const isDecision = node.type === 'decision';

  return (
    <div className="w-72 bg-slate-800/50 border-l border-slate-700 flex flex-col flex-shrink-0 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2.5 border-b border-slate-700 bg-slate-800/80">
        <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
          {node.type} Node
        </h3>
        <div className="flex items-center gap-1">
          <button
            onClick={onDelete}
            className="p-1 text-slate-400 hover:text-red-400 rounded transition-colors"
            title="Delete node"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-200 rounded transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {/* Name */}
        <Field label="Name">
          <input
            type="text"
            value={data.label || ''}
            onChange={e => onUpdate({ label: e.target.value })}
            className="w-full px-2 py-1.5 bg-slate-700 border border-slate-600 rounded text-sm text-white focus:outline-none focus:ring-1 focus:ring-synthia-500"
          />
        </Field>

        {/* Description */}
        <Field label="Description">
          <textarea
            value={data.description || ''}
            onChange={e => onUpdate({ description: e.target.value })}
            rows={2}
            className="w-full px-2 py-1.5 bg-slate-700 border border-slate-600 rounded text-sm text-white focus:outline-none focus:ring-1 focus:ring-synthia-500 resize-none"
          />
        </Field>

        {/* Color */}
        <Field label="Color">
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={data.color || (isStart ? '#22c55e' : isEnd ? '#ef4444' : isDecision ? '#f59e0b' : '#8B5CF6')}
              onChange={e => onUpdate({ color: e.target.value })}
              className="w-8 h-8 rounded cursor-pointer border border-slate-600"
            />
            <input
              type="text"
              value={data.color || ''}
              onChange={e => onUpdate({ color: e.target.value })}
              placeholder="#8B5CF6"
              className="flex-1 px-2 py-1.5 bg-slate-700 border border-slate-600 rounded text-xs text-white focus:outline-none focus:ring-1 focus:ring-synthia-500"
            />
          </div>
        </Field>

        {/* SLA (not for start/end) */}
        {!isStart && !isEnd && (
          <Field label="SLA / Timeout (hours)">
            <input
              type="number"
              value={data.slaHours || ''}
              onChange={e => onUpdate({ slaHours: e.target.value ? Number(e.target.value) : null })}
              placeholder="Optional"
              min={0}
              className="w-full px-2 py-1.5 bg-slate-700 border border-slate-600 rounded text-sm text-white focus:outline-none focus:ring-1 focus:ring-synthia-500"
            />
          </Field>
        )}

        {/* Notifications (not for start) */}
        {!isStart && (
          <NotificationConfig
            notifications={data.notifications || {}}
            onChange={(notifications) => onUpdate({ notifications })}
          />
        )}
      </div>
    </div>
  );
}

function EdgeProperties({ edge, nodes, onClose, onUpdate, onDelete }) {
  const data = edge.data || {};
  const sourceNode = nodes.find(n => n.id === edge.source);
  const targetNode = nodes.find(n => n.id === edge.target);

  const [newField, setNewField] = React.useState('');

  const addField = () => {
    if (!newField.trim()) return;
    const fields = [...(data.requiredFields || []), newField.trim()];
    onUpdate({ requiredFields: fields });
    setNewField('');
  };

  const removeField = (idx) => {
    const fields = (data.requiredFields || []).filter((_, i) => i !== idx);
    onUpdate({ requiredFields: fields });
  };

  return (
    <div className="w-72 bg-slate-800/50 border-l border-slate-700 flex flex-col flex-shrink-0 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2.5 border-b border-slate-700 bg-slate-800/80">
        <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
          Action / Edge
        </h3>
        <div className="flex items-center gap-1">
          <button
            onClick={onDelete}
            className="p-1 text-slate-400 hover:text-red-400 rounded transition-colors"
            title="Delete edge"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-200 rounded transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {/* Connection info */}
        <div className="text-[10px] text-slate-500 flex items-center gap-1">
          <span className="text-slate-300">{sourceNode?.data?.label || 'Source'}</span>
          <span>→</span>
          <span className="text-slate-300">{targetNode?.data?.label || 'Target'}</span>
        </div>

        {/* Action Name */}
        <Field label="Action Name">
          <input
            type="text"
            value={data.label || ''}
            onChange={e => onUpdate({ label: e.target.value })}
            placeholder="e.g., Approve, Submit"
            className="w-full px-2 py-1.5 bg-slate-700 border border-slate-600 rounded text-sm text-white focus:outline-none focus:ring-1 focus:ring-synthia-500"
          />
        </Field>

        {/* Description */}
        <Field label="Description">
          <textarea
            value={data.description || ''}
            onChange={e => onUpdate({ description: e.target.value })}
            rows={2}
            className="w-full px-2 py-1.5 bg-slate-700 border border-slate-600 rounded text-sm text-white focus:outline-none focus:ring-1 focus:ring-synthia-500 resize-none"
          />
        </Field>

        {/* Required Fields */}
        <Field label="Required Fields">
          <div className="space-y-1">
            {(data.requiredFields || []).map((field, idx) => (
              <div key={idx} className="flex items-center gap-1">
                <span className="flex-1 text-xs text-slate-300 bg-slate-700/50 px-2 py-1 rounded">{field}</span>
                <button
                  onClick={() => removeField(idx)}
                  className="p-0.5 text-slate-400 hover:text-red-400 transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
            <div className="flex items-center gap-1">
              <input
                type="text"
                value={newField}
                onChange={e => setNewField(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addField()}
                placeholder="Field name"
                className="flex-1 px-2 py-1 bg-slate-700 border border-slate-600 rounded text-xs text-white focus:outline-none focus:ring-1 focus:ring-synthia-500"
              />
              <button
                onClick={addField}
                className="p-1 text-synthia-400 hover:text-synthia-300 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </Field>

        {/* Notifications */}
        <NotificationConfig
          notifications={data.notifications || {}}
          onChange={(notifications) => onUpdate({ notifications })}
          events={EDGE_EVENTS}
        />
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <label className="block text-[11px] font-medium text-slate-400 mb-1">{label}</label>
      {children}
    </div>
  );
}
