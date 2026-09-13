import { apiClient } from './client.js';
export const chatApi = {
  getStreamChat: (streamId) => apiClient(`/api/Chat/${streamId}`),
  getStreamChatRange: (streamId, from, to) => apiClient(`/api/Chat/${streamId}/range?from=${from}&to=${to}`),
};