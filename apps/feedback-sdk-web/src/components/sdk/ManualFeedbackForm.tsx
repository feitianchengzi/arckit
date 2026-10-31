import { useEffect, useRef, useState } from 'react'
import { newClientRequestId, validateMedia } from '@/domain/feedback'
import { uploadFeedbackFileV2 } from '@/lib/feedback/upload'
import { submitFeedbackV2, type AgentStructuredSummary, type FeedbackV2Attachment } from '@/lib/feedback/v2'

interface Draft { position: string; phenomenon: string; expect: string; attachments: FeedbackV2Attachment[]; requestId: string }
const blank = (): Draft => ({ position: '', phenomenon: '', expect: '', attachments: [], requestId: newClientRequestId() })
export function ManualFeedbackForm({ scopeKey, conversationId, onCancel, onCreated, onPendingChange }: { scopeKey: string; conversationId?: string; onCancel: () => void; onCreated: (value: { id: number; shortId: string }) => void; onPendingChange?: (pending: boolean) => void }) {
  const storageKey = `feedback-manual:${scopeKey}:${conversationId || 'new'}`
  const [draft, setDraft] = useState<Draft>(() => { try { const value = JSON.parse(sessionStorage.getItem(storageKey) || 'null'); return value && typeof value.position === 'string' && typeof value.phenomenon === 'string' && typeof value.expect === 'string' && Array.isArray(value.attachments) ? { ...value, requestId: value.requestId || newClientRequestId() } : blank() } catch { return blank() } })
  const [confirmed, setConfirmed] = useState(false), [pending, setPending] = useState(false), [uploading, setUploading] = useState(false), [error, setError] = useState('')
  useEffect(() => { onPendingChange?.(pending || uploading) }, [pending, uploading, onPendingChange])
  const alive = useRef(true), locked = useRef(false)
  useEffect(() => { alive.current = true; return () => { alive.current = false } }, [])
  useEffect(() => { try { sessionStorage.setItem(storageKey, JSON.stringify({ ...draft, attachments: draft.attachments.filter((attachment) => attachment.object_key).map(({ url: _url, access_path: _access, ...attachment }) => attachment) })) } catch { /* The current in-memory draft remains usable. */ } }, [draft, storageKey])
  const update = (next: Partial<Draft>) => { setDraft((old) => ({ ...old, ...next, requestId: newClientRequestId() })); setConfirmed(false) }
  const upload = async (files: File[]) => {
    if (locked.current || uploading) return
    setUploading(true); setError('')
    let attachments = [...draft.attachments]
    try {
      for (const file of files) {
        const validation = file.type.startsWith('image/') ? validateMedia(file, attachments) : '仅支持上传图片说明问题。'
        if (validation) throw new Error(validation)
        const item = await uploadFeedbackFileV2({ file })
        if (!alive.current) return
        attachments = [...attachments, item]
        setDraft((old) => ({ ...old, attachments, requestId: newClientRequestId() })); setConfirmed(false)
      }
    } catch (e) { if (alive.current) setError(e instanceof Error ? e.message : '图片上传失败，请重新选择重试。') }
    finally { if (alive.current) setUploading(false) }
  }
  const submit = async () => {
    if (locked.current || uploading || !confirmed || !draft.position.trim() || !draft.phenomenon.trim() || !draft.expect.trim()) return
    locked.current = true; setPending(true); setError('')
    const structured: AgentStructuredSummary = { request_type: 'other', position: draft.position.trim(), phenomenon: draft.phenomenon.trim(), expect: draft.expect.trim(), unknown_fields: ['reproduction_steps', 'environment', 'impact'] }
    try {
      const result = await submitFeedbackV2({ content: `位置：${structured.position}\n现象：${structured.phenomenon}\n期望：${structured.expect}`, structured, attachments: draft.attachments, conversationId, clientRequestId: draft.requestId })
      if (!alive.current) return
      try { sessionStorage.removeItem(storageKey) } catch { /* Submission succeeded even if browser storage is blocked. */ }
      onCreated(result)
    } catch (e) { if (alive.current) setError(e instanceof Error ? e.message : '反馈提交失败，请稍后重试。') }
    finally { locked.current = false; if (alive.current) setPending(false) }
  }
  return <section className="sdk-collection space-y-3" aria-label="直接反馈"><h3 className="font-semibold">直接反馈</h3><p className="text-xs text-foreground-secondary">无需等待客服回答。请描述实际情况，提交后由处理团队分析；不会自动判定为故障或需求。</p>
    {([['position', '问题位置'], ['phenomenon', '实际现象'], ['expect', '期望结果']] as const).map(([key, label]) => <label key={key} className="block text-xs">{label}<textarea className="sdk-input mt-1" value={draft[key]} maxLength={8000} disabled={pending || uploading} rows={2} onChange={(event) => update({ [key]: event.target.value })} /></label>)}
    <label className="sdk-button">添加说明图片<input aria-label="直接反馈图片" className="sr-only" type="file" accept="image/jpeg,image/png,image/webp,image/gif" multiple disabled={pending || uploading} onChange={(event) => { void upload([...(event.target.files || [])]); event.target.value = '' }} /></label>
    {uploading && <p role="status">正在上传图片…</p>}{draft.attachments.map((attachment, index) => <div key={attachment.object_key || index} className="text-xs">{attachment.file_name || `图片 ${index + 1}`} · 已上传 <button type="button" disabled={pending || uploading} onClick={() => update({ attachments: draft.attachments.filter((_, i) => i !== index) })}>移除</button></div>)}
    <label className="flex gap-2 text-xs"><input type="checkbox" checked={confirmed} disabled={pending || uploading} onChange={(event) => setConfirmed(event.target.checked)} />我已核对以上事实，确认提交给处理团队</label>
    {error && <p role="alert" className="text-xs text-error">{error}</p>}<div className="flex gap-3"><button type="button" className="sdk-button" disabled={pending || uploading} onClick={onCancel}>返回咨询并保留草稿</button><button type="button" className="sdk-button primary" disabled={pending || uploading || !confirmed || !draft.position.trim() || !draft.phenomenon.trim() || !draft.expect.trim()} onClick={() => void submit()}>{pending ? '正在提交…' : '确认提交反馈'}</button></div>
  </section>
}
