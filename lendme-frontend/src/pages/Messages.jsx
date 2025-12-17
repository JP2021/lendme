import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { MessageCircle, Search } from 'lucide-react'
import BottomNavigation from '../components/BottomNavigation'
import { messageService } from '../services/messageService'
import { useAuth } from '../contexts/AuthContext'
import { getImageUrl } from '../utils/imageUtils'

const Messages = () => {
  const navigate = useNavigate()
  const { user: currentUser } = useAuth()
  const [conversations, setConversations] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    if (currentUser) {
      loadConversations()
    }
  }, [currentUser])

  // Polling para atualizar conversas a cada 5 segundos
  useEffect(() => {
    if (!currentUser) return
    
    const interval = setInterval(() => {
      loadConversations()
    }, 5000)
    
    return () => clearInterval(interval)
  }, [currentUser])

  const loadConversations = async () => {
    try {
      const data = await messageService.getConversations()
      setConversations(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('Erro ao carregar conversas:', error)
      setConversations([])
    } finally {
      setLoading(false)
    }
  }

  const getOtherUser = (conversation) => {
    if (!conversation || !currentUser) return null
    const currentUserId = currentUser._id?.toString() || currentUser._id
    const user1Id = conversation.user1Id?.toString() || conversation.user1Id
    return currentUserId === user1Id ? conversation.user2 : conversation.user1
  }

  const formatDate = (date) => {
    if (!date) return ''
    const now = new Date()
    const messageDate = new Date(date)
    const diff = now - messageDate
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(minutes / 60)
    const days = Math.floor(hours / 24)

    if (minutes < 1) return 'Agora'
    if (minutes < 60) return `${minutes}m`
    if (hours < 24) return `${hours}h`
    if (days < 7) return `${days}d`
    return messageDate.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
  }

  const filteredConversations = conversations.filter(conv => {
    if (!searchQuery.trim()) return true
    const otherUser = getOtherUser(conv)
    const name = otherUser?.name || ''
    return name.toLowerCase().includes(searchQuery.toLowerCase())
  })

  return (
    <div className="min-h-screen bg-slate-950 pb-20">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur-sm border-b border-slate-800">
        <div className="max-w-2xl mx-auto px-4">
          <div className="flex items-center justify-between h-14">
            <h1 className="text-xl font-bold text-gray-100">Mensagens</h1>
            <div className="w-6"></div>
          </div>
        </div>
      </header>

      {/* Busca */}
      <div className="max-w-2xl mx-auto px-4 py-3 border-b border-slate-800">
        <div className="relative">
          <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar conversas..."
            className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-10 pr-4 py-2 text-gray-100 placeholder-gray-500 focus:outline-none focus:border-blue-500"
          />
        </div>
      </div>

      {/* Lista de Conversas */}
      <main className="max-w-2xl mx-auto">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          </div>
        ) : filteredConversations.length === 0 ? (
          <div className="text-center py-12 px-4">
            <MessageCircle size={48} className="mx-auto mb-4 text-gray-400 opacity-50" />
            <p className="text-gray-400 mb-2">
              {searchQuery ? 'Nenhuma conversa encontrada' : 'Nenhuma conversa ainda'}
            </p>
            {!searchQuery && (
              <p className="text-sm text-gray-500">
                Comece uma conversa com seus amigos!
              </p>
            )}
          </div>
        ) : (
          <div className="divide-y divide-slate-800">
            {filteredConversations.map((conversation) => {
              const otherUser = getOtherUser(conversation)
              const lastMessage = conversation.lastMessage
              const isUnread = false // Você pode implementar lógica de não lidas depois

              return (
                <Link
                  key={conversation._id}
                  to={`/conversations/${conversation._id}`}
                  className="flex items-center space-x-3 px-4 py-3 hover:bg-slate-900 transition-colors"
                >
                  {/* Avatar */}
                  {otherUser?.profilePic ? (
                    <div className="w-12 h-12 rounded-full overflow-hidden border border-slate-700 flex-shrink-0">
                      <img 
                        src={getImageUrl(otherUser.profilePic)} 
                        alt={otherUser.name} 
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.style.display = 'none'
                          const fallback = e.target.parentElement.querySelector('.avatar-fallback')
                          if (fallback) fallback.style.display = 'flex'
                        }}
                      />
                      <div className="avatar-fallback hidden w-full h-full rounded-full bg-gradient-to-br from-blue-500 to-purple-500 items-center justify-center">
                        <span className="text-white font-semibold text-sm">
                          {otherUser?.name?.charAt(0).toUpperCase() || 'U'}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center flex-shrink-0">
                      <span className="text-white font-semibold text-sm">
                        {otherUser?.name?.charAt(0).toUpperCase() || 'U'}
                      </span>
                    </div>
                  )}

                  {/* Informações */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="text-sm font-semibold text-gray-100 truncate">
                        {otherUser?.name || 'Usuário'}
                      </h3>
                      {lastMessage && (
                        <span className="text-xs text-gray-500 flex-shrink-0 ml-2">
                          {formatDate(lastMessage.createdAt)}
                        </span>
                      )}
                    </div>
                    {lastMessage ? (
                      <p className={`text-sm truncate ${isUnread ? 'text-gray-100 font-medium' : 'text-gray-400'}`}>
                        {lastMessage.message}
                      </p>
                    ) : (
                      <p className="text-sm text-gray-500 italic">Nenhuma mensagem ainda</p>
                    )}
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </main>

      <BottomNavigation />
    </div>
  )
}

export default Messages


