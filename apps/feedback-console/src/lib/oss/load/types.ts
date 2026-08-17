/**
 * OSS 资源加载管理器类型定义
 */

/**
 * 资源项数据结构
 */
export interface ResourceItem {
  objectKey: string           // 原始路径
  signedUrl: string            // 签名后的全路径（保证缓存期内一致性）
  expiresAt: number            // OSS 签名的实际过期时间戳（毫秒）
  status: 'loading' | 'ready' | 'error'
  size?: number                // 文件大小（可选）
  retryCount: number           // 重试次数
  lastAccessed: number         // 最后访问时间（LRU）
  accessCount: number          // 访问次数
}

/**
 * 资源状态类型
 */
export type ResourceStatus = 'pending' | 'ready' | 'error'

/**
 * 管理器配置
 */
export interface ManagerConfig {
  defaultTTL: number        // 默认有效期（秒，如 3600）
  bufferTime: number        // 提前刷新时间（秒，如 300，即 5 分钟）
  maxConcurrent: number     // 最大并发请求数（默认 10）
  maxCacheSize: number     // 最大缓存数量（默认 1000）
  retryCount: number       // 最大重试次数（默认 3）
  retryDelay: number       // 重试延迟（毫秒，默认 1000）
}

