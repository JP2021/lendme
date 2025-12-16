import { useState, useEffect } from 'react'
import { ArrowLeft, User, Mail, Save } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import BottomNavigation from '../components/BottomNavigation'
import { useAuth } from '../contexts/AuthContext'
import api from '../services/authService'

const updateProfile = async (profileData) => {
  const response = await api.put('/profile', profileData)
  return response.data
}

const EditProfile = () => {
  const navigate = useNavigate()
  const { user, checkAuthStatus } = useAuth()
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    bio: ''
  })
  const [loading, setLoading] = useState(false)
  const [loadingData, setLoadingData] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        bio: user.bio || ''
      })
      setLoadingData(false)
    }
  }, [user])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    if (error) setError('')
    if (success) setSuccess('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    try {
      await updateProfile({
        name: formData.name,
        email: formData.email,
        bio: formData.bio
      })
      
      // Atualiza o contexto
      await checkAuthStatus()
      setSuccess('Perfil atualizado com sucesso!')
      
      setTimeout(() => {
        navigate('/profile')
      }, 1500)
    } catch (err) {
      setError(err.response?.data?.message || 'Erro ao atualizar perfil')
    } finally {
      setLoading(false)
    }
  }

  if (loadingData) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    )
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
              <ArrowLeft size={24} />
            </button>
            <h1 className="text-xl font-bold text-gray-100">Editar Perfil</h1>
            <button
              onClick={handleSubmit}
              disabled={loading || !formData.name}
              className="text-blue-400 hover:text-blue-300 disabled:text-gray-600 disabled:cursor-not-allowed font-semibold"
            >
              {loading ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        </div>
      </header>

      {/* Form */}
      <form onSubmit={handleSubmit} className="max-w-2xl mx-auto px-4 py-6">
        {/* Avatar */}
        <div className="mb-6 text-center">
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center mx-auto mb-4">
            <span className="text-white font-bold text-3xl">
              {formData.name?.charAt(0).toUpperCase() || 'U'}
            </span>
          </div>
          <button
            type="button"
            className="text-sm text-blue-400 hover:text-blue-300"
            onClick={() => alert('Upload de foto será implementado em breve')}
          >
            Alterar foto
          </button>
        </div>

        {/* Nome */}
        <div className="mb-4">
          <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-2 flex items-center space-x-2">
            <User size={16} />
            <span>Nome de usuário *</span>
          </label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
            className="input-field"
            placeholder="Seu nome de usuário"
          />
        </div>

        {/* Email */}
        <div className="mb-4">
          <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2 flex items-center space-x-2">
            <Mail size={16} />
            <span>E-mail *</span>
          </label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
            className="input-field"
            placeholder="seu@email.com"
          />
        </div>

        {/* Bio */}
        <div className="mb-6">
          <label htmlFor="bio" className="block text-sm font-medium text-gray-300 mb-2">
            Biografia
          </label>
          <textarea
            id="bio"
            name="bio"
            value={formData.bio}
            onChange={handleChange}
            rows={4}
            className="input-field resize-none"
            placeholder="Conte um pouco sobre você..."
            maxLength={200}
          />
          <p className="text-xs text-gray-400 mt-1">
            {formData.bio.length}/200 caracteres
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-900/30 border border-red-800 rounded-lg text-red-400 text-sm">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-4 p-3 bg-green-900/30 border border-green-800 rounded-lg text-green-400 text-sm">
            {success}
          </div>
        )}

        {/* Botão de Salvar */}
        <button
          type="submit"
          disabled={loading || !formData.name}
          className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
        >
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              <span>Salvando...</span>
            </>
          ) : (
            <>
              <Save size={20} />
              <span>Salvar Alterações</span>
            </>
          )}
        </button>
      </form>

      {/* Bottom Navigation */}
      <BottomNavigation />
    </div>
  )
}

export default EditProfile

