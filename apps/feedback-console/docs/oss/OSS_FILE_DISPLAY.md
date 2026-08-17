# OSS 文件展示（获取文件）

## 📋 概述

本文档说明如何从 OSS 获取并展示文件（主要是图片）。文件展示的核心是：**通过 objectKey 生成签名 URL（signatureUrl）来访问文件**。

## 🔗 相关文档

- [头像上传文档](./OSS_AVATAR_UPLOAD_REVIEW.md)
- [CORS 配置文档](./OSS_CORS_CONFIG.md)

## 🔑 核心概念

### 1. objectKey（对象键）

- **定义**：上传后 OSS 路径配置，可以认为是文件的"key"
- **格式**：例如 `workshop/avatars/1234567890_abc123.jpg`
- **存储位置**：后端业务层数据库，作为展示所需的"明文"标识
- **特点**：
  - 永久有效（只要文件不被删除）
  - 不包含访问权限信息
  - 不能直接用于访问文件

### 2. signatureUrl（签名 URL）

- **定义**：通过 objectKey 生成的动态访问 URL，是"真实能访问的路径"
- **格式**：例如 `https://bucket.oss-cn-beijing.aliyuncs.com/workshop/avatars/xxx.jpg?Expires=xxx&OSSAccessKeyId=xxx&Signature=xxx`
- **特点**：
  - **有过期时效**（默认 1 小时）
  - 包含访问权限信息（签名）
  - 可以直接用于访问文件（浏览器可以直接打开）

## 🔄 完整流程

### 阶段一：上传阶段（获取 objectKey 和 signatureUrl）

```
用户上传文件
    ↓
获取 STS 临时凭证
    ↓
生成 objectKey（例如：workshop/avatars/xxx.jpg）
    ↓
上传文件到 OSS（使用 objectKey）
    ↓
生成 signatureUrl（临时访问 URL，使用 objectKey）
    ↓
将 objectKey 推送到后端业务层（存储到数据库）
```

**关键点**：
- 上传成功后，我们已经获取了两个关键信息：`objectKey` 和 `signatureUrl`
- `objectKey` 会被存储到后端数据库，作为文件的"标识符"
- `signatureUrl` 可以立即使用，但有过期时间

### 阶段二：展示阶段（通过 objectKey 获取 signatureUrl）

当需要展示文件时，我们只有 `objectKey`（从后端获取），需要重新生成 `signatureUrl`：

```
从后端获取 objectKey
    ↓
检查本地缓存（是否有对应的 signatureUrl）
    ↓
┌─────────────────────────────────────┐
│ 情况 1：有缓存的 signatureUrl        │
│ - 检查 key 是否匹配                  │
│ - 如果匹配：直接使用缓存的 URL       │
│ - 如果不匹配：更新 key，重新生成 URL │
└─────────────────────────────────────┘
    ↓
┌─────────────────────────────────────┐
│ 情况 2：没有缓存的 signatureUrl      │
│ - 获取 STS 临时凭证                 │
│ - 创建 OSS 客户端                   │
│ - 通过 objectKey 生成 signatureUrl  │
│ - 将 objectKey 和 signatureUrl 绑定 │
│   存储到本地缓存                    │
└─────────────────────────────────────┘
    ↓
使用 signatureUrl 展示文件
```

## 💾 本地缓存策略

### 缓存数据结构

```typescript
interface OSSFileCache {
  objectKey: string        // 文件的 objectKey
  signatureUrl: string     // 签名 URL
  expiresAt: number        // 过期时间戳（毫秒）
  localImageUrl: string    // 本地缓存的图片地址（blob URL 或 IndexedDB key）
}
```

**说明**：
- `objectKey`：文件的唯一标识，对应本地缓存的图片
- `signatureUrl`：用于下载图片的临时 URL（有过期时间）
- `expiresAt`：signatureUrl 的过期时间戳
- `localImageUrl`：本地缓存的图片地址（例如：`blob:http://...` 或 IndexedDB 的 key），如果为空则表示尚未缓存到本地

### 缓存逻辑

#### 1. 检查缓存

```
从后端获取 objectKey
    ↓
查找本地缓存（根据 objectKey）
    ↓
┌─────────────────────────────────────┐
│ 情况 1：有本地图片缓存              │
│ - 检查 localImageUrl 是否存在       │
│ - 如果存在：直接使用本地缓存图片    │
│ - 优先使用本地缓存，不依赖过期时间  │
└─────────────────────────────────────┘
    ↓
┌─────────────────────────────────────┐
│ 情况 2：没有本地图片缓存            │
│ - localImageUrl 为空                │
│ - 需要重新获取 signatureUrl         │
│ - 下载图片并缓存到本地             │
└─────────────────────────────────────┘
```

#### 2. 使用缓存策略

**优先级顺序**：
1. **优先使用本地图片缓存**（`localImageUrl`）
   - 如果 `localImageUrl` 存在且有效，直接使用
   - 不依赖 `signatureUrl` 的过期时间
   - 这样可以避免阿里云给的时效不一定准确的问题

