
/**
 * 使用邀请码加入项目页面（客户端组件）
 * 路由: /join/[code]
 */

import { useEffect, useState, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Button, LoadingView, ErrorView } from '@/components/ui'
import { FirstTimeSetupDialog } from '@/components/features/FirstTimeSetupDialog'
import { useJoinByInvite } from '@/hooks/useInvitations'
import { useAuthStore } from '@/store/authStore'
import { useFirstTimeSetup } from '@/hooks/useAuth'
import { todoUserApi } from '@/lib/api/endpoints/auth'

export default function JoinProjectPage() {
  const navigate = useNavigate()
  const params = useParams()
  const inviteCode = params.code!
  
  const storeIsAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const storeUser = useAuthStore((state) => state.user)
  const joinByInvite = useJoinByInvite()
  const firstTimeSetup = useFirstTimeSetup()
  
  // 使用 state 避免 hydration 不匹配
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [status, setStatus] = useState<'checking' | 'checking-user' | 'setting-up' | 'loading' | 'success' | 'error'>('checking')
  const [errorMessage, setErrorMessage] = useState('')
  const [showSetupDialog, setShowSetupDialog] = useState(false)
  const hasAttemptedJoin = useRef(false)
  const hasCheckedUser = useRef(false)
  
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
      navigate(`/login?redirect=/join/${inviteCode}`)
      return
    }
    
    // 已登录，先检查用户信息
    if (status === 'checking' && !hasCheckedUser.current) {
      setStatus('checking-user')
      hasCheckedUser.current = true
    }
  }, [mounted, isAuthenticated, navigate, inviteCode, status])

  // 检查用户信息是否存在
  useEffect(() => {
    if (!mounted || !isAuthenticated || status !== 'checking-user') return
    
    const checkUserInfo = async () => {
      try {
        // 如果 store 中已有用户信息且 username 不为空，直接进入加入流程
        if (storeUser?.username && storeUser.username.trim() !== '') {
          console.log('✅ 用户信息已存在，开始加入项目')
          setStatus('loading')
          return
        }
        
        // 尝试获取用户信息
        console.log('📥 检查用户信息...')
        const user = await todoUserApi.getCurrentUser()
        useAuthStore.getState().setUser(user)
        
        // 检查用户名是否为空
        if (!user.username || user.username.trim() === '') {
          console.log('⚠️ 用户信息不完整，显示首次设置对话框')
          setShowSetupDialog(true)
          setStatus('setting-up')
        } else {
          console.log('✅ 用户信息完整，开始加入项目')
          setStatus('loading')
        }
      } catch (error: any) {
        console.log('⚠️ 获取用户信息失败:', error.response?.status)
        
        // 如果用户不存在（404），显示首次设置对话框
        if (error.response?.status === 404) {
          console.log('用户不存在，显示首次设置对话框')
          setShowSetupDialog(true)
          setStatus('setting-up')
        } else {
          // 其他错误，显示错误信息
          console.error('❌ 获取用户信息失败:', error)
          setStatus('error')
          setErrorMessage('获取用户信息失败，请重试')
        }
      }
    }
    
    checkUserInfo()
  }, [mounted, isAuthenticated, status, storeUser])

  // 处理完成首次设置
  const handleCompleteSetup = async (data: { username: string; avatar?: string }) => {
    console.log('📝 准备设置用户信息:', data)
    
    try {
      setShowSetupDialog(false)
      const updatedUser = await firstTimeSetup.mutateAsync(data)
      console.log('✅ 用户信息设置成功，开始加入项目')
      
      // 重置加入标志，以便重新尝试加入项目
      hasAttemptedJoin.current = false
      
      // 用户信息设置成功后，开始加入项目
      setStatus('loading')
    } catch (error: any) {
      console.error('❌ 设置用户信息失败:', error)
      setShowSetupDialog(true)
      throw error
    }
  }
  
  // 自动加入项目（只执行一次）
  useEffect(() => {
    if (!mounted || !isAuthenticated || !inviteCode || status !== 'loading' || hasAttemptedJoin.current || showSetupDialog) return
    
    // 立即设置标志，避免重复执行
    hasAttemptedJoin.current = true
    
    console.log('🚀 开始加入项目流程，邀请码:', inviteCode)
    
    // 使用 mutation 的 onSuccess 和 onError 回调
    joinByInvite.mutate(inviteCode, {
      onSuccess: (data) => {
        console.log('✅ 加入项目成功回调触发，数据:', data)
        setStatus('success')
        // 3秒后跳转到项目列表
        setTimeout(() => {
          navigate('/projects')
        }, 3000)
      },
      onError: (err: any) => {
        console.error('加入项目失败:', err)
        console.error('错误详情:', {
          status: err?.response?.status,
          data: err?.response?.data,
          message: err?.message,
          code: err?.code,
        })
        
        // 提取错误消息（确保是字符串）
        const extractErrorMessage = (error: any): string => {
          // 如果是字符串，直接返回
          if (typeof error === 'string') return error
          // 如果是 ApiError 实例
          if (error?.name === 'ApiError' && error?.message) {
            return error.message
          }
          // 如果是对象，尝试提取 message 字段
          if (error && typeof error === 'object') {
            // 新格式：{ code: 'ERROR_CODE', error: { message: '...', details: ... } }
            if (error.error && typeof error.error === 'object' && error.error.message) {
              return String(error.error.message)
            }
            // 旧格式：{ message: '...' } 或 { error: '...' }
            if (error.message && typeof error.message === 'string') return error.message
            if (error.error && typeof error.error === 'string') return error.error
            // 如果是对象，转换为 JSON 字符串（调试用）
            return JSON.stringify(error)
          }
          return String(error || '未知错误')
        }
        
        // 检查是否是用户信息相关的错误（404 或包含"用户"相关的错误消息）
        const errorMsg = extractErrorMessage(
          err?.response?.data?.error?.message || 
          err?.response?.data?.error || 
          err?.response?.data || 
          err?.message || 
          err
        )
        
        const isUserRelatedError = 
          err?.response?.status === 404 ||
          (typeof errorMsg === 'string' && (
            errorMsg.includes('用户') || 
            errorMsg.includes('user') ||
            errorMsg.toLowerCase().includes('missing user') ||
            errorMsg.toLowerCase().includes('user id') ||
            errorMsg.toLowerCase().includes('user not found')
          ))
        
        // 如果是用户信息相关的错误，显示首次设置对话框
        if (isUserRelatedError) {
          console.log('⚠️ 检测到用户信息相关错误，显示首次设置对话框')
          hasAttemptedJoin.current = false // 重置标志，以便设置完成后重试
          setShowSetupDialog(true)
          setStatus('setting-up')
          return
        }
        
        // 其他错误，显示错误页面
        setStatus('error')
        let finalErrorMsg = '加入项目失败，请检查邀请码是否正确或是否已过期'
        
        // 处理 ApiError 实例（从 handleResponse 抛出的）
        if (err?.name === 'ApiError') {
          finalErrorMsg = err.message || '加入项目失败'
        } else if (err?.response?.status === 400) {
          // 400 错误：可能是邀请码格式错误或已过期
          const errorData = err?.response?.data
          if (errorData) {
            // 新格式：{ code: 'ERROR_CODE', error: { message: '...' } }
            if (errorData.error && errorData.error.message) {
              finalErrorMsg = extractErrorMessage(errorData.error.message)
            } else if (errorData.code && errorData.error) {
              finalErrorMsg = extractErrorMessage(errorData.error)
            } else {
              finalErrorMsg = extractErrorMessage(errorData)
            }
          } else {
            finalErrorMsg = '邀请码无效或格式错误'
          }
        } else if (err?.response?.status === 409) {
          finalErrorMsg = '您已经是该项目的成员'
        } else if (err?.response?.data) {
          finalErrorMsg = extractErrorMessage(err.response.data)
        } else if (err?.message) {
          finalErrorMsg = extractErrorMessage(err.message)
        }
        
        setErrorMessage(finalErrorMsg)
      },
    })
    // 注意：不依赖 joinByInvite，因为它每次渲染都可能变化，导致重复执行
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mounted, isAuthenticated, inviteCode, status, showSetupDialog, navigate])
  
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
                onClick={() => navigate(`/login?redirect=/join/${inviteCode}`)}
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
  
  // 检查用户信息中
  if (status === 'checking-user') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <LoadingView size="lg" text="正在检查用户信息..." />
        </div>
      </div>
    )
  }

  // 首次设置中
  if (status === 'setting-up' || showSetupDialog) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <FirstTimeSetupDialog
          open={showSetupDialog}
          onClose={() => {}} // 不允许关闭，必须完成设置
          onComplete={handleCompleteSetup}
        />
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
            onClick={() => navigate('/projects')}
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
                    navigate('/projects')
                  }, 3000)
                },
                onError: (err: any) => {
                  console.error('重试加入项目失败:', err)
                  setStatus('error')
                  
                  // 提取错误消息（确保是字符串）
                  const extractErrorMessage = (error: any): string => {
                    if (typeof error === 'string') return error
                    if (error?.name === 'ApiError' && error?.message) {
                      return error.message
                    }
                    if (error && typeof error === 'object') {
                      if (error.error && typeof error.error === 'object' && error.error.message) {
                        return String(error.error.message)
                      }
                      if (error.message && typeof error.message === 'string') return error.message
                      if (error.error && typeof error.error === 'string') return error.error
                      return JSON.stringify(error)
                    }
                    return String(error || '未知错误')
                  }
                  
                  let errorMsg = '加入项目失败，请检查邀请码是否正确或是否已过期'
                  if (err?.name === 'ApiError') {
                    errorMsg = err.message || '加入项目失败'
                  } else if (err?.response?.status === 400) {
                    const errorData = err?.response?.data
                    if (errorData) {
                      if (errorData.error && errorData.error.message) {
                        errorMsg = extractErrorMessage(errorData.error.message)
                      } else if (errorData.code && errorData.error) {
                        errorMsg = extractErrorMessage(errorData.error)
                      } else {
                        errorMsg = extractErrorMessage(errorData)
                      }
                    } else {
                      errorMsg = '邀请码无效或格式错误'
                    }
                  } else if (err?.response?.status === 409) {
                    errorMsg = '您已经是该项目的成员'
                  } else if (err?.response?.data) {
                    errorMsg = extractErrorMessage(err.response.data)
                  } else if (err?.message) {
                    errorMsg = extractErrorMessage(err.message)
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
            onClick={() => navigate('/projects')}
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

