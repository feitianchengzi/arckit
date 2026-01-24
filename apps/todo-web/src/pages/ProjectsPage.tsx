
/**
 * 项目列表首页 - 欢迎页面
 * 
 * 功能：
 * 1. 显示欢迎信息
 * 2. 首次设置对话框（新用户）
 * 3. 提示用户从侧边栏选择项目
 */

import { useState, useEffect, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { FirstTimeSetupDialog } from '@/components/features/FirstTimeSetupDialog'
import { useFirstTimeSetup } from '@/hooks/useAuth'
import { useAuthStore } from '@/store/authStore'
import { getAuthInfo } from '@/lib/utils/tokenManager'
import { todoUserApi } from '@/lib/api/endpoints/auth'

export default function ProjectsHomePage() {
  const navigate = useNavigate()
  const storeUser = useAuthStore((state) => state.user)
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const [user, setUser] = useState<typeof storeUser>(null)
  const [showSetupDialog, setShowSetupDialog] = useState(false)
  const firstTimeSetup = useFirstTimeSetup()
  const hasLoadedUserRef = useRef(false) // 标记是否已经加载过用户信息

  // 加载用户信息
  useEffect(() => {
    // 如果已经有用户信息且 username 不为空，不需要再次检查
    if (storeUser?.username && storeUser.username.trim() !== '') {
      console.log('✅ 用户信息已存在，跳过加载')
      setShowSetupDialog(false)
      setUser(storeUser)
      hasLoadedUserRef.current = true
      return
    }

    // 如果已经加载过且用户信息为空，不再重复加载（避免设置完成后再次触发）
    if (hasLoadedUserRef.current && !storeUser?.username) {
      console.log('ℹ️  已加载过用户信息，跳过重复加载')
      return
    }

    const loadUserInfo = async () => {
      if (isAuthenticated) {
        hasLoadedUserRef.current = true
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
          console.log('⚠️ 获取用户失败')
          if (error.response?.status === 404) {
            console.log('用户不存在，显示首次设置对话框')
            
            // 用户不存在，创建一个临时的空用户对象，等待首次设置
            const tempUser = {
              id: 0,
              uuid: '', // 网关会处理 UUID
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
      }
    }

    loadUserInfo()
  }, [isAuthenticated, storeUser?.username]) // 依赖 username，用于检测用户信息更新

  // 处理完成首次设置
  const handleCompleteSetup = async (data: { username: string; avatar?: string }) => {
    console.log('📝 准备设置用户信息:', data)
    
    // 先关闭对话框，避免状态更新时重新弹出
    setShowSetupDialog(false)
    
    try {
      const updatedUser = await firstTimeSetup.mutateAsync(data)
      
      // 更新本地状态
      setUser(updatedUser)
      // 标记已加载，避免 useEffect 再次触发
      hasLoadedUserRef.current = true
      console.log('✅ 用户信息设置成功，本地状态已更新:', updatedUser)
    } catch (error: any) {
      // 如果设置失败，重新显示对话框
      console.error('❌ 设置用户信息失败:', error)
      setShowSetupDialog(true)
      throw error
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center py-8 md:py-0">
      <div className="text-center space-y-4 md:space-y-6 max-w-2xl w-full px-4 md:px-6">
        {/* 欢迎标题 */}
        <div className="space-y-2 md:space-y-3">
          <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-foreground">
            欢迎使用项目管理系统
          </h1>
          <p className="text-base md:text-lg text-foreground-secondary">
            从左侧边栏选择一个项目开始工作
          </p>
        </div>

        {/* 快速操作按钮 */}
        <div className="flex justify-center gap-4">
          <button
            onClick={() => navigate('/projects/new')}
            className="inline-flex items-center gap-2 px-4 md:px-6 py-2.5 md:py-3 bg-primary text-white font-semibold rounded-lg hover:bg-primary-700 transition-colors shadow-md hover:shadow-lg min-h-[44px]"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span>创建新项目</span>
          </button>
        </div>

        {/* 提示信息 */}
        <div className="bg-info-lighter border border-info-light rounded-lg p-4 md:p-6 text-left">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0">
              <svg className="w-5 h-5 md:w-6 md:h-6 text-info" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="flex-1 space-y-2">
              <h3 className="font-semibold text-sm md:text-base text-info">
                快速开始
              </h3>
              <ul className="space-y-1 text-xs md:text-sm text-foreground-secondary">
                <li>• 在左侧边栏点击 <strong>项目列表</strong> 查看所有项目</li>
                <li>• 点击具体项目名称查看项目详情和任务</li>
                <li>• 点击项目列表旁的 <strong>+</strong> 按钮创建新项目</li>
              </ul>
            </div>
          </div>
        </div>

        {/* 装饰性图标 */}
        <div className="hidden md:flex justify-center gap-6 md:gap-8 pt-6 md:pt-8 opacity-30">
          <svg className="w-12 h-12 md:w-16 md:h-16 text-foreground-tertiary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
          </svg>
          <svg className="w-12 h-12 md:w-16 md:h-16 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <svg className="w-12 h-12 md:w-16 md:h-16 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
