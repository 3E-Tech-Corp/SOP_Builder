import React, { useState } from 'react';
import {
  Zap, ChevronRight, FileText, Shield, ShieldAlert, Upload, CheckCircle2,
  AlertTriangle, ListChecks, Paperclip, Eye,
} from 'lucide-react';
import {
  getAvailableActions, getNodeById, calculateProgress,
  checkRoleAccess, checkRequiredFields, checkRequiredDocuments, checkStatusProperties,
} from '../../utils/sopEngine';

export default function ActionPanel({ sop, testObject, onTransition, currentRole }) {
  const [expandedAction, setExpandedAction] = useState(null);
  const [fieldValues, setFieldValues] = useState({});
  const [attachedDocs, setAttachedDocs] = useState([]);
  const [showProperties, setShowProperties] = useState(false);

  if (!testObject) {
    return (
      <div className="p-4 text-center text-slate-500 text-sm">
        Select an object to see available actions
      </div>
    );
  }

  if (testObject.isComplete) {
    const currentNode = getNodeById(sop, testObject.currentNodeId);
    return (
      <div className="p-4">
        <div className="bg-slate-800 rounded-lg p-4 text-center border border-slate-700">
          <CheckCircle2 className="w-8 h-8 text-green-400 mx-auto mb-2" />
          <p className="text-sm font-medium text-green-400 mb-1">Complete</p>
          <p className="text-xs text-slate-400">
            Ended at: <span className="text-slate-300">{currentNode?.data?.label || 'End'}</span>
          </p>
          <p className="text-xs text-slate-500 mt-1">{testObject.path?.length || 0} steps taken</p>
        </div>
      </div>
    );
  }

  const currentNode = getNodeById(sop, testObject.currentNodeId);
  const actions = getAvailableActions(sop, testObject.currentNodeId);
  const progress = calculateProgress(sop, testObject);
  const propCheck = checkStatusProperties(sop, testObject.currentNodeId, testObject.properties || {});

  const handleExpandAction = (edgeId) => {
    setExpandedAction(expandedAction === edgeId ? null : edgeId);
    setFieldValues({});
    setAttachedDocs([]);
  };

  const handleSubmit = (action) => {
    // Final validations
    const roleCheck = checkRoleAccess(action, currentRole);
    if (!roleCheck.allowed) return;

    const fieldCheck = checkRequiredFields(action, fieldValues);
    if (!fieldCheck.valid) return;

    const docCheck = checkRequiredDocuments(action, attachedDocs);
    if (!docCheck.valid) return;

    onTransition(action.edgeId, fieldValues, attachedDocs);
    setExpandedAction(null);
    setFieldValues({});
    setAttachedDocs([]);
  };

  const mockAttachDoc = (docDef) => {
    if (attachedDocs.some(d => d.name === docDef.name)) return;
    setAttachedDocs(prev => [...prev, {
      name: docDef.name,
      type: docDef.type,
      fileName: `${docDef.name.replace(/\s+/g, '_').toLowerCase()}.${docDef.type === 'PDF' ? 'pdf' : docDef.type === 'Image' ? 'png' : 'docx'}`,
      size: `${Math.floor(Math.random() * 900 + 100)}KB`,
      mockAttached: true,
    }]);
  };

  return (
    <div className="p-3 space-y-3 overflow-y-auto">
      {/* Current Status */}
      <div className="bg-slate-800 rounded-lg p-3 border border-slate-700">
        <p className="text-[10px] text-slate-400 uppercase tracking-wider mb-1">Current Status</p>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: currentNode?.data?.color || '#8B5CF6' }} />
          <span className="text-sm font-semibold text-white">{currentNode?.data?.label || 'Unknown'}</span>
        </div>
        {currentNode?.data?.description && (
          <p className="text-[11px] text-slate-400 mt-1">{currentNode.data.description}</p>
        )}

        {/* Sub-SOP indicator */}
        {currentNode?.data?.subSopId && (
          <div className="mt-2 flex items-center gap-1 text-[10px] text-cyan-400 bg-cyan-500/10 px-2 py-1 rounded">
            <Zap className="w-3 h-3" />
            Sub-SOP linked — object enters child workflow at this status
          </div>
        )}
      </div>

      {/* Property Validation Warning */}
      {!propCheck.valid && (
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-2.5">
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-[11px] font-medium text-amber-300">Missing Required Properties</p>
              <p className="text-[10px] text-amber-400/70 mt-0.5">
                {propCheck.missing.join(', ')}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Object Properties (collapsible) */}
      <div className="bg-slate-800 rounded-lg border border-slate-700 overflow-hidden">
        <button
          onClick={() => setShowProperties(!showProperties)}
          className="w-full flex items-center justify-between px-3 py-2 text-left hover:bg-slate-700/30 transition-colors"
        >
          <div className="flex items-center gap-1.5">
            <Eye className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-[11px] font-medium text-slate-300">Object Properties</span>
          </div>
          <span className="text-[10px] text-slate-500">{showProperties ? '▾' : '▸'}</span>
        </button>
        {showProperties && (
          <div className="px-3 pb-2.5 border-t border-slate-700/50">
            {Object.entries(testObject.properties || {}).length === 0 ? (
              <p className="text-[10px] text-slate-500 py-2">No properties set</p>
            ) : (
              <div className="space-y-1 mt-1.5">
                {Object.entries(testObject.properties || {}).map(([key, value]) => (
                  <div key={key} className="flex items-center justify-between">
                    <span className="text-[10px] text-slate-400">{key}</span>
                    <span className="text-[10px] text-slate-200 font-mono">{value || '—'}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Attached documents */}
            {(testObject.documents || []).length > 0 && (
              <div className="mt-2 pt-2 border-t border-slate-700/50">
                <p className="text-[10px] text-slate-400 mb-1">Attached Documents</p>
                {testObject.documents.map((doc, i) => (
                  <div key={i} className="flex items-center gap-1 text-[10px] text-slate-300">
                    <Paperclip className="w-2.5 h-2.5 text-slate-500" />
                    {doc.name} <span className="text-slate-500">({doc.type})</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Progress */}
      <div className="bg-slate-800 rounded-lg p-3 border border-slate-700">
        <div className="flex items-center justify-between mb-1.5">
          <p className="text-[10px] text-slate-400 uppercase tracking-wider">Progress</p>
          <span className="text-xs text-synthia-400 font-medium">{progress.percentage}%</span>
        </div>
        <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-synthia-600 to-synthia-400 rounded-full transition-all duration-500"
            style={{ width: `${progress.percentage}%` }} />
        </div>
        <p className="text-[10px] text-slate-500 mt-1">Step {progress.steps}{progress.total ? ` of ~${progress.total}` : ''}</p>
      </div>

      {/* Available Actions */}
      <div>
        <p className="text-[10px] text-slate-400 uppercase tracking-wider mb-2">Available Actions</p>
        {actions.length === 0 ? (
          <p className="text-xs text-slate-500 italic">No actions available from this status</p>
        ) : (
          <div className="space-y-1.5">
            {actions.map(action => {
              const roleCheck = checkRoleAccess(action, currentRole);
              const isExpanded = expandedAction === action.edgeId;

              return (
                <div key={action.edgeId} className="rounded-lg border border-slate-700 overflow-hidden">
                  {/* Action Header */}
                  <button
                    onClick={() => handleExpandAction(action.edgeId)}
                    className={`w-full flex items-center justify-between px-3 py-2.5 text-left transition-all group ${
                      isExpanded ? 'bg-slate-700/50' : 'bg-slate-800 hover:bg-slate-700/30'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <Zap className={`w-3.5 h-3.5 flex-shrink-0 ${roleCheck.allowed ? 'text-synthia-400' : 'text-red-400'}`} />
                      <div className="min-w-0">
                        <span className="text-xs font-medium text-slate-200 block truncate">
                          {action.label || 'Continue'}
                        </span>
                        {action.description && (
                          <p className="text-[10px] text-slate-500 truncate">{action.description}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0 ml-2">
                      {!roleCheck.allowed && (
                        <ShieldAlert className="w-3.5 h-3.5 text-red-400" title="Role not authorized" />
                      )}
                      {action.requiredRoles.length > 0 && roleCheck.allowed && (
                        <Shield className="w-3 h-3 text-blue-400" />
                      )}
                      {action.requiredDocuments.length > 0 && (
                        <FileText className="w-3 h-3 text-amber-400" />
                      )}
                      {action.requiredFields.length > 0 && (
                        <ListChecks className="w-3 h-3 text-emerald-400" />
                      )}
                      <ChevronRight className={`w-3.5 h-3.5 text-slate-500 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                    </div>
                  </button>

                  {/* Expanded Action Form */}
                  {isExpanded && (
                    <div className="px-3 pb-3 space-y-3 border-t border-slate-700/50 bg-slate-800/50">

                      {/* Role Check */}
                      {action.requiredRoles.length > 0 && (
                        <div className={`mt-2 p-2 rounded text-[10px] ${
                          roleCheck.allowed
                            ? 'bg-green-500/10 border border-green-500/20 text-green-300'
                            : 'bg-red-500/10 border border-red-500/20 text-red-300'
                        }`}>
                          <div className="flex items-center gap-1">
                            {roleCheck.allowed
                              ? <CheckCircle2 className="w-3 h-3" />
                              : <ShieldAlert className="w-3 h-3" />
                            }
                            <span className="font-medium">
                              {roleCheck.allowed ? 'Role authorized' : 'Role not authorized'}
                            </span>
                          </div>
                          <p className="mt-0.5 text-[9px] opacity-70">
                            Required: {action.requiredRoles.join(', ')} | Your role: {currentRole}
                          </p>
                        </div>
                      )}

                      {/* Required Fields */}
                      {action.requiredFields.length > 0 && (
                        <div className="mt-2">
                          <p className="text-[10px] text-slate-400 font-medium mb-1.5 flex items-center gap-1">
                            <ListChecks className="w-3 h-3 text-emerald-400" />
                            Required Fields
                          </p>
                          <div className="space-y-1.5">
                            {action.requiredFields.map(field => (
                              <div key={field.name}>
                                <label className="text-[10px] text-slate-400 block mb-0.5">
                                  {field.name} <span className="text-slate-500">({field.type})</span>
                                </label>
                                <input
                                  type={field.type === 'number' || field.type === 'currency' ? 'number' : field.type === 'date' ? 'date' : field.type === 'email' ? 'email' : 'text'}
                                  value={fieldValues[field.name] || ''}
                                  onChange={e => setFieldValues(prev => ({ ...prev, [field.name]: e.target.value }))}
                                  className="w-full px-2 py-1 bg-slate-700 border border-slate-600 rounded text-xs text-white focus:outline-none focus:ring-1 focus:ring-synthia-500"
                                  placeholder={`Enter ${field.name}`}
                                />
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Required Documents */}
                      {action.requiredDocuments.length > 0 && (
                        <div>
                          <p className="text-[10px] text-slate-400 font-medium mb-1.5 flex items-center gap-1">
                            <FileText className="w-3 h-3 text-amber-400" />
                            Required Documents
                          </p>
                          <div className="space-y-1.5">
                            {action.requiredDocuments.map(doc => {
                              const isAttached = attachedDocs.some(d => d.name === doc.name);
                              return (
                                <div key={doc.name} className={`flex items-center gap-2 p-2 rounded border ${
                                  isAttached
                                    ? 'bg-green-500/10 border-green-500/20'
                                    : 'bg-slate-700/30 border-slate-600'
                                }`}>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-[10px] font-medium text-slate-200">{doc.name}</p>
                                    <p className="text-[9px] text-slate-500">{doc.type}{doc.description ? ` — ${doc.description}` : ''}</p>
                                  </div>
                                  {isAttached ? (
                                    <span className="flex items-center gap-0.5 text-[9px] text-green-400">
                                      <CheckCircle2 className="w-3 h-3" /> Attached
                                    </span>
                                  ) : (
                                    <button
                                      onClick={() => mockAttachDoc(doc)}
                                      className="flex items-center gap-0.5 px-2 py-1 text-[9px] text-synthia-400 bg-synthia-500/10 hover:bg-synthia-500/20 rounded transition-colors"
                                    >
                                      <Upload className="w-3 h-3" /> Attach
                                    </button>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Submit */}
                      <div className="flex gap-2 pt-1">
                        <button
                          onClick={() => handleSubmit(action)}
                          disabled={!roleCheck.allowed}
                          className="flex-1 flex items-center justify-center gap-1 px-3 py-2 text-xs font-medium text-white bg-synthia-600 hover:bg-synthia-700 rounded-md transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          <Zap className="w-3 h-3" />
                          Execute Action
                        </button>
                        <button
                          onClick={() => setExpandedAction(null)}
                          className="px-3 py-2 text-xs text-slate-400 hover:text-slate-200 transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
