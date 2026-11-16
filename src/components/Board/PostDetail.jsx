import { useState, useEffect } from 'react'
import { supabase } from '../../supabase'
import { useAuth } from '../../context/useAuth'

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

export default function PostDetail({ postId, onBack, onEdit, onDeleted }) {
  const [post, setPost] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [deleting, setDeleting] = useState(false)

  const { user, isAdmin } = useAuth()

  useEffect(() => {
    const fetchPost = async () => {
      setLoading(true)
      setError(null)
      try {
        const { data, error } = await supabase
          .from('posts')
          .select('*')
          .eq('id', postId)
          .single()

        if (error) throw error
        setPost(data)
      } catch (err) {
        console.error('Failed to load post detail:', err)
        setError('게시글을 찾을 수 없거나 불러오는 중 오류가 발생했습니다.')
      } finally {
        setLoading(false)
      }
    }

    if (postId) {
      fetchPost()
    }
  }, [postId])

  const handleDelete = async () => {
    if (!window.confirm('정말로 이 게시글을 삭제하시겠습니까?')) {
      return
    }

    setDeleting(true)
    try {
      const { error } = await supabase
        .from('posts')
        .delete()
        .eq('id', postId)

      if (error) throw error
      alert('게시글이 삭제되었습니다.')
      onDeleted()
    } catch (err) {
      console.error('Failed to delete post:', err)
      alert('삭제 중 오류가 발생했습니다: ' + err.message)
    } finally {
      setDeleting(false)
    }
  }

  // 작성자 본인이거나 관리자인 경우 수정/삭제 권한 부여
  const canManage = Boolean(user && post && (user.id === post.author_id || isAdmin))

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
            {isAdmin && user.id !== post.author_id && (
              <span className="role-tag admin">관리자 관리 모드</span>
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
        <h1 className="detail-title">{post.title}</h1>

        <div className="detail-meta">
          <div className="author-info">
            <span>작성자:</span>
            <span className="author-name">{post.author_name}</span>
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

      <footer className="detail-actions">
        <button type="button" className="btn btn-outline" onClick={onBack}>
          목록으로 돌아가기
        </button>
      </footer>
    </article>
  )
}
