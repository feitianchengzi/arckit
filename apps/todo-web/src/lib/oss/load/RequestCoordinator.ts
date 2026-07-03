/**
 * 请求协调器
 * 实现请求合并（Request Collapsing）和任务分发
 */

import { StorageManager } from './StorageManager'
import { SignatureProvider } from './SignatureProvider'
import { StatusMonitor } from './StatusMonitor'
import { normalizeObjectKey } from '../sdk'
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
    const normalizedKey = normalizeObjectKey(objectKey)
    if (!normalizedKey) return ''

    console.log(`[RequestCoordinator] 📥 收到请求: ${normalizedKey}`)
    
    // 1. 检查是否有正在进行的请求（请求合并）
    const existingRequest = this.requestQueue.get(normalizedKey)
    if (existingRequest) {
      console.log(`[RequestCoordinator] 🔗 请求合并: ${normalizedKey} (已有 ${this.requestQueue.size} 个进行中的请求)`)
      return existingRequest
    }
    
    // 2. 检查缓存
    const cached = this.storageManager.get(normalizedKey)
    if (cached) {
      const isValid = this.storageManager.isValid(cached, this.config.bufferTime * 1000)
      if (isValid) {
        // 缓存有效（expiresAt 未过期），直接返回
        console.log(`[RequestCoordinator] ✅ 缓存有效，直接返回: ${normalizedKey}`, {
          url: cached.signedUrl.substring(0, 50) + '...',
          expiresAt: new Date(cached.expiresAt).toLocaleString(),
        })
        this.statusMonitor.setStatus(normalizedKey, 'ready')
        return cached.signedUrl
      } else {
        console.log(`[RequestCoordinator] ⚠️ 缓存已过期，清除后重新签名: ${normalizedKey}`, {
          url: cached.signedUrl.substring(0, 50) + '...',
          expiresAt: new Date(cached.expiresAt).toLocaleString(),
        })
        this.storageManager.delete(normalizedKey)
      }
    } else {
      console.log(`[RequestCoordinator] ❌ 缓存未命中，需要加载: ${normalizedKey}`)
    }
    
    // 3. 创建新请求并加入队列
    console.log(`[RequestCoordinator] 🚀 开始加载资源: ${normalizedKey}`)
    const promise = this.loadResource(normalizedKey)
    this.requestQueue.set(normalizedKey, promise)
    
    // 4. 请求完成后清理队列
    promise.finally(() => {
      this.requestQueue.delete(normalizedKey)
      console.log(`[RequestCoordinator] ✅ 请求完成，已从队列移除: ${normalizedKey}`)
    })
    
    return promise
  }
  
  /**
   * 加载资源
   */
  private async loadResource(objectKey: string): Promise<string> {
    const startTime = Date.now()
    const normalizedKey = normalizeObjectKey(objectKey)

    try {
      // 更新状态为 loading
      this.statusMonitor.setStatus(normalizedKey, 'pending')
      
      // 获取签名 URL
      console.log(`[RequestCoordinator] 🔐 开始获取签名 URL: ${normalizedKey}`)
      const { signedUrl, expiresAt } = await this.signatureProvider.getSignedUrlWithExpires(normalizedKey)
      const signatureTime = Date.now() - startTime
      console.log(`[RequestCoordinator] ✅ 签名 URL 获取成功 (耗时 ${signatureTime}ms): ${normalizedKey}`, {
        url: signedUrl.substring(0, 50) + '...',
      })
      
      const now = Date.now()
      
      // 创建资源项
      const resourceItem: ResourceItem = {
        objectKey: normalizedKey,
        signedUrl,
        expiresAt,
        status: 'ready',
        retryCount: 0,
        lastAccessed: now,
        accessCount: 1,
      }
      
      // 更新缓存
      console.log(`[RequestCoordinator] 💾 保存到缓存: ${normalizedKey}`, {
        expiresAt: new Date(expiresAt).toLocaleString(),
      })
      this.storageManager.set(normalizedKey, resourceItem)
      
      // 更新状态为 ready
      this.statusMonitor.setStatus(normalizedKey, 'ready')
      
      const totalTime = Date.now() - startTime
      console.log(`[RequestCoordinator] ✅ 资源加载成功 (总耗时 ${totalTime}ms): ${normalizedKey}`)
      return signedUrl
    } catch (error) {
      const totalTime = Date.now() - startTime
      console.error(`[RequestCoordinator] ❌ 资源加载失败 (耗时 ${totalTime}ms): ${normalizedKey}`, error)
      this.statusMonitor.setStatus(normalizedKey, 'error')
      throw error
    }
  }
}
