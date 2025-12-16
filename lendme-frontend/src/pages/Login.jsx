import { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { LogIn, Eye, EyeOff, AlertCircle } from 'lucide-react'

const Login = () => {
  const [formData, setFormData] = useState({
    name: '',
    password: ''
  })
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const { login, isAuthenticated, loading: authLoading } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  // Redirecionar se já estiver autenticado (apenas uma vez, após carregar)
  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      const from = location.state?.from?.pathname || '/'
      navigate(from, { replace: true })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, authLoading])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    // Limpar erro quando usuário começar a digitar
    if (error) setError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const result = await login(formData)
      if (result.success) {
        const from = location.state?.from?.pathname || '/'
        navigate(from, { replace: true })
      } else {
        setError(result.error || 'Erro ao fazer login')
      }
    } catch (_error) { // eslint-disable-line no-unused-vars
      setError('Erro ao conectar com o servidor')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo e título */}
        <div className="text-center mb-8 text-gray-100">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-lendme-blue rounded-full mb-4 shadow-lg shadow-blue-500/30">
            <LogIn className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold mb-2">LendMe</h1>
          <p className="text-slate-300">Entre na sua conta</p>
        </div>

        {/* Card do formulário */}
        <div className="card">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Campo Nome */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-2">
                Nome de usuário
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className="input-field"
                placeholder="Digite seu nome de usuário"
                disabled={loading}
              />
            </div>

            {/* Campo Senha */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
                Senha
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  className="input-field pr-12"
                  placeholder="Digite sua senha"
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-300"
                  disabled={loading}
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            {/* Mensagem de erro */}
            {error && (
              <div className="flex items-center space-x-2 text-red-400 bg-red-900/30 border border-red-800 p-3 rounded-lg">
                <AlertCircle size={20} />
                <span className="text-sm">{error}</span>
              </div>
            )}

            {/* Botão de login */}
            <button
              type="submit"
              disabled={loading || !formData.name || !formData.password}
              className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>Entrando...</span>
                </>
              ) : (
                <>
                  <LogIn size={20} />
                  <span>Entrar</span>
                </>
              )}
            </button>
          </form>

          {/* Links adicionais */}
          <div className="mt-8 text-center space-y-4">
            <div>
              <Link
                to="/forgot"
                className="text-sm text-lendme-blue hover:text-blue-400 transition-colors"
              >
                Esqueceu sua senha?
              </Link>
            </div>

            <div className="border-t border-slate-700 pt-4">
              <p className="text-sm text-gray-400">
                Não tem uma conta?{' '}
                <Link
                  to="/register"
                  className="text-lendme-blue hover:text-blue-400 font-medium transition-colors"
                >
                  Criar conta
                </Link>
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-8 text-sm text-gray-400">
          <p>LendMe - Troque produtos, fortaleça amizades</p>
        </div>
      </div>
    </div>
  )
}

export default Login
