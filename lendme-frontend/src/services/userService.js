import api from './authService'

export const userService = {
  // Buscar usuário por ID
  async getUser(userId) {
    const response = await api.get(`/users/${userId}`)
    return response.data
  },

  // Buscar produtos de um usuário
  async getUserProducts(userId) {
    const response = await api.get(`/users/${userId}/products`)
    return response.data
  },
}




