/**
 * TDD：知识库检索状态管理（retrieval-state.mjs）
 *
 * 产品规格（详情页知识库检索，已确认）：
 * - 区域四态常驻：idle / loading / ready(命中|未匹配) / error；view 永不返回 null
 * - 匹配到 → 显示内容；匹配不到 → 显示"未匹配到"；不随请求/快照消失
 * - 详情打开默认不自动打 LLM（shouldAutoLoad 恒 false）；手动/分诊后触发
 * - 错误保留上次成功结果并标记 degraded（与"真未匹配"区分）
 *
 * 解决的缺陷：
 * 1. 反馈详情知识库检索区域一会显示一会不显示（闪烁）
 * 2. 一会显示检索到内容一会显示没有检索到内容
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import {
  createRetrievalStore,
  isCurrentSelection,
  createTriageGate
} from '../desktop/renderer/retrieval-state.mjs';

describe('retrieval store：四态常驻（view 永不为 null）', () => {
  it('从未加载过的 id 返回 idle 占位，区域可常驻渲染"未检索"', () => {
    const store = createRetrievalStore();
    const view = store.view('never-seen');
    assert.ok(view, 'view 不得返回 null，渲染层据此常驻检索卡片');
    assert.equal(view.status, 'idle');
    assert.deepEqual(view.hits, [], 'idle 占位 hits 为空数组');
  });

  it('begin 与 finish 之间 view 返回 loading 占位（区域不得消失）', () => {
    const store = createRetrievalStore();
    assert.equal(store.begin('7'), true);
    const view = store.view('7');
    assert.ok(view, '请求进行中 view 不得为 null');
    assert.equal(view.status, 'loading');
  });

  it('finish 空 hits 后 view 仍返回 ready 空数组，渲染"未匹配到"', () => {
    const store = createRetrievalStore();
    store.begin('11');
    store.finish('11', { hits: [], confidence: 0, draft_reply: '' });
    const view = store.view('11');
    assert.ok(view, '空结果不得让 view 变 null（区域消失）');
    assert.equal(view.status, 'ready');
    assert.deepEqual(view.hits, []);
  });

  it('快照刷新替换 feedback 对象后，检索结果仍可按 id 取回', () => {
    const store = createRetrievalStore();
    store.begin('42');
    store.finish('42', {
      hits: [{ title: 'handler/retrieve.go', source: 'customer_code' }],
      confidence: 0.9,
      draft_reply: '相关代码在 retrieve.go'
    });
    // 模拟 30s 快照刷新：新对象无 retrieval 字段
    const feedbackV2 = { id: '42', content: '页面加载慢' };
    const view = store.view(feedbackV2.id);
    assert.ok(view, '快照替换对象后 view 不得丢失');
    assert.equal(view.status, 'ready');
    assert.equal(view.hits.length, 1);
  });
});

describe('retrieval store：详情打开默认不自动请求 LLM', () => {
  it('shouldAutoLoad 恒为 false（手动/分诊后触发，不在打开详情时烧 LLM）', () => {
    const store = createRetrievalStore();
    assert.equal(store.shouldAutoLoad('6', true), false, '打开详情不得自动发起检索');
    assert.equal(store.shouldAutoLoad('6', false), false);

    store.begin('6');
    store.finish('6', { hits: [], confidence: 0, draft_reply: '' });
    assert.equal(store.shouldAutoLoad('6', true), false, 'ready 后更不得自动重发');

    store.fail('6', new Error('down'));
    assert.equal(store.shouldAutoLoad('6', true), false, 'error 后不得随快照刷新自动重发');
  });

  it('canManualLoad：非进行中可手动重查；进行中去重', () => {
    const store = createRetrievalStore();
    assert.equal(store.canManualLoad('m1'), true, 'idle 可手动检索');
    store.begin('m1');
    assert.equal(store.canManualLoad('m1'), false, '进行中必须去重');
    store.finish('m1', { hits: [{ title: 'a' }], confidence: 0.8, draft_reply: '' });
    assert.equal(store.canManualLoad('m1'), true, '完成后允许手动重查');
    store.begin('m1');
    store.fail('m1', new Error('boom'));
    assert.equal(store.canManualLoad('m1'), true, 'error 后允许手动重试');
  });
});

describe('retrieval store：选中态守卫（修复闪烁-根因C）', () => {
  it('选中 A 时 B 的陈旧响应不得写 DOM', () => {
    assert.equal(isCurrentSelection('A', 'A'), true);
    assert.equal(isCurrentSelection('A', 'B'), false);
    assert.equal(isCurrentSelection('42', 42), true, 'id 类型不同也要能比较');
    assert.equal(isCurrentSelection('', 'B'), false);
  });
});

describe('retrieval store：错误保留 stale（与真未匹配区分）', () => {
  it('上次成功结果在失败后保留并标记 degraded', () => {
    const store = createRetrievalStore();
    store.begin('9');
    store.finish('9', { hits: [{ title: 'a.go' }], confidence: 0.8, draft_reply: 'x' });

    store.begin('9');
    store.fail('9', new Error('检索服务超时'));

    const view = store.view('9');
    assert.equal(view.status, 'error');
    assert.equal(view.degraded, true, '错误必须标记 degraded，与"真未匹配"区分');
    assert.equal(view.hits.length, 1, '错误必须保留上次成功结果，不得静默清空');
    assert.match(view.error, /超时/);
  });

  it('从未成功过的失败：hits 为空数组，渲染降级提示而非命中列表', () => {
    const store = createRetrievalStore();
    store.begin('10');
    store.fail('10', new Error('boom'));
    const view = store.view('10');
    assert.equal(view.status, 'error');
    assert.equal(view.degraded, true);
    assert.deepEqual(view.hits, [], '无 stale 数据时 hits 为空数组，渲染层显示降级提示');
  });
});

describe('retrieval store：请求去重与缓存（修复重复 LLM 请求）', () => {
  it('同一反馈并发 begin 只允许一个请求', () => {
    const store = createRetrievalStore();
    assert.equal(store.begin('1'), true);
    assert.equal(store.begin('1'), false, '进行中的请求必须去重');
    store.finish('1', { hits: [], confidence: 0, draft_reply: '' });
    assert.equal(store.shouldAutoLoad('1', true), false, '完成后自动路径不得重复触发');
    assert.equal(store.begin('1'), true, '手动重查 begin 允许开启新一轮');
  });

  it('invalidate 后恢复 idle，允许重新手动加载', () => {
    const store = createRetrievalStore();
    store.begin('8');
    store.finish('8', { hits: [{ title: 'x' }], confidence: 0.5, draft_reply: '' });
    store.invalidate('8');
    const view = store.view('8');
    assert.equal(view.status, 'idle');
    assert.equal(store.canManualLoad('8'), true);
    assert.equal(store.shouldAutoLoad('8', true), false, 'invalidate 后仍不自动打 LLM');
  });
});

describe('triage gate：失败退避（修复刷新风暴-根因D）', () => {
  it('已有 triage 数据不再执行', () => {
    const gate = createTriageGate();
    assert.equal(gate.shouldRun('1', true), false);
  });

  it('失败过的反馈不再自动重试', () => {
    const gate = createTriageGate();
    assert.equal(gate.shouldRun('2', false), true);
    gate.markFailed('2');
    assert.equal(gate.shouldRun('2', false), false, '失败后自动重试会形成刷新风暴，必须阻断');
  });

  it('不同反馈之间互不影响', () => {
    const gate = createTriageGate();
    gate.markFailed('3');
    assert.equal(gate.shouldRun('4', false), true);
  });
});
