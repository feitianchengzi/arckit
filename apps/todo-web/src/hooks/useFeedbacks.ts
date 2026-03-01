/**
 * useFeedbacks - 反馈相关 Hook
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { feedbacksApi, type CreateFeedbackInput, type FeedbackListOptions, type UpdateFeedbackInput } from '@/lib/api/endpoints/feedbacks'
import { useAuthStore } from '@/store/authStore'

/**
 * 创建反馈
 */
export function useCreateFeedback() {
  return useMutation({
    mutationFn: (input: CreateFeedbackInput) => feedbacksApi.create(input),
  })
}

/**
 * 获取反馈列表
 */
export function useFeedbackList(
  projectId: string | number,
  options?: FeedbackListOptions & { enabled?: boolean }
) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const { enabled, ...apiOptions } = options ?? {}
  const page = options?.page ?? 1
  const pageSize = options?.pageSize ?? 50
  
  return useQuery({
    queryKey: ['projects', projectId, 'feedbacks', page, pageSize, options?.includeDeleted ?? false],
    queryFn: () =>
      feedbacksApi.listByProject(projectId, {
        ...apiOptions,
        page,
        pageSize,
      }),
    enabled: !!projectId && isAuthenticated && (enabled ?? true),
  })
}

/**
 * 更新反馈
 */
export function useUpdateFeedback(projectId: string | number) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, input }: { id: number; input: UpdateFeedbackInput }) => feedbacksApi.update(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects', projectId, 'feedbacks'] })
    },
  })
}
