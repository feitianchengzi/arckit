/**
 * OSS 资源加载管理器
 * 统一管理所有 OSS 文件的加载、缓存、更新等操作
 * 
 * 设计文档：frontend/docs/oss/OSS_FILE_LOADER_DESIGN.md
 */

export { StorageManager } from './StorageManager'
export { SignatureProvider } from './SignatureProvider'
export { StatusMonitor } from './StatusMonitor'
export { RequestCoordinator } from './RequestCoordinator'
export { OssResourceLoadManager } from './OssResourceLoadManager'
export { initErrorInterceptor, destroyErrorInterceptor } from './ErrorInterceptor'
export { subscribeUrlUpdate, notifyUrlUpdated, getCachedUrl, clearCache } from './UrlUpdateNotifier'
export type { ResourceItem, ResourceStatus, ManagerConfig } from './types'

/**
 * 获取管理器实例（便捷函数）
 */
import { OssResourceLoadManager } from './OssResourceLoadManager'
import type { ManagerConfig } from './types'

export function getOssResourceLoader(config?: Partial<ManagerConfig>): OssResourceLoadManager {
  return OssResourceLoadManager.getInstance(config)
}

