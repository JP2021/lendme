import api from './authService'

export const donationService = {
  // Criar solicitação de doação
  async createDonationRequest(productId) {
    const response = await api.post('/donations', { productId })
    return response.data
  },

  // Listar solicitações de doação
  async getDonations(type = 'received') {
    const response = await api.get(`/donations?type=${type}`)
    return response.data
  },

  // Aceitar doação
  async acceptDonation(donationId) {
    const response = await api.post(`/donations/${donationId}/accept`)
    return response.data
  },

  // Confirmar recebimento da doação
  async confirmReceived(donationId) {
    const response = await api.post(`/donations/${donationId}/confirm-received`)
    return response.data
  },

  // Enviar mensagem em uma doação
  async sendMessage(donationId, message) {
    const response = await api.post(`/donations/${donationId}/messages`, { message })
    return response.data
  },

  // Listar mensagens de uma doação
  async getMessages(donationId) {
    const response = await api.get(`/donations/${donationId}/messages`)
    return response.data
  },

  // Buscar doação específica
  async getDonation(donationId) {
    const response = await api.get(`/donations/${donationId}`)
    return response.data
  },

  // Contar doações pendentes
  async getPendingCount() {
    const response = await api.get('/donations/pending-count')
    return response.data
  },
}

