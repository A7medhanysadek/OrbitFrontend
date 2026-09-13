import { apiClient } from './client.js';
export const dashboardApi = {
  getSummary: () => apiClient('/api/Dashboard/summary'),
  getLiveManager: () => apiClient('/api/Dashboard/live-manager'),
  updateStreamMeta: (data) => apiClient('/api/Dashboard/stream/current', { method: 'PATCH', body: JSON.stringify(data) }),
  endStream: () => apiClient('/api/Dashboard/stream/end', { method: 'POST' }),
  getPastStreams: (page = 1, size = 10) => apiClient(`/api/Dashboard/streams?page=${page}&pageSize=${size}`),
  deleteVod: (vodId) => apiClient(`/api/Dashboard/vods/${vodId}`, { method: 'DELETE' }),
  getModeration: () => apiClient('/api/Dashboard/moderation'),
  setEmojis: (data) => apiClient('/api/Dashboard/emojis/custom', { method: 'PUT', body: JSON.stringify(data) }),
  getEmojis: () => apiClient('/api/Dashboard/emojis/custom'),
  getBadges: () => apiClient('/api/Dashboard/emojis/badges'),
};