import type { AgentStructuredSummary } from '@/lib/feedback/v2'
import { clarificationFields, visibleClarificationFields, coreClarificationFields, missingClarificationFields, type ClarificationField } from '@/lib/feedback/structured'

interface Props {
  value: AgentStructuredSummary
  confirmed: boolean
  pending?: boolean
  onChange: (value: AgentStructuredSummary) => void
  onConfirm: () => void
  mode?: 'create' | 'append'
}

export function ClarificationReview({ value, confirmed, pending = false, onChange, onConfirm, mode = 'create' }: Props) {
  const missing = missingClarificationFields(value)
  const update = (field: ClarificationField, text: string) => onChange({ ...value, [field]: text, unknown_fields: value.unknown_fields?.filter((key) => key !== field) })
  return <section aria-label="核对结构化反馈" className="sdk-collection space-y-3">
    <h3 className="font-semibold">核对问题信息</h3>
    <p className="text-xs text-foreground-secondary">可以继续与客服补充，或直接编辑。请仅确认真实信息；暂时无法提供的内容可标记为待确认，供团队继续澄清。</p>
    {visibleClarificationFields(value).map(([field, label]) => <div key={field} className="space-y-1">
      <label className="block text-xs font-medium" htmlFor={`clarification-${field}`}>{label}</label>
      {field === 'request_type' ? <p className="rounded bg-primary-light p-2 text-xs text-primary">Agent 分析：{value.request_type === 'feature' ? '功能需求' : value.request_type === 'bug' ? '现有功能异常' : '信息仍待分析'}。如事实有误，请在咨询中补充，客服会重新分析。</p> : <textarea id={`clarification-${field}`} disabled={pending} value={value[field] || ''} rows={2} onChange={(e) => update(field, e.target.value)} className="w-full rounded border border-divider bg-surface p-2 text-sm" />}
      {field !== 'request_type' && !coreClarificationFields(value).includes(field) && !value[field]?.trim() && <label className="flex gap-2 text-xs"><input type="checkbox" disabled={pending} checked={value.unknown_fields?.includes(field) || false} onChange={(e) => onChange({ ...value, unknown_fields: e.target.checked ? [...(value.unknown_fields || []), field] : value.unknown_fields?.filter((key) => key !== field) })} />暂时无法提供，保留为待确认</label>}
    </div>)}
    {missing.length > 0 && <p role="status" className="text-xs text-foreground-secondary">还需补充或标记待确认：{missing.map((key) => clarificationFields.find(([field]) => field === key)?.[1]).join('、')}</p>}
    <button type="button" disabled={confirmed || pending || missing.length > 0 || !value.phenomenon.trim() || !value.expect.trim()} onClick={onConfirm} className="rounded bg-primary px-3 py-2 text-sm text-white disabled:opacity-50">{pending ? '正在记录...' : confirmed ? '已确认，修改后需重新确认' : mode === 'append' ? '确认并追加到当前反馈' : '确认以上信息，准备提交反馈'}</button>
    {confirmed && <p role="status" className="text-xs text-success">{mode === 'append' ? '已确认并记录到当前反馈。' : '已由你确认。点击下方提交按钮后才会创建反馈卡片。'}</p>}
  </section>
}
