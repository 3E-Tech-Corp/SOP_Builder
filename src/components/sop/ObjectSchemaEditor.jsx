/**
 * ObjectSchemaEditor — Define the object type and its properties that an SOP operates on.
 *
 * Props:
 *   schema: { typeName, typeDescription, properties: [...] }
 *   onChange: (newSchema) => void
 *   statusOptions: string[] — custom status options (derived from outcomes, optional)
 */
import { useState } from 'react'
import {
  Plus, Trash2, ChevronDown, ChevronUp, Database, Lock, GripVertical, X, Settings
} from 'lucide-react'
import {
  PROPERTY_TYPES, BUILT_IN_PROPERTIES, DEFAULT_PROPERTY
} from './sopConstants'

const ObjectSchemaEditor = ({ schema, onChange, statusOptions }) => {
  const [expandedProps, setExpandedProps] = useState(new Set())

  const update = (patch) => onChange({ ...schema, ...patch })

  const toggleExpand = (idx) => {
    setExpandedProps(prev => {
      const next = new Set(prev)
      next.has(idx) ? next.delete(idx) : next.add(idx)
      return next
    })
  }

  // ── Property helpers ──
  const updateProperty = (idx, field, value) => {
    const properties = [...schema.properties]
    properties[idx] = { ...properties[idx], [field]: value }
    update({ properties })
  }

  const addProperty = () => {
    const n = schema.properties.length + 1
    update({
      properties: [...schema.properties, {
        ...DEFAULT_PROPERTY,
        key: `field_${n}`,
        label: `Field ${n}`,
      }]
    })
    // Auto-expand the new property
    setExpandedProps(prev => new Set([...prev, schema.properties.length]))
  }

  const removeProperty = (idx) => {
    update({ properties: schema.properties.filter((_, i) => i !== idx) })
  }

  const moveProperty = (idx, dir) => {
    const swapIdx = idx + dir
    if (swapIdx < 0 || swapIdx >= schema.properties.length) return
    const props = [...schema.properties]
    ;[props[idx], props[swapIdx]] = [props[swapIdx], props[idx]]
    update({ properties: props })
  }

  // ── Options helpers (for Select/MultiSelect) ──
  const updateOptions = (propIdx, options) => {
    updateProperty(propIdx, 'options', options)
  }

  const addOption = (propIdx) => {
    const prop = schema.properties[propIdx]
    updateOptions(propIdx, [...(prop.options || []), ''])
  }

  const removeOption = (propIdx, optIdx) => {
    const prop = schema.properties[propIdx]
    updateOptions(propIdx, prop.options.filter((_, i) => i !== optIdx))
  }

  const updateOption = (propIdx, optIdx, value) => {
    const prop = schema.properties[propIdx]
    const options = [...prop.options]
    options[optIdx] = value
    updateOptions(propIdx, options)
  }

  const inp = "w-full px-2 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"

  // Merge status options if provided
  const effectiveStatusOptions = statusOptions?.length > 0
    ? statusOptions
    : BUILT_IN_PROPERTIES.find(p => p.key === 'status')?.options || []

  return (
    <div className="space-y-5">
      {/* Object Type Name */}
      <div className="space-y-3">
        <h4 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
          <Database className="w-4 h-4 text-blue-600" />
          Object Type
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Type Name *</label>
            <input type="text" value={schema.typeName}
              onChange={e => update({ typeName: e.target.value })}
              placeholder="e.g. Purchase Order, Employee, Incident Report"
              className={inp} />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Description</label>
            <input type="text" value={schema.typeDescription}
              onChange={e => update({ typeDescription: e.target.value })}
              placeholder="What kind of object does this SOP process?"
              className={inp} />
          </div>
        </div>
      </div>

      {/* Built-in Properties (read-only) */}
      <div className="space-y-2">
        <h5 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Built-in Fields (always present)</h5>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {BUILT_IN_PROPERTIES.map(prop => (
            <div key={prop.key} className="flex items-center gap-2 p-2.5 bg-gray-50 border border-gray-200 rounded-lg">
              <Lock className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
              <div className="min-w-0">
                <div className="text-sm font-medium text-gray-700">{prop.label}</div>
                <div className="text-xs text-gray-400">{prop.type}
                  {prop.key === 'status' && effectiveStatusOptions.length > 0 && (
                    <span className="ml-1">({effectiveStatusOptions.length} options)</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Custom Properties */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h5 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
            Custom Properties ({schema.properties.length})
          </h5>
          <button type="button" onClick={addProperty}
            className="flex items-center gap-1 px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            <Plus className="w-3.5 h-3.5" /> Add Property
          </button>
        </div>

        {schema.properties.length === 0 ? (
          <div className="text-center py-6 border-2 border-dashed border-gray-200 rounded-lg">
            <Database className="w-8 h-8 text-gray-300 mx-auto mb-2" />
            <p className="text-sm text-gray-400">No custom properties yet.</p>
            <p className="text-xs text-gray-400 mt-1">Add fields specific to the objects this SOP processes.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {schema.properties.map((prop, idx) => {
              const expanded = expandedProps.has(idx)
              const isSelect = prop.type === 'Select' || prop.type === 'MultiSelect'

              return (
                <div key={idx} className="border border-gray-200 rounded-lg overflow-hidden bg-white">
                  {/* Property header */}
                  <div className="flex items-center justify-between px-3 py-2 bg-gray-50 cursor-pointer hover:bg-gray-100 transition-colors"
                    onClick={() => toggleExpand(idx)}>
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-xs font-mono text-gray-400 bg-gray-200 px-1.5 py-0.5 rounded">
                        {prop.key || '?'}
                      </span>
                      <span className="text-sm font-medium text-gray-700 truncate">{prop.label || 'Untitled'}</span>
                      <span className="text-xs text-gray-400 bg-white border px-1.5 py-0.5 rounded">
                        {PROPERTY_TYPES.find(t => t.value === prop.type)?.label || prop.type}
                      </span>
                      {prop.required && (
                        <span className="text-xs text-red-500 font-medium">required</span>
                      )}
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button type="button" onClick={e => { e.stopPropagation(); moveProperty(idx, -1) }} disabled={idx === 0}
                        className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30">
                        <ChevronUp className="w-3.5 h-3.5" />
                      </button>
                      <button type="button" onClick={e => { e.stopPropagation(); moveProperty(idx, 1) }} disabled={idx === schema.properties.length - 1}
                        className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30">
                        <ChevronDown className="w-3.5 h-3.5" />
                      </button>
                      <button type="button" onClick={e => { e.stopPropagation(); removeProperty(idx) }}
                        className="p-1 text-gray-400 hover:text-red-500">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                      {expanded ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                    </div>
                  </div>

                  {/* Property body */}
                  {expanded && (
                    <div className="p-3 space-y-3 border-t border-gray-100">
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">Field Key</label>
                          <input type="text" value={prop.key}
                            onChange={e => updateProperty(idx, 'key', e.target.value.replace(/[^a-zA-Z0-9_]/g, ''))}
                            placeholder="field_name"
                            className={`${inp} font-mono`} />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">Display Label</label>
                          <input type="text" value={prop.label}
                            onChange={e => updateProperty(idx, 'label', e.target.value)}
                            placeholder="Field Label"
                            className={inp} />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">Type</label>
                          <select value={prop.type}
                            onChange={e => updateProperty(idx, 'type', e.target.value)}
                            className={inp}>
                            {PROPERTY_TYPES.map(t => (
                              <option key={t.value} value={t.value}>{t.label}</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">Description</label>
                          <input type="text" value={prop.description}
                            onChange={e => updateProperty(idx, 'description', e.target.value)}
                            placeholder="What is this field for?"
                            className={inp} />
                        </div>
                        <div className="flex items-center gap-4 pt-5">
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input type="checkbox" checked={prop.required}
                              onChange={e => updateProperty(idx, 'required', e.target.checked)}
                              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                            <span className="text-sm text-gray-700">Required</span>
                          </label>
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Default Value</label>
                        <input type="text" value={prop.defaultValue}
                          onChange={e => updateProperty(idx, 'defaultValue', e.target.value)}
                          placeholder="Optional default value"
                          className={inp} />
                      </div>

                      {/* Options editor for Select/MultiSelect */}
                      {isSelect && (
                        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg space-y-2">
                          <div className="flex items-center justify-between">
                            <label className="text-xs font-medium text-blue-700">
                              Options ({prop.options?.length || 0})
                            </label>
                            <button type="button" onClick={() => addOption(idx)}
                              className="flex items-center gap-1 px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors">
                              <Plus className="w-3 h-3" /> Add
                            </button>
                          </div>
                          {(prop.options || []).map((opt, optIdx) => (
                            <div key={optIdx} className="flex items-center gap-2">
                              <input type="text" value={opt}
                                onChange={e => updateOption(idx, optIdx, e.target.value)}
                                placeholder={`Option ${optIdx + 1}`}
                                className="flex-1 px-2 py-1 border border-blue-200 rounded text-sm focus:ring-2 focus:ring-blue-500" />
                              <button type="button" onClick={() => removeOption(idx, optIdx)}
                                className="p-1 text-blue-400 hover:text-red-500 transition-colors">
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ))}
                          {(!prop.options || prop.options.length === 0) && (
                            <p className="text-xs text-blue-500">Add options for the dropdown.</p>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

export default ObjectSchemaEditor
