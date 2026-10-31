import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { AgentChatPanel } from '@/components/sdk/AgentChatPanel'

// 屏蔽 v2 模块的真实网络调用，仅关心渲染产物。
vi.mock('@/lib/feedback/v2', () => {
  const fakeHistory = (): import('@/lib/feedback/v2').AgentMessage[] => []
  const standaloneMessages = vi.fn().mockResolvedValue(fakeHistory())
  return {
    getAgentCapabilities: vi.fn().mockResolvedValue({ image_understanding: false }),
    sendAgentMessage: vi.fn(),
    getAgentConversations: vi.fn().mockResolvedValue([]),
    getAgentConversationMessages: vi.fn().mockResolvedValue(fakeHistory()),
    // 独立客服会话（standalone）API：不绑定 feedback
    sendStandaloneAgentMessage: vi.fn(),
    getStandaloneAgentConversations: vi.fn().mockResolvedValue([]),
    getStandaloneAgentMessages: standaloneMessages,
    getStandaloneAgentMessagesPage: vi.fn(async (id: string) => { const messages = await standaloneMessages(id); return { messages, total: messages.length } }),
    // escalateFeedbackV2 不应再被引用；若仍被 import 会因不存在而失败测试。
  }
})

describe('AgentChatPanel 转人工入口', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('不再渲染"转人工"入口与文案', async () => {
    render(<AgentChatPanel feedbackId="123" />)
    await waitFor(() => expect(screen.queryByText(/正在加载会话/)).toBeNull())
    // 不存在转人工按钮
    expect(screen.queryByRole('button', { name: /转人工/ })).toBeNull()
    // 不存在转人工相关文案
    expect(screen.queryByText(/转人工/)).toBeNull()
    expect(screen.queryByText(/把握不足/)).toBeNull()
    expect(screen.queryByText(/已升级人工/)).toBeNull()
  })

  it('历史中存在低置信 agent 回复时仍不出现转人工入口', async () => {
    const { getAgentConversations, getAgentConversationMessages } = await import('@/lib/feedback/v2')
    vi.mocked(getAgentConversations).mockResolvedValue([
      { id: 'conv-1', feedback_id: 123, project_id: 1, created_at: '2026-09-23T00:00:00Z', updated_at: '2026-09-23T00:00:00Z' },
    ])
    // 历史末尾 agent 消息置信度 0.3，当前实现会据此 setNeedCollect(true) 渲染转人工入口。
    vi.mocked(getAgentConversationMessages).mockResolvedValue([
      {
        id: 1,
        conversation_id: 'conv-1',
        feedback_id: 123,
        project_id: 1,
        sender_type: 'customer',
        content: '帮我看看',
        created_at: '2026-09-23T00:00:00Z',
      },
      {
        id: 2,
        conversation_id: 'conv-1',
        feedback_id: 123,
        project_id: 1,
        sender_type: 'agent',
        content: '我不太确定',
        confidence: 0.3,
        created_at: '2026-09-23T00:00:01Z',
      },
    ])

    render(<AgentChatPanel feedbackId="123" />)
    // 等待历史加载完成（"我不太确定"出现）
    await waitFor(() => expect(screen.getByText('我不太确定')).toBeInTheDocument())
    // 即便低置信，也不应出现转人工入口/文案
    expect(screen.queryByRole('button', { name: /转人工/ })).toBeNull()
    expect(screen.queryByText(/转人工/)).toBeNull()
    expect(screen.queryByText(/把握不足/)).toBeNull()
  })
})

