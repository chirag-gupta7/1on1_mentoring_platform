'use client'
import { useEffect, useRef, useState } from 'react'
import { Send } from 'lucide-react'
import type { Message } from '@/types'

interface ChatWindowProps {
  messages: Message[]
  onSend: (content: string) => void
  currentUserId?: string
}

export default function ChatWindow({ messages, onSend, currentUserId }: ChatWindowProps) {
  const [input, setInput] = useState('')
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages])

  const handleSend = () => {
    if (!input.trim()) return
    onSend(input.trim())
    setInput('')
  }

  const formatTime = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    } catch { return '' }
  }

  return (
    <div className="flex flex-col h-full">
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map(msg => {
          const isMine = msg.sender_id === currentUserId
          const isSystem = msg.message_type === 'system'
          
          if (isSystem) {
            return <div key={msg.id} className="text-center text-xs text-gray-500 italic py-1">{msg.content}</div>
          }
          
          return (
            <div key={msg.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] ${isMine ? 'order-1' : 'order-1'}`}>
                {!isMine && <p className="text-xs text-blue-400 mb-0.5 ml-1">{msg.sender?.full_name || 'Unknown'}</p>}
                <div className={`rounded-2xl px-4 py-2 text-sm ${isMine ? 'bg-blue-600 text-white rounded-br-md' : 'bg-[#1e293b] text-gray-200 rounded-bl-md'}`}>
                  {msg.content}
                </div>
                <p className={`text-xs text-gray-500 mt-0.5 ${isMine ? 'text-right mr-1' : 'ml-1'}`}>{formatTime(msg.created_at)}</p>
              </div>
            </div>
          )
        })}
      </div>
      <div className="p-3 border-t border-[#1e293b]">
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSend()}
            placeholder="Type a message..."
            className="flex-1 bg-[#16213e] border border-[#334155] rounded-lg px-4 py-2.5 text-sm text-white placeholder-gray-500 outline-none focus:border-blue-500"
          />
          <button onClick={handleSend} className="p-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors">
            <Send size={16} />
          </button>
        </div>
      </div>
    </div>
  )
}
