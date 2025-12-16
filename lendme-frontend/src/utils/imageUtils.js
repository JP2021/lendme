// Função utilitária para construir URLs de imagens
export const getImageUrl = (imagePath) => {
  if (!imagePath) return null
  
  // Se já é uma URL completa, retorna como está
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath
  }
  
  // Se começa com /uploads, adiciona o host do backend
  if (imagePath.startsWith('/uploads/')) {
    const backendUrl = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:3001'
    return `${backendUrl}${imagePath}`
  }
  
  // Se não começa com /, adiciona /uploads/
  if (!imagePath.startsWith('/')) {
    const backendUrl = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:3001'
    return `${backendUrl}/uploads/${imagePath}`
  }
  
  // Caso padrão
  const backendUrl = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:3001'
  return `${backendUrl}${imagePath}`
}