2. **其次使用 signatureUrl**（如果本地缓存不存在）
   - 检查 `signatureUrl` 是否过期（`expiresAt < Date.now()`）
   - 如果未过期，使用 `signatureUrl` 下载图片
   - 下载成功后，将图片缓存到本地，更新 `localImageUrl`

3. **重新生成 signatureUrl**（如果本地缓存不存在且 signatureUrl 已过期）
   - 获取新的 STS 凭证
   - 生成新的 `signatureUrl`
   - 下载图片并缓存到本地

#### 3. 本地图片缓存流程

```
检查 localImageUrl
    ↓
┌─────────────────────────────────────┐
│ localImageUrl 存在？                 │
│ - 是：直接使用本地缓存图片          │
│ - 否：继续下一步                    │
└─────────────────────────────────────┘
    ↓
检查 signatureUrl 是否过期
    ↓
┌─────────────────────────────────────┐
│ signatureUrl 未过期？                │
│ - 是：使用 signatureUrl 下载图片     │
│ - 否：重新生成 signatureUrl          │
└─────────────────────────────────────┘
    ↓
下载图片
    ↓
缓存图片到本地（IndexedDB 或 Blob URL）
    ↓
更新 localImageUrl
    ↓
使用本地缓存的图片
```

#### 4. 缓存更新逻辑

- **objectKey 变化**：
  - 如果新的 `objectKey` 与缓存中的不一致，清除旧的本地缓存
  - 重新下载并缓存新图片

- **本地缓存失效**：
  - 如果 `localImageUrl` 指向的图片无法访问（例如：blob URL 被回收）
  - 清除 `localImageUrl`，重新下载并缓存

#### 5. 关于文件完整性校验

**问题**：需要确保文件/图片缓存完整，但这涉及校验机制，实现较复杂。

**解决方案**：
- **优先使用本地缓存**：如果 `localImageUrl` 存在，直接使用，不进行完整性校验
- **按过期时间判断**：如果本地缓存不存在，再按 `expiresAt` 判断是否需要重新获取
- **简化策略**：暂时不实现完整性校验，依赖浏览器的缓存机制和 IndexedDB 的可靠性

## 📝 代码实现要点

### 1. 获取文件 URL 的流程（包含本地缓存）

```typescript
// 伪代码示例
async function getFileUrl(objectKey: string): Promise<string> {
  // 1. 检查本地缓存
  const cached = getCache(objectKey)
  
  // 2. 优先使用本地图片缓存
  if (cached && cached.localImageUrl) {
    // 验证本地缓存是否有效
    if (await isLocalCacheValid(cached.localImageUrl)) {
      return cached.localImageUrl
    } else {
      // 本地缓存失效，清除
      cached.localImageUrl = ''
    }
  }
  
  // 3. 如果没有本地缓存，检查 signatureUrl
  let signatureUrl = cached?.signatureUrl
  let expiresAt = cached?.expiresAt
  
  // 4. 如果 signatureUrl 不存在或已过期，重新生成
  if (!signatureUrl || !expiresAt || expiresAt < Date.now()) {
    const credentials = await getSTSToken()
    const client = createOSSClient(credentials)
    signatureUrl = client.signatureUrl(objectKey, { expires: 3600 })
    expiresAt = Date.now() + 3600 * 1000
  }
  
  // 5. 下载图片并缓存到本地
  const localImageUrl = await downloadAndCacheImage(signatureUrl, objectKey)
  
  // 6. 更新缓存
  setCache(objectKey, {
    objectKey,
    signatureUrl,
    expiresAt,
    localImageUrl
  })
  
  return localImageUrl
}

// 下载图片并缓存到本地
async function downloadAndCacheImage(
  signatureUrl: string, 
  objectKey: string
): Promise<string> {
  // 1. 下载图片
  const response = await fetch(signatureUrl)
  if (!response.ok) {
    throw new Error('下载图片失败')
  }
  const blob = await response.blob()
  
  // 2. 缓存到本地（使用 IndexedDB 或 Blob URL）
  // 方案 1：使用 IndexedDB
  await saveToIndexedDB(objectKey, blob)
  const localUrl = `indexeddb://${objectKey}`
  
  // 方案 2：使用 Blob URL（简单但可能被回收）
  // const localUrl = URL.createObjectURL(blob)
  
  return localUrl
}

// 验证本地缓存是否有效
async function isLocalCacheValid(localImageUrl: string): Promise<boolean> {
  try {
    // 尝试访问本地缓存
    if (localImageUrl.startsWith('indexeddb://')) {
      const blob = await getFromIndexedDB(localImageUrl.replace('indexeddb://', ''))
      return blob !== null
    } else if (localImageUrl.startsWith('blob:')) {
      // Blob URL 可能已被回收，尝试访问
      const response = await fetch(localImageUrl, { method: 'HEAD' })
      return response.ok
    }
    return false
  } catch {
    return false
  }
}
```

### 2. 组件中的使用

```typescript
// Avatar 组件示例
useEffect(() => {
  if (!avatar) return
  
  // 判断是 objectKey 还是完整 URL
  if (isObjectKey(avatar)) {
    // 是 objectKey，需要获取 URL（优先使用本地缓存）
    getFileUrl(avatar)
      .then((url) => {
        setAvatarUrl(url) // url 可能是本地缓存地址或 signatureUrl
      })
      .catch((error) => {
        console.error('获取头像 URL 失败:', error)
        setAvatarUrl(null)
      })
  } else {
    // 已经是完整 URL，直接使用
    setAvatarUrl(avatar)
  }
}, [avatar])
```

### 3. 本地缓存实现方案

#### 方案 1：使用 IndexedDB（推荐）

**优点**：
- 持久化存储，不会因为页面刷新而丢失
- 可以存储大量数据
- 可以存储完整的文件数据

**实现**：
```typescript
// 使用 IndexedDB 存储图片
const dbName = 'oss_file_cache'
const storeName = 'images'

