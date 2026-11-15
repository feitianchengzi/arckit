import { useEffect, useState } from 'react'
import { getFeedbackLifecycleV2, type FeedbackLifecycle } from '@/lib/feedback/v2'
import { clarificationFields } from '@/lib/feedback/structured'

export function SubmittedFeedbackInfo({ feedbackId }: { feedbackId: string }) {
  const [feedback, setFeedback] = useState<FeedbackLifecycle['feedback']>(), [error, setError] = useState(''), [revision, setRevision] = useState(0)
  useEffect(() => {
    let canceled = false
    setFeedback(undefined); setError('')
    getFeedbackLifecycleV2(Number(feedbackId)).then((value) => { if (!canceled) setFeedback(value.feedback) }).catch((e) => { if (!canceled) setError(e instanceof Error ? e.message : '已提交信息暂时无法加载。') })
    return () => { canceled = true }
  }, [feedbackId, revision])
  let snapshot: Record<string, unknown> | undefined
  try { const metadata = typeof feedback?.data === 'string' ? JSON.parse(feedback.data) : feedback?.data; if (metadata && typeof metadata === 'object' && metadata.structured && typeof metadata.structured === 'object') snapshot = metadata.structured } catch { /* Legacy unstructured submissions still expose their original description. */ }
  return <details className="sdk-submitted-info my-4" open><summary className="text-sm font-semibold">已提交信息</summary>{error && <p role="alert" className="text-xs text-error">{error} <button type="button" onClick={() => setRevision((v) => v + 1)}>重试已提交信息</button></p>}{!feedback && !error && <p role="status">正在加载已提交信息…</p>}{feedback && <><p className="text-xs text-foreground-secondary">以下为提交时的信息快照。</p>{snapshot && <dl className="text-xs space-y-2 mt-3">{clarificationFields.filter(([key]) => key !== 'request_type' && typeof snapshot?.[key] === 'string' && snapshot[key]).map(([key, label]) => <div key={key}><dt className="text-foreground-secondary">{label}</dt><dd className="whitespace-pre-wrap">{String(snapshot![key])}</dd></div>)}{Array.isArray(snapshot.unknown_fields) && snapshot.unknown_fields.length > 0 && <div><dt>待确认信息</dt><dd>{snapshot.unknown_fields.map((key) => clarificationFields.find(([field]) => field === key)?.[1] || String(key)).join('、')}</dd></div>}</dl>}<h3 className="text-xs font-semibold mt-3">原始描述</h3><p className="text-xs whitespace-pre-wrap mt-2">{feedback.content}</p></>}</details>
}
