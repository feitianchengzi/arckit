import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, act } from '@testing-library/react'
import { FeedbackConversationPanel } from '@/components/sdk/FeedbackConversationPanel'

vi.mock('@/lib/feedback/v2', () => ({
  getFeedbackMessagesV2: vi.fn(),
  createFeedbackMessageV2: vi.fn(),
  markFeedbackNotificationsReadV2: vi.fn(),
}))
vi.mock('@/lib/feedback/upload', () => ({
  uploadFeedbackFileV2: vi.fn(),
}))
vi.mock('@/lib/sdk', () => ({
  isFeedbackSDKV2NotificationsEnabled: vi.fn().mockReturnValue(false),
}))

import { getFeedbackMessagesV2 } from '@/lib/feedback/v2'

describe('FeedbackConversationPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('加载消息后自动滚动到底部（调用 scrollIntoView）', async () => {
    vi.mocked(getFeedbackMessagesV2).mockResolvedValue([
      { id: 1, feedback_id: 1, project_id: 1, sender_type: 'developer', message_type: 'text', content: '最新一条消息', attachments: [], created_at: '2026-09-23T00:00:00Z', updated_at: '2026-09-23T00:00:00Z' },
    ])
    const scrollIntoViewSpy = vi.spyOn(Element.prototype, 'scrollIntoView')

    render(<FeedbackConversationPanel feedbackId="1" />)
    await waitFor(() => expect(screen.getByText('最新一条消息')).toBeInTheDocument())
    // 消息变化后应触发滚动锚点 scrollIntoView
    expect(scrollIntoViewSpy).toHaveBeenCalled()
  })

  it('refreshKey 变化时重新拉取消息', async () => {
    vi.mocked(getFeedbackMessagesV2).mockResolvedValue([])

    const { rerender } = render(<FeedbackConversationPanel feedbackId="1" refreshKey={0} />)
    await waitFor(() => expect(getFeedbackMessagesV2).toHaveBeenCalledTimes(1))

    vi.mocked(getFeedbackMessagesV2).mockResolvedValue([
      { id: 9, feedback_id: 1, project_id: 1, sender_type: 'developer', message_type: 'text', content: '刷新后的消息', attachments: [], created_at: '2026-09-23T00:00:01Z', updated_at: '2026-09-23T00:00:01Z' },
    ])
    act(() => {
      rerender(<FeedbackConversationPanel feedbackId="1" refreshKey={1} />)
    })
    await waitFor(() => expect(getFeedbackMessagesV2).toHaveBeenCalledTimes(2))
    await waitFor(() => expect(screen.getByText('刷新后的消息')).toBeInTheDocument())
  })
})
