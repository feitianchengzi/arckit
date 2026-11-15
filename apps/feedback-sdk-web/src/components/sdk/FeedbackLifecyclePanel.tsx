import { newClientRequestId } from '@/domain/feedback'
import { useEffect, useRef, useState } from 'react'
import { getFeedbackLifecycleV2, respondFeedbackConclusionV2, type FeedbackLifecycle } from '@/lib/feedback/v2'

export const customerStatusLabel: Record<string, string> = { pending: '待受理', submitted: '待受理', analyzing: '分析中', reviewing: '已受理', processing: '处理中', developing: '处理中', completed: '待验收', released: '待验收', accepted: '已解决', resolved: '已解决', ignored: '暂不采纳' }
const eventLabels: Record<string, string> = { submitted: '反馈已提交', status_changed: '卡片状态更新', conclusion_published: '处理结论已发布', customer_accepted: '客户已验收', review_requested: '客户请求复核', accepted: '反馈已受理', ignored: '暂不采纳', restored: '恢复处理', task_linked: '已进入处理流程' }

export function FeedbackLifecyclePanel({ feedbackId, mode, refreshKey = 0, onChanged }: { feedbackId: string; mode: 'events' | 'conclusions'; refreshKey?: number; onChanged?: () => void }) {
  const [value, setValue] = useState<FeedbackLifecycle>()
  const [error, setError] = useState('')
  const [revision, setRevision] = useState(0)
  const [pending, setPending] = useState(false)
  const [review, setReview] = useState('')
  const [reviewOpen, setReviewOpen] = useState(false)
  const [confirmAccept, setConfirmAccept] = useState(false)
  const [history, setHistory] = useState(false)
  const requestId = useRef(newClientRequestId())
  useEffect(() => {
    let canceled = false
    setError('')
    getFeedbackLifecycleV2(Number(feedbackId)).then((data) => { if (!canceled) setValue(data) }).catch((e) => { if (!canceled) setError(e.message || '加载处理记录失败') })
    return () => { canceled = true }
  }, [feedbackId, refreshKey, revision])
  const conclusions = [...(value?.conclusions || [])].sort((a, b) => b.version - a.version)
  const latest = conclusions[0]
  const latestResponse = [...(value?.responses || [])].reverse().find((r) => r.conclusion_id === latest?.id)
  const accept = async () => {
    if (!latest || pending) return
    setPending(true); setError('')
    try { await respondFeedbackConclusionV2(Number(feedbackId), latest.id, 'accepted', undefined, requestId.current); setRevision((r) => r + 1); setConfirmAccept(false); requestId.current = newClientRequestId(); onChanged?.() }
    catch (e) { setError(e instanceof Error ? e.message : '验收失败，请重试') }
    finally { setPending(false) }
  }
  const submitReview = async () => {
    if (!review.trim() || pending) return
    setPending(true); setError('')
    try { await respondFeedbackConclusionV2(Number(feedbackId), latest!.id, 'needs_review', review.trim(), requestId.current); setRevision((r) => r + 1); setReview(''); setReviewOpen(false); requestId.current = newClientRequestId(); onChanged?.() }
    catch (e) { setError(e instanceof Error ? e.message : '补充失败，请重试') }
    finally { setPending(false) }
  }
  return <section className="sdk-lifecycle">
    {error && <div role="alert" className="text-sm text-error">{error} <button type="button" className="text-primary" onClick={() => setRevision((r) => r + 1)}>重试</button></div>}
    {!value && !error && <p role="status">正在加载处理记录…</p>}
    {value && mode === 'events' && <><div className="sdk-notice">展示客户可见的卡片流转，不包含内部私密讨论。</div><ol className="sdk-timeline">{value.events.map((event) => <li key={event.id}><small>{new Date(event.created_at).toLocaleString()}</small><h3>{event.title || eventLabels[event.type] || '处理记录更新'}</h3>{event.status && <p>{customerStatusLabel[event.status] || event.status}</p>}</li>)}</ol>{!value.events.length && <p className="sdk-empty">暂无流转记录，后续处理将在这里更新。</p>}</>}
    {value && mode === 'conclusions' && <>
      {latestResponse?.response === 'needs_review' && <div className="sdk-notice">你已补充新信息，原结论等待团队复核。</div>}
      {!latest ? <div className="sdk-empty"><h3>尚无正式处理结论</h3><p>收集完成不代表已受理或承诺交付。团队发布后会在这里更新。</p></div> : <>
        {(history ? conclusions : [latest]).map((conclusion) => <article key={conclusion.id} className="sdk-conclusion"><div className="flex justify-between gap-3"><strong>{conclusion.kind === 'delivery' ? '正式交付' : conclusion.kind === 'not_planned' ? '评估结论' : '处理结论'}</strong><small>v{conclusion.version}{conclusion.id !== latest.id ? ' · 历史版本' : ' · 当前版本'}</small></div><h3 className="font-semibold mt-3">{conclusion.title}</h3><p className="whitespace-pre-wrap mt-3">{conclusion.body}</p>{conclusion.version_label && <p className="mt-3 text-xs">适用版本：{conclusion.version_label}</p>}{conclusion.artifact_url && /^https?:\/\//i.test(conclusion.artifact_url) && <a className="sdk-button mt-3" href={conclusion.artifact_url} target="_blank" rel="noopener noreferrer">查看交付说明 ↗</a>}<small className="block mt-3">发布于 {new Date(conclusion.created_at).toLocaleString()}</small></article>)}
        {conclusions.length > 1 && <button type="button" className="text-xs text-primary my-3" onClick={() => setHistory((v) => !v)}>{history ? '收起历史版本' : `查看结论版本记录（${conclusions.length}）`}</button>}
        <div className="flex flex-wrap gap-3 mt-5">
          {latestResponse?.response !== 'accepted' && latest.kind !== 'not_planned' && <button type="button" disabled={pending || latestResponse?.response === 'needs_review'} className="sdk-button primary" onClick={() => { setConfirmAccept(true); requestId.current = newClientRequestId() }}>确认已解决</button>}
          <button type="button" className="sdk-button" onClick={() => { setReviewOpen(true); requestId.current = newClientRequestId() }}>仍有问题，补充并请求复核</button>
        </div>
      </>}
      {confirmAccept && <div role="dialog" aria-modal="true" aria-label="确认验收" className="sdk-confirm"><p>请先验证交付结果。确认后仍会保留完整沟通记录。</p><div className="flex gap-3 mt-3"><button className="sdk-button" type="button" disabled={pending} onClick={() => setConfirmAccept(false)}>暂不确认</button><button className="sdk-button primary" type="button" disabled={pending} onClick={() => void accept()}>确认验收</button></div></div>}
      {reviewOpen && <div className="sdk-confirm"><label className="text-sm" htmlFor="review-content">补充新的现象或验证结果</label><textarea id="review-content" rows={3} className="sdk-input mt-2" value={review} onChange={(e) => { setReview(e.target.value); requestId.current = newClientRequestId() }} /><button className="sdk-button primary mt-3" type="button" disabled={pending || !review.trim()} onClick={() => void submitReview()}>补充到原卡片</button></div>}
    </>}
  </section>
}
