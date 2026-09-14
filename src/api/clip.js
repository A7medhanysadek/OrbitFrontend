import { apiClient } from './client.js';
export const clipApi = {
  slice: (data) => apiClient('/api/Clip/slice', { method: 'POST', body: JSON.stringify(data) }),
  getChannelClips: (channelId, page = 1, size = 20) => apiClient(`/api/Clip/channel/${channelId}?page=${page}&pageSize=${size}`),
  getTop: (count = 20) => apiClient(`/api/Clip/top?count=${count}`),
  getById: (id) => apiClient(`/api/Clip/${id}`),
  recordView: (id, sessionId) => apiClient(`/api/Clip/${id}/view${sessionId ? `?sessionId=${encodeURIComponent(sessionId)}` : ''}`, { method: 'POST' }),
  delete: (id) => apiClient(`/api/Clip/${id}`, { method: 'DELETE' }),
};