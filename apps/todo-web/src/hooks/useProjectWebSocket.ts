/**
 * useProjectWebSocket - 项目实时通知 WebSocket Hook
 */

import { useEffect, useRef, useState } from 'react'
import { getAuthInfo } from '@/lib/utils/tokenManager'
import { useAuthStore } from '@/store/authStore'
import { apiClient } from '@/lib/api/client'
import {
  consumeAcknowledgedPrefix,
  isCursorExpiredCode,
  orderedEventsAfterCursor,
  planProjectRealtimeRecovery,
} from '@/lib/realtime/projectEventStream'

export interface ProjectSocketEvent {
  id?: number
  schema_version?: number
  event: string
  project_id?: number
  entity?: string
  subject_id?: string
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
  onEvent?: (payload: ProjectSocketEvent) => void | Promise<void>
}

type ConnectionStatus = 'idle' | 'connecting' | 'recovering' | 'connected' | 'disconnected'

interface ReplayData {
  events: ProjectSocketEvent[]
  earliest_event_id: number
  latest_event_id: number
  next_after_id: number
  has_more: boolean
}

const cursorKey = (projectId: string) => `workshop.project-events.${projectId}.cursor`

const readCursor = (projectId: string) => {
  const value = window.localStorage.getItem(cursorKey(projectId))
  const cursor = Number(value)
  return Number.isSafeInteger(cursor) && cursor > 0 ? cursor : 0
}

const writeCursor = (projectId: string, cursor: number) => {
  if (Number.isSafeInteger(cursor) && cursor > readCursor(projectId)) {
    window.localStorage.setItem(cursorKey(projectId), String(cursor))
  }
}

