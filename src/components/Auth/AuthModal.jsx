import { useState } from 'react'
import { useAuth } from '../../context/useAuth'

export default function AuthModal({ isOpen, onClose }) {
  const [tab, setTab] = useState('login') // 'login' | 'signup'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [successMsg, setSuccessMsg] = useState('')

  const { signIn, signUp } = useAuth()

  if (!isOpen) return null

  const resetForm = () => {
    setEmail('')
    setPassword('')
    setName('')
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
        if (!name.trim()) {
          throw new Error('활동하실 실명을 입력해 주세요.')
        }
        await signUp({ email, password, name })
        setSuccessMsg('회원가입이 완료되었습니다! 로그인된 상태로 시작합니다.')
        setTimeout(() => {
          onClose()
        }, 900)
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
          {successMsg && <div className="modal-alert success">{successMsg}</div>}

          {tab === 'signup' && (
            <div className="form-group">
              <label className="form-label" htmlFor="user-name">
                이름 (실명)
              </label>
              <input
                id="user-name"
                type="text"
                className="form-input"
                placeholder="게시글에 표시될 실명을 입력하세요 (예: 홍길동)"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
          )}

          <div className="form-group">
            <label className="form-label" htmlFor="user-email">
              이메일
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

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', marginTop: '8px', padding: '12px' }}
            disabled={loading}
          >
            {loading
              ? '처리 중...'
              : tab === 'login'
              ? '로그인하기'
              : '회원가입 완료'}
          </button>
        </form>
      </div>
    </div>
  )
}
