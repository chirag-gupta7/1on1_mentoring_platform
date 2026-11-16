'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/hooks/useAuth'
import { subscriptionService } from '@/services/subscription.service'
import { Users, Mail } from 'lucide-react'

const navIcon = (d: string) => (
  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d={d} />
  </svg>
)

const icons = {
  dashboard: navIcon('M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0a1 1 0 01-1-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 01-1 1h-2zm-4 0H6'),
  sessions: navIcon('M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z'),
  profile: navIcon('M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z'),
  notifications: navIcon('M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9'),
  students: navIcon('M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z'),
}

export default function MentorStudentsPage() {
  const router = useRouter()
  const { user, isAuthenticated, isLoading: authLoading, logout } = useAuth()
  const [students, setStudents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.replace('/login')
    }
  }, [authLoading, isAuthenticated, router])

  useEffect(() => {
    if (isAuthenticated && user?.role === 'mentor') {
      subscriptionService.getMyStudents()
        .then(setStudents)
        .catch(() => setStudents([]))
        .finally(() => setLoading(false))
    }
  }, [isAuthenticated, user])

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-[#0f0f1a] flex items-center justify-center">
        <div className="h-8 w-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!isAuthenticated || !user) return null
  if (user.role !== 'mentor') return null

  const navLinks = [
    { href: '/dashboard', label: 'Dashboard', icon: icons.dashboard },
    { href: '/mentor/sessions', label: 'Sessions', icon: icons.sessions },
    { href: '/notifications', label: 'Notifications', icon: icons.notifications },
    { href: '/profile', label: 'Profile', icon: icons.profile },
    { href: '/mentor/students', label: 'My Students', icon: icons.students },
  ]

  return (
    <div className="flex min-h-screen bg-[#0f0f1a]">
      <aside className="w-64 min-h-screen bg-[#1a1a2e] border-r border-[#1e293b] flex flex-col flex-shrink-0">
        <div className="p-6">
          <Link href="/dashboard" className="text-xl font-bold bg-gradient-to-r from-blue-500 to-cyan-400 bg-clip-text text-transparent">
            MentorHub
          </Link>
        </div>
        <nav className="flex-1 px-3 space-y-1">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`flex items-center gap-3 rounded-lg px-4 py-2.5 text-sm transition-colors ${
                link.href === '/mentor/students' ? 'text-white bg-[#16213e]' : 'text-gray-400 hover:text-white hover:bg-[#16213e]'
              }`}
            >
              {link.icon}
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="p-4 border-t border-[#1e293b]">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-full bg-[#16213e] border border-[#334155] flex items-center justify-center text-sm font-medium text-blue-400">
              {user.full_name?.charAt(0)?.toUpperCase() || '?'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{user.full_name}</p>
              <p className="text-xs text-gray-500 truncate">{user.email}</p>
            </div>
          </div>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 border-b border-[#1e293b] bg-[#1a1a2e] flex items-center justify-between px-6">
          <h1 className="text-lg font-semibold text-white">My Students</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-300">{user.full_name}</span>
            <button
              onClick={() => { logout(); router.push('/login') }}
              className="text-sm text-gray-400 hover:text-white bg-[#16213e] hover:bg-[#1e293b] rounded-lg px-4 py-2 transition-colors"
            >
              Logout
            </button>
          </div>
        </header>

        <div className="p-6 flex-1 overflow-y-auto">
          {students.length === 0 ? (
            <div className="text-center py-20">
              <Users className="h-12 w-12 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-500">No students have subscribed to you yet</p>
              <p className="text-sm text-gray-600 mt-2">Students will appear here after they subscribe to your mentorship</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <Users className="h-5 w-5 text-blue-400" />
                <span className="text-sm text-gray-400">{students.length} student{students.length !== 1 ? 's' : ''} subscribed</span>
              </div>
              {students.map((student: any) => (
                <div key={student.id} className="bg-[#1a1a2e] border border-[#1e293b] rounded-xl p-5 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center text-lg font-bold text-white">
                      {student.full_name?.charAt(0)?.toUpperCase() || '?'}
                    </div>
                    <div>
                      <p className="font-medium text-white">{student.full_name}</p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <Mail className="h-3.5 w-3.5 text-gray-500" />
                        <p className="text-sm text-gray-400">{student.email}</p>
                      </div>
                      {student.subscribed_at && (
                        <p className="text-xs text-gray-600 mt-1">
                          Subscribed {new Date(student.subscribed_at).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
