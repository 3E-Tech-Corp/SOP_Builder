import React, { useState } from 'react';
import { X, Plus, Trash2, Database, GripVertical } from 'lucide-react';
import { PROPERTY_TYPES } from '../../utils/storage';

export default function ObjectSchemaEditor({ schema, onChange, onClose }) {
  const properties = schema?.properties || [];
  const [newProp, setNewProp] = useState({ name: '', type: 'text', defaultValue: '', description: '' });
  const [showAdd, setShowAdd] = useState(false);

  const addProperty = () => {
    if (!newProp.name.trim()) return;
    if (properties.some(p => p.name === newProp.name.trim())) return;
    onChange({
      ...schema,
      properties: [...properties, { ...newProp, name: newProp.name.trim() }],
    });
    setNewProp({ name: '', type: 'text', defaultValue: '', description: '' });
    setShowAdd(false);
  };

  const removeProperty = (idx) => {
    onChange({
      ...schema,
      properties: properties.filter((_, i) => i !== idx),
    });
  };

  const updateProperty = (idx, updates) => {
    onChange({
      ...schema,
      properties: properties.map((p, i) => i === idx ? { ...p, ...updates } : p),
    });
  };

  return (
    <div className="border-b border-slate-700 bg-slate-800/80">
      <div className="flex items-center justify-between px-4 py-2 border-b border-slate-700/50">
        <div className="flex items-center gap-2">
          <Database className="w-4 h-4 text-synthia-400" />
          <h3 className="text-sm font-semibold text-white">Object Schema</h3>
          <span className="text-[10px] text-slate-400">
            Define custom properties for objects in this SOP
          </span>
        </div>
        <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-200 rounded transition-colors">
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="px-4 py-3 max-h-64 overflow-y-auto">
        {properties.length === 0 ? (
          <div className="text-center py-3">
            <p className="text-xs text-slate-500">
              No custom properties defined. Objects will only have ID, Name, and Status.
            </p>
          </div>
        ) : (
          <div className="space-y-0">
            {/* Header */}
            <div className="grid grid-cols-12 gap-2 text-[10px] font-semibold text-slate-400 uppercase tracking-wider pb-1 border-b border-slate-700/50 mb-1">
              <div className="col-span-3">Name</div>
              <div className="col-span-2">Type</div>
              <div className="col-span-3">Default</div>
              <div className="col-span-3">Description</div>
              <div className="col-span-1"></div>
            </div>

            {properties.map((prop, idx) => (
              <div key={idx} className="grid grid-cols-12 gap-2 items-center py-1 hover:bg-slate-700/20 rounded group">
                <div className="col-span-3">
                  <input
                    type="text" value={prop.name}
                    onChange={e => updateProperty(idx, { name: e.target.value })}
                    className="w-full px-1.5 py-1 bg-transparent border border-transparent hover:border-slate-600 focus:border-synthia-500 rounded text-[11px] text-white focus:outline-none focus:bg-slate-700"
                  />
                </div>
                <div className="col-span-2">
                  <select value={prop.type}
                    onChange={e => updateProperty(idx, { type: e.target.value })}
                    className="w-full px-1 py-1 bg-transparent border border-transparent hover:border-slate-600 focus:border-synthia-500 rounded text-[11px] text-white focus:outline-none focus:bg-slate-700"
                  >
                    {PROPERTY_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div className="col-span-3">
                  <input
                    type="text" value={prop.defaultValue || ''}
                    onChange={e => updateProperty(idx, { defaultValue: e.target.value })}
                    placeholder="—"
                    className="w-full px-1.5 py-1 bg-transparent border border-transparent hover:border-slate-600 focus:border-synthia-500 rounded text-[11px] text-slate-300 focus:outline-none focus:bg-slate-700"
                  />
                </div>
                <div className="col-span-3">
                  <input
                    type="text" value={prop.description || ''}
                    onChange={e => updateProperty(idx, { description: e.target.value })}
                    placeholder="—"
                    className="w-full px-1.5 py-1 bg-transparent border border-transparent hover:border-slate-600 focus:border-synthia-500 rounded text-[11px] text-slate-400 focus:outline-none focus:bg-slate-700"
                  />
                </div>
                <div className="col-span-1 flex justify-end">
                  <button
                    onClick={() => removeProperty(idx)}
                    className="p-0.5 text-slate-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Add property */}
        {showAdd ? (
          <div className="mt-2 p-2.5 bg-slate-800 rounded-lg border border-slate-600 space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] text-slate-400 block mb-0.5">Name *</label>
                <input type="text" value={newProp.name}
                  onChange={e => setNewProp({ ...newProp, name: e.target.value })}
                  onKeyDown={e => e.key === 'Enter' && addProperty()}
                  placeholder="e.g., Amount"
                  className="w-full px-2 py-1 bg-slate-700 border border-slate-600 rounded text-[11px] text-white focus:outline-none focus:ring-1 focus:ring-synthia-500"
                  autoFocus />
              </div>
              <div>
                <label className="text-[10px] text-slate-400 block mb-0.5">Type</label>
                <select value={newProp.type}
                  onChange={e => setNewProp({ ...newProp, type: e.target.value })}
                  className="w-full px-2 py-1 bg-slate-700 border border-slate-600 rounded text-[11px] text-white focus:outline-none focus:ring-1 focus:ring-synthia-500">
                  {PROPERTY_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] text-slate-400 block mb-0.5">Default Value</label>
                <input type="text" value={newProp.defaultValue}
                  onChange={e => setNewProp({ ...newProp, defaultValue: e.target.value })}
                  placeholder="Optional"
                  className="w-full px-2 py-1 bg-slate-700 border border-slate-600 rounded text-[11px] text-white focus:outline-none focus:ring-1 focus:ring-synthia-500" />
              </div>
              <div>
                <label className="text-[10px] text-slate-400 block mb-0.5">Description</label>
                <input type="text" value={newProp.description}
                  onChange={e => setNewProp({ ...newProp, description: e.target.value })}
                  placeholder="Optional"
                  className="w-full px-2 py-1 bg-slate-700 border border-slate-600 rounded text-[11px] text-white focus:outline-none focus:ring-1 focus:ring-synthia-500" />
              </div>
            </div>
            <div className="flex gap-1.5">
              <button onClick={addProperty} disabled={!newProp.name.trim()}
                className="px-3 py-1 text-[11px] font-medium text-white bg-synthia-600 hover:bg-synthia-700 rounded transition-colors disabled:opacity-50">
                Add Property
              </button>
              <button onClick={() => { setShowAdd(false); setNewProp({ name: '', type: 'text', defaultValue: '', description: '' }); }}
                className="px-3 py-1 text-[11px] text-slate-400 hover:text-slate-200 transition-colors">
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <button onClick={() => setShowAdd(true)}
            className="mt-2 flex items-center gap-1 text-xs text-synthia-400 hover:text-synthia-300 transition-colors">
            <Plus className="w-3.5 h-3.5" />
            Add Property
          </button>
        )}
      </div>
    </div>
  );
}
