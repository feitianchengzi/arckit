import { describe, it, vi, expect, beforeEach } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { FeedbackLifecyclePanel } from './FeedbackLifecyclePanel'
vi.mock('@/lib/feedback/v2', () => ({ getFeedbackLifecycleV2: vi.fn(), respondFeedbackConclusionV2: vi.fn() }))
import { getFeedbackLifecycleV2, respondFeedbackConclusionV2 } from '@/lib/feedback/v2'
const detail = { feedback: { id: 9 }, events: [{ id: 1, type: 'submitted', status: 'pending', title: '经客户确认提交', created_at: '2026-10-29T00:00:00Z' }], conclusions: [{ id: 3, feedback_id: 9, version: 1, kind: 'delivery', title: '修复完成', body: '权限同步已修复', published_by: 1, created_at: '2026-10-29T00:00:00Z' }], responses: [] }
describe('feedback lifecycle', () => {
  beforeEach(() => { vi.clearAllMocks(); vi.mocked(getFeedbackLifecycleV2).mockResolvedValue(detail as never); vi.mocked(respondFeedbackConclusionV2).mockResolvedValue(undefined) })
  it('does not accept delivery until the customer explicitly confirms', async () => {
    render(<FeedbackLifecyclePanel feedbackId="9" mode="conclusions" />)
    await screen.findByText('权限同步已修复')
    fireEvent.click(screen.getByRole('button', { name: '确认已解决' }))
    expect(respondFeedbackConclusionV2).not.toHaveBeenCalled()
    fireEvent.click(screen.getByRole('button', { name: '确认验收' }))
    await waitFor(() => expect(respondFeedbackConclusionV2).toHaveBeenCalledWith(9, 3, 'accepted', undefined, expect.any(String)))
  })
  it('appends a needs-review response to the same conclusion rather than changing card status', async () => {
    render(<FeedbackLifecyclePanel feedbackId="9" mode="conclusions" />)
    fireEvent.click(await screen.findByRole('button', { name: '仍有问题，补充并请求复核' }))
    fireEvent.change(screen.getByLabelText('补充新的现象或验证结果'), { target: { value: 'Safari仍失败' } })
    fireEvent.click(screen.getByRole('button', { name: '补充到原卡片' }))
    await waitFor(() => expect(respondFeedbackConclusionV2).toHaveBeenCalledWith(9, 3, 'needs_review', 'Safari仍失败', expect.any(String)))
  })
  it('shows client-visible flow events and their factual descriptions', async () => {
    render(<FeedbackLifecyclePanel feedbackId="9" mode="events" />)
    expect(await screen.findByText('经客户确认提交')).toBeInTheDocument()
  })
})
