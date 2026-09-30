import { useCallback, useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { FeedbackShell } from '@/components/sdk/FeedbackShell'
import { FeedbackSubmitStep, type FeedbackSubmitImage } from '@/components/sdk/FeedbackSubmitStep'
import { getOrPersistApiKey, getOrPersistCustomUserId, resolveProjectId, submitFeedbackByApiKey } from '@/lib/feedback/api'
import { submitFeedbackV2, type FeedbackV2Attachment } from '@/lib/feedback/v2'
import { uploadFeedbackImageByApiKey, uploadFeedbackImageV2 } from '@/lib/feedback/upload'
import { FEEDBACK_SDK_NATIVE_IMAGE_EVENT, getFeedbackSDKConfig, type FeedbackSDKNativeImagePayload } from '@/lib/sdk'
import { t } from '@/i18n'

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
    throw new Error(t('submit.error_native_image_empty'))
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
      if (!apiKey) throw new Error(t('submit.error_upload_no_apikey'))
      const result = await uploadFeedbackImageByApiKey({
        apiKey,
        file: image.file,
        onProgress: (progress) => updateImage(image.id, { progress }),
      })
      updateImage(image.id, { status: 'uploaded', progress: 1, uploadedFileKey: result.objectKey })
    } catch (error: any) {
      const message = error?.message || t('submit.error_upload_image')
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
      rejectedMessages.push(t('submit.image_max_count', { max: maxImages }))
    }

    let totalSize = current.reduce((sum, image) => sum + image.file.size, 0)
    const nextImages: SelectedFeedbackImage[] = []
    candidates.forEach((file) => {
      const mimeType = file.type.trim().toLowerCase()
      if (!SUPPORTED_IMAGE_TYPES.has(mimeType)) {
        rejectedMessages.push(t('submit.image_unsupported', { name: file.name }))
        return
      }
      if (file.size <= 0 || file.size > MAX_IMAGE_SIZE) {
        rejectedMessages.push(t('submit.image_too_large', { name: file.name }))
        return
      }
      if (totalSize + file.size > MAX_TOTAL_IMAGE_SIZE) {
        rejectedMessages.push(t('submit.image_total_too_large', { name: file.name }))
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
        setUploadError(error?.message || t('submit.error_native_read'))
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
      setSubmitError(t('submit.error_empty'))
      return
    }

    setSubmitting(true)
    try {
      const useV2 = getFeedbackSDKConfig().feedbackV2Enabled === true
      if (useV2) {
        if (images.some((image) => image.status !== 'uploaded' || !image.uploadedAttachment)) {
          throw new Error(t('submit.error_images_uploading'))
        }
        const submitted = await submitFeedbackV2({
          content: trimmedContent,
          attachments: images.map((image) => image.uploadedAttachment).filter(Boolean) as FeedbackV2Attachment[],
        })
        // 提交后进入智能客服会话：反馈内容自动发给 Agent（基于代码库推理），
        // 客户可在对话窗口继续追问，并在“我的反馈”查看进展。
        const chatParams = new URLSearchParams(location.search)
        chatParams.set('feedback', String(submitted.id))
        chatParams.set('q', trimmedContent)
        navigate({ pathname: '/chat', search: `?${chatParams.toString()}` })
        return
      }

      const apiKey = getOrPersistApiKey()
      if (!apiKey) {
        throw new Error(t('submit.error_no_apikey'))
      }

      const customUserId = getOrPersistCustomUserId()
      const projectId = await resolveProjectId(undefined, apiKey)
      const image = images[0]
      if (image && !image.uploadedFileKey) {
        throw new Error(t('submit.error_images_pending'))
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
      setSubmitError(error?.message || t('submit.error_failed'))
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
        setPickerWarning(t('submit.picker_waiting'))
      }, 12000)
      return
    }

    const checkReturnedFile = () => {
      window.setTimeout(() => {
        if (pickerAttemptRef.current !== attempt) return
        setPickerWarning(t('submit.picker_none'))
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
