import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Check, Handshake, User, MessageCircle, Send, X } from 'lucide-react'
import BottomNavigation from '../components/BottomNavigation'
import { loanService } from '../services/loanService'
import { useAuth } from '../contexts/AuthContext'
import { getImageUrl } from '../utils/imageUtils'

const LoanDetails = () => {
  const { loanId } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [loan, setLoan] = useState(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [error, setError] = useState('')
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState('')
  const [sendingMessage, setSendingMessage] = useState(false)
  const messagesEndRef = useRef(null)

  useEffect(() => {
    if (loanId && user) {
      loadLoan()
    }
  }, [loanId, user])
  
  useEffect(() => {
    // Só carrega mensagens se o empréstimo existir e estiver aceito
    if (loan && loanId && (loan.status === 'accepted' || loan.status === 'confirmed')) {
      loadMessages()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loan?.status, loanId])

  useEffect(() => {
    // Polling para atualizar mensagens a cada 3 segundos quando empréstimo estiver aceito
    if (!loan || !loanId) return
    if (loan.status !== 'accepted' && loan.status !== 'confirmed') return
    
    const interval = setInterval(() => {
      loadMessages()
    }, 3000)
    
    return () => clearInterval(interval)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loan?.status, loanId])
  
  useEffect(() => {
    // Scroll para o final das mensagens quando novas mensagens chegarem
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const loadLoan = async () => {
    if (!loanId) return
    
    try {
      setLoading(true)
      setError('')
      
      // Tenta buscar o empréstimo diretamente pelo ID
      try {
        const loanData = await loanService.getLoan(loanId)
        setLoan(loanData)
        
        // Se o empréstimo estiver aceito ou confirmado, carrega mensagens
        if (loanData.status === 'accepted' || loanData.status === 'confirmed') {
          loadMessages()
        }
        return
      } catch (directError) {
        console.log('Tentando buscar empréstimo em lista...', directError)
        // Se falhar, tenta buscar na lista
      }
      
      // Fallback: Busca em received e sent
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
      
      const loanData = [...received, ...sent].find(l => {
        const lId = String(l._id || '')
        const searchId = String(loanId || '')
        return lId === searchId
      })
      
      if (!loanData) {
        setError('Empréstimo não encontrado')
        setLoading(false)
        return
      }
      
      setLoan(loanData)
      
      // Se o empréstimo estiver aceito ou confirmado, carrega mensagens
      if (loanData.status === 'accepted' || loanData.status === 'confirmed') {
        loadMessages()
      }
    } catch (error) {
      console.error('Erro ao carregar empréstimo:', error)
      setError(error.response?.data?.message || 'Erro ao carregar detalhes do empréstimo')
    } finally {
      setLoading(false)
    }
  }

  const loadMessages = async () => {
    const idToUse = loanId || loan?._id
    if (!idToUse) return
    
    try {
      const messagesData = await loanService.getMessages(idToUse)
      setMessages(messagesData || [])
    } catch (error) {
      console.error('Erro ao carregar mensagens:', error)
      // Não mostra erro se o empréstimo ainda não foi aceito ou se não há mensagens ainda
      if (error.response?.status !== 404) {
        console.warn('Não foi possível carregar mensagens')
      }
    }
  }

  const handleSendMessage = async (e) => {
    e.preventDefault()
    if (!newMessage.trim() || sendingMessage) return

    setSendingMessage(true)
    try {
      await loanService.sendMessage(loanId, newMessage)
      setNewMessage('')
      await loadMessages()
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error)
      alert(error.response?.data?.message || 'Erro ao enviar mensagem')
    } finally {
      setSendingMessage(false)
    }
  }

  const handleAccept = async () => {
    if (!confirm('Tem certeza que deseja aceitar esta oferta de empréstimo?')) return

    setActionLoading(true)
    try {
      await loanService.acceptLoan(loanId)
      await loadLoan()
      await loadMessages()
      alert('Oferta aceita! Uma conversa foi iniciada para combinar os detalhes.')
    } catch (err) {
      setError(err.response?.data?.message || 'Erro ao aceitar oferta')
    } finally {
      setActionLoading(false)
    }
  }

  const handleConfirmReceived = async () => {
    if (!confirm('Tem certeza que você recebeu o produto? Esta ação não pode ser desfeita.')) return

    setActionLoading(true)
    try {
      await loanService.confirmReceived(loanId)
      await loadLoan()
      alert('Recebimento confirmado com sucesso!')
    } catch (err) {
      setError(err.response?.data?.message || 'Erro ao confirmar recebimento')
    } finally {
      setActionLoading(false)
    }
  }

  const handleCancel = async () => {
    if (!confirm('Tem certeza que deseja cancelar este pedido de empréstimo?')) return

    setActionLoading(true)
    try {
      await loanService.cancelLoan(loanId)
      alert('Pedido cancelado com sucesso!')
      navigate(-1)
    } catch (err) {
      setError(err.response?.data?.message || 'Erro ao cancelar pedido')
    } finally {
      setActionLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  if (error && !loan) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-400 mb-4">{error}</p>
          <button onClick={() => navigate(-1)} className="btn-primary">
            Voltar
          </button>
        </div>
      </div>
    )
  }

  if (!loan) return null

  const currentUserId = user?._id?.toString() || user?._id
  const loanRequesterId = loan.requesterId?.toString() || loan.requesterId
  const loanLenderId = loan.lenderId?.toString() || loan.lenderId
  const isRequester = currentUserId === loanRequesterId
  const isLender = currentUserId === loanLenderId
  const canChat = loan.status === 'accepted' || loan.status === 'confirmed'
  const canConfirmReceived = isRequester && loan.status === 'accepted'
  const canCancel = isRequester && (loan.status === 'pending' || loan.status === 'offered')
  const canAcceptOffer = isRequester && loan.status === 'offered'

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
            <h1 className="text-xl font-bold text-gray-100">Detalhes do Empréstimo</h1>
            <div className="w-6"></div>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6">
        {/* Informações do Empréstimo */}
        <div className="bg-slate-900 rounded-lg border border-slate-800 p-6 mb-6">
          <div className="flex items-center space-x-4 mb-4">
            {loan.product?.images?.[0] ? (
              <img
                src={getImageUrl(loan.product.images[0])}
                alt={loan.product.name}
                className="w-20 h-20 rounded-lg object-cover"
              />
            ) : (
              <div className="w-20 h-20 bg-slate-800 rounded-lg flex items-center justify-center">
                <Handshake size={32} className="text-purple-400" />
              </div>
            )}
            <div className="flex-1">
              <h2 className="text-xl font-semibold text-gray-100 mb-1">
                {loan.product?.name || loan.itemName}
              </h2>
              <p className="text-sm text-gray-400">
                {isRequester 
                  ? `Ofertado por ${loan.lender?.name || 'Usuário'}`
                  : `Solicitado por ${loan.requester?.name || 'Usuário'}`}
              </p>
              {canConfirmReceived && (
                <p className="text-xs text-blue-400 mt-1">
                  ✓ Empréstimo aceito! Combine os detalhes da entrega e confirme quando receber.
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between mb-4">
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
              loan.status === 'confirmed' ? 'bg-green-500/20 text-green-400' :
              loan.status === 'accepted' ? 'bg-blue-500/20 text-blue-400' :
              loan.status === 'offered' ? 'bg-purple-500/20 text-purple-400' :
              loan.status === 'cancelled' ? 'bg-red-500/20 text-red-400' :
              'bg-yellow-500/20 text-yellow-400'
            }`}>
              {loan.status === 'confirmed' ? 'Confirmado' :
               loan.status === 'accepted' ? 'Aceito - Aguardando confirmação' :
               loan.status === 'offered' ? 'Oferta recebida' :
               loan.status === 'cancelled' ? 'Cancelado' :
               'Pendente'}
            </span>
            <p className="text-xs text-gray-400">
              {new Date(loan.createdAt).toLocaleDateString('pt-BR')}
            </p>
          </div>

          {/* Botões de Ação */}
          {canAcceptOffer && (
            <div className="flex space-x-3 mb-4">
              <button
                onClick={handleAccept}
                disabled={actionLoading}
                className="flex-1 btn-primary disabled:opacity-50"
              >
                {actionLoading ? 'Processando...' : 'Aceitar Oferta'}
              </button>
            </div>
          )}

          {canCancel && (
            <div className="flex space-x-3 mb-4">
              <button
                onClick={handleCancel}
                disabled={actionLoading}
                className="flex-1 btn-secondary bg-red-500/20 hover:bg-red-500/30 text-red-400 border-red-500/30 disabled:opacity-50 flex items-center justify-center space-x-2"
              >
                <X size={20} />
                <span>Cancelar Pedido</span>
              </button>
            </div>
          )}

          {canConfirmReceived && (
            <div className="mt-4 p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
              <div className="flex items-start space-x-3 mb-3">
                <div className="flex-shrink-0">
                  <Handshake size={24} className="text-green-400" />
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-semibold text-green-400 mb-1">
                    Aguardando sua confirmação
                  </h3>
                  <p className="text-xs text-gray-300">
                    Após receber o produto, clique no botão abaixo para confirmar o recebimento e finalizar o empréstimo.
                  </p>
                </div>
              </div>
              <button
                onClick={handleConfirmReceived}
                disabled={actionLoading}
                className="w-full btn-primary bg-green-500 hover:bg-green-600 disabled:opacity-50 flex items-center justify-center space-x-2"
              >
                {actionLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Processando...</span>
                  </>
                ) : (
                  <>
                    <Check size={20} />
                    <span>Confirmar que Recebi o Produto</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>

        {/* Chat */}
        {canChat ? (
          <div className="bg-slate-900 rounded-lg border border-slate-800 p-4 mb-6">
            <div className="flex items-center space-x-2 mb-4">
              <MessageCircle size={20} className="text-blue-400" />
              <h3 className="text-lg font-semibold text-gray-100">Conversa</h3>
            </div>

            {/* Mensagens */}
            <div className="h-64 overflow-y-auto mb-4 space-y-3 pr-2">
              {messages.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  <p>Nenhuma mensagem ainda. Inicie a conversa!</p>
                </div>
              ) : (
                messages.map((msg) => {
                  const isOwnMessage = String(msg.userId) === String(currentUserId)
                  return (
                    <div
                      key={msg._id}
                      className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[80%] rounded-lg p-3 ${
                          isOwnMessage
                            ? 'bg-blue-500 text-white'
                            : 'bg-slate-800 text-gray-100'
                        }`}
                      >
                        {!isOwnMessage && (
                          <p className="text-xs font-semibold mb-1 opacity-80">
                            {msg.user?.name || 'Usuário'}
                          </p>
                        )}
                        <p className="text-sm">{msg.message}</p>
                        <p className={`text-xs mt-1 ${isOwnMessage ? 'text-blue-100' : 'text-gray-400'}`}>
                          {new Date(msg.createdAt).toLocaleTimeString('pt-BR', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                    </div>
                  )
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input de Mensagem */}
            <form onSubmit={handleSendMessage} className="flex space-x-2">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Digite sua mensagem..."
                className="flex-1 input-field"
                disabled={sendingMessage}
              />
              <button
                type="submit"
                disabled={!newMessage.trim() || sendingMessage}
                className="btn-primary disabled:opacity-50"
              >
                <Send size={20} />
              </button>
            </form>
          </div>
        ) : (
          <div className="bg-slate-900 rounded-lg border border-slate-800 p-6 mb-6 text-center">
            <MessageCircle size={48} className="text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400">
              {loan.status === 'pending' && isRequester
                ? 'Aguarde alguém oferecer um produto para seu pedido de empréstimo'
                : loan.status === 'offered' && isRequester
                ? 'Aceite a oferta para iniciar a conversa e combinar os detalhes da entrega'
                : loan.status === 'pending' && isLender
                ? 'Aguarde o solicitante aceitar sua oferta. Após a aceitação, você poderá conversar e combinar os detalhes.'
                : 'A conversa será habilitada após o empréstimo ser aceito'}
            </p>
          </div>
        )}

        {error && (
          <div className="bg-red-900/30 border border-red-800 rounded-lg p-4 text-red-400 text-sm mb-6">
            {error}
          </div>
        )}
      </main>

      <BottomNavigation />
    </div>
  )
}

export default LoanDetails

