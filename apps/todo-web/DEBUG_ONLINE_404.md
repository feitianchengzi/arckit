# 线上 404 问题调试指南

## 问题描述

- **本地环境**：`localhost:3000` 访问 `/join/xxx` 正常工作
- **线上环境**：部署到 OSS 后访问 `/join/xxx` 出现问题
- **OSS 配置**：已设置 404 跳转到 `index.html`

---

## 问题原因分析

### 关键区别：本地 vs 线上

| 环境 | 服务器类型 | SPA 路由支持 |
|------|-----------|-------------|
| 本地 (`npm run dev`) | Vite dev server | ✅ 自动支持（内置 fallback） |
| 线上（OSS） | 静态文件托管 | ⚠️ 需要正确配置 404 重定向 |

### OSS "404 跳转" 的两种实现方式

#### ❌ 方式 A：HTTP 重定向（会导致问题）

```
用户访问: https://workshop.feitianchengzi.com/join/ABC123
                    ↓ (OSS 发现文件不存在)
HTTP 302 重定向: https://workshop.feitianchengzi.com/index.html
                    ↓
浏览器地址栏变化: /index.html
                    ↓
React Router 无法获取原始路径 /join/ABC123
                    ↓
路由匹配失败 → 404 或白屏
```

**特征**：
- 浏览器地址栏会从 `/join/ABC123` 变成 `/index.html`
- Network 标签显示 301 或 302 状态码
- React Router 丢失了原始路径信息

#### ✅ 方式 B：内部重写（正确方式）

```
用户访问: https://workshop.feitianchengzi.com/join/ABC123
                    ↓ (OSS 发现文件不存在)
内部返回 index.html 的内容（不改变 URL）
                    ↓
浏览器地址栏保持: /join/ABC123
                    ↓
React Router 可以读取路径 /join/ABC123
                    ↓
正确匹配路由 → 显示 JoinProjectPage
```

**特征**：
- 浏览器地址栏保持 `/join/ABC123` 不变
- Network 标签显示 200 状态码（返回的是 `index.html` 的内容）
- React Router 可以正确匹配路由

---

## 诊断步骤

### 步骤 1：检查 OSS 重定向方式

**测试方法**：
1. 打开浏览器（推荐使用 Chrome）
2. 打开开发者工具（F12）→ Network 标签
3. 访问 `https://workshop.feitianchengzi.com/join/TESTCODE`
4. 观察：

**如果是内部重写（正确）**：
- ✅ 地址栏保持：`/join/TESTCODE`
- ✅ Network 第一个请求：`TESTCODE` 或 `join/` 状态码 **200**
- ✅ 返回内容：`index.html` 的 HTML 代码

**如果是 HTTP 重定向（错误）**：
- ❌ 地址栏变成：`/index.html` 或 `/`
- ❌ Network 第一个请求：状态码 **301** 或 **302**
- ❌ Network 第二个请求：`index.html` 状态码 200

### 步骤 2：检查 OSS 控制台配置

**登录阿里云 OSS 控制台**：
1. 进入 bucket → **基础设置** → **静态页面**
2. 检查配置项：

**✅ 正确配置（使用错误文档）**：
```
默认首页（Index Document）: index.html
错误文档（Error Document）: index.html
```

**❌ 错误配置（使用重定向规则）**：
如果在"**重定向规则**"或"**回源规则**"中配置了 404 → index.html 的重定向，请删除！

### 步骤 3：本地模拟静态环境

**使用 Vite Preview 模拟线上环境**：
```bash
cd frontend
npm run build
npm run preview
```

然后访问 `http://localhost:4173/join/TESTCODE`

**如果本地 preview 也失败**：
- 说明构建配置有问题
- 检查 `vite.config.ts` 中的 `base` 配置

**如果本地 preview 正常**：
- 说明构建配置正确
- 问题在于 OSS 的配置方式

---

## 解决方案

### 方案 1：修改 OSS 配置（推荐）

**步骤**：
1. 登录阿里云 OSS 控制台
2. 选择 bucket → **基础设置** → **静态页面**
3. 配置：
   ```
   默认首页: index.html
   错误文档: index.html  ← 重点！
   ```
