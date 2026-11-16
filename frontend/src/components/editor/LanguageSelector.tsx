'use client'

const LANGUAGES = [
  { value: 'javascript', label: 'JavaScript' },
  { value: 'typescript', label: 'TypeScript' },
  { value: 'python', label: 'Python' },
  { value: 'java', label: 'Java' },
  { value: 'cpp', label: 'C++' },
  { value: 'go', label: 'Go' },
  { value: 'rust', label: 'Rust' },
  { value: 'html', label: 'HTML' },
  { value: 'css', label: 'CSS' },
  { value: 'sql', label: 'SQL' },
]

interface LanguageSelectorProps {
  value: string
  onChange: (lang: string) => void
}

export default function LanguageSelector({ value, onChange }: LanguageSelectorProps) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="bg-[#16213e] border border-[#334155] rounded-lg px-3 py-1.5 text-sm text-gray-300 outline-none focus:border-blue-500"
    >
      {LANGUAGES.map(lang => (
        <option key={lang.value} value={lang.value}>{lang.label}</option>
      ))}
    </select>
  )
}
