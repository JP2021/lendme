import { useState, useEffect, useRef } from 'react'
import { ArrowLeft, User, Mail, Save, Upload, X, Camera, Lock, Globe } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import BottomNavigation from '../components/BottomNavigation'
import { useAuth } from '../contexts/AuthContext'
import api from '../services/authService'
import axios from 'axios'
import { getImageUrl } from '../utils/imageUtils'

const updateProfile = async (profileData) => {
  const formData = new FormData()
  
  // Adiciona campos de texto
  if (profileData.name) formData.append('name', profileData.name)
  if (profileData.email) formData.append('email', profileData.email)
  if (profileData.bio !== undefined) formData.append('bio', profileData.bio)
  // FormData converte boolean para string, então enviamos como string
  if (profileData.isPublic !== undefined) formData.append('isPublic', String(profileData.isPublic))
  
  // Adiciona arquivo de foto se existir
  if (profileData.profilePic) {
    formData.append('profilePic', profileData.profilePic)
  }
  
  // Usa axios diretamente para enviar FormData com as credenciais corretas
  const API_BASE_URL = import.meta.env.VITE_API_URL || '/api'
  const response = await axios.put(`${API_BASE_URL}/profile`, formData, {
    withCredentials: true,
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })
  return response.data
}

const EditProfile = () => {
  const navigate = useNavigate()
  const { user, checkAuthStatus } = useAuth()
  const fileInputRef = useRef(null)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    bio: '',
    isPublic: true
  })
  const [profilePic, setProfilePic] = useState(null)
  const [profilePicPreview, setProfilePicPreview] = useState(null)
  const [loading, setLoading] = useState(false)
  const [loadingData, setLoadingData] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        bio: user.bio || '',
        isPublic: user.isPublic !== false // Por padrão é público se não estiver definido
      })
      // Se o usuário já tem foto de perfil, define o preview
      if (user.profilePic) {
        setProfilePicPreview(getImageUrl(user.profilePic))
      }
      setLoadingData(false)
    }
  }, [user])

  const handleImageSelect = (e) => {
    const file = e.target.files?.[0]
    if (file) {
      // Validação de tipo de arquivo
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
      if (!allowedTypes.includes(file.type)) {
        setError('Apenas imagens são permitidas (JPG, PNG, GIF, WEBP)')
        return
      }
      
      // Validação de tamanho (2MB)
      if (file.size > 2 * 1024 * 1024) {
        setError('A imagem deve ter no máximo 2MB')
        return
      }
      
      setProfilePic(file)
      setProfilePicPreview(URL.createObjectURL(file))
      setError('')
    }
  }

  const handleRemoveImage = () => {
    setProfilePic(null)
    setProfilePicPreview(user?.profilePic ? getImageUrl(user.profilePic) : null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
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
      // Validação básica
      if (!formData.name || !formData.name.trim()) {
        setError('O nome é obrigatório')
        setLoading(false)
        return
      }

      if (!formData.email || !formData.email.trim()) {
        setError('O e-mail é obrigatório')
        setLoading(false)
        return
      }

      const response = await updateProfile({
        name: formData.name.trim(),
        email: formData.email.trim(),
        bio: formData.bio ? formData.bio.trim() : '',
        isPublic: formData.isPublic,
        profilePic: profilePic
      })
      
      // Atualiza o contexto
      if (checkAuthStatus) {
        await checkAuthStatus()
      }
      
      setSuccess('Perfil atualizado com sucesso!')
      
      setTimeout(() => {
        navigate('/profile')
      }, 1500)
    } catch (err) {
      console.error('Erro ao atualizar perfil:', err)
      const errorMessage = err.response?.data?.message || err.message || 'Erro ao atualizar perfil'
      setError(errorMessage)
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
          <div className="relative w-24 h-24 mx-auto mb-4">
            {profilePicPreview ? (
              <div className="relative w-24 h-24 rounded-full overflow-hidden border-2 border-slate-700">
                <img 
                  src={profilePicPreview} 
                  alt="Foto de perfil" 
                  className="w-full h-full object-cover"
                />
                <button
                  type="button"
                  onClick={handleRemoveImage}
                  className="absolute top-0 right-0 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                >
                  <X size={14} />
                </button>
              </div>
            ) : (
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
                <span className="text-white font-bold text-3xl">
                  {formData.name?.charAt(0).toUpperCase() || 'U'}
                </span>
              </div>
            )}
          </div>
          <div className="flex items-center justify-center space-x-2">
            <label className="cursor-pointer">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                onChange={handleImageSelect}
                className="hidden"
              />
              <span className="flex items-center space-x-2 text-sm text-blue-400 hover:text-blue-300 px-4 py-2 bg-blue-500/10 rounded-lg border border-blue-500/20 hover:border-blue-500/40 transition-colors">
                <Camera size={16} />
                <span>{profilePicPreview ? 'Alterar foto' : 'Adicionar foto'}</span>
              </span>
            </label>
            {profilePicPreview && (
              <button
                type="button"
                onClick={handleRemoveImage}
                className="text-sm text-red-400 hover:text-red-300 px-4 py-2 bg-red-500/10 rounded-lg border border-red-500/20 hover:border-red-500/40 transition-colors"
              >
                Remover
              </button>
            )}
          </div>
          <p className="text-xs text-gray-400 mt-2">
            JPG, PNG, GIF ou WEBP. Máximo 2MB
          </p>
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

        {/* Privacidade */}
        <div className="mb-6 p-4 bg-slate-900/50 rounded-lg border border-slate-800">
          <label className="block text-sm font-medium text-gray-300 mb-3">
            Privacidade do Perfil
          </label>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {formData.isPublic ? (
                <Globe size={20} className="text-blue-400" />
              ) : (
                <Lock size={20} className="text-gray-400" />
              )}
              <div>
                <p className="text-gray-100 font-medium">
                  {formData.isPublic ? 'Perfil Público' : 'Perfil Privado'}
                </p>
                <p className="text-xs text-gray-400">
                  {formData.isPublic 
                    ? 'Qualquer pessoa pode ver seu perfil e produtos' 
                    : 'Apenas seus amigos podem ver seu perfil e produtos'}
                </p>
              </div>
            </div>
            
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                name="isPublic"
                checked={formData.isPublic}
                onChange={handleChange}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
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

