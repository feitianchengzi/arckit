import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import { FeedbackShell } from '@/components/sdk/FeedbackShell'
import { SDKTopBar } from '@/components/sdk/SDKTopBar'
import { sendVerificationCode, loginWithVerification, generateApiKey, verifyApiKey } from '@/lib/auth/authServerApi'
import { detectInputType } from '@/lib/auth/validators'
import { saveApiKeyToStorage } from '@/lib/feedback/api'

const COUNTDOWN_SECONDS = 60

function oneYearLaterISO() {
  const date = new Date()
  date.setFullYear(date.getFullYear() + 1)
  return date.toISOString()
}

export function SDKAuthDebugPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const mode = searchParams.get('mode') === 'full' ? 'full' : 'embed'
  const authLayoutMode: 'embed' = 'embed'

  const [target, setTarget] = useState('')
  const [code, setCode] = useState('')
  const [countdown, setCountdown] = useState(0)

  const [sendLoading, setSendLoading] = useState(false)
  const [loginLoading, setLoginLoading] = useState(false)
  const [keyLoading, setKeyLoading] = useState(false)
  const [verifyLoading, setVerifyLoading] = useState(false)

  const [statusMessage, setStatusMessage] = useState('')
  const [error, setError] = useState('')

  const [accessToken, setAccessToken] = useState('')
  const [refreshToken, setRefreshToken] = useState('')
  const [apiKey, setApiKey] = useState('')
  const [apiKeyName, setApiKeyName] = useState('feedback-sdk-component-debug')
  const [verifyResult, setVerifyResult] = useState('')

  const contentWrapClass = 'mx-auto w-full max-w-[980px]'
  const innerWrapClass = 'space-y-4 px-2 md:px-3'
  const formWrapClass = 'mx-auto w-full max-w-[760px]'

  useEffect(() => {
    const cachedToken = localStorage.getItem('sdk_debug_access_token') || ''
    const cachedRefreshToken = localStorage.getItem('sdk_debug_refresh_token') || ''
    const cachedApiKey = localStorage.getItem('sdk_debug_api_key') || localStorage.getItem('sdk_feedback_api_key') || ''
    setAccessToken(cachedToken)
    setRefreshToken(cachedRefreshToken)
    setApiKey(cachedApiKey)
  }, [])

  useEffect(() => {
    if (countdown <= 0) return
    const timer = setTimeout(() => setCountdown((prev) => prev - 1), 1000)
    return () => clearTimeout(timer)
  }, [countdown])

  const targetType = useMemo(() => detectInputType(target), [target])
  const canSendCode = !!target && !!targetType && countdown === 0 && !sendLoading
  const canLogin = !!target && !!targetType && code.length === 6 && !loginLoading

  const onModeChange = (nextMode: 'embed' | 'full') => {
    const next = new URLSearchParams(searchParams)
    next.set('mode', nextMode)
    setSearchParams(next, { replace: true })
  }

  const handleSendCode = async () => {
    if (!targetType) {
      setError('请输入有效的邮箱或手机号')
      return
    }
    setError('')
    setStatusMessage('')
    setSendLoading(true)
    try {
      await sendVerificationCode({ codeType: targetType, target: target.trim() })
      setStatusMessage('验证码已发送，请检查邮箱/短信。')
      setCountdown(COUNTDOWN_SECONDS)
    } catch (err: any) {
      setError(err?.message || '发送验证码失败')
    } finally {
      setSendLoading(false)
    }
  }

  const handleLogin = async () => {
    if (!targetType) {
      setError('请输入有效的邮箱或手机号')
      return
    }
    if (code.length !== 6) {
      setError('请输入 6 位验证码')
      return
    }

    setError('')
    setStatusMessage('')
    setLoginLoading(true)
    try {
      const result = await loginWithVerification({
        codeType: targetType,
        target: target.trim(),
        code: code.trim(),
      })
      const access = result.tokens?.access_token || ''
      const refresh = result.tokens?.refresh_token || ''

      if (!access) {
        throw new Error('登录成功但未返回 access_token')
      }

      setAccessToken(access)
      setRefreshToken(refresh)
      localStorage.setItem('sdk_debug_access_token', access)
      if (refresh) localStorage.setItem('sdk_debug_refresh_token', refresh)
      setStatusMessage('登录成功，已获取 access_token。')
    } catch (err: any) {
      setError(err?.message || '登录失败')
    } finally {
      setLoginLoading(false)
    }
  }

  const handleGenerateApiKey = async () => {
    if (!accessToken.trim()) {
      setError('请先登录获取 access_token')
      return
    }
    setError('')
    setStatusMessage('')
    setKeyLoading(true)
    try {
      const keyData = await generateApiKey({
        token: accessToken.trim(),
        name: apiKeyName.trim() || 'feedback-sdk-component-debug',
        expiresAt: oneYearLaterISO(),
      })

      if (!keyData.api_key) {
        throw new Error('创建成功但未返回 api_key')
      }

      setApiKey(keyData.api_key)
      localStorage.setItem('sdk_debug_api_key', keyData.api_key)
      saveApiKeyToStorage(keyData.api_key)
      setStatusMessage('API Key 创建成功并已保存到本地调试存储。')
    } catch (err: any) {
      setError(err?.message || '创建 API Key 失败')
    } finally {
      setKeyLoading(false)
    }
  }

  const handleVerifyApiKey = async () => {
    if (!apiKey.trim()) {
      setError('请先创建或粘贴 API Key')
      return
    }

    localStorage.setItem('sdk_debug_api_key', apiKey.trim())
    saveApiKeyToStorage(apiKey.trim())

    setError('')
    setStatusMessage('')
    setVerifyLoading(true)
    try {
      const data = await verifyApiKey(apiKey.trim())
      setVerifyResult(JSON.stringify(data, null, 2))
      setStatusMessage('API Key 验证成功（workshop/apikey/header-info）。')
    } catch (err: any) {
      setError(err?.message || '验证 API Key 失败')
    } finally {
      setVerifyLoading(false)
    }
  }

  return (
    <div className="min-h-[100dvh] bg-surface px-4 py-6 md:px-6">
      <SDKTopBar currentPage="auth" mode={mode} onModeChange={onModeChange} layoutMode={authLayoutMode} />

      <div className={contentWrapClass}>
        <FeedbackShell mode={authLayoutMode}>
          <div className={innerWrapClass}>
            <section className={formWrapClass}>
              <div className="space-y-5">
                <header>
                  <p className="text-xs font-semibold uppercase tracking-wide text-primary">Auth Debug</p>
                  <h2 className="mt-1 text-xl font-bold text-foreground">登录与 API Key 获取（调试入口）</h2>
                  <p className="mt-1 text-sm text-foreground-secondary">
                    逻辑参考 sameArchWebReference 登录页：输入邮箱/手机号，发送验证码并登录。登录成功后可一键创建 API Key。
                  </p>
                </header>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-foreground">邮箱/手机号</label>
                  <input
                    value={target}
                    onChange={(e) => setTarget(e.target.value)}
                    placeholder="输入邮箱或手机号"
                    className="w-full rounded-xl border border-border bg-surface px-3 py-3 text-sm text-foreground placeholder:text-foreground-tertiary"
                  />
                  <p className="text-xs text-foreground-tertiary">
                    当前识别：{target ? (targetType === 'email' ? '邮箱' : targetType === 'sms' ? '手机号' : '无效格式') : '未输入'}
                  </p>
                </div>

                <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
                  <input
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="6位验证码"
                    className="w-full rounded-xl border border-border bg-surface px-3 py-3 text-sm text-foreground placeholder:text-foreground-tertiary"
                  />
                  <Button onClick={handleSendCode} disabled={!canSendCode} loading={sendLoading}>
                    {countdown > 0 ? `${countdown}s` : '发送验证码'}
                  </Button>
                </div>

                <Button fullWidth onClick={handleLogin} disabled={!canLogin} loading={loginLoading}>
                  登录并获取 Token
                </Button>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-foreground">Access Token（登录后展示）</label>
                  <textarea
                    value={accessToken}
                    readOnly
                    rows={4}
                    className="w-full rounded-xl border border-border bg-surface px-3 py-3 text-xs text-foreground"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-foreground">Refresh Token（可选）</label>
                  <textarea
                    value={refreshToken}
                    readOnly
                    rows={3}
                    className="w-full rounded-xl border border-border bg-surface px-3 py-3 text-xs text-foreground"
                  />
                </div>

                <div className="rounded-xl bg-surface p-4 space-y-3">
                  <h3 className="text-sm font-semibold text-foreground">创建 API Key（储备）</h3>
                  <input
                    value={apiKeyName}
                    onChange={(e) => setApiKeyName(e.target.value)}
                    placeholder="API Key 名称"
                    className="w-full rounded-lg border border-border bg-surface-elevated px-3 py-2 text-sm text-foreground"
                  />
                  <Button fullWidth onClick={handleGenerateApiKey} disabled={!accessToken.trim()} loading={keyLoading}>
                    创建 API Key
                  </Button>

                  <label className="text-sm font-semibold text-foreground">API Key（仅创建时返回明文）</label>
                  <textarea
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    rows={3}
                    className="w-full rounded-xl border border-border bg-surface-elevated px-3 py-3 text-xs text-foreground"
                  />

                  <Button variant="secondary" fullWidth onClick={handleVerifyApiKey} loading={verifyLoading}>
                    验证 API Key（/workshop/v1/apikey/header-info）
                  </Button>

                  {verifyResult ? (
                    <pre className="scrollbar-slim max-h-52 overflow-y-auto rounded-lg bg-surface-elevated p-3 text-xs text-foreground-secondary">
                      {verifyResult}
                    </pre>
                  ) : null}
                </div>

                {statusMessage ? <p className="text-sm text-success">{statusMessage}</p> : null}
                {error ? <p className="text-sm text-error">{error}</p> : null}
              </div>
            </section>
          </div>
        </FeedbackShell>
      </div>
    </div>
  )
}
