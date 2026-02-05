/**
 * SOPWorkflowEditor — Complete SOP workflow editor using the state machine model.
 * Statuses = nodes, Connectors = actions (edges) that move objects between statuses.
 *
 * Props:
 *   value: string (JSON) — the SOP workflow JSON to edit
 *   onChange: (jsonString: string) => void
 *   mode: 'visual' | 'json' | 'both' (default: 'both')
 *   className: string
 *   compact: boolean
 *   availableSOPs: [{ id, name, category, stepCount }] — SOPs available for SubSOP references
 *   onNavigateToSOP: (sopId) => void — callback to navigate to a sub-SOP
 */
import { useState, useCallback, useEffect } from 'react'
import { Settings, Code, Database, GitBranch } from 'lucide-react'
import StatusConnectorEditor from './StatusConnectorEditor'
import ObjectSchemaEditor from './ObjectSchemaEditor'
import {
  parseStateMachineToVisual, serializeStateMachineToJson, DEFAULT_OBJECT_SCHEMA
} from './sopConstants'

export default function SOPWorkflowEditor({
  value = '{"statuses":[],"connectors":[]}',
  onChange,
  mode = 'both',
  className = '',
  compact = false,
  availableSOPs = [],
  onNavigateToSOP
}) {
  const [editorMode, setEditorMode] = useState(mode === 'json' ? 'json' : 'visual')
  const [visualTab, setVisualTab] = useState('workflow') // 'schema' | 'workflow'
  const [visualState, setVisualState] = useState(() => parseStateMachineToVisual(value))
  const [jsonText, setJsonText] = useState(value)
  const [jsonError, setJsonError] = useState(null)

  useEffect(() => {
    if (value !== jsonText) {
      setJsonText(value)
      setVisualState(parseStateMachineToVisual(value))
    }
  }, [value])

  const handleVisualChange = useCallback((newState) => {
    setVisualState(newState)
    const json = serializeStateMachineToJson(newState)
    setJsonText(json)
    onChange?.(json)
  }, [onChange])

  const handleJsonChange = useCallback((text) => {
    setJsonText(text)
    try {
      JSON.parse(text)
      setJsonError(null)
      onChange?.(text)
    } catch (e) {
      setJsonError(e.message)
    }
  }, [onChange])

  const handleToggleMode = useCallback(() => {
    if (editorMode === 'visual') {
      const json = serializeStateMachineToJson(visualState)
      setJsonText(json)
      setEditorMode('json')
    } else {
      try {
        const parsed = parseStateMachineToVisual(jsonText)
        setVisualState(parsed)
        setJsonError(null)
      } catch { /* keep current */ }
      setEditorMode('visual')
    }
  }, [editorMode, visualState, jsonText])

  const showToggle = mode === 'both'
  const pad = compact ? 'p-2' : 'p-4'

  return (
    <div className={`flex flex-col ${className}`}>
      {showToggle && (
        <div className="bg-white border-b border-gray-200 px-4 py-2 flex items-center gap-2 flex-shrink-0">
          <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-0.5">
            <button type="button"
              onClick={() => { if (editorMode !== 'visual') handleToggleMode() }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                editorMode === 'visual' ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-600 hover:text-gray-800'
              }`}>
              <Settings className="w-3.5 h-3.5" /> Visual Editor
            </button>
            <button type="button"
              onClick={() => { if (editorMode !== 'json') handleToggleMode() }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                editorMode === 'json' ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-600 hover:text-gray-800'
              }`}>
              <Code className="w-3.5 h-3.5" /> Raw JSON
            </button>
          </div>
        </div>
      )}

      {/* Visual sub-tabs */}
      {editorMode === 'visual' && (
        <div className="bg-white border-b border-gray-200 px-4 flex items-center gap-1 flex-shrink-0">
          <button type="button" onClick={() => setVisualTab('schema')}
            className={`flex items-center gap-1.5 px-3 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              visualTab === 'schema'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}>
            <Database className="w-3.5 h-3.5" /> Object Schema
          </button>
          <button type="button" onClick={() => setVisualTab('workflow')}
            className={`flex items-center gap-1.5 px-3 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              visualTab === 'workflow'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}>
            <GitBranch className="w-3.5 h-3.5" /> Workflow
          </button>
        </div>
      )}

      <div className="flex-1 overflow-y-auto">
        {editorMode === 'visual' ? (
          <div className={pad}>
            <div className="max-w-4xl mx-auto">
              {visualTab === 'schema' ? (
                <ObjectSchemaEditor
                  schema={visualState.objectSchema || { ...DEFAULT_OBJECT_SCHEMA }}
                  onChange={(newSchema) => handleVisualChange({ ...visualState, objectSchema: newSchema })}
                />
              ) : (
                <StatusConnectorEditor
                  visualState={visualState}
                  onChange={handleVisualChange}
                  availableSOPs={availableSOPs}
                  onNavigateToSOP={onNavigateToSOP}
                />
              )}
            </div>
          </div>
        ) : (
          <div className={pad}>
            <div className="max-w-4xl mx-auto">
              {jsonError && (
                <div className="mb-2 px-3 py-2 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                  JSON Error: {jsonError}
                </div>
              )}
              <textarea
                value={jsonText}
                onChange={e => handleJsonChange(e.target.value)}
                className="w-full h-96 px-3 py-2 border border-gray-300 rounded-lg font-mono text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder='{"statuses": [...], "connectors": [...]}'
              />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
