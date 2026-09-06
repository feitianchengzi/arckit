import { useEffect } from 'react'
import { Routes, Route, Navigate, useParams, useSearchParams } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'

// 页面组件
import LoginPage from '@/pages/LoginPage'
import RegisterPage from '@/pages/RegisterPage'
import ProjectsPage from '@/pages/ProjectsPage'
import NewProjectPage from '@/pages/NewProjectPage'
import SettingsPage from '@/pages/SettingsPage'
import JoinProjectPage from '@/pages/JoinProjectPage'
import OrganizationDetailPage from '@/pages/OrganizationDetailPage'
import InviteOrganizationPage from '@/pages/InviteOrganizationPage'
import JoinOrganizationPage from '@/pages/JoinOrganizationPage'
import FeedbackProjectDetailPage from '@/pages/FeedbackProjectDetailPage'
import FeedbackCaseDemoPage from '@/pages/FeedbackCaseDemoPage'
import FeedbackProjectSettingsPage from '@/pages/FeedbackProjectSettingsPage'
import FeedbackProjectMembersPage from '@/pages/FeedbackProjectMembersPage'
import FeedbackEmailDetailPage from '@/pages/FeedbackEmailDetailPage'
import { ToastHost } from '@/components/ui/ToastHost'

// 布局组件
import DashboardLayout from '@/layouts/DashboardLayout'
import AuthGuard from '@/components/auth/AuthGuard'

function LegacyProjectsRootRedirect() {
  return <Navigate to="/feedbacks" replace />
}

function LegacyProjectDetailRedirect() {
  const { id } = useParams()
  if (!id) return <Navigate to="/feedbacks" replace />
  return <Navigate to={`/feedbacks/projects/${id}`} replace />
}

function LegacyProjectSettingsRedirect() {
  const { id } = useParams()
  if (!id) return <Navigate to="/feedbacks" replace />
  return <Navigate to={`/feedbacks/projects/${id}/settings`} replace />
}

function FeedbackProjectRoute() {
  const [searchParams] = useSearchParams()
  const feedbackId = Number(searchParams.get('feedback_id'))

  // 兼容已经发出的旧邮件：旧链接使用项目页 query，新版统一进入独立详情页。
  if (Number.isInteger(feedbackId) && feedbackId > 0) {
    return <Navigate to={`/feedbacks/email/${feedbackId}`} replace />
  }

  return <FeedbackProjectDetailPage />
}

function App() {
  const { initialize } = useAuthStore()

  // 应用启动时初始化认证状态（从 localStorage 恢复）
  useEffect(() => {
    // 初始化（从 localStorage 恢复状态）
    // 注意：不在这里调用 checkAuth()，让 AuthGuard 完全控制认证流程
    initialize()
  }, [initialize])

  return (
    <>
      <ToastHost />
      <Routes>
      {/* 公开路由 */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/join/:code" element={<JoinProjectPage />} />
      <Route path="/join-organization/:code" element={<JoinOrganizationPage />} />

      {/* 邮件深链：保留登录与项目成员校验，但不加载复杂的管理台布局 */}
      <Route
        path="/feedbacks/email/:feedbackId"
        element={<AuthGuard><FeedbackEmailDetailPage /></AuthGuard>}
      />

      {/* 受保护的路由 */}
      <Route element={<AuthGuard><DashboardLayout /></AuthGuard>}>
        <Route path="/" element={<Navigate to="/feedbacks" replace />} />

        {/* 兼容旧路由：统一导向 feedbacks 路由，避免误入待办域页面 */}
        <Route path="/projects" element={<LegacyProjectsRootRedirect />} />
        <Route path="/projects/new" element={<Navigate to="/feedbacks/projects/new" replace />} />
        <Route path="/projects/:id/settings" element={<LegacyProjectSettingsRedirect />} />
        <Route path="/projects/:id" element={<LegacyProjectDetailRedirect />} />
        <Route path="/projects/:id/*" element={<LegacyProjectDetailRedirect />} />
        <Route path="/tasks" element={<Navigate to="/feedbacks" replace />} />

        <Route path="/feedbacks" element={<ProjectsPage />} />
        <Route path="/feedbacks/projects/new" element={<NewProjectPage />} />
        <Route path="/feedbacks/organizations/:id" element={<OrganizationDetailPage />} />
        <Route path="/feedbacks/case-demo" element={<FeedbackCaseDemoPage />} />
        <Route path="/feedbacks/projects/:id/settings" element={<FeedbackProjectSettingsPage />} />
        <Route path="/feedbacks/projects/:id/members" element={<FeedbackProjectMembersPage />} />
        <Route path="/feedbacks/projects/:id" element={<FeedbackProjectRoute />} />
        <Route path="/organizations/:id" element={<OrganizationDetailPage />} />
        <Route path="/organizations/:id/invite" element={<InviteOrganizationPage />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Route>

      {/* 404 */}
      <Route path="*" element={<Navigate to="/feedbacks" replace />} />
      </Routes>
    </>
  )
}

export default App
