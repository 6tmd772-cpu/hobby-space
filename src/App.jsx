import { useState } from 'react'
import { AuthProvider } from './context/AuthContext'
import { useAuth } from './context/useAuth'
import Header from './components/Layout/Header'
import Footer from './components/Layout/Footer'
import AuthModal from './components/Auth/AuthModal'
import PostList from './components/Board/PostList'
import PostDetail from './components/Board/PostDetail'
import PostForm from './components/Board/PostForm'

function MainApp() {
  const [view, setView] = useState('list') // 'list' | 'detail' | 'create' | 'edit'
  const [selectedPostId, setSelectedPostId] = useState(null)
  const [editingPost, setEditingPost] = useState(null)
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false)

  const { user } = useAuth()

  const handleNavigate = (targetView) => {
    if (targetView === 'create') {
      if (!user) {
        setIsAuthModalOpen(true)
        return
      }
      setEditingPost(null)
      setView('create')
      window.scrollTo({ top: 0, behavior: 'smooth' })
      return
    }

    if (targetView === 'list') {
      setSelectedPostId(null)
      setEditingPost(null)
      setView('list')
      window.scrollTo({ top: 0, behavior: 'smooth' })
      return
    }

    setView(targetView)
  }

  const handleSelectPost = (id) => {
    setSelectedPostId(id)
    setView('detail')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleEditPost = (post) => {
    setEditingPost(post)
    setView('edit')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handlePostSaved = (savedId) => {
    if (savedId) {
      setSelectedPostId(savedId)
      setView('detail')
    } else {
      setView('list')
    }
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <div className="app-container">
      <Header
        onNavigate={handleNavigate}
        onOpenAuth={() => setIsAuthModalOpen(true)}
      />

      <main className="main-content">
        {view === 'list' && (
          <PostList
            onSelectPost={handleSelectPost}
            onNavigateCreate={() => handleNavigate('create')}
            onOpenAuth={() => setIsAuthModalOpen(true)}
          />
        )}

        {view === 'detail' && (
          <PostDetail
            postId={selectedPostId}
            onBack={() => handleNavigate('list')}
            onEdit={handleEditPost}
            onDeleted={() => handleNavigate('list')}
          />
        )}

        {view === 'create' && (
          <PostForm
            mode="create"
            onSaved={handlePostSaved}
            onCancel={() => handleNavigate('list')}
          />
        )}

        {view === 'edit' && (
          <PostForm
            mode="edit"
            initialPost={editingPost}
            onSaved={handlePostSaved}
            onCancel={() => handleNavigate('detail')}
          />
        )}
      </main>

      <Footer />

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />
    </div>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  )
}
