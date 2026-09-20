import { useEffect, useRef, useCallback, useState } from 'react'
import { getFeedbackSDKConfig } from '@/lib/sdk'

export interface FeedbackRealtimeEvent {
  type: 'feedback.updated' | 'feedback.message.created'
  project_id: string
  feedback_id?: number
  message_id?: number
  updated_at?: string
}

interface UseFeedbackRealtimeOptions {
  projectId?: number
  onEvent?: (event: FeedbackRealtimeEvent) => void
  enabled?: boolean
}

function getWsUrl(projectId: number): string {
  const cfg = getFeedbackSDKConfig()
  const base = cfg.gatewayUrl?.trim() || (import.meta.env.DEV ? 'ws://localhost:8081' : 'wss://api.feitianchengzi.com')
  return `${base}/workshop/v1/feedback/projects/${projectId}/ws`
}

export function useFeedbackRealtime({ projectId, onEvent, enabled = true }: UseFeedbackRealtimeOptions) {
  const wsRef = useRef<WebSocket | null>(null)
  const reconnectTimer = useRef<ReturnType<typeof setTimeout>>()
  const [connected, setConnected] = useState(false)
  const [lastEvent, setLastEvent] = useState<FeedbackRealtimeEvent | null>(null)

  const cleanup = useCallback(() => {
    if (reconnectTimer.current) {
      clearTimeout(reconnectTimer.current)
      reconnectTimer.current = undefined
    }
    if (wsRef.current) {
      wsRef.current.close()
      wsRef.current = null
    }
    setConnected(false)
  }, [])

  useEffect(() => {
    if (!enabled || !projectId) {
      cleanup()
      return
    }

    let cancelled = false

    function connect() {
      if (cancelled) return

      try {
        const url = getWsUrl(projectId!)
        const ws = new WebSocket(url)
        wsRef.current = ws

        ws.onopen = () => {
          if (!cancelled) setConnected(true)
        }

        ws.onmessage = (event) => {
          if (cancelled) return
          try {
            const data = JSON.parse(event.data) as FeedbackRealtimeEvent
            if (data.type === 'feedback.updated' || data.type === 'feedback.message.created') {
              setLastEvent(data)
              onEvent?.(data)
            }
          } catch {
            // ignore malformed messages
          }
        }

        ws.onclose = () => {
          if (cancelled) return
          setConnected(false)
          // Reconnect with exponential backoff
          reconnectTimer.current = setTimeout(connect, 5000)
        }

        ws.onerror = () => {
          ws.close()
        }
      } catch {
        if (!cancelled) {
          reconnectTimer.current = setTimeout(connect, 5000)
        }
      }
    }

    connect()

    return () => {
      cancelled = true
      cleanup()
    }
  }, [projectId, enabled, onEvent, cleanup])

  return { connected, lastEvent }
}
