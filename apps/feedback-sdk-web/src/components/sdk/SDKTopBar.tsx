import clsx from 'clsx'
import { Link } from 'react-router-dom'

interface Props {
  currentPage: 'submit' | 'status' | 'auth'
  mode: 'embed' | 'full'
  onModeChange: (mode: 'embed' | 'full') => void
  layoutMode?: 'embed' | 'full'
}

export function SDKTopBar({ currentPage, mode, onModeChange, layoutMode }: Props) {
  const submitHref = `/sdk-demo/submit?mode=${mode}`
  const statusHref = `/sdk-demo/status?mode=${mode}`
  const authHref = `/sdk-demo/auth?mode=${mode}`
  const widthMode = layoutMode ?? mode

  return (
    <div
      className={clsx(
        'mx-auto mb-4 flex w-full flex-wrap items-center justify-between gap-3',
        widthMode === 'full' ? 'max-w-[1160px]' : 'max-w-[980px]',
      )}
    >
      <div className="min-w-[240px]">
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-primary">Feedbacks / SDK UI</p>
        <h1 className="mt-1 text-2xl font-bold text-foreground">反馈组件设计稿实现</h1>
        <p className="mt-1 text-sm text-foreground-secondary">提交反馈与状态追踪拆分为独立页面，移动端可直接 WebView 全屏加载。</p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="inline-flex rounded-lg border border-border bg-surface-elevated p-1">
          <Link
            to={submitHref}
            className={clsx(
              'rounded-md px-3 py-1.5 text-sm font-medium',
              currentPage === 'submit' ? 'bg-primary text-white' : 'text-foreground-secondary',
            )}
          >
            提交反馈
          </Link>
          <Link
            to={statusHref}
            className={clsx(
              'rounded-md px-3 py-1.5 text-sm font-medium',
              currentPage === 'status' ? 'bg-primary text-white' : 'text-foreground-secondary',
            )}
          >
            状态追踪
          </Link>
          <Link
            to={authHref}
            className={clsx(
              'rounded-md px-3 py-1.5 text-sm font-medium',
              currentPage === 'auth' ? 'bg-primary text-white' : 'text-foreground-secondary',
            )}
          >
            登录调试
          </Link>
        </div>

        <div className="inline-flex rounded-lg border border-border bg-surface-elevated p-1">
          <button
            className={clsx('rounded-md px-3 py-1.5 text-sm font-medium', mode === 'embed' ? 'bg-primary text-white' : 'text-foreground-secondary')}
            onClick={() => onModeChange('embed')}
            type="button"
          >
            嵌入模式
          </button>
          <button
            className={clsx('rounded-md px-3 py-1.5 text-sm font-medium', mode === 'full' ? 'bg-primary text-white' : 'text-foreground-secondary')}
            onClick={() => onModeChange('full')}
            type="button"
          >
            全屏模式
          </button>
        </div>
      </div>
    </div>
  )
}
