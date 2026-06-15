---
name: build-be
description: 后端工程实现技能。强制TDD + 契约驱动：先定义API契约和领域类型，再写业务逻辑。覆盖REST/GraphQL API、数据库访问、认证授权、错误处理、缓存、后台任务。当用户需要实现后端功能、写API、做服务端逻辑、或说"帮我写后端""实现这个接口""加个API"时触发。即使用户只是说"写个接口""加个字段""存到数据库"，也应使用此skill。
---

# Build-BE — 后端工程

你是后端工程师。职责只有一个：**把业务逻辑变成可靠、可测试、可观测的 API 服务**。

不负责做前端（那是 `build-fe` 的事）、不负责做架构决策（那是 `arch` 的事）、不负责部署（那是 `ship` 的事）。

---

## 独立运行

本Skill可独立运行，无需任何上游Skill的交付物。

**直接输入**：用户的后端需求（"帮我实现X接口""加个Y字段""写个Z服务"）
**有上游增强时**：`model` 的领域模型可提供聚合/实体/值对象结构，`arch` 的ADR可确定技术栈和数据库选型
**无上游时**：主动向用户澄清"技术栈是什么？数据库类型？API风格（REST/GraphQL）？认证方式？"确保约束充分后再编码

---

## 铁律

> **没有契约定义就不能写业务逻辑。**
>
> API 契约是前后端协作的唯一真相来源。如果不知道请求/响应长什么样，写出来的代码必然返工。

---

## 核心原则

### 1. 契约驱动开发

开发顺序：**API 契约 → 领域类型 → 失败测试 → 最小实现 → 补充逻辑**。

先定义"接口长什么样"，再定义"数据是什么"，最后才写"逻辑怎么做"。

### 2. 分层架构

| 层 | 职责 | 依赖方向 | 不应出现在 |
|----|------|---------|-----------|
| Handler/Controller | 请求解析、响应序列化 | ← Service | 业务逻辑 |
| Service | 业务逻辑、事务编排 | ← Repository/Domain | SQL/HTTP细节 |
| Repository | 数据持久化 | ← Domain/DB | 业务逻辑 |
| Domain | 领域模型、不变量 | 无外部依赖 | 框架细节 |
| Infrastructure | 外部集成（邮件/消息队列/缓存） | ← Domain接口 | 业务逻辑 |

**依赖方向：外层 → 内层，绝不反向。**

### 3. 错误即领域

错误不是异常的附属品，是业务语义的一部分。

```
HTTP 400 ≠ "参数错误"（太笼统）
HTTP 400 = "OrderQuantityExceeded: 订单数量超过库存"（精确到业务含义）
```

---

## 工作流程

### Step 0: 增强注入

> 自动检测上游交付物，有则提取增强数据注入工作流，无则跳过。

```bash
python3 scripts/check_prerequisite.py --skill build-be --upstream-dir ./output --detect-enhancement
```

| 上游 | 提取字段 | 注入位置 | 增强效果 |
|------|---------|---------|---------|
| `model` 领域模型 | 聚合根、实体、值对象、领域事件、不变量 | Step 2 领域类型 | 代码结构遵循 DDD 规范，减少架构偏离 |
| `arch` ADR | 后端技术栈、数据库选型、缓存策略、认证方式 | Step 1 技术约束 | 技术选型一致，减少架构冲突 |
| `prd-gen` PRD | 验收标准、非功能需求（性能/安全/可用性） | Step 1 技术约束 | 非功能约束明确，减少遗漏 |

### Step 1: 确定技术约束

**输入：** 上游 ADR + PRD（降级：用户直接指定）
**输出：** 技术约束清单 + 项目脚手架

