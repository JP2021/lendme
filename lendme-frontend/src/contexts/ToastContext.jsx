import { createContext, useContext, useState, useCallback } from 'react'
import { CheckCircle, XCircle, Info, AlertCircle, X } from 'lucide-react'

const ToastContext = createContext()

export const useToast = () => {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast deve ser usado dentro de ToastProvider')
  }
  return context
}

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([])

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id))
  }, [])

  const showToast = useCallback((message, type = 'info', duration = 4000) => {
    const id = Date.now() + Math.random()
    const newToast = { id, message, type, duration }
    
    setToasts(prev => [...prev, newToast])
    
    if (duration > 0) {
      setTimeout(() => {
        removeToast(id)
      }, duration)
    }
    
    return id
  }, [removeToast])

  const success = useCallback((message, duration) => {
    return showToast(message, 'success', duration)
  }, [showToast])

  const error = useCallback((message, duration) => {
    return showToast(message, 'error', duration)
  }, [showToast])

  const info = useCallback((message, duration) => {
    return showToast(message, 'info', duration)
  }, [showToast])

  const warning = useCallback((message, duration) => {
    return showToast(message, 'warning', duration)
  }, [showToast])

  return (
    <ToastContext.Provider value={{ showToast, success, error, info, warning, removeToast }}>
      {children}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </ToastContext.Provider>
  )
}

const ToastContainer = ({ toasts, removeToast }) => {
  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      {toasts.map(toast => (
        <Toast key={toast.id} toast={toast} onRemove={removeToast} />
      ))}
    </div>
  )
}

const Toast = ({ toast, onRemove }) => {
  const { message, type } = toast

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle size={20} className="text-white" />
      case 'error':
        return <XCircle size={20} className="text-white" />
      case 'warning':
        return <AlertCircle size={20} className="text-white" />
      default:
        return <Info size={20} className="text-white" />
    }
  }

  const getStyles = () => {
    switch (type) {
      case 'success':
        return 'bg-green-500 border-green-600'
      case 'error':
        return 'bg-red-500 border-red-600'
      case 'warning':
        return 'bg-yellow-500 border-yellow-600'
      default:
        return 'bg-blue-500 border-blue-600'
    }
  }

  return (
    <div
      className={`
        ${getStyles()}
        border rounded-lg shadow-lg p-4 flex items-start space-x-3
        animate-slide-in pointer-events-auto
        backdrop-blur-sm
      `}
      role="alert"
    >
      <div className="flex-shrink-0 mt-0.5">
        {getIcon()}
      </div>
      <div className="flex-1 text-white text-sm font-medium">
        {message}
      </div>
      <button
        onClick={() => onRemove(toast.id)}
        className="flex-shrink-0 text-white/80 hover:text-white transition-colors"
        aria-label="Fechar"
      >
        <X size={18} />
      </button>
    </div>
  )
}

