import { useCallback, useEffect, useRef, useState } from 'react'
import { feedbackV2Client, type FeedbackLifecycleDetail } from '@/lib/api/feedbackV2Client'
import { publicationError, publicationRequest, type ConclusionDraft } from '@/domain/feedbackLifecycle'

const kinds = { answer: '问题答复', delivery: '修复或功能交付', not_planned: '暂不采纳' } as const
function safeLink(value?: string) {
  if (!value) return ''
  try { const url = new URL(value); return ['https:', 'http:'].includes(url.protocol) ? url.href : '' } catch { return '' }
}
export function FeedbackLifecyclePanel({ feedbackId, refreshKey = 0, onChanged }: { feedbackId: number; refreshKey?: number; onChanged?: () => void }) {
  const loadRequest = useRef(0)
  const [detail, setDetail] = useState<FeedbackLifecycleDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [draft, setDraft] = useState<ConclusionDraft>({ kind: 'answer', title: '', body: '' })
  const [confirmed, setConfirmed] = useState(false)
  const [publishing, setPublishing] = useState(false)
  const [notice, setNotice] = useState('')
  const load = useCallback(async () => {
    const request = ++loadRequest.current
    setLoading(true); setError('')
    try { const next = await feedbackV2Client.getDetail(feedbackId); if (request === loadRequest.current) setDetail(next) }
    catch (e: unknown) { if (request === loadRequest.current) setError(e instanceof Error ? e.message : '加载流转与结论失败') }
    finally { if (request === loadRequest.current) setLoading(false) }
  }, [feedbackId])
  useEffect(() => { setDetail(null); setDraft({ kind: 'answer', title: '', body: '' }); setConfirmed(false); setNotice(''); void load(); return () => { loadRequest.current += 1 } }, [load, refreshKey])
  const edit = (value: Partial<ConclusionDraft>) => { setDraft(current => ({ ...current, ...value })); setConfirmed(false) }
  const publish = async () => {
    const invalid = publicationError(draft)
    if (invalid || !confirmed || !detail) { setError(invalid || '请核对并确认发布'); return }
    setPublishing(true); setError(''); setNotice('')
    try {
      const version = Math.max(0, ...detail.conclusions.map(item => item.version))
      await feedbackV2Client.publishConclusion(feedbackId, publicationRequest(draft, version))
      setDraft({ kind: 'answer', title: '', body: '' }); setConfirmed(false)
      await load(); setNotice('新版本结论已发布给客户，历史结论保留。'); onChanged?.()
    } catch (e: unknown) { setError(e instanceof Error ? e.message : '发布失败，请刷新核对最新版本后重试') }
    finally { setPublishing(false) }
  }
  return <section className="scrollbar-slim min-h-0 flex-1 space-y-6 overflow-y-auto p-5" aria-label="卡片流转与处理结论">
    <div className="flex items-center justify-between"><h3 className="text-sm font-semibold">客户可见流转</h3><button type="button" onClick={() => void load()} disabled={loading} className="text-xs text-primary">刷新</button></div>
    {error ? <p role="alert" className="text-xs text-error">{error}</p> : null}
    {loading ? <p className="text-xs text-foreground-secondary">正在加载流转记录...</p> : null}
    <ol className="space-y-4 border-l border-divider pl-4">{detail?.events.map(event => <li key={`${event.type}:${event.id}`}><p className="text-xs text-foreground-tertiary">{new Date(event.created_at).toLocaleString()}</p><p className="mt-1 whitespace-pre-wrap text-sm">{event.title}</p>{event.status ? <p className="text-xs text-foreground-secondary">{event.status}</p> : null}</li>)}</ol>
    <div><h3 className="mb-3 text-sm font-semibold">处理结论与客户验收</h3>{detail && !detail.conclusions.length ? <p className="text-xs text-foreground-secondary">尚未发布结论。普通回复不会自动成为正式结论。</p> : null}
      <div className="space-y-3">{detail?.conclusions.map(conclusion => <article key={conclusion.id} className="rounded-lg border border-divider bg-surface-elevated p-4">
        <div className="flex justify-between text-xs"><strong>{kinds[conclusion.kind]} · v{conclusion.version}</strong><time className="text-foreground-tertiary">{new Date(conclusion.created_at).toLocaleString()}</time></div>
        <h4 className="mt-3 text-sm font-semibold">{conclusion.title}</h4><p className="mt-2 whitespace-pre-wrap text-sm leading-6">{conclusion.body}</p>
        {conclusion.version_label ? <p className="mt-2 text-xs text-foreground-secondary">适用版本：{conclusion.version_label}</p> : null}
        {safeLink(conclusion.artifact_url) ? <a className="mt-2 inline-block text-xs text-primary" target="_blank" rel="noopener noreferrer" href={safeLink(conclusion.artifact_url)}>查看交付产物 ↗</a> : null}
        {detail.responses.filter(response => response.conclusion_id === conclusion.id).map(response => <div key={response.id} className="mt-3 border-t border-divider pt-3 text-xs"><strong>{response.response === 'accepted' ? '客户已确认解决' : '客户请求复核'}</strong><time className="ml-2 text-foreground-tertiary">{new Date(response.created_at).toLocaleString()}</time>{response.content ? <p className="mt-1 whitespace-pre-wrap">{response.content}</p> : null}</div>)}
      </article>)}</div>
    </div>
    <form className="space-y-3 border-t border-divider pt-5" onSubmit={event => { event.preventDefault(); void publish() }}>
      <h3 className="text-sm font-semibold">发布客户可见结论</h3><p className="text-xs text-foreground-secondary">结论发布会通知客户并保留版本。发布结论不直接覆盖关联任务状态；请不要包含内部私密讨论。</p>
      <label className="block text-xs">结论类型<select aria-label="结论类型" value={draft.kind} onChange={event => edit({ kind: event.target.value as ConclusionDraft['kind'] })} className="mt-1 w-full rounded border border-divider bg-surface p-2">{Object.entries(kinds).map(([value,label]) => <option key={value} value={value}>{label}</option>)}</select></label>
      <label className="block text-xs">结论标题<input aria-label="结论标题" value={draft.title} onChange={event => edit({ title: event.target.value })} className="mt-1 w-full rounded border border-divider bg-surface p-2" /></label>
      <label className="block text-xs">客户可见结论<textarea aria-label="客户可见结论" rows={4} value={draft.body} onChange={event => edit({ body: event.target.value })} placeholder="说明处理结果、依据、验证步骤或替代方案" className="mt-1 w-full rounded border border-divider bg-surface p-2 text-sm" /></label>
      <label className="block text-xs">适用版本<input value={draft.versionLabel || ''} onChange={event => edit({ versionLabel: event.target.value })} className="mt-1 w-full rounded border border-divider bg-surface p-2" /></label>
      <label className="block text-xs">交付链接<input type="url" value={draft.artifactUrl || ''} onChange={event => edit({ artifactUrl: event.target.value })} className="mt-1 w-full rounded border border-divider bg-surface p-2" /></label>
      <label className="flex items-center gap-2 text-xs"><input type="checkbox" checked={confirmed} onChange={event => setConfirmed(event.target.checked)} />确认将该结论发布给客户</label>
      <button type="submit" disabled={!confirmed || !draft.title.trim() || !draft.body.trim() || !detail || publishing} className="rounded bg-primary px-3 py-2 text-xs font-semibold text-white disabled:opacity-40">{publishing ? '发布中...' : '发布新版本结论'}</button>
      {notice ? <p role="status" className="text-xs text-success">{notice}</p> : null}
    </form>
  </section>
}
