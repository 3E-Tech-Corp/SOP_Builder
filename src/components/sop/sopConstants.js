/**
 * SOP Builder — Constants, defaults, and helpers for SOP workflow editing.
 * Adapted from the tournament structure editor pattern.
 */
import {
  ClipboardList, CheckCircle, GitBranch, Bell, FileText, Users,
  Clock, ShieldCheck, MessageSquare, Zap, AlertTriangle, Send, Box
} from 'lucide-react'

// ── Step type definitions ──
export const STEP_TYPES = [
  { value: 'Action', label: 'Action', icon: ClipboardList, color: 'blue', description: 'Task that must be performed' },
  { value: 'Review', label: 'Review', icon: FileText, color: 'purple', description: 'Review or inspection step' },
  { value: 'Approval', label: 'Approval', icon: CheckCircle, color: 'green', description: 'Requires sign-off to proceed' },
  { value: 'Decision', label: 'Decision', icon: GitBranch, color: 'amber', description: 'Branch point with multiple paths' },
  { value: 'Notification', label: 'Notification', icon: Bell, color: 'orange', description: 'Send a notification or alert' },
  { value: 'Parallel', label: 'Parallel', icon: Users, color: 'indigo', description: 'Multiple tasks executed simultaneously' },
  { value: 'Wait', label: 'Wait / Timer', icon: Clock, color: 'gray', description: 'Wait for a condition or time period' },
  { value: 'Compliance', label: 'Compliance Check', icon: ShieldCheck, color: 'red', description: 'Regulatory or policy check' },
  { value: 'Input', label: 'Data Input', icon: MessageSquare, color: 'teal', description: 'Collect information or form data' },
  { value: 'Automated', label: 'Automated', icon: Zap, color: 'cyan', description: 'System-triggered automatic action' },
  { value: 'Escalation', label: 'Escalation', icon: AlertTriangle, color: 'rose', description: 'Escalate to higher authority' },
  { value: 'Handoff', label: 'Handoff', icon: Send, color: 'emerald', description: 'Transfer to another team/person' },
  { value: 'SubSOP', label: 'Sub-SOP', icon: Box, color: 'violet', description: 'Nest another SOP as a sub-process' },
]

export const STEP_TYPE_MAP = Object.fromEntries(STEP_TYPES.map(s => [s.value, s]))

// ── SOP categories ──
export const SOP_CATEGORIES = [
  { value: 'Operations', label: 'Operations' },
  { value: 'Safety', label: 'Safety & Compliance' },
  { value: 'HR', label: 'Human Resources' },
  { value: 'IT', label: 'IT & Technology' },
  { value: 'Quality', label: 'Quality Assurance' },
  { value: 'Finance', label: 'Finance & Accounting' },
  { value: 'CustomerService', label: 'Customer Service' },
  { value: 'Manufacturing', label: 'Manufacturing' },
  { value: 'Legal', label: 'Legal' },
  { value: 'Custom', label: 'Custom' },
]

// ── Property types for object schema ──
export const PROPERTY_TYPES = [
  { value: 'Text', label: 'Text' },
  { value: 'Number', label: 'Number' },
  { value: 'Date', label: 'Date' },
  { value: 'DateTime', label: 'Date & Time' },
  { value: 'Boolean', label: 'Yes / No' },
  { value: 'Select', label: 'Dropdown Select' },
  { value: 'MultiSelect', label: 'Multi-Select' },
  { value: 'Email', label: 'Email' },
  { value: 'URL', label: 'URL' },
  { value: 'Phone', label: 'Phone' },
  { value: 'Currency', label: 'Currency' },
  { value: 'Percent', label: 'Percent' },
  { value: 'TextArea', label: 'Long Text' },
  { value: 'File', label: 'File / Attachment' },
  { value: 'User', label: 'User / Person' },
  { value: 'Reference', label: 'Reference (to another object)' },
]

