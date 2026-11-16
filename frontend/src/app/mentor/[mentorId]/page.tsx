'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { toast } from 'sonner'
import { useAuth } from '@/hooks/useAuth'
import { userService } from '@/services/user.service'
import { sessionService } from '@/services/session.service'
import { subscriptionService } from '@/services/subscription.service'
import { ArrowLeft, Star, BookOpen, Send, Calendar, Clock, CheckCircle, UserPlus } from 'lucide-react'

const LANGUAGES = ['Python', 'JavaScript', 'TypeScript', 'Java', 'C++', 'Go', 'Rust']

const statusColors: Record<string, string> = {
  active: 'bg-green-500/10 text-green-400 border-green-500/30',
  completed: 'bg-green-500/10 text-green-400 border-green-500/30',
  scheduled: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30',
  created: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
  cancelled: 'bg-red-500/10 text-red-400 border-red-500/30',
}

export default function MentorProfilePage() {
  const params = useParams()
  const router = useRouter()
  const mentorId = params.mentorId as string
  const { user, isLoading: authLoading, isAuthenticated } = useAuth()

  const [mentor, setMentor] = useState<any>(null)
  const [mentorSessions, setMentorSessions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [subscribed, setSubscribed] = useState(false)
  const [subscribing, setSubscribing] = useState(false)
  const [showRequestForm, setShowRequestForm] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    language: 'Python',
    start_time: '',
  })
  const [requesting, setRequesting] = useState(false)

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.replace('/login')
    }
  }, [authLoading, isAuthenticated, router])

  useEffect(() => {
    if (!mentorId) return
    const fetchData = async () => {
      try {
        const mentorData = await userService.getMentorDetail(mentorId)
        setMentor(mentorData)

        try {
          const sessions = await sessionService.getMySessions()
          const filtered = sessions.filter((s: any) => s.mentor?.id === mentorId)
          setMentorSessions(filtered)
        } catch {
          setMentorSessions([])
        }

        if (isAuthenticated && user) {
          try {
            const subStatus = await subscriptionService.checkSubscription(mentorId)
            setSubscribed(subStatus.subscribed)
          } catch {}
        }
      } catch (err) {
        toast.error('Failed to load mentor profile')
        router.replace('/dashboard')
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [mentorId, router, isAuthenticated, user])

  async function handleSubscribe() {
    setSubscribing(true)
    try {
      await subscriptionService.subscribe(mentorId)
      setSubscribed(true)
      toast.success('Subscribed to mentor!')
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to subscribe'
      toast.error(message)
    } finally {
      setSubscribing(false)
    }
  }

  async function handleUnsubscribe() {
    setSubscribing(true)
    try {
      await subscriptionService.unsubscribe(mentorId)
      setSubscribed(false)
      toast.success('Unsubscribed from mentor')
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to unsubscribe'
      toast.error(message)
    } finally {
      setSubscribing(false)
    }
  }

  async function handleRequestSession() {
    if (!formData.title || !formData.start_time) {
      toast.error('Please fill in title and start time')
      return
    }
    setRequesting(true)
    try {
      await sessionService.request({
        mentor_id: mentorId,
        title: formData.title,
        description: formData.description,
        language: formData.language,
        start_time: new Date(formData.start_time).toISOString(),
      })
      toast.success('Session request sent to mentor!')
      setShowRequestForm(false)
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
        <div className="h-10 w-10 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!isAuthenticated || !user || !mentor) return null

  const profile = mentor.profile || {}
  const expertise = profile.expertise || []
  const upcomingSessions = mentorSessions.filter((s: any) => s.status === 'scheduled' || s.status === 'active')
  const pastSessions = mentorSessions.filter((s: any) => s.status === 'completed' || s.status === 'cancelled')

  return (
    <div className="min-h-screen bg-[#0f0f1a]">
      <header className="h-16 border-b border-[#1e293b] bg-[#1a1a2e] flex items-center px-6">
        <button onClick={() => router.back()} className="text-gray-400 hover:text-white transition-colors mr-4">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="text-lg font-semibold text-white">Mentor Profile</h1>
      </header>

      <div className="max-w-3xl mx-auto px-6 py-8 space-y-6">
        {/* Profile Card */}
        <div className="bg-[#1a1a2e] border border-[#1e293b] rounded-xl p-6">
          <div className="flex items-start gap-5">
            <div className="h-20 w-20 rounded-full bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center text-2xl font-bold text-white flex-shrink-0">
              {mentor.full_name?.charAt(0)?.toUpperCase() || '?'}
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-2xl font-bold text-white">{mentor.full_name}</h2>
              <p className="text-gray-400 text-sm mt-1">{mentor.email}</p>
              <div className="flex items-center gap-4 mt-3">
                <div className="flex items-center gap-1.5">
                  <Star className="h-4 w-4 text-yellow-400" />
                  <span className="text-sm text-gray-300">{profile.rating?.toFixed(1) || '0.0'}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <BookOpen className="h-4 w-4 text-blue-400" />
                  <span className="text-sm text-gray-300">{profile.total_sessions || 0} sessions</span>
                </div>
                {profile.hourly_rate > 0 && (
                  <span className="text-sm text-green-400 font-medium">${profile.hourly_rate}/hr</span>
                )}
              </div>
            </div>
          </div>

          {profile.bio && (
            <div className="mt-5 pt-5 border-t border-[#1e293b]">
              <h3 className="text-sm font-medium text-gray-400 mb-2">About</h3>
              <p className="text-sm text-gray-300 leading-relaxed">{profile.bio}</p>
            </div>
          )}

          {expertise.length > 0 && (
            <div className="mt-5 pt-5 border-t border-[#1e293b]">
              <h3 className="text-sm font-medium text-gray-400 mb-2">Expertise</h3>
              <div className="flex flex-wrap gap-2">
                {expertise.map((skill: string) => (
                  <span key={skill} className="bg-blue-500/10 text-blue-400 text-sm rounded-lg px-3 py-1 border border-blue-500/20">
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Subscribe Button */}
        {user.role === 'student' && (
          <div className="bg-[#1a1a2e] border border-[#1e293b] rounded-xl p-6">
            {subscribed ? (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-6 w-6 text-green-400" />
                  <div>
                    <p className="text-white font-medium">Subscribed to {mentor.full_name}</p>
                    <p className="text-sm text-gray-400">You will receive notifications about their sessions</p>
                  </div>
                </div>
                <button
                  onClick={handleUnsubscribe}
                  disabled={subscribing}
                  className="text-sm text-red-400 hover:text-red-300 bg-red-500/10 hover:bg-red-500/20 rounded-lg px-4 py-2 transition-colors disabled:opacity-50"
                >
                  {subscribing ? 'Processing...' : 'Unsubscribe'}
                </button>
              </div>
            ) : (
              <div className="text-center">
                <p className="text-gray-400 mb-4">Stay updated with {mentor.full_name}&apos;s sessions and availability</p>
                <button
                  onClick={handleSubscribe}
                  disabled={subscribing}
                  className="bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-semibold rounded-lg px-8 py-3 transition-all duration-200 flex items-center gap-2 mx-auto disabled:opacity-50"
                >
                  <UserPlus className="h-5 w-5" />
                  {subscribing ? 'Subscribing...' : 'Subscribe to Mentor'}
                </button>
              </div>
            )}
          </div>
        )}

        {/* Request Session */}
        {user.role === 'student' && subscribed && (
          <div className="bg-[#1a1a2e] border border-[#1e293b] rounded-xl p-6">
            {!showRequestForm ? (
              <div className="text-center">
                <p className="text-gray-400 mb-4">Ready to learn from {mentor.full_name}?</p>
                <button
                  onClick={() => setShowRequestForm(true)}
                  className="bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-400 text-white font-semibold rounded-lg px-8 py-3 transition-all duration-200 flex items-center gap-2 mx-auto"
                >
                  <Send className="h-4 w-4" />
                  Request a Session
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-white">Request Session</h3>
                  <button onClick={() => setShowRequestForm(false)} className="text-gray-400 hover:text-white text-sm">Cancel</button>
                </div>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData(p => ({ ...p, title: e.target.value }))}
                  placeholder="Session title (e.g. Python Basics)"
                  className="w-full bg-[#16213e] border border-[#334155] rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:border-blue-500 outline-none"
                />
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData(p => ({ ...p, description: e.target.value }))}
                  placeholder="What do you want to learn? (optional)"
                  rows={3}
                  className="w-full bg-[#16213e] border border-[#334155] rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:border-blue-500 outline-none resize-none"
                />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1.5">Language</label>
                    <select
                      value={formData.language}
                      onChange={(e) => setFormData(p => ({ ...p, language: e.target.value }))}
                      className="w-full bg-[#16213e] border border-[#334155] rounded-lg px-4 py-3 text-white focus:border-blue-500 outline-none"
                    >
                      {LANGUAGES.map(l => <option key={l} value={l}>{l}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1.5">Start Time</label>
                    <input
                      type="datetime-local"
                      value={formData.start_time}
                      onChange={(e) => setFormData(p => ({ ...p, start_time: e.target.value }))}
                      className="w-full bg-[#16213e] border border-[#334155] rounded-lg px-4 py-3 text-white focus:border-blue-500 outline-none [color-scheme:dark]"
                    />
                  </div>
                </div>
                <button
                  onClick={handleRequestSession}
                  disabled={requesting || !formData.title || !formData.start_time}
                  className="w-full bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-semibold rounded-lg px-6 py-3 transition-all duration-200 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <Send className="h-4 w-4" />
                  {requesting ? 'Sending...' : 'Send Request'}
                </button>
              </div>
            )}
          </div>
        )}

        {/* Upcoming Sessions */}
        {upcomingSessions.length > 0 && (
          <div className="bg-[#1a1a2e] border border-[#1e293b] rounded-xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Calendar className="h-5 w-5 text-blue-400" />
              Upcoming Sessions
            </h3>
            <div className="space-y-3">
              {upcomingSessions.map((session: any) => (
                <div key={session.id} className="bg-[#16213e] rounded-lg p-4 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-white">{session.title}</p>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-xs bg-blue-500/10 text-blue-400 rounded px-2 py-0.5">{session.language}</span>
                      <span className="text-xs text-gray-500 flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {new Date(session.start_time).toLocaleString()}
                      </span>
                    </div>
                  </div>
                  <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${statusColors[session.status] || ''}`}>{session.status}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Past Sessions */}
        {pastSessions.length > 0 && (
          <div className="bg-[#1a1a2e] border border-[#1e293b] rounded-xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Clock className="h-5 w-5 text-gray-400" />
              Past Sessions
            </h3>
            <div className="space-y-3">
              {pastSessions.slice(0, 5).map((session: any) => (
                <div key={session.id} className="bg-[#16213e] rounded-lg p-4 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-white">{session.title}</p>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-xs bg-blue-500/10 text-blue-400 rounded px-2 py-0.5">{session.language}</span>
                      <span className="text-xs text-gray-500">{new Date(session.start_time).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${statusColors[session.status] || ''}`}>{session.status}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {mentorSessions.length === 0 && (
          <div className="bg-[#1a1a2e] border border-[#1e293b] rounded-xl p-6 text-center">
            <p className="text-gray-500 text-sm">No public sessions from this mentor yet.</p>
          </div>
        )}
      </div>
    </div>
  )
}
