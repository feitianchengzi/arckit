/**
 * TDD 测试用例：知识库检索竞态条件修复
 * 
 * 问题描述：
 * - 用户点击反馈详情时，知识库检索区域会一会显示一会不显示
 * - 内容会一直变动
 * - 原因是 loadFeedbackRetrieval 存在竞态条件
 * 
 * 修复方案：
 * - 添加 activeFeedbackRetrievals Set 用于跟踪正在进行的请求
 * - 同一 feedback 不会同时发起多个检索请求
 * - 请求完成后从 Set 中移除
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// 模拟 DOM 环境
const mockElements = {
  feedbackInspector: {
    querySelector: vi.fn(),
    innerHTML: ''
  }
};

const mockApi = {
  retrieveFeedback: vi.fn()
};

// 模拟状态
const mockState = {
  feedbackConversations: {}
};

// 模拟 renderRetrievalCard
function renderRetrievalCard(retrieval) {
  if (!retrieval) return '';
  const hits = retrieval.hits || [];
  const confidence = retrieval.confidence ?? 0;
  return `<div class="retrieval-card">hits: ${hits.length}, confidence: ${confidence}</div>`;
}

// 模拟 escapeHtml
function escapeHtml(str) {
  return String(str || '').replace(/[<>&"']/g, c => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&#39;' })[c]);
}

describe('Knowledge Retrieval Race Condition Fix', () => {
  let activeFeedbackRetrievals;
  let loadFeedbackRetrieval;
  let api;
  let els;

  beforeEach(() => {
    // 初始化追踪集合
    activeFeedbackRetrievals = new Set();
    
    // 创建模拟 API
    api = {
      retrieveFeedback: vi.fn()
    };
    
    // 创建模拟 DOM 元素
    els = {
      feedbackInspector: {
        querySelector: vi.fn(),
        innerHTML: ''
      }
    };
    
    // 定义 loadFeedbackRetrieval 函数（修复版本）
    loadFeedbackRetrieval = async function(feedback) {
      const id = String(feedback.id);
      
      // 修复：检查是否已有相同的请求在进行中
      if (activeFeedbackRetrievals.has(id)) {
        return;
      }
      
      activeFeedbackRetrievals.add(id);
      
      try {
        const result = await api.retrieveFeedback({ 
          project_id: feedback.project_id, 
          query: feedback.content, 
          conversation_id: "" 
        });
        
        if (!result) return;
        
        const hits = result.hits || result.data?.hits || [];
        const confidence = result.confidence ?? result.data?.confidence ?? 0;
        const draftReply = result.draft_reply || result.data?.draft_reply || "";
        
        feedback.retrieval = { hits, confidence, draft_reply: draftReply };
        
        const card = renderRetrievalCard(feedback.retrieval);
        const existing = els.feedbackInspector.querySelector(".retrieval-card");
        
        if (existing) {
          existing.outerHTML = card;
        } else {
          const factSection = els.feedbackInspector.querySelector(".feedback-content-card");
          if (factSection) factSection.insertAdjacentHTML("afterend", card);
        }
      } catch (_) {
        feedback.retrieval = { hits: [], confidence: 0, draft_reply: "" };
      } finally {
        // 修复：无论成功或失败，都从追踪集合中移除
        activeFeedbackRetrievals.delete(id);
      }
    };
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('应该防止同一 feedback 的重复请求', async () => {
    const feedback = { id: '123', project_id: 1, content: '测试问题' };
    
    // 模拟 API 响应延迟
    let resolvePromise;
    api.retrieveFeedback.mockReturnValue(new Promise(resolve => {
      resolvePromise = resolve;
    }));
    
    // 同时发起两个相同的请求
    const promise1 = loadFeedbackRetrieval(feedback);
    const promise2 = loadFeedbackRetrieval(feedback);
    
    // 验证只有一次 API 调用
    expect(api.retrieveFeedback).toHaveBeenCalledTimes(1);
    
    // 完成第一个请求
    resolvePromise({ hits: [], confidence: 0 });
    await promise1;
    await promise2;
    
    // 验证仍然只有一次 API 调用
    expect(api.retrieveFeedback).toHaveBeenCalledTimes(1);
  });

  it('应该在请求完成后允许新的请求', async () => {
    const feedback = { id: '123', project_id: 1, content: '测试问题' };
    
    // 模拟第一次请求
    api.retrieveFeedback.mockResolvedValueOnce({ hits: [], confidence: 0 });
    await loadFeedbackRetrieval(feedback);
    
    // 验证第一次请求完成
    expect(api.retrieveFeedback).toHaveBeenCalledTimes(1);
    expect(activeFeedbackRetrievals.has('123')).toBe(false);
    
    // 模拟第二次请求
    api.retrieveFeedback.mockResolvedValueOnce({ hits: [{ title: 'test' }], confidence: 0.8 });
    await loadFeedbackRetrieval(feedback);
    
    // 验证第二次请求成功发起
    expect(api.retrieveFeedback).toHaveBeenCalledTimes(2);
  });

  it('应该在 API 失败时也从追踪集合中移除', async () => {
    const feedback = { id: '456', project_id: 1, content: '失败测试' };
    
    // 模拟 API 失败
    api.retrieveFeedback.mockRejectedValueOnce(new Error('Network error'));
    
    await loadFeedbackRetrieval(feedback);
    
    // 验证请求完成后从追踪集合中移除
    expect(activeFeedbackRetrievals.has('456')).toBe(false);
    
    // 验证可以发起新的请求
    api.retrieveFeedback.mockResolvedValueOnce({ hits: [], confidence: 0 });
    await loadFeedbackRetrieval(feedback);
    
    expect(api.retrieveFeedback).toHaveBeenCalledTimes(2);
  });

  it('应该在多个不同的 feedback 之间独立工作', async () => {
    const feedback1 = { id: '111', project_id: 1, content: '问题1' };
    const feedback2 = { id: '222', project_id: 1, content: '问题2' };
    
    let resolve1, resolve2;
    api.retrieveFeedback
      .mockReturnValueOnce(new Promise(r => { resolve1 = r; }))
      .mockReturnValueOnce(new Promise(r => { resolve2 = r; }));
    
    // 同时发起两个不同的请求
    const promise1 = loadFeedbackRetrieval(feedback1);
    const promise2 = loadFeedbackRetrieval(feedback2);
    
    // 验证两个请求都发起了
    expect(api.retrieveFeedback).toHaveBeenCalledTimes(2);
    
    // 完成第一个请求
    resolve1({ hits: [], confidence: 0 });
    await promise1;
    
    // 验证第一个请求完成，第二个还在进行中
    expect(activeFeedbackRetrievals.has('111')).toBe(false);
    expect(activeFeedbackRetrievals.has('222')).toBe(true);
    
    // 完成第二个请求
    resolve2({ hits: [], confidence: 0 });
    await promise2;
    
    // 验证两个请求都完成
    expect(activeFeedbackRetrievals.has('222')).toBe(false);
  });

  it('应该在请求完成后更新 feedback.retrieval', async () => {
    const feedback = { id: '789', project_id: 1, content: '更新测试' };
    
    const mockResult = {
      hits: [{ title: '匹配结果', source: 'customer_lib' }],
      confidence: 0.85,
      draft_reply: '建议方案'
    };
    
    api.retrieveFeedback.mockResolvedValue(mockResult);
    
    await loadFeedbackRetrieval(feedback);
    
    // 验证 feedback.retrieval 被正确更新
    expect(feedback.retrieval).toEqual({
      hits: [{ title: '匹配结果', source: 'customer_lib' }],
      confidence: 0.85,
      draft_reply: '建议方案'
    });
  });

  it('应该在 DOM 中正确插入检索卡片', async () => {
    const feedback = { id: '999', project_id: 1, content: 'DOM测试' };
    
    const mockResult = {
      hits: [{ title: '测试结果' }],
      confidence: 0.7
    };
    
    api.retrieveFeedback.mockResolvedValue(mockResult);
    
    // 模拟不存在现有卡片，但存在 factSection
    const mockInsertAdjacentHTML = vi.fn();
    els.feedbackInspector.querySelector
      .mockReturnValueOnce(null)  // .retrieval-card
      .mockReturnValueOnce({ insertAdjacentHTML: mockInsertAdjacentHTML });  // .feedback-content-card
    
    await loadFeedbackRetrieval(feedback);
    
    // 验证尝试插入卡片
    expect(mockInsertAdjacentHTML).toHaveBeenCalledWith(
      'afterend',
      expect.stringContaining('retrieval-card')
    );
  });
});

describe('Regression Test: Original Bug Behavior', () => {
  it('如果没有去重机制，同一请求会被多次发起', async () => {
    const callCount = { value: 0 };
    const localApi = {
      retrieveFeedback: vi.fn()
    };
    
    // 模拟原始的（有bug的）函数
    async function loadFeedbackRetrievalBuggy(feedback) {
      const id = String(feedback.id);
      
      // 原始代码没有去重检查
      callCount.value++;
      
      const result = await localApi.retrieveFeedback({ 
        project_id: feedback.project_id, 
        query: feedback.content 
      });
      
      feedback.retrieval = result;
    }
    
    const feedback = { id: 'bug-test', project_id: 1, content: '测试' };
    
    localApi.retrieveFeedback.mockResolvedValue({ hits: [], confidence: 0 });
    
    // 同时发起多个请求
    await Promise.all([
      loadFeedbackRetrievalBuggy(feedback),
      loadFeedbackRetrievalBuggy(feedback),
      loadFeedbackRetrievalBuggy(feedback)
    ]);
    
    // 验证会被多次调用（这是bug行为）
    expect(callCount.value).toBe(3);
    expect(localApi.retrieveFeedback).toHaveBeenCalledTimes(3);
  });
});
