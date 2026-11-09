import { MouseEvent as ReactMouseEvent, ReactNode, useEffect, useRef } from 'react'
import clsx from 'clsx'
import { t } from '@/i18n'

interface Props {
  mode: 'embed' | 'full'
  children: ReactNode
}

export function FeedbackShell({ mode, children }: Props) {
  const shellRef = useRef<HTMLDivElement>(null)
  const isFull = mode === 'full'
  const isEmbedded = typeof window !== 'undefined'
    && window.parent !== window
    && document.documentElement.dataset.feedbackEmbed === 'web'

  useEffect(() => {
    if (!isEmbedded) return

    // The embedded SDK owns the whole iframe viewport. Pointer events outside
    // the dialog are deliberately inert: only the explicit close button may
    // ask the host to dismiss the SDK layer.
    const consumeOutsideShell = (event: Event) => {
      const target = event.target
      if (!(target instanceof Node) || shellRef.current?.contains(target)) return
      event.preventDefault()
      event.stopImmediatePropagation()
    }

    document.addEventListener('pointerdown', consumeOutsideShell, true)
    document.addEventListener('click', consumeOutsideShell, true)
    return () => {
      document.removeEventListener('pointerdown', consumeOutsideShell, true)
      document.removeEventListener('click', consumeOutsideShell, true)
    }
  }, [isEmbedded])

  const closeEmbeddedSdk = (event: ReactMouseEvent<HTMLButtonElement>) => {
    event.preventDefault()
    event.stopPropagation()
    window.parent.postMessage({ source: 'feedback-sdk-web', type: 'feedback-sdk:close' }, '*')
  }

  return (
    <div
      ref={shellRef}
      data-feedback-sdk-shell
      className={clsx(
        'relative mx-auto w-full transition-all',
        mode === 'embed' && 'max-w-[640px] rounded-2xl border border-border bg-surface-elevated shadow-lg',
        mode === 'full' && 'max-w-[1120px] rounded-2xl border border-border bg-surface-elevated shadow-lg',
      )}
      style={{
        paddingTop: isFull ? 'max(14px, env(safe-area-inset-top))' : 'max(16px, env(safe-area-inset-top))',
        paddingRight: isFull ? 'max(14px, env(safe-area-inset-right))' : 'max(16px, env(safe-area-inset-right))',
        paddingBottom: isFull ? 'max(14px, env(safe-area-inset-bottom))' : 'max(16px, env(safe-area-inset-bottom))',
        paddingLeft: isFull ? 'max(14px, env(safe-area-inset-left))' : 'max(16px, env(safe-area-inset-left))',
      }}
    >
      {isEmbedded ? (
        <button
          type="button"
          onClick={closeEmbeddedSdk}
          className="absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-surface-elevated text-2xl leading-7 text-foreground-secondary transition-colors hover:bg-surface-hover hover:text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          aria-label={t('shell.close')}
          title={t('shell.close')}
        >
          ×
        </button>
      ) : null}
      {children}
    </div>
  )
}
