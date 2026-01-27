/**
 * OssResourceManager - OSS 资源统一入口
 * 仅做 Facade：加载转发到 getOssResourceLoader，上传按 purpose 查表后转发到 uploadToOSS。
 * 不实现缓存、合并请求、签名等逻辑。
 *
 * @see frontend/docs/oss/OSS_RESOURCE_MANAGER_DESIGN.md
 * @see frontend/docs/oss/OSS_RESOURCE_MANAGER_DEV_PLAN.md
 */

import type { STSCredentials } from '../api/endpoints/upload'
import { getOssResourceLoader } from './load'
import { uploadToOSS, OssUploadPurpose, PURPOSE_TO_DIR } from './upload'

export { OssUploadPurpose }

/** 上传选项 */
export interface OssUploadOptions {
  purpose: OssUploadPurpose
  credentials: STSCredentials
  onProgress?: (progress: number) => void
  callbackUrl?: string
  callbackBody?: string
}

/** 上传结果（key 为 objectKey，用于持久化与 resolve） */
export interface OssUploadResult {
  key: string
  url?: string
}

/**
 * 将 objectKey 解析为可访问的 URL。
 * 空 key 返回 ''。内部转发到 getOssResourceLoader().getUrl，不做缓存与合并。
 */
export async function resolve(key: string): Promise<string> {
  if (!key) return ''
  return getOssResourceLoader().getUrl(key)
}

/**
 * 同步获取 URL，仅当既有 loader 缓存命中时返回，否则返回 null。
 * 空 key 返回 null。内部转发到 getOssResourceLoader().getUrlSync。
 */
export function resolveSync(key: string): string | null {
  if (!key) return null
  return getOssResourceLoader().getUrlSync(key)
}

/**
 * 上传文件到 OSS，按 purpose 映射到物理目录后调用现有 uploadToOSS。
 * 返回 { key, url? }，key 即 objectKey，用于持久化与后续 resolve。
 */
export async function upload(
  file: File | Blob,
  options: OssUploadOptions
): Promise<OssUploadResult> {
  const directory = PURPOSE_TO_DIR[options.purpose]
  const result = await uploadToOSS(
    file,
    options.credentials,
    directory,
    options.onProgress,
    options.callbackUrl,
    options.callbackBody
  )
  return {
    key: result.objectKey,
    url: result.url,
  }
}

/** 统一入口对象，便于 import { OssResourceManager } from '@/lib/oss' 后调用 OssResourceManager.resolve / upload */
export const OssResourceManager = {
  resolve,
  resolveSync,
  upload,
  OssUploadPurpose,
}
