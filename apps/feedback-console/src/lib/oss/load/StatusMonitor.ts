/**
 * 状态监控器
 * 追踪资源的加载状态
 */

import type { ResourceStatus } from './types'

export class StatusMonitor {
  private statusMap: Map<string, ResourceStatus> = new Map()
  private listeners: Map<string, Set<(status: ResourceStatus) => void>> = new Map()
  
  /**
   * 设置状态
   */
  setStatus(objectKey: string, status: ResourceStatus): void {
    this.statusMap.set(objectKey, status)
    
    // 通知订阅者
    const callbacks = this.listeners.get(objectKey)
    if (callbacks) {
      callbacks.forEach(callback => callback(status))
    }
  }
  
  /**
   * 获取状态
   */
  getStatus(objectKey: string): ResourceStatus {
    return this.statusMap.get(objectKey) || 'pending'
  }
  
  /**
   * 订阅状态变更
   */
  subscribe(objectKey: string, callback: (status: ResourceStatus) => void): () => void {
    if (!this.listeners.has(objectKey)) {
      this.listeners.set(objectKey, new Set())
    }
    
    this.listeners.get(objectKey)!.add(callback)
    
    // 返回取消订阅函数
    return () => {
      const callbacks = this.listeners.get(objectKey)
      if (callbacks) {
        callbacks.delete(callback)
        if (callbacks.size === 0) {
          this.listeners.delete(objectKey)
        }
      }
    }
  }
  
  /**
   * 清除状态
   */
  clear(objectKey?: string): void {
    if (objectKey) {
      this.statusMap.delete(objectKey)
      this.listeners.delete(objectKey)
    } else {
      this.statusMap.clear()
      this.listeners.clear()
    }
  }
}

