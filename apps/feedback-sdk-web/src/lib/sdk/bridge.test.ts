import { describe, it, expect, vi } from 'vitest'

const { configure, parent } = vi.hoisted(() => ({ configure: vi.fn(), parent: { postMessage: vi.fn() } }))
vi.mock('./config', () => ({
  configureFeedbackSDK: configure,
  getFeedbackSDKConfig: () => ({ parentOrigins: ['https://allowed.example'], theme: 'light' }),
  isFeedbackSDKV2NotificationsEnabled: () => false,
  setFeedbackSDKTheme: vi.fn(),
}))
vi.mock('@/lib/feedback/v2', () => ({ fetchFeedbackNotificationsV2: vi.fn() }))
vi.mock('./theme', () => ({ applyFeedbackSDKTheme: vi.fn(), getFeedbackSDKTheme: () => 'light' }))

import { installFeedbackSDKBridge } from './bridge'

describe('production iframe trust boundary', () => {
  it('requires the actual allowed parent and never implicitly trusts localhost', () => {
    vi.stubEnv('DEV', false)
    const descriptor = Object.getOwnPropertyDescriptor(window, 'parent')!
    Object.defineProperty(window, 'parent', { configurable: true, value: parent })
    try {
      installFeedbackSDKBridge()
      const send = (origin: string, source: unknown) => window.dispatchEvent(new MessageEvent('message', {
        origin, source: source as Window,
        data: { source: 'feedback-sdk-host', type: 'feedback-sdk:configure', config: { gatewayUrl: 'https://gateway.example' } },
      }))
      send('https://attacker.example', parent)
      send('http://localhost:39999', parent)
      send('https://allowed.example', window)
      expect(configure).not.toHaveBeenCalled()
      send('https://allowed.example', parent)
      expect(configure).toHaveBeenCalledOnce()
    } finally {
      Object.defineProperty(window, 'parent', descriptor)
      vi.unstubAllEnvs()
    }
  })
})
