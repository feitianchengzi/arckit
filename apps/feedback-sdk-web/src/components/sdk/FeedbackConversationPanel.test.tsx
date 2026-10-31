import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { FeedbackConversationPanel } from './FeedbackConversationPanel'
vi.mock('@/lib/feedback/v2', () => ({ getConversationMessagesPageV2: vi.fn(), createFeedbackMessageV2: vi.fn(), markFeedbackNotificationsReadV2: vi.fn() }))
vi.mock('@/lib/sdk', () => ({ isFeedbackSDKV2NotificationsEnabled: vi.fn().mockReturnValue(false) }))
import { getConversationMessagesPageV2 } from '@/lib/feedback/v2'
const msg = (id: number, source: 'agent' | 'feedback', content: string) => ({ id, source, sender_type: 'agent' as const, content, created_at: `2026-10-01T00:00:${String(id).padStart(2, '0')}Z` })
describe('complete feedback conversation', () => {
  beforeEach(() => vi.clearAllMocks())
  it('shows pre-submission Agent records and loads remaining history', async () => {
    vi.mocked(getConversationMessagesPageV2).mockResolvedValueOnce({ messages: [msg(1, 'agent', '原咨询')], total: 2 }).mockResolvedValueOnce({ messages: [msg(2, 'feedback', '团队回复')], total: 2 })
    render(<FeedbackConversationPanel feedbackId="9" />)
    expect(await screen.findByText('原咨询')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: '加载更多沟通记录' }))
    expect(await screen.findByText('团队回复')).toBeInTheDocument()
    expect(getConversationMessagesPageV2).toHaveBeenLastCalledWith(9, { page: 2, pageSize: 50 })
  })
  it('refreshes the same loaded history range on a realtime event', async () => {
    vi.mocked(getConversationMessagesPageV2).mockResolvedValue({ messages: [], total: 0 })
    const { rerender } = render(<FeedbackConversationPanel feedbackId="9" refreshKey={0} />)
    await waitFor(() => expect(getConversationMessagesPageV2).toHaveBeenCalledTimes(1))
    rerender(<FeedbackConversationPanel feedbackId="9" refreshKey={1} />)
    await waitFor(() => expect(getConversationMessagesPageV2).toHaveBeenCalledTimes(2))
  })
})