// Built-in object fields (always present, cannot be removed)
export const BUILT_IN_PROPERTIES = [
  { key: 'id', label: 'ID', type: 'Text', builtIn: true, required: true, description: 'Unique identifier' },
  { key: 'type', label: 'Type', type: 'Text', builtIn: true, required: true, description: 'Object type name' },
  { key: 'name', label: 'Name', type: 'Text', builtIn: true, required: true, description: 'Display name' },
  { key: 'status', label: 'Status', type: 'Select', builtIn: true, required: true, description: 'Current workflow status',
    options: ['New', 'In Progress', 'Pending Review', 'Approved', 'Rejected', 'Completed', 'Cancelled'] },
]

export const DEFAULT_PROPERTY = {
  key: '',
  label: '',
  type: 'Text',
  required: false,
  description: '',
  defaultValue: '',
  options: [],      // for Select / MultiSelect
  builtIn: false,
}

export const DEFAULT_OBJECT_SCHEMA = {
  typeName: '',
  typeDescription: '',
  properties: [],   // user-defined only; built-ins are always prepended
}

// ── Priority levels ──
export const PRIORITY_LEVELS = ['Low', 'Medium', 'High', 'Critical']

// ── Outcome types ──
export const OUTCOME_TYPES = ['Completed', 'Approved', 'Rejected', 'Escalated', 'Deferred', 'Cancelled']

// ── Transition condition types ──
export const CONDITION_TYPES = [
  { value: 'Always', label: 'Always (default path)' },
  { value: 'Approved', label: 'If approved' },
  { value: 'Rejected', label: 'If rejected' },
  { value: 'Condition', label: 'Custom condition' },
  { value: 'Timeout', label: 'On timeout' },
  { value: 'Error', label: 'On error/failure' },
]

// ── Default objects ──
export const DEFAULT_STEP = {
  name: 'New Step',
  stepType: 'Action',
  sortOrder: 1,
  description: '',
  assignee: '',
  estimatedMinutes: 30,
  required: true,
  instructions: '',
  // Decision-specific
  branchCount: 0,
  // Parallel-specific
  parallelTasks: [],
  // SubSOP-specific
  subSopId: null,
}

export const DEFAULT_TRANSITION = {
  sourceStepOrder: 1,
  targetStepOrder: 2,
  condition: 'Always',
  conditionExpression: '',
  label: '',
}

export const DEFAULT_OUTCOME = {
  name: 'Completed',
  type: 'Completed',
  description: '',
}

// ══════════════════════════════════════════
// State Machine Model — Statuses + Connectors (Actions)
// ══════════════════════════════════════════

// Status node types (visual differentiation)
export const STATUS_NODE_TYPES = [
  { value: 'Start', label: 'Start', color: 'green', description: 'Entry point — object begins here' },
  { value: 'Normal', label: 'Normal', color: 'blue', description: 'Standard workflow status' },
  { value: 'Decision', label: 'Decision', color: 'amber', description: 'Status where a decision/review happens' },
  { value: 'Waiting', label: 'Waiting', color: 'gray', description: 'Object is waiting for external input' },
  { value: 'Terminal', label: 'Terminal', color: 'purple', description: 'Final status — workflow ends here' },
  { value: 'Error', label: 'Error', color: 'red', description: 'Error or exception status' },
]

export const STATUS_NODE_COLORS = {
  Start: { bg: 'bg-green-500', light: 'bg-green-50', border: 'border-green-300', text: 'text-green-700', ring: 'ring-green-500' },
  Normal: { bg: 'bg-blue-500', light: 'bg-blue-50', border: 'border-blue-300', text: 'text-blue-700', ring: 'ring-blue-500' },
  Decision: { bg: 'bg-amber-500', light: 'bg-amber-50', border: 'border-amber-300', text: 'text-amber-700', ring: 'ring-amber-500' },
  Waiting: { bg: 'bg-gray-500', light: 'bg-gray-50', border: 'border-gray-300', text: 'text-gray-700', ring: 'ring-gray-500' },
  Terminal: { bg: 'bg-purple-500', light: 'bg-purple-50', border: 'border-purple-300', text: 'text-purple-700', ring: 'ring-purple-500' },
  Error: { bg: 'bg-red-500', light: 'bg-red-50', border: 'border-red-300', text: 'text-red-700', ring: 'ring-red-500' },
}

