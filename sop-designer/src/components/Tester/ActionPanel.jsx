import React, { useState } from 'react';
import { Zap, ChevronRight, FileText } from 'lucide-react';
import { getAvailableActions, getNodeById, calculateProgress } from '../../utils/sopEngine';

export default function ActionPanel({ sop, testObject, onTransition }) {
  const [showForm, setShowForm] = useState(null); // edgeId
  const [fieldValues, setFieldValues] = useState({});

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
          <p className="text-sm font-medium text-green-400 mb-1">✓ Complete</p>
          <p className="text-xs text-slate-400">
            Ended at: <span className="text-slate-300">{currentNode?.data?.label || 'End'}</span>
          </p>
          <p className="text-xs text-slate-500 mt-1">
            {testObject.path?.length || 0} steps taken
          </p>
        </div>
      </div>
    );
  }

  const currentNode = getNodeById(sop, testObject.currentNodeId);
  const actions = getAvailableActions(sop, testObject.currentNodeId);
  const progress = calculateProgress(sop, testObject);

  const handleAction = (action) => {
    if (action.requiredFields.length > 0) {
      setShowForm(action.edgeId);
      setFieldValues({});
    } else {
      onTransition(action.edgeId, {});
    }
  };

  const handleSubmitForm = (edgeId) => {
    onTransition(edgeId, fieldValues);
    setShowForm(null);
    setFieldValues({});
  };

  return (
    <div className="p-3 space-y-3">
      {/* Current Status */}
      <div className="bg-slate-800 rounded-lg p-3 border border-slate-700">
        <p className="text-[10px] text-slate-400 uppercase tracking-wider mb-1">Current Status</p>
        <div className="flex items-center gap-2">
          <div
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: currentNode?.data?.color || '#8B5CF6' }}
          />
          <span className="text-sm font-semibold text-white">{currentNode?.data?.label || 'Unknown'}</span>
        </div>
        {currentNode?.data?.description && (
          <p className="text-[11px] text-slate-400 mt-1">{currentNode.data.description}</p>
        )}
      </div>

      {/* Progress */}
      <div className="bg-slate-800 rounded-lg p-3 border border-slate-700">
        <div className="flex items-center justify-between mb-1.5">
          <p className="text-[10px] text-slate-400 uppercase tracking-wider">Progress</p>
          <span className="text-xs text-synthia-400 font-medium">{progress.percentage}%</span>
        </div>
        <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-synthia-600 to-synthia-400 rounded-full transition-all duration-500"
            style={{ width: `${progress.percentage}%` }}
          />
        </div>
        <p className="text-[10px] text-slate-500 mt-1">
          Step {progress.steps} {progress.total ? `of ~${progress.total}` : ''}
        </p>
      </div>

      {/* Available Actions */}
      <div>
        <p className="text-[10px] text-slate-400 uppercase tracking-wider mb-2">Available Actions</p>
        {actions.length === 0 ? (
          <p className="text-xs text-slate-500 italic">No actions available</p>
        ) : (
          <div className="space-y-1.5">
            {actions.map(action => (
              <div key={action.edgeId}>
                {showForm === action.edgeId ? (
                  <div className="bg-slate-800 rounded-lg p-3 border border-synthia-500/50">
                    <p className="text-xs font-medium text-white mb-2 flex items-center gap-1">
                      <FileText className="w-3 h-3 text-synthia-400" />
                      {action.label} — Required Fields
                    </p>
                    <div className="space-y-2">
                      {action.requiredFields.map(field => (
                        <div key={field}>
                          <label className="text-[10px] text-slate-400 block mb-0.5">{field}</label>
                          <input
                            type="text"
                            value={fieldValues[field] || ''}
                            onChange={e => setFieldValues(prev => ({ ...prev, [field]: e.target.value }))}
                            className="w-full px-2 py-1 bg-slate-700 border border-slate-600 rounded text-xs text-white focus:outline-none focus:ring-1 focus:ring-synthia-500"
                            placeholder={`Enter ${field}`}
                          />
                        </div>
                      ))}
                    </div>
                    <div className="flex gap-2 mt-3">
                      <button
                        onClick={() => handleSubmitForm(action.edgeId)}
                        className="flex-1 px-3 py-1.5 text-xs font-medium text-white bg-synthia-600 hover:bg-synthia-700 rounded transition-colors"
                      >
                        Submit & Transition
                      </button>
                      <button
                        onClick={() => setShowForm(null)}
                        className="px-3 py-1.5 text-xs text-slate-400 hover:text-slate-200 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => handleAction(action)}
                    className="w-full flex items-center justify-between px-3 py-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-synthia-500/30 rounded-lg transition-all group"
                  >
                    <div className="flex items-center gap-2">
                      <Zap className="w-3.5 h-3.5 text-synthia-400 group-hover:text-synthia-300" />
                      <div className="text-left">
                        <span className="text-xs font-medium text-slate-200 group-hover:text-white">
                          {action.label || 'Continue'}
                        </span>
                        {action.description && (
                          <p className="text-[10px] text-slate-500">{action.description}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      {action.requiredFields.length > 0 && (
                        <span className="text-[9px] text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded">
                          {action.requiredFields.length} fields
                        </span>
                      )}
                      <ChevronRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-synthia-400" />
                    </div>
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
