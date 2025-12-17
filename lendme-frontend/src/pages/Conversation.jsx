import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { ArrowLeft, Send, MessageCircle } from 'lucide-react'
import BottomNavigation from '../components/BottomNavigation'
import { messageService } from '../services/messageService'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../contexts/ToastContext'
import { getImageUrl } from '../utils/imageUtils'

const Conversation = () => {
  const { conversationId } = useParams()
  const navigate = useNavigate()
  const { user: currentUser } = useAuth()
  const toast = useToast()
  const [conversation, setConversation] = useState(null)
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [sendingMessage, setSendingMessage] = useState(false)
  const messagesEndRef = useRef(null)

  useEffect(() => {
    if (conversationId && currentUser) {
      loadConversation().then(() => {
        loadMessages()
      })
    }
  }, [conversationId, currentUser])

  useEffect(() => {
    // Polling para atualizar mensagens a cada 3 segundos
    if (!conversationId) return
    
    const interval = setInterval(() => {
      loadMessages()
    }, 3000)
    
    return () => clearInterval(interval)
  }, [conversationId])

  useEffect(() => {
    // Scroll para o final das mensagens quando novas mensagens chegarem
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const loadConversation = async () => {
    try {
      setLoading(true)
      // Tenta buscar a conversa diretamente pela lista
      const conversations = await messageService.getConversations()
      const conv = conversations.find(c => c._id === conversationId)
      if (conv) {
        setConversation(conv)
      } else {
        // Se não encontrou na lista, tenta buscar pelo ID diretamente
        try {
          const directConv = await messageService.getConversationById(conversationId)
          if (directConv) {
            setConversation(directConv)
          }
        } catch (directError) {
          console.error('Erro ao buscar conversa diretamente:', directError)
        }
      }
    } catch (error) {
      console.error('Erro ao carregar conversa:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadMessages = async () => {
    if (!conversationId) return
    try {
      const messagesData = await messageService.getMessages(conversationId)
      setMessages(Array.isArray(messagesData) ? messagesData : [])
    } catch (error) {
      console.error('Erro ao carregar mensagens:', error)
      // Se der erro, tenta carregar a conversa novamente
      if (error.response?.status === 404) {
        await loadConversation()
      }
    }
  }

  const handleSendMessage = async (e) => {
    e.preventDefault()
    if (!newMessage.trim() || sendingMessage) return

    setSendingMessage(true)
    try {
      await messageService.sendMessage(conversationId, newMessage)
      setNewMessage('')
      await loadMessages()
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error)
      toast.error(error.response?.data?.message || 'Erro ao enviar mensagem')
    } finally {
      setSendingMessage(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center pb-20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  if (!conversation && !loading) {
    return (
      <div className="min-h-screen bg-slate-950 pb-20">
        <header className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur-sm border-b border-slate-800">
          <div className="max-w-2xl mx-auto px-4">
            <div className="flex items-center justify-between h-14">
              <button
                onClick={() => navigate(-1)}
                className="text-gray-300 hover:text-gray-100"
              >
                <ArrowLeft size={24} />
              </button>
              <h1 className="text-xl font-bold text-gray-100">Conversa</h1>
              <div className="w-6"></div>
            </div>
          </div>
        </header>
        <div className="max-w-2xl mx-auto px-4 py-12 text-center">
          <p className="text-gray-400 mb-4">Conversa não encontrada</p>
          <button onClick={() => navigate(-1)} className="btn-primary">
            Voltar
          </button>
        </div>
        <BottomNavigation />
      </div>
    )
  }

  const otherUser = conversation.user1Id === currentUser._id?.toString() 
    ? conversation.user2 
    : conversation.user1

  return (
    <div className="min-h-screen bg-slate-950 pb-20 flex flex-col">
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
            <Link 
              to={`/user/${otherUser?._id}`}
              className="flex items-center space-x-3 flex-1"
            >
              {otherUser?.profilePic ? (
                <div className="w-8 h-8 rounded-full overflow-hidden border border-slate-700">
                  <img 
                    src={getImageUrl(otherUser.profilePic)} 
                    alt={otherUser.name} 
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
                  <span className="text-white font-semibold text-xs">
                    {otherUser?.name?.charAt(0).toUpperCase() || 'U'}
                  </span>
                </div>
              )}
              <h1 className="text-lg font-bold text-gray-100">{otherUser?.name || 'Usuário'}</h1>
            </Link>
            <div className="w-6"></div>
          </div>
        </div>
      </header>

      {/* Mensagens */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {messages.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <MessageCircle size={48} className="mx-auto mb-4 opacity-50" />
            <p>Nenhuma mensagem ainda. Inicie a conversa!</p>
          </div>
        ) : (
          messages.map((msg) => {
            const isOwnMessage = String(msg.userId) === String(currentUser._id)
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
      <div className="sticky bottom-0 bg-slate-900 border-t border-slate-800 p-4">
        <form onSubmit={handleSendMessage} className="max-w-2xl mx-auto flex space-x-2">
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
            className="btn-primary disabled:opacity-50 flex items-center justify-center space-x-2"
          >
            <Send size={20} />
          </button>
        </form>
      </div>

      <BottomNavigation />
    </div>
  )
}

export default Conversation

