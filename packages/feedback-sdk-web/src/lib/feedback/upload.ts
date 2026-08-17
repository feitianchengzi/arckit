import { getFeedbackSDKConfig } from '@/lib/sdk'
import { createFeedbackUploadPolicyV2, getFeedbackAttachmentOSSCredentialsV2, type FeedbackV2Attachment } from './v2'

declare global {
  interface Window {
    OSS?: any
  }
}

interface ApiEnvelope<T> {
  code?: string
  message?: string
  data?: T
  error?: {
    message?: string
  }
}

interface OSSCredentialsResponse {
  access_key_id: string
  access_key_secret: string
  security_token: string
  expiration: string
  bucket_name: string
  region: string
  root_path: string
  authorization_v4: boolean
  secure: boolean
}

interface OSSCredentials {
  accessKeyId: string
  accessKeySecret: string
  securityToken: string
  expiration: string
  bucketName: string
  region: string
  rootPath: string
  authorizationV4: boolean
  secure: boolean
}

function trimValue(value?: string | null): string {
  return (value || '').trim()
}

function getGatewayBaseUrl(): string {
  const cfg = getFeedbackSDKConfig()
  if (cfg.gatewayUrl?.trim()) return cfg.gatewayUrl.trim()
  if (import.meta.env.DEV) return '/gateway'
  return import.meta.env.VITE_GATEWAY_URL || 'https://api.feitianchengzi.com'
}

async function requestJson<T>(input: RequestInfo, init?: RequestInit): Promise<T> {
  const response = await fetch(input, init)
  const json = (await response.json().catch(() => ({}))) as ApiEnvelope<T>

  if (!response.ok) {
    const message = json.error?.message || json.message || `Request failed: ${response.status}`
    throw new Error(message)
  }

  if (json.code && json.code !== 'OK') {
    throw new Error(json.error?.message || json.message || `API error: ${json.code}`)
  }

  return (json.data ?? (json as unknown as T))
}

async function loadOSSSDK(): Promise<any> {
  if (typeof window === 'undefined') {
    throw new Error('浏览器环境不可用，无法上传文件')
  }

  if (window.OSS) {
    return window.OSS
  }

  return new Promise((resolve, reject) => {
    const script = document.createElement('script')
    script.src = 'https://gosspublic.alicdn.com/aliyun-oss-sdk-6.23.0.min.js'
    script.async = true
    script.onload = () => {
      if (window.OSS) {
        resolve(window.OSS)
      } else {
        reject(new Error('OSS SDK 加载失败'))
      }
    }
    script.onerror = () => reject(new Error('无法加载 OSS SDK'))
    document.head.appendChild(script)
  })
}

function getFileExtension(filename: string): string {
  const index = filename.lastIndexOf('.')
  if (index <= 0) return 'jpg'
  return filename.slice(index + 1).toLowerCase()
}

function joinPath(left: string, right: string): string {
  const leftTrimmed = left.replace(/\/+$/g, '')
  const rightTrimmed = right.replace(/^\/+/g, '')
  return leftTrimmed ? `${leftTrimmed}/${rightTrimmed}` : rightTrimmed
}

function buildFeedbackObjectKey(rootPath: string, filename: string): string {
  const ext = getFileExtension(filename)
  const timestamp = Date.now()
  const random = Math.random().toString(36).slice(2, 10)
  return joinPath(rootPath, `feedbacks/${timestamp}_${random}.${ext}`)
}

