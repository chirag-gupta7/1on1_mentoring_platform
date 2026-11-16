import { apiClient } from './api'
import type { User } from '@/types'

interface TokenResponse {
  access_token: string
  refresh_token: string
  token_type: string
}

export const authService = {
  async register(data: { email: string; password: string; full_name: string; role: string }): Promise<TokenResponse> {
    return apiClient('/auth/register', { method: 'POST', body: data, auth: false })
  },
  async login(email: string, password: string): Promise<TokenResponse> {
    return apiClient('/auth/login', { method: 'POST', body: { email, password }, auth: false })
  },
  async refresh(refreshToken: string): Promise<TokenResponse> {
    return apiClient('/auth/refresh', { method: 'POST', body: { refresh_token: refreshToken }, auth: false })
  },
  async getMe(): Promise<User> {
    return apiClient('/auth/me')
  },
  async logout(): Promise<void> {
    return apiClient('/auth/logout', { method: 'POST' })
  },
  async forgotPassword(email: string): Promise<{ message: string }> {
    return apiClient('/auth/forgot-password', { method: 'POST', body: { email }, auth: false })
  },
  async resetPassword(token: string, newPassword: string): Promise<{ message: string }> {
    return apiClient('/auth/reset-password', { method: 'POST', body: { token, new_password: newPassword }, auth: false })
  }
}
