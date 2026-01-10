'use client'

/**
 * 项目列表页面
 */

import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { Button, LoadingView, ErrorView, EmptyStateView } from '@/components/ui'
import { ProjectCard } from '@/components/features/ProjectCard'
import { useProjectList } from '@/hooks/useProjects'
import { useAuthStore } from '@/store/authStore'

export default function ProjectsPage() {
  const router = useRouter()
  const storeUser = useAuthStore((state) => state.user)
  const [user, setUser] = useState<typeof storeUser>(null)
  const [mounted, setMounted] = useState(false)
  const { data: projects, isLoading, error, refetch } = useProjectList()
  
  useEffect(() => {
    setMounted(true)
    setUser(storeUser)
  }, [storeUser])
  
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
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">项目列表</h1>
          <p className="mt-2 text-gray-600">
            欢迎回来{mounted && user?.username ? `，${user.username}` : ''}！
          </p>
        </div>
        
        <EmptyStateView
          title="还没有项目"
          message="创建第一个项目开始使用"
          actionLabel="创建项目"
          onAction={() => router.push('/projects/new')}
        />
      </div>
    )
  }
  
  // 有数据状态
  return (
    <div className="space-y-6">
      {/* 页面头部 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">项目列表</h1>
          <p className="mt-2 text-gray-600">
            共 {projects.length} 个项目
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
  )
}

