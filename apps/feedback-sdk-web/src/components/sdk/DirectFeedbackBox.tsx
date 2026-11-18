import { useEffect, useRef, useState } from 'react'
import { buildRawSubmit, newClientRequestId, validateDirectBox, validateMedia } from '@/domain/feedback'
import { uploadFeedbackFileV2 } from '@/lib/feedback/upload'
import { submitFeedbackV2, type FeedbackV2Attachment } from '@/lib/feedback/v2'

interface Props {
  scopeKey: string
  conversationId?: string
  analyzing?: boolean
  analyzeError?: string
  onRequestAnalyze: (text: string) => void
  onFallback: () => void
  onCreated: (value: { id: number; shortId: string }) => void
  onPendingChange?: (pending: boolean) => void
}

/** Single-box direct feedback: one description, model-assisted structuring, raw submit as the escape hatch. */
export function DirectFeedbackBox({ scopeKey, conversationId, analyzing = false, analyzeError = '', onRequestAnalyze, onFallback, onCreated, onPendingChange }: Props) {
  const storageKey = `feedback-direct:${scopeKey}:${conversationId || 'new'}`
  const [text, setText] = useState(() => { try { return sessionStorage.getItem(storageKey) || '' } catch { return '' } })
  const [attachments, setAttachments] = useState<FeedbackV2Attachment[]>([])
  const [pending, setPending] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const alive = useRef(true), locked = useRef(false)
  useEffect(() => { alive.current = true; return () => { alive.current = false } }, [])
  useEffect(() => { onPendingChange?.(pending || uploading) }, [pending, uploading, onPendingChange])
  useEffect(() => { try { sessionStorage.setItem(storageKey, text) } catch { /* The current in-memory draft remains usable. */ } }, [text, storageKey])
  const busy = pending || uploading || analyzing
  const valid = !validateDirectBox(text)
  const update = (next: string) => { setText(next); setError('') }
  const upload = async (files: File[]) => {
    if (locked.current || uploading) return
    setUploading(true); setError('')
    let next = [...attachments]
    try {
      for (const file of files) {
        const validation = file.type.startsWith('image/') ? validateMedia(file, next) : '仅支持上传图片说明问题。'
        if (validation) throw new Error(validation)
        const item = await uploadFeedbackFileV2({ file })
        if (!alive.current) return
        next = [...next, item]
        setAttachments(next)
      }
    } catch (e) { if (alive.current) setError(e instanceof Error ? e.message : '图片上传失败，请重新选择重试。') }
    finally { if (alive.current) setUploading(false) }
  }
  const analyze = () => {
    const message = validateDirectBox(text)
    if (message || busy) { setError(message); return }
    setError('')
    onRequestAnalyze(text.trim())
  }
  const submitRaw = async () => {
    const message = validateDirectBox(text)
    if (message || locked.current || busy) { setError(message); return }
    locked.current = true; setPending(true); setError('')
    try {
      const result = await submitFeedbackV2({ ...buildRawSubmit(text), attachments, conversationId, clientRequestId: newClientRequestId() })
      if (!alive.current) return
      try { sessionStorage.removeItem(storageKey) } catch { /* Submission succeeded even if browser storage is blocked. */ }
      onCreated(result)
    } catch (e) { if (alive.current) setError(e instanceof Error ? e.message : '反馈提交失败，请稍后重试。') }
    finally { locked.current = false; if (alive.current) setPending(false) }
  }
  return <section className="sdk-collection space-y-3" aria-label="直接反馈">
    <h3 className="font-semibold">直接反馈</h3>
    <p className="text-xs text-foreground-secondary">用一段话描述你遇到的情况或想要的能力，提交后由处理团队分析；不会要求你选择问题类型。</p>
    <textarea className="sdk-input" aria-label="反馈描述" rows={4} maxLength={8000} placeholder="例如：每周要在项目列表逐个导出再合并，希望支持跨项目批量导出" value={text} disabled={busy} onChange={(event) => update(event.target.value)} />
    <label className="sdk-button">添加说明图片<input aria-label="直接反馈图片" className="sr-only" type="file" accept="image/jpeg,image/png,image/webp,image/gif" multiple disabled={busy} onChange={(event) => { void upload([...(event.target.files || [])]); event.target.value = '' }} /></label>
    {uploading && <p role="status">正在上传图片…</p>}
    {attachments.map((attachment, index) => <div key={attachment.object_key || index} className="text-xs">{attachment.file_name || `图片 ${index + 1}`} · 已上传 <button type="button" disabled={busy} onClick={() => setAttachments(attachments.filter((_, i) => i !== index))}>移除</button></div>)}
    {analyzing && <p role="status" className="text-xs text-foreground-secondary">正在整理为结构化信息…可继续在下方等待结果。</p>}
    {(error || analyzeError) && <p role="alert" className="text-xs text-error">{error || analyzeError}</p>}
    <p className="text-xs text-foreground-secondary">降级说明：模型不可用时本表单始终可填写、可提交；整理失败可点「改用手填」按字段补充。</p>
    <div className="flex gap-3">
      <button type="button" className="sdk-button primary" disabled={!valid || busy} onClick={analyze}>{analyzing ? '正在整理…' : '整理为结构化信息'}</button>
      <button type="button" className="sdk-button" disabled={!valid || busy} onClick={() => void submitRaw()}>{pending ? '正在提交…' : '直接原样提交'}</button>
      <button type="button" className="sdk-button" disabled={busy} onClick={onFallback}>改用手填</button>
    </div>
  </section>
}