async function getOSSCredentials(apiKey: string): Promise<OSSCredentials> {
  const data = await requestJson<OSSCredentialsResponse>(`${getGatewayBaseUrl()}/workshop/v1/apikey/oss/credentials`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${apiKey}`,
    },
  })

  return {
    accessKeyId: data.access_key_id,
    accessKeySecret: data.access_key_secret,
    securityToken: data.security_token,
    expiration: data.expiration,
    bucketName: data.bucket_name,
    region: data.region,
    rootPath: data.root_path,
    authorizationV4: data.authorization_v4,
    secure: data.secure,
  }
}

export async function uploadFeedbackImageByApiKey(params: {
  apiKey: string
  file: File
  onProgress?: (progress: number) => void
}): Promise<{ objectKey: string; signedUrl: string }> {
  const apiKey = trimValue(params.apiKey)
  if (!apiKey) {
    throw new Error('上传失败：API Key 为空')
  }

  const credentials = await getOSSCredentials(apiKey)
  const OSS = await loadOSSSDK()
  const client = new OSS({
    region: credentials.region,
    accessKeyId: credentials.accessKeyId,
    accessKeySecret: credentials.accessKeySecret,
    stsToken: credentials.securityToken,
    bucket: credentials.bucketName,
    secure: credentials.secure,
    authorizationV4: credentials.authorizationV4,
  })

  const objectKey = buildFeedbackObjectKey(credentials.rootPath, params.file.name || 'feedback.jpg')
  const result = await client.put(objectKey, params.file, {
    progress: (progress: number) => {
      params.onProgress?.(progress)
    },
  })

  if (result?.res?.status !== 200) {
    throw new Error(`上传失败：OSS 返回状态 ${String(result?.res?.status || 'unknown')}`)
  }

  const signedUrl = client.signatureUrl(objectKey, {
    expires: 3600,
  })

  return {
    objectKey,
    signedUrl,
  }
}

export async function uploadFeedbackFileV2(params: {
  file: File
  onProgress?: (progress: number) => void
}): Promise<FeedbackV2Attachment> {
  const fileName = trimValue(params.file.name) || 'feedback-attachment'
  const mimeType = trimValue(params.file.type).toLowerCase()
  if (!mimeType) {
    throw new Error('附件缺少 MIME 类型，无法安全上传')
  }
  const type = mimeType.startsWith('image/') ? 'image' : 'file'

  const policy = await createFeedbackUploadPolicyV2({
    type,
    fileName,
    mimeType,
    size: params.file.size,
  })
  const form = new FormData()
  for (const [key, value] of Object.entries(policy.fields)) {
    form.append(key, value)
  }
  // OSS PostObject requires the file form field to be appended last.
  form.append('file', params.file, fileName)

  params.onProgress?.(0.1)
  const response = await fetch(policy.upload_url, { method: 'POST', body: form })
  if (response.status !== 201) {
    throw new Error(`上传失败：OSS 返回状态 ${response.status}`)
  }
  params.onProgress?.(1)

  return {
    type,
    object_key: policy.object_key,
    file_name: fileName,
    mime_type: mimeType,
    size: params.file.size,
  }
}

export async function uploadFeedbackImageV2(params: {
  file: File
  onProgress?: (progress: number) => void
}): Promise<FeedbackV2Attachment> {
  if (!params.file.type.toLowerCase().startsWith('image/')) {
    throw new Error('请选择图片文件')
  }
  return uploadFeedbackFileV2(params)
}

export async function getFeedbackAttachmentURLV2(params: {
  feedbackId: number
  attachmentId: number
  objectKey: string
}): Promise<string> {
  const key = trimValue(params.objectKey).replace(/^\/+/, '')
  if (!key) throw new Error('附件 object_key 为空')
  if (!Number.isFinite(params.feedbackId) || params.feedbackId <= 0 || !Number.isFinite(params.attachmentId) || params.attachmentId <= 0) {
    throw new Error('附件标识无效，无法申请临时访问权限')
  }

  const credentials = await getFeedbackAttachmentOSSCredentialsV2({
    feedbackId: params.feedbackId,
    attachmentId: params.attachmentId,
  })
  const OSS = await loadOSSSDK()
  const client = new OSS({
    region: credentials.region,
    accessKeyId: credentials.access_key_id,
    accessKeySecret: credentials.access_key_secret,
    stsToken: credentials.security_token,
    bucket: credentials.bucket_name,
    secure: credentials.secure,
    authorizationV4: credentials.authorization_v4,
  })
  return client.signatureUrl(key, { expires: 900 })
}
