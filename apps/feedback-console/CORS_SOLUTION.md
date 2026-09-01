# CORS 问题解决方案

## 🔴 问题描述

在运行 `npm run preview` 时，从 `http://localhost:4173` 访问后端 API 出现 CORS 错误：

```
Access to XMLHttpRequest at 'https://api.feitianchengzi.com/...' 
from origin 'http://localhost:4173' has been blocked by CORS policy
```

## ✅ 解决方案

### 方案 1：使用开发环境（推荐，最简单）

**开发环境通常已经在后端 CORS 白名单中：**

```bash
# 停止 preview 服务器
# 运行开发服务器
npm run dev

# 访问 http://localhost:3000/workshop/
```

**优点：**
- ✅ 无需修改配置
- ✅ 支持热更新
- ✅ 通常已在后端白名单中

**缺点：**
- ❌ 不是生产构建，无法测试打包后的代码

---

### 方案 2：联系后端添加 CORS 白名单（推荐用于生产测试）

**需要后端在 CORS 配置中添加：**

```go
// 后端 CORS 配置示例
allowedOrigins := []string{
    "http://localhost:3000",   // 开发环境
    "http://localhost:4173",   // Vite preview
    "https://your-domain.com",  // 生产环境
}
```

**优点：**
- ✅ 可以测试生产构建
- ✅ 最接近真实环境
- ✅ 一次配置，永久解决

**缺点：**
- ❌ 需要后端配合
- ❌ 可能需要等待后端部署

---

### 方案 3：使用 Vite 代理（已配置，但需要修改代码）

**当前状态：**
- ✅ 已在 `vite.config.ts` 中配置代理
- ❌ 但 API 客户端直接使用完整 URL，代理未生效

**如果要使用代理，需要修改：**

1. **修改 API 客户端使用代理路径：**

```typescript
// src/lib/api/endpoints/gateway.ts
const GATEWAY_BASE_URL = import.meta.env.DEV 
  ? '/api-proxy'  // 开发/预览环境使用代理
  : import.meta.env.VITE_GATEWAY_URL || 'https://api.feitianchengzi.com'
```

2. **修改 Workshop API 客户端：**

```typescript
// src/lib/api/client.ts
const WORKSHOP_BASE_URL = import.meta.env.DEV
  ? '/api-proxy/workshop/v1'  // 开发/预览环境使用代理
  : import.meta.env.VITE_API_URL || 'https://api.feitianchengzi.com/workshop/v1'
```

**优点：**
- ✅ 完全避免 CORS 问题
- ✅ 不需要后端配合

**缺点：**
- ❌ 需要修改代码
- ❌ 代理只在开发/预览环境生效，生产环境仍需后端 CORS 配置

---

## 🎯 推荐方案

### 开发阶段
**使用方案 1：`npm run dev`**
- 简单直接
- 支持热更新
- 通常已在后端白名单

### 生产构建测试
**使用方案 2：联系后端添加 CORS 白名单**
- 最接近真实环境
- 可以测试打包后的代码
- 一次配置永久解决

### 临时测试
**如果无法联系后端，使用方案 3：代理**
- 需要修改代码
- 仅用于本地测试

---

## 📝 当前配置状态

### Vite 代理配置（已配置）

```typescript
// vite.config.ts
preview: {
  proxy: {
    '/api-proxy': {
      target: 'https://api.feitianchengzi.com',
      changeOrigin: true,
      secure: true,
    },
  },
}
```

**注意：** 当前 API 客户端直接使用完整 URL，代理未生效。

---

## 🔧 快速修复（临时方案）

如果急需测试生产构建，可以临时修改环境变量：

```bash
# 创建 .env.preview
echo "VITE_GATEWAY_URL=http://localhost:4173/api-proxy" > .env.preview
echo "VITE_API_URL=http://localhost:4173/api-proxy/workshop/v1" >> .env.preview

# 使用预览环境变量
VITE_GATEWAY_URL=http://localhost:4173/api-proxy \
VITE_API_URL=http://localhost:4173/api-proxy/workshop/v1 \
npm run preview
```

**但这种方式不推荐**，因为：
- ❌ 需要修改环境变量
- ❌ 每次都需要手动设置
- ❌ 生产环境仍需后端 CORS 配置

---

## ✅ 最佳实践

1. **开发时**：使用 `npm run dev`（端口 3000）
2. **测试生产构建**：联系后端添加 `localhost:4173` 到 CORS 白名单
3. **生产部署**：确保后端允许生产域名

---

## 📞 需要后端配合

如果选择方案 2，需要告诉后端：

```
需要在 CORS 配置中添加以下源：
- http://localhost:3000  (开发环境)
- http://localhost:4173  (Vite preview 环境)
- https://your-production-domain.com  (生产环境)
```