describe('AgentChatPanel 低置信上报', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('本轮 need_collect 时把提问原文交给宿主', async () => {
    const { sendAgentMessage, getAgentConversations } = await import('@/lib/feedback/v2')
    vi.mocked(getAgentConversations).mockResolvedValue([])
    vi.mocked(sendAgentMessage).mockResolvedValue({
      message_id: 9,
      conversation_id: 'conv-x',
      content: '我还不能确定这个答案',
      sender_type: 'agent',
      confidence: 0.2,
      need_collect: true,
    })

    const onNeedCollect = vi.fn()
    render(<AgentChatPanel feedbackId="123" onNeedCollect={onNeedCollect} />)
    await waitFor(() => expect(screen.queryByText(/正在加载会话/)).toBeNull())

    const input = screen.getByPlaceholderText('输入你的问题...')
    fireEvent.change(input, { target: { value: '这个功能怎么用' } })
    fireEvent.keyDown(input, { key: 'Enter' })

    await waitFor(() =>
      expect(onNeedCollect).toHaveBeenCalledWith({ question: '这个功能怎么用', structured: undefined }),
    )
    // 上报不应引入任何「转人工」文案
    expect(screen.queryByText(/转人工/)).toBeNull()
  })

  it('need_collect 时把客服总结的问题结构一并交给宿主', async () => {
    const { sendAgentMessage, getAgentConversations } = await import('@/lib/feedback/v2')
    vi.mocked(getAgentConversations).mockResolvedValue([])
    const structured = { position: '导出页', phenomenon: 'CSV 中文乱码', expect: 'Excel 正常显示中文' }
    vi.mocked(sendAgentMessage).mockResolvedValue({
      message_id: 11,
      conversation_id: 'conv-z',
      content: '我还不确定这个问题的答案',
      sender_type: 'agent',
      confidence: 0.4,
      need_collect: true,
      structured,
    })

    const onNeedCollect = vi.fn()
    render(<AgentChatPanel feedbackId="123" onNeedCollect={onNeedCollect} />)
    await waitFor(() => expect(screen.queryByText(/正在加载会话/)).toBeNull())

    const input = screen.getByPlaceholderText('输入你的问题...')
    fireEvent.change(input, { target: { value: '导出的 CSV 中文是乱码' } })
    fireEvent.keyDown(input, { key: 'Enter' })

    await waitFor(() =>
      expect(onNeedCollect).toHaveBeenCalledWith({
        question: '导出的 CSV 中文是乱码',
        structured,
      }),
    )
  })

  it('高置信时不触发上报', async () => {
    const { sendAgentMessage, getAgentConversations } = await import('@/lib/feedback/v2')
    vi.mocked(getAgentConversations).mockResolvedValue([])
    vi.mocked(sendAgentMessage).mockResolvedValue({
      message_id: 10,
      conversation_id: 'conv-y',
      content: '答案是这样',
      sender_type: 'agent',
      confidence: 0.95,
      need_collect: false,
    })

    const onNeedCollect = vi.fn()
    render(<AgentChatPanel feedbackId="123" onNeedCollect={onNeedCollect} />)
    await waitFor(() => expect(screen.queryByText(/正在加载会话/)).toBeNull())

    const input = screen.getByPlaceholderText('输入你的问题...')
    fireEvent.change(input, { target: { value: '一个能被解决的问题' } })
    fireEvent.keyDown(input, { key: 'Enter' })

    await waitFor(() => expect(screen.getByText('答案是这样')).toBeInTheDocument())
    expect(onNeedCollect).not.toHaveBeenCalled()
  })
})

