import { AlertTriangle, X } from 'lucide-react'

const ConfirmDialog = ({ isOpen, onClose, onConfirm, title, message, confirmText = 'Confirmar', cancelText = 'Cancelar', type = 'warning' }) => {
  if (!isOpen) return null

  const getIcon = () => {
    switch (type) {
      case 'danger':
        return <AlertTriangle size={24} className="text-red-500" />
      case 'warning':
        return <AlertTriangle size={24} className="text-yellow-500" />
      default:
        return <AlertTriangle size={24} className="text-blue-500" />
    }
  }

  const getButtonColor = () => {
    switch (type) {
      case 'danger':
        return 'bg-red-500 hover:bg-red-600'
      case 'warning':
        return 'bg-yellow-500 hover:bg-yellow-600'
      default:
        return 'bg-blue-500 hover:bg-blue-600'
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div 
        className="bg-slate-900 rounded-lg border border-slate-700 shadow-xl max-w-md w-full p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start space-x-4">
          <div className="flex-shrink-0">
            {getIcon()}
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-100 mb-2">
              {title || 'Confirmar ação'}
            </h3>
            <p className="text-sm text-gray-400 mb-4">
              {message || 'Tem certeza que deseja continuar?'}
            </p>
            <div className="flex items-center justify-end space-x-3">
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-300 hover:text-gray-100 transition-colors"
              >
                {cancelText}
              </button>
              <button
                onClick={() => {
                  onConfirm()
                  onClose()
                }}
                className={`px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors ${getButtonColor()}`}
              >
                {confirmText}
              </button>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex-shrink-0 text-gray-400 hover:text-gray-300 transition-colors"
            aria-label="Fechar"
          >
            <X size={20} />
          </button>
        </div>
      </div>
    </div>
  )
}

export default ConfirmDialog

