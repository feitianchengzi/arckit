import { useCallback, useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { ManualFeedbackForm } from '@/components/sdk/ManualFeedbackForm'
import { SubmittedFeedbackInfo } from '@/components/sdk/SubmittedFeedbackInfo'
import { AgentChatPanel } from '@/components/sdk/AgentChatPanel'
import { ClarificationReview } from '@/components/sdk/ClarificationReview'
import { FeedbackConversationPanel } from '@/components/sdk/FeedbackConversationPanel'
import { FeedbackLifecyclePanel } from '@/components/sdk/FeedbackLifecyclePanel'
import { fetchFeedbackItemsV2, fetchFeedbackNotificationsV2, submitFeedbackV2, type AgentStructuredSummary, type FeedbackListQuery } from '@/lib/feedback/v2'
import type { FeedbackItem } from '@/lib/feedback/types'
import { clarificationFields, formatStructuredFeedback, missingClarificationFields } from '@/lib/feedback/structured'
import { feedbackDateRange, reviewSummary, newClientRequestId } from '@/domain/feedback'
import { useFeedbackRealtime } from '@/lib/feedback/realtime'
import { FEEDBACK_SDK_CONFIGURED_EVENT, getFeedbackSDKConfig, isFeedbackSDKV2NotificationsEnabled, notifyFeedbackSDKUnreadCount } from '@/lib/sdk'

const labels: Record<string, string> = { submitted: '待受理', analyzing: '分析中', reviewing: '已受理', developing: '处理中', completed: '待验收', released: '已交付', ignored: '暂不采纳' }

const opaqueIdentities = new Map<string, string>()

/** Application boundary for an externally embedded support surface. No project/workspace administration lives here. */
export function supportIdentityKey() {
  const config = getFeedbackSDKConfig()
  let identity = `${config.projectId || ''}:${config.customUserId || ''}`
  if (config.feedbackV2AuthMode === 'session' || config.feedbackSessionToken) {
    // Claims are used only to isolate local UI state, never to authorize requests.
    try {
      const raw = (config.feedbackSessionToken || '').replace(/^fbs_/, '').split('.')[0].replace(/-/g, '+').replace(/_/g, '/')
      const claims = JSON.parse(new TextDecoder().decode(Uint8Array.from(atob(raw), (value) => value.charCodeAt(0))))
      if (!claims.project_id || !claims.custom_user_id) throw new Error('Missing scope')
      identity = `${claims.project_id}:${claims.custom_user_id}`
    } catch {
      // Unknown tokens cannot prove a stable customer identity; isolate them without persisting credentials.
      const token = config.feedbackSessionToken || ''
      if (!opaqueIdentities.has(token)) {
        if (opaqueIdentities.size >= 16) opaqueIdentities.clear()
        opaqueIdentities.set(token, newClientRequestId())
      }
      identity = `${identity}:opaque:${opaqueIdentities.get(token)}`
    }
  }
  return JSON.stringify([config.gatewayUrl || '', config.feedbackV2AuthMode || '', identity])
}

export function SDKSupportPage() {
  const [identity, setIdentity] = useState(supportIdentityKey)
  const identityRef = useRef(identity)
  const navigate = useNavigate()
  useEffect(() => {
    const configured = () => {
      const next = supportIdentityKey()
      if (next !== identityRef.current) {
        identityRef.current = next
        window.dispatchEvent(new Event('feedback-sdk:pause-media'))
        notifyFeedbackSDKUnreadCount(0)
        const params = new URLSearchParams(window.location.search); params.delete('feedback'); params.delete('q')
        navigate({ pathname: '/submit', search: params.toString() ? `?${params}` : '' }, { replace: true })
        setIdentity(next)
      }
    }
    window.addEventListener(FEEDBACK_SDK_CONFIGURED_EVENT, configured)
    return () => window.removeEventListener(FEEDBACK_SDK_CONFIGURED_EVENT, configured)
  }, [navigate])
  return <SDKSupportSession key={identity} scopeKey={identity} />
}

function SDKSupportSession({ scopeKey }: { scopeKey: string }) {
  const location = useLocation(), navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const selectedId = searchParams.get('feedback') || ''
  const view = location.pathname === '/status' || (location.pathname === '/chat' && selectedId) ? 'feedback' : 'chat'
  const [manualOpen, setManualOpen] = useState(() => { try { return sessionStorage.getItem(`feedback-manual-open:${scopeKey}`) === 'true' } catch { return false } })
  useEffect(() => { try { sessionStorage.setItem(`feedback-manual-open:${scopeKey}`, String(manualOpen)) } catch { /* Current view remains available without storage. */ } }, [scopeKey, manualOpen])
  const alive = useRef(true)
  useEffect(() => { alive.current = true; return () => { alive.current = false } }, [])
  const [wide, setWide] = useState(false)
  const [tab, setTab] = useState<'conversation' | 'events' | 'conclusions'>('conversation')
  const [structured, setStructured] = useState<AgentStructuredSummary>()
  const [confirmed, setConfirmed] = useState(false)
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState('')
  const [conversationId, setConversationId] = useState('')
  const [question, setQuestion] = useState('')
  const [manualConversationId, setManualConversationId] = useState(() => { try { return sessionStorage.getItem(`feedback-manual-conversation:${scopeKey}`) || '' } catch { return '' } })
  const openManual = () => { setManualConversationId(conversationId); setManualOpen(true); try { sessionStorage.setItem(`feedback-manual-conversation:${scopeKey}`, conversationId) } catch { /* Optional draft restoration. */ } }
  const [created, setCreated] = useState<{ id: number; shortId: string; conversationId?: string }>()
  const edits = useRef<Partial<AgentStructuredSummary>>({})
  const creatingRef = useRef(false)
  const [items, setItems] = useState<FeedbackItem[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [query, setQuery] = useState('')
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [dateField, setDateField] = useState<'created' | 'updated'>('created')
  const [loading, setLoading] = useState(false)
  const [listError, setListError] = useState('')
  const [revision, setRevision] = useState(0)
  const [unread, setUnread] = useState(0)
  const [unreadIds, setUnreadIds] = useState(new Set<string>())
  const [configRevision, setConfigRevision] = useState(0)
  const config = getFeedbackSDKConfig()

  useEffect(() => { const timer = setTimeout(() => { setSearch(query); setPage(1) }, 300); return () => clearTimeout(timer) }, [query])
  useEffect(() => { const configured = () => { setConfigRevision((v) => v + 1); setPage(1) }; window.addEventListener(FEEDBACK_SDK_CONFIGURED_EVENT, configured); return () => window.removeEventListener(FEEDBACK_SDK_CONFIGURED_EVENT, configured) }, [])
  useFeedbackRealtime({ projectId: Number(config.projectId) || undefined, enabled: true, onEvent: useCallback(() => setRevision((v) => v + 1), []) })
  useEffect(() => {
    const refresh = () => { if (document.visibilityState === 'visible') setRevision((v) => v + 1) }
    window.addEventListener('focus', refresh); document.addEventListener('visibilitychange', refresh)
    const timer = setInterval(refresh, 30000)
    return () => { clearInterval(timer); window.removeEventListener('focus', refresh); document.removeEventListener('visibilitychange', refresh) }
  }, [])
  useEffect(() => {
    let canceled = false
    if (!isFeedbackSDKV2NotificationsEnabled()) return
    fetchFeedbackNotificationsV2({ unreadOnly: true, page: 1, pageSize: 100 }).then((value) => {
      if (canceled) return
      setUnread(value.unreadCount); setUnreadIds(new Set(value.notifications.map((n) => String(n.feedback_id)))); notifyFeedbackSDKUnreadCount(value.unreadCount)
    }).catch(() => { /* Do not report a false zero when the unread endpoint is unavailable. */ })
    return () => { canceled = true }
  }, [revision, configRevision])
  useEffect(() => {
    if (view !== 'feedback') return
    let canceled = false
    let params: FeedbackListQuery
    try { params = { ...feedbackDateRange(dateFrom, dateTo), query: search, status, dateField, pageSize: 20 } }
    catch (e) { setListError(e instanceof Error ? e.message : '日期错误'); return }
    setLoading(true); setListError('')
    // Reload all visible pages on a realtime event so additions never shift a later page into a gap.
    Promise.all(Array.from({ length: page }, (_, index) => fetchFeedbackItemsV2({ ...params, page: index + 1 }))).then((pages) => {
      if (canceled) return
      const byId = new Map(pages.flatMap((p) => p.items).map((item) => [item.id, item]))
      setItems([...byId.values()]); setTotal(pages[0]?.total || 0)
    }).catch((e) => { if (!canceled) setListError(e.message || '加载反馈失败') }).finally(() => { if (!canceled) setLoading(false) })
    return () => { canceled = true }
  }, [view, page, search, status, dateFrom, dateTo, dateField, revision, configRevision])

  const changeView = (next: 'chat' | 'feedback', id?: string) => {
    window.dispatchEvent(new Event('feedback-sdk:pause-media'))
    const params = new URLSearchParams(location.search); params.delete('feedback'); params.delete('q')
    if (id) params.set('feedback', id)
    navigate({ pathname: next === 'chat' ? '/submit' : '/status', search: params.toString() ? `?${params}` : '' })
    setTab('conversation')
  }
  const onNeedCollect = (payload: { question: string; structured?: AgentStructuredSummary }) => {
    if (!payload.structured && !payload.question) { setQuestion(''); setStructured(undefined); edits.current = {}; setConfirmed(false); setCreated(undefined); setCreateError(''); return }
    setQuestion(payload.question)
    setStructured((previous) => reviewSummary(previous, payload.structured, edits.current))
    setConfirmed(false)
  }
  const onConversationReady = (id: string) => { if (id !== conversationId) { setQuestion(''); setStructured(undefined); setCreated(undefined); setCreateError(''); edits.current = {}; setConfirmed(false) }; setConversationId(id) }
  const create = async () => {
    if (!structured || !confirmed || missingClarificationFields(structured).length || creatingRef.current || created) return
    creatingRef.current = true; setCreating(true); setCreateError('')
    try {
      const result = await submitFeedbackV2({ content: formatStructuredFeedback(structured, question), structured, conversationId: conversationId || undefined })
      if (!alive.current) return
      setCreated({ ...result, conversationId }); setRevision((r) => r + 1)
    } catch (e) { if (alive.current) setCreateError(e instanceof Error ? e.message : '创建反馈失败，请重试') }
    finally { creatingRef.current = false; if (alive.current) setCreating(false) }
  }
  const selected = items.find((i) => i.id === selectedId)
  const close = () => { window.dispatchEvent(new Event('feedback-sdk:pause-media')); window.parent.postMessage({ source: 'feedback-sdk-web', type: 'feedback-sdk:close' }, '*') }
  return <main className={`sdk-support${wide ? ' sdk-support-wide' : ''}`} data-feedback-sdk-shell>
    <header className="sdk-header"><div className="flex items-center gap-3"><span className="sdk-brand-mark">✧</span><div><h1>帮助与反馈</h1><small>产品答疑 · 问题反馈 · 进展跟踪</small></div></div><div className="sdk-window-actions"><button aria-label={wide ? '收起宽面板' : '切换宽面板'} aria-pressed={wide} type="button" onClick={() => setWide((value) => !value)} className="sdk-resize"><svg aria-hidden="true" viewBox="0 0 24 24" fill="none"><path d="M4 12h16M8 8l-4 4 4 4m8-8 4 4-4 4" /></svg></button><button aria-label="关闭帮助与反馈" type="button" onClick={close} className="sdk-close"><svg aria-hidden="true" viewBox="0 0 24 24" fill="none"><path d="m6 6 12 12M18 6 6 18" /></svg></button></div></header>
    <nav className="sdk-navigation" aria-label="客户服务"><button type="button" className={view === 'chat' ? 'active' : ''} onClick={() => changeView('chat')}>智能客服</button><button type="button" className={view === 'feedback' ? 'active' : ''} onClick={() => changeView('feedback')}>我的反馈{unread > 0 && <span className="sdk-unread-count">{unread}</span>}</button></nav>
    <div className="sdk-workarea">
      {/* Keep the consulting component mounted between tabs so switching to feedback does not lose an in-progress draft. */}
      <section hidden={view !== 'chat'} aria-label="智能客服咨询" className="sdk-chat-view">
        <AgentChatPanel standalone formOpen={manualOpen} draftScope={scopeKey} structuredDraft={structured} questionDraft={question} onDirectFeedback={openManual} onNeedCollect={onNeedCollect} onConversationReady={onConversationReady} hasUnsubmittedSummary={Boolean(structured && !created)} submittedConversationId={created?.conversationId} submitting={creating || manualOpen} onMyFeedback={() => changeView('feedback')}>
        {manualOpen && <ManualFeedbackForm key={manualConversationId} scopeKey={scopeKey} conversationId={manualConversationId || undefined} onCancel={() => setManualOpen(false)} onPendingChange={setCreating} onCreated={(result) => { setManualOpen(false); setCreated({ ...result, conversationId: manualConversationId || undefined }); setRevision((v) => v + 1); changeView('feedback', String(result.id)) }} />}
        {!manualOpen && structured && !created && <><ClarificationReview value={structured} confirmed={confirmed} pending={creating} onChange={(next) => {
          const changes = { ...edits.current }
          for (const [key] of clarificationFields) if (key !== 'request_type' && next[key] !== structured[key]) changes[key] = next[key]
          if (JSON.stringify(next.unknown_fields) !== JSON.stringify(structured.unknown_fields)) changes.unknown_fields = next.unknown_fields
          edits.current = changes; setStructured(next); setConfirmed(false)
        }} onConfirm={() => setConfirmed(true)} />
          <p className="text-xs text-foreground-secondary">确认仅代表信息核对。内部团队决定受理、优先级和交付安排。</p>
          <button type="button" className="sdk-button primary my-3" disabled={!confirmed || creating || missingClarificationFields(structured).length > 0} onClick={() => void create()}>{creating ? '正在提交…' : '确认并创建反馈卡片'}</button>
          {createError && <p role="alert" className="text-xs text-error">{createError}</p>}
        </>}
        {!manualOpen && !created && <button type="button" className="sdk-button my-3" onClick={openManual}>仍未解决 / 直接反馈</button>}
        {created && <div className="sdk-notice"><strong>反馈 {created.shortId} 已提交</strong><p>{created.conversationId ? '原咨询及媒体已关联，可在我的反馈中查看后续回复。' : '可在我的反馈中查看后续回复。'}</p><button type="button" className="sdk-button mt-3" onClick={() => changeView('feedback', String(created.id))}>查看卡片全生命周期 →</button></div>}
        </AgentChatPanel>
      </section>
      {view === 'feedback' && <section aria-label="我的反馈" className="sdk-feedback-view">
        {selectedId ? <><div className="sdk-backline"><button className="text-xs text-primary" type="button" onClick={() => changeView('feedback')}>← 我的反馈</button><small>#{selectedId}</small></div><div className="sdk-detail-heading"><h2>{selected?.title || '反馈详情'}</h2>{selected && <span className={`sdk-status ${selected.status}`}>{labels[selected.status]}</span>}</div>{selected && <p className="sdk-detail-meta">提交于 {selected.createdAt}</p>}
          <SubmittedFeedbackInfo key={selectedId} feedbackId={selectedId} />
          <nav className="sdk-detail-tabs" aria-label="反馈详情">{([['conversation', '沟通记录'], ['events', '卡片流转'], ['conclusions', '处理结论']] as const).map(([key, label]) => <button type="button" key={key} className={tab === key ? 'active' : ''} onClick={() => setTab(key)}>{label}</button>)}</nav>
          <div hidden={tab !== 'conversation'}><FeedbackConversationPanel feedbackId={selectedId} refreshKey={revision} onNotificationsRead={(id, count) => { setUnread((n) => { const next = Math.max(0, n - count); notifyFeedbackSDKUnreadCount(next); return next }); setUnreadIds((old) => { const next = new Set(old); next.delete(id); return next }) }} /></div>
          {tab !== 'conversation' && <FeedbackLifecyclePanel key={`${selectedId}:${tab}`} feedbackId={selectedId} mode={tab} refreshKey={revision} onChanged={() => setRevision((r) => r + 1)} />}
        </> : <><div className="sdk-list-heading"><h2>我的反馈</h2><p>查看处理进展，与团队继续沟通。</p></div><div className="sdk-filters"><div className="sdk-search"><span aria-hidden="true">⌕</span><input aria-label="搜索反馈问题" className="sdk-input" placeholder="搜索问题、编号或沟通内容" value={query} onChange={(e) => setQuery(e.target.value)} /></div><select aria-label="反馈状态" className="sdk-input" value={status} onChange={(e) => { setStatus(e.target.value); setPage(1) }}><option value="">全部状态</option>{Object.entries(labels).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select><details className="sdk-date-filters"><summary>日期筛选<span aria-hidden="true">⌄</span></summary><div className="sdk-date-fields"><select aria-label="日期类型" className="sdk-input" value={dateField} onChange={(e) => { setDateField(e.target.value as 'created' | 'updated'); setPage(1) }}><option value="created">按提交时间</option><option value="updated">按最近沟通</option></select><label>开始日期<input type="date" className="sdk-input" value={dateFrom} onChange={(e) => { setDateFrom(e.target.value); setPage(1) }} /></label><label>结束日期<input type="date" className="sdk-input" value={dateTo} onChange={(e) => { setDateTo(e.target.value); setPage(1) }} /></label><button type="button" className="sdk-button" onClick={() => { setQuery(''); setSearch(''); setDateFrom(''); setDateTo(''); setStatus(''); setPage(1) }}>重置</button></div></details></div>
          {listError && <p role="alert" className="my-3 text-sm text-error">{listError}<button type="button" className="ml-3 text-primary" onClick={() => setRevision((r) => r + 1)}>重试</button></p>}
          <small className="sdk-list-count">{total} 条反馈 · 按{dateField === 'created' ? '提交时间' : '最近沟通'}筛选</small><div className="sdk-feedback-list">{items.map((item) => <button type="button" className="sdk-feedback-item" key={item.id} onClick={() => changeView('feedback', item.id)}><div className="flex justify-between gap-3"><small>#{item.id}{unreadIds.has(item.id) && <span className="sdk-unread-dot" aria-label="有未读回复" />}</small><span className={`sdk-status ${item.status}`}>{labels[item.status]}</span></div><h3>{item.title}</h3><p>{item.summary}</p><div className="sdk-card-footer"><small>提交 {item.createdAt}</small><small>{unreadIds.has(item.id) ? '团队有新回复' : '查看详情'} →</small></div></button>)}</div>
          {!loading && !items.length && !listError && <p className="sdk-empty">没有匹配的反馈。你可以调整筛选，或先向智能客服说明问题。</p>}
          {loading && <p role="status">正在加载反馈…</p>}{items.length < total && <button type="button" className="sdk-button" disabled={loading} onClick={() => setPage((p) => p + 1)}>加载更多反馈</button>}
        </>}
      </section>}
    </div>
  </main>
}
