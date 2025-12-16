import { Link, useLocation } from 'react-router-dom'
import { Home, Search, Plus, ArrowLeftRight, User } from 'lucide-react'

const BottomNavigation = () => {
  const location = useLocation()

  const navItems = [
    { icon: Home, path: '/', label: 'Início' },
    { icon: Search, path: '/explore', label: 'Explorar' },
    { icon: Plus, path: '/add-product', label: 'Adicionar' },
    { icon: ArrowLeftRight, path: '/trades', label: 'Trocas' },
    { icon: User, path: '/profile', label: 'Perfil' },
  ]

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-slate-900 border-t border-slate-800 z-50 shadow-lg">
      <div className="flex justify-around items-center h-16 max-w-2xl mx-auto">
        {navItems.map((item) => {
          const IconComponent = item.icon
          const isActive = location.pathname === item.path
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center justify-center flex-1 h-full transition-colors ${
                isActive ? 'text-blue-400' : 'text-gray-400'
              }`}
            >
              <IconComponent size={24} />
              <span className="text-xs mt-1">{item.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}

export default BottomNavigation
