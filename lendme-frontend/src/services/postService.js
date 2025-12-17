import api from './authService'

export const postService = {
  async createPost(formData) {
    const response = await api.post('/posts', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    return response.data
  },

  async getPosts() {
    // Adiciona timestamp para evitar cache e garantir randomização a cada requisição
    const response = await api.get(`/posts?_t=${Date.now()}`)
    return response.data
  },

  async deletePost(postId) {
    const response = await api.delete(`/posts/${postId}`)
    return response.data
  },

  async markPostAsSeen(postId) {
    const response = await api.post(`/posts/${postId}/view`)
    return response.data
  },

  async toggleLike(postId) {
    const response = await api.post(`/posts/${postId}/like`)
    return response.data
  },

  async createComment(postId, text) {
    const response = await api.post(`/posts/${postId}/comments`, { text })
    return response.data
  },

  async getComments(postId) {
    const response = await api.get(`/posts/${postId}/comments`)
    return response.data
  },
}

