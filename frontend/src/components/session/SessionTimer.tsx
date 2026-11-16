'use client'
import { useEffect, useState } from 'react'
import { Clock } from 'lucide-react'

interface SessionTimerProps {
  startTime: string
  isActive?: boolean
}

export default function SessionTimer({ startTime, isActive = true }: SessionTimerProps) {
  const [elapsed, setElapsed] = useState('00:00')

  useEffect(() => {
    if (!isActive) return
    const start = new Date(startTime).getTime()
    const update = () => {
      const diff = Math.max(0, Math.floor((Date.now() - start) / 1000))
      const h = Math.floor(diff / 3600)
      const m = Math.floor((diff % 3600) / 60)
      const s = diff % 60
      setElapsed(h > 0 ? `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}` : `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`)
    }
    update()
    const interval = setInterval(update, 1000)
    return () => clearInterval(interval)
  }, [startTime, isActive])

  return (
    <div className="flex items-center gap-1.5 text-gray-400 text-sm">
      <Clock size={14} />
      <span>{elapsed}</span>
    </div>
  )
}
