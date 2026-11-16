import { useEffect, useState } from 'react'
import { supabase } from '../supabase'
import { AuthContext } from './authContextDef'

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  // 프로필 정보 조회 함수
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
        return data
      }
      return null
    } catch (err) {
      console.error('Failed to fetch profile:', err)
      return null
    }
  }

  useEffect(() => {
    // 1. 현재 세션 확인
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      const currentUser = session?.user ?? null
      setUser(currentUser)
      if (currentUser) {
        await fetchProfile(currentUser.id)
      }
      setLoading(false)
    })

    // 2. 인증 상태 변화 감지
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        const currentUser = session?.user ?? null
        setUser(currentUser)
        if (currentUser) {
          await fetchProfile(currentUser.id)
        } else {
          setProfile(null)
        }
        setLoading(false)
      }
    )

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  // 회원가입 (실명 필수 입력)
  const signUp = async ({ email, password, name }) => {
    const trimmedName = name.trim()
    if (!trimmedName) {
      throw new Error('이름(실명)을 입력해 주세요.')
    }

    // Supabase Auth에 메타데이터로 name 전달
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name: trimmedName,
        },
      },
    })

    if (error) throw error

    // 백업: 트리거 지연에 대비해 profiles 직접 업서트 시도
    if (data.user) {
      try {
        await supabase.from('profiles').upsert({
          id: data.user.id,
          name: trimmedName,
          role: 'user',
        })
        await fetchProfile(data.user.id)
      } catch (profileErr) {
        console.warn('Profiles upsert note:', profileErr)
      }
    }

    return data
  }

  // 로그인
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
  }

  const value = {
    user,
    profile,
    loading,
    isAdmin: profile?.role === 'admin',
    userName: profile?.name || user?.user_metadata?.name || '회원',
    signUp,
    signIn,
    signOut,
    refreshProfile: () => (user ? fetchProfile(user.id) : Promise.resolve(null)),
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
