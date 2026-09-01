# OSS 资源加载管理器

## 📋 概述

`OssResourceLoadManager` 是一个统一的 OSS 文件加载管理器，用于处理所有 OSS 文件的加载、缓存、更新等操作。

**设计文档**: `frontend/docs/oss/OSS_FILE_LOADER_DESIGN.md`

## 🚀 快速开始

### 基础用法

```typescript
import { getOssResourceLoader } from '@/lib/oss/load'

// 获取管理器实例（单例）
const resourceLoader = getOssResourceLoader()

// 获取资源 URL
const url = await resourceLoader.getUrl('workshop/avatars/user1.jpg')
```

### 在 React 组件中使用

```typescript
import { useEffect, useState } from 'react'
import { getOssResourceLoader } from '@/lib/oss/load'

function Avatar({ avatar }: { avatar: string }) {
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  
  useEffect(() => {
    if (!avatar) return
    
    // 如果是完整 URL，直接使用
    if (avatar.startsWith('http://') || avatar.startsWith('https://')) {
      setAvatarUrl(avatar)
      return
    }
    
    // 如果是 objectKey，使用管理器获取 URL
    const resourceLoader = getOssResourceLoader()
    resourceLoader.getUrl(avatar)
      .then(setAvatarUrl)
      .catch(error => {
        console.error('获取头像 URL 失败:', error)
        setAvatarUrl(null)
      })
  }, [avatar])
  
  return avatarUrl ? <img src={avatarUrl} alt="头像" /> : <div>加载中...</div>
}
```

## 📚 API 文档

### `getUrl(objectKey: string): Promise<string>`

获取资源 URL（最常用，透明化处理）

```typescript
const url = await resourceLoader.getUrl('workshop/avatars/user1.jpg')
```

### `prefetch(objectKeys: string[]): void`

预加载一批资源（后台加载，不阻塞）

```typescript
resourceLoader.prefetch([
  'workshop/avatars/user1.jpg',
  'workshop/avatars/user2.jpg',
])
```

### `refresh(objectKey: string): Promise<string>`

强制刷新某个资源的签名

```typescript
const newUrl = await resourceLoader.refresh('workshop/avatars/user1.jpg')
```

### `clearCache(objectKey?: string): void`

清除缓存（不传参数则清除所有）

```typescript
// 清除指定资源的缓存
resourceLoader.clearCache('workshop/avatars/user1.jpg')

// 清除所有缓存
resourceLoader.clearCache()
```

### `subscribe(objectKey: string, callback: (url: string) => void): () => void`

订阅资源加载事件（可选，用于高级场景）

```typescript
const unsubscribe = resourceLoader.subscribe('workshop/avatars/user1.jpg', (url) => {
  console.log('资源加载完成:', url)
})

// 取消订阅
unsubscribe()
```

### `getStatus(objectKey: string): 'pending' | 'ready' | 'error'`

获取资源加载状态（可选，用于调试）

```typescript
const status = resourceLoader.getStatus('workshop/avatars/user1.jpg')
```

## ⚙️ 配置

### 默认配置

```typescript
{
  defaultTTL: 3600,        // 默认有效期（秒，1小时）
  bufferTime: 300,          // 提前刷新时间（秒，5分钟）
  maxConcurrent: 10,        // 最大并发请求数
  maxCacheSize: 1000,       // 最大缓存数量
  retryCount: 3,            // 最大重试次数
  retryDelay: 1000,         // 重试延迟（毫秒）
}
```

### 自定义配置

```typescript
import { OssResourceLoadManager } from '@/lib/oss/load'

const resourceLoader = OssResourceLoadManager.getInstance({
  defaultTTL: 7200,        // 2小时
  bufferTime: 600,         // 10分钟
  maxConcurrent: 20,
  maxCacheSize: 2000,
})
```

## 🎯 核心特性

### 1. 请求合并（Request Collapsing）

多个组件同时请求同一个 objectKey 时，只产生一次网络请求。

```typescript
// 三个组件同时请求同一个头像
const promise1 = resourceLoader.getUrl('workshop/avatars/user1.jpg')
const promise2 = resourceLoader.getUrl('workshop/avatars/user1.jpg')
const promise3 = resourceLoader.getUrl('workshop/avatars/user1.jpg')

// 只产生一次网络请求，所有 Promise 共享结果
```

### 2. 二级缓存架构

- **L1 内存缓存**: 毫秒级响应，页面会话期间有效
- **L2 持久化缓存**: 跨会话持久化，使用 localStorage

### 3. URL 稳定性保证

在缓存有效期内，同一个 objectKey 返回完全相同的 SignedUrl，充分利用浏览器原生 Disk Cache。

### 4. STS 凭证管理

- **单例模式**: 全局共享一个 STS 凭证和一个 OSS Client 实例
- **提前刷新**: 在过期前 5 分钟自动刷新，避免过期后再申请
- **请求合并**: 多个并发请求共享同一个刷新 Promise

## 📝 使用示例

更多使用示例请参考设计文档: `frontend/docs/oss/OSS_FILE_LOADER_DESIGN.md`

## 🔗 相关文档

- [设计文档](../docs/oss/OSS_FILE_LOADER_DESIGN.md)
- [文件展示文档](../docs/oss/OSS_FILE_DISPLAY.md)

