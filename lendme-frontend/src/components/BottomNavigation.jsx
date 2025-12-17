import { Link, useLocation } from 'react-router-dom'
import { Home, Search, Plus, ArrowLeftRight, Gift, Users, User, Camera } from 'lucide-react'
import { useState, useEffect } from 'react'
import { authService } from '../services/authService'
import { donationService } from '../services/donationService'

const BottomNavigation = () => {
  const location = useLocation()
  const [pendingRequestsCount, setPendingRequestsCount] = useState(0)
  const [pendingDonationsCount, setPendingDonationsCount] = useState(0)

  useEffect(() => {
    loadPendingRequests()
    loadPendingDonations()
    // Atualiza a cada 30 segundos
    const interval = setInterval(() => {
      loadPendingRequests()
      loadPendingDonations()
    }, 30000)
    return () => clearInterval(interval)
  }, [])

  const loadPendingRequests = async () => {
    try {
      const requests = await authService.getReceivedFriendRequests()
      setPendingRequestsCount(requests?.length || 0)
    } catch (error) {
      console.error('Erro ao carregar solicitações:', error)
    }
  }

  const loadPendingDonations = async () => {
    try {
      const data = await donationService.getPendingCount()
      setPendingDonationsCount(data?.count || 0)
    } catch (error) {
      console.error('Erro ao carregar doações pendentes:', error)
    }
  }

  const navItems = [
    { icon: Home, path: '/', label: 'Início' },
    { icon: Search, path: '/explore', label: 'Explorar' },
    { icon: Camera, path: '/create-post', label: 'Postar' },
    { icon: Plus, path: '/add-product', label: 'Adicionar' },
    { icon: ArrowLeftRight, path: '/trades', label: 'Trocas' },
    { icon: Gift, path: '/donations', label: 'Doações', badge: pendingDonationsCount },
    { icon: Users, path: '/friends', label: 'Amigos', badge: pendingRequestsCount },
    { icon: User, path: '/profile', label: 'Perfil' },
  ]

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-slate-900 border-t border-slate-800 z-50 shadow-lg">
      <div className="flex justify-around items-center h-16 max-w-2xl mx-auto">
        {navItems.map((item) => {
          const IconComponent = item.icon
          const isActive = location.pathname === item.path || 
                          (item.path === '/friends' && location.pathname.startsWith('/friends')) ||
                          (item.path === '/donations' && location.pathname.startsWith('/donations'))
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center justify-center flex-1 h-full transition-colors relative ${
                isActive ? 'text-blue-400' : 'text-gray-400'
              }`}
            >
              <div className="relative">
                <IconComponent size={24} />
                {item.badge && item.badge > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {item.badge > 9 ? '9+' : item.badge}
                  </span>
                )}
              </div>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}

export default BottomNavigation
