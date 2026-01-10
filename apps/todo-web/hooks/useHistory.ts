/**
 * useHistory - 任务历史 Hook
 */

import { useQuery } from '@tanstack/react-query'
import { taskHistoryApi } from '@/lib/api/endpoints/taskHistory'

/**
 * 获取任务的状态变更历史
 */
export function useTaskHistory(projectId: string, taskId: string) {
  return useQuery({
    queryKey: ['projects', projectId, 'tasks', taskId, 'history'],
    queryFn: () => taskHistoryApi.getHistory(projectId, taskId),
    enabled: !!projectId && !!taskId,
    // 如果后端不支持，静默失败
    retry: false,
  })
}

