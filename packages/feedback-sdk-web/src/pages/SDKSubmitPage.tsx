import { useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { FeedbackShell } from '@/components/sdk/FeedbackShell'
import { FeedbackSubmitStep } from '@/components/sdk/FeedbackSubmitStep'
import { getOrPersistApiKey, getOrPersistCustomUserId, resolveProjectId, submitFeedbackByApiKey } from '@/lib/feedback/api'
import { submitFeedbackV2, type FeedbackV2Attachment } from '@/lib/feedback/v2'
import { uploadFeedbackImageByApiKey, uploadFeedbackImageV2 } from '@/lib/feedback/upload'
import { FEEDBACK_SDK_NATIVE_IMAGE_EVENT, getFeedbackSDKConfig, type FeedbackSDKNativeImagePayload } from '@/lib/sdk'

declare global {
  interface Window {
    webkit?: {
      messageHandlers?: {
        FeedbackSDKImagePicker?: {
          postMessage: (payload: unknown) => void
        }
      }
    }
  }
}

function base64PayloadToFile(payload: FeedbackSDKNativeImagePayload): File {
  const dataUrl = payload.dataUrl?.trim()
  const base64Text = payload.base64?.trim() || (dataUrl ? dataUrl.split(',')[1] : '')
  if (!base64Text) {
    throw new Error('原生图片数据为空')
  }

  const inferredMime = dataUrl?.match(/^data:([^;,]+)[;,]/)?.[1]
  const mimeType = payload.mimeType || payload.type || inferredMime || 'image/jpeg'
  const extension = mimeType.includes('png') ? 'png' : mimeType.includes('webp') ? 'webp' : 'jpg'
  const fileName = payload.name?.trim() || `feedback-screenshot.${extension}`
  const binary = atob(base64Text)
  const bytes = new Uint8Array(binary.length)
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index)
  }

  return new File([bytes], fileName, { type: mimeType })
}

