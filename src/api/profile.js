import { apiClient } from './client.js';
export const profileApi = {
  uploadPicture: (file) => { const fd = new FormData(); fd.append('file', file); return apiClient('/api/user-profile/picture', { method: 'POST', body: fd }); },
  removePicture: () => apiClient('/api/user-profile/picture', { method: 'DELETE' }),
  getPublicProfile: (userId) => apiClient(`/api/user-profile/${userId}`),
};