---
name: build-fe
description: 前端工程实现技能。强制TDD + 组件驱动开发：先写组件测试/Story，再写组件实现。覆盖React/Vue/Svelte，包含状态管理、样式系统、无障碍、性能优化、错误边界。当用户需要实现前端功能、写页面、做组件、或说"帮我写前端""实现这个页面""加个组件"时触发。即使用户只是说"写个表单""做个弹窗"，也应使用此skill。
---

# Build-FE — 前端工程

你是前端工程师。职责只有一个：**把设计稿变成可交互、可访问、可测试的界面**。

不负责做设计（那是 `design` 的事）、不负责做后端（那是 `build-be` 的事）、不负责审查（那是 `review` 的事）。

---

## 独立运行

本Skill可独立运行，无需任何上游Skill的交付物。

**直接输入**：用户的前端需求（"帮我实现X页面""加个Y组件""修这个UI bug"）
**有上游增强时**：`design` 的设计系统可提供组件规格和样式变量，`arch` 的ADR可确定技术栈
**无上游时**：主动向用户澄清"技术栈是什么（React/Vue/Svelte）？设计规范在哪？路由结构？"确保约束充分后再编码

---

## 铁律

> **没有交互测试就不能写组件实现。**
>
> 组件的值在于行为而非标签。如果无法描述"用户点击后发生什么"，就不该开始写 JSX/template。

---

## 核心原则

### 1. 组件驱动开发（CDD）

组件开发顺序：**原子 → 分子 → 有机体 → 页面**，自底向上。

每个组件必须回答三个问题：
1. **输入是什么？** — Props/API
2. **输出是什么？** — 渲染结果 + 事件回调
3. **边界状态有哪些？** — 空值/加载/错误/溢出

### 2. 关注点分离

| 关注点 | 归属 | 不应出现在 |
|--------|------|-----------|
| 数据获取 | 自定义 Hook / Composable | 组件渲染逻辑 |
| 业务逻辑 | Store / Service 层 | 组件事件处理 |
| UI 状态 | 组件本地 state | 全局 Store |
| 样式 | CSS Module / Scoped CSS | 内联 style（除动态值外） |
| 副作用 | Effect / Watch，明确依赖 | 隐式全局变量 |

### 3. 渐进增强

- HTML 语义先行 → CSS 视觉 → JS 交互
- JS 不可用时核心内容仍可访问
- 网络慢时显示有意义的加载状态

---

## 工作流程

### Step 0: 增强注入

> 自动检测上游交付物，有则提取增强数据注入工作流，无则跳过。

```bash
python3 scripts/check_prerequisite.py --skill build-fe --upstream-dir ./output --detect-enhancement
```

| 上游 | 提取字段 | 注入位置 | 增强效果 |
|------|---------|---------|---------|
| `design` 设计系统 | 配色/字体/间距变量、组件规格、反模式清单 | Step 1 技术约束 | 样式实现与设计稿一致，减少设计偏差 |
| `arch` ADR | 前端技术栈、构建工具、部署方式 | Step 1 技术约束 | 技术选型一致，减少架构冲突 |
| `prd-gen` PRD | 验收标准、交互需求、页面列表 | Step 2 组件拆分 | 功能覆盖完整，减少遗漏 |

### Step 1: 确定技术约束

**输入：** 上游设计系统 + ADR（降级：用户直接指定）
**输出：** 技术约束清单 + 项目脚手架

| 约束项 | 来源 | 默认值 |
|--------|------|--------|
| 框架 | ADR / 用户指定 | React |
| 状态管理 | ADR / 用户指定 | Zustand / Pinia |
| 样式方案 | 设计系统 / ADR | CSS Modules + Tailwind |
| 构建工具 | ADR / 用户指定 | Vite |
| 测试框架 | ADR / 用户指定 | Vitest + Testing Library |
| E2E 框架 | ADR / 用户指定 | Playwright |
| TypeScript | 推荐 strict 模式 | strict: true |

**脚手架初始化：**

```bash
python3 scripts/scaffold_fe.py \
  --framework react \
  --style css-modules \
  --state zustand \
  --project-name my-app
```

### Step 2: 组件拆分与职责划分

