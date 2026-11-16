import { apiClient } from './api'

export const subscriptionService = {
  async subscribe(mentorId: string): Promise<{ message: string }> {
    return apiClient(`/subscriptions/${mentorId}`, { method: 'POST' })
  },
  async unsubscribe(mentorId: string): Promise<{ message: string }> {
    return apiClient(`/subscriptions/${mentorId}`, { method: 'DELETE' })
  },
  async checkSubscription(mentorId: string): Promise<{ subscribed: boolean }> {
    return apiClient(`/subscriptions/check/${mentorId}`)
  },
  async getMyStudents(): Promise<any[]> {
    return apiClient('/subscriptions/my-students')
  },
  async getMyMentors(): Promise<any[]> {
    return apiClient('/subscriptions/my-mentors')
  }
}
