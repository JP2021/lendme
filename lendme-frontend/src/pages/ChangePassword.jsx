import { useState } from 'react'
import { ArrowLeft, Lock, Eye, EyeOff, CheckCircle } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import BottomNavigation from '../components/BottomNavigation'
import api from '../services/authService'

const ChangePassword = () => {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    if (error) setError('')
    if (success) setSuccess('')
  }

  const validatePassword = (password) => {
    if (password.length < 6) {
      return 'A senha deve ter pelo menos 6 caracteres'
    }
    return null
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    // Validações
    if (!formData.currentPassword || !formData.newPassword || !formData.confirmPassword) {
      setError('Por favor, preencha todos os campos')
      setLoading(false)
      return
    }

    const passwordError = validatePassword(formData.newPassword)
    if (passwordError) {
      setError(passwordError)
      setLoading(false)
      return
    }

    if (formData.newPassword !== formData.confirmPassword) {
      setError('As senhas não coincidem')
      setLoading(false)
      return
    }

    if (formData.currentPassword === formData.newPassword) {
      setError('A nova senha deve ser diferente da senha atual')
      setLoading(false)
      return
    }

    try {
      await api.put('/profile/password', {
        currentPassword: formData.currentPassword,
        newPassword: formData.newPassword,
      })

      setSuccess('Senha alterada com sucesso!')
      setFormData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      })

      setTimeout(() => {
        navigate('/settings')
      }, 2000)
    } catch (err) {
      setError(err.response?.data?.message || 'Erro ao alterar senha. Verifique se a senha atual está correta.')
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
              <ArrowLeft size={24} />
            </button>
            <h1 className="text-xl font-bold text-gray-100">Mudar Senha</h1>
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
              <h3 className="text-sm font-semibold text-blue-400 mb-1">Segurança da Conta</h3>
              <p className="text-xs text-gray-400">
                Use uma senha forte com pelo menos 6 caracteres. Evite senhas óbvias ou fáceis de adivinhar.
              </p>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Senha Atual */}
          <div>
            <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-300 mb-2">
              Senha Atual *
            </label>
            <div className="relative">
              <input
                type={showPasswords.current ? 'text' : 'password'}
                id="currentPassword"
                name="currentPassword"
                value={formData.currentPassword}
                onChange={handleChange}
                required
                className="input-field pr-12"
                placeholder="Digite sua senha atual"
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setShowPasswords(prev => ({ ...prev, current: !prev.current }))}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-300"
                disabled={loading}
              >
                {showPasswords.current ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          {/* Nova Senha */}
          <div>
            <label htmlFor="newPassword" className="block text-sm font-medium text-gray-300 mb-2">
              Nova Senha *
            </label>
            <div className="relative">
              <input
                type={showPasswords.new ? 'text' : 'password'}
                id="newPassword"
                name="newPassword"
                value={formData.newPassword}
                onChange={handleChange}
                required
                minLength={6}
                className="input-field pr-12"
                placeholder="Mínimo 6 caracteres"
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setShowPasswords(prev => ({ ...prev, new: !prev.new }))}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-300"
                disabled={loading}
              >
                {showPasswords.new ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
            <p className="text-xs text-gray-400 mt-1">A senha deve ter pelo menos 6 caracteres</p>
          </div>

          {/* Confirmar Nova Senha */}
          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-300 mb-2">
              Confirmar Nova Senha *
            </label>
            <div className="relative">
              <input
                type={showPasswords.confirm ? 'text' : 'password'}
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
                minLength={6}
                className="input-field pr-12"
                placeholder="Digite a nova senha novamente"
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setShowPasswords(prev => ({ ...prev, confirm: !prev.confirm }))}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-300"
                disabled={loading}
              >
                {showPasswords.confirm ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
            {formData.newPassword && formData.confirmPassword && (
              <div className="mt-1">
                {formData.newPassword === formData.confirmPassword ? (
                  <p className="text-xs text-green-400 flex items-center space-x-1">
                    <CheckCircle size={12} />
                    <span>As senhas coincidem</span>
                  </p>
                ) : (
                  <p className="text-xs text-red-400">As senhas não coincidem</p>
                )}
              </div>
            )}
          </div>

          {/* Messages */}
          {error && (
            <div className="p-4 bg-red-900/30 border border-red-800 rounded-lg text-red-400 text-sm">
              {error}
            </div>
          )}

          {success && (
            <div className="p-4 bg-green-900/30 border border-green-800 rounded-lg text-green-400 text-sm flex items-center space-x-2">
              <CheckCircle size={20} />
              <span>{success}</span>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading || !formData.currentPassword || !formData.newPassword || !formData.confirmPassword}
            className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                <span>Alterando senha...</span>
              </>
            ) : (
              <>
                <Lock size={20} />
                <span>Alterar Senha</span>
              </>
            )}
          </button>
        </form>

        {/* Security Tips */}
        <div className="mt-8 p-4 bg-slate-900 rounded-lg border border-slate-800">
          <h3 className="text-sm font-semibold text-gray-100 mb-2">Dicas de Segurança</h3>
          <ul className="text-xs text-gray-400 space-y-1 list-disc list-inside">
            <li>Use uma senha única que você não usa em outros sites</li>
            <li>Combine letras, números e símbolos quando possível</li>
            <li>Não compartilhe sua senha com ninguém</li>
            <li>Altere sua senha regularmente</li>
          </ul>
        </div>
      </main>

      <BottomNavigation />
    </div>
  )
}

export default ChangePassword

