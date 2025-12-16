import api from './authService'

export const loanService = {
  // Criar pedido de empréstimo
  async createLoanRequest(itemName) {
    const response = await api.post('/loans/request', { itemName })
    return response.data
  },

  // Listar pedidos de empréstimo
  async getLoans(type = 'received') {
    const response = await api.get(`/loans?type=${type}`)
    return response.data
  },

  // Buscar empréstimo por ID
  async getLoan(loanId) {
    const response = await api.get(`/loans/${loanId}`)
    return response.data
  },

  // Oferecer produto para empréstimo
  async offerLoan(loanId, productId) {
    const response = await api.post(`/loans/${loanId}/offer`, { productId })
    return response.data
  },

  // Aceitar oferta de empréstimo
  async acceptLoan(loanId) {
    const response = await api.post(`/loans/${loanId}/accept`)
    return response.data
  },

  // Confirmar recebimento do empréstimo
  async confirmReceived(loanId) {
    const response = await api.post(`/loans/${loanId}/confirm-received`)
    return response.data
  },

  // Cancelar pedido de empréstimo
  async cancelLoan(loanId) {
    const response = await api.post(`/loans/${loanId}/cancel`)
    return response.data
  },

  // Enviar mensagem
  async sendMessage(loanId, message) {
    const response = await api.post(`/loans/${loanId}/messages`, { message })
    return response.data
  },

  // Listar mensagens
  async getMessages(loanId) {
    const response = await api.get(`/loans/${loanId}/messages`)
    return response.data
  },
}

