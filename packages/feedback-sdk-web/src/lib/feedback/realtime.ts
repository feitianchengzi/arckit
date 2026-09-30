import { useEffect, useRef, useCallback, useState } from 'react'
import { getFeedbackSDKConfig, getFeedbackSDKV2AuthMode } from '@/lib/sdk'
import { requestFeedbackSessionRefresh } from '@/lib/sdk/bridge'

export interface FeedbackRealtimeEvent {
  type: 'feedback.updated' | 'feedback.message.created'
  project_id: string
  feedback_id?: number
  message_id?: number
  updated_at?: string
}

interface UseFeedbackRealtimeOptions {
  /** apiKey 模式下指定项目；session 模式由 token scope 决定，可省略 */
  projectId?: number
  onEvent?: (event: FeedbackRealtimeEvent) => void
  enabled?: boolean
}

const wsAuthSubprotocolPrefix = 'nebula-auth.'

interface RealtimeAuth {
  url: string
  /** WebSocket subprotocol(s) to carry the credential (browser WS cannot set headers) */
  subprotocols: string[]
}

// 构造 V2 realtime 连接参数。鉴权通过 Sec-WebSocket-Protocol 携带 token：
// - session 模式：workshop-api 自验证 fbs_ token，project scope 来自 token，path id 仅占位。
// - apiKey 模式：token 为 apiKey，project_id/custom_user_id 经 query 传递（网关校验）。
export function buildRealtimeAuth(projectId?: number): RealtimeAuth | null {
  const cfg = getFeedbackSDKConfig()
  const base = cfg.gatewayUrl?.trim()
  if (!base) return null // gatewayUrl 未配置时不连，避免连到错误端点

  const wsBase = base.replace(/^http/, 'ws')
  const authMode = getFeedbackSDKV2AuthMode()

  if (authMode === 'session') {
    const token = cfg.feedbackSessionToken?.trim()
    if (!token) return null
    // path 中的 id 仅占位，后端以 token scope 决定 project
    const pathId = projectId && projectId > 0 ? projectId : 0
    return {
      url: `${wsBase}/workshop/v2/feedback/projects/${pathId}/ws`,
      subprotocols: [`${wsAuthSubprotocolPrefix}${token}`],
    }
  }

  if (authMode === 'apiKey') {
    // apiKey 模式 WS 通道后端尚未注册（鉴权依赖网关 WS 透传，列为后续项）。
    // 此处不构造连接参数，避免客户端对不存在的端点 404 死循环重连；
    // apiKey 模式退化为 30s 轮询，功能不中断。
    return null
  }

  return null
}

export function useFeedbackRealtime({ projectId, onEvent, enabled = true }: UseFeedbackRealtimeOptions) {
  const wsRef = useRef<WebSocket | null>(null)
  const reconnectTimer = useRef<ReturnType<typeof setTimeout>>()
  const refreshInFlight = useRef(false)
  const everConnected = useRef(false)
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
    if (!enabled) {
      cleanup()
      return
    }

    let cancelled = false

    function scheduleReconnect(delay = 5000) {
      if (cancelled) return
      reconnectTimer.current = setTimeout(connect, delay)
    }

    async function connect() {
      if (cancelled) return
      const auth = buildRealtimeAuth(projectId)
      if (!auth) {
        // 凭证缺失，等待宿主配置后由 config 变化触发重连
        scheduleReconnect(5000)
        return
      }

      try {
        const ws = new WebSocket(auth.url, auth.subprotocols)
        wsRef.current = ws

        ws.onopen = () => {
          if (cancelled) return
          everConnected.current = true
          setConnected(true)
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

        ws.onclose = async () => {
          if (cancelled) return
          setConnected(false)
          // session 模式下若曾连上又断开，可能是 token 过期；请求宿主刷新后再重连。
          const authMode = getFeedbackSDKV2AuthMode()
          if (authMode === 'session' && everConnected.current && !refreshInFlight.current) {
            refreshInFlight.current = true
            try {
              await requestFeedbackSessionRefresh()
            } catch {
              // 刷新失败仍按常规退避重连，宿主稍后可能补发新 token
            } finally {
              refreshInFlight.current = false
            }
          }
          scheduleReconnect(5000)
        }

        ws.onerror = () => {
          ws.close()
        }
      } catch {
        if (!cancelled) scheduleReconnect(5000)
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
