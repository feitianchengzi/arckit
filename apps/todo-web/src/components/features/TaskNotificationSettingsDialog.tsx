import { useEffect, useMemo, useState } from 'react'
import { Button, Dialog, LoadingView, MailIcon } from '@/components/ui'
import { showGlobalToast } from '@/components/ui/Toast'
import {
  taskNotificationsApi,
  type TaskNotificationPreference,
  type UpdateTaskNotificationPreference,
} from '@/lib/api/endpoints/taskNotifications'
import {
  gatewayApi,
  type NotificationEmailPreference,
} from '@/lib/api/endpoints/gateway'
import clsx from 'clsx'

interface TaskNotificationSettingsDialogProps {
  open: boolean
  onClose: () => void
  projectId: number
  projectName: string
}

const DEFAULT_PREFERENCE: TaskNotificationPreference = {
  project_id: 0,
  email_enabled: false,
  notify_assigned_to_me: true,
  notify_assignee_changed: true,
  notify_task_created: false,
  notify_status_changed: false,
  notify_priority_changed: false,
  notify_content_changed: false,
  notify_tags_changed: false,
  delivery_available: false,
}

const EVENT_OPTIONS: Array<{
  key: keyof UpdateTaskNotificationPreference
  title: string
  description: string
  recommended?: boolean
}> = [
  {
    key: 'notify_assigned_to_me',
    title: '指派给我',
    description: '当你成为待办执行人时通知你',
    recommended: true,
  },
  {
    key: 'notify_assignee_changed',
    title: '执行人变更',
    description: '待办的执行人被更换或清空时通知你',
    recommended: true,
  },
  {
    key: 'notify_task_created',
    title: '创建待办',
    description: '项目内新增待办时通知你',
  },
  {
    key: 'notify_status_changed',
    title: '状态变更',
    description: '待办进入新状态时通知你',
  },
  {
    key: 'notify_priority_changed',
    title: '优先级变更',
    description: '待办优先级调整时通知你',
  },
  {
    key: 'notify_content_changed',
    title: '内容变更',
    description: '标题或正文更新时通知你',
  },
  {
    key: 'notify_tags_changed',
    title: '标签变更',
    description: '待办标签调整时通知你',
  },
]

const getErrorMessage = (error: unknown, fallback: string) => {
  const value = error as any
  return value?.response?.data?.error?.message || value?.message || fallback
}

const maskEmail = (value?: string) => {
  if (!value) return '尚未设置可接收通知的邮箱'
  const [local, domain] = value.split('@')
  if (!local || !domain) return '当前账号邮箱'
  return `${local.slice(0, 1)}***@${domain}`
}

function PreferenceSwitch({
  checked,
  onChange,
  label,
  disabled = false,
}: {
  checked: boolean
  onChange: (checked: boolean) => void
  label: string
  disabled?: boolean
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={clsx(
        'relative h-6 w-11 shrink-0 rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
        checked ? 'bg-primary' : 'bg-border',
        disabled && 'cursor-not-allowed opacity-50'
      )}
    >
      <span
        className={clsx(
          'absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform',
          checked && 'translate-x-5'
        )}
      />
    </button>
  )
}

