import { create } from 'zustand'
import type { User } from '@/types'
import { authService } from '@/services/auth.service'

interface AuthState {
  user: User | null
  token: string | null
  refreshToken: string | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<void>
  register: (data: { email: string; password: string; full_name: string; role: string }) => Promise<void>
  logout: () => void
  setUser: (user: User) => void
  hydrate: () => void
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: null,
  refreshToken: null,
  isLoading: true,
  isAuthenticated: false,

  hydrate: () => {
    if (typeof window === 'undefined') return
    const token = localStorage.getItem('access_token')
    const refreshToken = localStorage.getItem('refresh_token')
    const userStr = localStorage.getItem('user')
    if (token && userStr) {
      try {
        const user = JSON.parse(userStr)
        set({ user, token, refreshToken, isAuthenticated: true, isLoading: false })
      } catch {
        set({ isLoading: false })
      }
    } else {
      set({ isLoading: false })
    }
  },

  login: async (email, password) => {
    const res = await authService.login(email, password)
    localStorage.setItem('access_token', res.access_token)
    localStorage.setItem('refresh_token', res.refresh_token)
    set({ token: res.access_token, refreshToken: res.refresh_token })
    const user = await authService.getMe()
    localStorage.setItem('user', JSON.stringify(user))
    set({ user, isAuthenticated: true })
  },

  register: async (data) => {
    const res = await authService.register(data)
    localStorage.setItem('access_token', res.access_token)
    localStorage.setItem('refresh_token', res.refresh_token)
    set({ token: res.access_token, refreshToken: res.refresh_token })
    const user = await authService.getMe()
    localStorage.setItem('user', JSON.stringify(user))
    set({ user, isAuthenticated: true })
  },

  logout: () => {
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    localStorage.removeItem('user')
    set({ user: null, token: null, refreshToken: null, isAuthenticated: false })
  },

  setUser: (user) => set({ user })
}))
