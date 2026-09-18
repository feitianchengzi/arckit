import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import clsx from 'clsx'
import {
  sendAgentMessage,
  getAgentConversationMessages,
  type AgentMessage,
  type AgentConversation,
  getAgentConversations,
} from '@/lib/feedback/v2'

function formatMessageTime(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleString('zh-CN', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}

function senderLabel(senderType: AgentMessage['sender_type']) {
  if (senderType === 'agent') return '智能助手'
  if (senderType === 'system') return '系统'
  return '我'
}

interface AgentChatPanelProps {
  feedbackId: string
  onAgentReply?: (message: AgentMessage) => void
}

export function AgentChatPanel({ feedbackId, onAgentReply }: AgentChatPanelProps) {
  const numericFeedbackId = useMemo(() => Number(feedbackId), [feedbackId])
  const [messages, setMessages] = useState<AgentMessage[]>([])
  const [draft, setDraft] = useState('')
  const [loading, setLoading] = useState(false)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const [conversationId, setConversationId] = useState<string>('')
  const loadRequestRef = useRef(0)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  const loadConversation = useCallback(async () => {
    if (!Number.isFinite(numericFeedbackId) || numericFeedbackId <= 0) return
    const requestId = loadRequestRef.current + 1
    loadRequestRef.current = requestId
    setLoading(true)
    setError('')
    try {
      // 获取对话列表
      const convs = await getAgentConversations(numericFeedbackId)
      if (requestId !== loadRequestRef.current) return

      if (convs.length > 0) {
        // 使用第一个对话
        const conv = convs[0]
        setConversationId(conv.id)
        
        // 获取消息历史
        const history = await getAgentConversationMessages(conv.id)
        if (requestId !== loadRequestRef.current) return
        setMessages(history)
      }
    } catch (err: any) {
      if (requestId === loadRequestRef.current) {
        setError(err?.message || '加载会话失败，请稍后重试')
      }
    } finally {
      if (requestId === loadRequestRef.current) setLoading(false)
    }
  }, [numericFeedbackId])

  useEffect(() => {
    setDraft('')
    setMessages([])
    setConversationId('')
    void loadConversation()
    return () => {
      loadRequestRef.current += 1
    }
  }, [loadConversation])

  useEffect(() => {
    scrollToBottom()
  }, [messages, scrollToBottom])

  const sendMessage = async () => {
    const content = draft.trim()
    if (!content) {
      setError('请输入问题')
      return
    }
    if (!Number.isFinite(numericFeedbackId) || numericFeedbackId <= 0) {
      setError('反馈编号无效')
      return
    }

    setSending(true)
    setError('')
    try {
      // 添加用户消息到本地状态
      const userMessage: AgentMessage = {
        id: Date.now(),
        conversation_id: conversationId,
        feedback_id: numericFeedbackId,
        project_id: 0,
        sender_type: 'customer',
        content,
        created_at: new Date().toISOString(),
      }
      setMessages((current) => [...current, userMessage])
      setDraft('')

      // 发送到 Agent
      const response = await sendAgentMessage({
        feedbackId: numericFeedbackId,
        content,
        conversationId: conversationId || undefined,
      })

      // 更新 conversationId
      if (!conversationId && response.conversation_id) {
        setConversationId(response.conversation_id)
      }

      // 添加 Agent 回复到本地状态
      const agentMessage: AgentMessage = {
        id: response.message_id,
        conversation_id: response.conversation_id,
        feedback_id: numericFeedbackId,
        project_id: 0,
        sender_type: 'agent',
        content: response.content,
        tool_calls: response.tool_calls,
        confidence: response.confidence,
        created_at: new Date().toISOString(),
      }
      setMessages((current) => [...current, agentMessage])

      // 通知父组件
      onAgentReply?.(agentMessage)
    } catch (err: any) {
      setError(err?.message || '发送失败，请稍后重试')
    } finally {
      setSending(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      void sendMessage()
    }
  }

  return (
    <section aria-label="智能客服" className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-semibold text-foreground">智能助手</p>
        <button type="button" onClick={() => void loadConversation()} disabled={loading || sending} className="text-xs font-semibold text-primary hover:text-primary-hover disabled:opacity-50">
          刷新
        </button>
      </div>

      {loading ? <p className="text-xs text-foreground-secondary">正在加载会话...</p> : null}
      {!loading && !messages.length ? (
        <div className="rounded-lg border border-divider bg-surface p-4 text-center">
          <p className="text-sm text-foreground-secondary">你好！我是智能助手，有什么可以帮你的吗？</p>
        </div>
      ) : null}

      <div className="scrollbar-slim max-h-[40dvh] space-y-3 overflow-y-auto pr-1">
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
            {message.tool_calls && message.tool_calls.length > 0 ? (
              <div className="mt-2 space-y-1">
                <p className="text-[11px] text-foreground-tertiary">检索了以下信息：</p>
                {message.tool_calls.map((tc, idx) => (
                  <span key={idx} className="inline-block rounded bg-surface-elevated px-2 py-0.5 text-[11px] text-foreground-secondary">
                    {tc.tool === 'search_customer_code' && '代码仓库'}
                    {tc.tool === 'search_customer_docs' && '项目文档'}
                    {tc.tool === 'search_product_knowledge' && '产品知识库'}
                  </span>
                ))}
              </div>
            ) : null}
            {message.confidence !== undefined && message.confidence > 0 ? (
              <div className="mt-2 text-[11px] text-foreground-tertiary">
                置信度: {Math.round(message.confidence * 100)}%
              </div>
            ) : null}
          </article>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <div className="space-y-2 rounded-lg border border-divider bg-surface-elevated p-3">
        <textarea
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="输入你的问题..."
          rows={3}
          disabled={sending}
          className="w-full resize-none rounded-md border border-divider bg-surface px-3 py-2 text-sm text-foreground outline-none placeholder:text-foreground-tertiary focus:border-primary"
        />
        <div className="flex items-center justify-between">
          <p className="text-[11px] text-foreground-tertiary">按 Enter 发送，Shift+Enter 换行</p>
          <button
            type="button"
            onClick={() => void sendMessage()}
            disabled={sending || !draft.trim()}
            className="rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-white hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-50"
          >
            {sending ? '思考中...' : '发送'}
          </button>
        </div>
        {error ? <p className="text-xs text-error">{error}</p> : null}
      </div>
    </section>
  )
}
