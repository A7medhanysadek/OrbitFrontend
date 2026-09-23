import { apiClient } from './client.js';
export const moderationApi = {
  deleteMessage: (channelId, messageId) => apiClient(`/api/Moderation/${channelId}/messages/${messageId}`, { method: 'DELETE' }),
  timeoutUser: (channelId, data) => apiClient(`/api/Moderation/${channelId}/timeout`, { method: 'POST', body: JSON.stringify(data) }),
  banUser: (channelId, data) => apiClient(`/api/Moderation/${channelId}/ban`, { method: 'POST', body: JSON.stringify(data) }),
  unbanUser: (channelId, username) => apiClient(`/api/Moderation/${channelId}/ban/${encodeURIComponent(username)}`, { method: 'DELETE' }),
  removeTimeout: (channelId, username) => apiClient(`/api/Moderation/${channelId}/timeout/${encodeURIComponent(username)}`, { method: 'DELETE' }),
  getUserStatus: (channelId, username) => apiClient(`/api/Moderation/${channelId}/user-status?username=${encodeURIComponent(username)}`),
};