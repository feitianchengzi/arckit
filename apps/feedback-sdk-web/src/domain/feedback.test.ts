import { describe, it, expect } from 'vitest'
import { feedbackDateRange, mergeMessages, reviewSummary, validateMedia, validateDirectBox, buildRawSubmit, buildManualSubmit, typeLabel } from './feedback'

describe('feedback domain', () => {
  it('converts an inclusive local calendar range into a half-open instant interval', () => {
    const range = feedbackDateRange('2026-10-01', '2026-10-29')
    expect(new Date(range.dateFrom!).getDate()).toBe(1)
    expect(new Date(range.dateTo!).getDate()).toBe(30)
    expect(() => feedbackDateRange('2026-10-30', '2026-10-01')).toThrow()
  })
  it('merges overlapping pages by source and id without losing equal text from distinct messages', () => {
    const a = { source: 'agent' as const, id: 1, content: 'same', created_at: '2026-10-01T00:00:00Z', sender_type: 'customer' as const }
    const b = { ...a, source: 'feedback' as const }
    expect(mergeMessages([a], [b, a])).toEqual([a, b])
  })
  it('lets Agent reclassification override old client edits and clear stale confirmation', () => {
    const result = reviewSummary({ position: '报表', phenomenon: '失败', expect: '成功', request_type: 'bug' }, { position: '', phenomenon: '', expect: '', request_type: 'feature' }, { request_type: 'bug', expect: '下载CSV' })
    expect(result.request_type).toBe('feature')
    expect(result.expect).toBe('下载CSV')
  })
  it('limits media count and bytes before uploading', () => {
    expect(validateMedia(new File(['a'], 'a.png', { type: 'image/png' }), [])).toBe('')
    expect(validateMedia(new File(['a'], 'a.exe', { type: 'application/octet-stream' }), [])).toMatch(/格式/)
    expect(validateMedia(new File(['a'], 'a.png', { type: 'image/png' }), Array(4).fill({ type: 'image', size: 1 }))).toMatch(/4/)
  })
})

describe('direct feedback box（单框领域规则）', () => {
  it('拒绝空与纯空白输入，放行正常文本', () => {
    expect(validateDirectBox('')).not.toBe('')
    expect(validateDirectBox('   \n  ')).not.toBe('')
    expect(validateDirectBox('点导出后提示没有权限')).toBe('')
  })

  it('拒绝超长输入（与字段 8000 上限一致）', () => {
    expect(validateDirectBox('x'.repeat(8001))).not.toBe('')
    expect(validateDirectBox('x'.repeat(8000))).toBe('')
  })

  it('原样提交载荷只携带裁剪后的正文，不含 structured', () => {
    const payload = buildRawSubmit('  希望支持批量导出  ')
    expect(payload.content).toBe('希望支持批量导出')
    expect(payload).not.toHaveProperty('structured')
  })

  it('手填载荷固定 request_type=other 并仅将辅助字段标为 unknown', () => {
    const structured = buildManualSubmit({ position: '  订单页  ', phenomenon: '无法保存', expect: '保存成功' })
    expect(structured).toEqual({
      request_type: 'other',
      position: '订单页',
      phenomenon: '无法保存',
      expect: '保存成功',
      unknown_fields: ['reproduction_steps', 'environment', 'impact'],
    })
  })

  it('类型标签映射覆盖四值与缺失态', () => {
    expect(typeLabel('feature')).toBe('需求')
    expect(typeLabel('bug')).toBe('Bug')
    expect(typeLabel('question')).toBe('问题')
    expect(typeLabel('other')).toBe('一般反馈')
    expect(typeLabel(undefined)).toBe('待分析')
  })
})
