import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  addEdge,
  useNodesState,
  useEdgesState,
  ReactFlowProvider,
  MarkerType,
} from '@xyflow/react';
import dagre from 'dagre';
import { Save, LayoutGrid, ArrowLeft, Play, AlertTriangle, CheckCircle } from 'lucide-react';
import { loadSOP, saveSOP } from '../../utils/storage';
import { validateSOP } from '../../utils/sopEngine';
import useSopStore from '../../store/sopStore';
import StartNode from './nodes/StartNode';
import StatusNode from './nodes/StatusNode';
import DecisionNode from './nodes/DecisionNode';
import EndNode from './nodes/EndNode';
import ActionEdge from './edges/ActionEdge';
import Palette from './Palette';
import PropertiesPanel from './PropertiesPanel';

const nodeTypes = {
  start: StartNode,
  status: StatusNode,
  decision: DecisionNode,
  end: EndNode,
};

const edgeTypes = {
  action: ActionEdge,
};

const defaultEdgeOptions = {
  type: 'action',
  markerEnd: {
    type: MarkerType.ArrowClosed,
    width: 16,
    height: 16,
    color: '#475569',
  },
  data: { label: '', description: '', requiredFields: [] },
};

const nodeDefaults = {
  start: { label: 'Start', color: '#22c55e', description: '' },
  status: { label: 'New Status', color: '#8B5CF6', description: '', slaHours: null, notifications: {} },
  decision: { label: 'Decision?', color: '#f59e0b', description: '' },
  end: { label: 'End', color: '#ef4444', description: '' },
};

function getLayoutedElements(nodes, edges) {
  const g = new dagre.graphlib.Graph();
  g.setDefaultEdgeLabel(() => ({}));
  g.setGraph({ rankdir: 'TB', nodesep: 80, ranksep: 100 });

  nodes.forEach(node => {
    g.setNode(node.id, { width: 180, height: 80 });
  });

  edges.forEach(edge => {
    g.setEdge(edge.source, edge.target);
  });

  dagre.layout(g);

  const layoutedNodes = nodes.map(node => {
    const gNode = g.node(node.id);
    return {
      ...node,
      position: {
        x: gNode.x - 90,
        y: gNode.y - 40,
      },
    };
  });

  return { nodes: layoutedNodes, edges };
}

