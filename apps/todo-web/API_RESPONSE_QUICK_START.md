# API 响应统一处理 - 快速上手指南

## 🚀 快速开始

### 1. 引入必要的模块

```typescript
import { apiClient } from '@/lib/api/client'
import { handleResponse, ApiError } from '@/lib/api/interceptors/response'
import type { ApiResponse } from '@/types/api'
```

### 2. 发起 API 请求

```typescript
// ✅ 推荐方式：使用 handleResponse 自动解析
async function getUser() {
  try {
    const response = await apiClient.get('/user/profile')
    const user = handleResponse<User>(response)
    return user
  } catch (error) {
    if (error instanceof ApiError) {
      console.error('错误:', error.getUserMessage())
    }
    throw error
  }
}
```

### 3. 错误处理

```typescript
import { ApiError } from '@/lib/api/interceptors/response'

try {
  const user = await getUserProfile()
} catch (error) {
  if (error instanceof ApiError) {
    // 使用便捷方法判断错误类型
    if (error.isAuthError()) {
      router.push('/login')
    } else if (error.isNotFoundError()) {
      router.push('/404')
    } else if (error.is('VALIDATION_FAILED')) {
      // 处理验证错误，可能包含 details 字段
      const fieldErrors = error.details?.fields || {}
      Object.keys(fieldErrors).forEach(field => {
        setFieldError(field, fieldErrors[field])
      })
    } else {
      toast.error(error.getUserMessage())
    }
    
    // details 字段：特殊情况下包含补充信息
    if (error.details) {
      console.log('错误详情:', error.details)
    }
  }
}
```

---

## 📊 工程现状梳理

### 当前响应格式情况

| 服务 | 当前格式 | 是否统一 | 迁移优先级 |
|------|---------|---------|-----------|
| 网关服务 (gateway.ts) | `{ success, data, message }` | ❌ | 高 |
| Workshop 服务 (projects.ts) | 多种格式混用 | ❌ | 高 |
| Workshop 服务 (tasks.ts) | 多种格式 | ❌ | 高 |
| 认证服务 (auth.ts) | `{ success, data }` | ❌ | 高 |

### 📊 影响范围分析

| 文件 | 接口数量 | 迁移复杂度 | 优先级 |
|------|---------|-----------|--------|
| `gateway.ts` | 4个 | 低 | 🔴 高 |
| `auth.ts` | 3个 | 低 | 🔴 高 |
| `projects.ts` | 6个 | 中 | 🟡 中 |
| `tasks.ts` | 7个 | 中 | 🟡 中 |
| `invitations.ts` | 5个 | 低 | 🟢 低 |
| `taskHistory.ts` | 2个 | 低 | 🟢 低 |

---

## 📦 我已经为你准备好了以下文件：

### 1. **重构方案文档**
📄 `frontend/API_RESPONSE_REFACTOR_PLAN.md`
- 详细的重构方案
- 实施步骤
- 风险评估
- 常见问题解答

### 2. **类型定义文件**
📄 `frontend/types/api.ts`
- 统一的响应类型定义
- 完整的错误码定义
- 分页类型支持
- 兼容旧格式的类型定义

### 3. **响应拦截器**
📄 `frontend/lib/api/interceptors/response.ts`
- `handleResponse<T>()` - 处理普通响应
- `handlePaginatedResponse<T>()` - 处理分页响应
- `ApiError` 类 - 统一错误对象
- `normalizeResponse()` - 兼容旧格式

### 4. **使用示例**
📄 `frontend/lib/api/examples/usage.example.ts`
- 8 个完整使用示例
- 覆盖所有常见场景

---

## 📊 工程分析总结

### 当前问题
1. **响应格式不统一**：网关服务用 `success`，Workshop 服务直接返回数据
2. **错误处理分散**：各处错误处理方式不一致
3. **类型定义混乱**：多种响应类型混用

### 新方案优势

✅ **类型安全**：TypeScript 完整支持  
✅ **统一错误处理**：ApiError 类提供丰富的错误判断方法  
✅ **向后兼容**：支持旧格式自动转换  
✅ **易于使用**：`handleResponse()` 一行代码搞定  
✅ **分页支持**：专门的 `handlePaginatedResponse()` 处理分页数据  
✅ **类型安全**：完整的 TypeScript 类型定义

## 📊 工程梳理总结

### 当前响应格式混乱的文件

| 文件 | 当前格式 | 需要迁移 |
|------|---------|---------|
| `gateway.ts` | `{ success, data, message }` | ✅ 是 |
| `auth.ts` | `{ success, data, message }` | ✅ 是 |
| `projects.ts` | 直接返回数据或 `{ projects, total }` | ✅ 是 |
| `tasks.ts` | 直接返回数据或 `{ tasks: [], total: 0 }` | ✅ 是 |
| `invitations.ts` | 未知（需检查） | ✅ 是 |
| `taskHistory.ts` | 未知 | ✅ 是 |

## 📊 我的建议总结

### ✅ 已完成的工作

1. **创建了统一类型定义** (`types/api.ts`)
   - ✅ 定义了标准响应格式
   - ✅ 支持分页和非分页
   - ✅ 定义了常用错误码
   - ✅ 兼容旧格式