// Connector (action) types
export const CONNECTOR_TYPES = [
  { value: 'Manual', label: 'Manual Action', description: 'Performed by a person' },
  { value: 'Approval', label: 'Approval', description: 'Requires sign-off' },
  { value: 'Automated', label: 'Automated', description: 'System-triggered' },
  { value: 'Conditional', label: 'Conditional', description: 'Based on a condition/rule' },
  { value: 'Timer', label: 'Timer / Scheduled', description: 'Triggers after a time period' },
  { value: 'SubSOP', label: 'Sub-SOP', description: 'Executes a nested SOP workflow' },
]

export const DEFAULT_STATUS = {
  name: 'New Status',
  nodeType: 'Normal',
  description: '',
  sortOrder: 1,
  requiredFields: [],   // property keys that must be filled for the object to be valid in this status
}

export const DEFAULT_ROLE = {
  name: '',
  description: '',
}

export const DEFAULT_CONNECTOR = {
  name: '',
  fromStatus: '',   // status name
  toStatus: '',     // status name
  connectorType: 'Manual',
  allowedRoles: [],   // role names that can perform this action (empty = anyone)
  description: '',
  instructions: '',
  condition: '',
  estimatedMinutes: 0,
  requiredFields: [],   // property keys that must be filled to perform this action
  requiredDocuments: [], // documents that must be attached to complete the action
  subSopId: null,
}

export const DEFAULT_REQUIRED_DOCUMENT = {
  name: '',
  description: '',
  acceptedTypes: '',  // e.g. "pdf,jpg,png" or empty for any
  maxSizeMB: 0,       // 0 = no limit
}

// Parse state-machine model from JSON
export function parseStateMachineToVisual(jsonStr) {
  try {
    const s = typeof jsonStr === 'string' ? JSON.parse(jsonStr) : jsonStr
    return {
      roles: Array.isArray(s.roles) ? s.roles.map(r => ({
        name: r.name || '',
        description: r.description || '',
      })) : [],
      statuses: Array.isArray(s.statuses) ? s.statuses.map((st, i) => ({
        name: st.name || `Status ${i + 1}`,
        nodeType: st.nodeType || 'Normal',
        description: st.description || '',
        sortOrder: st.sortOrder || i + 1,
        requiredFields: st.requiredFields || [],
      })) : [
        { name: 'New', nodeType: 'Start', description: 'Initial status', sortOrder: 1 },
        { name: 'Completed', nodeType: 'Terminal', description: 'Workflow complete', sortOrder: 2 },
      ],
      connectors: Array.isArray(s.connectors) ? s.connectors.map(c => ({
        name: c.name || '',
        fromStatus: c.fromStatus || '',
        toStatus: c.toStatus || '',
        connectorType: c.connectorType || 'Manual',
        allowedRoles: c.allowedRoles || [],
        description: c.description || '',
        instructions: c.instructions || '',
        condition: c.condition || '',
        estimatedMinutes: c.estimatedMinutes || 0,
        requiredFields: c.requiredFields || [],
        requiredDocuments: Array.isArray(c.requiredDocuments) ? c.requiredDocuments.map(d => ({
          name: d.name || '',
          description: d.description || '',
          acceptedTypes: d.acceptedTypes || '',
          maxSizeMB: d.maxSizeMB || 0,
        })) : [],
        subSopId: c.subSopId || null,
      })) : [],
      objectSchema: s.objectSchema ? {
        typeName: s.objectSchema.typeName || '',
        typeDescription: s.objectSchema.typeDescription || '',
        properties: Array.isArray(s.objectSchema.properties) ? s.objectSchema.properties.map(p => ({
          key: p.key || '', label: p.label || '', type: p.type || 'Text',
          required: p.required || false, description: p.description || '',
          defaultValue: p.defaultValue || '', options: p.options || [], builtIn: false,
        })) : [],
      } : { ...DEFAULT_OBJECT_SCHEMA },
      metadata: s.metadata || {},
    }
  } catch {
    return {
      roles: [],
      statuses: [
        { name: 'New', nodeType: 'Start', description: 'Initial status', sortOrder: 1 },
        { name: 'Completed', nodeType: 'Terminal', description: 'Workflow complete', sortOrder: 2 },
      ],
      connectors: [],
      objectSchema: { ...DEFAULT_OBJECT_SCHEMA },
      metadata: {},
    }
  }
}