**输入：** PRD/需求 + 设计稿（降级：用户描述的功能）
**输出：** 组件树 + Props 接口 + 数据流图

**拆分原则：**

1. **单一职责** — 一个组件只做一件事
2. **自顶向下拆** — 从页面布局开始，逐层拆到原子组件
3. **可复用优先** — 出现2次以上的 UI 模式提取为独立组件
4. **受控 vs 非受控** — 表单组件默认受控，UI 反馈组件默认非受控

**组件树输出格式：**

```markdown
## 组件树

### Page: OrderList
├── OrderListPage          # 页面容器（数据获取 + 状态）
│   ├── OrderSearchBar     # 搜索 + 筛选
│   │   ├── SearchInput    # 原子：搜索输入
│   │   └── FilterDropdown # 原子：筛选下拉
│   ├── OrderTable         # 订单列表
│   │   ├── OrderRow       # 单行
│   │   └── EmptyState     # 空状态
│   ├── Pagination         # 分页
│   └── ErrorBoundary      # 错误边界

### 数据流
OrderListPage (state: orders, filters, page)
  → OrderSearchBar (props: onSearch, filters)
  → OrderTable (props: orders, loading, error)
  → Pagination (props: page, total, onChange)
```

**组件接口定义（先于实现）：**

```typescript
// 先定义 Props 接口，再写组件
interface OrderTableProps {
  orders: Order[];
  loading: boolean;
  error: Error | null;
  onRowClick: (orderId: string) => void;
  sortField?: keyof Order;
  sortDirection?: 'asc' | 'desc';
  onSort?: (field: keyof Order) => void;
}
```

### Step 3: TDD — RED：写交互测试

**输入：** 组件接口 + 交互需求
**输出：** 失败的组件测试

**测试策略（测试金字塔）：**

| 层 | 比例 | 工具 | 测试什么 |
|----|------|------|---------|
| 组件测试 | 70% | Vitest + Testing Library | 用户交互、状态变化、边界条件 |
| 集成测试 | 20% | MSW + Vitest | 数据获取、路由跳转、Store 集成 |
| E2E 测试 | 10% | Playwright | 关键用户旅程 |

**组件测试模板（React + Testing Library）：**

```typescript
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { OrderTable } from './OrderTable';

describe('OrderTable', () => {
  // ✅ 测试行为，不测实现
  test('点击行触发 onRowClick', async () => {
    const onRowClick = vi.fn();
    render(<OrderTable orders={mockOrders} onRowClick={onRowClick} />);

    await userEvent.click(screen.getByText('ORD-001'));
    expect(onRowClick).toHaveBeenCalledWith('ord-1');
  });

  // ✅ 测试边界状态
  test('loading 时显示骨架屏', () => {
    render(<OrderTable orders={[]} loading={true} onRowClick={vi.fn()} />);
    expect(screen.getByTestId('skeleton')).toBeInTheDocument();
  });

  test('空数据时显示空状态', () => {
    render(<OrderTable orders={[]} loading={false} onRowClick={vi.fn()} />);
    expect(screen.getByText(/暂无订单/)).toBeInTheDocument();
  });

  test('错误时显示重试按钮', () => {
    render(
      <OrderTable
        orders={[]}
        loading={false}
        error={new Error('网络错误')}
        onRowClick={vi.fn()}
      />
    );
    expect(screen.getByRole('button', { name: /重试/ })).toBeInTheDocument();
  });
});
```

**组件测试模板（Vue + Vitest）：**

```typescript
import { mount } from '@vue/test-utils';
import OrderTable from './OrderTable.vue';

describe('OrderTable', () => {
  test('点击行触发 rowClick', async () => {
    const wrapper = mount(OrderTable, {
      props: { orders: mockOrders }
    });
    await wrapper.find('[data-test="order-row"]').trigger('click');
    expect(wrapper.emitted('rowClick')?.[0]).toEqual(['ord-1']);
  });
});
```

**MSW API Mock 模板：**

```typescript
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';

export const handlers = [
  http.get('/api/orders', () => {
    return HttpResponse.json({ data: mockOrders, total: 100 });
  }),
  http.get('/api/orders', ({ request }) => {
    const url = new URL(request.url);
    if (url.searchParams.get('status') === 'error') {
      return HttpResponse.error();
    }
    return HttpResponse.json({ data: mockOrders, total: 100 });
  }),
];

export const server = setupServer(...handlers);
```

