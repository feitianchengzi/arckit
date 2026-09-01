# OSS 文件加载管理器设计文档

## 📋 文档概述

本文档设计一个统一的文件/图片/资源加载管理器，用于处理 OSS 文件的加载、缓存、更新等操作，解决当前加载流程复杂、性能开销大、开发负担重的问题。

## 🎯 设计目标

### 核心目标
1. **统一管理**：所有 OSS 文件加载都通过统一的管理器
2. **自动缓存**：智能缓存管理，减少重复请求
3. **批量处理**：支持批量加载，提升性能
4. **错误恢复**：完善的错误处理和重试机制
5. **性能优化**：减少网络请求，提升加载速度

### 解决的问题
- ✅ 避免每个组件都重复实现加载逻辑
- ✅ 统一处理 objectKey 到 URL 的转换
- ✅ 智能缓存管理，避免重复下载
- ✅ 批量加载多个资源时共享 STS 凭证
- ✅ 统一的错误处理和降级策略

## 🏗️ 架构设计

### 整体架构

```
┌─────────────────────────────────────────────────────────────┐
│                     应用层 (Components)                       │
│  Avatar | TodoItem | ProjectCard | MemberList | ...         │
│  每个组件只需调用统一的 getUrl() 接口                        │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       │ 使用统一接口
                       ▼
┌─────────────────────────────────────────────────────────────┐
│         OSS Resource Load Manager (统一入口 - 单例)        │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  OssResourceLoadManager                              │  │
│  │  - getUrl(objectKey): Promise<string>                 │  │
│  │  - prefetch(objectKeys[]): void                        │  │
│  │  - refresh(objectKey): Promise<string>                 │  │
│  │  - clearCache(objectKey?): void                        │  │
│  │  - subscribe(objectKey, callback): () => void         │  │
│  └──────────────────────────────────────────────────────┘  │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
        ┌─────────────────────────────────────┐
        │   Request Coordinator (调度中心)      │
        │   - 接收 ObjectKey 请求             │
        │   - 判断缓存状态                     │
        │   - 请求合并 (Request Collapsing)    │
        │   - 任务分发                         │
        └──────────────┬──────────────────────┘
                       │
        ┌──────────────┼──────────────┬──────────────┐
        │              │              │              │
        ▼              ▼              ▼              ▼
┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│ Storage      │ │ Signature    │ │ Status       │ │ Request      │
│ Manager      │ │ Provider     │ │ Monitor      │ │ Queue        │
│              │ │              │ │              │ │              │
│ L1: Memory   │ │ - STS 凭证   │ │ - PENDING    │ │ - 并发控制   │
│ L2: Persistent│ │ - 签名生成   │ │ - SUCCESS    │ │ - 优先级     │
│ - LRU 清理   │ │ - 自动刷新   │ │ - ERROR      │ │ - 请求去重   │
│ - TTL 管理   │ │ - 提前刷新   │ │ - 状态通知   │ │              │
└──────────────┘ └──────────────┘ └──────────────┘ └──────────────┘
        │              │              │              │
        └──────────────┼──────────────┼──────────────┘
                       │
                       ▼
            ┌──────────────────────┐
            │   OSS SDK Layer      │
            │  (ossUpload.ts)      │
            │  - getSignedUrl()    │
            │  - loadOSSSDK()      │
            └──────────────────────┘
                       │
                       ▼
            ┌──────────────────────┐
            │   阿里云 OSS SDK     │
            │   (Browser SDK)      │
            └──────────────────────┘
```

### 数据流

```
组件请求
    ↓
OssResourceLoadManager (统一入口)
    ↓
┌─────────────────────────────────────┐
│ 1. 请求池检查（去重）                │
│ 2. 缓存池检查（三级缓存）            │
│ 3. STS 池检查（凭证共享）            │
│ 4. 请求队列（并发控制）              │
└─────────────────────────────────────┘
    ↓
OSS SDK (生成签名 URL)
    ↓
下载文件 → 缓存 → 返回 URL
```

### 核心组件

#### 1. OssResourceLoadManager（主管理器 - 统一入口）
**职责**：
- 对外提供简洁统一的 API 接口
- 隐藏内部复杂的加载逻辑
- 提供透明化的资源访问

**主要方法**：
```typescript
interface OssResourceLoadManager {
  // 获取资源 URL（最常用，透明化处理）
  getUrl(objectKey: string): Promise<string>
  
  // 预加载一批资源（后台加载，不阻塞）
  prefetch(objectKeys: string[]): void
  
  // 强制刷新某个资源的签名
  refresh(objectKey: string): Promise<string>
  
  // 清除缓存（不传参数则清除所有）
  clearCache(objectKey?: string): void
  
  // 订阅资源加载事件（可选，用于高级场景）
  subscribe(objectKey: string, callback: (url: string) => void): () => void
  
  // 获取资源加载状态（可选，用于调试）
  getStatus(objectKey: string): 'pending' | 'ready' | 'error'
}
```

#### 2. Request Coordinator（调度中心）
**职责**：
- 接收所有 ObjectKey 请求
- 判断资源是否存在于缓存中
- 实现请求合并（Request Collapsing）
- 分发任务给签名器或直接返回缓存

**核心逻辑**：
```typescript
interface RequestCoordinator {
  // 请求合并：相同 objectKey 的多个请求共享同一个 Promise
  requestQueue: Map<string, Promise<string>>
  
  // 协调加载流程
  coordinate(objectKey: string): Promise<string> {
    // 1. 检查是否有正在进行的请求
    if (requestQueue.has(objectKey)) {
      return requestQueue.get(objectKey)  // 请求合并
    }
    
    // 2. 检查缓存
    const cached = storageManager.get(objectKey)
    if (cached && !isExpired(cached)) {
      return Promise.resolve(cached.signedUrl)
    }
    
    // 3. 创建新请求并加入队列
    const promise = this.loadResource(objectKey)
    requestQueue.set(objectKey, promise)
    
    // 4. 请求完成后清理队列
    promise.finally(() => requestQueue.delete(objectKey))
    
    return promise
  }
}
```

#### 3. Storage Manager（存储管理器）
**职责**：
- 管理二级缓存架构（L1: Memory, L2: Persistent）
- 缓存过期检测和清理
- 缓存有效性验证

