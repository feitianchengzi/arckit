/**
 * 请求协调器
 * 实现请求合并（Request Collapsing）和任务分发
 */

import { StorageManager } from './StorageManager'
import { SignatureProvider } from './SignatureProvider'
import { StatusMonitor } from './StatusMonitor'
import type { ManagerConfig, ResourceItem } from './types'

export class RequestCoordinator {
  // 请求队列（用于请求合并）
  private requestQueue: Map<string, Promise<string>> = new Map()
  
  private storageManager: StorageManager
  private signatureProvider: SignatureProvider
  private statusMonitor: StatusMonitor
  private config: ManagerConfig
  
  constructor(
    storageManager: StorageManager,
    signatureProvider: SignatureProvider,
    statusMonitor: StatusMonitor,
    config: ManagerConfig
  ) {
    this.storageManager = storageManager
    this.signatureProvider = signatureProvider
    this.statusMonitor = statusMonitor
    this.config = config
  }
  
  /**
   * 协调加载流程
   */
  async coordinate(objectKey: string): Promise<string> {
    // 1. 检查是否有正在进行的请求（请求合并）
    const existingRequest = this.requestQueue.get(objectKey)
    if (existingRequest) {
      console.log(`[RequestCoordinator] 请求合并: ${objectKey}`)
      return existingRequest
    }
    
    // 2. 检查缓存
    const cached = this.storageManager.get(objectKey)
    if (cached && this.storageManager.isValid(cached, this.config.bufferTime * 1000)) {
      console.log(`[RequestCoordinator] 缓存命中: ${objectKey}`)
      this.statusMonitor.setStatus(objectKey, 'ready')
      return cached.signedUrl
    }
    
    // 3. 创建新请求并加入队列
    const promise = this.loadResource(objectKey)
    this.requestQueue.set(objectKey, promise)
    
    // 4. 请求完成后清理队列
    promise.finally(() => {
      this.requestQueue.delete(objectKey)
    })
    
    return promise
  }
  
  /**
   * 加载资源
   */
  private async loadResource(objectKey: string): Promise<string> {
    try {
      // 更新状态为 loading
      this.statusMonitor.setStatus(objectKey, 'pending')
      
      // 获取签名 URL
      const signedUrl = await this.signatureProvider.getSignedUrl(objectKey)
      
      // 计算过期时间
      const now = Date.now()
      const expiresAt = now + this.config.defaultTTL * 1000 // 实际过期时间
      const logicalExpiresAt = expiresAt - (60 * 60 * 1000) // 逻辑过期时间（提前1小时）
      
      // 创建资源项
      const resourceItem: ResourceItem = {
        objectKey,
        signedUrl,
        expiresAt,
        logicalExpiresAt,
        status: 'ready',
        retryCount: 0,
        lastAccessed: now,
        accessCount: 1,
      }
      
      // 更新缓存
      this.storageManager.set(objectKey, resourceItem)
      
      // 更新状态为 ready
      this.statusMonitor.setStatus(objectKey, 'ready')
      
      console.log(`[RequestCoordinator] 资源加载成功: ${objectKey}`)
      return signedUrl
    } catch (error) {
      console.error(`[RequestCoordinator] 资源加载失败: ${objectKey}`, error)
      this.statusMonitor.setStatus(objectKey, 'error')
      throw error
    }
  }
}

