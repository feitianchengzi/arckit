import { useEffect, useState } from 'react'
import { BellIcon, MailIcon, XIcon } from '@/components/ui/icons'
import { showGlobalToast } from '@/components/ui/Toast'
import { feedbackV2Client, type FeedbackSubscription } from '@/lib/api/feedbackV2Client'
import { gatewayApi, type NotificationEmailPreference } from '@/lib/api/endpoints/gateway'

interface FeedbackSubscriptionMenuProps {
	projectId: number
}

const BUTTON_RESET_CLASS = 'appearance-none border-0 p-0 font-inherit text-inherit outline-none focus:outline-none focus-visible:outline-none'

function mergeClassName(...classes: Array<string | false | null | undefined>) {
	return classes.filter(Boolean).join(' ')
}

function maskEmail(value?: string): string {
	if (!value) return '尚未设置接收邮箱'
	const [local, domain] = value.split('@')
	if (!local || !domain) return '当前账号邮箱'
	return `${local.slice(0, 1)}***@${domain}`
}

function errorMessage(error: any, fallback: string): string {
	return error?.response?.data?.error?.message || error?.message || fallback
}

function Switch({ checked, disabled, label, onChange }: {
	checked: boolean
	disabled?: boolean
	label: string
	onChange: (checked: boolean) => void
}) {
	return (
		<button
			type="button"
			role="switch"
			aria-checked={checked}
			aria-label={label}
			disabled={disabled}
			onClick={() => onChange(!checked)}
			className={mergeClassName(
				BUTTON_RESET_CLASS,
				'relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors disabled:cursor-not-allowed disabled:opacity-45',
				checked ? 'bg-primary' : 'bg-surface-active',
			)}
		>
			<span className={mergeClassName(
				'inline-block h-4 w-4 rounded-full bg-white shadow-sm transition-transform',
				checked ? 'translate-x-6' : 'translate-x-1',
			)} />
		</button>
	)
}

