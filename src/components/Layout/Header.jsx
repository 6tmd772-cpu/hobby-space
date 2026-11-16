import { useAuth } from '../../context/useAuth'

export default function Header({ onNavigate, onOpenAuth }) {
  const { user, userName, isAdmin, signOut } = useAuth()

  const handleLogout = async () => {
    try {
      await signOut()
      onNavigate('list')
    } catch (err) {
      alert('로그아웃 중 오류가 발생했습니다: ' + err.message)
    }
  }

  return (
    <header className="editorial-header">
      <div className="header-inner">
        <div className="brand-section" onClick={() => onNavigate('list')}>
          <span className="brand-title">HOBBY SPACE</span>
          <span className="brand-subtitle">취미 공유 커뮤니티</span>
        </div>

        <div className="nav-actions">
          {user ? (
            <>
              <div className="user-badge">
                <span>{userName}</span>
                <span className={`role-tag ${isAdmin ? 'admin' : 'user'}`}>
                  {isAdmin ? '관리자' : '회원'}
                </span>
              </div>

              <button
                type="button"
                className="btn btn-primary"
                onClick={() => onNavigate('create')}
              >
                새 글 작성
              </button>

              <button
                type="button"
                className="btn btn-text"
                onClick={handleLogout}
              >
                로그아웃
              </button>
            </>
          ) : (
            <button
              type="button"
              className="btn btn-outline"
              onClick={onOpenAuth}
            >
              로그인 / 회원가입
            </button>
          )}
        </div>
      </div>
    </header>
  )
}
