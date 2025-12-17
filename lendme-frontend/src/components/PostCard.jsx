import { useState, useEffect, useRef } from 'react'
import { Heart, MessageCircle, Trash2, Play } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { getImageUrl } from '../utils/imageUtils'
import { postService } from '../services/postService'
import { useToast } from '../contexts/ToastContext'
import { useNavigate } from 'react-router-dom'

const PostCard = ({ post }) => {
  const { user } = useAuth()
  const { toast } = useToast()
  const navigate = useNavigate()
  const [liked, setLiked] = useState(() => {
    if (!user?._id) return false
    const userId = user._id?.toString ? user._id.toString() : user._id
    const likes = post.likes || []
    return Array.isArray(likes) && likes.some(id => {
      const idStr = id?.toString ? id.toString() : id
      return idStr === userId
    })
  })
  const [likesCount, setLikesCount] = useState(post.likesCount || 0)
  const [deleting, setDeleting] = useState(false)
  const [likeLoading, setLikeLoading] = useState(false)
  const [showComments, setShowComments] = useState(false)
  const [comments, setComments] = useState([])
  const [commentsLoading, setCommentsLoading] = useState(false)
  const [newComment, setNewComment] = useState('')
  const [sendingComment, setSendingComment] = useState(false)
  const [commentsCount, setCommentsCount] = useState(post.commentsCount || 0)
  const cardRef = useRef(null)
  const hasMarkedAsSeen = useRef(false)

  const isOwnPost = user?._id === post.userId

  // Marca o post como visto quando aparece na tela
  useEffect(() => {
    if (!cardRef.current || hasMarkedAsSeen.current || !post._id) return

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !hasMarkedAsSeen.current) {
            // Post está visível na tela - marca como visto
            hasMarkedAsSeen.current = true
            postService.markPostAsSeen(post._id).catch(() => {
              // Silenciosamente ignora erros
            })
            observer.disconnect()
          }
        })
      },
      { threshold: 0.5 } // Marca como visto quando 50% está visível
    )

    observer.observe(cardRef.current)

    return () => {
      observer.disconnect()
    }
  }, [post._id])

  const handleDelete = async () => {
    if (!confirm('Tem certeza que deseja excluir este post?')) return

    setDeleting(true)
    try {
      await postService.deletePost(post._id)
      toast.success('Post excluído com sucesso')
      // Recarrega a página para atualizar o feed
      window.location.reload()
    } catch (error) {
      toast.error('Erro ao excluir post')
    } finally {
      setDeleting(false)
    }
  }

  const handleToggleLike = async () => {
    if (!user) {
      navigate('/login')
      return
    }

    if (likeLoading) return

    setLikeLoading(true)
    try {
      const result = await postService.toggleLike(post._id)
      const newLiked = result?.liked ?? !liked
      const newCount =
        typeof result?.likesCount === 'number'
          ? result.likesCount
          : likesCount + (newLiked ? 1 : -1)

      setLiked(newLiked)
      setLikesCount(Math.max(0, newCount))
    } catch (err) {
      console.error('Erro ao curtir post:', err)
      toast.error(err.response?.data?.message || 'Erro ao curtir post')
    } finally {
      setLikeLoading(false)
    }
  }

  const loadComments = async () => {
    if (!user) {
      navigate('/login')
      return
    }

    setCommentsLoading(true)
    try {
      const data = await postService.getComments(post._id)
      const list = Array.isArray(data) ? data : []
      setComments(list)
      setCommentsCount(list.length)
    } catch (err) {
      console.error('Erro ao carregar comentários:', err)
      toast.error(err.response?.data?.message || 'Erro ao carregar comentários')
    } finally {
      setCommentsLoading(false)
    }
  }

  const handleToggleComments = async () => {
    const next = !showComments
    setShowComments(next)
    if (next && comments.length === 0) {
      await loadComments()
    }
  }

  const handleSendComment = async (e) => {
    if (e) e.preventDefault()
    if (!user) {
      navigate('/login')
      return
    }
    if (!newComment.trim() || sendingComment) return

    setSendingComment(true)
    try {
      const comment = await postService.createComment(post._id, newComment.trim())
      setComments((prev) => {
        const updated = [...prev, comment]
        setCommentsCount(updated.length)
        return updated
      })
      setNewComment('')
    } catch (err) {
      console.error('Erro ao enviar comentário:', err)
      toast.error(err.response?.data?.message || 'Erro ao enviar comentário')
    } finally {
      setSendingComment(false)
    }
  }

  const displayUser = post.user || {}

  return (
    <div ref={cardRef} className="bg-slate-900 rounded-lg border border-slate-800 mb-4 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center space-x-3">
          {displayUser.profilePic ? (
            <img
              src={getImageUrl(displayUser.profilePic)}
              alt={displayUser.name || 'Usuário'}
              className="w-10 h-10 rounded-full object-cover"
              onError={(e) => {
                e.target.style.display = 'none'
                const fallback = e.target.nextSibling
                if (fallback) fallback.style.display = 'flex'
              }}
            />
          ) : null}
          <div
            className={`w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-semibold ${displayUser.profilePic ? 'hidden' : ''}`}
          >
            <span>{(displayUser.name || 'U').charAt(0).toUpperCase()}</span>
          </div>
          <div>
            <p className="text-gray-100 font-medium">
              {displayUser.name || 'Usuário'}
            </p>
            <p className="text-xs text-gray-500">
              {new Date(post.createdAt).toLocaleDateString('pt-BR', {
                day: 'numeric',
                month: 'short',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </p>
          </div>
        </div>
        {isOwnPost && (
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="text-gray-400 hover:text-red-400 transition-colors"
          >
            <Trash2 size={20} />
          </button>
        )}
      </div>

      {/* Mídia */}
      <div className="w-full bg-black">
        {post.mediaType === 'image' ? (
          <img
            src={getImageUrl(post.mediaUrl)}
            alt={post.caption || 'Post'}
            className="w-full h-auto object-contain max-h-[600px]"
          />
        ) : (
          <video
            src={getImageUrl(post.mediaUrl)}
            controls
            autoPlay
            muted
            loop
            playsInline
            className="w-full h-auto max-h-[600px]"
          >
            Seu navegador não suporta vídeos.
          </video>
        )}
      </div>

      {/* Caption */}
      {post.caption && (
        <div className="px-4 py-3">
          <p className="text-gray-100 whitespace-pre-wrap break-words">
            <span className="font-medium">{displayUser.name || 'Usuário'}</span>{' '}
            {post.caption}
          </p>
        </div>
      )}

      {/* Actions */}
      <div className="px-4 pb-4">
        <div className="flex items-center space-x-6">
          <div className="flex items-center space-x-2">
            <button
              onClick={handleToggleLike}
              disabled={likeLoading}
              className={`transition-colors ${
                liked ? 'text-red-500' : 'text-gray-400 hover:text-red-500'
              } ${likeLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <Heart size={24} fill={liked ? 'currentColor' : 'none'} />
            </button>
            <span className="text-sm text-gray-400">{likesCount}</span>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={handleToggleComments}
              className="text-gray-400 hover:text-blue-400 transition-colors"
            >
              <MessageCircle size={24} />
            </button>
            <span className="text-sm text-gray-400">{commentsCount}</span>
          </div>
        </div>

        {/* Comentários */}
        {showComments && (
          <div className="mt-3 border-t border-slate-800 pt-3">
            {commentsLoading ? (
              <p className="text-xs text-gray-400">Carregando comentários...</p>
            ) : comments.length === 0 ? (
              <p className="text-xs text-gray-500">Seja o primeiro a comentar.</p>
            ) : (
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {comments.map((comment) => (
                  <div key={comment._id} className="flex items-start space-x-2 text-xs">
                    {/* Avatar do autor do comentário */}
                    {comment.user?.profilePic ? (
                      <div className="w-6 h-6 rounded-full overflow-hidden border border-slate-700 flex-shrink-0">
                        <img
                          src={getImageUrl(comment.user.profilePic)}
                          alt={comment.user?.name || 'Usuário'}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.target.style.display = 'none'
                            const fallback = e.target.parentElement.querySelector('.avatar-fallback-comment')
                            if (fallback) fallback.style.display = 'flex'
                          }}
                        />
                        <div className="avatar-fallback-comment hidden w-6 h-6 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full items-center justify-center">
                          <span className="text-white font-semibold text-[10px]">
                            {comment.user?.name?.charAt(0).toUpperCase() || 'U'}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-white font-semibold text-[10px]">
                          {comment.user?.name?.charAt(0).toUpperCase() || 'U'}
                        </span>
                      </div>
                    )}
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-gray-100 text-[11px]">
                          {comment.user?.name || 'Usuário'}
                        </span>
                        <span className="text-[10px] text-gray-500">
                          {comment.createdAt
                            ? new Date(comment.createdAt).toLocaleDateString('pt-BR', {
                                day: '2-digit',
                                month: '2-digit',
                              })
                            : ''}
                        </span>
                      </div>
                      <p className="text-gray-300 text-xs whitespace-pre-wrap">
                        {comment.text}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <form onSubmit={handleSendComment} className="mt-2 flex items-center space-x-2">
              <input
                type="text"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Escreva um comentário..."
                className="flex-1 bg-slate-900 border border-slate-700 rounded-full px-3 py-1.5 text-xs text-gray-100 placeholder-gray-500 focus:outline-none focus:border-blue-500"
              />
              <button
                type="submit"
                disabled={sendingComment || !newComment.trim()}
                className="text-xs px-3 py-1.5 rounded-full bg-blue-500 hover:bg-blue-600 text-white font-semibold disabled:opacity-50"
              >
                Enviar
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  )
}

export default PostCard

