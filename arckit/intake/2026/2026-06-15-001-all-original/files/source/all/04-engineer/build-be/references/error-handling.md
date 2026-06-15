# 后端错误处理最佳实践

> 错误是业务语义的一部分，不是异常的附属品。

---

## 一、错误分类

### 按来源分

| 类型 | 来源 | 示例 | HTTP 状态码 |
|------|------|------|------------|
| 输入错误 | 客户端 | 参数缺失、格式错误 | 400 |
| 业务错误 | 业务规则 | 库存不足、订单已取消 | 422 |
| 认证错误 | 身份验证 | Token 过期、签名错误 | 401 |
| 授权错误 | 权限控制 | 角色无权限 | 403 |
| 冲突错误 | 并发/唯一约束 | 重复创建、乐观锁冲突 | 409 |
| 资源错误 | 数据不存在 | 订单不存在 | 404 |
| 系统错误 | 基础设施 | 数据库连接失败、网络超时 | 500 |
| 外部错误 | 第三方服务 | 支付网关超时 | 502/504 |

### 按可恢复性分

| 类型 | 可恢复？ | 处理方式 |
|------|---------|---------|
| 输入错误 | ✅ 客户端修正后重试 | 返回具体错误字段 |
| 业务错误 | ✅ 业务条件变化后重试 | 返回业务错误码 |
| 系统错误 | ❌ 需要运维介入 | 记录日志 + 告警 |
| 外部错误 | ⚠️ 可能自动恢复 | 重试 + 降级 + 熔断 |

---

## 二、错误处理分层

### Layer 1: 领域层（DomainError）

领域层定义精确的业务错误，不依赖任何框架：

```typescript
// TypeScript
class DomainError extends Error {
  constructor(
    public readonly code: string,     // 业务错误码
    message: string,                   // 人类可读描述
    public readonly httpStatus: number, // HTTP 映射
    public readonly details?: Record<string, string>,
  ) {
    super(message);
    this.name = 'DomainError';
  }
}

// Python
class DomainError(Exception):
    def __init__(self, code: str, message: str, http_status: int, details: dict | None = None):
        super().__init__(message)
        self.code = code
        self.message = message
        self.http_status = http_status
        self.details = details or {}
```

### Layer 2: 应用层（包装上下文）

应用层捕获领域错误，添加业务上下文：

```typescript
class OrderService {
  async createOrder(command: CreateOrderCommand): Promise<Order> {
    try {
      const product = await this.productRepo.findById(command.productId);
      if (!product) throw DomainError.notFound('商品', command.productId);
      // ...
    } catch (error) {
      if (error instanceof DomainError) throw error;
      // 包装未知错误
      throw new DomainError('ORDER_CREATION_FAILED', '创建订单失败', 500);
    }
  }
}
```

### Layer 3: 接口层（HTTP 映射）

接口层统一将 DomainError 映射为 HTTP 响应，绝不泄露内部信息：

```typescript
function errorHandler(error: Error, req: Request, reply: Reply) {
  if (error instanceof DomainError) {
    // 业务错误：完整返回
    reply.status(error.httpStatus).json({
      error: {
        code: error.code,
        message: error.message,
        details: error.details,
        traceId: req.id,
      },
    });
    return;
  }

  // 系统错误：不泄露内部信息
  logger.error('unexpected_error', {
    error: error.message,
    stack: error.stack,
    traceId: req.id,
  });

  reply.status(500).json({
    error: {
      code: 'INTERNAL_ERROR',
      message: '服务内部错误，请稍后重试',
      traceId: req.id,
    },
  });
}
```

---

## 三、校验错误模式

### 字段级校验

```typescript
// 请求体校验结果
interface ValidationError {
  code: 'VALIDATION_FAILED';
  message: '请求参数校验失败';
  details: Record<string, string>;  // 字段名 → 错误描述
}

// 示例响应
{
  "error": {
    "code": "VALIDATION_FAILED",
    "message": "请求参数校验失败",
    "details": {
      "email": "邮箱格式不正确",
      "quantity": "数量必须大于0",
      "shippingAddress.zipCode": "邮编格式不正确"
    },
    "traceId": "trace-abc-123"
  }
}
```

### 校验库选择

