# 组件设计模式

> 前端组件的通用设计模式，按场景选择，不要发明新模式。

---

## 一、表单模式

### 受控组件（默认选择）

所有表单控件默认受控——值由父组件管理，通过 props 传入 + onChange 回调上报。

```typescript
// React
interface ControlledInputProps {
  value: string;
  onChange: (value: string) => void;
  error?: string;
  disabled?: boolean;
}

function ControlledInput({ value, onChange, error, disabled }: ControlledInputProps) {
  return (
    <div>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        aria-invalid={!!error}
        aria-describedby={error ? 'error-msg' : undefined}
      />
      {error && <span id="error-msg" role="alert">{error}</span>}
    </div>
  );
}
```

### 表单状态管理

| 场景 | 方案 | 原因 |
|------|------|------|
| 简单表单（<5字段） | 组件本地 useState | 无需额外依赖 |
| 中等表单（5-15字段） | 自定义 Hook useFormData | 校验 + 脏检查 + 提交状态 |
| 复杂表单（15+字段/联动/异步校验） | React Hook Form / VeeValidate | 性能 + 校验 + 联动 |

### 校验模式

```typescript
// 校验函数：纯函数，可独立测试
type Validator = (value: unknown) => string | undefined;

const required: Validator = (v) => (!v ? '此字段必填' : undefined);
const minLength = (min: number): Validator => (v) =>
  typeof v === 'string' && v.length < min ? `最少 ${min} 个字符` : undefined;
const email: Validator = (v) =>
  typeof v === 'string' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) ? '邮箱格式不正确' : undefined;

// 组合校验
function validate(value: unknown, rules: Validator[]): string | undefined {
  for (const rule of rules) {
    const error = rule(value);
    if (error) return error;
  }
  return undefined;
}

// 使用
const nameError = validate(name, [required, minLength(2)]);
```

---

## 二、列表模式

### 无限滚动 vs 分页

| 场景 | 选择 | 原因 |
|------|------|------|
| 信息流/社交动态 | 无限滚动 | 沉浸式消费，用户不需要跳转 |
| 管理后台/数据表格 | 分页 | 需要定位特定条目，需要 URL 可分享 |
| 搜索结果 | 分页 + 虚拟滚动 | 需要跳转，数据量大时性能要求高 |

### 虚拟滚动（列表 > 100 项）

```typescript
import { useVirtualizer } from '@tanstack/react-virtual';

function LargeList({ items }: { items: Item[] }) {
  const parentRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 48,  // 每行预估高度
    overscan: 5,             // 上下额外渲染 5 行
  });

  return (
    <div ref={parentRef} style={{ height: '600px', overflow: 'auto' }}>
      <div style={{ height: virtualizer.getTotalSize(), position: 'relative' }}>
        {virtualizer.getVirtualItems().map((virtualRow) => (
          <div
            key={items[virtualRow.index].id}
            style={{
              position: 'absolute',
              top: virtualRow.start,
              width: '100%',
              height: virtualRow.size,
            }}
          >
            <ItemRow item={items[virtualRow.index]} />
          </div>
        ))}
      </div>
    </div>
  );
}
```

### 排序 + 筛选 + 分页 组合模式

```typescript
interface ListQuery {
  page: number;
  pageSize: number;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  filters: Record<string, string | undefined>;
}

// URL 同步：筛选条件反映在 URL 中，支持分享和浏览器后退
function useListQuery(): [ListQuery, (update: Partial<ListQuery>) => void] {
  const [searchParams, setSearchParams] = useSearchParams();

  const query: ListQuery = {
    page: Number(searchParams.get('page')) || 1,
    pageSize: Number(searchParams.get('pageSize')) || 20,
    sortBy: searchParams.get('sortBy') || 'createdAt',
    sortOrder: (searchParams.get('sortOrder') as 'asc' | 'desc') || 'desc',
    filters: Object.fromEntries(
      [...searchParams.entries()].filter(([k]) => k.startsWith('filter_'))
        .map(([k, v]) => [k.replace('filter_', ''), v])
    ),
  };

  const updateQuery = (update: Partial<ListQuery>) => {
    setSearchParams((prev) => {
      if (update.page) prev.set('page', String(update.page));
      if (update.sortBy) prev.set('sortBy', update.sortBy);
      if (update.sortOrder) prev.set('sortOrder', update.sortOrder);
      return prev;
    });
  };

  return [query, updateQuery];
}
```

---

## 三、反馈模式

### Loading 状态分层

| 延迟 | 展示 | 组件 |
|------|------|------|
| < 200ms | 无反馈（太快反而闪烁） | — |
| 200ms - 1s | 内联骨架屏 | Skeleton |
| 1s - 3s | 骨架屏 + 进度提示 | Skeleton + Spinner |
| > 3s | 进度条 + 可取消 | ProgressBar + Cancel |

```typescript
function useDelayedLoading(loading: boolean, delay = 200): boolean {
  const [showLoading, setShowLoading] = useState(false);

  useEffect(() => {
    if (!loading) {
      setShowLoading(false);
      return;
    }
    const timer = setTimeout(() => setShowLoading(true), delay);
    return () => clearTimeout(timer);
  }, [loading, delay]);

  return showLoading;
}
```

### 错误反馈模式

| 场景 | 组件 | 可操作性 |
|------|------|---------|
| 表单字段错误 | InlineError | 修改后实时校验 |
| 操作失败（可重试） | Toast + 重试按钮 | 点击重试 |
| 页面级错误 | ErrorBoundary + 重试 | 刷新页面 |
| 网络离线 | 全局 Banner | 自动恢复后消失 |
| 404 | 空状态插图 + 返回按钮 | 返回上一页 |

