import { useState } from 'react'
import { X } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import BottomNavigation from '../components/BottomNavigation'
import { loanService } from '../services/loanService'

const CreateLoanRequest = () => {
  const navigate = useNavigate()
  const [itemName, setItemName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    if (!itemName.trim()) {
      setError('Por favor, informe o nome do item que você precisa.')
      setLoading(false)
      return
    }

    try {
      await loanService.createLoanRequest(itemName.trim())
      alert('Pedido de empréstimo criado com sucesso!')
      navigate('/')
    } catch (err) {
      console.error('Erro ao criar pedido de empréstimo:', err)
      setError(err.response?.data?.message || 'Erro ao criar pedido de empréstimo')
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
            <h1 className="text-xl font-bold text-gray-100">Pedir Empréstimo</h1>
            <button
              onClick={handleSubmit}
              disabled={!itemName.trim() || loading}
              className="text-blue-400 hover:text-blue-300 disabled:text-gray-600 disabled:cursor-not-allowed font-semibold"
            >
              {loading ? 'Criando...' : 'Publicar'}
            </button>
          </div>
        </div>
      </header>

      {/* Form */}
      <form onSubmit={handleSubmit} className="max-w-2xl mx-auto px-4 py-6">
        <div className="mb-6">
          <label htmlFor="itemName" className="block text-sm font-medium text-gray-300 mb-2">
            O que você precisa?
          </label>
          <input
            type="text"
            id="itemName"
            value={itemName}
            onChange={(e) => setItemName(e.target.value)}
            required
            className="input-field"
            placeholder="Ex: Furadeira, Bicicleta, Livro..."
          />
          <p className="mt-2 text-xs text-gray-400">
            Seu pedido aparecerá no feed no formato: "{itemName || 'Seu nome'} precisa de {itemName || 'um item'}"
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-900/30 border border-red-800 rounded-lg text-red-400 text-sm">
            {error}
          </div>
        )}

        {/* Botão de Publicar */}
        <button
          type="submit"
          disabled={!itemName.trim() || loading}
          className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Publicando...' : 'Publicar Pedido'}
        </button>
      </form>

      {/* Bottom Navigation */}
      <BottomNavigation />
    </div>
  )
}

export default CreateLoanRequest