| 语言 | 校验库 | 原因 |
|------|--------|------|
| TypeScript | Zod | 类型推导 + 运行时校验 + 错误信息 |
| Python | Pydantic | FastAPI 内置 + 类型推导 |
| Go | go-playground/validator | struct tag 声明式校验 |
| Java | Hibernate Validator | JSR-380 标准实现 |

### Zod 校验模板

```typescript
import { z } from 'zod';

const CreateOrderSchema = z.object({
  items: z.array(z.object({
    productId: z.string().min(1, '商品ID不能为空'),
    quantity: z.number().int().positive('数量必须大于0'),
  })).min(1, '订单不能为空'),
  shippingAddress: z.object({
    street: z.string().min(1, '街道不能为空'),
    city: z.string().min(1, '城市不能为空'),
    zipCode: z.string().regex(/^\d{6}$/, '邮编格式不正确'),
  }),
  note: z.string().max(500, '备注不能超过500字').optional(),
});

// 校验 + 错误映射
function validate<T>(schema: z.ZodSchema<T>, data: unknown): T {
  const result = schema.safeParse(data);
  if (!result.success) {
    const details: Record<string, string> = {};
    for (const issue of result.error.issues) {
      const path = issue.path.join('.');
      details[path] = issue.message;
    }
    throw new DomainError('VALIDATION_FAILED', '请求参数校验失败', 400, details);
  }
  return result.data;
}
```

---

## 四、重试与降级

### 重试策略

| 错误类型 | 重试？ | 策略 |
|---------|--------|------|
| 4xx 错误 | ❌ | 客户端错误，重试无意义 |
| 429 限流 | ✅ | 按 Retry-After 等待后重试 |
| 5xx 错误 | ✅ | 指数退避，最多 3 次 |
| 网络超时 | ✅ | 指数退避，最多 3 次 |
| 幂等操作 | ✅ | 可以安全重试 |
| 非幂等操作 | ⚠️ | 需要幂等键才能重试 |

### 退避算法

```typescript
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000,
): Promise<T> {
  let lastError: Error;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;

      // 不重试 4xx 错误
      if (error instanceof DomainError && error.httpStatus >= 400 && error.httpStatus < 500) {
        throw error;
      }

      if (attempt === maxRetries) break;

      // 指数退避 + 随机抖动
      const delay = baseDelay * Math.pow(2, attempt) + Math.random() * 1000;
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError!;
}
```

### 熔断器

```typescript
// 简化版熔断器
class CircuitBreaker {
  private failures = 0;
  private lastFailureTime = 0;
  private state: 'closed' | 'open' | 'half-open' = 'closed';

  constructor(
    private readonly threshold: number = 5,    // 失败次数阈值
    private readonly resetTimeout: number = 30000,  // 熔断恢复时间(ms)
  ) {}

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === 'open') {
      if (Date.now() - this.lastFailureTime > this.resetTimeout) {
        this.state = 'half-open';  // 尝试恢复
      } else {
        throw new DomainError('SERVICE_UNAVAILABLE', '服务暂时不可用', 503);
      }
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private onSuccess() {
    this.failures = 0;
    this.state = 'closed';
  }

  private onFailure() {
    this.failures++;
    this.lastFailureTime = Date.now();
    if (this.failures >= this.threshold) {
      this.state = 'open';
    }
  }
}
```

---

## 五、日志规范

### 错误日志必填字段

```typescript
logger.error('order_creation_failed', {
  error: {
    code: error.code,
    message: error.message,
    stack: error.stack,
  },
  context: {
    userId: req.user?.userId,
    orderId: command.orderId,
    traceId: req.id,
  },
  durationMs: Date.now() - req.startTime,
});
```

### 日志分级

| 级别 | 用途 | 示例 |
|------|------|------|
| error | 需要人工介入 | 数据库连接失败、未捕获异常 |
| warn | 可能的问题 | 请求耗时 > 5s、重试 3 次成功 |
| info | 业务事件 | 订单创建、用户注册 |
| debug | 调试信息 | 请求参数、SQL 语句（仅开发环境） |

### 敏感信息脱敏

```typescript
// ✅ 脱敏
logger.info('user_login', {
  userId: user.id,
  email: maskEmail(user.email),  // z***@example.com
  ip: req.ip,
});

// ❌ 明文
logger.info('user_login', {
  userId: user.id,
  email: user.email,      // 泄露邮箱
  password: req.body.password,  // 绝对禁止
  token: req.headers.authorization,  // 绝对禁止
});
```
