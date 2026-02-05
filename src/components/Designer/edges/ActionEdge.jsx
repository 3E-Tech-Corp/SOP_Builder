import React, { memo } from 'react';
import { BaseEdge, EdgeLabelRenderer, getBezierPath } from '@xyflow/react';

const ActionEdge = memo(({
  id, sourceX, sourceY, targetX, targetY,
  sourcePosition, targetPosition, data, selected, style,
}) => {
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition,
  });

  const isHighlighted = data?._highlighted;
  const edgeColor = isHighlighted ? (data?._color || '#8B5CF6') : (selected ? '#8B5CF6' : '#475569');

  const hasRoles = (data?.requiredRoles || []).length > 0;
  const hasDocs = (data?.requiredDocuments || []).length > 0;
  const hasFields = (data?.requiredFields || []).length > 0;

  return (
    <>
      <BaseEdge
        path={edgePath}
        style={{
          ...style,
          stroke: edgeColor,
          strokeWidth: isHighlighted ? 3 : selected ? 2.5 : 1.5,
        }}
      />
      {(data?.label || hasRoles || hasDocs || hasFields) && (
        <EdgeLabelRenderer>
          <div
            className={`absolute pointer-events-auto cursor-pointer rounded transition-all ${
              isHighlighted
                ? 'bg-synthia-500 text-white shadow-lg px-2 py-1'
                : selected
                  ? 'bg-synthia-500/20 text-synthia-300 border border-synthia-500/50 px-2 py-1'
                  : 'bg-slate-800 text-slate-300 border border-slate-600 hover:border-synthia-500/50 px-2 py-1'
            }`}
            style={{
              transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
            }}
          >
            {data?.label && (
              <span className="text-[10px] font-medium">{data.label}</span>
            )}
            {(hasRoles || hasDocs || hasFields) && (
              <div className="flex items-center gap-1.5 mt-0.5">
                {hasRoles && (
                  <span className="text-[8px] px-1 py-px rounded bg-blue-500/20 text-blue-300" title={`Roles: ${data.requiredRoles.join(', ')}`}>
                    👤{data.requiredRoles.length}
                  </span>
                )}
                {hasDocs && (
                  <span className="text-[8px] px-1 py-px rounded bg-amber-500/20 text-amber-300" title={`Docs: ${data.requiredDocuments.map(d=>d.name).join(', ')}`}>
                    📎{data.requiredDocuments.length}
                  </span>
                )}
                {hasFields && (
                  <span className="text-[8px] px-1 py-px rounded bg-emerald-500/20 text-emerald-300">
                    ✏️{data.requiredFields.length}
                  </span>
                )}
              </div>
            )}
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
});

ActionEdge.displayName = 'ActionEdge';
export default ActionEdge;
