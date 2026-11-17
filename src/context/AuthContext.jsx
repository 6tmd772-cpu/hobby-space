import { useEffect, useState } from 'react'
import { supabase } from '../supabase'
import { AuthContext } from './authContextDef'

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [managedBoards, setManagedBoards] = useState([])
  const [loading, setLoading] = useState(true)

  // 프로필 정보 및 담당 게시판 조회
  const fetchProfile = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle()

      if (error) {
        console.error('Error fetching profile:', error)
        return null
      }

      if (data) {
        setProfile(data)
      }

      // 취미별 관리자 매핑 정보 조회
      const { data: managerData } = await supabase
        .from('board_managers')
        .select('board_id')
        .eq('user_id', userId)

      if (managerData) {
        setManagedBoards(managerData.map((m) => m.board_id))
      }

      return data
    } catch (err) {
      console.error('Failed to fetch profile:', err)
      return null
    }
  }

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      const currentUser = session?.user ?? null
      setUser(currentUser)
      if (currentUser) {
        await fetchProfile(currentUser.id)
      }
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        const currentUser = session?.user ?? null
        setUser(currentUser)
        if (currentUser) {
          await fetchProfile(currentUser.id)
        } else {
          setProfile(null)
          setManagedBoards([])
        }
        setLoading(false)
      }
    )

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  // 회원가입: 이메일, 비밀번호, 닉네임 (실명 입력 없음)
  const signUp = async ({ email, password, nickname }) => {
    const trimmedNickname = nickname.trim()
    if (!trimmedNickname) {
      throw new Error('커뮤니티에서 사용할 닉네임을 입력해 주세요.')
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          nickname: trimmedNickname,
        },
      },
    })

    if (error) throw error

    // 백업: 트리거 지연 시 직접 profile upsert
    if (data.user) {
      try {
        await supabase.from('profiles').upsert({
          id: data.user.id,
          name: trimmedNickname,
          nickname: trimmedNickname,
          role: 'user',
        })
        await fetchProfile(data.user.id)
      } catch (profileErr) {
        console.warn('Profiles upsert note:', profileErr)
      }
    }

    return data
  }

  // 로그인: 이메일과 비밀번호
  const signIn = async ({ email, password }) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    if (error) throw error
    if (data.user) {
      await fetchProfile(data.user.id)
    }
    return data
  }

  // 로그아웃
  const signOut = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
    setUser(null)
    setProfile(null)
    setManagedBoards([])
  }

  // 특정 게시판의 관리자 권한 확인 (전체 관리자이거나 담당 취미 관리자인지 확인)
  const canManageBoard = (boardId) => {
    if (!profile) return false
    if (profile.role === 'admin') return true
    return managedBoards.includes(boardId)
  }

  const value = {
    user,
    profile,
    loading,
    isAdmin: profile?.role === 'admin',
    managedBoards,
    canManageBoard,
    userNickname: profile?.nickname || profile?.name || user?.user_metadata?.nickname || '회원',
    signUp,
    signIn,
    signOut,
    refreshProfile: () => (user ? fetchProfile(user.id) : Promise.resolve(null)),
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
