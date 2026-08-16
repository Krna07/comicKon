import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' }
});

// Attach admin token to every request if present
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('dhuaa_admin_token');
  if (token) config.headers['Authorization'] = `Bearer ${token}`;
  return config;
});

export const fetchComic = () => api.get('/comic');

export const startSession = (sessionId) =>
  api.post('/sessions/start', { sessionId });

export const updateProgress = (sessionId, pageNumber, timeSpentSeconds, totalPages) =>
  api.put('/sessions/progress', { sessionId, pageNumber, timeSpentSeconds, totalPages });

export const fetchAnalytics = () => api.get('/analytics/summary');

// ── Admin API ──────────────────────────────────────────────────
export const adminLogin = (username, password) =>
  api.post('/admin/login', { username, password });

export const adminGetComic = () =>
  api.get('/admin/comic');

export const adminUpdateMeta = (data) =>
  api.put('/admin/comic/meta', data);

export const adminAddPanel = (formData) =>
  api.post('/admin/panels', formData, { headers: { 'Content-Type': 'multipart/form-data' } });

export const adminUpdatePanel = (panelNumber, formData) =>
  api.put(`/admin/panels/${panelNumber}`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });

export const adminDeletePanel = (panelNumber) =>
  api.delete(`/admin/panels/${panelNumber}`);

export default api;
