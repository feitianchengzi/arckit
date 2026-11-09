import { useEffect, useRef, useState } from 'react'
import { readConsultationDraft, saveConsultationDraft } from '@/lib/feedback/drafts'
import type { FeedbackV2Attachment } from '@/lib/feedback/v2'
import { uploadFeedbackFileV2 } from '@/lib/feedback/upload'
import { newClientRequestId, validateMedia } from '@/domain/feedback'

interface PendingMedia { id: string; file: File; preview: string; attachment?: FeedbackV2Attachment; error?: string }
interface Props {
  hidden?: boolean
  onSend: (content: string, attachments: FeedbackV2Attachment[], clientMessageId: string) => Promise<void>
  draftScope?: string
  draftConversationId?: string
  onDraftChange?: (hasDraft: boolean) => void
  disabled?: boolean
  placeholder?: string
  allowFiles?: boolean
  imageDisabledReason?: string
}

interface SpeechResult { isFinal: boolean; readonly [index: number]: { transcript: string } }
interface SpeechEvent { results: ArrayLike<SpeechResult> }
interface SpeechRecognizer {
  lang: string; continuous: boolean; interimResults: boolean
  onresult: ((event: SpeechEvent) => void) | null
  onerror: ((event: { error: string }) => void) | null
  onend: (() => void) | null
  start(): void; stop(): void; abort(): void
}
type SpeechConstructor = new () => SpeechRecognizer
function speechConstructor(): SpeechConstructor | undefined {
  const target = window as Window & { SpeechRecognition?: SpeechConstructor; webkitSpeechRecognition?: SpeechConstructor }
  return target.SpeechRecognition || target.webkitSpeechRecognition
}