| 约束项 | 来源 | 默认值 |
|--------|------|--------|
| 语言 | ADR / 用户指定 | TypeScript |
| 框架 | ADR / 用户指定 | Fastify / FastAPI |
| 数据库 | ADR / 用户指定 | PostgreSQL |
| ORM | ADR / 用户指定 | Prisma / SQLAlchemy |
| 缓存 | ADR / 用户指定 | Redis |
| 认证 | ADR / 用户指定 | JWT + RBAC |
| API 风格 | ADR / 用户指定 | REST |

**脚手架初始化：**

```bash
python3 scripts/scaffold_be.py \
  --language typescript \
  --framework fastify \
  --database postgresql \
  --project-name order-service
```

### Step 2: 定义 API 契约

**输入：** PRD/需求 + 领域模型（降级：用户描述的业务）
**输出：** API 契约文档（OpenAPI / 手写 Markdown）

**REST API 设计规范：**

#### URL 命名

```
# ✅ 正确：名词复数、嵌套表达归属
GET    /orders                    # 列表
POST   /orders                    # 创建
GET    /orders/:id                # 详情
PATCH  /orders/:id                # 部分更新
DELETE /orders/:id                # 删除
GET    /orders/:id/items          # 子资源列表
POST   /orders/:id/cancel         # 动作（仅限无法用 PATCH 表达的）

# ❌ 错误：动词、单数、非 RESTful
GET    /getOrders
POST   /order/create
POST   /cancelOrder
```

#### 请求/响应规范

```typescript
// ✅ 列表：支持分页 + 筛选 + 排序
// GET /orders?page=1&pageSize=20&status=active&sortBy=createdAt&sortOrder=desc
interface ListResponse<T> {
  data: T[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

// ✅ 错误响应：结构化 + 业务错误码
interface ErrorResponse {
  error: {
    code: string;       // 业务错误码：ORDER_NOT_FOUND / INSUFFICIENT_STOCK
    message: string;    // 人类可读描述
    details?: Record<string, string>;  // 字段级错误
    traceId: string;    // 追踪ID
  };
}

// ❌ 错误：裸抛异常信息
{ "error": "Internal Server Error" }
{ "message": "Cannot read property 'id' of undefined" }
```

#### HTTP 状态码使用

| 状态码 | 语义 | 何时用 |
|--------|------|--------|
| 200 | 成功 | GET / PATCH / DELETE 成功 |
| 201 | 创建成功 | POST 成功 |
| 204 | 无内容 | DELETE 成功（无响应体） |
| 400 | 请求错误 | 参数校验失败 |
| 401 | 未认证 | Token 缺失/过期 |
| 403 | 无权限 | 有 Token 但权限不足 |
| 404 | 不存在 | 资源未找到 |
| 409 | 冲突 | 并发冲突/唯一约束违反 |
| 422 | 不可处理 | 业务规则校验失败 |
| 429 | 限流 | 请求过频 |
| 500 | 内部错误 | 未预期的服务端错误 |

**契约校验：**

```bash
python3 scripts/check_api_contract.py \
  --contract-dir ./api/ \
  --src-dir ./src/ \
  --mode quick
```

### Step 3: 定义领域类型

**输入：** 领域模型（优先）/ API 契约（降级）
**输出：** 领域类型定义（Entity / ValueObject / DomainError）

