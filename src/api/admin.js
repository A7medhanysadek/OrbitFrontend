import { apiClient } from './client.js';

export const adminApi = {
  // System Statistics
  getStats: () => apiClient('/api/Admin/stats'),

  // User Accounts Governance
  getUsers(page = 1, size = 15, search = '', role = '') {
    let url = `/api/Admin/users?page=${page}&pageSize=${size}`;
    if (search) url += `&search=${encodeURIComponent(search)}`;
    if (role) url += `&role=${encodeURIComponent(role)}`;
    return apiClient(url);
  },

  getUserById: (userId) => apiClient(`/api/Admin/users/${userId}`),

  updateUserRoles: (userId, roles) =>
    apiClient(`/api/Admin/users/${userId}/roles`, {
      method: 'PUT',
      body: JSON.stringify({ roles })
    }),

  lockUser: (userId, isLocked, lockoutMinutes = 1440) =>
    apiClient(`/api/Admin/users/${userId}/lock`, {
      method: 'POST',
      body: JSON.stringify({ isLocked, lockoutMinutes })
    }),

  resetPassword: (userId, newPassword) =>
    apiClient(`/api/Admin/users/${userId}/reset-password`, {
      method: 'POST',
      body: JSON.stringify({ newPassword })
    }),

  deleteAccount: (userId) =>
    apiClient(`/api/Admin/users/${userId}`, { method: 'DELETE' }),

  // Channels Oversight
  getChannels(page = 1, size = 15, search = '') {
    let url = `/api/Admin/channels?page=${page}&pageSize=${size}`;
    if (search) url += `&search=${encodeURIComponent(search)}`;
    return apiClient(url);
  },

  resetChannelStreamKey: (channelId) =>
    apiClient(`/api/Admin/channels/${channelId}/reset-stream-key`, { method: 'POST' }),

  deleteChannel: (channelId) =>
    apiClient(`/api/Admin/channels/${channelId}`, { method: 'DELETE' }),

  // Live Streams Moderation
  getLiveStreams: () => apiClient('/api/Admin/streams/live'),

  forceEndStream: (streamId) =>
    apiClient(`/api/Admin/streams/${streamId}/force-end`, { method: 'POST' }),

  // Content Moderation (Clips & VODs)
  getClips: (page = 1, size = 20) =>
    apiClient(`/api/Admin/clips?page=${page}&pageSize=${size}`),

  deleteClip: (clipId) =>
    apiClient(`/api/Admin/clips/${clipId}`, { method: 'DELETE' }),

  getVods: (page = 1, size = 20) =>
    apiClient(`/api/Admin/vods?page=${page}&pageSize=${size}`),

  deleteVod: (vodId) =>
    apiClient(`/api/Admin/vods/${vodId}`, { method: 'DELETE' }),

  // Media Server Ingest & Playback Configuration
  getMediaServerConfig: () => apiClient('/api/Admin/media-server/config'),

  setMediaServerUrls: (rtmpUrl, hlsBaseUrl) =>
    apiClient('/api/Admin/media-server/set-url', {
      method: 'POST',
      body: JSON.stringify({ rtmpUrl, hlsBaseUrl })
    }),

  clearMediaServerUrls: () =>
    apiClient('/api/Admin/media-server/clear-url', { method: 'POST' }),
};