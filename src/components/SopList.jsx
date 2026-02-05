import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Edit3, Copy, Trash2, Play, Download, Upload, Workflow, Clock, GitBranch } from 'lucide-react';
import { fetchSOPs, fetchSOP, createSOP, deleteSOP, duplicateSOP, exportSopJson, importSopJson } from '../utils/api';
import useSopStore from '../store/sopStore';

export default function SopList() {
  const [sops, setSOPs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const fileInputRef = useRef(null);
  const navigate = useNavigate();
  const addToast = useSopStore(s => s.addToast);

  const refresh = async () => {
    try {
      const data = await fetchSOPs();
      setSOPs(data);
    } catch (err) {
      addToast({ type: 'error', message: 'Failed to load SOPs' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { refresh(); }, []);

  const handleCreate = async () => {
    if (!newName.trim()) return;
    try {
      const sop = await createSOP(newName.trim(), newDesc.trim(), { nodes: [], edges: [], objectSchema: { properties: [] } });
      setNewName('');
      setNewDesc('');
      setShowCreate(false);
      addToast({ type: 'success', message: `Created "${sop.name}"` });
      navigate(`/designer/${sop.id}`);
    } catch (err) {
      addToast({ type: 'error', message: err.response?.data?.error || 'Failed to create SOP' });
    }
  };

  const handleDuplicate = async (id) => {
    try {
      const copy = await duplicateSOP(id);
      refresh();
      addToast({ type: 'success', message: `Duplicated as "${copy.name}"` });
    } catch {
      addToast({ type: 'error', message: 'Failed to duplicate SOP' });
    }
  };

  const handleDelete = async (id, name) => {
    if (window.confirm(`Delete "${name}"? This cannot be undone.`)) {
      try {
        await deleteSOP(id);
        refresh();
        addToast({ type: 'info', message: `Deleted "${name}"` });
      } catch {
        addToast({ type: 'error', message: 'Failed to delete SOP' });
      }
    }
  };

  const handleExport = async (sop) => {
    try {
      const fullSop = await fetchSOP(sop.id);
      exportSopJson(fullSop);
      addToast({ type: 'success', message: `Exported "${sop.name}"` });
    } catch {
      addToast({ type: 'error', message: 'Failed to export SOP' });
    }
  };

  const handleImport = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const sop = await importSopJson(file);
      refresh();
      addToast({ type: 'success', message: `Imported "${sop.name}"` });
    } catch {
      addToast({ type: 'error', message: 'Failed to import SOP file' });
    }
    e.target.value = '';
  };

  return (
    <div className="h-full overflow-auto">
      <div className="max-w-6xl mx-auto p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-white">My SOPs</h1>
            <p className="text-sm text-slate-400 mt-1">
              Design, test, and manage your Standard Operating Procedures
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-1.5 px-3 py-2 text-sm text-slate-300 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors"
            >
              <Upload className="w-4 h-4" />
              Import
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleImport}
              className="hidden"
            />
            <button
              onClick={() => setShowCreate(true)}
              className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-synthia-600 hover:bg-synthia-700 rounded-lg transition-colors shadow-lg shadow-synthia-500/20"
            >
              <Plus className="w-4 h-4" />
              New SOP
            </button>
          </div>
        </div>

        {/* Create Modal */}
        {showCreate && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-slate-800 border border-slate-600 rounded-xl shadow-2xl p-6 w-full max-w-md mx-4">
              <h2 className="text-lg font-bold text-white mb-4">Create New SOP</h2>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm text-slate-300 mb-1">Name</label>
                  <input
                    type="text"
                    value={newName}
                    onChange={e => setNewName(e.target.value)}
                    placeholder="e.g., Employee Onboarding"
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-synthia-500 focus:border-transparent"
                    autoFocus
                    onKeyDown={e => e.key === 'Enter' && handleCreate()}
                  />
                </div>
                <div>
                  <label className="block text-sm text-slate-300 mb-1">Description</label>
                  <textarea
                    value={newDesc}
                    onChange={e => setNewDesc(e.target.value)}
                    placeholder="Brief description of this SOP..."
                    rows={3}
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-synthia-500 focus:border-transparent resize-none"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 mt-5">
                <button
                  onClick={() => { setShowCreate(false); setNewName(''); setNewDesc(''); }}
                  className="px-4 py-2 text-sm text-slate-300 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreate}
                  disabled={!newName.trim()}
                  className="px-4 py-2 text-sm font-medium text-white bg-synthia-600 hover:bg-synthia-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Create & Design
                </button>
              </div>
            </div>
          </div>
        )}

        {/* SOP Grid */}
        {loading ? (
          <div className="text-center py-20">
            <p className="text-slate-400">Loading...</p>
          </div>
        ) : sops.length === 0 ? (
          <div className="text-center py-20">
            <Workflow className="w-16 h-16 text-slate-600 mx-auto mb-4" />
            <h2 className="text-lg font-medium text-slate-400 mb-2">No SOPs yet</h2>
            <p className="text-sm text-slate-500 mb-6">Create your first Standard Operating Procedure to get started.</p>
            <button
              onClick={() => setShowCreate(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-synthia-600 hover:bg-synthia-700 rounded-lg transition-colors"
            >
              <Plus className="w-4 h-4" />
              Create SOP
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {sops.map(sop => (
              <SopCard
                key={sop.id}
                sop={sop}
                onEdit={() => navigate(`/designer/${sop.id}`)}
                onTest={() => navigate(`/tester/${sop.id}`)}
                onDuplicate={() => handleDuplicate(sop.id)}
                onDelete={() => handleDelete(sop.id, sop.name)}
                onExport={() => handleExport(sop)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function SopCard({ sop, onEdit, onTest, onDuplicate, onDelete, onExport }) {
  const nodeCount = sop.nodeCount || 0;
  const edgeCount = sop.edgeCount || 0;
  const updatedAt = sop.updatedAt ? new Date(sop.updatedAt).toLocaleDateString() : 'N/A';

  return (
    <div className="group bg-slate-800 border border-slate-700 rounded-xl p-5 hover:border-synthia-500/50 transition-all hover:shadow-lg hover:shadow-synthia-500/5">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <h3 className="text-base font-semibold text-white truncate">{sop.name}</h3>
          <p className="text-xs text-slate-400 mt-1 line-clamp-2">{sop.description || 'No description'}</p>
        </div>
        {sop.status && sop.status !== 'Draft' && (
          <span className={`text-[10px] px-1.5 py-0.5 rounded ml-2 ${
            sop.status === 'Published' ? 'bg-green-500/20 text-green-400' : 'bg-slate-600 text-slate-400'
          }`}>{sop.status}</span>
        )}
      </div>

      <div className="flex items-center gap-4 text-xs text-slate-500 mb-4">
        <span className="flex items-center gap-1">
          <GitBranch className="w-3.5 h-3.5" />
          {nodeCount} nodes, {edgeCount} edges
        </span>
        <span className="flex items-center gap-1">
          <Clock className="w-3.5 h-3.5" />
          {updatedAt}
        </span>
      </div>

      <div className="flex items-center gap-1.5">
        <button
          onClick={onEdit}
          className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-synthia-400 bg-synthia-500/10 hover:bg-synthia-500/20 rounded-md transition-colors"
        >
          <Edit3 className="w-3 h-3" />
          Design
        </button>
        <button
          onClick={onTest}
          className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-green-400 bg-green-500/10 hover:bg-green-500/20 rounded-md transition-colors"
        >
          <Play className="w-3 h-3" />
          Test
        </button>
        <button
          onClick={onExport}
          className="flex items-center gap-1 px-2 py-1.5 text-xs text-slate-400 hover:text-slate-200 hover:bg-slate-700 rounded-md transition-colors"
          title="Export JSON"
        >
          <Download className="w-3 h-3" />
        </button>
        <button
          onClick={onDuplicate}
          className="flex items-center gap-1 px-2 py-1.5 text-xs text-slate-400 hover:text-slate-200 hover:bg-slate-700 rounded-md transition-colors"
          title="Duplicate"
        >
          <Copy className="w-3 h-3" />
        </button>
        <button
          onClick={onDelete}
          className="flex items-center gap-1 px-2 py-1.5 text-xs text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-md transition-colors ml-auto"
          title="Delete"
        >
          <Trash2 className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
}
