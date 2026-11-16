'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { toast } from 'sonner'
import { useAuth } from '@/hooks/useAuth'
import { userService } from '@/services/user.service'

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

export default function ProfilePage() {
  const router = useRouter()
  const { user, isAuthenticated, isLoading: authLoading, logout, setUser } = useAuth()
  const [isEditing, setIsEditing] = useState(false)
  const [profileLoading, setProfileLoading] = useState(false)
  const [profileData, setProfileData] = useState<Record<string, any>>({})
  const [formData, setFormData] = useState({
    full_name: '',
    bio: '',
    expertise: '',
    hourly_rate: '',
    education: '',
    goals: '',
  })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.replace('/login')
    }
  }, [authLoading, isAuthenticated, router])

  useEffect(() => {
    if (!isAuthenticated || !user) return
    const load = async () => {
      setProfileLoading(true)
      try {
        const res = await userService.getProfile() as any
        setProfileData(res.profile || {})
        setFormData({
          full_name: user.full_name || '',
          bio: res.profile?.bio || '',
          expertise: Array.isArray(res.profile?.expertise) ? res.profile.expertise.join(', ') : '',
          hourly_rate: res.profile?.hourly_rate || '',
          education: res.profile?.education || '',
          goals: res.profile?.goals || '',
        })
      } catch {
        setFormData({
          full_name: user.full_name || '',
          bio: '',
          expertise: '',
          hourly_rate: '',
          education: '',
          goals: '',
        })
      } finally {
        setProfileLoading(false)
      }
    }
    load()
  }, [isAuthenticated, user])

  if (authLoading) {
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
    { href: '/profile', label: 'Profile', icon: icons.profile },
  ]

  if (user.role === 'mentor') {
    navLinks.push({ href: '/mentor/students', label: 'My Students', icon: icons.students })
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      const updated = await userService.updateProfile({
        full_name: formData.full_name || undefined,
        bio: formData.bio || undefined,
        expertise: formData.expertise || undefined,
        hourly_rate: formData.hourly_rate ? Number(formData.hourly_rate) : undefined,
        education: formData.education || undefined,
        goals: formData.goals || undefined,
      }) as any
      if (updated.full_name) {
        setUser({ ...user, full_name: updated.full_name })
      }
      setProfileData({
        bio: formData.bio,
        expertise: formData.expertise ? formData.expertise.split(',').map((s: string) => s.trim()) : [],
        hourly_rate: formData.hourly_rate,
        education: formData.education,
        goals: formData.goals,
      })
      toast.success('Profile updated successfully')
      setIsEditing(false)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to update profile'
      toast.error(message)
    } finally {
      setSaving(false)
    }
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
                link.href === '/profile'
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
          <h1 className="text-lg font-semibold text-white">Profile</h1>
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
          <div className="max-w-3xl mx-auto space-y-8">
            {/* User Info Card */}
            <div className="bg-[#1a1a2e] border border-[#1e293b] rounded-xl p-6">
              <div className="flex items-start gap-6">
                {/* Avatar */}
                <div className="h-20 w-20 rounded-full bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center text-2xl font-bold text-white flex-shrink-0">
                  {user.full_name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between flex-wrap gap-4">
                    <div>
                      <h2 className="text-2xl font-bold text-white">{user.full_name}</h2>
                      <p className="text-gray-400 mt-1">{user.email}</p>
                      <div className="flex items-center gap-3 mt-2 flex-wrap">
                        <span
                          className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium capitalize ${
                            user.role === 'mentor'
                              ? 'bg-purple-500/10 text-purple-400 border-purple-500/30'
                              : 'bg-blue-500/10 text-blue-400 border-blue-500/30'
                          }`}
                        >
                          {user.role}
                        </span>
                        {user.is_verified && (
                          <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium bg-green-500/10 text-green-400 border-green-500/30">
                            Verified
                          </span>
                        )}
                        <span className="text-xs text-gray-500">
                          Joined {new Date(user.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => setIsEditing(!isEditing)}
                      className="bg-[#16213e] hover:bg-[#1e293b] text-gray-300 hover:text-white text-sm font-medium rounded-lg px-4 py-2 transition-colors flex-shrink-0"
                    >
                      {isEditing ? 'Cancel' : 'Edit Profile'}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Edit Form */}
            {isEditing && (
              <div className="bg-[#1a1a2e] border border-[#1e293b] rounded-xl p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Edit Profile</h3>
                <form onSubmit={handleSave} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1.5">Full Name</label>
                    <input
                      type="text"
                      value={formData.full_name}
                      onChange={(e) => setFormData((p) => ({ ...p, full_name: e.target.value }))}
                      className="w-full bg-[#16213e] border border-[#334155] rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1.5">Avatar</label>
                    <div className="flex items-center gap-4">
                      <div className="h-14 w-14 rounded-full bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center text-xl font-bold text-white">
                        {formData.full_name.charAt(0).toUpperCase()}
                      </div>
                      <div className="bg-[#16213e] border border-dashed border-[#334155] rounded-lg px-4 py-3 text-sm text-gray-500 flex-1 text-center">
                        Avatar upload placeholder
                      </div>
                    </div>
                  </div>

                  {user.role === 'mentor' && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1.5">Bio</label>
                        <textarea
                          value={formData.bio}
                          onChange={(e) => setFormData((p) => ({ ...p, bio: e.target.value }))}
                          placeholder="Tell students about yourself..."
                          rows={3}
                          className="w-full bg-[#16213e] border border-[#334155] rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-colors resize-none"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1.5">Expertise (comma separated)</label>
                        <input
                          type="text"
                          value={formData.expertise}
                          onChange={(e) => setFormData((p) => ({ ...p, expertise: e.target.value }))}
                          placeholder="Python, JavaScript, Data Science"
                          className="w-full bg-[#16213e] border border-[#334155] rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-colors"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1.5">Hourly Rate (USD)</label>
                        <input
                          type="number"
                          value={formData.hourly_rate}
                          onChange={(e) => setFormData((p) => ({ ...p, hourly_rate: e.target.value }))}
                          placeholder="50"
                          className="w-full bg-[#16213e] border border-[#334155] rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-colors"
                        />
                      </div>
                    </>
                  )}

                  {user.role === 'student' && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1.5">Education</label>
                        <input
                          type="text"
                          value={formData.education}
                          onChange={(e) => setFormData((p) => ({ ...p, education: e.target.value }))}
                          placeholder="e.g., B.S. Computer Science, Stanford University"
                          className="w-full bg-[#16213e] border border-[#334155] rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-colors"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1.5">Learning Goals</label>
                        <textarea
                          value={formData.goals}
                          onChange={(e) => setFormData((p) => ({ ...p, goals: e.target.value }))}
                          placeholder="What do you want to learn?"
                          rows={3}
                          className="w-full bg-[#16213e] border border-[#334155] rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-colors resize-none"
                        />
                      </div>
                    </>
                  )}

                  <button
                    type="submit"
                    disabled={saving}
                    className="bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-semibold rounded-lg px-6 py-2.5 text-sm transition-all duration-200 disabled:opacity-50"
                  >
                    {saving ? 'Saving...' : 'Save Changes'}
                  </button>
                </form>
              </div>
            )}

            {/* Role-specific Info */}
            {profileLoading && (
              <div className="bg-[#1a1a2e] border border-[#1e293b] rounded-xl p-6 flex items-center justify-center">
                <div className="h-6 w-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
              </div>
            )}
            {!profileLoading && user.role === 'mentor' && !isEditing && (
              <div className="bg-[#1a1a2e] border border-[#1e293b] rounded-xl p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Mentor Profile</h3>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-500">Bio</p>
                    {profileData.bio ? (
                      <p className="text-gray-300 mt-0.5">{profileData.bio}</p>
                    ) : (
                      <p className="text-gray-500 mt-0.5 italic">No bio set yet.</p>
                    )}
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Expertise</p>
                    {profileData.expertise && Array.isArray(profileData.expertise) && profileData.expertise.length > 0 ? (
                      <div className="flex flex-wrap gap-2 mt-1">
                        {profileData.expertise.map((s: string) => (
                          <span key={s} className="bg-blue-500/10 text-blue-400 text-xs rounded px-2 py-0.5">
                            {s}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-500 mt-0.5 italic">Not set</p>
                    )}
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Hourly Rate</p>
                    {profileData.hourly_rate ? (
                      <p className="text-gray-300 mt-0.5">${Number(profileData.hourly_rate).toFixed(2)} / hour</p>
                    ) : (
                      <p className="text-gray-500 mt-0.5 italic">Not set</p>
                    )}
                  </div>
                  {profileData.rating ? (
                    <div>
                      <p className="text-sm text-gray-500">Rating</p>
                      <p className="text-yellow-400 mt-0.5">{profileData.rating.toFixed(1)} / 5.0</p>
                    </div>
                  ) : null}
                </div>
              </div>
            )}

            {!profileLoading && user.role === 'student' && !isEditing && (
              <div className="bg-[#1a1a2e] border border-[#1e293b] rounded-xl p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Learning Profile</h3>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-500">Education</p>
                    {profileData.education ? (
                      <p className="text-gray-300 mt-0.5">{profileData.education}</p>
                    ) : (
                      <p className="text-gray-500 mt-0.5 italic">No education details set.</p>
                    )}
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Learning Goals</p>
                    {profileData.goals ? (
                      <p className="text-gray-300 mt-0.5">{profileData.goals}</p>
                    ) : (
                      <p className="text-gray-500 mt-0.5 italic">No goals set yet.</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Account Info */}
            <div className="bg-[#1a1a2e] border border-[#1e293b] rounded-xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Account</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-300">Email</p>
                    <p className="text-xs text-gray-500">{user.email}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-300">Account Status</p>
                    <p className="text-xs text-gray-500">{user.is_verified ? 'Verified' : 'Unverified'}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-300">Member Since</p>
                    <p className="text-xs text-gray-500">
                      {new Date(user.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
