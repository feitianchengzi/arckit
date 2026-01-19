
/**
 * 创建待办页面（客户端组件）
 */

import { useState, useEffect } from 'react'
import { useParams, useSearchParams, useNavigate } from 'react-router-dom'
import clsx from 'clsx'
import { Button } from '@/components/ui'
import { useCreateTask, useTaskList } from '@/hooks/useTasks'
import { useProject, useProjectMembers } from '@/hooks/useProjects'

export default function NewTaskPage() {
  const navigate = useNavigate()
  const params = useParams()
  const [searchParams] = useSearchParams()
  const projectId = Number(params.id!)
  
  const { data: project } = useProject(String(projectId))
  const { data: tasks } = useTaskList(String(projectId))
  const { data: members } = useProjectMembers(String(projectId))
  const createTask = useCreateTask(String(projectId))
  
  // 从 URL 查询参数获取父任务 ID
  const parentIdFromUrl = searchParams.get('parentId')
  
  const [content, setContent] = useState('')
  const [parentId, setParentId] = useState<number | undefined>(
    parentIdFromUrl ? parseInt(parentIdFromUrl) : undefined
  )
  const [assigneeId, setAssigneeId] = useState<number | undefined>(undefined)
  const [error, setError] = useState('')
  
  // 如果从 URL 获取了 parentId，设置为选中状态
  useEffect(() => {
    if (parentIdFromUrl) {
      setParentId(parseInt(parentIdFromUrl))
    }
  }, [parentIdFromUrl])
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    
      // 验证
      if (!content.trim()) {
        setError('请输入待办内容')
        return
      }
      
      // 创建待办
    try {
      const newTask = await createTask.mutateAsync({
        content: content.trim(),
        projectId: parseInt(projectId),
        parentId: parentId,
        assigneeId: assigneeId,
      })
      
      // 创建成功后跳转到待办详情页
      // 使用 replace: true 替换当前历史记录，避免点击返回时回到创建页面
      navigate(`/projects/${projectId}/tasks/${newTask.id}`, { replace: true })
    } catch (err: any) {
      setError(err.response?.data?.message || '创建失败，请重试')
    }
  }
  
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* 页面头部 */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">创建待办</h1>
        {project && (
          <p className="mt-2 text-gray-600">项目：{project.name}</p>
        )}
      </div>
      
      {/* 创建表单 */}
      <div className="bg-white rounded-lg shadow p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 父待办选择（可选） */}
          {tasks && tasks.length > 0 && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                父待办（可选）
              </label>
              <select
                value={parentId || ''}
                onChange={(e) => setParentId(e.target.value ? parseInt(e.target.value) : undefined)}
                className={clsx(
                  'w-full px-3 py-2 text-base',
                  'border border-gray-300 rounded-md',
                  'focus:border-primary focus:ring-2 focus:ring-primary focus:ring-opacity-50',
                  'transition-colors',
                  'bg-white'
                )}
              >
                <option value="">无（创建独立待办）</option>
                {tasks.map((task) => (
                  <option key={task.id} value={task.id}>
                    {task.title}
                  </option>
                ))}
              </select>
              <p className="text-sm text-gray-500">
                选择父待办后，此待办将作为子待办创建
              </p>
            </div>
          )}

          {/* 分配给成员（可选） */}
          {members && members.length > 0 && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                分配给成员（可选）
              </label>
              <select
                value={assigneeId || ''}
                onChange={(e) => setAssigneeId(e.target.value ? parseInt(e.target.value) : undefined)}
                className={clsx(
                  'w-full px-3 py-2 text-base',
                  'border border-gray-300 rounded-md',
                  'focus:border-primary focus:ring-2 focus:ring-primary focus:ring-opacity-50',
                  'transition-colors',
                  'bg-white'
                )}
              >
                <option value="">无（不分配）</option>
                {members.map((member: any) => (
                  <option key={member.user_id} value={member.user_id}>
                    {member.username || member.user?.username || '未知用户'}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* 待办内容 */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
              待办内容 <span className="text-error">*</span>
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="请输入待办内容..."
              rows={6}
              className={clsx(
                'w-full px-3 py-2 text-base',
                'border border-gray-300 rounded-md',
                'focus:border-primary focus:ring-2 focus:ring-primary focus:ring-opacity-50',
                'transition-colors',
                'placeholder:text-gray-400'
              )}
              required
            />
            <p className="text-sm text-gray-500">
              支持多行文本，前 50 个字符将作为待办标题
            </p>
          </div>
          
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
              loading={createTask.isPending}
              disabled={createTask.isPending}
            >
              {createTask.isPending ? '创建中...' : '创建待办'}
            </Button>
            
            <Button
              type="button"
              variant="secondary"
              onClick={() => navigate(-1)}
              disabled={createTask.isPending}
            >
              取消
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

