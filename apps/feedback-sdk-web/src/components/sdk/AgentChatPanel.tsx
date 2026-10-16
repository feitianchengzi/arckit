import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import clsx from 'clsx'
import {
  sendAgentMessage,
  getAgentConversationMessages,
  sendStandaloneAgentMessage,
  getStandaloneAgentConversations,
  getStandaloneAgentMessages,
  type AgentMessage,
  type AgentConversation,
  type AgentStructuredSummary,
  type FeedbackV2Attachment,
  getAgentConversations,
} from '@/lib/feedback/v2'
import { uploadFeedbackImageV2 } from '@/lib/feedback/upload'
import { t } from '@/i18n'

function formatMessageTime(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleString('zh-CN', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}

function senderLabel(senderType: AgentMessage['sender_type']) {
  if (senderType === 'agent') return t('agent.title')
  if (senderType === 'developer') return t('conversation.sender.developer')
  if (senderType === 'system') return t('conversation.sender.system')
  return t('conversation.sender.customer')
}

interface AgentChatPanelProps {
  /** 绑定反馈的会话；standalone 模式下可省略 */
  feedbackId?: string
  /** 独立智能客服会话：不绑定反馈，按 project + 客户维度隔离（「反馈建议」页入口） */
  standalone?: boolean
  /** 提交反馈后自动发送的首条消息（反馈内容本身），发送一次后消费 */
  initialMessage?: string
  /**
   * 本轮回答低置信（need_collect）时上报。
   * question 为客户本轮提问原文；structured 为客服总结的问题结构（模型生成，可能为 undefined）。
   * 宿主决定后续动作：提交页据此预填表单，会话页追加到当前反馈。
   */
  onNeedCollect?: (payload: { question: string; structured?: AgentStructuredSummary }) => void
  /**
   * 会话 ID 确定时上报（standalone 模式下宿主据此在提交反馈时关联该会话，使咨询上下文延续）。
   * 加载已有会话或首次发送后服务端分配 ID 时各触发一次。
   */
  onConversationReady?: (conversationId: string) => void
}

export function AgentChatPanel({ feedbackId, standalone = false, initialMessage, onNeedCollect, onConversationReady }: AgentChatPanelProps) {
  const numericFeedbackId = useMemo(() => Number(feedbackId ?? 0), [feedbackId])
  const [messages, setMessages] = useState<AgentMessage[]>([])
  const [draft, setDraft] = useState('')
  const [loading, setLoading] = useState(false)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const [conversationId, setConversationId] = useState<string>('')
  const [image, setImage] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string>('')
  const [uploading, setUploading] = useState(false)
  const [uploadedAttachment, setUploadedAttachment] = useState<FeedbackV2Attachment | null>(null)
  const loadRequestRef = useRef(0)
  const messagesContainerRef = useRef<HTMLDivElement>(null)
  const conversationIdRef = useRef('')
  const initialMessageRef = useRef(initialMessage?.trim() || '')
  const onNeedCollectRef = useRef(onNeedCollect)
  const onConversationReadyRef = useRef(onConversationReady)

  useEffect(() => {
    onNeedCollectRef.current = onNeedCollect
  }, [onNeedCollect])

  useEffect(() => {
    onConversationReadyRef.current = onConversationReady
  }, [onConversationReady])

  useEffect(() => {
    conversationIdRef.current = conversationId
  }, [conversationId])

  const scrollToBottom = useCallback(() => {
    // 只滚消息容器自身，避免 scrollIntoView 连带滚动外层页面
    const container = messagesContainerRef.current
    if (!container) return
    container.scrollTo({ top: container.scrollHeight, behavior: 'smooth' })
  }, [])

  const clearImage = useCallback(() => {
    setImage(null)
    setImagePreview('')
    setUploadedAttachment(null)
  }, [])

  const handleSelectImage = async (file: File | null) => {
    if (!file) return
    if (!file.type.toLowerCase().startsWith('image/')) {
      setError(t('agent.error_empty'))
      return
    }
    clearImage()
    setImage(file)
    setImagePreview(URL.createObjectURL(file))
    setUploading(true)
    setError('')
    try {
      const attachment = await uploadFeedbackImageV2({ file })
      setUploadedAttachment(attachment)
    } catch (err: any) {
      setError(err?.message || t('agent.error_send'))
      clearImage()
    } finally {
      setUploading(false)
    }
  }

  const sendMessage = useCallback(async (rawContent: string) => {
    const content = rawContent.trim()
    if (!content && !uploadedAttachment) {
      setError(t('agent.error_empty'))
      return
    }
    if (!standalone && (!Number.isFinite(numericFeedbackId) || numericFeedbackId <= 0)) {
      setError(t('agent.error_invalid_id'))
      return
    }

    setSending(true)
    setError('')
    try {
      const userMessage: AgentMessage = {
        id: Date.now(),
        conversation_id: conversationIdRef.current,
        feedback_id: standalone ? 0 : numericFeedbackId,
        project_id: 0,
        sender_type: 'customer',
        content,
        created_at: new Date().toISOString(),
      }
      setMessages((current) => [...current, userMessage])

      const response = standalone
        ? await sendStandaloneAgentMessage({
            content,
            conversationId: conversationIdRef.current || undefined,
            attachments: uploadedAttachment ? [uploadedAttachment] : undefined,
          })
        : await sendAgentMessage({
            feedbackId: numericFeedbackId,
            content,
            conversationId: conversationIdRef.current || undefined,
            attachments: uploadedAttachment ? [uploadedAttachment] : undefined,
          })

      if (!conversationIdRef.current && response.conversation_id) {
        conversationIdRef.current = response.conversation_id
        setConversationId(response.conversation_id)
        onConversationReadyRef.current?.(response.conversation_id)
      }

      const agentMessage: AgentMessage = {
        id: response.message_id,
        conversation_id: response.conversation_id,
        feedback_id: standalone ? 0 : numericFeedbackId,
        project_id: 0,
        sender_type: 'agent',
        content: response.content,
        confidence: response.confidence,
        created_at: new Date().toISOString(),
      }
      setMessages((current) => [...current, agentMessage])
      // 发送成功后清空已上传图片
      clearImage()
      // 低置信兜底：交给宿主走现有反馈提交链路（预填 / 追加）
      if (response.need_collect) {
        onNeedCollectRef.current?.({ question: content, structured: response.structured })
      }
    } catch (err: any) {
      setError(err?.message || t('agent.error_send'))
    } finally {
      setSending(false)
    }
  }, [standalone, numericFeedbackId, uploadedAttachment])

  const loadConversation = useCallback(async () => {
    if (!standalone && (!Number.isFinite(numericFeedbackId) || numericFeedbackId <= 0)) return
    const requestId = loadRequestRef.current + 1
    loadRequestRef.current = requestId
    setLoading(true)
    setError('')
    try {
      const convs = standalone ? await getStandaloneAgentConversations() : await getAgentConversations(numericFeedbackId)
      if (requestId !== loadRequestRef.current) return

      if (convs.length > 0) {
        const conv: AgentConversation = convs[0]
        conversationIdRef.current = conv.id
        setConversationId(conv.id)
        onConversationReadyRef.current?.(conv.id)

        const history = standalone
          ? await getStandaloneAgentMessages(conv.id)
          : await getAgentConversationMessages(conv.id)
        if (requestId !== loadRequestRef.current) return
        setMessages(history)
        // 历史中已有会话则不再自动发送初始消息
        if (history.length > 0) initialMessageRef.current = ''
      }
    } catch (err: any) {
      if (requestId === loadRequestRef.current) {
        setError(err?.message || t('agent.error_load'))
      }
    } finally {
      if (requestId === loadRequestRef.current) {
        setLoading(false)
        // 首次进入且无历史会话时，自动把反馈内容发给智能客服
        if (initialMessageRef.current) {
          const autoSend = initialMessageRef.current
          initialMessageRef.current = ''
          void sendMessage(autoSend)
        }
      }
    }
  }, [standalone, numericFeedbackId, sendMessage])

  useEffect(() => {
    setDraft('')
    setMessages([])
    setConversationId('')
    conversationIdRef.current = ''
    void loadConversation()
    return () => {
      loadRequestRef.current += 1
    }
  }, [loadConversation])

  useEffect(() => {
    scrollToBottom()
  }, [messages, scrollToBottom])

  const handleSend = () => {
    const content = draft
    setDraft('')
    void sendMessage(content)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <section aria-label={t('chat.header_tag')} className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-semibold text-foreground">{t('agent.title')}</p>
        <button type="button" onClick={() => void loadConversation()} disabled={loading || sending} className="text-xs font-semibold text-primary hover:text-primary-hover disabled:opacity-50">
          {t('agent.refresh')}
        </button>
      </div>

      {loading ? <p className="text-xs text-foreground-secondary">{t('agent.loading')}</p> : null}
      {!loading && !messages.length && !sending ? (
        <div className="rounded-lg border border-divider bg-surface p-4 text-center">
          <p className="text-sm text-foreground-secondary">{t('agent.greeting')}</p>
        </div>
      ) : null}

      <div ref={messagesContainerRef} className="scrollbar-slim max-h-[40dvh] space-y-3 overflow-y-auto pr-1">
        {messages.map((message) => (
          <article
            key={message.id}
            className={clsx(
              'rounded-lg border px-3 py-2.5 text-sm',
              message.sender_type === 'customer'
                ? 'border-primary/25 bg-primary-light/40 ml-8'
                : message.sender_type === 'agent'
                ? 'border-success/25 bg-success-light/40 mr-8'
                : 'border-divider bg-surface',
            )}
          >
            <div className="flex items-center justify-between gap-3 text-[11px] text-foreground-tertiary">
              <span className="font-semibold text-foreground-secondary">{senderLabel(message.sender_type)}</span>
              <time>{formatMessageTime(message.created_at)}</time>
            </div>
            {message.content ? (
              <p className="mt-1.5 whitespace-pre-wrap leading-5 text-foreground">{message.content}</p>
            ) : null}
            {message.confidence !== undefined && message.confidence > 0 ? (
              <div className="mt-2 text-[11px] text-foreground-tertiary">
                {t('agent.confidence')}: {Math.round(message.confidence * 100)}%
              </div>
            ) : null}
          </article>
        ))}
      </div>

      <div className="space-y-2 rounded-lg border border-divider bg-surface-elevated p-3">
        <textarea
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={t('agent.placeholder')}
          rows={3}
          disabled={sending}
          className="w-full resize-none rounded-md border border-divider bg-surface px-3 py-2 text-sm text-foreground outline-none placeholder:text-foreground-tertiary focus:border-primary"
        />
        {imagePreview ? (
          <div className="flex items-center gap-2">
            <img src={imagePreview} alt={image?.name || ''} className="h-14 w-14 rounded-md border border-divider object-cover" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-[11px] text-foreground-secondary">{image?.name}</p>
              <p className="text-[11px] text-foreground-tertiary">
                {uploading ? t('agent.uploading', { percent: Math.round(0) }) : t('agent.image_hint')}
              </p>
            </div>
            <button
              type="button"
              onClick={clearImage}
              disabled={sending || uploading}
              aria-label={t('agent.remove_image')}
              className="text-xs text-foreground-tertiary hover:text-error disabled:opacity-50"
            >
              ×
            </button>
          </div>
        ) : (
          <label className="inline-flex cursor-pointer items-center text-xs font-medium text-foreground-secondary hover:text-primary">
            <input
              type="file"
              className="sr-only"
              accept="image/png,image/jpeg,image/webp,image/gif"
              disabled={sending || uploading}
              onChange={(event) => void handleSelectImage(event.target.files?.[0] || null)}
            />
            {t('agent.attach_image')}
          </label>
        )}
        <div className="flex items-center justify-between">
          <p className="text-[11px] text-foreground-tertiary">{t('agent.enter_hint')}</p>
          <button
            type="button"
            onClick={handleSend}
            disabled={sending || uploading || (!draft.trim() && !uploadedAttachment)}
            className="rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-white hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-50"
          >
            {sending ? t('agent.sending') : uploading ? t('agent.uploading', { percent: Math.round(0) }) : t('agent.send')}
          </button>
        </div>
        {error ? <p className="text-xs text-error">{error}</p> : null}
      </div>
    </section>
  )
}
