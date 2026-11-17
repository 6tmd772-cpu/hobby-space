import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../supabase'
import { AuthContext } from './authContextDef'
import { isTestModeActive, getCurrentTestUser } from '../test/testStore'

export function AuthProvider({ children }) {
  const [realUser, setRealUser] = useState(null)
  const [realProfile, setRealProfile] = useState(null)
  const [realManagedBoards, setRealManagedBoards] = useState([])
  const [loading, setLoading] = useState(true)

  // 가상 테스트 모드 상태
  const [testUser, setTestUser] = useState(() => getCurrentTestUser())
  const [isTestMode, setIsTestMode] = useState(() => isTestModeActive())

  // 테스트 역할 변경 리스너
  const handleTestRoleChange = useCallback(() => {
    const active = isTestModeActive()
    setIsTestMode(active)
    setTestUser(active ? getCurrentTestUser() : null)
  }, [])

  useEffect(() => {
    window.addEventListener('test-role-change', handleTestRoleChange)
    return () => {
      window.removeEventListener('test-role-change', handleTestRoleChange)
    }
  }, [handleTestRoleChange])

  // 실제 Supabase 프로필 정보 조회
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
        setRealProfile(data)
      }

      const { data: managerData } = await supabase
        .from('board_managers')
        .select('board_id')
        .eq('user_id', userId)

      if (managerData) {
        setRealManagedBoards(managerData.map((m) => m.board_id))
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
      setRealUser(currentUser)
      if (currentUser) {
        await fetchProfile(currentUser.id)
      }
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        const currentUser = session?.user ?? null
        setRealUser(currentUser)
        if (currentUser) {
          await fetchProfile(currentUser.id)
        } else {
          setRealProfile(null)
          setRealManagedBoards([])
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
    setRealUser(null)
    setRealProfile(null)
    setRealManagedBoards([])
  }

  // 특정 게시판의 관리자 권한 확인
  const canManageBoard = (boardId) => {
    if (isTestMode && testUser) {
      if (testUser.role === 'admin') return true
      return (testUser.managedBoards || []).includes(boardId)
    }
    if (!realProfile) return false
    if (realProfile.role === 'admin') return true
    return realManagedBoards.includes(boardId)
  }

  // 가상 테스트 모드가 켜진 경우 가상 유저 상태 주입, 꺼진 경우 실제 Supabase 세션 반환
  const effectiveUser = isTestMode && testUser
    ? { id: testUser.id, email: testUser.email }
    : realUser

  const effectiveProfile = isTestMode && testUser
    ? { id: testUser.id, nickname: testUser.nickname, role: testUser.role }
    : realProfile

  const effectiveIsAdmin = isTestMode && testUser
    ? testUser.role === 'admin'
    : realProfile?.role === 'admin'

  const effectiveManagedBoards = isTestMode && testUser
    ? (testUser.managedBoards || [])
    : realManagedBoards

  const effectiveUserNickname = isTestMode && testUser
    ? testUser.nickname
    : (realProfile?.nickname || realProfile?.name || realUser?.user_metadata?.nickname || '회원')

  const value = {
    user: effectiveUser,
    profile: effectiveProfile,
    loading,
    isAdmin: effectiveIsAdmin,
    managedBoards: effectiveManagedBoards,
    canManageBoard,
    userNickname: effectiveUserNickname,
    signUp,
    signIn,
    signOut,
    refreshProfile: () => (realUser ? fetchProfile(realUser.id) : Promise.resolve(null)),
    // 테스트 모드 전용 상태 및 메타데이터
    isTestMode,
    testUser,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
