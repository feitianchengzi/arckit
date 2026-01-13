/**
 * taskHistory API - 任务历史接口
 * 
 * 注意：后端可能尚未实现任务历史功能
 * 此文件为前端接口定义，后端支持后可对接
 */

import { apiClient } from '../client'
import { handleResponse } from '../interceptors/response'
import type { TaskHistory } from '@/types'

export const taskHistoryApi = {
  /**
   * 获取任务的状态变更历史
   * 如果后端不支持，此方法会返回空数组
   */
  getHistory: async (projectId: string, taskId: string): Promise<TaskHistory[]> => {
    try {
      const response = await apiClient.get(
        `/user/projects/${projectId}/tasks/${taskId}/history`
      )
      // 使用 handleResponse 统一处理响应格式: {code: 'OK', data: TaskHistory[]}
      return handleResponse<TaskHistory[]>(response)
    } catch (error: any) {
      // 如果后端不支持（404），静默返回空数组（不输出错误日志）
      if (error.response?.status === 404) {
        // 任务历史功能可能尚未实现，静默处理
        return []
      }
      // 其他错误，抛出
      throw error
    }
  },
}

