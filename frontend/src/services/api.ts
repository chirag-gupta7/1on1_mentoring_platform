const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'

interface RequestOptions {
  method?: string
  body?: any
  headers?: Record<string, string>
  auth?: boolean
}

export async function apiClient<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, headers = {}, auth = true } = options
  
  if (auth) {
    const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null
    if (token) headers['Authorization'] = `Bearer ${token}`
  }
  
  if (body && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json'
  }
  
  const res = await fetch(`${API_BASE}${endpoint}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  })
  
  if (!res.ok) {
    const error = await res.json().catch(() => ({ detail: 'Request failed' }))
    throw new Error(error.detail || `HTTP ${res.status}`)
  }

  if (res.status === 204) return undefined as T
  return res.json()
}
