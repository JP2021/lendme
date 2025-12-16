import { useState, useEffect } from 'react'
import { Search, UserPlus, UserMinus, MessageCircle, Check, X } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import BottomNavigation from '../components/BottomNavigation'
import { authService } from '../services/authService'
import { useAuth } from '../contexts/AuthContext'
import { getImageUrl } from '../utils/imageUtils'

const Friends = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [searchQuery, setSearchQuery] = useState('')
  const [activeTab, setActiveTab] = useState('all')
  const [friends, setFriends] = useState([])
  const [requests, setRequests] = useState([])
  const [suggestions, setSuggestions] = useState([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(null)

  useEffect(() => {
    if (user) {
      loadData()
    }
  }, [user])

  useEffect(() => {
    if (activeTab === 'suggestions' && searchQuery.length >= 2) {
      const timeoutId = setTimeout(() => {
        searchUsers()
      }, 500)
      return () => clearTimeout(timeoutId)
    } else if (activeTab === 'suggestions') {
      setSuggestions([])
    }
  }, [searchQuery, activeTab])

  const loadData = async () => {
    if (!user) return
    
    try {
      setLoading(true)
      const [friendsData, requestsData] = await Promise.all([
        authService.getFriends().catch(() => []),
        authService.getReceivedFriendRequests().catch(() => [])
      ])
      
      console.log('[Friends] Amigos carregados:', friendsData?.length || 0)
      console.log('[Friends] Solicitações carregadas:', requestsData?.length || 0)
      
      setFriends(Array.isArray(friendsData) ? friendsData : [])
      setRequests(Array.isArray(requestsData) ? requestsData : [])
    } catch (error) {
      console.error('[Friends] Erro ao carregar dados:', error)
    } finally {
      setLoading(false)
    }
  }

  const searchUsers = async () => {
    if (!searchQuery || searchQuery.length < 2) {
      setSuggestions([])
      return
    }
    
    try {
      const users = await authService.searchUsers(searchQuery)
      const currentUserId = user?._id?.toString() || user?._id
      
      // Filtra usuários que não são amigos e não são o próprio usuário
      const filtered = users.filter(u => {
        const userId = u._id?.toString() || u._id
        const isNotSelf = userId !== currentUserId
        const isNotFriend = !u.isFriend
        return isNotSelf && isNotFriend
      })
      
      setSuggestions(filtered)
    } catch (error) {
      console.error('[Friends] Erro ao buscar usuários:', error)
      setSuggestions([])
    }
  }

  const handleAcceptRequest = async (requestId) => {
    if (actionLoading) return
    
    try {
      setActionLoading(requestId)
      await authService.acceptFriendRequest(requestId)
      await loadData()
    } catch (error) {
      console.error('[Friends] Erro ao aceitar:', error)
      alert(error.response?.data?.message || 'Erro ao aceitar solicitação')
    } finally {
      setActionLoading(null)
    }
  }

  const handleRejectRequest = async (requestId) => {
    if (actionLoading) return
    
    try {
      setActionLoading(requestId)
      await authService.rejectFriendRequest(requestId)
      await loadData()
    } catch (error) {
      console.error('[Friends] Erro ao recusar:', error)
      alert('Erro ao recusar solicitação')
    } finally {
      setActionLoading(null)
    }
  }

  const handleSendRequest = async (toUserId) => {
    if (actionLoading) return
    
    try {
      setActionLoading(toUserId)
      await authService.sendFriendRequest(toUserId)
      alert('Solicitação enviada!')
      await loadData()
      // Atualiza sugestões para remover o usuário
      setSuggestions(prev => prev.filter(u => {
        const userId = u._id?.toString() || u._id
        return userId !== toUserId
      }))
    } catch (error) {
      console.error('[Friends] Erro ao enviar:', error)
      alert(error.response?.data?.message || 'Erro ao enviar solicitação')
    } finally {
      setActionLoading(null)
    }
  }

  const handleRemoveFriend = async (friendId) => {
    if (!confirm('Tem certeza que deseja remover este amigo?')) return
    if (actionLoading) return
    
    try {
      setActionLoading(friendId)
      await authService.removeFriend(friendId)
      await loadData()
    } catch (error) {
      console.error('[Friends] Erro ao remover:', error)
      alert('Erro ao remover amigo')
    } finally {
      setActionLoading(null)
    }
  }

  const handleStartConversation = async (friendId) => {
    try {
      const { messageService } = await import('../services/messageService')
      const conversation = await messageService.getOrCreateConversation(friendId)
      navigate(`/conversations/${conversation._id}`)
    } catch (err) {
      alert(err.response?.data?.message || 'Erro ao iniciar conversa')
    }
  }

  const getCurrentList = () => {
    if (activeTab === 'requests') return requests
    if (activeTab === 'suggestions') return suggestions
    return friends
  }

  const getDisplayUser = (item) => {
    if (activeTab === 'requests') {
      return item.user || item.fromUser || item
    }
    return item
  }

  return (
    <div className="min-h-screen bg-slate-950 pb-20">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur-sm border-b border-slate-800">
        <div className="max-w-2xl mx-auto px-4">
          <div className="flex items-center justify-between h-14">
            <h1 className="text-xl font-bold text-gray-100">Amigos</h1>
            <div className="w-6"></div>
          </div>
        </div>
      </header>

      {/* Search Bar */}
      <div className="max-w-2xl mx-auto px-4 py-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder={activeTab === 'suggestions' ? 'Buscar usuários...' : 'Buscar amigos...'}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-900 border border-slate-800 rounded-lg text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
          />
        </div>
      </div>

      {/* Tabs */}
      <div className="max-w-2xl mx-auto px-4">
        <div className="flex space-x-1 border-b border-slate-800">
          <button
            onClick={() => {
              setActiveTab('all')
              setSearchQuery('')
            }}
            className={`flex-1 py-3 text-sm font-medium transition-colors relative ${
              activeTab === 'all'
                ? 'text-blue-400 border-b-2 border-blue-400'
                : 'text-gray-400 hover:text-gray-300'
            }`}
          >
            Todos ({friends.length})
          </button>
          <button
            onClick={() => {
              setActiveTab('requests')
              setSearchQuery('')
            }}
            className={`flex-1 py-3 text-sm font-medium transition-colors relative ${
              activeTab === 'requests'
                ? 'text-blue-400 border-b-2 border-blue-400'
                : 'text-gray-400 hover:text-gray-300'
            }`}
          >
            Solicitações ({requests.length})
            {requests.length > 0 && (
              <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full"></span>
            )}
          </button>
          <button
            onClick={() => {
              setActiveTab('suggestions')
              setSearchQuery('')
            }}
            className={`flex-1 py-3 text-sm font-medium transition-colors ${
              activeTab === 'suggestions'
                ? 'text-blue-400 border-b-2 border-blue-400'
                : 'text-gray-400 hover:text-gray-300'
            }`}
          >
            Buscar
          </button>
        </div>
      </div>

      {/* List */}
      <div className="max-w-2xl mx-auto px-4 py-4">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          </div>
        ) : getCurrentList().length === 0 ? (
          <div className="text-center py-12">
            <UserPlus size={48} className="text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400">
              {activeTab === 'requests' && 'Nenhuma solicitação pendente'}
              {activeTab === 'suggestions' && (searchQuery.length < 2 ? 'Digite pelo menos 2 caracteres para buscar' : 'Nenhum usuário encontrado')}
              {activeTab === 'all' && 'Nenhum amigo encontrado'}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {getCurrentList().map((item) => {
              const displayUser = getDisplayUser(item)
              const userId = displayUser?._id?.toString() || displayUser?._id
              const itemId = activeTab === 'requests' ? (item._id?.toString() || item._id) : userId
              
              if (!displayUser || !userId) {
                console.warn('[Friends] Item inválido:', item)
                return null
              }

              return (
                <div
                  key={itemId}
                  className="bg-slate-900 rounded-lg p-4 border border-slate-800 flex items-center justify-between"
                >
                  <Link 
                    to={`/user/${userId}`}
                    className="flex items-center space-x-3 flex-1 min-w-0"
                  >
                    {displayUser.profilePic ? (
                      <img
                        src={getImageUrl(displayUser.profilePic)}
                        alt={displayUser.name}
                        className="w-12 h-12 rounded-full object-cover"
                        onError={(e) => {
                          e.target.style.display = 'none'
                          e.target.nextSibling.style.display = 'flex'
                        }}
                      />
                    ) : null}
                    <div className={`w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center ${displayUser.profilePic ? 'hidden' : ''}`}>
                      <span className="text-white font-semibold">
                        {displayUser.name?.charAt(0).toUpperCase() || 'U'}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-100 truncate">{displayUser.name || 'Usuário'}</h3>
                      <p className="text-sm text-gray-400 truncate">
                        @{displayUser.name?.toLowerCase().replace(/\s/g, '_') || 'usuario'}
                      </p>
                    </div>
                  </Link>
                  <div className="flex items-center space-x-2 ml-2">
                    {activeTab === 'requests' ? (
                      <>
                        <button 
                          onClick={() => handleAcceptRequest(item._id?.toString() || item._id)}
                          disabled={actionLoading === (item._id?.toString() || item._id)}
                          className="p-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors disabled:opacity-50"
                          title="Aceitar"
                        >
                          <Check size={18} />
                        </button>
                        <button 
                          onClick={() => handleRejectRequest(item._id?.toString() || item._id)}
                          disabled={actionLoading === (item._id?.toString() || item._id)}
                          className="p-2 bg-slate-800 hover:bg-slate-700 text-gray-300 rounded-lg transition-colors disabled:opacity-50"
                          title="Recusar"
                        >
                          <X size={18} />
                        </button>
                      </>
                    ) : activeTab === 'suggestions' ? (
                      <button 
                        onClick={() => handleSendRequest(userId)}
                        disabled={actionLoading === userId}
                        className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                      >
                        {actionLoading === userId ? 'Enviando...' : 'Adicionar'}
                      </button>
                    ) : (
                      <>
                        <button 
                          onClick={(e) => {
                            e.preventDefault()
                            handleStartConversation(userId)
                          }}
                          className="p-2 text-gray-400 hover:text-blue-400 transition-colors"
                          title="Conversar"
                        >
                          <MessageCircle size={20} />
                        </button>
                        <button 
                          onClick={(e) => {
                            e.preventDefault()
                            handleRemoveFriend(userId)
                          }}
                          disabled={actionLoading === userId}
                          className="p-2 text-gray-400 hover:text-red-400 transition-colors disabled:opacity-50"
                          title="Remover amigo"
                        >
                          <UserMinus size={20} />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      <BottomNavigation />
    </div>
  )
}

export default Friends
