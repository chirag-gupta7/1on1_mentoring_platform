import { describe, it, expect, beforeEach, vi } from 'vitest'

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {}
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => { store[key] = value },
    removeItem: (key: string) => { delete store[key] },
    clear: () => { store = {} },
  }
})()

Object.defineProperty(global, 'localStorage', { value: localStorageMock })

import { useAuthStore } from '@/store/authStore'

describe('AuthStore', () => {
  beforeEach(() => {
    localStorageMock.clear()
    useAuthStore.setState({
      user: null,
      token: null,
      refreshToken: null,
      isLoading: true,
      isAuthenticated: false,
    })
  })

  it('starts with loading state', () => {
    const state = useAuthStore.getState()
    expect(state.isLoading).toBe(true)
    expect(state.isAuthenticated).toBe(false)
  })

  it('hydrates from localStorage', () => {
    localStorageMock.setItem('access_token', 'test-token')
    localStorageMock.setItem('refresh_token', 'test-refresh')
    localStorageMock.setItem('user', JSON.stringify({
      id: '1',
      email: 'test@test.com',
      full_name: 'Test User',
      role: 'student',
      is_verified: true,
      created_at: '2026-01-01',
      updated_at: '2026-01-01',
    }))

    useAuthStore.getState().hydrate()

    const state = useAuthStore.getState()
    expect(state.isAuthenticated).toBe(true)
    expect(state.token).toBe('test-token')
    expect(state.user?.email).toBe('test@test.com')
  })

  it('logout clears state', () => {
    useAuthStore.setState({
      user: { id: '1', email: 'a@b.com', full_name: 'A', role: 'student', is_verified: true, created_at: '', updated_at: '' },
      token: 'tok',
      refreshToken: 'ref',
      isAuthenticated: true,
      isLoading: false,
    })

    useAuthStore.getState().logout()

    const state = useAuthStore.getState()
    expect(state.isAuthenticated).toBe(false)
    expect(state.user).toBeNull()
    expect(state.token).toBeNull()
  })
})
