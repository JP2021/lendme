import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Check, Gift, User, MessageCircle, Send } from 'lucide-react'
import BottomNavigation from '../components/BottomNavigation'
import ConfirmDialog from '../components/ConfirmDialog'
import { useToast } from '../contexts/ToastContext'
import { donationService } from '../services/donationService'
import { useAuth } from '../contexts/AuthContext'
import { getImageUrl } from '../utils/imageUtils'

const DonationDetails = () => {
  const { donationId } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const toast = useToast()
  const [donation, setDonation] = useState(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [error, setError] = useState('')
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState('')
  const [sendingMessage, setSendingMessage] = useState(false)
  const messagesEndRef = useRef(null)
  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, action: null })

  useEffect(() => {
    if (donationId && user) {
      loadDonation()
    }
  }, [donationId, user])
  
  useEffect(() => {
    // Só carrega mensagens se a doação existir e estiver aceita
    if (donation && donationId && (donation.status === 'accepted' || donation.status === 'confirmed')) {
      loadMessages()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [donation?.status, donationId])

  useEffect(() => {
    // Polling para atualizar mensagens a cada 3 segundos quando doação estiver aceita
    if (!donation || !donationId) return
    if (donation.status !== 'accepted' && donation.status !== 'confirmed') return
    
    const interval = setInterval(() => {
      loadMessages()
    }, 3000)
    
    return () => clearInterval(interval)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [donation?.status, donationId])
  
  useEffect(() => {
    // Scroll para o final das mensagens quando novas mensagens chegarem
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const loadDonation = async () => {
    if (!donationId) return
    
    try {
      setLoading(true)
      setError('')
      
      // Tenta buscar a doação diretamente pelo ID
      try {
        const donationData = await donationService.getDonation(donationId)
        setDonation(donationData)
        
        // Se a doação estiver aceita ou confirmada, carrega mensagens
        if (donationData.status === 'accepted' || donationData.status === 'confirmed') {
          loadMessages()
        }
        return
      } catch (directError) {
        console.log('Tentando buscar doação em lista...', directError)
        // Se falhar, tenta buscar na lista
      }
      
      // Fallback: Busca em received e sent
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
      
      const donationData = [...received, ...sent].find(d => {
        const dId = String(d._id || '')
        const searchId = String(donationId || '')
        return dId === searchId
      })
      
      if (!donationData) {
        setError('Doação não encontrada')
        setLoading(false)
        return
      }
      
      setDonation(donationData)
      
      // Se a doação estiver aceita ou confirmada, carrega mensagens
      if (donationData.status === 'accepted' || donationData.status === 'confirmed') {
        loadMessages()
      }
    } catch (error) {
      console.error('Erro ao carregar doação:', error)
      setError(error.response?.data?.message || 'Erro ao carregar detalhes da doação')
    } finally {
      setLoading(false)
    }
  }

  const loadMessages = async () => {
    const idToUse = donationId || donation?._id
    if (!idToUse) return
    
    try {
      const messagesData = await donationService.getMessages(idToUse)
      setMessages(messagesData || [])
    } catch (error) {
      console.error('Erro ao carregar mensagens:', error)
      // Não mostra erro se a doação ainda não foi aceita ou se não há mensagens ainda
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
      await donationService.sendMessage(donationId, newMessage)
      setNewMessage('')
      await loadMessages()
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error)
      toast.error(error.response?.data?.message || 'Erro ao enviar mensagem')
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
      await donationService.acceptDonation(donationId)
      await loadDonation()
      await loadMessages()
      toast.success('Doação aceita! Uma conversa foi iniciada para combinar os detalhes.')
    } catch (err) {
      setError(err.response?.data?.message || 'Erro ao aceitar doação')
    } finally {
      setActionLoading(false)
      setConfirmDialog({ isOpen: false, action: null })
    }
  }

  const handleConfirmReceived = () => {
    setConfirmDialog({ isOpen: true, action: 'confirmReceived' })
  }

  const confirmReceived = async () => {
    setActionLoading(true)
    try {
      await donationService.confirmReceived(donationId)
      await loadDonation()
      toast.success('Recebimento confirmado com sucesso!')
    } catch (err) {
      setError(err.response?.data?.message || 'Erro ao confirmar recebimento')
    } finally {
      setActionLoading(false)
      setConfirmDialog({ isOpen: false, action: null })
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  if (error && !donation) {
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

  if (!donation) return null

  const currentUserId = user?._id?.toString() || user?._id
  const donationToUserId = donation.toUserId?.toString() || donation.toUserId
  const donationFromUserId = donation.fromUserId?.toString() || donation.fromUserId
  const isOwner = currentUserId === donationToUserId
  const isReceiver = currentUserId === donationFromUserId
  const canChat = donation.status === 'accepted' || donation.status === 'confirmed'
  const canConfirmReceived = isReceiver && donation.status === 'accepted'

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
            <h1 className="text-xl font-bold text-gray-100">Detalhes da Doação</h1>
            <div className="w-6"></div>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6">
        {/* Informações da Doação */}
        <div className="bg-slate-900 rounded-lg border border-slate-800 p-6 mb-6">
          <div className="flex items-center space-x-4 mb-4">
            {donation.product?.images?.[0] ? (
              <img
                src={getImageUrl(donation.product.images[0])}
                alt={donation.product.name}
                className="w-20 h-20 rounded-lg object-cover"
              />
            ) : (
              <div className="w-20 h-20 bg-slate-800 rounded-lg flex items-center justify-center">
                <Gift size={32} className="text-gray-400" />
              </div>
            )}
            <div className="flex-1">
              <h2 className="text-xl font-semibold text-gray-100 mb-1">{donation.product?.name}</h2>
              <p className="text-sm text-gray-400">
                {isOwner 
                  ? `Solicitado por ${donation.fromUser?.name || 'Usuário'}`
                  : `Doando para ${donation.toUser?.name || 'Usuário'}`}
              </p>
              {isReceiver && donation.status === 'accepted' && (
                <p className="text-xs text-blue-400 mt-1">
                  ✓ Doação aceita! Combine os detalhes da entrega e confirme quando receber.
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between mb-4">
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
              donation.status === 'confirmed' ? 'bg-green-500/20 text-green-400' :
              donation.status === 'accepted' ? 'bg-blue-500/20 text-blue-400' :
              'bg-yellow-500/20 text-yellow-400'
            }`}>
              {donation.status === 'confirmed' ? 'Confirmada' :
               donation.status === 'accepted' ? 'Aceita - Aguardando confirmação' :
               'Pendente'}
            </span>
            <p className="text-xs text-gray-400">
              {new Date(donation.createdAt).toLocaleDateString('pt-BR')}
            </p>
          </div>

          {/* Botões de Ação */}
          {donation.status === 'pending' && isOwner && (
            <div className="flex space-x-3">
              <button
                onClick={handleAccept}
                disabled={actionLoading}
                className="flex-1 btn-primary disabled:opacity-50"
              >
                {actionLoading ? 'Processando...' : 'Aceitar Doação'}
              </button>
            </div>
          )}

          {canConfirmReceived && (
            <div className="mt-4 p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
              <div className="flex items-start space-x-3 mb-3">
                <div className="flex-shrink-0">
                  <Gift size={24} className="text-green-400" />
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-semibold text-green-400 mb-1">
                    Aguardando sua confirmação
                  </h3>
                  <p className="text-xs text-gray-300">
                    Após receber o produto, clique no botão abaixo para confirmar o recebimento e finalizar a doação.
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
              {donation.status === 'pending' && isOwner
                ? 'Aceite a doação para iniciar a conversa e combinar os detalhes da entrega'
                : donation.status === 'pending' && isReceiver
                ? 'Aguarde o dono aceitar sua solicitação. Após a aceitação, você poderá conversar e combinar os detalhes.'
                : 'A conversa será habilitada após a doação ser aceita'}
            </p>
          </div>
        )}

        {error && (
          <div className="bg-red-900/30 border border-red-800 rounded-lg p-4 text-red-400 text-sm mb-6">
            {error}
          </div>
        )}
      </main>

      <ConfirmDialog
        isOpen={confirmDialog.isOpen && confirmDialog.action === 'accept'}
        onClose={() => setConfirmDialog({ isOpen: false, action: null })}
        onConfirm={confirmAccept}
        title="Aceitar doação"
        message="Tem certeza que deseja aceitar esta doação?"
        confirmText="Aceitar"
        cancelText="Cancelar"
        type="success"
      />

      <ConfirmDialog
        isOpen={confirmDialog.isOpen && confirmDialog.action === 'confirmReceived'}
        onClose={() => setConfirmDialog({ isOpen: false, action: null })}
        onConfirm={confirmReceived}
        title="Confirmar recebimento"
        message="Tem certeza que você recebeu o produto? Esta ação não pode ser desfeita."
        confirmText="Confirmar"
        cancelText="Cancelar"
        type="warning"
      />

      <BottomNavigation />
    </div>
  )
}

export default DonationDetails

