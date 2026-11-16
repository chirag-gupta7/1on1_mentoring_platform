'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { toast } from 'sonner'
import { useAuth } from '@/hooks/useAuth'
import { useSessionStore } from '@/store/sessionStore'
import { sessionService } from '@/services/session.service'
import { apiClient } from '@/services/api'
import type { Session } from '@/types'

const FILTERS = ['All', 'Upcoming', 'Active', 'Completed'] as const
type Filter = (typeof FILTERS)[number]

const statusColors: Record<string, string> = {
  active: 'bg-green-500/10 text-green-400 border-green-500/30',
  completed: 'bg-green-500/10 text-green-400 border-green-500/30',
  scheduled: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30',
  created: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
  cancelled: 'bg-red-500/10 text-red-400 border-red-500/30',
}

function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${statusColors[status] || statusColors.created}`}>
      {status}
    </span>
  )
}

function LanguageBadge({ language }: { language: string }) {
  return (
    <span className="inline-flex items-center rounded bg-blue-500/10 px-2 py-0.5 text-xs text-blue-400">
      {language}
    </span>
  )
}

const navIcon = (d: string) => (
  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d={d} />
  </svg>
)

const icons = {
  dashboard: navIcon('M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0a1 1 0 01-1-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 01-1 1h-2zm-4 0H6'),
  sessions: navIcon('M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z'),
  profile: navIcon('M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z'),
  students: navIcon('M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z'),
}

export default function MentorSessionsPage() {
  const router = useRouter()
  const { user, isAuthenticated, isLoading: authLoading, logout } = useAuth()
  const { sessions, fetchSessions, isLoading } = useSessionStore()
  const [filter, setFilter] = useState<Filter>('All')

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.replace('/login')
      return
    }
    if (!authLoading && isAuthenticated && user?.role !== 'mentor') {
      router.replace('/dashboard')
      return
    }
  }, [authLoading, isAuthenticated, user, router])

  useEffect(() => {
    if (isAuthenticated && user?.role === 'mentor') {
      fetchSessions()
    }
  }, [isAuthenticated, user, fetchSessions])

  async function handleAction(sessionId: string, action: 'start' | 'end' | 'cancel') {
    try {
      if (action === 'start') {
        await apiClient(`/sessions/${sessionId}`, { method: 'PUT', body: { status: 'active' } })
        toast.success('Session started')
      } else if (action === 'end') {
        await sessionService.end(sessionId)
        toast.success('Session ended')
      } else if (action === 'cancel') {
        await sessionService.cancel(sessionId)
        toast.success('Session cancelled')
      }
      await fetchSessions()
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Action failed'
      toast.error(message)
    }
  }

  async function handleDelete(sessionId: string) {
    try {
      await sessionService.delete(sessionId)
      toast.success('Session deleted')
      await fetchSessions()
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Delete failed'
      toast.error(message)
    }
  }

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#0f0f1a] flex items-center justify-center">
        <div className="h-8 w-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!isAuthenticated || !user) return null
  if (user.role !== 'mentor') return null

  const filteredSessions = sessions.filter((s) => {
    if (filter === 'All') return true
    if (filter === 'Upcoming') return s.status === 'created' || s.status === 'scheduled'
    if (filter === 'Active') return s.status === 'active'
    if (filter === 'Completed') return s.status === 'completed' || s.status === 'cancelled'
    return true
  })

  const navLinks = [
    { href: '/dashboard', label: 'Dashboard', icon: icons.dashboard },
    { href: '/mentor/sessions', label: 'Sessions', icon: icons.sessions },
    { href: '/notifications', label: 'Notifications', icon: icons.sessions },
    { href: '/profile', label: 'Profile', icon: icons.profile },
    { href: '/mentor/students', label: 'My Students', icon: icons.students },
  ]

  return (
    <div className="flex min-h-screen bg-[#0f0f1a]">
      {/* Sidebar */}
      <aside className="w-64 min-h-screen bg-[#1a1a2e] border-r border-[#1e293b] flex flex-col flex-shrink-0">
        <div className="p-6">
          <Link
            href="/dashboard"
            className="text-xl font-bold bg-gradient-to-r from-blue-500 to-cyan-400 bg-clip-text text-transparent"
          >
            MentorHub
          </Link>
        </div>
        <nav className="flex-1 px-3 space-y-1">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`flex items-center gap-3 rounded-lg px-4 py-2.5 text-sm transition-colors ${
                link.href === '/mentor/sessions'
                  ? 'text-white bg-[#16213e]'
                  : 'text-gray-400 hover:text-white hover:bg-[#16213e]'
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
              {user.full_name.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{user.full_name}</p>
              <p className="text-xs text-gray-500 truncate">{user.email}</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Bar */}
        <header className="h-16 border-b border-[#1e293b] bg-[#1a1a2e] flex items-center justify-between px-6 flex-shrink-0">
          <h1 className="text-lg font-semibold text-white">My Sessions</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-300">{user.full_name}</span>
            <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium capitalize bg-purple-500/10 text-purple-400 border-purple-500/30">
              {user.role}
            </span>
            <button
              onClick={() => {
                logout()
                router.push('/login')
              }}
              className="text-sm text-gray-400 hover:text-white bg-[#16213e] hover:bg-[#1e293b] rounded-lg px-4 py-2 transition-colors"
            >
              Logout
            </button>
          </div>
        </header>

        {/* Content */}
        <div className="p-6 flex-1 overflow-y-auto">
          {/* Filters */}
          <div className="flex gap-2 mb-6">
            {FILTERS.map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                  filter === f
                    ? 'bg-blue-600 text-white'
                    : 'bg-[#16213e] text-gray-400 hover:text-white hover:bg-[#1e293b]'
                }`}
              >
                {f}
              </button>
            ))}
          </div>

          {/* Sessions List */}
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <div className="h-8 w-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : filteredSessions.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-gray-500">No sessions found</p>
              <Link
                href="/dashboard"
                className="text-blue-400 hover:text-blue-300 text-sm mt-2 inline-block transition-colors"
              >
                Create a new session
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredSessions.map((session) => (
                <div
                  key={session.id}
                  className="bg-[#1a1a2e] border border-[#1e293b] rounded-xl p-6 space-y-4"
                >
                  <div className="flex items-start justify-between flex-wrap gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-3">
                        <h3 className="text-lg font-semibold text-white">{session.title}</h3>
                        <StatusBadge status={session.status} />
                      </div>
                      <div className="flex flex-wrap items-center gap-3 text-sm text-gray-400">
                        <LanguageBadge language={session.language} />
                        <span>Start: {new Date(session.start_time).toLocaleString()}</span>
                        {session.end_time && (
                          <span>End: {new Date(session.end_time).toLocaleString()}</span>
                        )}
                      </div>
                      {session.description && (
                        <p className="text-sm text-gray-500 max-w-2xl">{session.description}</p>
                      )}
                    </div>
                  </div>

                  {session.student && (
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-gray-500">Student:</span>
                      <span className="text-gray-300">{session.student.full_name}</span>
                      <span className="text-gray-600">({session.student.email})</span>
                    </div>
                  )}

                  <div className="flex flex-wrap gap-2 pt-2 border-t border-[#1e293b]">
                    {(session.status === 'created' || session.status === 'scheduled') && (
                      <button
                        onClick={() => handleAction(session.id, 'start')}
                        className="bg-green-600 hover:bg-green-500 text-white text-sm font-medium rounded-lg px-4 py-2 transition-colors"
                      >
                        Start Session
                      </button>
                    )}
                    {session.status === 'active' && (
                      <>
                        <Link
                          href={`/session/${session.id}`}
                          className="bg-green-600 hover:bg-green-500 text-white text-sm font-medium rounded-lg px-4 py-2 transition-colors"
                        >
                          Enter Session
                        </Link>
                        <button
                          onClick={() => handleAction(session.id, 'end')}
                          className="bg-yellow-600 hover:bg-yellow-500 text-white text-sm font-medium rounded-lg px-4 py-2 transition-colors"
                        >
                          End Session
                        </button>
                      </>
                    )}
                    {session.status !== 'completed' && session.status !== 'cancelled' && (
                      <button
                        onClick={() => handleAction(session.id, 'cancel')}
                        className="bg-red-600/20 hover:bg-red-600/40 text-red-400 text-sm font-medium rounded-lg px-4 py-2 transition-colors"
                      >
                        Cancel
                      </button>
                    )}
                    <Link
                      href={`/session/${session.id}`}
                      className="bg-[#16213e] hover:bg-[#1e293b] text-gray-300 text-sm font-medium rounded-lg px-4 py-2 transition-colors"
                    >
                      View Details
                    </Link>
                    {session.status !== 'active' && (
                      <button
                        onClick={() => handleDelete(session.id)}
                        className="bg-red-600/10 hover:bg-red-600/30 text-red-400 text-sm font-medium rounded-lg px-4 py-2 transition-colors"
                      >
                        Delete
                      </button>
                    )}
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
