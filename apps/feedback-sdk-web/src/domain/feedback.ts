import type { AgentStructuredSummary, ConversationMessage, FeedbackV2Attachment } from '@/lib/feedback/v2'
import { mergeStructuredSummary } from '@/lib/feedback/structured'

/** Local dates are customer calendar dates; transport uses a UTC half-open interval. */
export function feedbackDateRange(from: string, through: string): { dateFrom?: string; dateTo?: string } {
  const parse = (value: string) => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) throw new Error('请选择有效日期')
    const [year, month, day] = value.split('-').map(Number)
    const date = new Date(year, month - 1, day)
    if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) throw new Error('请选择有效日期')
    return date
  }
  const start = from ? parse(from) : undefined
  const end = through ? parse(through) : undefined
  if (start && end && start > end) throw new Error('开始日期不能晚于结束日期')
  if (end) end.setDate(end.getDate() + 1)
  return { dateFrom: start?.toISOString(), dateTo: end?.toISOString() }
}

export function mergeMessages(previous: ConversationMessage[], incoming: ConversationMessage[]): ConversationMessage[] {
  const all = new Map(previous.map((m) => [`${m.source}:${m.id}`, m]))
  incoming.forEach((m) => all.set(`${m.source}:${m.id}`, m))
  return [...all.values()].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime() || (a.source === b.source ? a.id - b.id : a.source.localeCompare(b.source)))
}

/** Customer edits may correct facts; classification always comes from Agent analysis. */
export function reviewSummary(previous: AgentStructuredSummary | undefined, incoming: AgentStructuredSummary | undefined, edits: Partial<AgentStructuredSummary>): AgentStructuredSummary {
  const { request_type: _ignored, ...facts } = edits
  return { ...mergeStructuredSummary(previous, incoming), ...facts }
}

export function validateMedia(file: File, current: Pick<FeedbackV2Attachment, 'type' | 'size'>[]): string {
  const image = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(file.type)
  const audio = ['audio/webm', 'audio/ogg', 'audio/mp4', 'audio/mpeg', 'audio/wav', 'audio/x-wav'].includes(file.type.split(';')[0])
  if (!image && !audio) return '不支持该媒体格式'
  if (!file.size || file.size > 10 * 1024 * 1024) return '单个媒体文件需小于10MB且不能为空'
  if (image && current.filter((a) => a.type === 'image').length >= 4) return '每次最多添加4张图片'
  if (audio && current.some((a) => a.type === 'audio')) return '每次最多添加一段语音'
  if (current.reduce((sum, a) => sum + (a.size || 0), 0) + file.size > 20 * 1024 * 1024) return '媒体总大小不能超过20MB'
  return ''
}

export function newClientRequestId(): string {
  return typeof crypto.randomUUID === 'function' ? crypto.randomUUID() : `sdk_${Date.now()}_${Math.random().toString(36).slice(2)}`
}
