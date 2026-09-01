/**
 * 任务评论相关 Hooks
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { commentsApi, type CreateCommentInput, type UpdateCommentInput } from '@/lib/api/endpoints/comments'

/**
 * 获取任务的评论列表
 */
export function useTaskComments(taskId: number) {
  return useQuery({
    queryKey: ['tasks', taskId, 'comments'],
    queryFn: () => commentsApi.listByTask(taskId),
    enabled: !!taskId,
  })
}

/**
 * 创建评论
 */
export function useCreateComment(taskId: number) {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (input: Omit<CreateCommentInput, 'task_id'>) => 
      commentsApi.create({ ...input, task_id: taskId }),
    onSuccess: () => {
      // 刷新评论列表
      queryClient.invalidateQueries({ queryKey: ['tasks', taskId, 'comments'] })
    },
  })
}

/**
 * 更新评论
 */
export function useUpdateComment(taskId: number) {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ commentId, input }: { commentId: number; input: UpdateCommentInput }) =>
      commentsApi.update(commentId, input),
    onSuccess: () => {
      // 刷新评论列表
      queryClient.invalidateQueries({ queryKey: ['tasks', taskId, 'comments'] })
    },
  })
}

/**
 * 删除评论
 */
export function useDeleteComment(taskId: number) {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (commentId: number) => commentsApi.delete(commentId),
    onSuccess: () => {
      // 刷新评论列表
      queryClient.invalidateQueries({ queryKey: ['tasks', taskId, 'comments'] })
    },
  })
}
