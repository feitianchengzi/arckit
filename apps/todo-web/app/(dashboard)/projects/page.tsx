'use client'

/**
 * 项目列表首页 - 欢迎页面
 * 
 * 功能：
 * 1. 显示欢迎信息
 * 2. 首次设置对话框（新用户）
 * 3. 提示用户从侧边栏选择项目
 */

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { FirstTimeSetupDialog } from '@/components/features/FirstTimeSetupDialog'
import { useFirstTimeSetup } from '@/hooks/useAuth'
import { useAuthStore } from '@/store/authStore'
import { getAuthInfo } from '@/lib/utils/tokenManager'
import { todoUserApi } from '@/lib/api/endpoints/auth'

export default function ProjectsHomePage() {
  const router = useRouter()
  const storeUser = useAuthStore((state) => state.user)
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const [user, setUser] = useState<typeof storeUser>(null)
  const [showSetupDialog, setShowSetupDialog] = useState(false)
  const firstTimeSetup = useFirstTimeSetup()

  // 加载用户信息
  useEffect(() => {
    const loadUserInfo = async () => {
      const authInfo = getAuthInfo()
      if (isAuthenticated && authInfo?.userId) {
        try {
          console.log('📥 项目列表页面：加载用户信息...')
          console.log('📥 获取当前登录用户信息...')
          const user = await todoUserApi.getCurrentUser()
          useAuthStore.getState().setUser(user)
          setUser(user)
          console.log('✅ 用户信息加载成功, username:', user.username)

          // 检查是否需要首次设置
          if (!user.username || user.username.trim() === '') {
            setShowSetupDialog(true)
          } else {
            setShowSetupDialog(false)
          }
        } catch (error: any) {
          console.log('⚠️ 获取用户失败:', error.response?.status, error.response?.data)
          if (error.response?.status === 404) {
            console.log('用户不存在，显示首次设置对话框')
            
            // 用户不存在，创建一个临时的空用户对象，等待首次设置
            const tempUser = {
              id: 0,
              uuid: authInfo.userId,
              username: '', // 空的 username，触发首次设置对话框
              avatar: '',
              created_at: '',
              updated_at: '',
            }
            
            useAuthStore.getState().setUser(tempUser)
            setUser(tempUser)
            
            // 显示首次设置对话框
            setShowSetupDialog(true)
          } else {
            console.error('❌ 获取用户信息失败:', error)
          }
        }
      } else {
        // 没有 authInfo，检查是否需要显示设置对话框
        if (isAuthenticated) {
          setShowSetupDialog(true)
        }
      }
    }

    loadUserInfo()
  }, [isAuthenticated, storeUser?.uuid]) // 依赖 uuid，因为 id 始终为 0

  // 处理完成首次设置
  const handleCompleteSetup = async (data: { username: string; avatar?: string }) => {
    console.log('📝 准备设置用户信息:', data)
    await firstTimeSetup.mutateAsync(data)
    
    // 添加一个小延迟确保状态更新
    await new Promise(resolve => setTimeout(resolve, 100))
    
    // 从 store 获取最新的用户信息并更新本地状态
    const latestUser = useAuthStore.getState().user
    setUser(latestUser)
    console.log('✅ 本地用户状态已更新:', latestUser)
    
    setShowSetupDialog(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center space-y-6 max-w-2xl px-6">
        {/* 欢迎标题 */}
        <div className="space-y-3">
          <h1 className="text-4xl font-bold text-gray-900">
            欢迎使用项目管理系统
          </h1>
          <p className="text-lg text-gray-600">
            从左侧边栏选择一个项目开始工作
          </p>
        </div>

        {/* 快速操作按钮 */}
        <div className="flex justify-center gap-4">
          <button
            onClick={() => router.push('/projects/new')}
            className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white font-semibold rounded-lg hover:bg-primary-700 transition-colors shadow-md hover:shadow-lg"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span>创建新项目</span>
          </button>
        </div>

        {/* 提示信息 */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-left">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0">
              <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="flex-1 space-y-2">
              <h3 className="font-semibold text-blue-900">
                快速开始
              </h3>
              <ul className="space-y-1 text-sm text-blue-800">
                <li>• 在左侧边栏点击 <strong>项目列表</strong> 查看所有项目</li>
                <li>• 点击具体项目名称查看项目详情和任务</li>
                <li>• 点击项目列表旁的 <strong>+</strong> 按钮创建新项目</li>
              </ul>
            </div>
          </div>
        </div>

        {/* 装饰性图标 */}
        <div className="flex justify-center gap-8 pt-8 opacity-30">
          <svg className="w-16 h-16 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
          </svg>
          <svg className="w-16 h-16 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <svg className="w-16 h-16 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
        </div>
      </div>

      {/* 首次设置对话框 */}
      <FirstTimeSetupDialog
        open={showSetupDialog}
        onClose={() => {}} // 防止关闭，必须完成设置
        onComplete={handleCompleteSetup}
      />
    </div>
  )
}
