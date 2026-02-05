/**
 * StatusConnectorEditor — State machine editor for SOP workflows.
 * Statuses are nodes, Connectors (actions) are the edges that move objects between statuses.
 *
 * Props:
 *   visualState: { statuses, connectors, objectSchema, metadata }
 *   onChange: (newVisualState) => void
 *   availableSOPs: [{ id, name, category, stepCount }]
 *   onNavigateToSOP: (sopId) => void
 */
import { useState } from 'react'
import {
  Plus, Trash2, ChevronDown, ChevronUp, ArrowRight, Zap, Circle,
  Play, Square, Clock, User, FileText, Box, ExternalLink, Settings,
  AlertTriangle, CheckCircle, GitBranch, Pause, XCircle, Shield, Users, X
} from 'lucide-react'
import {
  STATUS_NODE_TYPES, STATUS_NODE_COLORS, CONNECTOR_TYPES,
  DEFAULT_STATUS, DEFAULT_CONNECTOR, DEFAULT_ROLE,
} from './sopConstants'

const STATUS_ICONS = {
  Start: Play,
  Normal: Circle,
  Decision: GitBranch,
  Waiting: Pause,
  Terminal: CheckCircle,
  Error: XCircle,
}

const StatusConnectorEditor = ({ visualState, onChange, availableSOPs = [], onNavigateToSOP }) => {
  const [collapsedStatuses, setCollapsedStatuses] = useState(new Set())
  const [collapsedConnectors, setCollapsedConnectors] = useState(new Set())
  const [activeSection, setActiveSection] = useState('statuses') // 'roles' | 'statuses' | 'connectors'
  const vs = visualState

  const update = (patch) => onChange({ ...vs, ...patch })

  // ── Status helpers ──
  const updateStatus = (idx, field, value) => {
    const statuses = [...vs.statuses]
    // If renaming, also update all connectors referencing the old name
    if (field === 'name') {
      const oldName = statuses[idx].name
      const connectors = vs.connectors.map(c => ({
        ...c,
        fromStatus: c.fromStatus === oldName ? value : c.fromStatus,
        toStatus: c.toStatus === oldName ? value : c.toStatus,
      }))
      statuses[idx] = { ...statuses[idx], [field]: value }
      update({ statuses, connectors })
    } else {
      statuses[idx] = { ...statuses[idx], [field]: value }
      update({ statuses })
    }
  }

  const addStatus = () => {
    const order = vs.statuses.length + 1
    update({
      statuses: [...vs.statuses, {
        ...DEFAULT_STATUS,
        name: `Status ${order}`,
        sortOrder: order,
      }]
    })
  }

  const removeStatus = (idx) => {
    if (vs.statuses.length <= 1) return
    const removed = vs.statuses[idx].name
    const statuses = vs.statuses.filter((_, i) => i !== idx).map((s, i) => ({ ...s, sortOrder: i + 1 }))
    // Remove connectors that reference the deleted status
    const connectors = vs.connectors.filter(c => c.fromStatus !== removed && c.toStatus !== removed)
    update({ statuses, connectors })
  }

  const moveStatus = (idx, dir) => {
    const swapIdx = idx + dir
    if (swapIdx < 0 || swapIdx >= vs.statuses.length) return
    const statuses = [...vs.statuses]
    ;[statuses[idx], statuses[swapIdx]] = [statuses[swapIdx], statuses[idx]]
    update({ statuses: statuses.map((s, i) => ({ ...s, sortOrder: i + 1 })) })
  }

  // ── Connector helpers ──
  const updateConnector = (idx, field, value) => {
    const connectors = [...vs.connectors]
    connectors[idx] = { ...connectors[idx], [field]: value }
    update({ connectors })
  }

  const addConnector = () => {
    const from = vs.statuses[0]?.name || ''
    const to = vs.statuses.length > 1 ? vs.statuses[1].name : vs.statuses[0]?.name || ''
    update({
      connectors: [...vs.connectors, {
        ...DEFAULT_CONNECTOR,
        fromStatus: from,
        toStatus: to,
        name: `Action ${vs.connectors.length + 1}`,
      }]
    })
  }

  const removeConnector = (idx) => {
    update({ connectors: vs.connectors.filter((_, i) => i !== idx) })
  }

  const autoGenerateConnectors = () => {
    // Generate linear flow: status 1 → 2 → 3 → ... → N
    const connectors = []
    for (let i = 0; i < vs.statuses.length - 1; i++) {
      connectors.push({
        ...DEFAULT_CONNECTOR,
        name: `Move to ${vs.statuses[i + 1].name}`,
        fromStatus: vs.statuses[i].name,
        toStatus: vs.statuses[i + 1].name,
      })
    }
    update({ connectors })
  }

  // ── Role helpers ──
  const updateRole = (idx, field, value) => {
    const roles = [...(vs.roles || [])]
    const oldName = roles[idx].name
    roles[idx] = { ...roles[idx], [field]: value }
    // If renaming, update all connectors referencing the old role name
    if (field === 'name' && oldName !== value) {
      const connectors = vs.connectors.map(c => ({
        ...c,
        allowedRoles: (c.allowedRoles || []).map(r => r === oldName ? value : r),
      }))
      update({ roles, connectors })
    } else {
      update({ roles })
    }
  }

  const addRole = () => {
    update({
      roles: [...(vs.roles || []), { ...DEFAULT_ROLE, name: `Role ${(vs.roles?.length || 0) + 1}` }]
    })
  }

  const removeRole = (idx) => {
    const removed = vs.roles[idx].name
    const roles = vs.roles.filter((_, i) => i !== idx)
    // Remove this role from all connectors
    const connectors = vs.connectors.map(c => ({
      ...c,
      allowedRoles: (c.allowedRoles || []).filter(r => r !== removed),
    }))
    update({ roles, connectors })
  }

  // Toggle allowed role on a connector
  const toggleAllowedRole = (connIdx, roleName) => {
    const c = vs.connectors[connIdx]
    const roles = c.allowedRoles || []
    const updated = roles.includes(roleName)
      ? roles.filter(r => r !== roleName)
      : [...roles, roleName]
    updateConnector(connIdx, 'allowedRoles', updated)
  }

  // Toggle required field on a connector
  const toggleRequiredField = (connIdx, fieldKey) => {
    const c = vs.connectors[connIdx]
    const fields = c.requiredFields || []
    const updated = fields.includes(fieldKey)
      ? fields.filter(f => f !== fieldKey)
      : [...fields, fieldKey]
    updateConnector(connIdx, 'requiredFields', updated)
  }

  const inp = "w-full px-2 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"

  // Get all property keys for required fields picker
  const allProperties = [
    ...(vs.objectSchema?.properties || []).map(p => ({ key: p.key, label: p.label })),
  ]

  // Count connectors per status for summary
  const getOutgoingCount = (statusName) => vs.connectors.filter(c => c.fromStatus === statusName).length
  const getIncomingCount = (statusName) => vs.connectors.filter(c => c.toStatus === statusName).length

  return (
    <div className="space-y-4">
      {/* Section tabs */}
      <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
        <button type="button" onClick={() => setActiveSection('roles')}
          className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
            activeSection === 'roles' ? 'bg-white text-blue-700 shadow-sm' : 'text-gray-600 hover:text-gray-800'
          }`}>
          <Shield className="w-4 h-4" /> Roles ({vs.roles?.length || 0})
        </button>
        <button type="button" onClick={() => setActiveSection('statuses')}
          className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
            activeSection === 'statuses' ? 'bg-white text-blue-700 shadow-sm' : 'text-gray-600 hover:text-gray-800'
          }`}>
          <Circle className="w-4 h-4" /> Statuses ({vs.statuses.length})
        </button>
        <button type="button" onClick={() => setActiveSection('connectors')}
          className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
            activeSection === 'connectors' ? 'bg-white text-blue-700 shadow-sm' : 'text-gray-600 hover:text-gray-800'
          }`}>
          <ArrowRight className="w-4 h-4" /> Actions ({vs.connectors.length})
        </button>
      </div>

      {/* ══ ROLES ══ */}
      {activeSection === 'roles' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-xs text-gray-500">Define roles that can perform actions. Assign roles to connectors to control who can move objects.</p>
            <button type="button" onClick={addRole}
              className="flex items-center gap-1 px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
              <Plus className="w-3.5 h-3.5" /> Add Role
            </button>
          </div>

          {(!vs.roles || vs.roles.length === 0) ? (
            <div className="text-center py-8 border-2 border-dashed border-gray-200 rounded-lg">
              <Shield className="w-8 h-8 text-gray-300 mx-auto mb-2" />
              <p className="text-sm text-gray-400">No roles defined yet.</p>
              <p className="text-xs text-gray-400 mt-1">Add roles like "Manager", "Reviewer", "Admin" to control who can perform each action.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {vs.roles.map((role, idx) => {
                // Count how many connectors use this role
                const usageCount = vs.connectors.filter(c => (c.allowedRoles || []).includes(role.name)).length
                return (
                  <div key={idx} className="flex items-center gap-3 bg-white border border-gray-200 rounded-lg px-3 py-3">
                    <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center flex-shrink-0">
                      <Shield className="w-4 h-4" />
                    </div>
                    <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-2 min-w-0">
                      <input type="text" value={role.name}
                        onChange={e => updateRole(idx, 'name', e.target.value)}
                        placeholder="Role name (e.g. Manager)"
                        className="px-2 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
                      <input type="text" value={role.description}
                        onChange={e => updateRole(idx, 'description', e.target.value)}
                        placeholder="Description (optional)"
                        className="px-2 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
                    </div>
                    {usageCount > 0 && (
                      <span className="text-xs text-gray-400 flex-shrink-0">{usageCount} action{usageCount !== 1 ? 's' : ''}</span>
                    )}
                    <button type="button" onClick={() => removeRole(idx)}
                      className="p-1 text-gray-400 hover:text-red-500 flex-shrink-0 transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* ══ STATUSES ══ */}
      {activeSection === 'statuses' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-xs text-gray-500">Define the statuses an object can be in. Think of these as states in the workflow.</p>
            <button type="button" onClick={addStatus}
              className="flex items-center gap-1 px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
              <Plus className="w-3.5 h-3.5" /> Add Status
            </button>
          </div>

          {vs.statuses.map((status, idx) => {
            const collapsed = collapsedStatuses.has(idx)
            const colors = STATUS_NODE_COLORS[status.nodeType] || STATUS_NODE_COLORS.Normal
            const NodeIcon = STATUS_ICONS[status.nodeType] || Circle
            const outgoing = getOutgoingCount(status.name)
            const incoming = getIncomingCount(status.name)

            return (
              <div key={idx} className={`border rounded-lg overflow-hidden bg-white shadow-sm ${colors.border}`}>
                <div className="flex items-center justify-between px-3 py-2.5 bg-gray-50 border-b cursor-pointer hover:bg-gray-100 transition-colors"
                  onClick={() => setCollapsedStatuses(prev => {
                    const next = new Set(prev); next.has(idx) ? next.delete(idx) : next.add(idx); return next
                  })}>
                  <div className="flex items-center gap-2 min-w-0">
                    <span className={`w-7 h-7 rounded-full ${colors.bg} text-white flex items-center justify-center flex-shrink-0`}>
                      <NodeIcon className="w-3.5 h-3.5" />
                    </span>
                    <span className="font-medium text-sm text-gray-800 truncate">{status.name}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${colors.light} ${colors.text} font-medium`}>
                      {status.nodeType}
                    </span>
                    {(status.requiredFields?.length || 0) > 0 && (
                      <span className="text-xs text-orange-600 bg-orange-50 px-1.5 py-0.5 rounded-full hidden sm:inline">
                        {status.requiredFields.length} required
                      </span>
                    )}
                    <span className="text-xs text-gray-400 hidden sm:inline">
                      {incoming > 0 && `${incoming} in`}{incoming > 0 && outgoing > 0 && ' · '}{outgoing > 0 && `${outgoing} out`}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button type="button" onClick={e => { e.stopPropagation(); moveStatus(idx, -1) }} disabled={idx === 0}
                      className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30"><ChevronUp className="w-4 h-4" /></button>
                    <button type="button" onClick={e => { e.stopPropagation(); moveStatus(idx, 1) }} disabled={idx === vs.statuses.length - 1}
                      className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30"><ChevronDown className="w-4 h-4" /></button>
                    <button type="button" onClick={e => { e.stopPropagation(); removeStatus(idx) }} disabled={vs.statuses.length <= 1}
                      className="p-1 text-gray-400 hover:text-red-500 disabled:opacity-30"><Trash2 className="w-4 h-4" /></button>
                    {collapsed ? <ChevronDown className="w-4 h-4 text-gray-400" /> : <ChevronUp className="w-4 h-4 text-gray-400" />}
                  </div>
                </div>

                {!collapsed && (
                  <div className="p-4 space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Status Name</label>
                        <input type="text" value={status.name}
                          onChange={e => updateStatus(idx, 'name', e.target.value)}
                          className={inp} />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Node Type</label>
                        <select value={status.nodeType}
                          onChange={e => updateStatus(idx, 'nodeType', e.target.value)}
                          className={inp}>
                          {STATUS_NODE_TYPES.map(t => (
                            <option key={t.value} value={t.value}>{t.label} — {t.description}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Description</label>
                        <input type="text" value={status.description}
                          onChange={e => updateStatus(idx, 'description', e.target.value)}
                          placeholder="What does this status mean?"
                          className={inp} />
                      </div>
                    </div>

                    {/* Required fields for this status */}
                    {allProperties.length > 0 && (
                      <div className="pt-2 border-t border-gray-100">
                        <label className="block text-xs font-medium text-gray-600 mb-1.5">
                          Required Fields <span className="font-normal text-gray-400">— must be filled for the object to be valid in this status</span>
                        </label>
                        <div className="flex flex-wrap gap-1.5">
                          {allProperties.map(prop => {
                            const selected = (status.requiredFields || []).includes(prop.key)
                            return (
                              <button key={prop.key} type="button"
                                onClick={() => {
                                  const fields = status.requiredFields || []
                                  const updated = fields.includes(prop.key)
                                    ? fields.filter(f => f !== prop.key)
                                    : [...fields, prop.key]
                                  updateStatus(idx, 'requiredFields', updated)
                                }}
                                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium transition-colors ${
                                  selected
                                    ? 'bg-orange-100 text-orange-700 border border-orange-300'
                                    : 'bg-gray-100 text-gray-500 border border-gray-200 hover:bg-gray-200'
                                }`}>
                                {prop.label || prop.key}
                                {selected && <X className="w-3 h-3" />}
                              </button>
                            )
                          })}
                          {(status.requiredFields || []).length === 0 && (
                            <span className="text-xs text-gray-400 py-0.5">No field requirements</span>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Quick-add connector from this status */}
                    {vs.statuses.length > 1 && (
                      <div className="pt-2 border-t border-gray-100">
                        <button type="button" onClick={() => {
                          const nextStatus = vs.statuses.find((s, i) => i > idx) || vs.statuses[0]
                          update({
                            connectors: [...vs.connectors, {
                              ...DEFAULT_CONNECTOR,
                              name: `${status.name} → ${nextStatus.name}`,
                              fromStatus: status.name,
                              toStatus: nextStatus.name,
                            }]
                          })
                          setActiveSection('connectors')
                        }}
                          className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1">
                          <Plus className="w-3 h-3" /> Add action from this status
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* ══ CONNECTORS (ACTIONS) ══ */}
      {activeSection === 'connectors' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-xs text-gray-500">Actions that move the object from one status to another.</p>
            <div className="flex items-center gap-2">
              {vs.statuses.length > 1 && (
                <button type="button" onClick={autoGenerateConnectors}
                  className="flex items-center gap-1 px-3 py-1.5 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 border border-gray-300 transition-colors">
                  <Zap className="w-3.5 h-3.5" /> Auto-generate
                </button>
              )}
              <button type="button" onClick={addConnector}
                className="flex items-center gap-1 px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                <Plus className="w-3.5 h-3.5" /> Add Action
              </button>
            </div>
          </div>

          {vs.connectors.length === 0 ? (
            <div className="text-center py-8 border-2 border-dashed border-gray-200 rounded-lg">
              <ArrowRight className="w-8 h-8 text-gray-300 mx-auto mb-2" />
              <p className="text-sm text-gray-400">No actions defined yet.</p>
              <p className="text-xs text-gray-400 mt-1">
                {vs.statuses.length > 1
                  ? 'Click "Auto-generate" for a linear flow, or add actions manually.'
                  : 'Add at least 2 statuses first, then define actions between them.'}
              </p>
            </div>
          ) : (
            vs.connectors.map((conn, idx) => {
              const collapsed = collapsedConnectors.has(idx)
              const connType = CONNECTOR_TYPES.find(t => t.value === conn.connectorType) || CONNECTOR_TYPES[0]
              const fromColors = STATUS_NODE_COLORS[vs.statuses.find(s => s.name === conn.fromStatus)?.nodeType] || STATUS_NODE_COLORS.Normal
              const toColors = STATUS_NODE_COLORS[vs.statuses.find(s => s.name === conn.toStatus)?.nodeType] || STATUS_NODE_COLORS.Normal

              return (
                <div key={idx} className="border border-gray-200 rounded-lg overflow-hidden bg-white shadow-sm">
                  <div className="flex items-center justify-between px-3 py-2.5 bg-gray-50 border-b cursor-pointer hover:bg-gray-100 transition-colors"
                    onClick={() => setCollapsedConnectors(prev => {
                      const next = new Set(prev); next.has(idx) ? next.delete(idx) : next.add(idx); return next
                    })}>
                    <div className="flex items-center gap-2 min-w-0 flex-wrap">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${fromColors.light} ${fromColors.text} font-medium`}>
                        {conn.fromStatus || '?'}
                      </span>
                      <ArrowRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
                      <span className={`text-xs px-2 py-0.5 rounded-full ${toColors.light} ${toColors.text} font-medium`}>
                        {conn.toStatus || '?'}
                      </span>
                      <span className="font-medium text-sm text-gray-700 truncate">{conn.name || 'Unnamed Action'}</span>
                      <span className="text-xs text-gray-400 bg-white border px-1.5 py-0.5 rounded hidden sm:inline">
                        {connType.label}
                      </span>
                      {conn.allowedRoles?.length > 0 && (
                        <span className="text-xs text-blue-500 bg-blue-50 border border-blue-200 px-1.5 py-0.5 rounded hidden sm:inline flex items-center gap-1">
                          <Shield className="w-3 h-3" />
                          {conn.allowedRoles.join(', ')}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button type="button" onClick={e => { e.stopPropagation(); removeConnector(idx) }}
                        className="p-1 text-gray-400 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
                      {collapsed ? <ChevronDown className="w-4 h-4 text-gray-400" /> : <ChevronUp className="w-4 h-4 text-gray-400" />}
                    </div>
                  </div>

                  {!collapsed && (
                    <div className="p-4 space-y-3">
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">Action Name</label>
                          <input type="text" value={conn.name}
                            onChange={e => updateConnector(idx, 'name', e.target.value)}
                            placeholder="e.g. Submit, Approve, Reject"
                            className={inp} />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">From Status</label>
                          <select value={conn.fromStatus}
                            onChange={e => updateConnector(idx, 'fromStatus', e.target.value)}
                            className={inp}>
                            <option value="">— Select —</option>
                            {vs.statuses.map(s => <option key={s.name} value={s.name}>{s.name}</option>)}
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">To Status</label>
                          <select value={conn.toStatus}
                            onChange={e => updateConnector(idx, 'toStatus', e.target.value)}
                            className={inp}>
                            <option value="">— Select —</option>
                            {vs.statuses.map(s => <option key={s.name} value={s.name}>{s.name}</option>)}
                          </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">Action Type</label>
                          <select value={conn.connectorType}
                            onChange={e => updateConnector(idx, 'connectorType', e.target.value)}
                            className={inp}>
                            {CONNECTOR_TYPES.map(t => (
                              <option key={t.value} value={t.value}>{t.label}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">Allowed Roles</label>
                          {vs.roles?.length > 0 ? (
                            <div className="flex flex-wrap gap-1.5 min-h-[34px] px-2 py-1.5 border border-gray-300 rounded-lg bg-white">
                              {vs.roles.map(role => {
                                const selected = (conn.allowedRoles || []).includes(role.name)
                                return (
                                  <button key={role.name} type="button"
                                    onClick={() => toggleAllowedRole(idx, role.name)}
                                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium transition-colors ${
                                      selected
                                        ? 'bg-blue-100 text-blue-700 border border-blue-300'
                                        : 'bg-gray-100 text-gray-500 border border-gray-200 hover:bg-gray-200'
                                    }`}>
                                    <Shield className="w-3 h-3" />
                                    {role.name}
                                    {selected && <X className="w-3 h-3" />}
                                  </button>
                                )
                              })}
                              {(conn.allowedRoles || []).length === 0 && (
                                <span className="text-xs text-gray-400 py-0.5">Anyone (no restriction)</span>
                              )}
                            </div>
                          ) : (
                            <p className="text-xs text-gray-400 py-1.5">
                              <button type="button" onClick={() => setActiveSection('roles')}
                                className="text-blue-600 hover:underline">Define roles first</button> to restrict who can perform this action.
                            </p>
                          )}
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">Est. Duration (min)</label>
                          <input type="number" min={0} value={conn.estimatedMinutes}
                            onChange={e => updateConnector(idx, 'estimatedMinutes', parseInt(e.target.value) || 0)}
                            className={inp} />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Description</label>
                        <input type="text" value={conn.description}
                          onChange={e => updateConnector(idx, 'description', e.target.value)}
                          placeholder="Brief description of this action"
                          className={inp} />
                      </div>

                      {conn.connectorType === 'Conditional' && (
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">Condition</label>
                          <input type="text" value={conn.condition}
                            onChange={e => updateConnector(idx, 'condition', e.target.value)}
                            placeholder="e.g. amount > 10000, department == 'Finance'"
                            className={`${inp} font-mono`} />
                        </div>
                      )}

                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Instructions</label>
                        <textarea value={conn.instructions}
                          onChange={e => updateConnector(idx, 'instructions', e.target.value)}
                          placeholder="Detailed instructions for performing this action..."
                          rows={2}
                          className={`${inp} resize-y`} />
                      </div>

                      {/* Required fields picker */}
                      {allProperties.length > 0 && (
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">
                            Required Fields (must be filled to perform this action)
                          </label>
                          <div className="flex flex-wrap gap-2">
                            {allProperties.map(prop => (
                              <label key={prop.key} className="flex items-center gap-1.5 cursor-pointer">
                                <input type="checkbox"
                                  checked={(conn.requiredFields || []).includes(prop.key)}
                                  onChange={() => toggleRequiredField(idx, prop.key)}
                                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                                <span className="text-xs text-gray-700">{prop.label || prop.key}</span>
                              </label>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* SubSOP reference */}
                      {conn.connectorType === 'SubSOP' && (
                        <div className="p-3 bg-violet-50 border border-violet-200 rounded-lg space-y-2">
                          <div className="flex items-center gap-2">
                            <Box className="w-4 h-4 text-violet-600" />
                            <span className="text-sm font-medium text-violet-800">Sub-SOP Reference</span>
                          </div>
                          {availableSOPs.length > 0 ? (
                            <div className="flex items-center gap-2">
                              <select value={conn.subSopId || ''}
                                onChange={e => updateConnector(idx, 'subSopId', e.target.value || null)}
                                className="flex-1 px-2 py-1.5 border border-violet-300 rounded-lg text-sm focus:ring-2 focus:ring-violet-500">
                                <option value="">— Select Sub-SOP —</option>
                                {availableSOPs.map(sop => (
                                  <option key={sop.id} value={sop.id}>{sop.name} — {sop.category}</option>
                                ))}
                              </select>
                              {conn.subSopId && onNavigateToSOP && (
                                <button type="button" onClick={() => onNavigateToSOP(conn.subSopId)}
                                  className="flex items-center gap-1 px-2 py-1.5 text-sm text-violet-600 hover:bg-violet-100 rounded-lg transition-colors">
                                  <ExternalLink className="w-3.5 h-3.5" /> Open
                                </button>
                              )}
                            </div>
                          ) : (
                            <p className="text-xs text-violet-600">No other SOPs available to reference.</p>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            })
          )}
        </div>
      )}

      {/* Flow summary */}
      {vs.statuses.length > 0 && vs.connectors.length > 0 && (
        <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
          <h5 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Flow Summary</h5>
          <div className="flex flex-wrap gap-1 items-center">
            {vs.statuses.map((s, i) => {
              const colors = STATUS_NODE_COLORS[s.nodeType] || STATUS_NODE_COLORS.Normal
              const outgoing = vs.connectors.filter(c => c.fromStatus === s.name)
              return (
                <span key={i} className="flex items-center gap-1">
                  <span className={`text-xs px-2 py-1 rounded-full ${colors.light} ${colors.text} font-medium border ${colors.border}`}>
                    {s.name}
                  </span>
                  {outgoing.length > 0 && i < vs.statuses.length - 1 && (
                    <span className="text-xs text-gray-400 flex items-center gap-0.5">
                      <ArrowRight className="w-3 h-3" />
                      {outgoing.length > 1 && <span className="text-gray-500">({outgoing.length})</span>}
                    </span>
                  )}
                </span>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

export default StatusConnectorEditor
