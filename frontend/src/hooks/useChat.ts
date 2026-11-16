'use client'
import { useCallback, useEffect, useRef } from 'react'
import { useChatStore } from '@/store/chatStore'
import { useWebSocket } from './useWebSocket'
import { chatService } from '@/services/chat.service'
import type { Message } from '@/types'

export function useChat(sessionId: string | null) {
  const { messages, addMessage, setMessages, clearMessages } = useChatStore()
  const pendingIdsRef = useRef(new Set<string>())

  const { send } = useWebSocket('/ws/chat', sessionId, (data) => {
    if (data.type === 'chat_message') {
      const msg = data.message
      if (msg && pendingIdsRef.current.has(msg.id)) {
        pendingIdsRef.current.delete(msg.id)
        return
      }
      if (msg) {
        addMessage(msg as Message)
      } else {
        addMessage({
          id: data.message_id || crypto.randomUUID(),
          session_id: sessionId!,
          sender_id: data.user_id,
          content: data.content,
          message_type: 'text',
          created_at: data.created_at || new Date().toISOString(),
        } as Message)
      }
    } else if (data.type === 'user_joined') {
      addMessage({
        id: crypto.randomUUID(),
        session_id: sessionId!,
        sender_id: 'system',
        content: `${data.user_name || data.user_id} joined the session`,
        message_type: 'system',
        created_at: new Date().toISOString()
      } as Message)
    } else if (data.type === 'user_left') {
      addMessage({
        id: crypto.randomUUID(),
        session_id: sessionId!,
        sender_id: 'system',
        content: `${data.user_name || data.user_id} left the session`,
        message_type: 'system',
        created_at: new Date().toISOString()
      } as Message)
    }
  })

  useEffect(() => {
    if (sessionId) {
      chatService.getHistory(sessionId).then(setMessages).catch(console.error)
    }
    return () => clearMessages()
  }, [sessionId])

  const sendMessage = useCallback((content: string) => {
    const msgId = crypto.randomUUID()
    const msg: Message = {
      id: msgId,
      session_id: sessionId!,
      sender_id: 'self',
      content,
      message_type: 'text',
      created_at: new Date().toISOString(),
    }
    addMessage(msg)
    pendingIdsRef.current.add(msgId)
    send({ type: 'chat_message', content })
  }, [send, addMessage, sessionId])

  return { messages, sendMessage }
}
