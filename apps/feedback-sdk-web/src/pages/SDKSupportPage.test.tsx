import { beforeEach, describe, expect, it, vi } from 'vitest'
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { SDKSupportPage } from './SDKSupportPage'
import { fetchFeedbackItemsV2, submitFeedbackV2, getFeedbackLifecycleV2 } from '@/lib/feedback/v2'
vi.mock('@/lib/feedback/v2', () => ({ fetchFeedbackItemsV2: vi.fn(), fetchFeedbackNotificationsV2: vi.fn(), submitFeedbackV2: vi.fn(), getFeedbackLifecycleV2: vi.fn() }))
vi.mock('@/lib/feedback/realtime', () => ({ useFeedbackRealtime: vi.fn() }))
const { sdkConfig, agentSendImpl } = vi.hoisted(() => ({
  sdkConfig: { current: {} as Record<string, unknown> },
  agentSendImpl: vi.fn(async (_text: string, _hooks: { onNeedCollect: (payload: unknown) => void; onConversationReady: (id: string) => void }) => {}),
}))
vi.mock('@/lib/sdk', () => ({ FEEDBACK_SDK_CONFIGURED_EVENT: 'configured', getFeedbackSDKConfig: () => sdkConfig.current, isFeedbackSDKV2NotificationsEnabled: () => false, notifyFeedbackSDKUnreadCount: vi.fn() }))
vi.mock('@/components/sdk/FeedbackConversationPanel', () => ({ FeedbackConversationPanel: () => <p>关联沟通记录</p> }))
vi.mock('@/components/sdk/FeedbackLifecyclePanel', () => ({ FeedbackLifecyclePanel: () => <p>关联流转记录</p> }))
vi.mock('@/components/sdk/AgentChatPanel', async () => {
  const React = await import('react')
  return {
    AgentChatPanel: React.forwardRef(function MockAgentChatPanel({ onNeedCollect, onConversationReady, onDirectFeedback, children }: any, ref: any) {
      React.useImperativeHandle(ref, () => ({
        send: async (text: string) => agentSendImpl(text, { onNeedCollect, onConversationReady }),
      }))
      return <div><input aria-label="咨询草稿" /><button onClick={() => { onConversationReady('conv-1'); onNeedCollect({ question: '无法导出', structured: { request_type: 'bug', position: '订单', phenomenon: '导出失败', expect: '成功导出', unknown_fields: ['reproduction_steps', 'environment', 'impact'] } }) }}>Agent完成分析</button>{onDirectFeedback && <button onClick={onDirectFeedback}>直接反馈</button>}{children}</div>
    }),
  }
})
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
    fireEvent.click(screen.getByText('核对问题信息'))
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
  it('keeps outside clicks inert and closes only from the explicit button', () => {
    const postMessage = vi.spyOn(window, 'postMessage').mockImplementation(() => {})
    mount(); postMessage.mockClear()
    fireEvent.mouseDown(document.body); fireEvent.click(document.body)
    expect(postMessage).not.toHaveBeenCalled()
    fireEvent.click(screen.getByRole('button', { name: '关闭帮助与反馈' }))
    expect(postMessage).toHaveBeenCalledOnce()
    expect(postMessage).toHaveBeenCalledWith({ source: 'feedback-sdk-web', type: 'feedback-sdk:close' }, '*')
    postMessage.mockRestore()
  })
})