**二级缓存架构**：
```
L1: Memory Cache (Map)
  - 响应速度：毫秒级
  - 存储内容：ResourceItem
  - 生命周期：页面会话期间

L2: Persistent Cache (IndexedDB/LocalStorage)
  - 响应速度：10-50ms
  - 存储内容：ResourceItem（序列化）
  - 生命周期：跨会话持久化
```

**数据结构**：
```typescript
interface ResourceItem {
  objectKey: string           // 原始路径
  signedUrl: string            // 签名后的全路径（保证缓存期内一致性）
  expiresAt: number            // OSS 签名的实际过期时间戳（毫秒）
  logicalExpiresAt: number     // 逻辑过期时间（实际过期时间 - 缓冲时间，默认1小时）
  status: 'loading' | 'ready' | 'error'
  size?: number                // 文件大小（可选）
  retryCount: number           // 重试次数
  lastAccessed: number         // 最后访问时间（LRU）
  accessCount: number          // 访问次数
}

interface StorageManager {
  // L1: 内存缓存
  memoryCache: Map<string, ResourceItem>
  
  // L2: 持久化缓存
  persistentCache: IndexedDB | LocalStorage
  
  // 获取缓存（优先 L1，未命中则查 L2）
  get(objectKey: string): ResourceItem | null
  
  // 设置缓存（同时写入 L1 和 L2）
  set(objectKey: string, item: ResourceItem): void
  
  // 检查缓存是否有效
  isValid(item: ResourceItem, bufferTime?: number): boolean
}
```

**策略**：
- **LRU（最近最少使用）**：当缓存满时，清理最久未访问的缓存
- **TTL（生存时间）**：自动清理过期的缓存
- **容量限制**：限制缓存总数量，防止占用过多内存
- **缓冲时间**：提前 5 分钟判断过期，避免临期失效

#### 4. Signature Provider（签名供应者）
**职责**：
- 与后端 STS/签名接口交互
- 获取带时效性的 SignedURL
- 管理 STS 凭证池和 OSS Client 实例
- 凭证自动刷新（提前刷新，避免过期）

**核心原则**：
- ✅ **单例模式**：全局共享一个 STS 凭证和一个 OSS Client 实例
- ✅ **提前刷新**：在过期前 5 分钟自动刷新，避免过期后再申请
- ✅ **请求合并**：多个并发请求共享同一个刷新 Promise
- ✅ **避免频繁创建**：复用同一个 OSS Client，不要频繁创建多个实例

**数据结构**：
```typescript
interface SignatureProvider {
  // STS 凭证池（单例，全局共享）
  stsPool: {
    credentials: STSCredentials | null
    expiresAt: number                    // 过期时间戳（毫秒）
    refreshPromise: Promise<STSCredentials> | null  // 正在刷新时的 Promise
    refreshCallbacks: Array<(creds: STSCredentials) => void>  // 等待刷新的回调
    refreshTimer: number | null          // 提前刷新的定时器 ID
  }
  
  // OSS Client 实例（单例，全局共享）
  ossClient: OSS.Client | null            // 复用同一个 Client 实例
  
  // 获取签名 URL
  getSignedUrl(objectKey: string): Promise<string>
  
  // 获取或刷新 STS 凭证
  getCredentials(forceRefresh?: boolean): Promise<STSCredentials>
  
  // 刷新 STS 凭证（提前刷新）
  refreshCredentials(): Promise<STSCredentials>
  
  // 初始化 OSS Client（使用当前凭证）
  initOSSClient(credentials: STSCredentials): OSS.Client
}
```

**STS 凭证管理流程**：

```
请求签名 URL
    ↓
┌─────────────────────────────────────┐
│ 1. 检查 STS 凭证状态                 │
│    - credentials 是否存在？          │
│    - expiresAt > 当前时间 + 5分钟？  │
│    - 是：使用现有凭证                │
│    - 否：继续                       │
└─────────────────────────────────────┘
    ↓
┌─────────────────────────────────────┐
│ 2. 检查是否正在刷新                  │
│    - refreshPromise 是否存在？       │
│    - 是：等待现有 Promise（请求合并） │
│    - 否：创建新的刷新 Promise        │
└─────────────────────────────────────┘
    ↓
┌─────────────────────────────────────┐
│ 3. 调用后端接口获取新凭证             │
│    - 调用 getSTSToken()              │
│    - 更新 stsPool.credentials       │
│    - 更新 stsPool.expiresAt          │
└─────────────────────────────────────┘
    ↓
┌─────────────────────────────────────┐
│ 4. 更新或创建 OSS Client              │
│    - 如果 ossClient 存在且凭证未变：  │
│      复用现有 Client                  │
│    - 如果凭证变化或 Client 不存在：   │
│      创建新的 Client（但不要频繁创建）│
└─────────────────────────────────────┘
    ↓
┌─────────────────────────────────────┐
│ 5. 设置提前刷新定时器                 │
│    - 计算刷新时间（过期前 5 分钟）     │
│    - 设置定时器自动刷新               │
│    - 避免过期后再申请                 │
└─────────────────────────────────────┘
    ↓
┌─────────────────────────────────────┐
│ 6. 通知所有等待的回调                │
│    - 执行 refreshCallbacks           │
│    - 清空 refreshPromise             │
└─────────────────────────────────────┘
```

**策略详解**：

1. **单例模式（全局共享）**
   ```typescript
   // ✅ 正确：全局共享一个实例
   class SignatureProvider {
     private static instance: SignatureProvider
     private stsPool = { credentials: null, ... }
     private ossClient: OSS.Client | null = null
     
     static getInstance() {
       if (!SignatureProvider.instance) {
         SignatureProvider.instance = new SignatureProvider()
       }
       return SignatureProvider.instance
     }
   }
   
   // ❌ 错误：不要在每个请求中创建新实例
   // 不要这样做：
   // const provider = new SignatureProvider()  // 错误！
   ```

2. **提前刷新（避免过期）**
   ```typescript
   // 在凭证过期前 5 分钟自动刷新
   private scheduleRefresh() {
     const bufferTime = 5 * 60 * 1000  // 5 分钟
     const refreshTime = this.stsPool.expiresAt - bufferTime - Date.now()
     
     if (refreshTime > 0) {
       this.stsPool.refreshTimer = setTimeout(() => {
         this.refreshCredentials()  // 提前刷新，避免过期
       }, refreshTime)
     }
   }
   ```

