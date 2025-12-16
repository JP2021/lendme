import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Heart, MessageCircle, ArrowLeftRight, MoreVertical } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { tradeService } from '../services/tradeService'
import { productService } from '../services/productService'
import { getImageUrl } from '../utils/imageUtils'

const ProductCard = ({ product, user }) => {
  const { user: currentUser } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)

  const getImageUrl = (imagePath) => {
    if (!imagePath) return null
    if (imagePath.startsWith('http')) return imagePath
    // Usa a URL do backend para servir as imagens
    return `http://localhost:3001${imagePath}`
  }

  const handleTrade = async () => {
    if (!currentUser) {
      navigate('/login')
      return
    }

    const productUserId = product.userId?.toString ? product.userId.toString() : product.userId
    const currentUserId = currentUser._id?.toString ? currentUser._id.toString() : currentUser._id

    if (productUserId === currentUserId) {
      alert('Você não pode trocar seu próprio produto')
      return
    }

    // Navegar para página de seleção de produto para troca
    navigate(`/trade/${product._id}/select`)
  }

  const formatDate = (date) => {
    if (!date) return 'Agora'
    const now = new Date()
    const productDate = new Date(date)
    const diff = now - productDate
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(minutes / 60)
    const days = Math.floor(hours / 24)

    if (minutes < 1) return 'Agora'
    if (minutes < 60) return `${minutes} min atrás`
    if (hours < 24) return `${hours}h atrás`
    if (days < 7) return `${days}d atrás`
    return productDate.toLocaleDateString('pt-BR')
  }

  return (
    <div className="bg-slate-900 rounded-lg border border-slate-800 mb-6">
      {/* Header do Post */}
      <div className="flex items-center justify-between p-4">
        <Link to={`/user/${user?._id || user?.id || '1'}`} className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
            <span className="text-white font-semibold text-sm">
              {user?.name?.charAt(0).toUpperCase() || 'U'}
            </span>
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-100">{user?.name || 'Usuário'}</p>
            <p className="text-xs text-gray-400">{formatDate(product?.createdAt)}</p>
          </div>
        </Link>
        <button className="text-gray-400 hover:text-gray-300">
          <MoreVertical size={20} />
        </button>
      </div>

      {/* Imagem do Produto */}
      <div className="w-full aspect-square bg-slate-800 flex items-center justify-center overflow-hidden relative">
        {product?.images && product.images.length > 0 ? (
          <>
            <img 
              src={getImageUrl(product.images[0])} 
              alt={product.name} 
              className="w-full h-full object-cover"
              onError={(e) => {
                e.target.style.display = 'none'
                const fallback = e.target.parentElement.querySelector('.image-fallback')
                if (fallback) fallback.style.display = 'flex'
              }}
            />
            <div className="image-fallback hidden absolute inset-0 items-center justify-center text-center">
              <div className="w-24 h-24 bg-slate-700 rounded-lg mx-auto mb-3 flex items-center justify-center">
                <span className="text-4xl">📦</span>
              </div>
            </div>
          </>
        ) : (
          <div className="text-center">
            <div className="w-24 h-24 bg-slate-700 rounded-lg mx-auto mb-3 flex items-center justify-center">
              <span className="text-4xl">📦</span>
            </div>
            <p className="text-gray-400 text-sm">Sem imagem</p>
          </div>
        )}
      </div>

      {/* Ações */}
      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-4">
            <button className="text-gray-300 hover:text-red-400 transition-colors">
              <Heart size={24} />
            </button>
            <button className="text-gray-300 hover:text-blue-400 transition-colors">
              <MessageCircle size={24} />
            </button>
          </div>
          {currentUser && (() => {
            const productUserId = product.userId?.toString ? product.userId.toString() : product.userId
            const currentUserId = currentUser._id?.toString ? currentUser._id.toString() : currentUser._id
            return productUserId !== currentUserId
          })() && (
            <button 
              onClick={handleTrade}
              disabled={loading}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors disabled:opacity-50"
            >
              <ArrowLeftRight size={20} />
              <span className="text-sm font-medium">Trocar</span>
            </button>
          )}
        </div>

            {/* Informações do Produto */}
            <div className="mb-2">
              <p className="text-sm font-semibold text-gray-100 mb-1">{product?.name || 'Produto'}</p>
              {product?.description && (
                <p className="text-sm text-gray-400 mb-2">{product.description}</p>
              )}
              <div className="flex items-center space-x-2 flex-wrap">
                {product?.category && (
                  <span className="px-2 py-1 bg-blue-500/20 text-blue-400 rounded-full text-xs">
                    {product.category}
                  </span>
                )}
                {product?.status === 'traded' ? (
                  <div className="flex flex-col space-y-1">
                    <span className="px-2 py-1 bg-purple-500/20 text-purple-400 rounded-full text-xs font-semibold">
                      ✓ Trocado
                    </span>
                    <span className="px-2 py-1 bg-purple-500/10 text-purple-300 rounded-full text-xs">
                      com {product.tradedWith || 'Usuário'} por {product.tradedFor || 'Produto'}
                    </span>
                  </div>
                ) : (
                  <span className="px-2 py-1 bg-green-500/20 text-green-400 rounded-full text-xs">
                    Disponível
                  </span>
                )}
                {product?.condition && product?.status !== 'traded' && (
                  <span className="px-2 py-1 bg-slate-700 text-gray-300 rounded-full text-xs">
                    {product.condition === 'excellent' ? 'Excelente' :
                     product.condition === 'good' ? 'Bom' :
                     product.condition === 'fair' ? 'Regular' : 'Ruim'}
                  </span>
                )}
              </div>
            </div>
      </div>
    </div>
  )
}

export default ProductCard
