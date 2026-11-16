import { create } from 'zustand'
import type { Session } from '@/types'
import { sessionService } from '@/services/session.service'

interface SessionState {
  sessions: Session[]
  currentSession: Session | null
  isLoading: boolean
  fetchSessions: () => Promise<void>
  setCurrentSession: (session: Session | null) => void
  createSession: (data: any) => Promise<Session>
  joinSession: (id: string) => Promise<void>
}

export const useSessionStore = create<SessionState>((set, get) => ({
  sessions: [],
  currentSession: null,
  isLoading: false,

  fetchSessions: async () => {
    set({ isLoading: true })
    try {
      const sessions = await sessionService.getMySessions()
      set({ sessions })
    } catch (err) {
      console.error('Failed to fetch sessions:', err)
    } finally {
      set({ isLoading: false })
    }
  },

  setCurrentSession: (session) => set({ currentSession: session }),

  createSession: async (data) => {
    const session = await sessionService.create(data)
    set((s) => ({ sessions: [session, ...s.sessions] }))
    return session
  },

  joinSession: async (id) => {
    const session = await sessionService.join(id)
    set({ currentSession: session })
  }
}))
