import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeftRight, Plus, Search, Package, MessageCircle, Check } from 'lucide-react'
import BottomNavigation from '../components/BottomNavigation'
import ConfirmDialog from '../components/ConfirmDialog'
import { useToast } from '../contexts/ToastContext'
import { productService } from '../services/productService'
import { tradeService } from '../services/tradeService'
import { getImageUrl } from '../utils/imageUtils'
import { useAuth } from '../contexts/AuthContext'

const Trades = () => {
  const { user } = useAuth()
  const toast = useToast()
  const [activeTab, setActiveTab] = useState('available')
  const [myProducts, setMyProducts] = useState([])
  const [trades, setTrades] = useState([])
  const [tradeRequests, setTradeRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, action: null, data: null })

  useEffect(() => {
    if (user) {
      loadData()
    }
  }, [activeTab, user])

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
        if (!user || !user._id) {
          console.warn('[DEBUG] Usuário não disponível para filtrar solicitações')
          setTradeRequests([])
          return
        }
        
        const data = await tradeService.getTrades()
        // Filtra apenas solicitações RECEBIDAS (onde o usuário atual é o toUserId)
        // e que estão pendentes
        const currentUserId = String(user._id?.toString ? user._id.toString() : user._id || '')
        
        const receivedRequests = data.filter(t => {
          // Normaliza os IDs para comparação
          const tradeToUserId = String(t.toUserId || '')
          const isPending = t.status === 'pending'
          const isReceived = isPending && tradeToUserId === currentUserId
          
          return isReceived
        })
        
        setTradeRequests(receivedRequests)
        
        if (receivedRequests.length === 0 && data.length > 0) {
          console.warn('[DEBUG] Nenhuma solicitação recebida encontrada, mas há trocas pendentes. Verifique a comparação de IDs.')
        }
      } else if (activeTab === 'donations') {
        // Carrega doações baseado na sub-aba selecionada
        if (!user || !user._id) {
          console.warn('[DEBUG] Usuário não disponível para filtrar doações')
          setDonationRequests([])
          setDonationReceived([])
          setDonationSent([])
          return
        }
        
        try {
          const [received, sent] = await Promise.all([
            donationService.getDonations('received').catch(err => {
              console.error('Erro ao buscar doações recebidas:', err)
              return []
            }),
            donationService.getDonations('sent').catch(err => {
              console.error('Erro ao buscar doações enviadas:', err)
              return []
            })
          ])
          
          
          // Organiza por sub-aba
          // received = doações onde o usuário é o dono (toUserId) - FEZ/DOOU
          // sent = doações onde o usuário solicitou (fromUserId) - RECEBEU
          if (donationSubTab === 'pending') {
            // Solicitações pendentes recebidas (aguardando aprovação do dono)
            const pending = received.filter(d => d.status === 'pending')
            setDonationRequests(pending)
            setDonationReceived([])
            setDonationSent([])
          } else if (donationSubTab === 'received') {
            // Doações RECEBIDAS (o usuário é quem vai receber o produto) = sent (ele solicitou)
            const receivedDonations = sent.filter(d => d.status === 'accepted' || d.status === 'confirmed')
            setDonationRequests([])
            setDonationReceived(receivedDonations)
            setDonationSent([])
          } else if (donationSubTab === 'sent') {
            // Doações FEITAS (o usuário doou) = received (ele é o dono)
            // Mostra todas as doações feitas (aceitas, confirmadas e até rejeitadas para histórico)
            const madeDonations = received.filter(d => 
              d.status === 'accepted' || 
              d.status === 'confirmed' || 
              d.status === 'rejected'
            )
            setDonationRequests([])
            setDonationReceived([])
            setDonationSent(madeDonations)
          }
        } catch (error) {
          console.error('Erro ao carregar doações:', error)
          setDonationRequests([])
          setDonationReceived([])
          setDonationSent([])
        }
      } else if (activeTab === 'loans') {
        // Carrega empréstimos baseado na sub-aba selecionada
        if (!user || !user._id) {
          console.warn('[DEBUG] Usuário não disponível para filtrar empréstimos')
          setLoanRequests([])
          setLoanReceived([])
          setLoanSent([])
          return
        }
        
        try {
          const [received, sent] = await Promise.all([
            loanService.getLoans('received').catch(err => {
              console.error('Erro ao buscar empréstimos recebidos:', err)
              return []
            }),
            loanService.getLoans('sent').catch(err => {
              console.error('Erro ao buscar empréstimos enviados:', err)
              return []
            })
          ])
          
          
          // Organiza por sub-aba
          // received = empréstimos onde o usuário é o emprestador (lenderId) - FEZ/EMPRESTOU
          // sent = empréstimos onde o usuário solicitou (requesterId) - RECEBEU
          if (loanSubTab === 'pending') {
            // Solicitações pendentes: pedidos que o usuário fez (sent) e ofertas que recebeu (received)
            const pendingSent = sent.filter(l => l.status === 'pending' || l.status === 'offered')
            const pendingReceived = received.filter(l => l.status === 'offered' || l.status === 'pending')
            setLoanRequests([...pendingSent, ...pendingReceived])
            setLoanReceived([])
            setLoanSent([])
          } else if (loanSubTab === 'received') {
            // Empréstimos RECEBIDOS (o usuário é quem vai receber o produto) = sent (ele solicitou)
            const receivedLoans = sent.filter(l => l.status === 'accepted' || l.status === 'confirmed')
            setLoanRequests([])
            setLoanReceived(receivedLoans)
            setLoanSent([])
          } else if (loanSubTab === 'sent') {
            // Empréstimos FEITOS (o usuário emprestou) = received (ele é o emprestador)
            const madeLoans = received.filter(l => 
              l.status === 'accepted' || 
              l.status === 'confirmed' || 
              l.status === 'offered'
            )
            setLoanRequests([])
            setLoanReceived([])
            setLoanSent(madeLoans)
          }
        } catch (error) {
          console.error('Erro ao carregar empréstimos:', error)
          setLoanRequests([])
          setLoanReceived([])
          setLoanSent([])
        }
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteProduct = (productId) => {
    setConfirmDialog({ 
      isOpen: true, 
      action: 'deleteProduct', 
      data: { productId } 
    })
  }

  const confirmDeleteProduct = async () => {
    const { productId } = confirmDialog.data
    try {
      await productService.deleteProduct(productId)
      await loadData()
      toast.success('Produto removido com sucesso!')
    } catch (error) {
      console.error('Erro ao deletar produto:', error)
      toast.error('Erro ao deletar produto')
    } finally {
      setConfirmDialog({ isOpen: false, action: null, data: null })
    }
  }

  const handleAcceptTrade = async (tradeId) => {
    try {
      await tradeService.acceptTrade(tradeId)
      await loadData()
    } catch (error) {
      console.error('Erro ao aceitar troca:', error)
      toast.error('Erro ao aceitar troca')
    }
  }

  const handleRejectTrade = async (tradeId) => {
    try {
      await tradeService.rejectTrade(tradeId)
      await loadData()
    } catch (error) {
      console.error('Erro ao recusar troca:', error)
      toast.error('Erro ao recusar troca')
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


        {/* Sub-abas de Empréstimos */}
        {activeTab === 'loans' && (
          <div className="flex space-x-2 mb-6 border-b border-slate-800 overflow-x-auto">
            <button
              onClick={() => setLoanSubTab('pending')}
              className={`px-4 py-2 font-medium transition-colors text-sm whitespace-nowrap ${
                loanSubTab === 'pending'
                  ? 'text-purple-400 border-b-2 border-purple-400'
                  : 'text-gray-400 hover:text-gray-300'
              }`}
            >
              Pendentes
              {loanRequests.length > 0 && (
                <span className="ml-2 px-2 py-0.5 bg-yellow-500/20 text-yellow-400 rounded-full text-xs">
                  {loanRequests.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setLoanSubTab('received')}
              className={`px-4 py-2 font-medium transition-colors text-sm whitespace-nowrap ${
                loanSubTab === 'received'
                  ? 'text-purple-400 border-b-2 border-purple-400'
                  : 'text-gray-400 hover:text-gray-300'
              }`}
            >
              Recebidos
              {loanReceived.length > 0 && (
                <span className="ml-2 px-2 py-0.5 bg-blue-500/20 text-blue-400 rounded-full text-xs">
                  {loanReceived.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setLoanSubTab('sent')}
              className={`px-4 py-2 font-medium transition-colors text-sm whitespace-nowrap ${
                loanSubTab === 'sent'
                  ? 'text-purple-400 border-b-2 border-purple-400'
                  : 'text-gray-400 hover:text-gray-300'
              }`}
            >
              Feitos
              {loanSent.length > 0 && (
                <span className="ml-2 px-2 py-0.5 bg-purple-500/20 text-purple-400 rounded-full text-xs">
                  {loanSent.length}
                </span>
              )}
            </button>
          </div>
        )}

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

        {activeTab === 'donations' && donationSubTab === 'pending' && (
          <div className="space-y-4">
            {donationRequests.length === 0 ? (
              <div className="bg-slate-900 rounded-xl shadow-lg p-6 border border-slate-800">
                <div className="text-center py-8">
                  <Gift className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-400">Nenhuma solicitação de doação pendente</p>
                </div>
              </div>
            ) : (
              donationRequests.map((donation) => (
                <Link
                  key={donation._id}
                  to={`/donations/${donation._id}`}
                  className="block bg-slate-900 rounded-xl shadow-lg p-6 border border-slate-800 hover:border-green-500 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4 flex-1">
                      {donation.product?.images?.[0] ? (
                        <img 
                          src={getImageUrl(donation.product.images[0])} 
                          alt={donation.product.name} 
                          className="w-16 h-16 rounded-lg object-cover" 
                        />
                      ) : (
                        <div className="w-16 h-16 bg-slate-800 rounded-lg flex items-center justify-center">
                          <Package className="w-8 h-8 text-gray-400" />
                        </div>
                      )}
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <Gift size={20} className="text-green-400" />
                          <h3 className="text-lg font-semibold text-gray-100">{donation.product?.name}</h3>
                        </div>
                        <p className="text-sm text-gray-400">
                          <span className="font-semibold text-gray-300">{donation.fromUser?.name || 'Usuário'}</span> quer receber sua doação
                        </p>
                        <div className="flex items-center space-x-2 mt-2">
                          <span className="px-2 py-1 rounded-full text-xs font-medium bg-yellow-500/20 text-yellow-400">
                            Pendente
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(donation.createdAt).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                    </div>
                  </div>
                </Link>
              ))
            )}
          </div>
        )}

        {false && (
          <div className="space-y-4">
            {donationReceived.length === 0 ? (
              <div className="bg-slate-900 rounded-xl shadow-lg p-6 border border-slate-800">
                <div className="text-center py-8">
                  <Gift className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-400">Você ainda não recebeu nenhuma doação aceita</p>
                </div>
              </div>
            ) : (
              donationReceived.map((donation) => (
                <Link
                  key={donation._id}
                  to={`/donations/${donation._id}`}
                  className="block bg-slate-900 rounded-xl shadow-lg p-6 border border-slate-800 hover:border-green-500 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4 flex-1">
                      {donation.product?.images?.[0] ? (
                        <img 
                          src={getImageUrl(donation.product.images[0])} 
                          alt={donation.product.name} 
                          className="w-16 h-16 rounded-lg object-cover" 
                        />
                      ) : (
                        <div className="w-16 h-16 bg-slate-800 rounded-lg flex items-center justify-center">
                          <Package className="w-8 h-8 text-gray-400" />
                        </div>
                      )}
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <Gift size={20} className="text-green-400" />
                          <h3 className="text-lg font-semibold text-gray-100">{donation.product?.name}</h3>
                        </div>
                        <p className="text-sm text-gray-400">
                          Você vai receber esta doação de <span className="font-semibold text-gray-300">{donation.toUser?.name || 'Usuário'}</span>
                        </p>
                        <div className="flex items-center space-x-2 mt-2 flex-wrap">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            donation.status === 'confirmed' ? 'bg-green-500/20 text-green-400' :
                            'bg-blue-500/20 text-blue-400'
                          }`}>
                            {donation.status === 'confirmed' ? 'Confirmada' : 'Aceita'}
                          </span>
                          {donation.status === 'accepted' && (
                            <>
                              <span className="text-xs text-blue-400 flex items-center">
                                <MessageCircle size={12} className="mr-1" />
                                Conversa ativa
                              </span>
                              <span className="text-xs text-orange-400">
                                Aguardando você confirmar recebimento
                              </span>
                            </>
                          )}
                          {donation.status === 'confirmed' && (
                            <span className="text-xs text-green-400 flex items-center">
                              <Check size={12} className="mr-1" />
                              Recebimento confirmado
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(donation.createdAt).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                    </div>
                  </div>
                </Link>
              ))
            )}
          </div>
        )}

        {false && (
          <div className="space-y-4">
            {donationSent.length === 0 ? (
              <div className="bg-slate-900 rounded-xl shadow-lg p-6 border border-slate-800">
                <div className="text-center py-8">
                  <Gift className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-400">Você ainda não solicitou nenhuma doação</p>
                </div>
              </div>
            ) : (
              donationSent.map((donation) => (
                <Link
                  key={donation._id}
                  to={`/donations/${donation._id}`}
                  className="block bg-slate-900 rounded-xl shadow-lg p-6 border border-slate-800 hover:border-green-500 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4 flex-1">
                      {donation.product?.images?.[0] ? (
                        <img 
                          src={getImageUrl(donation.product.images[0])} 
                          alt={donation.product.name} 
                          className="w-16 h-16 rounded-lg object-cover" 
                        />
                      ) : (
                        <div className="w-16 h-16 bg-slate-800 rounded-lg flex items-center justify-center">
                          <Package className="w-8 h-8 text-gray-400" />
                        </div>
                      )}
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <Gift size={20} className="text-green-400" />
                          <h3 className="text-lg font-semibold text-gray-100">{donation.product?.name}</h3>
                        </div>
                        <p className="text-sm text-gray-400">
                          Você doou para <span className="font-semibold text-gray-300">{donation.fromUser?.name || 'Usuário'}</span>
                        </p>
                        <div className="flex items-center space-x-2 mt-2">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            donation.status === 'confirmed' ? 'bg-green-500/20 text-green-400' :
                            donation.status === 'accepted' ? 'bg-blue-500/20 text-blue-400' :
                            donation.status === 'rejected' ? 'bg-red-500/20 text-red-400' :
                            'bg-yellow-500/20 text-yellow-400'
                          }`}>
                            {donation.status === 'confirmed' ? 'Confirmada' :
                             donation.status === 'accepted' ? 'Aceita' :
                             donation.status === 'rejected' ? 'Recusada' :
                             'Pendente'}
                          </span>
                          {donation.status === 'accepted' && (
                            <>
                              <span className="text-xs text-blue-400 flex items-center">
                                <MessageCircle size={12} className="mr-1" />
                                Conversa ativa
                              </span>
                              <span className="text-xs text-gray-400">
                                Aguardando confirmação de recebimento
                              </span>
                            </>
                          )}
                          {donation.status === 'confirmed' && (
                            <span className="text-xs text-green-400 flex items-center">
                              <Check size={12} className="mr-1" />
                              Recebimento confirmado pelo receptor
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(donation.createdAt).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                    </div>
                  </div>
                </Link>
              ))
            )}
          </div>
        )}

        {/* Seção de Empréstimos */}
        {activeTab === 'loans' && loanSubTab === 'pending' && (
          <div className="space-y-4">
            {loanRequests.length === 0 ? (
              <div className="bg-slate-900 rounded-xl shadow-lg p-6 border border-slate-800">
                <div className="text-center py-8">
                  <Handshake className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-400">Nenhum empréstimo pendente</p>
                </div>
              </div>
            ) : (
              loanRequests.map((loan) => (
                <Link
                  key={loan._id}
                  to={`/loans/${loan._id}`}
                  className="block bg-slate-900 rounded-xl shadow-lg p-6 border border-slate-800 hover:border-purple-500 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4 flex-1">
                      {loan.product?.images?.[0] ? (
                        <img 
                          src={getImageUrl(loan.product.images[0])} 
                          alt={loan.product.name} 
                          className="w-16 h-16 rounded-lg object-cover" 
                        />
                      ) : (
                        <div className="w-16 h-16 bg-slate-800 rounded-lg flex items-center justify-center">
                          <Handshake className="w-8 h-8 text-purple-400" />
                        </div>
                      )}
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <Handshake size={20} className="text-purple-400" />
                          <h3 className="text-lg font-semibold text-gray-100">
                            {loan.product?.name || loan.itemName}
                          </h3>
                        </div>
                        <p className="text-sm text-gray-400">
                          {loan.status === 'offered' 
                            ? `Oferta de ${loan.lender?.name || 'Usuário'}`
                            : `Solicitado por ${loan.requester?.name || 'Usuário'}`}
                        </p>
                        <div className="flex items-center space-x-2 mt-2">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            loan.status === 'offered' ? 'bg-purple-500/20 text-purple-400' :
                            'bg-yellow-500/20 text-yellow-400'
                          }`}>
                            {loan.status === 'offered' ? 'Oferta recebida' : 'Pendente'}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(loan.createdAt).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                    </div>
                  </div>
                </Link>
              ))
            )}
          </div>
        )}

        {activeTab === 'loans' && loanSubTab === 'received' && (
          <div className="space-y-4">
            {loanReceived.length === 0 ? (
              <div className="bg-slate-900 rounded-xl shadow-lg p-6 border border-slate-800">
                <div className="text-center py-8">
                  <Handshake className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-400">Você ainda não recebeu nenhum empréstimo aceito</p>
                </div>
              </div>
            ) : (
              loanReceived.map((loan) => (
                <Link
                  key={loan._id}
                  to={`/loans/${loan._id}`}
                  className="block bg-slate-900 rounded-xl shadow-lg p-6 border border-slate-800 hover:border-purple-500 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4 flex-1">
                      {loan.product?.images?.[0] ? (
                        <img 
                          src={getImageUrl(loan.product.images[0])} 
                          alt={loan.product.name} 
                          className="w-16 h-16 rounded-lg object-cover" 
                        />
                      ) : (
                        <div className="w-16 h-16 bg-slate-800 rounded-lg flex items-center justify-center">
                          <Handshake className="w-8 h-8 text-purple-400" />
                        </div>
                      )}
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <Handshake size={20} className="text-purple-400" />
                          <h3 className="text-lg font-semibold text-gray-100">
                            {loan.product?.name || loan.itemName}
                          </h3>
                        </div>
                        <p className="text-sm text-gray-400">
                          Emprestado por <span className="font-semibold text-gray-300">{loan.lender?.name || 'Usuário'}</span>
                        </p>
                        <div className="flex items-center space-x-2 mt-2 flex-wrap">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            loan.status === 'confirmed' ? 'bg-green-500/20 text-green-400' :
                            'bg-blue-500/20 text-blue-400'
                          }`}>
                            {loan.status === 'confirmed' ? 'Confirmado' : 'Aceito'}
                          </span>
                          {loan.status === 'accepted' && (
                            <>
                              <span className="text-xs text-blue-400 flex items-center">
                                <MessageCircle size={12} className="mr-1" />
                                Conversa ativa
                              </span>
                              <span className="text-xs text-orange-400">
                                Aguardando você confirmar recebimento
                              </span>
                            </>
                          )}
                          {loan.status === 'confirmed' && (
                            <span className="text-xs text-green-400 flex items-center">
                              <Check size={12} className="mr-1" />
                              Recebimento confirmado
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(loan.createdAt).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                    </div>
                  </div>
                </Link>
              ))
            )}
          </div>
        )}

        {activeTab === 'loans' && loanSubTab === 'sent' && (
          <div className="space-y-4">
            {loanSent.length === 0 ? (
              <div className="bg-slate-900 rounded-xl shadow-lg p-6 border border-slate-800">
                <div className="text-center py-8">
                  <Handshake className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-400">Você ainda não emprestou nenhum produto</p>
                </div>
              </div>
            ) : (
              loanSent.map((loan) => (
                <Link
                  key={loan._id}
                  to={`/loans/${loan._id}`}
                  className="block bg-slate-900 rounded-xl shadow-lg p-6 border border-slate-800 hover:border-purple-500 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4 flex-1">
                      {loan.product?.images?.[0] ? (
                        <img 
                          src={getImageUrl(loan.product.images[0])} 
                          alt={loan.product.name} 
                          className="w-16 h-16 rounded-lg object-cover" 
                        />
                      ) : (
                        <div className="w-16 h-16 bg-slate-800 rounded-lg flex items-center justify-center">
                          <Handshake className="w-8 h-8 text-purple-400" />
                        </div>
                      )}
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <Handshake size={20} className="text-purple-400" />
                          <h3 className="text-lg font-semibold text-gray-100">
                            {loan.product?.name || loan.itemName}
                          </h3>
                        </div>
                        <p className="text-sm text-gray-400">
                          Emprestado para <span className="font-semibold text-gray-300">{loan.requester?.name || 'Usuário'}</span>
                        </p>
                        <div className="flex items-center space-x-2 mt-2">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            loan.status === 'confirmed' ? 'bg-green-500/20 text-green-400' :
                            loan.status === 'accepted' ? 'bg-blue-500/20 text-blue-400' :
                            loan.status === 'offered' ? 'bg-purple-500/20 text-purple-400' :
                            'bg-yellow-500/20 text-yellow-400'
                          }`}>
                            {loan.status === 'confirmed' ? 'Confirmado' :
                             loan.status === 'accepted' ? 'Aceito' :
                             loan.status === 'offered' ? 'Oferta enviada' :
                             'Pendente'}
                          </span>
                          {loan.status === 'accepted' && (
                            <>
                              <span className="text-xs text-blue-400 flex items-center">
                                <MessageCircle size={12} className="mr-1" />
                                Conversa ativa
                              </span>
                              <span className="text-xs text-gray-400">
                                Aguardando confirmação de recebimento
                              </span>
                            </>
                          )}
                          {loan.status === 'confirmed' && (
                            <span className="text-xs text-green-400 flex items-center">
                              <Check size={12} className="mr-1" />
                              Recebimento confirmado pelo receptor
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(loan.createdAt).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                    </div>
                  </div>
                </Link>
              ))
            )}
          </div>
        )}
      </div>

      <ConfirmDialog
        isOpen={confirmDialog.isOpen && confirmDialog.action === 'deleteProduct'}
        onClose={() => setConfirmDialog({ isOpen: false, action: null, data: null })}
        onConfirm={confirmDeleteProduct}
        title="Remover produto"
        message="Tem certeza que deseja remover este produto? Esta ação não pode ser desfeita."
        confirmText="Remover"
        cancelText="Cancelar"
        type="danger"
      />

      {/* Bottom Navigation */}
      <BottomNavigation />
    </div>
  )
}

export default Trades
