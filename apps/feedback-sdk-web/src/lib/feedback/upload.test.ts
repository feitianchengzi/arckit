import { afterEach, describe, expect, it, vi } from 'vitest'
const policy = vi.fn()
vi.mock('@/lib/sdk', () => ({ getFeedbackSDKConfig: () => ({ gatewayUrl: 'https://gateway.example' }) }))
vi.mock('./v2', () => ({ createFeedbackUploadPolicyV2: (...args: unknown[]) => policy(...args), getFeedbackAttachmentOSSCredentialsV2: vi.fn() }))
import { uploadFeedbackFileV2, uploadFeedbackImageByApiKey } from './upload'
import { feedbackNetworkUnavailable, feedbackUploadUnavailable } from './errors'
afterEach(() => { vi.unstubAllGlobals(); delete window.OSS })
describe('attachment failures', () => {
  it('does not expose object storage HTTP diagnostics', async () => {
    policy.mockResolvedValue({ object_key: 'test/photo.png', upload_url: 'https://storage.example', fields: {} })
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('SignatureDoesNotMatch private details', { status: 403 })))
    await expect(uploadFeedbackFileV2({ file: new File(['data'], 'photo.png', { type: 'image/png' }) })).rejects.toThrow(feedbackUploadUnavailable)
  })
  it('reports network loss instead of returning an uploaded attachment', async () => {
    policy.mockResolvedValue({ object_key: 'test/photo.png', upload_url: 'https://storage.example', fields: {} })
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('private storage hostname')))
    await expect(uploadFeedbackFileV2({ file: new File(['data'], 'photo.png', { type: 'image/png' }) })).rejects.toThrow(feedbackNetworkUnavailable)
  })
  it('hides rejected legacy storage SDK operations', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({ code: 'OK', data: { region: 'test', root_path: 'test' } }))))
    window.OSS = class { put() { return Promise.reject(new Error('AccessDenied provider private-key')) } }
    await expect(uploadFeedbackImageByApiKey({ apiKey: 'test', file: new File(['data'], 'photo.png', { type: 'image/png' }) })).rejects.toThrow(feedbackUploadUnavailable)
  })
})
