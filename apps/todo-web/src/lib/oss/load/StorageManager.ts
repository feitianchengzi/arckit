/**
 * 存储管理器
 * 管理二级缓存架构（L1: Memory, L2: Persistent）
 */

import type { ResourceItem, ManagerConfig } from './types'

export class StorageManager {
  // L1: 内存缓存
  private memoryCache: Map<string, ResourceItem> = new Map()
  
  // L2: 持久化缓存键前缀
  private readonly CACHE_PREFIX = 'oss_resource_cache_'
  
  // 配置
  private readonly maxCacheSize: number
  
  constructor(config: ManagerConfig) {
    this.maxCacheSize = config.maxCacheSize
  }
  
  /**
   * 获取缓存（优先 L1，未命中则查 L2）
   */
  get(objectKey: string): ResourceItem | null {
    // 先查 L1
    const l1Item = this.memoryCache.get(objectKey)
    if (l1Item) {
      // 更新访问信息
      l1Item.lastAccessed = Date.now()
      l1Item.accessCount++
      console.log(`[StorageManager] ✅ L1 缓存命中: ${objectKey}`, {
        signedUrl: l1Item.signedUrl.substring(0, 50) + '...',
        expiresAt: new Date(l1Item.expiresAt).toLocaleString(),
        accessCount: l1Item.accessCount,
      })
      return l1Item
    }
    
    // 查 L2
    const l2Item = this.getFromL2(objectKey)
    if (l2Item) {
      // 提升到 L1
      this.memoryCache.set(objectKey, l2Item)
      l2Item.lastAccessed = Date.now()
      l2Item.accessCount++
      console.log(`[StorageManager] ✅ L2 缓存命中（已提升到 L1）: ${objectKey}`, {
        signedUrl: l2Item.signedUrl.substring(0, 50) + '...',
        expiresAt: new Date(l2Item.expiresAt).toLocaleString(),
        accessCount: l2Item.accessCount,
      })
      return l2Item
    }
    
    console.log(`[StorageManager] ❌ 缓存未命中: ${objectKey}`, {
      l1Size: this.memoryCache.size,
      l2Keys: this.getL2Keys().length,
    })
    return null
  }
  
