
/**
 * 创建项目页面
 */

import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { Button, TextField } from '@/components/ui'
import { LoadingView } from '@/components/ui/LoadingView'
import { CreateOrganizationDialog } from '@/components/features/CreateOrganizationDialog'
import { useCreateProject } from '@/hooks/useProjects'
import { useOrganizationList } from '@/hooks/useOrganizations'

export default function NewProjectPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const queryClient = useQueryClient()
  const createProject = useCreateProject()
  const { data: organizations = [], isLoading: orgLoading } = useOrganizationList()
  const [showCreateOrgDialog, setShowCreateOrgDialog] = useState(false)
  const routeOrganizationId = location.pathname.match(/\/organizations\/(\d+)/)?.[1]
  const selectedOrganizationId = routeOrganizationId ? Number(routeOrganizationId) : null
  
  const [name, setName] = useState('')
  const [gitUrl, setGitUrl] = useState('')
  const [error, setError] = useState('')
  const [organizationId, setOrganizationId] = useState<number | null>(selectedOrganizationId)

  useEffect(() => {
    if (selectedOrganizationId) {
      setOrganizationId(selectedOrganizationId)
      return
    }
    if (organizations.length > 0) {
      setOrganizationId((current) => current ?? organizations[0].id)
      return
    }
    setOrganizationId(null)
  }, [selectedOrganizationId, organizations.length])

  const handleCreateOrgSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ['organizations'] })
  }
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!organizationId) {
      setError('请选择所属组织')
      return
    }
    
    // 验证
    if (!name.trim()) {
      setError('请输入项目名称')
      return
    }
    
    if (!gitUrl.trim()) {
      setError('请输入 Git 地址')
      return
    }
    
    // 简单的 URL 验证
    try {
      new URL(gitUrl)
    } catch {
      setError('请输入有效的 Git 地址')
      return
    }
    
    // 创建项目
    try {
      await createProject.mutateAsync({
        name: name.trim(),
        git_url: gitUrl.trim(),
        organization_id: organizationId,
      })
    } catch (err: any) {
      setError(err.response?.data?.message || '创建失败，请重试')
    }
  }
  
  if (orgLoading) {
    return <LoadingView />
  }

  if (organizations.length === 0) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">创建项目</h1>
          <p className="mt-2 text-foreground-secondary">项目必须归属组织，请先创建或加入一个组织</p>
        </div>
        <div className="bg-surface-elevated rounded-lg shadow p-6 border border-border space-y-4">
          <Button variant="primary" onClick={() => setShowCreateOrgDialog(true)}>
            创建组织
          </Button>
          <Button variant="secondary" onClick={() => navigate(-1)}>
            返回
          </Button>
        </div>
        <CreateOrganizationDialog
          open={showCreateOrgDialog}
          onClose={() => setShowCreateOrgDialog(false)}
          onSuccess={handleCreateOrgSuccess}
        />
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* 页面头部 */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">创建项目</h1>
        <p className="mt-2 text-foreground-secondary">填写项目信息开始使用</p>
      </div>
      
      {/* 创建表单 */}
      <div className="bg-surface-elevated rounded-lg shadow p-6 border border-border">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium mb-1">所属组织 *</label>
            <select
              value={organizationId ?? ''}
              onChange={(e) => {
                const val = e.target.value
                setOrganizationId(val ? Number(val) : null)
              }}
              className="w-full px-3 py-2 border border-border rounded-md bg-surface-elevated text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
              disabled={createProject.isPending}
              required
            >
              <option value="" disabled>请选择组织</option>
              {organizations.map((org) => (
                <option key={org.id} value={org.id}>{org.name}</option>
              ))}
            </select>
          </div>
          {/* 项目名称 */}
          <TextField
            id="name"
            label="项目名称"
            placeholder="例如：待办管理系统"
            value={name}
            onChange={(e) => setName(e.target.value)}
            fullWidth
            required
            helperText="项目的显示名称"
          />
          
          {/* Git 地址 */}
          <TextField
            id="gitUrl"
            label="Git 地址"
            placeholder="https://github.com/username/repo"
            value={gitUrl}
            onChange={(e) => setGitUrl(e.target.value)}
            fullWidth
            required
            helperText="项目的 Git 仓库地址"
          />
          
          {/* 错误提示 */}
          {error && (
            <div className="bg-error-light border border-error rounded-md p-3">
              <p className="text-sm text-error">{error}</p>
            </div>
          )}
          
          {/* 按钮组 */}
          <div className="flex gap-4">
            <Button
              type="submit"
              variant="primary"
              loading={createProject.isPending}
              disabled={createProject.isPending}
            >
              {createProject.isPending ? '创建中...' : '创建项目'}
            </Button>
            
            <Button
              type="button"
              variant="secondary"
              onClick={() => navigate(-1)}
              disabled={createProject.isPending}
            >
              取消
            </Button>
          </div>
        </form>
      </div>
      <CreateOrganizationDialog
        open={showCreateOrgDialog}
        onClose={() => setShowCreateOrgDialog(false)}
        onSuccess={handleCreateOrgSuccess}
      />
    </div>
  )
}


