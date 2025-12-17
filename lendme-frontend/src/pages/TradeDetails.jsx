import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Check, X, Package, User, MessageCircle, Send } from 'lucide-react'
import BottomNavigation from '../components/BottomNavigation'
import ConfirmDialog from '../components/ConfirmDialog'
import { useToast } from '../contexts/ToastContext'
import { tradeService } from '../services/tradeService'
import { tradeMessageService } from '../services/tradeMessageService'
import { useAuth } from '../contexts/AuthContext'
import { getImageUrl } from '../utils/imageUtils'

const TradeDetails = () => {
  const { tradeId } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const toast = useToast()
  const [trade, setTrade] = useState(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [error, setError] = useState('')
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState('')
  const [sendingMessage, setSendingMessage] = useState(false)
  const messagesEndRef = useRef(null)
  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, action: null })

  useEffect(() => {
    loadTrade()
    loadMessages()
  }, [tradeId])

  useEffect(() => {
    // Polling para atualizar mensagens a cada 3 segundos quando troca estiver aceita ou pendente
    if (!trade) return
    
    const interval = setInterval(() => {
      if (trade.status === 'accepted' || trade.status === 'pending') {
        loadMessages()
      }
    }, 3000)
    
    return () => clearInterval(interval)
  }, [trade, tradeId])
  
  useEffect(() => {
    // Scroll para o final das mensagens quando novas mensagens chegarem
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const loadTrade = async () => {
    try {
      setLoading(true)
      const tradeData = await tradeService.getTrade(tradeId)
      setTrade(tradeData)
    } catch (error) {
      console.error('Erro ao carregar troca:', error)
      if (error.response?.status === 404) {
        setError('Troca não encontrada')
      } else {
        setError('Erro ao carregar detalhes da troca')
      }
    } finally {
      setLoading(false)
    }
  }

  const loadMessages = async () => {
    try {
      const messagesData = await tradeMessageService.getMessages(tradeId)
      setMessages(messagesData || [])
    } catch (error) {
      console.error('Erro ao carregar mensagens:', error)
    }
  }

  const handleSendMessage = async (e) => {
    e.preventDefault()
    if (!newMessage.trim() || sendingMessage) return

    setSendingMessage(true)
    try {
      await tradeMessageService.sendMessage(tradeId, newMessage)
      setNewMessage('')
      await loadMessages()
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error)
      toast.error('Erro ao enviar mensagem')
    } finally {
      setSendingMessage(false)
    }
  }

  const handleAccept = () => {
    setConfirmDialog({ isOpen: true, action: 'accept' })
  }

  const confirmAccept = async () => {
    setActionLoading(true)
    try {
      await tradeService.acceptTrade(tradeId)
      await loadTrade()
      toast.success('Troca aceita com sucesso!')
    } catch (err) {
      setError(err.response?.data?.message || 'Erro ao aceitar troca')
    } finally {
      setActionLoading(false)
      setConfirmDialog({ isOpen: false, action: null })
    }
  }

  const handleReject = () => {
    setConfirmDialog({ isOpen: true, action: 'reject' })
  }

  const confirmReject = async () => {
    setActionLoading(true)
    try {
      await tradeService.rejectTrade(tradeId)
      navigate('/trades')
    } catch (err) {
      setError(err.response?.data?.message || 'Erro ao recusar troca')
    } finally {
      setActionLoading(false)
      setConfirmDialog({ isOpen: false, action: null })
    }
  }

  const handleComplete = () => {
    setConfirmDialog({ isOpen: true, action: 'complete' })
  }

  const confirmComplete = async () => {
    setActionLoading(true)
    try {
      await tradeService.completeTrade(tradeId)
      await loadTrade()
      toast.success('Troca marcada como concluída!')
    } catch (err) {
      setError(err.response?.data?.message || 'Erro ao concluir troca')
    } finally {
      setActionLoading(false)
      setConfirmDialog({ isOpen: false, action: null })
    }
  }

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { label: 'Pendente', color: 'bg-yellow-500/20 text-yellow-400' },
      accepted: { label: 'Aceita', color: 'bg-blue-500/20 text-blue-400' },
      rejected: { label: 'Recusada', color: 'bg-red-500/20 text-red-400' },
      completed: { label: 'Concluída', color: 'bg-green-500/20 text-green-400' }
    }
    const config = statusConfig[status] || statusConfig.pending
    return (
      <span className={`px-3 py-1 rounded-full text-sm font-medium ${config.color}`}>
        {config.label}
      </span>
    )
  }

  const currentUserId = user?._id?.toString ? user._id.toString() : user?._id
  const fromUserId = trade?.fromUserId?.toString ? trade.fromUserId.toString() : trade?.fromUserId
  const toUserId = trade?.toUserId?.toString ? trade.toUserId.toString() : trade?.toUserId
  
  const isFromUser = currentUserId === fromUserId
  const isToUser = currentUserId === toUserId
  const canAccept = isToUser && trade?.status === 'pending'
  const canReject = (isFromUser || isToUser) && trade?.status === 'pending'
  const canComplete = (isFromUser || isToUser) && trade?.status === 'accepted'

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  if (!trade || error) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-400 mb-4">{error || 'Troca não encontrada'}</p>
          <button onClick={() => navigate('/trades')} className="btn-primary">
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
            <h1 className="text-xl font-bold text-gray-100">Detalhes da Troca</h1>
            <div className="w-6"></div>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6">
        {/* Status */}
        <div className="card mb-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-100">Status</h2>
            {getStatusBadge(trade.status)}
          </div>
          <p className="text-sm text-gray-400 mt-2">
            Criada em {new Date(trade.createdAt).toLocaleDateString('pt-BR')}
          </p>
        </div>

        {/* Produto que você oferece */}
        <div className="card mb-6">
          <div className="flex items-center space-x-2 mb-4">
            <User size={20} className="text-blue-400" />
            <h2 className="text-lg font-semibold text-gray-100">
              {isFromUser ? 'Seu produto' : `${trade.fromUser?.name || 'Usuário'}`}
            </h2>
          </div>
          <div className="flex items-center space-x-4">
            {trade.fromProduct?.images?.[0] ? (
              <img 
                src={getImageUrl(trade.fromProduct.images[0])} 
                alt={trade.fromProduct.name}
                className="w-24 h-24 rounded-lg object-cover"
              />
            ) : (
              <div className="w-24 h-24 bg-slate-800 rounded-lg flex items-center justify-center">
                <Package size={32} className="text-gray-400" />
              </div>
            )}
            <div className="flex-1">
              <h3 className="font-semibold text-gray-100">{trade.fromProduct?.name}</h3>
              <p className="text-sm text-gray-400">{trade.fromProduct?.category}</p>
              {trade.fromProduct?.description && (
                <p className="text-xs text-gray-500 mt-1">{trade.fromProduct.description}</p>
              )}
            </div>
          </div>
        </div>

        {/* Seta */}
        <div className="flex justify-center mb-6">
          <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center">
            <span className="text-2xl">⇄</span>
          </div>
        </div>

        {/* Produto que você recebe */}
        <div className="card mb-6">
          <div className="flex items-center space-x-2 mb-4">
            <User size={20} className="text-green-400" />
            <h2 className="text-lg font-semibold text-gray-100">
              {isToUser ? 'Seu produto' : `${trade.toUser?.name || 'Usuário'}`}
            </h2>
          </div>
          <div className="flex items-center space-x-4">
            {trade.toProduct?.images?.[0] ? (
              <img 
                src={getImageUrl(trade.toProduct.images[0])} 
                alt={trade.toProduct.name}
                className="w-24 h-24 rounded-lg object-cover"
              />
            ) : (
              <div className="w-24 h-24 bg-slate-800 rounded-lg flex items-center justify-center">
                <Package size={32} className="text-gray-400" />
              </div>
            )}
            <div className="flex-1">
              <h3 className="font-semibold text-gray-100">{trade.toProduct?.name}</h3>
              <p className="text-sm text-gray-400">{trade.toProduct?.category}</p>
              {trade.toProduct?.description && (
                <p className="text-xs text-gray-500 mt-1">{trade.toProduct.description}</p>
              )}
            </div>
          </div>
        </div>

        {/* Chat de Mensagens - Apenas para trocas aceitas ou pendentes */}
        {(trade.status === 'accepted' || trade.status === 'pending') && (
          <div className="card mb-6">
            <div className="flex items-center space-x-2 mb-4">
              <MessageCircle size={20} className="text-blue-400" />
              <h2 className="text-lg font-semibold text-gray-100">Conversa sobre a Troca</h2>
            </div>
            
            {/* Área de mensagens */}
            <div className="bg-slate-800 rounded-lg p-4 mb-4 h-64 overflow-y-auto space-y-3">
              {messages.length === 0 ? (
                <div className="text-center text-gray-400 py-8">
                  <MessageCircle size={32} className="mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Nenhuma mensagem ainda. Comece a conversar!</p>
                </div>
              ) : (
                messages.map((msg) => {
                  const isOwnMessage = (msg.userId?.toString() || msg.userId) === (user?._id?.toString() || user?._id)
                  return (
                    <div
                      key={msg._id}
                      className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[75%] rounded-lg p-3 ${
                          isOwnMessage
                            ? 'bg-blue-500 text-white'
                            : 'bg-slate-700 text-gray-100'
                        }`}
                      >
                        {!isOwnMessage && (
                          <p className="text-xs font-semibold mb-1 opacity-80">
                            {msg.user?.name || 'Usuário'}
                          </p>
                        )}
                        <p className="text-sm">{msg.message}</p>
                        <p className="text-xs opacity-70 mt-1">
                          {new Date(msg.createdAt).toLocaleTimeString('pt-BR', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>
                    </div>
                  )
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Formulário de envio */}
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
                className="btn-primary px-4 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {sendingMessage ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                ) : (
                  <Send size={20} />
                )}
              </button>
            </form>
          </div>
        )}

        {error && (
          <div className="mb-4 p-3 bg-red-900/30 border border-red-800 rounded-lg text-red-400 text-sm">
            {error}
          </div>
        )}

        {/* Ações */}
        <div className="space-y-3">
          {canAccept && (
            <button
              onClick={handleAccept}
              disabled={actionLoading}
              className="w-full btn-primary disabled:opacity-50"
            >
              <Check size={20} className="inline mr-2" />
              Aceitar Troca
            </button>
          )}

          {canReject && (
            <button
              onClick={handleReject}
              disabled={actionLoading}
              className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors disabled:opacity-50"
            >
              <X size={20} className="inline mr-2" />
              Recusar Troca
            </button>
          )}

          {canComplete && (
            <button
              onClick={handleComplete}
              disabled={actionLoading}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors disabled:opacity-50"
            >
              <Check size={20} className="inline mr-2" />
              Marcar como Concluída
            </button>
          )}
        </div>
      </main>

      <ConfirmDialog
        isOpen={confirmDialog.isOpen && confirmDialog.action === 'accept'}
        onClose={() => setConfirmDialog({ isOpen: false, action: null })}
        onConfirm={confirmAccept}
        title="Aceitar troca"
        message="Tem certeza que deseja aceitar esta troca?"
        confirmText="Aceitar"
        cancelText="Cancelar"
        type="success"
      />

      <ConfirmDialog
        isOpen={confirmDialog.isOpen && confirmDialog.action === 'reject'}
        onClose={() => setConfirmDialog({ isOpen: false, action: null })}
        onConfirm={confirmReject}
        title="Recusar troca"
        message="Tem certeza que deseja recusar esta troca?"
        confirmText="Recusar"
        cancelText="Cancelar"
        type="warning"
      />

      <ConfirmDialog
        isOpen={confirmDialog.isOpen && confirmDialog.action === 'complete'}
        onClose={() => setConfirmDialog({ isOpen: false, action: null })}
        onConfirm={confirmComplete}
        title="Confirmar conclusão"
        message="Confirmar que a troca foi concluída?"
        confirmText="Confirmar"
        cancelText="Cancelar"
        type="success"
      />

      <BottomNavigation />
    </div>
  )
}

export default TradeDetails