describe('manual feedback and customer isolation', () => {
  it('allows confirmed real feedback without a model conversation and keeps the retry request id', async () => {
    sessionStorage.clear()
    vi.mocked(submitFeedbackV2).mockRejectedValueOnce(new Error('服务暂时不可用，请重试。'))
    mount(); expect(screen.getAllByRole('button', { name: '直接反馈' })).toHaveLength(1); fireEvent.click(screen.getByRole('button', { name: '直接反馈' }))
    fireEvent.change(screen.getByLabelText('在哪里遇到的？'), { target: { value: '订单页' } })
    fireEvent.change(screen.getByLabelText('你看到了什么？'), { target: { value: '无法保存' } })
    fireEvent.change(screen.getByLabelText('你本来想做什么？'), { target: { value: '成功保存' } })
    expect(screen.getByRole('button', { name: '确认提交反馈' })).toBeDisabled()
    fireEvent.click(screen.getByRole('checkbox', { name: '我已核对以上事实，确认提交给处理团队' }))
    fireEvent.click(screen.getByRole('button', { name: '确认提交反馈' }))
    await screen.findByText('服务暂时不可用，请重试。')
    expect(screen.getByLabelText('你看到了什么？')).toHaveValue('无法保存')
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
  mount(); fireEvent.click(screen.getByRole('button', { name: '直接反馈' }))
  fireEvent.change(screen.getByLabelText('在哪里遇到的？'), { target: { value: '导出页面' } })
  fireEvent.click(screen.getByRole('checkbox', { name: '我已核对以上事实，确认提交给处理团队' }))
  fireEvent.click(screen.getByRole('button', { name: '返回咨询并保留草稿' }))
  fireEvent.click(screen.getByRole('button', { name: '直接反馈' }))
  expect(screen.getByLabelText('在哪里遇到的？')).toHaveValue('导出页面')
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

describe('direct feedback routing（核对优先，C3）', () => {
  it('structured 在场时点「直接反馈」进入核对而非空白手填', () => {
    mount()
    fireEvent.click(screen.getByText('Agent完成分析'))
    expect(screen.getByLabelText('核对结构化反馈')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: '直接反馈' }))
    expect(screen.queryByLabelText('在哪里遇到的？')).toBeNull()
    expect(screen.getByLabelText('核对结构化反馈')).toBeInTheDocument()
  })

  it('核对态可改直填，返回后回到核对且 structured 事实不丢', () => {
    mount()
    fireEvent.click(screen.getByText('Agent完成分析'))
    fireEvent.click(screen.getByRole('button', { name: '改为直接填写' }))
    expect(screen.getByLabelText('在哪里遇到的？')).toBeInTheDocument()
    expect(screen.queryByLabelText('核对结构化反馈')).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: '返回咨询并保留草稿' }))
    expect(screen.getByLabelText('核对结构化反馈')).toBeInTheDocument()
    expect(screen.getByLabelText('期望结果')).toHaveValue('成功导出')
  })

  it('无结构化时点「直接反馈」直接进手填', () => {
    mount()
    fireEvent.click(screen.getByRole('button', { name: '直接反馈' }))
    expect(screen.getByLabelText('在哪里遇到的？')).toBeInTheDocument()
    expect(screen.queryByLabelText('核对结构化反馈')).toBeNull()
  })
})

describe('directBox 能力位（D5）', () => {
  it('能力位开启时 direct feedback 位渲染单框而非手填', () => {
    sdkConfig.current = { directBox: true }
    mount()
    fireEvent.click(screen.getByRole('button', { name: '直接反馈' }))
    expect(screen.getByLabelText('反馈描述')).toBeInTheDocument()
    expect(screen.queryByLabelText('在哪里遇到的？')).toBeNull()
  })

  it('能力位关闭（默认）渲染既有手填表单', () => {
    mount()
    fireEvent.click(screen.getByRole('button', { name: '直接反馈' }))
    expect(screen.getByLabelText('在哪里遇到的？')).toBeInTheDocument()
    expect(screen.queryByLabelText('反馈描述')).toBeNull()
  })
})