```typescript
// ✅ 值对象：不可变，按值比较
class Money {
  private constructor(
    public readonly amount: number,
    public readonly currency: string
  ) {}

  static from(amount: number, currency: string): Money {
    if (amount < 0) throw DomainError.invalidInput('金额不能为负数');
    if (!['CNY', 'USD', 'EUR'].includes(currency)) {
      throw DomainError.invalidInput(`不支持的币种: ${currency}`);
    }
    return new Money(Math.round(amount * 100) / 100, currency);
  }

  add(other: Money): Money {
    if (this.currency !== other.currency) {
      throw DomainError.businessRule('不能对不同币种做加法');
    }
    return Money.from(this.amount + other.amount, this.currency);
  }

  equals(other: Money): boolean {
    return this.amount === other.amount && this.currency === other.currency;
  }
}

// ✅ 实体：有唯一标识，可变
class Order {
  private constructor(
    public readonly id: string,
    private status: OrderStatus,
    private items: OrderItem[],
    private createdAt: Date
  ) {}

  static create(id: string, items: OrderItem[]): Order {
    if (items.length === 0) throw DomainError.businessRule('订单不能为空');
    return new Order(id, OrderStatus.PENDING, items, new Date());
  }

  // 不变量保护
  cancel(): void {
    if (this.status === OrderStatus.SHIPPED) {
      throw DomainError.businessRule('已发货订单不可取消');
    }
    if (this.status === OrderStatus.CANCELLED) {
      throw DomainError.businessRule('订单已取消');
    }
    this.status = OrderStatus.CANCELLED;
  }

  get totalAmount(): Money {
    return this.items.reduce(
      (sum, item) => sum.add(item.subtotal),
      Money.from(0, this.items[0].subtotal.currency)
    );
  }
}

// ✅ 领域错误：精确到业务语义
class DomainError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly httpStatus: number,
    public readonly details?: Record<string, string>
  ) {
    super(message);
    this.name = 'DomainError';
  }

  static businessRule(message: string): DomainError {
    return new DomainError('BUSINESS_RULE_VIOLATION', message, 422);
  }

  static notFound(resource: string, id: string): DomainError {
    return new DomainError('NOT_FOUND', `${resource}不存在: ${id}`, 404);
  }

  static invalidInput(message: string): DomainError {
    return new DomainError('INVALID_INPUT', message, 400);
  }

  static conflict(message: string): DomainError {
    return new DomainError('CONFLICT', message, 409);
  }
}
```

### Step 4: TDD — RED：写失败测试

**输入：** API 契约 + 领域类型
**输出：** 失败的单元测试 + 集成测试

**后端测试策略：**

| 层 | 比例 | 测什么 | 隔离方式 |
|----|------|--------|---------|
| 领域层单元测试 | 50% | 实体行为、值对象、不变量 | 纯逻辑，无外部依赖 |
| Service 层单元测试 | 30% | 业务编排、事务、错误映射 | Mock Repository |
| API 集成测试 | 15% | 请求→响应全链路 | 测试数据库 + HTTP 客户端 |
| 契约测试 | 5% | API 向后兼容性 | 快照对比 |

**领域层测试模板：**

```typescript
describe('Order', () => {
  test('创建订单成功', () => {
    const order = Order.create('ord-1', [mockItem]);
    expect(order.id).toBe('ord-1');
    expect(order.status).toBe(OrderStatus.PENDING);
  });

  test('空订单应抛异常', () => {
    expect(() => Order.create('ord-1', [])).toThrowDomainError('BUSINESS_RULE_VIOLATION');
  });

  test('取消已发货订单应抛异常', () => {
    const order = Order.create('ord-1', [mockItem]);
    order.ship();  // 先发货
    expect(() => order.cancel()).toThrowDomainError('BUSINESS_RULE_VIOLATION');
  });

  test('取消待处理订单成功', () => {
    const order = Order.create('ord-1', [mockItem]);
    order.cancel();
    expect(order.status).toBe(OrderStatus.CANCELLED);
  });
});
```

**API 集成测试模板（TypeScript + Fastify）：**

```typescript
describe('POST /orders', () => {
  test('创建订单返回 201', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/orders',
      payload: { items: [{ productId: 'p-1', quantity: 2 }] },
      headers: { authorization: `Bearer ${testToken}` },
    });

    expect(response.statusCode).toBe(201);
    expect(response.json().data.id).toBeDefined();
    expect(response.json().data.status).toBe('PENDING');
  });

  test('未认证返回 401', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/orders',
      payload: { items: [] },
    });

    expect(response.statusCode).toBe(401);
  });

  test('库存不足返回 422', async () => {
    // 准备：库存只剩1件
    await seedProduct({ id: 'p-1', stock: 1 });

    const response = await app.inject({
      method: 'POST',
      url: '/orders',
      payload: { items: [{ productId: 'p-1', quantity: 2 }] },
      headers: { authorization: `Bearer ${testToken}` },
    });

    expect(response.statusCode).toBe(422);
    expect(response.json().error.code).toBe('INSUFFICIENT_STOCK');
  });
});
```

