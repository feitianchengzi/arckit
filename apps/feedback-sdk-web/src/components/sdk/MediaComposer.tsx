import { useEffect, useRef, useState } from 'react'
import type { FeedbackV2Attachment } from '@/lib/feedback/v2'
import { uploadFeedbackFileV2 } from '@/lib/feedback/upload'
import { newClientRequestId, validateMedia } from '@/domain/feedback'

interface PendingMedia { id: string; file: File; preview: string; attachment?: FeedbackV2Attachment; error?: string; durationMs?: number }
interface Props {
  onSend: (content: string, attachments: FeedbackV2Attachment[], clientMessageId: string) => Promise<void>
  disabled?: boolean
  placeholder?: string
  allowFiles?: boolean
}

/** Owns capture and upload UI. The application decides whether a message consults Agent or appends a card. */
export function MediaComposer({ onSend, disabled = false, placeholder = '输入你的问题...', allowFiles = false }: Props) {
  const [text, setText] = useState('')
  const [media, setMedia] = useState<PendingMedia[]>([])
  const [error, setError] = useState('')
  const [sending, setSending] = useState(false)
  const [recording, setRecording] = useState(false)
  const [seconds, setSeconds] = useState(0)
  const [requestingMic, setRequestingMic] = useState(false)
  const mediaRef = useRef<PendingMedia[]>([])
  const recorderRef = useRef<MediaRecorder | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const timerRef = useRef<ReturnType<typeof setInterval>>()
  const canceledRef = useRef(false)
  const mounted = useRef(true)
  const sendingRef = useRef(false)
  const requestId = useRef(newClientRequestId())
  const pendingRecorder = useRef(0)
  const recordingStarted = useRef(0)

  const updateMedia = (next: PendingMedia[]) => { mediaRef.current = next; setMedia(next) }
  useEffect(() => { mounted.current = true; return () => {
    mounted.current = false
    pendingRecorder.current++
    canceledRef.current = true
    clearInterval(timerRef.current)
    if (recorderRef.current?.state === 'recording') recorderRef.current.stop()
    streamRef.current?.getTracks().forEach((track) => track.stop())
    mediaRef.current.forEach((m) => m.preview && URL.revokeObjectURL(m.preview))
  } }, [])

  const upload = async (entry: PendingMedia) => {
    try {
      const uploaded = await uploadFeedbackFileV2({ file: entry.file })
      const attachment = { ...uploaded, ...(entry.durationMs !== undefined ? { duration_ms: entry.durationMs } : {}) }
      if (mounted.current) updateMedia(mediaRef.current.map((m) => m.id === entry.id ? { ...m, attachment, error: undefined } : m))
    } catch (e) {
      if (mounted.current) updateMedia(mediaRef.current.map((m) => m.id === entry.id ? { ...m, error: e instanceof Error ? e.message : '上传失败' } : m))
    }
  }
  const addFiles = (files: File[], durationMs?: number) => {
    setError('')
    for (const file of files) {
      const validation = allowFiles && !file.type.startsWith('image/') && !file.type.startsWith('audio/')
        ? (!file.size || file.size > 10 * 1024 * 1024 ? '附件应小于10MB且不能为空' : '')
        : validateMedia(file, mediaRef.current.map((m) => ({ type: m.file.type.startsWith('audio/') ? 'audio' : 'image', size: m.file.size })))
      if (validation) { setError(validation); continue }
      const entry = { id: newClientRequestId(), file, preview: URL.createObjectURL(file), durationMs }
      updateMedia([...mediaRef.current, entry])
      requestId.current = newClientRequestId()
      void upload(entry)
    }
  }
  const remove = (id: string) => {
    const entry = mediaRef.current.find((m) => m.id === id)
    if (entry?.preview) URL.revokeObjectURL(entry.preview)
    updateMedia(mediaRef.current.filter((m) => m.id !== id))
    requestId.current = newClientRequestId()
  }
  const stopRecording = (cancel = false) => {
    canceledRef.current = cancel
    clearInterval(timerRef.current)
    if (recorderRef.current?.state === 'recording') recorderRef.current.stop()
    streamRef.current?.getTracks().forEach((track) => track.stop())
    setRecording(false)
  }
  const startRecording = async () => {
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') { setError('当前环境不支持录音，请确认 HTTPS、麦克风权限及宿主授权，或使用文字说明。'); return }
    if (recording || requestingMic) return
    const generation = ++pendingRecorder.current
    setError(''); setRequestingMic(true)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      if (!mounted.current || generation !== pendingRecorder.current) { stream.getTracks().forEach((t) => t.stop()); return }
      streamRef.current = stream
      const mime = ['audio/webm;codecs=opus', 'audio/mp4', 'audio/ogg;codecs=opus'].find((t) => MediaRecorder.isTypeSupported(t))
      const recorder = mime ? new MediaRecorder(stream, { mimeType: mime }) : new MediaRecorder(stream)
      recorderRef.current = recorder
      const chunks: BlobPart[] = []
      canceledRef.current = false
      recorder.ondataavailable = (event) => { if (event.data.size) chunks.push(event.data) }
      recorder.onstop = () => {
        if (!mounted.current || canceledRef.current || !chunks.length) return
        const type = recorder.mimeType.split(';')[0] || 'audio/webm'
        addFiles([new File(chunks, `voice-${Date.now()}.${type.includes('mp4') ? 'm4a' : type.includes('ogg') ? 'ogg' : 'webm'}`, { type })], Math.min(60000, Date.now() - recordingStarted.current))
      }
      recorder.onerror = () => { stopRecording(true); setError('录音中断，请重试或改用文字说明。') }
      recordingStarted.current = Date.now()
      recorder.start()
      setSeconds(0); setRecording(true)
      let elapsed = 0
      timerRef.current = setInterval(() => { elapsed++; setSeconds(elapsed); if (elapsed >= 60) stopRecording() }, 1000)
    } catch (e) {
      streamRef.current?.getTracks().forEach((track) => track.stop())
      if (mounted.current) setError(e instanceof DOMException && e.name === 'NotAllowedError' ? '麦克风权限被拒绝，请检查浏览器及宿主麦克风授权；仍可使用文字说明。' : '无法启动录音，请检查麦克风或改用文字说明。')
    } finally { if (mounted.current) setRequestingMic(false) }
  }
  useEffect(() => {
    const pause = () => { if (recorderRef.current?.state === 'recording') stopRecording(true); pendingRecorder.current++ }
    const visibility = () => { if (document.visibilityState === 'hidden') pause() }
    window.addEventListener('feedback-sdk:pause-media', pause)
    document.addEventListener('visibilitychange', visibility)
    return () => { window.removeEventListener('feedback-sdk:pause-media', pause); document.removeEventListener('visibilitychange', visibility) }
  }, [])
  const uploading = media.some((m) => !m.attachment && !m.error)
  const send = async () => {
    if (sendingRef.current || disabled || recording || uploading) return
    if (!text.trim() && !media.length) { setError('请输入问题'); return }
    if (media.some((m) => !m.attachment)) { setError('请先重试或移除上传失败的附件'); return }
    sendingRef.current = true; setSending(true); setError('')
    try {
      await onSend(text.trim(), media.map((m) => m.attachment!), requestId.current)
      if (mounted.current) { setText(''); mediaRef.current.forEach((m) => URL.revokeObjectURL(m.preview)); updateMedia([]); requestId.current = newClientRequestId() }
    } catch (e) { if (mounted.current) setError(e instanceof Error ? e.message : '发送失败，请重试') }
    finally { sendingRef.current = false; if (mounted.current) setSending(false) }
  }
  const locked = disabled || sending
  return <div className="sdk-composer">
    {recording && <div className="sdk-recording" role="status">● 正在录音 {String(Math.floor(seconds / 60)).padStart(2, '0')}:{String(seconds % 60).padStart(2, '0')} / 01:00 <button type="button" onClick={() => stopRecording(true)}>取消</button><button type="button" onClick={() => stopRecording()}>停止并试听</button></div>}
    {media.length > 0 && <div className="sdk-media-previews">{media.map((entry) => <div key={entry.id} className="sdk-media-preview">
      {entry.file.type.startsWith('image/') ? <img src={entry.preview} alt={entry.file.name} /> : entry.file.type.startsWith('audio/') ? <audio controls src={entry.preview} aria-label="语音试听" /> : null}
      <small>{entry.file.name} · {entry.attachment ? '已上传' : entry.error || '上传中…'}</small>
      {entry.error && <button type="button" disabled={locked} onClick={() => { updateMedia(mediaRef.current.map((m) => m.id === entry.id ? { ...m, error: undefined } : m)); void upload(entry) }}>重试</button>}
      <button type="button" disabled={locked} aria-label={`移除 ${entry.file.name}`} onClick={() => remove(entry.id)}>×</button>
    </div>)}</div>}
    <textarea value={text} onChange={(e) => { setText(e.target.value); requestId.current = newClientRequestId() }} disabled={locked} placeholder={placeholder} rows={3} aria-label={placeholder}
      onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing && e.keyCode !== 229) { e.preventDefault(); void send() } }}
      onPaste={(e) => { const files = [...e.clipboardData.files].filter((f) => f.type.startsWith('image/')); if (files.length) { e.preventDefault(); addFiles(files) } }}
      onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); if (!locked) addFiles([...e.dataTransfer.files]) }} />
    <div className="sdk-composer-tools"><div className="flex items-center gap-3">
      <label className="cursor-pointer text-xs text-foreground-secondary">图片<input aria-label="添加图片" className="sr-only" type="file" accept="image/jpeg,image/png,image/webp,image/gif" multiple disabled={locked || recording} onChange={(e) => { addFiles([...(e.target.files || [])]); e.target.value = '' }} /></label>
      <button type="button" disabled={locked || recording || requestingMic} onClick={() => void startRecording()} className="text-xs text-foreground-secondary">{requestingMic ? '正在申请权限…' : '录制语音'}</button>
      {allowFiles && <label className="cursor-pointer text-xs text-foreground-secondary">文件<input aria-label="添加文件" className="sr-only" type="file" disabled={locked} onChange={(e) => { addFiles([...(e.target.files || [])]); e.target.value = '' }} /></label>}
    </div><button type="button" onClick={() => void send()} disabled={locked || uploading || recording} className="sdk-button primary">{sending ? '发送中…' : '发送'}</button></div>
    {error && <p role="alert" className="mt-2 text-xs text-error">{error}</p>}
  </div>
}
