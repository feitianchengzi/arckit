import type { AIUnderstanding } from '@/lib/feedback/types'
import { Button } from '@/components/ui/Button'

interface Props {
  understanding: AIUnderstanding
  confirmLabel?: string
  submitting?: boolean
  submitError?: string
  onBack: () => void
  onConfirm: () => void
  isPlaceholder?: boolean
}

export function FeedbackConfirmStep({
  understanding,
  confirmLabel = '理解准确，继续',
  submitting = false,
  submitError,
  onBack,
  onConfirm,
  isPlaceholder = false,
}: Props) {
  return (
    <section className="space-y-5">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-primary">AI Parse Result</p>
          <h2 className="mt-1 text-xl font-bold text-foreground">AI 理解确认</h2>
          <p className="mt-1 text-sm text-foreground-secondary">确认内容准确后将进入处理状态追踪。</p>
        </div>
        <div className="flex items-center gap-2">
          {isPlaceholder ? (
            <span className="rounded-full bg-warning-light px-2.5 py-1 text-xs font-semibold text-warning">V1 占位</span>
          ) : null}
          <span className="rounded-full bg-success-light px-2.5 py-1 text-xs font-semibold text-success">
            置信度 {Math.round(understanding.confidence * 100)}%
          </span>
        </div>
      </header>

      <div className="space-y-3 rounded-xl bg-surface p-4">
        <section>
          <p className="text-xs font-semibold uppercase tracking-wide text-foreground-tertiary">痛点</p>
          <p className="mt-1 text-sm text-foreground-secondary">{understanding.painPoint}</p>
        </section>
        <section>
          <p className="text-xs font-semibold uppercase tracking-wide text-foreground-tertiary">期望</p>
          <p className="mt-1 text-sm text-foreground-secondary">{understanding.expectation}</p>
        </section>
        <section>
          <p className="text-xs font-semibold uppercase tracking-wide text-foreground-tertiary">场景</p>
          <p className="mt-1 text-sm text-foreground-secondary">{understanding.scenario}</p>
        </section>
      </div>

      {isPlaceholder ? (
        <div className="rounded-lg bg-warning-lighter px-3 py-2 text-xs text-warning">
          当前为 AI 交互占位版本；接入真实 AI 后该页面将隐藏，提交后会直接进入状态追踪页。
        </div>
      ) : null}

      {submitError ? <div className="rounded-lg bg-error-light px-3 py-2 text-xs text-error">{submitError}</div> : null}

      <p className="text-xs text-foreground-tertiary">如果理解不准确，返回修改后可重新生成理解结果。</p>

      <div className="flex flex-col gap-3 sm:flex-row">
        <Button variant="secondary" fullWidth onClick={onBack} disabled={submitting}>
          需要修正
        </Button>
        <Button fullWidth onClick={onConfirm} disabled={submitting}>
          {submitting ? '提交中...' : confirmLabel}
        </Button>
      </div>
    </section>
  )
}