4. 点击"保存"
5. 等待 1-2 分钟配置生效
6. 清除浏览器缓存后重新测试

**注意**：
- 不要使用"重定向规则"
- 不要使用"回源规则"
- 必须使用"错误文档"

### 方案 2：修改代码兼容 HTTP 重定向（不推荐）

如果无法修改 OSS 配置，可以修改前端代码使用 hash 路由：

**修改 `main.tsx`**：
```typescript
import { HashRouter } from 'react-router-dom'

// 将 BrowserRouter 改为 HashRouter
<HashRouter>
  <App />
</HashRouter>
```

**缺点**：
- URL 会变成 `/#/join/ABC123`（带 `#` 号）
- SEO 不友好
- 不符合现代 SPA 最佳实践

---

## 代码优化建议

### 优化 1：移除 JoinProjectPage 中的遗留代码

**问题**：
`JoinProjectPage.tsx` 中有 Next.js 的 hydration 逻辑，Vite + React 不需要。

**修改位置**：`frontend/src/pages/JoinProjectPage.tsx`

**删除**：
```typescript
// 21-32 行（移除这些）
const [mounted, setMounted] = useState(false)

useEffect(() => {
  setMounted(true)
  setIsAuthenticated(storeIsAuthenticated)
}, [storeIsAuthenticated])
```

**改为**：
```typescript
// 直接使用 store 的状态
const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
```

**修改后的逻辑**：
```typescript
// 检查是否已登录
useEffect(() => {
  if (!isAuthenticated) {
    // 未登录，跳转到登录页
    navigate(`/login?redirect=/join/${inviteCode}`)
    return
  }
  
  // 已登录，开始加入流程
  if (status === 'checking') {
    setStatus('loading')
  }
}, [isAuthenticated, navigate, inviteCode, status])
```

### 优化 2：添加环境变量

**创建 `.env.production` 文件**：
```bash
# frontend/.env.production
VITE_API_URL=https://api.feitianchengzi.com/workshop/v1
VITE_GATEWAY_URL=https://api.feitianchengzi.com
```

**或在 CI/CD 中设置环境变量**：
```bash
VITE_API_URL=https://api.feitianchengzi.com/workshop/v1 \
VITE_GATEWAY_URL=https://api.feitianchengzi.com \
npm run build
```

---

## 验证清单

完成修复后，按以下清单验证：

- [ ] OSS 控制台 → 静态页面 → 错误文档设置为 `index.html`
- [ ] 访问 `/join/TESTCODE`，浏览器地址栏保持不变
- [ ] Network 标签显示 200 状态码
- [ ] 页面正常显示"加载中"或登录提示
- [ ] 登录后可以成功加入项目
- [ ] 清除浏览器缓存后重新测试

---

## 常见问题

### Q1：修改 OSS 配置后还是不行？

**A**：
1. 等待 1-2 分钟配置生效
2. 清除浏览器缓存（或使用无痕模式）
3. 检查 CDN 是否有缓存（如果使用了 CDN）

### Q2：Network 显示 200，但页面是白屏？

**A**：
1. 检查浏览器控制台（Console 标签）是否有 JavaScript 错误
2. 检查环境变量是否正确
3. 运行 `npm run preview` 本地测试

### Q3：本地 preview 也不行？

**A**：
1. 检查 `vite.config.ts` 的 `base` 配置是否为 `/`
2. 重新构建：`npm run build`
3. 检查路由配置是否正确

---

## 总结

**本地正常但线上失败的根本原因**：
- Vite dev server 内置了 SPA fallback 支持
- 线上 OSS 需要正确配置"错误文档"实现内部重写
- 如果使用了 HTTP 重定向，React Router 会丢失路径信息

**最优解决方案**：
1. ✅ OSS 使用"错误文档"配置（不是重定向规则）
2. ✅ 确保 `vite.config.ts` 的 `base: '/'`
3. ✅ 优化代码，移除不必要的 hydration 逻辑

**验证方法**：
- 浏览器地址栏是否保持原始路径
- Network 标签是否显示 200 状态码
- 是否能正常加载和运行

