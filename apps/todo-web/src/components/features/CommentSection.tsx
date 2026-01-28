/**
 * CommentSection - 评论区域主组件
 */

import { useState } from 'react'
import { CommentList } from './CommentList'
import { CommentEditor } from './CommentEditor'
import { useTaskComments, useCreateComment, useUpdateComment, useDeleteComment } from '@/hooks/useTaskComments'
import { buildTextCommentContent } from '@/lib/api/endpoints/comments'
import { permissionManager } from '@/lib/permissions'
import type { TaskInfo, ProjectRole } from '@/lib/permissions'

export interface CommentSectionProps {
  taskId: number
  taskInfo: TaskInfo
  members?: any[]
  currentUserId: number | null
  currentUserRole: ProjectRole | null
  isProjectMember: boolean
  projectId?: string // 项目ID，用于@提及功能
}

export function CommentSection({
  taskId,
  taskInfo,
  members = [],
  currentUserId,
  currentUserRole,
  isProjectMember,
  projectId,
}: CommentSectionProps) {
  const { data: comments = [], isLoading } = useTaskComments(taskId)
  const createComment = useCreateComment(taskId)
  const updateComment = useUpdateComment(taskId)
  const deleteComment = useDeleteComment(taskId)
  
  const [deletingCommentId, setDeletingCommentId] = useState<number | null>(null)

  // 权限检查
  const canCreateComment = permissionManager.task.hasCreateCommentPermission(isProjectMember)

  // 按时间倒序排列（最新的在上）
  const sortedComments = [...comments].sort((a, b) => {
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  })

  const handleCreate = async (data: { content: string; imageKeys: string[]; fileKeys: string[] }) => {
    await createComment.mutateAsync({ content: data.content, type: 'text' })
  }

  const handleEdit = async (commentId: number, content: string) => {
    await updateComment.mutateAsync({ commentId, input: { content } })
  }

  const handleDelete = async (commentId: number) => {
    setDeletingCommentId(commentId)
    try {
      await deleteComment.mutateAsync(commentId)
    } finally {
      setDeletingCommentId(null)
    }
  }

  return (
    <div className="space-y-4">
      {/* 评论列表 */}
      <CommentList
        comments={sortedComments}
        members={members}
        currentUserId={currentUserId}
        taskInfo={taskInfo}
        currentUserRole={currentUserRole}
        onEdit={handleEdit}
        onDelete={handleDelete}
        isLoading={isLoading}
        isDeleting={deletingCommentId}
      />

      {/* 分隔线 */}
      {canCreateComment && (
        <div className="border-t border-border my-4" />
      )}

      {/* 评论输入框 - 默认展示 */}
      {canCreateComment && (
        <CommentEditor
          onSubmit={handleCreate}
          onCancel={() => {
            // 取消时清空内容，但不隐藏编辑器
          }}
          isLoading={createComment.isPending}
          members={members}
          projectId={projectId}
        />
      )}
    </div>
  )
}