3. **请求合并（避免频繁申请）**
   ```typescript
   // 多个并发请求共享同一个刷新 Promise
   async getCredentials(forceRefresh = false) {
     // 如果正在刷新，等待现有 Promise
     if (this.stsPool.refreshPromise && !forceRefresh) {
       return this.stsPool.refreshPromise
     }
     
     // 创建新的刷新 Promise
     this.stsPool.refreshPromise = this.refreshCredentials()
     return this.stsPool.refreshPromise
   }
   ```

4. **OSS Client 复用（避免频繁创建）**
   ```typescript
   // 复用同一个 OSS Client 实例
   private getOSSClient(credentials: STSCredentials): OSS.Client {
     // 如果 Client 存在且凭证未变，复用现有实例
     if (this.ossClient && this.isCredentialsSame(credentials)) {
       return this.ossClient
     }
     
     // 只有在凭证变化时才创建新 Client
     this.ossClient = this.initOSSClient(credentials)
     return this.ossClient
   }
   ```

**关键约束**：
- ⚠️ **不要频繁创建多个 OSS Client**：全局只维护一个实例
- ⚠️ **不要过期后再申请**：提前 5 分钟自动刷新
- ⚠️ **不要并发重复申请**：多个请求共享同一个刷新 Promise
- ⚠️ **不要每次请求都创建新实例**：使用单例模式

#### 5. Status Monitor（状态监控）
**职责**：
- 追踪资源的加载状态
- 状态变更通知
- 错误状态管理

**状态定义**：
```typescript
type ResourceStatus = 'pending' | 'ready' | 'error'

interface StatusMonitor {
  // 状态存储
  statusMap: Map<string, ResourceStatus>
  
  // 状态变更监听器
  listeners: Map<string, Set<(status: ResourceStatus) => void>>
  
  // 设置状态
  setStatus(objectKey: string, status: ResourceStatus): void
  
  // 获取状态
  getStatus(objectKey: string): ResourceStatus
  
  // 订阅状态变更
  subscribe(objectKey: string, callback: (status: ResourceStatus) => void): () => void
}
```

#### 6. Request Queue（请求队列）
**职责**：
- 管理并发请求数量
- 请求优先级管理
- 请求重试机制

**数据结构**：
```typescript
interface RequestQueue {
  pending: Map<string, Promise<string>>  // 正在进行的请求
  waiting: Array<QueuedRequest>          // 等待队列
  maxConcurrent: number                  // 最大并发数（默认 10）
}

interface QueuedRequest {
  objectKey: string
  priority: number  // 优先级，数字越大优先级越高
  resolve: (url: string) => void
  reject: (error: Error) => void
}
```

**策略**：
- **并发控制**：限制同时进行的请求数量
- **优先级队列**：重要资源优先加载
- **请求去重**：由 Request Coordinator 处理

## 🔄 工作流程

### 单个文件加载流程（getUrl）

```
用户请求 getUrl(objectKey)
    ↓
┌─────────────────────────────────────┐
│ Request Coordinator: 请求合并检查     │
│    - 是否有相同 objectKey 的请求？  │
│    - 是：返回现有 Promise (Collapsing)│
│    - 否：继续                       │
└─────────────────────────────────────┘
    ↓
┌─────────────────────────────────────┐
│ Storage Manager: 检查二级缓存        │
│    L1 (Memory): 快速查找             │
│      - 命中且有效 → 返回 signedUrl   │
│    L2 (Persistent): 持久化查找       │
│      - 命中且有效 → 提升到 L1 → 返回 │
│    - 未命中或过期 → 继续            │
└─────────────────────────────────────┘
    ↓
┌─────────────────────────────────────┐
│ Status Monitor: 更新状态为 PENDING   │
└─────────────────────────────────────┘
    ↓
┌─────────────────────────────────────┐
│ Signature Provider: 获取签名 URL     │
│    1. 检查 STS 凭证池（单例，全局共享）│
│    2. 如果过期或即将过期（5分钟内）， │
│       提前刷新（避免过期后再申请）   │
│    3. 多个请求共享同一个刷新 Promise │
│    4. 复用同一个 OSS Client 实例      │
│       （避免频繁创建多个 Client）     │
│    5. 生成 signatureUrl               │
└─────────────────────────────────────┘
    ↓
┌─────────────────────────────────────┐
│ Storage Manager: 更新缓存             │
│    - 同时写入 L1 和 L2                │
│    - 记录 expiresAt (当前时间 + TTL)  │
│    - 记录 logicalExpiresAt (提前1小时)│
│    - 保证 URL 稳定性（缓存期内返回相同URL）│
└─────────────────────────────────────┘
    ↓
┌─────────────────────────────────────┐
│ Status Monitor: 更新状态为 READY      │
│    - 通知所有订阅者                   │
└─────────────────────────────────────┘
    ↓
返回 signatureUrl
```

### 请求合并（Request Collapsing）机制

```
场景：多个组件同时请求同一个 objectKey

时间线：
T0: Avatar 组件请求 getUrl('workshop/avatars/user1.jpg')
    → Request Coordinator 创建 Promise A
    → 开始加载流程

T1: TodoItem 组件请求 getUrl('workshop/avatars/user1.jpg')
    → Request Coordinator 发现已有 Promise A
    → 直接返回 Promise A（不创建新请求）

T2: MemberList 组件请求 getUrl('workshop/avatars/user1.jpg')
    → Request Coordinator 发现已有 Promise A
    → 直接返回 Promise A（不创建新请求）

T3: Promise A 完成
    → 所有组件（Avatar, TodoItem, MemberList）同时收到结果
    → 只产生一次网络请求
```

### 缓存过期策略

#### 主动失效（Proactive Expiration）

```
┌─────────────────────────────────────┐
│ 定时检查机制                          │
│    - 每 60 秒检查一次缓存             │
│    - 清理过期的缓存项                 │
│    - 提前 5 分钟标记为"即将过期"       │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ 读取时检查                            │
│    - 每次 get() 时检查 expiresAt      │
│    - 如果 currentTime >= expiresAt - bufferTime │
│    - 标记为过期，触发刷新             │
└─────────────────────────────────────┘
```

#### 被动刷新（Reactive Refresh）- 自动修复机制

**场景**：图片加载失败（可能是 URL 过期导致 403 错误）