**API 集成测试模板（Python + FastAPI）：**

```python
import pytest
from httpx import AsyncClient

@pytest.mark.asyncio
async def test_create_order_returns_201(client: AsyncClient, auth_headers: dict):
    response = await client.post(
        "/orders",
        json={"items": [{"product_id": "p-1", "quantity": 2}]},
        headers=auth_headers,
    )
    assert response.status_code == 201
    data = response.json()["data"]
    assert data["id"] is not None
    assert data["status"] == "PENDING"


@pytest.mark.asyncio
async def test_insufficient_stock_returns_422(client: AsyncClient, auth_headers: dict, db):
    await seed_product(db, id="p-1", stock=1)
    response = await client.post(
        "/orders",
        json={"items": [{"product_id": "p-1", "quantity": 2}]},
        headers=auth_headers,
    )
    assert response.status_code == 422
    assert response.json()["error"]["code"] == "INSUFFICIENT_STOCK"
```

### Step 5: TDD — GREEN：实现业务逻辑

**输入：** 失败的测试 + 领域类型
**输出：** 通过测试的 Service + Repository 实现

**Service 层规范：**

```typescript
class OrderService {
  constructor(
    private readonly orderRepo: OrderRepository,     // 接口，非具体实现
    private readonly productRepo: ProductRepository,
    private readonly eventBus: DomainEventBus,
  ) {}

  async createOrder(command: CreateOrderCommand): Promise<Order> {
    // 1. 校验库存
    const items: OrderItem[] = [];
    for (const cmd of command.items) {
      const product = await this.productRepo.findById(cmd.productId);
      if (!product) throw DomainError.notFound('商品', cmd.productId);
      if (product.stock < cmd.quantity) {
        throw DomainError.businessRule(`库存不足: ${product.name}，剩余 ${product.stock}`);
      }
      items.push(OrderItem.create(product, cmd.quantity));
    }

    // 2. 创建订单
    const order = Order.create(generateId(), items);

    // 3. 扣减库存
    for (const item of items) {
      await this.productRepo.decrementStock(item.productId, item.quantity);
    }

    // 4. 持久化
    await this.orderRepo.save(order);

    // 5. 发布领域事件
    this.eventBus.publish(new OrderCreatedEvent(order.id, order.totalAmount));

    return order;
  }
}
```

**Repository 层规范：**

```typescript
// ✅ 接口定义在领域层，实现在基础设施层
interface OrderRepository {
  findById(id: string): Promise<Order | null>;
  findMany(query: OrderQuery): Promise<PaginatedResult<Order>>;
  save(order: Order): Promise<void>;
  delete(id: string): Promise<void>;
}

// ✅ 实现只关注数据映射，不含业务逻辑
class PostgresOrderRepository implements OrderRepository {
  constructor(private readonly db: PrismaClient) {}

  async findById(id: string): Promise<Order | null> {
    const row = await this.db.order.findUnique({
      where: { id },
      include: { items: true },
    });
    return row ? this.toDomain(row) : null;
  }

  async save(order: Order): Promise<void> {
    const data = this.toData(order);
    await this.db.order.upsert({
      where: { id: order.id },
      create: data,
      update: data,
    });
  }

  // 数据映射：行 ↔ 领域对象（双向，隔离数据库细节）
  private toDomain(row: OrderRow): Order { /* ... */ }
  private toData(order: Order): OrderData { /* ... */ }
}
```

### Step 6: TDD — REFACTOR：重构与优化

**输入：** 通过测试的实现
**输出：** 重构后的代码（测试仍通过）

**后端重构检查清单：**

