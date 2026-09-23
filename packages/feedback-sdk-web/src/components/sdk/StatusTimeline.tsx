import clsx from 'clsx'
import { feedbackStatusFlow } from '@/lib/feedback/types'
import type { FeedbackStatus, TimelineNode } from '@/lib/feedback/types'
import { t } from '@/i18n'

const statusTextKey: Record<FeedbackStatus, string> = {
	submitted: 'list.status.submitted',
	analyzing: 'list.status.analyzing',
	reviewing: 'list.status.reviewing',
  developing: 'list.status.developing',
  released: 'list.status.released',
  completed: 'list.status.completed',
  ignored: 'list.status.ignored',
}

export function StatusFlowText({ currentStatus }: { currentStatus: FeedbackStatus }) {
	const flow =
		currentStatus === 'ignored'
			? (['submitted', 'ignored'] satisfies FeedbackStatus[])
		: currentStatus === 'completed'
			? (['submitted', 'reviewing', 'developing', 'completed'] satisfies FeedbackStatus[])
			: currentStatus === 'developing'
				? (['submitted', 'reviewing', 'developing'] satisfies FeedbackStatus[])
				: currentStatus === 'reviewing'
					? (['submitted', 'reviewing'] satisfies FeedbackStatus[])
					: feedbackStatusFlow
  const currentIndex = flow.indexOf(currentStatus)

  return (
    <div className="flex flex-wrap items-center gap-1.5 text-xs">
      {flow.map((status, index) => {
        const active = index <= currentIndex
        return (
          <span key={status} className={clsx(active ? 'text-foreground' : 'text-foreground-tertiary')}>
            {t(statusTextKey[status])}
            {index < flow.length - 1 ? <span className="mx-1 text-foreground-tertiary">→</span> : null}
          </span>
        )
      })}
    </div>
  )
}

export function StatusTimeline({ timeline }: { timeline: TimelineNode[] }) {
  return (
    <ol className="space-y-3">
      {timeline.map((node, index) => {
        const isLast = index === timeline.length - 1
        return (
          <li key={`${node.status}-${node.at}`} className="relative flex items-start gap-3">
            <div className="relative flex w-5 shrink-0 justify-center pt-1">
              <span className="inline-flex h-2.5 w-2.5 rounded-full bg-primary" />
              {!isLast ? <span className="absolute top-4 h-8 w-px bg-border" /> : null}
            </div>

            <div className="min-w-0 pb-2">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-sm font-semibold text-foreground">{node.title}</p>
                <span className="text-xs text-foreground-tertiary">{node.at}</span>
              </div>
              <p className="mt-1 text-sm text-foreground-secondary">{node.note}</p>
            </div>
          </li>
        )
      })}
    </ol>
  )
}
