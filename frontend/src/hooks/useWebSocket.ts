'use client'
import { useEffect, useCallback, useRef } from 'react'
import { wsService } from '@/services/websocket.service'

export function useWebSocket(path: string, sessionId: string | null, onMessage: (data: any) => void) {
  const onMessageRef = useRef(onMessage)
  onMessageRef.current = onMessage

  useEffect(() => {
    if (!sessionId) return
    
    const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null
    if (!token) return

    const ws = wsService.connect(path, sessionId, token)
    const unsub = wsService.on(path, sessionId, (data) => onMessageRef.current(data))

    return () => {
      unsub()
      wsService.disconnect(path, sessionId)
    }
  }, [path, sessionId])

  const send = useCallback((data: any) => {
    if (sessionId) wsService.send(path, sessionId, data)
  }, [path, sessionId])

  return { send }
}
