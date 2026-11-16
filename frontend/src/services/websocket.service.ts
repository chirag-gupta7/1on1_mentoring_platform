type MessageHandler = (data: any) => void

class WebSocketService {
  private sockets: Map<string, WebSocket> = new Map()
  private handlers: Map<string, Set<MessageHandler>> = new Map()
  
  connect(path: string, sessionId: string, token: string): WebSocket {
    const key = `${path}/${sessionId}`
    if (this.sockets.has(key)) return this.sockets.get(key)!
    
    const baseWsUrl = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8000'
    const ws = new WebSocket(`${baseWsUrl}${key}?token=${token}`)
    
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data)
      const handlers = this.handlers.get(key)
      if (handlers) handlers.forEach(h => h(data))
    }
    
    ws.onclose = () => {
      this.sockets.delete(key)
    }
    
    this.sockets.set(key, ws)
    return ws
  }
  
  disconnect(path: string, sessionId: string) {
    const key = `${path}/${sessionId}`
    const ws = this.sockets.get(key)
    if (ws) {
      ws.close()
      this.sockets.delete(key)
    }
  }
  
  send(path: string, sessionId: string, data: any) {
    const key = `${path}/${sessionId}`
    const ws = this.sockets.get(key)
    if (ws?.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(data))
    }
  }
  
  on(path: string, sessionId: string, handler: MessageHandler) {
    const key = `${path}/${sessionId}`
    if (!this.handlers.has(key)) this.handlers.set(key, new Set())
    this.handlers.get(key)!.add(handler)
    return () => this.handlers.get(key)?.delete(handler)
  }
  
  disconnectAll() {
    this.sockets.forEach(ws => ws.close())
    this.sockets.clear()
  }
}

export const wsService = new WebSocketService()
