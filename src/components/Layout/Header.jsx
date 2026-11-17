import { useAuth } from '../../context/useAuth'

export default function Header({ onNavigate, onOpenAuth, onToggleSidebar }) {
  const { user, userNickname, isAdmin, managedBoards, signOut } = useAuth()

  const handleLogout = async () => {
    try {
      await signOut()
      onNavigate('list')
    } catch (err) {
      alert('로그아웃 중 오류가 발생했습니다: ' + err.message)
    }
  }

  const roleLabel = isAdmin
    ? '전체 관리자'
    : managedBoards && managedBoards.length > 0
    ? '취미 관리자'
    : '회원'

  return (
    <header className="editorial-header">
      <div className="header-inner">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            type="button"
            className="mobile-menu-btn"
            onClick={onToggleSidebar}
            aria-label="게시판 메뉴 열기"
          >
            ☰
          </button>

          <div className="brand-section" onClick={() => onNavigate('list')}>
            <span className="brand-title">HOBBY SPACE</span>
            <span className="brand-subtitle">취미 공유 커뮤니티</span>
          </div>
        </div>

        <div className="nav-actions">
          {user ? (
            <>
              <div className="user-badge">
                <span className="user-nickname">{userNickname}</span>
                <span
                  className={`role-tag ${
                    isAdmin ? 'admin' : managedBoards.length > 0 ? 'manager' : 'user'
                  }`}
                >
                  {roleLabel}
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
