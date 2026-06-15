# 前端测试策略与实战

> 测试金字塔：单元测试(70) > 集成测试(20) > E2E(10)

---

## 一、测试金字塔

```
        ┌─────────┐
        │  E2E 10% │    关键用户旅程
        ├─────────┤
        │ 集成 20% │    API + Store + Router
        ├─────────┤
        │ 单元 70% │    组件行为 + Hook + 工具函数
        └─────────┘
```

**比例不是硬规则，是资源分配指南。** 核心路径可以增加 E2E 比例，简单 CRUD 可以减少。

---

## 二、组件测试核心原则

### 测试行为，不测实现

```typescript
// ✅ 行为测试：用户做了什么 → 看到什么
test('搜索输入后显示搜索结果', async () => {
  render(<SearchPage />);
  await userEvent.type(screen.getByRole('searchbox'), '订单');
  await userEvent.click(screen.getByRole('button', { name: '搜索' }));
  expect(await screen.findByText('搜索结果')).toBeInTheDocument();
});

// ❌ 实现测试：内部状态/方法
test('搜索关键词设置为"订单"', () => {
  const { result } = renderHook(() => useState(''));
  act(() => result.current[1]('订单'));
  expect(result.current[0]).toBe('订单');
});
```

### 测试用户能看到和操作的

| 测什么 | 不测什么 |
|--------|---------|
| 文本内容 | 组件内部 state 名 |
| 按钮可点击 | 事件处理函数名 |
| 错误消息显示 | 错误消息的 DOM 层级 |
| 页面跳转 | Router 内部实现 |
| 列表项数量 | 列表项的 key 值 |

### getBy vs findBy vs queryBy

| 方法 | 用途 | 未找到时 |
|------|------|---------|
| `getBy*` | 断言元素存在 | 抛错（测试失败） |
| `queryBy*` | 断言元素不存在 | 返回 null |
| `findBy*` | 等待异步元素 | 超时抛错 |

```typescript
// ✅ 元素存在 → getBy
expect(screen.getByText('订单列表')).toBeInTheDocument();

// ✅ 元素不存在 → queryBy
expect(screen.queryByText('错误信息')).not.toBeInTheDocument();

// ✅ 异步元素 → findBy
expect(await screen.findByText('加载完成')).toBeInTheDocument();
```

---

## 三、自定义 Hook 测试

```typescript
import { renderHook, act } from '@testing-library/react';
import { useCounter } from './useCounter';

describe('useCounter', () => {
  test('初始值为 0', () => {
    const { result } = renderHook(() => useCounter());
    expect(result.current.count).toBe(0);
  });

  test('increment 增加 1', () => {
    const { result } = renderHook(() => useCounter());
    act(() => result.current.increment());
    expect(result.current.count).toBe(1);
  });

  test('支持自定义初始值', () => {
    const { result } = renderHook(() => useCounter(10));
    expect(result.current.count).toBe(10);
  });
});
```

---

## 四、API Mock 策略（MSW）

### 为什么用 MSW

| 方案 | 问题 |
|------|------|
| jest.mock('fetch') | mock 层级太低，需要手写响应逻辑 |
| axios-mock-adapter | 绑定 axios，换 HTTP 库就废 |
| MSW | 拦截网络层，与实现无关，测试和生产同一套 mock |

### 基础配置

```typescript
// src/__tests__/msw/server.ts
import { setupServer } from 'msw/node';
import { handlers } from './handlers';

export const server = setupServer(...handlers);

// src/test-setup.ts
import { server } from './__tests__/msw/server';

beforeAll(() => server.listen({ onUnhandledRequest: 'warn' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
```

### 测试特定场景

```typescript
import { http, HttpResponse } from 'msw';
import { server } from '../msw/server';

test('网络错误时显示重试按钮', async () => {
  // 临时覆盖 handler
  server.use(
    http.get('/api/orders', () => HttpResponse.error())
  );

  render(<OrderList />);
  expect(await screen.findByRole('button', { name: /重试/ })).toBeInTheDocument();
});

test('空列表时显示空状态', async () => {
  server.use(
    http.get('/api/orders', () => HttpResponse.json({ data: [], total: 0 }))
  );

  render(<OrderList />);
  expect(await screen.findByText(/暂无订单/)).toBeInTheDocument();
});
```

---

## 五、快照测试的使用与滥用

### 何时用快照

| 场景 | 用快照？ | 原因 |
|------|---------|------|
| 稳定的配置/Schema | ✅ | 不经常变，变了就应该知道 |
| UI 组件渲染 | ❌ | 任何样式改动都会触发，噪音太多 |
| API 响应契约 | ✅ | 契约变更应该被感知 |

### 快照测试反模式

```typescript
// ❌ 整个组件快照：任何改动都失败
expect(container).toMatchSnapshot();

// ✅ 特定元素的快照：只关注关键结构
expect(screen.getByRole('navigation')).toMatchSnapshot();
```

---

## 六、E2E 测试策略（Playwright）

### 只测关键用户旅程

```
E2E 只覆盖核心路径：
1. 注册 → 登录 → 退出
2. 浏览商品 → 加入购物车 → 下单 → 支付
3. 查看订单 → 取消订单

其他场景用组件测试覆盖。
```

### Page Object 模式

```typescript
// tests/pages/OrderPage.ts
export class OrderPage {
  constructor(private page: Page) {}

  async goto() {
    await this.page.goto('/orders');
  }

  async createOrder(productName: string) {
    await this.page.getByRole('button', { name: '创建订单' }).click();
    await this.page.getByLabel('商品名称').fill(productName);
    await this.page.getByRole('button', { name: '提交' }).click();
  }

  async getOrderCount(): Promise<number> {
    return this.page.getByTestId('order-row').count();
  }

  async getSuccessMessage(): Promise<string | null> {
    return this.page.getByRole('alert').textContent();
  }
}
```

### E2E 测试模板

```typescript
import { test, expect } from '@playwright/test';
import { OrderPage } from '../pages/OrderPage';

test('创建订单流程', async ({ page }) => {
  const orderPage = new OrderPage(page);
  await orderPage.goto();

  const initialCount = await orderPage.getOrderCount();
  await orderPage.createOrder('测试商品');

  const newCount = await orderPage.getOrderCount();
  expect(newCount).toBe(initialCount + 1);

  const message = await orderPage.getSuccessMessage();
  expect(message).toContain('订单已创建');
});
```

---

## 七、测试覆盖率策略

### 分级覆盖

| 模块类型 | 目标覆盖率 | 原因 |
|---------|-----------|------|
| 领域逻辑/支付/认证 | 100% | 出 bug 损失巨大 |
| 核心 UI 组件 | >90% | 高频使用，回归风险高 |
| 页面容器 | >70% | 主要测集成，不需要100% |
| 工具函数 | 100% | 纯函数，测试成本极低 |
| 样式/静态资源 | 不测 | 无行为逻辑 |

### 覆盖率配置

```json
// vitest.config.ts
{
  "test": {
    "coverage": {
      "provider": "v8",
      "reporter": ["text", "html", "json-summary"],
      "include": ["src/**/*.{ts,tsx}"],
      "exclude": [
        "src/**/*.test.{ts,tsx}",
        "src/**/*.d.ts",
        "src/types/**",
        "src/__tests__/**"
      ],
      "thresholds": {
        "branches": 70,
        "functions": 80,
        "lines": 80,
        "statements": 80
      }
    }
  }
}
```
