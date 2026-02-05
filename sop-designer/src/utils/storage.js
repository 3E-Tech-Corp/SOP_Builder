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
  // Also clean up tests
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

export function initSampleData() {
  const sops = loadSOPs();
  if (sops.length > 0) return; // Already initialized

  const sampleSOP = {
    id: 'sample-po-approval',
    name: 'Purchase Order Approval',
    description: 'Standard purchase order workflow with approval routing based on amount thresholds.',
    nodes: [
      { id: 'start-1', type: 'start', position: { x: 400, y: 0 }, data: { label: 'Start', description: 'PO process begins', color: '#22c55e' } },
      { id: 'status-draft', type: 'status', position: { x: 400, y: 120 }, data: { label: 'Draft', description: 'PO is being drafted', color: '#3b82f6', slaHours: 24 } },
      { id: 'status-review', type: 'status', position: { x: 400, y: 240 }, data: { label: 'Review', description: 'PO under review', color: '#6366f1', slaHours: 8, notifications: { onEnter: { enabled: true, channels: ['email'], template: 'PO {objectName} is ready for review. Please check the details.', recipient: 'assignee' } } } },
      { id: 'decision-amount', type: 'decision', position: { x: 400, y: 380 }, data: { label: 'Amount > $1000?', description: 'Route based on PO amount', color: '#f59e0b' } },
      { id: 'status-mgr-approval', type: 'status', position: { x: 200, y: 520 }, data: { label: 'Manager Approval', description: 'Awaiting manager sign-off', color: '#8b5cf6', slaHours: 48, notifications: { onEnter: { enabled: true, channels: ['email', 'sms'], template: 'PO {objectName} requires your approval (>${"$"}1000). Action: {action}', recipient: 'admin' } } } },
      { id: 'decision-approved', type: 'decision', position: { x: 200, y: 660 }, data: { label: 'Approved?', description: 'Manager decision', color: '#f59e0b' } },
      { id: 'status-auto-approve', type: 'status', position: { x: 600, y: 520 }, data: { label: 'Auto-Approve', description: 'Automatically approved (under threshold)', color: '#06b6d4', slaHours: 1 } },
      { id: 'status-procurement', type: 'status', position: { x: 400, y: 800 }, data: { label: 'Procurement', description: 'Order placed with vendor', color: '#8b5cf6', slaHours: 72, notifications: { onEnter: { enabled: true, channels: ['email'], template: 'PO {objectName} approved and sent to procurement.', recipient: 'owner' } } } },
      { id: 'status-delivery', type: 'status', position: { x: 400, y: 920 }, data: { label: 'Delivery', description: 'Awaiting delivery', color: '#0ea5e9', slaHours: 168 } },
      { id: 'end-completed', type: 'end', position: { x: 400, y: 1040 }, data: { label: 'Completed', description: 'PO fulfilled', color: '#ef4444' } },
      { id: 'end-rejected', type: 'end', position: { x: 50, y: 800 }, data: { label: 'Rejected', description: 'PO was rejected', color: '#dc2626' } },
    ],
    edges: [
      { id: 'e-start-draft', source: 'start-1', target: 'status-draft', data: { label: 'Create PO', description: 'Initialize purchase order', requiredFields: ['PO Number', 'Vendor', 'Amount'] } },
      { id: 'e-draft-review', source: 'status-draft', target: 'status-review', data: { label: 'Submit', description: 'Submit for review', requiredFields: ['Justification'] } },
      { id: 'e-review-decision', source: 'status-review', target: 'decision-amount', data: { label: 'Evaluate', description: 'Check PO amount' } },
      { id: 'e-over1k', source: 'decision-amount', target: 'status-mgr-approval', data: { label: 'Yes (>$1000)', description: 'Requires manager approval' } },
      { id: 'e-under1k', source: 'decision-amount', target: 'status-auto-approve', data: { label: 'No (≤$1000)', description: 'Auto-approved' } },
      { id: 'e-mgr-decide', source: 'status-mgr-approval', target: 'decision-approved', data: { label: 'Review', description: 'Manager reviews' } },
      { id: 'e-approved', source: 'decision-approved', target: 'status-procurement', data: { label: 'Approve', description: 'Manager approves', requiredFields: ['Approval Notes'] } },
      { id: 'e-rejected', source: 'decision-approved', target: 'end-rejected', data: { label: 'Reject', description: 'Manager rejects', requiredFields: ['Rejection Reason'] } },
      { id: 'e-auto-procurement', source: 'status-auto-approve', target: 'status-procurement', data: { label: 'Process', description: 'Send to procurement' } },
      { id: 'e-procurement-delivery', source: 'status-procurement', target: 'status-delivery', data: { label: 'Order Placed', description: 'Vendor order confirmed', requiredFields: ['Order Reference'] } },
      { id: 'e-delivery-complete', source: 'status-delivery', target: 'end-completed', data: { label: 'Received', description: 'Goods received', requiredFields: ['Received By', 'Condition'] } },
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  saveSOPs([sampleSOP]);
}
