/**
 * OSS 资源加载管理器（主管理器 - 统一入口）
 * 单例模式，全局共享
 */

import { StorageManager } from './StorageManager'
import { SignatureProvider } from './SignatureProvider'
import { StatusMonitor } from './StatusMonitor'
import { RequestCoordinator } from './RequestCoordinator'
import type { ManagerConfig, ResourceStatus } from './types'
import { ENABLE_AVATAR_LOGS } from './logConfig'
import { normalizeObjectKey } from '../sdk'
import { clearCache as clearUrlUpdateCache } from './UrlUpdateNotifier'
import { errorOssImageDiag, logOssImageDiag } from './diagnostics'

export class OssResourceLoadManager {
  private static instance: OssResourceLoadManager | null = null
  
  private storageManager: StorageManager
  private signatureProvider: SignatureProvider
  private statusMonitor: StatusMonitor
  private requestCoordinator: RequestCoordinator
  private config: ManagerConfig
  
  private constructor(config?: Partial<ManagerConfig>) {
    // 默认配置
    const defaultConfig: ManagerConfig = {
      defaultTTL: 3600,        // 1小时
      bufferTime: 300,          // 5分钟
      maxConcurrent: 10,
      maxCacheSize: 1000,
      retryCount: 3,
      retryDelay: 1000,
    }
    
    this.config = { ...defaultConfig, ...config }
    
    // 初始化各个组件
    this.storageManager = new StorageManager(this.config)
    this.signatureProvider = new SignatureProvider(this.config)
    this.statusMonitor = new StatusMonitor()
    this.requestCoordinator = new RequestCoordinator(
      this.storageManager,
      this.signatureProvider,
      this.statusMonitor,
      this.config
    )
  }
  
  /**
   * 获取单例实例
   */
  static getInstance(config?: Partial<ManagerConfig>): OssResourceLoadManager {
    if (!OssResourceLoadManager.instance) {
      OssResourceLoadManager.instance = new OssResourceLoadManager(config)
    }
    return OssResourceLoadManager.instance
  }
  
  /**
   * 获取资源 URL（最常用，透明化处理）
   */
  async getUrl(objectKey: string): Promise<string> {
    const normalizedKey = normalizeObjectKey(objectKey)
    logOssImageDiag('loader.getUrl', {
      objectKey: normalizedKey,
      status: this.statusMonitor.getStatus(normalizedKey),
    })
    return this.requestCoordinator.coordinate(normalizedKey)
  }
  
  /**
   * 同步获取资源 URL（仅当缓存命中时，否则返回 null）
   * 用于需要立即获取 URL 的场景，避免异步延迟
   */
  getUrlSync(objectKey: string): string | null {
    const normalizedKey = normalizeObjectKey(objectKey)
    const cached = this.storageManager.get(normalizedKey)
    if (cached && this.storageManager.isValid(cached, this.config.bufferTime * 1000)) {
      if (ENABLE_AVATAR_LOGS) {
        console.log(`[OssResourceLoadManager] ⚡ 同步返回缓存 URL: ${normalizedKey}`)
      }
      return cached.signedUrl
    }
    return null
  }
  
  /**
   * 预加载一批资源（后台加载，不阻塞）
   */
  prefetch(objectKeys: string[]): void {
    // 后台加载，不等待结果
    objectKeys.forEach(objectKey => {
      const normalizedKey = normalizeObjectKey(objectKey)
      this.getUrl(normalizedKey).catch(error => {
        if (ENABLE_AVATAR_LOGS) {
          console.warn(`[OssResourceLoadManager] 预加载失败: ${normalizedKey}`, error)
        }
      })
    })
  }
  
  /**
   * 强制刷新某个资源的签名
   */
  async refresh(objectKey: string): Promise<string> {
    const normalizedKey = normalizeObjectKey(objectKey)
    logOssImageDiag('loader.refresh.start', {
      objectKey: normalizedKey,
      statusBefore: this.statusMonitor.getStatus(normalizedKey),
    })

    // 清除缓存
    this.storageManager.delete(normalizedKey)
    clearUrlUpdateCache(normalizedKey)
    logOssImageDiag('loader.refresh.cacheCleared', {
      objectKey: normalizedKey,
    })
    
    // 强制刷新 STS 凭证
    try {
      await this.signatureProvider.getCredentials(true)
      logOssImageDiag('loader.refresh.credentialsReady', {
        objectKey: normalizedKey,
      })
    } catch (error) {
      errorOssImageDiag('loader.refresh.credentialsFailed', {
        objectKey: normalizedKey,
        error: error instanceof Error ? error.message : String(error),
      })
      throw error
    }
    
    // 重新加载
    const url = await this.getUrl(normalizedKey)
    logOssImageDiag('loader.refresh.finished', {
      objectKey: normalizedKey,
    })
    return url
  }
  
  /**
   * 清除缓存（不传参数则清除所有）
   */
  clearCache(objectKey?: string): void {
    if (objectKey) {
      const normalizedKey = normalizeObjectKey(objectKey)
      this.storageManager.delete(normalizedKey)
      this.statusMonitor.clear(normalizedKey)
      clearUrlUpdateCache(normalizedKey)
    } else {
      this.storageManager.clear()
      this.statusMonitor.clear()
      clearUrlUpdateCache()
    }
  }
  
  /**
   * 订阅资源加载事件（可选，用于高级场景）
   */
  subscribe(
    objectKey: string,
    callback: (url: string) => void
  ): () => void {
    const normalizedKey = normalizeObjectKey(objectKey)

    // 先检查是否已有 URL
    const cached = this.storageManager.get(normalizedKey)
    if (cached && this.storageManager.isValid(cached)) {
      callback(cached.signedUrl)
    }
    
    // 订阅状态变更
    return this.statusMonitor.subscribe(normalizedKey, (status) => {
      if (status === 'ready') {
        const item = this.storageManager.get(normalizedKey)
        if (item) {
          callback(item.signedUrl)
        }
      }
    })
  }
  
  /**
   * 获取资源加载状态（可选，用于调试）
   */
  getStatus(objectKey: string): ResourceStatus {
    return this.statusMonitor.getStatus(normalizeObjectKey(objectKey))
  }
}
