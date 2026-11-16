'use client'

import type { ReactNode } from 'react'
import { Toaster } from 'sonner'
import { AuthProvider } from './AuthProvider'

export function Providers({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: '#1a1a2e',
            color: '#e2e8f0',
            border: '1px solid #1e293b',
          },
        }}
      />
      {children}
    </AuthProvider>
  )
}
