import { MOCK_USERS } from './mockUsers'
import { resetTestStorageData } from './testDataStore'

const STORAGE_KEYS = {
  TEST_ROLE_ID: 'hobby_space_test_role_id',
  TEST_MODE_ACTIVE: 'hobby_space_test_mode_active',
  TEST_MANAGERS: 'hobby_space_test_managers',
  TEST_SUGGESTIONS: 'hobby_space_test_suggestions',
  TEST_DYNAMIC_BOARDS: 'hobby_space_test_dynamic_boards',
}

// 테스트 모드 활성화 여부
export function isTestModeActive() {
  if (!import.meta.env.DEV) return false
  return localStorage.getItem(STORAGE_KEYS.TEST_MODE_ACTIVE) === 'true'
}

// 현재 선택된 테스트 유저 객체 조회
export function getCurrentTestUser() {
  if (!isTestModeActive()) return null
  const roleId = localStorage.getItem(STORAGE_KEYS.TEST_ROLE_ID)
  if (!roleId) return MOCK_USERS[0] // 기본값: 전체 관리자
  return MOCK_USERS.find((u) => u.id === roleId) || MOCK_USERS[0]
}

// 테스트 역할 변경
export function setTestRole(roleId) {
  if (!roleId) {
    // 테스트 모드 해제 (실제 Supabase 세션으로 복귀)
    localStorage.setItem(STORAGE_KEYS.TEST_MODE_ACTIVE, 'false')
    localStorage.removeItem(STORAGE_KEYS.TEST_ROLE_ID)
  } else {
    localStorage.setItem(STORAGE_KEYS.TEST_MODE_ACTIVE, 'true')
    localStorage.setItem(STORAGE_KEYS.TEST_ROLE_ID, roleId)
  }
  window.dispatchEvent(new Event('test-role-change'))
}

// 테스트 데이터만 안전하게 초기화
export function resetTestOnlyData() {
  localStorage.removeItem(STORAGE_KEYS.TEST_ROLE_ID)
  localStorage.removeItem(STORAGE_KEYS.TEST_MANAGERS)
  localStorage.removeItem(STORAGE_KEYS.TEST_SUGGESTIONS)
  localStorage.removeItem(STORAGE_KEYS.TEST_DYNAMIC_BOARDS)
  resetTestStorageData()
  // 기본적으로 테스트 모드 첫 번째 역할로 재설정
  localStorage.setItem(STORAGE_KEYS.TEST_MODE_ACTIVE, 'true')
  localStorage.setItem(STORAGE_KEYS.TEST_ROLE_ID, MOCK_USERS[0].id)
  window.dispatchEvent(new Event('test-role-change'))
}