const replaceCursor = (projectId: string, cursor: number) => {
  if (Number.isSafeInteger(cursor) && cursor > 0) {
    window.localStorage.setItem(cursorKey(projectId), String(cursor))
  } else {
    window.localStorage.removeItem(cursorKey(projectId))
  }
}

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
  const authRefreshTimerRef = useRef<number | null>(null)
  const reconnectAttemptRef = useRef(0)
  const socketRef = useRef<WebSocket | null>(null)
  const manualCloseRef = useRef(false)

  useEffect(() => {
    onEventRef.current = onEvent
  }, [onEvent])

  useEffect(() => {
    if (!enabled || !projectId || !isAuthenticated) return
    let cancelled = false
    let connectionGeneration = 0

    const cleanupTimers = () => {
      if (reconnectTimerRef.current !== null) {
        window.clearTimeout(reconnectTimerRef.current)
        reconnectTimerRef.current = null
      }
      if (authRefreshTimerRef.current !== null) {
        window.clearTimeout(authRefreshTimerRef.current)
        authRefreshTimerRef.current = null
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
      const generation = ++connectionGeneration
      cleanupTimers()
      setStatus('connecting')

      const refreshOk = await useAuthStore.getState().checkAndRefreshAuth().catch(() => false)
      if (!refreshOk || cancelled || generation !== connectionGeneration) {
        setStatus('disconnected')
        return
      }

      const authInfo = getAuthInfo()
      const token = authInfo?.accessToken
      if (!token) {
        setStatus('disconnected')
        return
      }

      const expiresAt = authInfo.tokenObtainedAt + authInfo.tokenExpiresIn * 1000
      const refreshDelay = Math.max(1000, expiresAt - Date.now() - 5 * 60 * 1000)

      const url = buildWebSocketUrl(projectId)
      const protocols = ['workshop-ws', `nebula-auth.${token}`]

      try {
        const ws = new WebSocket(url, protocols)
        socketRef.current = ws
        authRefreshTimerRef.current = window.setTimeout(() => {
          if (cancelled) return
          closeSocket()
          connect()
        }, refreshDelay)
        let recovering = true
        let recoveryStarted = false
        let realtimeMode: 'unknown' | 'legacy' | 'resumable' = 'unknown'
        const buffered: ProjectSocketEvent[] = []
        const acknowledgements: Array<{ id: number; complete: boolean }> = []
        const deliveries = new Map<number, Promise<void>>()

        const deliver = (payload: ProjectSocketEvent): Promise<void> => {
          const id = Number(payload.id || 0)
          if (!id) return Promise.resolve().then(() => onEventRef.current?.(payload))
          if (id <= readCursor(projectId)) return Promise.resolve()
          const existing = deliveries.get(id)
          if (existing) return existing

          const acknowledgement = { id, complete: false }
          acknowledgements.push(acknowledgement)
          acknowledgements.sort((left, right) => left.id - right.id)
          const delivery = Promise.resolve().then(() => onEventRef.current?.(payload)).then(() => {
            if (cancelled || generation !== connectionGeneration) return
            acknowledgement.complete = true
            const pendingIds = new Set(acknowledgements.map((item) => item.id))
            const confirmedCursor = consumeAcknowledgedPrefix(readCursor(projectId), acknowledgements)
            for (const id of pendingIds) {
              if (!acknowledgements.some((item) => item.id === id)) deliveries.delete(id)
            }
            writeCursor(projectId, confirmedCursor)
          })
          deliveries.set(id, delivery)
          return delivery
        }

        const deliverLegacy = (payload: ProjectSocketEvent): Promise<void> =>
          Promise.resolve().then(() => onEventRef.current?.(payload))

        const replayFromCursor = async (connected: ProjectSocketEvent) => {
          if (recoveryStarted) return
          recoveryStarted = true
          setStatus('recovering')
          const recovery = planProjectRealtimeRecovery(connected, () => readCursor(projectId))
          realtimeMode = recovery.mode

          if (recovery.mode === 'legacy') {
            await deliverLegacy({ event: 'system.resync_required', project_id: Number(projectId), data: { reason: 'legacy_snapshot' } })
            if (cancelled || generation !== connectionGeneration) return
            recovering = false
            for (const payload of buffered) await deliverLegacy(payload)
            buffered.length = 0
            if (cancelled || generation !== connectionGeneration) return
            await deliverLegacy(connected)
            if (cancelled || generation !== connectionGeneration) return
            setStatus('connected')
            return
          }

          const latestAtConnect = recovery.latestEventId
          let cursor = recovery.cursor

          if (recovery.action === 'initial_snapshot') {
            await deliver({ event: 'system.resync_required', project_id: Number(projectId), data: { reason: 'initial_snapshot' } })
            if (cancelled || generation !== connectionGeneration) return
            replaceCursor(projectId, latestAtConnect)
          } else if (recovery.action === 'cursor_ahead') {
            await deliver({ event: 'system.resync_required', project_id: Number(projectId), data: { reason: 'cursor_ahead' } })
            if (cancelled || generation !== connectionGeneration) return
            replaceCursor(projectId, latestAtConnect)
          } else {
            try {
              let hasMore = true
              while (hasMore && cursor < latestAtConnect) {
                const response = await apiClient.get(`/user/projects/${projectId}/events`, { params: { after_id: cursor, limit: 500 } })
                const page = response.data?.data as ReplayData
                const events = orderedEventsAfterCursor(cursor, page?.events || [])
                await Promise.all(events.map(deliver))
                const next = Number(page?.next_after_id || cursor)
                hasMore = Boolean(page?.has_more) && next > cursor
                cursor = next
              }
            } catch (error: any) {
              if (isCursorExpiredCode(error?.response?.data?.code)) {
                await deliver({ event: 'system.resync_required', project_id: Number(projectId), data: { reason: 'cursor_expired' } })
                if (cancelled || generation !== connectionGeneration) return
                replaceCursor(projectId, latestAtConnect)
              } else {
                throw error
              }
            }
          }

          recovering = false
          await Promise.all(orderedEventsAfterCursor(readCursor(projectId), buffered).map(deliver))
          if (cancelled || generation !== connectionGeneration) return
          await deliver(connected)
          if (cancelled || generation !== connectionGeneration) return
          setStatus('connected')
        }

        ws.onopen = () => {
          if (cancelled || generation !== connectionGeneration) return
          reconnectAttemptRef.current = 0
        }

        ws.onmessage = (message) => {
          if (cancelled || generation !== connectionGeneration || typeof message.data !== 'string') return
          try {
            const payload = JSON.parse(message.data) as ProjectSocketEvent
            if (!payload || !payload.event) return
            if (payload.event === 'system.connected') {
              replayFromCursor(payload).catch((error) => {
                console.warn('⚠️ WebSocket 游标恢复失败:', error)
                setStatus('disconnected')
                ws.close()
              })
              return
            }
            if (recovering) buffered.push(payload)
            else {
              const delivery = realtimeMode === 'legacy' ? deliverLegacy(payload) : deliver(payload)
              delivery.catch((error) => {
                console.warn('⚠️ WebSocket 刷新失败:', error)
                setStatus('disconnected')
                ws.close()
              })
            }
          } catch (error) {
            console.warn('⚠️ WebSocket 消息解析失败:', error)
          }
        }

        ws.onerror = (error) => {
          if (cancelled || generation !== connectionGeneration) return
          console.warn('⚠️ WebSocket 连接异常:', error)
        }

        ws.onclose = () => {
          if (cancelled || generation !== connectionGeneration) return
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

    const reconnectNow = () => {
      if (cancelled || document.visibilityState === 'hidden') return
      closeSocket()
      connect()
    }

    manualCloseRef.current = false
    window.addEventListener('online', reconnectNow)
    document.addEventListener('visibilitychange', reconnectNow)
    connect()

    return () => {
      cancelled = true
      connectionGeneration += 1
      manualCloseRef.current = true
      window.removeEventListener('online', reconnectNow)
      document.removeEventListener('visibilitychange', reconnectNow)
      cleanupTimers()
      closeSocket()
    }
  }, [enabled, projectId, isAuthenticated])

  return { status }
}
