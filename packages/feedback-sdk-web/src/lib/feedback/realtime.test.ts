import { describe, it, expect, vi, beforeEach } from 'vitest'

let mockConfig: Record<string, unknown> = {}
let mockAuthMode: 'session' | 'apiKey' | null = null

vi.mock('@/lib/sdk', () => ({
  getFeedbackSDKConfig: () => mockConfig,
  getFeedbackSDKV2AuthMode: () => mockAuthMode,
}))
vi.mock('@/lib/sdk/bridge', () => ({
  requestFeedbackSessionRefresh: vi.fn().mockResolvedValue(undefined),
}))

// buildRealtimeAuth 未导出，通过 useFeedbackRealtime 间接验证连接参数不易；
// 这里直接 import 内部实现需导出。为可测，将 buildRealtimeAuth 命名导出。
import { buildRealtimeAuth } from '@/lib/feedback/realtime'

describe('buildRealtimeAuth V2 realtime 连接参数', () => {
  beforeEach(() => {
    mockConfig = {}
    mockAuthMode = null
  })

  it('session 模式：构造 /v2/feedback/ 路径，subprotocol 携带 fbs_ token，path id 占位', () => {
    mockAuthMode = 'session'
    mockConfig = { gatewayUrl: 'https://gw.example', feedbackSessionToken: 'fbs_token' }

    const auth = buildRealtimeAuth(undefined)
    expect(auth).not.toBeNull()
    expect(auth!.url).toBe('wss://gw.example/workshop/v2/feedback/projects/0/ws')
    expect(auth!.subprotocols).toEqual(['nebula-auth.fbs_token'])
  })

  it('session 模式：http 网关地址转为 ws', () => {
    mockAuthMode = 'session'
    mockConfig = { gatewayUrl: 'http://localhost:8081', feedbackSessionToken: 'fbs_token' }

    const auth = buildRealtimeAuth(undefined)
    expect(auth!.url.startsWith('ws://localhost:8081')).toBe(true)
  })

  it('apiKey 模式：后端尚未提供 WS 路由，返回 null 以退化为轮询（避免 404 死循环）', () => {
    mockAuthMode = 'apiKey'
    mockConfig = {
      gatewayUrl: 'https://gw.example',
      apiKey: 'ak_key',
      projectId: 7,
      customUserId: 'cust_7',
    }

    // apiKey 模式 WS 为后续项；当前不连接，靠 30s 轮询，功能不中断
    expect(buildRealtimeAuth(7)).toBeNull()
  })

  it('未配置 gatewayUrl 时不返回连接参数（避免连到错误端点）', () => {
    mockAuthMode = 'session'
    mockConfig = { feedbackSessionToken: 'fbs_token' }
    expect(buildRealtimeAuth(undefined)).toBeNull()
  })

  it('session 模式缺少 token 时不返回连接参数', () => {
    mockAuthMode = 'session'
    mockConfig = { gatewayUrl: 'https://gw.example' }
    expect(buildRealtimeAuth(undefined)).toBeNull()
  })

  it('apiKey 模式缺少 projectId/customUserId 时不返回连接参数', () => {
    mockAuthMode = 'apiKey'
    mockConfig = { gatewayUrl: 'https://gw.example', apiKey: 'ak_key' }
    expect(buildRealtimeAuth(undefined)).toBeNull()
  })
})
