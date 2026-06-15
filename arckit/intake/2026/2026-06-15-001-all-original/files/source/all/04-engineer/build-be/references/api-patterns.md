# API 设计模式

> RESTful API 的通用设计模式，按场景选择。

---

## 一、API 设计原则

### 1. 面向资源，非面向操作

```
✅ 面向资源
POST   /orders                  # 创建订单
PATCH  /orders/:id              # 更新订单
POST   /orders/:id/cancel       # 取消（无法用 PATCH 表达的复杂动作）

❌ 面向操作
POST   /createOrder
POST   /updateOrder
POST   /cancelOrder
```

### 2. 嵌套资源表达归属

```
✅ 清晰的归属关系
GET    /users/:id/orders        # 用户的订单
POST   /orders/:id/items        # 给订单添加商品
DELETE /orders/:id/items/:itemId # 删除订单中的商品

❌ 扁平化丢失归属
GET    /orders?userId=123
POST   /order-items?orderId=456
```

**嵌套深度限制：最多 2 层。** 超过 2 层说明资源应该独立。

### 3. 动作端点（Action Endpoint）

当操作无法用 CRUD 表达时：

```
POST /orders/:id/cancel     # 取消订单
POST /orders/:id/refund     # 退款
POST /payments/:id/confirm  # 确认支付
POST /users/:id/activate    # 激活用户
```

**命名规则：动词，不用名词变体。** `cancel` 不是 `cancellation`。

---

## 二、请求/响应模式

### 列表查询

```typescript
// 请求
GET /orders?page=1&pageSize=20&status=active&sortBy=createdAt&sortOrder=desc

// 响应
{
  "data": [
    { "id": "ord-1", "status": "active", "totalAmount": 99.9 }
  ],
  "pagination": {
    "page": 1,
    "pageSize": 20,
    "total": 156,
    "totalPages": 8
  }
}
```

### 筛选规则

| 筛选类型 | 格式 | 示例 |
|---------|------|------|
| 精确匹配 | `field=value` | `status=active` |
| 多值匹配 | `field=v1,v2` | `status=active,pending` |
| 范围查询 | `field_min=x&field_max=y` | `amount_min=10&amount_max=100` |
| 日期范围 | `createdFrom=2026-01-01&createdTo=2026-06-30` | — |
| 模糊搜索 | `q=keyword` | `q=iPhone` |
| 排序 | `sortBy=field&sortOrder=asc\|desc` | `sortBy=createdAt&sortOrder=desc` |

### 创建请求

```typescript
// 请求
POST /orders
{
  "items": [
    { "productId": "p-1", "quantity": 2 },
    { "productId": "p-2", "quantity": 1 }
  ],
  "shippingAddress": {
    "street": "中关村大街1号",
    "city": "北京",
    "zipCode": "100080"
  },
  "note": "请尽快发货"
}

// 响应 201
{
  "data": {
    "id": "ord-123",
    "status": "PENDING",
    "items": [...],
    "totalAmount": { "amount": 299.9, "currency": "CNY" },
    "createdAt": "2026-06-12T10:30:00Z"
  }
}
```

### 批量操作

```typescript
// 批量删除
DELETE /orders/batch
{ "ids": ["ord-1", "ord-2", "ord-3"] }

// 响应
{
  "data": {
    "succeeded": ["ord-1", "ord-3"],
    "failed": [
      { "id": "ord-2", "reason": "ORDER_ALREADY_SHIPPED" }
    ]
  }
}
```

---

## 三、错误响应模式

### 错误响应结构

```json
{
  "error": {
    "code": "INSUFFICIENT_STOCK",
    "message": "商品库存不足",
    "details": {
      "productId": "p-1",
      "requested": 10,
      "available": 3
    },
    "traceId": "trace-abc-123"
  }
}
```

### 错误码设计

**格式：`SCREAMING_SNAKE_CASE`，业务语义而非 HTTP 语义。**

| HTTP 状态码 | 错误码 | 含义 |
|------------|--------|------|
| 400 | `INVALID_INPUT` | 请求参数格式错误 |
| 400 | `VALIDATION_FAILED` | 业务规则校验失败 |
| 401 | `TOKEN_EXPIRED` | Token 已过期 |
| 401 | `TOKEN_INVALID` | Token 无效 |
| 403 | `PERMISSION_DENIED` | 权限不足 |
| 404 | `ORDER_NOT_FOUND` | 订单不存在 |
| 404 | `PRODUCT_NOT_FOUND` | 商品不存在 |
| 409 | `ORDER_ALREADY_CANCELLED` | 订单已取消 |
| 409 | `CONCURRENT_MODIFICATION` | 并发修改冲突 |
| 422 | `INSUFFICIENT_STOCK` | 库存不足 |
| 422 | `ORDER_CANNOT_CANCEL` | 订单状态不允许取消 |
| 429 | `RATE_LIMIT_EXCEEDED` | 请求频率超限 |

