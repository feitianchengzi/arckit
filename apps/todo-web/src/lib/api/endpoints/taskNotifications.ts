import { apiClient } from '../client'
import { handleResponse } from '../interceptors/response'

export interface TaskNotificationPreference {
  project_id: number
  email_enabled: boolean
  notify_assigned_to_me: boolean
  notify_assignee_changed: boolean
  notify_task_created: boolean
  notify_status_changed: boolean
  notify_priority_changed: boolean
  notify_content_changed: boolean
  notify_tags_changed: boolean
  delivery_available: boolean
}

export type UpdateTaskNotificationPreference = Omit<
  TaskNotificationPreference,
  'project_id' | 'delivery_available'
>

export const taskNotificationsApi = {
  getPreference: async (projectId: number): Promise<TaskNotificationPreference> => {
    const response = await apiClient.get('/user/task-notification-preference', {
      params: { project_id: projectId },
    })
    return handleResponse<TaskNotificationPreference>(response)
  },

  updatePreference: async (
    projectId: number,
    preference: UpdateTaskNotificationPreference
  ): Promise<TaskNotificationPreference> => {
    const response = await apiClient.put('/user/task-notification-preference', preference, {
      params: { project_id: projectId },
    })
    return handleResponse<TaskNotificationPreference>(response)
  },
}
