import { apiClient } from './client.js';
export const channelApi = {
  create: (data) => apiClient('/api/Channel/create', { method: 'POST', body: JSON.stringify(data) }),
  getMyChannel: () => apiClient('/api/Channel/me'),
  getById: (id) => apiClient(`/api/Channel/${id}`),
  updateProfile: (data) => apiClient('/api/Channel/profile', { method: 'PUT', body: JSON.stringify(data) }),
  uploadPhoto: (file) => { const fd = new FormData(); fd.append('file', file); return apiClient('/api/Channel/photo', { method: 'POST', body: fd }); },
  uploadCover: (file) => { const fd = new FormData(); fd.append('file', file); return apiClient('/api/Channel/cover', { method: 'POST', body: fd }); },
  getSocialLinks: (id) => apiClient(`/api/Channel/${id}/social-links`),
  updateSocialLinks: (data) => apiClient('/api/Channel/social-links', { method: 'PUT', body: JSON.stringify(data) }),
  hireModerator: (username) => apiClient('/api/Channel/moderators/hire', { method: 'POST', body: JSON.stringify({ username }) }),
  removeModerator: (username) => apiClient(`/api/Channel/moderators/${username}`, { method: 'DELETE' }),
  getModerators: () => apiClient('/api/Channel/moderators'),
  toggleSaveStreams: (val) => apiClient('/api/Channel/save-streams', { method: 'PUT', body: JSON.stringify({ saveStreams: val }) }),
  search: (query) => apiClient(`/api/Channel/search?q=${encodeURIComponent(query)}`),
  toggleFollow: (channelId) => apiClient(`/api/Channel/${channelId}/follow`, { method: 'POST' }),
  isFollowing: (channelId) => apiClient(`/api/Channel/${channelId}/following`),
  getFollowedChannels: () => apiClient('/api/Channel/following'),
};