export function FeedbackSubscriptionMenu({ projectId }: FeedbackSubscriptionMenuProps) {
	const [open, setOpen] = useState(false)
	const [subscription, setSubscription] = useState<FeedbackSubscription | null>(null)
	const [emailPreference, setEmailPreference] = useState<NotificationEmailPreference | null>(null)
	const [subscriptionLoading, setSubscriptionLoading] = useState(true)
	const [emailLoading, setEmailLoading] = useState(false)
	const [editingEmail, setEditingEmail] = useState(false)
	const [emailDraft, setEmailDraft] = useState('')
	const [verificationCode, setVerificationCode] = useState('')
	const [codeSent, setCodeSent] = useState(false)
	const [sendingCode, setSendingCode] = useState(false)
	const [savingEmail, setSavingEmail] = useState(false)
	const [deletingEmail, setDeletingEmail] = useState(false)
	const [saving, setSaving] = useState(false)
	const [error, setError] = useState('')

	useEffect(() => {
		let cancelled = false
		setOpen(false)
		setSubscription(null)
		setEmailPreference(null)
		setEmailLoading(false)
		setEditingEmail(false)
		setEmailDraft('')
		setVerificationCode('')
		setCodeSent(false)
		setError('')
		setSubscriptionLoading(true)
		feedbackV2Client.getSubscription(projectId).then((value) => {
			if (!cancelled) setSubscription(value)
		}).catch((loadError: any) => {
			if (!cancelled) setError(loadError?.message || '订阅设置加载失败')
		}).finally(() => {
			if (!cancelled) setSubscriptionLoading(false)
		})
		return () => {
			cancelled = true
		}
	}, [projectId])

	useEffect(() => {
		if (!open || emailPreference !== null) return
		let cancelled = false
		setEmailLoading(true)
		gatewayApi.getNotificationEmail().then((value) => {
			if (cancelled) return
			setEmailPreference(value)
			setEmailLoading(false)
		}).catch((loadError: any) => {
			if (cancelled) return
			setEmailPreference({ source: 'none', has_email: false })
			setError(errorMessage(loadError, '订阅邮箱读取失败'))
			setEmailLoading(false)
		})
		return () => {
			cancelled = true
		}
	}, [open, emailPreference])

	useEffect(() => {
		if (!open) return
		const closeOnEscape = (event: KeyboardEvent) => {
			if (event.key === 'Escape') setOpen(false)
		}
		window.addEventListener('keydown', closeOnEscape)
		return () => window.removeEventListener('keydown', closeOnEscape)
	}, [open])

	const save = async (next: FeedbackSubscription) => {
		if (saving) return
		if (next.email_enabled && emailPreference && !emailPreference.has_email) {
			showGlobalToast('请先设置订阅邮箱，或先为账号绑定邮箱', 'error', 3000)
			return
		}
		setSaving(true)
		setError('')
		try {
			const saved = await feedbackV2Client.updateSubscription({
				projectId,
				emailEnabled: next.email_enabled,
				notifyNewFeedback: next.notify_new_feedback,
				notifyCustomerReplies: next.notify_customer_replies,
			})
			setSubscription(saved)
			const emailChanged = subscription?.email_enabled !== saved.email_enabled
			showGlobalToast(emailChanged ? (saved.email_enabled ? '邮件订阅已开启' : '邮件订阅已关闭') : '订阅设置已更新', 'success', 1800)
		} catch (saveError: any) {
			setError(saveError?.message || '保存订阅设置失败')
		} finally {
			setSaving(false)
		}
	}

	const beginEmailEdit = () => {
		setEmailDraft(emailPreference?.custom_email || emailPreference?.effective_email || '')
		setVerificationCode('')
		setCodeSent(false)
		setEditingEmail(true)
		setError('')
	}

	const sendEmailCode = async () => {
		if (sendingCode || !emailDraft.trim()) return
		setSendingCode(true)
		setError('')
		try {
			await gatewayApi.sendNotificationEmailVerification(emailDraft.trim())
			setCodeSent(true)
			showGlobalToast('验证码已发送，请查收邮件', 'success', 2200)
		} catch (sendError: any) {
			setError(errorMessage(sendError, '验证码发送失败'))
		} finally {
			setSendingCode(false)
		}
	}

	const confirmEmail = async () => {
		if (savingEmail || !emailDraft.trim() || verificationCode.trim().length !== 6) return
		setSavingEmail(true)
		setError('')
		try {
			const saved = await gatewayApi.setNotificationEmail(emailDraft.trim(), verificationCode.trim())
			setEmailPreference(saved)
			setEditingEmail(false)
			setVerificationCode('')
			setCodeSent(false)
			showGlobalToast('订阅邮箱已更新', 'success', 1800)
		} catch (saveError: any) {
			setError(errorMessage(saveError, '订阅邮箱保存失败'))
		} finally {
			setSavingEmail(false)
		}
	}

	const restoreAccountEmail = async () => {
		if (deletingEmail) return
		setDeletingEmail(true)
		setError('')
		try {
			const saved = await gatewayApi.deleteNotificationEmail()
			setEmailPreference(saved)
			showGlobalToast(saved.has_email ? '已恢复使用账号邮箱' : '独立邮箱已清除，请设置可用邮箱', saved.has_email ? 'success' : 'error', 2200)
		} catch (deleteError: any) {
			setError(errorMessage(deleteError, '恢复账号邮箱失败'))
		} finally {
			setDeletingEmail(false)
		}
	}

	const subscribed = subscription?.email_enabled === true

	return (
		<>
			<button
				type="button"
				onClick={() => setOpen((current) => !current)}
				title={subscribed ? '反馈邮件已订阅' : '订阅反馈通知'}
				aria-label={subscribed ? '反馈邮件已订阅' : '订阅反馈通知'}
				aria-expanded={open}
				className={mergeClassName(
					BUTTON_RESET_CLASS,
					'relative inline-flex h-8 items-center gap-1.5 rounded-md px-2.5 text-xs font-semibold text-foreground-secondary hover:bg-surface-hover hover:text-foreground',
					open || subscribed ? 'bg-primary-lighter text-primary' : '',
				)}
			>
				<BellIcon className="h-4 w-4" />
				<span className="hidden sm:inline">{subscribed ? '已订阅' : '订阅'}</span>
				{subscribed ? <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-primary ring-2 ring-surface-elevated" /> : null}
			</button>

			{open ? (
				<>
					<button type="button" aria-label="关闭订阅设置" className="fixed inset-0 z-30 cursor-default" onClick={() => setOpen(false)} />
					<div className="fixed inset-x-3 bottom-[max(0.75rem,env(safe-area-inset-bottom))] z-40 max-h-[calc(100dvh-1.5rem)] w-auto overflow-y-auto rounded-2xl border border-divider bg-surface-elevated shadow-xl sm:absolute sm:bottom-auto sm:left-auto sm:right-3 sm:top-11 sm:max-h-[calc(100vh-4rem)] sm:w-[min(22rem,calc(100vw-2rem))] sm:rounded-xl">
						<div className="flex items-start justify-between border-b border-divider px-4 py-3.5">
							<div>
								<p className="text-sm font-semibold text-foreground">反馈通知</p>
								<p className="mt-0.5 text-xs text-foreground-secondary">只管理你在当前项目的订阅</p>
							</div>
							<button type="button" aria-label="关闭" onClick={() => setOpen(false)} className="grid h-7 w-7 place-items-center rounded-md text-foreground-tertiary hover:bg-surface-hover hover:text-foreground">
								<XIcon className="h-4 w-4" />
							</button>
						</div>

						{subscriptionLoading ? <div className="px-4 py-8 text-center text-sm text-foreground-secondary">正在读取订阅设置...</div> : null}
						{error ? <div className="mx-4 mt-3 rounded-lg bg-error-lighter px-3 py-2 text-xs text-error">{error}</div> : null}

						{subscription ? (
							<div className="space-y-4 px-4 py-4">
								<div className="flex items-center gap-3">
									<div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-primary-lighter text-primary"><MailIcon className="h-4 w-4" /></div>
									<div className="min-w-0 flex-1">
										<p className="text-sm font-medium text-foreground">邮件通知</p>
										<p className="truncate text-xs text-foreground-secondary">{emailLoading ? '正在读取接收邮箱...' : maskEmail(emailPreference?.effective_email)}</p>
									</div>
									<Switch
										checked={subscription.email_enabled}
										disabled={saving || emailLoading || emailPreference === null || (!emailPreference.has_email && !subscription.email_enabled)}
										label="邮件通知"
										onChange={(checked) => void save({ ...subscription, email_enabled: checked })}
									/>
								</div>

								<div className="rounded-lg border border-divider bg-surface px-3 py-3">
									{editingEmail ? (
										<div className="space-y-2.5">
											<div>
												<p className="text-xs font-semibold text-foreground">设置独立接收邮箱</p>
												<p className="mt-0.5 text-[11px] text-foreground-tertiary">验证后用于所有反馈订阅，不会修改账号邮箱。</p>
											</div>
											<div className="flex gap-2">
												<input
													type="email"
													value={emailDraft}
													onChange={(event) => {
														setEmailDraft(event.target.value)
														setCodeSent(false)
														setVerificationCode('')
													}}
													placeholder="name@example.com"
													className="min-w-0 flex-1 rounded-md border border-divider bg-surface-elevated px-2.5 py-2 text-xs text-foreground outline-none focus:border-primary"
												/>
												<button type="button" disabled={sendingCode || !emailDraft.trim()} onClick={() => void sendEmailCode()} className="shrink-0 rounded-md border border-divider px-2.5 text-xs font-medium text-foreground hover:bg-surface-hover disabled:opacity-45">
													{sendingCode ? '发送中' : codeSent ? '重新发送' : '发送验证码'}
												</button>
											</div>
											{codeSent ? (
												<input
													type="text"
													inputMode="numeric"
													maxLength={6}
													value={verificationCode}
													onChange={(event) => setVerificationCode(event.target.value.replace(/\D/g, '').slice(0, 6))}
													placeholder="输入 6 位验证码"
													className="w-full rounded-md border border-divider bg-surface-elevated px-2.5 py-2 text-xs text-foreground outline-none focus:border-primary"
												/>
											) : null}
											<div className="flex justify-end gap-2">
												<button type="button" onClick={() => setEditingEmail(false)} className="rounded-md px-2.5 py-1.5 text-xs text-foreground-secondary hover:bg-surface-hover">取消</button>
												<button type="button" disabled={!codeSent || verificationCode.length !== 6 || savingEmail} onClick={() => void confirmEmail()} className="rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-45">
													{savingEmail ? '保存中' : '验证并保存'}
												</button>
											</div>
										</div>
									) : (
										<div className="flex items-center justify-between gap-3">
											<div className="min-w-0">
												<p className="text-xs font-medium text-foreground">接收邮箱</p>
												<p className="mt-0.5 truncate text-[11px] text-foreground-tertiary">
													{emailPreference?.has_email ? `${maskEmail(emailPreference.effective_email)} · ${emailPreference.source === 'custom' ? '独立设置' : '账号邮箱'}` : '账号无邮箱，请单独设置'}
												</p>
											</div>
											<div className="flex shrink-0 items-center gap-1">
												{emailPreference?.source === 'custom' ? (
													<button type="button" disabled={deletingEmail} onClick={() => void restoreAccountEmail()} className="rounded-md px-2 py-1 text-[11px] text-foreground-secondary hover:bg-surface-hover disabled:opacity-45">恢复默认</button>
												) : null}
												<button type="button" onClick={beginEmailEdit} className="rounded-md px-2 py-1 text-[11px] font-semibold text-primary hover:bg-primary-lighter">{emailPreference?.has_email ? '修改' : '设置'}</button>
											</div>
										</div>
									)}
								</div>

								<div className="space-y-2 border-t border-divider pt-3">
									<p className="text-[11px] font-semibold uppercase tracking-wide text-foreground-tertiary">通知我</p>
									<label className="flex items-center gap-2 text-sm text-foreground">
										<input type="checkbox" checked={subscription.notify_new_feedback} disabled={saving || !subscription.email_enabled} onChange={(event) => void save({ ...subscription, notify_new_feedback: event.target.checked })} className="h-4 w-4 rounded border-divider text-primary" />
										收到一条新反馈
									</label>
									<label className="flex items-center gap-2 text-sm text-foreground">
										<input type="checkbox" checked={subscription.notify_customer_replies} disabled={saving || !subscription.email_enabled} onChange={(event) => void save({ ...subscription, notify_customer_replies: event.target.checked })} className="h-4 w-4 rounded border-divider text-primary" />
										用户补充回复
									</label>
								</div>

								<div className="flex items-center justify-between border-t border-divider pt-3 text-sm">
									<span className="text-foreground-secondary">手机通知</span>
									<span className="rounded-full bg-surface px-2 py-1 text-[11px] text-foreground-tertiary">即将支持</span>
								</div>

								{!subscription.delivery_available ? (
									<p className="rounded-lg bg-warning-lighter px-3 py-2 text-xs leading-5 text-warning">邮件通道尚未在服务端启用；你的选择会被保留，启用后对新消息生效。</p>
								) : null}
							</div>
						) : null}
					</div>
				</>
			) : null}
		</>
	)
}
