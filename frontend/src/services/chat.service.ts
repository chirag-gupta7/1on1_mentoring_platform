import { apiClient } from './api'
import type { Message } from '@/types'

export const chatService = {
  async getHistory(sessionId: string): Promise<Message[]> {
    const res = await apiClient<{ items: Message[] }>(`/chat/${sessionId}/history`)
    return res.items ?? []
  }
}