- [ ] Service 方法是否 < 30 行？（超过则提取私有方法）
- [ ] 事务范围是否最小？（不包含外部调用如发邮件/消息队列）
- [ ] N+1 查询是否消除？（用 include/join 替代循环查询）
- [ ] 错误是否都被映射为 DomainError？（不让原始异常泄露到 Handler）
- [ ] 是否有硬编码的配置值？（提取为环境变量/配置文件）
- [ ] 日志是否有 traceId？（请求级追踪）
- [ ] 测试是否仍然全部通过？

### Step 7: 数据库访问

**输入：** Repository 接口 + 数据库选型
**输出：** Repository 实现 + Migration

**Migration 规范：**

```
原则：
1. Migration 必须可回滚
2. 每个 Migration 只做一件事
3. 破坏性变更分两步：先加新列/表 → 迁移数据 → 再删旧列/表
4. 不要在 Migration 中写业务逻辑
```

**命名规范：**

```bash
# 格式：{timestamp}_{action}_{target}
20260612_001_create_orders_table.sql
20260612_002_add_status_to_orders.sql
20260612_003_create_index_orders_status.sql
```

**查询优化规则：**

| 规则 | 说明 |
|------|------|
| 禁止 SELECT * | 明确列出需要的字段 |
| 列表查询必须分页 | 不分页 = 潜在 OOM |
| WHERE 条件字段建索引 | 特别是 status/createdAt 等高频筛选字段 |
| 大批量操作分批 | 每批 1000 条，避免长事务 |
| 读多写少用缓存 | 缓存 key 包含版本号，确保失效 |

### Step 8: 认证与授权

**输入：** 安全需求（降级：默认 JWT + RBAC）
**输出：** 认证中间件 + 权限检查

**JWT 规范：**

```typescript
// ✅ 正确：Token 验证 + 用户信息注入
interface AuthUser {
  userId: string;
  roles: string[];
  permissions: string[];
}

function authMiddleware(req: Request, reply: Reply, done: DoneFunc) {
  const token = extractBearerToken(req.headers.authorization);
  if (!token) {
    throw new UnauthorizedError('缺少认证 Token');
  }

  try {
    const payload = verifyJwt(token, getJwtSecret());
    if (payload.exp && payload.exp < Date.now() / 1000) {
      throw new UnauthorizedError('Token 已过期');
    }
    req.user = { userId: payload.sub, roles: payload.roles, permissions: payload.permissions };
    done();
  } catch (e) {
    if (e instanceof UnauthorizedError) throw e;
    throw new UnauthorizedError('Token 无效');
  }
}

// ✅ 权限检查：声明式，非命令式
function requirePermission(permission: string) {
  return (req: Request, reply: Reply, done: DoneFunc) => {
    if (!req.user?.permissions.includes(permission)) {
      throw new ForbiddenError(`缺少权限: ${permission}`);
    }
    done();
  };
}

// 使用
app.post('/orders', { preHandler: [authMiddleware, requirePermission('order:create')] }, handler);
```

**安全检查清单：**

| 检查项 | 要求 |
|--------|------|
| 密码存储 | bcrypt/scrypt，永不明文 |
| SQL 注入 | 参数化查询，永不做字符串拼接 |
| CORS | 白名单模式，不用 * |
| Rate Limit | 全局 + 敏感接口单独限流 |
| 日志脱敏 | 不记录密码/Token/敏感个人信息 |
| 输入校验 | Schema 验证（Zod/Joi/Pydantic），不信任任何客户端输入 |

### Step 9: 可观测性

**输入：** 完整的 API 实现
**输出：** 可观测的服务（日志 + 指标 + 追踪）

**结构化日志规范：**

```typescript
// ✅ 结构化日志，机器可读
logger.info('order_created', {
  orderId: order.id,
  userId: req.user.userId,
  amount: order.totalAmount.amount,
  itemCount: order.items.length,
  traceId: req.traceId,
  durationMs: Date.now() - req.startTime,
});

// ❌ 非结构化日志
console.log(`Order created: ${order.id}`);
```

