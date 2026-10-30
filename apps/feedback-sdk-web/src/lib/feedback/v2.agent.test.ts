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
})


describe('confirmed structured feedback submission', () => {
  it('persists customer-reviewed structure and conversation association in session mode', async () => {
    mockAuthMode = 'session'
    mockConfig = { gatewayUrl: 'https://gw.example', feedbackSessionToken: 'fbs_session_token' }
    mockResponse({ id: 42, short_id: 'E2E42' })
    const structured = { position: '订单列表', phenomenon: '点击导出无响应', expect: '成功下载', impact: '财务不能对账', unknown_fields: ['environment'] }
    await submitFeedbackV2({ content: '已确认的导出问题', conversationId: 'conv-before-submit', structured })
    const body = JSON.parse(lastCall().init.body as string)
    expect(body.data.structured).toEqual(structured)
    expect(body.data.clarification.confirmed).toBe(true)
    expect(body.conversation_id).toBe('conv-before-submit')
  })
})

describe('feedback lifecycle transport contracts', () => {
  beforeEach(() => { fetchMock.mockReset(); mockAuthMode = 'session'; mockConfig = { gatewayUrl: 'https://gw.example', feedbackSessionToken: 'fbs_test' } })
  it('sends search, date and status to the server rather than filtering one client page', async () => {
    const { fetchFeedbackItemsV2 } = await import('./v2')
    mockResponse([])
    await fetchFeedbackItemsV2({ page: 2, pageSize: 20, query: 'Chrome', status: 'processing', dateFrom: '2026-10-01T00:00:00Z', dateTo: '2026-10-30T00:00:00Z', dateField: 'updated' })
    const url = new URL(lastCall().url)
    expect(Object.fromEntries(url.searchParams)).toMatchObject({ q: 'Chrome', status: 'processing', date_from: '2026-10-01T00:00:00Z', date_to: '2026-10-30T00:00:00Z', date_field: 'updated', page: '2' })
  })
  it('loads unified conversation pages including pre-submission Agent records', async () => {
    const { getConversationMessagesPageV2 } = await import('./v2')
    fetchMock.mockResolvedValueOnce({ ok: true, json: async () => ({ code: 'OK', data: [{ id: 1, source: 'agent', content: '原咨询' }], meta: { total: 101 } }) })
    const page = await getConversationMessagesPageV2(9, { page: 2, pageSize: 50 })
    expect(lastCall().url).toContain('/feedbacks/9/conversation-messages?page=2&page_size=50')
    expect(page.total).toBe(101)
    expect(page.messages[0].source).toBe('agent')
  })
  it('keeps acceptance bound to a published conclusion and stable request id', async () => {
    const { respondFeedbackConclusionV2 } = await import('./v2')
    mockResponse({})
    await respondFeedbackConclusionV2(9, 3, 'accepted')
    expect(JSON.parse(lastCall().init.body as string)).toMatchObject({ response: 'accepted' })
  })
})

it('propagates explicit new consultation without forcing ordinary initial messages into a new conversation', async () => {
  const { sendStandaloneAgentMessage } = await import('./v2')
  mockAuthMode = 'session'; mockConfig = { gatewayUrl: 'https://gw.example', feedbackSessionToken: 'token' }
  mockResponse({ conversation_id: 'new', content: 'ok' })
  await sendStandaloneAgentMessage({ content: '新问题', newConversation: true } as Parameters<typeof sendStandaloneAgentMessage>[0])
  expect(JSON.parse(lastCall().init.body as string).new_conversation).toBe(true)
  mockResponse({ conversation_id: 'existing', content: 'ok' })
  await sendStandaloneAgentMessage({ content: '继续' })
  expect(JSON.parse(lastCall().init.body as string).new_conversation).toBeUndefined()
})

describe('session refresh and service failures', () => {
  beforeEach(() => {
    fetchMock.mockReset()
    mockAuthMode = 'session'
    mockConfig = { gatewayUrl: 'https://gw.example', feedbackSessionToken: 'expired-session' }
  })
  it('reports a refresh failure without exposing raw diagnostics or retrying the operation', async () => {
    const { requestFeedbackSessionRefresh } = await import('@/lib/sdk/bridge')
    vi.mocked(requestFeedbackSessionRefresh).mockRejectedValueOnce(new Error('internal host bridge secret'))
    fetchMock.mockResolvedValueOnce({ ok: false, status: 401 } as Response)
    await expect(getAgentConversations(123)).rejects.toThrow('会话已失效，请关闭后重新打开帮助与反馈。')
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })
  it('does not turn an invalid successful response into an empty conversation history', async () => {
    fetchMock.mockResolvedValueOnce(new Response('{}', { status: 200 }))
    await expect(getAgentConversations(123)).rejects.toThrow('服务暂时不可用，请稍后重试。')
  })
})


it('never replays an old customer request with a newly configured customer token', async () => {
  const { requestFeedbackSessionRefresh } = await import('@/lib/sdk/bridge')
  fetchMock.mockReset()
  const token = (customer: string) => 'fbs_' + btoa(JSON.stringify({ project_id: 7, custom_user_id: customer })) + '.signature'
  mockAuthMode = 'session'
  mockConfig = { gatewayUrl: 'https://gw.example', feedbackSessionToken: token('old') }
  fetchMock.mockResolvedValueOnce({ ok: false, status: 401, json: async () => ({}) })
  vi.mocked(requestFeedbackSessionRefresh).mockImplementationOnce(async () => { mockConfig = { ...mockConfig, feedbackSessionToken: token('new') } })
  await expect(getAgentConversations(123)).rejects.toThrow('当前账号已变化')
  expect(fetchMock).toHaveBeenCalledTimes(1)
})
