import React, { useState, useMemo } from 'react';
import { Download, Filter, X } from 'lucide-react';

export default function AuditLog({ testObjects, sopName }) {
  const [filterObject, setFilterObject] = useState('');
  const [filterAction, setFilterAction] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  // Collect all audit entries from all objects
  const allAudits = useMemo(() => {
    const entries = [];
    for (const obj of testObjects) {
      for (const entry of obj.audit || []) {
        entries.push(entry);
      }
    }
    return entries.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  }, [testObjects]);

  // Get unique values for filters
  const uniqueObjects = useMemo(() => [...new Set(allAudits.map(a => a.objectName))], [allAudits]);
  const uniqueActions = useMemo(() => [...new Set(allAudits.map(a => a.action))], [allAudits]);
  const uniqueStatuses = useMemo(() => {
    const statuses = new Set();
    allAudits.forEach(a => { statuses.add(a.fromStatus); statuses.add(a.toStatus); });
    return [...statuses];
  }, [allAudits]);

  // Apply filters
  const filtered = useMemo(() => {
    return allAudits.filter(a => {
      if (filterObject && a.objectName !== filterObject) return false;
      if (filterAction && a.action !== filterAction) return false;
      if (filterStatus && a.fromStatus !== filterStatus && a.toStatus !== filterStatus) return false;
      return true;
    });
  }, [allAudits, filterObject, filterAction, filterStatus]);

  const exportCSV = () => {
    const headers = ['Timestamp', 'Object', 'From Status', 'Action', 'To Status', 'Fields', 'Notifications'];
    const rows = filtered.map(a => [
      new Date(a.timestamp).toLocaleString(),
      a.objectName,
      a.fromStatus,
      a.action,
      a.toStatus,
      Object.entries(a.fieldValues || {}).map(([k, v]) => `${k}=${v}`).join('; '),
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
          <span className="text-[10px] text-slate-500">({filtered.length} entries)</span>
        </div>
        <button
          onClick={exportCSV}
          disabled={filtered.length === 0}
          className="flex items-center gap-1 px-2 py-1 text-[10px] text-slate-400 hover:text-slate-200 bg-slate-700 hover:bg-slate-600 rounded transition-colors disabled:opacity-50"
        >
          <Download className="w-3 h-3" />
          CSV
        </button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-slate-700/50 bg-slate-800/30">
        <Filter className="w-3 h-3 text-slate-500 flex-shrink-0" />
        <select
          value={filterObject}
          onChange={e => setFilterObject(e.target.value)}
          className="px-1.5 py-0.5 bg-slate-700 border border-slate-600 rounded text-[10px] text-white focus:outline-none focus:ring-1 focus:ring-synthia-500"
        >
          <option value="">All Objects</option>
          {uniqueObjects.map(o => <option key={o} value={o}>{o}</option>)}
        </select>
        <select
          value={filterAction}
          onChange={e => setFilterAction(e.target.value)}
          className="px-1.5 py-0.5 bg-slate-700 border border-slate-600 rounded text-[10px] text-white focus:outline-none focus:ring-1 focus:ring-synthia-500"
        >
          <option value="">All Actions</option>
          {uniqueActions.map(a => <option key={a} value={a}>{a}</option>)}
        </select>
        <select
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value)}
          className="px-1.5 py-0.5 bg-slate-700 border border-slate-600 rounded text-[10px] text-white focus:outline-none focus:ring-1 focus:ring-synthia-500"
        >
          <option value="">All Statuses</option>
          {uniqueStatuses.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        {hasFilters && (
          <button
            onClick={() => { setFilterObject(''); setFilterAction(''); setFilterStatus(''); }}
            className="p-0.5 text-slate-400 hover:text-slate-200 transition-colors"
          >
            <X className="w-3 h-3" />
          </button>
        )}
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto">
        {filtered.length === 0 ? (
          <div className="text-center py-8 text-slate-500 text-xs">
            No audit entries yet. Execute some actions to see the trail.
          </div>
        ) : (
          <table className="w-full text-[11px]">
            <thead className="sticky top-0 bg-slate-800/90 backdrop-blur-sm">
              <tr className="border-b border-slate-700">
                <th className="text-left px-2 py-1.5 text-slate-400 font-medium">Time</th>
                <th className="text-left px-2 py-1.5 text-slate-400 font-medium">Object</th>
                <th className="text-left px-2 py-1.5 text-slate-400 font-medium">From</th>
                <th className="text-left px-2 py-1.5 text-slate-400 font-medium">Action</th>
                <th className="text-left px-2 py-1.5 text-slate-400 font-medium">To</th>
                <th className="text-left px-2 py-1.5 text-slate-400 font-medium">Fields</th>
                <th className="text-center px-2 py-1.5 text-slate-400 font-medium">🔔</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(entry => (
                <tr key={entry.id} className="border-b border-slate-700/30 hover:bg-slate-800/50">
                  <td className="px-2 py-1.5 text-slate-400 whitespace-nowrap">
                    {new Date(entry.timestamp).toLocaleTimeString()}
                  </td>
                  <td className="px-2 py-1.5 text-slate-300 font-medium">{entry.objectName}</td>
                  <td className="px-2 py-1.5 text-slate-300">{entry.fromStatus}</td>
                  <td className="px-2 py-1.5">
                    <span className="px-1.5 py-0.5 bg-synthia-500/10 text-synthia-400 rounded text-[10px]">
                      {entry.action}
                    </span>
                  </td>
                  <td className="px-2 py-1.5 text-slate-300">{entry.toStatus}</td>
                  <td className="px-2 py-1.5 text-slate-400 max-w-[120px] truncate">
                    {Object.entries(entry.fieldValues || {}).map(([k, v]) => `${k}: ${v}`).join(', ') || '—'}
                  </td>
                  <td className="px-2 py-1.5 text-center">
                    {(entry.notifications || []).length > 0 ? (
                      <span className="text-blue-400">{entry.notifications.length}</span>
                    ) : (
                      <span className="text-slate-600">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