```
┌─────────────────────────────────────────────────────────────────┐
│ 场景 1：expiresAt 已过期，但浏览器有缓存                        │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ RequestCoordinator.coordinate(objectKey)                       │
│   1. 检查缓存：expiresAt 已过期                                 │
│   2. ⚠️ 但仍然返回旧 URL（让浏览器尝试使用缓存）               │
│   3. 后台立即刷新（不阻塞当前请求）                            │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ 浏览器加载图片                                                   │
│   <img src="旧URL" data-oss-key="workshop/avatars/user1.jpg" />│
│   浏览器检查 Disk Cache：找到缓存 → 直接使用 ✅                 │
│   用户看到图片，无感知                                           │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ 后台刷新完成                                                     │
│   1. 获取新的签名 URL                                            │
│   2. 更新缓存（保存新的 signedUrl）                             │
│   3. 下次请求时使用新 URL                                        │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ 场景 2：expiresAt 已过期，浏览器也没有缓存（触发 403）          │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ RequestCoordinator.coordinate(objectKey)                       │
│   1. 检查缓存：expiresAt 已过期                                 │
│   2. ⚠️ 但仍然返回旧 URL（让浏览器尝试使用缓存）               │
│   3. 后台立即刷新（不阻塞当前请求）                            │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ 浏览器加载图片                                                   │
│   <img src="旧URL" data-oss-key="workshop/avatars/user1.jpg" />│
│   浏览器检查 Disk Cache：未找到缓存                             │
│   发起网络请求 → OSS 返回 403 Forbidden ❌                      │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ 全局错误拦截器（ErrorInterceptor）自动检测                      │
│   window.addEventListener('error', handleImageError, true)      │
│   1. 检测到图片加载失败                                          │
│   2. 检查是否是 OSS 图片（aliyuncs.com）                        │
│   3. 从 data-oss-key 属性获取 objectKey                         │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ 自动修复流程                                                     │
│   1. 调用 resourceLoader.refresh(objectKey)                     │
│      - 清除旧缓存                                                │
│      - 重新获取 STS 凭证                                         │
│      - 生成新的签名 URL                                          │
│   2. 更新缓存（保存新的 signedUrl）                             │
│   3. 静默替换 img.src = newUrl                                  │
│   4. 浏览器自动加载新 URL ✅                                     │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ 用户感知                                                         │
│   - 图片可能短暂显示破图（< 500ms）                            │
│   - 自动修复后立即显示图片                                       │
│   - 用户几乎感知不到修复过程                                     │
└─────────────────────────────────────────────────────────────────┘
```

**关键点**：
- ✅ **"骗"浏览器**：即使 `expiresAt` 已过期，仍然返回旧 URL，让浏览器尝试使用缓存
- ✅ **自动修复**：如果浏览器缓存也没有，触发 403，全局错误拦截器自动修复
- ✅ **静默替换**：用户几乎感知不到 URL 更新过程
- ✅ **data-oss-key 属性**：错误拦截器通过此属性获取 objectKey，实现自动修复

### 批量文件加载流程

```
用户请求 loadFiles([objectKey1, objectKey2, ...])
    ↓
┌─────────────────────────────────────┐
│ 1. 分组处理                          │
│    - 有缓存的：直接返回              │
│    - 无缓存的：加入加载队列          │
└─────────────────────────────────────┘
    ↓
┌─────────────────────────────────────┐
│ 2. 批量获取 STS 凭证                 │
│    - 所有请求共享同一个凭证          │
│    - 减少网络请求                    │
└─────────────────────────────────────┘
    ↓
┌─────────────────────────────────────┐
│ 3. 并发加载（受并发限制）             │
│    - 按优先级排序                    │
│    - 控制并发数量                    │
│    - 请求去重                        │
└─────────────────────────────────────┘
    ↓
┌─────────────────────────────────────┐
│ 4. 批量更新缓存                      │
│    - 统一更新缓存池                  │
│    - 触发订阅回调                    │
└─────────────────────────────────────┘
    ↓
返回 Map<objectKey, url>
```

## 💾 缓存策略

### 二级缓存架构（优化后）

```
┌─────────────────────────────────────┐
│ L1: Memory Cache (Map)              │
│ - 响应速度：毫秒级 (< 1ms)           │
│ - 存储内容：ResourceItem             │
│ - 生命周期：页面会话期间             │
│ - 容量限制：最多 1000 项             │
│ - 清理策略：LRU + TTL                │
└─────────────────────────────────────┘
           ↓ (未命中)
┌─────────────────────────────────────┐
│ L2: Persistent Cache                 │
│ - 存储方案：IndexedDB (优先) 或      │
│            LocalStorage (降级)      │
│ - 响应速度：10-50ms                  │
│ - 存储内容：ResourceItem (序列化)    │
│ - 生命周期：跨会话持久化             │
│ - 容量限制：最多 5000 项             │
│ - 清理策略：LRU + TTL                │
└─────────────────────────────────────┘
           ↓ (未命中)
┌─────────────────────────────────────┐
│ 网络请求：获取新的 signatureUrl       │
│ - 调用 Signature Provider            │
│ - 获取 STS 凭证                      │
│ - 生成签名 URL                       │
└─────────────────────────────────────┘
```

### 为什么选择二级缓存而非三级？

**设计决策**：
1. **简化架构**：二级缓存已经足够，三级会增加复杂度
2. **性能平衡**：L1 内存缓存已经足够快，L2 持久化缓存保证跨会话
3. **存储效率**：不需要存储实际的 Blob 数据，只存储 URL 即可
4. **维护成本**：二级缓存更容易维护和调试
5. **浏览器原生缓存**：配合浏览器原生 HTTP Disk Cache，二级缓存 + 浏览器缓存是最优解

**L3 存在的唯一必要性**：
- 只有当业务需要**"离线可用"**（断网也要看之前加载过的头像）或**"极速首屏"**（连签名接口都不想等）时，才需要 L3 (Blob Cache)
- 在 99% 的 Web 业务中，**二级缓存 + 浏览器原生 HTTP 缓存是最优解**

### URL 稳定性（Consistency）保证

**核心原则**：在 L2 缓存有效期内，管理器必须确保针对同一个 ObjectKey 返回**完全相同的 SignedUrl**。这样才能利用浏览器原生 Disk Cache。

**错误做法**：
```typescript
// ❌ 错误：每次 getUrl 都重新计算签名
async getUrl(objectKey: string) {
  const credentials = await getCredentials()
  return generateSignedUrl(objectKey, credentials)  // 每次都生成新URL
}
```

