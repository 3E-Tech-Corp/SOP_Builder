/**
 * SOPStepEditor — List-based visual editor for SOP workflow steps.
 * Adapted from the tournament ListPhaseEditor pattern.
 *
 * Props:
 *   visualState: { steps, transitions, outcomes, metadata }
 *   onChange: (newVisualState) => void
 */
import { useState } from 'react'
import {
  Plus, Trash2, ChevronDown, ChevronUp, ArrowRight, Zap,
  Flag, GripVertical, Clock, User, FileText
} from 'lucide-react'
import {
  STEP_TYPES, STEP_TYPE_MAP, STEP_TYPE_COLORS, CONDITION_TYPES,
  OUTCOME_TYPES, DEFAULT_STEP, DEFAULT_TRANSITION, DEFAULT_OUTCOME,
  autoGenerateTransitions
} from './sopConstants'

const SOPStepEditor = ({ visualState, onChange }) => {
  const [collapsedSteps, setCollapsedSteps] = useState(new Set())
  const vs = visualState

  const update = (patch) => onChange({ ...vs, ...patch })

  const toggleCollapse = (idx) => {
    setCollapsedSteps(prev => {
      const next = new Set(prev)
      next.has(idx) ? next.delete(idx) : next.add(idx)
      return next
    })
  }

  // ── Step helpers ──
  const updateStep = (idx, field, value) => {
    const steps = [...vs.steps]
    steps[idx] = { ...steps[idx], [field]: value }
    update({ steps })
  }

  const addStep = () => {
    const order = vs.steps.length + 1
    update({
      steps: [...vs.steps, {
        ...DEFAULT_STEP,
        name: `Step ${order}`,
        sortOrder: order,
      }]
    })
  }

  const removeStep = (idx) => {
    if (vs.steps.length <= 1) return
    const steps = vs.steps.filter((_, i) => i !== idx).map((s, i) => ({ ...s, sortOrder: i + 1 }))
    const transitions = vs.transitions.filter(t =>
      t.sourceStepOrder !== idx + 1 && t.targetStepOrder !== idx + 1
    ).map(t => ({
      ...t,
      sourceStepOrder: t.sourceStepOrder > idx + 1 ? t.sourceStepOrder - 1 : t.sourceStepOrder,
      targetStepOrder: t.targetStepOrder > idx + 1 ? t.targetStepOrder - 1 : t.targetStepOrder
    }))
    update({ steps, transitions })
  }

  const moveStep = (idx, dir) => {
    const swapIdx = idx + dir
    if (swapIdx < 0 || swapIdx >= vs.steps.length) return
    const steps = [...vs.steps]
    ;[steps[idx], steps[swapIdx]] = [steps[swapIdx], steps[idx]]
    const reordered = steps.map((s, i) => ({ ...s, sortOrder: i + 1 }))
    update({ steps: reordered })
  }

  // ── Transition helpers ──
  const updateTransition = (idx, field, value) => {
    const transitions = [...vs.transitions]
    transitions[idx] = { ...transitions[idx], [field]: value }
    update({ transitions })
  }

  const addTransition = () => {
    const src = 1
    const tgt = Math.min(2, vs.steps.length)
    update({
      transitions: [...vs.transitions, {
        ...DEFAULT_TRANSITION,
        sourceStepOrder: src,
        targetStepOrder: tgt
      }]
    })
  }

  const removeTransition = (idx) => {
    update({ transitions: vs.transitions.filter((_, i) => i !== idx) })
  }

  const handleAutoGenerate = () => {
    update({ transitions: autoGenerateTransitions(vs.steps) })
  }

  // ── Outcome helpers ──
  const updateOutcome = (idx, field, value) => {
    const outcomes = [...vs.outcomes]
    outcomes[idx] = { ...outcomes[idx], [field]: value }
    update({ outcomes })
  }

  const addOutcome = () => {
    const nextIdx = vs.outcomes.length
    const defaults = ['Completed', 'Rejected', 'Escalated']
    update({
      outcomes: [...vs.outcomes, {
        ...DEFAULT_OUTCOME,
        name: defaults[nextIdx] || `Outcome ${nextIdx + 1}`,
        type: defaults[nextIdx] || 'Completed',
      }]
    })
  }

  const removeOutcome = (idx) => {
    update({ outcomes: vs.outcomes.filter((_, i) => i !== idx) })
  }

  const inp = "w-full px-2 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"

  return (
    <div className="space-y-6">
      {/* ── Steps ── */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
            <FileText className="w-4 h-4 text-blue-600" />
            Steps ({vs.steps.length})
          </h4>
          <button type="button" onClick={addStep}
            className="flex items-center gap-1 px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            <Plus className="w-3.5 h-3.5" /> Add Step
          </button>
        </div>

        {vs.steps.map((step, idx) => {
          const collapsed = collapsedSteps.has(idx)
          const typeInfo = STEP_TYPE_MAP[step.stepType] || STEP_TYPE_MAP['Action']
          const colors = STEP_TYPE_COLORS[step.stepType] || STEP_TYPE_COLORS['Action']
          const TypeIcon = typeInfo.icon

          return (
            <div key={idx} className={`border rounded-lg overflow-hidden bg-white shadow-sm ${colors.border}`}>
              {/* Step header */}
              <div
                className="flex items-center justify-between px-3 py-2.5 bg-gray-50 border-b cursor-pointer hover:bg-gray-100 transition-colors"
                onClick={() => toggleCollapse(idx)}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className={`w-7 h-7 rounded-full ${colors.bg} text-white text-xs flex items-center justify-center font-bold flex-shrink-0`}>
                    {idx + 1}
                  </span>
                  <TypeIcon className={`w-4 h-4 ${colors.text} flex-shrink-0`} />
                  <span className="font-medium text-sm text-gray-800 truncate">{step.name}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${colors.light} ${colors.text} font-medium hidden sm:inline`}>
                    {typeInfo.label}
                  </span>
                  {step.assignee && (
                    <span className="text-xs text-gray-400 hidden md:inline flex items-center gap-1">
                      <User className="w-3 h-3" />{step.assignee}
                    </span>
                  )}
                  {step.estimatedMinutes > 0 && (
                    <span className="text-xs text-gray-400 hidden md:inline flex items-center gap-1">
                      <Clock className="w-3 h-3" />{step.estimatedMinutes}m
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button type="button" onClick={e => { e.stopPropagation(); moveStep(idx, -1) }} disabled={idx === 0}
                    className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30" title="Move up">
                    <ChevronUp className="w-4 h-4" />
                  </button>
                  <button type="button" onClick={e => { e.stopPropagation(); moveStep(idx, 1) }} disabled={idx === vs.steps.length - 1}
                    className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30" title="Move down">
                    <ChevronDown className="w-4 h-4" />
                  </button>
                  <button type="button" onClick={e => { e.stopPropagation(); removeStep(idx) }} disabled={vs.steps.length <= 1}
                    className="p-1 text-gray-400 hover:text-red-500 disabled:opacity-30" title="Remove step">
                    <Trash2 className="w-4 h-4" />
                  </button>
                  {collapsed ? <ChevronDown className="w-4 h-4 text-gray-400" /> : <ChevronUp className="w-4 h-4 text-gray-400" />}
                </div>
              </div>

              {/* Step body */}
              {!collapsed && (
                <div className="p-4 space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Step Name</label>
                      <input type="text" value={step.name}
                        onChange={e => updateStep(idx, 'name', e.target.value)}
                        className={inp} />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Step Type</label>
                      <select value={step.stepType}
                        onChange={e => updateStep(idx, 'stepType', e.target.value)}
                        className={inp}>
                        {STEP_TYPES.map(t => (
                          <option key={t.value} value={t.value}>{t.label}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Assignee / Role</label>
                      <input type="text" value={step.assignee}
                        onChange={e => updateStep(idx, 'assignee', e.target.value)}
                        placeholder="e.g. Manager, IT Team, QA Lead"
                        className={inp} />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Est. Duration (min)</label>
                      <input type="number" min={0} value={step.estimatedMinutes}
                        onChange={e => updateStep(idx, 'estimatedMinutes', parseInt(e.target.value) || 0)}
                        className={inp} />
                    </div>
                    <div className="flex items-end">
                      <label className="flex items-center gap-2 cursor-pointer pb-1.5">
                        <input type="checkbox" checked={step.required}
                          onChange={e => updateStep(idx, 'required', e.target.checked)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                        <span className="text-sm text-gray-700">Required step</span>
                      </label>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Description</label>
                    <input type="text" value={step.description}
                      onChange={e => updateStep(idx, 'description', e.target.value)}
                      placeholder="Brief description of what happens in this step"
                      className={inp} />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Instructions / Details</label>
                    <textarea value={step.instructions}
                      onChange={e => updateStep(idx, 'instructions', e.target.value)}
                      placeholder="Detailed instructions for this step..."
                      rows={3}
                      className={`${inp} resize-y`} />
                  </div>

                  {/* Decision-specific: branch count */}
                  {step.stepType === 'Decision' && (
                    <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                      <label className="block text-xs font-medium text-amber-700 mb-1">Number of Branches</label>
                      <input type="number" min={2} max={10} value={step.branchCount || 2}
                        onChange={e => updateStep(idx, 'branchCount', parseInt(e.target.value) || 2)}
                        className="w-24 px-2 py-1.5 border border-amber-300 rounded text-sm focus:ring-2 focus:ring-amber-500" />
                      <p className="text-xs text-amber-600 mt-1">Define transitions below for each branch path</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* ── Transitions ── */}
      {vs.steps.length > 1 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              <ArrowRight className="w-4 h-4 text-blue-600" />
              Transitions ({vs.transitions.length})
            </h4>
            <div className="flex items-center gap-2">
              <button type="button" onClick={handleAutoGenerate}
                className="flex items-center gap-1 px-3 py-1.5 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 border border-gray-300 transition-colors"
                title="Auto-generate linear flow transitions">
                <Zap className="w-3.5 h-3.5" /> Auto-generate
              </button>
              <button type="button" onClick={addTransition}
                className="flex items-center gap-1 px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                <Plus className="w-3.5 h-3.5" /> Add
              </button>
            </div>
          </div>

          {vs.transitions.length === 0 ? (
            <p className="text-sm text-gray-400 italic py-3 text-center">
              No transitions defined. Click "Auto-generate" for a linear flow, or add custom transitions.
            </p>
          ) : (
            <div className="border border-gray-200 rounded-lg overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 text-gray-600">
                    <th className="px-3 py-2.5 text-left font-medium">From Step</th>
                    <th className="px-3 py-2.5 text-left font-medium">Condition</th>
                    <th className="px-3 py-2.5 w-8 text-center">→</th>
                    <th className="px-3 py-2.5 text-left font-medium">To Step</th>
                    <th className="px-3 py-2.5 text-left font-medium">Label</th>
                    <th className="px-3 py-2.5 w-10"></th>
                  </tr>
                </thead>
                <tbody>
                  {vs.transitions.map((trans, idx) => (
                    <tr key={idx} className="border-t border-gray-100 hover:bg-gray-50">
                      <td className="px-3 py-2">
                        <select value={trans.sourceStepOrder}
                          onChange={e => updateTransition(idx, 'sourceStepOrder', parseInt(e.target.value))}
                          className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500">
                          {vs.steps.map((s, i) => (
                            <option key={i} value={i + 1}>{i + 1}. {s.name}</option>
                          ))}
                        </select>
                      </td>
                      <td className="px-3 py-2">
                        <select value={trans.condition}
                          onChange={e => updateTransition(idx, 'condition', e.target.value)}
                          className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500">
                          {CONDITION_TYPES.map(c => (
                            <option key={c.value} value={c.value}>{c.label}</option>
                          ))}
                        </select>
                      </td>
                      <td className="px-2 text-center">
                        <ArrowRight className="w-4 h-4 text-blue-400 mx-auto" />
                      </td>
                      <td className="px-3 py-2">
                        <select value={trans.targetStepOrder}
                          onChange={e => updateTransition(idx, 'targetStepOrder', parseInt(e.target.value))}
                          className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500">
                          {vs.steps.map((s, i) => (
                            <option key={i} value={i + 1}>{i + 1}. {s.name}</option>
                          ))}
                        </select>
                      </td>
                      <td className="px-3 py-2">
                        <input type="text" value={trans.label}
                          onChange={e => updateTransition(idx, 'label', e.target.value)}
                          placeholder="Optional label"
                          className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500" />
                      </td>
                      <td className="px-3 py-2">
                        <button type="button" onClick={() => removeTransition(idx)}
                          className="p-1 text-gray-400 hover:text-red-500 transition-colors">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── Outcomes ── */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
            <Flag className="w-4 h-4 text-blue-600" />
            Outcomes ({vs.outcomes.length})
          </h4>
          <button type="button" onClick={addOutcome}
            className="flex items-center gap-1 px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            <Plus className="w-3.5 h-3.5" /> Add Outcome
          </button>
        </div>

        {vs.outcomes.length === 0 ? (
          <p className="text-sm text-gray-400 italic py-3 text-center">
            No outcomes defined. Add possible end states for this workflow (Completed, Rejected, etc.)
          </p>
        ) : (
          <div className="space-y-2">
            {vs.outcomes.map((outcome, idx) => (
              <div key={idx} className="flex items-center gap-3 bg-white border border-gray-200 rounded-lg px-3 py-2.5">
                <span className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 text-xs flex items-center justify-center font-bold flex-shrink-0">
                  {idx + 1}
                </span>
                <input type="text" value={outcome.name}
                  onChange={e => updateOutcome(idx, 'name', e.target.value)}
                  placeholder="Outcome name"
                  className="flex-1 min-w-0 px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500" />
                <select value={outcome.type}
                  onChange={e => updateOutcome(idx, 'type', e.target.value)}
                  className="px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500">
                  {OUTCOME_TYPES.map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
                <input type="text" value={outcome.description || ''}
                  onChange={e => updateOutcome(idx, 'description', e.target.value)}
                  placeholder="Description"
                  className="flex-1 min-w-0 px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 hidden lg:block" />
                <button type="button" onClick={() => removeOutcome(idx)}
                  className="p-1 text-gray-400 hover:text-red-500 flex-shrink-0 transition-colors">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default SOPStepEditor
