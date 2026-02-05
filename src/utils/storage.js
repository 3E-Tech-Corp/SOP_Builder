const SOPS_KEY = 'sop-designer-sops';
const TESTS_KEY = 'sop-designer-tests';

export function loadSOPs() {
  try {
    const data = localStorage.getItem(SOPS_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export function saveSOPs(sops) {
  localStorage.setItem(SOPS_KEY, JSON.stringify(sops));
}

export function loadSOP(id) {
  const sops = loadSOPs();
  return sops.find(s => s.id === id) || null;
}

export function saveSOP(sop) {
  const sops = loadSOPs();
  const idx = sops.findIndex(s => s.id === sop.id);
  if (idx >= 0) {
    sops[idx] = { ...sop, updatedAt: new Date().toISOString() };
  } else {
    sops.push({ ...sop, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
  }
  saveSOPs(sops);
}

export function deleteSOP(id) {
  const sops = loadSOPs().filter(s => s.id !== id);
  saveSOPs(sops);
  const tests = loadTests().filter(t => t.sopId !== id);
  saveTests(tests);
}

export function duplicateSOP(id) {
  const sop = loadSOP(id);
  if (!sop) return null;
  const newId = crypto.randomUUID();
  const copy = {
    ...sop,
    id: newId,
    name: `${sop.name} (Copy)`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  const sops = loadSOPs();
  sops.push(copy);
  saveSOPs(sops);
  return copy;
}

export function loadTests() {
  try {
    const data = localStorage.getItem(TESTS_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export function saveTests(tests) {
  localStorage.setItem(TESTS_KEY, JSON.stringify(tests));
}

export function loadTestsForSOP(sopId) {
  return loadTests().filter(t => t.sopId === sopId);
}

export function saveTest(test) {
  const tests = loadTests();
  const idx = tests.findIndex(t => t.id === test.id);
  if (idx >= 0) {
    tests[idx] = test;
  } else {
    tests.push(test);
  }
  saveTests(tests);
}

export function exportSOP(sop) {
  const blob = new Blob([JSON.stringify(sop, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${sop.name.replace(/[^a-z0-9]/gi, '_')}.sop.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export function importSOP(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const sop = JSON.parse(e.target.result);
        sop.id = crypto.randomUUID();
        sop.name = `${sop.name} (Imported)`;
        sop.createdAt = new Date().toISOString();
        sop.updatedAt = new Date().toISOString();
        saveSOP(sop);
        resolve(sop);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = reject;
    reader.readAsText(file);
  });
}

// ── Available roles (shared constant) ──
export const AVAILABLE_ROLES = [
  'Admin', 'Manager', 'Supervisor', 'Approver',
  'Operator', 'Viewer', 'Finance', 'HR',
  'Procurement', 'Legal', 'Auditor', 'Owner',
];

// ── Property types ──
export const PROPERTY_TYPES = [
  'text', 'number', 'date', 'boolean', 'email', 'phone', 'currency', 'url', 'select',
];

// ── Document types ──
export const DOCUMENT_TYPES = [
  'PDF', 'Image', 'Spreadsheet', 'Document', 'Contract', 'Invoice', 'Receipt', 'Certificate', 'Other',
];

export function initSampleData() {
  const sops = loadSOPs();
  if (sops.length > 0) return;

  const sampleSOP = {
    id: 'sample-po-approval',
    name: 'Purchase Order Approval',
    description: 'Standard purchase order workflow with approval routing based on amount thresholds.',
    version: '1.0',
    objectSchema: {
      properties: [
        { name: 'PO Number', type: 'text', defaultValue: '', description: 'Unique purchase order identifier' },
        { name: 'Vendor', type: 'text', defaultValue: '', description: 'Vendor / supplier name' },
        { name: 'Amount', type: 'currency', defaultValue: '', description: 'Total PO amount' },
        { name: 'Department', type: 'text', defaultValue: '', description: 'Requesting department' },
        { name: 'Justification', type: 'text', defaultValue: '', description: 'Business justification' },
        { name: 'Priority', type: 'select', defaultValue: 'Normal', description: 'Urgency level' },
        { name: 'Delivery Date', type: 'date', defaultValue: '', description: 'Expected delivery date' },
      ],
    },
    nodes: [
      {
        id: 'start-1', type: 'start', position: { x: 400, y: 0 },
        data: {
          label: 'Start', description: 'PO process initiated', color: '#22c55e',
          requiredProperties: [], subSopId: null,
        },
      },
      {
        id: 'status-draft', type: 'status', position: { x: 400, y: 120 },
        data: {
          label: 'Draft', description: 'PO is being drafted', color: '#3b82f6', slaHours: 24,
          requiredProperties: [
            { name: 'PO Number', type: 'text', required: true },
            { name: 'Vendor', type: 'text', required: true },
            { name: 'Amount', type: 'currency', required: true },
          ],
          subSopId: null,
          notifications: {},
        },
      },
      {
        id: 'status-review', type: 'status', position: { x: 400, y: 240 },
        data: {
          label: 'Review', description: 'PO under initial review', color: '#6366f1', slaHours: 8,
          requiredProperties: [
            { name: 'Justification', type: 'text', required: true },
            { name: 'Department', type: 'text', required: true },
          ],
          subSopId: null,
          notifications: {
            onEnter: {
              enabled: true, channels: ['email'],
              template: '{objectName} (PO #{objectId}) is ready for review.',
              recipient: 'assignee',
            },
          },
        },
      },
      {
        id: 'decision-amount', type: 'decision', position: { x: 400, y: 380 },
        data: {
          label: 'Amount > $1000?', description: 'Route based on PO amount', color: '#f59e0b',
          requiredProperties: [], subSopId: null,
        },
      },
      {
        id: 'status-mgr-approval', type: 'status', position: { x: 200, y: 520 },
        data: {
          label: 'Manager Approval', description: 'Awaiting manager sign-off', color: '#8b5cf6', slaHours: 48,
          requiredProperties: [],
          subSopId: null,
          notifications: {
            onEnter: {
              enabled: true, channels: ['email', 'sms'],
              template: 'PO {objectName} (${Amount}) requires your approval. Action needed.',
              recipient: 'admin',
            },
          },
        },
      },
      {
        id: 'decision-approved', type: 'decision', position: { x: 200, y: 660 },
        data: {
          label: 'Approved?', description: 'Manager decision', color: '#f59e0b',
          requiredProperties: [], subSopId: null,
        },
      },
      {
        id: 'status-auto-approve', type: 'status', position: { x: 600, y: 520 },
        data: {
          label: 'Auto-Approved', description: 'Automatically approved (under threshold)', color: '#06b6d4', slaHours: 1,
          requiredProperties: [],
          subSopId: null,
        },
      },
      {
        id: 'status-procurement', type: 'status', position: { x: 400, y: 800 },
        data: {
          label: 'Procurement', description: 'Order placed with vendor', color: '#8b5cf6', slaHours: 72,
          requiredProperties: [
            { name: 'Delivery Date', type: 'date', required: true },
          ],
          subSopId: null,
          notifications: {
            onEnter: {
              enabled: true, channels: ['email'],
              template: 'PO {objectName} approved — proceeding to procurement.',
              recipient: 'owner',
            },
          },
        },
      },
      {
        id: 'status-delivery', type: 'status', position: { x: 400, y: 920 },
        data: {
          label: 'Delivery', description: 'Awaiting delivery', color: '#0ea5e9', slaHours: 168,
          requiredProperties: [], subSopId: null,
        },
      },
      {
        id: 'end-completed', type: 'end', position: { x: 400, y: 1040 },
        data: { label: 'Completed', description: 'PO fulfilled', color: '#22c55e', requiredProperties: [], subSopId: null },
      },
      {
        id: 'end-rejected', type: 'end', position: { x: 50, y: 800 },
        data: { label: 'Rejected', description: 'PO was rejected', color: '#ef4444', requiredProperties: [], subSopId: null },
      },
    ],
    edges: [
      {
        id: 'e-start-draft', source: 'start-1', target: 'status-draft',
        data: {
          label: 'Create PO', description: 'Initialize purchase order',
          requiredRoles: ['Operator', 'Procurement'],
          requiredDocuments: [],
          requiredFields: [{ name: 'PO Number', type: 'text' }, { name: 'Vendor', type: 'text' }, { name: 'Amount', type: 'currency' }],
          notifications: {},
        },
      },
      {
        id: 'e-draft-review', source: 'status-draft', target: 'status-review',
        data: {
          label: 'Submit for Review', description: 'Submit PO for review',
          requiredRoles: ['Operator', 'Procurement'],
          requiredDocuments: [{ name: 'Quote', type: 'PDF', description: 'Vendor quote or estimate' }],
          requiredFields: [{ name: 'Justification', type: 'text' }],
          notifications: {},
        },
      },
      {
        id: 'e-review-decision', source: 'status-review', target: 'decision-amount',
        data: {
          label: 'Evaluate', description: 'Check PO amount for routing',
          requiredRoles: ['Supervisor', 'Manager'],
          requiredDocuments: [],
          requiredFields: [],
          notifications: {},
        },
      },
      {
        id: 'e-over1k', source: 'decision-amount', target: 'status-mgr-approval',
        data: {
          label: 'Yes (>$1000)', description: 'Route to manager approval',
          requiredRoles: [], requiredDocuments: [], requiredFields: [],
          notifications: {},
        },
      },
      {
        id: 'e-under1k', source: 'decision-amount', target: 'status-auto-approve',
        data: {
          label: 'No (≤$1000)', description: 'Auto-approved under threshold',
          requiredRoles: [], requiredDocuments: [], requiredFields: [],
          notifications: {},
        },
      },
      {
        id: 'e-mgr-decide', source: 'status-mgr-approval', target: 'decision-approved',
        data: {
          label: 'Review', description: 'Manager reviews PO',
          requiredRoles: ['Manager', 'Admin'],
          requiredDocuments: [],
          requiredFields: [],
          notifications: {},
        },
      },
      {
        id: 'e-approved', source: 'decision-approved', target: 'status-procurement',
        data: {
          label: 'Approve', description: 'Manager approves the PO',
          requiredRoles: ['Manager', 'Admin'],
          requiredDocuments: [{ name: 'Signed Approval Form', type: 'PDF', description: 'Manager-signed approval document' }],
          requiredFields: [{ name: 'Approval Notes', type: 'text' }],
          notifications: {
            onTrigger: {
              enabled: true, channels: ['email'],
              template: 'PO {objectName} has been APPROVED by {actor}.',
              recipient: 'owner',
            },
          },
        },
      },
      {
        id: 'e-rejected', source: 'decision-approved', target: 'end-rejected',
        data: {
          label: 'Reject', description: 'Manager rejects the PO',
          requiredRoles: ['Manager', 'Admin'],
          requiredDocuments: [],
          requiredFields: [{ name: 'Rejection Reason', type: 'text' }],
          notifications: {
            onTrigger: {
              enabled: true, channels: ['email', 'sms'],
              template: 'PO {objectName} has been REJECTED by {actor}. Reason: see notes.',
              recipient: 'owner',
            },
          },
        },
      },
      {
        id: 'e-auto-procurement', source: 'status-auto-approve', target: 'status-procurement',
        data: {
          label: 'Process', description: 'Send to procurement',
          requiredRoles: [], requiredDocuments: [], requiredFields: [],
          notifications: {},
        },
      },
      {
        id: 'e-procurement-delivery', source: 'status-procurement', target: 'status-delivery',
        data: {
          label: 'Order Placed', description: 'Vendor order confirmed',
          requiredRoles: ['Procurement'],
          requiredDocuments: [{ name: 'Purchase Order Confirmation', type: 'Document', description: 'Vendor confirmation of order' }],
          requiredFields: [{ name: 'Order Reference', type: 'text' }],
          notifications: {},
        },
      },
      {
        id: 'e-delivery-complete', source: 'status-delivery', target: 'end-completed',
        data: {
          label: 'Received', description: 'Goods received and verified',
          requiredRoles: ['Operator', 'Procurement'],
          requiredDocuments: [{ name: 'Delivery Receipt', type: 'Receipt', description: 'Signed delivery receipt' }],
          requiredFields: [{ name: 'Received By', type: 'text' }, { name: 'Condition', type: 'text' }],
          notifications: {
            onTrigger: {
              enabled: true, channels: ['email'],
              template: 'PO {objectName} delivery received by {actor}. Status: Complete.',
              recipient: 'owner',
            },
          },
        },
      },
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  saveSOPs([sampleSOP]);
}
