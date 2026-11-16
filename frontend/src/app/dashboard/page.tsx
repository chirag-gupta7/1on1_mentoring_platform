'use client'

import { useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { toast } from 'sonner'
import { useAuth } from '@/hooks/useAuth'
import { useSessionStore } from '@/store/sessionStore'
import { sessionService } from '@/services/session.service'
import { subscriptionService } from '@/services/subscription.service'
import { userService } from '@/services/user.service'
import { apiClient } from '@/services/api'
import type { Session } from '@/types'

const LANGUAGES = ['Python', 'JavaScript', 'TypeScript', 'Java', 'C++', 'Go', 'Rust']

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

function SessionRequestCard({ session, onApprove, onReschedule, onDelete }: {
  session: any
  onApprove: (id: string) => void
  onReschedule: (id: string, time: string) => void
  onDelete: (id: string) => void
}) {
  const [showReschedule, setShowReschedule] = useState(false)
  const [newTime, setNewTime] = useState('')

  function handleRescheduleSubmit() {
    if (!newTime) return
    onReschedule(session.id, newTime)
    setShowReschedule(false)
    setNewTime('')
  }

  return (
    <div className="bg-[#1a1a2e] border border-yellow-500/20 rounded-xl p-5 space-y-3">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="font-semibold text-white">{session.title}</h3>
          {session.description && <p className="text-sm text-gray-400 mt-1">{session.description}</p>}
        </div>
        <span className="inline-flex items-center rounded-full border border-yellow-500/30 bg-yellow-500/10 text-yellow-400 text-xs font-medium px-2.5 py-0.5">Pending</span>
      </div>
      <div className="flex items-center gap-3 text-sm text-gray-400">
        <LanguageBadge language={session.language} />
        <span>Requested for {new Date(session.start_time).toLocaleString()}</span>
        {session.student && <span className="text-gray-500">by {session.student.full_name}</span>}
      </div>
      <div className="flex gap-2 pt-2">
        <button
          onClick={() => onApprove(session.id)}
          className="bg-green-600 hover:bg-green-500 text-white text-sm font-medium rounded-lg px-4 py-2 transition-colors"
        >
          Approve
        </button>
        <button
          onClick={() => setShowReschedule(!showReschedule)}
          className="bg-blue-600/20 hover:bg-blue-600/40 text-blue-400 text-sm font-medium rounded-lg px-4 py-2 transition-colors"
        >
          Reschedule
        </button>
        <button
          onClick={() => onDelete(session.id)}
          className="bg-red-600/20 hover:bg-red-600/40 text-red-400 text-sm font-medium rounded-lg px-4 py-2 transition-colors"
        >
          Reject
        </button>
      </div>
      {showReschedule && (
        <div className="flex items-center gap-2 pt-2 border-t border-[#1e293b]">
          <input
            type="datetime-local"
            value={newTime}
            onChange={(e) => setNewTime(e.target.value)}
            className="flex-1 bg-[#16213e] border border-[#334155] rounded-lg px-3 py-2 text-sm text-white focus:border-blue-500 outline-none [color-scheme:dark]"
          />
          <button
            onClick={handleRescheduleSubmit}
            disabled={!newTime}
            className="bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-lg px-4 py-2 transition-colors disabled:opacity-50"
          >
            Confirm
          </button>
        </div>
      )}
    </div>
  )
}

function MentorDashboard() {
  const { user } = useAuth()
  const { sessions, fetchSessions, createSession } = useSessionStore()
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [students, setStudents] = useState<any[]>([])
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    language: 'Python',
    start_time: '',
    student_id: '',
  })
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    fetchSessions()
  }, [fetchSessions])

  useEffect(() => {
    subscriptionService.getMyStudents()
      .then(setStudents)
      .catch(() => setStudents([]))
  }, [])

  const activeSessions = sessions.filter((s) => s.status === 'active')
  const pendingRequests = sessions.filter((s) => s.status === 'created')
  const upcomingSessions = sessions.filter((s) => s.status === 'scheduled')
  const recentSessions = sessions.filter((s) => s.status === 'completed' || s.status === 'cancelled')
  const totalSessions = sessions.length
  const studentIds = new Set(sessions.filter((s) => s.student_id).map((s) => s.student_id))

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!formData.title || !formData.start_time) {
      toast.error('Title and start time are required')
      return
    }
    setCreating(true)
    try {
      await createSession({
        title: formData.title,
        description: formData.description,
        language: formData.language,
        start_time: new Date(formData.start_time).toISOString(),
        student_id: formData.student_id || undefined,
      })
      toast.success('Session created')
      setShowCreateForm(false)
      setFormData({ title: '', description: '', language: 'Python', start_time: '', student_id: '' })
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to create session'
      toast.error(message)
    } finally {
      setCreating(false)
    }
  }

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

  async function handleApprove(sessionId: string) {
    try {
      await sessionService.approve(sessionId)
      toast.success('Session approved')
      await fetchSessions()
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to approve'
      toast.error(message)
    }
  }

  async function handleReschedule(sessionId: string, newTime: string) {
    try {
      await sessionService.reschedule(sessionId, { start_time: new Date(newTime).toISOString() })
      toast.success('Session rescheduled')
      await fetchSessions()
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to reschedule'
      toast.error(message)
    }
  }

  return (
    <div className="space-y-8">
      {/* Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-[#1a1a2e] to-[#16213e] border border-[#1e293b] rounded-xl p-6">
          <p className="text-sm text-gray-400 mb-1">Total Sessions</p>
          <p className="text-3xl font-bold text-white">{totalSessions}</p>
        </div>
        <div className="bg-gradient-to-br from-[#1a1a2e] to-[#16213e] border border-[#1e293b] rounded-xl p-6">
          <p className="text-sm text-gray-400 mb-1">Active Now</p>
          <p className="text-3xl font-bold text-green-400">{activeSessions.length}</p>
        </div>
        <div className="bg-gradient-to-br from-[#1a1a2e] to-[#16213e] border border-[#1e293b] rounded-xl p-6">
          <p className="text-sm text-gray-400 mb-1">Students</p>
          <p className="text-3xl font-bold text-white">{studentIds.size}</p>
        </div>
        <div className="bg-gradient-to-br from-[#1a1a2e] to-[#16213e] border border-[#1e293b] rounded-xl p-6">
          <p className="text-sm text-gray-400 mb-1">Rating</p>
          <p className="text-3xl font-bold text-yellow-400">
            <span className="text-yellow-400">&#9733;</span> 4.8
          </p>
        </div>
      </div>

      {/* Create Session */}
      <div>
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-semibold rounded-lg px-6 py-2.5 text-sm transition-all duration-200"
        >
          {showCreateForm ? 'Cancel' : '+ Create New Session'}
        </button>

        {showCreateForm && (
          <div className="mt-4 bg-[#1a1a2e] border border-[#1e293b] rounded-xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Create New Session</h3>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">Title</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData((p) => ({ ...p, title: e.target.value }))}
                  placeholder="Session title"
                  className="w-full bg-[#16213e] border border-[#334155] rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData((p) => ({ ...p, description: e.target.value }))}
                  placeholder="Session description"
                  rows={3}
                  className="w-full bg-[#16213e] border border-[#334155] rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-colors resize-none"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1.5">Language</label>
                  <select
                    value={formData.language}
                    onChange={(e) => setFormData((p) => ({ ...p, language: e.target.value }))}
                    className="w-full bg-[#16213e] border border-[#334155] rounded-lg px-4 py-3 text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-colors"
                  >
                    {LANGUAGES.map((lang) => (
                      <option key={lang} value={lang}>{lang}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1.5">Start Time</label>
                  <input
                    type="datetime-local"
                    value={formData.start_time}
                    onChange={(e) => setFormData((p) => ({ ...p, start_time: e.target.value }))}
                    className="w-full bg-[#16213e] border border-[#334155] rounded-lg px-4 py-3 text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-colors [color-scheme:dark]"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">Assign Student (optional)</label>
                <select
                  value={formData.student_id}
                  onChange={(e) => setFormData((p) => ({ ...p, student_id: e.target.value }))}
                  className="w-full bg-[#16213e] border border-[#334155] rounded-lg px-4 py-3 text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-colors"
                >
                  <option value="">Open session (any student can join)</option>
                  {students.map((s: any) => (
                    <option key={s.id} value={s.id}>{s.full_name} ({s.email})</option>
                  ))}
                </select>
                {students.length === 0 && (
                  <p className="text-xs text-gray-600 mt-1">No subscribed students yet. Students will appear here after subscribing.</p>
                )}
              </div>
              <button
                type="submit"
                disabled={creating}
                className="bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-semibold rounded-lg px-6 py-2.5 text-sm transition-all duration-200 disabled:opacity-50"
              >
                {creating ? 'Creating...' : 'Create Session'}
              </button>
            </form>
          </div>
        )}
      </div>

      {/* Session Requests */}
      {pendingRequests.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
            <span className="bg-yellow-500/20 text-yellow-400 text-sm rounded-full px-2.5 py-0.5">{pendingRequests.length}</span>
            Session Requests
          </h2>
          <div className="space-y-3">
            {pendingRequests.map((session) => (
              <SessionRequestCard
                key={session.id}
                session={session}
                onApprove={handleApprove}
                onReschedule={handleReschedule}
                onDelete={handleDelete}
              />
            ))}
          </div>
        </div>
      )}

      {/* Upcoming Sessions */}
      <div>
        <h2 className="text-xl font-semibold text-white mb-4">Upcoming Sessions</h2>
        {upcomingSessions.length === 0 ? (
          <p className="text-gray-500 text-sm">No upcoming sessions</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {upcomingSessions.map((session) => (
              <div key={session.id} className="bg-[#1a1a2e] border border-[#1e293b] rounded-xl p-5 space-y-3">
                <div className="flex items-start justify-between">
                  <h3 className="font-semibold text-white">{session.title}</h3>
                  <StatusBadge status={session.status} />
                </div>
                <div className="flex items-center gap-2">
                  <LanguageBadge language={session.language} />
                </div>
                <p className="text-sm text-gray-400">
                  {new Date(session.start_time).toLocaleString()}
                </p>
                {session.student && (
                  <p className="text-sm text-gray-300">Student: {session.student.full_name}</p>
                )}
                <div className="flex gap-2 pt-2">
                  {(session.status === 'created' || session.status === 'scheduled') && (
                    <button
                      onClick={() => handleAction(session.id, 'start')}
                      className="bg-green-600 hover:bg-green-500 text-white text-xs font-medium rounded-lg px-3 py-1.5 transition-colors"
                    >
                      Start Session
                    </button>
                  )}
                  {session.status === 'active' && (
                    <>
                      <Link
                        href={`/session/${session.id}`}
                        className="bg-green-600 hover:bg-green-500 text-white text-xs font-medium rounded-lg px-3 py-1.5 transition-colors"
                      >
                        Enter Session
                      </Link>
                      <button
                        onClick={() => handleAction(session.id, 'end')}
                        className="bg-yellow-600 hover:bg-yellow-500 text-white text-xs font-medium rounded-lg px-3 py-1.5 transition-colors"
                      >
                        End Session
                      </button>
                    </>
                  )}
                  <button
                    onClick={() => handleAction(session.id, 'cancel')}
                    className="bg-red-600/20 hover:bg-red-600/40 text-red-400 text-xs font-medium rounded-lg px-3 py-1.5 transition-colors"
                  >
                    Cancel
                  </button>
                  {session.status !== 'active' && (
                    <button
                      onClick={() => handleDelete(session.id)}
                      className="bg-red-600/10 hover:bg-red-600/30 text-red-400 text-xs font-medium rounded-lg px-3 py-1.5 transition-colors"
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

      {/* Recent Sessions */}
      <div>
        <h2 className="text-xl font-semibold text-white mb-4">Recent Sessions</h2>
        {recentSessions.length === 0 ? (
          <p className="text-gray-500 text-sm">No recent sessions</p>
        ) : (
          <div className="space-y-3">
            {recentSessions.slice(0, 5).map((session) => (
              <div key={session.id} className="bg-[#1a1a2e] border border-[#1e293b] rounded-xl p-4 flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-white">{session.title}</h4>
                  <div className="flex items-center gap-3 mt-1">
                    <LanguageBadge language={session.language} />
                    <span className="text-xs text-gray-400">{new Date(session.start_time).toLocaleDateString()}</span>
                  </div>
                </div>
                <StatusBadge status={session.status} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function StudentDashboard() {
  const { user } = useAuth()
  const { sessions, fetchSessions, joinSession } = useSessionStore()
  const [searchQuery, setSearchQuery] = useState('')
  const [mentors, setMentors] = useState<any[]>([])
  const [searching, setSearching] = useState(false)

  useEffect(() => {
    fetchSessions()
  }, [fetchSessions])

  useEffect(() => {
    if (!searchQuery.trim()) {
      setMentors([])
      return
    }
    const timer = setTimeout(async () => {
      setSearching(true)
      try {
        const results = await userService.searchMentors(searchQuery)
        setMentors(results)
      } catch {
        setMentors([])
      } finally {
        setSearching(false)
      }
    }, 300)
    return () => clearTimeout(timer)
  }, [searchQuery])

  const upcomingSessions = sessions.filter((s) => s.status === 'scheduled' || s.status === 'active')
  const pastSessions = sessions.filter((s) => s.status === 'completed' || s.status === 'cancelled')

  async function handleJoin(sessionId: string) {
    try {
      await joinSession(sessionId)
      toast.success('Joined session')
      await fetchSessions()
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to join'
      toast.error(message)
    }
  }

  return (
    <div className="space-y-8">
      {/* Find a Mentor */}
      <div>
        <h2 className="text-xl font-semibold text-white mb-4">Find a Mentor</h2>
        <div className="bg-[#1a1a2e] border border-[#1e293b] rounded-xl p-6">
          <div className="relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, language, or expertise..."
              className="w-full bg-[#16213e] border border-[#334155] rounded-lg pl-10 pr-4 py-3 text-white placeholder-gray-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-colors"
            />
          </div>
          {searching && <p className="text-sm text-gray-500 mt-2">Searching...</p>}
          {mentors.length > 0 && (
            <div className="mt-4 space-y-2">
              {mentors.map((mentor: any) => (
                <Link
                  key={mentor.id}
                  href={`/mentor/${mentor.id}`}
                  className="bg-[#16213e] rounded-lg p-3 flex items-center justify-between hover:bg-[#1e293b] transition-colors cursor-pointer block"
                >
                  <div>
                    <p className="text-sm font-medium text-white">{mentor.full_name}</p>
                    <p className="text-xs text-gray-500">{mentor.email}</p>
                    {mentor.expertise && (
                      <div className="flex gap-1 mt-1">
                        {(Array.isArray(mentor.expertise) ? mentor.expertise : []).map((s: string) => (
                          <span key={s} className="bg-blue-500/10 text-blue-400 text-xs rounded px-1.5 py-0.5">{s}</span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    {mentor.rating > 0 && <span className="text-yellow-400 text-sm">{mentor.rating.toFixed(1)}</span>}
                    <span className="text-xs text-blue-400">View Profile</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
          <p className="text-sm text-gray-500 mt-4">Browse available mentors and find your perfect match.</p>
        </div>
      </div>

      {/* Upcoming Sessions */}
      <div>
        <h2 className="text-xl font-semibold text-white mb-4">Upcoming Sessions</h2>
        {upcomingSessions.length === 0 ? (
          <p className="text-gray-500 text-sm">No upcoming sessions</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {upcomingSessions.map((session) => (
              <div key={session.id} className="bg-[#1a1a2e] border border-[#1e293b] rounded-xl p-5 space-y-3">
                <div className="flex items-start justify-between">
                  <h3 className="font-semibold text-white">{session.title}</h3>
                  <StatusBadge status={session.status} />
                </div>
                {session.mentor && (
                  <p className="text-sm text-gray-300">Mentor: {session.mentor.full_name}</p>
                )}
                <div className="flex items-center gap-2">
                  <LanguageBadge language={session.language} />
                </div>
                <p className="text-sm text-gray-400">
                  {new Date(session.start_time).toLocaleString()}
                </p>
                {session.status === 'scheduled' && (
                  <button
                    onClick={() => handleJoin(session.id)}
                    className="bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-medium rounded-lg px-4 py-2 text-sm transition-all duration-200"
                  >
                    Join Session
                  </button>
                )}
                {session.status === 'active' && (
                  <Link
                    href={`/session/${session.id}`}
                    className="inline-block bg-green-600 hover:bg-green-500 text-white font-medium rounded-lg px-4 py-2 text-sm transition-colors"
                  >
                    Enter Session
                  </Link>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Past Sessions */}
      <div>
        <h2 className="text-xl font-semibold text-white mb-4">Past Sessions</h2>
        {pastSessions.length === 0 ? (
          <p className="text-gray-500 text-sm">No past sessions</p>
        ) : (
          <div className="space-y-3">
            {pastSessions.slice(0, 5).map((session) => (
              <div key={session.id} className="bg-[#1a1a2e] border border-[#1e293b] rounded-xl p-4 flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-white">{session.title}</h4>
                  <div className="flex items-center gap-3 mt-1">
                    {session.mentor && <span className="text-xs text-gray-400">{session.mentor.full_name}</span>}
                    <LanguageBadge language={session.language} />
                    <span className="text-xs text-gray-400">{new Date(session.start_time).toLocaleDateString()}</span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {session.status === 'completed' && (
                    <span className="text-xs text-yellow-400">Leave Feedback</span>
                  )}
                  <StatusBadge status={session.status} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
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

export default function DashboardPage() {
  const router = useRouter()
  const pathname = usePathname()
  const { user, isAuthenticated, isLoading, logout } = useAuth()

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace('/login')
    }
  }, [isLoading, isAuthenticated, router])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0f0f1a] flex items-center justify-center">
        <div className="h-8 w-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!isAuthenticated || !user) return null

  const navLinks = [
    { href: '/dashboard', label: 'Dashboard', icon: icons.dashboard },
    {
      href: user.role === 'mentor' ? '/mentor/sessions' : '/student/sessions',
      label: 'Sessions',
      icon: icons.sessions,
    },
    ...(user.role === 'student' ? [{ href: '/student/mentors', label: 'My Mentors', icon: icons.sessions }] : []),
    { href: '/notifications', label: 'Notifications', icon: icons.sessions },
    { href: '/profile', label: 'Profile', icon: icons.profile },
  ]

  if (user.role === 'mentor') {
    navLinks.push({ href: '/mentor/students', label: 'My Students', icon: icons.students })
  }

  function isActive(href: string) {
    if (href === '/dashboard') return pathname === '/dashboard'
    return pathname.startsWith(href)
  }

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
                isActive(link.href)
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
          <h1 className="text-lg font-semibold text-white">Dashboard</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-300">{user.full_name}</span>
            <span
              className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium capitalize ${
                user.role === 'mentor'
                  ? 'bg-purple-500/10 text-purple-400 border-purple-500/30'
                  : 'bg-blue-500/10 text-blue-400 border-blue-500/30'
              }`}
            >
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
          {user.role === 'mentor' ? <MentorDashboard /> : <StudentDashboard />}
        </div>
      </div>
    </div>
  )
}