**正确做法**：
```typescript
// ✅ 正确：只要缓存里的 SignedUrl 没过期，就一直返回旧的 URL
async getUrl(objectKey: string) {
  const cached = storageManager.get(objectKey)
  
  // 如果缓存有效，直接返回缓存的 URL（保证一致性）
  if (cached && !isExpired(cached)) {
    return cached.signedUrl  // 返回相同的 URL，利用浏览器 Disk Cache
  }
  
  // 只有缓存失效时才生成新 URL
  const newUrl = await generateSignedUrl(objectKey)
  storageManager.set(objectKey, { signedUrl: newUrl, ... })
  return newUrl
}
```

**"骗"浏览器的机制（URL 稳定性 + 浏览器缓存）**：

```
┌─────────────────────────────────────────────────────────────────┐
│ 场景：同一个 ObjectKey 多次请求                                  │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ 第一次请求：getUrl('workshop/avatars/user1.jpg')                │
│   1. 缓存未命中                                                 │
│   2. 生成签名 URL: https://...?Expires=1769227923&Signature=... │
│   3. 保存到缓存（L1 + L2）                                      │
│   4. 返回 URL                                                   │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ 浏览器加载图片                                                   │
│   <img src="https://...?Expires=1769227923&Signature=..." />    │
│   浏览器将图片保存到 Disk Cache                                  │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ 第二次请求：getUrl('workshop/avatars/user1.jpg')                 │
│   1. 缓存命中（L1 或 L2）                                       │
│   2. 返回相同的 URL: https://...?Expires=1769227923&Signature=...│
│      ⚠️ 关键：返回完全相同的 URL（即使签名可能已过期）           │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ 浏览器加载图片                                                   │
│   <img src="https://...?Expires=1769227923&Signature=..." />    │
│   浏览器检查 Disk Cache：URL 相同 → 直接使用缓存 ✅             │
│   即使 OSS 签名已过期，浏览器仍可使用缓存                       │
└─────────────────────────────────────────────────────────────────┘
```

**关键点**：
- ✅ **URL 稳定性**：同一个 ObjectKey 在缓存有效期内返回完全相同的 URL
- ✅ **浏览器 Disk Cache**：浏览器看到相同的 URL，直接使用缓存，无需网络请求
- ✅ **"骗"浏览器**：即使 OSS 签名已过期，只要浏览器有缓存，仍然可以使用

**收益**：
- ✅ 浏览器 Disk Cache 命中率大幅提升
- ✅ 减少网络请求，提升加载速度
- ✅ 降低服务器压力

### 缓存更新策略

1. **写入时机**：
   - 下载图片成功后立即写入
   - 生成 signatureUrl 后立即写入

2. **更新时机**：
   - objectKey 变化时清除旧缓存
   - signatureUrl 过期时更新
   - 本地缓存失效时重新下载

3. **清理策略**：
   - **LRU 清理**：当缓存数量超过限制时，清理最久未访问的
   - **TTL 清理**：定期清理过期的缓存
   - **容量清理**：当存储空间不足时，清理最旧的缓存

## 🚀 性能优化

### 1. 批量加载优化
- **请求合并**：相同 objectKey 的多个请求合并为一个
- **STS 共享**：批量加载时共享同一个 STS 凭证
- **并发控制**：限制并发数量，避免浏览器限制

### 2. 预加载策略
- **可见性预加载**：预加载即将进入视口的资源
- **关联预加载**：加载当前资源时，预加载关联资源
- **后台预加载**：低优先级资源后台加载

### 3. 缓存优化
- **智能缓存**：根据访问频率决定缓存优先级
- **增量更新**：只更新变化的部分
- **压缩存储**：大文件可以考虑压缩存储

### 4. 网络优化
- **请求去重**：避免重复请求相同资源
- **请求合并**：批量请求合并为一次
- **CDN 加速**：如果使用 CDN，优先使用 CDN URL

## ⚠️ 错误处理

### 错误类型

1. **网络错误**
   - 处理：重试机制（最多 3 次）
   - 降级：返回占位图或默认头像

2. **STS 凭证错误**
   - 处理：重新获取凭证
   - 降级：使用旧的 signatureUrl（如果未过期）

3. **文件不存在**
   - 处理：返回 404 占位图
   - 降级：显示默认头像

4. **缓存错误**
   - 处理：清除损坏的缓存，重新下载
   - 降级：直接使用 signatureUrl

### 重试策略

```typescript
interface RetryConfig {
  maxRetries: number        // 最大重试次数（默认 3）
  retryDelay: number        // 重试延迟（毫秒，默认 1000）
  backoffFactor: number     // 退避因子（默认 2）
  retryableErrors: string[] // 可重试的错误类型
}
```

## 📡 事件系统

### 订阅机制

```typescript
interface OssResourceLoadEvents {
  // 文件开始加载
  onLoadStart: (objectKey: string) => void
  
  // 文件加载成功
  onLoadSuccess: (objectKey: string, url: string) => void
  
  // 文件加载失败
  onLoadError: (objectKey: string, error: Error) => void
  
  // 缓存命中
  onCacheHit: (objectKey: string, url: string) => void
  
  // 缓存更新
  onCacheUpdate: (objectKey: string, url: string) => void
}
```

### 使用示例

```typescript
// 订阅单个文件的加载事件
const unsubscribe = ossResourceLoader.subscribe('workshop/avatars/xxx.jpg', (url) => {
  console.log('文件加载完成:', url)
  // 更新 UI
})

// 取消订阅
unsubscribe()
```

## 🔌 API 设计

### 核心 API（简洁版）

```typescript
class OssResourceLoadManager {
  /**
   * 获取资源 URL（最常用，透明化处理）
   * @param objectKey OSS objectKey
   * @returns Promise<string> 可用的访问地址
   */
  async getUrl(objectKey: string): Promise<string>
  
  /**
   * 预加载一批资源（后台加载，不阻塞）
   * @param objectKeys OSS objectKey 数组
   */
  prefetch(objectKeys: string[]): void
  
  /**
   * 强制刷新某个资源的签名
   * @param objectKey OSS objectKey
   * @returns Promise<string> 新的签名 URL
   */
  async refresh(objectKey: string): Promise<string>
  
  /**
   * 清除缓存（不传参数则清除所有）
   * @param objectKey 可选的 OSS objectKey
   */
  clearCache(objectKey?: string): void
  
  /**
   * 订阅资源加载事件（可选，用于高级场景）
   * @param objectKey OSS objectKey
   * @param callback 回调函数
   * @returns 取消订阅函数
   */
  subscribe(
    objectKey: string,
    callback: (url: string) => void
  ): () => void
  
  /**
   * 获取资源加载状态（可选，用于调试）
   * @param objectKey OSS objectKey
   * @returns 'pending' | 'ready' | 'error'
   */
  getStatus(objectKey: string): 'pending' | 'ready' | 'error'
}
```

