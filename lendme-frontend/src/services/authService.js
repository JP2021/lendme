import axios from 'axios'

// Durante o desenvolvimento usamos o proxy do Vite para /api
// Em produção você pode definir VITE_API_URL apontando para o backend
const API_BASE_URL = import.meta.env.VITE_API_URL || '/api'

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'Cache-Control': 'no-cache',
    'Pragma': 'no-cache',
  },
  withCredentials: true, // garante envio/recebimento de cookies de sessão
})

// Interceptor para tratamento de erros de autenticação
// Não redireciona automaticamente para evitar loops infinitos
// O AuthContext e ProtectedRoute cuidam da navegação
api.interceptors.response.use(
  (response) => {
    // Verifica se a resposta é HTML (página de login) ao invés de JSON
    const contentType = response.headers['content-type'] || '';
    if (contentType.includes('text/html')) {
      console.error('[API] Recebeu HTML ao invés de JSON:', response.config.url);
      return Promise.reject(new Error('Resposta inválida do servidor (HTML ao invés de JSON). Verifique a autenticação.'));
    }
    return response;
  },
  (error) => {
    // Verifica se o erro é uma resposta HTML
    if (error.response && error.response.headers['content-type']?.includes('text/html')) {
      console.error('[API] Erro: recebeu HTML ao invés de JSON:', error.config?.url);
      error.response.data = { message: 'Não autenticado. Faça login novamente.' };
    }
    // Apenas rejeita o erro, sem redirecionar
    // Isso evita loops infinitos de atualização
    return Promise.reject(error)
  }
)

export const authService = {
  // Login (usa sessão do backend)
  async login(credentials) {
    const response = await api.post('/login', credentials)
    return response.data
  },

  // Registro com código de convite
  async register(userData) {
    const response = await api.post('/register', userData)
    return response.data
  },

  // Verificar código de convite
  async verifyInviteCode(inviteCode) {
    const response = await api.get(`/invite/verify/${inviteCode}`)
    return response.data
  },

  // Obter usuário atual
  async getCurrentUser() {
    const response = await api.get('/auth/me')
    return response.data
  },

  // Recuperar senha
  async forgotPassword(email) {
    const response = await api.post('/forgot', { email })
    return response.data
  },

  // Logout
  async logout() {
    const response = await api.post('/logout')
    return response.data
  },

  // Gerar código de convite (com e-mail)
  async generateInviteCode(email) {
    const response = await api.post('/invite/generate', { email })
    return response.data
  },

  // Gerar código de convite (sem e-mail)
  async generateInviteCodeOnly() {
    const response = await api.post('/invite/generate', {})
    return response.data
  },

  // Listar convites do usuário
  async getUserInvites() {
    const response = await api.get('/invite/my-invites')
    return response.data
  },

  // Listar amigos do usuário
  async getFriends() {
    const response = await api.get('/friends')
    return response.data
  },

  // Enviar solicitação de amizade
  async sendFriendRequest(toUserId) {
    const response = await api.post('/friends/request', { toUserId })
    return response.data
  },

  // Listar solicitações recebidas
  async getReceivedFriendRequests() {
    const response = await api.get('/friends/requests/received')
    return response.data
  },

  // Listar solicitações enviadas
  async getSentFriendRequests() {
    const response = await api.get('/friends/requests/sent')
    return response.data
  },

  // Aceitar solicitação de amizade
  async acceptFriendRequest(requestId) {
    const response = await api.post(`/friends/requests/${requestId}/accept`)
    return response.data
  },

  // Recusar solicitação de amizade
  async rejectFriendRequest(requestId) {
    const response = await api.post(`/friends/requests/${requestId}/reject`)
    return response.data
  },

  // Remover amigo
  async removeFriend(friendId) {
    const response = await api.delete(`/friends/${friendId}`)
    return response.data
  },

  // Buscar usuários públicos
  async searchUsers(query) {
    const response = await api.get(`/users/search?q=${encodeURIComponent(query)}`)
    return response.data
  },
}

export default api
