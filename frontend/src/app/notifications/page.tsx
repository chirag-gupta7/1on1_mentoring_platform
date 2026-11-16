'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/hooks/useAuth'
import { apiClient } from '@/services/api'
import { ArrowLeft, Bell, BellOff, CheckCheck } from 'lucide-react'

interface Notification {
  id: string
  title: string
  message: string
  notification_type: string
  is_read: boolean
  related_session_id?: string
  created_at: string
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
  notifications: navIcon('M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9'),
}

export default function NotificationsPage() {
  const router = useRouter()
  const { user, isAuthenticated, isLoading: authLoading, logout } = useAuth()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.replace('/login')
    }
  }, [authLoading, isAuthenticated, router])

  useEffect(() => {
    if (!isAuthenticated) return
    const fetchNotifications = async () => {
      try {
        const res = await apiClient<{ items: Notification[]; unread_count: number }>('/notifications/')
        setNotifications(res.items ?? [])
        setUnreadCount(res.unread_count ?? 0)
      } catch {
        setNotifications([])
      } finally {
        setLoading(false)
      }
    }
    fetchNotifications()
  }, [isAuthenticated])

  async function handleMarkAllRead() {
    try {
      await apiClient('/notifications/read', { method: 'PUT' })
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
      setUnreadCount(0)
    } catch {}
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-[#0f0f1a] flex items-center justify-center">
        <div className="h-8 w-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!isAuthenticated || !user) return null

  const navLinks = user.role === 'mentor'
    ? [
        { href: '/dashboard', label: 'Dashboard', icon: icons.dashboard },
        { href: '/mentor/sessions', label: 'Sessions', icon: icons.sessions },
        { href: '/notifications', label: 'Notifications', icon: icons.notifications },
        { href: '/profile', label: 'Profile', icon: icons.profile },
      ]
    : [
        { href: '/dashboard', label: 'Dashboard', icon: icons.dashboard },
        { href: '/student/sessions', label: 'Sessions', icon: icons.sessions },
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
                link.href === '/notifications' ? 'text-white bg-[#16213e]' : 'text-gray-400 hover:text-white hover:bg-[#16213e]'
              }`}
            >
              {link.icon}
              {link.label}
              {link.href === '/notifications' && unreadCount > 0 && (
                <span className="ml-auto bg-red-500 text-white text-xs rounded-full px-2 py-0.5">{unreadCount}</span>
              )}
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
          <h1 className="text-lg font-semibold text-white">Notifications</h1>
          <div className="flex items-center gap-4">
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="text-sm text-blue-400 hover:text-blue-300 flex items-center gap-1.5 transition-colors"
              >
                <CheckCheck className="h-4 w-4" />
                Mark all read
              </button>
            )}
            <button
              onClick={() => { logout(); router.push('/login') }}
              className="text-sm text-gray-400 hover:text-white bg-[#16213e] hover:bg-[#1e293b] rounded-lg px-4 py-2 transition-colors"
            >
              Logout
            </button>
          </div>
        </header>

        <div className="p-6 flex-1 overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="text-center py-20">
              <BellOff className="h-12 w-12 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-500">No notifications yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {notifications.map((notif) => (
                <div
                  key={notif.id}
                  className={`bg-[#1a1a2e] border rounded-xl p-4 transition-colors ${
                    notif.is_read ? 'border-[#1e293b]' : 'border-blue-500/30 bg-blue-500/5'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`mt-0.5 h-2 w-2 rounded-full flex-shrink-0 ${notif.is_read ? 'bg-gray-600' : 'bg-blue-400'}`} />
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium ${notif.is_read ? 'text-gray-300' : 'text-white'}`}>{notif.title}</p>
                      <p className="text-sm text-gray-400 mt-1">{notif.message}</p>
                      <div className="flex items-center gap-3 mt-2">
                        <span className="text-xs text-gray-600">{new Date(notif.created_at).toLocaleString()}</span>
                        {notif.related_session_id && (
                          <Link href={`/session/${notif.related_session_id}`} className="text-xs text-blue-400 hover:text-blue-300">
                            View Session
                          </Link>
                        )}
                      </div>
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
