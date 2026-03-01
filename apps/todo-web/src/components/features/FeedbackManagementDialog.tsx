import { useEffect, useMemo, useState } from 'react'
import clsx from 'clsx'
import { Dialog, LoadingView, ErrorView, EmptyStateView } from '@/components/ui'
import { useFeedbackList, useUpdateFeedback } from '@/hooks/useFeedbacks'
import { showGlobalToast } from '@/components/ui/Toast'
import { CreateTaskDialog } from '@/components/features/CreateTaskDialog'
import type { Feedback } from '@/lib/api/endpoints/feedbacks'

interface FeedbackManagementDialogProps {
  open: boolean
  onClose: () => void
  projectId: string
  projectName?: string
}

type FeedbackState = 'pending' | 'accepted' | 'ignored' | 'converted'
type FeedbackStatus = 'pending' | 'accepted' | 'ignored'

const PAGE_SIZE = 12

const STATE_META: Record<FeedbackState, { label: string; accent: string; headerBg: string }> = {
  pending: {
    label: '待处理',
    accent: 'text-warning',
    headerBg: 'bg-warning-light dark:bg-[rgba(245,158,11,0.12)]',
  },
  accepted: {
    label: '已确认',
    accent: 'text-success',
    headerBg: 'bg-success-light dark:bg-[rgba(34,197,94,0.12)]',
  },
  ignored: {
    label: '已忽略',
    accent: 'text-error',
    headerBg: 'bg-error-light dark:bg-[rgba(239,68,68,0.12)]',
  },
  converted: {
    label: '已流转',
    accent: 'text-info',
    headerBg: 'bg-info-light dark:bg-[rgba(59,130,246,0.12)]',
  },
}

const STATUS_OPTIONS: FeedbackStatus[] = ['pending', 'accepted', 'ignored']

const STATE_ACTION_LABEL: Record<FeedbackStatus, string> = {
  pending: '待处理',
  accepted: '确认/接受',
  ignored: '拒绝/忽略',
}

const STATE_ACTIVE_STYLE: Record<FeedbackStatus, string> = {
  pending: 'bg-warning-light text-warning border-warning',
  accepted: 'bg-success-light text-success border-success',
  ignored: 'bg-error-light text-error border-error',
}

const parseFeedbackState = (feedback: Feedback): FeedbackState => {
  if (!feedback.data) return 'pending'
  try {
    const parsed = JSON.parse(feedback.data)
    if (parsed && typeof parsed === 'object') {
      const rawState = parsed.feedback_state || parsed.state || parsed.status
      if (rawState === 'accepted' || rawState === 'ignored' || rawState === 'pending' || rawState === 'converted') {
        return rawState
      }
      if (parsed.converted_task_id) {
        return 'converted'
      }
    }
  } catch {
    // ignore parse errors, fallback to default
  }
  return 'pending'
}

const buildFeedbackDataWithState = (
  feedback: Feedback,
  nextState: FeedbackState,
  extra?: Record<string, unknown>
): string => {
  let base: Record<string, unknown> = {}
  if (feedback.data) {
    try {
      const parsed = JSON.parse(feedback.data)
      if (parsed && typeof parsed === 'object') {
        base = { ...parsed }
      } else {
        base = { raw_data: feedback.data }
      }
    } catch {
      base = { raw_data: feedback.data }
    }
  }

  if (nextState !== 'converted') {
    delete base.converted_task_id
    delete base.converted_at
  }

  return JSON.stringify({
    ...base,
    ...extra,
    feedback_state: nextState,
  })
}

