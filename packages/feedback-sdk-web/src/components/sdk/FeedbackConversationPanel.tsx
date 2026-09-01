import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import clsx from 'clsx'
import { createFeedbackMessageV2, getFeedbackMessagesV2, markFeedbackNotificationsReadV2, type FeedbackV2Message } from '@/lib/feedback/v2'
import { uploadFeedbackFileV2 } from '@/lib/feedback/upload'
import { FeedbackMessageAttachment } from '@/components/sdk/FeedbackMessageAttachment'
import { isFeedbackSDKV2NotificationsEnabled } from '@/lib/sdk'

function formatMessageTime(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleString('zh-CN', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}

function senderLabel(senderType: FeedbackV2Message['sender_type']) {
  if (senderType === 'developer') return '开发者'
  if (senderType === 'system') return '系统'
  return '我'
}

function buildClientMessageId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') return crypto.randomUUID()
  return `sdk_${Date.now()}_${Math.random().toString(36).slice(2, 12)}`
}

export function FeedbackConversationPanel({ feedbackId, onNotificationsRead }: { feedbackId: string; onNotificationsRead?: (feedbackId: string, markedCount: number) => void }) {
  const numericFeedbackId = useMemo(() => Number(feedbackId), [feedbackId])
  const [messages, setMessages] = useState<FeedbackV2Message[]>([])
  const [draft, setDraft] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const loadRequestRef = useRef(0)
  const onNotificationsReadRef = useRef(onNotificationsRead)

  useEffect(() => {
    onNotificationsReadRef.current = onNotificationsRead
  }, [onNotificationsRead])

  const loadMessages = useCallback(async () => {
    if (!Number.isFinite(numericFeedbackId) || numericFeedbackId <= 0) return
    const requestId = loadRequestRef.current + 1
    loadRequestRef.current = requestId
    setLoading(true)
    setError('')
    try {
      const nextMessages = await getFeedbackMessagesV2(numericFeedbackId, { page: 1, pageSize: 100 })
      if (requestId !== loadRequestRef.current) return
      setMessages(nextMessages)
      if (isFeedbackSDKV2NotificationsEnabled()) {
        try {
          const result = await markFeedbackNotificationsReadV2({ feedbackId: numericFeedbackId })
          if (requestId !== loadRequestRef.current) return
          if (result.markedCount > 0) onNotificationsReadRef.current?.(feedbackId, result.markedCount)
        } catch {
          // Read receipts must not prevent a customer from seeing the conversation.
        }
      }
    } catch (err: any) {
      if (requestId === loadRequestRef.current) {
        setError(err?.message || '加载会话失败，请稍后重试')
      }
    } finally {
      if (requestId === loadRequestRef.current) setLoading(false)
    }
  }, [feedbackId, numericFeedbackId])

  useEffect(() => {
    setDraft('')
    setFile(null)
    setMessages([])
    void loadMessages()
    return () => {
      loadRequestRef.current += 1
    }
  }, [loadMessages])

  const sendMessage = async () => {
    const content = draft.trim()
    if (!content && !file) {
      setError('请输入补充内容或选择附件')
      return
    }
    if (!Number.isFinite(numericFeedbackId) || numericFeedbackId <= 0) {
      setError('反馈编号无效')
      return
    }

    setSending(true)
    setError('')
    try {
      const attachments = file ? [await uploadFeedbackFileV2({ file })] : []
      const message = await createFeedbackMessageV2({
        feedbackId: numericFeedbackId,
        content,
        clientMessageId: buildClientMessageId(),
        metadata: { source: 'feedback-sdk-web', channel: 'webview' },
        attachments,
      })
      setMessages((current) => [...current, message])
      setDraft('')
      setFile(null)
    } catch (err: any) {
      setError(err?.message || '发送失败，请稍后重试')
    } finally {
      setSending(false)
    }
  }

  return (
    <section aria-label="反馈会话" className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-semibold text-foreground">沟通记录</p>
        <button type="button" onClick={() => void loadMessages()} disabled={loading || sending} className="text-xs font-semibold text-primary hover:text-primary-hover disabled:opacity-50">
          刷新
        </button>
      </div>

      {loading ? <p className="text-xs text-foreground-secondary">正在加载消息...</p> : null}
      {!loading && !messages.length ? <p className="text-xs text-foreground-secondary">暂无补充消息。</p> : null}

      <div className="scrollbar-slim max-h-[34dvh] space-y-2 overflow-y-auto pr-1">
        {messages.map((message) => (
          <article
            key={message.id}
            className={clsx(
              'rounded-lg border px-3 py-2.5 text-sm',
              message.sender_type === 'customer' ? 'border-primary/25 bg-primary-light/40' : 'border-divider bg-surface',
            )}
          >
            <div className="flex items-center justify-between gap-3 text-[11px] text-foreground-tertiary">
              <span className="font-semibold text-foreground-secondary">{senderLabel(message.sender_type)}</span>
              <time>{formatMessageTime(message.created_at)}</time>
            </div>
            {message.content ? <p className="mt-1.5 whitespace-pre-wrap leading-5 text-foreground">{message.content}</p> : null}
            {message.attachments?.length ? (
              <div className="mt-2 flex flex-wrap gap-2">
                {message.attachments.map((attachment, index) => (
                  <FeedbackMessageAttachment key={`${message.id}-${attachment.object_key || attachment.url || index}`} feedbackId={message.feedback_id} attachment={attachment} />
                ))}
              </div>
            ) : null}
          </article>
        ))}
      </div>

      <div className="space-y-2 rounded-lg border border-divider bg-surface-elevated p-3">
        <textarea
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder="补充问题、回复开发者..."
          rows={3}
          disabled={sending}
          className="w-full resize-none rounded-md border border-divider bg-surface px-3 py-2 text-sm text-foreground outline-none placeholder:text-foreground-tertiary focus:border-primary"
        />
        <div className="flex flex-wrap items-center justify-between gap-2">
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
            onClick={() => void sendMessage()}
            disabled={sending || (!draft.trim() && !file)}
            className="rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-white hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-50"
          >
            {sending ? '发送中...' : '发送'}
          </button>
        </div>
        {error ? <p className="text-xs text-error">{error}</p> : null}
      </div>
    </section>
  )
}
