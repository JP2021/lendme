import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeftRight, Plus, Search, Package } from 'lucide-react'
import BottomNavigation from '../components/BottomNavigation'
import { productService } from '../services/productService'
import { tradeService } from '../services/tradeService'
import { getImageUrl } from '../utils/imageUtils'
import { useAuth } from '../contexts/AuthContext'

const Trades = () => {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState('available')
  const [myProducts, setMyProducts] = useState([])
  const [trades, setTrades] = useState([])
  const [tradeRequests, setTradeRequests] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [activeTab])

  const loadData = async () => {
    try {
      setLoading(true)
      if (activeTab === 'available') {
        const products = await productService.getMyProducts()
        setMyProducts(products)
      } else if (activeTab === 'my-trades') {
        const data = await tradeService.getTrades()
        setTrades(data.filter(t => t.status === 'accepted' || t.status === 'completed'))
      } else if (activeTab === 'requests') {
        const data = await tradeService.getTrades()
        // Filtra apenas solicitações RECEBIDAS (onde o usuário atual é o toUserId)
        // e que estão pendentes
        const currentUserId = user?._id?.toString() || user?._id
        const receivedRequests = data.filter(t => {
          const tradeToUserId = t.toUserId?.toString() || t.toUserId
          return t.status === 'pending' && tradeToUserId === currentUserId
        })
        setTradeRequests(receivedRequests)
        console.log('[DEBUG] Solicitações recebidas:', receivedRequests.length, 'de', data.length, 'total')
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteProduct = async (productId) => {
    if (!confirm('Tem certeza que deseja remover este produto?')) return
    
    try {
      await productService.deleteProduct(productId)
      await loadData()
    } catch (error) {
      console.error('Erro ao deletar produto:', error)
      alert('Erro ao deletar produto')
    }
  }

  const handleAcceptTrade = async (tradeId) => {
    try {
      await tradeService.acceptTrade(tradeId)
      await loadData()
    } catch (error) {
      console.error('Erro ao aceitar troca:', error)
      alert('Erro ao aceitar troca')
    }
  }

  const handleRejectTrade = async (tradeId) => {
    try {
      await tradeService.rejectTrade(tradeId)
      await loadData()
    } catch (error) {
      console.error('Erro ao recusar troca:', error)
      alert('Erro ao recusar troca')
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 pb-20">
      <div className="max-w-6xl mx-auto px-4 py-4">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-100 mb-2">Minhas Trocas</h1>
            <p className="text-gray-400">Gerencie seus produtos disponíveis para troca</p>
          </div>
          <Link to="/add-product" className="btn-primary flex items-center space-x-2">
            <Plus size={20} />
            <span>Adicionar Produto</span>
          </Link>
        </div>

        {/* Tabs */}
        <div className="flex space-x-2 mb-6 border-b border-slate-800">
          <button
            onClick={() => setActiveTab('available')}
            className={`px-4 py-2 font-medium transition-colors ${
              activeTab === 'available'
                ? 'text-blue-400 border-b-2 border-blue-400'
                : 'text-gray-400 hover:text-gray-300'
            }`}
          >
            Produtos Disponíveis
          </button>
          <button
            onClick={() => setActiveTab('my-trades')}
            className={`px-4 py-2 font-medium transition-colors ${
              activeTab === 'my-trades'
                ? 'text-blue-400 border-b-2 border-blue-400'
                : 'text-gray-400 hover:text-gray-300'
            }`}
          >
            Minhas Trocas
          </button>
          <button
            onClick={() => setActiveTab('requests')}
            className={`px-4 py-2 font-medium transition-colors ${
              activeTab === 'requests'
                ? 'text-blue-400 border-b-2 border-blue-400'
                : 'text-gray-400 hover:text-gray-300'
            }`}
          >
            Solicitações ({tradeRequests.length})
          </button>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          </div>
        ) : activeTab === 'available' && (
          <div className="space-y-4">
            {myProducts.length === 0 ? (
              <div className="bg-slate-900 rounded-xl shadow-lg p-6 border border-slate-800">
                <div className="text-center py-8">
                  <ArrowLeftRight className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-400 mb-4">Você ainda não tem produtos disponíveis para troca</p>
                  <Link to="/add-product" className="btn-primary inline-flex items-center space-x-2">
                    <Plus size={20} />
                    <span>Adicionar Primeiro Produto</span>
                  </Link>
                </div>
              </div>
            ) : (
              myProducts.map((product) => (
                <div key={product._id} className="bg-slate-900 rounded-xl shadow-lg p-6 border border-slate-800">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-4">
                      {product.images && product.images.length > 0 ? (
                        <img src={getImageUrl(product.images[0])} alt={product.name} className="w-16 h-16 rounded-lg object-cover" onError={(e) => { e.target.style.display = 'none'; e.target.nextElementSibling.style.display = 'flex' }} />
                      ) : null}
                      {(!product.images || product.images.length === 0) && (
                        <div className="w-16 h-16 bg-slate-800 rounded-lg flex items-center justify-center">
                          <Package className="w-8 h-8 text-gray-400" />
                        </div>
                      )}
                      <div>
                        <h3 className="text-lg font-semibold text-gray-100">{product.name}</h3>
                        <p className="text-sm text-gray-400">Categoria: {product.category}</p>
                        <p className="text-sm text-gray-500 mt-1">Disponível para troca</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Link 
                        to={`/products/${product._id}/edit`}
                        className="btn-secondary text-sm"
                      >
                        Editar
                      </Link>
                      <button 
                        onClick={() => handleDeleteProduct(product._id)}
                        className="text-sm text-red-400 hover:text-red-300"
                      >
                        Remover
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'my-trades' && (
          <div className="space-y-4">
            {trades.length === 0 ? (
              <div className="bg-slate-900 rounded-xl shadow-lg p-6 border border-slate-800">
                <div className="text-center py-8">
                  <ArrowLeftRight className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-400">Você ainda não realizou nenhuma troca</p>
                </div>
              </div>
            ) : (
              trades.map((trade) => (
                <Link
                  key={trade._id}
                  to={`/trades/${trade._id}`}
                  className="block bg-slate-900 rounded-xl shadow-lg p-6 border border-slate-800 hover:border-blue-500 transition-colors"
                >
                  <div className="flex items-center space-x-4">
                    <div className="flex-1">
                      <div className="flex items-center space-x-4 mb-4">
                        {trade.fromProduct?.images?.[0] ? (
                          <img src={getImageUrl(trade.fromProduct.images[0])} alt={trade.fromProduct.name} className="w-16 h-16 rounded-lg object-cover" onError={(e) => { e.target.style.display = 'none'; e.target.nextElementSibling.style.display = 'flex' }} />
                        ) : null}
                        {(!trade.fromProduct?.images?.[0]) && (
                          <div className="w-16 h-16 bg-slate-800 rounded-lg flex items-center justify-center">
                            <Package className="w-8 h-8 text-gray-400" />
                          </div>
                        )}
                        <div>
                          <h3 className="text-lg font-semibold text-gray-100">{trade.fromProduct?.name}</h3>
                          <p className="text-sm text-gray-400">Troca com {trade.toUser?.name}</p>
                        </div>
                      </div>
                      <div className="flex items-center justify-center space-x-4 mb-4">
                        <ArrowLeftRight className="w-6 h-6 text-gray-500" />
                      </div>
                      <div className="flex items-center space-x-4">
                        {trade.toProduct?.images?.[0] ? (
                          <img src={getImageUrl(trade.toProduct.images[0])} alt={trade.toProduct.name} className="w-16 h-16 rounded-lg object-cover" onError={(e) => { e.target.style.display = 'none'; e.target.nextElementSibling.style.display = 'flex' }} />
                        ) : null}
                        {(!trade.toProduct?.images?.[0]) && (
                          <div className="w-16 h-16 bg-slate-800 rounded-lg flex items-center justify-center">
                            <Package className="w-8 h-8 text-gray-400" />
                          </div>
                        )}
                        <div>
                          <h3 className="text-lg font-semibold text-gray-100">{trade.toProduct?.name}</h3>
                          <p className="text-sm text-gray-400">De {trade.toUser?.name}</p>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                        trade.status === 'completed' ? 'bg-green-500/20 text-green-400' :
                        trade.status === 'accepted' ? 'bg-blue-500/20 text-blue-400' :
                        'bg-yellow-500/20 text-yellow-400'
                      }`}>
                        {trade.status === 'completed' ? 'Concluída' :
                         trade.status === 'accepted' ? 'Aceita' : 'Pendente'}
                      </span>
                      <p className="text-xs text-gray-400 mt-2">
                        {new Date(trade.createdAt).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                  </div>
                </Link>
              ))
            )}
          </div>
        )}

        {activeTab === 'requests' && (
          <div className="space-y-4">
            {tradeRequests.length === 0 ? (
              <div className="bg-slate-900 rounded-xl shadow-lg p-6 border border-slate-800">
                <div className="text-center py-8">
                  <Package className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-400">Nenhuma solicitação de troca pendente</p>
                </div>
              </div>
            ) : (
              tradeRequests.map((trade) => (
                <Link
                  key={trade._id}
                  to={`/trades/${trade._id}`}
                  className="block bg-slate-900 rounded-xl shadow-lg p-6 border border-slate-800 hover:border-blue-500 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4 flex-1">
                      <div className="w-12 h-12 bg-blue-500/20 rounded-full flex items-center justify-center">
                        <span className="text-blue-400 font-semibold">
                          {trade.fromUser?.name?.charAt(0).toUpperCase() || 'U'}
                        </span>
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-100">{trade.fromUser?.name}</h3>
                        <p className="text-sm text-gray-400">
                          Quer trocar "{trade.fromProduct?.name}" por sua "{trade.toProduct?.name}"
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(trade.createdAt).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button 
                        onClick={(e) => {
                          e.preventDefault()
                          handleAcceptTrade(trade._id)
                        }}
                        className="btn-primary text-sm"
                      >
                        Aceitar
                      </button>
                      <button 
                        onClick={(e) => {
                          e.preventDefault()
                          handleRejectTrade(trade._id)
                        }}
                        className="btn-secondary text-sm"
                      >
                        Recusar
                      </button>
                    </div>
                  </div>
                </Link>
              ))
            )}
          </div>
        )}
      </div>

      {/* Bottom Navigation */}
      <BottomNavigation />
    </div>
  )
}

export default Trades
