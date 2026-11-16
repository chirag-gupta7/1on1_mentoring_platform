export interface SignalingMessage {
  type: 'offer' | 'answer' | 'candidate'
  sdp?: string
  candidate?: RTCIceCandidateInit
}

export interface EditorUpdate {
  type: 'editor_update'
  delta: any
  language: string
}

export interface CursorPosition {
  type: 'cursor_move'
  userId: string
  userName: string
  line: number
  column: number
}
