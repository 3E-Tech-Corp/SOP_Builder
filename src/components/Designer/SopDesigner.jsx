import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ReactFlow, MiniMap, Controls, Background, addEdge,
  useNodesState, useEdgesState, ReactFlowProvider, MarkerType,
} from '@xyflow/react';
import dagre from 'dagre';
import { Save, LayoutGrid, ArrowLeft, Play, AlertTriangle, CheckCircle, Database } from 'lucide-react';
import { fetchSOP, updateSOP, PROPERTY_TYPES } from '../../utils/api';
import { validateSOP } from '../../utils/sopEngine';
import useSopStore from '../../store/sopStore';
import StartNode from './nodes/StartNode';
import StatusNode from './nodes/StatusNode';
import DecisionNode from './nodes/DecisionNode';
import EndNode from './nodes/EndNode';
import ActionEdge from './edges/ActionEdge';
import Palette from './Palette';
import PropertiesPanel from './PropertiesPanel';
import ObjectSchemaEditor from './ObjectSchemaEditor';

const nodeTypes = { start: StartNode, status: StatusNode, decision: DecisionNode, end: EndNode };
const edgeTypes = { action: ActionEdge };

const defaultEdgeOptions = {
  type: 'action',
  markerEnd: { type: MarkerType.ArrowClosed, width: 16, height: 16, color: '#475569' },
  data: { label: '', description: '', requiredRoles: [], requiredDocuments: [], requiredFields: [] },
};

const nodeDefaults = {
  start: { label: 'Start', color: '#22c55e', description: '', requiredProperties: [], subSopId: null },
  status: { label: 'New Status', color: '#8B5CF6', description: '', slaHours: null, requiredProperties: [], subSopId: null, notifications: {} },
  decision: { label: 'Decision?', color: '#f59e0b', description: '', requiredProperties: [], subSopId: null },
  end: { label: 'End', color: '#ef4444', description: '', requiredProperties: [], subSopId: null },
};