### Step 4: TDD — GREEN：实现组件

**输入：** 失败的组件测试 + 组件接口
**输出：** 通过测试的组件实现

**实现优先级：**

1. 先让测试通过（最小实现）
2. 处理所有边界状态（loading / empty / error）
3. 添加无障碍属性（ARIA / 键盘操作）
4. 响应式适配
5. 性能优化（memo / lazy / 虚拟滚动）

**组件实现规范：**

```typescript
// ✅ 正确：受控组件 + 明确的 Props
interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  'aria-label'?: string;  // 无障碍
}

export function SearchInput({ value, onChange, placeholder, ...props }: SearchInputProps) {
  return (
    <input
      type="search"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      aria-label={props['aria-label'] ?? '搜索'}
      role="searchbox"
    />
  );
}

// ❌ 错误：内部管理状态，外部无法控制
export function SearchInput({ placeholder }: { placeholder?: string }) {
  const [value, setValue] = useState('');  // 不受控，外部拿不到值
  return <input value={value} onChange={(e) => setValue(e.target.value)} />;
}
```

### Step 5: TDD — REFACTOR：重构与优化

**输入：** 通过测试的组件实现
**输出：** 重构后的组件（测试仍通过）

**前端重构检查清单：**

- [ ] 组件是否 < 150 行？（超过则拆分子组件）
- [ ] useEffect/useWatch 是否有明确依赖？（禁止空依赖数组外的遗漏）
- [ ] 是否存在 Prop Drilling > 2 层？（引入 Context 或提升状态）
- [ ] 列表渲染是否有 key？（必须是稳定唯一值，非 index）
- [ ] 图片是否有 alt？交互元素是否有 aria-label？
- [ ] 是否有内存泄漏风险？（定时器/订阅/事件监听未清理）
- [ ] 大组件是否做了 React.memo / shallowRef 优化？
- [ ] 测试是否仍然全部通过？

### Step 6: 样式实现

**输入：** 设计系统变量 + 组件设计稿
**输出：** 组件样式

**样式规范：**

```css
/* ✅ 使用设计系统变量，不硬编码 */
.order-row {
  padding: var(--spacing-md);
  border-bottom: 1px solid var(--color-border);
  font-family: var(--font-body);
}

/* ✅ BEM 命名或 CSS Modules，避免样式冲突 */
.order-row--highlighted {
  background-color: var(--color-accent-light);
}

.order-row__actions {
  display: flex;
  gap: var(--spacing-sm);
}

/* ❌ 硬编码颜色/间距 */
.order-row {
  padding: 16px;           /* 应使用变量 */
  border-bottom: 1px solid #e5e7eb;  /* 应使用变量 */
}
```

**响应式断点规范：**

| 断点 | 宽度 | 设备 |
|------|------|------|
| sm | ≥640px | 手机横屏 |
| md | ≥768px | 平板 |
| lg | ≥1024px | 笔记本 |
| xl | ≥1280px | 桌面 |

**媒体查询策略：Mobile First**

```css
/* ✅ Mobile First */
.order-table {
  display: flex;
  flex-direction: column;
}

@media (min-width: 768px) {
  .order-table {
    display: table;
  }
}

/* ❌ Desktop First */
.order-table {
  display: table;
}

@media (max-width: 767px) {
  .order-table {
    display: flex;
    flex-direction: column;
  }
}
```

### Step 7: 状态管理

**输入：** 组件数据流图 + API 接口
**输出：** 状态管理实现

**状态分层决策：**

```
这个状态是哪个组件用的？
├── 只有当前组件 → 组件本地 state
├── 父子组件共享 → Props 传递
├── 兄弟组件共享 → 提升到最近公共父组件
├── 跨多级组件 → Context / Provide-Inject
└── 跨页面共享 → 全局 Store
```

**Store 规范（React + Zustand 示例）：**

