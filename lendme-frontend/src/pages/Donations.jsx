import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Gift, MessageCircle, Check, X } from 'lucide-react'
import BottomNavigation from '../components/BottomNavigation'
import ConfirmDialog from '../components/ConfirmDialog'
import { useToast } from '../contexts/ToastContext'
import { donationService } from '../services/donationService'
import { getImageUrl } from '../utils/imageUtils'
import { useAuth } from '../contexts/AuthContext'

const Donations = () => {
  const { user } = useAuth()
  const toast = useToast()
  const [donationSubTab, setDonationSubTab] = useState('pending') // 'pending', 'received', 'sent'
  const [donationRequests, setDonationRequests] = useState([])
  const [donationReceived, setDonationReceived] = useState([])
  const [donationSent, setDonationSent] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) {
      loadData()
    }
  }, [donationSubTab, user])

  const loadData = async () => {
    if (!user || !user._id) {
      console.warn('[DEBUG] Usuário não disponível para filtrar doações')
      setDonationRequests([])
      setDonationReceived([])
      setDonationSent([])
      return
    }
    
    try {
      setLoading(true)
      const [received, sent] = await Promise.all([
        donationService.getDonations('received'),
        donationService.getDonations('sent')
      ])
      
      const currentUserId = String(user._id?.toString ? user._id.toString() : user._id || '')
      
      // Solicitações pendentes: doações recebidas com status 'pending'
      const pending = received.filter(d => {
        const toUserId = String(d.toUserId || '')
        return d.status === 'pending' && toUserId === currentUserId
      })
      setDonationRequests(pending)
      
      // Doações recebidas: doações onde o usuário é o dono (toUserId) e status é 'accepted' ou 'confirmed'
      const receivedFiltered = received.filter(d => {
        const toUserId = String(d.toUserId || '')
        return (d.status === 'accepted' || d.status === 'confirmed') && toUserId === currentUserId
      })
      setDonationReceived(receivedFiltered)
      
      // Doações feitas: doações onde o usuário é quem solicitou (fromUserId) e status é 'accepted', 'confirmed' ou 'rejected'
      const sentFiltered = sent.filter(d => {
        const fromUserId = String(d.fromUserId || '')
        return (d.status === 'accepted' || d.status === 'confirmed' || d.status === 'rejected') && fromUserId === currentUserId
      })
      setDonationSent(sentFiltered)
    } catch (error) {
      console.error('Erro ao carregar doações:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAcceptDonation = async (donationId) => {
    try {
      await donationService.acceptDonation(donationId)
      await loadData()
      toast.success('Doação aceita!')
    } catch (error) {
      console.error('Erro ao aceitar doação:', error)
      toast.error(error.response?.data?.message || 'Erro ao aceitar doação')
    }
  }

  const handleRejectDonation = (donationId) => {
    setConfirmDialog({ isOpen: true, donationId })
  }

  const confirmRejectDonation = async () => {
    const { donationId } = confirmDialog
    if (!donationId) return
    
    try {
      // Atualiza o status para 'rejected' - você pode precisar criar esse endpoint
      await loadData()
    } catch (error) {
      console.error('Erro ao recusar doação:', error)
      toast.error('Erro ao recusar doação')
    }
  }

  const getCurrentList = () => {
    if (donationSubTab === 'received') return donationReceived
    if (donationSubTab === 'sent') return donationSent
    return donationRequests
  }

  const getCurrentListCount = () => {
    if (donationSubTab === 'received') return donationReceived.length
    if (donationSubTab === 'sent') return donationSent.length
    return donationRequests.length
  }

  return (
    <div className="min-h-screen bg-slate-950 pb-20">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur-sm border-b border-slate-800">
        <div className="max-w-2xl mx-auto px-4">
          <div className="flex items-center justify-between h-14">
            <h1 className="text-xl font-bold text-gray-100 flex items-center space-x-2">
              <Gift size={24} />
              <span>Doações</span>
            </h1>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="max-w-2xl mx-auto px-4">
        <div className="flex space-x-1 border-b border-slate-800">
          <button
            onClick={() => setDonationSubTab('pending')}
            className={`flex-1 py-3 text-sm font-medium transition-colors relative ${
              donationSubTab === 'pending'
                ? 'text-blue-400 border-b-2 border-blue-400'
                : 'text-gray-400 hover:text-gray-300'
            }`}
          >
            Solicitações Pendentes ({donationRequests.length})
            {donationRequests.length > 0 && (
              <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full"></span>
            )}
          </button>
          <button
            onClick={() => setDonationSubTab('received')}
            className={`flex-1 py-3 text-sm font-medium transition-colors ${
              donationSubTab === 'received'
                ? 'text-blue-400 border-b-2 border-blue-400'
                : 'text-gray-400 hover:text-gray-300'
            }`}
          >
            Recebidas ({donationReceived.length})
          </button>
          <button
            onClick={() => setDonationSubTab('sent')}
            className={`flex-1 py-3 text-sm font-medium transition-colors ${
              donationSubTab === 'sent'
                ? 'text-blue-400 border-b-2 border-blue-400'
                : 'text-gray-400 hover:text-gray-300'
            }`}
          >
            Feitas ({donationSent.length})
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-2xl mx-auto px-4 py-4">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          </div>
        ) : getCurrentList().length === 0 ? (
          <div className="text-center py-12">
            <Gift size={48} className="text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400">
              {donationSubTab === 'pending' && 'Nenhuma solicitação pendente'}
              {donationSubTab === 'received' && 'Nenhuma doação recebida'}
              {donationSubTab === 'sent' && 'Nenhuma doação feita'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {getCurrentList().map((donation) => {
              const product = donation.product
              const fromUser = donation.fromUser
              const toUser = donation.toUser
              const isOwner = donationSubTab === 'pending' || donationSubTab === 'received'
              
              return (
                <div
                  key={donation._id}
                  className="bg-slate-900 rounded-lg p-4 border border-slate-800"
                >
                  <Link to={`/donations/${donation._id}`}>
                    <div className="flex items-start space-x-4">
                      {product?.images && product.images.length > 0 ? (
                        <img
                          src={getImageUrl(product.images[0])}
                          alt={product.name}
                          className="w-20 h-20 rounded-lg object-cover"
                          onError={(e) => {
                            e.target.style.display = 'none'
                            e.target.nextElementSibling.style.display = 'flex'
                          }}
                        />
                      ) : null}
                      {(!product?.images || product.images.length === 0) && (
                        <div className="w-20 h-20 bg-slate-800 rounded-lg flex items-center justify-center">
                          <Gift size={32} className="text-gray-600" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-100 mb-1">{product?.name || 'Produto'}</h3>
                        <p className="text-sm text-gray-400 mb-2">
                          {donationSubTab === 'pending' && (
                            <span>{fromUser?.name || 'Usuário'} quer receber esta doação</span>
                          )}
                          {donationSubTab === 'received' && (
                            <span>Você doou para {fromUser?.name || 'Usuário'}</span>
                          )}
                          {donationSubTab === 'sent' && (
                            <span>Você solicitou de {toUser?.name || 'Usuário'}</span>
                          )}
                        </p>
                        <div className="flex items-center space-x-2">
                          <span className={`text-xs px-2 py-1 rounded ${
                            donation.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400' :
                            donation.status === 'accepted' ? 'bg-blue-500/20 text-blue-400' :
                            donation.status === 'confirmed' ? 'bg-green-500/20 text-green-400' :
                            'bg-gray-500/20 text-gray-400'
                          }`}>
                            {donation.status === 'pending' ? 'Pendente' :
                             donation.status === 'accepted' ? 'Aceita' :
                             donation.status === 'confirmed' ? 'Confirmada' :
                             donation.status}
                          </span>
                          <MessageCircle size={16} className="text-gray-400" />
                        </div>
                      </div>
                    </div>
                  </Link>
                  
                  {donationSubTab === 'pending' && isOwner && (
                    <div className="flex space-x-2 mt-4">
                      <button
                        onClick={() => handleAcceptDonation(donation._id)}
                        className="flex-1 bg-green-500 hover:bg-green-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors flex items-center justify-center space-x-2"
                      >
                        <Check size={18} />
                        <span>Aceitar</span>
                      </button>
                      <button
                        onClick={() => handleRejectDonation(donation._id)}
                        className="flex-1 bg-red-500 hover:bg-red-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors flex items-center justify-center space-x-2"
                      >
                        <X size={18} />
                        <span>Recusar</span>
                      </button>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        onClose={() => setConfirmDialog({ isOpen: false, donationId: null })}
        onConfirm={confirmRejectDonation}
        title="Recusar doação"
        message="Tem certeza que deseja recusar esta solicitação de doação?"
        confirmText="Recusar"
        cancelText="Cancelar"
        type="warning"
      />

      {/* Bottom Navigation */}
      <BottomNavigation />
    </div>
  )
}

export default Donations


