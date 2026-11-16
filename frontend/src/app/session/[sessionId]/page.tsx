'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { toast } from 'sonner'
import Editor from '@monaco-editor/react'
import { useAuth } from '@/hooks/useAuth'
import { useChat } from '@/hooks/useChat'
import { useYjsEditor } from '@/hooks/useYjsEditor'
import { useWebRTC } from '@/hooks/useWebRTC'
import { useWebSocket } from '@/hooks/useWebSocket'
import { sessionService } from '@/services/session.service'
import type { Session } from '@/types'
import { clsx } from 'clsx'
import {
  PhoneOff,
  Mic,
  MicOff,
  Video,
  VideoOff,
  Send,
  Code2,
  Users,
  Clock,
  ArrowLeft,
  X,
} from 'lucide-react'

const LANGUAGE_MONACO_MAP: Record<string, string> = {
  Python: 'python',
  JavaScript: 'javascript',
  TypeScript: 'typescript',
  Java: 'java',
  'C++': 'cpp',
  Go: 'go',
  Rust: 'rust',
}

const LANGUAGES = ['Python', 'JavaScript', 'TypeScript', 'Java', 'C++', 'Go', 'Rust']

function SessionTimer({ startTime }: { startTime: string }) {
  const [elapsed, setElapsed] = useState(0)

  useEffect(() => {
    const start = new Date(startTime).getTime()
    const tick = () => {
      const diff = Math.floor((Date.now() - start) / 1000)
      setElapsed(Math.max(0, diff))
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [startTime])

  const isFuture = new Date(startTime).getTime() > Date.now()
  const absElapsed = Math.abs(elapsed)
  const h = Math.floor(absElapsed / 3600)
  const m = Math.floor((absElapsed % 3600) / 60)
  const s = absElapsed % 60

  return (
    <span className="font-mono text-sm text-gray-300 tabular-nums">
      {isFuture ? 'Starts in ' : ''}
      {String(h).padStart(2, '0')}:{String(m).padStart(2, '0')}:{String(s).padStart(2, '0')}
    </span>
  )
}

export default function SessionPage() {
  const params = useParams()
  const router = useRouter()
  const sessionId = params.sessionId as string

  const { user, isLoading: authLoading, isAuthenticated } = useAuth()

  const [session, setSession] = useState<Session | null>(null)
  const [pageLoading, setPageLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showLeaveDialog, setShowLeaveDialog] = useState(false)
  const [leaving, setLeaving] = useState(false)

  const { messages, sendMessage } = useChat(sessionId)
  const { bindEditor, setLanguage: setYjsLanguage, status: yjsStatus, errorMsg: yjsError, retry: retryYjs } = useYjsEditor(sessionId)
  const [editorLanguage, setEditorLanguage] = useState('JavaScript')
  const [editorCursors, setEditorCursors] = useState<Map<string, any>>(new Map())

  const signalingSendRef = useRef<(data: any) => void>(() => {})

  const { send: signalingSend } = useWebSocket('/ws/signaling', sessionId, (data) => {
    switch (data.type) {
      case 'offer':
        handleReceivedOffer(data)
        break
      case 'answer':
        handleReceivedAnswer(data)
        break
      case 'candidate':
        handleReceivedCandidate(data)
        break
      case 'user_joined':
        handlePeerJoined()
        break
    }
  })

  useEffect(() => {
    signalingSendRef.current = signalingSend
  }, [signalingSend])

  const webrtc = useWebRTC({
    onSignalingMessage: (msg) => {
      signalingSendRef.current(msg)
    },
  })

  const {
    localStream,
    remoteStream,
    isMicOn,
    isCameraOn,
    startLocalStream,
    createOffer,
    createAnswer,
    setRemoteDescription,
    addIceCandidate,
    addLocalStream,
    toggleMic,
    toggleCamera,
    cleanup,
  } = webrtc

  const hasSentOfferRef = useRef(false)
  const localStreamRef = useRef<MediaStream | null>(null)

  useEffect(() => {
    localStreamRef.current = localStream
  }, [localStream])

  const handlePeerJoined = useCallback(async () => {
    if (hasSentOfferRef.current) return
    const stream = localStreamRef.current
    if (!stream) return
    try {
      webrtc.createPeerConnection()
      addLocalStream(stream)
      const offer = await createOffer()
      if (offer) {
        hasSentOfferRef.current = true
        signalingSendRef.current({ type: 'offer', sdp: offer.sdp })
      }
    } catch (err) {
      console.error('Failed to create offer:', err)
      toast.error('Failed to initiate video call')
    }
  }, [webrtc, createOffer, addLocalStream])

  const handleReceivedOffer = useCallback(async (data: any) => {
    try {
      const stream = localStreamRef.current
      webrtc.createPeerConnection()
      if (stream) addLocalStream(stream)
      const answer = await createAnswer(data)
      if (answer) {
        signalingSendRef.current({ type: 'answer', sdp: answer.sdp })
      }
    } catch (err) {
      console.error('Failed to handle offer:', err)
      toast.error('Failed to accept video call')
    }
  }, [webrtc, createAnswer, addLocalStream])

  const handleReceivedAnswer = useCallback(async (data: any) => {
    try {
      await setRemoteDescription(data)
    } catch (err) {
      console.error('Failed to set remote description:', err)
    }
  }, [setRemoteDescription])

  const handleReceivedCandidate = useCallback(async (data: any) => {
    try {
      if (data.candidate) {
        await addIceCandidate(data.candidate)
      }
    } catch (err) {
      console.error('Failed to add ICE candidate:', err)
    }
  }, [addIceCandidate])

  useEffect(() => {
    const init = async () => {
      try {
        setPageLoading(true)
        const sessionData = await sessionService.getById(sessionId)
        setSession(sessionData)
        if (user?.role === 'student') {
          await sessionService.join(sessionId)
        }
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Failed to load session'
        setError(message)
        toast.error(message)
      } finally {
        setPageLoading(false)
      }
    }
    if (user) init()
  }, [sessionId, user])

  useEffect(() => {
    if (session && localStreamRef.current === null) {
      startLocalStream().then((stream) => {
        if (!stream) {
          toast.error('Camera/microphone access denied. Video calls will not work.')
        }
      })
    }
  }, [session, startLocalStream])

  useEffect(() => {
    return () => {
      cleanup()
      hasSentOfferRef.current = false
    }
  }, [cleanup])

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.replace('/login')
    }
  }, [authLoading, isAuthenticated, router])

  async function handleLeave() {
    setLeaving(true)
    try {
      if (session && user?.role === 'mentor') {
        await sessionService.end(sessionId)
        toast.success('Session ended')
      }
    } catch {
      toast.error('Failed to end session')
    }
    cleanup()
    router.push('/dashboard')
  }

  if (authLoading || pageLoading) {
    return (
      <div className="min-h-screen bg-[#0f0f1a] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-400 text-sm">Loading session...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated || !user) return null

  if (error || !session) {
    return (
      <div className="min-h-screen bg-[#0f0f1a] flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="h-16 w-16 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center mx-auto">
            <X className="h-8 w-8 text-red-400" />
          </div>
          <h1 className="text-xl font-semibold text-white">Session Not Found</h1>
          <p className="text-gray-400">{error || 'This session does not exist or has ended.'}</p>
          <button
            onClick={() => router.push('/dashboard')}
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-lg px-5 py-2.5 text-sm transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen flex flex-col bg-[#0f0f1a] overflow-hidden">
      {/* Top Bar */}
      <header className="h-14 min-h-[56px] bg-[#1a1a2e] border-b border-[#1e293b] px-6 py-3 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push('/dashboard')}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="text-base font-semibold text-white truncate max-w-[300px]">
            {session.title}
          </h1>
          <span className="inline-flex items-center rounded bg-blue-500/10 px-2 py-0.5 text-xs text-blue-400 border border-blue-500/20">
            <Code2 className="h-3 w-3 mr-1" />
            {session.language}
          </span>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 text-gray-400">
            <Clock className="h-4 w-4" />
            <SessionTimer startTime={session.start_time} />
          </div>
          <div className="flex items-center gap-1.5 text-gray-400 text-sm">
            <Users className="h-4 w-4" />
            <span className="text-xs">
              {[session.mentor?.full_name, session.student?.full_name]
                .filter(Boolean)
                .join(' & ')}
            </span>
          </div>
          <button
            onClick={() => setShowLeaveDialog(true)}
            className="inline-flex items-center gap-1.5 bg-red-600/20 hover:bg-red-600/40 text-red-400 text-xs font-medium rounded-lg px-3 py-1.5 transition-colors"
          >
            <PhoneOff className="h-3.5 w-3.5" />
            Leave
          </button>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex flex-1 min-h-0">
        {/* Chat Sidebar */}
        <ChatPanel
          messages={messages}
          onSend={sendMessage}
          currentUserId={user.id}
        />

        {/* Editor + Video */}
        <div className="flex-1 flex min-w-0">
          <EditorPanel
            bindEditor={bindEditor}
            language={editorLanguage}
            onLanguageChange={(lang) => {
              setEditorLanguage(lang)
              setYjsLanguage(lang)
            }}
            currentUserName={user.full_name}
            yjsStatus={yjsStatus}
            yjsError={yjsError}
            onRetry={retryYjs}
          />
          <VideoPanel
            localStream={localStream}
            remoteStream={remoteStream}
            isMicOn={isMicOn}
            isCameraOn={isCameraOn}
            onToggleMic={toggleMic}
            onToggleCamera={toggleCamera}
          />
        </div>
      </div>

      {/* Leave Confirmation Dialog */}
      {showLeaveDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowLeaveDialog(false)}
          />
          <div className="relative bg-[#1a1a2e] border border-[#1e293b] rounded-xl p-6 w-full max-w-sm mx-4 shadow-2xl">
            <h2 className="text-lg font-semibold text-white mb-2">End Session</h2>
            <p className="text-sm text-gray-400 mb-6">
              Are you sure you want to leave this session? You can rejoin later if the
              session is still active.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowLeaveDialog(false)}
                className="px-4 py-2 text-sm text-gray-300 hover:text-white bg-[#16213e] hover:bg-[#1e293b] rounded-lg transition-colors"
              >
                Stay
              </button>
              <button
                onClick={handleLeave}
                disabled={leaving}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-500 rounded-lg transition-colors disabled:opacity-50"
              >
                {leaving ? 'Leaving...' : 'Leave Session'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function ChatPanel({
  messages,
  onSend,
  currentUserId,
}: {
  messages: any[]
  onSend: (content: string) => void
  currentUserId: string
}) {
  const [input, setInput] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = input.trim()
    if (!trimmed) return
    onSend(trimmed)
    setInput('')
  }

  return (
    <aside className="w-[30%] min-w-[280px] max-w-[400px] bg-[#141425] border-r border-[#1e293b] flex flex-col flex-shrink-0">
      <div className="px-4 py-3 border-b border-[#1e293b] flex items-center gap-2">
        <div className="h-2 w-2 rounded-full bg-green-400 animate-pulse" />
        <span className="text-sm font-medium text-gray-300">Chat</span>
        <span className="text-xs text-gray-500 ml-auto">{messages.length} messages</span>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2 min-h-0">
        {messages.length === 0 && (
          <p className="text-center text-gray-600 text-sm mt-8">
            No messages yet. Start the conversation!
          </p>
        )}
        {messages.map((msg) => {
          const isSystem = msg.message_type === 'system'
          const isMine = msg.sender_id === currentUserId || msg.sender_id === 'self'

          if (isSystem) {
            return (
              <div key={msg.id} className="flex justify-center">
                <span className="text-xs text-gray-500 italic bg-[#1a1a2e] rounded-full px-3 py-0.5">
                  {msg.content}
                </span>
              </div>
            )
          }

          return (
            <div
              key={msg.id}
              className={clsx('flex flex-col max-w-[85%]', isMine ? 'ml-auto items-end' : 'items-start')}
            >
              {!isMine && (
                <span className="text-xs text-gray-500 mb-0.5 px-1">
                  {msg.sender?.full_name || 'Unknown'}
                </span>
              )}
              <div
                className={clsx(
                  'rounded-xl px-3.5 py-2 text-sm break-words',
                  isMine
                    ? 'bg-blue-600 text-white rounded-br-md'
                    : 'bg-[#1a1a2e] text-gray-200 rounded-bl-md border border-[#1e293b]',
                )}
              >
                {msg.content}
              </div>
              <span className="text-[10px] text-gray-600 mt-0.5 px-1">
                {new Date(msg.created_at).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={handleSubmit} className="p-3 border-t border-[#1e293b] flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type a message..."
          className="flex-1 bg-[#1a1a2e] border border-[#334155] rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-colors"
        />
        <button
          type="submit"
          disabled={!input.trim()}
          className="bg-blue-600 hover:bg-blue-500 text-white rounded-lg px-3 py-2 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Send className="h-4 w-4" />
        </button>
      </form>
    </aside>
  )
}

function EditorPanel({
  bindEditor,
  language,
  onLanguageChange,
  currentUserName,
  yjsStatus,
  yjsError,
  onRetry,
}: {
  bindEditor: (editor: any, monaco: any, userName: string) => void
  language: string
  onLanguageChange: (lang: string) => void
  currentUserName: string
  yjsStatus: string
  yjsError: string | null
  onRetry: () => void
}) {
  const monacoLanguage = LANGUAGE_MONACO_MAP[language] || 'plaintext'

  function handleEditorMount(editor: any, monaco: any) {
    bindEditor(editor, monaco, currentUserName)
  }

  const statusColors: Record<string, string> = {
    connected: 'bg-green-400',
    connecting: 'bg-yellow-400 animate-pulse',
    disconnected: 'bg-gray-500',
    error: 'bg-red-400',
  }

  return (
    <div className="flex-[6] flex flex-col min-w-0 border-r border-[#1e293b]">
      <div className="h-10 min-h-[40px] bg-[#1a1a2e] border-b border-[#1e293b] flex items-center px-4 gap-3">
        <Code2 className="h-4 w-4 text-blue-400" />
        <select
          value={language}
          onChange={(e) => onLanguageChange(e.target.value)}
          className="bg-[#16213e] border border-[#334155] rounded-md px-2.5 py-1 text-xs text-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-colors"
        >
          {LANGUAGES.map((lang) => (
            <option key={lang} value={lang}>
              {lang}
            </option>
          ))}
        </select>
        <div className="ml-auto flex items-center gap-2">
          <div className={`h-2 w-2 rounded-full ${statusColors[yjsStatus] || 'bg-gray-500'}`} />
          <span className="text-xs text-gray-500">{yjsStatus}</span>
        </div>
      </div>

      <div className="flex-1 min-h-0">
        {yjsStatus === 'error' ? (
          <div className="h-full w-full bg-[#0a0a14] flex items-center justify-center">
            <div className="text-center space-y-3">
              <p className="text-red-400 text-sm">Sync connection failed</p>
              {yjsError && <p className="text-gray-500 text-xs">{yjsError}</p>}
              <button
                onClick={onRetry}
                className="bg-[#16213e] hover:bg-[#1e293b] text-gray-300 text-sm rounded-lg px-4 py-2 transition-colors"
              >
                Retry Connection
              </button>
            </div>
          </div>
        ) : (
          <Editor
            height="100%"
            language={monacoLanguage}
            theme="vs-dark"
            onMount={handleEditorMount}
            loading={
              <div className="h-full w-full bg-[#0a0a14] flex items-center justify-center">
                <div className="flex flex-col items-center gap-3">
                  <div className="h-6 w-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                  <span className="text-xs text-gray-500">Loading editor...</span>
                </div>
              </div>
            }
            options={{
              fontSize: 14,
              fontFamily: "'JetBrains Mono', 'Fira Code', 'Consolas', monospace",
              lineNumbers: 'on',
              minimap: { enabled: false },
              scrollBeyondLastLine: false,
              automaticLayout: true,
              tabSize: 2,
              wordWrap: 'on',
              padding: { top: 16 },
            }}
          />
        )}
      </div>
    </div>
  )
}

function VideoPanel({
  localStream,
  remoteStream,
  isMicOn,
  isCameraOn,
  onToggleMic,
  onToggleCamera,
}: {
  localStream: MediaStream | null
  remoteStream: MediaStream | null
  isMicOn: boolean
  isCameraOn: boolean
  onToggleMic: () => void
  onToggleCamera: () => void
}) {
  const remoteRef = useRef<HTMLVideoElement>(null)
  const localRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    if (remoteRef.current) remoteRef.current.srcObject = remoteStream
  }, [remoteStream])

  useEffect(() => {
    if (localRef.current) localRef.current.srcObject = localStream
  }, [localStream])

  return (
    <div className="flex-[4] bg-[#0a0a14] flex flex-col relative min-w-0">
      {/* Remote video (fills panel) */}
      {remoteStream ? (
        <video
          ref={remoteRef}
          autoPlay
          playsInline
          className="absolute inset-0 w-full h-full object-cover"
        />
      ) : (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center space-y-3">
            <div className="h-20 w-20 rounded-full bg-[#1a1a2e] border border-[#1e293b] flex items-center justify-center mx-auto">
              <Video className="h-8 w-8 text-gray-600" />
            </div>
            <p className="text-gray-500 text-sm">
              {localStream ? 'Waiting for peer to join...' : 'Camera access required for video calls'}
            </p>
            {!localStream && (
              <p className="text-gray-600 text-xs">Allow camera/microphone in your browser settings</p>
            )}
          </div>
        </div>
      )}

      {/* Local video overlay */}
      <div className="absolute bottom-4 right-4 z-10">
        <video
          ref={localRef}
          autoPlay
          playsInline
          muted
          className={clsx(
            'w-36 h-24 rounded-lg border-2 object-cover shadow-lg',
            isCameraOn
              ? 'border-[#1e293b] bg-[#0a0a14]'
              : 'border-[#1e293b] bg-[#1a1a2e]',
          )}
        />
        {!isCameraOn && (
          <div className="absolute inset-0 flex items-center justify-center bg-[#1a1a2e]/80 rounded-lg">
            <VideoOff className="h-5 w-5 text-gray-600" />
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 flex items-center gap-3">
        <button
          onClick={onToggleMic}
          className={clsx(
            'rounded-full p-3 transition-colors',
            isMicOn
              ? 'bg-[#1a1a2e] hover:bg-[#1e293b] text-gray-300'
              : 'bg-red-600/20 hover:bg-red-600/40 text-red-400',
          )}
        >
          {isMicOn ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
        </button>
        <button
          onClick={onToggleCamera}
          className={clsx(
            'rounded-full p-3 transition-colors',
            isCameraOn
              ? 'bg-[#1a1a2e] hover:bg-[#1e293b] text-gray-300'
              : 'bg-red-600/20 hover:bg-red-600/40 text-red-400',
          )}
        >
          {isCameraOn ? <Video className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
        </button>
      </div>
    </div>
  )
}
