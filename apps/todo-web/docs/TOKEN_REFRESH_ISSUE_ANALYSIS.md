# Token 刷新机制问题分析

## 📋 问题描述

用户反馈：每两个小时左右都会跳转到登录页面，但实际上 Refresh Token 应该保持 1 个月（30天）才过期。

## 🔍 问题排查

### 1. API 返回的 Token 信息

根据 API 文档 (`server/api/api-guide.md`)：

- **Access Token**: 有效期 2 小时（7200 秒）
- **Refresh Token**: 有效期 30 天（2592000 秒）

登录和刷新接口都返回：
```json
{
  "tokens": {
    "access_token": "...",
    "refresh_token": "...",
    "expires_in": 7200,           // Access Token 有效期（秒）
    "refresh_expires_in": 2592000,  // Refresh Token 有效期（秒）
    "key_id": "..."
  }
}
```

### 2. 前端存储逻辑

前端在 `StoredAuthInfo` 中存储以下字段：
```typescript
{
  accessToken: string
  refreshToken: string
  tokenObtainedAt: number       // Access Token 获取时间戳（毫秒）
  tokenExpiresIn: number        // Access Token 有效期（秒数）
  refreshTokenObtainedAt: number  // Refresh Token 获取时间戳（毫秒）
  refreshExpiresIn: number      // Refresh Token 有效期（秒数）
}
```

### 3. 可能的问题原因

#### 原因 A：旧数据格式兼容问题 ⭐ **最可能**

查看 `tokenManager.ts` 第 90-105 行：

```typescript
export function isRefreshTokenExpired(
  authInfo: StoredAuthInfo,
  bufferMs: number = TOKEN_EXPIRY_BUFFER
): boolean {
  // 兼容旧数据格式：如果没有 refreshTokenObtainedAt 或 refreshExpiresIn，视为过期（需要重新登录）
  if (!authInfo.refreshTokenObtainedAt || !authInfo.refreshExpiresIn) {
    console.warn('⚠️ 检测到旧格式的认证信息，需要重新登录')
    return true  // ⚠️ 直接返回 true，导致跳转登录页
  }
  
  const now = Date.now()
  const expiresAt = authInfo.refreshTokenObtainedAt + (authInfo.refreshExpiresIn * 1000)
  return now >= (expiresAt - bufferMs)
}
```

**如果用户的 localStorage 中存储的是旧格式数据（缺少 `refreshTokenObtainedAt` 或 `refreshExpiresIn`）**：
- 每次调用 `isRefreshTokenValid()` 都会返回 `false`
- 触发 `client.ts` 第 62-68 行的逻辑，直接跳转登录页

#### 原因 B：刷新接口返回的 `refresh_expires_in` 含义不明确

后端可能有两种实现：

1. **每次刷新返回新的 30 天周期**（推荐）
   - 刷新接口返回 `refresh_expires_in: 2592000`
   - 前端设置 `refreshTokenObtainedAt = now`
   - ✅ 计算正确：`expiresAt = now + 2592000*1000`

2. **每次刷新返回剩余时间**（不推荐）
   - 首次登录：`refresh_expires_in: 2592000`（30天）
   - 2小时后刷新：`refresh_expires_in: 2584800`（剩余29.8天）
   - 如果前端仍然设置 `refreshTokenObtainedAt = now`
   - ❌ 计算错误：会导致过期时间不断推迟

#### 原因 C：请求拦截器逻辑问题

查看 `client.ts` 第 62 行：

```typescript
// 步骤1: 检查 Refresh Token 是否存在且未过期
if (!isRefreshTokenValid()) {
  console.warn('⚠️ Refresh Token 不存在或已过期，跳转登录页')
  clearAuthInfo()
  if (typeof window !== 'undefined') {
    window.location.href = '/login'
  }
  return Promise.reject(new Error('Refresh token invalid or expired'))
}
```

**问题**：这个检查在**每个 API 请求前**都会执行，如果 `isRefreshTokenValid()` 返回 `false`，会立即跳转登录页，不给用户任何机会。

## 🔧 诊断步骤

### 步骤 1: 检查 localStorage 中的数据格式

在浏览器控制台运行：
```javascript
window.debugToken()
```

查看输出，重点关注：
1. **是否有 "检测到旧格式的认证信息" 警告**
2. **Refresh Token 的剩余时间**
3. **refreshTokenObtainedAt 和 refreshExpiresIn 字段是否存在**

### 步骤 2: 清除旧数据并重新登录

如果检测到旧格式数据，在控制台运行：
```javascript
localStorage.clear()
```

然后重新登录，观察是否还会每两个小时跳转。

### 步骤 3: 监控刷新行为

