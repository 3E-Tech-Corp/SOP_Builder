import React, { useState, useEffect } from 'react';
import { Key, Plus, Trash2, Copy, Eye, EyeOff, LogOut } from 'lucide-react';
import { getApiKeys, createApiKey, revokeApiKey } from '../utils/api';
import useAuthStore from '../store/authStore';
import useSopStore from '../store/sopStore';

export default function SettingsPage() {
  const user = useAuthStore(s => s.user);
  const logout = useAuthStore(s => s.logout);
  const addToast = useSopStore(s => s.addToast);
  const [apiKeys, setApiKeys] = useState([]);
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');
  const [newScopes, setNewScopes] = useState('sop:read,sop:write,object:read,object:write,audit:read');
  const [createdKey, setCreatedKey] = useState(null);
  const [showKey, setShowKey] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadKeys = async () => {
    try {
      const keys = await getApiKeys();
      setApiKeys(keys);
    } catch {
      addToast({ type: 'error', message: 'Failed to load API keys' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadKeys(); }, []);

  const handleCreate = async () => {
    if (!newName.trim()) return;
    try {
      const result = await createApiKey(newName.trim(), newScopes);
      setCreatedKey(result.key);
      setShowKey(true);
      setNewName('');
      setShowCreate(false);
      loadKeys();
      addToast({ type: 'success', message: 'API key created' });
    } catch (err) {
      addToast({ type: 'error', message: err.response?.data?.error || 'Failed to create API key' });
    }
  };

  const handleRevoke = async (id, name) => {
    if (!window.confirm(`Revoke API key "${name}"? This cannot be undone.`)) return;
    try {
      await revokeApiKey(id);
      loadKeys();
      addToast({ type: 'info', message: `Revoked "${name}"` });
    } catch {
      addToast({ type: 'error', message: 'Failed to revoke API key' });
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    addToast({ type: 'success', message: 'Copied to clipboard' });
  };

  return (
    <div className="h-full overflow-auto">
      <div className="max-w-3xl mx-auto p-6">
        <h1 className="text-2xl font-bold text-white mb-6">Settings</h1>

        {/* User Info */}
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-5 mb-6">
          <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-3">Account</h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-400">Name</span>
              <span className="text-white">{user?.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Email</span>
              <span className="text-white">{user?.email}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Role</span>
              <span className="text-synthia-400">{user?.role}</span>
            </div>
          </div>
          <button
            onClick={() => { logout(); window.location.href = '/login'; }}
            className="mt-4 flex items-center gap-1.5 px-3 py-1.5 text-xs text-red-400 bg-red-500/10 hover:bg-red-500/20 rounded-lg transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            Sign Out
          </button>
        </div>

        {/* Created Key Banner */}
        {createdKey && (
          <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-5 mb-6">
            <h3 className="text-sm font-semibold text-green-400 mb-2">🔑 New API Key Created</h3>
            <p className="text-xs text-green-300/70 mb-3">
              Copy this key now — it won't be shown again!
            </p>
            <div className="flex items-center gap-2">
              <code className="flex-1 px-3 py-2 bg-slate-800 rounded text-xs text-green-300 font-mono break-all">
                {showKey ? createdKey : '•'.repeat(40)}
              </code>
              <button onClick={() => setShowKey(!showKey)} className="p-2 text-slate-400 hover:text-slate-200 transition-colors">
                {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
              <button onClick={() => copyToClipboard(createdKey)} className="p-2 text-slate-400 hover:text-slate-200 transition-colors">
                <Copy className="w-4 h-4" />
              </button>
            </div>
            <button
              onClick={() => setCreatedKey(null)}
              className="mt-3 text-xs text-slate-400 hover:text-slate-200 transition-colors"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* API Keys */}
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Key className="w-4 h-4 text-synthia-400" />
              <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">API Keys</h2>
            </div>
            <button
              onClick={() => setShowCreate(true)}
              className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-white bg-synthia-600 hover:bg-synthia-700 rounded-lg transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              New Key
            </button>
          </div>

          <p className="text-xs text-slate-500 mb-4">
            Use API keys to integrate external systems with SOP Builder. Keys use the <code className="text-synthia-400">X-API-Key</code> header.
          </p>

          {/* Create Form */}
          {showCreate && (
            <div className="mb-4 p-4 bg-slate-900/50 rounded-lg border border-slate-700">
              <div className="space-y-3">
                <div>
                  <label className="block text-xs text-slate-300 mb-1">Key Name</label>
                  <input
                    type="text"
                    value={newName}
                    onChange={e => setNewName(e.target.value)}
                    placeholder="e.g., Production Integration"
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-synthia-500"
                    autoFocus
                    onKeyDown={e => e.key === 'Enter' && handleCreate()}
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-300 mb-1">Scopes</label>
                  <input
                    type="text"
                    value={newScopes}
                    onChange={e => setNewScopes(e.target.value)}
                    placeholder="sop:read,sop:write,object:read,object:write,audit:read"
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-synthia-500"
                  />
                  <p className="text-[10px] text-slate-500 mt-1">Comma-separated: sop:read, sop:write, object:read, object:write, audit:read</p>
                </div>
              </div>
              <div className="flex gap-2 mt-3">
                <button onClick={handleCreate} disabled={!newName.trim()}
                  className="px-4 py-1.5 text-xs font-medium text-white bg-synthia-600 hover:bg-synthia-700 rounded-lg transition-colors disabled:opacity-50">
                  Create
                </button>
                <button onClick={() => { setShowCreate(false); setNewName(''); }}
                  className="px-4 py-1.5 text-xs text-slate-400 hover:text-slate-200 transition-colors">
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Key List */}
          {loading ? (
            <p className="text-sm text-slate-500 py-4 text-center">Loading...</p>
          ) : apiKeys.length === 0 ? (
            <p className="text-sm text-slate-500 py-4 text-center">No API keys yet</p>
          ) : (
            <div className="space-y-2">
              {apiKeys.map(key => (
                <div key={key.id} className="flex items-center justify-between p-3 bg-slate-900/30 rounded-lg border border-slate-700/50">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-white">{key.name}</span>
                      {!key.isActive && (
                        <span className="text-[10px] px-1.5 py-0.5 bg-red-500/20 text-red-400 rounded">Revoked</span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
                      <code className="text-slate-400">{key.keyPrefix}...</code>
                      <span>Created {new Date(key.createdAt).toLocaleDateString()}</span>
                      {key.lastUsedAt && <span>Last used {new Date(key.lastUsedAt).toLocaleDateString()}</span>}
                    </div>
                    {key.scopes && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {key.scopes.split(',').map(s => (
                          <span key={s} className="text-[10px] px-1.5 py-0.5 bg-slate-700 text-slate-400 rounded">{s.trim()}</span>
                        ))}
                      </div>
                    )}
                  </div>
                  {key.isActive && (
                    <button
                      onClick={() => handleRevoke(key.id, key.name)}
                      className="p-1.5 text-slate-400 hover:text-red-400 transition-colors"
                      title="Revoke"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
