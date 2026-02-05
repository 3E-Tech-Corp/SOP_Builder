import axios from 'axios';

// Determine API base URL
const API_BASE = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
});

// ── Token management ──

const TOKEN_KEY = 'sop-auth-token';
const USER_KEY = 'sop-auth-user';

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setAuth(token, user) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function getUser() {
  try {
    const data = localStorage.getItem(USER_KEY);
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
}

export function clearAuth() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

export function isAuthenticated() {
  return !!getToken();
}

// ── Request interceptor: attach JWT ──

api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ── Response interceptor: handle 401 ──

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      clearAuth();
      // Redirect to login unless already there
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// ── Auth API ──

export async function login(email, password) {
  const { data } = await api.post('/auth/login', { email, password });
  setAuth(data.token, data.user);
  return data;
}

export async function register(email, password, name) {
  const { data } = await api.post('/auth/register', { email, password, name });
  setAuth(data.token, data.user);
  return data;
}

export async function getMe() {
  const { data } = await api.get('/auth/me');
  return data;
}

// ── API Keys ──

export async function createApiKey(name, scopes) {
  const { data } = await api.post('/auth/api-keys', { name, scopes });
  return data;
}

export async function getApiKeys() {
  const { data } = await api.get('/auth/api-keys');
  return data;
}

export async function revokeApiKey(id) {
  await api.delete(`/auth/api-keys/${id}`);
}

// ── SOPs ──

export async function fetchSOPs(status, page = 1, pageSize = 50) {
  const params = { page, pageSize };
  if (status) params.status = status;
  const { data } = await api.get('/sop', { params });
  return data;
}

export async function fetchSOP(id) {
  const { data } = await api.get(`/sop/${id}`);
  return data;
}

export async function createSOP(name, description, definition) {
  const { data } = await api.post('/sop', { name, description, definition });
  return data;
}

export async function updateSOP(id, payload) {
  const { data } = await api.put(`/sop/${id}`, payload);
  return data;
}

export async function deleteSOP(id) {
  await api.delete(`/sop/${id}`);
}

export async function publishSOP(id) {
  const { data } = await api.post(`/sop/${id}/publish`);
  return data;
}

export async function duplicateSOP(id) {
  const { data } = await api.post(`/sop/${id}/duplicate`);
  return data;
}

// ── Objects ──

export async function createObject(sopId, name, externalId, type, properties) {
  const { data } = await api.post(`/sop/${sopId}/objects`, { name, externalId, type, properties });
  return data;
}

export async function fetchObjects(sopId, status, isComplete, page = 1, pageSize = 50) {
  const params = { page, pageSize };
  if (status) params.status = status;
  if (isComplete !== undefined) params.isComplete = isComplete;
  const { data } = await api.get(`/sop/${sopId}/objects`, { params });
  return data;
}

export async function fetchObject(sopId, id) {
  const { data } = await api.get(`/sop/${sopId}/objects/${id}`);
  return data;
}

export async function executeAction(sopId, objectId, edgeId, payload) {
  const { data } = await api.post(`/sop/${sopId}/objects/${objectId}/actions/${edgeId}`, payload);
  return data;
}

export async function fetchObjectAudit(sopId, objectId, page = 1, pageSize = 100) {
  const { data } = await api.get(`/sop/${sopId}/objects/${objectId}/audit`, { params: { page, pageSize } });
  return data;
}

// ── Audit ──

export async function searchAudit(params) {
  const { data } = await api.get('/audit', { params });
  return data;
}

export async function exportAuditCsv(params) {
  const { data } = await api.get('/audit/export', { params, responseType: 'blob' });
  return data;
}

// ── Export / Import (client-side only, keeps parity with old storage.js) ──

export function exportSopJson(sop) {
  const exportData = {
    name: sop.name,
    description: sop.description,
    definition: sop.definition,
  };
  const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${sop.name.replace(/[^a-z0-9]/gi, '_')}.sop.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export async function importSopJson(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const imported = JSON.parse(e.target.result);
        const sop = await createSOP(
          `${imported.name || 'Imported'} (Imported)`,
          imported.description || '',
          imported.definition || imported
        );
        resolve(sop);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = reject;
    reader.readAsText(file);
  });
}

// ── List Codes ──

export async function fetchListCodes() {
  const { data } = await api.get('/listcode');
  return data;
}

export async function fetchListCode(id) {
  const { data } = await api.get(`/listcode/${id}`);
  return data;
}

export async function createListCode(name, description, items) {
  const { data } = await api.post('/listcode', { name, description, items });
  return data;
}

export async function updateListCode(id, payload) {
  const { data } = await api.put(`/listcode/${id}`, payload);
  return data;
}

export async function deleteListCode(id) {
  await api.delete(`/listcode/${id}`);
}

export async function addListCodeItem(listCodeId, item) {
  const { data } = await api.post(`/listcode/${listCodeId}/items`, item);
  return data;
}

export async function updateListCodeItem(itemId, item) {
  const { data } = await api.put(`/listcode/items/${itemId}`, item);
  return data;
}

export async function deleteListCodeItem(itemId) {
  await api.delete(`/listcode/items/${itemId}`);
}

export async function fetchListCodeItemsByName(name) {
  const { data } = await api.get(`/listcode/by-name/${encodeURIComponent(name)}/items`);
  return data;
}

// ── Document Types ──

export async function fetchDocumentTypes(isActive) {
  const params = {};
  if (isActive !== undefined) params.isActive = isActive;
  const { data } = await api.get('/documenttype', { params });
  return data;
}

export async function createDocumentType(name, description) {
  const { data } = await api.post('/documenttype', { name, description });
  return data;
}

export async function updateDocumentType(id, payload) {
  const { data } = await api.put(`/documenttype/${id}`, payload);
  return data;
}

export async function deleteDocumentType(id) {
  await api.delete(`/documenttype/${id}`);
}

// ── Events & Notification Rules ──

export async function fetchEventTypes() {
  const { data } = await api.get('/event/types');
  return data;
}

export async function createEventType(code, name, description) {
  const { data } = await api.post('/event/types', { code, name, description });
  return data;
}

export async function updateEventType(id, payload) {
  const { data } = await api.put(`/event/types/${id}`, payload);
  return data;
}

export async function deleteEventType(id) {
  await api.delete(`/event/types/${id}`);
}

export async function fetchNotificationRules(eventTypeCode) {
  const params = {};
  if (eventTypeCode) params.eventTypeCode = eventTypeCode;
  const { data } = await api.get('/event/rules', { params });
  return data;
}

export async function createNotificationRule(rule) {
  const { data } = await api.post('/event/rules', rule);
  return data;
}

export async function updateNotificationRule(id, payload) {
  const { data } = await api.put(`/event/rules/${id}`, payload);
  return data;
}

export async function deleteNotificationRule(id) {
  await api.delete(`/event/rules/${id}`);
}

// ── Constants (shared with storage.js) ──

export const AVAILABLE_ROLES = [
  'Admin', 'Manager', 'Supervisor', 'Approver',
  'Operator', 'Viewer', 'Finance', 'HR',
  'Procurement', 'Legal', 'Auditor', 'Owner',
];

export const PROPERTY_TYPES = [
  'text', 'number', 'date', 'boolean', 'email', 'phone', 'currency', 'url', 'select',
];

export const DOCUMENT_TYPES = [
  'PDF', 'Image', 'Spreadsheet', 'Document', 'Contract', 'Invoice', 'Receipt', 'Certificate', 'Other',
];

export default api;
