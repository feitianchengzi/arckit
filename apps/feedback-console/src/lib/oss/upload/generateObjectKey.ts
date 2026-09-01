/**
 * 生成 OSS objectKey
 */

import { joinPath } from '../sdk'
import type { OSSDirectory } from './types'

/**
 * 生成 OSS objectKey
 * @param rootPath OSS 根路径
 * @param directory 文件目录（例如：'avatars'、'attachments'、'documents'）
 * @param fileName 文件名
 * @returns 完整的 objectKey
 */
export function generateObjectKey(
  rootPath: string,
  directory: OSSDirectory,
  fileName: string
): string {
  return joinPath(rootPath, `${directory}/${fileName}`)
}