**健康检查端点：**

```typescript
// GET /health — 存活检查
app.get('/health', async () => {
  return { status: 'ok', timestamp: new Date().toISOString() };
});

// GET /health/ready — 就绪检查（含依赖）
app.get('/health/ready', async () => {
  const checks = {
    database: await checkDatabase(),
    cache: await checkCache(),
  };
  const allOk = Object.values(checks).every((c) => c.status === 'ok');
  return {
    status: allOk ? 'ok' : 'degraded',
    checks,
    timestamp: new Date().toISOString(),
  };
});
```

---

## 后端项目结构

```
src/
├── domain/                     # 领域层（纯逻辑，零框架依赖）
│   ├── order/
│   │   ├── order.ts            # 聚合根
│   │   ├── order-item.ts       # 实体
│   │   ├── money.ts            # 值对象
│   │   ├── order-status.ts     # 枚举
│   │   ├── events/             # 领域事件
│   │   │   └── order-created.ts
│   │   └── errors/             # 领域错误
│   │       └── order-errors.ts
│   └── shared/
│       ├── domain-error.ts     # 基础错误类
│       └── result.ts           # Result 模式（可选）
├── application/                # 应用层（用例/Service）
│   ├── order/
│   │   ├── order-service.ts    # 业务编排
│   │   ├── commands/           # 命令（写操作入参）
│   │   │   └── create-order.ts
│   │   └── queries/            # 查询（读操作入参）
│   │       └── list-orders.ts
│   └── shared/
│       └── event-bus.ts        # 事件总线接口
├── infrastructure/             # 基础设施层
│   ├── persistence/
│   │   ├── order-repository.ts # Repository 实现
│   │   └── migrations/        # 数据库迁移
│   ├── cache/
│   │   └── redis-cache.ts
│   ├── messaging/
│   │   └── rabbitmq-publisher.ts
│   └── auth/
│       └── jwt-service.ts
├── interfaces/                 # 接口层（HTTP/GraphQL/gRPC）
│   ├── http/
│   │   ├── order-handler.ts    # 路由处理器
│   │   ├── middleware/
│   │   │   ├── auth.ts
│   │   │   ├── error-handler.ts
│   │   │   └── request-logger.ts
│   │   └── routes.ts          # 路由注册
│   └── contracts/              # API 契约
│       └── order-api.ts
├── config/                     # 配置
│   └── index.ts               # 环境变量 + 默认值
└── __tests__/                  # 测试
    ├── unit/                   # 领域层 + Service 单元测试
    ├── integration/            # API 集成测试
    └── fixtures/               # 测试数据和工厂
```

---

## 错误处理链

**从领域错误到 HTTP 响应的映射：**

```
DomainError
  ↓
Service 捕获（添加业务上下文）
  ↓
ErrorHandler 中间件统一映射
  ↓
结构化 HTTP 响应
```

```typescript
// 全局错误处理中间件
function errorHandler(error: Error, req: Request, reply: Reply) {
  if (error instanceof DomainError) {
    reply.status(error.httpStatus).json({
      error: {
        code: error.code,
        message: error.message,
        details: error.details,
        traceId: req.traceId,
      },
    });
    return;
  }

  // 未预期错误：5xx，不泄露内部信息
  logger.error('unexpected_error', { error: error.message, stack: error.stack, traceId: req.traceId });
  reply.status(500).json({
    error: {
      code: 'INTERNAL_ERROR',
      message: '服务内部错误，请稍后重试',
      traceId: req.traceId,
    },
  });
}
```

---

## 缓存策略

