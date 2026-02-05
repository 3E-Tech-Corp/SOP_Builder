import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Edit3, X, Save, FileText, Check } from 'lucide-react';
import { fetchDocumentTypes, createDocumentType, updateDocumentType, deleteDocumentType } from '../../utils/api';
import useSopStore from '../../store/sopStore';

export default function DocumentTypesPage() {
  const addToast = useSopStore(s => s.addToast);
  const [docTypes, setDocTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState('');
  const [editDesc, setEditDesc] = useState('');

  const loadDocTypes = async () => {
    try {
      const data = await fetchDocumentTypes();
      setDocTypes(data);
    } catch {
      addToast({ type: 'error', message: 'Failed to load document types' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadDocTypes(); }, []);

  const handleCreate = async () => {
    if (!newName.trim()) return;
    try {
      const type = await createDocumentType(newName.trim(), newDesc.trim() || null);
      setDocTypes(prev => [...prev, type]);
      setShowCreate(false);
      setNewName('');
      setNewDesc('');
      addToast({ type: 'success', message: `Created "${type.name}"` });
    } catch (err) {
      addToast({ type: 'error', message: err.response?.data?.error || 'Failed to create' });
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete document type "${name}"?`)) return;
    try {
      await deleteDocumentType(id);
      setDocTypes(prev => prev.filter(t => t.id !== id));
      addToast({ type: 'info', message: `Deleted "${name}"` });
    } catch {
      addToast({ type: 'error', message: 'Failed to delete' });
    }
  };

  const handleEdit = (type) => {
    setEditingId(type.id);
    setEditName(type.name);
    setEditDesc(type.description || '');
  };

  const handleSaveEdit = async () => {
    try {
      const updated = await updateDocumentType(editingId, { name: editName.trim(), description: editDesc.trim() || null });
      setDocTypes(prev => prev.map(t => t.id === editingId ? updated : t));
      setEditingId(null);
      addToast({ type: 'success', message: 'Updated' });
    } catch (err) {
      addToast({ type: 'error', message: err.response?.data?.error || 'Failed to update' });
    }
  };

  const handleToggleActive = async (type) => {
    try {
      const updated = await updateDocumentType(type.id, { isActive: !type.isActive });
      setDocTypes(prev => prev.map(t => t.id === type.id ? updated : t));
    } catch {
      addToast({ type: 'error', message: 'Failed to toggle status' });
    }
  };

  return (
    <div className="h-full overflow-auto">
      <div className="max-w-4xl mx-auto p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <FileText className="w-6 h-6 text-amber-400" />
              Document Types
            </h1>
            <p className="text-sm text-slate-400 mt-1">Manage document types used across SOPs</p>
          </div>
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-synthia-600 hover:bg-synthia-700 rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" />
            New Document Type
          </button>
        </div>

        {/* Create Form */}
        {showCreate && (
          <div className="mb-6 bg-slate-800 border border-slate-700 rounded-xl p-5">
            <h3 className="text-sm font-semibold text-white mb-3">Create Document Type</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-xs text-slate-400 mb-1">Name *</label>
                <input type="text" value={newName} onChange={e => setNewName(e.target.value)}
                  placeholder="e.g., Insurance Certificate" autoFocus onKeyDown={e => e.key === 'Enter' && handleCreate()}
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

        {/* Document Types Table */}
        <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden">
          {loading ? (
            <p className="text-sm text-slate-500 text-center py-8">Loading...</p>
          ) : docTypes.length === 0 ? (
            <p className="text-sm text-slate-500 text-center py-8">No document types yet</p>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-700">
                  <th className="text-left px-4 py-3 text-xs text-slate-400 font-semibold uppercase tracking-wider">Name</th>
                  <th className="text-left px-4 py-3 text-xs text-slate-400 font-semibold uppercase tracking-wider">Description</th>
                  <th className="text-center px-4 py-3 text-xs text-slate-400 font-semibold uppercase tracking-wider">Active</th>
                  <th className="text-right px-4 py-3 text-xs text-slate-400 font-semibold uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody>
                {docTypes.map(type => (
                  <tr key={type.id} className="border-b border-slate-700/50 hover:bg-slate-700/20 group">
                    {editingId === type.id ? (
                      <>
                        <td className="px-4 py-2">
                          <input type="text" value={editName} onChange={e => setEditName(e.target.value)}
                            className="w-full px-2 py-1 bg-slate-700 border border-slate-600 rounded text-sm text-white focus:outline-none focus:ring-1 focus:ring-synthia-500" />
                        </td>
                        <td className="px-4 py-2">
                          <input type="text" value={editDesc} onChange={e => setEditDesc(e.target.value)}
                            className="w-full px-2 py-1 bg-slate-700 border border-slate-600 rounded text-sm text-white focus:outline-none focus:ring-1 focus:ring-synthia-500" />
                        </td>
                        <td />
                        <td className="px-4 py-2 text-right">
                          <button onClick={handleSaveEdit} className="p-1 text-green-400 hover:text-green-300 mr-1">
                            <Save className="w-4 h-4" />
                          </button>
                          <button onClick={() => setEditingId(null)} className="p-1 text-slate-400 hover:text-slate-200">
                            <X className="w-4 h-4" />
                          </button>
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="px-4 py-3 text-sm text-white font-medium">{type.name}</td>
                        <td className="px-4 py-3 text-sm text-slate-400">{type.description || '-'}</td>
                        <td className="px-4 py-3 text-center">
                          <button onClick={() => handleToggleActive(type)}
                            className={`w-5 h-5 rounded border ${type.isActive ? 'bg-green-500/20 border-green-500 text-green-400' : 'bg-slate-700 border-slate-600 text-transparent'}`}>
                            <Check className="w-3 h-3 mx-auto" />
                          </button>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button onClick={() => handleEdit(type)} className="p-1 text-slate-400 hover:text-synthia-400 opacity-0 group-hover:opacity-100 transition-all mr-1">
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button onClick={() => handleDelete(type.id, type.name)} className="p-1 text-slate-400 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
