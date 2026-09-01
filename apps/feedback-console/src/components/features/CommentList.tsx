/**
 * CommentList - 评论列表组件
 */

import { CommentItem } from './CommentItem'
import { LoadingView, EmptyStateView } from '@/components/ui'
import { permissionManager } from '@/lib/permissions'
import type { TaskComment } from '@/lib/api/endpoints/comments'
import type { TaskInfo, ProjectRole } from '@/lib/permissions'

export interface CommentListProps {
  comments: TaskComment[]
  members?: any[]
  currentUserId: number | null
  taskInfo: TaskInfo
  currentUserRole: ProjectRole | null
  onEdit: (commentId: number, content: string) => Promise<void>
  onDelete: (commentId: number) => Promise<void>
  isLoading?: boolean
  isDeleting?: number | null // 正在删除的评论ID
}

export function CommentList({
  comments,
  members = [],
  currentUserId,
  taskInfo,
  currentUserRole,
  onEdit,
  onDelete,
  isLoading = false,
  isDeleting = null,
}: CommentListProps) {
  if (isLoading) {
    return <LoadingView size="sm" text="加载评论中..." />
  }

  if (comments.length === 0) {
    return (
      <EmptyStateView
        title="暂无评论"
        message="成为第一个评论的人吧"
      />
    )
  }

  return (
    <div className="space-y-0">
      {comments.map((comment) => {
        // 查找评论创建者信息
        const creatorInfo = Array.isArray(members)
          ? members.find((m: any) => m.user_id === comment.creator_id)
          : undefined
        
        const creatorUsername = creatorInfo?.username || creatorInfo?.user?.username || '未知用户'
        const creatorAvatar = creatorInfo?.avatar || creatorInfo?.user?.avatar

        // 使用权限管理器检查权限
        // 暂时禁用编辑功能
        const canEdit = false // permissionManager.task.hasEditCommentPermission(
          // comment.creator_id,
          // currentUserId
        // )
        const canDelete = permissionManager.task.hasDeleteCommentPermission(
          comment.creator_id,
          taskInfo,
          currentUserRole,
          currentUserId
        )

        return (
          <CommentItem
            key={comment.id}
            comment={comment}
            creatorInfo={{
              username: creatorUsername,
              avatar: creatorAvatar,
            }}
            canEdit={canEdit}
            canDelete={canDelete}
            onEdit={onEdit}
            onDelete={onDelete}
            isDeleting={isDeleting === comment.id}
          />
        )
      })}
    </div>
  )
}
