import { useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'

// 页面组件
import LoginPage from '@/pages/LoginPage'
import RegisterPage from '@/pages/RegisterPage'
import ProjectsPage from '@/pages/ProjectsPage'
import ProjectDetailPage from '@/pages/ProjectDetailPage'
import ProjectMembersPage from '@/pages/ProjectMembersPage'
import InviteMemberPage from '@/pages/InviteMemberPage'
import NewTaskPage from '@/pages/NewTaskPage'
import TaskDetailPage from '@/pages/TaskDetailPage'
import NewProjectPage from '@/pages/NewProjectPage'
import TasksPage from '@/pages/TasksPage'
import SettingsPage from '@/pages/SettingsPage'
import JoinProjectPage from '@/pages/JoinProjectPage'

// 布局组件
import DashboardLayout from '@/layouts/DashboardLayout'
import AuthGuard from '@/components/auth/AuthGuard'

function App() {
  const { initialize } = useAuthStore()

  // 应用启动时初始化认证状态（从 localStorage 恢复）
  useEffect(() => {
    // 初始化（从 localStorage 恢复状态）
    // 注意：不在这里调用 checkAuth()，让 AuthGuard 完全控制认证流程
    initialize()
  }, [initialize])

  return (
    <Routes>
      {/* 公开路由 */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/join/:code" element={<JoinProjectPage />} />

      {/* 受保护的路由 */}
      <Route element={<AuthGuard><DashboardLayout /></AuthGuard>}>
        <Route path="/" element={<Navigate to="/projects" replace />} />
        <Route path="/projects" element={<ProjectsPage />} />
        <Route path="/projects/new" element={<NewProjectPage />} />
        <Route path="/projects/:id" element={<ProjectDetailPage />} />
        <Route path="/projects/:id/members" element={<ProjectMembersPage />} />
        <Route path="/projects/:id/invite" element={<InviteMemberPage />} />
        <Route path="/projects/:id/tasks/new" element={<NewTaskPage />} />
        <Route path="/projects/:id/tasks/:taskId" element={<TaskDetailPage />} />
        <Route path="/tasks" element={<TasksPage />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Route>

      {/* 404 */}
      <Route path="*" element={<Navigate to="/projects" replace />} />
    </Routes>
  )
}

export default App