describe('AgentChatPanel standalone 独立会话', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('历史加载与发送均走独立会话 API，不触碰绑定反馈的 API', async () => {
    const v2 = await import('@/lib/feedback/v2')
    vi.mocked(v2.getStandaloneAgentConversations).mockResolvedValue([
      { id: 'conv-s1', feedback_id: 0, project_id: 11, created_at: '2026-10-12T00:00:00Z', updated_at: '2026-10-12T00:00:00Z' },
    ])
    vi.mocked(v2.getStandaloneAgentMessages).mockResolvedValue([
      {
        id: 1,
        conversation_id: 'conv-s1',
        feedback_id: 0,
        project_id: 11,
        sender_type: 'agent',
        content: '独立会话历史',
        created_at: '2026-10-12T00:00:00Z',
      },
    ])
    vi.mocked(v2.sendStandaloneAgentMessage).mockResolvedValue({
      message_id: 2,
      conversation_id: 'conv-s1',
      content: '独立会话回复',
      sender_type: 'agent',
      confidence: 0.9,
      need_collect: false,
    })

    render(<AgentChatPanel standalone />)

    // 历史走独立会话
    await waitFor(() => expect(screen.getByText('独立会话历史')).toBeInTheDocument())
    expect(v2.getStandaloneAgentConversations).toHaveBeenCalledTimes(1)
    expect(v2.getStandaloneAgentMessages).toHaveBeenCalledWith('conv-s1')
    expect(v2.getAgentConversations).not.toHaveBeenCalled()
    expect(v2.getAgentConversationMessages).not.toHaveBeenCalled()

    // 发送走独立会话
    const input = screen.getByPlaceholderText('输入你的问题...')
    fireEvent.change(input, { target: { value: '独立会话提问' } })
    fireEvent.keyDown(input, { key: 'Enter' })

    await waitFor(() => expect(v2.sendStandaloneAgentMessage).toHaveBeenCalledTimes(1))
    expect(v2.sendStandaloneAgentMessage).toHaveBeenCalledWith(
      expect.objectContaining({ content: '独立会话提问', conversationId: 'conv-s1' }),
    )
    expect(v2.sendAgentMessage).not.toHaveBeenCalled()

    // 独立会话不绑定反馈，参数里不应出现 feedbackId
    const params = vi.mocked(v2.sendStandaloneAgentMessage).mock.calls[0][0]
    expect(params).not.toHaveProperty('feedbackId')

    // 未传 feedbackId 也不应报「反馈编号无效」
    await waitFor(() => expect(screen.getByText('独立会话回复')).toBeInTheDocument())
    expect(screen.queryByText('反馈编号无效')).toBeNull()
  })

  it('发送内容为空时不发请求', async () => {
    const v2 = await import('@/lib/feedback/v2')
    render(<AgentChatPanel standalone />)
    await waitFor(() => expect(screen.queryByText(/正在加载会话/)).toBeNull())

    const input = screen.getByPlaceholderText('输入你的问题...')
    fireEvent.change(input, { target: { value: '   ' } })
    fireEvent.keyDown(input, { key: 'Enter' })

    await waitFor(() => expect(screen.getByText('请输入问题')).toBeInTheDocument())
    expect(v2.sendStandaloneAgentMessage).not.toHaveBeenCalled()
  })

  it('developer 消息标注为「开发者」而非误标为客户', async () => {
    const v2 = await import('@/lib/feedback/v2')
    vi.mocked(v2.getStandaloneAgentConversations).mockResolvedValue([
      { id: 'conv-d1', feedback_id: 0, project_id: 11, created_at: '2026-10-12T00:00:00Z', updated_at: '2026-10-12T00:00:00Z' },
    ])
    // 客服回复经 syncDeveloperReplyToAgentMessages 同步进会话，sender_type=developer
    vi.mocked(v2.getStandaloneAgentMessages).mockResolvedValue([
      {
        id: 1,
        conversation_id: 'conv-d1',
        feedback_id: 0,
        project_id: 11,
        sender_type: 'developer',
        content: '已定位到问题，正在修复',
        created_at: '2026-10-12T00:00:00Z',
      },
    ])

    render(<AgentChatPanel standalone />)
    await waitFor(() => expect(screen.getByText('已定位到问题，正在修复')).toBeInTheDocument())
    // 应显示「开发者」而非「我」（customer）
    expect(screen.getByText('开发者')).toBeInTheDocument()
    expect(screen.queryByText('我')).toBeNull()
  })

  it('会话 ID 确定时通过 onConversationReady 上报宿主', async () => {
    const v2 = await import('@/lib/feedback/v2')
    vi.mocked(v2.getStandaloneAgentConversations).mockResolvedValue([
      { id: 'conv-r1', feedback_id: 0, project_id: 11, created_at: '2026-10-12T00:00:00Z', updated_at: '2026-10-12T00:00:00Z' },
    ])
    vi.mocked(v2.getStandaloneAgentMessages).mockResolvedValue([])

    const onConversationReady = vi.fn()
    render(<AgentChatPanel standalone onConversationReady={onConversationReady} />)
    await waitFor(() => expect(onConversationReady).toHaveBeenCalledWith('conv-r1'))
  })
})