function getLayoutedElements(nodes, edges) {
  const g = new dagre.graphlib.Graph();
  g.setDefaultEdgeLabel(() => ({}));
  g.setGraph({ rankdir: 'TB', nodesep: 80, ranksep: 100 });
  nodes.forEach(node => g.setNode(node.id, { width: 180, height: 80 }));
  edges.forEach(edge => g.setEdge(edge.source, edge.target));
  dagre.layout(g);
  return {
    nodes: nodes.map(node => {
      const gNode = g.node(node.id);
      return { ...node, position: { x: gNode.x - 90, y: gNode.y - 40 } };
    }),
    edges,
  };
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
  const [showSchema, setShowSchema] = useState(false);

  const [sop, setSop] = useState(null);
  const [loading, setLoading] = useState(true);

  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [objectSchema, setObjectSchema] = useState({ properties: [] });
  const [validation, setValidation] = useState(null);

  // Load SOP from API
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await fetchSOP(id);
        if (cancelled) return;
        setSop(data);
        const def = data.definition || {};
        setNodes(def.nodes || []);
        setEdges((def.edges || []).map(e => ({ ...e, type: 'action' })));
        setObjectSchema(def.objectSchema || { properties: [] });
      } catch {
        if (!cancelled) addToast({ type: 'error', message: 'Failed to load SOP' });
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [id]);

  // Sync selection state with actual node/edge data
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-slate-400">Loading...</p>
      </div>
    );
  }

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

  const onConnect = (params) => {
    setEdges(eds => addEdge({
      ...params, type: 'action',
      data: { label: '', description: '', requiredRoles: [], requiredDocuments: [], requiredFields: [] },
      markerEnd: { type: MarkerType.ArrowClosed, width: 16, height: 16, color: '#475569' },
    }, eds));
  };

  const onDragOver = (event) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  };

  const onDrop = (event) => {
    event.preventDefault();
    const type = event.dataTransfer.getData('application/reactflow');
    if (!type || !reactFlowInstance) return;
    if (type === 'start' && nodes.some(n => n.type === 'start')) {
      addToast({ type: 'error', message: 'Only one Start node allowed per SOP' });
      return;
    }
    const position = reactFlowInstance.screenToFlowPosition({ x: event.clientX, y: event.clientY });
    setNodes(nds => [...nds, {
      id: `${type}-${crypto.randomUUID().slice(0, 8)}`,
      type,
      position,
      data: { ...nodeDefaults[type] },
    }]);
  };

  const onNodeClick = (_, node) => setSelectedNode(node);
  const onEdgeClick = (_, edge) => setSelectedEdge(edge);
  const onPaneClick = () => clearSelection();

  const handleSave = async () => {
    const definition = {
      objectSchema,
      nodes: nodes.map(n => ({ id: n.id, type: n.type, position: n.position, data: n.data })),
      edges: edges.map(e => ({ id: e.id, source: e.source, target: e.target, sourceHandle: e.sourceHandle, targetHandle: e.targetHandle, data: e.data })),
    };
    try {
      await updateSOP(sop.id, { name: sop.name, description: sop.description, definition });
      addToast({ type: 'success', message: `Saved "${sop.name}"` });
    } catch (err) {
      addToast({ type: 'error', message: err.response?.data?.error || 'Failed to save' });
    }
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
    if (result.valid) addToast({ type: 'success', message: 'SOP is valid ✓' });
    else addToast({ type: 'error', message: `${result.errors.length} validation issue(s) found` });
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
            <button onClick={() => navigate('/')} className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-200 transition-colors">
              <ArrowLeft className="w-3.5 h-3.5" /> Back
            </button>
            <div className="h-4 w-px bg-slate-700" />
            <h2 className="text-sm font-medium text-white truncate max-w-[200px]">{sop.name}</h2>
          </div>

          <div className="flex items-center gap-1.5">
            <button onClick={() => setShowSchema(!showSchema)}
              className={`flex items-center gap-1 px-2.5 py-1.5 text-xs rounded-md transition-colors ${
                showSchema
                  ? 'text-synthia-300 bg-synthia-500/20 border border-synthia-500/40'
                  : 'text-slate-300 hover:text-white bg-slate-700 hover:bg-slate-600'
              }`}
              title="Object Schema">
              <Database className="w-3.5 h-3.5" />
              Schema
              {(objectSchema?.properties || []).length > 0 && (
                <span className="text-[9px] bg-synthia-500/30 px-1 rounded-full ml-0.5">
                  {objectSchema.properties.length}
                </span>
              )}
            </button>
            <button onClick={handleValidate}
              className="flex items-center gap-1 px-2.5 py-1.5 text-xs text-slate-300 hover:text-white bg-slate-700 hover:bg-slate-600 rounded-md transition-colors">
              <CheckCircle className="w-3.5 h-3.5" /> Validate
            </button>
            <button onClick={handleAutoLayout}
              className="flex items-center gap-1 px-2.5 py-1.5 text-xs text-slate-300 hover:text-white bg-slate-700 hover:bg-slate-600 rounded-md transition-colors">
              <LayoutGrid className="w-3.5 h-3.5" /> Layout
            </button>
            <button onClick={handleSave}
              className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-white bg-synthia-600 hover:bg-synthia-700 rounded-md transition-colors">
              <Save className="w-3.5 h-3.5" /> Save
            </button>
            <button onClick={() => { handleSave(); navigate(`/tester/${id}`); }}
              className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-green-400 bg-green-500/10 hover:bg-green-500/20 rounded-md transition-colors">
              <Play className="w-3.5 h-3.5" /> Test
            </button>
          </div>
        </div>

        {/* Schema Editor (collapsible) */}
        {showSchema && (
          <ObjectSchemaEditor
            schema={objectSchema}
            onChange={setObjectSchema}
            onClose={() => setShowSchema(false)}
          />
        )}

        {/* Validation Errors */}
        {validation && !validation.valid && (
          <div className="px-3 py-2 bg-red-500/10 border-b border-red-500/20">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
              <div className="text-xs text-red-300 space-y-0.5">
                {validation.errors.map((err, i) => <p key={i}>{err}</p>)}
              </div>
            </div>
          </div>
        )}

        {/* React Flow Canvas */}
        <div className="flex-1" ref={reactFlowWrapper}>
          <ReactFlow
            nodes={nodes} edges={edges}
            onNodesChange={onNodesChange} onEdgesChange={onEdgesChange}
            onConnect={onConnect} onInit={setReactFlowInstance}
            onDrop={onDrop} onDragOver={onDragOver}
            onNodeClick={onNodeClick} onEdgeClick={onEdgeClick} onPaneClick={onPaneClick}
            nodeTypes={nodeTypes} edgeTypes={edgeTypes} defaultEdgeOptions={defaultEdgeOptions}
            fitView snapToGrid snapGrid={[20, 20]}
            className="dndflow" deleteKeyCode={['Backspace', 'Delete']}
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
          </ReactFlow>
        </div>
      </div>

      {/* Right Properties Panel */}
      <PropertiesPanel
        nodes={nodes} edges={edges}
        setNodes={setNodes} setEdges={setEdges}
        objectSchema={objectSchema}
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