export function SDKSubmitPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const [content, setContent] = useState('')
  const [imageName, setImageName] = useState('')
  const [submitError, setSubmitError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadError, setUploadError] = useState('')
  const [pickerWarning, setPickerWarning] = useState('')
  const [uploadedFileKey, setUploadedFileKey] = useState('')
  const [uploadedAttachment, setUploadedAttachment] = useState<FeedbackV2Attachment | null>(null)
  const pickerAttemptRef = useRef(0)

  useEffect(() => {
    if (!getFeedbackSDKConfig().feedbackV2Enabled) {
      getOrPersistApiKey()
      getOrPersistCustomUserId()
    }
  }, [])

  useEffect(() => {
    const handleNativeImage = (event: Event) => {
      pickerAttemptRef.current += 1
      setPickerWarning('')
      try {
        const payload = (event as CustomEvent<FeedbackSDKNativeImagePayload>).detail
        const file = base64PayloadToFile(payload || {})
        void handleUploadFile(file)
      } catch (error: any) {
        setUploadError(error?.message || '原生图片读取失败，请重试')
      }
    }

    window.addEventListener(FEEDBACK_SDK_NATIVE_IMAGE_EVENT, handleNativeImage)
    return () => window.removeEventListener(FEEDBACK_SDK_NATIVE_IMAGE_EVENT, handleNativeImage)
  }, [])

  const submitFeedback = async () => {
    if (submitting || uploading) return

    setSubmitError('')
    const trimmedContent = content.trim()
    if (!trimmedContent) {
      setSubmitError('请输入反馈内容')
      return
    }

    setSubmitting(true)
    try {
      const useV2 = getFeedbackSDKConfig().feedbackV2Enabled === true
      if (useV2) {
        if (imageName && !uploadedAttachment) {
          throw new Error('图片尚未上传完成，请稍后再提交')
        }
        await submitFeedbackV2({
          content: trimmedContent,
          attachments: uploadedAttachment ? [uploadedAttachment] : [],
        })
        navigate({ pathname: '/status', search: location.search })
        return
      }

      const apiKey = getOrPersistApiKey()
      if (!apiKey) {
        throw new Error('未检测到 API Key，请先通过 window.FeedbackSDK.configure({ apiKey }) 注入。')
      }

      const customUserId = getOrPersistCustomUserId()
      const projectId = await resolveProjectId(undefined, apiKey)
      if (imageName && !uploadedFileKey) {
        throw new Error('图片尚未上传完成，请稍后再提交')
      }
      await submitFeedbackByApiKey({
        apiKey,
        projectId,
        customUserId,
        content: trimmedContent,
        imageName,
        fileKey: uploadedFileKey,
      })

      navigate({ pathname: '/status', search: location.search })
    } catch (error: any) {
      setSubmitError(error?.message || '提交失败，请稍后重试')
    } finally {
      setSubmitting(false)
    }
  }

  const handleUploadFile = async (file: File | null) => {
    pickerAttemptRef.current += 1
    setPickerWarning('')
    setUploadError('')
    setUploadedFileKey('')
    setUploadedAttachment(null)
    setUploadProgress(0)
    setImageName(file?.name || '')

    if (!file) return

    setUploading(true)
    try {
      if (getFeedbackSDKConfig().feedbackV2Enabled === true) {
        const attachment = await uploadFeedbackImageV2({ file, onProgress: setUploadProgress })
        setUploadedAttachment(attachment)
        setUploadedFileKey(attachment.object_key || '')
        return
      }

      const apiKey = getOrPersistApiKey()
      if (!apiKey) {
        throw new Error('未检测到 API Key，无法上传图片')
      }
      const result = await uploadFeedbackImageByApiKey({
        apiKey,
        file,
        onProgress: setUploadProgress,
      })
      setUploadedFileKey(result.objectKey)
    } catch (error: any) {
      setUploadError(error?.message || '图片上传失败')
    } finally {
      setUploading(false)
    }
  }

  const handlePickerStarted = (mode: 'web' | 'native') => {
    const attempt = pickerAttemptRef.current + 1
    pickerAttemptRef.current = attempt
    setPickerWarning('')
    console.info(`[FeedbackSDK] image picker started: ${mode}`)

    if (mode === 'native') {
      window.setTimeout(() => {
        if (pickerAttemptRef.current !== attempt) return
        setPickerWarning('等待 App 返回截图。如果长时间没有变化，请检查原生 FeedbackSDKImagePicker 是否调用 window.FeedbackSDK.setImageFromNative。')
      }, 12000)
      return
    }

    const checkReturnedFile = () => {
      window.setTimeout(() => {
        if (pickerAttemptRef.current !== attempt) return
        setPickerWarning('没有检测到已选择的截图。如果你正在 iOS App WebView 中使用 SDK，请确认宿主 WebView 支持 <input type="file">，或接入 FeedbackSDKImagePicker 原生图片选择桥。')
        console.warn('[FeedbackSDK] image picker returned without a file change event')
      }, 700)
    }

    window.setTimeout(() => window.addEventListener('focus', checkReturnedFile, { once: true }), 0)
    window.setTimeout(checkReturnedFile, 15000)
  }

  const requestNativeImage = (): boolean => {
    const picker = window.webkit?.messageHandlers?.FeedbackSDKImagePicker
    if (!picker?.postMessage) {
      return false
    }

    picker.postMessage({
      type: 'pickImage',
      accept: 'image/*',
      source: 'feedback-sdk-web',
    })
    return true
  }

  const contentWrapClass = 'mx-auto w-full max-w-[980px]'
  const innerWrapClass = 'space-y-4 px-2 md:px-3'
  const formWrapClass = 'mx-auto w-full max-w-[760px]'

  return (
    <div className="min-h-[100dvh] bg-surface px-4 py-6 md:px-6">
      <div className={contentWrapClass}>
        <FeedbackShell mode="embed">
          <div className={innerWrapClass}>
            <div className={formWrapClass}>
              <FeedbackSubmitStep
                value={content}
                imageName={imageName}
                disabled={submitting || uploading}
                submitError={submitError}
                uploadError={uploadError}
                uploading={uploading}
                uploadProgress={uploadProgress}
                uploadedFileKey={uploadedFileKey}
                pickerWarning={pickerWarning}
                onChange={setContent}
                onUpload={handleUploadFile}
                onPickerStarted={handlePickerStarted}
                onRequestNativeImage={requestNativeImage}
                onNext={submitFeedback}
              />
            </div>
          </div>
        </FeedbackShell>
      </div>
    </div>
  )
}
