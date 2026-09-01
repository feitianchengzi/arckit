import { useCallback, useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { FeedbackShell } from '@/components/sdk/FeedbackShell'
import { FeedbackSubmitStep, type FeedbackSubmitImage } from '@/components/sdk/FeedbackSubmitStep'
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

const MAX_FEEDBACK_IMAGES = 9
const MAX_IMAGE_SIZE = 10 * 1024 * 1024
const MAX_TOTAL_IMAGE_SIZE = 20 * 1024 * 1024
const SUPPORTED_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif'])

interface SelectedFeedbackImage extends FeedbackSubmitImage {
  file: File
  uploadedFileKey: string
  uploadedAttachment: FeedbackV2Attachment | null
}

function createImageID() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') return crypto.randomUUID()
  return `feedback_image_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`
}

export function SDKSubmitPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const [content, setContent] = useState('')
  const [images, setImages] = useState<SelectedFeedbackImage[]>([])
  const [submitError, setSubmitError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [uploadError, setUploadError] = useState('')
  const [pickerWarning, setPickerWarning] = useState('')
  const pickerAttemptRef = useRef(0)
  const imagesRef = useRef<SelectedFeedbackImage[]>([])
  const previewURLsRef = useRef(new Set<string>())

  const updateImage = useCallback((imageID: string, update: Partial<SelectedFeedbackImage>) => {
    setImages((current) => {
      const next = current.map((image) => image.id === imageID ? { ...image, ...update } : image)
      imagesRef.current = next
      return next
    })
  }, [])

  const uploadImage = useCallback(async (image: SelectedFeedbackImage) => {
    updateImage(image.id, { status: 'uploading', progress: 0, error: '', uploadedFileKey: '', uploadedAttachment: null })
    try {
      if (getFeedbackSDKConfig().feedbackV2Enabled === true) {
        const attachment = await uploadFeedbackImageV2({
          file: image.file,
          onProgress: (progress) => updateImage(image.id, { progress }),
        })
        updateImage(image.id, {
          status: 'uploaded',
          progress: 1,
          uploadedAttachment: attachment,
          uploadedFileKey: attachment.object_key || '',
        })
        return
      }

      const apiKey = getOrPersistApiKey()
      if (!apiKey) throw new Error('未检测到 API Key，无法上传图片')
      const result = await uploadFeedbackImageByApiKey({
        apiKey,
        file: image.file,
        onProgress: (progress) => updateImage(image.id, { progress }),
      })
      updateImage(image.id, { status: 'uploaded', progress: 1, uploadedFileKey: result.objectKey })
    } catch (error: any) {
      const message = error?.message || '图片上传失败'
      updateImage(image.id, { status: 'error', error: message })
      setUploadError(`${image.name}：${message}`)
    }
  }, [updateImage])

  const handleUploadFiles = useCallback((selectedFiles: File[]) => {
    pickerAttemptRef.current += 1
    setPickerWarning('')
    setUploadError('')
    if (!selectedFiles.length) return

    const useV2 = getFeedbackSDKConfig().feedbackV2Enabled === true
    const maxImages = useV2 ? MAX_FEEDBACK_IMAGES : 1
    let current = imagesRef.current
    if (!useV2 && current.length) {
      current.forEach((image) => {
        URL.revokeObjectURL(image.previewUrl)
        previewURLsRef.current.delete(image.previewUrl)
      })
      current = []
    }

    const availableSlots = Math.max(0, maxImages - current.length)
    const candidates = selectedFiles.slice(0, availableSlots)
    const rejectedMessages: string[] = []
    if (selectedFiles.length > availableSlots) {
      rejectedMessages.push(`最多选择 ${maxImages} 张图片，超出的图片未添加`)
    }

    let totalSize = current.reduce((sum, image) => sum + image.file.size, 0)
    const nextImages: SelectedFeedbackImage[] = []
    candidates.forEach((file) => {
      const mimeType = file.type.trim().toLowerCase()
      if (!SUPPORTED_IMAGE_TYPES.has(mimeType)) {
        rejectedMessages.push(`${file.name} 格式不支持`)
        return
      }
      if (file.size <= 0 || file.size > MAX_IMAGE_SIZE) {
        rejectedMessages.push(`${file.name} 超过单张 10MB 限制`)
        return
      }
      if (totalSize + file.size > MAX_TOTAL_IMAGE_SIZE) {
        rejectedMessages.push(`${file.name} 添加后会超过图片总计 20MB 限制`)
        return
      }

      totalSize += file.size
      const previewUrl = URL.createObjectURL(file)
      previewURLsRef.current.add(previewUrl)
      nextImages.push({
        id: createImageID(),
        file,
        name: file.name || '截图',
        previewUrl,
        status: 'uploading',
        progress: 0,
        error: '',
        uploadedFileKey: '',
        uploadedAttachment: null,
      })
    })

    const next = [...current, ...nextImages]
    imagesRef.current = next
    setImages(next)
    if (rejectedMessages.length) setUploadError(rejectedMessages.join('；'))
    nextImages.forEach((image) => void uploadImage(image))
  }, [uploadImage])

  const removeImage = useCallback((imageID: string) => {
    const removed = imagesRef.current.find((image) => image.id === imageID)
    if (removed) {
      URL.revokeObjectURL(removed.previewUrl)
      previewURLsRef.current.delete(removed.previewUrl)
    }
    const next = imagesRef.current.filter((image) => image.id !== imageID)
    imagesRef.current = next
    setImages(next)
    setUploadError('')
  }, [])

  const retryImage = useCallback((imageID: string) => {
    const image = imagesRef.current.find((item) => item.id === imageID)
    if (!image) return
    setUploadError('')
    void uploadImage(image)
  }, [uploadImage])

  useEffect(() => {
    if (!getFeedbackSDKConfig().feedbackV2Enabled) {
      getOrPersistApiKey()
      getOrPersistCustomUserId()
    }
  }, [])

  useEffect(() => () => {
    previewURLsRef.current.forEach((url) => URL.revokeObjectURL(url))
    previewURLsRef.current.clear()
  }, [])

  useEffect(() => {
    const handleNativeImage = (event: Event) => {
      pickerAttemptRef.current += 1
      setPickerWarning('')
      try {
        const payload = (event as CustomEvent<FeedbackSDKNativeImagePayload>).detail
        const file = base64PayloadToFile(payload || {})
        handleUploadFiles([file])
      } catch (error: any) {
        setUploadError(error?.message || '原生图片读取失败，请重试')
      }
    }

    window.addEventListener(FEEDBACK_SDK_NATIVE_IMAGE_EVENT, handleNativeImage)
    return () => window.removeEventListener(FEEDBACK_SDK_NATIVE_IMAGE_EVENT, handleNativeImage)
  }, [handleUploadFiles])

  const submitFeedback = async () => {
    const uploading = images.some((image) => image.status === 'uploading')
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
        if (images.some((image) => image.status !== 'uploaded' || !image.uploadedAttachment)) {
          throw new Error('仍有图片未上传成功，请重试或移除后再提交')
        }
        await submitFeedbackV2({
          content: trimmedContent,
          attachments: images.map((image) => image.uploadedAttachment).filter(Boolean) as FeedbackV2Attachment[],
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
      const image = images[0]
      if (image && !image.uploadedFileKey) {
        throw new Error('图片尚未上传完成，请稍后再提交')
      }
      await submitFeedbackByApiKey({
        apiKey,
        projectId,
        customUserId,
        content: trimmedContent,
        imageName: image?.name || '',
        fileKey: image?.uploadedFileKey || '',
      })

      navigate({ pathname: '/status', search: location.search })
    } catch (error: any) {
      setSubmitError(error?.message || '提交失败，请稍后重试')
    } finally {
      setSubmitting(false)
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

    const maximumImages = getFeedbackSDKConfig().feedbackV2Enabled === true ? MAX_FEEDBACK_IMAGES : 1

    picker.postMessage({
      type: 'pickImage',
      accept: 'image/*',
      source: 'feedback-sdk-web',
      maximumSelectionCount: Math.max(1, maximumImages - imagesRef.current.length),
    })
    return true
  }

  const contentWrapClass = 'mx-auto w-full max-w-[980px]'
  const innerWrapClass = 'space-y-4 px-2 md:px-3'
  const formWrapClass = 'mx-auto w-full max-w-[760px]'
  const uploading = images.some((image) => image.status === 'uploading')
  const maxImages = getFeedbackSDKConfig().feedbackV2Enabled === true ? MAX_FEEDBACK_IMAGES : 1

  return (
    <div className="min-h-[100dvh] bg-surface px-4 py-6 md:px-6">
      <div className={contentWrapClass}>
        <FeedbackShell mode="embed">
          <div className={innerWrapClass}>
            <div className={formWrapClass}>
              <FeedbackSubmitStep
                value={content}
                images={images}
                maxImages={maxImages}
                disabled={submitting}
                submitError={submitError}
                uploadError={uploadError}
                uploading={uploading}
                pickerWarning={pickerWarning}
                onChange={setContent}
                onUpload={handleUploadFiles}
                onRemoveImage={removeImage}
                onRetryImage={retryImage}
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
