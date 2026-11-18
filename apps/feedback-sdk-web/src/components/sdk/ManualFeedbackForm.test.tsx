import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { ManualFeedbackForm } from './ManualFeedbackForm'
import { submitFeedbackV2 } from '@/lib/feedback/v2'

vi.mock('@/lib/feedback/v2', () => ({ submitFeedbackV2: vi.fn() }))
vi.mock('@/lib/feedback/upload', () => ({ uploadFeedbackFileV2: vi.fn() }))

const noop = () => {}
const onCreated = vi.fn()
const mount = () => render(<ManualFeedbackForm scopeKey="test" onCancel={noop} onCreated={onCreated} />)

const fillAll = () => {
  fireEvent.change(screen.getByLabelText('在哪里遇到的？'), { target: { value: '订单页' } })
  fireEvent.change(screen.getByLabelText('你看到了什么？'), { target: { value: '无法保存' } })
  fireEvent.change(screen.getByLabelText('你本来想做什么？'), { target: { value: '保存成功' } })
}

beforeEach(() => {
  sessionStorage.clear()
  vi.clearAllMocks()
  onCreated.mockClear()
  vi.mocked(submitFeedbackV2).mockResolvedValue({ id: 12, shortId: 'FB-12' })
})

describe('ManualFeedbackForm P0（用户语言 + 核心必填 + 降级边界）', () => {
  it('label 使用用户语言并带示例 placeholder', () => {
    mount()
    expect(screen.getByLabelText('在哪里遇到的？')).toBeInTheDocument()
    expect(screen.getByLabelText('你看到了什么？')).toBeInTheDocument()
    expect(screen.getByLabelText('你本来想做什么？')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('例如：项目列表页，点导出按钮时')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('例如：页面提示 403，下载失败')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('例如：正常导出月度报表')).toBeInTheDocument()
  })

  it('三框全必填：任一为空提交禁用（对齐后端 core 规则）', () => {
    mount()
    const submit = screen.getByRole('button', { name: '确认提交反馈' })
    expect(submit).toBeDisabled()
    fireEvent.change(screen.getByLabelText('你看到了什么？'), { target: { value: '无法保存' } })
    expect(submit).toBeDisabled()
    fireEvent.change(screen.getByLabelText('在哪里遇到的？'), { target: { value: '订单页' } })
    expect(submit).toBeDisabled()
    fireEvent.change(screen.getByLabelText('你本来想做什么？'), { target: { value: '保存成功' } })
    expect(submit).toBeDisabled()
    fireEvent.click(screen.getByRole('checkbox', { name: '我已核对以上事实，确认提交给处理团队' }))
    expect(submit).toBeEnabled()
  })

  it('不渲染 core 字段的「不确定」降级勾选，也不提供类型选择', () => {
    mount()
    expect(screen.queryByText('不确定，由团队补充')).toBeNull()
    expect(screen.queryByRole('combobox')).toBeNull()
    expect(screen.queryByText(/问题类型/)).toBeNull()
    expect(screen.queryByText(/功能需求|现有功能异常/)).toBeNull()
  })

  it('提交载荷 request_type=other 且仅辅助字段进 unknown_fields', async () => {
    mount()
    fillAll()
    fireEvent.click(screen.getByRole('checkbox', { name: '我已核对以上事实，确认提交给处理团队' }))
    fireEvent.click(screen.getByRole('button', { name: '确认提交反馈' }))
    await vi.waitFor(() => expect(onCreated).toHaveBeenCalledWith({ id: 12, shortId: 'FB-12' }))
    expect(submitFeedbackV2).toHaveBeenCalledOnce()
    expect(submitFeedbackV2).toHaveBeenCalledWith(expect.objectContaining({
      structured: {
        request_type: 'other',
        position: '订单页',
        phenomenon: '无法保存',
        expect: '保存成功',
        unknown_fields: ['reproduction_steps', 'environment', 'impact'],
      },
    }))
  })

  it('提交失败保留已填值并显示 role=alert', async () => {
    vi.mocked(submitFeedbackV2).mockRejectedValueOnce(new Error('服务暂时不可用，请重试。'))
    mount()
    fillAll()
    fireEvent.click(screen.getByRole('checkbox', { name: '我已核对以上事实，确认提交给处理团队' }))
    fireEvent.click(screen.getByRole('button', { name: '确认提交反馈' }))
    const alert = await screen.findByRole('alert')
    expect(alert).toHaveTextContent('服务暂时不可用，请重试。')
    expect(screen.getByLabelText('你看到了什么？')).toHaveValue('无法保存')
  })

  it('样式约定：区块/按钮/输入使用既有设计系统词表，无内联 style', () => {
    mount()
    const section = screen.getByLabelText('直接反馈')
    expect(section).toHaveClass('sdk-collection')
    expect(screen.getByRole('button', { name: '确认提交反馈' })).toHaveClass('sdk-button', 'primary')
    expect(screen.getByRole('button', { name: '返回咨询并保留草稿' })).toHaveClass('sdk-button')
    expect(screen.getByLabelText('你看到了什么？')).toHaveClass('sdk-input')
    expect(section.querySelector('[style]')).toBeNull()
    expect(screen.getByRole('button', { name: '确认提交反馈' }).getAttribute('style')).toBeNull()
  })
})
