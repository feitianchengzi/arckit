/**
 * 图片压缩工具
 * 用于在上传前压缩图片，确保文件大小不会太大
 */

/**
 * 压缩图片
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
  return new Promise((resolve, reject) => {
    const img = new Image()
    
    img.onload = () => {
      // 创建 canvas
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      
      if (!ctx) {
        reject(new Error('无法创建 Canvas 上下文'))
        return
      }
      
      // 计算压缩后的尺寸（保持宽高比）
      let width = img.width
      let height = img.height
      const maxDimension = 1200 // 最大尺寸（像素）
      
      if (width > maxDimension || height > maxDimension) {
        if (width > height) {
          height = (height / width) * maxDimension
          width = maxDimension
        } else {
          width = (width / height) * maxDimension
          height = maxDimension
        }
      }
      
      canvas.width = width
      canvas.height = height
      
      // 绘制图片
      ctx.drawImage(img, 0, 0, width, height)
      
      // 递归压缩直到文件大小符合要求
      const tryCompress = (currentQuality: number): void => {
        const compressedDataUrl = canvas.toDataURL('image/jpeg', currentQuality)
        const sizeKB = getDataUrlSizeKB(compressedDataUrl)
        
        // 如果文件大小符合要求，或者质量已经降到最低（0.1），则返回
        if (sizeKB <= maxSizeKB || currentQuality <= 0.1) {
          resolve(compressedDataUrl)
          return
        }
        
        // 继续降低质量压缩
        const newQuality = Math.max(0.1, currentQuality - 0.1)
        tryCompress(newQuality)
      }
      
      tryCompress(quality)
    }
    
    img.onerror = () => {
      reject(new Error('图片加载失败'))
    }
    
    img.src = dataUrl
  })
}

/**
 * 计算 data URL 的大小（KB）
 */
function getDataUrlSizeKB(dataUrl: string): number {
  // data URL 格式: data:image/jpeg;base64,xxxxx
  // 去掉前缀后的 base64 字符串大小 * 0.75 = 实际字节大小
  const base64 = dataUrl.split(',')[1]
  if (!base64) return 0
  const bytes = (base64.length * 3) / 4
  return bytes / 1024 // 转换为 KB
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
