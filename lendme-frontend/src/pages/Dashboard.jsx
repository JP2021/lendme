import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { Home, Search, Plus, MessageCircle, Heart, RefreshCw } from 'lucide-react'
import { Link } from 'react-router-dom'
import ProductCard from '../components/ProductCard'
import BottomNavigation from '../components/BottomNavigation'
import { productService } from '../services/productService'

const Dashboard = () => {
  const { user } = useAuth()
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadProducts()
  }, [])

  // Recarrega produtos quando a página recebe foco (útil após adicionar produto)
  useEffect(() => {
    const handleFocus = () => {
      loadProducts()
    }
    window.addEventListener('focus', handleFocus)
    return () => window.removeEventListener('focus', handleFocus)
  }, [])

  // Recarrega quando volta para a página
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        loadProducts()
      }
    }
    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [])

  const loadProducts = async () => {
    try {
      setLoading(true)
      const data = await productService.getProducts()
      console.log('Produtos carregados no feed:', data?.length || 0, 'produtos')
      if (data && Array.isArray(data)) {
        setProducts(data)
      } else {
        console.warn('Resposta inválida do servidor:', data)
        setProducts([])
      }
    } catch (error) {
      console.error('Erro ao carregar produtos:', error)
      setProducts([])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 pb-20">
      {/* Header Mobile/Desktop */}
      <header className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur-sm border-b border-slate-800">
        <div className="max-w-2xl mx-auto px-4">
          <div className="flex items-center justify-between h-14">
            <h1 className="text-xl font-bold text-gray-100">LendMe</h1>
            <div className="flex items-center space-x-4">
              <button
                onClick={loadProducts}
                className="text-gray-300 hover:text-gray-100 transition-colors"
                title="Atualizar feed"
              >
                <RefreshCw size={24} />
              </button>
              <Link to="/explore" className="text-gray-300 hover:text-gray-100">
                <Search size={24} />
              </Link>
              <Link to="/add-product" className="text-gray-300 hover:text-gray-100">
                <Plus size={24} />
              </Link>
              <Link to="/messages" className="text-gray-300 hover:text-gray-100 relative">
                <MessageCircle size={24} />
                <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Stories/Destaques */}
      <div className="max-w-2xl mx-auto px-4 py-4 border-b border-slate-800 overflow-x-auto">
        <div className="flex space-x-4">
          <div className="flex flex-col items-center space-y-1">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 p-0.5">
              <div className="w-full h-full rounded-full bg-slate-900 flex items-center justify-center">
                <Plus size={20} className="text-gray-300" />
              </div>
            </div>
            <span className="text-xs text-gray-400">Seu destaque</span>
          </div>
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex flex-col items-center space-y-1">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 p-0.5">
                <div className="w-full h-full rounded-full bg-slate-800 flex items-center justify-center">
                  <span className="text-white font-semibold text-sm">U{i}</span>
                </div>
              </div>
              <span className="text-xs text-gray-400 truncate max-w-[64px]">usuario{i}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Feed de Produtos */}
      <main className="max-w-2xl mx-auto px-4 py-4">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-12">
            <div className="mb-6">
              <div className="w-24 h-24 bg-slate-800 rounded-full mx-auto mb-4 flex items-center justify-center">
                <Plus size={48} className="text-gray-400" />
              </div>
            </div>
            <h2 className="text-xl font-semibold text-gray-100 mb-2">Feed vazio</h2>
            <p className="text-gray-400 mb-6">
              Adicione produtos ou faça amizades para ver produtos no feed
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link to="/add-product" className="btn-primary inline-flex items-center justify-center space-x-2">
                <Plus size={20} />
                <span>Adicionar Produto</span>
              </Link>
              <Link to="/friends" className="btn-secondary inline-flex items-center justify-center space-x-2">
                <span>Buscar Amigos</span>
              </Link>
            </div>
          </div>
        ) : (
          products.map((product) => (
            <ProductCard key={product._id} product={product} user={product.user} />
          ))
        )}
      </main>

      {/* Bottom Navigation (Mobile) */}
      <BottomNavigation />
    </div>
  )
}

export default Dashboard
