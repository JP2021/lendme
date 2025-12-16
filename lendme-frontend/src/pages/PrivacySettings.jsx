import { useState, useEffect } from 'react'
import { ArrowLeft, Eye, EyeOff, Users, UserCheck, Globe, Lock } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import BottomNavigation from '../components/BottomNavigation'
import { useAuth } from '../contexts/AuthContext'
import api from '../services/authService'

const PrivacySettings = () => {
  const navigate = useNavigate()
  const { user, checkAuthStatus } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [privacySettings, setPrivacySettings] = useState({
    isPublic: true,
    showEmail: false,
    allowFriendRequests: true,
    showProducts: true,
  })

  useEffect(() => {
    if (user) {
      setPrivacySettings({
        isPublic: user.isPublic !== false, // Por padrão é público
        showEmail: user.showEmail || false,
        allowFriendRequests: user.allowFriendRequests !== false,
        showProducts: user.showProducts !== false,
      })
    }
  }, [user])

  const handleToggle = async (setting, value) => {
    setLoading(true)
    setError('')
    setSuccess('')

    try {
      const updates = { [setting]: value }
      await api.put('/profile', updates)
      
      // Atualiza o estado local
      setPrivacySettings(prev => ({ ...prev, [setting]: value }))
      
      // Atualiza o contexto
      await checkAuthStatus()
      
      setSuccess('Configuração atualizada!')
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      setError(err.response?.data?.message || 'Erro ao atualizar configuração')
      setTimeout(() => setError(''), 5000)
    } finally {
      setLoading(false)
    }
  }

  const privacyOptions = [
    {
      key: 'isPublic',
      label: 'Perfil Público',
      description: 'Permite que outros usuários vejam seu perfil e produtos',
      icon: Globe,
      enabled: privacySettings.isPublic,
    },
    {
      key: 'showEmail',
      label: 'Mostrar E-mail',
      description: 'Permite que outros usuários vejam seu e-mail',
      icon: Eye,
      enabled: privacySettings.showEmail,
    },
    {
      key: 'allowFriendRequests',
      label: 'Aceitar Solicitações de Amizade',
      description: 'Permite que outros usuários enviem solicitações de amizade',
      icon: UserCheck,
      enabled: privacySettings.allowFriendRequests,
    },
    {
      key: 'showProducts',
      label: 'Mostrar Produtos no Feed',
      description: 'Permite que seus produtos apareçam no feed de outros usuários',
      icon: Users,
      enabled: privacySettings.showProducts,
    },
  ]

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
            <h1 className="text-xl font-bold text-gray-100">Privacidade</h1>
            <div className="w-6"></div>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6">
        {/* Info Section */}
        <div className="mb-6 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
          <div className="flex items-start space-x-3">
            <Lock className="text-blue-400 mt-0.5" size={20} />
            <div>
              <h3 className="text-sm font-semibold text-blue-400 mb-1">Controle sua Privacidade</h3>
              <p className="text-xs text-gray-400">
                Configure quem pode ver suas informações e interagir com você na plataforma.
              </p>
            </div>
          </div>
        </div>

        {/* Privacy Settings */}
        <div className="space-y-4">
          {privacyOptions.map((option) => {
            const IconComponent = option.icon
            return (
              <div
                key={option.key}
                className="bg-slate-900 rounded-lg border border-slate-800 p-4"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <IconComponent
                        size={20}
                        className={option.enabled ? 'text-blue-400' : 'text-gray-500'}
                      />
                      <h3 className="text-gray-100 font-semibold">{option.label}</h3>
                    </div>
                    <p className="text-sm text-gray-400 ml-8">{option.description}</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer ml-4">
                    <input
                      type="checkbox"
                      checked={option.enabled}
                      onChange={(e) => handleToggle(option.key, e.target.checked)}
                      disabled={loading}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-500 peer-disabled:opacity-50"></div>
                  </label>
                </div>
              </div>
            )
          })}
        </div>

        {/* Messages */}
        {error && (
          <div className="mt-6 p-4 bg-red-900/30 border border-red-800 rounded-lg text-red-400 text-sm">
            {error}
          </div>
        )}

        {success && (
          <div className="mt-6 p-4 bg-green-900/30 border border-green-800 rounded-lg text-green-400 text-sm">
            {success}
          </div>
        )}

        {/* Additional Info */}
        <div className="mt-8 p-4 bg-slate-900 rounded-lg border border-slate-800">
          <h3 className="text-sm font-semibold text-gray-100 mb-2">Sobre Privacidade</h3>
          <ul className="text-xs text-gray-400 space-y-1 list-disc list-inside">
            <li>Perfis públicos podem ser encontrados por qualquer usuário</li>
            <li>Perfis privados só podem ser vistos por amigos</li>
            <li>Você sempre pode ver seus próprios produtos, independente das configurações</li>
            <li>As configurações de privacidade não afetam trocas já iniciadas</li>
          </ul>
        </div>
      </main>

      <BottomNavigation />
    </div>
  )
}

export default PrivacySettings

