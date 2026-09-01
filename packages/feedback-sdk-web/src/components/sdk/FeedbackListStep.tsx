import { useEffect, useMemo, useState, type ReactNode } from 'react'
import clsx from 'clsx'
import type { FeedbackItem, FeedbackStatus } from '@/lib/feedback/types'
import { StatusFlowText, StatusTimeline } from '@/components/sdk/StatusTimeline'

const statusLabel: Record<FeedbackStatus, string> = {
  submitted: '已提交',
	analyzing: '处理中',
	reviewing: '已受理',
  developing: '开发中',
  released: '已上线',
  completed: '已完成',
  ignored: '已忽略',
}

const statusColor: Record<FeedbackStatus, string> = {
  submitted: 'bg-info-light text-info',
  analyzing: 'bg-info-light text-info',
  reviewing: 'bg-warning-light text-warning',
  developing: 'bg-primary-light text-primary',
  released: 'bg-success-light text-success',
  completed: 'bg-success-light text-success',
  ignored: 'bg-error-light text-error',
}

interface FeedbackListStepProps {
  items: FeedbackItem[]
  renderConversation?: (item: FeedbackItem) => ReactNode
  unreadItemIds?: ReadonlySet<string>
}

export function FeedbackListStep({ items, renderConversation, unreadItemIds }: FeedbackListStepProps) {
  const [selectedId, setSelectedId] = useState('')
  const [mobileView, setMobileView] = useState<'list' | 'detail'>('detail')
  const selected = useMemo(() => items.find((item) => item.id === selectedId) ?? null, [items, selectedId])
  const hasSelected = Boolean(selected)

  useEffect(() => {
    if (!items.length) {
      setSelectedId('')
      return
    }
    const exists = items.some((item) => item.id === selectedId)
    if (!exists) {
      setSelectedId(items[0].id)
      setMobileView('detail')
    }
  }, [items, selectedId])

  const handleSelect = (id: string) => {
    setSelectedId(id)
    setMobileView('detail')
  }

  const renderItemCard = (item: FeedbackItem) => (
    <button
      key={item.id}
      type="button"
      onClick={() => handleSelect(item.id)}
      className={clsx(
        'w-full rounded-xl border bg-surface-elevated p-4 text-left shadow-sm transition-colors',
        selected?.id === item.id
          ? 'border-primary ring-2 ring-inset ring-primary shadow-md'
          : 'border-border hover:border-border-hover hover:bg-surface',
      )}
    >
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex min-w-0 items-center gap-2">
            {unreadItemIds?.has(item.id) ? <span className="h-2 w-2 shrink-0 rounded-full bg-primary" aria-label="有未读更新" title="有未读更新" /> : null}
            <p className="truncate text-sm font-semibold text-foreground">{item.title}</p>
          </div>
          <p
            className="mt-1 text-sm leading-5 text-foreground-secondary"
            style={{
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {item.summary}
          </p>
        </div>
        <span className={clsx('shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold', statusColor[item.status])}>
          {statusLabel[item.status]}
        </span>
      </div>

      <div className="rounded-lg bg-surface p-2.5">
        <div className="grid grid-cols-2 gap-2">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-foreground-tertiary">提交于</p>
            <p className="mt-0.5 text-xs font-medium text-foreground-secondary">{item.createdAt}</p>
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-foreground-tertiary">进展说明</p>
            <p className="mt-0.5 text-xs font-medium text-foreground-secondary">{item.etaText}</p>
          </div>
        </div>
      </div>

      <div className="mt-2.5">
        <StatusFlowText currentStatus={item.status} />
      </div>
    </button>
  )

  const renderDetail = () => {
    if (!selected) {
      return (
        <div className="rounded-xl bg-surface p-4 text-sm text-foreground-secondary shadow-sm">
          暂无可查看的反馈详情。
        </div>
      )
    }

    return (
      <div className="rounded-xl bg-surface p-4 shadow-sm">
        <div className="mb-3 border-b border-divider pb-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-foreground-tertiary">详情</p>
          <h3 className="mt-1 text-base font-semibold text-foreground">{selected.title}</h3>
          <p className="mt-1 text-sm text-foreground-secondary">{selected.summary}</p>
          <p className="mt-1 text-xs text-foreground-tertiary">{selected.etaText}</p>
        </div>
        <div className="scrollbar-slim max-h-[56dvh] overflow-y-auto pr-1">
          <StatusTimeline timeline={selected.timeline} />
        </div>
        {renderConversation ? <div key={selected.id} className="mt-4 border-t border-divider pt-4">{renderConversation(selected)}</div> : null}
      </div>
    )
  }

  return (
    <section className="space-y-4">
      <header>
        <p className="text-xs font-semibold uppercase tracking-wide text-primary">My Feedback</p>
        <h2 className="mt-1 text-xl font-bold text-foreground">反馈状态追踪</h2>
        <p className="mt-1 text-sm text-foreground-secondary">透明查看你的反馈从提交到处理结果的完整流程。当前共 {items.length} 条。</p>
      </header>

      <div className="lg:hidden space-y-3">
        <div className="inline-flex rounded-lg border border-border bg-surface-elevated p-1">
          <button
            type="button"
            className={clsx(
              'rounded-md px-3 py-1.5 text-sm font-medium',
              mobileView === 'list' ? 'bg-primary text-white' : 'text-foreground-secondary',
            )}
            onClick={() => setMobileView('list')}
          >
            列表
          </button>
          <button
            type="button"
            className={clsx(
              'rounded-md px-3 py-1.5 text-sm font-medium',
              mobileView === 'detail' ? 'bg-primary text-white' : 'text-foreground-secondary',
            )}
            onClick={() => setMobileView('detail')}
            disabled={!hasSelected}
          >
            详情
          </button>
        </div>

        {mobileView === 'list' ? (
          <div className="scrollbar-slim max-h-[62dvh] space-y-3 overflow-y-auto pr-1">
            {items.map((item) => renderItemCard(item))}
          </div>
        ) : (
          <div className="space-y-2">
            <button
              type="button"
              onClick={() => setMobileView('list')}
              className="text-xs font-semibold text-primary hover:text-primary-hover"
            >
              返回列表
            </button>
            {renderDetail()}
          </div>
        )}
      </div>

      <div className="hidden gap-5 lg:grid lg:grid-cols-[1.45fr_1fr]">
        <div className="scrollbar-slim max-h-[68dvh] space-y-3 overflow-y-auto pr-1">
          {items.map((item) => renderItemCard(item))}
        </div>
        {renderDetail()}
      </div>
    </section>
  )
}