### Toast 通知规范

```typescript
// ✅ 统一的通知接口
interface ToastMessage {
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  description?: string;
  action?: { label: string; onClick: () => void };
  duration?: number;  // ms，默认 5000
}

// 使用
toast.success({ title: '订单已创建', description: '订单号 ORD-123' });
toast.error({ title: '创建失败', action: { label: '重试', onClick: handleSubmit } });
```

---

## 四、模态/抽屉模式

### 确认弹窗

```typescript
// ✅ 声明式确认
const confirm = useConfirm();

const handleDelete = async () => {
  const ok = await confirm({
    title: '删除订单',
    message: '确定要删除这个订单吗？此操作不可撤销。',
    confirmLabel: '删除',
    cancelLabel: '取消',
    variant: 'danger',  // 确认按钮变红
  });
  if (!ok) return;
  await deleteOrder(orderId);
};

// ❌ window.confirm（无法自定义样式，阻塞线程）
if (window.confirm('确定删除？')) { ... }
```

### 侧边抽屉

| 场景 | 选择 | 原因 |
|------|------|------|
| 详情查看 | 右侧抽屉 | 不离开列表页，快速切换 |
| 表单编辑 | 右侧抽屉（宽） | 需要空间但不想跳转页面 |
| 复杂编辑 | 新页面 | 表单太复杂，抽屉放不下 |

---

## 五、空状态模式

每个列表/数据展示组件必须有三种空状态：

```typescript
function OrderList({ orders, loading, error, onRetry, onCreate }: OrderListProps) {
  // 1. 加载中
  if (loading) return <OrderListSkeleton />;

  // 2. 错误
  if (error) return <ErrorState error={error} onRetry={onRetry} />;

  // 3. 空数据（首次/无数据）
  if (orders.length === 0) return <EmptyState onCreate={onCreate} />;

  // 4. 正常渲染
  return <OrderTable orders={orders} />;
}

// 空状态是邀请，不是墙
function EmptyState({ onCreate }: { onCreate: () => void }) {
  return (
    <div role="status" className="empty-state">
      <h3>还没有订单</h3>
      <p>创建你的第一个订单</p>
      <button onClick={onCreate}>创建订单</button>
    </div>
  );
}
```

---

## 六、组合模式

### Compound Components（复合组件）

当一个组件需要灵活组合子组件时：

```typescript
// ✅ 复合组件：调用方自由组合
<Card>
  <Card.Header>
    <Card.Title>订单详情</Card.Title>
    <Card.Badge status={order.status} />
  </Card.Header>
  <Card.Body>
    <OrderInfo order={order} />
  </Card.Body>
  <Card.Footer>
    <Button onClick={handleEdit}>编辑</Button>
  </Card.Footer>
</Card>

// ❌ Props 配置式：每次加功能都要改接口
<Card
  title="订单详情"
  badge={order.status}
  body={<OrderInfo order={order} />}
  showEditButton
  onEdit={handleEdit}
/>
```

### Render Props / 插槽

当组件需要将渲染控制权交给调用方时：

```typescript
// React: Render Props
interface DataFetcherProps<T> {
  queryKey: string[];
  queryFn: () => Promise<T>;
  children: (data: T) => ReactNode;
}

function DataFetcher<T>({ queryKey, queryFn, children }: DataFetcherProps<T>) {
  const { data, loading, error } = useQuery({ queryKey, queryFn });
  if (loading) return <Skeleton />;
  if (error) return <ErrorState error={error} />;
  return children(data!);
}

// 使用
<DataFetcher queryKey={['orders']} queryFn={fetchOrders}>
  {(orders) => <OrderTable orders={orders} />}
</DataFetcher>
```

---

## 七、状态同步模式

### 乐观更新

用户操作立即反映在 UI，后台异步确认。失败时回滚。

```typescript
function useOptimisticUpdate<T>() {
  const queryClient = useQueryClient();

  const mutate = async (
    mutationFn: () => Promise<T>,
    optimisticData: T,
    queryKey: string[],
  ) => {
    // 1. 乐观更新缓存
    queryClient.setQueryData(queryKey, optimisticData);

    try {
      // 2. 实际请求
      const result = await mutationFn();
      // 3. 用服务器真实数据替换
      queryClient.setQueryData(queryKey, result);
      return result;
    } catch (error) {
      // 4. 失败回滚
      queryClient.invalidateQueries({ queryKey });
      throw error;
    }
  };

  return { mutate };
}
```

### 轮询 vs 推送

| 场景 | 选择 | 间隔 |
|------|------|------|
| 数据不紧急变化 | 轮询 | 30s - 60s |
| 实时协作 | WebSocket / SSE | 即时 |
| 通知/消息 | SSE | 即时 |
| 后台任务进度 | 轮询（渐进退避） | 1s → 2s → 5s → 10s |

```typescript
// 渐进退避轮询
function usePolling(queryKey: string[], queryFn: () => Promise<unknown>, enabled: boolean) {
  const [interval, setInterval] = useState(1000);
  const MAX_INTERVAL = 10000;

  const { data } = useQuery({
    queryKey,
    queryFn,
    enabled,
    refetchInterval: interval,
  });

  useEffect(() => {
    if (data?.status === 'completed') {
      setInterval(0);  // 停止轮询
    } else {
      setInterval((prev) => Math.min(prev * 2, MAX_INTERVAL));  // 退避
    }
  }, [data?.status]);
}
```
