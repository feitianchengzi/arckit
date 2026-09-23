import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { AgentChatPanel } from '@/components/sdk/AgentChatPanel'

// 屏蔽 v2 模块的真实网络调用，仅关心渲染产物。
vi.mock('@/lib/feedback/v2', () => {
  const fakeHistory = (): import('@/lib/feedback/v2').AgentMessage[] => []
  return {
    sendAgentMessage: vi.fn(),
    getAgentConversations: vi.fn().mockResolvedValue([]),
    getAgentConversationMessages: vi.fn().mockResolvedValue(fakeHistory()),
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
