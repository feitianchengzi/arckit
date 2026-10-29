import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { SDKSupportPage } from './SDKSupportPage'
import { fetchFeedbackItemsV2, submitFeedbackV2 } from '@/lib/feedback/v2'
vi.mock('@/lib/feedback/v2', () => ({ fetchFeedbackItemsV2: vi.fn(), fetchFeedbackNotificationsV2: vi.fn(), submitFeedbackV2: vi.fn() }))
vi.mock('@/lib/feedback/realtime', () => ({ useFeedbackRealtime: vi.fn() }))
vi.mock('@/lib/sdk', () => ({ FEEDBACK_SDK_CONFIGURED_EVENT: 'configured', getFeedbackSDKConfig: () => ({}), isFeedbackSDKV2NotificationsEnabled: () => false, notifyFeedbackSDKUnreadCount: vi.fn() }))
vi.mock('@/components/sdk/FeedbackConversationPanel', () => ({ FeedbackConversationPanel: () => <p>关联沟通记录</p> }))
vi.mock('@/components/sdk/FeedbackLifecyclePanel', () => ({ FeedbackLifecyclePanel: () => <p>关联流转记录</p> }))
vi.mock('@/components/sdk/AgentChatPanel', () => ({ AgentChatPanel: ({ onNeedCollect, onConversationReady }: any) => <div><input aria-label="咨询草稿" /><button onClick={() => { onConversationReady('conv-1'); onNeedCollect({ question: '无法导出', structured: { request_type: 'bug', position: '订单', phenomenon: '导出失败', expect: '成功导出', unknown_fields: ['reproduction_steps', 'environment', 'impact'] } }) }}>Agent完成分析</button></div> }))
const mount = (path = '/submit') => render(<MemoryRouter initialEntries={[path]}><SDKSupportPage /></MemoryRouter>)
beforeEach(() => { vi.clearAllMocks(); vi.mocked(fetchFeedbackItemsV2).mockResolvedValue({ items: [], total: 0 } as never); vi.mocked(submitFeedbackV2).mockResolvedValue({ id: 12, shortId: 'FB-12' }) })
describe('embedded support application', () => {
  it('keeps the consulting draft mounted while viewing feedback', async () => {
    mount(); fireEvent.change(screen.getByLabelText('咨询草稿'), { target: { value: '尚未发送的问题' } })
    fireEvent.click(screen.getByRole('button', { name: '我的反馈' }))
    await waitFor(() => expect(fetchFeedbackItemsV2).toHaveBeenCalled())
    fireEvent.click(screen.getByRole('button', { name: '智能客服' }))
    expect(screen.getByLabelText('咨询草稿')).toHaveValue('尚未发送的问题')
  })
  it('requires fact confirmation after autonomous Agent classification before creating one card', async () => {
    mount(); fireEvent.click(screen.getByText('Agent完成分析'))
    expect(screen.queryByRole('combobox')).toBeNull()
    const create = screen.getByRole('button', { name: '确认并创建反馈卡片' })
    expect(create).toBeDisabled(); expect(submitFeedbackV2).not.toHaveBeenCalled()
    fireEvent.click(screen.getByRole('button', { name: '确认以上信息，准备提交反馈' }))
    fireEvent.click(create); fireEvent.click(create)
    await screen.findByText('反馈 FB-12 已提交')
    expect(submitFeedbackV2).toHaveBeenCalledOnce()
    expect(submitFeedbackV2).toHaveBeenCalledWith(expect.objectContaining({ conversationId: 'conv-1', structured: expect.objectContaining({ request_type: 'bug' }) }))
  })
  it('sends search and date/status filters to the scoped server query', async () => {
    mount('/status')
    fireEvent.change(screen.getByLabelText('反馈状态'), { target: { value: 'developing' } })
    fireEvent.change(screen.getByLabelText('开始日期'), { target: { value: '2026-10-01' } })
    fireEvent.change(screen.getByLabelText('搜索反馈问题'), { target: { value: '导出' } })
    await waitFor(() => expect(fetchFeedbackItemsV2).toHaveBeenLastCalledWith(expect.objectContaining({ query: '导出', status: 'developing', dateFrom: expect.stringContaining('2026-') })))
  })
  it('opens the feedback selected by the host deep link', async () => {
    mount('/chat?feedback=12'); await waitFor(() => expect(fetchFeedbackItemsV2).toHaveBeenCalled()); expect(screen.getByText('关联沟通记录')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: '卡片流转' })); expect(screen.getByText('关联流转记录')).toBeInTheDocument()
  })
})
