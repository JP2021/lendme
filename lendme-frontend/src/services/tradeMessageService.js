import api from './authService'

export const tradeMessageService = {
  // Enviar mensagem em uma troca
  async sendMessage(tradeId, message) {
    const response = await api.post(`/trades/${tradeId}/messages`, { message })
    return response.data
  },

  // Listar mensagens de uma troca
  async getMessages(tradeId) {
    const response = await api.get(`/trades/${tradeId}/messages`)
    return response.data
  },
}

