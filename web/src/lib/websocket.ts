/**
 * WebSocket Client Utilities
 * Preparation for real-time features (notifications, live updates)
 */

export enum WebSocketStatus {
  CONNECTING = 'CONNECTING',
  OPEN = 'OPEN',
  CLOSING = 'CLOSING',
  CLOSED = 'CLOSED',
}

export interface WebSocketMessage {
  type: string
  payload: any
  timestamp: number
}

export interface WebSocketConfig {
  url: string
  reconnect?: boolean
  reconnectInterval?: number
  maxReconnectAttempts?: number
  heartbeatInterval?: number
  debug?: boolean
}

export class WebSocketClient {
  private ws: WebSocket | null = null
  private config: Required<WebSocketConfig>
  private reconnectAttempts = 0
  private heartbeatTimer: NodeJS.Timeout | null = null
  private reconnectTimer: NodeJS.Timeout | null = null
  private messageHandlers = new Map<string, Set<(payload: any) => void>>()
  private statusHandlers = new Set<(status: WebSocketStatus) => void>()

  constructor(config: WebSocketConfig) {
    this.config = {
      url: config.url,
      reconnect: config.reconnect ?? true,
      reconnectInterval: config.reconnectInterval ?? 3000,
      maxReconnectAttempts: config.maxReconnectAttempts ?? 5,
      heartbeatInterval: config.heartbeatInterval ?? 30000,
      debug: config.debug ?? false,
    }
  }

  /**
   * Connect to WebSocket server
   */
  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.log('Connecting to WebSocket...')
        this.ws = new WebSocket(this.config.url)

        this.ws.onopen = () => {
          this.log('WebSocket connected')
          this.reconnectAttempts = 0
          this.notifyStatus(WebSocketStatus.OPEN)
          this.startHeartbeat()
          resolve()
        }

        this.ws.onmessage = (event) => {
          this.handleMessage(event.data)
        }

        this.ws.onerror = (error) => {
          this.log('WebSocket error:', error)
          reject(error)
        }

        this.ws.onclose = () => {
          this.log('WebSocket closed')
          this.notifyStatus(WebSocketStatus.CLOSED)
          this.stopHeartbeat()
          this.handleReconnect()
        }
      } catch (error) {
        this.log('Failed to create WebSocket:', error)
        reject(error)
      }
    })
  }

  /**
   * Disconnect from WebSocket server
   */
  disconnect() {
    this.config.reconnect = false // Disable auto-reconnect
    this.stopHeartbeat()
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer)
      this.reconnectTimer = null
    }
    if (this.ws) {
      this.ws.close()
      this.ws = null
    }
  }

  /**
   * Send message to server
   */
  send(type: string, payload: any) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      this.log('Cannot send message: WebSocket not connected')
      return
    }

    const message: WebSocketMessage = {
      type,
      payload,
      timestamp: Date.now(),
    }

    this.ws.send(JSON.stringify(message))
    this.log('Sent message:', message)
  }

  /**
   * Subscribe to specific message type
   */
  on(type: string, handler: (payload: any) => void) {
    if (!this.messageHandlers.has(type)) {
      this.messageHandlers.set(type, new Set())
    }
    this.messageHandlers.get(type)!.add(handler)

    // Return unsubscribe function
    return () => {
      this.off(type, handler)
    }
  }

  /**
   * Unsubscribe from message type
   */
  off(type: string, handler: (payload: any) => void) {
    const handlers = this.messageHandlers.get(type)
    if (handlers) {
      handlers.delete(handler)
      if (handlers.size === 0) {
        this.messageHandlers.delete(type)
      }
    }
  }

  /**
   * Subscribe to connection status changes
   */
  onStatusChange(handler: (status: WebSocketStatus) => void) {
    this.statusHandlers.add(handler)
    return () => {
      this.statusHandlers.delete(handler)
    }
  }

  /**
   * Get current connection status
   */
  getStatus(): WebSocketStatus {
    if (!this.ws) return WebSocketStatus.CLOSED
    switch (this.ws.readyState) {
      case WebSocket.CONNECTING:
        return WebSocketStatus.CONNECTING
      case WebSocket.OPEN:
        return WebSocketStatus.OPEN
      case WebSocket.CLOSING:
        return WebSocketStatus.CLOSING
      case WebSocket.CLOSED:
        return WebSocketStatus.CLOSED
      default:
        return WebSocketStatus.CLOSED
    }
  }

  /**
   * Handle incoming message
   */
  private handleMessage(data: string) {
    try {
      const message: WebSocketMessage = JSON.parse(data)
      this.log('Received message:', message)

      // Special handling for heartbeat
      if (message.type === 'pong') {
        return
      }

      // Notify handlers
      const handlers = this.messageHandlers.get(message.type)
      if (handlers) {
        handlers.forEach((handler) => {
          try {
            handler(message.payload)
          } catch (error) {
            this.log('Error in message handler:', error)
          }
        })
      }
    } catch (error) {
      this.log('Failed to parse message:', error)
    }
  }

  /**
   * Handle reconnection logic
   */
  private handleReconnect() {
    if (!this.config.reconnect) return
    if (this.reconnectAttempts >= this.config.maxReconnectAttempts) {
      this.log('Max reconnect attempts reached')
      return
    }

    this.reconnectAttempts++
    this.log(
      `Reconnecting... (attempt ${this.reconnectAttempts}/${this.config.maxReconnectAttempts})`
    )

    this.reconnectTimer = setTimeout(() => {
      this.connect().catch((error) => {
        this.log('Reconnection failed:', error)
      })
    }, this.config.reconnectInterval)
  }

  /**
   * Start heartbeat to keep connection alive
   */
  private startHeartbeat() {
    this.stopHeartbeat()
    this.heartbeatTimer = setInterval(() => {
      this.send('ping', {})
    }, this.config.heartbeatInterval)
  }

  /**
   * Stop heartbeat
   */
  private stopHeartbeat() {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer)
      this.heartbeatTimer = null
    }
  }

  /**
   * Notify status change
   */
  private notifyStatus(status: WebSocketStatus) {
    this.statusHandlers.forEach((handler) => {
      try {
        handler(status)
      } catch (error) {
        this.log('Error in status handler:', error)
      }
    })
  }

  /**
   * Debug logging
   */
  private log(...args: any[]) {
    if (this.config.debug) {
      console.log('[WebSocket]', ...args)
    }
  }
}

/**
 * Create WebSocket client instance
 */
export function createWebSocketClient(config: WebSocketConfig): WebSocketClient {
  return new WebSocketClient(config)
}
