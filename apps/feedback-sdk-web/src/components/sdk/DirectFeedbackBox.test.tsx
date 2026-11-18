import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { DirectFeedbackBox } from './DirectFeedbackBox'
import { submitFeedbackV2 } from '@/lib/feedback/v2'

vi.mock('@/lib/feedback/v2', () => ({ submitFeedbackV2: vi.fn() }))
vi.mock('@/lib/feedback/upload', () => ({ uploadFeedbackFileV2: vi.fn() }))

const onRequestAnalyze = vi.fn()
const onFallback = vi.fn()
const onCreated = vi.fn()
const mount = (props: Partial<Parameters<typeof DirectFeedbackBox>[0]> = {}) =>
  render(
    <DirectFeedbackBox
      scopeKey="test"
      onRequestAnalyze={onRequestAnalyze}
      onFallback={onFallback}
      onCreated={onCreated}
      {...props}
    />,
  )

beforeEach(() => {
  sessionStorage.clear()
  vi.clearAllMocks()
  vi.mocked(submitFeedbackV2).mockResolvedValue({ id: 12, shortId: 'FB-12' })
})

describe('DirectFeedbackBox 单框（C4）', () => {
  it('渲染单框、两动作、降级说明与图片入口', () => {
    mount()
    expect(screen.getByLabelText('反馈描述')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '整理为结构化信息' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '直接原样提交' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '改用手填' })).toBeInTheDocument()
    expect(screen.getByLabelText('添加说明图片')).toBeInTheDocument()
    expect(screen.getByText(/模型不可用/)).toBeInTheDocument()
  })

  it('空与纯空格输入时两个动作均禁用', () => {
    mount()
    expect(screen.getByRole('button', { name: '整理为结构化信息' })).toBeDisabled()
    expect(screen.getByRole('button', { name: '直接原样提交' })).toBeDisabled()
    fireEvent.change(screen.getByLabelText('反馈描述'), { target: { value: '   ' } })
    expect(screen.getByRole('button', { name: '整理为结构化信息' })).toBeDisabled()
    expect(screen.getByRole('button', { name: '直接原样提交' })).toBeDisabled()
  })

  it('输入写入草稿并在重挂载后恢复', () => {
    const { unmount } = mount()
    fireEvent.change(screen.getByLabelText('反馈描述'), { target: { value: '希望支持批量导出' } })
    unmount()
    mount()
    expect(screen.getByLabelText('反馈描述')).toHaveValue('希望支持批量导出')
  })

  it('原样提交只带裁剪正文与幂等 id，不带 structured', async () => {
    mount()
    fireEvent.change(screen.getByLabelText('反馈描述'), { target: { value: '  希望支持批量导出  ' } })
    fireEvent.click(screen.getByRole('button', { name: '直接原样提交' }))
    await vi.waitFor(() => expect(onCreated).toHaveBeenCalledWith({ id: 12, shortId: 'FB-12' }))
    expect(submitFeedbackV2).toHaveBeenCalledOnce()
    const params = vi.mocked(submitFeedbackV2).mock.calls[0][0]
    expect(params.content).toBe('希望支持批量导出')
    expect(params).not.toHaveProperty('structured')
    expect(params.clientRequestId).toBeTruthy()
  })

  it('原样提交失败保留草稿并显示 role=alert', async () => {
    vi.mocked(submitFeedbackV2).mockRejectedValueOnce(new Error('服务暂时不可用，请重试。'))
    mount()
    fireEvent.change(screen.getByLabelText('反馈描述'), { target: { value: '导出失败' } })
    fireEvent.click(screen.getByRole('button', { name: '直接原样提交' }))
    const alert = await screen.findByRole('alert')
    expect(alert).toHaveTextContent('服务暂时不可用，请重试。')
    expect(screen.getByLabelText('反馈描述')).toHaveValue('导出失败')
  })

  it('整理把单框文本交给宿主；分析中两动作禁用并显示 role=status', () => {
    const view = mount()
    fireEvent.change(screen.getByLabelText('反馈描述'), { target: { value: '每周手动导出太麻烦，希望批量导出' } })
    fireEvent.click(screen.getByRole('button', { name: '整理为结构化信息' }))
    expect(onRequestAnalyze).toHaveBeenCalledWith('每周手动导出太麻烦，希望批量导出')
    view.rerender(<DirectFeedbackBox scopeKey="test" analyzing onRequestAnalyze={onRequestAnalyze} onFallback={onFallback} onCreated={onCreated} />)
    expect(screen.getByRole('button', { name: /整理/ })).toBeDisabled()
    expect(screen.getByRole('button', { name: '直接原样提交' })).toBeDisabled()
    expect(screen.getByRole('status')).toHaveTextContent(/整理|分析/)
    view.rerender(<DirectFeedbackBox scopeKey="test" onRequestAnalyze={onRequestAnalyze} onFallback={onFallback} onCreated={onCreated} />)
    expect(screen.getByRole('button', { name: '整理为结构化信息' })).toBeEnabled()
  })

  it('改用手填回调宿主', () => {
    mount()
    fireEvent.click(screen.getByRole('button', { name: '改用手填' }))
    expect(onFallback).toHaveBeenCalledOnce()
  })

  it('样式约定：既有设计系统词表，无内联 style', () => {
    mount()
    const section = screen.getByLabelText('直接反馈')
    expect(section).toHaveClass('sdk-collection')
    expect(screen.getByRole('button', { name: '整理为结构化信息' })).toHaveClass('sdk-button', 'primary')
    expect(screen.getByRole('button', { name: '直接原样提交' })).toHaveClass('sdk-button')
    expect(screen.getByLabelText('反馈描述')).toHaveClass('sdk-input')
    expect(section.querySelector('[style]')).toBeNull()
  })
})
