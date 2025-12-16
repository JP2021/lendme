import { useState } from 'react'
import { X, Upload, Tag, FileText } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import BottomNavigation from '../components/BottomNavigation'
import { productService } from '../services/productService'

const AddProduct = () => {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: '',
    condition: 'excellent',
    type: 'trade', // 'trade', 'donation' ou 'loan'
    images: []
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const categories = [
    'Ferramentas',
    'Livros',
    'Eletrônicos',
    'Esportes',
    'Roupas',
    'Móveis',
    'Brinquedos',
    'Outros'
  ]

  const conditions = [
    { value: 'excellent', label: 'Excelente' },
    { value: 'good', label: 'Bom' },
    { value: 'fair', label: 'Regular' },
    { value: 'poor', label: 'Ruim' }
  ]

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    if (error) setError('')
  }

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files)
    setFormData(prev => ({
      ...prev,
      images: [...prev.images, ...files.slice(0, 5 - prev.images.length)]
    }))
  }

  const removeImage = (index) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    if (formData.images.length === 0) {
      setError('Por favor, adicione pelo menos uma imagem do produto.')
      setLoading(false)
      return
    }

    try {
      const result = await productService.createProduct(formData)
      console.log('Produto criado:', result)
      // Redireciona para o dashboard para ver o produto no feed
      navigate('/')
    } catch (err) {
      console.error('Erro ao criar produto:', err)
      setError(err.response?.data?.message || 'Erro ao criar produto')
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
            <button
              onClick={() => navigate(-1)}
              className="text-gray-300 hover:text-gray-100"
            >
              <X size={24} />
            </button>
            <h1 className="text-xl font-bold text-gray-100">Novo Produto</h1>
            <button
              onClick={handleSubmit}
              disabled={!formData.name || loading}
              className="text-blue-400 hover:text-blue-300 disabled:text-gray-600 disabled:cursor-not-allowed font-semibold"
            >
              {loading ? 'Salvando...' : 'Publicar'}
            </button>
          </div>
        </div>
      </header>

      {/* Form */}
      <form onSubmit={handleSubmit} className="max-w-2xl mx-auto px-4 py-6">
        {/* Upload de Imagens */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Fotos do Produto
          </label>
          <div className="grid grid-cols-3 gap-2 mb-2">
            {formData.images.map((image, index) => (
              <div key={index} className="relative aspect-square bg-slate-800 rounded-lg overflow-hidden">
                <img 
                  src={URL.createObjectURL(image)} 
                  alt={`Preview ${index + 1}`}
                  className="w-full h-full object-cover"
                />
                <button
                  type="button"
                  onClick={() => removeImage(index)}
                  className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1"
                >
                  <X size={14} />
                </button>
              </div>
            ))}
            {formData.images.length < 5 && (
              <label className="aspect-square bg-slate-800 border-2 border-dashed border-slate-700 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-blue-500 transition-colors">
                <Upload size={24} className="text-gray-400 mb-1" />
                <span className="text-xs text-gray-400">Adicionar</span>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </label>
            )}
          </div>
          {formData.images.length === 0 && (
            <label className="block w-full h-48 bg-slate-800 border-2 border-dashed border-slate-700 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-blue-500 transition-colors">
              <Upload size={32} className="text-gray-400 mb-2" />
              <span className="text-sm text-gray-400">Adicione até 5 fotos</span>
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
            </label>
          )}
        </div>

        {/* Nome do Produto */}
        <div className="mb-4">
          <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-2">
            Nome do Produto *
          </label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
            className="input-field"
            placeholder="Ex: Furadeira Bosch GSR 120-LI"
          />
        </div>

        {/* Descrição */}
        <div className="mb-4">
          <label htmlFor="description" className="block text-sm font-medium text-gray-300 mb-2">
            Descrição
          </label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows={4}
            className="input-field resize-none"
            placeholder="Descreva o produto, estado de conservação, acessórios incluídos..."
          />
        </div>

        {/* Categoria */}
        <div className="mb-4">
          <label htmlFor="category" className="block text-sm font-medium text-gray-300 mb-2">
            Categoria
          </label>
          <div className="relative">
            <Tag className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <select
              id="category"
              name="category"
              value={formData.category}
              onChange={handleChange}
              className="input-field pl-10"
            >
              <option value="">Selecione uma categoria</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Tipo de Produto */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Tipo
          </label>
          <div className="grid grid-cols-3 gap-2">
            <label
              className={`flex items-center space-x-2 p-3 rounded-lg border cursor-pointer transition-colors ${
                formData.type === 'trade'
                  ? 'bg-blue-500/20 border-blue-500'
                  : 'bg-slate-800 border-slate-700 hover:border-slate-600'
              }`}
            >
              <input
                type="radio"
                name="type"
                value="trade"
                checked={formData.type === 'trade'}
                onChange={handleChange}
                className="hidden"
              />
              <span className="text-sm text-gray-300">Troca</span>
            </label>
            <label
              className={`flex items-center space-x-2 p-3 rounded-lg border cursor-pointer transition-colors ${
                formData.type === 'donation'
                  ? 'bg-green-500/20 border-green-500'
                  : 'bg-slate-800 border-slate-700 hover:border-slate-600'
              }`}
            >
              <input
                type="radio"
                name="type"
                value="donation"
                checked={formData.type === 'donation'}
                onChange={handleChange}
                className="hidden"
              />
              <span className="text-sm text-gray-300">Doação</span>
            </label>
            <label
              className={`flex items-center space-x-2 p-3 rounded-lg border cursor-pointer transition-colors ${
                formData.type === 'loan'
                  ? 'bg-purple-500/20 border-purple-500'
                  : 'bg-slate-800 border-slate-700 hover:border-slate-600'
              }`}
            >
              <input
                type="radio"
                name="type"
                value="loan"
                checked={formData.type === 'loan'}
                onChange={handleChange}
                className="hidden"
              />
              <span className="text-sm text-gray-300">Empréstimo</span>
            </label>
          </div>
        </div>

        {/* Condição */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Estado de Conservação
          </label>
          <div className="grid grid-cols-2 gap-2">
            {conditions.map((condition) => (
              <label
                key={condition.value}
                className={`flex items-center space-x-2 p-3 rounded-lg border cursor-pointer transition-colors ${
                  formData.condition === condition.value
                    ? 'bg-blue-500/20 border-blue-500'
                    : 'bg-slate-800 border-slate-700 hover:border-slate-600'
                }`}
              >
                <input
                  type="radio"
                  name="condition"
                  value={condition.value}
                  checked={formData.condition === condition.value}
                  onChange={handleChange}
                  className="hidden"
                />
                <span className="text-sm text-gray-300">{condition.label}</span>
              </label>
            ))}
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-900/30 border border-red-800 rounded-lg text-red-400 text-sm">
            {error}
          </div>
        )}

        {/* Botão de Publicar */}
        <button
          type="submit"
          disabled={!formData.name || loading}
          className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Publicando...' : 'Publicar Produto'}
        </button>
      </form>

      {/* Bottom Navigation */}
      <BottomNavigation />
    </div>
  )
}

export default AddProduct
