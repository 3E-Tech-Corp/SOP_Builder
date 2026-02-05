import React, { useState } from 'react';
import { X, Trash2, Plus, Shield, FileText, ListChecks, GitFork } from 'lucide-react';
import useSopStore from '../../store/sopStore';
import NotificationConfig, { EDGE_EVENTS } from './NotificationConfig';
import { fetchSOPs, AVAILABLE_ROLES, PROPERTY_TYPES, DOCUMENT_TYPES } from '../../utils/api';

export default function PropertiesPanel({ nodes, edges, setNodes, setEdges, objectSchema }) {
  const selectedNode = useSopStore(s => s.selectedNode);
  const selectedEdge = useSopStore(s => s.selectedEdge);
  const clearSelection = useSopStore(s => s.clearSelection);

  if (selectedNode) {
    return (
      <NodeProperties
        node={selectedNode}
        objectSchema={objectSchema}
        onClose={clearSelection}
        onUpdate={(updates) => {
          setNodes(nds => nds.map(n =>
            n.id === selectedNode.id ? { ...n, data: { ...n.data, ...updates } } : n
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
        objectSchema={objectSchema}
        onClose={clearSelection}
        onUpdate={(updates) => {
          setEdges(eds => eds.map(e =>
            e.id === selectedEdge.id ? { ...e, data: { ...e.data, ...updates } } : e
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
    <div className="w-80 bg-slate-800/50 border-l border-slate-700 p-4 flex-shrink-0 overflow-y-auto">
      <div className="text-center text-slate-500 mt-8">
        <p className="text-sm">Click a node or edge to configure</p>
        <p className="text-xs mt-2 text-slate-600">Or drag nodes from the palette</p>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════
   NODE PROPERTIES
   ════════════════════════════════════════ */

function NodeProperties({ node, objectSchema, onClose, onUpdate, onDelete }) {
  const data = node.data || {};
  const isStart = node.type === 'start';
  const isEnd = node.type === 'end';
  const isDecision = node.type === 'decision';
  const [allSOPs, setAllSOPs] = React.useState([]);
  React.useEffect(() => { fetchSOPs().then(setAllSOPs).catch(() => {}); }, []);

  return (
    <div className="w-80 bg-slate-800/50 border-l border-slate-700 flex flex-col flex-shrink-0 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2.5 border-b border-slate-700 bg-slate-800/80">
        <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
          {node.type} Node
        </h3>
        <div className="flex items-center gap-1">
          <button onClick={onDelete} className="p-1 text-slate-400 hover:text-red-400 rounded transition-colors" title="Delete node">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-200 rounded transition-colors">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-4">
        {/* Name */}
        <Field label="Name">
          <input type="text" value={data.label || ''} onChange={e => onUpdate({ label: e.target.value })}
            className="w-full px-2 py-1.5 bg-slate-700 border border-slate-600 rounded text-sm text-white focus:outline-none focus:ring-1 focus:ring-synthia-500" />
        </Field>

        {/* Description */}
        <Field label="Description">
          <textarea value={data.description || ''} onChange={e => onUpdate({ description: e.target.value })} rows={2}
            className="w-full px-2 py-1.5 bg-slate-700 border border-slate-600 rounded text-sm text-white focus:outline-none focus:ring-1 focus:ring-synthia-500 resize-none" />
        </Field>

        {/* Color */}
        <Field label="Color">
          <div className="flex items-center gap-2">
            <input type="color"
              value={data.color || (isStart ? '#22c55e' : isEnd ? '#ef4444' : isDecision ? '#f59e0b' : '#8B5CF6')}
              onChange={e => onUpdate({ color: e.target.value })}
              className="w-8 h-8 rounded cursor-pointer border border-slate-600" />
            <input type="text" value={data.color || ''} onChange={e => onUpdate({ color: e.target.value })}
              placeholder="#8B5CF6"
              className="flex-1 px-2 py-1.5 bg-slate-700 border border-slate-600 rounded text-xs text-white focus:outline-none focus:ring-1 focus:ring-synthia-500" />
          </div>
        </Field>

        {/* SLA (not for start/end) */}
        {!isStart && !isEnd && (
          <Field label="SLA / Timeout (hours)">
            <input type="number" value={data.slaHours || ''} min={0}
              onChange={e => onUpdate({ slaHours: e.target.value ? Number(e.target.value) : null })}
              placeholder="Optional"
              className="w-full px-2 py-1.5 bg-slate-700 border border-slate-600 rounded text-sm text-white focus:outline-none focus:ring-1 focus:ring-synthia-500" />
          </Field>
        )}

        {/* ── Required Properties ── */}
        {!isStart && (
          <RequiredPropertiesEditor
            requiredProperties={data.requiredProperties || []}
            objectSchema={objectSchema}
            onChange={(reqProps) => onUpdate({ requiredProperties: reqProps })}
          />
        )}

        {/* ── Sub-SOP ── */}
        {!isStart && !isEnd && (
          <div>
            <div className="flex items-center gap-1.5 mb-1">
              <GitFork className="w-3.5 h-3.5 text-cyan-400" />
              <span className="text-[11px] font-semibold text-slate-300">Sub-SOP (Nesting)</span>
            </div>
            <select
              value={data.subSopId || ''}
              onChange={e => onUpdate({ subSopId: e.target.value || null })}
              className="w-full px-2 py-1.5 bg-slate-700 border border-slate-600 rounded text-xs text-white focus:outline-none focus:ring-1 focus:ring-synthia-500"
            >
              <option value="">None</option>
              {allSOPs.filter(s => s.id !== node._sopId).map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
            <p className="text-[9px] text-slate-500 mt-1">Link a child SOP to enter when object reaches this status.</p>
          </div>
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

/* ════════════════════════════════════════
   EDGE PROPERTIES
   ════════════════════════════════════════ */

function EdgeProperties({ edge, nodes, objectSchema, onClose, onUpdate, onDelete }) {
  const data = edge.data || {};
  const sourceNode = nodes.find(n => n.id === edge.source);
  const targetNode = nodes.find(n => n.id === edge.target);

  return (
    <div className="w-80 bg-slate-800/50 border-l border-slate-700 flex flex-col flex-shrink-0 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2.5 border-b border-slate-700 bg-slate-800/80">
        <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Action / Edge</h3>
        <div className="flex items-center gap-1">
          <button onClick={onDelete} className="p-1 text-slate-400 hover:text-red-400 rounded transition-colors" title="Delete edge">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-200 rounded transition-colors">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-4">
        {/* Connection info */}
        <div className="text-[10px] text-slate-500 flex items-center gap-1">
          <span className="text-slate-300">{sourceNode?.data?.label || 'Source'}</span>
          <span>→</span>
          <span className="text-slate-300">{targetNode?.data?.label || 'Target'}</span>
        </div>

        {/* Action Name */}
        <Field label="Action Name">
          <input type="text" value={data.label || ''} onChange={e => onUpdate({ label: e.target.value })}
            placeholder="e.g., Approve, Submit"
            className="w-full px-2 py-1.5 bg-slate-700 border border-slate-600 rounded text-sm text-white focus:outline-none focus:ring-1 focus:ring-synthia-500" />
        </Field>

        {/* Description */}
        <Field label="Description">
          <textarea value={data.description || ''} onChange={e => onUpdate({ description: e.target.value })} rows={2}
            className="w-full px-2 py-1.5 bg-slate-700 border border-slate-600 rounded text-sm text-white focus:outline-none focus:ring-1 focus:ring-synthia-500 resize-none" />
        </Field>

        {/* ── Required Roles ── */}
        <RoleSelector
          selectedRoles={data.requiredRoles || []}
          onChange={(roles) => onUpdate({ requiredRoles: roles })}
        />

        {/* ── Required Fields ── */}
        <RequiredFieldsEditor
          fields={data.requiredFields || []}
          objectSchema={objectSchema}
          onChange={(fields) => onUpdate({ requiredFields: fields })}
        />

        {/* ── Required Documents ── */}
        <RequiredDocumentsEditor
          documents={data.requiredDocuments || []}
          onChange={(docs) => onUpdate({ requiredDocuments: docs })}
        />

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

/* ════════════════════════════════════════
   SUB-COMPONENTS
   ════════════════════════════════════════ */

function Field({ label, children }) {
  return (
    <div>
      <label className="block text-[11px] font-medium text-slate-400 mb-1">{label}</label>
      {children}
    </div>
  );
}

/* ── Role Selector ── */
function RoleSelector({ selectedRoles, onChange }) {
  const [open, setOpen] = useState(false);

  const toggle = (role) => {
    if (selectedRoles.includes(role)) {
      onChange(selectedRoles.filter(r => r !== role));
    } else {
      onChange([...selectedRoles, role]);
    }
  };

  return (
    <div>
      <div className="flex items-center gap-1.5 mb-1">
        <Shield className="w-3.5 h-3.5 text-blue-400" />
        <span className="text-[11px] font-semibold text-slate-300">Required Roles</span>
        {selectedRoles.length > 0 && (
          <span className="text-[9px] text-blue-400 bg-blue-500/10 px-1.5 py-0.5 rounded-full">{selectedRoles.length}</span>
        )}
      </div>

      {/* Selected chips */}
      {selectedRoles.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-1.5">
          {selectedRoles.map(role => (
            <span key={role} className="inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] bg-blue-500/15 text-blue-300 rounded border border-blue-500/20">
              {role}
              <button onClick={() => toggle(role)} className="text-blue-400 hover:text-blue-200 ml-0.5">
                <X className="w-2.5 h-2.5" />
              </button>
            </span>
          ))}
        </div>
      )}

      <button
        onClick={() => setOpen(!open)}
        className="text-[10px] text-synthia-400 hover:text-synthia-300 transition-colors"
      >
        {open ? '▾ Hide roles' : '▸ Select roles...'}
      </button>

      {open && (
        <div className="mt-1 grid grid-cols-2 gap-1 p-2 bg-slate-800 rounded border border-slate-700 max-h-40 overflow-y-auto">
          {AVAILABLE_ROLES.map(role => (
            <label key={role} className="flex items-center gap-1.5 text-[10px] text-slate-300 cursor-pointer hover:text-white py-0.5">
              <input type="checkbox" checked={selectedRoles.includes(role)} onChange={() => toggle(role)}
                className="w-2.5 h-2.5 rounded border-slate-600 text-synthia-500 focus:ring-synthia-500 bg-slate-700" />
              {role}
            </label>
          ))}
        </div>
      )}

      {selectedRoles.length === 0 && (
        <p className="text-[9px] text-slate-500 mt-0.5">No role restriction — anyone can perform this action.</p>
      )}
    </div>
  );
}

/* ── Required Fields Editor ── */
function RequiredFieldsEditor({ fields, objectSchema, onChange }) {
  const [newName, setNewName] = useState('');
  const [newType, setNewType] = useState('text');

  const addField = () => {
    if (!newName.trim()) return;
    onChange([...fields, { name: newName.trim(), type: newType }]);
    setNewName('');
    setNewType('text');
  };

  const removeField = (idx) => onChange(fields.filter((_, i) => i !== idx));

  // Suggest schema properties not already in the list
  const suggestions = (objectSchema?.properties || [])
    .filter(p => !fields.some(f => f.name === p.name))
    .map(p => p.name);

  return (
    <div>
      <div className="flex items-center gap-1.5 mb-1">
        <ListChecks className="w-3.5 h-3.5 text-emerald-400" />
        <span className="text-[11px] font-semibold text-slate-300">Required Fields</span>
        {fields.length > 0 && (
          <span className="text-[9px] text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded-full">{fields.length}</span>
        )}
      </div>

      <div className="space-y-1">
        {fields.map((field, idx) => (
          <div key={idx} className="flex items-center gap-1">
            <span className="flex-1 text-[10px] text-slate-300 bg-slate-700/50 px-2 py-1 rounded truncate">
              {field.name} <span className="text-slate-500">({field.type})</span>
            </span>
            <button onClick={() => removeField(idx)} className="p-0.5 text-slate-400 hover:text-red-400 transition-colors">
              <X className="w-3 h-3" />
            </button>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-1 mt-1.5">
        <input type="text" value={newName} onChange={e => setNewName(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && addField()}
          placeholder="Field name" list="field-suggestions"
          className="flex-1 px-2 py-1 bg-slate-700 border border-slate-600 rounded text-[10px] text-white focus:outline-none focus:ring-1 focus:ring-synthia-500" />
        <select value={newType} onChange={e => setNewType(e.target.value)}
          className="px-1 py-1 bg-slate-700 border border-slate-600 rounded text-[10px] text-white focus:outline-none focus:ring-1 focus:ring-synthia-500 w-16">
          {PROPERTY_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
        <button onClick={addField} className="p-1 text-synthia-400 hover:text-synthia-300 transition-colors">
          <Plus className="w-3.5 h-3.5" />
        </button>
      </div>
      {suggestions.length > 0 && (
        <datalist id="field-suggestions">
          {suggestions.map(s => <option key={s} value={s} />)}
        </datalist>
      )}
    </div>
  );
}

/* ── Required Documents Editor ── */
function RequiredDocumentsEditor({ documents, onChange }) {
  const [newDoc, setNewDoc] = useState({ name: '', type: 'PDF', description: '' });
  const [showAdd, setShowAdd] = useState(false);

  const addDoc = () => {
    if (!newDoc.name.trim()) return;
    onChange([...documents, { name: newDoc.name.trim(), type: newDoc.type, description: newDoc.description.trim() }]);
    setNewDoc({ name: '', type: 'PDF', description: '' });
    setShowAdd(false);
  };

  const removeDoc = (idx) => onChange(documents.filter((_, i) => i !== idx));

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-1.5">
          <FileText className="w-3.5 h-3.5 text-amber-400" />
          <span className="text-[11px] font-semibold text-slate-300">Required Documents</span>
          {documents.length > 0 && (
            <span className="text-[9px] text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded-full">{documents.length}</span>
          )}
        </div>
        <button onClick={() => setShowAdd(!showAdd)} className="p-0.5 text-synthia-400 hover:text-synthia-300 transition-colors">
          <Plus className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="space-y-1">
        {documents.map((doc, idx) => (
          <div key={idx} className="flex items-center gap-1 bg-slate-700/30 rounded px-2 py-1">
            <div className="flex-1 min-w-0">
              <span className="text-[10px] text-slate-200 font-medium">{doc.name}</span>
              <span className="text-[9px] text-slate-500 ml-1">({doc.type})</span>
              {doc.description && <p className="text-[9px] text-slate-500 truncate">{doc.description}</p>}
            </div>
            <button onClick={() => removeDoc(idx)} className="p-0.5 text-slate-400 hover:text-red-400 transition-colors flex-shrink-0">
              <X className="w-3 h-3" />
            </button>
          </div>
        ))}
      </div>

      {showAdd && (
        <div className="mt-1.5 p-2 bg-slate-800 rounded border border-slate-700 space-y-1.5">
          <input type="text" value={newDoc.name} onChange={e => setNewDoc({ ...newDoc, name: e.target.value })}
            placeholder="Document name" onKeyDown={e => e.key === 'Enter' && addDoc()}
            className="w-full px-2 py-1 bg-slate-700 border border-slate-600 rounded text-[10px] text-white focus:outline-none focus:ring-1 focus:ring-synthia-500" />
          <div className="flex gap-1">
            <select value={newDoc.type} onChange={e => setNewDoc({ ...newDoc, type: e.target.value })}
              className="flex-1 px-2 py-1 bg-slate-700 border border-slate-600 rounded text-[10px] text-white focus:outline-none focus:ring-1 focus:ring-synthia-500">
              {DOCUMENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <input type="text" value={newDoc.description} onChange={e => setNewDoc({ ...newDoc, description: e.target.value })}
            placeholder="Description (optional)"
            className="w-full px-2 py-1 bg-slate-700 border border-slate-600 rounded text-[10px] text-white focus:outline-none focus:ring-1 focus:ring-synthia-500" />
          <div className="flex gap-1">
            <button onClick={addDoc} disabled={!newDoc.name.trim()}
              className="flex-1 px-2 py-1 text-[10px] font-medium text-white bg-synthia-600 hover:bg-synthia-700 rounded transition-colors disabled:opacity-50">
              Add Document
            </button>
            <button onClick={() => setShowAdd(false)}
              className="px-2 py-1 text-[10px] text-slate-400 hover:text-slate-200 transition-colors">
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Required Properties Editor (for Status nodes) ── */
function RequiredPropertiesEditor({ requiredProperties, objectSchema, onChange }) {
  const schemaProps = objectSchema?.properties || [];
  const [showAdd, setShowAdd] = useState(false);

  const toggleProp = (propName, propType) => {
    const existing = requiredProperties.find(p => p.name === propName);
    if (existing) {
      onChange(requiredProperties.filter(p => p.name !== propName));
    } else {
      onChange([...requiredProperties, { name: propName, type: propType, required: true }]);
    }
  };

  const toggleRequired = (propName) => {
    onChange(requiredProperties.map(p =>
      p.name === propName ? { ...p, required: !p.required } : p
    ));
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-1.5">
          <ListChecks className="w-3.5 h-3.5 text-emerald-400" />
          <span className="text-[11px] font-semibold text-slate-300">Required Properties</span>
          {requiredProperties.filter(p => p.required).length > 0 && (
            <span className="text-[9px] text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded-full">
              {requiredProperties.filter(p => p.required).length}
            </span>
          )}
        </div>
      </div>

      <p className="text-[9px] text-slate-500 mb-1.5">Properties the object must have filled at this status.</p>

      {schemaProps.length === 0 ? (
        <p className="text-[9px] text-slate-500 italic">Define object properties in the Schema tab first.</p>
      ) : (
        <div className="space-y-1 max-h-40 overflow-y-auto">
          {schemaProps.map(prop => {
            const isSelected = requiredProperties.some(p => p.name === prop.name);
            const isReq = requiredProperties.find(p => p.name === prop.name)?.required;
            return (
              <label key={prop.name} className="flex items-center gap-2 text-[10px] text-slate-300 cursor-pointer py-0.5 px-1 hover:bg-slate-700/30 rounded">
                <input type="checkbox" checked={isSelected} onChange={() => toggleProp(prop.name, prop.type)}
                  className="w-2.5 h-2.5 rounded border-slate-600 text-synthia-500 focus:ring-synthia-500 bg-slate-700" />
                <span className="flex-1">{prop.name}</span>
                <span className="text-[9px] text-slate-500">{prop.type}</span>
              </label>
            );
          })}
        </div>
      )}
    </div>
  );
}
