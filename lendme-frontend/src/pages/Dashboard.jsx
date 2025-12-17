import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { Home, Search, Plus, MessageCircle, Heart, RefreshCw, Handshake } from 'lucide-react'
import { Link } from 'react-router-dom'
import ProductCard from '../components/ProductCard'
import BottomNavigation from '../components/BottomNavigation'
import { productService } from '../services/productService'
import { authService } from '../services/authService'
import { getImageUrl } from '../utils/imageUtils'

const Dashboard = () => {
  const { user } = useAuth()
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [friends, setFriends] = useState([])
  const [displayedFriends, setDisplayedFriends] = useState([])

  // Função para processar amigos com a mesma lógica do feed (randomização + ordenação por data)
  const processFriendsForDisplay = (friendsList) => {
    if (!friendsList || friendsList.length === 0) {
      console.log('[Dashboard] processFriendsForDisplay: lista vazia')
      return []
    }
    
    try {
      // Função auxiliar para randomizar array usando Fisher-Yates shuffle
      const shuffleArray = (arr) => {
        if (arr.length <= 1) return arr
        const shuffled = [...arr]
        
        // Usa timestamp como seed adicional para garantir randomização diferente a cada chamada
        const seed = Date.now() % 1000
        
        // Primeiro shuffle - Fisher-Yates (de trás para frente) com seed
        for (let i = shuffled.length - 1; i > 0; i--) {
          const randomValue = Math.random() * (seed + 1) + seed
          const j = Math.floor(randomValue % (i + 1))
          const temp = shuffled[i]
          shuffled[i] = shuffled[j]
          shuffled[j] = temp
        }
        
        // Segundo shuffle para garantir melhor distribuição
        for (let i = shuffled.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1))
          const temp = shuffled[i]
          shuffled[i] = shuffled[j]
          shuffled[j] = temp
        }
        
        // Terceiro shuffle usando uma abordagem diferente (de frente para trás)
        for (let i = 0; i < shuffled.length - 1; i++) {
          const j = Math.floor(Math.random() * (shuffled.length - i)) + i
          const temp = shuffled[i]
          shuffled[i] = shuffled[j]
          shuffled[j] = temp
        }
        
        // Quarto shuffle adicional para garantir variação máxima
        for (let i = shuffled.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1))
          const temp = shuffled[i]
          shuffled[i] = shuffled[j]
          shuffled[j] = temp
        }
        
        return shuffled
      }
      
      // Define o limite de tempo para considerar um usuário como "novo" (24 horas desde criação da conta)
      const now = new Date()
      const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000)
      
      // Separa amigos novos (contas criadas nas últimas 24h) dos mais antigos
      const newFriends = []
      const oldFriends = []
      
      friendsList.forEach(friend => {
        const friendDate = new Date(friend.createdAt || friend.created_at || 0)
        if (friendDate >= oneDayAgo) {
          newFriends.push(friend)
        } else {
          oldFriends.push(friend)
        }
      })
      
      let processedFriends = []
      
      // Se há amigos novos E antigos: novos primeiro (ordenados por data), depois antigos (randomizados)
      if (newFriends.length > 0 && oldFriends.length > 0) {
        // Ordena amigos novos por data (mais recente primeiro)
        newFriends.sort((a, b) => {
          const dateA = new Date(a.createdAt || a.created_at || 0)
          const dateB = new Date(b.createdAt || b.created_at || 0)
          return dateB - dateA
        })
        
        // Randomiza amigos antigos
        const shuffledOldFriends = shuffleArray(oldFriends)
        processedFriends = [...newFriends, ...shuffledOldFriends]
      }
      // Se TODOS são novos: randomiza todos (mas mantém prioridade para os mais recentes)
      else if (newFriends.length > 0 && oldFriends.length === 0) {
        // Ordena primeiro por data para dar prioridade aos mais recentes
        newFriends.sort((a, b) => {
          const dateA = new Date(a.createdAt || a.created_at || 0)
          const dateB = new Date(b.createdAt || b.created_at || 0)
          return dateB - dateA
        })
        
        // Se há mais de 1 amigo, randomiza mantendo uma tendência de prioridade para os mais recentes
        if (newFriends.length > 1) {
          // Pega os 3 mais recentes e randomiza o resto
          const topRecent = newFriends.slice(0, Math.min(3, newFriends.length))
          const rest = newFriends.slice(Math.min(3, newFriends.length))
          
          // Randomiza o resto
          const shuffledRest = shuffleArray(rest)
          
          // Combina: top recentes primeiro, depois o resto randomizado
          processedFriends = [...topRecent, ...shuffledRest]
          
          // Randomiza a ordem final também para garantir variação
          processedFriends = shuffleArray(processedFriends)
        } else {
          processedFriends = newFriends
        }
      }
      // Se TODOS são antigos: randomiza todos
      else if (oldFriends.length > 0 && newFriends.length === 0) {
        processedFriends = shuffleArray(oldFriends)
      }
      // Caso vazio ou sem data - randomiza todos
      else {
        // Se não há data, randomiza todos
        processedFriends = shuffleArray(friendsList)
      }
      
      // GARANTE randomização final - aplica shuffle adicional SEMPRE
      // Isso garante que mesmo com poucos amigos, a ordem mude
      if (processedFriends.length > 1) {
        console.log('[Dashboard] Aplicando shuffle final para garantir randomização...')
        processedFriends = shuffleArray(processedFriends)
      }
      
      console.log('[Dashboard] processFriendsForDisplay: processados', processedFriends.length, 'de', friendsList.length)
      console.log('[Dashboard] Ordem final dos amigos:', processedFriends.map(f => f.name || f._id).join(' -> '))
      return processedFriends
    } catch (error) {
      console.error('[Dashboard] Erro ao processar amigos:', error)
      // Em caso de erro, retorna a lista original
      return friendsList
    }
  }

  useEffect(() => {
    console.log('[Dashboard] useEffect - user:', user?._id)
    loadProducts()
    if (user) {
      console.log('[Dashboard] Chamando loadFriends...')
      // Força recarregamento dos amigos a cada vez para garantir randomização
      loadFriends()
    } else {
      console.log('[Dashboard] Usuário não disponível, não carregando amigos')
    }
  }, [user])
  
  // Adiciona um listener para recarregar amigos quando a página recebe foco
  useEffect(() => {
    const handleFocus = () => {
      if (user) {
        console.log('[Dashboard] Página recebeu foco, recarregando amigos...')
        loadFriends()
      }
    }
    window.addEventListener('focus', handleFocus)
    return () => window.removeEventListener('focus', handleFocus)
  }, [user])

  // Recarrega produtos quando a página recebe foco (útil após adicionar produto)
  useEffect(() => {
    const handleFocus = () => {
      loadProducts()
    }
    window.addEventListener('focus', handleFocus)
    return () => window.removeEventListener('focus', handleFocus)
  }, [])

  // Recarrega quando volta para a página
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        loadProducts()
      }
    }
    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [])

  const loadProducts = async () => {
    try {
      setLoading(true)
      const data = await productService.getProducts()
      console.log('Produtos carregados no feed:', data?.length || 0, 'produtos')
      if (data && Array.isArray(data)) {
        setProducts(data)
      } else {
        console.warn('Resposta inválida do servidor:', data)
        setProducts([])
      }
    } catch (error) {
      console.error('Erro ao carregar produtos:', error)
      setProducts([])
    } finally {
      setLoading(false)
    }
  }

  const loadFriends = async () => {
    if (!user) {
      console.log('[Dashboard] loadFriends: usuário não autenticado')
      return
    }
    try {
      console.log('[Dashboard] ===== INICIANDO CARREGAMENTO DE AMIGOS =====')
      const friendsData = await authService.getFriends()
      const friendsArray = Array.isArray(friendsData) ? friendsData : []
      console.log('[Dashboard] Amigos recebidos do backend:', friendsArray.length)
      console.log('[Dashboard] Ordem do backend:', friendsArray.map(f => f.name || f._id).join(', '))
      
      // Sempre define friends primeiro
      setFriends(friendsArray)
      
      // Aplica a mesma lógica de randomização e ordenação do feed
      if (friendsArray.length > 0) {
        console.log('[Dashboard] Chamando processFriendsForDisplay...')
        const processedFriends = processFriendsForDisplay(friendsArray)
        console.log('[Dashboard] Amigos após processamento:', processedFriends.length)
        console.log('[Dashboard] Ordem após processamento:', processedFriends.map(f => f.name || f._id).join(', '))
        
        // Garante que sempre há uma lista para exibir
        if (processedFriends.length > 0) {
          setDisplayedFriends(processedFriends)
        } else {
          console.warn('[Dashboard] Processamento retornou array vazio, usando lista original')
          setDisplayedFriends(friendsArray)
        }
      } else {
        console.log('[Dashboard] Nenhum amigo para processar')
        setDisplayedFriends([])
      }
      console.log('[Dashboard] ===== FIM DO CARREGAMENTO DE AMIGOS =====')
    } catch (error) {
      console.error('[Dashboard] Erro ao carregar amigos:', error)
      setFriends([])
      setDisplayedFriends([])
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 pb-20">
      {/* Header Mobile/Desktop */}
      <header className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur-sm border-b border-slate-800">
        <div className="max-w-2xl mx-auto px-4">
          <div className="flex items-center justify-between h-14">
            <h1 className="text-xl font-bold text-gray-100">LendMe</h1>
            <div className="flex items-center space-x-4">
              <button
                onClick={loadProducts}
                className="text-gray-300 hover:text-gray-100 transition-colors"
                title="Atualizar feed"
              >
                <RefreshCw size={24} />
              </button>
              <Link to="/explore" className="text-gray-300 hover:text-gray-100">
                <Search size={24} />
              </Link>
              <Link to="/create-loan" className="text-gray-300 hover:text-gray-100" title="Pedir empréstimo">
                <Handshake size={24} />
              </Link>
              <Link to="/add-product" className="text-gray-300 hover:text-gray-100">
                <Plus size={24} />
              </Link>
              <Link to="/messages" className="text-gray-300 hover:text-gray-100 relative">
                <MessageCircle size={24} />
                <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Stories/Destaques */}
      <div className="max-w-2xl mx-auto px-4 py-4 border-b border-slate-800 overflow-x-auto">
        <div className="flex space-x-4">
          {/* Seu destaque */}
          <Link to="/profile" className="flex flex-col items-center space-y-1 flex-shrink-0">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 p-0.5">
              {user?.profilePic ? (
                <div className="w-full h-full rounded-full overflow-hidden bg-slate-900">
                  <img 
                    src={getImageUrl(user.profilePic)} 
                    alt={user?.name || 'Você'} 
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.style.display = 'none'
                      const fallback = e.target.parentElement.querySelector('.avatar-fallback')
                      if (fallback) fallback.style.display = 'flex'
                    }}
                  />
                  <div className="avatar-fallback hidden w-full h-full rounded-full bg-slate-900 items-center justify-center">
                    <span className="text-white font-semibold text-sm">
                      {user?.name?.charAt(0).toUpperCase() || 'V'}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="w-full h-full rounded-full bg-slate-900 flex items-center justify-center">
                  <Plus size={20} className="text-gray-300" />
                </div>
              )}
            </div>
            <span className="text-xs text-gray-400">Seu destaque</span>
          </Link>
          
          {/* Amigos */}
          {(() => {
            const friendsToShow = displayedFriends.length > 0 ? displayedFriends : friends
            console.log('[Dashboard] Renderizando amigos. displayedFriends:', displayedFriends.length, 'friends:', friends.length, 'total:', friendsToShow.length, 'dados:', friendsToShow)
            return friendsToShow.slice(0, 10).map((friend) => {
            const friendId = friend._id?.toString() || friend._id
            const friendName = friend.name || 'Usuário'
            return (
              <Link 
                key={friendId} 
                to={`/user/${friendId}`}
                className="flex flex-col items-center space-y-1 flex-shrink-0"
              >
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 p-0.5">
                  {friend.profilePic ? (
                    <div className="w-full h-full rounded-full overflow-hidden bg-slate-800">
                      <img 
                        src={getImageUrl(friend.profilePic)} 
                        alt={friendName} 
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.style.display = 'none'
                          const fallback = e.target.parentElement.querySelector('.avatar-fallback')
                          if (fallback) fallback.style.display = 'flex'
                        }}
                      />
                      <div className="avatar-fallback hidden w-full h-full rounded-full bg-slate-800 items-center justify-center">
                        <span className="text-white font-semibold text-sm">
                          {friendName.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="w-full h-full rounded-full bg-slate-800 flex items-center justify-center">
                      <span className="text-white font-semibold text-sm">
                        {friendName.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                </div>
                <span className="text-xs text-gray-400 truncate max-w-[64px]">{friendName}</span>
              </Link>
            )
          })
          })()}
        </div>
      </div>

      {/* Feed de Produtos */}
      <main className="max-w-2xl mx-auto px-4 py-4">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-12">
            <div className="mb-6">
              <div className="w-24 h-24 bg-slate-800 rounded-full mx-auto mb-4 flex items-center justify-center">
                <Plus size={48} className="text-gray-400" />
              </div>
            </div>
            <h2 className="text-xl font-semibold text-gray-100 mb-2">Feed vazio</h2>
            <p className="text-gray-400 mb-6">
              Adicione produtos ou faça amizades para ver produtos no feed
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link to="/add-product" className="btn-primary inline-flex items-center justify-center space-x-2">
                <Plus size={20} />
                <span>Adicionar Produto</span>
              </Link>
              <Link to="/friends" className="btn-secondary inline-flex items-center justify-center space-x-2">
                <span>Buscar Amigos</span>
              </Link>
            </div>
          </div>
        ) : (
          products.map((product) => (
            <ProductCard key={product._id} product={product} user={product.user} />
          ))
        )}
      </main>

      {/* Bottom Navigation (Mobile) */}
      <BottomNavigation />
    </div>
  )
}

export default Dashboard
