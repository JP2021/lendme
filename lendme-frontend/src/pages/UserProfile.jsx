import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { ArrowLeft, UserPlus, MessageCircle, Settings, Grid3x3, List, Check, X } from 'lucide-react'
import BottomNavigation from '../components/BottomNavigation'
import { useAuth } from '../contexts/AuthContext'
import { userService } from '../services/userService'
import { authService } from '../services/authService'
import { productService } from '../services/productService'
import { getImageUrl } from '../utils/imageUtils'

const UserProfile = () => {
  const { userId } = useParams()
  const navigate = useNavigate()
  const { user: currentUser } = useAuth()
  const [profileUser, setProfileUser] = useState(null)
  const [userProducts, setUserProducts] = useState([])
  const [viewMode, setViewMode] = useState('grid')
  const [loading, setLoading] = useState(true)
  const [loadingAction, setLoadingAction] = useState(false)
  const [error, setError] = useState('')

  // Garante que userProducts sempre seja um array
  const safeUserProducts = Array.isArray(userProducts) ? userProducts : []

  useEffect(() => {
    console.log('[DEBUG UserProfile] useEffect - userId:', userId, 'currentUser:', currentUser?._id)
    if (userId && currentUser) {
      loadData()
    }
  }, [userId, currentUser])

  const loadData = async () => {
    try {
      setLoading(true)
      setError('')
      setUserProducts([]) // Reseta para array vazio antes de carregar
      
      console.log('[DEBUG UserProfile] Carregando dados para userId:', userId, 'tipo:', typeof userId)
      
      const [userData, products] = await Promise.all([
        userService.getUser(userId).catch(err => {
          console.error('[DEBUG UserProfile] Erro ao buscar usuário:', err)
          if (err.response?.status === 404) {
            setError('Usuário não encontrado')
          } else if (err.response?.status === 403) {
            setError('Este perfil é privado')
          }
          return null
        }),
        userService.getUserProducts(userId).then(products => {
          console.log('[DEBUG UserProfile] Produtos recebidos:', products, 'tipo:', Array.isArray(products) ? 'array' : typeof products)
          // Garante que seja um array
          return Array.isArray(products) ? products : []
        }).catch((err) => {
          console.error('Erro ao buscar produtos do usuário:', err)
          return []
        })
      ])
      
      // Garante que products seja um array
      const productsArray = Array.isArray(products) ? products : (products ? [products] : [])
      
      console.log('[DEBUG UserProfile] Dados recebidos:', {
        userData: userData ? {
          _id: userData._id,
          name: userData.name,
          profilePic: userData.profilePic,
          isFriend: userData.isFriend,
          isOwnProfile: userData.isOwnProfile,
          friendRequestStatus: userData.friendRequestStatus
        } : null,
        productsCount: productsArray.length,
        productsType: Array.isArray(products) ? 'array' : typeof products
      })
      
      if (userData) {
        console.log('[DEBUG UserProfile] Definindo profileUser:', userData)
        setProfileUser(userData)
        setUserProducts(productsArray)
      } else {
        console.log('[DEBUG UserProfile] userData é null, definindo erro')
        // Se não encontrou o usuário, garante que products seja array vazio
        setUserProducts([])
        if (!error) {
          setError('Usuário não encontrado')
        }
      }
    } catch (err) {
      console.error('Erro ao carregar dados:', err)
      setError('Erro ao carregar perfil')
      setUserProducts([]) // Garante array vazio em caso de erro
    } finally {
      setLoading(false)
    }
  }

  const handleSendFriendRequest = async () => {
    if (!profileUser) return
    
    setLoadingAction(true)
    try {
      await authService.sendFriendRequest(userId)
      await loadData() // Recarrega para atualizar o status
      alert('Solicitação de amizade enviada!')
    } catch (err) {
      alert(err.response?.data?.message || 'Erro ao enviar solicitação')
    } finally {
      setLoadingAction(false)
    }
  }

  const handleAcceptFriendRequest = async () => {
    if (!profileUser?.friendRequestId) return
    
    setLoadingAction(true)
    try {
      await authService.acceptFriendRequest(profileUser.friendRequestId)
      await loadData()
      alert('Solicitação aceita!')
    } catch (err) {
      alert(err.response?.data?.message || 'Erro ao aceitar solicitação')
    } finally {
      setLoadingAction(false)
    }
  }

  const handleRejectFriendRequest = async () => {
    if (!profileUser?.friendRequestId) return
    
    setLoadingAction(true)
    try {
      await authService.rejectFriendRequest(profileUser.friendRequestId)
      await loadData()
    } catch (err) {
      alert(err.response?.data?.message || 'Erro ao recusar solicitação')
    } finally {
      setLoadingAction(false)
    }
  }

  const handleStartConversation = async () => {
    if (!profileUser) return
    
    setLoadingAction(true)
    try {
      const { messageService } = await import('../services/messageService')
      const conversation = await messageService.getOrCreateConversation(userId)
      navigate(`/conversations/${conversation._id}`)
    } catch (err) {
      alert(err.response?.data?.message || 'Erro ao iniciar conversa')
    } finally {
      setLoadingAction(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  if (error || !profileUser) {
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
              <h1 className="text-xl font-bold text-gray-100">Perfil</h1>
              <div className="w-6"></div>
            </div>
          </div>
        </header>
        <div className="max-w-2xl mx-auto px-4 py-12 text-center">
          <p className="text-gray-400 mb-4">{error || 'Usuário não encontrado'}</p>
          <button onClick={() => navigate(-1)} className="btn-primary">
            Voltar
          </button>
        </div>
        <BottomNavigation />
      </div>
    )
  }

  const isOwnProfile = profileUser.isOwnProfile
  const isFriend = profileUser.isFriend
  const friendRequestStatus = profileUser.friendRequestStatus

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
            <h1 className="text-xl font-bold text-gray-100">{profileUser.name}</h1>
            {isOwnProfile ? (
              <Link to="/settings" className="text-gray-300 hover:text-gray-100">
                <Settings size={24} />
              </Link>
            ) : (
              <div className="w-6"></div>
            )}
          </div>
        </div>
      </header>

      {/* Perfil Info */}
      <div className="max-w-2xl mx-auto px-4 py-6">
        <div className="flex items-center space-x-6 mb-6">
          {profileUser.profilePic ? (
            <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-slate-700">
              <img 
                src={getImageUrl(profileUser.profilePic)} 
                alt={profileUser.name} 
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.target.style.display = 'none'
                  const fallback = e.target.parentElement.querySelector('.avatar-fallback')
                  if (fallback) fallback.style.display = 'flex'
                }}
              />
              <div className="avatar-fallback hidden w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 items-center justify-center">
                <span className="text-white font-bold text-3xl">
                  {profileUser.name?.charAt(0).toUpperCase() || 'U'}
                </span>
              </div>
            </div>
          ) : (
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
              <span className="text-white font-bold text-3xl">
                {profileUser.name?.charAt(0).toUpperCase() || 'U'}
              </span>
            </div>
          )}
          <div className="flex-1">
            <div className="flex items-center space-x-4 mb-4">
              <div className="text-center">
                <p className="text-lg font-bold text-gray-100">{safeUserProducts.length}</p>
                <p className="text-sm text-gray-400">produtos</p>
              </div>
            </div>
            {!isOwnProfile && (
              <div className="flex space-x-2">
                {friendRequestStatus === 'sent' ? (
                  <button
                    disabled
                    className="flex-1 bg-slate-700 text-gray-400 font-semibold py-2 px-4 rounded-lg text-center cursor-not-allowed"
                  >
                    Solicitação Enviada
                  </button>
                ) : friendRequestStatus === 'received' ? (
                  <>
                    <button
                      onClick={handleAcceptFriendRequest}
                      disabled={loadingAction}
                      className="flex-1 bg-green-500 hover:bg-green-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center space-x-2"
                    >
                      <Check size={18} />
                      <span>Aceitar</span>
                    </button>
                    <button
                      onClick={handleRejectFriendRequest}
                      disabled={loadingAction}
                      className="flex-1 bg-red-500 hover:bg-red-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center space-x-2"
                    >
                      <X size={18} />
                      <span>Recusar</span>
                    </button>
                  </>
                ) : !isFriend ? (
                  <button
                    onClick={handleSendFriendRequest}
                    disabled={loadingAction}
                    className="flex-1 bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center space-x-2"
                  >
                    <UserPlus size={18} />
                    <span>Adicionar Amigo</span>
                  </button>
                ) : (
                  <button
                    disabled
                    className="flex-1 bg-green-500/20 text-green-400 font-semibold py-2 px-4 rounded-lg text-center cursor-not-allowed"
                  >
                    Amigo
                  </button>
                )}
                {(isFriend || friendRequestStatus === 'sent') && (
                  <button
                    onClick={handleStartConversation}
                    disabled={loadingAction}
                    className="bg-purple-500 hover:bg-purple-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center space-x-2"
                  >
                    <MessageCircle size={18} />
                    <span>Conversar</span>
                  </button>
                )}
              </div>
            )}
            {isOwnProfile && (
              <Link
                to="/profile/edit"
                className="block w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors text-center"
              >
                Editar Perfil
              </Link>
            )}
          </div>
        </div>

        {/* Bio */}
        <div className="mb-6">
          <h2 className="font-semibold text-gray-100 mb-1">{profileUser.name}</h2>
          {profileUser.bio && (
            <p className="text-sm text-gray-400 mb-2">{profileUser.bio}</p>
          )}
          {profileUser.email && (
            <p className="text-sm text-gray-400">{profileUser.email}</p>
          )}
        </div>

        {/* Tabs */}
        <div className="flex items-center justify-around border-t border-slate-800 mb-4">
          <button
            onClick={() => setViewMode('grid')}
            className={`flex items-center space-x-2 py-4 px-2 ${
              viewMode === 'grid' ? 'text-gray-100 border-t-2 border-gray-100' : 'text-gray-400'
            }`}
          >
            <Grid3x3 size={20} />
            <span className="hidden sm:inline">Grid</span>
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`flex items-center space-x-2 py-4 px-2 ${
              viewMode === 'list' ? 'text-gray-100 border-t-2 border-gray-100' : 'text-gray-400'
            }`}
          >
            <List size={20} />
            <span className="hidden sm:inline">Lista</span>
          </button>
        </div>

        {/* Grid de Produtos */}
        {viewMode === 'grid' && (
          <div className="grid grid-cols-3 gap-1">
            {safeUserProducts.length === 0 ? (
              <div className="col-span-3 text-center py-12">
                <p className="text-gray-400">Nenhum produto disponível</p>
              </div>
            ) : (
              safeUserProducts.map((product) => (
                <Link
                  key={product._id}
                  to={`/products/${product._id}`}
                  className="aspect-square bg-slate-800 rounded-lg flex items-center justify-center hover:opacity-80 transition-opacity cursor-pointer overflow-hidden"
                >
                  {product.images && product.images.length > 0 ? (
                    <img 
                      src={getImageUrl(product.images[0])} 
                      alt={product.name} 
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.style.display = 'none'
                        e.target.parentElement.innerHTML = '<span class="text-4xl">📦</span>'
                      }}
                    />
                  ) : (
                    <span className="text-4xl">📦</span>
                  )}
                </Link>
              ))
            )}
          </div>
        )}

        {/* Lista de Produtos */}
        {viewMode === 'list' && (
          <div className="space-y-4">
            {safeUserProducts.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-400">Nenhum produto disponível</p>
              </div>
            ) : (
              safeUserProducts.map((product) => (
                <Link
                  key={product._id}
                  to={`/products/${product._id}`}
                  className="block bg-slate-900 rounded-lg p-4 border border-slate-800 flex items-center space-x-4 hover:border-blue-500 transition-colors"
                >
                  {product.images && product.images.length > 0 ? (
                    <img 
                      src={getImageUrl(product.images[0])} 
                      alt={product.name} 
                      className="w-16 h-16 rounded-lg object-cover" 
                      onError={(e) => { 
                        e.target.style.display = 'none'
                        e.target.nextElementSibling.style.display = 'flex'
                      }} 
                    />
                  ) : null}
                  {(!product.images || product.images.length === 0) && (
                    <div className="w-16 h-16 bg-slate-800 rounded-lg flex items-center justify-center">
                      <span className="text-2xl">📦</span>
                    </div>
                  )}
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-100">{product.name}</h3>
                    <p className="text-sm text-gray-400">{product.category}</p>
                    <p className="text-xs text-gray-500">
                      {product.type === 'donation' ? 'Doação' : 
                       product.type === 'loan' ? 'Empréstimo' : 
                       'Disponível para troca'}
                    </p>
                  </div>
                </Link>
              ))
            )}
          </div>
        )}
      </div>

      {/* Bottom Navigation */}
      <BottomNavigation />
    </div>
  )
}

export default UserProfile

