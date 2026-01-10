'use client'

/**
 * 注册页面
 */

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button, TextField } from '@/components/ui'
import { useRegister } from '@/hooks/useAuth'

export default function RegisterPage() {
  const router = useRouter()
  const register = useRegister()
  
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    
    // 验证
    if (!username || !password || !confirmPassword) {
      setError('请填写所有字段')
      return
    }
    
    if (username.length < 3) {
      setError('用户名长度不能少于 3 位')
      return
    }
    
    if (password.length < 6) {
      setError('密码长度不能少于 6 位')
      return
    }
    
    if (password !== confirmPassword) {
      setError('两次输入的密码不一致')
      return
    }
    
    // 注册
    try {
      await register.mutateAsync({ username, password })
    } catch (err: any) {
      setError(err.response?.data?.message || '注册失败，请重试')
    }
  }
  
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo 和标题 */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">待办管理系统</h1>
          <p className="mt-2 text-gray-600">创建你的账户</p>
        </div>
        
        {/* 注册表单 */}
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
              helperText="用户名长度不能少于 3 位"
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
              autoComplete="new-password"
              helperText="密码长度不能少于 6 位"
            />
            
            {/* 确认密码 */}
            <TextField
              id="confirmPassword"
              label="确认密码"
              type="password"
              placeholder="请再次输入密码"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              fullWidth
              required
              autoComplete="new-password"
            />
            
            {/* 错误提示 */}
            {error && (
              <div className="bg-error-light border border-error rounded-md p-3">
                <p className="text-sm text-error">{error}</p>
              </div>
            )}
            
            {/* 注册按钮 */}
            <Button
              type="submit"
              variant="primary"
              size="lg"
              fullWidth
              loading={register.isPending}
              disabled={register.isPending}
            >
              {register.isPending ? '注册中...' : '注册'}
            </Button>
          </form>
          
          {/* 登录链接 */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              已有账户？{' '}
              <Link href="/login" className="text-primary hover:text-primary-700 font-medium">
                立即登录
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

