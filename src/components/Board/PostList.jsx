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
  }).format(date)
}

export default function PostList({ onSelectPost, onNavigateCreate, onOpenAuth }) {
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const { user } = useAuth()

  const fetchPosts = async (showLoadingState = true) => {
    if (showLoadingState) setLoading(true)
    setError(null)
    try {
      const { data, error: queryError } = await supabase
        .from('posts')
        .select('*')
        .order('created_at', { ascending: false })

      if (queryError) throw queryError
      setPosts(data || [])
    } catch (err) {
      console.error('Failed to load posts:', err)
      setError('게시글을 불러오는 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    let ignore = false

    supabase
      .from('posts')
      .select('*')
      .order('created_at', { ascending: false })
      .then(({ data, error: queryError }) => {
        if (!ignore) {
          if (queryError) {
            console.error('Failed to load posts:', queryError)
            setError('게시글을 불러오는 중 오류가 발생했습니다.')
          } else {
            setPosts(data || [])
          }
          setLoading(false)
        }
      })

    return () => {
      ignore = true
    }
  }, [])

  const handleWriteClick = () => {
    if (!user) {
      onOpenAuth()
    } else {
      onNavigateCreate()
    }
  }

  return (
    <section className="board-section">
      <div className="board-header">
        <div className="board-title-group">
          <h1>취미 이야기</h1>
          <p>자신만의 취미와 깊이 있는 관심사를 정갈하게 공유하는 공간입니다.</p>
        </div>

        <button
          type="button"
          className="btn btn-primary"
          onClick={handleWriteClick}
        >
          이야기 쓰기
        </button>
      </div>

      {loading ? (
        <div className="loading-indicator">
          <div className="spinner" />
          <p>이야기를 불러오고 있습니다...</p>
        </div>
      ) : error ? (
        <div className="empty-state">
          <p style={{ color: 'var(--color-danger)' }}>{error}</p>
          <button type="button" className="btn btn-outline" onClick={() => fetchPosts(true)}>
            다시 시도
          </button>
        </div>
      ) : posts.length === 0 ? (
        <div className="empty-state">
          <p>아직 등록된 게시글이 없습니다.</p>
          <p>첫 번째 취미 이야기를 들려주세요!</p>
          <button
            type="button"
            className="btn btn-primary"
            style={{ marginTop: '12px' }}
            onClick={handleWriteClick}
          >
            첫 이야기 작성하기
          </button>
        </div>
      ) : (
        <div className="post-list">
          {posts.map((post) => (
            <article
              key={post.id}
              className="post-card"
              onClick={() => onSelectPost(post.id)}
            >
              <div className="post-card-meta">
                <span className="author">{post.author_name}</span>
                <span>•</span>
                <time>{formatDate(post.created_at)}</time>
              </div>

              <h2 className="post-card-title">{post.title}</h2>

              <p className="post-card-excerpt">
                {post.content}
              </p>
            </article>
          ))}
        </div>
      )}
    </section>
  )
}
