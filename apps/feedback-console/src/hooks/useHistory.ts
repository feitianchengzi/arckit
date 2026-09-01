/**
 * useHistory - 任务历史 Hook
 */

import { useQuery } from '@tanstack/react-query'
import { taskHistoryApi } from '@/lib/api/endpoints/taskHistory'

/**
 * 获取任务的状态变更历史
 * 注意：根据 API 文档，后端暂无此接口，功能已禁用
 */
export function useTaskHistory(projectId: string, taskId: string) {
  return useQuery({
    queryKey: ['projects', projectId, 'tasks', taskId, 'history'],
    queryFn: async () => {
      // API 文档中暂无此接口，返回空数组
      return []
    },
    // 根据 API 文档，后端暂无此接口，禁用查询
    enabled: false,
    retry: false,
    throwOnError: false,
  })
}

