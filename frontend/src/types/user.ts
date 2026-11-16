export interface User {
  id: string
  email: string
  full_name: string
  role: 'student' | 'mentor' | 'admin'
  avatar_url?: string
  is_verified: boolean
  created_at: string
  updated_at: string
}

export interface MentorProfile {
  id: string
  user_id: string
  bio?: string
  expertise: string[]
  hourly_rate: number
  rating: number
  total_sessions: number
  user?: User
}

export interface StudentProfile {
  id: string
  user_id: string
  education?: string
  goals?: string
  learning_preferences?: Record<string, any>
}