  /**
   * 获取所有 L2 缓存的键（用于调试）
   */
  private getL2Keys(): string[] {
    const keys: string[] = []
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key && key.startsWith(this.CACHE_PREFIX)) {
          keys.push(key)
        }
      }
    } catch (error) {
      console.error('[StorageManager] 获取 L2 键列表失败:', error)
    }
    return keys
  }
  
  /**
   * 设置缓存（同时写入 L1 和 L2）
   */
  set(objectKey: string, item: ResourceItem): void {
    // 更新访问信息
    item.lastAccessed = Date.now()
    if (!item.accessCount) {
      item.accessCount = 1
    } else {
      item.accessCount++
    }
    
    // 写入 L1
    this.memoryCache.set(objectKey, item)
    
    // 写入 L2
    this.saveToL2(objectKey, item)
    
    // 检查容量限制
    this.enforceCapacityLimit()
  }
  
  /**
   * 检查缓存是否有效（使用 expiresAt，即 OSS 签名的真实过期时间）
   * 只要 expiresAt 未过期，缓存就有效，可以继续使用
   */
  isValid(item: ResourceItem, bufferTime: number = 0): boolean {
    const now = Date.now()
    // 使用 expiresAt 判断缓存是否有效（OSS 签名的真实过期时间）
    const isValid = item.expiresAt > (now + bufferTime)
    
    if (!isValid) {
      console.log(`[StorageManager] ⚠️ 缓存已过期: ${item.objectKey}`, {
        now: new Date(now).toLocaleString(),
        expiresAt: new Date(item.expiresAt).toLocaleString(),
        bufferTime: bufferTime / 1000 + 's',
        timeRemaining: (item.expiresAt - now) / 1000 + 's',
      })
    }
    
    return isValid
  }
  
  /**
   * 删除缓存
   */
  delete(objectKey: string): void {
    this.memoryCache.delete(objectKey)
    this.deleteFromL2(objectKey)
  }
  
  /**
   * 清除所有缓存
   */
  clear(): void {
    this.memoryCache.clear()
    this.clearL2()
  }
  
  /**
   * 从 L2 获取缓存
   */
  private getFromL2(objectKey: string): ResourceItem | null {
    try {
      const key = `${this.CACHE_PREFIX}${objectKey}`
      const cached = localStorage.getItem(key)
      if (!cached) return null
      
      const data = JSON.parse(cached) as ResourceItem
      
      // 兼容旧数据：如果包含 logicalExpiresAt，移除它（已废弃）
      if ('logicalExpiresAt' in data) {
        delete (data as any).logicalExpiresAt
      }
      
      return data
    } catch (error) {
      console.error('[StorageManager] 读取 L2 缓存失败:', error)
      return null
    }
  }
  
  /**
   * 保存到 L2
   */
  private saveToL2(objectKey: string, item: ResourceItem): void {
    try {
      const key = `${this.CACHE_PREFIX}${objectKey}`
      localStorage.setItem(key, JSON.stringify(item))
    } catch (error) {
      console.error('[StorageManager] 保存 L2 缓存失败:', error)
      // 如果存储空间不足，尝试清理旧缓存
      if (error instanceof DOMException && error.name === 'QuotaExceededError') {
        this.clearOldL2Caches()
        // 重试一次
        try {
          const key = `${this.CACHE_PREFIX}${objectKey}`
          localStorage.setItem(key, JSON.stringify(item))
        } catch (retryError) {
          console.error('[StorageManager] 重试保存 L2 缓存失败:', retryError)
        }
      }
    }
  }
  
  /**
   * 从 L2 删除
   */
  private deleteFromL2(objectKey: string): void {
    try {
      const key = `${this.CACHE_PREFIX}${objectKey}`
      localStorage.removeItem(key)
    } catch (error) {
      console.error('[StorageManager] 删除 L2 缓存失败:', error)
    }
  }
  
  /**
   * 清除所有 L2 缓存
   */
  private clearL2(): void {
    try {
      const keysToDelete: string[] = []
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key && key.startsWith(this.CACHE_PREFIX)) {
          keysToDelete.push(key)
        }
      }
      keysToDelete.forEach(key => localStorage.removeItem(key))
    } catch (error) {
      console.error('[StorageManager] 清除 L2 缓存失败:', error)
    }
  }
  
  /**
   * 清理旧的 L2 缓存（LRU 策略）
   */
  private clearOldL2Caches(): void {
    try {
      const items: Array<{ key: string; lastAccessed: number }> = []
      
      // 收集所有缓存项
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key && key.startsWith(this.CACHE_PREFIX)) {
          try {
            const cached = localStorage.getItem(key)
            if (cached) {
              const data = JSON.parse(cached) as ResourceItem
              items.push({ key, lastAccessed: data.lastAccessed || 0 })
            }
          } catch {
            // 忽略解析错误
          }
        }
      }
      
      // 按最后访问时间排序，删除最旧的 50%
      items.sort((a, b) => a.lastAccessed - b.lastAccessed)
      const toDelete = items.slice(0, Math.floor(items.length / 2))
      
      toDelete.forEach(({ key }) => {
        localStorage.removeItem(key)
      })
      
      console.log(`[StorageManager] 清理了 ${toDelete.length} 个旧 L2 缓存`)
    } catch (error) {
      console.error('[StorageManager] 清理旧 L2 缓存失败:', error)
    }
  }
  
  /**
   * 强制执行容量限制（LRU 策略）
   */
  private enforceCapacityLimit(): void {
    if (this.memoryCache.size <= this.maxCacheSize) {
      return
    }
    
    // 按最后访问时间排序
    const items = Array.from(this.memoryCache.entries())
      .map(([key, item]) => ({ key, lastAccessed: item.lastAccessed || 0 }))
      .sort((a, b) => a.lastAccessed - b.lastAccessed)
    
    // 删除最旧的 20%
    const toDelete = items.slice(0, Math.floor(this.maxCacheSize * 0.2))
    toDelete.forEach(({ key }) => {
      this.memoryCache.delete(key)
    })
    
    console.log(`[StorageManager] LRU 清理: 删除了 ${toDelete.length} 个缓存项`)
  }
}

