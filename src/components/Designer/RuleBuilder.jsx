import React, { useState } from 'react';
import { Plus, X, GitBranch } from 'lucide-react';

const OPERATORS = [
  { value: 'equals', label: '=' },
  { value: 'not_equals', label: '!=' },
  { value: 'greater_than', label: '>' },
  { value: 'less_than', label: '<' },
  { value: 'contains', label: 'contains' },
  { value: 'starts_with', label: 'starts with' },
  { value: 'in_list', label: 'in list' },
];

export default function RuleBuilder({ rules = [], ruleLogic = 'and', objectSchema, onChange, onChangeLogic }) {
  const schemaProps = objectSchema?.properties || [];

  const addRule = () => {
    onChange([...rules, { propertyName: schemaProps[0]?.name || '', operator: 'equals', targetValue: '' }]);
  };

  const updateRule = (idx, updates) => {
    onChange(rules.map((r, i) => i === idx ? { ...r, ...updates } : r));
  };

  const removeRule = (idx) => {
    onChange(rules.filter((_, i) => i !== idx));
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-1.5">
          <GitBranch className="w-3.5 h-3.5 text-amber-400" />
          <span className="text-[11px] font-semibold text-slate-300">Decision Rules</span>
          {rules.length > 0 && (
            <span className="text-[9px] text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded-full">{rules.length}</span>
          )}
        </div>
        <button onClick={addRule} className="p-0.5 text-synthia-400 hover:text-synthia-300 transition-colors">
          <Plus className="w-3.5 h-3.5" />
        </button>
      </div>

      <p className="text-[9px] text-slate-500 mb-2">
        Define rules to auto-route objects from this Decision node. Objects matching these rules will follow this edge.
      </p>

      {rules.length > 1 && (
        <div className="flex items-center gap-2 mb-2">
          <span className="text-[10px] text-slate-400">Logic:</span>
          <button
            onClick={() => onChangeLogic('and')}
            className={`px-2 py-0.5 text-[10px] rounded transition-colors ${
              ruleLogic === 'and'
                ? 'bg-synthia-500/20 text-synthia-400 border border-synthia-500/40'
                : 'bg-slate-700 text-slate-400 border border-slate-600 hover:border-slate-500'
            }`}
          >
            AND
          </button>
          <button
            onClick={() => onChangeLogic('or')}
            className={`px-2 py-0.5 text-[10px] rounded transition-colors ${
              ruleLogic === 'or'
                ? 'bg-synthia-500/20 text-synthia-400 border border-synthia-500/40'
                : 'bg-slate-700 text-slate-400 border border-slate-600 hover:border-slate-500'
            }`}
          >
            OR
          </button>
        </div>
      )}

      <div className="space-y-1.5">
        {rules.map((rule, idx) => (
          <div key={idx} className="flex items-center gap-1 bg-slate-800/50 rounded p-1.5 border border-slate-700/50">
            {/* Property Name */}
            {schemaProps.length > 0 ? (
              <select
                value={rule.propertyName}
                onChange={e => updateRule(idx, { propertyName: e.target.value })}
                className="flex-1 px-1.5 py-1 bg-slate-700 border border-slate-600 rounded text-[10px] text-white focus:outline-none focus:ring-1 focus:ring-synthia-500"
              >
                <option value="">Select property...</option>
                {schemaProps.map(p => (
                  <option key={p.name} value={p.name}>{p.name}</option>
                ))}
              </select>
            ) : (
              <input
                type="text"
                value={rule.propertyName}
                onChange={e => updateRule(idx, { propertyName: e.target.value })}
                placeholder="Property"
                className="flex-1 px-1.5 py-1 bg-slate-700 border border-slate-600 rounded text-[10px] text-white focus:outline-none focus:ring-1 focus:ring-synthia-500"
              />
            )}

            {/* Operator */}
            <select
              value={rule.operator}
              onChange={e => updateRule(idx, { operator: e.target.value })}
              className="w-20 px-1 py-1 bg-slate-700 border border-slate-600 rounded text-[10px] text-white focus:outline-none focus:ring-1 focus:ring-synthia-500"
            >
              {OPERATORS.map(op => (
                <option key={op.value} value={op.value}>{op.label}</option>
              ))}
            </select>

            {/* Target Value */}
            <input
              type="text"
              value={rule.targetValue}
              onChange={e => updateRule(idx, { targetValue: e.target.value })}
              placeholder="Value"
              className="flex-1 px-1.5 py-1 bg-slate-700 border border-slate-600 rounded text-[10px] text-white focus:outline-none focus:ring-1 focus:ring-synthia-500"
            />

            {/* Remove */}
            <button onClick={() => removeRule(idx)} className="p-0.5 text-slate-400 hover:text-red-400 transition-colors">
              <X className="w-3 h-3" />
            </button>
          </div>
        ))}
      </div>

      {rules.length === 0 && (
        <p className="text-[9px] text-slate-500 italic mt-1">No rules defined. Click + to add a rule.</p>
      )}

      {rules.some(r => r.operator === 'in_list') && (
        <p className="text-[9px] text-slate-500 mt-1">For "in list", separate values with commas.</p>
      )}
    </div>
  );
}
