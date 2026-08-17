/**
 * 图片压缩工具
 * 用于在上传前压缩图片，确保文件大小不会太大
 */

export interface CompressImageOptions {
  maxSizeBytes: number
  maxDimension: number
  initialQuality?: number
  minQuality?: number
  qualityStep?: number
  minDimension?: number
  mimeType?: string
}

export interface CompressImageResult {
  dataUrl: string
  sizeBytes: number
  width: number
  height: number
  mimeType: string
  exceeded: boolean
}

const DEFAULT_COMPRESS_OPTIONS = {
  initialQuality: 0.85,
  minQuality: 0.6,
  qualityStep: 0.05,
  minDimension: 320,
  mimeType: 'image/jpeg',
}

function getDataUrlSizeBytes(dataUrl: string): number {
  const base64 = dataUrl.split(',')[1]
  if (!base64) return 0
  return Math.floor((base64.length * 3) / 4)
}

function loadImage(dataUrl: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('图片加载失败'))
    img.src = dataUrl
  })
}

function calculateScaledSize(width: number, height: number, maxDimension: number) {
  const largest = Math.max(width, height)
  if (largest <= maxDimension) {
    return { width: Math.round(width), height: Math.round(height), scale: 1 }
  }
  const scale = maxDimension / largest
  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
    scale,
  }
}

async function compressAtDimension(
  img: HTMLImageElement,
  targetDimension: number,
  options: Required<CompressImageOptions>
): Promise<{ dataUrl: string; sizeBytes: number; width: number; height: number }> {
  const { width, height } = calculateScaledSize(img.width, img.height, targetDimension)
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')

  if (!ctx) {
    throw new Error('无法创建 Canvas 上下文')
  }

  canvas.width = width
  canvas.height = height

  if (options.mimeType === 'image/jpeg') {
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, width, height)
  }

  ctx.drawImage(img, 0, 0, width, height)

  let currentQuality = options.initialQuality
  let lastDataUrl = ''
  let lastSizeBytes = Number.POSITIVE_INFINITY

  while (true) {
    const dataUrl = canvas.toDataURL(options.mimeType, currentQuality)
    const sizeBytes = getDataUrlSizeBytes(dataUrl)
    lastDataUrl = dataUrl
    lastSizeBytes = sizeBytes

    if (sizeBytes <= options.maxSizeBytes || currentQuality <= options.minQuality) {
      break
    }
    currentQuality = Math.max(options.minQuality, currentQuality - options.qualityStep)
  }

  return { dataUrl: lastDataUrl, sizeBytes: lastSizeBytes, width, height }
}

export async function compressImageDataUrl(
  dataUrl: string,
  options: CompressImageOptions
): Promise<CompressImageResult> {
  const resolved: Required<CompressImageOptions> = {
    ...DEFAULT_COMPRESS_OPTIONS,
    ...options,
  }

  const img = await loadImage(dataUrl)

  let currentDimension = Math.max(1, resolved.maxDimension)
  let lastResult: { dataUrl: string; sizeBytes: number; width: number; height: number } | null = null

  while (true) {
    const result = await compressAtDimension(img, currentDimension, resolved)
    lastResult = result

    if (result.sizeBytes <= resolved.maxSizeBytes) {
      return {
        ...result,
        mimeType: resolved.mimeType,
        exceeded: false,
      }
    }

    if (currentDimension <= resolved.minDimension) {
      return {
        ...result,
        mimeType: resolved.mimeType,
        exceeded: true,
      }
    }

    currentDimension = Math.max(resolved.minDimension, Math.floor(currentDimension * 0.85))
  }
}

export async function readFileAsDataUrl(file: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = () => resolve(reader.result as string)
    reader.onerror = () => reject(new Error('文件读取失败'))
    reader.readAsDataURL(file)
  })
}

export async function compressImageFile(
  file: File,
  options: CompressImageOptions & { filename?: string }
): Promise<{ file: File; dataUrl: string; sizeBytes: number; mimeType: string; exceeded: boolean }> {
  const dataUrl = await readFileAsDataUrl(file)
  const result = await compressImageDataUrl(dataUrl, options)
  const filename = options.filename || file.name || 'image.jpg'
  const compressedFile = dataURLtoFile(result.dataUrl, filename)
  return {
    file: compressedFile,
    dataUrl: result.dataUrl,
    sizeBytes: result.sizeBytes,
    mimeType: result.mimeType,
    exceeded: result.exceeded,
  }
}

/**
 * 压缩图片（兼容旧 API）
 * @param dataUrl 图片的 data URL（base64）
 * @param maxSizeKB 最大文件大小（KB），默认 200KB
 * @param quality 初始压缩质量（0-1），默认 0.8
 * @returns 压缩后的 data URL
 */
export async function compressImage(
  dataUrl: string,
  maxSizeKB: number = 200,
  quality: number = 0.8
): Promise<string> {
  const result = await compressImageDataUrl(dataUrl, {
    maxSizeBytes: maxSizeKB * 1024,
    maxDimension: 1200,
    initialQuality: quality,
    minQuality: 0.1,
    qualityStep: 0.1,
  })
  return result.dataUrl
}

/**
 * 将 data URL 转换为 Blob
 */
export function dataURLtoBlob(dataUrl: string): Blob {
  const arr = dataUrl.split(',')
  const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/jpeg'
  const bstr = atob(arr[1])
  let n = bstr.length
  const u8arr = new Uint8Array(n)

  while (n--) {
    u8arr[n] = bstr.charCodeAt(n)
  }

  return new Blob([u8arr], { type: mime })
}

/**
 * 将 data URL 转换为 File
 */
export function dataURLtoFile(dataUrl: string, filename: string = 'image.jpg'): File {
  const blob = dataURLtoBlob(dataUrl)
  return new File([blob], filename, { type: blob.type })
}
