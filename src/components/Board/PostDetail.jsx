import { useState, useEffect } from 'react'
import { fetchPostById, deletePost } from '../../services/postService'
import { useAuth } from '../../context/useAuth'
import CommentSection from './CommentSection'
import { HOBBY_BOARDS } from '../Layout/Sidebar'

function formatDate(dateString) {
  if (!dateString) return ''
  const date = new Date(dateString)
  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

export default function PostDetail({ postId, onBack, onEdit, onDeleted, onOpenAuth }) {
  const [post, setPost] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [deleting, setDeleting] = useState(false)

  const { user, isAdmin, canManageBoard, isTestMode } = useAuth()

  useEffect(() => {
    let ignore = false

    const loadPost = async () => {
      try {
        const data = await fetchPostById(postId, { isTestMode })
        if (!ignore) {
          setPost(data)
        }
      } catch (err) {
        console.error('Failed to load post detail:', err)
        if (!ignore) {
          setError('게시글을 찾을 수 없거나 불러오는 중 오류가 발생했습니다.')
        }
      } finally {
        if (!ignore) setLoading(false)
      }
    }

    if (postId) {
      loadPost()
    }

    return () => {
      ignore = true
    }
  }, [postId, isTestMode])

  const handleDelete = async () => {
    if (!window.confirm('정말로 이 게시글을 삭제하시겠습니까?')) {
      return
    }

    setDeleting(true)
    try {
      await deletePost(postId, { isTestMode })
      alert('게시글이 삭제되었습니다.')
      onDeleted()
    } catch (err) {
      console.error('Failed to delete post:', err)
      alert('삭제 중 오류가 발생했습니다: ' + err.message)
    } finally {
      setDeleting(false)
    }
  }

  // 작성자 본인, 전체 관리자, 또는 해당 게시판 관리자인 경우 관리 가능
  const canManage = Boolean(
    user && post && (String(user.id) === String(post.author_id) || isAdmin || canManageBoard(post.board_id))
  )

  const boardObj = post ? HOBBY_BOARDS.find((b) => b.id === post.board_id) : null
  const boardDisplayName = boardObj ? boardObj.name : '자유 공간'

  if (loading) {
    return (
      <div className="loading-indicator">
        <div className="spinner" />
        <p>게시글을 불러오고 있습니다...</p>
      </div>
    )
  }

  if (error || !post) {
    return (
      <div className="empty-state">
        <p style={{ color: 'var(--color-danger)' }}>{error || '게시글이 존재하지 않습니다.'}</p>
        <button type="button" className="btn btn-outline" onClick={onBack}>
          목록으로 돌아가기
        </button>
      </div>
    )
  }

  return (
    <article className="post-detail-container">
      <nav className="detail-nav">
        <button type="button" className="btn btn-outline" onClick={onBack}>
          ← 목록으로
        </button>

        {canManage && (
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            {isAdmin && String(user.id) !== String(post.author_id) && (
              <span className="role-tag admin">전체 관리자</span>
            )}
            {!isAdmin && canManageBoard(post.board_id) && String(user.id) !== String(post.author_id) && (
              <span className="role-tag manager">취미 관리자</span>
            )}
            <button
              type="button"
              className="btn btn-outline"
              onClick={() => onEdit(post)}
            >
              수정
            </button>
            <button
              type="button"
              className="btn btn-danger"
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting ? '삭제 중...' : '삭제'}
            </button>
          </div>
        )}
      </nav>

      <header className="detail-header">
        <div className="post-board-badge">{boardDisplayName}</div>
        <h1 className="detail-title">{post.title}</h1>

        <div className="detail-meta">
          <div className="author-info">
            <span>작성자:</span>
            <span className="author-name">{post.author_nickname || post.author_name}</span>
          </div>
          <span>•</span>
          <time dateTime={post.created_at}>
            {formatDate(post.created_at)}
          </time>
          {post.updated_at && post.updated_at !== post.created_at && (
            <span style={{ fontSize: '0.8rem', color: 'var(--color-muted)' }}>
              (수정됨)
            </span>
          )}
        </div>
      </header>

      <div className="detail-body">
        {post.content}
      </div>

      <CommentSection
        postId={post.id}
        boardId={post.board_id}
        onOpenAuth={onOpenAuth}
      />
    </article>
  )
}
