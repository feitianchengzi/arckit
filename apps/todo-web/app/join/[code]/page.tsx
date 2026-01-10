'use client'

/**
 * 使用邀请码加入项目页面
 * 路由: /join/[code]
 */

import { useEffect, useState, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button, LoadingView, ErrorView } from '@/components/ui'
import { useJoinByInvite } from '@/hooks/useInvitations'
import { useAuthStore } from '@/store/authStore'

export default function JoinProjectPage() {
  const params = useParams()
  const router = useRouter()
  const inviteCode = params.code as string
  
  const storeIsAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const joinByInvite = useJoinByInvite()
  
  // 使用 state 避免 hydration 不匹配
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [status, setStatus] = useState<'checking' | 'loading' | 'success' | 'error'>('checking')
  const [errorMessage, setErrorMessage] = useState('')
  const hasAttemptedJoin = useRef(false)
  
  // 客户端 hydration 完成后才检查认证状态
  useEffect(() => {
    setMounted(true)
    setIsAuthenticated(storeIsAuthenticated)
  }, [storeIsAuthenticated])
  
  // 检查是否已登录
  useEffect(() => {
    if (!mounted) return
    
    if (!isAuthenticated) {
      // 未登录，跳转到登录页，并保存邀请码到 URL 参数
      setStatus('checking')
      router.push(`/login?redirect=/join/${inviteCode}`)
      return
    }
    
    // 已登录，开始加入流程
    if (status === 'checking') {
      setStatus('loading')
    }
  }, [mounted, isAuthenticated, router, inviteCode, status])
  
  // 自动加入项目（只执行一次）
  useEffect(() => {
    if (!mounted || !isAuthenticated || !inviteCode || status !== 'loading' || hasAttemptedJoin.current) return
    
    hasAttemptedJoin.current = true
    
    // 使用 mutation 的 onSuccess 和 onError 回调
    joinByInvite.mutate(inviteCode, {
      onSuccess: () => {
        setStatus('success')
        // 3秒后跳转到项目列表
        setTimeout(() => {
          router.push('/projects')
        }, 3000)
      },
      onError: (err: any) => {
        console.error('加入项目失败:', err)
        console.error('错误详情:', {
          status: err?.response?.status,
          data: err?.response?.data,
          message: err?.message,
        })
        
        setStatus('error')
        let errorMsg = '加入项目失败，请检查邀请码是否正确或是否已过期'
        
        if (err?.response?.status === 400) {
          errorMsg = err?.response?.data?.error || err?.response?.data?.message || '邀请码无效或格式错误'
        } else if (err?.response?.status === 409) {
          errorMsg = '您已经是该项目的成员'
        } else if (err?.response?.data?.error) {
          errorMsg = err.response.data.error
        } else if (err?.response?.data?.message) {
          errorMsg = err.response.data.message
        } else if (err?.message) {
          errorMsg = err.message
        }
        
        setErrorMessage(errorMsg)
      },
    })
  }, [mounted, isAuthenticated, inviteCode, status, joinByInvite, router])
  
  // 如果未挂载或未登录，显示加载或登录提示
  if (!mounted || !isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <LoadingView size="lg" text={!mounted ? '加载中...' : '需要登录'} />
          {mounted && !isAuthenticated && (
            <>
              <p className="mt-4 text-gray-600 mb-6">请先登录后再使用邀请码加入项目</p>
              <Button
                variant="primary"
                onClick={() => router.push(`/login?redirect=/join/${inviteCode}`)}
                fullWidth
              >
                前往登录
              </Button>
            </>
          )}
        </div>
      </div>
    )
  }
  
  // 加载中
  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <LoadingView size="lg" text="正在加入项目..." />
          <p className="mt-4 text-sm text-gray-500">邀请码: {inviteCode}</p>
        </div>
      </div>
    )
  }
  
  // 成功
  if (status === 'success') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="mb-6">
            <SuccessIcon className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">加入成功！</h1>
            <p className="text-gray-600">您已成功加入项目</p>
          </div>
          <p className="text-sm text-gray-500 mb-6">
            3秒后自动跳转到项目列表...
          </p>
          <Button
            variant="primary"
            onClick={() => router.push('/projects')}
            fullWidth
          >
            立即前往项目列表
          </Button>
        </div>
      </div>
    )
  }
  
  // 错误
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
        <div className="text-center mb-6">
          <ErrorIcon className="w-16 h-16 text-error mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">加入失败</h1>
          <p className="text-gray-600">{errorMessage}</p>
        </div>
        
        <div className="space-y-3">
          <Button
            variant="primary"
            onClick={() => {
              hasAttemptedJoin.current = false // 重置重试标志
              setStatus('loading')
              setErrorMessage('')
              joinByInvite.mutate(inviteCode, {
                onSuccess: () => {
                  setStatus('success')
                  setTimeout(() => {
                    router.push('/projects')
                  }, 3000)
                },
                onError: (err: any) => {
                  console.error('重试加入项目失败:', err)
                  setStatus('error')
                  
                  let errorMsg = '加入项目失败，请检查邀请码是否正确或是否已过期'
                  if (err?.response?.status === 400) {
                    errorMsg = err?.response?.data?.error || err?.response?.data?.message || '邀请码无效或格式错误'
                  } else if (err?.response?.status === 409) {
                    errorMsg = '您已经是该项目的成员'
                  } else if (err?.response?.data?.error) {
                    errorMsg = err.response.data.error
                  } else if (err?.response?.data?.message) {
                    errorMsg = err.response.data.message
                  } else if (err?.message) {
                    errorMsg = err.message
                  }
                  
                  setErrorMessage(errorMsg)
                },
              })
            }}
            fullWidth
            disabled={joinByInvite.isPending}
          >
            {joinByInvite.isPending ? '重试中...' : '重试'}
          </Button>
          
          <Button
            variant="secondary"
            onClick={() => router.push('/projects')}
            fullWidth
          >
            返回项目列表
          </Button>
        </div>
        
        <div className="mt-6 pt-6 border-t border-gray-200">
          <p className="text-xs text-gray-500 text-center">
            邀请码: <span className="font-mono">{inviteCode}</span>
          </p>
        </div>
      </div>
    </div>
  )
}

// ==================== 图标组件 ====================

function SuccessIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  )
}

function ErrorIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  )
}

