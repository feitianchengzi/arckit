import { useCallback, useEffect, useMemo, useRef, useState, type MouseEvent } from 'react'
import clsx from 'clsx'
import { Dialog, EmptyStateView, ErrorView, ImagePreview, LoadingView } from '@/components/ui'
import { CreateTaskDialog } from '@/components/features/CreateTaskDialog'
import { showGlobalToast } from '@/components/ui/Toast'
import { useDeleteFeedback, useFeedbackList, useUpdateFeedback } from '@/hooks/useFeedbacks'
import type { Feedback } from '@/lib/api/endpoints/feedbacks'
import { OssResourceManager } from '@/lib/oss/OssResourceManager'
import { FeedbackConversationPanel } from '@/components/features/FeedbackConversationPanel'
import { feedbackV2Client, isFeedbackV2NotificationsProjectEnabled, isFeedbackV2ProjectEnabled } from '@/lib/api/feedbackV2Client'
import { useProjectWebSocket, type ProjectSocketEvent } from '@/hooks/useProjectWebSocket'
import { LinkIcon, RefreshIcon, SearchIcon, TrashIcon, XIcon } from '@/components/ui/icons'

interface FeedbackManagementDialogProps {
  open: boolean
  onClose: () => void
  projectId: string
  projectName?: string
  embedded?: boolean
  onOpenSettings?: () => void
}

type FeedbackState = 'pending' | 'accepted' | 'in_progress' | 'completed' | 'ignored' | 'converted'
type FeedbackTriageStatus = 'pending' | 'accepted' | 'ignored'
type FeedbackPriority = 'P1' | 'P2' | 'P3'
type MobileView = 'list' | 'detail'

interface FeedbackInsight {
	state: FeedbackState
	triageStatus: FeedbackTriageStatus
	priority: FeedbackPriority
	convertedTaskId?: number
	taskState?: string
  analysisSummary?: string
  rawData: Record<string, unknown>
}

interface FeedbackEntry {
  feedback: Feedback
  insight: FeedbackInsight
}

const PAGE_SIZE = 24

const STATE_META: Record<FeedbackState, { label: string; badgeClass: string }> = {
  pending: {
    label: '待处理',
    badgeClass: 'bg-warning-lighter text-warning',
  },
  accepted: {
    label: '已确认',
    badgeClass: 'bg-success-lighter text-success',
  },
  in_progress: {
    label: '开发中',
    badgeClass: 'bg-primary-lighter text-primary',
  },
  completed: {
    label: '已完成',
    badgeClass: 'bg-success-lighter text-success',
  },
  ignored: {
    label: '已忽略',
    badgeClass: 'bg-error-lighter text-error',
  },
  converted: {
    label: '已流转',
    badgeClass: 'bg-primary-lighter text-primary',
  },
}

const STATE_FILTERS: Array<{ value: 'all' | FeedbackState; label: string }> = [
  { value: 'all', label: '全部' },
  { value: 'pending', label: '待处理' },
  { value: 'in_progress', label: '开发中' },
  { value: 'completed', label: '已完成' },
  { value: 'accepted', label: '已确认' },
  { value: 'converted', label: '已流转' },
  { value: 'ignored', label: '已忽略' },
]

const V2_WORKFLOW_FILTERS: Array<{ value: 'all' | FeedbackState; label: string }> = [
	{ value: 'all', label: '全部' },
	{ value: 'pending', label: '待判断' },
	{ value: 'converted', label: '已流转' },
	{ value: 'ignored', label: '已忽略' },
]

const TASK_STATE_META: Record<string, { label: string; badgeClass: string }> = {
	pending: { label: '待处理', badgeClass: 'bg-surface text-foreground-secondary' },
	pending_review: { label: '待评审', badgeClass: 'bg-warning-lighter text-warning' },
	in_progress: { label: '开发中', badgeClass: 'bg-primary-lighter text-primary' },
	blocked: { label: '受阻', badgeClass: 'bg-error-lighter text-error' },
	completed: { label: '已完成', badgeClass: 'bg-success-lighter text-success' },
	accepted: { label: '已验收', badgeClass: 'bg-success-lighter text-success' },
	cancelled: { label: '已取消', badgeClass: 'bg-surface text-foreground-secondary' },
}

const PRIORITY_META: Record<FeedbackPriority, { label: string; menuLabel: string; badgeClass: string; selectClass: string }> = {
	P1: {
		label: 'P1',
		menuLabel: 'P1 - 高',
		badgeClass: 'bg-error-lighter text-error',
		selectClass: 'border-error/30 bg-error-lighter text-error',
	},
	P2: {
		label: 'P2',
		menuLabel: 'P2 - 中',
		badgeClass: 'bg-warning-lighter text-warning',
		selectClass: 'border-warning/30 bg-warning-lighter text-warning',
	},
	P3: {
		label: 'P3',
		menuLabel: 'P3 - 低',
		badgeClass: 'bg-surface text-foreground-secondary',
		selectClass: 'border-divider bg-surface text-foreground-secondary',
	},
}

const BUTTON_RESET_CLASS =
  'appearance-none cursor-pointer select-none caret-transparent focus:outline-none focus:ring-0 focus-visible:outline-none focus-visible:ring-0'

const IMAGE_EXTENSION_RE = /\.(png|jpe?g|webp|gif|bmp|svg)(\?.*)?$/i

function isHttpUrl(value: string): boolean {
  return /^https?:\/\//i.test(value)
}

