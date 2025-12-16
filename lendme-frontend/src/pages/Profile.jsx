import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { Settings, Grid3x3, List, Bookmark } from 'lucide-react'
import { Link } from 'react-router-dom'
import BottomNavigation from '../components/BottomNavigation'
import { productService } from '../services/productService'
import { authService } from '../services/authService'
import { getImageUrl } from '../utils/imageUtils'

const Profile = () => {
  const { user } = useAuth()
  const [viewMode, setViewMode] = useState('grid')
  const [userProducts, setUserProducts] = useState([])
  const [friends, setFriends] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      const [products, friendsData] = await Promise.all([
        productService.getMyProducts(),
        authService.getFriends()
      ])
      setUserProducts(products)
      setFriends(friendsData)
    } catch (error) {
      console.error('Erro ao carregar dados:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 pb-20">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur-sm border-b border-slate-800">
        <div className="max-w-2xl mx-auto px-4">
          <div className="flex items-center justify-between h-14">
            <h1 className="text-xl font-bold text-gray-100">{user?.name || 'Perfil'}</h1>
            <Link to="/settings" className="text-gray-300 hover:text-gray-100">
              <Settings size={24} />
            </Link>
          </div>
        </div>
      </header>

      {/* Perfil Info */}
      <div className="max-w-2xl mx-auto px-4 py-6">
        <div className="flex items-center space-x-6 mb-6">
          {user?.profilePic ? (
            <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-slate-700">
              <img 
                src={getImageUrl(user.profilePic)} 
                alt={user?.name || 'Perfil'} 
                className="w-full h-full object-cover"
                onError={(e) => {
                  // Se a imagem falhar ao carregar, mostra o fallback
                  e.target.style.display = 'none'
                  const fallback = e.target.parentElement.querySelector('.avatar-fallback')
                  if (fallback) fallback.style.display = 'flex'
                }}
              />
              <div className="avatar-fallback hidden w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 items-center justify-center">
                <span className="text-white font-bold text-3xl">
                  {user?.name?.charAt(0).toUpperCase() || 'U'}
                </span>
              </div>
            </div>
          ) : (
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
              <span className="text-white font-bold text-3xl">
                {user?.name?.charAt(0).toUpperCase() || 'U'}
              </span>
            </div>
          )}
          <div className="flex-1">
            <div className="flex items-center space-x-4 mb-4">
              <div className="text-center">
                <p className="text-lg font-bold text-gray-100">{userProducts.length}</p>
                <p className="text-sm text-gray-400">produtos</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-bold text-gray-100">{friends.length}</p>
                <p className="text-sm text-gray-400">amigos</p>
              </div>
            </div>
            <Link
              to="/profile/edit"
              className="block w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors text-center"
            >
              Editar Perfil
            </Link>
          </div>
        </div>

        {/* Bio */}
        <div className="mb-6">
          <h2 className="font-semibold text-gray-100 mb-1">{user?.name || 'Nome do Usuário'}</h2>
          <p className="text-sm text-gray-400">
            {user?.email || 'usuario@email.com'}
          </p>
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
          <button
            onClick={() => setViewMode('saved')}
            className={`flex items-center space-x-2 py-4 px-2 ${
              viewMode === 'saved' ? 'text-gray-100 border-t-2 border-gray-100' : 'text-gray-400'
            }`}
          >
            <Bookmark size={20} />
            <span className="hidden sm:inline">Salvos</span>
          </button>
        </div>

        {/* Grid de Produtos */}
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          </div>
        ) : viewMode === 'grid' && (
          <div className="grid grid-cols-3 gap-1">
            {userProducts.length === 0 ? (
              <div className="col-span-3 text-center py-12">
                <p className="text-gray-400">Nenhum produto ainda</p>
              </div>
            ) : (
              userProducts.map((product) => (
                <Link
                  key={product._id}
                  to={`/products/${product._id}`}
                  className="aspect-square bg-slate-800 rounded-lg flex items-center justify-center hover:opacity-80 transition-opacity cursor-pointer overflow-hidden"
                >
                  {product.images && product.images.length > 0 ? (
                    <img 
                      src={`http://localhost:3001${product.images[0]}`} 
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
            {userProducts.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-400">Nenhum produto ainda</p>
              </div>
            ) : (
              userProducts.map((product) => (
                <div
                  key={product._id}
                  className="bg-slate-900 rounded-lg p-4 border border-slate-800 flex items-center space-x-4"
                >
                  {product.images && product.images.length > 0 ? (
                    <img src={getImageUrl(product.images[0])} alt={product.name} className="w-16 h-16 rounded-lg object-cover" onError={(e) => { e.target.style.display = 'none'; e.target.nextElementSibling.style.display = 'flex' }} />
                  ) : null}
                  {(!product.images || product.images.length === 0) && (
                    <div className="w-16 h-16 bg-slate-800 rounded-lg flex items-center justify-center">
                      <span className="text-2xl">📦</span>
                    </div>
                  )}
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-100">{product.name}</h3>
                    <p className="text-sm text-gray-400">{product.category}</p>
                    <p className="text-xs text-gray-500">Disponível para troca</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Link to={`/products/${product._id}/edit`} className="text-blue-400 hover:text-blue-300 text-sm">
                      Editar
                    </Link>
                    <Link to={`/products/${product._id}`} className="text-blue-400 hover:text-blue-300">
                      Ver
                    </Link>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Produtos Salvos */}
        {viewMode === 'saved' && (
          <div className="text-center py-12">
            <Bookmark size={48} className="text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400">Nenhum produto salvo ainda</p>
          </div>
        )}
      </div>

      {/* Bottom Navigation (Mobile) */}
      <BottomNavigation />
    </div>
  )
}

export default Profile
