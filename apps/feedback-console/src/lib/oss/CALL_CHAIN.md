# OSS 图片加载调用链

## 📋 完整调用链

```
┌─────────────────────────────────────────────────────────────────┐
│ 1. React 组件层 (Avatar.tsx)                                    │
│    - 用户头像展示组件                                             │
│    - 接收 user.avatar (可能是 objectKey 或完整 URL)              │
└──────────────────────┬──────────────────────────────────────────┘
                       │
                       │ getAvatarUrl(avatar)
                       ▼
┌─────────────────────────────────────────────────────────────────┐
│ 2. 业务层 (oss/urlHelper.ts)                                      │
│    getAvatarUrl()                                                │
│    - 判断是否为 objectKey (isObjectKey)                         │
│    - 如果是完整 URL，直接返回                                     │
│    - 如果是 objectKey，调用资源加载管理器                         │
└──────────────────────┬──────────────────────────────────────────┘
                       │
                       │ getOssResourceLoader().getUrl(objectKey)
                       ▼
┌─────────────────────────────────────────────────────────────────┐
│ 3. 资源加载管理器 (oss/load/OssResourceLoadManager.ts)           │
│    OssResourceLoadManager.getUrl()                              │
│    - 单例模式，全局共享                                           │
│    - 委托给 RequestCoordinator                                  │
└──────────────────────┬──────────────────────────────────────────┘
                       │
                       │ requestCoordinator.coordinate(objectKey)
                       ▼
┌─────────────────────────────────────────────────────────────────┐
│ 4. 请求协调器 (oss/load/RequestCoordinator.ts)                  │
│    RequestCoordinator.coordinate()                              │
│    ┌─────────────────────────────────────────────────────────┐  │
│    │ 步骤 1: 检查请求队列（请求合并）                        │  │
│    │   - 如果有相同 objectKey 的请求，返回现有 Promise       │  │
│    └─────────────────────────────────────────────────────────┘  │
│    ┌─────────────────────────────────────────────────────────┐  │
│    │ 步骤 2: 检查缓存（StorageManager）                      │  │
│    │   - L1 内存缓存（Map）                                   │  │
│    │   - L2 持久化缓存（localStorage）                        │  │
│    │   - 如果缓存有效，直接返回 signedUrl                     │  │
│    └─────────────────────────────────────────────────────────┘  │
│    ┌─────────────────────────────────────────────────────────┐  │
│    │ 步骤 3: 加载资源（loadResource）                         │  │
│    │   - 更新状态为 'pending'                                │  │
│    │   - 调用 SignatureProvider.getSignedUrl()                │  │
│    │   - 创建 ResourceItem 并更新缓存                        │  │
│    │   - 更新状态为 'ready'                                   │  │
│    └─────────────────────────────────────────────────────────┘  │
└──────────────────────┬──────────────────────────────────────────┘
                       │
                       │ signatureProvider.getSignedUrl(objectKey)
                       ▼
┌─────────────────────────────────────────────────────────────────┐
│ 5. 签名供应者 (oss/load/SignatureProvider.ts)                    │
│    SignatureProvider.getSignedUrl()                             │
│    ┌─────────────────────────────────────────────────────────┐  │
│    │ 步骤 1: 获取或刷新 STS 凭证                              │  │
│    │   getCredentials()                                       │  │
│    │   - 检查凭证是否有效（提前 5 分钟判断）                  │  │
│    │   - 如果无效，调用 refreshCredentials()                  │  │
│    │   - 请求合并：多个并发请求共享同一个刷新 Promise         │  │
│    └─────────────────────────────────────────────────────────┘  │
│    ┌─────────────────────────────────────────────────────────┐  │
│    │ 步骤 2: 获取或创建 OSS Client                            │  │
│    │   getOSSClient(credentials)                              │  │
│    │   - 检查 Client 是否存在且凭证未变                       │  │
│    │   - 如果不存在或凭证变化，创建新 Client                  │  │
│    │   - 复用同一个 Client 实例（单例模式）                   │  │
│    └─────────────────────────────────────────────────────────┘  │
│    ┌─────────────────────────────────────────────────────────┐  │
│    │ 步骤 3: 生成签名 URL                                     │  │
│    │   client.signatureUrl(objectKey, { expires: 3600 })      │  │
│    │   - 使用 OSS SDK 生成带签名的访问 URL                    │  │
│    │   - 有效期 1 小时                                        │  │
│    └─────────────────────────────────────────────────────────┘  │
└──────────────────────┬──────────────────────────────────────────┘
                       │
                       │ loadOSSSDK()
                       ▼
┌─────────────────────────────────────────────────────────────────┐
│ 6. OSS SDK 加载 (oss/sdk.ts)                                     │
│    loadOSSSDK()                                                  │
│    - 检查 window.OSS 是否已加载                                 │
│    - 如果未加载，动态加载 CDN 脚本                              │
│    - 返回 OSS SDK 对象                                          │
└──────────────────────┬──────────────────────────────────────────┘
                       │
                       │ 返回 signedUrl (签名 URL)
                       ▼
┌─────────────────────────────────────────────────────────────────┐
│ 7. 返回给组件                                                     │
│    - Avatar 组件收到 signedUrl                                   │
│    - 设置到 <img src={signedUrl} />                             │
│    - 浏览器自动加载图片                                          │
└─────────────────────────────────────────────────────────────────┘
```