function pickFileName(value: string): string {
  const cleaned = value.split('?')[0]
  const parts = cleaned.split('/').filter(Boolean)
  return parts[parts.length - 1] || value
}

function isLikelyImageAttachment(file: string, displayName?: string): boolean {
  return IMAGE_EXTENSION_RE.test(displayName || file)
}

function canResolveOssObjectKey(value: string): boolean {
  return !isHttpUrl(value) && value.includes('/')
}

function formatDateTime(value?: string): string {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function toNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string') {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : null
  }
  return null
}

function toText(value: unknown): string {
  if (typeof value === 'string') return value.trim()
  return ''
}

function parseFeedbackPayload(feedback: Feedback): Record<string, unknown> {
  if (!feedback.data) return {}
  try {
    const parsed = JSON.parse(feedback.data)
    if (parsed && typeof parsed === 'object') {
      return parsed as Record<string, unknown>
    }
  } catch {
    return { raw_data: feedback.data }
  }
  return {}
}

function pickState(payload: Record<string, unknown>): FeedbackState {
  const rawState = toText(payload.feedback_state || payload.state || payload.status).toLowerCase()
  if (rawState === 'accepted' || rawState === 'ignored' || rawState === 'pending' || rawState === 'converted' || rawState === 'in_progress' || rawState === 'completed') {
    return rawState
  }
  if (rawState === '开发中' || rawState === 'developing' || rawState === 'processing' || rawState === 'inprogress') {
    return 'in_progress'
  }
  if (rawState === '完成' || rawState === '已完成' || rawState === 'done' || rawState === 'finished') {
    return 'completed'
  }
  if (rawState === '已确认' || rawState === 'confirmed') {
    return 'accepted'
  }
  if (rawState === '已忽略' || rawState === 'rejected') {
    return 'ignored'
  }
  if (rawState === '待处理' || rawState === 'todo') {
    return 'pending'
  }
  if (rawState === '已流转' || rawState === 'flowed') {
    return 'converted'
  }
  if (toNumber(payload.converted_task_id)) return 'converted'
  return 'pending'
}

function pickPriority(payload: Record<string, unknown>): FeedbackPriority {
	const rawValue = payload.priority ?? payload.ai_priority ?? payload.priority_level
	const rawPriority = toText(rawValue).toUpperCase()
	if (rawPriority === 'P1' || rawPriority === 'P2' || rawPriority === 'P3') return rawPriority

	const numericPriority = toNumber(rawValue)
	if (numericPriority !== null) {
		if (numericPriority <= 1) return 'P1'
		if (numericPriority === 2) return 'P2'
		return 'P3'
	}
	return 'P2'
}

function priorityToTaskPriority(priority: FeedbackPriority): number {
	return priority === 'P1' ? 1 : priority === 'P2' ? 2 : 3
}

function buildFeedbackDataWithPriority(feedback: Feedback, priority: FeedbackPriority): string {
	return JSON.stringify({
		...parseFeedbackPayload(feedback),
		priority,
	})
}

function pickTriageStatus(feedback: Feedback, state: FeedbackState, convertedTaskId?: number): FeedbackTriageStatus {
	if (feedback.triage_status === 'pending' || feedback.triage_status === 'accepted' || feedback.triage_status === 'ignored') {
		return feedback.triage_status
	}
	if (state === 'ignored') return 'ignored'
	if (convertedTaskId || state === 'accepted' || state === 'converted' || state === 'in_progress' || state === 'completed') {
		return 'accepted'
	}
	return 'pending'
}

function getConsoleState(insight: FeedbackInsight, v2Workflow: boolean): FeedbackState {
	if (!v2Workflow) return insight.state
	if (insight.triageStatus === 'ignored') return 'ignored'
	if (insight.convertedTaskId) return 'converted'
	if (insight.triageStatus === 'accepted') return 'accepted'
	return 'pending'
}

function getConsoleStateLabel(state: FeedbackState, v2Workflow: boolean) {
	if (v2Workflow && state === 'pending') return '待判断'
	return STATE_META[state].label
}

function getTaskStateMeta(taskState?: string) {
	if (!taskState) return null
	return TASK_STATE_META[taskState] || { label: taskState, badgeClass: 'bg-surface text-foreground-secondary' }
}

function buildInsight(feedback: Feedback): FeedbackInsight {
	const payload = parseFeedbackPayload(feedback)
	const state = pickState({ ...payload, status: feedback.status || payload.status })
	const convertedTaskId = feedback.task_id ?? toNumber(payload.converted_task_id) ?? undefined

	return {
		state,
		triageStatus: pickTriageStatus(feedback, state, convertedTaskId),
		priority: pickPriority(payload),
		convertedTaskId,
		taskState: feedback.task_state || toText(payload.task_state) || undefined,
    analysisSummary: toText(payload.ai_summary) || undefined,
    rawData: payload,
  }
}

function buildFeedbackDataWithState(feedback: Feedback, nextState: FeedbackState, extra?: Record<string, unknown>): string {
  const payload = parseFeedbackPayload(feedback)
  const sdkStatus =
    nextState === 'accepted'
      ? 'reviewing'
      : nextState === 'in_progress' || nextState === 'converted'
        ? 'developing'
        : nextState === 'completed'
          ? 'completed'
          : nextState === 'ignored'
            ? 'ignored'
          : 'analyzing'
  const next: Record<string, unknown> = {
    ...payload,
    ...extra,
    feedback_state: nextState,
    status: sdkStatus,
  }

  if (nextState !== 'converted' && nextState !== 'in_progress' && nextState !== 'completed') {
    delete next['converted_task_id']
    delete next['converted_at']
  }

  return JSON.stringify(next)
}

