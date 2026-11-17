const HOBBY_BOARDS = [
  { id: 'all', name: '전체 이야기', icon: '✦', desc: '모든 취미 공간의 통합 피드' },
  { id: 'book', name: 'BOOK SPACE', icon: '📖', desc: '독서와 서평, 사유의 문장' },
  { id: 'game', name: 'GAME SPACE', icon: '🎮', desc: '콘솔, PC, 인디게임 이야기' },
  { id: 'music', name: 'MUSIC SPACE', icon: '🎵', desc: '음악 감상, 악기, 플레이리스트' },
  { id: 'cook', name: 'COOK SPACE', icon: '🍳', desc: '요리 레시피, 홈베이킹, 미식' },
  { id: 'active', name: 'ACTIVE SPACE', icon: '🏃', desc: '운동, 러닝, 아웃도어 스포츠' },
]

export default function Sidebar({ selectedBoard, onSelectBoard, isOpen, onClose }) {
  const handleSelect = (boardId) => {
    onSelectBoard(boardId)
    if (onClose) onClose()
  }

  return (
    <>
      {isOpen && <div className="sidebar-backdrop" onClick={onClose} />}
      <aside className={`editorial-sidebar ${isOpen ? 'open' : ''}`}>
        <div className="sidebar-section-title">SPACES</div>
        <nav className="sidebar-nav">
          {HOBBY_BOARDS.map((board) => {
            const isActive = selectedBoard === board.id
            return (
              <button
                key={board.id}
                type="button"
                className={`sidebar-item ${isActive ? 'active' : ''}`}
                onClick={() => handleSelect(board.id)}
              >
                <span className="sidebar-icon">{board.icon}</span>
                <div className="sidebar-info">
                  <span className="sidebar-name">{board.name}</span>
                  <span className="sidebar-desc">{board.desc}</span>
                </div>
              </button>
            )
          })}
        </nav>
      </aside>
    </>
  )
}

export { HOBBY_BOARDS }
