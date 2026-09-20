/**
 * 草稿确认面板组件
 * 
 * 用于处理人确认/驳回草稿的UI组件
 */

/**
 * 创建草稿确认面板
 */
export function createDraftConfirmPanel({ api, state, renderPlatformFeedback }) {
  /**
   * 渲染草稿确认面板
   * @param {Object} feedback - 反馈对象
   * @param {Object} message - 草稿消息
   * @returns {string} HTML 字符串
   */
  function renderDraftConfirmPanel(feedback, message) {
    if (!feedback || !message) {
      return '';
    }

    const metadata = parseMetadata(message.metadata);
    const sourceFiles = metadata?.source_files || [];

    return `
      <div class="draft-confirm-panel" data-message-id="${message.id}">
        <div class="draft-confirm-header">
          <span class="draft-confirm-title">草稿确认</span>
          <span class="draft-confirm-status">${message.state === 'pending_review' ? '待确认' : '已发送'}</span>
        </div>
        
        <div class="draft-confirm-content">
          <div class="draft-confirm-original">
            <div class="draft-confirm-label">客户原始问题</div>
            <div class="draft-confirm-text">${escapeHtml(feedback.content || '')}</div>
          </div>
          
          <div class="draft-confirm-reply">
            <div class="draft-confirm-label">草稿回复</div>
            <textarea class="draft-confirm-textarea" data-draft-content>${escapeHtml(message.content || '')}</textarea>
          </div>
          
          ${sourceFiles.length > 0 ? `
            <div class="draft-confirm-sources">
              <div class="draft-confirm-label">引用的源文件</div>
              <ul class="draft-confirm-source-list">
                ${sourceFiles.map(file => `
                  <li class="draft-confirm-source-item">${escapeHtml(file)}</li>
                `).join('')}
              </ul>
            </div>
          ` : ''}
        </div>
        
        <div class="draft-confirm-actions">
          ${message.state === 'pending_review' ? `
            <button class="draft-confirm-btn draft-confirm-approve" data-action="confirm" data-message-id="${message.id}">
              批准发送
            </button>
            <button class="draft-confirm-btn draft-confirm-reject" data-action="reject" data-message-id="${message.id}">
              驳回重试
            </button>
            <button class="draft-confirm-btn draft-confirm-manual" data-action="manual">
              转人工回复
            </button>
          ` : `
            <span class="draft-confirm-sent">已发送</span>
          `}
        </div>
      </div>
    `;
  }

  /**
   * 渲染草稿列表（待确认的草稿）
   * @param {Array} drafts - 草稿消息列表
   * @param {Object} feedback - 反馈对象
   * @returns {string} HTML 字符串
   */
  function renderDraftList(drafts, feedback) {
    if (!drafts || drafts.length === 0) {
      return '';
    }

    return `
      <div class="draft-list">
        <div class="draft-list-header">
          <span class="draft-list-title">待确认草稿 (${drafts.length})</span>
        </div>
        <div class="draft-list-content">
          ${drafts.map(draft => renderDraftConfirmPanel(feedback, draft)).join('')}
        </div>
      </div>
    `;
  }

  /**
   * 绑定草稿确认事件
   * @param {HTMLElement} container - 容器元素
   */
  function bindDraftConfirmEvents(container) {
    if (!container) return;

    // 批准发送按钮
    container.querySelectorAll('[data-action="confirm"]').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.preventDefault();
        const messageId = btn.dataset.messageId;
        const textarea = container.querySelector(`[data-draft-content]`);
        const content = textarea?.value || '';
        
        await handleConfirmDraft(messageId, content);
      });
    });

    // 驳回重试按钮
    container.querySelectorAll('[data-action="reject"]').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.preventDefault();
        const messageId = btn.dataset.messageId;
        
        await handleRejectDraft(messageId);
      });
    });

    // 转人工回复按钮
    container.querySelectorAll('[data-action="manual"]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        handleManualReply();
      });
    });
  }

  /**
   * 处理确认草稿
   */
  async function handleConfirmDraft(messageId, content) {
    try {
      const feedbackId = state.selectedFeedbackId;
      if (!feedbackId) {
        console.error('[DraftConfirmPanel] 未选中反馈');
        return;
      }

      // 调用 API 确认草稿
      await api.confirmFeedbackDraft({
        projectId: state.platform?.active_workset_id,
        feedbackId,
        messageId,
        content,
      });

      // 刷新反馈对话
      if (renderPlatformFeedback) {
        renderPlatformFeedback();
      }

      console.log(`[DraftConfirmPanel] 草稿已确认发送: ${messageId}`);
    } catch (error) {
      console.error(`[DraftConfirmPanel] 确认草稿失败:`, error);
    }
  }

  /**
   * 处理驳回草稿
   */
  async function handleRejectDraft(messageId) {
    try {
      const feedbackId = state.selectedFeedbackId;
      if (!feedbackId) {
        console.error('[DraftConfirmPanel] 未选中反馈');
        return;
      }

      // 调用 API 驳回草稿
      await api.rejectFeedbackDraft({
        projectId: state.platform?.active_workset_id,
        feedbackId,
        messageId,
      });

      // 刷新反馈对话
      if (renderPlatformFeedback) {
        renderPlatformFeedback();
      }

      console.log(`[DraftConfirmPanel] 草稿已驳回: ${messageId}`);
    } catch (error) {
      console.error(`[DraftConfirmPanel] 驳回草稿失败:`, error);
    }
  }

  /**
   * 处理转人工回复
   */
  function handleManualReply() {
    // 切换到人工回复模式
    const textarea = document.querySelector('[data-feedback-reply]');
    if (textarea) {
      textarea.focus();
      textarea.placeholder = '请输入回复内容...';
    }
  }

  /**
   * 解析 metadata
   */
  function parseMetadata(metadata) {
    if (!metadata) return null;
    if (typeof metadata === 'string') {
      try {
        return JSON.parse(metadata);
      } catch {
        return null;
      }
    }
    return metadata;
  }

  /**
   * HTML 转义
   */
  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  return {
    renderDraftConfirmPanel,
    renderDraftList,
    bindDraftConfirmEvents,
  };
}