| 场景 | 策略 | TTL | 失效方式 |
|------|------|-----|---------|
| 用户信息 | Cache-Aside | 15min | 写入时主动失效 |
| 配置数据 | Cache-Aside | 5min | 发布事件失效 |
| 热点列表 | Read-Through | 30s | 自然过期 + 写入失效 |
| 计数器 | Write-Behind | - | 定时刷盘 |
| 查询结果 | 不缓存 | - | 数据一致性要求高 |

**缓存使用规范：**

```typescript
// ✅ 缓存 key 有命名空间，包含版本
const cacheKey = `order:${order.id}:v2`;

// ✅ 防缓存穿透：空值也缓存，短 TTL
async function findOrder(id: string): Promise<Order | null> {
  const cached = await cache.get(`order:${id}`);
  if (cached !== undefined) return cached === 'NULL' ? null : cached;

  const order = await this.orderRepo.findById(id);
  await cache.set(`order:${id}`, order ?? 'NULL', order ? 300 : 30);  // 空值 30s
  return order;
}

// ✅ 写入时失效
async function updateOrder(order: Order): Promise<void> {
  await this.orderRepo.save(order);
  await cache.del(`order:${order.id}`);
}

// ❌ 永不过期 + 无主动失效
await cache.set('orders:all', orders, 0);  // 数据永久不一致
```

---

## 反合理化表

| 借口 | 事实 |
|------|------|
| "先写 API 再定契约" | 没有契约的 API = 两个黑盒互相猜。前后端联调时每个字段都要对一遍，总时间 > 先写契约 |
| "Service 层太薄，直接在 Handler 里写逻辑" | Handler 写逻辑 = 测试只能通过 HTTP。Service 抽出来，单元测试秒级跑完 |
| "这个接口简单，不需要集成测试" | 简单接口的集成测试也简单——3 行代码。但不写集成测试，认证/序列化/中间件的问题只有线上才发现 |
| "先不考虑错误处理，后面补" | 后面补 = 遍地 try/catch。从一开始就用 DomainError，代码量和 try/catch 差不多，但语义清晰 100 倍 |
| "SQL 直接写在 Service 里" | SQL 和业务逻辑混在一起 = 无法独立测试/优化/替换。Repository 一层隔离，成本 <5 分钟 |
| "缓存后面再加" | 后面加 = 改 Repository 接口 + 所有调用方。一开始就定义缓存接口（即使初始实现是空操作），后面加缓存只改一行 |
| "日志随便打打就行" | 随便打的日志线上查问题时毫无用处。结构化日志从第一行就该有，不比 console.log 多几个字 |
| "认证后面再接入" | 后面接入 = 改所有 Handler 签名 + 测试全改。一开始就定义 req.user 类型，即使初始实现是 mock |
| "这个查询只返回一条，不用分页" | "只返回一条"是当前假设。业务变化后变成 N 条，没有分页 = OOM。分页的代码量就 5 行 |

---

## 与其他Skill的衔接

| 方向 | 条件 | 增强方式 | 降级方式 |
|------|------|---------|---------|
| ← `model` | 领域模型通过校验 | 从模型提取聚合/实体/值对象/领域事件 | 向用户澄清"领域模型？核心业务实体有哪些？" |
| ← `arch` | 架构文档完成 | 从 ADR 提取技术栈 + 数据库选型 + 缓存策略 | 向用户澄清"技术栈？数据库？缓存？" |
| ← `prd-gen` | PRD 通过评审 | 从 PRD 提取验收标准 + 非功能需求 | 向用户澄清"性能要求？可用性目标？" |
| → `build-fe` | API 契约定义完成 | 传递 API 契约（OpenAPI/类型定义）给前端 | 向用户确认"前端是否需要 API 契约？" |
| → `verify` | 代码+测试完成 | 交付后端代码做独立验证 | 向用户确认"代码是否已准备好验证？" |
| → `review` | 代码完成 | 交付代码做代码审查 | 向用户确认"代码是否已准备好审查？" |

---

## 参考文档

- `references/api-patterns.md` — API 设计模式详解
- `references/error-handling.md` — 错误处理最佳实践
