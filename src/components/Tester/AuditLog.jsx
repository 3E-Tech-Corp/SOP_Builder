import React, { useState, useMemo } from 'react';
import { Download, Filter, X, Shield, FileText, Bell } from 'lucide-react';

export default function AuditLog({ testObjects, sopName }) {
  const [filterObject, setFilterObject] = useState('');
  const [filterAction, setFilterAction] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  const allAudits = useMemo(() => {
    const entries = [];
    for (const obj of testObjects) {
      for (const entry of obj.audit || []) {
        entries.push(entry);
      }
    }
    return entries.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  }, [testObjects]);

  const uniqueObjects = useMemo(() => [...new Set(allAudits.map(a => a.objectName))], [allAudits]);
  const uniqueActions = useMemo(() => [...new Set(allAudits.map(a => a.action))], [allAudits]);
  const uniqueStatuses = useMemo(() => {
    const s = new Set();
    allAudits.forEach(a => { s.add(a.fromStatus); s.add(a.toStatus); });
    return [...s];
  }, [allAudits]);

  const filtered = useMemo(() => {
    return allAudits.filter(a => {
      if (filterObject && a.objectName !== filterObject) return false;
      if (filterAction && a.action !== filterAction) return false;
      if (filterStatus && a.fromStatus !== filterStatus && a.toStatus !== filterStatus) return false;
      return true;
    });
  }, [allAudits, filterObject, filterAction, filterStatus]);

  const exportCSV = () => {
    const headers = ['Timestamp', 'Object', 'From Status', 'Action', 'To Status', 'Actor', 'Role', 'Fields', 'Documents', 'Notifications'];
    const rows = filtered.map(a => [
      new Date(a.timestamp).toLocaleString(),
      a.objectName,
      a.fromStatus,
      a.action,
      a.toStatus,
      a.actor || 'N/A',
      a.role || 'N/A',
      Object.entries(a.fieldValues || {}).map(([k, v]) => `${k}=${v}`).join('; '),
      (a.documentsAttached || []).join('; '),
      (a.notifications || []).length,
    ]);
    const csv = [headers, ...rows].map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${sopName || 'sop'}-audit-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const hasFilters = filterObject || filterAction || filterStatus;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-slate-700 bg-slate-800/60">
        <div className="flex items-center gap-2">
          <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Audit Trail</h3>
          <span className="text-[10px] text-slate-500">({filtered.length})</span>
        </div>
        <button onClick={exportCSV} disabled={filtered.length === 0}
          className="flex items-center gap-1 px-2 py-1 text-[10px] text-slate-400 hover:text-slate-200 bg-slate-700 hover:bg-slate-600 rounded transition-colors disabled:opacity-50">
          <Download className="w-3 h-3" /> CSV
        </button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-slate-700/50 bg-slate-800/30 flex-wrap">
        <Filter className="w-3 h-3 text-slate-500 flex-shrink-0" />
        <select value={filterObject} onChange={e => setFilterObject(e.target.value)}
          className="px-1.5 py-0.5 bg-slate-700 border border-slate-600 rounded text-[10px] text-white focus:outline-none focus:ring-1 focus:ring-synthia-500">
          <option value="">All Objects</option>
          {uniqueObjects.map(o => <option key={o} value={o}>{o}</option>)}
        </select>
        <select value={filterAction} onChange={e => setFilterAction(e.target.value)}
          className="px-1.5 py-0.5 bg-slate-700 border border-slate-600 rounded text-[10px] text-white focus:outline-none focus:ring-1 focus:ring-synthia-500">
          <option value="">All Actions</option>
          {uniqueActions.map(a => <option key={a} value={a}>{a}</option>)}
        </select>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
          className="px-1.5 py-0.5 bg-slate-700 border border-slate-600 rounded text-[10px] text-white focus:outline-none focus:ring-1 focus:ring-synthia-500">
          <option value="">All Statuses</option>
          {uniqueStatuses.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        {hasFilters && (
          <button onClick={() => { setFilterObject(''); setFilterAction(''); setFilterStatus(''); }}
            className="p-0.5 text-slate-400 hover:text-slate-200 transition-colors">
            <X className="w-3 h-3" />
          </button>
        )}
      </div>

      {/* Entries */}
      <div className="flex-1 overflow-auto">
        {filtered.length === 0 ? (
          <div className="text-center py-8 text-slate-500 text-xs">
            No audit entries yet. Execute actions to build the trail.
          </div>
        ) : (
          <div className="divide-y divide-slate-700/30">
            {filtered.map(entry => (
              <div key={entry.id} className="px-3 py-2.5 hover:bg-slate-800/50 transition-colors">
                {/* Main row */}
                <div className="flex items-center gap-2 text-[11px]">
                  <span className="text-slate-500 font-mono text-[10px] flex-shrink-0">
                    {new Date(entry.timestamp).toLocaleTimeString()}
                  </span>
                  <span className="text-slate-300 font-medium truncate">{entry.objectName}</span>
                </div>

                {/* Transition */}
                <div className="flex items-center gap-1.5 mt-1 text-[10px]">
                  <span className="text-slate-400">{entry.fromStatus}</span>
                  <span className="text-slate-600">→</span>
                  <span className="px-1.5 py-0.5 bg-synthia-500/10 text-synthia-400 rounded font-medium">
                    {entry.action}
                  </span>
                  <span className="text-slate-600">→</span>
                  <span className="text-slate-300 font-medium">{entry.toStatus}</span>
                </div>

                {/* Metadata row */}
                <div className="flex items-center gap-3 mt-1">
                  {/* Actor + Role */}
                  <span className="flex items-center gap-0.5 text-[9px] text-blue-400">
                    <Shield className="w-2.5 h-2.5" />
                    {entry.actor} ({entry.role})
                  </span>

                  {/* Fields */}
                  {Object.keys(entry.fieldValues || {}).length > 0 && (
                    <span className="text-[9px] text-emerald-400" title={JSON.stringify(entry.fieldValues)}>
                      ✏️ {Object.keys(entry.fieldValues).length} fields
                    </span>
                  )}

                  {/* Documents */}
                  {(entry.documentsAttached || []).length > 0 && (
                    <span className="flex items-center gap-0.5 text-[9px] text-amber-400">
                      <FileText className="w-2.5 h-2.5" />
                      {entry.documentsAttached.length} docs
                    </span>
                  )}

                  {/* Notifications */}
                  {(entry.notifications || []).length > 0 && (
                    <span className="flex items-center gap-0.5 text-[9px] text-purple-400">
                      <Bell className="w-2.5 h-2.5" />
                      {entry.notifications.length}
                    </span>
                  )}
                </div>

                {/* Field values detail */}
                {Object.keys(entry.fieldValues || {}).length > 0 && (
                  <div className="mt-1 flex flex-wrap gap-1">
                    {Object.entries(entry.fieldValues).map(([k, v]) => (
                      <span key={k} className="text-[9px] px-1 py-px bg-slate-700/50 rounded text-slate-400">
                        {k}: <span className="text-slate-300">{v}</span>
                      </span>
                    ))}
                  </div>
                )}

                {/* Documents detail */}
                {(entry.documentsAttached || []).length > 0 && (
                  <div className="mt-1 flex flex-wrap gap-1">
                    {entry.documentsAttached.map((d, i) => (
                      <span key={i} className="text-[9px] px-1 py-px bg-amber-500/10 rounded text-amber-300">
                        📎 {d}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
