'use client'
import { Play, Download } from 'lucide-react'

interface EditorToolbarProps {
  language: string
  onLanguageChange: (lang: string) => void
  onRun?: () => void
  onSave?: () => void
}

export default function EditorToolbar({ language, onLanguageChange, onRun, onSave }: EditorToolbarProps) {
  return (
    <div className="flex items-center justify-between px-4 py-2 bg-[#1a1a2e] border-b border-[#1e293b]">
      <div className="flex items-center gap-3">
        <select
          value={language}
          onChange={(e) => onLanguageChange(e.target.value)}
          className="bg-[#16213e] border border-[#334155] rounded-lg px-3 py-1.5 text-sm text-gray-300 outline-none focus:border-blue-500"
        >
          <option value="javascript">JavaScript</option>
          <option value="typescript">TypeScript</option>
          <option value="python">Python</option>
          <option value="java">Java</option>
          <option value="cpp">C++</option>
          <option value="go">Go</option>
          <option value="rust">Rust</option>
        </select>
      </div>
      <div className="flex items-center gap-2">
        {onRun && (
          <button onClick={onRun} className="flex items-center gap-1.5 px-3 py-1.5 bg-green-600/20 text-green-400 rounded-lg text-sm hover:bg-green-600/30 transition-colors">
            <Play size={14} /> Run
          </button>
        )}
        {onSave && (
          <button onClick={onSave} className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600/20 text-blue-400 rounded-lg text-sm hover:bg-blue-600/30 transition-colors">
            <Download size={14} /> Save
          </button>
        )}
      </div>
    </div>
  )
}
