import { apiClient } from './client.js';

export const notificationApi = {
  getNotifications: (count = 30) => apiClient(`/api/Notification?count=${count}`),
  getUnreadCount: () => apiClient('/api/Notification/unread-count'),
  markAsRead: (id) => apiClient(`/api/Notification/${id}/read`, { method: 'PUT' }),
  markAllAsRead: () => apiClient('/api/Notification/read-all', { method: 'PUT' }),
};
