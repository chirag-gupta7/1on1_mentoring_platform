import { apiClient } from './api'
import type { User, MentorProfile, StudentProfile } from '@/types'

export const userService = {
  async getProfile(): Promise<User & { profile: MentorProfile | StudentProfile }> {
    return apiClient('/users/me')
  },
  async updateProfile(data: {
    full_name?: string
    email?: string
    bio?: string
    expertise?: string
    hourly_rate?: number
    education?: string
    goals?: string
  }): Promise<User> {
    return apiClient('/users/me', { method: 'PUT', body: data })
  },
  async getMentors(params?: { skill?: string }): Promise<any[]> {
    const query = params?.skill ? `?skill=${params.skill}` : ''
    return apiClient(`/users/mentors${query}`)
  },
  async searchMentors(q: string, skills?: string): Promise<any[]> {
    const query = new URLSearchParams({ q })
    if (skills) query.set('skills', skills)
    return apiClient(`/users/mentors/search?${query}`)
  },
  async getMentorDetail(mentorId: string): Promise<any> {
    return apiClient(`/users/mentors/${mentorId}`)
  }
}
