import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Package, Check, Handshake } from 'lucide-react'
import BottomNavigation from '../components/BottomNavigation'
import { productService } from '../services/productService'
import { loanService } from '../services/loanService'
import { useAuth } from '../contexts/AuthContext'
import { getImageUrl } from '../utils/imageUtils'

const OfferLoan = () => {
  const { loanId } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [loanRequest, setLoanRequest] = useState(null)
  const [myProducts, setMyProducts] = useState([])
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    loadData()
  }, [loanId])

  const loadData = async () => {
    try {
      setLoading(true)
      setError('')
      
      // Busca o empréstimo diretamente pelo ID
      try {
        const loan = await loanService.getLoan(loanId)
        if (!loan) {
          setError('Pedido de empréstimo não encontrado')
          return
        }
        setLoanRequest(loan)
      } catch (loanError) {
        console.error('Erro ao buscar empréstimo:', loanError)
        // Fallback: tenta buscar na lista
        const loans = await loanService.getLoans('feed')
        const loan = loans.find(l => {
          const lId = String(l._id || '')
          const searchId = String(loanId || '')
          return lId === searchId
        })
        if (!loan) {
          setError('Pedido de empréstimo não encontrado')
          return
        }
        setLoanRequest(loan)
      }
      
      // Busca produtos disponíveis
      const products = await productService.getMyProducts()
      // Filtra apenas produtos disponíveis
      setMyProducts(products.filter(p => p.status === 'available'))
    } catch (error) {
      console.error('Erro ao carregar dados:', error)
      setError(error.response?.data?.message || 'Erro ao carregar dados')
    } finally {
      setLoading(false)
    }
  }

  const handleSelectProduct = (product) => {
    setSelectedProduct(product._id)
  }

  const handleSubmitLoan = async () => {
    if (!selectedProduct) {
      setError('Selecione um produto para oferecer em empréstimo')
      return
    }

    setSubmitting(true)
    setError('')

    try {
      await loanService.offerLoan(loanId, selectedProduct)
      alert('Oferta de empréstimo enviada com sucesso!')
      navigate('/')
    } catch (err) {
      setError(err.response?.data?.message || 'Erro ao oferecer empréstimo')
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

  if (!loanRequest) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-400 mb-4">Pedido de empréstimo não encontrado</p>
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
            <h1 className="text-xl font-bold text-gray-100">Oferecer Empréstimo</h1>
            <div className="w-6"></div>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6">
        {/* Pedido de Empréstimo */}
        <div className="bg-slate-900 rounded-lg border border-slate-800 p-4 mb-6">
          <div className="flex items-center space-x-3 mb-2">
            <Handshake size={24} className="text-purple-400" />
            <div>
              <p className="text-sm font-semibold text-gray-100">
                {loanRequest.requester?.name || 'Usuário'} precisa de
              </p>
              <p className="text-lg font-bold text-purple-400">{loanRequest.itemName}</p>
            </div>
          </div>
        </div>

        {/* Seleção de Produto */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-gray-100 mb-4">
            Selecione um produto para emprestar:
          </h2>

          {error && (
            <div className="mb-4 p-3 bg-red-900/30 border border-red-800 rounded-lg text-red-400 text-sm">
              {error}
            </div>
          )}

          {myProducts.length === 0 ? (
            <div className="text-center py-8">
              <Package size={48} className="text-gray-400 mx-auto mb-4" />
              <p className="text-gray-400 mb-4">Você não tem produtos disponíveis</p>
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
                <div
                  key={product._id}
                  onClick={() => handleSelectProduct(product)}
                  className={`p-4 rounded-lg border cursor-pointer transition-colors ${
                    selectedProduct === product._id
                      ? 'bg-blue-500/20 border-blue-500'
                      : 'bg-slate-800 border-slate-700 hover:border-slate-600'
                  }`}
                >
                  <div className="flex items-center space-x-4">
                    {product.images && product.images.length > 0 ? (
                      <img
                        src={getImageUrl(product.images[0])}
                        alt={product.name}
                        className="w-16 h-16 object-cover rounded-lg"
                      />
                    ) : (
                      <div className="w-16 h-16 bg-slate-700 rounded-lg flex items-center justify-center">
                        <Package size={24} className="text-gray-400" />
                      </div>
                    )}
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-gray-100">{product.name}</p>
                      {product.description && (
                        <p className="text-xs text-gray-400 mt-1 line-clamp-2">
                          {product.description}
                        </p>
                      )}
                    </div>
                    {selectedProduct === product._id && (
                      <Check size={24} className="text-blue-400" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Botão de Enviar */}
        {myProducts.length > 0 && (
          <button
            onClick={handleSubmitLoan}
            disabled={!selectedProduct || submitting}
            className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? 'Enviando...' : 'Oferecer Empréstimo'}
          </button>
        )}
      </main>

      {/* Bottom Navigation */}
      <BottomNavigation />
    </div>
  )
}

export default OfferLoan

