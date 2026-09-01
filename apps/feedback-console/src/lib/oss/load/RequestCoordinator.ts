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
    console.log(`[RequestCoordinator] 📥 收到请求: ${objectKey}`)
    
    // 1. 检查是否有正在进行的请求（请求合并）
    const existingRequest = this.requestQueue.get(objectKey)
    if (existingRequest) {
      console.log(`[RequestCoordinator] 🔗 请求合并: ${objectKey} (已有 ${this.requestQueue.size} 个进行中的请求)`)
      return existingRequest
    }
    
    // 2. 检查缓存
    const cached = this.storageManager.get(objectKey)
    if (cached) {
      const isValid = this.storageManager.isValid(cached, this.config.bufferTime * 1000)
      if (isValid) {
        // 缓存有效（expiresAt 未过期），直接返回
        console.log(`[RequestCoordinator] ✅ 缓存有效，直接返回: ${objectKey}`, {
          url: cached.signedUrl.substring(0, 50) + '...',
          expiresAt: new Date(cached.expiresAt).toLocaleString(),
        })
        this.statusMonitor.setStatus(objectKey, 'ready')
        return cached.signedUrl
      } else {
        // expiresAt 已过期，但仍然返回旧 URL，让浏览器尝试使用缓存
        // 如果浏览器缓存也没有，会触发 403，由全局错误拦截器自动修复
        console.log(`[RequestCoordinator] ⚠️ expiresAt 已过期，但仍返回旧 URL（让浏览器尝试缓存）: ${objectKey}`, {
          url: cached.signedUrl.substring(0, 50) + '...',
          expiresAt: new Date(cached.expiresAt).toLocaleString(),
          note: '如果浏览器缓存也没有，会触发 403，由全局错误拦截器自动修复',
        })
        // 后台立即刷新（不阻塞当前请求）
        this.loadResource(objectKey).catch(error => {
          console.warn(`[RequestCoordinator] 后台刷新失败: ${objectKey}`, error)
        })
        this.statusMonitor.setStatus(objectKey, 'ready')
        return cached.signedUrl
      }
    } else {
      console.log(`[RequestCoordinator] ❌ 缓存未命中，需要加载: ${objectKey}`)
    }
    
    // 3. 创建新请求并加入队列
    console.log(`[RequestCoordinator] 🚀 开始加载资源: ${objectKey}`)
    const promise = this.loadResource(objectKey)
    this.requestQueue.set(objectKey, promise)
    
    // 4. 请求完成后清理队列
    promise.finally(() => {
      this.requestQueue.delete(objectKey)
      console.log(`[RequestCoordinator] ✅ 请求完成，已从队列移除: ${objectKey}`)
    })
    
    return promise
  }
  
  /**
   * 加载资源
   */
  private async loadResource(objectKey: string): Promise<string> {
    const startTime = Date.now()
    try {
      // 更新状态为 loading
      this.statusMonitor.setStatus(objectKey, 'pending')
      
      // 获取签名 URL
      console.log(`[RequestCoordinator] 🔐 开始获取签名 URL: ${objectKey}`)
      const signedUrl = await this.signatureProvider.getSignedUrl(objectKey)
      const signatureTime = Date.now() - startTime
      console.log(`[RequestCoordinator] ✅ 签名 URL 获取成功 (耗时 ${signatureTime}ms): ${objectKey}`, {
        url: signedUrl,
      })
      
      // 计算过期时间
      const now = Date.now()
      const expiresAt = now + this.config.defaultTTL * 1000 // OSS 签名的真实过期时间
      
      // 创建资源项
      const resourceItem: ResourceItem = {
        objectKey,
        signedUrl,
        expiresAt,
        status: 'ready',
        retryCount: 0,
        lastAccessed: now,
        accessCount: 1,
      }
      
      // 更新缓存
      console.log(`[RequestCoordinator] 💾 保存到缓存: ${objectKey}`, {
        expiresAt: new Date(expiresAt).toLocaleString(),
      })
      this.storageManager.set(objectKey, resourceItem)
      
      // 更新状态为 ready
      this.statusMonitor.setStatus(objectKey, 'ready')
      
      const totalTime = Date.now() - startTime
      console.log(`[RequestCoordinator] ✅ 资源加载成功 (总耗时 ${totalTime}ms): ${objectKey}`)
      return signedUrl
    } catch (error) {
      const totalTime = Date.now() - startTime
      console.error(`[RequestCoordinator] ❌ 资源加载失败 (耗时 ${totalTime}ms): ${objectKey}`, error)
      this.statusMonitor.setStatus(objectKey, 'error')
      throw error
    }
  }
}

