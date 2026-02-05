import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Edit3, X, Save, List, ChevronDown, ChevronRight, GripVertical } from 'lucide-react';
import {
  fetchListCodes, fetchListCode, createListCode, updateListCode, deleteListCode,
  addListCodeItem, updateListCodeItem, deleteListCodeItem,
} from '../../utils/api';
import useSopStore from '../../store/sopStore';

export default function ListCodesPage() {
  const addToast = useSopStore(s => s.addToast);
  const [listCodes, setListCodes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState(null);
  const [selectedDetail, setSelectedDetail] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [editingName, setEditingName] = useState(false);

  const loadListCodes = async () => {
    try {
      const data = await fetchListCodes();
      setListCodes(data);
    } catch {
      addToast({ type: 'error', message: 'Failed to load list codes' });
    } finally {
      setLoading(false);
    }
  };

  const loadDetail = async (id) => {
    try {
      const data = await fetchListCode(id);
      setSelectedDetail(data);
    } catch {
      addToast({ type: 'error', message: 'Failed to load list code details' });
    }
  };

  useEffect(() => { loadListCodes(); }, []);

  useEffect(() => {
    if (selectedId) loadDetail(selectedId);
    else setSelectedDetail(null);
  }, [selectedId]);

  const handleCreate = async () => {
    if (!newName.trim()) return;
    try {
      const code = await createListCode(newName.trim(), newDesc.trim() || null);
      setListCodes(prev => [...prev, { ...code, itemCount: 0 }]);
      setSelectedId(code.id);
      setShowCreate(false);
      setNewName('');
      setNewDesc('');
      addToast({ type: 'success', message: `Created "${code.name}"` });
    } catch (err) {
      addToast({ type: 'error', message: err.response?.data?.error || 'Failed to create' });
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete list code "${name}" and all its items?`)) return;
    try {
      await deleteListCode(id);
      setListCodes(prev => prev.filter(c => c.id !== id));
      if (selectedId === id) { setSelectedId(null); setSelectedDetail(null); }
      addToast({ type: 'info', message: `Deleted "${name}"` });
    } catch {
      addToast({ type: 'error', message: 'Failed to delete' });
    }
  };

  const handleUpdateName = async () => {
    if (!selectedDetail) return;
    try {
      await updateListCode(selectedDetail.id, { name: selectedDetail.name, description: selectedDetail.description });
      loadListCodes();
      setEditingName(false);
      addToast({ type: 'success', message: 'Updated' });
    } catch (err) {
      addToast({ type: 'error', message: err.response?.data?.error || 'Failed to update' });
    }
  };

  return (
    <div className="h-full overflow-auto">
      <div className="max-w-5xl mx-auto p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <List className="w-6 h-6 text-synthia-400" />
              List Codes
            </h1>
            <p className="text-sm text-slate-400 mt-1">Manage reusable option lists for select-type properties</p>
          </div>
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-synthia-600 hover:bg-synthia-700 rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" />
            New List Code
          </button>
        </div>

        {/* Create Form */}
        {showCreate && (
          <div className="mb-6 bg-slate-800 border border-slate-700 rounded-xl p-5">
            <h3 className="text-sm font-semibold text-white mb-3">Create List Code</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-xs text-slate-400 mb-1">Name *</label>
                <input type="text" value={newName} onChange={e => setNewName(e.target.value)}
                  placeholder="e.g., Priority Levels" autoFocus onKeyDown={e => e.key === 'Enter' && handleCreate()}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-synthia-500" />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Description</label>
                <input type="text" value={newDesc} onChange={e => setNewDesc(e.target.value)}
                  placeholder="Optional description"
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-synthia-500" />
              </div>
              <div className="flex gap-2">
                <button onClick={handleCreate} disabled={!newName.trim()}
                  className="px-4 py-2 text-sm font-medium text-white bg-synthia-600 hover:bg-synthia-700 rounded-lg transition-colors disabled:opacity-50">
                  Create
                </button>
                <button onClick={() => { setShowCreate(false); setNewName(''); setNewDesc(''); }}
                  className="px-4 py-2 text-sm text-slate-400 hover:text-slate-200 transition-colors">
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="flex gap-6">
          {/* List of List Codes */}
          <div className="w-72 flex-shrink-0">
            {loading ? (
              <p className="text-sm text-slate-500 text-center py-8">Loading...</p>
            ) : listCodes.length === 0 ? (
              <p className="text-sm text-slate-500 text-center py-8">No list codes yet</p>
            ) : (
              <div className="space-y-1">
                {listCodes.map(code => (
                  <div
                    key={code.id}
                    onClick={() => setSelectedId(code.id)}
                    className={`flex items-center justify-between px-3 py-2.5 rounded-lg cursor-pointer transition-colors group ${
                      selectedId === code.id
                        ? 'bg-synthia-500/15 border border-synthia-500/30'
                        : 'bg-slate-800 border border-slate-700 hover:border-slate-600'
                    }`}
                  >
                    <div className="min-w-0">
                      <p className={`text-sm font-medium truncate ${selectedId === code.id ? 'text-synthia-300' : 'text-white'}`}>
                        {code.name}
                      </p>
                      <p className="text-[10px] text-slate-500">{code.itemCount} items</p>
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDelete(code.id, code.name); }}
                      className="p-1 text-slate-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Detail Panel */}
          <div className="flex-1">
            {selectedDetail ? (
              <ListCodeDetail
                detail={selectedDetail}
                onUpdate={(updated) => { setSelectedDetail(updated); loadListCodes(); }}
                onUpdateName={handleUpdateName}
                editingName={editingName}
                setEditingName={setEditingName}
                setSelectedDetail={setSelectedDetail}
                addToast={addToast}
              />
            ) : (
              <div className="bg-slate-800 border border-slate-700 rounded-xl p-8 text-center">
                <List className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                <p className="text-sm text-slate-500">Select a list code to manage its items</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function ListCodeDetail({ detail, onUpdate, onUpdateName, editingName, setEditingName, setSelectedDetail, addToast }) {
  const [newValue, setNewValue] = useState('');
  const [newLabel, setNewLabel] = useState('');
  const [editingItem, setEditingItem] = useState(null);

  const handleAddItem = async () => {
    if (!newValue.trim() || !newLabel.trim()) return;
    try {
      const item = await addListCodeItem(detail.id, {
        value: newValue.trim(),
        label: newLabel.trim(),
        sortOrder: detail.items.length,
        isActive: true,
      });
      onUpdate({ ...detail, items: [...detail.items, item] });
      setNewValue('');
      setNewLabel('');
      addToast({ type: 'success', message: 'Item added' });
    } catch (err) {
      addToast({ type: 'error', message: err.response?.data?.error || 'Failed to add item' });
    }
  };

  const handleUpdateItem = async (item) => {
    try {
      const updated = await updateListCodeItem(item.id, {
        value: item.value,
        label: item.label,
        sortOrder: item.sortOrder,
        isActive: item.isActive,
      });
      onUpdate({ ...detail, items: detail.items.map(i => i.id === updated.id ? updated : i) });
      setEditingItem(null);
      addToast({ type: 'success', message: 'Item updated' });
    } catch (err) {
      addToast({ type: 'error', message: err.response?.data?.error || 'Failed to update' });
    }
  };

  const handleDeleteItem = async (itemId) => {
    try {
      await deleteListCodeItem(itemId);
      onUpdate({ ...detail, items: detail.items.filter(i => i.id !== itemId) });
      addToast({ type: 'info', message: 'Item deleted' });
    } catch {
      addToast({ type: 'error', message: 'Failed to delete' });
    }
  };

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-xl p-5">
      {/* Header */}
      <div className="mb-4 pb-3 border-b border-slate-700">
        {editingName ? (
          <div className="space-y-2">
            <input type="text" value={detail.name}
              onChange={e => setSelectedDetail({ ...detail, name: e.target.value })}
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white font-semibold focus:outline-none focus:ring-2 focus:ring-synthia-500" />
            <input type="text" value={detail.description || ''}
              onChange={e => setSelectedDetail({ ...detail, description: e.target.value })}
              placeholder="Description"
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-synthia-500" />
            <div className="flex gap-2">
              <button onClick={onUpdateName} className="px-3 py-1.5 text-xs font-medium text-white bg-synthia-600 rounded-lg">
                <Save className="w-3 h-3 inline mr-1" /> Save
              </button>
              <button onClick={() => setEditingName(false)} className="px-3 py-1.5 text-xs text-slate-400">Cancel</button>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-white">{detail.name}</h2>
              {detail.description && <p className="text-sm text-slate-400 mt-0.5">{detail.description}</p>}
            </div>
            <button onClick={() => setEditingName(true)} className="p-1.5 text-slate-400 hover:text-synthia-400 transition-colors">
              <Edit3 className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Items Table */}
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-slate-300 mb-2">Items ({detail.items.length})</h3>

        {detail.items.length > 0 && (
          <div className="space-y-1 mb-3">
            <div className="grid grid-cols-12 gap-2 text-[10px] text-slate-500 uppercase tracking-wider px-2 pb-1">
              <div className="col-span-1">Order</div>
              <div className="col-span-3">Value</div>
              <div className="col-span-4">Label</div>
              <div className="col-span-2">Active</div>
              <div className="col-span-2"></div>
            </div>

            {detail.items.sort((a, b) => a.sortOrder - b.sortOrder).map(item => (
              <div key={item.id} className="grid grid-cols-12 gap-2 items-center px-2 py-1.5 bg-slate-900/30 rounded group hover:bg-slate-700/30">
                {editingItem === item.id ? (
                  <EditableItemRow item={item} onSave={handleUpdateItem} onCancel={() => setEditingItem(null)} />
                ) : (
                  <>
                    <div className="col-span-1 text-xs text-slate-500">{item.sortOrder}</div>
                    <div className="col-span-3 text-xs text-slate-200 font-mono">{item.value}</div>
                    <div className="col-span-4 text-xs text-slate-300">{item.label}</div>
                    <div className="col-span-2">
                      <span className={`text-[10px] px-1.5 py-0.5 rounded ${item.isActive ? 'bg-green-500/15 text-green-400' : 'bg-red-500/15 text-red-400'}`}>
                        {item.isActive ? 'Yes' : 'No'}
                      </span>
                    </div>
                    <div className="col-span-2 flex gap-1 justify-end opacity-0 group-hover:opacity-100 transition-all">
                      <button onClick={() => setEditingItem(item.id)} className="p-1 text-slate-400 hover:text-synthia-400">
                        <Edit3 className="w-3 h-3" />
                      </button>
                      <button onClick={() => handleDeleteItem(item.id)} className="p-1 text-slate-400 hover:text-red-400">
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Add Item Form */}
        <div className="flex items-center gap-2 mt-2">
          <input type="text" value={newValue} onChange={e => setNewValue(e.target.value)}
            placeholder="Value" onKeyDown={e => e.key === 'Enter' && handleAddItem()}
            className="flex-1 px-2.5 py-1.5 bg-slate-700 border border-slate-600 rounded text-xs text-white focus:outline-none focus:ring-1 focus:ring-synthia-500" />
          <input type="text" value={newLabel} onChange={e => setNewLabel(e.target.value)}
            placeholder="Label" onKeyDown={e => e.key === 'Enter' && handleAddItem()}
            className="flex-1 px-2.5 py-1.5 bg-slate-700 border border-slate-600 rounded text-xs text-white focus:outline-none focus:ring-1 focus:ring-synthia-500" />
          <button onClick={handleAddItem} disabled={!newValue.trim() || !newLabel.trim()}
            className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-white bg-synthia-600 hover:bg-synthia-700 rounded transition-colors disabled:opacity-50">
            <Plus className="w-3 h-3" /> Add
          </button>
        </div>
      </div>
    </div>
  );
}

function EditableItemRow({ item, onSave, onCancel }) {
  const [value, setValue] = useState(item.value);
  const [label, setLabel] = useState(item.label);
  const [sortOrder, setSortOrder] = useState(item.sortOrder);
  const [isActive, setIsActive] = useState(item.isActive);

  return (
    <>
      <div className="col-span-1">
        <input type="number" value={sortOrder} onChange={e => setSortOrder(Number(e.target.value))}
          className="w-full px-1 py-0.5 bg-slate-700 border border-slate-600 rounded text-xs text-white focus:outline-none" />
      </div>
      <div className="col-span-3">
        <input type="text" value={value} onChange={e => setValue(e.target.value)}
          className="w-full px-1 py-0.5 bg-slate-700 border border-slate-600 rounded text-xs text-white focus:outline-none" />
      </div>
      <div className="col-span-4">
        <input type="text" value={label} onChange={e => setLabel(e.target.value)}
          className="w-full px-1 py-0.5 bg-slate-700 border border-slate-600 rounded text-xs text-white focus:outline-none" />
      </div>
      <div className="col-span-2">
        <input type="checkbox" checked={isActive} onChange={e => setIsActive(e.target.checked)} />
      </div>
      <div className="col-span-2 flex gap-1 justify-end">
        <button onClick={() => onSave({ ...item, value, label, sortOrder, isActive })} className="p-1 text-green-400 hover:text-green-300">
          <Save className="w-3 h-3" />
        </button>
        <button onClick={onCancel} className="p-1 text-slate-400 hover:text-slate-200">
          <X className="w-3 h-3" />
        </button>
      </div>
    </>
  );
}
