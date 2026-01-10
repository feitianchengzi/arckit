'use client'

/**
 * 登录页面
 */

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button, TextField } from '@/components/ui'
import { useLogin } from '@/hooks/useAuth'

export default function LoginPage() {
  const router = useRouter()
  const login = useLogin()
  
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [redirect, setRedirect] = useState('/projects')
  
  // 从 URL 获取 redirect 参数
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      const redirectParam = params.get('redirect')
      if (redirectParam) {
        setRedirect(redirectParam)
      }
    }
  }, [])
  
  // 检查组件是否正常加载
  useEffect(() => {
    console.log('=== 登录页面组件已加载 ===')
    console.log('login hook:', login)
    console.log('login.isPending:', login.isPending)
  }, [login])
  
  // 添加按钮点击测试
  const handleButtonClick = (e: React.MouseEvent) => {
    console.log('按钮被点击了!', e)
  }
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    e.stopPropagation()
    console.log('=== 登录表单提交开始 ===')
    console.log('登录表单提交:', { username, password })
    setError('')
    
    // 验证
    if (!username || !password) {
      console.log('验证失败: 用户名或密码为空')
      setError('请输入用户名和密码')
      return
    }
    
    if (password.length < 6) {
      console.log('验证失败: 密码长度不足')
      setError('密码长度不能少于 6 位')
      return
    }
    
    console.log('开始登录...')
    console.log('login 对象:', login)
    console.log('redirect:', redirect)
    // 登录
    try {
      console.log('调用 login.mutateAsync...')
      const result = await login.mutateAsync({ username, password, redirect })
      console.log('登录成功:', result)
      // 登录成功后会通过 onSuccess 回调跳转，这里不需要额外操作
    } catch (err: any) {
      // 处理登录错误
      console.error('登录错误:', err)
      console.error('错误详情:', JSON.stringify(err, null, 2))
      const errorMessage = err?.response?.data?.message || err?.message || '登录失败，请重试'
      setError(errorMessage)
    }
  }
  
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo 和标题 */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">待办管理系统</h1>
          <p className="mt-2 text-gray-600">登录到你的账户</p>
        </div>
        
        {/* 登录表单 */}
        <div className="bg-white rounded-lg shadow-lg p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* 用户名 */}
            <TextField
              id="username"
              label="用户名"
              placeholder="请输入用户名"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              fullWidth
              required
              autoComplete="username"
            />
            
            {/* 密码 */}
            <TextField
              id="password"
              label="密码"
              type="password"
              placeholder="请输入密码"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              fullWidth
              required
              autoComplete="current-password"
              helperText="密码长度不能少于 6 位"
            />
            
            {/* 错误提示 */}
            {error && (
              <div className="bg-error-light border border-error rounded-md p-3">
                <p className="text-sm text-error">{error}</p>
              </div>
            )}
            
            {/* 登录按钮 */}
            <Button
              type="submit"
              variant="primary"
              size="lg"
              fullWidth
              loading={login.isPending}
              disabled={login.isPending}
              onClick={handleButtonClick}
            >
              {login.isPending ? '登录中...' : '登录'}
            </Button>
          </form>
          
          {/* 注册链接 */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              还没有账户？{' '}
              <Link href="/register" className="text-primary hover:text-primary-700 font-medium">
                立即注册
              </Link>
            </p>
          </div>
        </div>
        
        {/* 测试提示 */}
        <div className="mt-4 text-center">
          <p className="text-xs text-gray-500">
            测试账号：admin / 123456
          </p>
        </div>
      </div>
    </div>
  )
}