function buildFeedbackTaskContent(feedback: Feedback) {
	const content = feedback.content?.trim()
	if (content) return `[反馈] ${content}`
	if (feedback.title?.trim()) return `[反馈] ${feedback.title.trim()}`
	return '[反馈]'
}

function mergeClassName(...classes: Array<string | false | null | undefined>) {
  return clsx(classes)
}

function preventButtonFocus(event: MouseEvent<HTMLButtonElement>) {
  event.preventDefault()
}

function FeedbackAttachmentPreview({ file, displayName }: { file?: string; displayName?: string }) {
  const [resolvedUrl, setResolvedUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [previewOpen, setPreviewOpen] = useState(false)

  const rawFile = file?.trim() || ''
  const name = displayName?.trim() || pickFileName(rawFile)
  const isImage = rawFile ? isLikelyImageAttachment(rawFile, name) : false
  const objectKey = rawFile && canResolveOssObjectKey(rawFile) ? rawFile : ''

  useEffect(() => {
    if (!rawFile) return

    let active = true
    setResolvedUrl('')
    setError('')

    if (isHttpUrl(rawFile)) {
      setLoading(false)
      setResolvedUrl(rawFile)
      return () => {
        active = false
      }
    }

    if (!canResolveOssObjectKey(rawFile)) {
      setLoading(false)
      setError('附件不是可解析的 OSS objectKey')
      return () => {
        active = false
      }
    }

    setLoading(true)
    OssResourceManager.resolve(rawFile)
      .then((url) => {
        if (!active) return
        setResolvedUrl(url)
      })
      .catch((err: any) => {
        if (!active) return
        setError(err?.message || '生成附件访问链接失败')
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [rawFile])

  if (!rawFile) return null

  const openResolvedUrl = () => {
    if (!resolvedUrl) return
    window.open(resolvedUrl, '_blank', 'noopener,noreferrer')
  }

  return (
    <div className="mt-4">
      <div className="mb-2 flex flex-wrap items-end justify-between gap-2">
        <div className="min-w-0">
          <p className="text-xs font-semibold text-foreground">{isImage ? '用户上传图片' : '用户上传附件'}</p>
          <p className="mt-0.5 truncate font-mono text-[11px] text-foreground-tertiary">{name}</p>
        </div>
        {resolvedUrl ? (
          <button
            type="button"
            onMouseDown={preventButtonFocus}
            onClick={openResolvedUrl}
            className={mergeClassName(
              BUTTON_RESET_CLASS,
              'text-xs font-semibold text-primary hover:text-primary-hover',
            )}
          >
            打开原图
          </button>
        ) : null}
      </div>

      {loading ? (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          <div className="aspect-[4/3] animate-pulse rounded-xl bg-surface" />
        </div>
      ) : error ? (
        <div className="rounded-lg bg-error-lighter px-3 py-2 text-xs text-error">{error}</div>
      ) : isImage && resolvedUrl ? (
        <>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            <button
              type="button"
              onMouseDown={preventButtonFocus}
              onClick={() => setPreviewOpen(true)}
              title="点击查看大图"
              className={mergeClassName(
                BUTTON_RESET_CLASS,
                'group relative aspect-[4/3] overflow-hidden rounded-xl bg-surface shadow-sm',
                'transition-transform duration-200 hover:-translate-y-0.5',
              )}
            >
              <img
                src={resolvedUrl}
                alt={name}
                data-oss-key={objectKey || undefined}
                className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]"
              />
              <span className="absolute inset-0 bg-black/0 transition-colors duration-200 group-hover:bg-black/10" />
              <span className="absolute bottom-2 left-2 rounded-full bg-black/55 px-2 py-1 text-[11px] font-semibold text-white opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                点击查看大图
              </span>
            </button>
          </div>
          <ImagePreview
            open={previewOpen && Boolean(resolvedUrl)}
            onClose={() => setPreviewOpen(false)}
            images={[{ url: resolvedUrl, key: rawFile }]}
          />
        </>
      ) : (
        <div className="rounded-lg bg-surface px-3 py-2 text-xs text-foreground-secondary">
          {resolvedUrl ? '该附件不是图片，可点击“打开原图”查看或下载。' : '附件链接暂不可用。'}
        </div>
      )}
    </div>
  )
}

export function FeedbackManagementDialog({
  open,
  onClose,
  projectId,
  projectName,
  embedded = false,
  onOpenSettings,
}: FeedbackManagementDialogProps) {
  const [page, setPage] = useState(1)
  const [stateFilter, setStateFilter] = useState<'all' | FeedbackState>('all')
  const [searchQuery, setSearchQuery] = useState('')
	const [searchOpen, setSearchOpen] = useState(false)
	const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'priority'>('newest')
	const [selectedFeedbackId, setSelectedFeedbackId] = useState<number | null>(null)
	const [mobileView, setMobileView] = useState<MobileView>('list')
	const [ignoringId, setIgnoringId] = useState<number | null>(null)
	const [prioritizingId, setPrioritizingId] = useState<number | null>(null)
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [showCreateTaskDialog, setShowCreateTaskDialog] = useState(false)
  const [pendingTaskContent, setPendingTaskContent] = useState('')
  const [pendingFeedback, setPendingFeedback] = useState<Feedback | null>(null)
  const [realtimeRevision, setRealtimeRevision] = useState(0)
	const [unreadFeedbackIds, setUnreadFeedbackIds] = useState<Set<number>>(new Set())
	const [unreadNotificationCount, setUnreadNotificationCount] = useState(0)
  const realtimeRefreshTimerRef = useRef<number | null>(null)

	const updateFeedback = useUpdateFeedback(projectId)
	const deleteFeedback = useDeleteFeedback(projectId)
	const v2Workflow = isFeedbackV2ProjectEnabled(projectId)
	const v2Notifications = v2Workflow && isFeedbackV2NotificationsProjectEnabled(projectId)
	const realtimeEnabled = v2Workflow && (embedded || open)
  const { data: feedbackData, isLoading, error, refetch } = useFeedbackList(projectId, {
    page,
    pageSize: PAGE_SIZE,
    enabled: embedded ? true : open,
    refetchInterval: realtimeEnabled ? 30000 : false,
    refetchOnWindowFocus: realtimeEnabled,
  })

  const scheduleRealtimeRefresh = useCallback(() => {
    if (realtimeRefreshTimerRef.current !== null) return
    realtimeRefreshTimerRef.current = window.setTimeout(() => {
      realtimeRefreshTimerRef.current = null
      setRealtimeRevision((current) => current + 1)
      void refetch()
    }, 250)
  }, [refetch])

  useEffect(() => {
    return () => {
      if (realtimeRefreshTimerRef.current !== null) {
        window.clearTimeout(realtimeRefreshTimerRef.current)
      }
    }
  }, [])

  const handleFeedbackSocketEvent = useCallback(
    (payload: ProjectSocketEvent) => {
      if (!payload?.event || payload.event === 'system.connected') return
      if (payload.project_id && payload.project_id !== Number(projectId)) return
      if (payload.event.startsWith('feedback.')) {
        scheduleRealtimeRefresh()
      }
    },
    [projectId, scheduleRealtimeRefresh],
  )

  useProjectWebSocket({
    projectId,
    enabled: realtimeEnabled,
    onEvent: handleFeedbackSocketEvent,
  })

	const loadUnreadNotifications = useCallback(async () => {
		if (!v2Notifications) {
			setUnreadFeedbackIds(new Set())
			setUnreadNotificationCount(0)
			return
		}
		try {
			const result = await feedbackV2Client.getNotifications({
				projectId: Number(projectId),
				unreadOnly: true,
				page: 1,
				pageSize: 100,
			})
			setUnreadFeedbackIds(new Set(result.notifications.map((notification) => notification.feedback_id)))
			setUnreadNotificationCount(result.unreadCount)
		} catch {
			// The existing feedback workspace remains usable if notifications are unavailable.
		}
	}, [projectId, v2Notifications])

	useEffect(() => {
		if (!(embedded || open)) return
		void loadUnreadNotifications()
	}, [embedded, loadUnreadNotifications, open, realtimeRevision])

  const feedbacks = feedbackData?.feedbacks ?? []
  const total = feedbackData?.meta?.total ?? feedbackData?.total ?? feedbacks.length
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  const entries = useMemo<FeedbackEntry[]>(() => {
    return feedbacks.map((feedback) => ({
      feedback,
      insight: buildInsight(feedback),
    }))
  }, [feedbacks])

	const filteredEntries = useMemo(() => {
    const keyword = searchQuery.trim().toLowerCase()

		const byFilter = entries.filter((entry) => {
			if (stateFilter !== 'all' && getConsoleState(entry.insight, v2Workflow) !== stateFilter) {
        return false
      }

      if (!keyword) {
        return true
      }

      const searchableText = [
        entry.feedback.title,
        entry.feedback.content,
        entry.feedback.short_id,
        entry.feedback.custom_user_id,
        entry.feedback.user_email,
        entry.feedback.user_phone,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()

      return searchableText.includes(keyword)
    })

    const sorted = [...byFilter]
    if (sortBy === 'priority') {
      const order: Record<string, number> = { P1: 1, P2: 2, P3: 3 }
      sorted.sort((a, b) => {
        const diff = order[a.insight.priority] - order[b.insight.priority]
        if (diff !== 0) return diff
        return new Date(b.feedback.created_at).getTime() - new Date(a.feedback.created_at).getTime()
      })
      return sorted
    }

    sorted.sort((a, b) => {
      const delta = new Date(a.feedback.created_at).getTime() - new Date(b.feedback.created_at).getTime()
      return sortBy === 'oldest' ? delta : -delta
    })

    return sorted
	}, [entries, searchQuery, sortBy, stateFilter, v2Workflow])

  const selectedEntry = useMemo(() => {
    if (!filteredEntries.length) {
      return null
    }

    const target = filteredEntries.find((entry) => entry.feedback.id === selectedFeedbackId)
    return target ?? filteredEntries[0]
  }, [filteredEntries, selectedFeedbackId])

  useEffect(() => {
    if (!filteredEntries.length) {
      setSelectedFeedbackId(null)
      return
    }

    const exists = filteredEntries.some((entry) => entry.feedback.id === selectedFeedbackId)
    if (!exists) {
      setSelectedFeedbackId(filteredEntries[0].feedback.id)
    }
  }, [filteredEntries, selectedFeedbackId])

  useEffect(() => {
    setPage(1)
    setSearchQuery('')
		setSearchOpen(false)
    setStateFilter('all')
    setSortBy('newest')
    setMobileView('list')
  }, [projectId])

	const handleIgnoreFeedback = async (entry: FeedbackEntry) => {
		if (ignoringId || updateFeedback.isPending) return
		const title = entry.feedback.title || `反馈 #${entry.feedback.short_id}`
		if (!window.confirm(`确认将“${title}”标记为暂不处理吗？`)) return

		setIgnoringId(entry.feedback.id)
		try {
			if (v2Workflow) {
				await feedbackV2Client.ignoreFeedback(entry.feedback.id)
			} else {
				await updateFeedback.mutateAsync({
					id: entry.feedback.id,
					input: { data: buildFeedbackDataWithState(entry.feedback, 'ignored') },
				})
			}
			showGlobalToast('反馈已标记为暂不处理', 'success', 2200)
			await refetch()
		} catch (err: any) {
			showGlobalToast(err?.message || '忽略反馈失败', 'error', 2600)
		} finally {
			setIgnoringId(null)
		}
	}

	const handlePriorityChange = async (entry: FeedbackEntry, priority: FeedbackPriority) => {
		if (priority === entry.insight.priority || prioritizingId || updateFeedback.isPending) return

		setPrioritizingId(entry.feedback.id)
		try {
			const input = { data: buildFeedbackDataWithPriority(entry.feedback, priority) }
			if (v2Workflow) {
				await feedbackV2Client.update(entry.feedback.id, input)
			} else {
				await updateFeedback.mutateAsync({ id: entry.feedback.id, input })
			}
			showGlobalToast(`优先级已设为 ${PRIORITY_META[priority].menuLabel}`, 'success', 1800)
			await refetch()
		} catch (err: any) {
			showGlobalToast(err?.message || '更新优先级失败', 'error', 2600)
		} finally {
			setPrioritizingId(null)
		}
	}

	const handleRefreshFeedbackWorkspace = () => {
		setRealtimeRevision((current) => current + 1)
		void refetch()
	}

  const handleDeleteFeedback = async (entry: FeedbackEntry) => {
    if (deletingId) return

    const title = entry.feedback.title || `反馈 #${entry.feedback.short_id}`
    if (!window.confirm(`确认删除“${title}”吗？删除后不再出现在默认反馈列表中。`)) {
      return
    }

    setDeletingId(entry.feedback.id)
    try {
      await deleteFeedback.mutateAsync(entry.feedback.id)
      setSelectedFeedbackId(null)
      setMobileView('list')
      showGlobalToast('反馈已删除', 'success', 2200)
      await refetch()
    } catch (err: any) {
      showGlobalToast(err?.message || '删除反馈失败', 'error', 2600)
    } finally {
      setDeletingId(null)
    }
  }

	const renderFeedbackCard = (entry: FeedbackEntry) => {
		const { feedback, insight } = entry
		const selected = selectedEntry?.feedback.id === feedback.id
		const displayState = getConsoleState(insight, v2Workflow)
		const taskStateMeta = getTaskStateMeta(insight.taskState)
		const hasUnread = v2Notifications && unreadFeedbackIds.has(feedback.id)

    return (
      <button
        key={feedback.id}
        type="button"
        onMouseDown={preventButtonFocus}
        onClick={() => {
          setSelectedFeedbackId(feedback.id)
          setMobileView('detail')
        }}
        className={mergeClassName(
          BUTTON_RESET_CLASS,
          'flex h-11 w-full items-center gap-3 rounded-md border px-3 text-left transition-colors',
          selected
            ? 'border-primary bg-primary-lighter/35'
            : 'border-transparent bg-surface-elevated hover:bg-surface',
        )}
      >
		<div className="flex min-w-0 flex-1 items-center gap-2">
		  {hasUnread ? <span className="h-2 w-2 shrink-0 rounded-full bg-primary" title="有未读用户更新" aria-label="有未读用户更新" /> : null}
		  <p className="min-w-0 flex-1 truncate text-sm font-medium text-foreground">
			{feedback.content || feedback.title || '暂无反馈内容'}
		  </p>
		</div>
		<div className="flex shrink-0 items-center gap-1.5">
		  <span className={mergeClassName('rounded-md px-1.5 py-0.5 text-xs font-bold', PRIORITY_META[insight.priority].badgeClass)}>
			{PRIORITY_META[insight.priority].label}
		  </span>
		  <span className={mergeClassName('rounded-full px-1.5 py-0.5 text-xs font-semibold', STATE_META[displayState].badgeClass)}>
			{getConsoleStateLabel(displayState, v2Workflow)}
		  </span>
		  {v2Workflow && taskStateMeta ? (
			<span className="hidden text-xs font-medium text-foreground-tertiary lg:inline">{taskStateMeta.label}</span>
		  ) : null}
		</div>
      </button>
    )
  }

	const renderDetail = (entry: FeedbackEntry | null) => {
    if (!entry) {
      return (
        <div className="h-full min-h-0 rounded-lg border border-divider bg-surface-elevated p-5 text-sm text-foreground-secondary">
          请选择左侧反馈查看详情。
        </div>
      )
    }

	const { feedback, insight } = entry
	const displayState = getConsoleState(insight, v2Workflow)
	const taskStateMeta = getTaskStateMeta(insight.taskState)
	const hasLinkedTask = Boolean(insight.convertedTaskId)
	const isIgnoring = ignoringId === feedback.id
	const isPrioritizing = prioritizingId === feedback.id
	const isUpdating = updateFeedback.isPending
	const isDeleting = deletingId === feedback.id || deleteFeedback.isPending
	const attachmentName = toText(insight.rawData.attachment_name || insight.rawData.image_name || insight.rawData.file_name)
	const canConvert = v2Workflow
		? !hasLinkedTask && (insight.triageStatus === 'pending' || insight.triageStatus === 'accepted')
		: !hasLinkedTask && (insight.state === 'pending' || insight.state === 'accepted')
	const canIgnore = !hasLinkedTask && (v2Workflow ? insight.triageStatus === 'pending' : insight.state !== 'ignored')

    return (
	  <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-lg border border-divider bg-surface-elevated shadow-sm">
		<div className="flex h-12 shrink-0 items-center gap-3 border-b border-divider px-4">
		  <div className="min-w-0 flex-1">
			<div className="flex min-w-0 items-center gap-2">
			  <span className="shrink-0 text-xs font-semibold text-primary">#{feedback.short_id}</span>
			  <span className="h-3 w-px shrink-0 bg-divider" />
			  <p className="truncate text-sm font-semibold text-foreground">{feedback.content || feedback.title || '暂无反馈内容'}</p>
			  <time className="hidden shrink-0 text-xs text-foreground-tertiary 2xl:inline">{formatDateTime(feedback.created_at)}</time>
			</div>
		  </div>
		  <div className="flex shrink-0 items-center gap-1.5 whitespace-nowrap">
			<span className={mergeClassName('rounded-md px-1.5 py-1 text-xs font-semibold', STATE_META[displayState].badgeClass)} title={v2Workflow ? `受理：${getConsoleStateLabel(displayState, true)}` : STATE_META[displayState].label}>
			  {v2Workflow ? getConsoleStateLabel(displayState, true) : STATE_META[displayState].label}
			</span>
			{v2Workflow && taskStateMeta ? <span className={mergeClassName('rounded-md px-1.5 py-1 text-xs font-semibold', taskStateMeta.badgeClass)} title={`执行：${taskStateMeta.label}`}>{taskStateMeta.label}</span> : null}
			{hasLinkedTask ? <span className="inline-flex items-center gap-1 text-xs font-semibold text-primary" title={`关联待办 #${insight.convertedTaskId}`}><LinkIcon className="h-3.5 w-3.5" />#{insight.convertedTaskId}</span> : null}
			<label className="sr-only" htmlFor={`feedback-priority-${feedback.id}`}>优先级</label>
			<select
			  id={`feedback-priority-${feedback.id}`}
			  value={insight.priority}
			  onChange={(event) => void handlePriorityChange(entry, event.target.value as FeedbackPriority)}
			  disabled={hasLinkedTask || isPrioritizing || isUpdating}
			  title={hasLinkedTask ? '已流转为待办，请在待办中调整优先级' : '设置反馈优先级'}
			  className={mergeClassName(
				'h-7 rounded-md border px-1.5 text-xs font-bold outline-none transition-colors focus:border-primary disabled:cursor-not-allowed disabled:opacity-60',
				PRIORITY_META[insight.priority].selectClass,
			  )}
			>
			  {(Object.keys(PRIORITY_META) as FeedbackPriority[]).map((priority) => (
				<option key={priority} value={priority}>{PRIORITY_META[priority].menuLabel}</option>
			  ))}
			</select>
				{canConvert ? (
                <button
                  type="button"
                  onMouseDown={preventButtonFocus}
                  onClick={() => {
                    setPendingFeedback(feedback)
                    setPendingTaskContent(buildFeedbackTaskContent(feedback))
                    setShowCreateTaskDialog(true)
                  }}
					disabled={isUpdating || isIgnoring}
                  className={mergeClassName(
                    BUTTON_RESET_CLASS,
					  'h-7 rounded-md bg-primary px-2 text-xs font-semibold text-white hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-50',
                  )}
                >
					流转待办
				</button>
			) : null}
			{canIgnore ? (
				<button
					type="button"
					onMouseDown={preventButtonFocus}
					onClick={() => void handleIgnoreFeedback(entry)}
					disabled={isIgnoring || isUpdating}
					className={mergeClassName(
						BUTTON_RESET_CLASS,
					  'h-7 rounded-md border border-divider bg-surface px-2 text-xs font-semibold text-foreground-secondary hover:border-warning hover:text-warning disabled:cursor-not-allowed disabled:opacity-50',
					)}
				>
					{isIgnoring ? '处理中...' : '忽略'}
				</button>
			) : null}
				<button
                type="button"
                onMouseDown={preventButtonFocus}
                onClick={() => void handleDeleteFeedback(entry)}
					disabled={isUpdating || isDeleting || isIgnoring}
                title="删除反馈"
					className={mergeClassName(
					  BUTTON_RESET_CLASS,
					  'grid h-7 w-7 place-items-center rounded-md text-foreground-tertiary hover:bg-error-lighter hover:text-error disabled:cursor-not-allowed disabled:opacity-50',
					)}
				  >
					{isDeleting ? '...' : <TrashIcon className="h-3.5 w-3.5" />}
					  </button>
					<button
					  type="button"
					  onMouseDown={preventButtonFocus}
					  onClick={handleRefreshFeedbackWorkspace}
					  title="刷新反馈与沟通记录"
					  aria-label="刷新反馈与沟通记录"
					  className={mergeClassName(
						BUTTON_RESET_CLASS,
						'grid h-7 w-7 place-items-center rounded-md text-foreground-tertiary hover:bg-surface-hover hover:text-foreground',
					  )}
					>
					  <RefreshIcon className="h-3.5 w-3.5" />
					</button>
				</div>
		</div>

        <div className="min-h-0 flex-1">
	          {isFeedbackV2ProjectEnabled(projectId) ? (
	            <FeedbackConversationPanel
				  feedbackId={feedback.id}
				  projectId={v2Notifications ? Number(projectId) : undefined}
				  refreshKey={realtimeRevision}
				  onChanged={() => void refetch()}
				  onNotificationsRead={loadUnreadNotifications}
				/>
          ) : (
            <section className="scrollbar-slim h-full overflow-y-auto px-5 py-5" aria-label="用户反馈">
              <article className="border-l-2 border-primary pl-4">
                <div className="flex items-center justify-between gap-3 text-xs text-foreground-tertiary">
                  <span className="font-semibold text-foreground-secondary">用户</span>
                  <time>{formatDateTime(feedback.created_at)}</time>
                </div>
                <p className="mt-2 whitespace-pre-line text-sm leading-6 text-foreground">{feedback.content || '暂无反馈内容'}</p>
                <FeedbackAttachmentPreview file={feedback.file} displayName={attachmentName} />
              </article>
            </section>
          )}
        </div>
      </div>
    )
  }

	const header = (
	  <div className="relative rounded-lg border border-divider bg-surface-elevated px-4">
		<div className="flex h-12 items-center justify-between gap-3">
			  <h1 className="shrink-0 truncate text-base font-semibold text-foreground">{projectName || '反馈平台'}</h1>
			  {v2Notifications && unreadNotificationCount > 0 ? (
				<span className="inline-flex shrink-0 items-center gap-1.5 rounded-md bg-primary-lighter px-2 py-1 text-xs font-semibold text-primary" title={`共有 ${unreadNotificationCount} 条未读用户更新`}>
				  <span className="h-1.5 w-1.5 rounded-full bg-primary" />未读 {unreadNotificationCount}
				</span>
			  ) : null}
		  {searchOpen ? (
			<div className="flex min-w-0 flex-1 items-center gap-2 rounded-md border border-divider bg-surface px-2.5 focus-within:border-divider focus-within:ring-0">
			  <SearchIcon className="h-4 w-4 shrink-0 text-foreground-tertiary" />
			  <input
				autoFocus
				type="text"
				value={searchQuery}
				onChange={(event) => {
				  setSearchQuery(event.target.value)
				  setPage(1)
				}}
				placeholder="搜索正文、编号或用户"
				className="min-w-0 flex-1 appearance-none border-0 bg-transparent py-1.5 text-sm text-foreground outline-none placeholder:text-foreground-tertiary focus:border-0 focus:outline-none focus:ring-0 focus-visible:outline-none focus-visible:ring-0"
			  />
			</div>
		  ) : null}
		  <div className="flex shrink-0 items-center gap-1.5">
			<button
			  type="button"
			  onMouseDown={preventButtonFocus}
			  onClick={() => {
				if (searchOpen) {
				  setSearchQuery('')
				  setPage(1)
				}
				setSearchOpen((current) => !current)
			  }}
			  title={searchOpen ? '关闭搜索' : '搜索反馈'}
			  aria-label={searchOpen ? '关闭搜索' : '搜索反馈'}
			  className={mergeClassName(
				BUTTON_RESET_CLASS,
				'grid h-8 w-8 place-items-center rounded-md text-foreground-secondary hover:bg-surface-hover hover:text-foreground',
				searchOpen ? 'bg-primary-lighter text-primary' : '',
			  )}
			>
			  {searchOpen ? <XIcon className="h-4 w-4" /> : <SearchIcon className="h-4 w-4" />}
			</button>
			<select
			  value={stateFilter}
			  onChange={(event) => {
				setStateFilter(event.target.value as 'all' | FeedbackState)
				setPage(1)
			  }}
			  title="筛选反馈状态"
			  className="h-8 rounded-md border border-divider bg-surface px-2 text-xs text-foreground outline-none focus:border-primary"
			>
			  {(v2Workflow ? V2_WORKFLOW_FILTERS : STATE_FILTERS).map((filter) => (
				<option key={filter.value} value={filter.value}>{filter.label}</option>
			  ))}
			</select>
			<select
			  value={sortBy}
			  onChange={(event) => setSortBy(event.target.value as 'newest' | 'oldest' | 'priority')}
			  title="排序方式"
			  className="h-8 rounded-md border border-divider bg-surface px-2 text-xs text-foreground outline-none focus:border-primary"
			>
			  <option value="newest">最新</option>
			  <option value="oldest">最早</option>
			  <option value="priority">优先级</option>
			</select>
			{onOpenSettings && (
            <button
              type="button"
              onMouseDown={preventButtonFocus}
              onClick={onOpenSettings}
              className={mergeClassName(
                BUTTON_RESET_CLASS,
				'h-8 rounded-md border border-divider bg-surface px-3 text-xs font-semibold text-foreground-secondary hover:bg-surface-hover',
              )}
            >
              接入设置
            </button>
          )}
		</div>
	  </div>
	</div>
  )

	  const listPanel = (
	    <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-lg border border-divider bg-surface-elevated">
	      {totalPages > 1 ? (
	      <div className="flex h-9 items-center justify-end gap-2 border-b border-divider px-3">
	        <div className="flex items-center gap-2 text-xs text-foreground-tertiary">
          <button
            type="button"
            onMouseDown={preventButtonFocus}
            onClick={() => setPage((prev) => Math.max(1, prev - 1))}
            disabled={page <= 1}
            title="上一页"
            aria-label="上一页"
            className={mergeClassName(
              BUTTON_RESET_CLASS,
              'grid h-7 w-7 place-items-center rounded-md hover:bg-surface-hover disabled:opacity-40',
            )}
          >
            ‹
          </button>
          <span>{page}/{totalPages}</span>
          <button
            type="button"
            onMouseDown={preventButtonFocus}
            onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
            disabled={page >= totalPages}
            title="下一页"
            aria-label="下一页"
            className={mergeClassName(
              BUTTON_RESET_CLASS,
              'grid h-7 w-7 place-items-center rounded-md hover:bg-surface-hover disabled:opacity-40',
            )}
          >
            ›
          </button>
	        </div>
	      </div>
	      ) : null}

      {filteredEntries.length === 0 ? (
        <div className="flex flex-1 items-center justify-center p-6 text-center text-sm text-foreground-secondary">
          当前筛选条件下暂无反馈。
        </div>
      ) : (
        <div className="scrollbar-slim min-h-0 flex-1 space-y-0.5 overflow-y-auto p-1">{filteredEntries.map(renderFeedbackCard)}</div>
      )}
    </div>
  )

  const content = (
    <div className="flex h-full min-h-0 flex-col gap-3 overflow-hidden">
      {header}

      {isLoading && <LoadingView size="md" text="加载反馈中..." />}

      {error && (
        <ErrorView
          title="反馈加载失败"
          message="无法获取反馈列表，请稍后重试"
          onRetry={() => refetch()}
        />
      )}

      {!isLoading && !error && entries.length === 0 && (
        <EmptyStateView title="暂无反馈" message="当前项目还没有收到反馈，先通过 SDK 收集一些用户声音。" />
      )}

      {!isLoading && !error && entries.length > 0 && (
        <>
          <div className="flex min-h-0 flex-1 flex-col gap-3 xl:hidden">
            <div className="inline-flex rounded-lg border border-divider bg-surface p-1">
              <button
                type="button"
                className={mergeClassName(
                  BUTTON_RESET_CLASS,
                  'rounded-md px-3 py-1.5 text-sm font-medium',
                  mobileView === 'list' ? 'bg-primary text-white' : 'text-foreground-secondary',
                )}
                onMouseDown={preventButtonFocus}
                onClick={() => setMobileView('list')}
              >
                列表
              </button>
              <button
                type="button"
                className={mergeClassName(
                  BUTTON_RESET_CLASS,
                  'rounded-md px-3 py-1.5 text-sm font-medium',
                  mobileView === 'detail' ? 'bg-primary text-white' : 'text-foreground-secondary',
                )}
                onMouseDown={preventButtonFocus}
                onClick={() => setMobileView('detail')}
                disabled={!selectedEntry}
              >
                详情
              </button>
            </div>

            <div className="min-h-0 flex-1">{mobileView === 'list' ? listPanel : renderDetail(selectedEntry)}</div>
          </div>

          <div className="hidden min-h-0 flex-1 gap-3 overflow-hidden xl:grid xl:grid-cols-[minmax(340px,0.72fr)_minmax(520px,1.28fr)]">
            {listPanel}
            <div className="h-full min-h-0 overflow-hidden pr-1">{renderDetail(selectedEntry)}</div>
          </div>
        </>
      )}
    </div>
  )

  return (
    <>
      {embedded ? (
        <div className="flex h-full min-h-0 flex-col">{content}</div>
      ) : (
        <Dialog
          open={open}
          onClose={onClose}
          title="反馈管理台"
          description="查看和处理用户反馈"
          maxWidth="2xl"
          panelStyle={{
            width: 'min(1480px, calc(100vw - 32px))',
            maxHeight: 'calc(100vh - 24px)',
          }}
        >
          {content}
        </Dialog>
      )}

      <CreateTaskDialog
        open={showCreateTaskDialog}
        onClose={() => {
          setShowCreateTaskDialog(false)
          setPendingTaskContent('')
          setPendingFeedback(null)
        }}
		projectId={projectId}
		initialContent={pendingTaskContent}
		initialPriority={pendingFeedback ? priorityToTaskPriority(buildInsight(pendingFeedback).priority) : undefined}
        onCreate={
          isFeedbackV2ProjectEnabled(projectId) && pendingFeedback
            ? async (input) => {
                const result = await feedbackV2Client.convertToTask({
                  feedbackId: pendingFeedback.id,
                  content: input.content,
                  executorId: input.assigneeId,
                  fatherId: input.parentId,
                  priority: input.priority,
                  tags: input.tags,
                })
                return result.task
              }
            : undefined
        }
        onSuccess={async (taskId) => {
          if (pendingFeedback) {
            try {
              if (!isFeedbackV2ProjectEnabled(projectId)) {
                await updateFeedback.mutateAsync({
                  id: pendingFeedback.id,
                  input: {
                    data: buildFeedbackDataWithState(pendingFeedback, 'converted', {
                      converted_task_id: taskId,
                      converted_at: new Date().toISOString(),
                    }),
                  },
                })
              }
              await refetch()
              showGlobalToast('已流转为待办', 'success', 2200)
            } catch (err: any) {
              showGlobalToast(err?.message || '流转反馈失败', 'error', 2600)
            }
          }
          setShowCreateTaskDialog(false)
          setPendingTaskContent('')
          setPendingFeedback(null)
        }}
      />
    </>
  )
}
