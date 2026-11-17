import { useState, useEffect } from 'react'
import { fetchComments, createComment, deleteComment } from '../../services/commentService'
import { useAuth } from '../../context/useAuth'

function formatCommentDate(dateString) {
  if (!dateString) return ''
  const date = new Date(dateString)
  return new Intl.DateTimeFormat('ko-KR', {
    month: 'numeric',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

export default function CommentSection({ postId, boardId, onOpenAuth }) {
  const [comments, setComments] = useState([])
  const [newContent, setNewContent] = useState('')
  const [loading, setLoading] = useState(() => Boolean(postId))
  const [submitting, setSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  const { user, userNickname, isAdmin, canManageBoard, isTestMode } = useAuth()

  useEffect(() => {
    let ignore = false

    const load = async () => {
      try {
        const data = await fetchComments(postId, { isTestMode })
        if (!ignore) {
          setComments(data || [])
        }
      } catch (err) {
        if (!ignore) console.error('Failed to load comments:', err)
      } finally {
        if (!ignore) setLoading(false)
      }
    }

    if (postId) {
      load()
    }

    return () => {
      ignore = true
    }
  }, [postId, isTestMode])

  const handleAddComment = async (e) => {
    e.preventDefault()
    if (!user) {
      onOpenAuth()
      return
    }

    const trimmed = newContent.trim()
    if (!trimmed) return

    setSubmitting(true)
    setErrorMsg('')
    try {
      const data = await createComment({
        post_id: postId,
        author_id: user.id,
        author_nickname: userNickname,
        content: trimmed,
        isTestMode,
      })

      setComments((prev) => [...prev, data])
      setNewContent('')
    } catch (err) {
      console.error('Failed to add comment:', err)
      setErrorMsg('댓글 등록 중 오류가 발생했습니다: ' + err.message)
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteComment = async (commentId) => {
    if (!window.confirm('댓글을 삭제하시겠습니까?')) return

    try {
      await deleteComment(commentId, { isTestMode })
      setComments((prev) => prev.filter((c) => String(c.id) !== String(commentId)))
    } catch (err) {
      console.error('Failed to delete comment:', err)
      alert('댓글 삭제 실패: ' + err.message)
    }
  }

  const canDeleteComment = (comment) => {
    if (!user) return false
    if (String(user.id) === String(comment.author_id)) return true
    if (isAdmin) return true
    return canManageBoard(boardId)
  }

  return (
    <section className="comment-section">
      <h3 className="comment-section-title">
        댓글 <span>({comments.length})</span>
      </h3>

      {loading ? (
        <p className="comment-loading">댓글을 불러오는 중...</p>
      ) : comments.length === 0 ? (
        <p className="comment-empty">첫 번째 댓글을 남겨 이야기를 나눠보세요.</p>
      ) : (
        <div className="comment-list">
          {comments.map((comment) => (
            <div key={comment.id} className="comment-item">
              <div className="comment-meta">
                <span className="comment-author">{comment.author_nickname}</span>
                <span className="comment-dot">•</span>
                <time className="comment-date">{formatCommentDate(comment.created_at)}</time>
                {canDeleteComment(comment) && (
                  <button
                    type="button"
                    className="comment-delete-btn"
                    onClick={() => handleDeleteComment(comment.id)}
                  >
                    삭제
                  </button>
                )}
              </div>
              <p className="comment-content">{comment.content}</p>
            </div>
          ))}
        </div>
      )}

      {errorMsg && <p className="modal-alert error" style={{ marginTop: '12px' }}>{errorMsg}</p>}

      <form className="comment-form" onSubmit={handleAddComment}>
        {user ? (
          <>
            <textarea
              className="comment-input"
              placeholder={`@${userNickname} 님으로 댓글을 남겨보세요...`}
              value={newContent}
              onChange={(e) => setNewContent(e.target.value)}
              rows={3}
              required
            />
            <div className="comment-form-actions">
              <button
                type="submit"
                className="btn btn-primary"
                disabled={submitting || !newContent.trim()}
              >
                {submitting ? '등록 중...' : '댓글 등록'}
              </button>
            </div>
          </>
        ) : (
          <div className="comment-guest-prompt">
            <p>댓글을 작성하려면 로그인이 필요합니다.</p>
            <button
              type="button"
              className="btn btn-outline"
              onClick={onOpenAuth}
            >
              로그인하고 댓글 쓰기
            </button>
          </div>
        )}
      </form>
    </section>
  )
}
