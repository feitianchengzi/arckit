# 性能基准测试方法

---

## 一、基准指标定义

### Core Web Vitals

| 指标 | 全称 | 含义 | 好的阈值 | 需改进 | 差 |
|------|------|------|---------|--------|-----|
| **LCP** | Largest Contentful Paint | 最大内容绘制 | ≤2.5s | 2.5-4s | >4s |
| **INP** | Interaction to Next Paint | 交互到下次绘制 | ≤200ms | 200-500ms | >500ms |
| **CLS** | Cumulative Layout Shift | 累积布局偏移 | ≤0.1 | 0.1-0.25 | >0.25 |

### 补充性能指标

| 指标 | 含义 | 好的阈值 |
|------|------|---------|
| **FCP** | First Contentful Paint | ≤1.8s |
| **TTFB** | Time to First Byte | ≤800ms |
| **TTI** | Time to Interactive | ≤3.8s |
| **TBT** | Total Blocking Time | ≤200ms |
| **SI** | Speed Index | ≤3.4s |

### 后端性能指标

| 指标 | 含义 | 好的阈值 |
|------|------|---------|
| **P50延迟** | 50%请求的响应时间 | <100ms |
| **P95延迟** | 95%请求的响应时间 | <500ms |
| **P99延迟** | 99%请求的响应时间 | <1000ms |
| **错误率** | 5xx响应占比 | <0.1% |
| **QPS** | 每秒查询数 | 根据业务规模 |
| **CPU使用率** | 服务CPU占用 | <70% |
| **内存使用率** | 服务内存占用 | <80% |

---

## 二、测量方法

### Lighthouse（前端综合）

```bash
# CLI方式
npx lighthouse https://example.com \
  --output json \
  --output-path ./reports/lighthouse-$(date +%Y%m%d).json \
  --chrome-flags="--headless"

# 只跑性能
npx lighthouse https://example.com --only-categories=performance

# Node.js脚本
const lighthouse = require('lighthouse');
const result = await lighthouse('https://example.com', {
  port: chrome.port,
  output: 'json',
  onlyCategories: ['performance'],
});
```

### WebPageTest（深度分析）

```bash
# 多地点测试
npx webpagetest test https://example.com \
  --location ec2-ap-east-1:Chrome \
  --runs 3 \
  --firstViewOnly
```

### Performance API（自定义指标）

```typescript
// 测量关键用户路径
performance.mark('order-start');
await submitOrder();
performance.mark('order-end');
performance.measure('order-flow', 'order-start', 'order-end');

const measure = performance.getEntriesByName('order-flow')[0];
console.log(`订单流程耗时: ${measure.duration}ms`);
```

### 后端基准测试

```bash
# wrk - HTTP基准测试
wrk -t12 -c400 -d30s https://api.example.com/orders

# 结果解读
# Latency  P50/P90/P99/Max
# Req/Sec  平均QPS

# k6 - 脚本化负载测试
k6 run --vus 100 --duration 30s load-test.js
```

---

## 三、基线建立流程

### 步骤

1. **选择环境**：标注硬件/网络/浏览器版本
2. **测量3次**：取P50值（非平均值，避免被极值拉偏）
3. **记录上下文**：数据量、并发数、缓存状态
4. **建立基线**：将结果存入 `performance-baseline.json`
5. **定期更新**：每月重新建立基线

### 基线文件格式

```json
{
  "project": "my-app",
  "environment": {
    "hardware": "MacBook Pro M2",
    "browser": "Chrome 126",
    "network": "WiFi 100Mbps",
    "dataVolume": "10k orders"
  },
  "date": "2026-06-10",
  "metrics": {
    "lcp": { "p50": 1.8, "unit": "s" },
    "inp": { "p50": 120, "unit": "ms" },
    "cls": { "p50": 0.05 },
    "api_p95": { "p50": 320, "unit": "ms" },
    "api_error_rate": { "p50": 0.02, "unit": "%" }
  }
}
```

---

## 四、性能预算

| 资源类型 | 预算 | 超出时动作 |
|---------|------|-----------|
| JavaScript | <200KB (gzip) | 拆分代码/懒加载 |
| CSS | <50KB (gzip) | 移除未使用/PurgeCSS |
| 图片 | <500KB (首屏) | 压缩/WebP/懒加载 |
| 字体 | <100KB | 子集化/system font fallback |
| API响应 | <500ms (P95) | 缓存/优化查询 |
| 总页面大小 | <1.5MB | 全面审查资源 |

---

## 五、常见性能问题及修复

### 前端

| # | 问题 | 检测方法 | 修复建议 |
|---|------|---------|---------|
| 1 | 未压缩JS/CSS | Lighthouse审计 | 启用gzip/brotli压缩 |
| 2 | 未懒加载图片 | Network面板看首屏请求 | `loading="lazy"` + IntersectionObserver |
| 3 | 渲染阻塞资源 | Lighthouse "Eliminate render-blocking" | async/defer脚本，关键CSS内联 |
| 4 | 布局抖动(CLS) | Lighthouse CLS分数 | 为图片/广告预留空间，避免动态注入 |
| 5 | 长任务阻塞主线程 | Performance面板 Long Tasks | 拆分为<50ms的微任务，requestIdleCallback |
| 6 | 内存泄漏 | DevTools Memory面板快照对比 | 清理事件监听器、定时器、闭包引用 |
| 7 | 过多DOM节点 | Lighthouse "Avoid an excessive DOM size" | 虚拟滚动、分页、懒渲染 |
| 8 | 未优化的字体 | Lighthouse "Ensure text remains visible" | `font-display: swap`，子集化 |

### 后端

| # | 问题 | 检测方法 | 修复建议 |
|---|------|---------|---------|
| 1 | N+1查询 | SQL日志/ORM debug模式 | eager loading / JOIN / 批量查询 |
| 2 | 缺少索引 | EXPLAIN ANALYZE | 添加适当索引，注意复合索引顺序 |
| 3 | 全表扫描 | EXPLAIN type=ALL | WHERE条件字段加索引 |
| 4 | 连接池耗尽 | 连接池监控 | 增大池大小 / 减少单次持有时间 |
| 5 | 序列化瓶颈 | profiling | 使用流式序列化 / 缓存序列化结果 |
| 6 | 无缓存 | 响应时间随QPS线性增长 | 添加Redis缓存，设置合理TTL |
| 7 | 阻塞IO | profiling / 线程dump | 改为异步IO / 协程 |
| 8 | 大对象传输 | 响应体积监控 | 分页 / 字段过滤 / 压缩 |
