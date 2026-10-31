import { createPortal } from 'react-dom'
import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import { sendAgentMessage, getAgentConversationMessages, sendStandaloneAgentMessage, getStandaloneAgentConversations, getStandaloneAgentConversationsPage, getStandaloneAgentMessages, getStandaloneAgentMessagesPage, getAgentConversations, type AgentSource, type AgentMessage, type AgentStructuredSummary, type FeedbackV2Attachment } from '@/lib/feedback/v2'
import { MediaComposer } from './MediaComposer'
import { FeedbackMessageAttachment } from './FeedbackMessageAttachment'
import { activeConsultation, setActiveConsultation, clearConsultationDraft, migrateConsultationDraft, readConsultationDraft, saveConsultationDraft } from '@/lib/feedback/drafts'
import { t } from '@/i18n'

interface AgentChatPanelProps {
  feedbackId?: string
  standalone?: boolean
  initialMessage?: string
  onNeedCollect?: (payload: { question: string; structured?: AgentStructuredSummary }) => void
  onConversationReady?: (conversationId: string) => void
  children?: ReactNode
  hasUnsubmittedSummary?: boolean
  submittedConversationId?: string
  submitting?: boolean
  onMyFeedback?: () => void
  onDirectFeedback?: () => void
  draftScope?: string
  structuredDraft?: AgentStructuredSummary
  formOpen?: boolean
  questionDraft?: string
}

function messageAttachments(message: AgentMessage): FeedbackV2Attachment[] {
  if (message.attachments) return message.attachments
  try {
    const metadata = typeof message.metadata === 'string' ? JSON.parse(message.metadata) : message.metadata
    return (metadata as { attachments?: FeedbackV2Attachment[] })?.attachments || []
  } catch { return [] }
}

function messageSources(message: AgentMessage): AgentSource[] {
  try {
    const metadata = typeof message.metadata === 'string' ? JSON.parse(message.metadata) : message.metadata
    const sources = message.sources || (metadata as { sources?: unknown })?.sources
    return Array.isArray(sources) ? sources.filter((source): source is AgentSource => Boolean(source && typeof source.path === 'string' && typeof source.excerpt === 'string' && Number.isInteger(source.start_line) && source.start_line > 0 && Number.isInteger(source.end_line) && source.end_line >= source.start_line)) : []
  } catch { return [] }
}

