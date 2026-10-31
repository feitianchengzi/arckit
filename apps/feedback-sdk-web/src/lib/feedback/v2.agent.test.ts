import { describe, it, expect, vi, beforeEach } from 'vitest'

// 捕获 fetch 调用，断言请求路径 / Authorization / body 在两种鉴权模式下的构造。
const fetchMock = vi.fn()
vi.stubGlobal('fetch', fetchMock)

// 控制鉴权模式与配置。每个测试通过 setMode 注入不同配置。
let mockConfig: Record<string, unknown> = {}
let mockAuthMode: 'session' | 'apiKey' | null = null

vi.mock('@/lib/sdk', () => ({
  getFeedbackSDKConfig: () => mockConfig,
  getFeedbackSDKV2AuthMode: () => mockAuthMode,
}))
vi.mock('@/lib/sdk/bridge', () => ({
  requestFeedbackSessionRefresh: vi.fn().mockResolvedValue(undefined),
}))

import { sendAgentMessage, getAgentConversations, getAgentConversationMessages, submitFeedbackV2 } from '@/lib/feedback/v2'

function mockResponse(data: unknown) {
  fetchMock.mockResolvedValueOnce({
    ok: true,
    json: async () => ({ code: 'OK', data }),
  } as Response)
}

function lastCall() {
  const call = fetchMock.mock.calls[fetchMock.mock.calls.length - 1]
  return { url: call[0] as string, init: call[1] as RequestInit }
}

describe('Agent API 鉴权模式', () => {
  beforeEach(() => {
    fetchMock.mockReset()
    mockConfig = { gatewayUrl: 'https://gw.example' }
  })

  it('session 模式：sendAgentMessage 走 /feedback/ 路径，Authorization 为 session token，body 无 custom_user_id', async () => {
    mockAuthMode = 'session'
    mockConfig = { gatewayUrl: 'https://gw.example', feedbackSessionToken: 'fbs_session_token' }
    mockResponse({ message_id: 1, conversation_id: 'c1', content: 'ok', sender_type: 'agent', confidence: 0.9 })

    await sendAgentMessage({ feedbackId: 123, content: '你好', conversationId: 'c1' })

    const { url, init } = lastCall()
    expect(url).toBe('https://gw.example/workshop/v2/feedback/feedbacks/123/agent-message')
    expect((init.headers as Record<string, string>).Authorization).toBe('Bearer fbs_session_token')
    const body = JSON.parse(init.body as string)
    expect(body.content).toBe('你好')
    expect(body.conversation_id).toBe('c1')
    // session 模式 body 不应携带 custom_user_id
    expect(body.custom_user_id).toBeUndefined()
  })

  it('apiKey 模式：sendAgentMessage 走 /apikey/ 路径，Authorization 为 apiKey', async () => {
    mockAuthMode = 'apiKey'
    mockConfig = {
      gatewayUrl: 'https://gw.example',
      apiKey: 'ak_test_key',
      projectId: 7,
      customUserId: 'cust_7',
    }
    mockResponse({ message_id: 2, conversation_id: 'c2', content: 'ok', sender_type: 'agent', confidence: 0.8 })

    await sendAgentMessage({ feedbackId: 123, content: 'hi' })

    const { url, init } = lastCall()
    expect(url).toBe('https://gw.example/workshop/v2/apikey/feedbacks/123/agent-message')
    expect((init.headers as Record<string, string>).Authorization).toBe('Bearer ak_test_key')
  })

  it('提交时只把已经收敛的宿主诊断上下文放入 metadata', async () => {
    mockAuthMode = 'apiKey'
    mockConfig = {
      gatewayUrl: 'https://gw.example',
      apiKey: 'ak_test_key',
      projectId: 115,
      customUserId: 'oms1_v1_example',
      hostContext: { release: 'oms1', module: 'workbench', route: 'overview', requestId: 'request-1' },
    }
    mockResponse({ id: 42, short_id: 'FB-42' })

    await submitFeedbackV2({ content: '页面无法加载' })

    const { init } = lastCall()
    const body = JSON.parse(init.body as string)
    const metadata = JSON.parse(body.data)
    expect(metadata.host_context).toEqual(mockConfig.hostContext)
    expect(metadata).not.toHaveProperty('tenant_id')
    expect(metadata).not.toHaveProperty('subject_id')
  })

  it('session 模式：getAgentConversations 不再因缺少 apiKey 抛错', async () => {
    mockAuthMode = 'session'
    mockConfig = { gatewayUrl: 'https://gw.example', feedbackSessionToken: 'fbs_session_token' }
    mockResponse([{ id: 'c1', feedback_id: 123, project_id: 7, created_at: '', updated_at: '' }])

    const convs = await getAgentConversations(123)
    expect(convs).toHaveLength(1)
    const { url, init } = lastCall()
    expect(url).toBe('https://gw.example/workshop/v2/feedback/feedbacks/123/agent-conversations')
    expect((init.headers as Record<string, string>).Authorization).toBe('Bearer fbs_session_token')
  })

  it('session 模式：getAgentConversationMessages 不再因缺少 apiKey 抛错', async () => {
    mockAuthMode = 'session'
    mockConfig = { gatewayUrl: 'https://gw.example', feedbackSessionToken: 'fbs_session_token' }
    mockResponse([
      { id: 1, conversation_id: 'c1', feedback_id: 123, project_id: 7, sender_type: 'agent', content: 'x', created_at: '' },
    ])

    const msgs = await getAgentConversationMessages('c1')
    expect(msgs).toHaveLength(1)
    const { url, init } = lastCall()
    expect(url).toBe('https://gw.example/workshop/v2/feedback/agent-conversations/c1/messages')
    expect((init.headers as Record<string, string>).Authorization).toBe('Bearer fbs_session_token')
  })

  it('apiKey 模式：从反馈聊天投影读取历史并转换 sender 字段', async () => {
    mockAuthMode = 'apiKey'
    mockConfig = {
      gatewayUrl: 'https://gw.example',
      apiKey: 'ak_test_key',
      projectId: 7,
      customUserId: 'cust_7',
    }
    mockResponse([
      { id: 3, sender: 'developer', content: '已修复', confidence: 0.9, created_at: '2026-10-31T00:00:00Z' },
    ])

    const msgs = await getAgentConversationMessages('c1', 132)

    expect(msgs).toEqual([
      {
        id: 3,
        conversation_id: 'c1',
        feedback_id: 132,
        project_id: 0,
        sender_type: 'developer',
        content: '已修复',
        confidence: 0.9,
        created_at: '2026-10-31T00:00:00Z',
      },
    ])
    const { url, init } = lastCall()
    expect(url).toBe('https://gw.example/workshop/v2/apikey/feedbacks/132/agent-messages')
    expect((init.headers as Record<string, string>).Authorization).toBe('Bearer ak_test_key')
  })
})
