import { create } from 'zustand'
import type { Message } from '@/types'

interface ChatState {
  messages: Message[]
  addMessage: (message: Message) => void
  setMessages: (messages: Message[]) => void
  clearMessages: () => void
}

export const useChatStore = create<ChatState>((set) => ({
  messages: [],
  addMessage: (message) => set((s) => ({ messages: [...s.messages, message] })),
  setMessages: (messages) => set({ messages }),
  clearMessages: () => set({ messages: [] })
}))
