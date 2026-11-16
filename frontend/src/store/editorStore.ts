import { create } from 'zustand'

interface CursorInfo {
  userId: string
  userName: string
  line: number
  column: number
}

interface EditorState {
  code: string
  language: string
  cursors: Map<string, CursorInfo>
  setCode: (code: string) => void
  setLanguage: (lang: string) => void
  updateCursor: (cursor: CursorInfo) => void
  removeCursor: (userId: string) => void
}

export const useEditorStore = create<EditorState>((set) => ({
  code: '// Start coding here...\n',
  language: 'javascript',
  cursors: new Map(),

  setCode: (code) => set({ code }),
  setLanguage: (language) => set({ language }),
  updateCursor: (cursor) =>
    set((state) => {
      const newCursors = new Map(state.cursors)
      newCursors.set(cursor.userId, cursor)
      return { cursors: newCursors }
    }),
  removeCursor: (userId) =>
    set((state) => {
      const newCursors = new Map(state.cursors)
      newCursors.delete(userId)
      return { cursors: newCursors }
    })
}))
