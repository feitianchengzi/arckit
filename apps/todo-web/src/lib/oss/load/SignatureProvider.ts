/**
 * 签名供应者
 * 管理 STS 凭证池和 OSS Client 实例（单例模式，全局共享）
 */

import { STSCredentials, uploadApi } from '../../api/endpoints/upload'
import { getSafeSignedUrlExpires, loadOSSSDK, normalizeObjectKey } from '../sdk'
import type { ManagerConfig } from './types'

export interface SignedUrlResult {
  signedUrl: string
  expiresAt: number
}

export class SignatureProvider {
  // STS 凭证池（单例，全局共享）
  private stsPool = {
    credentials: null as STSCredentials | null,
    expiresAt: 0,                    // 过期时间戳（毫秒）
    refreshPromise: null as Promise<STSCredentials> | null,  // 正在刷新时的 Promise
    refreshCallbacks: [] as Array<(creds: STSCredentials) => void>,  // 等待刷新的回调
    refreshTimer: null as number | null,          // 提前刷新的定时器 ID
  }
  
  // OSS Client 实例（单例，全局共享）
  private ossClient: any = null
  
  // 配置
  private readonly bufferTime: number
  private readonly defaultTTL: number
  
  constructor(config: ManagerConfig) {
    this.bufferTime = config.bufferTime * 1000 // 转换为毫秒
    this.defaultTTL = config.defaultTTL
  }
  
  /**
   * 获取签名 URL
   */
  async getSignedUrl(objectKey: string): Promise<string> {
    const result = await this.getSignedUrlWithExpires(objectKey)
    return result.signedUrl
  }

  /**
   * 获取签名 URL 及其前端可安全缓存的过期时间。
   */
  async getSignedUrlWithExpires(objectKey: string): Promise<SignedUrlResult> {
    const normalizedKey = normalizeObjectKey(objectKey)

    // 获取或刷新 STS 凭证
    const credentials = await this.getCredentials()
    
    // 获取或创建 OSS Client
    const client = await this.getOSSClient(credentials)

    const expires = getSafeSignedUrlExpires(
      credentials.Expiration,
      this.defaultTTL
    )
    
    // 生成签名 URL
    const signedUrl = client.signatureUrl(normalizedKey, {
      expires,
    })
    
    return {
      signedUrl,
      expiresAt: Date.now() + expires * 1000,
    }
  }
  
  /**
   * 获取或刷新 STS 凭证
   */
  async getCredentials(forceRefresh: boolean = false): Promise<STSCredentials> {
    const now = Date.now()
    
    // 检查现有凭证是否有效（提前 bufferTime 判断）
    if (!forceRefresh && 
        this.stsPool.credentials && 
        this.stsPool.expiresAt > (now + this.bufferTime)) {
      return this.stsPool.credentials
    }
    
    // 如果正在刷新，等待现有 Promise（请求合并）
    if (this.stsPool.refreshPromise && !forceRefresh) {
      return this.stsPool.refreshPromise
    }
    
    // 创建新的刷新 Promise。无论成功还是失败都要清空，避免失败态 Promise 被永久复用。
    const refreshPromise = this.refreshCredentials()
    this.stsPool.refreshPromise = refreshPromise

    try {
      const credentials = await refreshPromise

      // 通知所有等待的回调
      this.stsPool.refreshCallbacks.forEach(callback => callback(credentials))
      this.stsPool.refreshCallbacks = []

      return credentials
    } finally {
      if (this.stsPool.refreshPromise === refreshPromise) {
        this.stsPool.refreshPromise = null
      }
    }
  }
  
  /**
   * 刷新 STS 凭证
   */
  private async refreshCredentials(): Promise<STSCredentials> {
    console.log('[SignatureProvider] 开始刷新 STS 凭证...')
    
    try {
      const credentials = await uploadApi.getSTSToken()
      
      // 计算过期时间戳
      const expirationTime = new Date(credentials.Expiration).getTime()
      
      // 更新凭证池
      this.stsPool.credentials = credentials
      this.stsPool.expiresAt = expirationTime
      
      console.log('[SignatureProvider] STS 凭证刷新成功, 过期时间:', new Date(expirationTime).toISOString())
      
      // 设置提前刷新定时器
      this.scheduleRefresh()
      
      return credentials
    } catch (error) {
      console.error('[SignatureProvider] 刷新 STS 凭证失败:', error)
      throw error
    }
  }
  
  /**
   * 设置提前刷新定时器
   */
  private scheduleRefresh(): void {
    // 清除现有定时器
    if (this.stsPool.refreshTimer) {
      clearTimeout(this.stsPool.refreshTimer)
      this.stsPool.refreshTimer = null
    }
    
    // 计算刷新时间（过期前 bufferTime）
    const refreshTime = this.stsPool.expiresAt - this.bufferTime - Date.now()
    
    if (refreshTime > 0) {
      this.stsPool.refreshTimer = window.setTimeout(() => {
        console.log('[SignatureProvider] 定时器触发，提前刷新 STS 凭证')
        this.refreshCredentials().catch(error => {
          console.error('[SignatureProvider] 定时刷新失败:', error)
        })
      }, refreshTime)
      
      console.log(`[SignatureProvider] 已设置提前刷新定时器，${Math.floor(refreshTime / 1000)} 秒后刷新`)
    }
  }
  
  /**
   * 获取或创建 OSS Client（复用同一个实例）
   */
  private async getOSSClient(credentials: STSCredentials): Promise<any> {
    // 如果 Client 存在且凭证未变，复用现有实例
    if (this.ossClient && this.isCredentialsSame(credentials)) {
      return this.ossClient
    }
    
    // 加载 OSS SDK
    const OSS = await loadOSSSDK()
    
    // 创建新的 Client（只有在凭证变化时才创建）
    this.ossClient = new OSS({
      region: credentials.Region,
      accessKeyId: credentials.AccessKeyId,
      accessKeySecret: credentials.AccessKeySecret,
      stsToken: credentials.SecurityToken,
      bucket: credentials.BucketName,
      secure: credentials.Secure,
      authorizationV4: credentials.AuthorizationV4,
    })
    
    console.log('[SignatureProvider] 创建新的 OSS Client')
    
    return this.ossClient
  }
  
  /**
   * 检查凭证是否相同
   */
  private isCredentialsSame(newCredentials: STSCredentials): boolean {
    if (!this.stsPool.credentials) return false
    
    const old = this.stsPool.credentials
    return (
      old.AccessKeyId === newCredentials.AccessKeyId &&
      old.SecurityToken === newCredentials.SecurityToken
    )
  }
  
  /**
   * 清除凭证和 Client
   */
  clear(): void {
    if (this.stsPool.refreshTimer) {
      clearTimeout(this.stsPool.refreshTimer)
      this.stsPool.refreshTimer = null
    }
    this.stsPool.credentials = null
    this.stsPool.expiresAt = 0
    this.stsPool.refreshPromise = null
    this.stsPool.refreshCallbacks = []
    this.ossClient = null
  }
}
