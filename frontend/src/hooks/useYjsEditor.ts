'use client'
import { useEffect, useRef, useCallback, useState } from 'react'
import * as Y from 'yjs'
import { WebsocketProvider } from 'y-websocket'
import { MonacoBinding } from 'y-monaco'
import type { editor } from 'monaco-editor'

const CURSOR_COLORS = [
  '#fbbf24', '#34d399', '#60a5fa', '#f472b6', '#a78bfa', '#fb923c', '#2dd4bf', '#f87171',
]

interface CursorInfo {
  userId: string
  userName: string
  line: number
  column: number
}

export type YjsStatus = 'connecting' | 'connected' | 'disconnected' | 'error'

export function useYjsEditor(sessionId: string | null) {
  const docRef = useRef<Y.Doc | null>(null)
  const providerRef = useRef<WebsocketProvider | null>(null)
  const bindingRef = useRef<MonacoBinding | null>(null)
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null)
  const typeRef = useRef<Y.Text | null>(null)
  const languageRef = useRef<string>('JavaScript')
  const cursorsRef = useRef<Map<string, CursorInfo>>(new Map())
  const onCursorsChangeRef = useRef<((cursors: Map<string, CursorInfo>) => void) | null>(null)
  const [status, setStatus] = useState<YjsStatus>('disconnected')
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  useEffect(() => {
    if (!sessionId) {
      setStatus('disconnected')
      return
    }

    const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null
    if (!token) {
      setStatus('error')
      setErrorMsg('Not authenticated')
      return
    }

    const baseWsUrl = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8000'

    const doc = new Y.Doc()
    docRef.current = doc
    setStatus('connecting')
    setErrorMsg(null)

    const provider = new WebsocketProvider(
      `${baseWsUrl}/ws/yjs`,
      sessionId,
      doc,
      { params: { token } },
    )
    providerRef.current = provider

    provider.on('status', (event: { status: string }) => {
      if (event.status === 'connected') {
        setStatus('connected')
        setErrorMsg(null)
      } else if (event.status === 'disconnected') {
        setStatus('disconnected')
      }
    })

    provider.on('connection-error', (event: any) => {
      setStatus('error')
      setErrorMsg(event?.message || 'Connection failed')
    })

    const type = doc.getText('monaco')
    typeRef.current = type

    provider.awareness.on('change', () => {
      const states = provider.awareness.getStates()
      const newCursors = new Map<string, CursorInfo>()
      states.forEach((state, clientId) => {
        if (state.cursor && state.user) {
          newCursors.set(String(clientId), {
            userId: String(clientId),
            userName: state.user.name || 'Anonymous',
            line: state.cursor.line || 0,
            column: state.cursor.column || 0,
          })
        }
      })
      cursorsRef.current = newCursors
      onCursorsChangeRef.current?.(newCursors)
    })

    return () => {
      bindingRef.current?.destroy()
      provider.disconnect()
      doc.destroy()
      setStatus('disconnected')
    }
  }, [sessionId])

  const bindEditor = useCallback((
    monacoEditor: editor.IStandaloneCodeEditor,
    monaco: any,
    userName: string,
  ) => {
    editorRef.current = monacoEditor
    const doc = docRef.current
    const type = typeRef.current
    const provider = providerRef.current
    if (!doc || !type || !provider) return

    provider.awareness.setLocalStateField('user', {
      name: userName,
      color: CURSOR_COLORS[Math.floor(Math.random() * CURSOR_COLORS.length)],
    })

    monacoEditor.onDidChangeCursorPosition((e: any) => {
      provider.awareness.setLocalStateField('cursor', {
        line: e.position.lineNumber,
        column: e.position.column,
      })
    })

    bindingRef.current?.destroy()
    const binding = new MonacoBinding(
      type,
      monacoEditor.getModel()!,
      new Set([monacoEditor]),
      provider.awareness,
    )
    bindingRef.current = binding
  }, [])

  const retry = useCallback(() => {
    const provider = providerRef.current
    if (provider) {
      provider.connect()
    }
  }, [])

  const setLanguage = useCallback((lang: string) => {
    languageRef.current = lang
  }, [])

  const getCursorDecorations = useCallback((): CursorInfo[] => {
    return Array.from(cursorsRef.current.values())
  }, [])

  return { bindEditor, setLanguage, getCursorDecorations, status, errorMsg, retry }
}
