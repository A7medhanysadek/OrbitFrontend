import { apiClient } from './client.js';
export const vodApi = {
  getChannelVods: (channelId) => apiClient(`/api/Vod/channel/${channelId}`),
  getVodWithChat: (vodId) => apiClient(`/api/Vod/${vodId}`),
  recordView: (vodId, sessionId) => apiClient(`/api/Vod/${vodId}/view${sessionId ? '?sessionId=' + sessionId : ''}`, { method: 'POST' }),
  delete: (vodId) => apiClient(`/api/Vod/${vodId}`, { method: 'DELETE' }),
};