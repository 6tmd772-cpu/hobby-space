const CURRENT_YEAR = new Date().getFullYear()

export default function Footer() {
  return (
    <footer className="editorial-footer">
      <p>© {CURRENT_YEAR} HOBBY SPACE. 모든 취미와 관심사를 나누는 정갈한 기록 공간.</p>
    </footer>
  )
}
