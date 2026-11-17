import { useState } from 'react'
import { useAuth } from '../../context/useAuth'

export default function AuthModal({ isOpen, onClose }) {
  const [tab, setTab] = useState('login') // 'login' | 'signup'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [nickname, setNickname] = useState('')
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [successMsg, setSuccessMsg] = useState('')

  const { signIn, signUp } = useAuth()

  if (!isOpen) return null

  const resetForm = () => {
    setEmail('')
    setPassword('')
    setNickname('')
    setErrorMsg('')
    setSuccessMsg('')
  }

  const handleTabChange = (nextTab) => {
    setTab(nextTab)
    resetForm()
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setErrorMsg('')
    setSuccessMsg('')
    setLoading(true)

    try {
      if (tab === 'login') {
        await signIn({ email, password })
        onClose()
      } else {
        const trimmedNickname = nickname.trim()
        if (!trimmedNickname) {
          throw new Error('활동하실 닉네임을 입력해 주세요.')
        }
        await signUp({ email, password, nickname: trimmedNickname })
        setSuccessMsg(
          '회원가입 요청이 완료되었습니다! 발송된 인증 메일의 링크를 클릭하신 후 로그인해 주세요.'
        )
      }
    } catch (err) {
      console.error(err)
      let message = err.message || '인증 처리 중 오류가 발생했습니다.'
      if (message.includes('Invalid login credentials')) {
        message = '이메일 또는 비밀번호가 일치하지 않습니다.'
      } else if (message.includes('User already registered')) {
        message = '이미 가입된 이메일 주소입니다.'
      } else if (message.includes('Password should be at least')) {
        message = '비밀번호는 최소 6자 이상이어야 합니다.'
      } else if (message.includes('Email not confirmed')) {
        message = '이메일 인증이 완료되지 않았습니다. 메일함의 인증 링크를 먼저 확인해 주세요.'
      }
      setErrorMsg(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">
            {tab === 'login' ? 'HOBBY SPACE 로그인' : 'HOBBY SPACE 회원가입'}
          </h3>
          <button type="button" className="modal-close" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="modal-tabs">
          <button
            type="button"
            className={`modal-tab ${tab === 'login' ? 'active' : ''}`}
            onClick={() => handleTabChange('login')}
          >
            로그인
          </button>
          <button
            type="button"
            className={`modal-tab ${tab === 'signup' ? 'active' : ''}`}
            onClick={() => handleTabChange('signup')}
          >
            회원가입
          </button>
        </div>

        <form className="modal-body" onSubmit={handleSubmit}>
          {errorMsg && <div className="modal-alert error">{errorMsg}</div>}
          {successMsg && (
            <div className="modal-alert success" style={{ lineHeight: '1.5' }}>
              {successMsg}
            </div>
          )}

          <div className="form-group">
            <label className="form-label" htmlFor="user-email">
              이메일 주소 (로그인 계정)
            </label>
            <input
              id="user-email"
              type="email"
              className="form-input"
              placeholder="example@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <small style={{ color: 'var(--color-muted)', fontSize: '0.8rem', marginTop: '4px', display: 'block' }}>
              이메일은 계정 인증 및 로그인 전용이며 다른 회원에게 공개되지 않습니다.
            </small>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="user-password">
              비밀번호
            </label>
            <input
              id="user-password"
              type="password"
              className="form-input"
              placeholder={tab === 'signup' ? '6자 이상 입력' : '비밀번호를 입력하세요'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {tab === 'signup' && (
            <div className="form-group">
              <label className="form-label" htmlFor="user-nickname">
                활동 닉네임
              </label>
              <input
                id="user-nickname"
                type="text"
                className="form-input"
                placeholder="게시글과 댓글에 표시될 닉네임 (실명 불필요)"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                required
              />
              <small style={{ color: 'var(--color-muted)', fontSize: '0.8rem', marginTop: '4px', display: 'block' }}>
                게시글 및 댓글에 작성자 이름으로 표시됩니다.
              </small>
            </div>
          )}

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', marginTop: '12px', padding: '12px' }}
            disabled={loading}
          >
            {loading
              ? '처리 중...'
              : tab === 'login'
              ? '로그인하기'
              : '인증 메일 받고 회원가입'}
          </button>
        </form>
      </div>
    </div>
  )
}
