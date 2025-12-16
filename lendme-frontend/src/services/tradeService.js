import api from './authService'

export const tradeService = {
  // Criar solicitação de troca
  async createTrade(tradeData) {
    const response = await api.post('/trades', tradeData)
    return response.data
  },

  // Listar trocas do usuário
  async getTrades(status = null) {
    const params = status ? `?status=${status}` : ''
    const response = await api.get(`/trades${params}`)
    return response.data
  },

  // Buscar troca específica
  async getTrade(tradeId) {
    const response = await api.get(`/trades/${tradeId}`)
    return response.data
  },

  // Aceitar troca
  async acceptTrade(tradeId) {
    const response = await api.post(`/trades/${tradeId}/accept`)
    return response.data
  },

  // Recusar troca
  async rejectTrade(tradeId) {
    const response = await api.post(`/trades/${tradeId}/reject`)
    return response.data
  },

  // Concluir troca
  async completeTrade(tradeId) {
    const response = await api.post(`/trades/${tradeId}/complete`)
    return response.data
  },
}


