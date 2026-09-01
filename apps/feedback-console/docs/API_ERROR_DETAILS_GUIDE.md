# API 错误响应 details 字段使用指南

## 📋 概述

错误响应中的 `details` 字段用于提供额外的错误上下文信息，帮助前端更好地处理和展示错误。

### 基本格式

```json
{
  "code": "ERROR_CODE",
  "error": {
    "message": "User friendly error message",
    "details": null | {...}
  }
}
```

**重要说明**：
- `details` 字段是**可选的**
- 通常情况下为 `null`
- 仅在需要补充特殊信息时才包含具体内容

---

## 🎯 使用场景

### 1. 验证错误（字段级错误）

当表单验证失败时，`details` 包含每个字段的具体错误信息。

#### 后端响应示例

```json
{
  "code": "VALIDATION_FAILED",
  "error": {
    "message": "表单验证失败",
    "details": {
      "fields": {
        "email": "邮箱格式不正确",
        "password": "密码至少需要8个字符",
        "phone": "手机号码必填"
      }
    }
  }
}
```

#### 前端处理示例

```typescript
import { ApiError } from '@/lib/api/interceptors/response'

try {
  await createUser(formData)
} catch (error) {
  if (error instanceof ApiError && error.is('VALIDATION_FAILED')) {
    // 获取字段级错误
    const fieldErrors = error.details?.fields || {}
    
    // 显示到对应的表单字段
    Object.keys(fieldErrors).forEach(field => {
      setFieldError(field, fieldErrors[field])
    })
  }
}
```

---

### 2. 业务规则冲突

当操作违反业务规则时，`details` 提供冲突的具体原因。

#### 示例：删除项目时存在未完成任务

```json
{
  "code": "OPERATION_FAILED",
  "error": {
    "message": "无法删除项目",
    "details": {
      "reason": "项目中还有未完成的任务",
      "task_count": 5,
      "pending_tasks": [
        {"id": 101, "title": "任务1"},
        {"id": 102, "title": "任务2"}
      ]
    }
  }
}
```

#### 前端处理示例

```typescript
try {
  await projectsApi.delete(projectId)
} catch (error) {
  if (error instanceof ApiError && error.code === 'OPERATION_FAILED') {
    const details = error.details
    
    if (details?.reason === '项目中还有未完成的任务') {
      const taskCount = details.task_count
      
      // 显示确认对话框
      const confirmed = await confirm(
        `此项目还有 ${taskCount} 个未完成的任务，确定要删除吗？`
      )
      
      if (confirmed) {
        // 强制删除
        await projectsApi.delete(projectId, { force: true })
      }
    }
  }
}
```

---

### 3. 权限不足详情

当用户权限不足时，`details` 说明需要的权限。

```json
{
  "code": "INSUFFICIENT_PERMISSION",
  "error": {
    "message": "权限不足",
    "details": {
      "required_role": "admin",
      "current_role": "member",
      "action": "delete_project"
    }
  }
}
```

#### 前端处理示例

```typescript
try {
  await projectsApi.deleteMember(projectId, userId)
} catch (error) {
  if (error instanceof ApiError && error.isPermissionError()) {
    const details = error.details
    
    if (details?.required_role) {
      toast.error(
        `此操作需要 ${details.required_role} 权限，您当前是 ${details.current_role}`
      )
    } else {
      toast.error(error.getUserMessage())
    }
  }
}
```

---

### 4. 资源冲突

当创建的资源已存在时，`details` 提供冲突资源的信息。

```json
{
  "code": "ALREADY_EXISTS",
  "error": {
    "message": "项目名称已存在",
    "details": {
      "field": "name",
      "value": "My Project",
      "existing_id": 123,
      "suggestion": "My Project (2)"
    }
  }
}
```

#### 前端处理示例

```typescript
try {
  await projectsApi.create({ name: projectName })
} catch (error) {
  if (error instanceof ApiError && error.is('ALREADY_EXISTS')) {
    const details = error.details
    
    if (details?.suggestion) {
      // 提示用户使用建议的名称
      const useSuggestion = await confirm(
        `项目名称"${details.value}"已存在，是否使用"${details.suggestion}"？`
      )
      
      if (useSuggestion) {
        await projectsApi.create({ name: details.suggestion })
      }
    }
  }
}
```

---

### 5. 速率限制

当请求被限流时，`details` 提供限制的具体信息。

```json
{
  "code": "RATE_LIMIT_EXCEEDED",
  "error": {
    "message": "请求过于频繁",
    "details": {
      "limit": 100,
      "remaining": 0,
      "reset_at": "2026-01-13T12:00:00Z",
      "retry_after": 60
    }
  }
}
```

#### 前端处理示例

```typescript
try {
  await sendVerificationCode(email)
} catch (error) {
  if (error instanceof ApiError && error.is('RATE_LIMIT_EXCEEDED')) {
    const details = error.details
    
    if (details?.retry_after) {
      toast.error(`请求过于频繁，请 ${details.retry_after} 秒后重试`)
      
      // 设置倒计时
      setCountdown(details.retry_after)
    }
  }
}
```

---

### 6. 批量操作结果

当批量操作部分成功时，`details` 包含详细结果。

```json
{
  "code": "PARTIAL_SUCCESS",
  "error": {
    "message": "部分任务删除失败",
    "details": {
      "total": 10,
      "success": 7,
      "failed": 3,
      "failures": [
        {
          "id": 101,
          "reason": "Task is locked"
        },
        {
          "id": 105,
          "reason": "Permission denied"
        },
        {
          "id": 108,
          "reason": "Task not found"
        }
      ]
    }
  }
}
```

