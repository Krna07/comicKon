import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'https://comickon.onrender.com/api',
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' }
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('dhuaa_admin_token');
  if (token) config.headers['Authorization'] = `Bearer ${token}`;
  return config;
});

// ── Public ─────────────────────────────────────────────────────
export const fetchEpisodes    = ()   => api.get('/comic/episodes');
export const fetchEpisodeById = (id) => api.get(`/comic/${id}`);
export const fetchComic       = ()   => api.get('/comic');  // legacy

export const startSession    = (sessionId, readerName) =>
  api.post('/sessions/start', { sessionId, readerName });
export const updateProgress  = (sessionId, pageNumber, timeSpentSeconds, totalPages) =>
  api.put('/sessions/progress', { sessionId, pageNumber, timeSpentSeconds, totalPages });
export const submitRating    = (sessionId, rating, readerName) =>
  api.put('/sessions/rate', { sessionId, rating, readerName });
export const fetchAnalytics  = () => api.get('/analytics/summary');
export const fetchRatings    = () => api.get('/analytics/ratings');

// ── Admin ──────────────────────────────────────────────────────
export const adminLogin   = (username, password) => api.post('/admin/login', { username, password });

// Episode CRUD
export const adminGetEpisodes    = ()          => api.get('/admin/episodes');
export const adminCreateEpisode  = (data)      => api.post('/admin/episodes', data);
export const adminGetEpisode     = (id)        => api.get(`/admin/episodes/${id}`);
export const adminUpdateEpisodeMeta = (id, data) => api.put(`/admin/episodes/${id}/meta`, data);
export const adminPublishEpisode = (id, pub)   => api.put(`/admin/episodes/${id}/publish`, { published: pub });
export const adminDeleteEpisode  = (id)        => api.delete(`/admin/episodes/${id}`);

// Panel CRUD (episode-scoped)
export const adminAddPanel    = (episodeId, formData) =>
  api.post(`/admin/episodes/${episodeId}/panels`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
export const adminUpdatePanel = (episodeId, panelNumber, formData) =>
  api.put(`/admin/episodes/${episodeId}/panels/${panelNumber}`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
export const adminDeletePanel = (episodeId, panelNumber) =>
  api.delete(`/admin/episodes/${episodeId}/panels/${panelNumber}`);
export const adminReorderPanels = (episodeId, pages) =>
  api.put(`/admin/episodes/${episodeId}/panels/reorder`, { pages });

// Novel content (text + optional cover image)
export const adminUpdateNovelContent = (episodeId, formData) =>
  api.put(`/admin/episodes/${episodeId}/novel`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });

export default api;
