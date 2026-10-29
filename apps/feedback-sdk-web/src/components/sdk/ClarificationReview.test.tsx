import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { ClarificationReview } from './ClarificationReview'
import { mergeStructuredSummary, missingClarificationFields } from '@/lib/feedback/structured'

const core = { request_type: 'bug', position: '订单列表', phenomenon: '点击导出无响应', expect: '下载 CSV' }

describe('structured clarification review', () => {
  it('blocks repeated confirmation and edits while an append is in flight', () => {
    const value = { ...core, unknown_fields: ['reproduction_steps', 'environment', 'impact'] }
    const confirm = vi.fn()
    const { rerender } = render(<ClarificationReview mode="append" value={value} confirmed={false} pending onChange={vi.fn()} onConfirm={confirm} />)
    expect(screen.getByLabelText('期望结果')).toBeDisabled()
    fireEvent.click(screen.getByRole('button', { name: '正在记录...' }))
    expect(confirm).not.toHaveBeenCalled()
    rerender(<ClarificationReview mode="append" value={value} confirmed onChange={vi.fn()} onConfirm={confirm} />)
    fireEvent.click(screen.getByRole('button', { name: '已确认，修改后需重新确认' }))
    expect(confirm).not.toHaveBeenCalled()
  })
  it('blocks confirmation until required context is supplied or explicitly unknown', () => {
    const confirm = vi.fn()
    const { rerender } = render(<ClarificationReview value={core} confirmed={false} onChange={vi.fn()} onConfirm={confirm} />)
    expect(screen.getByRole('button', { name: '确认以上信息，准备提交反馈' })).toBeDisabled()
    rerender(<ClarificationReview value={{ ...core, unknown_fields: ['reproduction_steps', 'environment', 'impact'] }} confirmed={false} onChange={vi.fn()} onConfirm={confirm} />)
    fireEvent.click(screen.getByRole('button', { name: '确认以上信息，准备提交反馈' }))
    expect(confirm).toHaveBeenCalledOnce()
  })
  it('requires actual core information even when a model marks it unknown', () => {
    expect(missingClarificationFields({ request_type: 'bug', position: '', phenomenon: '', expect: '', unknown_fields: ['position', 'phenomenon', 'expect'] })).toEqual(expect.arrayContaining(['position', 'phenomenon', 'expect']))
  })
  it('keeps evidence from earlier rounds when the next summary omits it', () => {
    const merged = mergeStructuredSummary({ ...core, environment: 'Chrome 130' }, { position: '', phenomenon: '', expect: '', impact: '财务无法对账' })
    expect(merged).toMatchObject({ ...core, environment: 'Chrome 130', impact: '财务无法对账' })
  })
  it('edits notify the parent and never create a feedback card', () => {
    const change = vi.fn(), confirm = vi.fn()
    render(<ClarificationReview value={core} confirmed={false} onChange={change} onConfirm={confirm} />)
    fireEvent.change(screen.getByLabelText('期望结果'), { target: { value: '下载 Excel 文件' } })
    expect(change).toHaveBeenCalledWith(expect.objectContaining({ expect: '下载 Excel 文件' }))
    expect(confirm).not.toHaveBeenCalled()
  })
})


describe('feature review form', () => {
  it('switches the form to product discovery fields and preserves explicit manual edits', () => {
    const change = vi.fn()
    const { rerender } = render(<ClarificationReview value={core} confirmed={false} onChange={change} onConfirm={vi.fn()} />)
    expect(screen.queryByRole('combobox')).toBeNull()
    expect(screen.getByText(/Agent/)).toBeInTheDocument()
    rerender(<ClarificationReview value={{ ...core, request_type: 'feature' }} confirmed={false} onChange={change} onConfirm={vi.fn()} />)
    expect(screen.queryByLabelText('环境 / 版本')).toBeNull()
    expect(screen.getByLabelText('使用场景 / 何时需要')).toBeInTheDocument()
    fireEvent.change(screen.getByLabelText('目标用户 / 使用角色'), { target: { value: '财务主管' } })
    expect(change).toHaveBeenLastCalledWith(expect.objectContaining({ target_users: '财务主管' }))
    expect(screen.getByRole('button', { name: '确认以上信息，准备提交反馈' })).toBeDisabled()
  })
})
