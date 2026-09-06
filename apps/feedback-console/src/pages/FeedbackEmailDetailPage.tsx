import { useCallback, useEffect, useMemo, useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { FeedbackConversationPanel } from '@/components/features/FeedbackConversationPanel'
import { Avatar } from '@/components/ui'
import { useDesktopViewport } from '@/hooks/useDesktopViewport'
import { feedbackV2Client } from '@/lib/api/feedbackV2Client'
import type { Feedback } from '@/lib/api/endpoints/feedbacks'
import { buildFeedbackProjectPath } from '@/lib/utils/projectRouting'
import { useAuthStore } from '@/store/authStore'

const STATUS_LABELS: Record<string, string> = {
  pending: '待判断',
  accepted: '已确认',
  converted: '已流转',
  in_progress: '开发中',
  completed: '已完成',
  ignored: '已忽略',
  released: '已上线',
  submitted: '已提交',
  reviewing: '处理中',
  developing: '开发中',
}

function formatDate(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function ArrowLeftIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true" className="h-5 w-5">
      <path d="m15 18-6-6 6-6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function MessageIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true" className="h-5 w-5">
      <path d="M7 18.5 3.5 21v-5A8.5 8.5 0 1 1 7 18.5Z" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export default function FeedbackEmailDetailPage() {
  const navigate = useNavigate()
  const isDesktop = useDesktopViewport()
  const currentUser = useAuthStore((state) => state.user)
  const logout = useAuthStore((state) => state.logout)
  const { feedbackId = '' } = useParams<{ feedbackId: string }>()
  const numericFeedbackId = Number(feedbackId)
  const validFeedbackId = Number.isInteger(numericFeedbackId) && numericFeedbackId > 0
  const [feedback, setFeedback] = useState<Feedback | null>(null)
  const [loading, setLoading] = useState(validFeedbackId)
  const [error, setError] = useState(validFeedbackId ? '' : '反馈链接无效')
  const [refreshKey, setRefreshKey] = useState(0)

  const loadFeedback = useCallback(async () => {
    if (!validFeedbackId) return
    setLoading(true)
    setError('')
    try {
      setFeedback(await feedbackV2Client.getById(numericFeedbackId))
    } catch (err: any) {
      const status = err?.response?.status
      if (status === 403) {
        setError('你不是该项目成员，无法查看这条反馈')
      } else if (status === 404) {
        setError('这条反馈不存在或已被删除')
      } else {
        setError(err?.message || '反馈加载失败，请稍后重试')
      }
    } finally {
      setLoading(false)
    }
  }, [numericFeedbackId, validFeedbackId])

  useEffect(() => {
    void loadFeedback()
  }, [loadFeedback])

  const statusLabel = useMemo(() => {
    if (!feedback) return ''
    const status = feedback.customer_status || feedback.status || feedback.triage_status || 'pending'
    return STATUS_LABELS[status] || status
  }, [feedback])

  const consolePath = feedback?.project_id
    ? buildFeedbackProjectPath(feedback.project_id)
    : '/feedbacks'

  const switchAccount = () => {
    const redirect = validFeedbackId ? `/feedbacks/email/${numericFeedbackId}` : '/feedbacks'
    logout()
    navigate(`/login?redirect=${encodeURIComponent(redirect)}`, { replace: true })
  }

  if (isDesktop && feedback) {
    return <Navigate to={`${consolePath}?feedback_id=${feedback.id}`} replace />
  }

  return (
    <div className="min-h-[100dvh] bg-background text-foreground">
      <header className="sticky top-0 z-sticky border-b border-divider bg-surface/95 backdrop-blur-xl">
        <div className="mx-auto flex min-h-16 w-full max-w-3xl items-center justify-between gap-2 px-3 py-2 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary text-white shadow-sm">
              <MessageIcon />
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-foreground">反馈通知</p>
              <p className="truncate text-xs text-foreground-tertiary">邮件专属查看页</p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            <button
              type="button"
              onClick={switchAccount}
              className="inline-flex min-h-11 items-center gap-1.5 rounded-xl px-2 text-xs font-semibold text-foreground-secondary transition-colors hover:bg-surface-hover hover:text-foreground"
              aria-label={`当前账户：${currentUser?.username || '未知'}，切换账户`}
            >
              <Avatar user={currentUser} size="xs" showTooltip={false} />
              <span>切换</span>
            </button>
            <button
              type="button"
              onClick={() => navigate(consolePath)}
              className="inline-flex min-h-11 shrink-0 items-center gap-1 rounded-xl border border-divider bg-surface px-2 text-xs font-semibold text-foreground-secondary transition-colors hover:border-primary/35 hover:text-primary sm:px-3 sm:text-sm"
            >
              <ArrowLeftIcon />
              <span className="hidden sm:inline">返回管理台</span>
              <span className="sm:hidden">管理台</span>
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-3xl flex-col px-4 py-5 sm:px-6 sm:py-8">
        {loading ? (
          <div className="space-y-4" aria-label="正在加载反馈">
            <div className="h-4 w-28 animate-pulse rounded bg-surface-active" />
            <div className="h-9 w-3/4 animate-pulse rounded bg-surface-active" />
            <div className="h-[55dvh] animate-pulse rounded-2xl bg-surface-active" />
          </div>
        ) : null}

        {!loading && error ? (
          <section className="flex min-h-[60dvh] flex-col items-center justify-center text-center">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-surface-active text-foreground-secondary">
              <MessageIcon />
            </span>
            <h1 className="mt-5 text-xl font-semibold">无法打开反馈</h1>
            <p className="mt-2 max-w-sm text-sm leading-6 text-foreground-secondary">{error}</p>
            <p className="mt-1 text-xs text-foreground-tertiary">当前账户：{currentUser?.username || '未知账户'}</p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <button
                type="button"
                onClick={switchAccount}
                className="rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-hover"
              >
                切换账户后重试
              </button>
              {validFeedbackId ? (
                <button
                  type="button"
                  onClick={() => void loadFeedback()}
                  className="rounded-lg border border-divider bg-surface px-4 py-2.5 text-sm font-semibold text-foreground-secondary hover:text-foreground"
                >
                  重新加载
                </button>
              ) : null}
              <button
                type="button"
                onClick={() => navigate(consolePath)}
                className="rounded-lg border border-divider bg-surface px-4 py-2.5 text-sm font-semibold text-foreground-secondary hover:text-foreground"
              >
                返回管理台
              </button>
            </div>
          </section>
        ) : null}

        {!loading && feedback ? (
          <article className="overflow-hidden rounded-2xl border border-divider bg-surface shadow-sm">
            <header className="border-b border-divider px-4 py-5 sm:px-6 sm:py-6">
              <div className="flex flex-wrap items-center gap-2 text-xs text-foreground-tertiary">
                <span className="font-semibold text-primary">#{feedback.short_id}</span>
                <span aria-hidden="true">·</span>
                <time>{formatDate(feedback.created_at)}</time>
                <span className="ml-auto rounded-full bg-primary-lighter px-2.5 py-1 font-semibold text-primary">
                  {statusLabel}
                </span>
              </div>
              <h1 className="mt-3 text-balance text-xl font-semibold leading-8 text-foreground sm:text-2xl">
                {feedback.title || '未命名反馈'}
              </h1>
              <p className="mt-2 text-sm leading-6 text-foreground-secondary">
                你可以在这里查看完整反馈、图片附件与沟通记录，并直接回复用户。
              </p>
            </header>

            <div className="h-[calc(100dvh-15rem)] min-h-[32rem] max-h-[52rem]">
              <FeedbackConversationPanel
                feedbackId={feedback.id}
                projectId={feedback.project_id}
                refreshKey={refreshKey}
                standalone
                onChanged={() => setRefreshKey((value) => value + 1)}
              />
            </div>
          </article>
        ) : null}
      </main>
    </div>
  )
}
