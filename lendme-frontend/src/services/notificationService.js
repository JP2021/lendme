import api from './authService'

export const notificationService = {
  // Listar notificações
  async getNotifications() {
    const response = await api.get('/notifications')
    return response.data
  },

  // Marcar notificação como lida
  async markAsRead(notificationId) {
    const response = await api.post(`/notifications/${notificationId}/read`)
    return response.data
  },

  // Marcar todas como lidas
  async markAllAsRead() {
    const response = await api.post('/notifications/read-all')
    return response.data
  },

  // Contar notificações não lidas
  async getUnreadCount() {
    const response = await api.get('/notifications/unread-count')
    return response.data
  },
}