### 管理器配置

```typescript
interface ManagerConfig {
  defaultTTL: number        // 默认有效期（秒，如 3600）
  bufferTime: number        // 提前刷新时间（秒，如 300，即 5 分钟）
  maxConcurrent: number     // 最大并发请求数（默认 10）
  maxCacheSize: number     // 最大缓存数量（默认 1000）
  retryCount: number       // 最大重试次数（默认 3）
  retryDelay: number       // 重试延迟（毫秒，默认 1000）
}
```

### 使用示例

```typescript
// 获取管理器实例（单例）
const resourceLoader = OssResourceLoadManager.getInstance()

// 基础用法：获取单个资源 URL
const url = await resourceLoader.getUrl('workshop/avatars/user1.jpg')
// 返回: "https://bucket.oss-region.aliyuncs.com/workshop/avatars/user1.jpg?Expires=..."

// 预加载（不阻塞，后台加载）
resourceLoader.prefetch([
  'workshop/avatars/user2.jpg',
  'workshop/avatars/user3.jpg',
  'workshop/avatars/user4.jpg'
])

// 强制刷新某个资源
const newUrl = await resourceLoader.refresh('workshop/avatars/user1.jpg')

// 清除指定资源的缓存
resourceLoader.clearCache('workshop/avatars/user1.jpg')

// 清除所有缓存
resourceLoader.clearCache()

// 订阅加载事件（高级用法）
const unsubscribe = resourceLoader.subscribe('workshop/avatars/user1.jpg', (url) => {
  console.log('资源加载完成:', url)
  // 更新 UI
})

// 获取加载状态
const status = resourceLoader.getStatus('workshop/avatars/user1.jpg')
// 返回: 'pending' | 'ready' | 'error'
```

## 🎨 组件集成

### Avatar 组件集成（简化版）

```typescript
// Avatar 组件使用 OssResourceLoadManager
function Avatar({ user }: AvatarProps) {
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  
  useEffect(() => {
    if (!user?.avatar) return
    
    // 如果是完整 URL，直接使用
    if (user.avatar.startsWith('http://') || user.avatar.startsWith('https://')) {
      setAvatarUrl(user.avatar)
      return
    }
    
    // 如果是 objectKey，使用 OssResourceLoadManager（透明化处理）
    const resourceLoader = OssResourceLoadManager.getInstance()
    
    // 方式 1: 直接获取（推荐，最简单）
    resourceLoader.getUrl(user.avatar).then(url => {
      setAvatarUrl(url)
    })
    
    // 方式 2: 订阅模式（如果需要实时更新）
    // const unsubscribe = resourceLoader.subscribe(user.avatar, (url) => {
    //   setAvatarUrl(url)
    // })
    // return () => unsubscribe()
  }, [user?.avatar])
  
  // ... 渲染逻辑
}
```

### 批量加载场景（成员列表）

```typescript
// 成员列表组件
function MemberList({ members }: { members: Member[] }) {
  const [avatarUrls, setAvatarUrls] = useState<Map<string, string>>(new Map())
  
  useEffect(() => {
    const resourceLoader = OssResourceLoadManager.getInstance()
    
    // 提取所有头像 objectKey
    const objectKeys = members
      .map(m => m.avatar)
      .filter(avatar => avatar && !avatar.startsWith('http'))
    
    // 预加载所有头像（后台加载，不阻塞）
    resourceLoader.prefetch(objectKeys)
    
    // 并行获取所有 URL（自动去重和合并）
    Promise.all(
      objectKeys.map(async (key) => {
        const url = await resourceLoader.getUrl(key)
        return [key, url] as [string, string]
      })
    ).then(results => {
      setAvatarUrls(new Map(results))
    })
  }, [members])
  
  // ... 渲染逻辑
}
```

### 错误处理和被动刷新

```typescript
// 图片组件，支持自动重试
function ImageWithRetry({ objectKey }: { objectKey: string }) {
  const [url, setUrl] = useState<string | null>(null)
  const [error, setError] = useState(false)
  const resourceLoader = OssResourceLoadManager.getInstance()
  
  useEffect(() => {
    resourceLoader.getUrl(objectKey).then(setUrl)
  }, [objectKey])
  
  const handleError = async () => {
    console.warn('图片加载失败，尝试刷新:', objectKey)
    setError(true)
    
    // 被动刷新：清除缓存并重新获取
    resourceLoader.clearCache(objectKey)
    const newUrl = await resourceLoader.refresh(objectKey)
    setUrl(newUrl)
    setError(false)
  }
  
  if (!url) return <div>加载中...</div>
  
  return (
    <img
      src={url}
      onError={handleError}
      alt=""
    />
  )
}
```

## 📊 性能指标

### 关键指标

1. **缓存命中率**：目标 > 80%
2. **平均加载时间**：有缓存 < 10ms，无缓存 < 2s
3. **并发请求数**：控制在 5-10 个
4. **内存占用**：缓存大小限制在 50MB 以内
5. **网络请求数**：批量加载时，相同 objectKey 只请求一次

### 监控和日志

```typescript
interface PerformanceMetrics {
  cacheHitRate: number           // 缓存命中率
  averageLoadTime: number         // 平均加载时间
  totalRequests: number           // 总请求数
  failedRequests: number          // 失败请求数
  cacheSize: number               // 缓存大小（MB）
}
```

## 🔒 安全性考虑

1. **STS 凭证管理**：
   - 凭证不存储在 localStorage
   - 凭证过期前自动刷新（提前 5 分钟）
   - 凭证只在内存中保存
   - **单例模式**：全局共享一个 STS 凭证
   - **请求合并**：多个并发请求共享同一个刷新 Promise
   - **避免频繁申请**：不要过期后再申请，提前刷新
   - **OSS Client 复用**：全局只维护一个 OSS Client 实例，避免频繁创建

