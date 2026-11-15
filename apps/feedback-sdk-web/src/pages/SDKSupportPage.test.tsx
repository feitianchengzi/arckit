import { beforeEach, describe, expect, it, vi } from 'vitest'
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { SDKSupportPage } from './SDKSupportPage'
import { fetchFeedbackItemsV2, submitFeedbackV2, getFeedbackLifecycleV2 } from '@/lib/feedback/v2'
vi.mock('@/lib/feedback/v2', () => ({ fetchFeedbackItemsV2: vi.fn(), fetchFeedbackNotificationsV2: vi.fn(), submitFeedbackV2: vi.fn(), getFeedbackLifecycleV2: vi.fn() }))
vi.mock('@/lib/feedback/realtime', () => ({ useFeedbackRealtime: vi.fn() }))
const { sdkConfig } = vi.hoisted(() => ({ sdkConfig: { current: {} as Record<string, unknown> } }))
vi.mock('@/lib/sdk', () => ({ FEEDBACK_SDK_CONFIGURED_EVENT: 'configured', getFeedbackSDKConfig: () => sdkConfig.current, isFeedbackSDKV2NotificationsEnabled: () => false, notifyFeedbackSDKUnreadCount: vi.fn() }))
vi.mock('@/components/sdk/FeedbackConversationPanel', () => ({ FeedbackConversationPanel: () => <p>关联沟通记录</p> }))
vi.mock('@/components/sdk/FeedbackLifecyclePanel', () => ({ FeedbackLifecyclePanel: () => <p>关联流转记录</p> }))
vi.mock('@/components/sdk/AgentChatPanel', () => ({ AgentChatPanel: ({ onNeedCollect, onConversationReady, children }: any) => <div><input aria-label="咨询草稿" /><button onClick={() => { onConversationReady('conv-1'); onNeedCollect({ question: '无法导出', structured: { request_type: 'bug', position: '订单', phenomenon: '导出失败', expect: '成功导出', unknown_fields: ['reproduction_steps', 'environment', 'impact'] } }) }}>Agent完成分析</button>{children}</div> }))
const mount = (path = '/submit') => render(<MemoryRouter initialEntries={[path]}><SDKSupportPage /></MemoryRouter>)
beforeEach(() => { sessionStorage.clear(); sdkConfig.current = {}; vi.clearAllMocks(); vi.mocked(getFeedbackLifecycleV2).mockResolvedValue({ feedback: { id: 12, title: '反馈', content: '原始说明', data: JSON.stringify({ structured: { position: '报表页面', phenomenon: '加载失败', expect: '正常显示', unknown_fields: ['environment'] } }) }, events: [], conclusions: [], responses: [] } as never); vi.mocked(fetchFeedbackItemsV2).mockResolvedValue({ items: [], total: 0 } as never); vi.mocked(submitFeedbackV2).mockResolvedValue({ id: 12, shortId: 'FB-12' }) })
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


describe('manual feedback and customer isolation', () => {
  it('allows confirmed real feedback without a model conversation and keeps the retry request id', async () => {
    sessionStorage.clear()
    vi.mocked(submitFeedbackV2).mockRejectedValueOnce(new Error('服务暂时不可用，请重试。'))
    mount(); fireEvent.click(screen.getByRole('button', { name: '仍未解决 / 直接反馈' }))
    fireEvent.change(screen.getByLabelText('问题位置'), { target: { value: '订单页' } })
    fireEvent.change(screen.getByLabelText('实际现象'), { target: { value: '无法保存' } })
    fireEvent.change(screen.getByLabelText('期望结果'), { target: { value: '成功保存' } })
    expect(screen.getByRole('button', { name: '确认提交反馈' })).toBeDisabled()
    fireEvent.click(screen.getByRole('checkbox', { name: '我已核对以上事实，确认提交给处理团队' }))
    fireEvent.click(screen.getByRole('button', { name: '确认提交反馈' }))
    await screen.findByText('服务暂时不可用，请重试。')
    expect(screen.getByLabelText('实际现象')).toHaveValue('无法保存')
    const id = vi.mocked(submitFeedbackV2).mock.calls[0][0].clientRequestId
    fireEvent.click(screen.getByRole('button', { name: '确认提交反馈' }))
    await screen.findByText('已提交信息')
    expect(submitFeedbackV2).toHaveBeenLastCalledWith(expect.objectContaining({ clientRequestId: id, conversationId: undefined, structured: expect.objectContaining({ request_type: 'other' }) }))
  })
  it('shows the submitted structured snapshot and original description', async () => {
    mount('/status?feedback=12')
    await screen.findByText('报表页面'); expect(screen.getByText('原始说明')).toBeInTheDocument(); expect(screen.getByText('待确认信息')).toBeInTheDocument()
  })
  it('clears the old customer interface on configure, but token refresh preserves same identity', async () => {
    sdkConfig.current = { gatewayUrl: 'https://example.test', feedbackV2AuthMode: 'apiKey', projectId: 1, customUserId: 'alice' }
    mount(); fireEvent.change(screen.getByLabelText('咨询草稿'), { target: { value: 'Alice 的草稿' } })
    sdkConfig.current = { ...sdkConfig.current, customUserId: 'bob' }; act(() => window.dispatchEvent(new Event('configured')))
    await waitFor(() => expect(screen.getByLabelText('咨询草稿')).toHaveValue(''))
    fireEvent.change(screen.getByLabelText('咨询草稿'), { target: { value: 'Bob 的草稿' } })
    act(() => window.dispatchEvent(new Event('configured')))
    await waitFor(() => expect(screen.getByLabelText('咨询草稿')).toHaveValue('Bob 的草稿'))
  })
})

it('restores manual facts after returning, and requires fresh confirmation', async () => {
  sessionStorage.clear()
  mount(); fireEvent.click(screen.getByRole('button', { name: '仍未解决 / 直接反馈' }))
  fireEvent.change(screen.getByLabelText('问题位置'), { target: { value: '导出页面' } })
  fireEvent.click(screen.getByRole('checkbox', { name: '我已核对以上事实，确认提交给处理团队' }))
  fireEvent.click(screen.getByRole('button', { name: '返回咨询并保留草稿' }))
  fireEvent.click(screen.getByRole('button', { name: '仍未解决 / 直接反馈' }))
  expect(screen.getByLabelText('问题位置')).toHaveValue('导出页面')
  expect(screen.getByRole('checkbox', { name: '我已核对以上事实，确认提交给处理团队' })).not.toBeChecked()
})

it('retains customer UI on same-scope signed session renewal and resets for another customer', async () => {
  const token = (customer: string, issued: number) => `fbs_${btoa(JSON.stringify({ project_id: 1, custom_user_id: customer, iat: issued })).replace(/=/g, '')}.signature`
  sdkConfig.current = { gatewayUrl: 'https://example.test', feedbackV2AuthMode: 'session', feedbackSessionToken: token('alice', 1) }
  mount(); fireEvent.change(screen.getByLabelText('咨询草稿'), { target: { value: '保留我的咨询' } })
  sdkConfig.current = { ...sdkConfig.current, feedbackSessionToken: token('alice', 2) }
  act(() => window.dispatchEvent(new Event('configured')))
  expect(screen.getByLabelText('咨询草稿')).toHaveValue('保留我的咨询')
  sdkConfig.current = { ...sdkConfig.current, feedbackSessionToken: token('bob', 3) }
  act(() => window.dispatchEvent(new Event('configured')))
  await waitFor(() => expect(screen.getByLabelText('咨询草稿')).toHaveValue(''))
})
