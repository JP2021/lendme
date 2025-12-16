/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useEffect } from 'react'
import { authService } from '../services/authService'

const AuthContext = createContext()

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [checkingAuth, setCheckingAuth] = useState(false)

  useEffect(() => {
    // Só verifica uma vez na montagem do componente
    if (!checkingAuth && loading) {
      checkAuthStatus()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const checkAuthStatus = async () => {
    // Evita múltiplas chamadas simultâneas
    if (checkingAuth) return
    
    setCheckingAuth(true)
    try {
      const userData = await authService.getCurrentUser()
      if (userData) {
        setUser(userData)
        setIsAuthenticated(true)
      } else {
        setUser(null)
        setIsAuthenticated(false)
      }
    } catch (error) {
      // Erro 401 é esperado quando não está autenticado
      if (error.response?.status !== 401) {
        console.error('Erro ao verificar status de autenticação:', error)
      }
      setUser(null)
      setIsAuthenticated(false)
    } finally {
      setLoading(false)
      setCheckingAuth(false)
    }
  }

  const login = async (credentials) => {
    try {
      const response = await authService.login(credentials)
      const { user: userData } = response

      setUser(userData)
      setIsAuthenticated(true)

      return { success: true }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  const register = async (userData) => {
    try {
      const response = await authService.register(userData)
      // O backend retorna { user: {...} } em caso de sucesso
      if (response && response.user) {
        return { success: true, data: response }
      }
      return { success: true, data: response }
    } catch (error) {
      // Captura a mensagem de erro do backend
      const errorMessage = error.response?.data?.message || error.message || 'Erro ao criar conta'
      console.error('Erro no registro:', error)
      return { success: false, error: errorMessage }
    }
  }

  const logout = () => {
    authService.logout().catch(() => {})
    setUser(null)
    setIsAuthenticated(false)
  }

  const isAdmin = () => {
    return user?.profile === 2 // ADMIN = 2
  }

  const value = {
    user,
    loading,
    isAuthenticated,
    login,
    register,
    logout,
    isAdmin,
    checkAuthStatus
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
