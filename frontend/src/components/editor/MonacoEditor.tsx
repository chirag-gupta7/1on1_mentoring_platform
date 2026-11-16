'use client'
import Editor from '@monaco-editor/react'

interface MonacoEditorProps {
  code: string
  language: string
  onChange?: (value: string | undefined) => void
  readOnly?: boolean
}

export default function MonacoEditor({ code, language, onChange, readOnly = false }: MonacoEditorProps) {
  return (
    <Editor
      height="100%"
      language={language}
      value={code}
      onChange={onChange}
      theme="vs-dark"
      options={{
        minimap: { enabled: false },
        fontSize: 14,
        fontFamily: 'JetBrains Mono, Fira Code, monospace',
        lineNumbers: 'on',
        wordWrap: 'on',
        automaticLayout: true,
        readOnly,
        scrollBeyondLastLine: false,
        tabSize: 2,
        padding: { top: 16 },
        cursorBlinking: 'smooth',
        smoothScrolling: true,
        bracketPairColorization: { enabled: true },
      }}
      loading={<div className="flex items-center justify-center h-full text-gray-400">Loading editor...</div>}
    />
  )
}
