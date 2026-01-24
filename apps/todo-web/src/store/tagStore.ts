/**
 * 标签系统统一状态管理
 * 管理项目标签数组，提供统一的访问和更新接口
 */

import { create } from 'zustand'
import { tagsApi, type Tag } from '@/lib/api/endpoints/tags'
import { transformTagFromAPI, type ProjectTag } from '@/lib/utils/tagUtils'

interface TagState {
  // 项目标签数组，key为projectId
  projectTagsMap: Record<string, ProjectTag[]>
  
  // Actions
  loadProjectTags: (projectId: string) => Promise<void>
  addTag: (projectId: string, tag: Tag) => void
  updateTag: (projectId: string, tagId: number, tag: Tag) => void
  deleteTag: (projectId: string, tagId: number) => void
  getProjectTags: (projectId: string) => ProjectTag[]
  clearProjectTags: (projectId: string) => void
}

export const useTagStore = create<TagState>((set, get) => ({
  // 初始状态
  projectTagsMap: {},
  
  /**
   * 加载项目标签列表
   */
  loadProjectTags: async (projectId: string) => {
    try {
      const tags = await tagsApi.listByProject(projectId)
      const projectTags = tags.map(transformTagFromAPI)
      
      set((state) => ({
        projectTagsMap: {
          ...state.projectTagsMap,
          [projectId]: projectTags,
        },
      }))
    } catch (error) {
      console.error('加载项目标签失败:', error)
      throw error
    }
  },
  
  /**
   * 添加标签（创建后调用）
   */
  addTag: (projectId: string, tag: Tag) => {
    const projectTag = transformTagFromAPI(tag)
    
    set((state) => {
      const currentTags = state.projectTagsMap[projectId] || []
      return {
        projectTagsMap: {
          ...state.projectTagsMap,
          [projectId]: [...currentTags, projectTag],
        },
      }
    })
  },
  
  /**
   * 更新标签
   */
  updateTag: (projectId: string, tagId: number, tag: Tag) => {
    const projectTag = transformTagFromAPI(tag)
    
    set((state) => {
      const currentTags = state.projectTagsMap[projectId] || []
      return {
        projectTagsMap: {
          ...state.projectTagsMap,
          [projectId]: currentTags.map(t => 
            t.id === tagId ? projectTag : t
          ),
        },
      }
    })
  },
  
  /**
   * 删除标签
   */
  deleteTag: (projectId: string, tagId: number) => {
    set((state) => {
      const currentTags = state.projectTagsMap[projectId] || []
      return {
        projectTagsMap: {
          ...state.projectTagsMap,
          [projectId]: currentTags.filter(t => t.id !== tagId),
        },
      }
    })
  },
  
  /**
   * 获取项目标签列表
   */
  getProjectTags: (projectId: string) => {
    return get().projectTagsMap[projectId] || []
  },
  
  /**
   * 清除项目标签（切换项目时调用）
   */
  clearProjectTags: (projectId: string) => {
    set((state) => {
      const newMap = { ...state.projectTagsMap }
      delete newMap[projectId]
      return {
        projectTagsMap: newMap,
      }
    })
  },
}))


