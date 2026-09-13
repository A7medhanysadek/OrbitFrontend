import { apiClient } from './client.js';

export const adminApi = {
  // Stats
  async getStats() {
    try {
      return await apiClient('/api/Admin/stats');
    } catch (e) {
      // Graceful fallback for deployed backend before redeployment
      try {
        const [accRes, streamsRes, clipsRes, catsRes] = await Promise.allSettled([
          apiClient('/api/accounts-management/accounts?page=1&pageSize=1'),
          apiClient('/api/Stream/live'),
          apiClient('/api/Clip/top?count=1'),
          apiClient('/api/Category')
        ]);
        return {
          totalUsers: accRes.status === 'fulfilled' ? (accRes.value?.totalCount || 0) : 0,
          totalChannels: accRes.status === 'fulfilled' ? Math.max(1, accRes.value?.totalCount || 0) : 1,
          activeStreams: streamsRes.status === 'fulfilled' ? (streamsRes.value?.length || 0) : 0,
          totalClips: clipsRes.status === 'fulfilled' ? (clipsRes.value?.length || 0) : 0,
          totalVods: 0,
          totalCategories: catsRes.status === 'fulfilled' ? (catsRes.value?.length || 0) : 0,
        };
      } catch (err) {
        return { totalUsers: 0, totalChannels: 0, activeStreams: 0, totalClips: 0, totalVods: 0, totalCategories: 0 };
      }
    }
  },

  // Users
  async getUsers(page = 1, size = 15, search = '', role = '') {
    try {
      let url = `/api/Admin/users?page=${page}&pageSize=${size}`;
      if (search) url += `&search=${encodeURIComponent(search)}`;
      if (role) url += `&role=${encodeURIComponent(role)}`;
      return await apiClient(url);
    } catch (e) {
      // Fallback to accounts-management
      const res = await apiClient(`/api/accounts-management/accounts?page=${page}&pageSize=${size}`);
      return {
        items: (res?.items || []).map(a => ({
          id: a.userId || a.id,
          username: a.username || 'User',
          email: a.email,
          fullName: a.fullName || a.username,
          age: a.age,
          roles: a.roles || [],
          isLockedOut: false,
          hasChannel: false
        })),
        totalCount: res?.totalCount || (res?.items?.length || 0),
        page,
        pageSize: size
      };
    }
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

  async deleteAccount(userId) {
    try {
      return await apiClient(`/api/Admin/users/${userId}`, { method: 'DELETE' });
    } catch (e) {
      return await apiClient(`/api/accounts-management/accounts/${userId}`, { method: 'DELETE' });
    }
  },

  // Channels
  async getChannels(page = 1, size = 15, search = '') {
    try {
      let url = `/api/Admin/channels?page=${page}&pageSize=${size}`;
      if (search) url += `&search=${encodeURIComponent(search)}`;
      return await apiClient(url);
    } catch (e) {
      return { items: [], totalCount: 0, page, pageSize: size };
    }
  },

  resetChannelStreamKey: (channelId) =>
    apiClient(`/api/Admin/channels/${channelId}/reset-stream-key`, { method: 'POST' }),

  deleteChannel: (channelId) =>
    apiClient(`/api/Admin/channels/${channelId}`, { method: 'DELETE' }),

  // Live Streams
  async getLiveStreams() {
    try {
      return await apiClient('/api/Admin/streams/live');
    } catch (e) {
      const res = await apiClient('/api/Stream/live');
      return (res || []).map(s => ({
        streamId: s.id,
        channelId: s.channelId,
        channelName: s.channelName || s.streamerName || 'Channel',
        streamerName: s.streamerName || 'Streamer',
        title: s.title || 'Live Broadcast',
        viewerCount: s.viewerCount || 0,
        startedAt: s.startedAt || new Date().toISOString(),
        categoryName: s.categoryName,
        thumbnailUrl: s.thumbnailUrl
      }));
    }
  },

  forceEndStream: (streamId) =>
    apiClient(`/api/Admin/streams/${streamId}/force-end`, { method: 'POST' }),

  // Content (Clips & VODs)
  async getClips(page = 1, size = 20) {
    try {
      return await apiClient(`/api/Admin/clips?page=${page}&pageSize=${size}`);
    } catch (e) {
      const clips = await apiClient(`/api/Clip/top?count=${size}`);
      return { items: clips || [], totalCount: clips?.length || 0, page, pageSize: size };
    }
  },

  deleteClip: (clipId) => apiClient(`/api/Clip/${clipId}`, { method: 'DELETE' }),

  getVods: (page = 1, size = 20) => apiClient(`/api/Admin/vods?page=${page}&pageSize=${size}`),
  deleteVod: (vodId) => apiClient(`/api/Admin/vods/${vodId}`, { method: 'DELETE' }),
};