import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import { MediaComposer } from './MediaComposer'
vi.mock('@/lib/feedback/upload', () => ({ uploadFeedbackFileV2: vi.fn().mockResolvedValue({ type: 'image', object_key: 'customer/image.png', size: 1 }) }))

Object.defineProperty(URL, 'createObjectURL', { value: vi.fn(() => 'blob:test'), configurable: true })
Object.defineProperty(URL, 'revokeObjectURL', { value: vi.fn(), configurable: true })
describe('multimodal composer', () => {
  afterEach(() => { vi.unstubAllGlobals() })
  beforeEach(async () => { installStorage(); vi.clearAllMocks(); const { uploadFeedbackFileV2 } = await import('@/lib/feedback/upload'); vi.mocked(uploadFeedbackFileV2).mockResolvedValue({ type: 'image', object_key: 'customer/image.png', size: 1 }) })
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
  it('restores text and uploaded image references after iframe recreation without uploading them again', async () => {
    const { uploadFeedbackFileV2 } = await import('@/lib/feedback/upload')
    const send = vi.fn().mockResolvedValue(undefined)
    const first = render(<MediaComposer draftScope="p1/customer-a" draftConversationId="chat-a" onSend={send} />)
    fireEvent.change(screen.getByRole('textbox'), { target: { value: '保留我的补充' } })
    fireEvent.change(screen.getByLabelText('添加图片'), { target: { files: [new File(['x'], 'error.png', { type: 'image/png' })] } })
    await screen.findByText(/已上传/)
    first.unmount()
    render(<MediaComposer draftScope="p1/customer-a" draftConversationId="chat-a" onSend={send} />)
    expect(screen.getByRole('textbox')).toHaveValue('保留我的补充')
    expect(screen.getByText('已恢复上传附件')).toBeInTheDocument()
    expect(uploadFeedbackFileV2).toHaveBeenCalledOnce()
    fireEvent.click(screen.getByRole('button', { name: '发送' }))
    await waitFor(() => expect(send).toHaveBeenCalledWith('保留我的补充', [expect.objectContaining({ object_key: 'customer/image.png' })], expect.any(String)))
  })
  it('reports unsupported speech recognition instead of simulating a transcript', () => {
    render(<MediaComposer onSend={vi.fn()} />)
    fireEvent.click(screen.getByRole('button', { name: '语音输入' }))
    expect(screen.getByRole('alert')).toHaveTextContent('当前浏览器不支持语音转文字')
  })
  it('transcribes into an editable draft without uploading audio or automatically sending', async () => {
    const recognizer = installSpeech()
    const { uploadFeedbackFileV2 } = await import('@/lib/feedback/upload')
    const send = vi.fn().mockResolvedValue(undefined)
    render(<MediaComposer onSend={send} />)
    const input = screen.getByRole('textbox')
    fireEvent.change(input, { target: { value: '订单页面' } })
    fireEvent.click(screen.getByRole('button', { name: '语音输入' }))
    act(() => recognizer.result([['导出', false]]))
    expect(input).toHaveValue('订单页面\n导出')
    act(() => recognizer.result([['导出失败', true], ['请帮助', false]]))
    act(() => recognizer.result([['导出失败', true], ['请帮助', true]]))
    fireEvent.click(screen.getByRole('button', { name: '完成转写' }))
    expect(input).toHaveValue('订单页面\n导出失败请帮助')
    expect(send).not.toHaveBeenCalled()
    expect(uploadFeedbackFileV2).not.toHaveBeenCalled()
    fireEvent.change(input, { target: { value: '订单页面导出失败，请帮助' } })
    fireEvent.click(screen.getByRole('button', { name: '发送' }))
    await waitFor(() => expect(send).toHaveBeenCalledWith('订单页面导出失败，请帮助', [], expect.any(String)))
    expect(recognizer.stop).toHaveBeenCalled()
  })
  it('cancels speech and ignores late results, preserving the typed draft', () => {
    const recognizer = installSpeech()
    render(<MediaComposer onSend={vi.fn()} />)
    const input = screen.getByRole('textbox')
    fireEvent.change(input, { target: { value: '已输入内容' } })
    fireEvent.click(screen.getByRole('button', { name: '语音输入' }))
    const lateResult = recognizer.onresult!
    act(() => recognizer.result([['不要留下', true]]))
    fireEvent.click(screen.getByRole('button', { name: '取消' }))
    act(() => lateResult({ results: [{ isFinal: true, 0: { transcript: '迟到结果' } }] }))
    expect(input).toHaveValue('已输入内容')
    expect(recognizer.abort).toHaveBeenCalled()
  })
  it('pauses capture when hidden by the host and discards late interim results', () => {
    const recognizer = installSpeech()
    render(<MediaComposer onSend={vi.fn()} />)
    fireEvent.click(screen.getByRole('button', { name: '语音输入' }))
    act(() => recognizer.result([['保留文字', true], ['临时', false]]))
    const lateResult = recognizer.onresult!
    act(() => window.dispatchEvent(new Event('feedback-sdk:pause-media')))
    act(() => lateResult({ results: [{ isFinal: true, 0: { transcript: '迟到结果' } }] }))
    expect(screen.getByRole('textbox')).toHaveValue('保留文字')
    expect(recognizer.abort).toHaveBeenCalled()
  })
  it('stops capture after sixty seconds without sending automatically', () => {
    vi.useFakeTimers()
    const recognizer = installSpeech()
    const send = vi.fn()
    const view = render(<MediaComposer onSend={send} />)
    fireEvent.click(screen.getByRole('button', { name: '语音输入' }))
    act(() => recognizer.result([['识别结果', true]]))
    act(() => vi.advanceTimersByTime(60000))
    expect(recognizer.stop).toHaveBeenCalledOnce()
    expect(screen.getByRole('textbox')).toHaveValue('识别结果')
    expect(send).not.toHaveBeenCalled()
    view.unmount()
    vi.useRealTimers()
  })
  it('aborts on unmount and ignores a recognizer callback already in flight', () => {
    const recognizer = installSpeech()
    const send = vi.fn()
    const view = render(<MediaComposer onSend={send} />)
    fireEvent.click(screen.getByRole('button', { name: '语音输入' }))
    const lateResult = recognizer.onresult!
    view.unmount()
    act(() => lateResult({ results: [{ isFinal: true, 0: { transcript: '迟到结果' } }] }))
    expect(recognizer.abort).toHaveBeenCalledOnce()
    expect(send).not.toHaveBeenCalled()
  })
  it('reports denied permissions without losing existing text', () => {
    const recognizer = installSpeech()
    render(<MediaComposer onSend={vi.fn()} />)
    fireEvent.change(screen.getByRole('textbox'), { target: { value: '原文' } })
    fireEvent.click(screen.getByRole('button', { name: '语音输入' }))
    act(() => recognizer.onerror?.({ error: 'not-allowed' }))
    expect(screen.getByRole('alert')).toHaveTextContent('无法使用麦克风或语音识别权限')
    expect(screen.getByRole('textbox')).toHaveValue('原文')
  })
  it('rejects audio dropped as a general attachment', async () => {
    const { uploadFeedbackFileV2 } = await import('@/lib/feedback/upload')
    render(<MediaComposer allowFiles onSend={vi.fn()} />)
    fireEvent.drop(screen.getByRole('textbox'), { dataTransfer: { files: [new File(['voice'], 'voice.webm', { type: 'audio/webm' })] } })
    expect(screen.getByRole('alert')).toHaveTextContent('不支持发送音频附件')
    expect(uploadFeedbackFileV2).not.toHaveBeenCalled()
  })
})

function installSpeech() {
  const recognizer = {
    onresult: null as null | ((event: { results: { isFinal: boolean; 0: { transcript: string } }[] }) => void),
    onerror: null as null | ((event: { error: string }) => void),
    onend: null as null | (() => void),
    start: vi.fn(), stop: vi.fn(() => recognizer.onend?.()), abort: vi.fn(),
    result(values: [string, boolean][]) { recognizer.onresult?.({ results: values.map(([transcript, isFinal]) => ({ isFinal, 0: { transcript } })) }) },
  }
  vi.stubGlobal('SpeechRecognition', class { constructor() { return recognizer } })
  return recognizer
}

function installStorage() {
  const entries = new Map<string, string>()
  Object.defineProperty(window, 'localStorage', { configurable: true, value: { getItem: (key: string) => entries.get(key) ?? null, setItem: (key: string, value: string) => entries.set(key, value), removeItem: (key: string) => entries.delete(key), clear: () => entries.clear() } })
}