2. **缓存安全**：
   - 敏感文件不缓存到本地
   - 缓存数据加密（可选）
   - 定期清理敏感缓存

3. **错误信息**：
   - 不暴露内部错误详情给用户
   - 记录详细错误日志用于调试

## 📝 实现计划

### Phase 1: 核心管理器（基础功能）
- [ ] OssResourceLoadManager 基础实现
  - [ ] 单例模式
  - [ ] getUrl() 方法
  - [ ] 错误处理
- [ ] Request Coordinator 实现
  - [ ] 请求合并（Request Collapsing）
  - [ ] 任务分发
  - [ ] Promise 共享机制
- [ ] Storage Manager 实现
  - [ ] L1 内存缓存（Map）
  - [ ] L2 持久化缓存（IndexedDB/LocalStorage）
  - [ ] 缓存读写和验证
  - [ ] LRU 清理机制
- [ ] Signature Provider 实现
  - [ ] STS 凭证管理（单例模式，全局共享）
  - [ ] 提前刷新机制（过期前 5 分钟，避免过期后再申请）
  - [ ] 请求合并（避免频繁申请，多个请求共享刷新 Promise）
  - [ ] OSS Client 复用（避免频繁创建，全局只维护一个实例）
  - [ ] 凭证共享
- [ ] Status Monitor 实现
  - [ ] 状态追踪（pending/ready/error）
  - [ ] 状态通知

### Phase 2: 高级功能
- [ ] Request Queue 实现
  - [ ] 并发控制
  - [ ] 优先级队列
- [ ] 预加载功能
  - [ ] prefetch() 实现
  - [ ] 后台加载
  - [ ] 低优先级处理
- [ ] 刷新功能
  - [ ] refresh() 实现
  - [ ] 强制清除缓存
- [ ] 事件订阅系统
  - [ ] subscribe() 实现
  - [ ] 事件发布
  - [ ] 取消订阅

### Phase 3: 缓存优化和错误处理
- [ ] 主动失效机制
  - [ ] 定时检查（每 60 秒）
  - [ ] 读取时检查
  - [ ] 提前 5 分钟标记过期
- [ ] 过期缓冲期（Safe Buffer）
  - [ ] 逻辑过期时间实现
  - [ ] 提前 1 小时静默更新
- [ ] 容错与自愈机制
  - [ ] 全局错误拦截器（window error 事件）
  - [ ] data-oss-key 属性追踪
  - [ ] 403 错误自动检测和修复
  - [ ] 静默替换 img.src
- [ ] Intersection Observer 预检测
  - [ ] 可见性预检查
  - [ ] 提前 30 分钟换证
  - [ ] 图片元素注册和取消注册
- [ ] LRU 缓存清理
  - [ ] 访问时间追踪
  - [ ] 自动清理机制
  - [ ] 容量限制

### Phase 4: 集成和测试
- [ ] Avatar 组件集成
  - [ ] 替换现有逻辑
  - [ ] 测试加载流程
  - [ ] 测试错误处理
- [ ] 其他组件集成
  - [ ] TodoItem 组件
  - [ ] MemberList 组件
  - [ ] ProjectCard 组件
- [ ] 单元测试
  - [ ] 各管理器测试
  - [ ] 请求合并测试
  - [ ] 缓存策略测试
  - [ ] 错误处理测试
- [ ] 性能测试
  - [ ] 缓存命中率测试（目标 > 80%）
  - [ ] 加载时间测试（有缓存 < 10ms）
  - [ ] 并发性能测试
  - [ ] 请求合并效果测试

## 🎯 设计原则

### 1. 单一职责
- 每个管理器只负责一个特定功能
- OssResourceLoadManager 只负责协调，不处理具体逻辑

### 2. 开闭原则
- 对扩展开放：可以轻松添加新的缓存策略
- 对修改封闭：核心接口稳定，不影响现有代码

### 3. 依赖倒置
- 组件依赖 OssResourceLoadManager 接口，不依赖具体实现
- 管理器之间通过接口通信

### 4. 性能优先
- 缓存优先：优先使用缓存，减少网络请求
- 批量处理：批量操作共享资源
- 异步非阻塞：预加载不阻塞主流程

## 🔍 设计决策

### 为什么使用单例模式？
- **全局共享**：所有组件共享同一个管理器实例
- **资源复用**：STS 凭证、缓存等资源全局共享
- **状态一致**：确保所有组件看到相同的缓存状态

### 为什么使用二级缓存？
- **性能分层**：L1 内存缓存保证速度（< 1ms），L2 持久化缓存保证跨会话
- **容量平衡**：内存有限但快，持久化存储容量大但稍慢（10-50ms）
- **持久化**：L2 缓存保证页面刷新后仍可用
- **简化架构**：二级缓存已经足够，避免过度设计

### 为什么需要请求池？
- **去重**：避免相同资源的重复请求
- **并发控制**：避免浏览器请求过多导致阻塞
- **优先级**：重要资源优先加载

## 📈 预期效果

### 性能提升
- **缓存命中率**：从 0% 提升到 > 80%
- **平均加载时间**：从 2-3s 降低到 < 100ms（有缓存）
- **网络请求数**：减少 70% 以上（批量加载时）

### 开发体验
- **代码简化**：组件只需调用一个方法
- **错误处理**：统一的错误处理和降级策略
- **可维护性**：集中管理，易于调试和优化

### 用户体验
- **加载速度**：明显提升，特别是重复访问
- **流畅度**：预加载和批量加载提升流畅度
- **稳定性**：完善的错误处理，减少加载失败

## 🔄 设计对比与融合说明

### 两个设计方案的对比

| 特性 | 原设计（FileLoaderManager） | 用户设计（OssResourceLoadManager） | 融合后 |
|------|---------------------------|-------------------------------|--------|
| **组件命名** | RequestPoolManager | Request Coordinator | ✅ Request Coordinator（更清晰） |
| **签名管理** | STSPoolManager | Signature Provider | ✅ Signature Provider（职责更明确） |
| **状态追踪** | 无独立组件 | Status Monitor | ✅ Status Monitor（新增） |
| **缓存架构** | 三级缓存 | 二级缓存 | ✅ 二级缓存（简化） |
| **请求合并** | 请求去重 | Request Collapsing | ✅ Request Collapsing（明确命名） |
| **过期策略** | TTL + LRU | 主动失效 + 被动刷新 | ✅ 两者结合 |
| **API 设计** | loadFile, loadFiles | getUrl, prefetch | ✅ 融合（getUrl 更简洁） |

