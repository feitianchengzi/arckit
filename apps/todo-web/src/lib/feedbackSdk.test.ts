// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
const profile = vi.fn()
const toast = vi.fn()
vi.mock('@/components/ui/Toast', () => ({ showGlobalToast: (...args: unknown[]) => toast(...args) }))
let token: string | null
vi.mock('@/lib/api/endpoints/gateway', () => ({ gatewayApi: { getUserProfile: (...args: unknown[]) => profile(...args) } }))
vi.mock('@/lib/utils/tokenManager', () => ({ getAccessToken: () => token }))
function jwt(id: string) { return `header.${btoa(JSON.stringify({ user_id: id }))}.signature` }
let sdk: typeof import('./feedbackSdk')
const tick = async () => { for (let n = 0; n < 8; n++) await Promise.resolve() }
function iframe() { return document.querySelector('iframe')! }
function message(type: string, options?: Partial<MessageEventInit>) {
  const source = iframe().contentWindow
  window.dispatchEvent(new MessageEvent('message', { origin: 'http://localhost:3000', source, data: { source: 'feedback-sdk-web', type }, ...options }))
}
async function ready() {
  await tick()
  expect(iframe()).not.toBeNull()
  const post = vi.spyOn(iframe().contentWindow!, 'postMessage')
  message('feedback-sdk:ready')
  await tick()
  return post
}
beforeEach(async () => {
  vi.resetModules()
  vi.useFakeTimers()
  vi.stubEnv('VITE_FEEDBACK_API_KEY', 'test-project-key')
  vi.stubEnv('VITE_FEEDBACK_SDK_URL', '/sdk/index.html?embed=web')
  vi.stubGlobal('location', window.location)
  document.body.innerHTML = ''
  document.body.style.overflow = 'auto'
  token = jwt('account-a')
  profile.mockReset().mockResolvedValue({ id: 'profile-a' })
  toast.mockReset()
  sdk = await import('./feedbackSdk')
})
afterEach(() => {
  if (iframe()) message('feedback-sdk:close')
  vi.clearAllTimers()
  vi.useRealTimers()
  vi.unstubAllEnvs()
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})
describe('Todo SDK V2 host', () => {
  it('waits for ready, injects project45/current identity in API Key mode, then opens', async () => {
    const opening = sdk.openFeedbackSubmit('dark')
    await tick()
    const frame = iframe()
    const post = vi.spyOn(frame.contentWindow!, 'postMessage')
    expect(post).not.toHaveBeenCalled()
    expect(frame.getAttribute('allow')).toBe('microphone')
    expect(document.querySelectorAll('button')).toHaveLength(0)
    expect(frame.parentElement?.hidden).toBe(true)
    message('feedback-sdk:ready')
    await opening
    const sent = post.mock.calls.map(([value]) => value)
    expect(sent[0]).toMatchObject({ type: 'feedback-sdk:configure', config: { apiKey: 'test-project-key', projectId: 45, customUserId: 'profile-a', feedbackV2Enabled: true, feedbackV2AuthMode: 'apiKey', theme: 'dark' } })
    expect(sent.map((value) => value.type)).toEqual(['feedback-sdk:configure', 'feedback-sdk:open'])
    expect(sent.at(-1)).toMatchObject({ type: 'feedback-sdk:open', mode: 'submit' })
    expect(new URL(sent[0].config.gatewayUrl).origin).toBe(window.location.origin)
    expect(post.mock.calls.every(([, origin]) => String(origin) === 'http://localhost:3000')).toBe(true)
    expect(document.body.style.overflow).toBe('hidden')
  })
  it('ignores wrong origin, wrong frame and wrong message source', async () => {
    const opening = sdk.openFeedbackSubmit('light')
    await tick()
    const post = vi.spyOn(iframe().contentWindow!, 'postMessage')
    message('feedback-sdk:ready', { origin: 'https://evil.example' })
    message('feedback-sdk:ready', { source: window })
    message('feedback-sdk:ready', { data: { source: 'evil', type: 'feedback-sdk:ready' } })
    await tick()
    expect(post).not.toHaveBeenCalled()
    message('feedback-sdk:ready'); await opening
    message('feedback-sdk:close', { origin: 'https://evil.example' })
    expect(iframe()).not.toBeNull()
  })
  it('restores body scrolling on close and reopens with a fresh handshake in status mode', async () => {
    const opening = sdk.openFeedbackSubmit('light'); await ready(); await opening
    const first = iframe()
    message('feedback-sdk:close')
    expect(iframe()).toBeNull()
    expect(document.body.style.overflow).toBe('auto')
    const reopening = sdk.openFeedbackStatus('system'); const post = await ready(); await reopening
    expect(iframe()).not.toBe(first)
    expect(post.mock.calls.at(-1)?.[0]).toMatchObject({ type: 'feedback-sdk:open', mode: 'status' })
  })
  it('configures and restores the selected mode after iframe reload', async () => {
    const opening = sdk.openFeedbackStatus('dark'); const post = await ready(); await opening
    iframe().dispatchEvent(new Event('load')) // first document load follows its bootstrap ready
    post.mockClear()
    iframe().dispatchEvent(new Event('load')) // new document has not announced ready yet
    expect(post).not.toHaveBeenCalled()
    message('feedback-sdk:ready')
    expect(post.mock.calls.map(([value]) => value.type)).toEqual(['feedback-sdk:configure', 'feedback-sdk:open'])
    expect(post.mock.calls[1][0].mode).toBe('status')
  })
  it('supports bootstrap ready arriving after the document load', async () => {
    const opening = sdk.openFeedbackSubmit('light'); await tick()
    iframe().dispatchEvent(new Event('load'))
    message('feedback-sdk:ready'); await opening
    iframe().dispatchEvent(new Event('load'))
    await vi.advanceTimersByTimeAsync(15001)
    expect(iframe()).toBeNull()
    expect(document.body.style.overflow).toBe('auto')
    expect(toast).toHaveBeenCalledWith('帮助与反馈暂时无法打开，请稍后重试。', 'error', 3000)
  })
  it('destroys the prior document on account switching and resolves the new identity', async () => {
    const opening = sdk.openFeedbackSubmit('light'); await ready(); await opening
    const previous = iframe()
    token = jwt('account-b'); profile.mockResolvedValue({ id: 'profile-b' })
    const switching = sdk.openFeedbackStatus('dark')
    await tick()
    expect(iframe()).not.toBe(previous)
    const post = await ready(); await switching
    expect(post.mock.calls[0][0].config.customUserId).toBe('profile-b')
    expect(profile).toHaveBeenCalledTimes(2)
  })
  it('uses the token user id if profile lookup fails without leaking raw errors', async () => {
    profile.mockRejectedValue(new Error('private upstream details'))
    const opening = sdk.openFeedbackSubmit('light'); const post = await ready(); await opening
    expect(post.mock.calls[0][0].config.customUserId).toBe('account-a')
  })
  it('rejects a stale profile result after the account changes', async () => {
    let complete!: (value: { id: string }) => void
    profile.mockImplementation(() => new Promise((resolve) => { complete = resolve }))
    const opening = sdk.openFeedbackSubmit('light')
    const rejected = expect(opening).rejects.toThrow('暂时无法确认你的身份，请重新登录后再试。')
    await tick(); token = jwt('account-b'); complete({ id: 'profile-a' }); await rejected
    expect(iframe()).toBeNull()
  })
  it('times out with friendly guidance, removes timers and permits retry', async () => {
    const opening = sdk.openFeedbackSubmit('light')
    const rejected = expect(opening).rejects.toThrow('帮助与反馈暂时无法打开，请稍后重试。')
    await tick(); await vi.advanceTimersByTimeAsync(15001); await rejected
    expect(iframe()).toBeNull(); expect(vi.getTimerCount()).toBe(0)
    const retry = sdk.openFeedbackSubmit('light'); await ready(); await retry
    expect(iframe()).not.toBeNull()
  })
  it('resolves the SDK and gateway URL for a cross-origin embed without DOM access', async () => {
    vi.stubEnv('VITE_FEEDBACK_SDK_URL', 'https://sdk.example/release/index.html')
    vi.resetModules(); sdk = await import('./feedbackSdk')
    const opening = sdk.openFeedbackSubmit('light'); await tick()
    const frame = iframe(); const post = vi.spyOn(frame.contentWindow!, 'postMessage')
    expect(frame.src).toBe('https://sdk.example/release/index.html?embed=web')
    message('feedback-sdk:ready', { origin: 'https://sdk.example' }); await opening
    expect(post.mock.calls[0][1]).toBe('https://sdk.example')
    expect(post.mock.calls[0][0].config.gatewayUrl).toBe(`${window.location.origin}/api-proxy`)
  })
})