```typescript
// ✅ 正确：slice 模式，职责单一
interface OrderSlice {
  orders: Order[];
  loading: boolean;
  error: Error | null;
  fetchOrders: (params: OrderQuery) => Promise<void>;
}

const useOrderStore = create<OrderSlice>((set) => ({
  orders: [],
  loading: false,
  error: null,
  fetchOrders: async (params) => {
    set({ loading: true, error: null });
    try {
      const data = await orderApi.query(params);
      set({ orders: data.items, loading: false });
    } catch (e) {
      set({ error: e as Error, loading: false });
    }
  },
}));

// ❌ 错误：全局大仓库，所有状态塞一起
const useAppStore = create(() => ({
  user: null,
  orders: [],
  products: [],
  cart: [],
  notifications: [],
  // ... 50 个字段
}));
```

**自定义 Hook / Composable 规范：**

```typescript
// ✅ 数据获取封装为 Hook
function useOrders(params: OrderQuery) {
  const [state, setState] = useState<{
    data: Order[];
    loading: boolean;
    error: Error | null;
  }>({ data: [], loading: true, error: null });

  useEffect(() => {
    let cancelled = false;  // 防止竞态
    orderApi.query(params).then((data) => {
      if (!cancelled) setState({ data: data.items, loading: false, error: null });
    }).catch((e) => {
      if (!cancelled) setState({ data: [], loading: false, error: e });
    });
    return () => { cancelled = true; };
  }, [JSON.stringify(params)]);  // 序列化避免无限循环

  return state;
}

// ❌ 组件内直接 fetch
function OrderList() {
  const [orders, setOrders] = useState([]);
  useEffect(() => {
    fetch('/api/orders').then(r => r.json()).then(setOrders);
    // 无竞态处理、无错误处理、无取消机制
  }, []);
}
```

### Step 8: 无障碍（Accessibility）

**输入：** 组件实现
**输出：** 通过无障碍检查的组件

**强制检查项：**

| 检查项 | 标准 | 工具 |
|--------|------|------|
| 键盘可操作 | 所有交互元素 Tab 可达、Enter/Space 可触发 | 手动测试 + axe-core |
| 颜色对比度 | WCAG AA: 正文 ≥4.5:1，大字 ≥3:1 | axe-core |
| 图片有 alt | 装饰图 alt=""，内容图描述含义 | eslint-plugin-jsx-a11y |
| 表单有 label | 每个 input 关联 label 或 aria-label | eslint-plugin-jsx-a11y |
| 动态内容 | aria-live 通知变化 | 手动测试 |
| 焦点管理 | 弹窗打开聚焦、关闭恢复焦点 | 手动测试 |
| 减少动效 | prefers-reduced-motion | CSS 媒体查询 |

```bash
# 无障碍自动检查
python3 scripts/check_fe_standards.py --type accessibility --src-dir ./src
```

### Step 9: 性能优化

**输入：** 完整的组件实现
**输出：** 性能优化后的组件（测试仍通过）

**性能检查清单：**

| 检查项 | 目标 | 方法 |
|--------|------|------|
| 首屏加载 | LCP < 2.5s | 代码分割 + 预加载关键资源 |
| 交互响应 | FID < 100ms | 减少 JS 主线程阻塞 |
| 布局稳定 | CLS < 0.1 | 图片/组件预设尺寸 |
| Bundle 大小 | 初始 JS < 200KB (gzip) | Tree-shaking + 动态 import |
| 渲染性能 | 列表 > 100 项用虚拟滚动 | react-window / vue-virtual-scroller |
| 图片优化 | WebP + 懒加载 + srcset | `<img loading="lazy" srcset="...">` |
| 缓存策略 | 静态资源不可变哈希 | Vite 默认 contenthash |

```bash
# 性能检查
python3 scripts/check_fe_standards.py --type performance --src-dir ./src

# Bundle 分析
npx vite-bundle-visualizer
```

---

## 错误边界与降级

### 错误边界（React）

```typescript
interface Props {
  fallback?: ReactNode;
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // 上报错误到监控（不硬编码平台）
    console.error('ErrorBoundary caught:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback ?? (
        <div role="alert">
          <p>页面出了点问题</p>
          <button onClick={() => this.setState({ hasError: false })}>
            重试
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
```

### 降级策略

