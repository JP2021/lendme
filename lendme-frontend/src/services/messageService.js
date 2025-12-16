import api from './authService'

export const messageService = {
  // Criar ou obter conversa com um usuário
  async getOrCreateConversation(userId) {
    const response = await api.get(`/conversations/${userId}`)
    return response.data
  },

  // Listar todas as conversas
  async getConversations() {
    const response = await api.get('/conversations')
    return response.data
  },

  // Enviar mensagem
  async sendMessage(conversationId, message) {
    const response = await api.post(`/conversations/${conversationId}/messages`, { message })
    return response.data
  },

  // Listar mensagens de uma conversa
  async getMessages(conversationId) {
    const response = await api.get(`/conversations/${conversationId}/messages`)
    return response.data
  },
}