async function saveToIndexedDB(objectKey: string, blob: Blob): Promise<void> {
  const db = await openDB(dbName, 1, {
    upgrade(db) {
      db.createObjectStore(storeName)
    }
  })
  await db.put(storeName, blob, objectKey)
}

async function getFromIndexedDB(objectKey: string): Promise<Blob | null> {
  const db = await openDB(dbName, 1)
  return await db.get(storeName, objectKey) || null
}
```

#### 方案 2：使用 Blob URL（简单但不持久）

**优点**：
- 实现简单
- 可以直接用于 `<img src>`

**缺点**：
- 页面刷新后可能失效
- 可能被浏览器回收

**实现**：
```typescript
async function saveAsBlobUrl(blob: Blob): Promise<string> {
  return URL.createObjectURL(blob)
}
```

#### 方案 3：使用 Cache API（Service Worker）

**优点**：
- 浏览器原生缓存机制
- 可以配合 Service Worker 使用

**缺点**：
- 需要 Service Worker 支持
- 实现相对复杂

## ⚠️ 注意事项

### 1. objectKey 目录结构

**注意**：`objectKey` 中的 `avatars/` 目录是针对头像业务的，之后我们还有其他的目录（例如：`attachments/`、`documents/` 等）。

当前 `ossUpload.ts` 中的代码虽然大部分都支持上传业务，但是 `objectKey` 的生成是针对 `avatars/` 目录硬编码的，这样不够灵活。

**需要重构**：
- 将目录路径作为参数传入，而不是硬编码 `avatars/`
- 抽出公共代码，提供灵活性
- 支持不同业务场景下的不同目录结构

**重构建议**：
```typescript
// 当前（不够灵活）
const objectKey = joinPath(credentials.RootPath, `avatars/${fileName}`)

// 重构后（灵活）
function generateObjectKey(
  rootPath: string,
  directory: string,  // 'avatars' | 'attachments' | 'documents' 等
  fileName: string
): string {
  return joinPath(rootPath, `${directory}/${fileName}`)
}
```

### 2. signatureUrl 过期处理

- **默认过期时间**：1 小时（3600 秒）
- **过期后**：需要重新获取 STS 凭证并生成新的 `signatureUrl`
- **缓存策略**：本地缓存 `signatureUrl`，但需要检查过期时间

### 3. 错误处理

- 如果 `objectKey` 不存在或文件已被删除，生成 `signatureUrl` 会失败
- 需要处理网络错误、STS 凭证获取失败等情况
- 提供降级方案（例如：显示占位图）

## 🔧 相关代码文件

### 核心工具函数
- `frontend/src/lib/utils/ossUpload.ts`
  - `getSignedUrl()` - 生成签名 URL
  - `getAvatarUrl()` - 获取头像 URL（自动判断 objectKey 或完整 URL）
  - `isObjectKey()` - 判断是否为 objectKey

### UI 组件
- `frontend/src/components/ui/Avatar.tsx` - 头像展示组件（已实现 objectKey 到 URL 的转换）

## 📊 流程图

```
┌─────────────────┐
│  上传文件阶段    │
└────────┬────────┘
         │
         ├─→ 获取 objectKey
         ├─→ 生成 signatureUrl
         └─→ 存储 objectKey 到后端
         
┌─────────────────┐
│  展示文件阶段    │
└────────┬────────┘
         │
         ├─→ 从后端获取 objectKey
         │
         ├─→ 检查本地缓存
         │   ├─→ 有缓存且未过期 → 使用缓存 URL
         │   └─→ 无缓存或已过期 → 重新生成 URL
         │
         └─→ 使用 signatureUrl 展示文件
```

## 🚀 性能优化建议

1. **缓存策略**：
   - 使用 localStorage 或 sessionStorage 缓存 `objectKey` 和 `signatureUrl` 的映射
   - 设置合理的过期时间（建议比 signatureUrl 的过期时间稍短）

2. **批量处理**：
   - 如果需要展示多个文件，可以批量获取 STS 凭证
   - 避免为每个文件单独获取凭证

3. **预加载**：
   - 在用户可能需要查看文件前，提前生成 `signatureUrl`
   - 例如：在列表页面预加载详情页可能需要的文件

4. **错误重试**：
   - 如果生成 `signatureUrl` 失败，实现重试机制
   - 设置最大重试次数，避免无限重试

