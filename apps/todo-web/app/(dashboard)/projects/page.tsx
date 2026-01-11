'use client'

/**
 * 项目列表页面
 */

import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { Button, LoadingView, ErrorView, EmptyStateView } from '@/components/ui'
import { ProjectCard } from '@/components/features/ProjectCard'
import { FirstTimeSetupDialog } from '@/components/features/FirstTimeSetupDialog'
import { useProjectList } from '@/hooks/useProjects'
import { useFirstTimeSetup } from '@/hooks/useAuth'
import { useAuthStore } from '@/store/authStore'
import { getAuthInfo } from '@/lib/utils/tokenManager'

export default function ProjectsPage() {
  const router = useRouter()
  const storeUser = useAuthStore((state) => state.user)
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const [user, setUser] = useState<typeof storeUser>(null)
  const [mounted, setMounted] = useState(false)
  const [showSetupDialog, setShowSetupDialog] = useState(false)
  const { data: projects, isLoading, error, refetch } = useProjectList()
  const firstTimeSetup = useFirstTimeSetup()
  
  useEffect(() => {
    setMounted(true)
    setUser(storeUser)
    
    // 检查是否需要首次设置
    // 如果用户已登录但用户名为空（包括user为null或username为空），显示设置对话框
    if (isAuthenticated && (!storeUser || !storeUser.username)) {
      setShowSetupDialog(true)
    } else {
      setShowSetupDialog(false)
    }
  }, [storeUser, isAuthenticated])
  
  // 完成首次设置
  const handleCompleteSetup = async (data: { username: string; avatar?: string }) => {
    try {
      await firstTimeSetup.mutateAsync(data)
      setShowSetupDialog(false)
      // 设置完成后，用户信息会自动更新到 store，页面会自动刷新显示
    } catch (err: any) {
      throw new Error(err.message || '设置失败')
    }
  }

  // 获取邮箱地址（用于默认用户名）
  const getDefaultEmail = () => {
    const authInfo = getAuthInfo()
    // 从 localStorage 或其他地方获取邮箱（这里简化处理，实际可能需要从网关用户信息获取）
    return undefined // 暂时返回 undefined，让对话框使用默认用户名生成逻辑
  }
  
  // 加载状态
  if (isLoading) {
    return <LoadingView size="lg" text="加载项目列表..." />
  }
  
  // 错误状态
  if (error) {
    return (
      <ErrorView
        title="加载失败"
        message="无法获取项目列表，请稍后重试"
        onRetry={() => refetch()}
      />
    )
  }
  
  // 空状态
  if (!projects || projects.length === 0) {
    return (
      <>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">项目列表</h1>
            <p className="mt-2 text-gray-600">
              {/* 只有在用户信息已设置时才显示用户名 */}
              {mounted && user?.username ? `欢迎回来，${user.username}！` : '欢迎回来！'}
            </p>
          </div>
          
          <EmptyStateView
            title="还没有项目"
            message="创建第一个项目开始使用"
            actionLabel="创建项目"
            onAction={() => router.push('/projects/new')}
          />
        </div>

        {/* 首次设置对话框 */}
        <FirstTimeSetupDialog
          open={showSetupDialog}
          onClose={() => {
            // 不允许关闭，必须完成设置
            // 但为了用户体验，可以暂时关闭，后续再提示
            setShowSetupDialog(false)
          }}
          onComplete={handleCompleteSetup}
          defaultEmail={getDefaultEmail()}
        />
      </>
    )
  }
  
  // 有数据状态
  return (
    <>
      <div className="space-y-6">
        {/* 页面头部 */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">项目列表</h1>
            <p className="mt-2 text-gray-600">
              {/* 只有在用户信息已设置时才显示用户名和项目数 */}
              {mounted && user?.username 
                ? `欢迎回来，${user.username}！共 ${projects.length} 个项目`
                : `共 ${projects.length} 个项目`}
            </p>
          </div>
          
          <Button
            variant="primary"
            onClick={() => router.push('/projects/new')}
          >
            创建项目
          </Button>
        </div>
        
        {/* 项目网格 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      </div>

      {/* 首次设置对话框 */}
      <FirstTimeSetupDialog
        open={showSetupDialog}
        onClose={() => {
          // 不允许关闭，必须完成设置
          // 但为了用户体验，可以暂时关闭，后续再提示
          setShowSetupDialog(false)
        }}
        onComplete={handleCompleteSetup}
        defaultEmail={getDefaultEmail()}
      />
    </>
  )
}
