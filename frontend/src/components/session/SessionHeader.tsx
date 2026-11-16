'use client'
import { ArrowLeft, Users, PhoneOff } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface SessionHeaderProps {
  title: string
  language: string
  participantCount: number
  onLeave: () => void
}

export default function SessionHeader({ title, language, participantCount, onLeave }: SessionHeaderProps) {
  const router = useRouter()
  
  return (
    <div className="flex items-center justify-between px-6 py-3 bg-[#1a1a2e] border-b border-[#1e293b]">
      <div className="flex items-center gap-4">
        <button onClick={() => router.back()} className="text-gray-400 hover:text-white transition-colors">
          <ArrowLeft size={20} />
        </button>
        <div>
          <h2 className="text-white font-semibold">{title}</h2>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-xs px-2 py-0.5 rounded bg-blue-500/10 text-blue-400">{language}</span>
            <span className="flex items-center gap-1 text-xs text-gray-400"><Users size={12} /> {participantCount}</span>
          </div>
        </div>
      </div>
      <button
        onClick={onLeave}
        className="flex items-center gap-2 px-4 py-2 bg-red-600/20 text-red-400 rounded-lg text-sm hover:bg-red-600/30 transition-colors"
      >
        <PhoneOff size={16} /> Leave Session
      </button>
    </div>
  )
}
