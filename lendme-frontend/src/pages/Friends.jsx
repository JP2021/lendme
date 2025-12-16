import { useState, useEffect } from 'react'
import { Search, UserPlus, UserMinus, MessageCircle } from 'lucide-react'
import BottomNavigation from '../components/BottomNavigation'
import { authService } from '../services/authService'

const Friends = () => {
  const { user } = useAuth()
  const [searchQuery, setSearchQuery] = useState('')
  const [activeTab, setActiveTab] = useState('all')
  const [friends, setFriends] = useState([])
  const [requests, setRequests] = useState([])
  const [suggestions, setSuggestions] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    if (activeTab === 'suggestions' && searchQuery.length >= 2) {
      searchUsers()
    }
  }, [searchQuery, activeTab])

  const loadData = async () => {
    try {
      setLoading(true)
      const [friendsData, requestsData] = await Promise.all([
        authService.getFriends(),
        authService.getReceivedFriendRequests()
      ])
      setFriends(friendsData)
      
      // Validação adicional no frontend: garante que apenas solicitações recebidas sejam exibidas
      // Uma solicitação recebida tem toUserId igual ao ID do usuário atual
      if (user && requestsData) {
        const currentUserId = user._id?.toString() || user._id
        const validRequests = requestsData.filter(req => {
          const toUserId = req.toUserId?.toString() || req.toUserId
          return toUserId === currentUserId
        })
        setRequests(validRequests)
        console.log('Solicitações recebidas (filtradas):', validRequests.length, 'de', requestsData.length)
      } else {
        setRequests(requestsData || [])
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error)
    } finally {
      setLoading(false)
    }
  }

  const searchUsers = async () => {
    try {
      const users = await authService.searchUsers(searchQuery)
      setSuggestions(users.filter(u => !u.isFriend))
    } catch (error) {
      console.error('Erro ao buscar usuários:', error)
    }
  }

  const handleAcceptRequest = async (requestId) => {
    try {
      await authService.acceptFriendRequest(requestId)
      await loadData()
    } catch (error) {
      console.error('Erro ao aceitar solicitação:', error)
      alert('Erro ao aceitar solicitação')
    }
  }

  const handleRejectRequest = async (requestId) => {
    try {
      await authService.rejectFriendRequest(requestId)
      await loadData()
    } catch (error) {
      console.error('Erro ao recusar solicitação:', error)
      alert('Erro ao recusar solicitação')
    }
  }

  const handleSendRequest = async (toUserId) => {
    try {
      await authService.sendFriendRequest(toUserId)
      alert('Solicitação enviada!')
      await loadData()
    } catch (error) {
      console.error('Erro ao enviar solicitação:', error)
      alert(error.response?.data?.message || 'Erro ao enviar solicitação')
    }
  }

  const handleRemoveFriend = async (friendId) => {
    if (!confirm('Tem certeza que deseja remover este amigo?')) return
    
    try {
      await authService.removeFriend(friendId)
      await loadData()
    } catch (error) {
      console.error('Erro ao remover amigo:', error)
      alert('Erro ao remover amigo')
    }
  }

  const getCurrentList = () => {
    if (activeTab === 'requests') return requests
    if (activeTab === 'suggestions') return suggestions
    return friends
  }

  return (
    <div className="min-h-screen bg-slate-950 pb-20">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur-sm border-b border-slate-800">
        <div className="max-w-2xl mx-auto px-4">
          <div className="flex items-center justify-between h-14">
            <h1 className="text-xl font-bold text-gray-100">Amigos</h1>
            <button className="text-gray-300 hover:text-gray-100">
              <UserPlus size={24} />
            </button>
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
            onClick={() => setActiveTab('all')}
            className={`flex-1 py-3 text-sm font-medium transition-colors ${
              activeTab === 'all'
                ? 'text-blue-400 border-b-2 border-blue-400'
                : 'text-gray-400 hover:text-gray-300'
            }`}
          >
            Todos ({friends.length})
          </button>
          <button
            onClick={() => setActiveTab('requests')}
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
            onClick={() => setActiveTab('suggestions')}
            className={`flex-1 py-3 text-sm font-medium transition-colors ${
              activeTab === 'suggestions'
                ? 'text-blue-400 border-b-2 border-blue-400'
                : 'text-gray-400 hover:text-gray-300'
            }`}
          >
            Sugestões
          </button>
        </div>
      </div>

      {/* Friends List */}
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
              const friend = activeTab === 'requests' ? item.user : item
              const itemId = activeTab === 'requests' ? item._id : friend._id
              
              return (
                <div
                  key={itemId}
                  className="bg-slate-900 rounded-lg p-4 border border-slate-800 flex items-center justify-between"
                >
                  <div className="flex items-center space-x-3 flex-1">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
                      <span className="text-white font-semibold">
                        {friend?.name?.charAt(0).toUpperCase() || 'U'}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-100 truncate">{friend?.name || 'Usuário'}</h3>
                      <p className="text-sm text-gray-400 truncate">@{friend?.name?.toLowerCase().replace(/\s/g, '_') || 'usuario'}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {activeTab === 'requests' ? (
                      <>
                        <button 
                          onClick={() => handleAcceptRequest(item._id)}
                          className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-medium transition-colors"
                        >
                          Aceitar
                        </button>
                        <button 
                          onClick={() => handleRejectRequest(item._id)}
                          className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-gray-300 rounded-lg text-sm font-medium transition-colors"
                        >
                          Recusar
                        </button>
                      </>
                    ) : activeTab === 'suggestions' ? (
                      <button 
                        onClick={() => handleSendRequest(friend._id)}
                        className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-medium transition-colors"
                      >
                        Adicionar
                      </button>
                    ) : (
                      <>
                        <button className="p-2 text-gray-400 hover:text-blue-400 transition-colors">
                          <MessageCircle size={20} />
                        </button>
                        <button 
                          onClick={() => handleRemoveFriend(friend._id)}
                          className="p-2 text-gray-400 hover:text-red-400 transition-colors"
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

      {/* Bottom Navigation */}
      <BottomNavigation />
    </div>
  )
}

export default Friends
