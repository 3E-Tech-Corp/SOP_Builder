import React, { useMemo } from 'react';
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  ReactFlowProvider,
  MarkerType,
} from '@xyflow/react';
import StartNode from '../Designer/nodes/StartNode';
import StatusNode from '../Designer/nodes/StatusNode';
import DecisionNode from '../Designer/nodes/DecisionNode';
import EndNode from '../Designer/nodes/EndNode';
import ActionEdge from '../Designer/edges/ActionEdge';

const nodeTypes = {
  start: StartNode,
  status: StatusNode,
  decision: DecisionNode,
  end: EndNode,
};

const edgeTypes = {
  action: ActionEdge,
};

function TrackerInner({ sop, testObjects, activeObjectId }) {
  const activeObject = testObjects.find(o => o.id === activeObjectId);

  // Build enhanced nodes showing active status
  const nodes = useMemo(() => {
    return (sop.nodes || []).map(node => {
      const isActive = activeObject && activeObject.currentNodeId === node.id;
      const hasOtherObjects = testObjects.some(o => o.id !== activeObjectId && o.currentNodeId === node.id && !o.isComplete);

      return {
        ...node,
        data: {
          ...node.data,
          _active: isActive,
          _hasOthers: hasOtherObjects,
        },
      };
    });
  }, [sop.nodes, activeObject, testObjects, activeObjectId]);

  // Build enhanced edges showing path taken
  const edges = useMemo(() => {
    const pathEdgeIds = new Set();
    if (activeObject) {
      for (const step of activeObject.path || []) {
        if (step.edgeId) pathEdgeIds.add(step.edgeId);
      }
    }

    return (sop.edges || []).map(edge => ({
      ...edge,
      type: 'action',
      markerEnd: {
        type: MarkerType.ArrowClosed,
        width: 16,
        height: 16,
        color: pathEdgeIds.has(edge.id) ? (activeObject?.color || '#8B5CF6') : '#475569',
      },
      data: {
        ...edge.data,
        _highlighted: pathEdgeIds.has(edge.id),
        _color: activeObject?.color || '#8B5CF6',
      },
    }));
  }, [sop.edges, activeObject]);

  // Show colored dots for all objects on nodes
  const objectPositions = useMemo(() => {
    const positions = {};
    for (const obj of testObjects) {
      if (!positions[obj.currentNodeId]) positions[obj.currentNodeId] = [];
      positions[obj.currentNodeId].push({ id: obj.id, name: obj.name, color: obj.color, isActive: obj.id === activeObjectId });
    }
    return positions;
  }, [testObjects, activeObjectId]);

  return (
    <div className="h-full relative">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        fitView
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable={false}
        panOnDrag
        zoomOnScroll
      >
        <Background color="#334155" gap={20} size={1} />
        <Controls showInteractive={false} />
        <MiniMap
          nodeColor={(n) => {
            if (n.data?._active) return '#fff';
            if (n.type === 'start') return '#22c55e';
            if (n.type === 'end') return '#ef4444';
            if (n.type === 'decision') return '#f59e0b';
            return n.data?.color || '#8B5CF6';
          }}
          maskColor="rgba(15, 23, 42, 0.7)"
        />
      </ReactFlow>

      {/* Legend */}
      {testObjects.length > 0 && (
        <div className="absolute bottom-4 left-4 bg-slate-800/90 border border-slate-700 rounded-lg p-2 backdrop-blur-sm">
          <p className="text-[9px] text-slate-400 font-semibold uppercase tracking-wider mb-1.5">Objects</p>
          <div className="space-y-1">
            {testObjects.filter(o => !o.isComplete).map(obj => (
              <div key={obj.id} className="flex items-center gap-1.5">
                <div
                  className={`w-2.5 h-2.5 rounded-full ${obj.id === activeObjectId ? 'ring-1 ring-white' : ''}`}
                  style={{ backgroundColor: obj.color }}
                />
                <span className={`text-[10px] ${obj.id === activeObjectId ? 'text-white font-medium' : 'text-slate-400'}`}>
                  {obj.name}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function ObjectTracker(props) {
  return (
    <ReactFlowProvider>
      <TrackerInner {...props} />
    </ReactFlowProvider>
  );
}