观察浏览器控制台日志：
- 是否出现 "🔄 Access Token 已过期，使用 Refresh Token 刷新..."
- 是否出现 "✅ Access Token 刷新成功"
- 是否出现 "❌ Token 刷新失败"
- 是否出现 "⚠️ Refresh Token 不存在或已过期，跳转登录页"

### 步骤 4: 验证后端返回的数据

在刷新 Token 后，查看后端返回的数据：
```javascript
// 在 authStore.ts checkAndRefreshAuth() 第 167 行添加 console.log
console.log('🔄 刷新后的 Token 信息:', response.data.tokens)
```

确认：
- `refresh_expires_in` 是否总是 2592000（30天）
- 还是会递减（剩余时间）

## 💡 解决方案

### 方案 A：清除旧格式数据（临时方案）

如果是旧格式数据导致的问题，最简单的解决方案是：

1. 在用户首次访问新版本时，自动清除旧数据
2. 引导用户重新登录

实现代码（在 `main.tsx` 中添加）：
```typescript
// 检查并清除旧格式的认证数据
const authInfo = getAuthInfo()
if (authInfo && (!authInfo.refreshTokenObtainedAt || !authInfo.refreshExpiresIn)) {
  console.warn('⚠️ 检测到旧格式的认证信息，自动清除')
  clearAuthInfo()
  if (window.location.pathname !== '/login') {
    window.location.href = '/login'
  }
}
```

### 方案 B：改进刷新逻辑（推荐）

修改请求拦截器，优化错误处理：

```typescript
// client.ts
apiClient.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    const authInfo = getAuthInfo()
    
    // 如果没有认证信息，跳转登录（但不在每个请求前检查）
    if (!authInfo || !authInfo.accessToken || !authInfo.refreshToken) {
      // 只在公共接口以外的请求才跳转
      if (!config.url?.includes('/public/')) {
        clearAuthInfo()
        window.location.href = '/login'
        return Promise.reject(new Error('No auth info'))
      }
    }
    
    // 兼容旧格式：如果缺少 Refresh Token 时间字段，清除并跳转
    if (authInfo && (!authInfo.refreshTokenObtainedAt || !authInfo.refreshExpiresIn)) {
      console.warn('⚠️ 检测到旧格式的认证信息，需要重新登录')
      clearAuthInfo()
      window.location.href = '/login'
      return Promise.reject(new Error('Old auth format detected'))
    }
    
    // 只检查 Refresh Token 是否真正过期（不检查 Access Token）
    if (authInfo && isRefreshTokenExpired(authInfo)) {
      console.warn('⚠️ Refresh Token 已过期，需要重新登录')
      clearAuthInfo()
      window.location.href = '/login'
      return Promise.reject(new Error('Refresh token expired'))
    }
    
    // 检查并刷新 Access Token
    if (shouldRefreshToken() && !isRefreshing) {
      // ... 刷新逻辑
    }
    
    // ... 其余逻辑
  }
)
```

### 方案 C：明确后端行为（根本方案）

与后端确认 `refresh_expires_in` 的含义：

1. **如果是新的 30 天周期**：
   - 前端逻辑正确，无需修改
   
2. **如果是剩余时间**：
   - 需要修改前端逻辑，不更新 `refreshTokenObtainedAt`
   - 修改代码：
   ```typescript
   // 刷新 Token 时，保留原有的 refreshTokenObtainedAt
   saveAuthInfo({
     accessToken: response.data.tokens.access_token,
     refreshToken: response.data.tokens.refresh_token,
     tokenObtainedAt: now,
     tokenExpiresIn: response.data.tokens.expires_in,
     refreshTokenObtainedAt: authInfo.refreshTokenObtainedAt, // 保留原值
     refreshExpiresIn: response.data.tokens.refresh_expires_in,
     // ...
   })
   ```

## 📊 总结

**最可能的原因**：用户 localStorage 中存储的是旧格式数据，缺少 `refreshTokenObtainedAt` 或 `refreshExpiresIn` 字段。

**快速修复**：
1. 清除 localStorage：`localStorage.clear()`
2. 重新登录

**长期方案**：
1. 添加版本迁移逻辑，自动清除旧格式数据
2. 优化请求拦截器，避免过于激进的跳转登录
3. 与后端确认 `refresh_expires_in` 的确切含义

## 🔗 相关文件

- `frontend/src/lib/utils/tokenManager.ts` - Token 管理工具
- `frontend/src/store/authStore.ts` - 认证状态管理
- `frontend/src/lib/api/client.ts` - API 客户端拦截器
- `frontend/src/types/auth.ts` - 类型定义
- `frontend/src/utils/tokenDebug.ts` - Token 调试工具（新增）