function DesignerInner() {
  const { id } = useParams();
  const navigate = useNavigate();
  const addToast = useSopStore(s => s.addToast);
  const setSelectedNode = useSopStore(s => s.setSelectedNode);
  const setSelectedEdge = useSopStore(s => s.setSelectedEdge);
  const clearSelection = useSopStore(s => s.clearSelection);
  const reactFlowWrapper = useRef(null);
  const [reactFlowInstance, setReactFlowInstance] = useState(null);

  const sop = useMemo(() => loadSOP(id), [id]);

  const [nodes, setNodes, onNodesChange] = useNodesState(sop?.nodes || []);
  const [edges, setEdges, onEdgesChange] = useEdgesState(
    (sop?.edges || []).map(e => ({ ...e, type: 'action' }))
  );
  const [validation, setValidation] = useState(null);

  // Update selection when nodes/edges change
  const selectedNode = useSopStore(s => s.selectedNode);
  const selectedEdge = useSopStore(s => s.selectedEdge);

  useEffect(() => {
    if (selectedNode) {
      const updated = nodes.find(n => n.id === selectedNode.id);
      if (updated && JSON.stringify(updated.data) !== JSON.stringify(selectedNode.data)) {
        setSelectedNode(updated);
      }
    }
  }, [nodes]);

  useEffect(() => {
    if (selectedEdge) {
      const updated = edges.find(e => e.id === selectedEdge.id);
      if (updated && JSON.stringify(updated.data) !== JSON.stringify(selectedEdge.data)) {
        setSelectedEdge(updated);
      }
    }
  }, [edges]);

  if (!sop) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <p className="text-slate-400 mb-4">SOP not found</p>
          <Link to="/" className="text-synthia-400 hover:text-synthia-300">← Back to My SOPs</Link>
        </div>
      </div>
    );
  }

  const onConnect = useCallback((params) => {
    setEdges(eds => addEdge({
      ...params,
      type: 'action',
      data: { label: '', description: '', requiredFields: [] },
      markerEnd: { type: MarkerType.ArrowClosed, width: 16, height: 16, color: '#475569' },
    }, eds));
  }, [setEdges]);

  const onDragOver = useCallback((event) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event) => {
      event.preventDefault();
      const type = event.dataTransfer.getData('application/reactflow');
      if (!type || !reactFlowInstance) return;

      // Check for duplicate start nodes
      if (type === 'start' && nodes.some(n => n.type === 'start')) {
        addToast({ type: 'error', message: 'Only one Start node allowed per SOP' });
        return;
      }

      const position = reactFlowInstance.screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      const newNode = {
        id: `${type}-${crypto.randomUUID().slice(0, 8)}`,
        type,
        position,
        data: { ...nodeDefaults[type] },
      };

      setNodes(nds => [...nds, newNode]);
    },
    [reactFlowInstance, nodes, setNodes, addToast]
  );

  const onNodeClick = useCallback((_, node) => {
    setSelectedNode(node);
  }, [setSelectedNode]);

  const onEdgeClick = useCallback((_, edge) => {
    setSelectedEdge(edge);
  }, [setSelectedEdge]);

  const onPaneClick = useCallback(() => {
    clearSelection();
  }, [clearSelection]);

  const handleSave = () => {
    const updated = {
      ...sop,
      nodes: nodes.map(n => ({ id: n.id, type: n.type, position: n.position, data: n.data })),
      edges: edges.map(e => ({ id: e.id, source: e.source, target: e.target, sourceHandle: e.sourceHandle, targetHandle: e.targetHandle, data: e.data })),
    };
    saveSOP(updated);
    addToast({ type: 'success', message: `Saved "${sop.name}"` });
  };

  const handleAutoLayout = () => {
    const { nodes: layouted } = getLayoutedElements(nodes, edges);
    setNodes(layouted);
    addToast({ type: 'info', message: 'Auto-layout applied' });
  };

  const handleValidate = () => {
    const sopData = {
      nodes: nodes.map(n => ({ id: n.id, type: n.type, data: n.data })),
      edges: edges.map(e => ({ id: e.id, source: e.source, target: e.target, data: e.data })),
    };
    const result = validateSOP(sopData);
    setValidation(result);
    if (result.valid) {
      addToast({ type: 'success', message: 'SOP is valid ✓' });
    } else {
      addToast({ type: 'error', message: `${result.errors.length} validation issue(s) found` });
    }
  };

  return (
    <div className="flex h-full">
      {/* Left Palette */}
      <Palette />

      {/* Center Canvas */}
      <div className="flex-1 flex flex-col">
        {/* Toolbar */}
        <div className="flex items-center justify-between px-3 py-2 bg-slate-800/60 border-b border-slate-700">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/')}
              className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-200 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Back
            </button>
            <div className="h-4 w-px bg-slate-700" />
            <h2 className="text-sm font-medium text-white truncate max-w-[200px]">{sop.name}</h2>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={handleValidate}
              className="flex items-center gap-1 px-2.5 py-1.5 text-xs text-slate-300 hover:text-white bg-slate-700 hover:bg-slate-600 rounded-md transition-colors"
              title="Validate SOP"
            >
              <CheckCircle className="w-3.5 h-3.5" />
              Validate
            </button>
            <button
              onClick={handleAutoLayout}
              className="flex items-center gap-1 px-2.5 py-1.5 text-xs text-slate-300 hover:text-white bg-slate-700 hover:bg-slate-600 rounded-md transition-colors"
              title="Auto-layout"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              Layout
            </button>
            <button
              onClick={handleSave}
              className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-white bg-synthia-600 hover:bg-synthia-700 rounded-md transition-colors"
            >
              <Save className="w-3.5 h-3.5" />
              Save
            </button>
            <button
              onClick={() => { handleSave(); navigate(`/tester/${id}`); }}
              className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-green-400 bg-green-500/10 hover:bg-green-500/20 rounded-md transition-colors"
            >
              <Play className="w-3.5 h-3.5" />
              Test
            </button>
          </div>
        </div>

        {/* Validation Errors */}
        {validation && !validation.valid && (
          <div className="px-3 py-2 bg-red-500/10 border-b border-red-500/20">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
              <div className="text-xs text-red-300 space-y-0.5">
                {validation.errors.map((err, i) => (
                  <p key={i}>{err}</p>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* React Flow Canvas */}
        <div className="flex-1" ref={reactFlowWrapper}>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onInit={setReactFlowInstance}
            onDrop={onDrop}
            onDragOver={onDragOver}
            onNodeClick={onNodeClick}
            onEdgeClick={onEdgeClick}
            onPaneClick={onPaneClick}
            nodeTypes={nodeTypes}
            edgeTypes={edgeTypes}
            defaultEdgeOptions={defaultEdgeOptions}
            fitView
            snapToGrid
            snapGrid={[20, 20]}
            className="dndflow"
            deleteKeyCode={['Backspace', 'Delete']}
          >
            <Background color="#334155" gap={20} size={1} />
            <Controls />
            <MiniMap
              nodeColor={(n) => {
                if (n.type === 'start') return '#22c55e';
                if (n.type === 'end') return '#ef4444';
                if (n.type === 'decision') return '#f59e0b';
                return n.data?.color || '#8B5CF6';
              }}
              maskColor="rgba(15, 23, 42, 0.7)"
            />
            {/* Custom marker definitions */}
            <svg>
              <defs>
                <marker id="arrow-default" viewBox="0 0 10 10" refX="10" refY="5" markerWidth="8" markerHeight="8" orient="auto-start-reverse">
                  <path d="M 0 0 L 10 5 L 0 10 z" fill="#475569" />
                </marker>
                <marker id="arrow-selected" viewBox="0 0 10 10" refX="10" refY="5" markerWidth="8" markerHeight="8" orient="auto-start-reverse">
                  <path d="M 0 0 L 10 5 L 0 10 z" fill="#8B5CF6" />
                </marker>
                <marker id="arrow-highlighted" viewBox="0 0 10 10" refX="10" refY="5" markerWidth="8" markerHeight="8" orient="auto-start-reverse">
                  <path d="M 0 0 L 10 5 L 0 10 z" fill="#8B5CF6" />
                </marker>
              </defs>
            </svg>
          </ReactFlow>
        </div>
      </div>

      {/* Right Properties Panel */}
      <PropertiesPanel
        nodes={nodes}
        edges={edges}
        setNodes={setNodes}
        setEdges={setEdges}
      />
    </div>
  );
}

export default function SopDesigner() {
  return (
    <ReactFlowProvider>
      <DesignerInner />
    </ReactFlowProvider>
  );
}
