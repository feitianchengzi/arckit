/**
 * Workshop API Draft 回写通道
 * 
 * 实现 runtime closeout 后向 workshop-api 回写草稿的功能
 */

import { createWorkshopPlatformAdapter } from "./workshop-platform-adapter.mjs";

/**
 * 创建 Workshop Draft 回写适配器
 */
export function createWorkshopDraftAdapter({ taskSource, settings }) {
  const platformSource = taskSource.platform;
  
  /**
   * 创建草稿消息
   * @param {Object} params - 参数
   * @param {number} params.projectId - 项目ID
   * @param {number} params.feedbackId - 反馈ID
   * @param {string} params.content - 草稿内容
   * @param {number} [params.taskId] - 关联的任务ID
   * @param {string[]} [params.sourceFiles] - 引用的源文件列表
   * @returns {Promise<Object>} 创建结果
   */
  async function createDraft({ projectId, feedbackId, content, taskId, sourceFiles = [] }) {
    try {
      const response = await taskSource.requestV2(
        `/feedbacks/${feedbackId}/drafts`,
        {
          method: "POST",
          body: {
            content,
            task_id: taskId,
            source_files: sourceFiles,
          },
        }
      );
      
      return {
        success: true,
        messageId: response.data?.message_id,
        state: response.data?.state,
      };
    } catch (error) {
      console.error("[WorkshopDraftAdapter] 创建草稿失败:", error);
      return {
        success: false,
        error: error.message,
      };
    }
  }
  
  /**
   * 确认草稿发送
   * @param {Object} params - 参数
   * @param {number} params.projectId - 项目ID
   * @param {number} params.feedbackId - 反馈ID
   * @param {number} params.messageId - 消息ID
   * @returns {Promise<Object>} 确认结果
   */
  async function confirmDraft({ projectId, feedbackId, messageId }) {
    try {
      const response = await taskSource.requestV2(
        `/feedbacks/${feedbackId}/messages/${messageId}/confirm`,
        {
          method: "POST",
        }
      );
      
      return {
        success: true,
        messageId: response.data?.message_id,
        state: response.data?.state,
      };
    } catch (error) {
      console.error("[WorkshopDraftAdapter] 确认草稿失败:", error);
      return {
        success: false,
        error: error.message,
      };
    }
  }
  
  /**
   * 驳回草稿
   * @param {Object} params - 参数
   * @param {number} params.projectId - 项目ID
   * @param {number} params.feedbackId - 反馈ID
   * @param {number} params.messageId - 消息ID
   * @returns {Promise<Object>} 驳回结果
   */
  async function rejectDraft({ projectId, feedbackId, messageId }) {
    try {
      const response = await taskSource.requestV2(
        `/feedbacks/${feedbackId}/messages/${messageId}/reject`,
        {
          method: "POST",
        }
      );
      
      return {
        success: true,
        messageId: response.data?.message_id,
        status: response.data?.status,
      };
    } catch (error) {
      console.error("[WorkshopDraftAdapter] 驳回草稿失败:", error);
      return {
        success: false,
        error: error.message,
      };
    }
  }
  
  /**
   * 从 closeout 结果创建草稿
   * @param {Object} params - 参数
   * @param {Object} params.closeoutResult - closeout 结果
   * @param {number} params.projectId - 项目ID
   * @param {number} params.feedbackId - 反馈ID
   * @param {number} params.taskId - 任务ID
   * @returns {Promise<Object>} 创建结果
   */
  async function createDraftFromCloseout({ closeoutResult, projectId, feedbackId, taskId }) {
    // 从 closeout 结果中提取进展内容
    const progressContent = extractProgressFromCloseout(closeoutResult);
    
    if (!progressContent) {
      return {
        success: false,
        error: "无法从 closeout 结果中提取进展内容",
      };
    }
    
    // 提取引用的源文件
    const sourceFiles = extractSourceFilesFromCloseout(closeoutResult);
    
    return createDraft({
      projectId,
      feedbackId,
      content: progressContent,
      taskId,
      sourceFiles,
    });
  }
  
  /**
   * 从 closeout 结果中提取进展内容
   */
  function extractProgressFromCloseout(closeoutResult) {
    if (!closeoutResult) {
      return null;
    }
    
    // 尝试从不同字段提取内容
    const content = closeoutResult.summary 
      || closeoutResult.description 
      || closeoutResult.progress
      || closeoutResult.output;
    
    if (typeof content === "string") {
      return content;
    }
    
    if (typeof content === "object" && content !== null) {
      return JSON.stringify(content, null, 2);
    }
    
    return null;
  }
  
  /**
   * 从 closeout 结果中提取引用的源文件
   */
  function extractSourceFilesFromCloseout(closeoutResult) {
    if (!closeoutResult) {
      return [];
    }
    
    const sourceFiles = [];
    
    // 尝试从不同字段提取文件引用
    if (Array.isArray(closeoutResult.files)) {
      sourceFiles.push(...closeoutResult.files);
    }
    
    if (Array.isArray(closeoutResult.modified_files)) {
      sourceFiles.push(...closeoutResult.modified_files);
    }
    
    if (Array.isArray(closeoutResult.changes)) {
      for (const change of closeoutResult.changes) {
        if (change.file) {
          sourceFiles.push(change.file);
        }
      }
    }
    
    return [...new Set(sourceFiles)]; // 去重
  }
  
  return {
    createDraft,
    confirmDraft,
    rejectDraft,
    createDraftFromCloseout,
  };
}