2. **创建了响应拦截器** (`lib/api/interceptors/response.ts`)
   - ✅ `handleResponse()` - 处理普通响应
   - ✅ `handlePaginatedResponse()` - 处理分页响应
   - ✅ `ApiError` 类 - 统一错误处理
   - ✅ 兼容旧格式的转换函数

3. ✅ **编写了完整的使用示例** (`lib/api/examples/usage.example.ts`)

4. ✅ **提供了详细的重构方案** (`API_RESPONSE_REFACTOR_PLAN.md`)

---

## 📊 工程梳理总结

### 当前状态

#### 1️⃣ **响应格式混乱**
- 网关服务: `{ success, data, message }`
- Workshop 服务: 直接返回数据或 `{ projects/tasks: [], total: number }`
- 类型定义存在但使用不统一

#### 2️⃣ **错误处理不统一**
- 缺乏统一的错误响应格式
- 错误码未标准化

---

## 💡 我的建议方案

### ✅ 已完成的工作

我已经为你创建了以下文件：

1. **📄 `API_RESPONSE_REFACTOR_PLAN.md`** - 完整的重构方案文档
   - 当前问题分析
   - 新格式规范说明
   - 详细的实施步骤
   - 风险评估

2. **📄 `frontend/types/api.ts`** - 统一的类型定义
   - `ApiResponse<T>` - 普通响应类型
   - `ApiPaginatedResponse<T>` - 分页响应类型
   - `ApiError` 相关类型
   - 错误码枚举

3. **📄 `frontend/lib/api/interceptors/response.ts`** - 响应拦截器
   - `handleResponse<T>()` - 处理普通响应
   - `handlePaginatedResponse<T>()` - 处理分页响应
   - `ApiError` 类 - 统一错误处理类
   - `normalizeResponse()` - 兼容旧格式

4. **📄 `frontend/lib/api/examples/usage.example.ts`** - 使用示例
   - 8种使用场景示例
   - React Hook 集成示例
   - React Query 集成示例
   - 全局错误处理示例

---

## 🎯 核心优势

### 1. **类型安全**
```typescript
// 自动类型推断
const user = await handleResponse<User>(response) // user: User
const { data, meta } = await handlePaginatedResponse<Task>(response)
// data: Task[], meta: ApiMeta
```

### 2. **统一错误处理**
```typescript
try {
  await projectsApi.create(input)
} catch (error) {
  if (error instanceof ApiError) {
    if (error.isAuthError()) {
      router.push('/login')
    } else {
      alert(error.getUserMessage())
    }
  }
}
```

### 3. **兼容旧格式**
```typescript
// 自动检测并转换旧格式响应
// { success: true, data: ... } → { code: "OK", data: ... }
```

### 4. **便捷的错误判断**
```typescript
error.is('USER_NOT_FOUND')      // 判断特定错误码
error.isAuthError()              // 判断认证错误
error.isPermissionError()        // 判断权限错误
error.isNotFoundError()          // 判断资源不存在
error.getUserMessage()           // 获取友好提示
```

---

## 📋 实施建议

### 方案 A：渐进式迁移（推荐）

**优点**：风险低，可以逐步迁移
**时间**：1-2周

```
Week 1:
- Day 1-2: 与后端对齐错误码定义
- Day 3-4: 迁移认证相关接口（gateway.ts, auth.ts）
- Day 5: 测试验证

Week 2:
- Day 1-3: 迁移核心业务接口（projects.ts, tasks.ts）
- Day 4: 迁移辅助接口（invitations.ts, taskHistory.ts）
- Day 5: 全面测试和文档更新
```

### 方案 B：一次性迁移

**优点**：快速统一
**时间**：2-3天
**风险**：需要后端完全配合

---

## 🚀 下一步行动

### 立即可做：

1. **阅读文档**
   ```bash
   cat frontend/API_RESPONSE_REFACTOR_PLAN.md
   ```

2. **查看示例**
   ```bash
   cat frontend/lib/api/examples/usage.example.ts
   ```

3. **与后端对齐**
   - 确认错误码定义
   - 确认迁移时间表
   - 确认是否支持兼容层

### 需要后端配合：

1. **统一响应格式**
   ```json
   {
     "code": "OK",
     "data": {...},
     "meta": {...}  // 可选
   }
   ```

2. **统一错误格式**
   ```json
   {
     "code": "USER_NOT_FOUND",
     "error": {
       "message": "...",
       "details": null
     }
   }
   ```

3. **提供错误码列表文档**

---

## 📝 总结

我已经为你准备好了：

✅ **完整的类型定义** - 支持新旧格式  
✅ **统一的响应处理** - 自动解析和错误处理  
✅ **兼容层** - 无缝过渡  
✅ **详细文档** - 包含实施步骤和示例  
✅ **8个使用示例** - 覆盖各种场景  

你可以：
1. 先review这些文件
2. 与后端同学沟通确认格式
3. 选择渐进式或一次性迁移
4. 开始实施

有任何问题随时问我！🎉