// Serialize state-machine visual state to JSON
export function serializeStateMachineToJson(vs) {
  const obj = {
    ...(vs.roles?.length > 0 ? { roles: vs.roles.map(r => ({
      name: r.name,
      description: r.description || undefined,
    })) } : {}),
    statuses: vs.statuses.map((s, i) => ({
      name: s.name,
      nodeType: s.nodeType,
      description: s.description || undefined,
      sortOrder: i + 1,
      ...(s.requiredFields?.length > 0 ? { requiredFields: s.requiredFields } : {}),
    })),
    connectors: vs.connectors.map(c => ({
      name: c.name,
      fromStatus: c.fromStatus,
      toStatus: c.toStatus,
      connectorType: c.connectorType,
      ...(c.allowedRoles?.length > 0 ? { allowedRoles: c.allowedRoles } : {}),
      description: c.description || undefined,
      instructions: c.instructions || undefined,
      condition: c.condition || undefined,
      estimatedMinutes: c.estimatedMinutes || undefined,
      ...(c.requiredFields?.length > 0 ? { requiredFields: c.requiredFields } : {}),
      ...(c.requiredDocuments?.length > 0 ? { requiredDocuments: c.requiredDocuments.map(d => ({
        name: d.name,
        description: d.description || undefined,
        acceptedTypes: d.acceptedTypes || undefined,
        maxSizeMB: d.maxSizeMB || undefined,
      })) } : {}),
      ...(c.connectorType === 'SubSOP' && c.subSopId ? { subSopId: c.subSopId } : {}),
    })),
    ...(vs.objectSchema && (vs.objectSchema.typeName || vs.objectSchema.properties?.length > 0)
      ? { objectSchema: vs.objectSchema } : {}),
    ...(vs.metadata && Object.keys(vs.metadata).length > 0 ? { metadata: vs.metadata } : {}),
  }
  return JSON.stringify(obj, null, 2)
}

// ── Step type colors for UI ──
export const STEP_TYPE_COLORS = {
  Action: { bg: 'bg-blue-500', light: 'bg-blue-50', border: 'border-blue-300', text: 'text-blue-700' },
  Review: { bg: 'bg-purple-500', light: 'bg-purple-50', border: 'border-purple-300', text: 'text-purple-700' },
  Approval: { bg: 'bg-green-500', light: 'bg-green-50', border: 'border-green-300', text: 'text-green-700' },
  Decision: { bg: 'bg-amber-500', light: 'bg-amber-50', border: 'border-amber-300', text: 'text-amber-700' },
  Notification: { bg: 'bg-orange-500', light: 'bg-orange-50', border: 'border-orange-300', text: 'text-orange-700' },
  Parallel: { bg: 'bg-indigo-500', light: 'bg-indigo-50', border: 'border-indigo-300', text: 'text-indigo-700' },
  Wait: { bg: 'bg-gray-500', light: 'bg-gray-50', border: 'border-gray-300', text: 'text-gray-700' },
  Compliance: { bg: 'bg-red-500', light: 'bg-red-50', border: 'border-red-300', text: 'text-red-700' },
  Input: { bg: 'bg-teal-500', light: 'bg-teal-50', border: 'border-teal-300', text: 'text-teal-700' },
  Automated: { bg: 'bg-cyan-500', light: 'bg-cyan-50', border: 'border-cyan-300', text: 'text-cyan-700' },
  Escalation: { bg: 'bg-rose-500', light: 'bg-rose-50', border: 'border-rose-300', text: 'text-rose-700' },
  Handoff: { bg: 'bg-emerald-500', light: 'bg-emerald-50', border: 'border-emerald-300', text: 'text-emerald-700' },
  SubSOP: { bg: 'bg-violet-500', light: 'bg-violet-50', border: 'border-violet-300', text: 'text-violet-700' },
}

