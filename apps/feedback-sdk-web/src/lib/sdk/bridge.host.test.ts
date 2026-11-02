import { afterAll, describe, expect, it, vi } from 'vitest'
import { getFeedbackSDKConfig } from './config'
import { installFeedbackSDKBridge } from './bridge'

describe('Feedback SDK cross-origin host bridge', () => {
  const originalParent = window.parent
  const parent = { postMessage: vi.fn() } as unknown as WindowProxy

  afterAll(() => {
    Object.defineProperty(window, 'parent', { configurable: true, value: originalParent })
  })

  it('acknowledges an accepted configuration without echoing credentials', () => {
    Object.defineProperty(window, 'parent', { configurable: true, value: parent })
    installFeedbackSDKBridge()
    parent.postMessage = vi.fn()

    window.dispatchEvent(new MessageEvent('message', {
      origin: window.location.origin,
      source: parent,
      data: {
        source: 'feedback-sdk-host',
        type: 'feedback-sdk:configure',
        request_id: 'config-request-1',
        config: {
          feedbackV2Enabled: true,
          feedbackV2AuthMode: 'apiKey',
          apiKey: 'ak_fixture_0123456789abcdef',
          projectId: 115,
          customUserId: 'stable-user-1',
          gatewayUrl: 'https://api.example.test',
        },
      },
    }))

    expect(getFeedbackSDKConfig()).toMatchObject({
      feedbackV2Enabled: true,
      feedbackV2AuthMode: 'apiKey',
      projectId: 115,
      customUserId: 'stable-user-1',
    })
    expect(parent.postMessage).toHaveBeenCalledWith({
      source: 'feedback-sdk-web',
      type: 'feedback-sdk:configured',
      request_id: 'config-request-1',
    }, window.location.origin)
    expect(JSON.stringify((parent.postMessage as ReturnType<typeof vi.fn>).mock.calls)).not.toContain('ak_fixture')
  })
})
