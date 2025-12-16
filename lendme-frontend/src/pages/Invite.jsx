import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { CheckCircle, XCircle, Loader } from 'lucide-react'
import { authService } from '../services/authService'

const Invite = () => {
  const { inviteCode } = useParams()
  const navigate = useNavigate()
  const { register } = useAuth()
  const [step, setStep] = useState('verify')
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  })
  const [error, setError] = useState('')

  useEffect(() => {
    if (inviteCode) {
      handleVerifyCode()
    } else {
      // Se não há código, redireciona para página de registro
      navigate('/register')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inviteCode])

  const handleVerifyCode = async () => {
    if (!inviteCode) {
      navigate('/register')
      return
    }

    setLoading(true)
    setError('')

    try {
      const result = await authService.verifyInviteCode(inviteCode)
      if (result.valid) {
        setStep('register')
      } else {
        setError(result.message || 'Código de convite inválido ou expirado')
        setStep('error')
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Código de convite inválido ou expirado'
      setError(errorMessage)
      setStep('error')
    } finally {
      setLoading(false)
    }
  }

  const handleRegister = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    if (formData.password !== formData.confirmPassword) {
      setError('As senhas não coincidem')
      setLoading(false)
      return
    }

    if (formData.password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres')
      setLoading(false)
      return
    }

    try {
      const result = await register({
        name: formData.name,
        email: formData.email,
        password: formData.password,
        inviteCode
      })

      if (result.success) {
        setStep('success')
      } else {
        setError(result.error || 'Erro ao criar conta')
      }
    } catch (err) {
      // Captura erro do backend ou do AuthContext
      const errorMessage = err.response?.data?.message || err.message || 'Erro ao criar conta'
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    if (error) setError('')
  }

  if (step === 'verify') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-900 flex items-center justify-center p-4">
        <div className="w-full max-w-md text-center">
          <div className="card">
            <div className="mb-6">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-500/20 rounded-full mb-4 border border-purple-500/30">
                {loading ? (
                  <Loader className="w-8 h-8 animate-spin text-purple-400" />
                ) : (
                  <CheckCircle className="w-8 h-8 text-purple-400" />
                )}
              </div>
              <h1 className="text-2xl font-bold text-gray-100 mb-2">
                {loading ? 'Verificando Convite...' : 'Verificando Convite'}
              </h1>
              <p className="text-gray-400">
                {loading ? 'Aguarde...' : 'Verificando o código de convite...'}
              </p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (step === 'register') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-900 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-100 mb-2">Criar Conta</h1>
            <p className="text-gray-400">Complete seu cadastro no LendMe</p>
          </div>

          <div className="card">
            <form onSubmit={handleRegister} className="space-y-6">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-2">
                  Nome de usuário *
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="input-field"
                  placeholder="Escolha um nome de usuário"
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                  E-mail *
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

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
                  Senha *
                </label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  minLength={6}
                  className="input-field"
                  placeholder="Mínimo 6 caracteres"
                />
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-300 mb-2">
                  Confirmar Senha *
                </label>
                <input
                  type="password"
                  id="confirmPassword"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                  className="input-field"
                  placeholder="Confirme sua senha"
                />
              </div>

              {error && (
                <div className="flex items-center space-x-2 text-red-400 bg-red-900/30 border border-red-800 p-3 rounded-lg">
                  <XCircle size={20} />
                  <span className="text-sm">{error}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={loading || !formData.name || !formData.email || !formData.password}
                className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Criando conta...' : 'Criar Conta'}
              </button>
            </form>
          </div>
        </div>
      </div>
    )
  }

  if (step === 'success') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-green-950 to-slate-900 flex items-center justify-center p-4">
        <div className="w-full max-w-md text-center">
          <div className="card">
            <div className="mb-6">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-green-500/20 rounded-full mb-4 border border-green-500/30">
                <CheckCircle className="w-8 h-8 text-green-400" />
              </div>
              <h1 className="text-2xl font-bold text-gray-100 mb-2">
                Conta Criada!
              </h1>
              <p className="text-gray-400 mb-6">
                Sua conta foi criada com sucesso. Você já pode começar a usar o LendMe!
              </p>
            </div>

            <button
              onClick={() => navigate('/login')}
              className="w-full btn-primary"
            >
              Ir para Login
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (step === 'error') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-red-950 to-slate-900 flex items-center justify-center p-4">
        <div className="w-full max-w-md text-center">
          <div className="card">
            <div className="mb-6">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-red-500/20 rounded-full mb-4 border border-red-500/30">
                <XCircle className="w-8 h-8 text-red-400" />
              </div>
              <h1 className="text-2xl font-bold text-gray-100 mb-2">
                Convite Inválido
              </h1>
              <p className="text-gray-400 mb-6">
                {error || 'Este código de convite não é válido ou já foi usado.'}
              </p>
            </div>

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
}

export default Invite