**原则：错误码是给开发者看的，message 是给用户看的。**

---

## 四、版本策略

### URL 版本（推荐）

```
/api/v1/orders
/api/v2/orders
```

**适用场景：** 大部分 API，简单直观。

### Header 版本

```
GET /api/orders
Accept: application/vnd.company.v2+json
```

**适用场景：** API 网关统一路由，URL 保持干净。

### 版本兼容规则

| 变更类型 | 版本升级 | 兼容性 |
|---------|---------|--------|
| 新增字段 | 不升级 | 向后兼容（客户端忽略未知字段） |
| 删除字段 | 升 MAJOR | 破坏性（客户端可能依赖该字段） |
| 修改字段类型 | 升 MAJOR | 破坏性 |
| 新增端点 | 不升级 | 向后兼容 |
| 删除端点 | 升 MAJOR | 破坏性 |
| 修改错误码 | 升 MINOR | 可能破坏错误处理逻辑 |

---

## 五、认证与授权模式

### JWT 认证流程

```
1. 客户端 POST /auth/login { username, password }
2. 服务端验证，返回 { accessToken, refreshToken }
3. 客户端存储 accessToken（内存） + refreshToken（httpOnly cookie）
4. 每次请求 Authorization: Bearer <accessToken>
5. accessToken 过期 → POST /auth/refresh { refreshToken } → 新的 accessToken
6. refreshToken 过期 → 重新登录
```

### RBAC 权限模型

```typescript
// 角色-权限映射
const ROLES = {
  admin: ['order:read', 'order:write', 'order:delete', 'user:read', 'user:write'],
  manager: ['order:read', 'order:write', 'user:read'],
  viewer: ['order:read'],
};

// 中间件检查
function requirePermission(permission: string) {
  return (req, res, next) => {
    const userPermissions = ROLES[req.user.role] ?? [];
    if (!userPermissions.includes(permission)) {
      throw new ForbiddenError(`缺少权限: ${permission}`);
    }
    next();
  };
}
```

---

## 六、分页模式

### Offset 分页（默认）

```
GET /orders?page=1&pageSize=20

优点：可跳转到任意页
缺点：大数据量时性能差（OFFSET 100000 扫描 100000 行）
适用：管理后台、数据量 < 10万
```

### Cursor 分页（大数据量）

```
GET /orders?cursor=ord-123&limit=20

响应：
{
  "data": [...],
  "pagination": {
    "nextCursor": "ord-143",
    "hasMore": true
  }
}

优点：大数据量时性能稳定
缺点：不可跳转到任意页
适用：信息流、日志查询、数据量 > 10万
```

### 搜索分页

```
# Elasticsearch 风格
GET /orders/search?q=iPhone&from=0&size=20

响应包含 search_after 用于深度分页：
{
  "data": [...],
  "pagination": {
    "total": 1560,
    "searchAfter": ["2026-06-12T10:30:00Z", "ord-143"]
  }
}
```

---

## 七、幂等性设计

### 幂等键（Idempotency Key）

```typescript
// 客户端在请求头中携带幂等键
POST /orders
Idempotency-Key: client-uuid-12345
{ "items": [...] }

// 服务端：
// 1. 检查幂等键是否已处理
// 2. 已处理 → 直接返回之前的结果
// 3. 未处理 → 正常处理，存储 { key → result }
```

**必须使用幂等键的场景：**

| 场景 | 原因 |
|------|------|
| 支付 | 网络超时重试可能导致重复扣款 |
| 创建订单 | 用户连续点击可能导致重复下单 |
| 转账 | 金额操作必须精确一次 |

### 天然幂等的操作

| 方法 | 幂等？ | 原因 |
|------|--------|------|
| GET | ✅ | 只读 |
| PUT | ✅ | 全量替换，多次结果相同 |
| DELETE | ✅ | 删除不存在资源返回 404，非错误 |
| POST | ❌ | 每次创建新资源 |
| PATCH | 看实现 | 增量更新可能不幂等 |

---

## 八、速率限制

### 限流策略

| 层级 | 限制 | 实现 |
|------|------|------|
| 全局 | 1000 req/min per IP | 网关/CDN |
| 用户级 | 100 req/min per user | API 网关 |
| 接口级 | 10 req/min for /auth/login | 应用层 |
| 写操作 | 30 req/min per user | 应用层 |

### 限流响应

```json
HTTP/1.1 429 Too Many Requests
Retry-After: 60
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 0
X-RateLimit-Reset: 1718170800

{
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "请求频率超限，请 60 秒后重试",
    "retryAfter": 60
  }
}
```
