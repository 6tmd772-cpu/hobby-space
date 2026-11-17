import { useState } from 'react'
import { MOCK_USERS } from './mockUsers'
import { setTestRole, resetTestOnlyData } from './testStore'
import { useAuth } from '../context/useAuth'

export default function TestModeController() {
  const [isOpen, setIsOpen] = useState(false)
  const { isTestMode, testUser } = useAuth()

  // 개발 환경(import.meta.env.DEV)에서만 렌더링
  if (!import.meta.env.DEV) return null

  const handleRoleSelect = (roleId) => {
    setTestRole(roleId)
  }

  const handleTurnOff = () => {
    setTestRole(null)
    setIsOpen(false)
  }

  const handleReset = () => {
    if (window.confirm('가상 테스트용 데이터만 초기화하시겠습니까? (실제 DB 데이터는 보존됩니다)')) {
      resetTestOnlyData()
    }
  }

  return (
    <aside className="test-controller-container" aria-label="개발자 가상 테스트 모드">
      <div className="test-controller-bar">
        <button
          type="button"
          className={`test-controller-toggle-btn ${isTestMode ? 'active' : ''}`}
          onClick={() => setIsOpen((prev) => !prev)}
        >
          <span className="test-pulse-dot" />
          <span>🧪 테스트 모드 {isTestMode ? `[${testUser?.roleLabel || 'ON'}]` : '[OFF]'}</span>
          <span className="test-arrow">{isOpen ? '▲' : '▼'}</span>
        </button>
      </div>

      {isOpen && (
        <div className="test-controller-panel">
          <div className="test-panel-header">
            <h4>🧪 프론트엔드 가상 권한 테스트</h4>
            <span className="test-badge-notice">개발 환경 전용</span>
          </div>

          <p className="test-disclaimer">
            ※ 실제 Supabase 계정이나 DB 권한을 변경하지 않으며, 프론트엔드에서 역할별 기능과 화면 권한을 안전하게 검증합니다.
          </p>

          <div className="test-current-status">
            <span className="test-status-label">현재 역할:</span>
            {isTestMode && testUser ? (
              <div className="test-status-info">
                <strong>{testUser.roleBadge} ({testUser.nickname})</strong>
                <p>{testUser.roleDesc}</p>
              </div>
            ) : (
              <div className="test-status-info">
                <em>실제 Supabase 세션 사용 중 (테스트 모드 꺼짐)</em>
              </div>
            )}
          </div>

          <div className="test-roles-section">
            <label className="test-section-label">전환할 역할을 선택하세요:</label>
            <div className="test-role-buttons">
              {MOCK_USERS.map((user) => {
                const isSelected = isTestMode && testUser?.id === user.id
                return (
                  <button
                    key={user.id}
                    type="button"
                    className={`test-role-btn ${isSelected ? 'selected' : ''}`}
                    onClick={() => handleRoleSelect(user.id)}
                  >
                    <span className="role-title">{user.roleBadge}</span>
                    <span className="role-name">{user.nickname}</span>
                  </button>
                )
              })}
            </div>
          </div>

          <div className="test-panel-footer">
            <button
              type="button"
              className="btn btn-outline test-action-btn"
              onClick={handleReset}
              title="테스트용 임시 데이터만 초기화합니다"
            >
              🔄 테스트 데이터 초기화
            </button>

            {isTestMode && (
              <button
                type="button"
                className="btn btn-danger test-action-btn"
                onClick={handleTurnOff}
              >
                ✕ 테스트 끄기 (실제 계정)
              </button>
            )}
          </div>
        </div>
      )}
    </aside>
  )
}