export function TaskNotificationSettingsDialog({
  open,
  onClose,
  projectId,
  projectName,
}: TaskNotificationSettingsDialogProps) {
  const [preference, setPreference] = useState<TaskNotificationPreference>(DEFAULT_PREFERENCE)
  const [notificationEmail, setNotificationEmail] = useState<NotificationEmailPreference | null>(null)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [editingEmail, setEditingEmail] = useState(false)
  const [emailInput, setEmailInput] = useState('')
  const [verificationCode, setVerificationCode] = useState('')
  const [verificationSent, setVerificationSent] = useState(false)
  const [emailBusy, setEmailBusy] = useState(false)

  useEffect(() => {
    if (!open || !Number.isFinite(projectId) || projectId <= 0) return
    let cancelled = false
    setPreference({ ...DEFAULT_PREFERENCE, project_id: projectId })
    setNotificationEmail(null)
    setLoading(true)
    setError('')
    setEditingEmail(false)
    setVerificationSent(false)
    setVerificationCode('')
    Promise.allSettled([
      taskNotificationsApi.getPreference(projectId),
      gatewayApi.getNotificationEmail(),
    ])
      .then(([preferenceResult, emailResult]) => {
        if (cancelled) return

        const errors: string[] = []
        if (preferenceResult.status === 'fulfilled') {
          setPreference(preferenceResult.value)
        } else {
          errors.push(getErrorMessage(preferenceResult.reason, '无法加载待办通知设置'))
        }
        if (emailResult.status === 'fulfilled') {
          setNotificationEmail(emailResult.value)
          setEmailInput(emailResult.value.custom_email || '')
        } else {
          errors.push(getErrorMessage(emailResult.reason, '无法读取通知邮箱'))
        }
        if (errors.length > 0) setError(errors.join('；'))
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [open, projectId])

  const selectedCount = useMemo(
    () => EVENT_OPTIONS.filter(({ key }) => preference[key] === true).length,
    [preference]
  )

  const updateSwitch = (key: keyof UpdateTaskNotificationPreference, checked: boolean) => {
    setPreference((current) => ({ ...current, [key]: checked }))
    setError('')
  }

  const handleSave = async () => {
    if (preference.email_enabled && !notificationEmail?.has_email) {
      setError('请先设置一个可接收通知的邮箱。')
      setEditingEmail(true)
      return
    }
    setSaving(true)
    setError('')
    try {
      const saved = await taskNotificationsApi.updatePreference(projectId, {
        email_enabled: preference.email_enabled,
        notify_assigned_to_me: preference.notify_assigned_to_me,
        notify_assignee_changed: preference.notify_assignee_changed,
        notify_task_created: preference.notify_task_created,
        notify_status_changed: preference.notify_status_changed,
        notify_priority_changed: preference.notify_priority_changed,
        notify_content_changed: preference.notify_content_changed,
        notify_tags_changed: preference.notify_tags_changed,
      })
      setPreference(saved)
      showGlobalToast('待办通知设置已保存', 'success', 2000)
      onClose()
    } catch (saveError) {
      setError(getErrorMessage(saveError, '保存待办通知设置失败'))
    } finally {
      setSaving(false)
    }
  }

  const handleSendVerification = async () => {
    const email = emailInput.trim()
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      setError('请输入有效的邮箱地址。')
      return
    }
    setEmailBusy(true)
    setError('')
    try {
      await gatewayApi.sendNotificationEmailVerification(email)
      setVerificationSent(true)
      showGlobalToast('验证码已发送，请检查邮箱', 'success', 2500)
    } catch (sendError) {
      setError(getErrorMessage(sendError, '验证码发送失败'))
    } finally {
      setEmailBusy(false)
    }
  }

  const handleConfirmEmail = async () => {
    if (verificationCode.trim().length !== 6) {
      setError('请输入 6 位邮箱验证码。')
      return
    }
    setEmailBusy(true)
    setError('')
    try {
      const saved = await gatewayApi.setNotificationEmail(emailInput.trim(), verificationCode.trim())
      setNotificationEmail(saved)
      setEditingEmail(false)
      setVerificationSent(false)
      setVerificationCode('')
      showGlobalToast('通知邮箱已更新', 'success', 2000)
    } catch (confirmError) {
      setError(getErrorMessage(confirmError, '通知邮箱验证失败'))
    } finally {
      setEmailBusy(false)
    }
  }

  const handleRestoreAccountEmail = async () => {
    setEmailBusy(true)
    setError('')
    try {
      const saved = await gatewayApi.deleteNotificationEmail()
      setNotificationEmail(saved)
      setEmailInput('')
      setEditingEmail(false)
      setVerificationSent(false)
      showGlobalToast('已恢复使用账号邮箱', 'success', 2000)
    } catch (deleteError) {
      setError(getErrorMessage(deleteError, '恢复账号邮箱失败'))
    } finally {
      setEmailBusy(false)
    }
  }

  return (
    <Dialog
      open={open}
      onClose={saving || emailBusy ? () => undefined : onClose}
      title="待办通知"
      description={`设置「${projectName}」中需要通过邮件提醒你的变化`}
      maxWidth="lg"
      bodyClassName="max-h-[min(72vh,720px)] overflow-y-auto px-0 py-0"
    >
      {loading ? (
        <LoadingView size="md" text="加载通知设置..." />
      ) : (
        <div>
          <section className="border-b border-divider px-5 py-5 sm:px-6">
            <div className="flex items-start justify-between gap-4">
              <div className="flex min-w-0 gap-3">
                <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary-lighter text-primary">
                  <MailIcon className="h-4 w-4" />
                </span>
                <div className="min-w-0">
                  <div className="font-medium text-foreground">邮件通知</div>
                  <p className="mt-1 text-sm leading-5 text-foreground-secondary">
                    {notificationEmail?.has_email
                      ? `发送至 ${maskEmail(notificationEmail.effective_email)} · ${notificationEmail.source === 'custom' ? '独立设置' : '账号邮箱'}`
                      : '尚未设置可接收通知的邮箱'}
                  </p>
                </div>
              </div>
              <PreferenceSwitch
                checked={preference.email_enabled}
                onChange={(checked) => updateSwitch('email_enabled', checked)}
                label="邮件通知"
              />
            </div>

            {!preference.delivery_available && (
              <div className="mt-4 rounded-lg border border-warning-light bg-warning-lighter px-3.5 py-3 text-sm text-warning">
                当前环境尚未接通邮件投递服务；设置仍可保存，通道启用后会自动生效。
              </div>
            )}

            <div className="mt-4 flex flex-wrap items-center gap-2 pl-0 sm:pl-12">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => {
                  setEditingEmail((current) => !current)
                  setVerificationSent(false)
                  setVerificationCode('')
                  setError('')
                }}
              >
                {notificationEmail?.has_email ? '更换收件邮箱' : '设置收件邮箱'}
              </Button>
              {notificationEmail?.source === 'custom' && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  disabled={emailBusy}
                  onClick={handleRestoreAccountEmail}
                >
                  恢复账号邮箱
                </Button>
              )}
            </div>

            {editingEmail && (
              <div className="mt-4 space-y-3 rounded-lg border border-border bg-surface p-4 sm:ml-12">
                <label className="block text-sm font-medium text-foreground" htmlFor="task-notification-email">
                  独立通知邮箱
                </label>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <input
                    id="task-notification-email"
                    type="email"
                    value={emailInput}
                    disabled={emailBusy || verificationSent}
                    onChange={(event) => setEmailInput(event.target.value)}
                    placeholder="name@example.com"
                    className="h-9 min-w-0 flex-1 rounded-md border border-border bg-surface-elevated px-3 text-sm text-foreground outline-none placeholder:text-foreground-tertiary focus:border-primary focus:ring-1 focus:ring-primary"
                  />
                  {!verificationSent && (
                    <Button type="button" size="sm" loading={emailBusy} onClick={handleSendVerification}>
                      发送验证码
                    </Button>
                  )}
                </div>
                {verificationSent && (
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <input
                      type="text"
                      inputMode="numeric"
                      maxLength={6}
                      value={verificationCode}
                      disabled={emailBusy}
                      onChange={(event) => setVerificationCode(event.target.value.replace(/\D/g, '').slice(0, 6))}
                      placeholder="输入 6 位邮箱验证码"
                      className="h-9 min-w-0 flex-1 rounded-md border border-border bg-surface-elevated px-3 text-sm text-foreground outline-none placeholder:text-foreground-tertiary focus:border-primary focus:ring-1 focus:ring-primary"
                    />
                    <Button
                      type="button"
                      size="sm"
                      loading={emailBusy}
                      disabled={verificationCode.length !== 6}
                      onClick={handleConfirmEmail}
                    >
                      验证并使用
                    </Button>
                    <Button type="button" variant="secondary" size="sm" disabled={emailBusy} onClick={handleSendVerification}>
                      重新发送
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      disabled={emailBusy}
                      onClick={() => {
                        setVerificationSent(false)
                        setVerificationCode('')
                      }}
                    >
                      修改邮箱
                    </Button>
                  </div>
                )}
                <p className="text-xs leading-5 text-foreground-tertiary">
                  验证后优先于账号邮箱，并用于你在所有项目中的事务提醒。
                </p>
              </div>
            )}
          </section>

          <section className="px-5 py-5 sm:px-6">
            <div className="flex items-end justify-between gap-4">
              <div>
                <h3 className="font-medium text-foreground">通知范围</h3>
                <p className="mt-1 text-sm text-foreground-secondary">只选择真正需要及时知道的变化</p>
              </div>
              <span className="shrink-0 text-xs text-foreground-tertiary">已选 {selectedCount} 项</span>
            </div>
            <div className="mt-4 overflow-hidden rounded-lg border border-border">
              {EVENT_OPTIONS.map((option, index) => (
                <label
                  key={option.key}
                  className={clsx(
                    'flex cursor-pointer items-center gap-3 px-4 py-3.5 transition-colors hover:bg-surface-hover',
                    index > 0 && 'border-t border-divider'
                  )}
                >
                  <input
                    type="checkbox"
                    checked={preference[option.key]}
                    onChange={(event) => updateSwitch(option.key, event.target.checked)}
                    className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
                  />
                  <span className="min-w-0 flex-1">
                    <span className="flex flex-wrap items-center gap-2 text-sm font-medium text-foreground">
                      {option.title}
                      {option.recommended && (
                        <span className="rounded bg-primary-lighter px-1.5 py-0.5 text-[10px] font-semibold text-primary">
                          默认
                        </span>
                      )}
                    </span>
                    <span className="mt-0.5 block text-xs leading-5 text-foreground-secondary">
                      {option.description}
                    </span>
                  </span>
                </label>
              ))}
            </div>
            <p className="mt-3 text-xs leading-5 text-foreground-tertiary">
              同一次修改命中多个范围时会合并为一封邮件；你自己的操作不会给自己发信。
            </p>
          </section>

          {error && (
            <div className="mx-5 mb-4 rounded-lg border border-error-light bg-error-lighter px-3.5 py-3 text-sm text-error sm:mx-6">
              {error}
            </div>
          )}

          <footer className="sticky bottom-0 flex justify-end gap-2 border-t border-divider bg-surface-elevated px-5 py-4 sm:px-6">
            <Button type="button" variant="secondary" onClick={onClose} disabled={saving || emailBusy}>
              取消
            </Button>
            <Button type="button" onClick={handleSave} loading={saving} disabled={emailBusy}>
              保存设置
            </Button>
          </footer>
        </div>
      )}
    </Dialog>
  )
}
