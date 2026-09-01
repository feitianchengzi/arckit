import { useEffect, useState } from 'react'
import type { FeedbackV2Attachment } from '@/lib/feedback/v2'
import { getFeedbackAttachmentURLV2 } from '@/lib/feedback/upload'

type PreviewKind = 'image' | 'pdf' | null

function attachmentLabel(attachment: FeedbackV2Attachment) {
  return attachment.file_name || attachment.url || attachment.object_key?.split('/').pop() || '附件'
}

function getPreviewKind(attachment: FeedbackV2Attachment): PreviewKind {
  const mimeType = attachment.mime_type?.toLowerCase() || ''
  const name = attachmentLabel(attachment).toLowerCase()
  if (attachment.type === 'image' || mimeType.startsWith('image/') || /\.(png|jpe?g|webp|gif|bmp|svg)$/.test(name)) {
    return 'image'
  }
  if (mimeType === 'application/pdf' || name.endsWith('.pdf')) {
    return 'pdf'
  }
  return null
}

async function createInlinePreviewUrl(sourceUrl: string, mimeType: string) {
  const response = await fetch(sourceUrl)
  if (!response.ok) throw new Error(`读取附件失败：${response.status}`)
  const file = await response.blob()
  return URL.createObjectURL(new Blob([file], { type: mimeType }))
}

function AttachmentPreviewDialog({
  kind,
  name,
  previewUrl,
  sourceUrl,
  onClose,
}: {
  kind: Exclude<PreviewKind, null>
  name: string
  previewUrl: string
  sourceUrl: string
  onClose: () => void
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 p-3" role="dialog" aria-modal="true" aria-label={`${name}预览`}>
      <section className="flex h-full max-h-[88dvh] w-full max-w-4xl flex-col overflow-hidden rounded-lg bg-surface shadow-2xl">
        <header className="flex items-center justify-between gap-3 border-b border-divider px-3 py-2.5">
          <p className="min-w-0 truncate text-sm font-semibold text-foreground">{name}</p>
          <div className="flex shrink-0 items-center gap-3">
            <a href={sourceUrl} target="_blank" rel="noopener noreferrer" className="text-xs font-semibold text-primary hover:text-primary-hover">
              下载
            </a>
            <button type="button" onClick={onClose} className="text-xl leading-none text-foreground-secondary hover:text-foreground" aria-label="关闭预览" title="关闭预览">
              ×
            </button>
          </div>
        </header>
        <div className="min-h-0 flex-1 bg-surface p-2">
          {kind === 'image' ? (
            <img src={previewUrl} alt={name} className="h-full w-full object-contain" />
          ) : (
            <iframe src={previewUrl} title={name} className="h-full w-full rounded border border-divider bg-white" />
          )}
        </div>
      </section>
    </div>
  )
}

export function FeedbackMessageAttachment({ feedbackId, attachment }: { feedbackId: number; attachment: FeedbackV2Attachment }) {
  const [sourceUrl, setSourceUrl] = useState(attachment.url || '')
  const [previewUrl, setPreviewUrl] = useState('')
  const [previewOpen, setPreviewOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const kind = getPreviewKind(attachment)
  const name = attachmentLabel(attachment)

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl)
    }
  }, [previewUrl])

  const closePreview = () => {
    setPreviewOpen(false)
    setPreviewUrl((current) => {
      if (current) URL.revokeObjectURL(current)
      return ''
    })
  }

  const openAttachment = async () => {
    setLoading(true)
    setError('')
    try {
      let nextUrl = sourceUrl || attachment.url || ''
      if (!nextUrl && attachment.object_key) {
        if (!attachment.id) throw new Error('附件标识缺失，无法申请临时访问权限')
        nextUrl = await getFeedbackAttachmentURLV2({
          feedbackId,
          attachmentId: attachment.id,
          objectKey: attachment.object_key,
        })
      }
      if (!nextUrl) throw new Error('无法生成附件访问链接')
      setSourceUrl(nextUrl)
      if (!kind) {
        window.open(nextUrl, '_blank', 'noopener,noreferrer')
        return
      }
      const nextPreviewUrl = await createInlinePreviewUrl(nextUrl, kind === 'pdf' ? 'application/pdf' : attachment.mime_type || 'image/*')
      setPreviewUrl(nextPreviewUrl)
      setPreviewOpen(true)
    } catch (err: any) {
      setError(err?.message || '预览附件失败')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-full">
      <button
        type="button"
        onClick={() => void openAttachment()}
        disabled={loading}
        className="max-w-full truncate rounded-md border border-divider bg-surface-elevated px-2 py-1 text-xs font-medium text-primary hover:border-primary/40 disabled:opacity-50"
      >
        {loading ? '正在加载...' : `${kind === 'image' ? '预览图片' : kind === 'pdf' ? '预览 PDF' : '打开附件'}：${name}`}
      </button>
      {error ? <p className="mt-1 text-xs text-error">{error}</p> : null}
      {previewOpen && previewUrl && kind ? (
        <AttachmentPreviewDialog kind={kind} name={name} previewUrl={previewUrl} sourceUrl={sourceUrl} onClose={closePreview} />
      ) : null}
    </div>
  )
}
