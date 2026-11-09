import { afterEach, describe, expect, it, vi } from 'vitest'
import { getFeedbackSDKProductContract } from './config'

afterEach(() => {
  vi.unstubAllEnvs()
})

describe('SDK product contract', () => {
  it('defaults unknown and missing builds to the V2 product', () => {
    vi.stubEnv('VITE_SDK_CONTRACT', '')
    expect(getFeedbackSDKProductContract()).toBe('v2')

    vi.stubEnv('VITE_SDK_CONTRACT', 'future')
    expect(getFeedbackSDKProductContract()).toBe('v2')
  })

  it('recognizes an explicitly isolated V3 product build', () => {
    vi.stubEnv('VITE_SDK_CONTRACT', 'v3')
    expect(getFeedbackSDKProductContract()).toBe('v3')
  })
})
