import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Edit3, X, Save, Bell, Zap, Mail, Smartphone, ChevronDown, ChevronRight } from 'lucide-react';
import {
  fetchEventTypes, createEventType, updateEventType, deleteEventType,
  fetchNotificationRules, createNotificationRule, updateNotificationRule, deleteNotificationRule,
} from '../../utils/api';
import useSopStore from '../../store/sopStore';

const CHANNELS = ['email', 'sms', 'webhook', 'in_app'];

export default function EventsPage() {
  const addToast = useSopStore(s => s.addToast);
  const [eventTypes, setEventTypes] = useState([]);
  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('events');
  const [showCreateEvent, setShowCreateEvent] = useState(false);
  const [showCreateRule, setShowCreateRule] = useState(false);

  const loadData = async () => {
    try {
      const [et, nr] = await Promise.all([fetchEventTypes(), fetchNotificationRules()]);
      setEventTypes(et);
      setRules(nr);
    } catch {
      addToast({ type: 'error', message: 'Failed to load event data' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  return (
    <div className="h-full overflow-auto">
      <div className="max-w-5xl mx-auto p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <Bell className="w-6 h-6 text-synthia-400" />
              Events & Notifications
            </h1>
            <p className="text-sm text-slate-400 mt-1">Manage event types and notification rules</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-700 mb-6">
          <button
            onClick={() => setTab('events')}
            className={`px-4 py-2.5 text-sm font-medium transition-colors ${
              tab === 'events' ? 'text-synthia-400 border-b-2 border-synthia-500' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Zap className="w-4 h-4 inline mr-1.5" />
            Event Types ({eventTypes.length})
          </button>
          <button
            onClick={() => setTab('rules')}
            className={`px-4 py-2.5 text-sm font-medium transition-colors ${
              tab === 'rules' ? 'text-synthia-400 border-b-2 border-synthia-500' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Bell className="w-4 h-4 inline mr-1.5" />
            Notification Rules ({rules.length})
          </button>
        </div>

        {tab === 'events' ? (
          <EventTypesPanel
            eventTypes={eventTypes}
            loading={loading}
            showCreate={showCreateEvent}
            setShowCreate={setShowCreateEvent}
            onReload={loadData}
            addToast={addToast}
          />
        ) : (
          <NotificationRulesPanel
            rules={rules}
            eventTypes={eventTypes}
            loading={loading}
            showCreate={showCreateRule}
            setShowCreate={setShowCreateRule}
            onReload={loadData}
            addToast={addToast}
          />
        )}
      </div>
    </div>
  );
}

function EventTypesPanel({ eventTypes, loading, showCreate, setShowCreate, onReload, addToast }) {
  const [newCode, setNewCode] = useState('');
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData] = useState({});

  const handleCreate = async () => {
    if (!newCode.trim() || !newName.trim()) return;
    try {
      await createEventType(newCode.trim(), newName.trim(), newDesc.trim() || null);
      setShowCreate(false);
      setNewCode('');
      setNewName('');
      setNewDesc('');
      onReload();
      addToast({ type: 'success', message: 'Event type created' });
    } catch (err) {
      addToast({ type: 'error', message: err.response?.data?.error || 'Failed to create' });
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete event type "${name}" and its notification rules?`)) return;
    try {
      await deleteEventType(id);
      onReload();
      addToast({ type: 'info', message: `Deleted "${name}"` });
    } catch {
      addToast({ type: 'error', message: 'Failed to delete' });
    }
  };

  const handleSaveEdit = async () => {
    try {
      await updateEventType(editingId, editData);
      setEditingId(null);
      onReload();
      addToast({ type: 'success', message: 'Updated' });
    } catch (err) {
      addToast({ type: 'error', message: err.response?.data?.error || 'Failed to update' });
    }
  };

  return (
    <>
      <div className="flex justify-end mb-4">
        <button onClick={() => setShowCreate(true)}
          className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-synthia-600 hover:bg-synthia-700 rounded-lg transition-colors">
          <Plus className="w-4 h-4" /> New Event Type
        </button>
      </div>

      {showCreate && (
        <div className="mb-6 bg-slate-800 border border-slate-700 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-white mb-3">Create Event Type</h3>
          <div className="grid grid-cols-3 gap-3 mb-3">
            <div>
              <label className="block text-xs text-slate-400 mb-1">Code *</label>
              <input type="text" value={newCode} onChange={e => setNewCode(e.target.value)}
                placeholder="e.g., custom_event" autoFocus
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-synthia-500" />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Name *</label>
              <input type="text" value={newName} onChange={e => setNewName(e.target.value)}
                placeholder="e.g., Custom Event"
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-synthia-500" />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Description</label>
              <input type="text" value={newDesc} onChange={e => setNewDesc(e.target.value)}
                placeholder="Optional"
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-synthia-500" />
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={handleCreate} disabled={!newCode.trim() || !newName.trim()}
              className="px-4 py-2 text-sm font-medium text-white bg-synthia-600 rounded-lg disabled:opacity-50">Create</button>
            <button onClick={() => setShowCreate(false)} className="px-4 py-2 text-sm text-slate-400">Cancel</button>
          </div>
        </div>
      )}

      <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden">
        {loading ? (
          <p className="text-sm text-slate-500 text-center py-8">Loading...</p>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-700">
                <th className="text-left px-4 py-3 text-xs text-slate-400 font-semibold uppercase tracking-wider">Code</th>
                <th className="text-left px-4 py-3 text-xs text-slate-400 font-semibold uppercase tracking-wider">Name</th>
                <th className="text-left px-4 py-3 text-xs text-slate-400 font-semibold uppercase tracking-wider">Description</th>
                <th className="text-center px-4 py-3 text-xs text-slate-400 font-semibold uppercase tracking-wider">Rules</th>
                <th className="text-center px-4 py-3 text-xs text-slate-400 font-semibold uppercase tracking-wider">Active</th>
                <th className="text-right px-4 py-3 text-xs text-slate-400 font-semibold uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody>
              {eventTypes.map(et => (
                <tr key={et.id} className="border-b border-slate-700/50 hover:bg-slate-700/20 group">
                  {editingId === et.id ? (
                    <>
                      <td className="px-4 py-2">
                        <input type="text" value={editData.code || ''} onChange={e => setEditData({ ...editData, code: e.target.value })}
                          className="w-full px-2 py-1 bg-slate-700 border border-slate-600 rounded text-xs text-white font-mono focus:outline-none" />
                      </td>
                      <td className="px-4 py-2">
                        <input type="text" value={editData.name || ''} onChange={e => setEditData({ ...editData, name: e.target.value })}
                          className="w-full px-2 py-1 bg-slate-700 border border-slate-600 rounded text-sm text-white focus:outline-none" />
                      </td>
                      <td className="px-4 py-2">
                        <input type="text" value={editData.description || ''} onChange={e => setEditData({ ...editData, description: e.target.value })}
                          className="w-full px-2 py-1 bg-slate-700 border border-slate-600 rounded text-sm text-white focus:outline-none" />
                      </td>
                      <td />
                      <td />
                      <td className="px-4 py-2 text-right">
                        <button onClick={handleSaveEdit} className="p-1 text-green-400 hover:text-green-300 mr-1"><Save className="w-4 h-4" /></button>
                        <button onClick={() => setEditingId(null)} className="p-1 text-slate-400"><X className="w-4 h-4" /></button>
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="px-4 py-3 text-xs text-synthia-400 font-mono">{et.code}</td>
                      <td className="px-4 py-3 text-sm text-white">{et.name}</td>
                      <td className="px-4 py-3 text-sm text-slate-400">{et.description || '-'}</td>
                      <td className="px-4 py-3 text-center">
                        <span className="text-xs bg-slate-700 px-2 py-0.5 rounded text-slate-300">{et.ruleCount}</span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`text-[10px] px-1.5 py-0.5 rounded ${et.isActive ? 'bg-green-500/15 text-green-400' : 'bg-red-500/15 text-red-400'}`}>
                          {et.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button onClick={() => { setEditingId(et.id); setEditData({ code: et.code, name: et.name, description: et.description }); }}
                          className="p-1 text-slate-400 hover:text-synthia-400 opacity-0 group-hover:opacity-100 transition-all mr-1">
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDelete(et.id, et.name)}
                          className="p-1 text-slate-400 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all">
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
    </>
  );
}

function NotificationRulesPanel({ rules, eventTypes, loading, showCreate, setShowCreate, onReload, addToast }) {
  const [newRule, setNewRule] = useState({ eventTypeCode: '', channel: 'email', template: '', recipients: 'owner' });
  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData] = useState({});

  const handleCreate = async () => {
    if (!newRule.eventTypeCode || !newRule.channel) return;
    try {
      await createNotificationRule(newRule);
      setShowCreate(false);
      setNewRule({ eventTypeCode: '', channel: 'email', template: '', recipients: 'owner' });
      onReload();
      addToast({ type: 'success', message: 'Notification rule created' });
    } catch (err) {
      addToast({ type: 'error', message: err.response?.data?.error || 'Failed to create' });
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this notification rule?')) return;
    try {
      await deleteNotificationRule(id);
      onReload();
      addToast({ type: 'info', message: 'Rule deleted' });
    } catch {
      addToast({ type: 'error', message: 'Failed to delete' });
    }
  };

  const handleSaveEdit = async () => {
    try {
      await updateNotificationRule(editingId, editData);
      setEditingId(null);
      onReload();
      addToast({ type: 'success', message: 'Updated' });
    } catch (err) {
      addToast({ type: 'error', message: err.response?.data?.error || 'Failed to update' });
    }
  };

  const handleToggleActive = async (rule) => {
    try {
      await updateNotificationRule(rule.id, { isActive: !rule.isActive });
      onReload();
    } catch {
      addToast({ type: 'error', message: 'Failed to toggle' });
    }
  };

  return (
    <>
      <div className="flex justify-end mb-4">
        <button onClick={() => setShowCreate(true)}
          className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-synthia-600 hover:bg-synthia-700 rounded-lg transition-colors">
          <Plus className="w-4 h-4" /> New Rule
        </button>
      </div>

      {showCreate && (
        <div className="mb-6 bg-slate-800 border border-slate-700 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-white mb-3">Create Notification Rule</h3>
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div>
              <label className="block text-xs text-slate-400 mb-1">Event Type *</label>
              <select value={newRule.eventTypeCode} onChange={e => setNewRule({ ...newRule, eventTypeCode: e.target.value })}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-synthia-500">
                <option value="">Select event...</option>
                {eventTypes.filter(et => et.isActive).map(et => (
                  <option key={et.code} value={et.code}>{et.name} ({et.code})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Channel *</label>
              <select value={newRule.channel} onChange={e => setNewRule({ ...newRule, channel: e.target.value })}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-synthia-500">
                {CHANNELS.map(ch => <option key={ch} value={ch}>{ch}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Recipients</label>
              <input type="text" value={newRule.recipients} onChange={e => setNewRule({ ...newRule, recipients: e.target.value })}
                placeholder="owner, admin, custom@email.com"
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-synthia-500" />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Template</label>
              <input type="text" value={newRule.template} onChange={e => setNewRule({ ...newRule, template: e.target.value })}
                placeholder="{objectName} - {action} - {toStatus}"
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-synthia-500" />
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={handleCreate} disabled={!newRule.eventTypeCode || !newRule.channel}
              className="px-4 py-2 text-sm font-medium text-white bg-synthia-600 rounded-lg disabled:opacity-50">Create</button>
            <button onClick={() => setShowCreate(false)} className="px-4 py-2 text-sm text-slate-400">Cancel</button>
          </div>
        </div>
      )}

      <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden">
        {loading ? (
          <p className="text-sm text-slate-500 text-center py-8">Loading...</p>
        ) : rules.length === 0 ? (
          <p className="text-sm text-slate-500 text-center py-8">No notification rules yet. Create one to start dispatching notifications on events.</p>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-700">
                <th className="text-left px-4 py-3 text-xs text-slate-400 font-semibold uppercase tracking-wider">Event</th>
                <th className="text-left px-4 py-3 text-xs text-slate-400 font-semibold uppercase tracking-wider">Channel</th>
                <th className="text-left px-4 py-3 text-xs text-slate-400 font-semibold uppercase tracking-wider">Recipients</th>
                <th className="text-left px-4 py-3 text-xs text-slate-400 font-semibold uppercase tracking-wider">Template</th>
                <th className="text-center px-4 py-3 text-xs text-slate-400 font-semibold uppercase tracking-wider">Active</th>
                <th className="text-right px-4 py-3 text-xs text-slate-400 font-semibold uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rules.map(rule => (
                <tr key={rule.id} className="border-b border-slate-700/50 hover:bg-slate-700/20 group">
                  {editingId === rule.id ? (
                    <>
                      <td className="px-4 py-2">
                        <select value={editData.eventTypeCode || ''} onChange={e => setEditData({ ...editData, eventTypeCode: e.target.value })}
                          className="w-full px-2 py-1 bg-slate-700 border border-slate-600 rounded text-xs text-white focus:outline-none">
                          {eventTypes.map(et => <option key={et.code} value={et.code}>{et.name}</option>)}
                        </select>
                      </td>
                      <td className="px-4 py-2">
                        <select value={editData.channel || ''} onChange={e => setEditData({ ...editData, channel: e.target.value })}
                          className="w-full px-2 py-1 bg-slate-700 border border-slate-600 rounded text-xs text-white focus:outline-none">
                          {CHANNELS.map(ch => <option key={ch} value={ch}>{ch}</option>)}
                        </select>
                      </td>
                      <td className="px-4 py-2">
                        <input type="text" value={editData.recipients || ''} onChange={e => setEditData({ ...editData, recipients: e.target.value })}
                          className="w-full px-2 py-1 bg-slate-700 border border-slate-600 rounded text-xs text-white focus:outline-none" />
                      </td>
                      <td className="px-4 py-2">
                        <input type="text" value={editData.template || ''} onChange={e => setEditData({ ...editData, template: e.target.value })}
                          className="w-full px-2 py-1 bg-slate-700 border border-slate-600 rounded text-xs text-white focus:outline-none" />
                      </td>
                      <td />
                      <td className="px-4 py-2 text-right">
                        <button onClick={handleSaveEdit} className="p-1 text-green-400 hover:text-green-300 mr-1"><Save className="w-4 h-4" /></button>
                        <button onClick={() => setEditingId(null)} className="p-1 text-slate-400"><X className="w-4 h-4" /></button>
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="px-4 py-3">
                        <span className="text-xs text-synthia-400 font-mono">{rule.eventTypeCode}</span>
                        {rule.eventTypeName && <span className="text-xs text-slate-500 ml-1.5">({rule.eventTypeName})</span>}
                      </td>
                      <td className="px-4 py-3">
                        <span className="flex items-center gap-1 text-sm text-white">
                          {rule.channel === 'email' && <Mail className="w-3.5 h-3.5 text-blue-400" />}
                          {rule.channel === 'sms' && <Smartphone className="w-3.5 h-3.5 text-green-400" />}
                          {rule.channel}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-300">{rule.recipients}</td>
                      <td className="px-4 py-3 text-xs text-slate-400 max-w-[200px] truncate">{rule.template || '-'}</td>
                      <td className="px-4 py-3 text-center">
                        <button onClick={() => handleToggleActive(rule)}
                          className={`text-[10px] px-1.5 py-0.5 rounded cursor-pointer ${rule.isActive ? 'bg-green-500/15 text-green-400' : 'bg-red-500/15 text-red-400'}`}>
                          {rule.isActive ? 'Active' : 'Inactive'}
                        </button>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button onClick={() => { setEditingId(rule.id); setEditData({ eventTypeCode: rule.eventTypeCode, channel: rule.channel, recipients: rule.recipients, template: rule.template }); }}
                          className="p-1 text-slate-400 hover:text-synthia-400 opacity-0 group-hover:opacity-100 transition-all mr-1">
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDelete(rule.id)}
                          className="p-1 text-slate-400 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all">
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
    </>
  );
}
