export interface Session {
  id: string
  mentor_id: string
  student_id?: string
  title: string
  description?: string
  language: string
  status: 'created' | 'scheduled' | 'active' | 'completed' | 'cancelled'
  start_time: string
  end_time?: string
  room_id: string
  mentor?: User
  student?: User
  created_at: string
}

export interface SessionCreate {
  title: string
  description?: string
  language: string
  start_time: string
  student_id?: string
}
