'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { toast } from 'sonner'
import { useAuth } from '@/hooks/useAuth'
import { subscriptionService } from '@/services/subscription.service'
import { sessionService } from '@/services/session.service'
import { ArrowLeft, Star, Mail, Send, Calendar } from 'lucide-react'

const LANGUAGES = ['Python', 'JavaScript', 'TypeScript', 'Java', 'C++', 'Go', 'Rust']

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
  mentors: navIcon('M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z'),
}

export default function StudentMentorsPage() {
  const router = useRouter()
  const { user, isAuthenticated, isLoading: authLoading, logout } = useAuth()
  const [mentors, setMentors] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [requestingMentor, setRequestingMentor] = useState<any>(null)
  const [formData, setFormData] = useState({ title: '', description: '', language: 'Python', start_time: '' })
  const [requesting, setRequesting] = useState(false)

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.replace('/login')
    }
  }, [authLoading, isAuthenticated, router])

  useEffect(() => {
    if (isAuthenticated && user?.role === 'student') {
      subscriptionService.getMyMentors()
        .then(setMentors)
        .catch(() => setMentors([]))
        .finally(() => setLoading(false))
    }
  }, [isAuthenticated, user])

  async function handleRequestSession() {
    if (!requestingMentor || !formData.title || !formData.start_time) {
      toast.error('Please fill in title and start time')
      return
    }
    setRequesting(true)
    try {
      await sessionService.request({
        mentor_id: requestingMentor.id,
        title: formData.title,
        description: formData.description,
        language: formData.language,
        start_time: new Date(formData.start_time).toISOString(),
      })
      toast.success('Session request sent!')
      setRequestingMentor(null)
      setFormData({ title: '', description: '', language: 'Python', start_time: '' })
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to send request'
      toast.error(message)
    } finally {
      setRequesting(false)
    }
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-[#0f0f1a] flex items-center justify-center">
        <div className="h-8 w-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!isAuthenticated || !user) return null
  if (user.role !== 'student') return null

  const navLinks = [
    { href: '/dashboard', label: 'Dashboard', icon: icons.dashboard },
    { href: '/student/sessions', label: 'Sessions', icon: icons.sessions },
    { href: '/student/mentors', label: 'My Mentors', icon: icons.mentors },
    { href: '/notifications', label: 'Notifications', icon: icons.notifications },
    { href: '/profile', label: 'Profile', icon: icons.profile },
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
                link.href === '/student/mentors' ? 'text-white bg-[#16213e]' : 'text-gray-400 hover:text-white hover:bg-[#16213e]'
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
          <h1 className="text-lg font-semibold text-white">My Mentors</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-300">{user.full_name}</span>
            <button onClick={() => { logout(); router.push('/login') }} className="text-sm text-gray-400 hover:text-white bg-[#16213e] hover:bg-[#1e293b] rounded-lg px-4 py-2 transition-colors">
              Logout
            </button>
          </div>
        </header>

        <div className="p-6 flex-1 overflow-y-auto">
          {mentors.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-gray-500 mb-4">You haven't subscribed to any mentors yet</p>
              <Link href="/dashboard" className="text-blue-400 hover:text-blue-300 text-sm">
                Find mentors on your dashboard
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {mentors.map((mentor: any) => (
                <div key={mentor.id} className="bg-[#1a1a2e] border border-[#1e293b] rounded-xl p-5">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-4">
                      <div className="h-14 w-14 rounded-full bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center text-xl font-bold text-white">
                        {mentor.full_name?.charAt(0)?.toUpperCase() || '?'}
                      </div>
                      <div>
                        <Link href={`/mentor/${mentor.id}`} className="font-semibold text-white hover:text-blue-400 transition-colors">
                          {mentor.full_name}
                        </Link>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <Mail className="h-3.5 w-3.5 text-gray-500" />
                          <p className="text-sm text-gray-400">{mentor.email}</p>
                        </div>
                        {mentor.subscribed_at && (
                          <p className="text-xs text-gray-600 mt-1">Subscribed {new Date(mentor.subscribed_at).toLocaleDateString()}</p>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => setRequestingMentor(requestingMentor?.id === mentor.id ? null : mentor)}
                      className={`text-sm font-medium rounded-lg px-4 py-2 transition-colors ${
                        requestingMentor?.id === mentor.id
                          ? 'bg-red-600/20 text-red-400 hover:bg-red-600/40'
                          : 'bg-blue-600 hover:bg-blue-500 text-white'
                      }`}
                    >
                      {requestingMentor?.id === mentor.id ? 'Cancel' : 'Request Session'}
                    </button>
                  </div>

                  {requestingMentor?.id === mentor.id && (
                    <div className="mt-4 pt-4 border-t border-[#1e293b] space-y-3">
                      <input
                        type="text"
                        value={formData.title}
                        onChange={(e) => setFormData(p => ({ ...p, title: e.target.value }))}
                        placeholder="Session title (e.g. Python Basics)"
                        className="w-full bg-[#16213e] border border-[#334155] rounded-lg px-4 py-3 text-sm text-white placeholder-gray-500 focus:border-blue-500 outline-none"
                      />
                      <textarea
                        value={formData.description}
                        onChange={(e) => setFormData(p => ({ ...p, description: e.target.value }))}
                        placeholder="What do you want to learn? (optional)"
                        rows={2}
                        className="w-full bg-[#16213e] border border-[#334155] rounded-lg px-4 py-3 text-sm text-white placeholder-gray-500 focus:border-blue-500 outline-none resize-none"
                      />
                      <div className="grid grid-cols-2 gap-3">
                        <select
                          value={formData.language}
                          onChange={(e) => setFormData(p => ({ ...p, language: e.target.value }))}
                          className="bg-[#16213e] border border-[#334155] rounded-lg px-3 py-2.5 text-sm text-white focus:border-blue-500 outline-none"
                        >
                          {LANGUAGES.map(l => <option key={l} value={l}>{l}</option>)}
                        </select>
                        <input
                          type="datetime-local"
                          value={formData.start_time}
                          onChange={(e) => setFormData(p => ({ ...p, start_time: e.target.value }))}
                          className="bg-[#16213e] border border-[#334155] rounded-lg px-3 py-2.5 text-sm text-white focus:border-blue-500 outline-none [color-scheme:dark]"
                        />
                      </div>
                      <button
                        onClick={handleRequestSession}
                        disabled={requesting || !formData.title || !formData.start_time}
                        className="w-full bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-semibold rounded-lg px-4 py-2.5 text-sm transition-all duration-200 disabled:opacity-50 flex items-center justify-center gap-2"
                      >
                        <Send className="h-4 w-4" />
                        {requesting ? 'Sending...' : 'Send Request'}
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
