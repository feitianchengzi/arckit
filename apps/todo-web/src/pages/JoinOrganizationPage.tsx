import { useEffect, useRef, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Button, LoadingView, ErrorView } from '@/components/ui'
import { useAuthStore } from '@/store/authStore'
import { useJoinOrganizationInvite } from '@/hooks/useOrganizations'

export default function JoinOrganizationPage() {
  const navigate = useNavigate()
  const params = useParams()
  const inviteCode = params.code

  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const joinOrganization = useJoinOrganizationInvite()
  const hasAttemptedJoin = useRef(false)

  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState('')

  const handleJoin = async () => {
    if (!inviteCode) {
      setStatus('error')
      setErrorMessage('邀请码无效')
      return
    }

    setStatus('loading')
    try {
      await joinOrganization.mutateAsync(inviteCode)
      setStatus('success')
      setTimeout(() => {
        navigate('/organizations')
      }, 3000)
    } catch (err: any) {
      setStatus('error')
      setErrorMessage(err?.response?.data?.message || err?.message || '加入组织失败')
    }
  }

  useEffect(() => {
    if (!isAuthenticated || !inviteCode || hasAttemptedJoin.current) return
    hasAttemptedJoin.current = true
    handleJoin()
  }, [isAuthenticated, inviteCode])

  if (!inviteCode) {
    return <ErrorView title="加载失败" message="邀请码无效" />
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <LoadingView size="lg" text="需要登录" />
          <p className="mt-4 text-gray-600 mb-6">请先登录后再使用邀请码加入组织</p>
          <Button
            variant="primary"
            onClick={() => navigate(`/login?redirect=/join-organization/${inviteCode}`)}
            fullWidth
          >
            前往登录
          </Button>
        </div>
      </div>
    )
  }

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <LoadingView size="lg" text="正在加入组织..." />
          <p className="mt-4 text-sm text-gray-500">邀请码: {inviteCode}</p>
        </div>
      </div>
    )
  }

  if (status === 'success') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="text-5xl mb-4">🎉</div>
          <h2 className="text-2xl font-bold text-gray-900">加入成功</h2>
          <p className="mt-2 text-gray-600">即将跳转到组织列表</p>
          <Button
            variant="primary"
            onClick={() => navigate('/organizations')}
            className="mt-6"
            fullWidth
          >
            立即跳转
          </Button>
        </div>
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="text-4xl mb-4">😞</div>
          <h2 className="text-2xl font-bold text-gray-900">加入失败</h2>
          <p className="mt-2 text-gray-600">{errorMessage}</p>
          <div className="mt-6 space-y-3">
            <Button
              variant="primary"
              onClick={handleJoin}
              fullWidth
            >
              重试
            </Button>
            <Button
              variant="secondary"
              onClick={() => navigate('/organizations')}
              fullWidth
            >
              返回组织列表
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        <LoadingView size="lg" text="准备加入组织..." />
      </div>
    </div>
  )
}
