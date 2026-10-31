import { afterEach, describe, expect, it, vi } from 'vitest'
import { feedbackFetch, feedbackNetworkUnavailable, feedbackResponseError, feedbackSessionExpired, feedbackUnavailable, readFeedbackEnvelope } from './errors'

afterEach(() => vi.unstubAllGlobals())
describe('customer-facing service failures', () => {
  it('does not expose network diagnostics', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('fetch failed ECONNREFUSED http://internal-db:8081')))
    await expect(feedbackFetch('/test')).rejects.toThrow(feedbackNetworkUnavailable)
  })
  it.each([
    [503, { code: 'AGENT_UNAVAILABLE', error: { message: 'provider api_key=private-key failed' } }],
    [500, { error: { message: 'SQLSTATE 42P01 relation agent_messages does not exist' } }],
    [400, { code: 'BAD_REQUEST', message: '查询失败: SELECT * FROM private_table' }],
    [200, { code: 'LLM_FAILED', message: 'upstream quota api_key=private-key' }],
  ])('hides server diagnostics for status %s', (status, body) => {
    expect(feedbackResponseError(status, body).message).toBe(feedbackUnavailable)
  })
  it('preserves reviewed business validation without accepting appended details', () => {
    expect(feedbackResponseError(400, { error: { message: '音频实际长度须在60秒以内' } }).message).toBe('音频实际长度须在60秒以内')
    expect(feedbackResponseError(400, { error: { message: '反馈内容不能为空: SQLSTATE secret' } }).message).toBe(feedbackUnavailable)
  })
  it.each(['<html>Bad Gateway SQLSTATE secret</html>', '{}', 'null', '[]'])('rejects invalid successful responses instead of returning empty results: %s', async (body) => {
    await expect(readFeedbackEnvelope(new Response(body, { status: 200 }))).rejects.toThrow(feedbackUnavailable)
  })
  it('uses friendly expiry and rate-limit guidance', () => {
    expect(feedbackResponseError(401, { message: 'JWT malformed' }).message).toBe(feedbackSessionExpired)
    expect(feedbackResponseError(429, { message: 'rate_limit_exceeded' }).message).toBe('请求较多，请稍等片刻再试。')
  })
  it('retains valid API envelopes', async () => {
    await expect(readFeedbackEnvelope(new Response(JSON.stringify({ code: 'OK', data: [] })))).resolves.toEqual({ code: 'OK', data: [] })
  })
})