## 🔄 详细流程说明

### 阶段 1: 组件调用
```typescript
// Avatar.tsx
useEffect(() => {
  if (!avatar) return
  
  // 如果是完整 URL，直接使用
  if (avatar.startsWith('http://') || avatar.startsWith('https://')) {
    setAvatarUrl(avatar)
    return
  }
  
  // 如果是 objectKey，调用 getAvatarUrl
  getAvatarUrl(avatar).then(setAvatarUrl)
}, [avatar])
```

### 阶段 2: 业务层处理
```typescript
// oss/urlHelper.ts
export async function getAvatarUrl(avatar: string): Promise<string | null> {
  // 判断是否为 objectKey
  if (!isObjectKey(avatar)) {
    return avatar  // 完整 URL，直接返回
  }
  
  // 使用资源加载管理器
  const resourceLoader = getOssResourceLoader()
  return await resourceLoader.getUrl(avatar)
}
```

### 阶段 3: 资源加载管理器
```typescript
// oss/load/OssResourceLoadManager.ts
async getUrl(objectKey: string): Promise<string> {
  // 委托给请求协调器
  return this.requestCoordinator.coordinate(objectKey)
}
```

### 阶段 4: 请求协调（核心逻辑）
```typescript
// oss/load/RequestCoordinator.ts
async coordinate(objectKey: string): Promise<string> {
  // 1. 请求合并检查
  if (this.requestQueue.has(objectKey)) {
    return this.requestQueue.get(objectKey)  // 返回现有 Promise
  }
  
  // 2. 缓存检查
  const cached = this.storageManager.get(objectKey)
  if (cached && this.storageManager.isValid(cached)) {
    return cached.signedUrl  // 缓存命中，直接返回
  }
  
  // 3. 加载资源
  const promise = this.loadResource(objectKey)
  this.requestQueue.set(objectKey, promise)
  return promise
}
```

### 阶段 5: 签名生成
```typescript
// oss/load/SignatureProvider.ts
async getSignedUrl(objectKey: string): Promise<string> {
  // 1. 获取 STS 凭证（单例，全局共享）
  const credentials = await this.getCredentials()
  
  // 2. 获取或创建 OSS Client（单例，全局共享）
  const client = await this.getOSSClient(credentials)
  
  // 3. 生成签名 URL
  return client.signatureUrl(objectKey, { expires: 3600 })
}
```

### 阶段 6: OSS SDK 加载
```typescript
// oss/sdk.ts
async function loadOSSSDK(): Promise<any> {
  if (window.OSS) {
    return window.OSS  // 已加载，直接返回
  }
  
  // 动态加载 CDN 脚本
  return new Promise((resolve, reject) => {
    const script = document.createElement('script')
    script.src = 'https://gosspublic.alicdn.com/aliyun-oss-sdk-6.23.0.min.js'
    script.onload = () => resolve(window.OSS)
    document.head.appendChild(script)
  })
}
```

## 🎯 关键特性

### 1. 请求合并（Request Collapsing）
- 多个组件同时请求同一个 objectKey 时，只产生一次网络请求
- 所有请求共享同一个 Promise

### 2. 二级缓存
- **L1 内存缓存**：毫秒级响应
- **L2 持久化缓存**：跨会话保持
- 缓存命中时直接返回，无需网络请求

### 3. STS 凭证管理
- **单例模式**：全局共享一个 STS 凭证
- **提前刷新**：过期前 5 分钟自动刷新
- **请求合并**：多个并发请求共享同一个刷新 Promise
- **OSS Client 复用**：全局只维护一个 Client 实例

### 4. URL 稳定性
- 缓存有效期内返回相同的 signedUrl
- 充分利用浏览器原生 Disk Cache

## 📊 性能优化点

1. **缓存优先**：优先使用缓存，减少网络请求
2. **请求合并**：相同 objectKey 的多个请求合并为一个
3. **凭证共享**：所有请求共享同一个 STS 凭证和 OSS Client
4. **提前刷新**：避免过期后再申请，提前 5 分钟刷新
5. **单例模式**：减少对象创建开销

## 🔗 相关文件

- `frontend/src/components/ui/Avatar.tsx` - 组件入口
- `frontend/src/lib/oss/urlHelper.ts` - 业务层辅助函数
- `frontend/src/lib/oss/load/` - 资源加载管理器
- `frontend/src/lib/oss/sdk.ts` - OSS SDK 工具

