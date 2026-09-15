import { apiClient } from './client.js';
export const streamApi = {
  getLiveStreams: () => apiClient('/api/Stream/live'),
  getActiveStreams: () => apiClient('/api/Stream/live'),
  getStreamById: (id) => apiClient(`/api/Stream/${id}`),
  createStream: (data) => apiClient('/api/Stream/create', { method: 'POST', body: JSON.stringify(data) }),
  updateCurrentStream: (data) => apiClient('/api/Stream/current', { method: 'PATCH', body: JSON.stringify(data) }),
  endStream: () => apiClient('/api/Stream/end', { method: 'POST' }),
  generateStreamKey: () => apiClient('/api/Stream/key/generate', { method: 'POST' }),
  getStreamKey: () => apiClient('/api/Stream/key'),
  setMediaServerUrl: (data) => apiClient('/api/Stream/server/set-url', { method: 'POST', body: JSON.stringify(data) }),
  clearMediaServerUrl: () => apiClient('/api/Stream/server/clear-url', { method: 'POST' }),
  getMediaServerConfig: () => apiClient('/api/Stream/server/config'),
};