### 融合后的优势

1. **更清晰的职责划分**
   - Request Coordinator 专门负责请求调度和合并
   - Signature Provider 专门处理签名逻辑
   - Status Monitor 专门追踪状态

2. **更简洁的 API**
   - `getUrl()` 比 `loadFile()` 更语义化
   - `prefetch()` 比 `preloadFiles()` 更简洁
   - 统一的 `clearCache()` 接口

3. **更完善的过期策略**
   - 主动失效：定时检查 + 读取时检查
   - 被动刷新：图片加载失败时自动重试

4. **更高效的缓存架构**
   - 二级缓存已经足够，避免过度设计
   - L1 内存缓存保证速度，L2 持久化缓存保证跨会话

## 🎯 架构设计总结（2026 年前端工程化最佳实践）

### 核心设计原则

1. **URL 稳定性（Consistency）**
   - ✅ 在 L2 缓存有效期内，确保同一个 ObjectKey 返回完全相同的 SignedUrl
   - ✅ 利用浏览器原生 Disk Cache，大幅提升缓存命中率
   - ✅ 避免每次 getUrl 都重新计算签名

2. **二级缓存 + 浏览器原生缓存**
   - ✅ L1 内存缓存：毫秒级响应
   - ✅ L2 持久化缓存：跨会话保持
   - ✅ 浏览器 Disk Cache：自动利用，无需额外实现
   - ✅ 99% 的 Web 业务中，这是最优解
   - ⚠️ L3 存在的唯一必要性：只有需要"离线可用"或"极速首屏"时才需要

3. **容错与自愈（Error Handling & Self-Healing）**
   - ✅ 过期缓冲期（Safe Buffer）：提前 1 小时静默更新
   - ✅ 全局错误拦截：监听 window error 事件，自动修复 403 错误
   - ✅ 静默替换：用户几乎感知不到 URL 更新过程
   - ✅ 无需"预判"，通过"容错与自愈"机制解决

4. **2026 年技术方案**
   - ✅ Intersection Observer：可见性预检查
   - ✅ 提前 30 分钟换证：在图片正式显示前完成静默换新
   - ✅ 降低首屏压力：避免大量图片同时过期

### 系统健壮性保证

只要具备以下两点，系统就是无懈可击的：

1. **主动刷新**：管理器在 URL 真正失效前（Buffer Time）提前更新 L2
2. **被动自愈**：万一发生了 403 错误，全局监听器能根据 ObjectKey 立即重新获取签名并刷新 DOM

**完整流程图**：

```
┌─────────────────────────────────────────────────────────────────┐
│ 系统健壮性保证：主动刷新 + 被动自愈                              │
└─────────────────────────────────────────────────────────────────┘
                              ↓
        ┌─────────────────────┴─────────────────────┐
        │                                             │
        ▼                                             ▼
┌──────────────────────┐                  ┌──────────────────────┐
│ 主动刷新（Proactive） │                  │ 被动自愈（Reactive）  │
│                      │                  │                      │
│ logicalExpiresAt     │                  │ 403 错误触发         │
│ 已过期               │                  │                      │
└──────────────────────┘                  └──────────────────────┘
        │                                             │
        ▼                                             ▼
┌──────────────────────┐                  ┌──────────────────────┐
│ 后台静默刷新          │                  │ 全局错误拦截器        │
│                      │                  │                      │
│ 1. 检查缓存有效       │                  │ 1. 监听 window error  │
│    expiresAt 未过期   │                  │ 2. 检测图片加载失败    │
│ 2. 返回旧 URL         │                  │ 3. 获取 data-oss-key  │
│ 3. 后台刷新新 URL     │                  │ 4. 调用 refresh()     │
│ 4. 更新缓存           │                  │ 5. 静默替换 img.src   │
└──────────────────────┘                  └──────────────────────┘
        │                                             │
        └─────────────────────┬─────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ 结果：用户几乎感知不到修复过程                                   │
│   - 图片始终可用                                                │
│   - 加载速度快（充分利用浏览器缓存）                            │
│   - 自动修复（无需用户干预）                                    │
└─────────────────────────────────────────────────────────────────┘
```

**缓存策略决策树**：

```
请求 getUrl(objectKey)
    ↓
┌─────────────────────────────────────┐
│ 检查缓存是否存在                     │
└─────────────────────────────────────┘
    │
    ├─ 不存在 → 加载资源 → 生成签名 URL → 保存缓存 → 返回 URL
    │
    └─ 存在
        ↓
┌─────────────────────────────────────┐
│ 检查 expiresAt（真实过期时间）       │
└─────────────────────────────────────┘
    │
    ├─ expiresAt 未过期
    │   ↓
    │   ┌─────────────────────────────────────┐
    │   │ 检查 logicalExpiresAt（逻辑过期时间）│
    │   └─────────────────────────────────────┘
    │       │
    │       ├─ logicalExpiresAt 未过期 → 直接返回缓存的 URL ✅
    │       │
    │       └─ logicalExpiresAt 已过期 → 返回缓存的 URL + 后台静默刷新
    │
    └─ expiresAt 已过期
        ↓
        ┌─────────────────────────────────────┐
        │ 返回旧 URL（让浏览器尝试使用缓存）   │
        │ + 后台立即刷新                       │
        └─────────────────────────────────────┘
            │
            ├─ 浏览器有缓存 → 直接使用缓存 ✅
            │
            └─ 浏览器无缓存 → 触发 403 → 错误拦截器自动修复 ✅
```

这种设计确保了：即便用户手动删光了所有缓存，应用也能在几百毫秒内感知并自动修复所有破图，用户甚至感知不到这个过程。

### 关键实现要点

- **URL 稳定性**：缓存有效期内返回相同 URL，利用浏览器 Disk Cache
- **过期缓冲期**：逻辑过期时间比实际过期时间提前 1 小时
- **全局错误拦截**：window error 事件 + data-oss-key 属性追踪
- **Intersection Observer**：可见性预检查，提前 30 分钟换证

## 🔗 相关文档

- [OSS 文件展示文档](./OSS_FILE_DISPLAY.md)
- [OSS 头像上传文档](./OSS_AVATAR_UPLOAD_REVIEW.md)
- [OSS CORS 配置文档](./OSS_CORS_CONFIG.md)

