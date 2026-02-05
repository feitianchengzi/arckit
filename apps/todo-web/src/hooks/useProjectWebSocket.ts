/**
 * useProjectWebSocket - 项目实时通知 WebSocket Hook
 */

import { useEffect, useRef, useState } from 'react'
import { getAuthInfo } from '@/lib/utils/tokenManager'
import { useAuthStore } from '@/store/authStore'

export interface ProjectSocketEvent {
  event: string
  project_id?: number
  actor?: {
    id: number
    username?: string
    avatar?: string
  }
  occurred_at?: string
  data?: unknown
}

export interface UseProjectWebSocketOptions {
  projectId: string
  enabled?: boolean
  onEvent?: (payload: ProjectSocketEvent) => void
}

type ConnectionStatus = 'idle' | 'connecting' | 'connected' | 'disconnected'

const buildWebSocketUrl = (projectId: string) => {
  const baseUrl = import.meta.env.VITE_API_URL || 'https://api.feitianchengzi.com/workshop/v1'
  const resolvedBase =
    baseUrl.startsWith('/') && typeof window !== 'undefined'
      ? `${window.location.origin}${baseUrl}`
      : baseUrl
  const wsBase = resolvedBase.replace(/^http/i, 'ws')
  return `${wsBase}/user/projects/${projectId}/ws`
}

export function useProjectWebSocket({ projectId, enabled = true, onEvent }: UseProjectWebSocketOptions) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const [status, setStatus] = useState<ConnectionStatus>('idle')
  const onEventRef = useRef(onEvent)
  const reconnectTimerRef = useRef<number | null>(null)
  const reconnectAttemptRef = useRef(0)
  const socketRef = useRef<WebSocket | null>(null)
  const manualCloseRef = useRef(false)

  useEffect(() => {
    onEventRef.current = onEvent
  }, [onEvent])

  useEffect(() => {
    if (!enabled || !projectId || !isAuthenticated) return
    let cancelled = false

    const cleanupTimers = () => {
      if (reconnectTimerRef.current !== null) {
        window.clearTimeout(reconnectTimerRef.current)
        reconnectTimerRef.current = null
      }
    }

    const closeSocket = () => {
      if (!socketRef.current) return
      socketRef.current.onopen = null
      socketRef.current.onmessage = null
      socketRef.current.onerror = null
      socketRef.current.onclose = null
      socketRef.current.close()
      socketRef.current = null
    }

    const scheduleReconnect = () => {
      cleanupTimers()
      const nextAttempt = Math.min(reconnectAttemptRef.current + 1, 6)
      reconnectAttemptRef.current = nextAttempt
      const delay = Math.min(1000 * 2 ** (nextAttempt - 1), 15000)
      reconnectTimerRef.current = window.setTimeout(() => {
        if (!cancelled) {
          connect()
        }
      }, delay)
    }

    const connect = async () => {
      cleanupTimers()
      setStatus('connecting')

      const refreshOk = await useAuthStore.getState().checkAndRefreshAuth().catch(() => false)
      if (!refreshOk || cancelled) {
        setStatus('disconnected')
        return
      }

      const authInfo = getAuthInfo()
      const token = authInfo?.accessToken
      if (!token) {
        setStatus('disconnected')
        return
      }

      const url = buildWebSocketUrl(projectId)
      const protocols = ['workshop-ws', `nebula-auth.${token}`]

      try {
        const ws = new WebSocket(url, protocols)
        socketRef.current = ws

        ws.onopen = () => {
          if (cancelled) return
          reconnectAttemptRef.current = 0
          setStatus('connected')
        }

        ws.onmessage = (message) => {
          if (cancelled || typeof message.data !== 'string') return
          try {
            const payload = JSON.parse(message.data) as ProjectSocketEvent
            if (!payload || !payload.event) return
            onEventRef.current?.(payload)
          } catch (error) {
            console.warn('⚠️ WebSocket 消息解析失败:', error)
          }
        }

        ws.onerror = (error) => {
          if (cancelled) return
          console.warn('⚠️ WebSocket 连接异常:', error)
        }

        ws.onclose = () => {
          if (cancelled) return
          setStatus('disconnected')
          if (!manualCloseRef.current) {
            scheduleReconnect()
          }
        }
      } catch (error) {
        console.warn('⚠️ WebSocket 连接失败:', error)
        if (!cancelled) {
          setStatus('disconnected')
          scheduleReconnect()
        }
      }
    }

    manualCloseRef.current = false
    connect()

    return () => {
      cancelled = true
      manualCloseRef.current = true
      cleanupTimers()
      closeSocket()
    }
  }, [enabled, projectId, isAuthenticated])

  return { status }
}
