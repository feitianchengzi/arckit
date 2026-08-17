/**
 * CommentSection - 评论区域主组件
 */

import { useState, useRef, useEffect } from 'react'
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
  onCommentAdded?: () => void // 评论添加后的回调
}

export function CommentSection({
  taskId,
  taskInfo,
  members = [],
  currentUserId,
  currentUserRole,
  isProjectMember,
  projectId,
  onCommentAdded,
}: CommentSectionProps) {
  const { data: comments = [], isLoading } = useTaskComments(taskId)
  const createComment = useCreateComment(taskId)
  const updateComment = useUpdateComment(taskId)
  const deleteComment = useDeleteComment(taskId)
  
  const [deletingCommentId, setDeletingCommentId] = useState<number | null>(null)
  const commentListRef = useRef<HTMLDivElement>(null)
  const [shouldScrollToTop, setShouldScrollToTop] = useState(false)
  const prevCommentsLengthRef = useRef(comments.length)

  // 监听评论数量变化，如果需要滚动则执行
  useEffect(() => {
    // 只有当评论数量增加且标记为需要滚动时才滚动
    if (shouldScrollToTop && comments.length > prevCommentsLengthRef.current) {
      if (onCommentAdded) {
        // 如果提供了外部滚动回调，使用外部回调
        onCommentAdded()
        setShouldScrollToTop(false)
      } else if (commentListRef.current) {
        // 否则使用内部滚动逻辑
        setTimeout(() => {
          commentListRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
          setShouldScrollToTop(false) // 重置标记
        }, 100)
      }
    }
    prevCommentsLengthRef.current = comments.length
  }, [comments.length, shouldScrollToTop, onCommentAdded])

  // 权限检查
  const canCreateComment = permissionManager.task.hasCreateCommentPermission(isProjectMember)

  // 按时间倒序排列（最新的在上）
  const sortedComments = [...comments].sort((a, b) => {
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  })

  const handleCreate = async (data: { content: string; imageKeys: string[]; fileKeys: string[] }) => {
    // 标记需要滚动
    setShouldScrollToTop(true)
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
      <div ref={commentListRef}>
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
      </div>

      {/* 分隔线 */}
      {canCreateComment && (
        <div className="border-t border-border my-4" />
      )}

      {/* 评论输入框 - 吸底展示 */}
      {canCreateComment && (
        <div className="sticky bottom-0 z-10 bg-surface pt-4 pb-2 border-t border-border/50 shadow-[0_-4px_10px_rgba(0,0,0,0.05)] -mx-6 -mb-6 px-6">
          <CommentEditor
            onSubmit={handleCreate}
            onCancel={() => {
              // 取消时清空内容，但不隐藏编辑器
            }}
            isLoading={createComment.isPending}
            members={members}
            projectId={projectId}
          />
        </div>
      )}
    </div>
  )
}