| 场景 | 降级方案 |
|------|---------|
| API 超时 | 显示缓存数据 + "数据可能不是最新" 提示 |
| API 失败 | 显示错误提示 + 重试按钮，不白屏 |
| JS 加载失败 | SSR/SSG 保障核心内容可访问 |
| 图片加载失败 | 显示占位图 + alt 文本 |
| 功能不可用 | 优雅降级（如地图不可用时显示文本地址） |

---

## 前端项目结构

```
src/
├── app/                    # 页面/路由
│   ├── orders/
│   │   ├── page.tsx        # 页面组件（容器）
│   │   └── layout.tsx      # 布局
│   └── layout.tsx
├── components/             # 共享组件
│   ├── ui/                 # 原子组件（Button/Input/Card...）
│   ├── feedback/           # 反馈组件（Toast/Modal/Skeleton...）
│   └── layout/             # 布局组件（Header/Sidebar/Footer...）
├── hooks/                  # 自定义 Hooks / Composables
├── stores/                 # 状态管理（slice 模式）
├── services/               # API 调用层
│   ├── api.ts              # 请求封装（baseURL/拦截器/错误处理）
│   └── order.api.ts        # 订单相关 API
├── types/                  # TypeScript 类型定义
├── utils/                  # 工具函数（纯函数，可独立测试）
├── styles/                 # 全局样式 + 变量
│   ├── variables.css       # 设计系统变量
│   └── globals.css         # 全局样式
└── __tests__/              # 测试
    ├── integration/        # 集成测试
    └── msw/                # API Mock
```

---

## 反合理化表

| 借口 | 事实 |
|------|------|
| "组件测试太难写，先跳过" | 测试难写=组件设计有问题。把数据获取抽到 Hook，组件就只剩渲染，测试自然简单 |
| "先用 inline style 快速实现，后面再改" | inline style 不支持伪类/媒体查询/主题切换，后面改=重写。CSS Module 从一开始就可用 |
| "这个页面逻辑简单，全放一个组件就行" | 简单会变复杂。一开始就拆组件，成本<5分钟；1000行时再拆，成本>1天 |
| "状态管理太复杂，先 props 传" | Prop Drilling > 2层就应引入 Context/Store。每多传一层，维护成本指数增长 |
| "无障碍是后面的事" | 后面补=返工。aria-label 从第一行 JSX 就该写。screen reader 用户不会等你的"后面" |
| "性能优化等上线再说" | 上线后发现的性能问题，修复需要重构，成本是开发期的 5-10 倍 |
| "设计稿和实现有点差异没关系" | 像素级还原不是目的，但间距/字号/颜色必须与设计系统变量一致。差异会累积 |
| "TypeScript 类型太麻烦" | 类型是文档、是契约、是自动补全。any 省的 1 分钟，debug 时花 1 小时 |
| "这段 CSS 别人写的，我不敢动" | 不敢动=没有测试保护。加个快照测试，改起来就有信心了 |

---

## 与其他Skill的衔接

| 方向 | 条件 | 增强方式 | 降级方式 |
|------|------|---------|---------|
| ← `design` | 设计系统完成 | 从设计系统提取 CSS 变量 + 组件规格 | 向用户澄清"样式变量在哪？组件规格是什么？" |
| ← `arch` | ADR 完成 | 从 ADR 确定技术栈 + 构建配置 | 向用户澄清"技术栈？React/Vue/Svelte？" |
| ← `prd-gen` | PRD 通过评审 | 从 PRD 提取验收标准 + 交互需求 | 向用户澄清"交互需求？验收标准？" |
| ← `build-be` | API 接口定义完成 | 基于 API 契约生成请求层类型 | 向用户澄清"API 接口文档？请求/响应格式？" |
| → `verify` | 前端代码+测试完成 | 交付前端代码做独立验证 | 向用户确认"前端代码是否已准备好验证？" |
| → `review` | 前端代码完成 | 交付代码做代码审查 | 向用户确认"代码是否已准备好审查？" |
| → `build-be` | 前端需要 API 支持 | 传递 API 需求和接口契约 | 向用户确认"后端接口是否已就绪？" |

---

## 参考文档

- `references/component-patterns.md` — 组件设计模式详解
- `references/fe-testing-strategy.md` — 前端测试策略与实战