describe('multi-turn clarification continuity', () => {
  it('keeps the same conversation for multiple clarification rounds and prefers server state', async () => {
    const v2 = await import('@/lib/feedback/v2')
    vi.mocked(v2.getStandaloneAgentConversations).mockResolvedValue([])
    vi.mocked(v2.sendStandaloneAgentMessage).mockResolvedValueOnce({ message_id: 1, conversation_id: 'persistent-draft', content: '请补充期望结果', sender_type: 'agent', confidence: 0.3, need_collect: true, clarification: { status: 'collecting', summary: { position: '订单页', phenomenon: '导出无响应', expect: '' }, missing_fields: ['expect'], questions: ['期望结果？'], ready_to_confirm: false } }).mockResolvedValueOnce({ message_id: 2, conversation_id: 'persistent-draft', content: '请核对', sender_type: 'agent', confidence: 0.4, need_collect: true, structured: { position: '订单页', phenomenon: '导出无响应', expect: '下载 CSV' } })
    const collect = vi.fn()
    render(<AgentChatPanel standalone onNeedCollect={collect} />)
    await waitFor(() => expect(screen.queryByText('正在加载会话...')).toBeNull())
    const input = screen.getByPlaceholderText('输入你的问题...')
    fireEvent.change(input, { target: { value: '订单页导出无响应' } }); fireEvent.keyDown(input, { key: 'Enter' })
    await waitFor(() => expect(collect).toHaveBeenCalledTimes(1))
    expect(collect.mock.calls[0][0].structured.position).toBe('订单页')
    fireEvent.change(input, { target: { value: '期望下载 CSV' } }); fireEvent.keyDown(input, { key: 'Enter' })
    await waitFor(() => expect(collect).toHaveBeenCalledTimes(2))
    expect(v2.sendStandaloneAgentMessage).toHaveBeenLastCalledWith(expect.objectContaining({ conversationId: 'persistent-draft', content: '期望下载 CSV' }))
    expect(screen.getByText('请补充期望结果')).toBeInTheDocument()
  })
})

it('requests a new server conversation only for the first successful turn after explicit new consultation', async () => {
  const api = await import('@/lib/feedback/v2')
  vi.mocked(api.getStandaloneAgentConversations).mockResolvedValue([])
  vi.mocked(api.sendStandaloneAgentMessage).mockResolvedValueOnce({ conversation_id: 'new-server', message_id: 55, content: '已分析', sender_type: 'agent' } as never).mockResolvedValueOnce({ conversation_id: 'new-server', message_id: 56, content: '已补充', sender_type: 'agent' } as never)
  render(<AgentChatPanel standalone />)
  await waitFor(() => expect(screen.getByRole('button', { name: '新咨询' })).not.toBeDisabled())
  fireEvent.click(screen.getByRole('button', { name: '新咨询' }))
  fireEvent.change(screen.getByRole('textbox'), { target: { value: '第一个问题' } })
  fireEvent.click(screen.getByRole('button', { name: '发送' }))
  await waitFor(() => expect(api.sendStandaloneAgentMessage).toHaveBeenLastCalledWith(expect.objectContaining({ newConversation: true, conversationId: undefined })))
  await waitFor(() => expect(screen.getByRole('button', { name: '发送' })).not.toBeDisabled())
  fireEvent.change(screen.getByRole('textbox'), { target: { value: '补充说明' } })
  fireEvent.click(screen.getByRole('button', { name: '发送' }))
  await waitFor(() => expect(api.sendStandaloneAgentMessage).toHaveBeenLastCalledWith(expect.objectContaining({ conversationId: 'new-server' })))
  expect(vi.mocked(api.sendStandaloneAgentMessage).mock.calls.at(-1)?.[0].newConversation).not.toBe(true)
})
