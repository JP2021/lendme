import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { UserPlus, Mail, ArrowRight, AlertCircle } from 'lucide-react'
import { authService } from '../services/authService'

const Register = () => {
  const navigate = useNavigate()
  const [inviteCode, setInviteCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    if (!inviteCode || inviteCode.trim().length === 0) {
      setError('Por favor, insira um código de convite')
      setLoading(false)
      return
    }

    try {
      // Verifica se o código é válido antes de redirecionar
      const result = await authService.verifyInviteCode(inviteCode.trim())
      if (result.valid) {
        navigate(`/invite/${inviteCode.trim()}`)
      } else {
        setError('Código de convite inválido')
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Código de convite inválido ou expirado')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo e título */}
        <div className="text-center mb-8 text-gray-100">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-500 rounded-full mb-4 shadow-lg shadow-purple-500/30">
            <UserPlus className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold mb-2">Criar Conta</h1>
          <p className="text-slate-300">Você precisa de um código de convite</p>
        </div>

        {/* Card do formulário */}
        <div className="card">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="inviteCode" className="block text-sm font-medium text-gray-300 mb-2">
                Código de Convite
              </label>
              <input
                type="text"
                id="inviteCode"
                name="inviteCode"
                value={inviteCode}
                onChange={(e) => {
                  setInviteCode(e.target.value)
                  if (error) setError('')
                }}
                required
                className="input-field"
                placeholder="Digite o código de convite"
                disabled={loading}
              />
              <p className="text-xs text-gray-400 mt-2">
                Você precisa de um código de convite de um usuário já cadastrado para criar sua conta.
              </p>
            </div>

            {/* Mensagem de erro */}
            {error && (
              <div className="flex items-center space-x-2 text-red-400 bg-red-900/30 border border-red-800 p-3 rounded-lg">
                <AlertCircle size={20} />
                <span className="text-sm">{error}</span>
              </div>
            )}

            {/* Botão de continuar */}
            <button
              type="submit"
              disabled={loading || !inviteCode.trim()}
              className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>Verificando...</span>
                </>
              ) : (
                <>
                  <span>Continuar</span>
                  <ArrowRight size={20} />
                </>
              )}
            </button>
          </form>

          {/* Informações adicionais */}
          <div className="mt-6 pt-6 border-t border-slate-700">
            <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <Mail className="text-blue-400 mt-0.5" size={20} />
                <div>
                  <h3 className="text-sm font-semibold text-gray-100 mb-1">
                    Como obter um código de convite?
                  </h3>
                  <p className="text-xs text-gray-400">
                    Peça um código de convite para um amigo que já está no LendMe. 
                    Ele pode gerar um convite na página de configurações.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Link para voltar ao login */}
          <div className="mt-6 text-center">
            <Link
              to="/login"
              className="text-sm text-purple-400 hover:text-purple-300 transition-colors"
            >
              Já tem uma conta? Fazer login
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Register


