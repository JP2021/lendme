import { useState, useEffect } from 'react'
import { Search, Filter } from 'lucide-react'
import ProductCard from '../components/ProductCard'
import BottomNavigation from '../components/BottomNavigation'
import { productService } from '../services/productService'

const Explore = () => {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)

  const categories = ['Todos', 'Ferramentas', 'Livros', 'Esportes', 'Eletrônicos', 'Roupas', 'Móveis', 'Brinquedos', 'Outros']

  useEffect(() => {
    loadProducts()
  }, [selectedCategory, searchQuery])

  const loadProducts = async () => {
    try {
      setLoading(true)
      const filters = {}
      if (selectedCategory && selectedCategory !== 'Todos') {
        filters.category = selectedCategory
      }
      if (searchQuery) {
        filters.search = searchQuery
      }
      const data = await productService.getProducts(filters)
      setProducts(data)
    } catch (error) {
      console.error('Erro ao carregar produtos:', error)
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
            <h1 className="text-xl font-bold text-gray-100">Explorar</h1>
            <button className="text-gray-300 hover:text-gray-100">
              <Filter size={24} />
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
            placeholder="Buscar produtos..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-900 border border-slate-800 rounded-lg text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
          />
        </div>
      </div>

      {/* Categories */}
      <div className="max-w-2xl mx-auto px-4 mb-4">
        <div className="flex space-x-2 overflow-x-auto pb-2">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat === 'Todos' ? '' : cat)}
              className={`px-4 py-2 rounded-full text-sm whitespace-nowrap transition-colors ${
                (cat === 'Todos' && !selectedCategory) || selectedCategory === cat
                  ? 'bg-blue-500 text-white'
                  : 'bg-slate-900 border border-slate-800 text-gray-300 hover:bg-slate-800'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Feed */}
      <main className="max-w-2xl mx-auto px-4 py-4">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-400">Nenhum produto encontrado</p>
          </div>
        ) : (
          products.map((product) => (
            <ProductCard key={product._id} product={product} user={product.user} />
          ))
        )}
      </main>

      {/* Bottom Navigation */}
      <BottomNavigation />
    </div>
  )
}

export default Explore
