import { apiClient } from './api'
import type { Session, SessionCreate } from '@/types'

export const sessionService = {
  async create(data: SessionCreate): Promise<Session> {
    return apiClient('/sessions', { method: 'POST', body: data })
  },
  async request(data: { mentor_id: string; title: string; description?: string; language: string; start_time: string }): Promise<Session> {
    return apiClient('/sessions/request', { method: 'POST', body: data })
  },
  async getMySessions(): Promise<Session[]> {
    return apiClient('/sessions/my')
  },
  async getById(id: string): Promise<Session> {
    return apiClient(`/sessions/${id}`)
  },
  async update(id: string, data: Partial<SessionCreate>): Promise<Session> {
    return apiClient(`/sessions/${id}`, { method: 'PUT', body: data })
  },
  async delete(id: string): Promise<void> {
    return apiClient(`/sessions/${id}`, { method: 'DELETE' })
  },
  async join(id: string): Promise<Session> {
    return apiClient(`/sessions/${id}/join`, { method: 'POST' })
  },
  async end(id: string): Promise<Session> {
    return apiClient(`/sessions/${id}/end`, { method: 'POST' })
  },
  async cancel(id: string): Promise<Session> {
    return apiClient(`/sessions/${id}/cancel`, { method: 'POST' })
  },
  async approve(id: string): Promise<Session> {
    return apiClient(`/sessions/${id}/approve`, { method: 'POST' })
  },
  async reschedule(id: string, data: { start_time: string }): Promise<Session> {
    return apiClient(`/sessions/${id}/reschedule`, { method: 'POST', body: data })
  }
}
