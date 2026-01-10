'use client'

/**
 * 创建项目页面
 */

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button, TextField } from '@/components/ui'
import { useCreateProject } from '@/hooks/useProjects'

export default function NewProjectPage() {
  const router = useRouter()
  const createProject = useCreateProject()
  
  const [name, setName] = useState('')
  const [gitUrl, setGitUrl] = useState('')
  const [error, setError] = useState('')
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    
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
      })
    } catch (err: any) {
      setError(err.response?.data?.message || '创建失败，请重试')
    }
  }
  
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* 页面头部 */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">创建项目</h1>
        <p className="mt-2 text-gray-600">填写项目信息开始使用</p>
      </div>
      
      {/* 创建表单 */}
      <div className="bg-white rounded-lg shadow p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
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
              onClick={() => router.back()}
              disabled={createProject.isPending}
            >
              取消
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

