import { useCallback, useEffect, useState } from 'react'
import clsx from 'clsx'
import { feedbackV2Client, type FeedbackV2Attachment, type FeedbackV2Message } from '@/lib/api/feedbackV2Client'
import { getSignedUrl } from '@/lib/oss/upload/getSignedUrl'

interface FeedbackConversationPanelProps {
  feedbackId: number
  projectId?: number
  onChanged?: () => void
  onNotificationsRead?: () => void
  refreshKey?: number
}

function formatMessageTime(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleString('zh-CN', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}

function senderLabel(senderType: FeedbackV2Message['sender_type']) {
  if (senderType === 'customer') return '用户'
  if (senderType === 'system') return '系统'
  return '开发者'
}

function isInitialCustomerMessage(message: FeedbackV2Message, index: number) {
  if (message.sender_type !== 'customer') return false
  if (message.metadata && typeof message.metadata === 'object' && !Array.isArray(message.metadata)) {
    return (message.metadata as Record<string, unknown>).initial === true
  }
  return index === 0
}

function attachmentLabel(attachment: FeedbackV2Attachment) {
  return attachment.file_name || attachment.url || attachment.object_key?.split('/').pop() || '附件'
}

type AttachmentPreviewKind = 'image' | 'pdf' | null

const SIGNED_ATTACHMENT_URL_TTL_MS = 15 * 60 * 1000
const SIGNED_ATTACHMENT_URL_CACHE_SAFETY_WINDOW_MS = 60 * 1000
const MAX_SIGNED_ATTACHMENT_URL_CACHE_SIZE = 80

interface CachedAttachmentUrl {
  url: string
  expiresAt: number
}

const signedAttachmentUrlCache = new Map<string, CachedAttachmentUrl>()
const signedAttachmentUrlRequests = new Map<string, Promise<string>>()

function getAttachmentCacheKey(feedbackId: number, attachment: FeedbackV2Attachment) {
  if (!attachment.id || !attachment.object_key) return ''
  return `${feedbackId}:${attachment.id}:${attachment.object_key}`
}

function getCachedAttachmentUrl(cacheKey: string) {
  if (!cacheKey) return ''
  const cached = signedAttachmentUrlCache.get(cacheKey)
  if (!cached) return ''
  if (cached.expiresAt <= Date.now()) {
    signedAttachmentUrlCache.delete(cacheKey)
    return ''
  }
  return cached.url
}

function cacheAttachmentUrl(cacheKey: string, url: string, stsExpiration: string) {
  if (!cacheKey) return

  const now = Date.now()
  const stsExpiresAt = Date.parse(stsExpiration)
  const signedUrlExpiresAt = now + SIGNED_ATTACHMENT_URL_TTL_MS
  const expiresAt = Math.min(
    signedUrlExpiresAt,
    Number.isNaN(stsExpiresAt) ? signedUrlExpiresAt : stsExpiresAt,
  ) - SIGNED_ATTACHMENT_URL_CACHE_SAFETY_WINDOW_MS

  if (expiresAt <= now) return
  if (signedAttachmentUrlCache.size >= MAX_SIGNED_ATTACHMENT_URL_CACHE_SIZE) {
    signedAttachmentUrlCache.delete(signedAttachmentUrlCache.keys().next().value!)
  }
  signedAttachmentUrlCache.set(cacheKey, { url, expiresAt })
}

async function getOrCreateSignedAttachmentUrl(
  cacheKey: string,
  create: () => Promise<{ url: string; stsExpiration: string }>,
) {
  const cachedUrl = getCachedAttachmentUrl(cacheKey)
  if (cachedUrl) return cachedUrl

  const pendingRequest = signedAttachmentUrlRequests.get(cacheKey)
  if (pendingRequest) return pendingRequest

  const request = create()
    .then(({ url, stsExpiration }) => {
      cacheAttachmentUrl(cacheKey, url, stsExpiration)
      return url
    })
    .finally(() => {
      signedAttachmentUrlRequests.delete(cacheKey)
    })
  signedAttachmentUrlRequests.set(cacheKey, request)
  return request
}

function getAttachmentPreviewKind(attachment: FeedbackV2Attachment): AttachmentPreviewKind {
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

function AttachmentPreviewDialog({
  kind,
  name,
  previewUrl,
  sourceUrl,
  onClose,
}: {
  kind: Exclude<AttachmentPreviewKind, null>
  name: string
  previewUrl: string
  sourceUrl: string
  onClose: () => void
}) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/65 p-4" role="dialog" aria-modal="true" aria-label={`${name}预览`}>
      <section className="flex h-full max-h-[88dvh] w-full max-w-5xl flex-col overflow-hidden rounded-lg bg-surface shadow-2xl">
        <header className="flex items-center justify-between gap-3 border-b border-divider px-4 py-3">
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
        <div className="min-h-0 flex-1 bg-surface p-3">
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

function ConversationAttachment({ feedbackId, attachment }: { feedbackId: number; attachment: FeedbackV2Attachment }) {
  const attachmentCacheKey = getAttachmentCacheKey(feedbackId, attachment)
  const [sourceUrl, setSourceUrl] = useState(() => attachment.url || getCachedAttachmentUrl(attachmentCacheKey))
  const [previewUrl, setPreviewUrl] = useState('')
  const [previewOpen, setPreviewOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [imageLoadFailed, setImageLoadFailed] = useState(false)
  const kind = getAttachmentPreviewKind(attachment)
  const name = attachmentLabel(attachment)

  const closePreview = () => {
    setPreviewOpen(false)
    setPreviewUrl('')
  }

  const resolveSourceUrl = useCallback(async (forceRefresh = false) => {
    let nextUrl = forceRefresh ? '' : sourceUrl || attachment.url || ''
    if (!nextUrl && attachment.object_key) {
      if (!attachment.id) throw new Error('附件标识缺失，无法申请临时访问权限')
      const createSignedUrl = async () => {
        const credentials = await feedbackV2Client.getAttachmentCredentials(feedbackId, attachment.id!)
        const url = await getSignedUrl(attachment.object_key!, credentials, 900)
        return { url, stsExpiration: credentials.Expiration }
      }
      nextUrl = attachmentCacheKey
        ? await getOrCreateSignedAttachmentUrl(attachmentCacheKey, createSignedUrl)
        : (await createSignedUrl()).url
    }
    if (!nextUrl) nextUrl = attachment.url || ''
    if (!nextUrl) throw new Error('无法生成附件访问链接')
    setSourceUrl(nextUrl)
    return nextUrl
  }, [attachment.id, attachment.object_key, attachment.url, attachmentCacheKey, feedbackId, sourceUrl])

  useEffect(() => {
    if (kind !== 'image' || sourceUrl || imageLoadFailed) return

    const loadImage = async () => {
      setLoading(true)
      setError('')
      try {
        await resolveSourceUrl()
      } catch (err: any) {
        setError(err?.message || '加载图片失败')
      } finally {
        setLoading(false)
      }
    }

    void loadImage()
  }, [imageLoadFailed, kind, resolveSourceUrl, sourceUrl])

  const open = async () => {
    setLoading(true)
    setError('')
    try {
      const nextUrl = await resolveSourceUrl(imageLoadFailed)
      if (!kind) {
        window.open(nextUrl, '_blank', 'noopener,noreferrer')
        return
      }
      setImageLoadFailed(false)
      setPreviewUrl(nextUrl)
      setPreviewOpen(true)
    } catch (err: any) {
      setError(err?.message || '预览附件失败')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={clsx('max-w-full', kind === 'image' && 'w-24')}>
      {kind === 'image' && sourceUrl && !imageLoadFailed ? (
        <button
          type="button"
          onClick={() => void open()}
          className="group block w-full text-left"
          title={`查看大图：${name}`}
        >
          <img
            src={sourceUrl}
            alt={name}
            onError={() => {
              if (attachmentCacheKey) signedAttachmentUrlCache.delete(attachmentCacheKey)
              setImageLoadFailed(true)
              setError('图片加载失败，可尝试打开原文件')
            }}
            className="aspect-square w-full rounded-md border border-divider bg-surface object-cover shadow-sm transition-opacity group-hover:opacity-85"
          />
          <span className="mt-1 block truncate text-xs font-medium text-primary">{name}</span>
        </button>
      ) : (
        <button
          type="button"
          onClick={() => void open()}
          disabled={loading}
          className="max-w-full truncate rounded-md border border-divider bg-surface px-2 py-1 text-xs font-medium text-primary hover:border-primary/40 disabled:opacity-50"
        >
          {loading ? '正在加载图片...' : `${kind === 'image' ? '打开图片' : kind === 'pdf' ? '预览 PDF' : '打开附件'}：${name}`}
        </button>
      )}
      {error ? <p className="mt-1 text-xs text-error">{error}</p> : null}
      {previewOpen && previewUrl && kind ? (
        <AttachmentPreviewDialog kind={kind} name={name} previewUrl={previewUrl} sourceUrl={sourceUrl} onClose={closePreview} />
      ) : null}
    </div>
  )
}

export function FeedbackConversationPanel({ feedbackId, projectId, onChanged, onNotificationsRead, refreshKey = 0 }: FeedbackConversationPanelProps) {
  const [messages, setMessages] = useState<FeedbackV2Message[]>([])
  const [draft, setDraft] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')

  const loadMessages = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      setMessages(await feedbackV2Client.getMessages(feedbackId))
      if (projectId) {
        try {
          const result = await feedbackV2Client.markNotificationsRead({ projectId, feedbackId })
          if (result.markedCount > 0) onNotificationsRead?.()
        } catch {
          // A read receipt failure must not hide the conversation from developers.
        }
      }
    } catch (err: any) {
      setError(err?.message || '加载消息失败')
    } finally {
      setLoading(false)
    }
  }, [feedbackId, onNotificationsRead, projectId])

  useEffect(() => {
    setDraft('')
    setFile(null)
    void loadMessages()
  }, [loadMessages, refreshKey])

  const send = async () => {
    const content = draft.trim()
    if (!content && !file) {
      setError('请输入回复内容或选择附件')
      return
    }

    setSending(true)
    setError('')
    try {
      let attachments: FeedbackV2Attachment[] | undefined
      if (file) {
        const mimeType = file.type.trim().toLowerCase()
        if (!mimeType) {
          throw new Error('无法识别附件类型，请选择一个受支持的文件')
        }
        const isImage = mimeType.startsWith('image/')
        const policy = await feedbackV2Client.createDeveloperUploadPolicy({
          feedbackId,
          type: isImage ? 'image' : 'file',
          fileName: file.name,
          mimeType,
          size: file.size,
        })
        await feedbackV2Client.uploadWithPolicy(file, policy)
        attachments = [{
          type: isImage ? 'image' : 'file',
          object_key: policy.object_key,
          file_name: file.name,
          mime_type: mimeType,
          size: file.size,
        }]
      }

      const message = await feedbackV2Client.createDeveloperMessage({
        feedbackId,
        content,
        metadata: { source: 'feedback-console-web' },
        attachments,
      })
      setMessages((current) => [...current, message])
      setDraft('')
      setFile(null)
      onChanged?.()
    } catch (err: any) {
      setError(err?.message || '发送回复失败')
    } finally {
      setSending(false)
    }
  }

  return (
    <section className="flex h-full min-h-0 flex-col" aria-label="反馈会话">
      <div className="shrink-0 border-b border-divider bg-surface-elevated px-4 py-3">
        <div className="rounded-lg border border-divider bg-surface p-2.5 shadow-sm">
          <div className="mb-1.5 flex items-center gap-2 text-xs">
            <span className="rounded-md border border-divider bg-surface-elevated px-2 py-1 font-semibold text-foreground-secondary">回复用户</span>
            <span className="text-foreground-tertiary">同步处理进展或补充说明</span>
          </div>
          <textarea
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            rows={2}
            disabled={sending}
            placeholder="写下处理进展，用户将会在反馈中看到这条回复..."
            className="w-full resize-none bg-transparent px-0 py-0.5 text-sm text-foreground outline-none placeholder:text-foreground-tertiary"
          />
          <div className="mt-1.5 flex flex-wrap items-center justify-between gap-2 border-t border-divider pt-1.5">
            <label className="max-w-full cursor-pointer truncate text-xs font-medium text-foreground-secondary hover:text-primary">
              <input
                type="file"
                className="sr-only"
                accept="image/jpeg,image/png,image/webp,image/gif,application/pdf,text/plain,text/csv,application/zip,.docx,.xlsx,.pptx"
                onChange={(event) => setFile(event.target.files?.[0] || null)}
                disabled={sending}
              />
              {file ? `附件：${file.name}` : '添加附件'}
            </label>
            <button
              type="button"
              onClick={() => void send()}
              disabled={sending || (!draft.trim() && !file)}
              className="rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-white hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-50"
            >
              {sending ? '发送中...' : '发布回复'}
            </button>
          </div>
          {error ? <p className="mt-2 text-xs text-error">{error}</p> : null}
        </div>
      </div>

      <div className="scrollbar-slim min-h-0 flex-1 overflow-y-auto px-5 py-4">
        {loading ? <p className="py-2 text-xs text-foreground-secondary">正在加载沟通记录...</p> : null}
        {!loading && !messages.length ? <p className="py-2 text-xs text-foreground-secondary">暂未有补充沟通，可以先回复用户。</p> : null}
        <div className="space-y-3">
          {messages.map((message, messageIndex) => {
            const initial = isInitialCustomerMessage(message, messageIndex)
            const systemEvent = message.sender_type === 'system'
            const label = initial
              ? '用户原始反馈'
              : message.sender_type === 'developer'
                ? '开发者更新'
                : message.sender_type === 'customer'
                  ? '用户补充'
                  : senderLabel(message.sender_type)

            if (systemEvent) {
              return (
                <div key={message.id} className="flex items-center gap-3 py-0.5" role="status">
                  <span className="h-px flex-1 bg-divider" />
                  <div className="flex max-w-[80%] items-center gap-2 rounded-full border border-divider bg-surface-elevated px-3 py-1.5 text-xs text-foreground-secondary">
                    <span className="font-semibold text-foreground-tertiary">系统更新</span>
                    {message.content ? <span className="truncate">{message.content}</span> : null}
                    <time className="shrink-0 text-[11px] text-foreground-tertiary">{formatMessageTime(message.created_at)}</time>
                  </div>
                  <span className="h-px flex-1 bg-divider" />
                </div>
              )
            }

            const messageStyle = initial
              ? {
                  article: 'border-primary/25 bg-primary-lighter/10',
                  label: 'rounded-md bg-primary-lighter px-2 py-1 text-primary',
                }
              : message.sender_type === 'developer'
                ? {
                    article: 'border-divider bg-surface-elevated',
                    label: 'rounded-md bg-success-lighter px-2 py-1 text-success',
                  }
                : {
                    article: 'border-divider bg-surface',
                    label: 'rounded-md bg-warning-lighter px-2 py-1 text-warning',
                  }

            return (
              <article
                key={message.id}
                className={clsx(
                  'rounded-lg border px-4 py-3.5',
                  messageStyle.article,
                )}
              >
                <div className="flex items-center justify-between gap-3 text-[11px] text-foreground-tertiary">
                  <span className={clsx('font-semibold', messageStyle.label)}>
                    {label}
                  </span>
                  <time>{formatMessageTime(message.created_at)}</time>
                </div>
                {message.content ? (
                  <p className={clsx('mt-2 whitespace-pre-wrap text-foreground', initial ? 'text-base leading-6' : 'text-sm leading-6')}>
                    {message.content}
                  </p>
                ) : null}
                {message.attachments?.length ? (
                  <div className="mt-3">
                    <p className="mb-2 text-[11px] font-semibold text-foreground-tertiary">附件 {message.attachments.length}</p>
                    <div className="flex flex-wrap gap-2">
                      {message.attachments.map((attachment, index) => (
                        <ConversationAttachment key={`${message.id}-${attachment.object_key || attachment.url || index}`} feedbackId={message.feedback_id} attachment={attachment} />
                      ))}
                    </div>
                  </div>
                ) : null}
              </article>
            )
          })}
        </div>
      </div>
    </section>
  )
}