export function AgentChatPanel({ feedbackId, standalone = false, initialMessage, onNeedCollect, onConversationReady, children, hasUnsubmittedSummary = false, submittedConversationId, submitting = false, onMyFeedback, onDirectFeedback, draftScope = '', structuredDraft, questionDraft, formOpen = false }: AgentChatPanelProps) {
  const [messages, setMessages] = useState<AgentMessage[]>([])
  const [loading, setLoading] = useState(true)
  const [messagePage, setMessagePage] = useState(1)
  const [messageTotal, setMessageTotal] = useState(0)
  const [olderLoading, setOlderLoading] = useState(false)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const [conversationId, setConversationId] = useState('')
  const [composerEpoch, setComposerEpoch] = useState(0)
  const [historyLoading, setHistoryLoading] = useState(false)
  const [historyError, setHistoryError] = useState('')
  const [historyPage, setHistoryPage] = useState(1)
  const [historyTotal, setHistoryTotal] = useState(0)
  const [answered, setAnswered] = useState(false)
  const [pendingTransition, setPendingTransition] = useState<{ kind: 'new' } | { kind: 'history'; id: string }>()
  const composerDirty = useRef(false)
  const historyRequest = useRef(0)
  const linkedIds = useRef(new Set<string>())
  const [historyOpen, setHistoryOpen] = useState(false)
  const [conversations, setConversations] = useState<Awaited<ReturnType<typeof getStandaloneAgentConversations>>>([])
  const conversationRef = useRef('')
  const startNewRef = useRef(false)
  const generation = useRef(0)
  const sendingRef = useRef(false)
  const submittingRef = useRef(submitting)
  submittingRef.current = submitting
  const containerRef = useRef<HTMLDivElement>(null)
  const preserveScroll = useRef(false)
  const callbacks = useRef({ onNeedCollect, onConversationReady })
  callbacks.current = { onNeedCollect, onConversationReady }
  const initialRef = useRef(initialMessage?.trim() || '')

  const notifyDraft = (history: AgentMessage[], id: string) => {
    const saved = readConsultationDraft(draftScope, id)
    setAnswered(Boolean(saved?.answered))
    if (saved?.structured) { callbacks.current.onNeedCollect?.({ question: saved.question || '', structured: saved.structured }); return }
    callbacks.current.onNeedCollect?.({ question: '', structured: undefined })
    for (const message of [...history].reverse()) {
      try {
        const metadata = typeof message.metadata === 'string' ? JSON.parse(message.metadata) : message.metadata
        const summary = (metadata as { clarification?: { summary?: AgentStructuredSummary } })?.clarification?.summary
        if (summary) { callbacks.current.onNeedCollect?.({ question: '', structured: summary }); break }
      } catch { /* Malformed metadata must not hide this conversation. */ }
    }
  }
  const refreshHistory = useCallback(async (page = 1) => {
    const version = ++historyRequest.current
    setHistoryLoading(true); setHistoryError('')
    try {
      const result = await getStandaloneAgentConversationsPage(page)
      if (version === historyRequest.current) {
        const available = result.conversations.filter((conv) => !conv.feedback_id && !linkedIds.current.has(conv.id))
        setConversations((old) => page === 1 ? available : [...old, ...available.filter(conv => !old.some(item => item.id === conv.id))])
        setHistoryPage(page); setHistoryTotal(result.total)
      }
    } catch (e) {
      if (version === historyRequest.current) setHistoryError(e instanceof Error ? e.message : '咨询历史暂时无法加载，请重试。')
    } finally { if (version === historyRequest.current) setHistoryLoading(false) }
  }, [])
  const send = useCallback(async (content: string, attachments: FeedbackV2Attachment[] = [], clientMessageId?: string) => {
    if (sendingRef.current || submittingRef.current || (conversationRef.current && linkedIds.current.has(conversationRef.current))) return
    if (!content.trim() && !attachments.length) throw new Error(t('agent.error_empty'))
    const numericFeedbackId = Number(feedbackId)
    if (!standalone && (!Number.isFinite(numericFeedbackId) || numericFeedbackId <= 0)) throw new Error(t('agent.error_invalid_id'))
    sendingRef.current = true; setSending(true); setError('')
    const version = generation.current
    setAnswered(false)
    saveConsultationDraft(draftScope, conversationRef.current, { answered: false })
    try {
      const params = { content, attachments, clientMessageId, newConversation: startNewRef.current || undefined, conversationId: conversationRef.current || undefined }
      const response = standalone ? await sendStandaloneAgentMessage(params) : await sendAgentMessage({ ...params, feedbackId: numericFeedbackId })
      if (version !== generation.current) return
      startNewRef.current = false
      if (!conversationRef.current) {
        migrateConsultationDraft(draftScope, '', response.conversation_id)
        setActiveConsultation(draftScope, response.conversation_id)
        conversationRef.current = response.conversation_id; setConversationId(response.conversation_id)
        callbacks.current.onConversationReady?.(response.conversation_id)
      }
      setMessageTotal((total) => total + 2)
      setMessages((current) => [...current, { id: response.customer_message_id || -Date.now(), conversation_id: response.conversation_id, feedback_id: numericFeedbackId || 0, project_id: 0, sender_type: 'customer', content, attachments, created_at: new Date().toISOString() }, { id: response.message_id, conversation_id: response.conversation_id, feedback_id: numericFeedbackId || 0, project_id: 0, sender_type: 'agent', content: response.content, sources: response.sources, created_at: new Date().toISOString() }])
      if (response.need_collect || response.clarification) callbacks.current.onNeedCollect?.({ question: content, structured: response.clarification?.summary || response.structured })
      if (attachments.length) {
        try {
          const persisted = standalone
            ? await getStandaloneAgentMessages(response.conversation_id)
            : await getAgentConversationMessages(response.conversation_id, numericFeedbackId)
          if (generation.current === version && persisted.length) setMessages(current => { const merged = new Map([...current, ...persisted].map(message => [`${message.sender_type}:${message.id}`, message])); return [...merged.values()].filter(message => message.id > 0).sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()) })
        } catch { /* Sending succeeded; a preview refresh failure must not cause a duplicate retry. */ }
      }
    } finally { sendingRef.current = false; setSending(false) }
  }, [feedbackId, standalone, draftScope])

  const load = useCallback(async (requestedId?: string) => {
    const version = ++generation.current
    setLoading(true); setOlderLoading(false); setError('')
    try {
      const active = requestedId === undefined ? activeConsultation(draftScope) : undefined
      let id = requestedId || active
      if (active === '') startNewRef.current = true
      if (!id && active !== '') {
        const list = standalone ? await getStandaloneAgentConversations() : await getAgentConversations(Number(feedbackId))
        if (version !== generation.current) return
        const available = standalone ? list.filter((conv) => !conv.feedback_id && !linkedIds.current.has(conv.id)) : list
        setConversations(available)
        id = available[0]?.id || ''
      }
      if (id) {
        const result = standalone ? await getStandaloneAgentMessagesPage(id) : undefined
        const history = result ? result.messages : await getAgentConversationMessages(id, Number(feedbackId))
        if (version !== generation.current) return
        const switched = conversationRef.current !== id
        startNewRef.current = false
        setActiveConsultation(draftScope, id)
        conversationRef.current = id; setConversationId(id)
        setMessages(history); setMessagePage(1); setMessageTotal(result?.total || history.length)
        if (switched) {
          composerDirty.current = false; setComposerEpoch((value) => value + 1)
          callbacks.current.onConversationReady?.(id)
          notifyDraft(history, id)
        }
        setHistoryOpen(false)
        if (history.length) initialRef.current = ''
      }
      if (!id) {
        const draft = readConsultationDraft(draftScope, '')
        if (draft?.structured) callbacks.current.onNeedCollect?.({ question: draft.question || '', structured: draft.structured })
      }
      if (initialRef.current) { const text = initialRef.current; initialRef.current = ''; await send(text) }
    } catch (e) { if (version === generation.current) setError(e instanceof Error ? e.message : t('agent.error_load')) }
    finally { if (version === generation.current) setLoading(false) }
  }, [standalone, feedbackId, send, draftScope])

  const loadOlder = async () => {
    if (olderLoading || !conversationId) return
    const version = generation.current
    setOlderLoading(true); setError('')
    try {
      const result = await getStandaloneAgentMessagesPage(conversationId, messagePage + 1)
      if (version !== generation.current) return
      const node = containerRef.current
      const previousHeight = node?.scrollHeight || 0
      const previousTop = node?.scrollTop || 0
      preserveScroll.current = true
      setMessages(current => { const merged = new Map([...result.messages, ...current].map(message => [message.id, message])); return [...merged.values()] })
      setMessagePage(page => page + 1); setMessageTotal(result.total)
      requestAnimationFrame(() => { if (node) node.scrollTop = previousTop + node.scrollHeight - previousHeight })
    } catch (e) { if (version === generation.current) setError(e instanceof Error ? e.message : '更早咨询记录暂时无法加载，请重试。') }
    finally { if (version === generation.current) setOlderLoading(false) }
  }
  const beginNew = () => {
    generation.current++; startNewRef.current = true
    setActiveConsultation(draftScope, '')
    setAnswered(false); setOlderLoading(false); setMessagePage(1); setMessageTotal(0)
    setMessages([]); conversationRef.current = ''; setConversationId(''); setError(''); setHistoryOpen(false)
    composerDirty.current = false; setComposerEpoch((value) => value + 1)
    callbacks.current.onConversationReady?.(''); callbacks.current.onNeedCollect?.({ question: '', structured: undefined })
    const draft = readConsultationDraft(draftScope, '')
    if (draft?.structured) callbacks.current.onNeedCollect?.({ question: draft.question || '', structured: draft.structured })
  }
  const runTransition = (next: { kind: 'new' } | { kind: 'history'; id: string }) => {
    if (sendingRef.current || loading || submitting) return
    if (next.kind === 'history' && next.id === conversationRef.current) { setHistoryOpen(false); return }
    if (composerDirty.current || hasUnsubmittedSummary) { setHistoryOpen(false); setPendingTransition(next); return }
    if (next.kind === 'new') beginNew()
    else void load(next.id)
  }
  useEffect(() => {
    setMessages([]); conversationRef.current = ''; setConversationId('')
    void load()
    return () => { generation.current++; historyRequest.current++ }
  }, [load])
  useEffect(() => {
    if (!submittedConversationId) return
    clearConsultationDraft(draftScope, submittedConversationId)
    setActiveConsultation(draftScope, '')
    linkedIds.current.add(submittedConversationId)
    setConversations((list) => list.filter((conv) => conv.id !== submittedConversationId))
    void refreshHistory()
  }, [submittedConversationId, refreshHistory, draftScope])
  useEffect(() => {
    if (!draftScope || loading || (conversationId && linkedIds.current.has(conversationId))) return
    saveConsultationDraft(draftScope, conversationId, { structured: structuredDraft, question: questionDraft })
  }, [draftScope, conversationId, structuredDraft, questionDraft, loading])
  useEffect(() => {
    if (!historyOpen) return
    const previous = document.activeElement as HTMLElement | null
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { event.preventDefault(); event.stopImmediatePropagation(); setHistoryOpen(false) }
      if (event.key === 'Tab') {
        const controls = Array.from(document.querySelectorAll<HTMLButtonElement>('.sdk-history button:not(:disabled)'))
        const first = controls[0], last = controls[controls.length - 1]
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus() }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus() }
      }
    }
    document.addEventListener('keydown', handleKey, true)
    return () => { document.removeEventListener('keydown', handleKey, true); previous?.focus() }
  }, [historyOpen])
  useEffect(() => { if (preserveScroll.current) { preserveScroll.current = false; return }; const node = containerRef.current; if (node) node.scrollTo({ top: node.scrollHeight, behavior: 'smooth' }) }, [messages])

  return <section aria-label={t('chat.header_tag')} className="sdk-agent-panel">
    <div className="sdk-chat-toolbar">
      <p>{formOpen ? '直接反馈 · 核对实际情况后提交' : messages.length ? '当前咨询 · 记录将随反馈保留' : '随时为你解答'}</p>
      <div className="sdk-chat-actions">
        {standalone && <button type="button" disabled={sending || loading || submitting} onClick={() => { if (!historyOpen) void refreshHistory(); setHistoryOpen((value) => !value) }} className="text-xs text-primary">咨询历史</button>}
        {standalone && <button type="button" disabled={sending || loading || submitting} onClick={() => runTransition({ kind: 'new' })} className="text-xs text-primary">新咨询</button>}
        <button type="button" disabled={loading || sending || submitting} onClick={() => { if (conversationRef.current) void load(conversationRef.current); else if (standalone) void refreshHistory(); else void load() }} className="text-xs text-primary">{t('agent.refresh')}</button>
      </div>
    </div>
    {historyOpen && createPortal(<div data-feedback-sdk-shell className="sdk-history-backdrop" onClick={() => setHistoryOpen(false)}>
      <section role="dialog" aria-modal="true" className="sdk-history" aria-label="咨询历史" onClick={(event) => event.stopPropagation()} onKeyDown={(event) => { if (event.key === 'Escape') { event.stopPropagation(); setHistoryOpen(false) } }}>
      <h2>咨询历史</h2>
      <p className="sdk-history-description">仅展示尚未提交的咨询。已创建反馈请前往“我的反馈”继续沟通。</p>
      {historyLoading && <p role="status">正在加载咨询历史…</p>}
      {historyError && <div role="alert">{historyError}<button type="button" onClick={() => void refreshHistory()}>重试咨询历史</button></div>}
      {!historyLoading && !historyError && !conversations.length && <div className="sdk-history-empty">暂无咨询历史。开始提问后会保留在这里。</div>}
      {!historyLoading && !historyError && conversations.map((conv) => <button key={conv.id} type="button" disabled={loading || sending || submitting} aria-pressed={conv.id === conversationId} className="block w-full text-left text-xs text-primary" onClick={() => runTransition({ kind: 'history', id: conv.id })}><h3>{conv.title || '咨询记录'}</h3><small>{new Date(conv.updated_at || conv.created_at).toLocaleString()}{conv.id === conversationId ? ' · 当前咨询' : ''}</small><p>点击继续咨询，已整理的信息会一并恢复。</p></button>)}
      {conversations.length < historyTotal && <button type="button" disabled={historyLoading} onClick={() => void refreshHistory(historyPage + 1)}>加载更多咨询</button>}
      <footer><button type="button" autoFocus className="sdk-button" onClick={() => setHistoryOpen(false)}>返回咨询</button><button type="button" className="sdk-button primary" onClick={() => { setHistoryOpen(false); onMyFeedback?.() }}>前往我的反馈</button></footer>
    </section></div>, document.body)}
    {pendingTransition && <div role="dialog" aria-modal="true" aria-label="切换咨询前确认" className="sdk-confirm">
      <p>当前有未发送的文字、附件或未提交的问题信息。切换后会保存文字、已上传附件和问题信息；未完成上传的文件需要重新选择。</p>
      <div className="flex gap-3 mt-3"><button className="sdk-button" type="button" onClick={() => setPendingTransition(undefined)}>继续当前咨询</button><button className="sdk-button primary" type="button" onClick={() => { const next = pendingTransition; setPendingTransition(undefined); if (next.kind === 'new') beginNew(); else void load(next.id) }}>保存草稿并切换</button></div>
    </div>}
    {loading && <p className="text-xs text-foreground-secondary">{t('agent.loading')}</p>}
    {error && <p role="alert" className="text-xs text-error">{error}</p>}
    <div ref={containerRef} className="sdk-agent-messages">
      {!formOpen && standalone && messages.length < messageTotal && <button type="button" className="sdk-button" disabled={olderLoading || loading || sending} onClick={() => void loadOlder()}>{olderLoading ? '正在加载更早记录…' : '加载更早咨询记录'}</button>}
      {!formOpen && !loading && !messages.length && <div className="sdk-welcome"><div className="sdk-spark" aria-hidden="true">✧</div><h2>你好，有什么可以帮你？</h2><p>可以问产品怎么用，也可以上传截图或使用语音转文字。</p><small className="sdk-knowledge"><span aria-hidden="true">●</span> 基于当前产品代码仓库与使用文档答疑</small><div className="sdk-suggestions">{['这个产品有哪些功能？', '我遇到了操作异常，需要帮助', '我想提出一个功能建议'].map((question) => <button key={question} type="button" disabled={sending || loading || submitting || Boolean(pendingTransition)} onClick={() => void send(question).catch((e) => setError(e instanceof Error ? e.message : t('agent.error_load')))}>{question}<span aria-hidden="true">↗</span></button>)}</div></div>}
      {!formOpen && messages.map((message) => <article key={`${message.sender_type}:${message.id}`} className={`sdk-message ${message.sender_type === 'customer' ? 'mine' : ''}`}>
        <div className="sdk-message-avatar" aria-hidden="true">{message.sender_type === 'customer' ? '我' : message.sender_type === 'agent' ? '✧' : '支'}</div>
        <div className="sdk-message-main"><div className="sdk-message-by"><span>{message.sender_type === 'agent' ? t('agent.title') : message.sender_type === 'developer' ? t('conversation.sender.developer') : message.sender_type === 'system' ? t('conversation.sender.system') : t('conversation.sender.customer')}</span> · <time>{new Date(message.created_at).toLocaleString()}</time></div>
        <div className="sdk-message-body">{message.content && <p className="whitespace-pre-wrap">{message.content}</p>}{messageAttachments(message).map((attachment, index) => <FeedbackMessageAttachment key={`${attachment.object_key || attachment.id || index}`} feedbackId={Number(feedbackId) || 0} conversationId={conversationId} attachment={attachment} />)}{messageSources(message).length > 0 && <details className="mt-3 text-xs"><summary className="text-primary cursor-pointer">查看文档依据</summary>{messageSources(message).map((source, index) => <blockquote key={`${source.path}:${source.start_line}:${index}`} className="mt-2 border-l-2 border-divider pl-3"><strong>{source.path}:{source.start_line}{source.end_line !== source.start_line ? `–${source.end_line}` : ''}</strong><p className="whitespace-pre-wrap">{source.excerpt}</p></blockquote>)}</details>}</div></div>
      </article>)}
      {!formOpen && sending && <p role="status" className="sdk-chat-pending">正在结合项目资料分析…</p>}
      {!formOpen && standalone && messages.length > 0 && !linkedIds.current.has(conversationId) && <div className="inline-actions flex gap-3 my-3">
        <button type="button" disabled={sending || submitting} className="sdk-button" onClick={() => { setAnswered(true); saveConsultationDraft(draftScope, conversationId, { answered: true }) }}>已解答</button>
        <button type="button" disabled={sending || submitting} className="sdk-button" onClick={onDirectFeedback}>仍未解决，提交反馈</button>
      </div>}
      {!formOpen && answered && <p role="status" className="sdk-notice">本次答疑已结束，未创建反馈卡片。你也可以继续提问。</p>}
      {children}
    </div>
    <MediaComposer hidden={formOpen} key={`${standalone}:${feedbackId || ''}:${composerEpoch}`} onSend={send} draftScope={draftScope} draftConversationId={conversationId} onDraftChange={(dirty: boolean) => { composerDirty.current = dirty }} disabled={sending || loading || submitting || Boolean(pendingTransition) || linkedIds.current.has(conversationId)} />
  </section>
}
