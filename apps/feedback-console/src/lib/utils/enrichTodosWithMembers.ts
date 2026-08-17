/**
 * 使用项目成员信息丰富待办项的用户信息
 * 当后端API不返回 creator 和 executor 对象时，从成员列表中查找并填充
 */

import type { Todo } from '@/types'
import type { ProjectMember } from '@/types'

/**
 * 从项目成员列表中查找用户信息
 */
function findUserFromMembers(
  userId: number | undefined,
  members: ProjectMember[]
): { username: string; avatar?: string } | null {
  if (!userId || !members || members.length === 0) {
    return null
  }

  const member = members.find((m) => m.user_id === userId)
  if (!member) {
    return null
  }

  // 成员信息可能直接包含 username 和 avatar，或者在 user 对象中
  const username = member.username || member.user?.username
  const avatar = member.avatar || member.user?.avatar

  if (!username) {
    return null
  }

  return {
    username,
    avatar,
  }
}

/**
 * 丰富待办项的用户信息（创建人和执行人）
 * @param todos 待办项列表
 * @param members 项目成员列表
 * @returns 丰富后的待办项列表
 */
export function enrichTodosWithMembers(
  todos: Todo[],
  members: ProjectMember[]
): Todo[] {
  if (!todos || !members || members.length === 0) {
    return todos
  }

  return todos.map((todo) => {
    const enrichedTodo = { ...todo }

    // 如果创建人信息不存在，从成员列表中查找
    if (!enrichedTodo.creator && enrichedTodo.creatorId) {
      const creatorInfo = findUserFromMembers(enrichedTodo.creatorId, members)
      if (creatorInfo) {
        enrichedTodo.creator = {
          id: enrichedTodo.creatorId,
          username: creatorInfo.username,
          avatar: creatorInfo.avatar,
          created_at: '',
          updated_at: '',
        }
      }
    }

    // 如果执行人信息不存在，从成员列表中查找
    if (!enrichedTodo.assignee && enrichedTodo.assigneeId) {
      const executorInfo = findUserFromMembers(enrichedTodo.assigneeId, members)
      if (executorInfo) {
        enrichedTodo.assignee = {
          id: enrichedTodo.assigneeId,
          username: executorInfo.username,
          avatar: executorInfo.avatar,
          created_at: '',
          updated_at: '',
        }
      }
    }

    // 递归处理子任务
    if (enrichedTodo.children && enrichedTodo.children.length > 0) {
      enrichedTodo.children = enrichTodosWithMembers(enrichedTodo.children, members)
    }

    return enrichedTodo
  })
}

