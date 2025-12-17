import { useState, useRef } from 'react'
import { X, Upload, Video, Image as ImageIcon, Play, Loader2 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import BottomNavigation from '../components/BottomNavigation'
import { useToast } from '../contexts/ToastContext'
import { postService } from '../services/postService'

const CreatePost = () => {
  const navigate = useNavigate()
  const { toast } = useToast()
  const fileInputRef = useRef(null)
  const videoRef = useRef(null)
  
  const [selectedFile, setSelectedFile] = useState(null)
  const [fileType, setFileType] = useState(null) // 'image' ou 'video'
  const [preview, setPreview] = useState(null)
  const [videoDuration, setVideoDuration] = useState(0)
  const [loading, setLoading] = useState(false)
  const [caption, setCaption] = useState('')

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Verifica se é imagem ou vídeo
    if (file.type.startsWith('image/')) {
      setFileType('image')
      setSelectedFile(file)
      
      // Cria preview da imagem
      const reader = new FileReader()
      reader.onloadend = () => {
        setPreview(reader.result)
      }
      reader.readAsDataURL(file)
    } else if (file.type.startsWith('video/')) {
      setFileType('video')
      setSelectedFile(file)
      
      // Cria preview do vídeo e verifica duração
      const video = document.createElement('video')
      video.preload = 'metadata'
      video.onloadedmetadata = () => {
        window.URL.revokeObjectURL(video.src)
        const duration = video.duration
        setVideoDuration(duration)
        
        if (duration > 60) {
          if (toast?.error) {
            toast.error('O vídeo deve ter no máximo 60 segundos')
          } else {
            alert('O vídeo deve ter no máximo 60 segundos')
          }
          setSelectedFile(null)
          setFileType(null)
          setPreview(null)
          setVideoDuration(0)
          return
        }
        
        // Cria preview do vídeo
        const url = URL.createObjectURL(file)
        setPreview(url)
      }
      video.onerror = () => {
        if (toast?.error) {
          toast.error('Erro ao carregar vídeo')
        } else {
          alert('Erro ao carregar vídeo')
        }
        setSelectedFile(null)
        setFileType(null)
        setPreview(null)
        setVideoDuration(0)
      }
      video.src = URL.createObjectURL(file)
    } else {
      if (toast?.error) {
        toast.error('Por favor, selecione uma imagem ou vídeo')
      } else {
        alert('Por favor, selecione uma imagem ou vídeo')
      }
    }
  }

  const handleRemoveFile = () => {
    if (preview && fileType === 'video') {
      URL.revokeObjectURL(preview)
    }
    setSelectedFile(null)
    setFileType(null)
    setPreview(null)
    setVideoDuration(0)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!selectedFile) {
      toast.error('Por favor, selecione uma foto ou vídeo')
      return
    }

    if (fileType === 'video' && videoDuration > 60) {
      toast.error('O vídeo deve ter no máximo 60 segundos')
      return
    }

    setLoading(true)
    try {
      const formData = new FormData()
      formData.append('media', selectedFile)
      formData.append('caption', caption)
      formData.append('type', fileType)

      const result = await postService.createPost(formData)
      
      // Verifica se o toast está disponível antes de usar
      if (toast?.success) {
        toast.success('Post criado com sucesso!')
      }
      
      // Pequeno delay para garantir que o toast seja exibido antes de navegar
      setTimeout(() => {
        navigate('/')
      }, 100)
    } catch (error) {
      // Tratamento seguro de erro
      const errorMessage = error?.response?.data?.message || error?.message || 'Erro ao criar post'
      
      if (toast?.error) {
        toast.error(errorMessage)
      } else {
        console.error('Erro ao criar post:', errorMessage)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 pb-20">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur-sm border-b border-slate-800">
        <div className="max-w-2xl mx-auto px-4">
          <div className="flex items-center justify-between h-14">
            <h1 className="text-xl font-bold text-gray-100">Criar Post</h1>
            <button
              onClick={() => navigate(-1)}
              className="text-gray-300 hover:text-gray-100 transition-colors"
            >
              <X size={24} />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Área de upload */}
          <div className="space-y-4">
            {!preview ? (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-700 rounded-lg p-12 text-center cursor-pointer hover:border-blue-500 transition-colors"
              >
                <div className="flex flex-col items-center space-y-4">
                  <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center">
                    <Upload size={32} className="text-gray-400" />
                  </div>
                  <div>
                    <p className="text-gray-300 font-medium mb-1">
                      Escolha uma foto ou vídeo
                    </p>
                    <p className="text-sm text-gray-500">
                      Imagens ou vídeos de até 60 segundos
                    </p>
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*,video/*"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                </div>
              </div>
            ) : (
              <div className="relative">
                {fileType === 'image' ? (
                  <div className="relative rounded-lg overflow-hidden bg-slate-900">
                    <img
                      src={preview}
                      alt="Preview"
                      className="w-full h-auto max-h-96 object-contain"
                    />
                    <button
                      type="button"
                      onClick={handleRemoveFile}
                      className="absolute top-2 right-2 bg-black/50 hover:bg-black/70 rounded-full p-2 transition-colors"
                    >
                      <X size={20} className="text-white" />
                    </button>
                  </div>
                ) : (
                  <div className="relative rounded-lg overflow-hidden bg-slate-900">
                    <video
                      ref={videoRef}
                      src={preview}
                      controls
                      className="w-full h-auto max-h-96"
                    />
                    <button
                      type="button"
                      onClick={handleRemoveFile}
                      className="absolute top-2 right-2 bg-black/50 hover:bg-black/70 rounded-full p-2 transition-colors"
                    >
                      <X size={20} className="text-white" />
                    </button>
                    {videoDuration > 0 && (
                      <div className="absolute bottom-2 left-2 bg-black/50 px-2 py-1 rounded text-xs text-white">
                        {Math.round(videoDuration)}s
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Caption */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Legenda (opcional)
            </label>
            <textarea
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Escreva uma legenda..."
              rows={4}
              maxLength={500}
              className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            />
            <p className="text-xs text-gray-500 mt-1 text-right">
              {caption.length}/500
            </p>
          </div>

          {/* Botão de submit */}
          <button
            type="submit"
            disabled={!selectedFile || loading}
            className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
          >
            {loading ? (
              <>
                <Loader2 size={20} className="animate-spin" />
                <span>Publicando...</span>
              </>
            ) : (
              <span>Publicar</span>
            )}
          </button>
        </form>
      </main>

      <BottomNavigation />
    </div>
  )
}

export default CreatePost

