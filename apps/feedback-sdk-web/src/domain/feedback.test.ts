import { describe, it, expect } from 'vitest'
import { feedbackDateRange, mergeMessages, reviewSummary, validateMedia } from './feedback'

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
