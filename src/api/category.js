import { apiClient } from './client.js';
export const categoryApi = {
  getAll: () => apiClient('/api/Category'),
  getTop: (count = 10) => apiClient(`/api/Category/top?count=${count}`),
  search: (q) => apiClient(`/api/Category/search?q=${encodeURIComponent(q)}`),
  getBySlug: (slug) => apiClient(`/api/Category/${slug}`),
  getStreams: (slug) => apiClient(`/api/Category/${slug}/streams`),
  getClips: (slug, count = 20) => apiClient(`/api/Category/${slug}/clips?count=${count}`),
  create: (data) => apiClient('/api/Category', { method: 'POST', body: JSON.stringify(data) }),
  update: (id, data) => apiClient(`/api/Category/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id) => apiClient(`/api/Category/${id}`, { method: 'DELETE' }),
  uploadImage: (id, file) => { const fd = new FormData(); fd.append('file', file); return apiClient(`/api/Category/${id}/image`, { method: 'POST', body: fd }); },
};