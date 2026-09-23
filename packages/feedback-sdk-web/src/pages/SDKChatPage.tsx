import { useMemo } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { FeedbackShell } from '@/components/sdk/FeedbackShell'
import { AgentChatPanel } from '@/components/sdk/AgentChatPanel'
import { t } from '@/i18n'

/**
 * 提交反馈后的智能客服会话页。
 * 反馈内容会自动作为首条消息发给智能客服（基于代码库大模型推理），
 * 客户可在对话窗口继续追问，也可在“我的反馈”中查看进展。
 */
export function SDKChatPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const feedbackId = useMemo(() => (searchParams.get('feedback') || '').trim(), [searchParams])
  const initialMessage = useMemo(() => (searchParams.get('q') || '').trim(), [searchParams])

  return (
    <div className="min-h-[100dvh] bg-surface px-4 py-6 md:px-6">
      <div className="mx-auto w-full max-w-[980px]">
        <FeedbackShell mode="embed">
          <div className="px-2 md:px-3">
            <div className="mx-auto w-full max-w-[760px] space-y-4">
              <header>
                <p className="text-xs font-semibold uppercase tracking-wide text-primary">{t('chat.header_tag')}</p>
                <h2 className="mt-1 text-lg font-bold text-foreground">{t('chat.title')}</h2>
                <p className="mt-1 text-sm text-foreground-secondary">
                  {t('chat.subtitle')}
                </p>
              </header>

              {feedbackId && Number.isFinite(Number(feedbackId)) && Number(feedbackId) > 0 ? (
                <AgentChatPanel
                  feedbackId={feedbackId}
                  initialMessage={initialMessage || undefined}
                />
              ) : (
                <div className="rounded-lg border border-divider bg-surface p-4 text-sm text-foreground-secondary">
                  {t('chat.invalid')}
                </div>
              )}

              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => navigate({ pathname: '/submit', search: window.location.search })}
                  className="text-xs font-semibold text-primary hover:text-primary-hover"
                >
                  {t('chat.submit_another')}
                </button>
                <button
                  type="button"
                  onClick={() => navigate({ pathname: '/status', search: window.location.search })}
                  className="text-xs font-semibold text-primary hover:text-primary-hover"
                >
                  {t('chat.view_mine')}
                </button>
              </div>
            </div>
          </div>
        </FeedbackShell>
      </div>
    </div>
  )
}
