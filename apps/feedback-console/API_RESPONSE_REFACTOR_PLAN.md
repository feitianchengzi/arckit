# API 响应格式统一重构方案

## 📋 目录
- [当前问题分析](#当前问题分析)
- [新的响应格式规范](#新的响应格式规范)
- [重构方案](#重构方案)
- [实施步骤](#实施步骤)
- [风险评估](#风险评估)

---

## 当前问题分析

### 1. 响应格式不统一

#### 网关服务（gateway.ts）
```typescript
// 发送验证码
{ success: boolean, message: string }

// 登录
{ success: boolean, data: { user, tokens }, message?: string, auth_level?: string }

// 刷新Token
{ success: boolean, data: { tokens } }

// 获取用户Profile
{ success: boolean, data: UserProfile }
```

#### Workshop 服务（projects.ts, tasks.ts）
```typescript
// 项目列表
{ projects: Project[], total: number }

// 创建项目/任务 - 直接返回数据
Project | Task

// 任务列表
{ tasks: Task[], total: number }
```

#### 类型定义（types/index.ts）
```typescript
// 定义了但使用不统一
interface ApiResponse<T> {
  data: T
  message?: string
}

interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  page_size: number
}
```

### 2. 错误处理不统一

```typescript
// client.ts 中定义
interface ApiError {
  message: string
  code?: string
  status?: number
}

// 但后端返回的格式可能各不相同
```

---

## 新的响应格式规范

### ✅ 成功响应

```typescript
// 1. 无分页数据
{
  "code": "OK",
  "data": {...} | [...]
}

// 2. 分页数据
{
  "code": "OK",
  "data": [...],
  "meta": {
    "page": 1,
    "page_size": 20,
    "total": 153
  }
}
```

### ❌ 错误响应

```typescript
// 简单错误（details 为 null）
{
  "code": "USER_NOT_FOUND",
  "error": {
    "message": "User not found",
    "details": null
  }
}

// 复杂错误（包含 details 补充信息）
{
  "code": "VALIDATION_FAILED",
  "error": {
    "message": "表单验证失败",
    "details": {
      "fields": {
        "email": "邮箱格式不正确",
        "password": "密码至少需要8个字符"
      }
    }
  }
}
```

**关于 details 字段**：
- 通常情况下为 `null`
- 仅在需要补充特殊信息时才包含具体内容
- 常见使用场景：
  - 验证错误的字段详情
  - 业务规则冲突的具体原因
  - 权限不足时需要的权限说明
  - 速率限制的重试信息
  - 批量操作的详细结果

📖 **详细说明**: 参见 [`frontend/docs/API_ERROR_DETAILS_GUIDE.md`](./docs/API_ERROR_DETAILS_GUIDE.md)

### 常见错误码

```typescript
// 认证相关
- UNAUTHORIZED          // 未授权
- TOKEN_EXPIRED         // Token过期
- INVALID_TOKEN         // 无效Token

// 资源相关
- NOT_FOUND            // 资源不存在
- USER_NOT_FOUND       // 用户不存在
- PROJECT_NOT_FOUND    // 项目不存在
- TASK_NOT_FOUND       // 任务不存在

// 权限相关
- FORBIDDEN            // 无权限
- ACCESS_DENIED        // 访问被拒绝

// 业务逻辑
- INVALID_REQUEST      // 无效请求
- VALIDATION_FAILED    // 验证失败
- ALREADY_EXISTS       // 资源已存在

// 系统错误
- INTERNAL_ERROR       // 内部错误
- SERVICE_UNAVAILABLE  // 服务不可用
```

---

## 重构方案

### 方案 1：统一类型定义（推荐）

**优点：**
- 类型安全
- 自动提示和校验
- 易于维护

**实施：**

#### 1. 定义统一响应类型

```typescript
// frontend/types/api.ts

/** 统一 API 响应码 */
export type ApiCode = 
  | 'OK'
  | 'UNAUTHORIZED'
  | 'TOKEN_EXPIRED'
  | 'INVALID_TOKEN'
  | 'NOT_FOUND'
  | 'USER_NOT_FOUND'
  | 'PROJECT_NOT_FOUND'
  | 'TASK_NOT_FOUND'
  | 'FORBIDDEN'
  | 'ACCESS_DENIED'
  | 'INVALID_REQUEST'
  | 'VALIDATION_FAILED'
  | 'ALREADY_EXISTS'
  | 'INTERNAL_ERROR'
  | 'SERVICE_UNAVAILABLE'
  | string  // 允许其他自定义错误码

/** 错误详情 */
export interface ApiErrorDetail {
  message: string
  details?: any
}

/** 分页元数据 */
export interface ApiMeta {
  page: number
  page_size: number
  total: number
}

/** 统一成功响应（无分页） */
export interface ApiSuccessResponse<T> {
  code: 'OK'
  data: T
  meta?: never
  error?: never
}

/** 统一成功响应（带分页） */
export interface ApiPaginatedResponse<T> {
  code: 'OK'
  data: T[]
  meta: ApiMeta
  error?: never
}

/** 统一错误响应 */
export interface ApiErrorResponse {
  code: Exclude<ApiCode, 'OK'>
  data?: never
  meta?: never
  error: ApiErrorDetail
}

/** 统一 API 响应（联合类型） */
export type ApiResponse<T> = 
  | ApiSuccessResponse<T>
  | ApiErrorResponse

/** 统一 API 分页响应（联合类型） */
export type ApiPaginatedResponse<T> = 
  | ApiPaginatedResponse<T>
  | ApiErrorResponse
```

#### 2. 创建响应拦截器

```typescript
// frontend/lib/api/interceptors/response.ts

import { AxiosResponse } from 'axios'
import { ApiResponse, ApiErrorResponse } from '@/types/api'

/**
 * 统一响应处理拦截器
 */
export function handleResponse<T>(response: AxiosResponse): T {
  const data = response.data as ApiResponse<T>
  
  // 成功响应
  if (data.code === 'OK') {
    return data.data as T
  }
  
  // 错误响应
  const errorResponse = data as ApiErrorResponse
  throw new ApiError(
    errorResponse.error.message,
    errorResponse.code,
    errorResponse.error.details,
    response.status
  )
}

/**
 * 统一 API 错误类
 */
export class ApiError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: any,
    public status?: number
  ) {
    super(message)
    this.name = 'ApiError'
  }
  
  /**
   * 判断是否为特定错误码
   */
  is(code: string): boolean {
    return this.code === code
  }
  
  /**
   * 判断是否为认证错误
   */
  isAuthError(): boolean {
    return ['UNAUTHORIZED', 'TOKEN_EXPIRED', 'INVALID_TOKEN'].includes(this.code)
  }
  
  /**
   * 判断是否为权限错误
   */
  isPermissionError(): boolean {
    return ['FORBIDDEN', 'ACCESS_DENIED'].includes(this.code)
  }
  
  /**
   * 判断是否为资源不存在
   */
  isNotFoundError(): boolean {
    return this.code.endsWith('_NOT_FOUND') || this.code === 'NOT_FOUND'
  }
}
```

#### 3. 更新 axios 客户端

```typescript
// frontend/lib/api/client.ts（部分修改）

import { handleResponse, ApiError } from './interceptors/response'

// 响应拦截器：统一处理响应格式
apiClient.interceptors.response.use(
  (response) => {
    // 直接返回，在具体调用时处理
    return response
  },
  (error) => {
    // 网络错误或无响应
    if (!error.response) {
      throw new ApiError(
        error.message || '网络连接失败',
        'NETWORK_ERROR',
        null,
        0
      )
    }
    
    // 尝试解析后端错误响应
    const data = error.response.data
    if (data && data.code && data.error) {
      // 符合新格式的错误响应
      throw new ApiError(
        data.error.message,
        data.code,
        data.error.details,
        error.response.status
      )
    }
    
    // 兜底：旧格式或未知格式
    throw new ApiError(
      data?.message || error.message || '请求失败',
      'UNKNOWN_ERROR',
      data,
      error.response.status
    )
  }
)
```

#### 4. 更新 API 接口调用

**示例：projects.ts**

```typescript
// frontend/lib/api/endpoints/projects.ts

import { apiClient } from '../client'
import { handleResponse } from '../interceptors/response'
import type { Project } from '@/types'

export const projectsApi = {
  /**
   * 获取项目列表
   */
  list: async (): Promise<Project[]> => {
    const response = await apiClient.get('/user/projects')
    return handleResponse<Project[]>(response)
  },
  
  /**
   * 创建项目
   */
  create: async (input: CreateProjectInput): Promise<Project> => {
    const response = await apiClient.post('/user/projects', input)
    return handleResponse<Project>(response)
  },
  
  // ... 其他方法
}
```

**示例：带分页的接口**

```typescript
// frontend/lib/api/endpoints/tasks.ts

import { ApiPaginatedResponse } from '@/types/api'

export const tasksApi = {
  /**
   * 获取任务列表（带分页）
   */
  listPaginated: async (params: {
    project_id: string
    page?: number
    page_size?: number
  }): Promise<{ data: Task[], meta: ApiMeta }> => {
    const response = await apiClient.get<ApiPaginatedResponse<Task>>(
      '/user/tasks',
      { params }
    )
    
    const result = response.data
    if (result.code === 'OK') {
      return {
        data: result.data,
        meta: result.meta!
      }
    }
    
    // 错误由拦截器处理
    throw new Error('Unexpected response')
  },
}
```

#### 5. 错误处理最佳实践

```typescript
// 在 React 组件或 Hook 中

import { ApiError } from '@/lib/api/interceptors/response'

try {
  const project = await projectsApi.create(input)
  // 成功处理
} catch (error) {
  if (error instanceof ApiError) {
    // 统一错误处理
    if (error.isAuthError()) {
      // 认证错误 - 跳转登录
      router.push('/login')
    } else if (error.is('PROJECT_ALREADY_EXISTS')) {
      // 特定业务错误
      setError('项目已存在')
    } else if (error.isNotFoundError()) {
      // 资源不存在
      setError('资源不存在')
    } else {
      // 其他错误
      setError(error.message)
    }
    
    // 可以访问错误详情
    console.error('错误码:', error.code)
    console.error('错误详情:', error.details)
  } else {
    // 非 API 错误
    setError('未知错误')
  }
}
```

---

## 实施步骤

### Phase 1: 准备阶段（1-2小时）

1. ✅ 创建新的类型定义文件 `types/api.ts`
2. ✅ 创建响应拦截器 `lib/api/interceptors/response.ts`
3. ✅ 编写单元测试（可选）

### Phase 2: 后端协调（需要后端配合）

1. 🤝 与后端确认所有接口的错误码定义
2. 🤝 后端逐步迁移接口到新格式
3. 🤝 提供迁移文档和时间表

### Phase 3: 前端迁移（3-5小时）

**优先级排序：**

1. **高优先级** - 认证相关（影响所有用户）
   - `lib/api/endpoints/gateway.ts`
   - `lib/api/endpoints/auth.ts`

2. **中优先级** - 核心业务
   - `lib/api/endpoints/projects.ts`
   - `lib/api/endpoints/tasks.ts`

3. **低优先级** - 辅助功能
   - `lib/api/endpoints/invitations.ts`
   - `lib/api/endpoints/taskHistory.ts`

**迁移步骤：**

```bash
# 1. 更新类型定义
# 2. 更新 API 调用
# 3. 更新错误处理
# 4. 测试验证
# 5. 提交代码
```

### Phase 4: 兼容性处理（并行进行）

在 `apiClient` 响应拦截器中添加兼容逻辑：

```typescript
// 兼容旧格式
apiClient.interceptors.response.use(
  (response) => {
    const data = response.data
    
    // 新格式：{ code: "OK", data: ... }
    if (data && typeof data === 'object' && 'code' in data) {
      return response
    }
    
    // 旧格式兼容：{ success: boolean, data: ... }
    if (data && 'success' in data) {
      console.warn('⚠️ 旧格式响应，建议迁移:', response.config.url)
      
      // 转换为新格式
      if (data.success) {
        response.data = {
          code: 'OK',
          data: data.data || data
        }
      } else {
        response.data = {
          code: 'ERROR',
          error: {
            message: data.message || '请求失败',
            details: null
          }
        }
      }
    }
    
    return response
  },
  // ... 错误处理
)
```

### Phase 5: 测试验证（2-3小时）

1. 单元测试
2. 集成测试
3. E2E 测试
4. 手动回归测试

---

## 风险评估

### 🔴 高风险

1. **后端接口未完全迁移**
   - 风险：前端已迁移但后端还是旧格式
   - 缓解：添加兼容层，逐步迁移

2. **错误码不匹配**
   - 风险：前端和后端错误码定义不一致
   - 缓解：制定错误码文档，双方对齐

### 🟡 中风险

1. **类型定义变更**
   - 风险：现有代码出现类型错误
   - 缓解：使用 TypeScript 严格模式，编译时发现问题

2. **错误处理遗漏**
   - 风险：部分错误未正确处理
   - 缓解：统一使用 ApiError，统一错误边界

### 🟢 低风险

1. **性能影响**
   - 风险：额外的类型检查和转换
   - 缓解：影响可忽略（仅增加几毫秒）

---

## 总结

### 推荐方案

**方案 1（统一类型定义）** - 最优选择

- ✅ 类型安全
- ✅ 易于维护
- ✅ 错误处理统一
- ✅ 可逐步迁移
- ✅ 兼容性好

### 预估工作量

- **准备阶段**: 1-2小时
- **前端迁移**: 3-5小时
- **测试验证**: 2-3小时
- **总计**: 6-10小时

### 后续优化

1. 添加 API Mock 工具
2. 自动生成 API 客户端
3. 统一错误边界处理
4. 添加请求重试机制
5. 优化错误提示 UI

---

## 附录

### A. 完整类型定义示例

见 `frontend/types/api.ts`

### B. 迁移检查清单

- [ ] 类型定义已创建
- [ ] 响应拦截器已更新
- [ ] gateway.ts 已迁移
- [ ] auth.ts 已迁移
- [ ] projects.ts 已迁移
- [ ] tasks.ts 已迁移
- [ ] invitations.ts 已迁移
- [ ] taskHistory.ts 已迁移
- [ ] 错误处理已更新
- [ ] 单元测试已通过
- [ ] 集成测试已通过
- [ ] 文档已更新

### C. 常见问题

**Q: 后端还没迁移完，前端可以先迁移吗？**
A: 可以，通过兼容层处理旧格式响应。

**Q: 错误码太多怎么办？**
A: 先定义常用错误码，其他使用 string 类型兼容。

**Q: 如何处理多层嵌套的数据？**
A: 使用泛型，`ApiResponse<{ user: User, projects: Project[] }>`

**Q: 分页参数应该放哪里？**
A: 请求参数放 query params，响应数据放 meta 字段。

---

**文档版本**: v1.0  
**创建日期**: 2026-01-13  
**作者**: AI Assistant  
**审核状态**: 待审核

