'use client'

interface CursorInfo {
  userId: string
  userName: string
  line: number
  column: number
}

const CURSOR_COLORS = ['#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899']

interface CursorPresenceProps {
  cursors: Map<string, CursorInfo>
}

export default function CursorPresence({ cursors }: CursorPresenceProps) {
  return (
    <div className="flex items-center gap-2 px-3 py-1.5">
      {Array.from(cursors.values()).map((cursor, i) => (
        <div key={cursor.userId} className="flex items-center gap-1.5 text-xs">
          <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: CURSOR_COLORS[i % CURSOR_COLORS.length] }} />
          <span className="text-gray-400">{cursor.userName}</span>
        </div>
      ))}
    </div>
  )
}
