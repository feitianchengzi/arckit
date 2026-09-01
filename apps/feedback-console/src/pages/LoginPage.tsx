
/**
 * 登录页面 - 验证码登录
 */

import { useState, useEffect, Suspense } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import { TextField } from '@/components/ui/TextField'
import { VerificationCodeInput } from '@/components/ui/VerificationCodeInput'
import { useSendVerificationCode, useLogin } from '@/hooks/useAuth'
import { useAuthStore } from '@/store/authStore'
import { normalizeInAppPath } from '@/lib/router/base'
import { detectInputType } from '@/lib/utils/validators'
import type { CodeType, LoginRequest } from '@/types/auth'

function LoginPageContent() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  // 表单状态
  const [username, setUsername] = useState('')
  const [verificationCode, setVerificationCode] = useState('')
  const [codeType, setCodeType] = useState<CodeType | null>(null)
  const [error, setError] = useState('')

  // Hooks
  const sendCode = useSendVerificationCode()
  const login = useLogin()
  const { checkAuth, user } = useAuthStore()

  // 检查是否已登录（只在客户端执行）
  useEffect(() => {
    // 只在客户端执行，避免 SSR 问题
    if (typeof window === 'undefined') return
    
    // 延迟检查，等待 auth store 初始化完成
    const timer = setTimeout(() => {
      const hasAuth = checkAuth()
      if (hasAuth && user) {
        const redirect = normalizeInAppPath(searchParams.get('redirect'), '/feedbacks')
        navigate(redirect, { replace: true })
      }
    }, 100)
    
    return () => clearTimeout(timer)
  }, [checkAuth, user, navigate, searchParams])

  // 发送验证码
  const handleSendCode = async () => {
    setError('')

    // 验证用户名
    const type = detectInputType(username)
    if (!type) {
      setError('请输入有效的邮箱或手机号')
      throw new Error('Invalid username')
    }

    setCodeType(type)

    // 调用发送接口
    try {
      await sendCode.mutateAsync({
        code_type: type,
        target: username,
        purpose: 'login',
      })
    } catch (err: any) {
      setError(err.message || '发送失败，请重试')
      throw err
    }
  }

  // 登录
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    // 验证
    if (!username) {
      setError('请输入邮箱或手机号')
      return
    }

    if (!verificationCode || verificationCode.length !== 6) {
      setError('请输入6位验证码')
      return
    }

    const type = codeType || detectInputType(username)
    if (!type) {
      setError('用户名格式不正确')
      return
    }

    // 构建登录请求
    const loginData: LoginRequest = type === 'email'
      ? {
          email: username,
          code: verificationCode,
          code_type: 'email',
          purpose: 'login',
        }
      : {
          phone: username,
          code: verificationCode,
          code_type: 'sms',
          purpose: 'login',
        }

    try {
      await login.mutateAsync(loginData)
      // 导航逻辑已在 useLogin 中处理
    } catch (err: any) {
      const message = err.response?.data?.message || err.message || '登录失败'
      setError(message)
    }
  }

  // 实时验证用户名格式
  const getUsernameError = () => {
    if (!username) return ''
    const type = detectInputType(username)
    if (!type) return '请输入有效的邮箱或手机号'
    return ''
  }

  const usernameError = getUsernameError()
  const isSendCodeDisabled = !username || !!usernameError

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo 和标题 */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-foreground">反馈管理后台</h1>
          <p className="mt-2 text-foreground-secondary">使用验证码快速登录</p>
        </div>

        {/* 登录表单 */}
        <div className="bg-surface-elevated rounded-lg shadow-lg p-8 border border-border">
          <form onSubmit={handleLogin} className="space-y-6">
            {/* 用户名（邮箱/手机号） */}
            <TextField
              id="username"
              label="邮箱/手机号"
              placeholder="请输入邮箱或手机号"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              fullWidth
              required
              autoComplete="username"
              helperText="支持邮箱和手机号登录"
              error={usernameError}
            />

            {/* 验证码 */}
            <VerificationCodeInput
              value={verificationCode}
              onChange={setVerificationCode}
              onSendCode={handleSendCode}
              sendButtonDisabled={isSendCodeDisabled}
              error={error && error.includes('验证码') ? error : ''}
            />

            {/* 全局错误提示 */}
            {error && !error.includes('验证码') && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-3">
                <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
              </div>
            )}

            {/* 登录按钮 */}
            <Button
              type="submit"
              variant="primary"
              size="lg"
              fullWidth
              loading={login.isPending}
              disabled={!username || !verificationCode || login.isPending}
            >
              {login.isPending ? '登录中...' : '立即登录'}
            </Button>
          </form>

          {/* 提示信息 */}
          <div className="mt-6 text-center">
            <p className="text-sm text-foreground-tertiary">
              💡 新用户将自动创建账户
            </p>
          </div>
        </div>

      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">加载中...</div>}>
      <LoginPageContent />
    </Suspense>
  )
}