// ── Parse SOP JSON into visual state ──
export function parseSOPToVisual(jsonStr) {
  try {
    const s = typeof jsonStr === 'string' ? JSON.parse(jsonStr) : jsonStr
    return {
      steps: Array.isArray(s.steps) ? s.steps.map((step, i) => ({
        name: step.name || `Step ${i + 1}`,
        stepType: step.stepType || 'Action',
        sortOrder: step.sortOrder || i + 1,
        description: step.description || '',
        assignee: step.assignee || '',
        estimatedMinutes: step.estimatedMinutes ?? 30,
        required: step.required !== false,
        instructions: step.instructions || '',
        branchCount: step.branchCount || 0,
        parallelTasks: step.parallelTasks || [],
        subSopId: step.subSopId || null,
      })) : [{ ...DEFAULT_STEP }],
      transitions: Array.isArray(s.transitions) ? s.transitions.map(t => ({
        sourceStepOrder: t.sourceStepOrder ?? 1,
        targetStepOrder: t.targetStepOrder ?? 2,
        condition: t.condition || 'Always',
        conditionExpression: t.conditionExpression || '',
        label: t.label || '',
      })) : [],
      outcomes: Array.isArray(s.outcomes) ? s.outcomes : [],
      objectSchema: s.objectSchema ? {
        typeName: s.objectSchema.typeName || '',
        typeDescription: s.objectSchema.typeDescription || '',
        properties: Array.isArray(s.objectSchema.properties) ? s.objectSchema.properties.map(p => ({
          key: p.key || '',
          label: p.label || '',
          type: p.type || 'Text',
          required: p.required || false,
          description: p.description || '',
          defaultValue: p.defaultValue || '',
          options: p.options || [],
          builtIn: false,
        })) : [],
      } : { ...DEFAULT_OBJECT_SCHEMA },
      metadata: s.metadata || {},
    }
  } catch {
    return {
      steps: [{ ...DEFAULT_STEP }],
      transitions: [],
      outcomes: [],
      objectSchema: { ...DEFAULT_OBJECT_SCHEMA },
      metadata: {},
    }
  }
}

// ── Serialize visual state to JSON ──
export function serializeVisualToSOP(vs) {
  const obj = {
    steps: vs.steps.map((s, i) => ({
      name: s.name,
      stepType: s.stepType,
      sortOrder: i + 1,
      description: s.description || undefined,
      assignee: s.assignee || undefined,
      estimatedMinutes: parseInt(s.estimatedMinutes) || 30,
      required: s.required,
      instructions: s.instructions || undefined,
      ...(s.stepType === 'Decision' && s.branchCount > 0 ? { branchCount: s.branchCount } : {}),
      ...(s.stepType === 'Parallel' && s.parallelTasks?.length > 0 ? { parallelTasks: s.parallelTasks } : {}),
      ...(s.stepType === 'SubSOP' && s.subSopId ? { subSopId: s.subSopId } : {}),
    })),
    transitions: vs.transitions,
    ...(vs.outcomes?.length > 0 ? { outcomes: vs.outcomes } : {}),
    ...(vs.objectSchema && (vs.objectSchema.typeName || vs.objectSchema.properties?.length > 0)
      ? { objectSchema: {
          typeName: vs.objectSchema.typeName,
          typeDescription: vs.objectSchema.typeDescription || undefined,
          properties: vs.objectSchema.properties,
        } }
      : {}),
    ...(vs.metadata && Object.keys(vs.metadata).length > 0 ? { metadata: vs.metadata } : {}),
  }
  return JSON.stringify(obj, null, 2)
}

// ── Auto-generate transitions (linear flow) ──
export function autoGenerateTransitions(steps) {
  const transitions = []
  for (let i = 0; i < steps.length - 1; i++) {
    const src = steps[i]
    if (src.stepType === 'Decision') {
      // Decision nodes get two default paths: Approved → next, Rejected → stays
      transitions.push({
        sourceStepOrder: i + 1,
        targetStepOrder: i + 2,
        condition: 'Approved',
        conditionExpression: '',
        label: 'Yes / Approved',
      })
      if (i > 0) {
        transitions.push({
          sourceStepOrder: i + 1,
          targetStepOrder: i, // go back one step
          condition: 'Rejected',
          conditionExpression: '',
          label: 'No / Rejected',
        })
      }
    } else {
      transitions.push({
        sourceStepOrder: i + 1,
        targetStepOrder: i + 2,
        condition: 'Always',
        conditionExpression: '',
        label: '',
      })
    }
  }
  return transitions
}
