import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Mail, ArrowLeft, CheckCircle, AlertCircle } from 'lucide-react'
import { authService } from '../services/authService'

const ForgotPassword = () => {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      await authService.forgotPassword(email)
      setSuccess(true)
    } catch (err) {
      setError(err.response?.data?.message || 'Erro ao enviar e-mail de recuperação')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-green-950 to-slate-900 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-green-500/20 rounded-full mb-4 border border-green-500/30">
              <CheckCircle className="w-8 h-8 text-green-400" />
            </div>
            <h1 className="text-3xl font-bold text-gray-100 mb-2">E-mail Enviado!</h1>
            <p className="text-gray-400">
              Verifique sua caixa de entrada. Enviamos uma nova senha para <strong>{email}</strong>
            </p>
          </div>

          <div className="card">
            <button
              onClick={() => navigate('/login')}
              className="w-full btn-primary"
            >
              Voltar ao Login
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-lendme-blue rounded-full mb-4 shadow-lg shadow-blue-500/30">
            <Mail className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-100 mb-2">Recuperar Senha</h1>
          <p className="text-gray-400">Digite seu e-mail para receber uma nova senha</p>
        </div>

        <div className="card">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                E-mail
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value)
                  if (error) setError('')
                }}
                required
                className="input-field"
                placeholder="seu@email.com"
                disabled={loading}
              />
            </div>

            {error && (
              <div className="flex items-center space-x-2 text-red-400 bg-red-900/30 border border-red-800 p-3 rounded-lg">
                <AlertCircle size={20} />
                <span className="text-sm">{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !email}
              className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>Enviando...</span>
                </>
              ) : (
                <>
                  <Mail size={20} />
                  <span>Enviar Nova Senha</span>
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <Link
              to="/login"
              className="text-sm text-lendme-blue hover:text-blue-400 transition-colors inline-flex items-center space-x-1"
            >
              <ArrowLeft size={16} />
              <span>Voltar ao Login</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ForgotPassword


