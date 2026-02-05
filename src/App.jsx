import { useState, useCallback } from 'react'
import {
  ClipboardList, Plus, Save, Trash2, Edit2, Eye, X, Download, Upload,
  FileJson, ChevronDown, Search, Copy, MoreVertical, FolderOpen, Box
} from 'lucide-react'
import SOPWorkflowEditor from './components/sop/SOPWorkflowEditor'
import { SOP_CATEGORIES } from './components/sop/sopConstants'

const DEFAULT_SOP_STRUCTURE = JSON.stringify({
  steps: [{
    name: 'Initial Step',
    stepType: 'Action',
    sortOrder: 1,
    description: '',
    assignee: '',
    estimatedMinutes: 30,
    required: true,
    instructions: ''
  }],
  transitions: [],
  outcomes: []
}, null, 2)

const EMPTY_SOP = {
  id: null,
  name: '',
  description: '',
  category: 'Operations',
  version: '1.0',
  owner: '',
  department: '',
  tags: '',
  effectiveDate: '',
  reviewDate: '',
  structureJson: DEFAULT_SOP_STRUCTURE
}

function App() {
  const [sops, setSops] = useState([])
  const [editing, setEditing] = useState(null) // null = list view, object = editing
  const [formData, setFormData] = useState({ ...EMPTY_SOP })
  const [searchQuery, setSearchQuery] = useState('')
  const [filterCategory, setFilterCategory] = useState('')
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null)
  const [notification, setNotification] = useState(null)

  const notify = (msg, type = 'success') => {
    setNotification({ msg, type })
    setTimeout(() => setNotification(null), 3000)
  }

  // ── CRUD ──
  const handleNew = () => {
    setFormData({ ...EMPTY_SOP, id: Date.now() })
    setEditing('new')
  }

  const handleEdit = (sop) => {
    setFormData({ ...sop })
    setEditing('edit')
  }

  const handleDuplicate = (sop) => {
    setFormData({ ...sop, id: Date.now(), name: `${sop.name} (Copy)` })
    setEditing('new')
  }

  const handleSave = () => {
    if (!formData.name.trim()) {
      notify('Please enter an SOP name', 'error')
      return
    }
    if (editing === 'new') {
      setSops(prev => [...prev, { ...formData }])
    } else {
      setSops(prev => prev.map(s => s.id === formData.id ? { ...formData } : s))
    }
    setEditing(null)
    notify(`SOP "${formData.name}" saved!`)
  }

  const handleDelete = (id) => {
    setSops(prev => prev.filter(s => s.id !== id))
    setShowDeleteConfirm(null)
    notify('SOP deleted')
  }

  const handleCancel = () => {
    setEditing(null)
  }

  // ── Import / Export ──
  const handleExport = (sop) => {
    const blob = new Blob([JSON.stringify(sop, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${sop.name.replace(/[^a-z0-9]/gi, '_')}_SOP.json`
    a.click()
    URL.revokeObjectURL(url)
    notify('Exported!')
  }

  const handleExportAll = () => {
    const blob = new Blob([JSON.stringify(sops, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'all_sops.json'
    a.click()
    URL.revokeObjectURL(url)
    notify(`Exported ${sops.length} SOPs`)
  }

  const handleImport = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.json'
    input.onchange = async (e) => {
      const file = e.target.files?.[0]
      if (!file) return
      try {
        const text = await file.text()
        const data = JSON.parse(text)
        if (Array.isArray(data)) {
          const imported = data.map(s => ({ ...s, id: s.id || Date.now() + Math.random() }))
          setSops(prev => [...prev, ...imported])
          notify(`Imported ${imported.length} SOPs`)
        } else if (data.name && data.structureJson) {
          setSops(prev => [...prev, { ...data, id: data.id || Date.now() }])
          notify(`Imported "${data.name}"`)
        }
      } catch {
        notify('Invalid JSON file', 'error')
      }
    }
    input.click()
  }

  // ── Filtering ──
  const filtered = sops.filter(sop => {
    const matchSearch = !searchQuery || sop.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sop.description?.toLowerCase().includes(searchQuery.toLowerCase())
    const matchCategory = !filterCategory || sop.category === filterCategory
    return matchSearch && matchCategory
  })

  const getStepCount = (sop) => {
    try {
      const parsed = JSON.parse(sop.structureJson)
      return parsed.steps?.length || 0
    } catch { return 0 }
  }

  const getCategoryInfo = (cat) => SOP_CATEGORIES.find(c => c.value === cat) || { label: cat }

  // Available SOPs for SubSOP references (all except the one being edited)
  const availableSOPs = sops
    .filter(s => s.id !== formData.id)
    .map(s => ({
      id: s.id,
      name: s.name,
      category: getCategoryInfo(s.category).label,
      stepCount: getStepCount(s),
    }))

  // Navigate to a sub-SOP for editing
  const handleNavigateToSOP = (sopId) => {
    // Save current edits first
    if (formData.name.trim()) {
      if (editing === 'new') {
        setSops(prev => [...prev, { ...formData }])
      } else {
        setSops(prev => prev.map(s => s.id === formData.id ? { ...formData } : s))
      }
    }
    // Open the target SOP
    const target = sops.find(s => String(s.id) === String(sopId))
    if (target) {
      setFormData({ ...target })
      setEditing('edit')
      notify(`Opened sub-SOP: ${target.name}`)
    }
  }

  // ══ EDITOR VIEW ══
  if (editing) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        {/* Editor header */}
        <div className="bg-white border-b border-gray-200 px-4 sm:px-6 py-3 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <button onClick={handleCancel}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
              <X className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-lg font-semibold text-gray-800">
                {editing === 'new' ? 'New SOP' : 'Edit SOP'}
              </h1>
              {formData.name && <p className="text-xs text-gray-500">{formData.name}</p>}
            </div>
          </div>
          <button onClick={handleSave}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium">
            <Save className="w-4 h-4" /> Save SOP
          </button>
        </div>

        {/* Metadata */}
        <div className="bg-white border-b border-gray-200 px-4 sm:px-6 py-4">
          <div className="max-w-4xl mx-auto">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-gray-600 mb-1">SOP Name *</label>
                <input type="text" value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Employee Onboarding Process"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Category</label>
                <select value={formData.category}
                  onChange={e => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                  {SOP_CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Version</label>
                <input type="text" value={formData.version}
                  onChange={e => setFormData({ ...formData, version: e.target.value })}
                  placeholder="1.0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-gray-600 mb-1">Description</label>
                <input type="text" value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Purpose and scope of this SOP"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Owner / Author</label>
                <input type="text" value={formData.owner}
                  onChange={e => setFormData({ ...formData, owner: e.target.value })}
                  placeholder="Name or role"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Department</label>
                <input type="text" value={formData.department}
                  onChange={e => setFormData({ ...formData, department: e.target.value })}
                  placeholder="e.g. HR, IT, Operations"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Tags</label>
                <input type="text" value={formData.tags}
                  onChange={e => setFormData({ ...formData, tags: e.target.value })}
                  placeholder="onboarding, hr, compliance"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Effective Date</label>
                <input type="date" value={formData.effectiveDate}
                  onChange={e => setFormData({ ...formData, effectiveDate: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Review Date</label>
                <input type="date" value={formData.reviewDate}
                  onChange={e => setFormData({ ...formData, reviewDate: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
              </div>
            </div>
          </div>
        </div>

        {/* Workflow Editor */}
        <div className="flex-1">
          <SOPWorkflowEditor
            value={formData.structureJson}
            onChange={(json) => setFormData({ ...formData, structureJson: json })}
            availableSOPs={availableSOPs}
            onNavigateToSOP={handleNavigateToSOP}
          />
        </div>

        {/* Notification */}
        {notification && (
          <div className={`fixed bottom-4 right-4 px-4 py-2.5 rounded-lg shadow-lg text-sm font-medium z-50 ${
            notification.type === 'error' ? 'bg-red-600 text-white' : 'bg-green-600 text-white'
          }`}>
            {notification.msg}
          </div>
        )}
      </div>
    )
  }

  // ══ LIST VIEW ══
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 sm:py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <ClipboardList className="w-7 h-7 text-blue-600" />
                SOP Builder
              </h1>
              <p className="text-sm text-gray-500 mt-1">Create and manage Standard Operating Procedures</p>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={handleImport}
                className="flex items-center gap-1.5 px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-gray-700">
                <Upload className="w-4 h-4" /> Import
              </button>
              {sops.length > 0 && (
                <button onClick={handleExportAll}
                  className="flex items-center gap-1.5 px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-gray-700">
                  <Download className="w-4 h-4" /> Export All
                </button>
              )}
              <button onClick={handleNew}
                className="flex items-center gap-1.5 px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium">
                <Plus className="w-4 h-4" /> New SOP
              </button>
            </div>
          </div>

          {/* Search and filter */}
          {sops.length > 0 && (
            <div className="mt-4 flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input type="text" value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Search SOPs..."
                  className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
              </div>
              <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                <option value="">All Categories</option>
                {SOP_CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
        {sops.length === 0 ? (
          /* Empty state */
          <div className="text-center py-16">
            <ClipboardList className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-700 mb-2">No SOPs yet</h2>
            <p className="text-gray-500 mb-6 max-w-md mx-auto">
              Create your first Standard Operating Procedure to define workflows, approval chains, and operational processes.
            </p>
            <div className="flex items-center justify-center gap-3">
              <button onClick={handleNew}
                className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium">
                <Plus className="w-4 h-4" /> Create First SOP
              </button>
              <button onClick={handleImport}
                className="flex items-center gap-2 px-5 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
                <Upload className="w-4 h-4" /> Import from File
              </button>
            </div>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12">
            <Search className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No SOPs match your search.</p>
          </div>
        ) : (
          /* SOP cards */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map(sop => (
              <div key={sop.id} className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-md transition-shadow group">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-800 truncate">{sop.name}</h3>
                    <p className="text-xs text-gray-500 mt-0.5">{getCategoryInfo(sop.category).label}</p>
                  </div>
                  <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded-full flex-shrink-0 ml-2">
                    v{sop.version || '1.0'}
                  </span>
                </div>

                {sop.description && (
                  <p className="text-sm text-gray-600 mb-3 line-clamp-2">{sop.description}</p>
                )}

                <div className="flex items-center gap-3 text-xs text-gray-500 mb-4">
                  <span>{getStepCount(sop)} steps</span>
                  {sop.owner && <span>• {sop.owner}</span>}
                  {sop.department && <span>• {sop.department}</span>}
                  {sops.some(other => {
                    try {
                      const parsed = JSON.parse(other.structureJson)
                      return parsed.steps?.some(s => String(s.subSopId) === String(sop.id))
                    } catch { return false }
                  }) && (
                    <span className="inline-flex items-center gap-1 text-violet-600 bg-violet-50 px-1.5 py-0.5 rounded-full">
                      <Box className="w-3 h-3" /> Used as sub-SOP
                    </span>
                  )}
                </div>

                {sop.tags && (
                  <div className="flex flex-wrap gap-1 mb-3">
                    {sop.tags.split(',').map((tag, i) => (
                      <span key={i} className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">
                        {tag.trim()}
                      </span>
                    ))}
                  </div>
                )}

                <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
                  <button onClick={() => handleEdit(sop)}
                    className="flex items-center gap-1 px-3 py-1.5 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                    <Edit2 className="w-3.5 h-3.5" /> Edit
                  </button>
                  <button onClick={() => handleDuplicate(sop)}
                    className="flex items-center gap-1 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                    <Copy className="w-3.5 h-3.5" /> Duplicate
                  </button>
                  <button onClick={() => handleExport(sop)}
                    className="flex items-center gap-1 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                    <Download className="w-3.5 h-3.5" /> Export
                  </button>
                  <button onClick={() => setShowDeleteConfirm(sop.id)}
                    className="flex items-center gap-1 px-3 py-1.5 text-sm text-red-500 hover:bg-red-50 rounded-lg transition-colors ml-auto">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Delete confirmation modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-sm w-full shadow-xl">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Delete SOP?</h3>
            <p className="text-sm text-gray-600 mb-4">This action cannot be undone.</p>
            <div className="flex justify-end gap-2">
              <button onClick={() => setShowDeleteConfirm(null)}
                className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                Cancel
              </button>
              <button onClick={() => handleDelete(showDeleteConfirm)}
                className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors">
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Notification toast */}
      {notification && (
        <div className={`fixed bottom-4 right-4 px-4 py-2.5 rounded-lg shadow-lg text-sm font-medium z-50 ${
          notification.type === 'error' ? 'bg-red-600 text-white' : 'bg-green-600 text-white'
        }`}>
          {notification.msg}
        </div>
      )}
    </div>
  )
}

export default App
