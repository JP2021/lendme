import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Package, Check } from 'lucide-react'
import BottomNavigation from '../components/BottomNavigation'
import { productService } from '../services/productService'
import { tradeService } from '../services/tradeService'
import { useAuth } from '../contexts/AuthContext'
import { getImageUrl } from '../utils/imageUtils'

const SelectProductForTrade = () => {
  const { productId } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [targetProduct, setTargetProduct] = useState(null)
  const [myProducts, setMyProducts] = useState([])
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    loadData()
  }, [productId])

  const loadData = async () => {
    try {
      setLoading(true)
      const [product, products] = await Promise.all([
        productService.getProduct(productId),
        productService.getMyProducts()
      ])
      setTargetProduct(product)
      // Filtra apenas produtos disponíveis (não em troca)
      setMyProducts(products.filter(p => p.status === 'available'))
    } catch (error) {
      console.error('Erro ao carregar dados:', error)
      setError('Erro ao carregar produtos')
    } finally {
      setLoading(false)
    }
  }

  const handleSelectProduct = (product) => {
    setSelectedProduct(product._id)
  }

  const handleSubmitTrade = async () => {
    if (!selectedProduct) {
      setError('Selecione um produto para oferecer em troca')
      return
    }

    setSubmitting(true)
    setError('')

    try {
      const toUserId = targetProduct.userId?.toString ? targetProduct.userId.toString() : targetProduct.userId
      
      await tradeService.createTrade({
        toUserId: toUserId,
        fromProductId: selectedProduct,
        toProductId: productId
      })
      
      alert('Solicitação de troca enviada com sucesso!')
      navigate('/trades')
    } catch (err) {
      setError(err.response?.data?.message || 'Erro ao criar solicitação de troca')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  if (!targetProduct) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-400 mb-4">Produto não encontrado</p>
          <button onClick={() => navigate(-1)} className="btn-primary">
            Voltar
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-950 pb-20">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur-sm border-b border-slate-800">
        <div className="max-w-2xl mx-auto px-4">
          <div className="flex items-center justify-between h-14">
            <button
              onClick={() => navigate(-1)}
              className="text-gray-300 hover:text-gray-100"
            >
              <ArrowLeft size={24} />
            </button>
            <h1 className="text-xl font-bold text-gray-100">Propor Troca</h1>
            <div className="w-6"></div>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6">
        {/* Produto que você quer */}
        <div className="card mb-6">
          <h2 className="text-lg font-semibold text-gray-100 mb-4">Produto que você quer</h2>
          <div className="flex items-center space-x-4">
            {targetProduct.images && targetProduct.images.length > 0 ? (
              <img 
                src={getImageUrl(targetProduct.images[0])} 
                alt={targetProduct.name}
                className="w-20 h-20 rounded-lg object-cover"
              />
            ) : (
              <div className="w-20 h-20 bg-slate-800 rounded-lg flex items-center justify-center">
                <Package size={32} className="text-gray-400" />
              </div>
            )}
            <div className="flex-1">
              <h3 className="font-semibold text-gray-100">{targetProduct.name}</h3>
              <p className="text-sm text-gray-400">{targetProduct.category}</p>
              <p className="text-xs text-gray-500">De {targetProduct.user?.name}</p>
            </div>
          </div>
        </div>

        {/* Seus produtos disponíveis */}
        <div className="card mb-6">
          <h2 className="text-lg font-semibold text-gray-100 mb-4">Selecione um produto para oferecer</h2>
          
          {myProducts.length === 0 ? (
            <div className="text-center py-8">
              <Package size={48} className="text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400 mb-4">Você não tem produtos disponíveis para troca</p>
              <button
                onClick={() => navigate('/add-product')}
                className="btn-primary"
              >
                Adicionar Produto
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {myProducts.map((product) => (
                <button
                  key={product._id}
                  onClick={() => handleSelectProduct(product)}
                  className={`w-full p-4 rounded-lg border-2 transition-all ${
                    selectedProduct === product._id
                      ? 'border-blue-500 bg-blue-500/10'
                      : 'border-slate-700 bg-slate-800 hover:border-slate-600'
                  }`}
                >
                  <div className="flex items-center space-x-4">
                    {product.images && product.images.length > 0 ? (
                      <img 
                        src={getImageUrl(product.images[0])} 
                        alt={product.name}
                        className="w-16 h-16 rounded-lg object-cover"
                      />
                    ) : (
                      <div className="w-16 h-16 bg-slate-700 rounded-lg flex items-center justify-center">
                        <Package size={24} className="text-gray-400" />
                      </div>
                    )}
                    <div className="flex-1 text-left">
                      <h3 className="font-semibold text-gray-100">{product.name}</h3>
                      <p className="text-sm text-gray-400">{product.category}</p>
                    </div>
                    {selectedProduct === product._id && (
                      <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center">
                        <Check size={16} className="text-white" />
                      </div>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-900/30 border border-red-800 rounded-lg text-red-400 text-sm">
            {error}
          </div>
        )}

        {/* Botão de enviar */}
        {myProducts.length > 0 && (
          <button
            onClick={handleSubmitTrade}
            disabled={!selectedProduct || submitting}
            className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? 'Enviando...' : 'Enviar Proposta de Troca'}
          </button>
        )}
      </main>

      <BottomNavigation />
    </div>
  )
}

export default SelectProductForTrade

