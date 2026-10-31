import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  configureFeedbackSDK,
  getFeedbackSDKConfig,
  getFeedbackSDKProductContract,
  isFeedbackSDKV3Enabled,
  normalizeFeedbackSDKHostContext,
} from './config'

afterEach(() => vi.unstubAllEnvs())

describe('Feedback SDK product contract', () => {
  it('enables the new support surface only in a V3 artifact with valid V2 transport auth', () => {
    vi.stubEnv('VITE_SDK_CONTRACT', 'v3')
    configureFeedbackSDK({
      feedbackV2Enabled: true,
      feedbackV2AuthMode: 'apiKey',
      apiKey: 'ak_fixture_0123456789abcdef',
      projectId: 115,
      customUserId: 'stable-user-1',
    })

    expect(getFeedbackSDKProductContract()).toBe('v3')
    expect(isFeedbackSDKV3Enabled()).toBe(true)

    vi.stubEnv('VITE_SDK_CONTRACT', 'v2')
    expect(getFeedbackSDKProductContract()).toBe('v2')
    expect(isFeedbackSDKV3Enabled()).toBe(false)
  })
})

describe('Feedback SDK hostContext diagnostics boundary', () => {
  it('keeps only bounded non-identifying fields', () => {
    const normalized = normalizeFeedbackSDKHostContext({
      release: 'oms1',
      build: '20261026.1',
      module: 'workbench',
      route: 'open-api',
      browser: 'Chromium',
      os: 'macOS',
      locale: 'zh-CN',
      clientTimestamp: '2026-10-26T08:00:00+08:00',
      requestId: '52d2a2ca-ef89-4ee2-b8d6-4d1320fc69f4',
      tenantId: 'must-not-pass',
      subjectId: 'must-not-pass',
      authorization: 'must-not-pass',
      stack: 'must-not-pass',
    })

    expect(normalized).toEqual({
      release: 'oms1',
      build: '20261026.1',
      module: 'workbench',
      route: 'open-api',
      browser: 'Chromium',
      os: 'macOS',
      locale: 'zh-CN',
      clientTimestamp: '2026-10-26T00:00:00.000Z',
      requestId: '52d2a2ca-ef89-4ee2-b8d6-4d1320fc69f4',
    })
    expect(JSON.stringify(normalized)).not.toContain('must-not-pass')
  })

  it('drops URLs, identifier-bearing paths and malformed timestamps', () => {
    expect(normalizeFeedbackSDKHostContext({
      route: '/projects/123',
      browser: 'Mozilla/5.0 (full user agent)',
      requestId: 'request id with spaces',
      clientTimestamp: 'not-a-date',
    })).toBeUndefined()
  })

  it('replaces runtime host context instead of retaining rejected data', () => {
    configureFeedbackSDK({ hostContext: { module: 'workbench', route: 'overview' } })
    expect(getFeedbackSDKConfig().hostContext).toEqual({ module: 'workbench', route: 'overview' })
    configureFeedbackSDK({ hostContext: { route: '/tenant/secret' } })
    expect(getFeedbackSDKConfig().hostContext).toBeUndefined()
  })
})
