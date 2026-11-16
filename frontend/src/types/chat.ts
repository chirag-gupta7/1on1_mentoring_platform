import type { User } from './user'

export interface Message {
  id: string
  session_id: string
  sender_id: string
  content: string
  message_type: 'text' | 'code' | 'system'
  sender?: User
  created_at: string
}

export type WSMessageType = 'chat_message' | 'join_room' | 'leave_room' | 'user_joined' | 'user_left' | 'editor_update' | 'cursor_move' | 'language_change' | 'offer' | 'answer' | 'candidate' | 'error'

export interface WSMessage {
  type: WSMessageType
  payload?: any
}
