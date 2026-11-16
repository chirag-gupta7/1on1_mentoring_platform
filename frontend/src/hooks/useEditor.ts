'use client'
import { useCallback, useRef } from 'react'
import { useEditorStore } from '@/store/editorStore'
import { useWebSocket } from './useWebSocket'

export function useEditor(sessionId: string | null) {
  const { code, language, setCode, setLanguage, cursors, updateCursor, removeCursor } = useEditorStore()
  const { send } = useWebSocket('/ws/editor', sessionId, (data) => {
    switch (data.type) {
      case 'editor_update':
        setCode(data.code)
        break
      case 'cursor_move':
        updateCursor(data)
        break
      case 'language_change':
        setLanguage(data.language)
        break
    }
  })

  const handleCodeChange = useCallback((newCode: string | undefined) => {
    if (newCode !== undefined) {
      setCode(newCode)
      send({ type: 'editor_update', code: newCode, language })
    }
  }, [send, language, setCode])

  const handleCursorMove = useCallback((line: number, column: number, userName: string, userId: string) => {
    send({ type: 'cursor_move', userId, userName, line, column })
  }, [send])

  const handleLanguageChange = useCallback((newLang: string) => {
    setLanguage(newLang)
    send({ type: 'language_change', language: newLang })
  }, [send, setLanguage])

  return { code, language, cursors, handleCodeChange, handleCursorMove, handleLanguageChange }
}