#### 前端处理示例

```typescript
try {
  await tasksApi.bulkDelete(taskIds)
} catch (error) {
  if (error instanceof ApiError && error.code === 'PARTIAL_SUCCESS') {
    const details = error.details
    
    toast.warning(
      `已删除 ${details.success}/${details.total} 个任务，` +
      `${details.failed} 个失败`
    )
    
    // 显示失败详情
    if (details.failures) {
      showFailureDetails(details.failures)
    }
  }
}
```

---

## 📊 details 字段的常见结构

### 字段级验证错误

```typescript
interface ValidationDetails {
  fields: {
    [fieldName: string]: string  // 字段名 -> 错误消息
  }
}
```

### 业务规则冲突

```typescript
interface ConflictDetails {
  reason: string           // 冲突原因
  [key: string]: any       // 其他相关信息
}
```

### 权限详情

```typescript
interface PermissionDetails {
  required_role: string    // 需要的角色
  current_role: string     // 当前角色
  action: string          // 操作名称
}
```

### 速率限制

```typescript
interface RateLimitDetails {
  limit: number           // 限制次数
  remaining: number       // 剩余次数
  reset_at: string        // 重置时间（ISO 8601）
  retry_after: number     // 多少秒后重试
}
```

---

## 🛠️ 前端处理最佳实践

### 1. 类型安全的 details 访问

```typescript
interface ValidationErrorDetails {
  fields: Record<string, string>
}

function handleError(error: ApiError) {
  if (error.is('VALIDATION_FAILED')) {
    // 类型断言
    const details = error.details as ValidationErrorDetails | undefined
    
    if (details?.fields) {
      Object.entries(details.fields).forEach(([field, message]) => {
        setFieldError(field, message)
      })
    }
  }
}
```

### 2. 通用的 details 展示组件

```tsx
function ErrorDetailsDialog({ error }: { error: ApiError }) {
  if (!error.details) {
    return <p>{error.message}</p>
  }

  return (
    <div>
      <h3>{error.message}</h3>
      <details>
        <summary>详细信息</summary>
        <pre>{JSON.stringify(error.details, null, 2)}</pre>
      </details>
    </div>
  )
}
```

### 3. 日志记录

```typescript
function logError(error: ApiError) {
  console.error('API Error:', {
    code: error.code,
    message: error.message,
    details: error.details,
    timestamp: new Date().toISOString()
  })
  
  // 如果有 details，记录到错误追踪服务
  if (error.details) {
    errorTracker.captureException(error, {
      extra: {
        details: error.details
      }
    })
  }
}
```

---

## 📝 后端实现建议

### 何时使用 details

✅ **应该使用 details**：
- 验证错误（字段级错误）
- 业务规则冲突（需要详细说明）
- 权限不足（说明需要的权限）
- 速率限制（提供重试信息）
- 批量操作（提供详细结果）

❌ **不需要使用 details**：
- 简单的错误（message 已足够）
- 通用错误（如网络错误）
- 安全敏感信息（不应暴露给前端）

### 示例：后端返回验证错误

```go
// Go 后端示例
func validateUser(user User) error {
    fieldErrors := make(map[string]string)
    
    if !isValidEmail(user.Email) {
        fieldErrors["email"] = "邮箱格式不正确"
    }
    
    if len(user.Password) < 8 {
        fieldErrors["password"] = "密码至少需要8个字符"
    }
    
    if len(fieldErrors) > 0 {
        return &ApiError{
            Code: "VALIDATION_FAILED",
            Error: ErrorDetail{
                Message: "表单验证失败",
                Details: map[string]interface{}{
                    "fields": fieldErrors,
                },
            },
        }
    }
    
    return nil
}
```

---

## 🔍 调试技巧

### 1. 在开发环境显示完整 details

```typescript
if (process.env.NODE_ENV === 'development') {
  console.group('API Error Details')
  console.log('Code:', error.code)
  console.log('Message:', error.message)
  console.log('Details:', error.details)
  console.log('Full Error:', error.toJSON())
  console.groupEnd()
}
```

### 2. 使用 React DevTools

```typescript
// 在 useState 中存储错误详情
const [lastError, setLastError] = useState<ApiError | null>(null)

try {
  await someApiCall()
} catch (error) {
  if (error instanceof ApiError) {
    setLastError(error)  // 可在 React DevTools 中查看
  }
}
```

---

## 📚 总结

### details 字段的作用

1. **提供错误上下文** - 帮助理解错误原因
2. **字段级验证** - 精确定位验证失败的字段
3. **业务规则说明** - 解释为什么操作失败
4. **可操作信息** - 提供重试、建议等信息

### 使用原则

- ✅ 通常为 `null`，仅在需要时提供
- ✅ 包含对前端有用的信息
- ✅ 结构清晰，易于解析
- ❌ 不包含敏感信息
- ❌ 不包含纯调试信息（应该用日志）

### 前端处理原则

- ✅ 始终检查 `details` 是否存在
- ✅ 使用类型断言确保类型安全
- ✅ 提供友好的错误展示
- ✅ 记录到日志用于调试

---

**版本**: v1.0  
**创建日期**: 2026-01-13  
**相关文档**: 
- [API 响应格式统一重构方案](../API_RESPONSE_REFACTOR_PLAN.md)
- [API 响应处理快速上手](../API_RESPONSE_QUICK_START.md)

