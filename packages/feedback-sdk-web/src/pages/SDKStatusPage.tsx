import { useEffect, useRef, useState } from 'react'
import { FeedbackListStep } from '@/components/sdk/FeedbackListStep'
import { FeedbackConversationPanel } from '@/components/sdk/FeedbackConversationPanel'
import { FeedbackShell } from '@/components/sdk/FeedbackShell'
import type { FeedbackItem } from '@/lib/feedback/types'
import { fetchFeedbackItemsByApiKey, getOrPersistApiKey, getOrPersistCustomUserId, resolveProjectId } from '@/lib/feedback/api'
import { fetchFeedbackItemsV2, fetchFeedbackNotificationsV2 } from '@/lib/feedback/v2'
import {
  FEEDBACK_SDK_CONFIGURED_EVENT,
  getFeedbackSDKConfig,
  isFeedbackSDKV2Enabled,
  isFeedbackSDKV2NotificationsEnabled,
  notifyFeedbackSDKUnreadCount,
} from '@/lib/sdk'

export function SDKStatusPage() {
  const [items, setItems] = useState<FeedbackItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [unreadFeedbackIds, setUnreadFeedbackIds] = useState<Set<string>>(new Set())
  const [, setUnreadCount] = useState(0)
  const [retryCount, setRetryCount] = useState(0)
  const silentRefreshRef = useRef(false)

  useEffect(() => {
    const handleConfigured = () => {
      silentRefreshRef.current = false
      setRetryCount((prev) => prev + 1)
    }

    window.addEventListener(FEEDBACK_SDK_CONFIGURED_EVENT, handleConfigured)
    return () => {
      window.removeEventListener(FEEDBACK_SDK_CONFIGURED_EVENT, handleConfigured)
    }
  }, [])

  useEffect(() => {
    const refreshWhenVisible = () => {
      if (document.visibilityState !== 'visible') return
      silentRefreshRef.current = true
      setRetryCount((prev) => prev + 1)
    }

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') refreshWhenVisible()
    }

    window.addEventListener('focus', refreshWhenVisible)
    document.addEventListener('visibilitychange', handleVisibilityChange)
    const timer = window.setInterval(refreshWhenVisible, 30000)
    return () => {
      window.removeEventListener('focus', refreshWhenVisible)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.clearInterval(timer)
    }
  }, [])

  useEffect(() => {
    let canceled = false
    const silentRefresh = silentRefreshRef.current
    silentRefreshRef.current = false

    const load = async () => {
      if (!silentRefresh) {
        setLoading(true)
        setError('')
      }
      try {
        if (getFeedbackSDKConfig().feedbackV2Enabled === true) {
          const result = await fetchFeedbackItemsV2({ page: 1, pageSize: 20 })
          if (canceled) return
          setItems(result.items)
          if (isFeedbackSDKV2NotificationsEnabled()) {
            try {
              const notifications = await fetchFeedbackNotificationsV2({ unreadOnly: true, page: 1, pageSize: 100 })
              if (!canceled) {
                setUnreadFeedbackIds(new Set(notifications.notifications.map((item) => String(item.feedback_id))))
                setUnreadCount(notifications.unreadCount)
                notifyFeedbackSDKUnreadCount(notifications.unreadCount)
              }
            } catch {
              if (!canceled) {
                setUnreadFeedbackIds(new Set())
                setUnreadCount(0)
                notifyFeedbackSDKUnreadCount(0)
              }
            }
          } else {
            setUnreadFeedbackIds(new Set())
            setUnreadCount(0)
            notifyFeedbackSDKUnreadCount(0)
          }
          return
        }

        const apiKey = getOrPersistApiKey()
        if (!apiKey) {
          throw new Error('未检测到 API Key，请先通过 window.FeedbackSDK.configure({ apiKey }) 注入。')
        }

        const customUserId = getOrPersistCustomUserId()
        const projectId = await resolveProjectId(undefined, apiKey)
        const result = await fetchFeedbackItemsByApiKey({
          apiKey,
          projectId,
          customUserId,
          page: 1,
          pageSize: 20,
        })

        if (canceled) return
        setItems(result.items)
      } catch (err: any) {
        if (canceled) return
        if (!silentRefresh) {
          setError(err?.message || '状态加载失败，请稍后重试')
          setItems([])
        }
      } finally {
        if (!canceled && !silentRefresh) {
          setLoading(false)
        }
      }
    }

    load()

    return () => {
      canceled = true
    }
  }, [retryCount])

  const contentWrapClass = 'mx-auto w-full max-w-[980px]'
  const innerWrapClass = 'px-2 md:px-3'

  return (
    <div className="min-h-[100dvh] bg-surface px-4 py-6 md:px-6">
      <div className={contentWrapClass}>
        <FeedbackShell mode="embed">
          <div className={innerWrapClass}>
            {loading ? <p className="mb-3 text-sm text-foreground-secondary">正在加载反馈状态...</p> : null}
            {error ? (
              <div className="mb-3 rounded-lg bg-warning-lighter px-3 py-2 text-xs text-warning">
                {error}
                <button
                  type="button"
                  onClick={() => {
                    silentRefreshRef.current = false
                    setRetryCount((prev) => prev + 1)
                  }}
                  className="ml-3 font-semibold underline underline-offset-2"
                >
                  重试
                </button>
              </div>
            ) : null}
            <FeedbackListStep
              items={items}
              unreadItemIds={unreadFeedbackIds}
              renderConversation={isFeedbackSDKV2Enabled() ? (item) => (
                <FeedbackConversationPanel
                  feedbackId={item.id}
                  onNotificationsRead={(feedbackId, markedCount) => {
                    setUnreadFeedbackIds((current) => {
                      const next = new Set(current)
                      next.delete(feedbackId)
                      return next
                    })
                    setUnreadCount((current) => {
                      const next = Math.max(0, current - markedCount)
                      notifyFeedbackSDKUnreadCount(next)
                      return next
                    })
                  }}
                />
              ) : undefined}
            />
          </div>
        </FeedbackShell>
      </div>
    </div>
  )
}
