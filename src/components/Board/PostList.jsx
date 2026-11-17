import { useState, useEffect } from 'react'
import { fetchPosts as getPostList } from '../../services/postService'
import { useAuth } from '../../context/useAuth'
import { HOBBY_BOARDS } from '../Layout/Sidebar'

function formatDate(dateString) {
  if (!dateString) return ''
  const date = new Date(dateString)
  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date)
}

export default function PostList({
  selectedBoard = 'all',
  onSelectPost,
}) {
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const { isTestMode } = useAuth()

  const currentBoard = HOBBY_BOARDS.find((b) => b.id === selectedBoard) || {
    id: 'all',
    name: '전체 이야기',
    desc: '모든 취미 공간의 통합 피드',
  }

  const loadPosts = async (showLoadingState = true) => {
    if (showLoadingState) setLoading(true)
    setError(null)
    try {
      const data = await getPostList({ selectedBoard, isTestMode })
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

    const load = async () => {
      try {
        const data = await getPostList({ selectedBoard, isTestMode })
        if (!ignore) {
          setPosts(data || [])
        }
      } catch (err) {
        if (!ignore) {
          console.error(err)
          setError('게시글을 불러오는 중 오류가 발생했습니다.')
        }
      } finally {
        if (!ignore) {
          setLoading(false)
        }
      }
    }

    load()

    return () => {
      ignore = true
    }
  }, [selectedBoard, isTestMode])

  const getBoardBadgeName = (boardId) => {
    const found = HOBBY_BOARDS.find((b) => b.id === boardId)
    return found ? found.name : '자유 공간'
  }

  return (
    <section className="board-section">
      <div className="board-header">
        <div className="board-title-group">
          <h1>{currentBoard.name}</h1>
          <p>{currentBoard.desc}</p>
        </div>
      </div>

      {loading ? (
        <div className="loading-indicator">
          <div className="spinner" />
          <p>이야기를 불러오고 있습니다...</p>
        </div>
      ) : error ? (
        <div className="empty-state">
          <p style={{ color: 'var(--color-danger)' }}>{error}</p>
          <button type="button" className="btn btn-outline" onClick={() => loadPosts(true)}>
            다시 시도
          </button>
        </div>
      ) : posts.length === 0 ? (
        <div className="empty-state">
          <p>아직 등록된 게시글이 없습니다.</p>
          <p>상단의 '새 글 작성' 버튼을 눌러 첫 번째 이야기를 들려주세요!</p>
        </div>
      ) : (
        <div className="post-list">
          {posts.map((post) => {
            const commentCount = post.comments?.[0]?.count ?? 0
            return (
              <article
                key={post.id}
                className="post-card"
                onClick={() => onSelectPost(post.id)}
              >
                <div className="post-card-meta">
                  <span className="post-board-tag">
                    {getBoardBadgeName(post.board_id)}
                  </span>
                  <span>•</span>
                  <span className="author">{post.author_nickname || post.author_name}</span>
                  <span>•</span>
                  <time>{formatDate(post.created_at)}</time>
                  {commentCount > 0 && (
                    <>
                      <span>•</span>
                      <span className="comment-badge">💬 {commentCount}</span>
                    </>
                  )}
                </div>

                <h2 className="post-card-title">{post.title}</h2>

                <p className="post-card-excerpt">
                  {post.content}
                </p>
              </article>
            )
          })}
        </div>
      )}
    </section>
  )
}
