/**
 * SOPWorkflowEditor — Complete SOP workflow editor with metadata + step editor + JSON toggle.
 * This is the main reusable component — drop it into any app.
 *
 * Props:
 *   value: string (JSON) — the SOP workflow JSON to edit
 *   onChange: (jsonString: string) => void
 *   mode: 'visual' | 'json' | 'both' (default: 'both')
 *   className: string
 *   compact: boolean
 */
import { useState, useCallback, useEffect } from 'react'
import { Settings, Code } from 'lucide-react'
import SOPStepEditor from './SOPStepEditor'
import { parseSOPToVisual, serializeVisualToSOP } from './sopConstants'

export default function SOPWorkflowEditor({
  value = '{"steps":[],"transitions":[]}',
  onChange,
  mode = 'both',
  className = '',
  compact = false
}) {
  const [editorMode, setEditorMode] = useState(mode === 'json' ? 'json' : 'visual')
  const [visualState, setVisualState] = useState(() => parseSOPToVisual(value))
  const [jsonText, setJsonText] = useState(value)
  const [jsonError, setJsonError] = useState(null)

  useEffect(() => {
    if (value !== jsonText) {
      setJsonText(value)
      setVisualState(parseSOPToVisual(value))
    }
  }, [value])

  const handleVisualChange = useCallback((newState) => {
    setVisualState(newState)
    const json = serializeVisualToSOP(newState)
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
      const json = serializeVisualToSOP(visualState)
      setJsonText(json)
      setEditorMode('json')
    } else {
      try {
        const parsed = parseSOPToVisual(jsonText)
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

      <div className="flex-1 overflow-y-auto">
        {editorMode === 'visual' ? (
          <div className={pad}>
            <div className="max-w-4xl mx-auto">
              <SOPStepEditor
                visualState={visualState}
                onChange={handleVisualChange}
              />
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
                placeholder='{"steps": [...], "transitions": [...]}'
              />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
