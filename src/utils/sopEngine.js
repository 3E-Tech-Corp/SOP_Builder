// SOP Engine — state machine logic for validation, transitions, and progress

export function getStartNode(sop) {
  return sop.nodes.find(n => n.type === 'start');
}

export function getEndNodes(sop) {
  return sop.nodes.filter(n => n.type === 'end');
}

export function getNodeById(sop, nodeId) {
  return sop.nodes.find(n => n.id === nodeId);
}

export function getAvailableActions(sop, currentNodeId) {
  return sop.edges
    .filter(e => e.source === currentNodeId)
    .map(edge => ({
      edgeId: edge.id,
      label: edge.data?.label || 'Continue',
      description: edge.data?.description || '',
      requiredFields: edge.data?.requiredFields || [],
      targetNodeId: edge.target,
      targetNode: sop.nodes.find(n => n.id === edge.target),
      notifications: edge.data?.notifications || {},
    }));
}

export function transition(sop, testObject, edgeId, fieldValues = {}) {
  const edge = sop.edges.find(e => e.id === edgeId);
  if (!edge) throw new Error('Invalid action');
  if (edge.source !== testObject.currentNodeId) throw new Error('Action not available from current state');

  const fromNode = getNodeById(sop, edge.source);
  const toNode = getNodeById(sop, edge.target);
  const now = new Date().toISOString();

  const auditEntry = {
    id: crypto.randomUUID(),
    timestamp: now,
    objectId: testObject.id,
    objectName: testObject.name,
    fromNodeId: fromNode.id,
    fromStatus: fromNode.data?.label || fromNode.id,
    action: edge.data?.label || 'Continue',
    toNodeId: toNode.id,
    toStatus: toNode.data?.label || toNode.id,
    fieldValues,
    notifications: [],
  };

  // Collect notifications
  const notifications = [];

  // Edge trigger notification
  if (edge.data?.notifications?.onTrigger?.enabled) {
    notifications.push({
      type: 'action',
      event: 'onTrigger',
      ...edge.data.notifications.onTrigger,
      context: { action: edge.data?.label, fromStatus: fromNode.data?.label, toStatus: toNode.data?.label },
    });
  }

  // From-node exit notification
  if (fromNode.data?.notifications?.onExit?.enabled) {
    notifications.push({
      type: 'node-exit',
      event: 'onExit',
      ...fromNode.data.notifications.onExit,
      context: { nodeLabel: fromNode.data?.label },
    });
  }

  // To-node enter notification
  if (toNode.data?.notifications?.onEnter?.enabled) {
    notifications.push({
      type: 'node-enter',
      event: 'onEnter',
      ...toNode.data.notifications.onEnter,
      context: { nodeLabel: toNode.data?.label },
    });
  }

  auditEntry.notifications = notifications;

  const updatedObject = {
    ...testObject,
    currentNodeId: toNode.id,
    path: [...(testObject.path || []), { nodeId: toNode.id, edgeId: edge.id, timestamp: now }],
    audit: [...(testObject.audit || []), auditEntry],
    isComplete: toNode.type === 'end',
  };

  return { updatedObject, auditEntry, notifications };
}

export function calculateProgress(sop, testObject) {
  if (!testObject.path || testObject.path.length === 0) {
    return { steps: 0, percentage: 0 };
  }

  // Simple heuristic: find shortest path from start to any end
  const endNodes = getEndNodes(sop);
  if (endNodes.length === 0) return { steps: testObject.path.length, percentage: 50 };

  // BFS to find shortest path length from start to any end
  const startNode = getStartNode(sop);
  if (!startNode) return { steps: testObject.path.length, percentage: 50 };

  const queue = [{ nodeId: startNode.id, depth: 0 }];
  const visited = new Set();
  let minPathLength = Infinity;

  while (queue.length > 0) {
    const { nodeId, depth } = queue.shift();
    if (visited.has(nodeId)) continue;
    visited.add(nodeId);

    const node = getNodeById(sop, nodeId);
    if (node && node.type === 'end') {
      minPathLength = Math.min(minPathLength, depth);
      continue;
    }

    const edges = sop.edges.filter(e => e.source === nodeId);
    for (const edge of edges) {
      if (!visited.has(edge.target)) {
        queue.push({ nodeId: edge.target, depth: depth + 1 });
      }
    }
  }

  if (minPathLength === Infinity) minPathLength = sop.nodes.length;

  const currentSteps = testObject.path.length;
  const percentage = Math.min(100, Math.round((currentSteps / minPathLength) * 100));

  return { steps: currentSteps, total: minPathLength, percentage };
}

export function validateSOP(sop) {
  const errors = [];

  const startNodes = sop.nodes.filter(n => n.type === 'start');
  if (startNodes.length === 0) errors.push('SOP must have at least one Start node');
  if (startNodes.length > 1) errors.push('SOP should have only one Start node');

  const endNodes = sop.nodes.filter(n => n.type === 'end');
  if (endNodes.length === 0) errors.push('SOP must have at least one End node');

  // Check for orphaned nodes (no connections)
  for (const node of sop.nodes) {
    if (node.type === 'start') {
      const outEdges = sop.edges.filter(e => e.source === node.id);
      if (outEdges.length === 0) errors.push(`Start node "${node.data?.label}" has no outgoing connections`);
    } else if (node.type === 'end') {
      const inEdges = sop.edges.filter(e => e.target === node.id);
      if (inEdges.length === 0) errors.push(`End node "${node.data?.label}" has no incoming connections`);
    } else {
      const inEdges = sop.edges.filter(e => e.target === node.id);
      const outEdges = sop.edges.filter(e => e.source === node.id);
      if (inEdges.length === 0 && outEdges.length === 0) {
        errors.push(`Node "${node.data?.label}" is not connected to anything`);
      }
    }
  }

  return { valid: errors.length === 0, errors };
}

export function createTestObject(sop, name, color) {
  const startNode = getStartNode(sop);
  if (!startNode) throw new Error('SOP has no Start node');

  return {
    id: crypto.randomUUID(),
    sopId: sop.id,
    name: name || `Object ${Date.now().toString(36).toUpperCase()}`,
    color: color || getRandomColor(),
    currentNodeId: startNode.id,
    path: [{ nodeId: startNode.id, edgeId: null, timestamp: new Date().toISOString() }],
    audit: [],
    isComplete: false,
    createdAt: new Date().toISOString(),
  };
}

function getRandomColor() {
  const colors = ['#8B5CF6', '#3b82f6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#6366f1'];
  return colors[Math.floor(Math.random() * colors.length)];
}
