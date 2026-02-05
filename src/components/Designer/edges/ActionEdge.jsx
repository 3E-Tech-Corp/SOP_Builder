import React, { memo } from 'react';
import { BaseEdge, EdgeLabelRenderer, getBezierPath } from '@xyflow/react';

const ActionEdge = memo(({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
  selected,
  style,
}) => {
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
  });

  const isHighlighted = data?._highlighted;
  const edgeColor = isHighlighted ? (data?._color || '#8B5CF6') : (selected ? '#8B5CF6' : '#475569');

  return (
    <>
      <BaseEdge
        path={edgePath}
        style={{
          ...style,
          stroke: edgeColor,
          strokeWidth: isHighlighted ? 3 : selected ? 2.5 : 1.5,
          strokeDasharray: isHighlighted ? 'none' : 'none',
        }}
        markerEnd={`url(#arrow-${isHighlighted ? 'highlighted' : selected ? 'selected' : 'default'})`}
      />
      {data?.label && (
        <EdgeLabelRenderer>
          <div
            className={`absolute pointer-events-auto cursor-pointer px-2 py-0.5 rounded text-[10px] font-medium transition-all ${
              isHighlighted
                ? 'bg-synthia-500 text-white shadow-lg'
                : selected
                  ? 'bg-synthia-500/20 text-synthia-300 border border-synthia-500/50'
                  : 'bg-slate-800 text-slate-300 border border-slate-600 hover:border-synthia-500/50'
            }`}
            style={{
              transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
            }}
          >
            {data.label}
            {data.requiredFields?.length > 0 && (
              <span className="ml-1 text-amber-400">•</span>
            )}
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
});

ActionEdge.displayName = 'ActionEdge';
export default ActionEdge;