describe('整理链路接线（C5 核心）', () => {
  const featureSummary = {
    request_type: 'feature',
    position: '项目列表',
    phenomenon: '每周手动逐个导出再合并',
    expect: '跨项目一次导出',
    target_users: '运营主管',
    reproduction_steps: '每周一导出周报',
    business_goal: '减少合并耗时',
    pain_points: '逐个导出容易漏项目',
    unknown_fields: ['current_workflow', 'impact', 'frequency', 'expected_benefit', 'workaround', 'constraints'],
  }

  beforeEach(() => {
    sdkConfig.current = { directBox: true }
    agentSendImpl.mockImplementation(async (text: string, hooks: any) => {
      hooks.onConversationReady('conv-1')
      hooks.onNeedCollect({ question: text, structured: featureSummary })
    })
  })

  it('单框整理成功后进入需求字段组核对并以 structured+conversationId 建卡', async () => {
    mount()
    fireEvent.click(screen.getByRole('button', { name: '直接反馈' }))
    fireEvent.change(screen.getByLabelText('反馈描述'), { target: { value: '我希望支持跨项目批量导出，每周手动导出太麻烦' } })
    fireEvent.click(screen.getByRole('button', { name: '整理为结构化信息' }))
    expect(agentSendImpl).toHaveBeenCalledWith('我希望支持跨项目批量导出，每周手动导出太麻烦', expect.anything())
    await screen.findByLabelText('核对结构化反馈')
    expect(screen.getByText('目标用户 / 使用角色')).toBeInTheDocument()
    expect(screen.getByText(/Agent 分析：功能需求/)).toBeInTheDocument()
    expect(screen.queryByLabelText('反馈描述')).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: '确认以上信息，准备提交反馈' }))
    fireEvent.click(screen.getByRole('button', { name: '确认并创建反馈卡片' }))
    await screen.findByText(/已提交/)
    expect(submitFeedbackV2).toHaveBeenCalledWith(expect.objectContaining({
      conversationId: 'conv-1',
      structured: expect.objectContaining({ request_type: 'feature' }),
    }))
  })

  it('整理失败显示 role=alert，可回落手填且单框草稿不丢', async () => {
    agentSendImpl.mockRejectedValueOnce(new Error('分析服务暂不可用，请稍后重试。'))
    mount()
    fireEvent.click(screen.getByRole('button', { name: '直接反馈' }))
    fireEvent.change(screen.getByLabelText('反馈描述'), { target: { value: '导出失败' } })
    fireEvent.click(screen.getByRole('button', { name: '整理为结构化信息' }))
    const alert = await screen.findByRole('alert')
    expect(alert).toHaveTextContent('分析服务暂不可用')
    expect(screen.getByLabelText('反馈描述')).toHaveValue('导出失败')
    fireEvent.click(screen.getByRole('button', { name: '改用手填' }))
    expect(screen.getByLabelText('在哪里遇到的？')).toBeInTheDocument()
    expect(screen.queryByLabelText('核对结构化反馈')).toBeNull()
  })

  it('二次整理覆盖旧 structured，核对内容更新', async () => {
    mount()
    fireEvent.click(screen.getByRole('button', { name: '直接反馈' }))
    fireEvent.change(screen.getByLabelText('反馈描述'), { target: { value: '第一轮' } })
    fireEvent.click(screen.getByRole('button', { name: '整理为结构化信息' }))
    await screen.findByLabelText('核对结构化反馈')
    fireEvent.click(screen.getByRole('button', { name: '改为直接填写' }))
    agentSendImpl.mockImplementationOnce(async (text: string, hooks: any) => {
      hooks.onConversationReady('conv-1')
      hooks.onNeedCollect({ question: text, structured: { ...featureSummary, phenomenon: '第二轮修正的现象' } })
    })
    fireEvent.change(screen.getByLabelText('反馈描述'), { target: { value: '第二轮修正' } })
    fireEvent.click(screen.getByRole('button', { name: '整理为结构化信息' }))
    await screen.findByLabelText('核对结构化反馈')
    expect(screen.getByLabelText('实际现象 / 需求描述')).toHaveValue('第二轮修正的现象')
  })
})

describe('列表类型徽标与服务端筛选（C6）', () => {
  const items = [
    { id: '1', title: '批量导出', summary: '希望批量', createdAt: '2026-11-17 10:00', etaText: '', status: 'pending' as const, timeline: [], requestType: 'feature' },
    { id: '2', title: '导出 403', summary: '没有权限', createdAt: '2026-11-17 11:00', etaText: '', status: 'pending' as const, timeline: [], requestType: 'bug' },
    { id: '3', title: '原样提交卡', summary: '未分类', createdAt: '2026-11-17 12:00', etaText: '', status: 'pending' as const, timeline: [], requestType: undefined },
  ]

  const openList = async () => {
    vi.mocked(fetchFeedbackItemsV2).mockResolvedValue({ items, total: 3 } as never)
    mount()
    fireEvent.click(screen.getByRole('button', { name: /我的反馈/ }))
    await screen.findByText('批量导出')
  }

  it('列表项渲染类型徽标：需求 / Bug / 待分析', async () => {
    await openList()
    const badge = (text: string) => screen.getAllByText(text).find((node) => node.tagName === 'SPAN')
    expect(badge('需求')).toBeTruthy()
    expect(badge('Bug')).toBeTruthy()
    expect(badge('待分析')).toBeTruthy()
  })

  it('类型筛选作为服务端参数传递并重置分页', async () => {
    await openList()
    fireEvent.change(screen.getByLabelText('反馈类型'), { target: { value: 'feature' } })
    await waitFor(() => expect(fetchFeedbackItemsV2).toHaveBeenLastCalledWith(expect.objectContaining({ requestType: 'feature' })))
    fireEvent.click(screen.getByRole('button', { name: '重置' }))
    await waitFor(() => expect(fetchFeedbackItemsV2).toHaveBeenLastCalledWith(expect.objectContaining({ requestType: undefined })))
  })

  it('样式约定：徽标与下拉使用既有词表，无内联 style', async () => {
    await openList()
    const badge = screen.getAllByText('需求').find((node) => node.tagName === 'SPAN')!
    expect(badge.className).toMatch(/text-xs/)
    expect(badge.getAttribute('style')).toBeNull()
    expect(screen.getByLabelText('反馈类型').className).toContain('sdk-input')
  })
})