/** Owns capture and upload UI. The application decides whether a message consults Agent or appends a card. */
export function MediaComposer({ onSend, onDraftChange, draftScope = '', draftConversationId = '', hidden = false, disabled = false, placeholder = '输入你的问题...', allowFiles = false, imageDisabledReason = '' }: Props) {
  const initialDraft = useRef(readConsultationDraft(draftScope, draftConversationId)?.composer)
  const [text, setText] = useState(initialDraft.current?.text || '')
  const [media, setMedia] = useState<PendingMedia[]>(() => (initialDraft.current?.attachments || []).map((attachment, index) => ({ id: `restored-${index}`, file: new File([], attachment.file_name || '已上传图片', { type: attachment.mime_type || 'image/png' }), preview: '', attachment })))
  const [error, setError] = useState(initialDraft.current?.pendingFiles ? '上次关闭时有尚未上传完成的图片，请重新选择。' : '')
  const [sending, setSending] = useState(false)
  const [recording, setRecording] = useState(false)
  const [seconds, setSeconds] = useState(0)
  useEffect(() => { onDraftChange?.(Boolean(text.trim() || media.length || recording)) }, [text, media.length, recording, onDraftChange])
  const mediaRef = useRef<PendingMedia[]>(media)
  const recognizerRef = useRef<SpeechRecognizer | null>(null)
  const timerRef = useRef<ReturnType<typeof setInterval>>()
  const stopTimerRef = useRef<ReturnType<typeof setTimeout>>()
  const mounted = useRef(true)
  const sendingRef = useRef(false)
  const requestId = useRef(newClientRequestId())
  const speechGeneration = useRef(0)
  const textRef = useRef(text)
  const speechBase = useRef('')
  const speechFinal = useRef('')
  const setDraft = (value: string) => { textRef.current = value; setText(value); requestId.current = newClientRequestId() }
  useEffect(() => {
    if (!draftScope) return
    const ok = saveConsultationDraft(draftScope, draftConversationId, { composer: { text, attachments: media.filter(m => m.attachment).map(m => m.attachment!), pendingFiles: media.some(m => !m.attachment) } })
    if (!ok) setError('当前浏览器无法保存草稿，请勿关闭页面；已发送的咨询记录不受影响。')
  }, [text, media, draftScope, draftConversationId])
  const joinedDraft = (transcript: string) => speechBase.current + (speechBase.current && transcript ? '\n' : '') + transcript
  const finishSpeech = (restore = false) => {
    speechGeneration.current++
    const recognizer = recognizerRef.current
    recognizerRef.current = null
    clearInterval(timerRef.current); clearTimeout(stopTimerRef.current)
    if (recognizer) {
      recognizer.onresult = null; recognizer.onerror = null; recognizer.onend = null
      recognizer.abort()
    }
    if (mounted.current) { setDraft(restore ? speechBase.current : joinedDraft(speechFinal.current)); setRecording(false) }
  }

  const updateMedia = (next: PendingMedia[]) => { mediaRef.current = next; setMedia(next) }
  useEffect(() => { mounted.current = true; return () => {
    mounted.current = false
    speechGeneration.current++
    clearInterval(timerRef.current); clearTimeout(stopTimerRef.current)
    const recognizer = recognizerRef.current
    if (recognizer) { recognizer.onresult = null; recognizer.onerror = null; recognizer.onend = null; recognizer.abort() }
    mediaRef.current.forEach((m) => m.preview && URL.revokeObjectURL(m.preview))
  } }, [])

  const upload = async (entry: PendingMedia) => {
    try {
      const uploaded = await uploadFeedbackFileV2({ file: entry.file })
      const attachment = uploaded
      if (mounted.current) updateMedia(mediaRef.current.map((m) => m.id === entry.id ? { ...m, attachment, error: undefined } : m))
    } catch (e) {
      if (mounted.current) updateMedia(mediaRef.current.map((m) => m.id === entry.id ? { ...m, error: e instanceof Error ? e.message : '上传失败' } : m))
    }
  }
  const addFiles = (files: File[]) => {
    setError('')
    for (const file of files) {
      if (imageDisabledReason && file.type.startsWith('image/')) { setError(imageDisabledReason); continue }
      if (file.type.startsWith('audio/') || /\.(webm|ogg|oga|mp3|mp4|m4a|wav|aac|flac)$/i.test(file.name)) { setError('请使用语音输入转成文字后发送，不支持发送音频附件。'); continue }
      const validation = allowFiles && !file.type.startsWith('image/')
        ? (!file.size || file.size > 10 * 1024 * 1024 ? '附件应小于10MB且不能为空' : '')
        : validateMedia(file, mediaRef.current.map((m) => ({ type: 'image', size: m.file.size })))
      if (validation) { setError(validation); continue }
      const entry = { id: newClientRequestId(), file, preview: URL.createObjectURL(file) }
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
  const stopSpeech = () => {
    clearInterval(timerRef.current)
    try { recognizerRef.current?.stop() } catch { finishSpeech() }
    // Some browser engines fail to emit end after stop; release the session.
    if (recognizerRef.current) stopTimerRef.current = setTimeout(() => finishSpeech(), 5000)
  }
  const startSpeech = () => {
    if (recognizerRef.current) return
    const Constructor = speechConstructor()
    if (!Constructor) { setError('当前浏览器不支持语音转文字，请使用支持此功能的浏览器，或直接输入文字。'); return }
    const generation = ++speechGeneration.current
    speechBase.current = textRef.current; speechFinal.current = ''
    setError(''); setSeconds(0)
    let recognizer: SpeechRecognizer
    try {
      recognizer = new Constructor()
      recognizerRef.current = recognizer
      recognizer.lang = 'zh-CN'; recognizer.continuous = true; recognizer.interimResults = true
      const active = () => mounted.current && speechGeneration.current === generation
      recognizer.onresult = (event) => {
        if (!active()) return
        let final = '', interim = ''
        for (let index = 0; index < event.results.length; index++) {
          const result = event.results[index]
          if (result.isFinal) final += result[0].transcript
          else interim += result[0].transcript
        }
        speechFinal.current = final
        setDraft(joinedDraft(final + interim))
      }
      recognizer.onerror = (event) => {
        if (!active()) return
        finishSpeech()
        setError(event.error === 'not-allowed' || event.error === 'service-not-allowed'
          ? '无法使用麦克风或语音识别权限，请检查浏览器与宿主授权；也可以直接输入文字。'
          : event.error === 'no-speech' ? '未识别到语音，请重试或直接输入文字。'
          : '语音转文字暂时不可用，请稍后重试或直接输入文字。')
      }
      recognizer.onend = () => { if (active()) finishSpeech() }
      recognizer.start(); setRecording(true)
      let elapsed = 0
      timerRef.current = setInterval(() => { elapsed++; setSeconds(elapsed); if (elapsed >= 60) stopSpeech() }, 1000)
    } catch {
      finishSpeech()
      setError('无法启动语音转文字，请检查麦克风权限，或直接输入文字。')
    }
  }
  useEffect(() => {
    const pause = () => { if (recognizerRef.current) finishSpeech() }
    const visibility = () => { if (document.visibilityState === 'hidden') pause() }
    window.addEventListener('feedback-sdk:pause-media', pause)
    document.addEventListener('visibilitychange', visibility)
    return () => { window.removeEventListener('feedback-sdk:pause-media', pause); document.removeEventListener('visibilitychange', visibility) }
  }, [])
  useEffect(() => { if (disabled && recognizerRef.current) finishSpeech() }, [disabled])
  const uploading = media.some((m) => !m.attachment && !m.error)
  const send = async () => {
    if (sendingRef.current || disabled || recording || uploading) return
    if (!text.trim() && !media.length) { setError('请输入问题'); return }
    if (imageDisabledReason && media.some((m) => m.file.type.startsWith('image/') || m.attachment?.type === 'image')) { setError(imageDisabledReason); return }
    if (media.some((m) => !m.attachment)) { setError('请先重试或移除上传失败的附件'); return }
    sendingRef.current = true; setSending(true); setError('')
    try {
      await onSend(text.trim(), media.map((m) => m.attachment!), requestId.current)
      if (mounted.current) { setDraft(''); mediaRef.current.forEach((m) => URL.revokeObjectURL(m.preview)); updateMedia([]); requestId.current = newClientRequestId() }
    } catch (e) { if (mounted.current) setError(e instanceof Error ? e.message : '发送失败，请重试') }
    finally { sendingRef.current = false; if (mounted.current) setSending(false) }
  }
  const locked = disabled || sending
  return <div hidden={hidden} className="sdk-composer">
    {recording && <div className="sdk-recording" role="status">● 正在语音转文字 {String(Math.floor(seconds / 60)).padStart(2, '0')}:{String(seconds % 60).padStart(2, '0')} / 01:00 <button type="button" onClick={() => finishSpeech(true)}>取消</button><button type="button" onClick={() => stopSpeech()}>完成转写</button></div>}
    {media.length > 0 && <div className="sdk-media-previews">{media.map((entry) => <div key={entry.id} className="sdk-media-preview">
      {entry.preview && entry.file.type.startsWith('image/') ? <img src={entry.preview} alt={entry.file.name} /> : entry.attachment ? <span>已恢复上传附件</span> : null}
      <small>{entry.file.name} · {entry.attachment ? '已上传' : entry.error || '上传中…'}</small>
      {entry.error && <button type="button" disabled={locked} onClick={() => { updateMedia(mediaRef.current.map((m) => m.id === entry.id ? { ...m, error: undefined } : m)); void upload(entry) }}>重试</button>}
      <button type="button" disabled={locked} aria-label={`移除 ${entry.file.name}`} onClick={() => remove(entry.id)}>×</button>
    </div>)}</div>}
    <textarea value={text} onChange={(e) => { if (recognizerRef.current) finishSpeech(); setDraft(e.target.value) }} disabled={locked} placeholder={placeholder} rows={3} aria-label={placeholder}
      onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing && e.keyCode !== 229) { e.preventDefault(); void send() } }}
      onPaste={(e) => { const files = [...e.clipboardData.files].filter((f) => f.type.startsWith('image/')); if (files.length) { e.preventDefault(); addFiles(files) } }}
      onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); if (!locked) addFiles([...e.dataTransfer.files]) }} />
    <div className="sdk-composer-tools"><div className="flex items-center gap-3">
      <label className="sdk-media-tool" aria-disabled={Boolean(imageDisabledReason) || locked || recording}><span aria-hidden="true">▧</span> 图片<input aria-label="添加图片" className="sr-only" type="file" accept="image/jpeg,image/png,image/webp,image/gif" multiple disabled={Boolean(imageDisabledReason) || locked || recording} onChange={(e) => { addFiles([...(e.target.files || [])]); e.target.value = '' }} /></label>
      <button type="button" disabled={locked || recording} onClick={startSpeech} className="sdk-media-tool"><span aria-hidden="true">♩</span> 语音输入</button>
      {allowFiles && <label className="cursor-pointer text-xs text-foreground-secondary">文件<input aria-label="添加文件" className="sr-only" type="file" disabled={locked} onChange={(e) => { addFiles([...(e.target.files || [])]); e.target.value = '' }} /></label>}
    </div><div className="sdk-send-tools"><small>Enter 发送</small><button type="button" onClick={() => void send()} disabled={locked || uploading || recording} className="sdk-button primary">{sending ? '发送中…' : '发送'}<span aria-hidden="true"> ↑</span></button></div></div>
    {error && <p role="alert" className="mt-2 text-xs text-error">{error}</p>}
    {imageDisabledReason && <p role="status" className="mt-2 text-xs text-foreground-secondary">{imageDisabledReason}</p>}
  </div>
}
