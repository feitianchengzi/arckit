import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import { MediaComposer } from './MediaComposer'
vi.mock('@/lib/feedback/upload', () => ({ uploadFeedbackFileV2: vi.fn().mockResolvedValue({ type: 'image', object_key: 'customer/image.png', size: 1 }) }))

Object.defineProperty(URL, 'createObjectURL', { value: vi.fn(() => 'blob:test'), configurable: true })
Object.defineProperty(URL, 'revokeObjectURL', { value: vi.fn(), configurable: true })
describe('multimodal composer', () => {
  beforeEach(async () => { const { uploadFeedbackFileV2 } = await import('@/lib/feedback/upload'); vi.mocked(uploadFeedbackFileV2).mockResolvedValue({ type: 'image', object_key: 'customer/image.png', size: 1 }) })
  it('keeps text after a failed send and does not send during IME composition', async () => {
    const send = vi.fn().mockRejectedValue(new Error('网络错误'))
    render(<MediaComposer onSend={send} />)
    const input = screen.getByRole('textbox')
    fireEvent.change(input, { target: { value: '导出失败' } })
    fireEvent.keyDown(input, { key: 'Enter', isComposing: true })
    expect(send).not.toHaveBeenCalled()
    fireEvent.click(screen.getByRole('button', { name: '发送' }))
    await screen.findByText('网络错误')
    expect(input).toHaveValue('导出失败')
  })
  it('uploads and sends an image without forcing text, clearing only after success', async () => {
    const send = vi.fn().mockResolvedValue(undefined)
    render(<MediaComposer onSend={send} />)
    fireEvent.change(screen.getByLabelText('添加图片'), { target: { files: [new File(['x'], 'error.png', { type: 'image/png' })] } })
    await waitFor(() => expect(screen.getByRole('button', { name: '发送' })).not.toBeDisabled())
    fireEvent.click(screen.getByRole('button', { name: '发送' }))
    await waitFor(() => expect(send).toHaveBeenCalledWith('', [expect.objectContaining({ object_key: 'customer/image.png' })], expect.any(String)))
  })
  it('reports microphone unavailable instead of simulating recording', () => {
    render(<MediaComposer onSend={vi.fn()} />)
    fireEvent.click(screen.getByRole('button', { name: '录制语音' }))
    expect(screen.getByRole('alert')).toHaveTextContent(/录音|麦克风/)
  })
  it('records real microphone chunks and releases tracks before sending audio with duration', async () => {
    const stop = vi.fn()
    Object.defineProperty(navigator, 'mediaDevices', { configurable: true, value: { getUserMedia: vi.fn().mockResolvedValue({ getTracks: () => [{ stop }] }) } })
    class Recorder {
      static isTypeSupported = () => true
      state = 'inactive'; mimeType = 'audio/webm;codecs=opus'
      ondataavailable?: (event: { data: Blob }) => void
      onstop?: () => void
      start() { this.state = 'recording' }
      stop() { this.state = 'inactive'; this.ondataavailable?.({ data: new Blob(['voice'], { type: 'audio/webm' }) }); this.onstop?.() }
    }
    vi.stubGlobal('MediaRecorder', Recorder)
    const { uploadFeedbackFileV2 } = await import('@/lib/feedback/upload')
    vi.mocked(uploadFeedbackFileV2).mockResolvedValue({ type: 'audio', object_key: 'customer/voice.webm', size: 5 })
    const send = vi.fn().mockResolvedValue(undefined)
    const view = render(<MediaComposer onSend={send} />)
    fireEvent.click(screen.getByRole('button', { name: '录制语音' }))
    fireEvent.click(await screen.findByRole('button', { name: '停止并试听' }))
    await waitFor(() => expect(uploadFeedbackFileV2).toHaveBeenCalledWith({ file: expect.objectContaining({ type: 'audio/webm' }) }))
    await waitFor(() => expect(screen.getByRole('button', { name: '发送' })).not.toBeDisabled())
    fireEvent.click(screen.getByRole('button', { name: '发送' }))
    await waitFor(() => expect(send).toHaveBeenCalledWith('', [expect.objectContaining({ type: 'audio', duration_ms: expect.any(Number) })], expect.any(String)))
    expect(stop).toHaveBeenCalled()
    await act(async () => view.unmount())
    vi.unstubAllGlobals()
    Object.defineProperty(navigator, 'mediaDevices', { configurable: true, value: undefined })
  })

})
