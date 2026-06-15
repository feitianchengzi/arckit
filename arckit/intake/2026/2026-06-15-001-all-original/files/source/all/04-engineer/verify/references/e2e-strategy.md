# E2E测试策略

---

## 一、测试金字塔

```
        /  E2E  \           10% — 验证用户核心流程
       / 集成测试  \         20% — 验证模块间协作
      /  单元测试    \       70% — 验证单个函数/类行为
```

| 层级 | 比例 | 运行时间 | 定位精度 | 维护成本 |
|------|------|---------|---------|---------|
| 单元测试 | 70% | <1s/个 | 精确到函数 | 低 |
| 集成测试 | 20% | 1-10s/个 | 精确到模块 | 中 |
| E2E测试 | 10% | 10-60s/个 | 只知道流程失败 | 高 |

**关键原则：** 测试越往上越贵、越慢、越脆弱、定位越模糊。优先用单元测试覆盖逻辑，E2E只覆盖核心用户流程。

---

## 二、Playwright最佳实践

### 页面对象模式（Page Object Pattern）

```typescript
// ❌ 不好的做法：测试中直接操作选择器
test('登录', async ({ page }) => {
  await page.fill('[data-testid="username"]', 'admin');
  await page.fill('[data-testid="password"]', 'pass');
  await page.click('[data-testid="login-btn"]');
  await expect(page.locator('.welcome')).toBeVisible();
});

// ✅ 好的做法：封装为页面对象
class LoginPage {
  constructor(private page: Page) {}
  
  async login(username: string, password: string) {
    await this.page.fill('[data-testid="username"]', username);
    await this.page.fill('[data-testid="password"]', password);
    await this.page.click('[data-testid="login-btn"]');
  }
  
  async expectWelcome() {
    await expect(this.page.locator('.welcome')).toBeVisible();
  }
}

test('登录', async ({ page }) => {
  const loginPage = new LoginPage(page);
  await loginPage.login('admin', 'pass');
  await loginPage.expectWelcome();
});
```

### 测试隔离

```typescript
// ❌ 不好的做法：测试之间共享状态
let authToken: string;

test('登录', async ({ page }) => {
  authToken = await login(page); // 下一个测试依赖这个token
});

test('查看订单', async ({ page }) => {
  await page.setCookie({ name: 'token', value: authToken }); // 如果登录失败，这个测试也会失败
});

// ✅ 好的做法：每个测试独立设置前置条件
test('查看订单', async ({ page }) => {
  // 每个测试自己准备数据，不依赖其他测试
  await setAuthCookie(page, 'test-user');
  await page.goto('/orders');
  await expect(page.locator('.order-list')).toBeVisible();
});
```

### 并行执行

```typescript
// playwright.config.ts
export default defineConfig({
  workers: process.env.CI ? 2 : '50%', // CI用2个worker，本地用50%CPU核心
  retries: process.env.CI ? 2 : 0,     // CI重试2次应对flaky test
  timeout: 30000,                        // 单个测试超时30秒
});
```

### 重试策略

```typescript
// 区分真正的失败和flaky test
test.slow(); // 给当前测试3倍超时时间
test.skip(); // 跳过已知失败的测试（附上issue链接）
test.fixme(); // 标记待修复的测试
```

---

## 三、测试用例设计

### 基于用户故事

```
作为[角色]，我想要[功能]，以便[价值]

→ 测试用例：
1. 角色能成功完成功能（happy path）
2. 角色在异常情况下得到合理反馈（sad path）
3. 非授权角色无法访问功能（安全路径）
```

### 基于风险

| 风险等级 | 功能特征 | 测试策略 |
|---------|---------|---------|
| 高风险 | 支付/权限/数据变更 | E2E + 单元 + 集成全覆盖 |
| 中风险 | 普通CRUD/搜索 | 单元 + 集成覆盖，E2E只覆盖核心流程 |
| 低风险 | 展示类/静态页面 | 快照测试 + 单元测试 |

### 基于变更影响

```
代码变更 → 影响分析 → 回归测试范围

1. 修改公共函数签名 → 所有调用方的单元测试
2. 修改API接口 → 集成测试 + 涉及的E2E测试
3. 修改CSS/样式 → 快照测试 + 视觉回归测试
4. 修改配置/环境变量 → 端到端冒烟测试
```

---

## 四、常见反模式

### 1. 测试顺序依赖

| 反模式 | 问题 | 修复 |
|--------|------|------|
| 测试A创建数据，测试B使用 | A失败→B也失败，但报错信息误导 | 每个测试独立准备数据 |

### 2. 硬编码等待

```typescript
// ❌ 不好的做法
await page.waitForTimeout(5000); // 等5秒，可能在快机器上浪费时间，慢机器上不够

// ✅ 好的做法
await page.waitForSelector('.loaded'); // 等待实际条件满足
await expect(page.locator('.result')).toBeVisible(); // Playwright自动等待+重试
```

### 3. 过度UI断言

```typescript
// ❌ 不好的做法：断言DOM结构和CSS类名
await expect(page.locator('div.card > div.header > span.title')).toHaveText('Hello');

// ✅ 好的做法：使用data-testid断言行为
await expect(page.locator('[data-testid="card-title"]')).toHaveText('Hello');
```

### 4. 测试生产数据

```typescript
// ❌ 不好的做法：依赖生产环境数据
await page.goto('https://prod.example.com/orders/12345');

// ✅ 好的做法：测试环境+种子数据
await page.goto(`${TEST_BASE_URL}/orders/${seedData.orderId}`);
```

### 5. 测试实现细节

```typescript
// ❌ 不好的做法：测试内部状态
expect(cart.items.length).toBe(3);

// ✅ 好的做法：测试用户可见行为
await expect(page.locator('[data-testid="cart-count"]')).toHaveText('3');
```

---

## 五、CI集成配置

### GitHub Actions示例

```yaml
name: E2E Tests
on: [push, pull_request]

jobs:
  e2e:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      
      - name: Install dependencies
        run: npm ci
      
      - name: Install Playwright browsers
        run: npx playwright install --with-deps chromium
      
      - name: Run E2E tests
        run: npx playwright test
        env:
          BASE_URL: http://localhost:3000
      
      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: playwright-report
          path: playwright-report/
```

### 测试报告

```bash
# 生成HTML报告
npx playwright show-report

# 生成JUnit报告（CI用）
npx playwright test --reporter=junit

# 只运行特定测试
npx playwright test tests/login.spec.ts

# 调试模式
npx playwright test --debug
```