const formatDateTime = (value?: string) => {
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

const buildFeedbackTaskContent = (feedback: Feedback) => {
  const title = feedback.title?.trim()
  const content = feedback.content?.trim()
  if (title && content) {
    return `[反馈] ${title}\n${content}`
  }
  if (content) return `[反馈] ${content}`
  if (title) return `[反馈] ${title}`
  return '[反馈]'
}

export function FeedbackManagementDialog({ open, onClose, projectId, projectName }: FeedbackManagementDialogProps) {
  const [page, setPage] = useState(1)
  const [pageInput, setPageInput] = useState('1')
  const [searchQuery, setSearchQuery] = useState('')
  const [updatingId, setUpdatingId] = useState<number | null>(null)
  const [showCreateTaskDialog, setShowCreateTaskDialog] = useState(false)
  const [pendingTaskContent, setPendingTaskContent] = useState('')
  const [pendingFeedback, setPendingFeedback] = useState<Feedback | null>(null)

  const updateFeedback = useUpdateFeedback(projectId)
  const { data: feedbackData, isLoading, error, refetch } = useFeedbackList(projectId, {
    page,
    pageSize: PAGE_SIZE,
    enabled: open,
  })

  const feedbacks = feedbackData?.feedbacks ?? []
  const total = feedbackData?.meta?.total ?? feedbackData?.total ?? feedbacks.length
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  useEffect(() => {
    setPageInput(String(page))
  }, [page])

  useEffect(() => {
    if (!open) {
      setPage(1)
      setPageInput('1')
      setSearchQuery('')
    }
  }, [open])

  const filteredFeedbacks = useMemo(() => {
    if (!searchQuery.trim()) return feedbacks
    const keyword = searchQuery.trim().toLowerCase()
    return feedbacks.filter((feedback) => {
      return (
        feedback.title?.toLowerCase().includes(keyword) ||
        feedback.content?.toLowerCase().includes(keyword)
      )
    })
  }, [feedbacks, searchQuery])

  const grouped = useMemo(() => {
    const result: Record<FeedbackState, Feedback[]> = {
      pending: [],
      accepted: [],
      ignored: [],
      converted: [],
    }
    filteredFeedbacks.forEach((feedback) => {
      const state = parseFeedbackState(feedback)
      result[state].push(feedback)
    })
    return result
  }, [filteredFeedbacks])

  const handleStateChange = async (feedback: Feedback, nextState: FeedbackStatus) => {
    if (updatingId) return
    setUpdatingId(feedback.id)
    try {
      await updateFeedback.mutateAsync({
        id: feedback.id,
        input: {
          data: buildFeedbackDataWithState(feedback, nextState),
        },
      })
      if (nextState === 'accepted') {
        showGlobalToast('已确认反馈', 'success', 2000)
      } else if (nextState === 'ignored') {
        showGlobalToast('已忽略反馈', 'success', 2000)
      } else {
        showGlobalToast('已更新反馈状态', 'success', 2000)
      }
    } catch (err: any) {
      console.error('更新反馈失败:', err)
      showGlobalToast(err?.message || '更新反馈失败', 'error', 2500)
    } finally {
      setUpdatingId(null)
    }
  }

  const handlePageJump = () => {
    const nextPage = Number(pageInput)
    if (!Number.isFinite(nextPage)) return
    const safePage = Math.min(Math.max(1, nextPage), totalPages)
    setPage(safePage)
  }

  const headerContent = (
    <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
      <div className="flex-1">
        <div className="flex items-center gap-2 rounded-lg border border-border bg-surface-elevated px-3 py-2">
          <svg className="w-4 h-4 text-foreground-tertiary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35m1.35-5.65a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value)
              setPage(1)
            }}
            placeholder="搜索反馈..."
            className="w-full bg-transparent text-sm text-foreground placeholder:text-foreground-tertiary focus:outline-none focus:ring-0"
          />
        </div>
      </div>
      <div className="flex items-center gap-2 text-xs text-foreground-secondary">
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setPage((prev) => Math.max(1, prev - 1))}
            disabled={page <= 1}
            className="px-2 py-1 rounded-md border border-border bg-surface-active text-foreground-secondary hover:bg-surface-hover disabled:opacity-50 disabled:cursor-not-allowed"
          >
            上一页
          </button>
          <span className="px-2">第 {page} / {totalPages} 页</span>
          <button
            type="button"
            onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
            disabled={page >= totalPages}
            className="px-2 py-1 rounded-md border border-border bg-surface-active text-foreground-secondary hover:bg-surface-hover disabled:opacity-50 disabled:cursor-not-allowed"
          >
            下一页
          </button>
        </div>
        <div className="hidden md:flex items-center gap-1">
          <input
            type="number"
            min={1}
            max={totalPages}
            value={pageInput}
            onChange={(e) => setPageInput(e.target.value)}
            className="w-16 rounded-md border border-border bg-surface-elevated px-2 py-1 text-xs text-foreground focus:outline-none focus:ring-0"
          />
          <button
            type="button"
            onClick={handlePageJump}
            className="px-2 py-1 rounded-md border border-border bg-surface-active text-foreground-secondary hover:bg-surface-hover"
          >
            跳转
          </button>
        </div>
      </div>
    </div>
  )

  const panelStyle = {
    width: 'calc(100vw - 30px)',
    maxWidth: 'calc(1600px - 30px)',
    minWidth: 'min(calc(1600px - 30px), calc(100vw - 30px))',
    minHeight: 'calc(100vh - 30px)',
    maxHeight: 'calc(100vh - 30px)',
  } as const

  return (
    <>
      <Dialog
        open={open}
        onClose={onClose}
        title="反馈管理台"
        description="查看和管理用户反馈"
        maxWidth="2xl"
        headerContent={headerContent}
        panelStyle={panelStyle}
      >
        <div className="space-y-4">

          {isLoading && <LoadingView size="md" text="加载反馈..." />}

          {error && (
            <ErrorView
              title="反馈加载失败"
              message="无法获取反馈列表，请稍后重试"
              onRetry={() => refetch()}
            />
          )}

          {!isLoading && !error && filteredFeedbacks.length === 0 && (
            <EmptyStateView title="暂无反馈" message="当前项目还没有收到反馈。" />
          )}

          {!isLoading && !error && filteredFeedbacks.length > 0 && (
            <div className="max-h-[calc(100vh-260px)] overflow-y-auto pr-1 scrollbar-slim">
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                {(['pending', 'accepted', 'ignored', 'converted'] as FeedbackState[]).map((state) => {
                  const items = grouped[state]
                  const meta = STATE_META[state]
                  return (
                    <div key={state} className="space-y-4">
                      <div
                        className={clsx(
                          'flex items-center justify-between rounded-xl border border-border px-4 py-3 shadow-sm',
                          meta.headerBg
                        )}
                      >
                        <div className="flex items-center gap-2">
                          <span className={clsx('h-2.5 w-2.5 rounded-full bg-current', meta.accent)} />
                          <span className="text-sm font-semibold text-foreground">{meta.label}</span>
                        </div>
                        <span className="text-xs font-semibold text-foreground-tertiary">{items.length}</span>
                      </div>

                      <div className="space-y-4">
                        {items.map((feedback) => {
                          const feedbackState = parseFeedbackState(feedback)
                          const isUpdating = updatingId === feedback.id || updateFeedback.isPending
                          return (
                            <div
                              key={feedback.id}
                              className="rounded-xl border border-border bg-surface-elevated p-4 shadow-sm hover:shadow-md transition-shadow flex flex-col h-[188px] overflow-hidden"
                            >
                              <div className="flex items-start justify-between gap-3">
                                <h3
                                  className={clsx('text-base font-semibold truncate', meta.accent)}
                                  title={feedback.title}
                                >
                                  {feedback.title}
                                </h3>
                                <span className="text-xs text-foreground-tertiary">#{feedback.short_id}</span>
                              </div>
                              <div className="flex-1 space-y-2 mt-2">
                                <p
                                  className="text-sm text-foreground-secondary whitespace-pre-line"
                                  style={{
                                    display: '-webkit-box',
                                    WebkitLineClamp: 3,
                                    WebkitBoxOrient: 'vertical',
                                    overflow: 'hidden',
                                  }}
                                >
                                  {feedback.content}
                                </p>
                                <div className="flex flex-wrap gap-2 text-xs text-foreground-tertiary h-[24px] overflow-hidden">
                                  {feedback.custom_user_id && (
                                    <span className="px-2 py-1 rounded-md bg-surface-active">自定义ID：{feedback.custom_user_id}</span>
                                  )}
                                  {feedback.user_phone && (
                                    <span className="px-2 py-1 rounded-md bg-surface-active">手机：{feedback.user_phone}</span>
                                  )}
                                  {feedback.user_email && (
                                    <span className="px-2 py-1 rounded-md bg-surface-active">邮箱：{feedback.user_email}</span>
                                  )}
                                </div>
                              </div>
                              <div className="space-y-2">
                                <div className="flex items-center justify-between gap-3">
                                  <span className="text-xs text-foreground-tertiary">
                                    提交时间：{formatDateTime(feedback.created_at)}
                                  </span>
                                  <div className="flex items-center gap-2">
                                    {feedbackState === 'accepted' && (
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setPendingFeedback(feedback)
                                          setPendingTaskContent(buildFeedbackTaskContent(feedback))
                                          setShowCreateTaskDialog(true)
                                        }}
                                        className="text-xs font-semibold text-primary hover:text-primary-hover"
                                      >
                                        流转为待办
                                      </button>
                                    )}
                                    <span className="text-xs font-medium text-foreground-secondary">
                                      {STATE_META[feedbackState].label}
                                    </span>
                                  </div>
                                </div>
                                <div className="grid grid-cols-3 gap-2">
                                  {STATUS_OPTIONS.map((option) => {
                                    const isActive = feedbackState === option
                                    return (
                                      <button
                                        key={option}
                                        type="button"
                                        onClick={() => handleStateChange(feedback, option)}
                                        disabled={isUpdating || isActive}
                                        className={clsx(
                                          'px-2 py-1.5 rounded-md border text-xs font-semibold transition-colors',
                                          'disabled:opacity-60 disabled:cursor-not-allowed',
                                          isActive
                                            ? STATE_ACTIVE_STYLE[option]
                                            : 'bg-surface-active text-foreground-secondary border-border hover:bg-surface-hover'
                                        )}
                                      >
                                        {STATE_ACTION_LABEL[option]}
                                      </button>
                                    )
                                  })}
                                </div>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      </Dialog>

      <CreateTaskDialog
        open={showCreateTaskDialog}
        onClose={() => {
          setShowCreateTaskDialog(false)
          setPendingTaskContent('')
          setPendingFeedback(null)
        }}
        projectId={projectId}
        initialContent={pendingTaskContent}
        onSuccess={async (taskId) => {
          if (pendingFeedback) {
            try {
              await updateFeedback.mutateAsync({
                id: pendingFeedback.id,
                input: {
                  data: buildFeedbackDataWithState(pendingFeedback, 'converted', {
                    converted_task_id: taskId,
                    converted_at: new Date().toISOString(),
                  }),
                },
              })
              showGlobalToast('已流转为待办', 'success', 2000)
            } catch (err: any) {
              console.error('流转反馈失败:', err)
              showGlobalToast(err?.message || '流转反馈失败', 'error', 2500)
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
