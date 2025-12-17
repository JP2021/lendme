import api from './authService'

export const productService = {
  // Criar produto
  async createProduct(productData) {
    const formData = new FormData()
    formData.append('name', productData.name)
    formData.append('description', productData.description || '')
    formData.append('category', productData.category || 'Outros')
    formData.append('condition', productData.condition || 'good')
    formData.append('type', productData.type || 'trade')
    
    if (productData.images && productData.images.length > 0) {
      productData.images.forEach(image => {
        formData.append('images', image)
      })
    }

    const response = await api.post('/products', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    return response.data
  },

  // Listar produtos (feed)
  async getProducts(filters = {}) {
    const params = new URLSearchParams()
    // Adiciona timestamp para evitar cache e garantir randomização a cada requisição
    params.append('_t', Date.now())
    if (filters.category) params.append('category', filters.category)
    if (filters.search) params.append('search', filters.search)
    if (filters.limit) params.append('limit', filters.limit)

    const response = await api.get(`/products?${params.toString()}`)
    return response.data
  },

  // Listar produtos do usuário
  async getMyProducts() {
    const response = await api.get('/products/my')
    return response.data
  },

  // Buscar produto específico
  async getProduct(productId) {
    const response = await api.get(`/products/${productId}`)
    return response.data
  },

  // Atualizar produto
  async updateProduct(productId, productData) {
    const formData = new FormData()
    if (productData.name) formData.append('name', productData.name)
    if (productData.description !== undefined) formData.append('description', productData.description)
    if (productData.category) formData.append('category', productData.category)
    if (productData.condition) formData.append('condition', productData.condition)
    
    // Envia imagens existentes para preservar
    if (productData.existingImages) {
      formData.append('existingImages', JSON.stringify(productData.existingImages))
    }
    
    if (productData.images && productData.images.length > 0) {
      productData.images.forEach(image => {
        formData.append('images', image)
      })
    }

    const response = await api.put(`/products/${productId}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    return response.data
  },

  // Deletar produto
  async deleteProduct(productId) {
    const response = await api.delete(`/products/${productId}`)
    return response.data
  },

  // Curtir / descurtir produto
  async toggleLike(productId) {
    const response = await api.post(`/products/${productId}/like`)
    return response.data
  },

  // Listar comentários do produto
  async getComments(productId) {
    const response = await api.get(`/products/${productId}/comments`)
    return response.data
  },

  // Criar comentário no produto
  async addComment(productId, text) {
    const response = await api.post(`/products/${productId}/comments`, { text })
    return response.data
  },
}


