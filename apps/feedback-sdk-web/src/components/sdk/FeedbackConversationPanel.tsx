import { useCallback, useEffect, useRef, useState } from 'react'
import { createFeedbackMessageV2, getConversationMessagesPageV2, markFeedbackNotificationsReadV2, type ConversationMessage, type FeedbackV2Attachment } from '@/lib/feedback/v2'
import { FeedbackMessageAttachment } from './FeedbackMessageAttachment'
import { MediaComposer } from './MediaComposer'
import { isFeedbackSDKV2NotificationsEnabled } from '@/lib/sdk'
import { mergeMessages } from '@/domain/feedback'
import { t } from '@/i18n'

export function FeedbackConversationPanel({ feedbackId, onNotificationsRead, refreshKey }: { feedbackId: string; onNotificationsRead?: (feedbackId: string, markedCount: number) => void; refreshKey?: number }) {
  const [messages, setMessages] = useState<ConversationMessage[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const request = useRef(0)
  const pageRef = useRef(1)
  const callbackRef = useRef(onNotificationsRead)
  callbackRef.current = onNotificationsRead
  const viewport = useRef<HTMLDivElement>(null)
  const [newMessages, setNewMessages] = useState(false)

  const load = useCallback(async (nextPage = 1, refresh = false) => {
    if (!Number.isFinite(Number(feedbackId)) || Number(feedbackId) <= 0) return
    const version = ++request.current
    setLoading(true); setError('')
    try {
      const target = refresh ? pageRef.current : nextPage
      const requestedPages = refresh ? Array.from({ length: target }, (_, index) => index + 1) : [nextPage]
      const pages = await Promise.all(requestedPages.map((page) => getConversationMessagesPageV2(Number(feedbackId), { page, pageSize: 50 })))
      if (version !== request.current) return
      setMessages((previous) => mergeMessages(refresh || nextPage === 1 ? [] : previous, pages.flatMap((p) => p.messages)))
      setTotal(pages[0]?.total || 0); pageRef.current = target; setPage(target)
      const node = viewport.current
      if (refresh && node && node.scrollHeight - node.scrollTop - node.clientHeight > 80) setNewMessages(true)
      if (isFeedbackSDKV2NotificationsEnabled() && (pages[0]?.total || 0) <= pages.flatMap((p) => p.messages).length) {
        try {
          const result = await markFeedbackNotificationsReadV2({ feedbackId: Number(feedbackId) })
          if (version === request.current && result.markedCount) callbackRef.current?.(feedbackId, result.markedCount)
        } catch { /* Read receipts never prevent reading conversation history. */ }
      }
    } catch (e) { if (version === request.current) setError(e instanceof Error ? e.message : t('agent.error_load')) }
    finally { if (version === request.current) setLoading(false) }
  }, [feedbackId])
  useEffect(() => {
    setMessages([]); pageRef.current = 1; setPage(1); void load()
    return () => { request.current++ }
  }, [load])
  const refreshSeen = useRef(refreshKey)
  useEffect(() => {
    if (refreshSeen.current !== refreshKey) { refreshSeen.current = refreshKey; void load(1, true) }
  }, [refreshKey, load])
  const send = async (content: string, attachments: FeedbackV2Attachment[], clientMessageId: string) => {
    const message = await createFeedbackMessageV2({ feedbackId: Number(feedbackId), content, attachments, clientMessageId, metadata: { source: 'feedback-sdk-web', channel: 'webview' } })
    setMessages((current) => mergeMessages(current, [{ id: message.id, source: 'feedback', sender_type: message.sender_type, content: message.content, attachments: message.attachments, created_at: message.created_at }]))
    setTotal((current) => current + 1)
    requestAnimationFrame(() => { const node = viewport.current; if (node) node.scrollTo({ top: node.scrollHeight, behavior: 'smooth' }) })
  }
  return <section aria-label={t('conversation.title')} className="sdk-conversation">
    <div className="sdk-notice">原咨询、团队回复与补充内容保留在同一卡片中，无需重复提交。</div>
    <div className="row flex items-center justify-between my-3"><small>{messages.length} / {total} 条记录</small><button type="button" disabled={loading} onClick={() => void load(1, true)} className="text-xs text-primary">刷新记录</button></div>
    {error && <p role="alert" className="text-xs text-error">{error}</p>}
    <div ref={viewport} className="sdk-conversation-messages">
      {messages.map((message) => <article key={`${message.source}:${message.id}`} className={`sdk-message ${message.sender_type === 'customer' ? 'mine' : ''}`}>
        <div className="sdk-message-avatar" aria-hidden="true">{message.sender_type === 'customer' ? '我' : message.sender_type === 'agent' ? '✧' : '支'}</div><div className="sdk-message-main"><div className="sdk-message-by">{message.sender_type === 'agent' ? t('agent.title') : message.sender_type === 'developer' ? t('conversation.sender.developer') : message.sender_type === 'system' ? t('conversation.sender.system') : t('conversation.sender.customer')} · <time>{new Date(message.created_at).toLocaleString()}</time></div>
        <div className="sdk-message-body">{message.content && <p className="whitespace-pre-wrap">{message.content}</p>}{message.attachments?.map((attachment, index) => <FeedbackMessageAttachment key={`${attachment.object_key || attachment.id || index}`} feedbackId={Number(feedbackId)} attachment={attachment} />)}</div></div>
      </article>)}
      {!loading && !messages.length && <p className="text-sm text-foreground-secondary">暂无沟通记录，可在下方补充问题。</p>}
    </div>
    {messages.length < total && <button type="button" className="sdk-button my-3" disabled={loading} onClick={() => void load(page + 1)}>加载更多沟通记录</button>}
    {newMessages && <button className="sdk-button" type="button" onClick={() => { setNewMessages(false); viewport.current?.scrollTo({ top: viewport.current.scrollHeight, behavior: 'smooth' }) }}>有新消息，前往查看</button>}
    {loading && <p role="status" className="text-xs text-foreground-secondary">正在加载记录…</p>}
    <MediaComposer key={feedbackId} allowFiles onSend={send} placeholder={t('conversation.placeholder')} />
  </section>
}
