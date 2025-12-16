import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { ArrowLeft, User, Bell, Lock, Shield, LogOut, Trash2 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import BottomNavigation from '../components/BottomNavigation'

const Settings = () => {
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const [notifications, setNotifications] = useState({
    trades: true,
    messages: true,
    invites: true
  })

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const settingsSections = [
    {
      title: 'Conta',
      icon: User,
      items: [
        { label: 'Editar Perfil', action: () => navigate('/profile/edit') },
        { label: 'Meus Convites', action: () => navigate('/invites') },
        { label: 'Mudar Senha', action: () => navigate('/settings/password') },
        { label: 'Privacidade', action: () => navigate('/settings/privacy') },
      ]
    },
    {
      title: 'Notificações',
      icon: Bell,
      items: [
        {
          label: 'Trocas',
          type: 'toggle',
          value: notifications.trades,
          onChange: (val) => setNotifications(prev => ({ ...prev, trades: val }))
        },
        {
          label: 'Mensagens',
          type: 'toggle',
          value: notifications.messages,
          onChange: (val) => setNotifications(prev => ({ ...prev, messages: val }))
        },
        {
          label: 'Convites',
          type: 'toggle',
          value: notifications.invites,
          onChange: (val) => setNotifications(prev => ({ ...prev, invites: val }))
        },
      ]
    },
    {
      title: 'Segurança',
      icon: Shield,
      items: [
        { label: 'Autenticação de Dois Fatores', action: () => {} },
        { label: 'Sessões Ativas', action: () => navigate('/settings/sessions') },
        { label: 'Histórico de Login', action: () => navigate('/settings/history') },
      ]
    },
    {
      title: 'Sobre',
      icon: Lock,
      items: [
        { label: 'Termos de Uso', action: () => {} },
        { label: 'Política de Privacidade', action: () => {} },
        { label: 'Versão 1.0.0', action: () => {} },
      ]
    }
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
            <h1 className="text-xl font-bold text-gray-100">Configurações</h1>
            <div className="w-6"></div>
          </div>
        </div>
      </header>

      {/* User Info */}
      <div className="max-w-2xl mx-auto px-4 py-6 border-b border-slate-800">
        <div className="flex items-center space-x-4">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
            <span className="text-white font-bold text-xl">
              {user?.name?.charAt(0).toUpperCase() || 'U'}
            </span>
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-semibold text-gray-100">{user?.name || 'Usuário'}</h2>
            <p className="text-sm text-gray-400">{user?.email || 'usuario@email.com'}</p>
          </div>
        </div>
      </div>

      {/* Settings Sections */}
      <div className="max-w-2xl mx-auto px-4 py-4">
        {settingsSections.map((section) => {
          const IconComponent = section.icon
          return (
            <div key={section.title} className="mb-6">
              <div className="flex items-center space-x-2 mb-3">
                <IconComponent size={20} className="text-gray-400" />
                <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wide">
                  {section.title}
                </h3>
              </div>
              <div className="bg-slate-900 rounded-lg border border-slate-800 overflow-hidden">
                {section.items.map((item, index) => (
                  <div key={index}>
                    {item.type === 'toggle' ? (
                      <div className="flex items-center justify-between p-4">
                        <span className="text-gray-100">{item.label}</span>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={item.value}
                            onChange={(e) => item.onChange(e.target.checked)}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-500"></div>
                        </label>
                      </div>
                    ) : (
                      <button
                        onClick={item.action}
                        className="w-full flex items-center justify-between p-4 text-gray-100 hover:bg-slate-800 transition-colors"
                      >
                        <span>{item.label}</span>
                        <ArrowLeft size={16} className="text-gray-400 rotate-180" />
                      </button>
                    )}
                    {index < section.items.length - 1 && (
                      <div className="border-b border-slate-800"></div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )
        })}

        {/* Danger Zone */}
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-red-400 uppercase tracking-wide mb-3">
            Zona de Perigo
          </h3>
          <div className="bg-slate-900 rounded-lg border border-red-800/50 overflow-hidden">
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-between p-4 text-red-400 hover:bg-red-900/20 transition-colors"
            >
              <div className="flex items-center space-x-3">
                <LogOut size={20} />
                <span>Sair da Conta</span>
              </div>
              <ArrowLeft size={16} className="rotate-180" />
            </button>
            <div className="border-b border-slate-800"></div>
            <button
              className="w-full flex items-center justify-between p-4 text-red-400 hover:bg-red-900/20 transition-colors"
            >
              <div className="flex items-center space-x-3">
                <Trash2 size={20} />
                <span>Excluir Conta</span>
              </div>
              <ArrowLeft size={16} className="rotate-180" />
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Navigation */}
      <BottomNavigation />
    </div>
  )
}

export default Settings
