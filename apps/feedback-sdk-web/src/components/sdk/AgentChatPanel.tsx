import { useCallback, useEffect, useRef, useState } from 'react'
import { sendAgentMessage, getAgentConversationMessages, sendStandaloneAgentMessage, getStandaloneAgentConversations, getStandaloneAgentMessages, getAgentConversations, type AgentMessage, type AgentStructuredSummary, type FeedbackV2Attachment } from '@/lib/feedback/v2'
import { MediaComposer } from './MediaComposer'
import { FeedbackMessageAttachment } from './FeedbackMessageAttachment'
import { t } from '@/i18n'

interface AgentChatPanelProps {
  feedbackId?: string
  standalone?: boolean
  initialMessage?: string
  onNeedCollect?: (payload: { question: string; structured?: AgentStructuredSummary }) => void
  onConversationReady?: (conversationId: string) => void
}

function messageAttachments(message: AgentMessage): FeedbackV2Attachment[] {
  if (message.attachments) return message.attachments
  try {
    const metadata = typeof message.metadata === 'string' ? JSON.parse(message.metadata) : message.metadata
    return (metadata as { attachments?: FeedbackV2Attachment[] })?.attachments || []
  } catch { return [] }
}

export function AgentChatPanel({ feedbackId, standalone = false, initialMessage, onNeedCollect, onConversationReady }: AgentChatPanelProps) {
  const [messages, setMessages] = useState<AgentMessage[]>([])
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const [conversationId, setConversationId] = useState('')
  const [newConversation, setNewConversation] = useState(0)
  const [historyOpen, setHistoryOpen] = useState(false)
  const [conversations, setConversations] = useState<Awaited<ReturnType<typeof getStandaloneAgentConversations>>>([])
  const conversationRef = useRef('')
  const startNewRef = useRef(false)
  const generation = useRef(0)
  const sendingRef = useRef(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const callbacks = useRef({ onNeedCollect, onConversationReady })
  callbacks.current = { onNeedCollect, onConversationReady }
  const initialRef = useRef(initialMessage?.trim() || '')

  const notifyDraft = (history: AgentMessage[]) => {
    for (const message of [...history].reverse()) {
      try {
        const metadata = typeof message.metadata === 'string' ? JSON.parse(message.metadata) : message.metadata
        const summary = (metadata as { clarification?: { summary?: AgentStructuredSummary } })?.clarification?.summary
        if (summary) { callbacks.current.onNeedCollect?.({ question: '', structured: summary }); break }
      } catch { /* A malformed historical metadata item must not hide the conversation. */ }
    }
  }
  const send = useCallback(async (content: string, attachments: FeedbackV2Attachment[] = [], clientMessageId?: string) => {
    if (sendingRef.current) return
    if (!content.trim() && !attachments.length) throw new Error(t('agent.error_empty'))
    const numericFeedbackId = Number(feedbackId)
    if (!standalone && (!Number.isFinite(numericFeedbackId) || numericFeedbackId <= 0)) throw new Error(t('agent.error_invalid_id'))
    sendingRef.current = true; setSending(true); setError('')
    const version = generation.current
    try {
      const params = { content, attachments, clientMessageId, newConversation: startNewRef.current || undefined, conversationId: conversationRef.current || undefined }
      const response = standalone ? await sendStandaloneAgentMessage(params) : await sendAgentMessage({ ...params, feedbackId: numericFeedbackId })
      if (version !== generation.current) return
      startNewRef.current = false
      if (!conversationRef.current) {
        conversationRef.current = response.conversation_id; setConversationId(response.conversation_id)
        callbacks.current.onConversationReady?.(response.conversation_id)
      }
      setMessages((current) => [...current, { id: -Date.now(), conversation_id: response.conversation_id, feedback_id: numericFeedbackId || 0, project_id: 0, sender_type: 'customer', content, attachments, created_at: new Date().toISOString() }, { id: response.message_id, conversation_id: response.conversation_id, feedback_id: numericFeedbackId || 0, project_id: 0, sender_type: 'agent', content: response.content, created_at: new Date().toISOString() }])
      if (response.need_collect || response.clarification) callbacks.current.onNeedCollect?.({ question: content, structured: response.clarification?.summary || response.structured })
      if (attachments.length) {
        try {
          const persisted = standalone ? await getStandaloneAgentMessages(response.conversation_id) : await getAgentConversationMessages(response.conversation_id)
          if (generation.current === version && persisted.length) setMessages(persisted)
        } catch { /* Sending succeeded; a preview refresh failure must not cause a duplicate retry. */ }
      }
    } finally { sendingRef.current = false; setSending(false) }
  }, [feedbackId, standalone])

  const load = useCallback(async (requestedId?: string) => {
    const version = ++generation.current
    setLoading(true); setError('')
    try {
      const list = standalone ? await getStandaloneAgentConversations() : await getAgentConversations(Number(feedbackId))
      if (version !== generation.current) return
      setConversations(list)
      const id = requestedId || list[0]?.id || ''
      if (id) {
        const history = standalone ? await getStandaloneAgentMessages(id) : await getAgentConversationMessages(id)
        if (version !== generation.current) return
        startNewRef.current = false
        conversationRef.current = id; setConversationId(id); callbacks.current.onConversationReady?.(id)
        setMessages(history); notifyDraft(history)
        if (history.length) initialRef.current = ''
      }
      if (initialRef.current) { const text = initialRef.current; initialRef.current = ''; await send(text) }
    } catch (e) { if (version === generation.current) setError(e instanceof Error ? e.message : t('agent.error_load')) }
    finally { if (version === generation.current) setLoading(false) }
  }, [standalone, feedbackId, send])

  useEffect(() => {
    setMessages([]); conversationRef.current = ''; setConversationId('')
    if (!newConversation) void load()
    else setLoading(false)
    return () => { generation.current++ }
  }, [load, newConversation])
  useEffect(() => { const node = containerRef.current; if (node) node.scrollTo({ top: node.scrollHeight, behavior: 'smooth' }) }, [messages])

  return <section aria-label={t('chat.header_tag')} className="sdk-agent-panel">
    <div className="flex items-center justify-between gap-3">
      <p className="text-sm font-semibold text-foreground">{t('agent.title')}</p>
      <div className="flex gap-3">
        {standalone && <button type="button" disabled={sending || loading} onClick={() => { setHistoryOpen((v) => !v); if (!conversations.length) void getStandaloneAgentConversations().then(setConversations).catch((e) => setError(String(e))) }} className="text-xs text-primary">咨询历史</button>}
        {standalone && <button type="button" disabled={sending || loading} onClick={() => { startNewRef.current = true; generation.current++; setMessages([]); conversationRef.current = ''; setConversationId(''); setNewConversation((epoch) => epoch + 1); callbacks.current.onConversationReady?.(''); callbacks.current.onNeedCollect?.({ question: '', structured: undefined }) }} className="text-xs text-primary">新咨询</button>}
        <button type="button" disabled={loading || sending} onClick={() => void load(conversationRef.current)} className="text-xs text-primary">{t('agent.refresh')}</button>
      </div>
    </div>
    {historyOpen && <div className="my-3 space-y-2 rounded-lg border border-divider p-3">{conversations.length ? conversations.map((conv) => <button key={conv.id} type="button" className="block w-full text-left text-xs text-primary" onClick={() => { setHistoryOpen(false); void load(conv.id) }}>{new Date(conv.created_at).toLocaleString()} · {conv.feedback_id ? '已关联反馈' : '独立咨询'}</button>) : <small>暂无历史咨询</small>}</div>}
    {loading && <p className="text-xs text-foreground-secondary">{t('agent.loading')}</p>}
    {error && <p role="alert" className="text-xs text-error">{error}</p>}
    <div ref={containerRef} className="sdk-agent-messages">
      {!loading && !messages.length && <div className="sdk-welcome"><div className="sdk-spark">✧</div><h2>你好，有什么可以帮你？</h2><p>可以问产品怎么用，也可以上传截图或用语音说明问题。</p><small>基于当前产品代码仓库与文档答疑</small></div>}
      {messages.map((message) => <article key={`${message.sender_type}:${message.id}`} className={`sdk-message ${message.sender_type === 'customer' ? 'mine' : ''}`}>
        <div className="sdk-message-by"><span>{message.sender_type === 'agent' ? t('agent.title') : message.sender_type === 'developer' ? t('conversation.sender.developer') : message.sender_type === 'system' ? t('conversation.sender.system') : t('conversation.sender.customer')}</span> · <time>{new Date(message.created_at).toLocaleString()}</time></div>
        <div className="sdk-message-body">{message.content && <p className="whitespace-pre-wrap">{message.content}</p>}{messageAttachments(message).map((attachment, index) => <FeedbackMessageAttachment key={`${attachment.object_key || attachment.id || index}`} feedbackId={Number(feedbackId) || 0} conversationId={conversationId} attachment={attachment} />)}</div>
      </article>)}
      {sending && <p role="status" className="text-xs text-foreground-secondary">正在结合项目资料分析…</p>}
    </div>
    <MediaComposer key={`${standalone}:${feedbackId || ''}:${newConversation}`} onSend={send} disabled={sending || loading} />
  </section>
}
