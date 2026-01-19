
/**
 * 邀请成员页面
 */

import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Button, LoadingView, ErrorView, RoleSelect, TextField } from '@/components/ui'
import { useProject } from '@/hooks/useProjects'
import { useCreateInvitation } from '@/hooks/useInvitations'
import type { ProjectRole } from '@/types'

export default function InviteMemberPage() {
  const navigate = useNavigate()
  const params = useParams()
  const projectId = Number(params.id!)
  
  const { data: project, isLoading: projectLoading } = useProject(String(projectId))
  const createInvitation = useCreateInvitation(projectId)
  
  const [role, setRole] = useState<ProjectRole>('member')
  const [expiresInHours, setExpiresInHours] = useState('24')
  const [maxUses, setMaxUses] = useState('') // 邀请人数，可选
  const [inviteCode, setInviteCode] = useState('')
  const [inviteLink, setInviteLink] = useState('')
  const [error, setError] = useState('')
  const [copied, setCopied] = useState<'code' | 'link' | null>(null)
  
  // 加载状态
  if (projectLoading) {
    return <LoadingView size="lg" text="加载项目信息..." />
  }
  
  // 错误状态
  if (!project) {
    return <ErrorView title="加载失败" message="无法获取项目信息" />
  }
  
  // 生成邀请
  const handleGenerate = async () => {
    setError('')
    setInviteCode('')
    setInviteLink('')
    
    try {
      const invitationInput: any = {
        project_id: parseInt(projectId),
        role,
        expires_in_hours: parseInt(expiresInHours) || 0,
      }
      
      // 如果输入了邀请人数，添加到请求中
      if (maxUses.trim() !== '') {
        const maxUsesNum = parseInt(maxUses)
        if (!isNaN(maxUsesNum) && maxUsesNum > 0) {
          invitationInput.max_uses = maxUsesNum
        }
      }
      
      const invitation = await createInvitation.mutateAsync(invitationInput)
      
      setInviteCode(invitation.invite_code)
      
      // 生成邀请链接
      // 优先使用后端返回的 invite_link（如果存在且有效）
      // 否则前端自己拼接，确保包含 base path
      if (invitation.invite_link && invitation.invite_link.startsWith('http')) {
        // 后端返回了完整的链接，直接使用
        setInviteLink(invitation.invite_link)
      } else {
        // 前端自己拼接，使用 Vite 的 BASE_URL 确保包含 base path
        const baseUrl = window.location.origin
        // import.meta.env.BASE_URL 是 Vite 自动提供的，值为 '/workshop/'（包含尾部斜杠）
        const basePath = import.meta.env.BASE_URL || '/workshop/'
        // 确保 basePath 以 / 开头，但不重复尾部斜杠
        const normalizedBasePath = basePath.endsWith('/') ? basePath.slice(0, -1) : basePath
        setInviteLink(`${baseUrl}${normalizedBasePath}/join/${invitation.invite_code}`)
      }
    } catch (err: any) {
      setError(err.response?.data?.message || '生成邀请失败，请重试')
    }
  }
  
  // 复制到剪贴板
  const handleCopy = async (type: 'code' | 'link') => {
    const text = type === 'code' ? inviteCode : inviteLink
    
    try {
      await navigator.clipboard.writeText(text)
      setCopied(type)
      setTimeout(() => setCopied(null), 2000)
    } catch (err) {
      alert('复制失败，请手动复制')
    }
  }
  
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* 页面头部 */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate(-1)}
          className="text-gray-600 hover:text-gray-900"
        >
          <BackIcon className="w-6 h-6" />
        </button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">邀请成员</h1>
          <p className="mt-1 text-gray-600">项目：{project.name}</p>
        </div>
      </div>
      
      {/* 邀请表单 */}
      <div className="bg-white rounded-lg shadow p-6 space-y-6">
        {/* 选择角色 */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">
            成员角色
          </label>
          <RoleSelect
            value={role}
            onChange={setRole}
            disabled={createInvitation.isPending}
          />
        </div>
        
        {/* 过期时间 */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">
            过期时间（小时）
          </label>
          <select
            value={expiresInHours}
            onChange={(e) => setExpiresInHours(e.target.value)}
            disabled={createInvitation.isPending}
            className="w-full px-4 py-3 border border-gray-300 rounded-md focus:border-primary focus:ring-2 focus:ring-primary"
          >
            <option value="1">1 小时</option>
            <option value="6">6 小时</option>
            <option value="24">24 小时</option>
            <option value="72">3 天</option>
            <option value="168">7 天</option>
            <option value="0">永不过期</option>
          </select>
        </div>
        
        {/* 邀请人数 */}
        <div className="space-y-2">
          <TextField
            id="maxUses"
            label="邀请人数（可选）"
            type="number"
            min="1"
            value={maxUses}
            onChange={(e) => setMaxUses(e.target.value)}
            placeholder="留空则默认1人"
            helperText="不填写则默认1人，填写后该邀请码可被指定次数的人使用"
            disabled={createInvitation.isPending}
            fullWidth
          />
        </div>
        
        {/* 生成按钮 */}
        <Button
          variant="primary"
          onClick={handleGenerate}
          loading={createInvitation.isPending}
          fullWidth
        >
          {createInvitation.isPending ? '生成中...' : '生成邀请'}
        </Button>
        
        {/* 错误提示 */}
        {error && (
          <div className="bg-error-light border border-error rounded-md p-3">
            <p className="text-sm text-error">{error}</p>
          </div>
        )}
        
        {/* 邀请码 */}
        {inviteCode && (
          <div className="space-y-4 pt-6 border-t">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                邀请码
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={inviteCode}
                  readOnly
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-md bg-gray-50 font-mono text-sm"
                />
                <Button
                  variant="secondary"
                  onClick={() => handleCopy('code')}
                >
                  {copied === 'code' ? '已复制' : '复制'}
                </Button>
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                邀请链接
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={inviteLink}
                  readOnly
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-md bg-gray-50 text-sm"
                />
                <Button
                  variant="secondary"
                  onClick={() => handleCopy('link')}
                >
                  {copied === 'link' ? '已复制' : '复制'}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ==================== 图标组件 ====================

function BackIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
    </svg>
  )
}



