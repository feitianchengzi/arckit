import { describe, it, expect } from 'vitest'
import { feedbackToItem, type FeedbackRecord } from '@/lib/feedback/api'

const record = (data?: string): FeedbackRecord => ({
  id: 1,
  project_id: 7,
  short_id: 'FB-1',
  title: '导出失败',
  content: '点击导出提示 403',
  data,
  created_at: '2026-11-17T00:00:00Z',
  updated_at: '2026-11-17T00:00:00Z',
})

describe('feedbackToItem 类型解析（防腐层映射）', () => {
  it('解析 data.structured.request_type 为 FeedbackItem.requestType', () => {
    const item = feedbackToItem(record(JSON.stringify({ structured: { request_type: 'feature' } })))
    expect(item.requestType).toBe('feature')
  })

  it('data 缺失时 requestType 为 undefined', () => {
    expect(feedbackToItem(record(undefined)).requestType).toBeUndefined()
  })

  it('data 为坏 JSON 时不抛错且 requestType 为 undefined', () => {
    expect(feedbackToItem(record('{broken')).requestType).toBeUndefined()
  })

  it('data 无 structured 或 request_type 非法类型时不抛错', () => {
    expect(feedbackToItem(record(JSON.stringify({ feedback_state: 'pending' }))).requestType).toBeUndefined()
    expect(feedbackToItem(record(JSON.stringify({ structured: null }))).requestType).toBeUndefined()
    expect(feedbackToItem(record(JSON.stringify({ structured: { request_type: 123 } }))).requestType).toBeUndefined()
  })

  it('既有字段映射不受类型解析影响', () => {
    const item = feedbackToItem(record(JSON.stringify({ structured: { request_type: 'bug' } })), { useCustomerWorkflow: true })
    expect(item.id).toBe('1')
    expect(item.title).toBe('导出失败')
    expect(item.timeline.length).toBeGreaterThan(0)
  })
})
