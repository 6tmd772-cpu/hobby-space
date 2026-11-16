import { useState } from 'react'
import { supabase } from '../../supabase'
import { useAuth } from '../../context/useAuth'

export default function PostForm({ mode = 'create', initialPost = null, onSaved, onCancel }) {
  const [title, setTitle] = useState(() => (mode === 'edit' && initialPost?.title ? initialPost.title : ''))
  const [content, setContent] = useState(() => (mode === 'edit' && initialPost?.content ? initialPost.content : ''))
  const [saving, setSaving] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  const { user, userName } = useAuth()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setErrorMsg('')

    if (!user) {
      setErrorMsg('로그인이 필요합니다.')
      return
    }

    const trimmedTitle = title.trim()
    const trimmedContent = content.trim()

    if (!trimmedTitle) {
      setErrorMsg('제목을 입력해 주세요.')
      return
    }

    if (!trimmedContent) {
      setErrorMsg('본문 내용을 입력해 주세요.')
      return
    }

    setSaving(true)
    try {
      if (mode === 'create') {
        const { data, error } = await supabase
          .from('posts')
          .insert({
            title: trimmedTitle,
            content: trimmedContent,
            author_id: user.id,
            author_name: userName, // DB 트리거가 profiles의 실제 실명으로 재차 검증 및 보정합니다.
            board_id: 'general',
          })
          .select()
          .single()

        if (error) throw error
        onSaved(data?.id)
      } else {
        const { error } = await supabase
          .from('posts')
          .update({
            title: trimmedTitle,
            content: trimmedContent,
          })
          .eq('id', initialPost.id)

        if (error) throw error
        onSaved(initialPost.id)
      }
    } catch (err) {
      console.error('Failed to save post:', err)
      setErrorMsg('게시글 저장 중 오류가 발생했습니다: ' + (err.message || '다시 시도해 주세요.'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <section className="post-form-container">
      <header className="form-header">
        <h1 className="form-title">
          {mode === 'create' ? '새로운 취미 이야기 기록하기' : '이야기 다듬기 (수정)'}
        </h1>
        <p style={{ marginTop: '6px', color: 'var(--color-muted)', fontSize: '0.9rem' }}>
          작성자: <strong style={{ color: 'var(--color-charcoal)' }}>{userName}</strong> (실명으로 발행됩니다)
        </p>
      </header>

      {errorMsg && <div className="modal-alert error">{errorMsg}</div>}

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="form-label" htmlFor="post-title">
            이야기 제목
          </label>
          <input
            id="post-title"
            type="text"
            className="form-input"
            placeholder="나누고 싶은 취미나 관심사 이야기의 제목을 적어주세요"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            disabled={saving}
            required
          />
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="post-content">
            본문 내용
          </label>
          <textarea
            id="post-content"
            className="form-textarea"
            placeholder="시작하게 된 계기, 즐기는 방법, 추천 장비나 나만의 팁 등 자유롭게 이야기를 풀어내 보세요..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            disabled={saving}
            required
          />
        </div>

        <div className="form-actions">
          <button
            type="button"
            className="btn btn-outline"
            onClick={onCancel}
            disabled={saving}
          >
            취소
          </button>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={saving}
          >
            {saving ? '저장 중...' : mode === 'create' ? '이야기 발행하기' : '수정 완료'}
          </button>
        </div>
      </form>
    </section>
  )
}
