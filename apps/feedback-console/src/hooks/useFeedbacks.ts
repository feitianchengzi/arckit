/**
 * useFeedbacks - 反馈相关 Hook
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { feedbacksApi, type CreateFeedbackInput, type FeedbackListOptions, type UpdateFeedbackInput } from '@/lib/api/endpoints/feedbacks'
import { feedbackV2Client, isFeedbackV2ProjectEnabled } from '@/lib/api/feedbackV2Client'
import { useAuthStore } from '@/store/authStore'

/**
 * 创建反馈
 */
export function useCreateFeedback() {
  return useMutation({
    mutationFn: (input: CreateFeedbackInput) =>
      isFeedbackV2ProjectEnabled(input.projectId) ? feedbackV2Client.create(input) : feedbacksApi.create(input),
  })
}

/**
 * 获取反馈列表
 */
export function useFeedbackList(
  projectId: string | number,
  options?: FeedbackListOptions & {
    enabled?: boolean
    refetchInterval?: number | false
    refetchOnWindowFocus?: boolean
  }
) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const { enabled, refetchInterval, refetchOnWindowFocus, ...apiOptions } = options ?? {}
  const page = options?.page ?? 1
  const pageSize = options?.pageSize ?? 50
  const useV2 = isFeedbackV2ProjectEnabled(projectId)
  
  return useQuery({
    queryKey: ['projects', projectId, 'feedbacks', useV2 ? 'v2' : 'v1', page, pageSize, options?.includeDeleted ?? false],
    queryFn: () =>
      (useV2 ? feedbackV2Client : feedbacksApi).listByProject(projectId, {
        ...apiOptions,
        page,
        pageSize,
    }),
    enabled: !!projectId && isAuthenticated && (enabled ?? true),
    refetchInterval,
    refetchIntervalInBackground: false,
    refetchOnWindowFocus,
  })
}

/**
 * 更新反馈
 */
export function useUpdateFeedback(projectId: string | number) {
  const queryClient = useQueryClient()
  const useV2 = isFeedbackV2ProjectEnabled(projectId)

  return useMutation({
    mutationFn: ({ id, input }: { id: number; input: UpdateFeedbackInput }) =>
      (useV2 ? feedbackV2Client : feedbacksApi).update(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects', projectId, 'feedbacks'] })
    },
  })
}

/**
 * 删除反馈
 */
export function useDeleteFeedback(projectId: string | number) {
  const queryClient = useQueryClient()
  const useV2 = isFeedbackV2ProjectEnabled(projectId)

  return useMutation({
    mutationFn: (id: number) => (useV2 ? feedbackV2Client : feedbacksApi).remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects', projectId, 'feedbacks'] })
    },
  })
}
