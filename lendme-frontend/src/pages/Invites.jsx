import { useState, useEffect } from 'react'
import { ArrowLeft, Mail, Copy, Check, Plus, KeyRound } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import BottomNavigation from '../components/BottomNavigation'
import { authService } from '../services/authService'

const Invites = () => {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [generatingCode, setGeneratingCode] = useState(false)
  const [invites, setInvites] = useState([])
  const [copied, setCopied] = useState(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [newCode, setNewCode] = useState(null)

  useEffect(() => {
    loadInvites()
  }, [])

  const loadInvites = async () => {
    try {
      const data = await authService.getUserInvites()
      setInvites(data)
    } catch (error) {
      console.error('Erro ao carregar convites:', error)
    }
  }

  const handleGenerateInvite = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    try {
      const result = await authService.generateInviteCode(email)
      setSuccess('Convite enviado com sucesso!')
      setEmail('')
      await loadInvites()
    } catch (err) {
      setError(err.response?.data?.message || 'Erro ao gerar convite')
    } finally {
      setLoading(false)
    }
  }

  const handleGenerateCodeOnly = async () => {
    setGeneratingCode(true)
    setError('')
    setSuccess('')
    setNewCode(null)

    try {
      const result = await authService.generateInviteCodeOnly()
      setNewCode(result.code)
      setSuccess('Código gerado com sucesso!')
      await loadInvites()
      
      // Limpa a mensagem de sucesso após 5 segundos
      setTimeout(() => {
        setSuccess('')
      }, 5000)
    } catch (err) {
      setError(err.response?.data?.message || 'Erro ao gerar código')
    } finally {
      setGeneratingCode(false)
    }
  }

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text)
    setCopied(text)
    setTimeout(() => setCopied(null), 2000)
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
            <h1 className="text-xl font-bold text-gray-100">Meus Convites</h1>
            <div className="w-6"></div>
          </div>
        </div>
      </header>

      {/* Form para gerar convite */}
      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* Gerar código sem e-mail */}
        <div className="card mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-100">Gerar Código de Convite</h2>
              <p className="text-sm text-gray-400 mt-1">Crie um código para compartilhar manualmente</p>
            </div>
            <button
              onClick={handleGenerateCodeOnly}
              disabled={generatingCode}
              className="btn-primary flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {generatingCode ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Gerando...</span>
                </>
              ) : (
                <>
                  <Plus size={20} />
                  <span>Gerar Código</span>
                </>
              )}
            </button>
          </div>

          {newCode && (
            <div className="mt-4 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm text-gray-400 mb-2">Novo código gerado:</p>
                  <p className="text-xl font-mono text-blue-400 font-bold mb-2">{newCode}</p>
                  <p className="text-xs text-gray-500">
                    Link: <span className="text-blue-400">{window.location.origin}/invite/{newCode}</span>
                  </p>
                </div>
                <button
                  onClick={() => copyToClipboard(`${window.location.origin}/invite/${newCode}`)}
                  className="p-2 bg-blue-500/20 hover:bg-blue-500/30 rounded-lg transition-colors ml-4"
                  title="Copiar link"
                >
                  {copied === `${window.location.origin}/invite/${newCode}` ? (
                    <Check size={20} className="text-green-400" />
                  ) : (
                    <Copy size={20} className="text-blue-400" />
                  )}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Enviar convite por e-mail */}
        <div className="card mb-6">
          <h2 className="text-lg font-semibold text-gray-100 mb-4 flex items-center space-x-2">
            <Mail size={20} />
            <span>Enviar Convite por E-mail</span>
          </h2>
          <form onSubmit={handleGenerateInvite} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                E-mail do convidado
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value)
                  if (error) setError('')
                }}
                required
                className="input-field"
                placeholder="amigo@email.com"
                disabled={loading}
              />
            </div>

            {error && (
              <div className="p-3 bg-red-900/30 border border-red-800 rounded-lg text-red-400 text-sm">
                {error}
              </div>
            )}

            {success && (
              <div className="p-3 bg-green-900/30 border border-green-800 rounded-lg text-green-400 text-sm">
                {success}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !email}
              className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Enviando...' : 'Enviar Convite'}
            </button>
          </form>
        </div>

        {/* Lista de convites */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-100 mb-4">Convites Enviados</h2>
          {invites.length === 0 ? (
            <div className="text-center py-8">
              <Mail size={48} className="text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400">Nenhum convite enviado ainda</p>
            </div>
          ) : (
            <div className="space-y-4">
              {invites.map((invite) => (
                <div
                  key={invite._id}
                  className="bg-slate-800 rounded-lg p-4 border border-slate-700"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="text-sm text-gray-400 mb-1">Código:</p>
                      <p className="text-lg font-mono text-gray-100 mb-2">{invite.code}</p>
                      <p className="text-xs text-gray-500">
                        {invite.used 
                          ? `Usado em ${new Date(invite.usedAt).toLocaleDateString('pt-BR')}`
                          : 'Pendente'}
                      </p>
                      {invite.toEmail && (
                        <p className="text-xs text-gray-500 mt-1">Para: {invite.toEmail}</p>
                      )}
                    </div>
                    <div className="flex flex-col space-y-2">
                      {!invite.used && (
                        <button
                          onClick={() => copyToClipboard(`${window.location.origin}/invite/${invite.code}`)}
                          className="p-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors"
                        >
                          {copied === `${window.location.origin}/invite/${invite.code}` ? (
                            <Check size={20} className="text-green-400" />
                          ) : (
                            <Copy size={20} className="text-gray-300" />
                          )}
                        </button>
                      )}
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        invite.used 
                          ? 'bg-green-500/20 text-green-400'
                          : 'bg-yellow-500/20 text-yellow-400'
                      }`}>
                        {invite.used ? 'Usado' : 'Ativo'}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Bottom Navigation */}
      <BottomNavigation />
    </div>
  )
}

export default Invites


