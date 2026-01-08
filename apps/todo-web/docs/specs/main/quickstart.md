# 快速开始指南

**项目**: 待办管理系统  
**前端**: React + Next.js  
**后端**: Go + Gin（已实现）  
**创建日期**: 2024-12-19

---

## 前置要求

**前端**:
- Node.js 18+
- npm / yarn / pnpm

**后端（已实现）**:
- Go 1.24+
- PostgreSQL 12+
- Docker & Docker Compose（可选）

---

## 项目结构

```
workshop-todo-website/
├── frontend/          # Next.js 前端（待开发）
├── server/            # Go 后端（已实现）
└── specs/             # 设计文档
```

---

## 后端启动（已实现）

### 方式一：使用 Docker Compose（推荐）

```bash
cd server

# 1. 配置环境变量
cp env.example .env
# 编辑 .env 文件，设置数据库密码等

# 2. 启动服务
./deploy.sh
# 或手动启动
docker-compose up -d

# 3. 查看日志
docker logs -f todo-service

# 4. 健康检查
curl http://localhost:8081/todo/v1/public/health
```

### 方式二：本地运行

```bash
cd server

# 1. 确保 PostgreSQL 已启动

# 2. 配置环境变量
export PORT=8081
export HOST=0.0.0.0
export SERVICE_NAME=todo
export DB_HOST=localhost
export DB_PORT=5432
export DB_USER=postgres
export DB_PASSWORD=postgres
export DB_NAME=todo
export CORS_ALLOW_ORIGINS=http://localhost:3000

# 3. 运行服务
go run main.go

# 4. 健康检查
curl http://localhost:8081/todo/v1/public/health
```

---

## 前端开发（待初始化）

### 1. 创建 Next.js 项目

```bash
# 在项目根目录创建 frontend 目录
cd workshop-todo-website
npx create-next-app@latest frontend --typescript --tailwind --app --no-src-dir

# 进入前端目录
cd frontend
```

### 2. 安装依赖

```bash
npm install axios @tanstack/react-query zustand
npm install @headlessui/react @radix-ui/react-dropdown-menu
npm install react-hook-form zod @hookform/resolvers
npm install react-i18next i18next
npm install -D @types/node
```

### 3. 配置环境变量

创建 `frontend/.env.local`:
```env
# 后端 API 地址
NEXT_PUBLIC_API_URL=http://localhost:8081/todo/v1

# 网关地址（如果需要）
NEXT_PUBLIC_GATEWAY_URL=http://localhost:8080
```

### 4. 配置 Next.js

编辑 `frontend/next.config.js`:
```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  // SPA 模式（静态导出）
  output: 'export',
  
  // 如果使用图片优化，静态导出需要禁用
  images: {
    unoptimized: true
  },
  
  // 或者保持默认（支持 SSR）
  // output: undefined,
}

module.exports = nextConfig
```

### 5. 创建 API 客户端

创建 `frontend/lib/api/client.ts`:
```typescript
import axios from 'axios'

export const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8081/todo/v1',
  headers: {
    'Content-Type': 'application/json'
  }
})

// 请求拦截器：添加 token
apiClient.interceptors.request.use(config => {
  const token = localStorage.getItem('auth_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// 响应拦截器：处理错误
apiClient.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      // Token 过期，跳转登录
      if (typeof window !== 'undefined') {
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  }
)
```

### 6. 配置 React Query

创建 `frontend/app/providers.tsx`:
```typescript
'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState } from 'react'

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000, // 1 分钟
        refetchOnWindowFocus: false,
      },
    },
  }))

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  )
}
```

更新 `frontend/app/layout.tsx`:
```typescript
import { Providers } from './providers'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-CN">
      <body>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  )
}
```

### 7. 启动开发服务器

```bash
cd frontend
npm run dev
# 前端运行在 http://localhost:3000
```

---

## 开发工作流

### 1. 后端 API 测试

查看后端 API 文档：
```bash
cd server
cat api/README.md
```

测试 API（使用测试用户）:
```bash
# 创建用户
curl -X POST "http://localhost:8081/todo/v1/user/users" \
  -H "X-User-ID: 11111111-1111-1111-1111-111111111111" \
  -H "X-User-Username: alice" \
  -H "Content-Type: application/json" \
  -d '{"username":"alice","avatar":"https://example.com/avatar.png"}'

# 创建项目
curl -X POST "http://localhost:8081/todo/v1/user/projects" \
  -H "X-User-ID: 11111111-1111-1111-1111-111111111111" \
  -H "X-User-Username: alice" \
  -H "Content-Type: application/json" \
  -d '{"name":"电商平台开发","git_url":"https://github.com/team/ecommerce.git"}'

# 创建任务
curl -X POST "http://localhost:8081/todo/v1/user/tasks" \
  -H "X-User-ID: 11111111-1111-1111-1111-111111111111" \
  -H "X-User-Username: alice" \
  -H "Content-Type: application/json" \
  -d '{"project_id":1,"content":"完成任务设计","state":"pending"}'
```

### 2. 前端开发流程

```bash
# 1. 创建组件
cd frontend
mkdir -p components/features
touch components/features/TaskItem.tsx

# 2. 创建 API 端点
mkdir -p lib/api/endpoints
touch lib/api/endpoints/tasks.ts

# 3. 创建自定义 Hook
mkdir -p hooks
touch hooks/useTasks.ts

# 4. 创建页面
# Next.js App Router 会自动识别 app/ 目录下的页面
```

### 3. 常用命令

**前端**:
```bash
npm run dev          # 开发服务器
npm run build        # 生产构建
npm run start        # 启动生产服务器
npm run lint         # 代码检查
npm run type-check   # 类型检查
```

**后端**:
```bash
go run main.go       # 运行服务
go build             # 编译二进制
docker-compose up -d # Docker 启动
docker logs -f todo-service  # 查看日志
```

---

## 项目结构建议

### 前端目录结构

```
frontend/
├── app/
│   ├── (dashboard)/        # 主应用
│   │   ├── layout.tsx      # 包含 Sidebar 的布局
│   │   ├── projects/       # 项目列表页
│   │   └── projects/[id]/  # 项目详情页
│   ├── layout.tsx          # 根布局
│   ├── page.tsx            # 首页
│   └── providers.tsx       # React Query Provider
├── components/
│   ├── ui/                 # 基础组件
│   ├── layout/             # 布局组件（Sidebar）
│   └── features/           # 功能组件
├── hooks/
│   ├── useAuth.ts
│   ├── useProjects.ts
│   └── useTasks.ts
├── lib/
│   ├── api/
│   │   ├── client.ts
│   │   └── endpoints/
│   ├── design-tokens/
│   └── utils/
├── store/
│   ├── authStore.ts
│   └── uiStore.ts
└── .env.local
```

---

## 设计系统集成

### 1. 配置 Tailwind CSS

编辑 `frontend/tailwind.config.js`:
```javascript
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // DesignTokens 颜色
        primary: {
          DEFAULT: '#2563EB',
          50: '#EFF6FF',
          100: '#DBEAFE',
          // ...
        },
      },
      spacing: {
        // DesignTokens 间距
        'xs': '4px',
        'sm': '8px',
        'md': '16px',
        'lg': '24px',
        'xl': '32px',
      },
    },
  },
  plugins: [],
}
```

### 2. 使用 DesignTokens

```tsx
// ✅ 正确：使用 Tailwind 类名
<div className="bg-primary text-white p-md rounded-lg">
  <Button variant="primary" size="md">提交</Button>
</div>

// ❌ 错误：硬编码样式
<div style={{ backgroundColor: '#2563EB', padding: '16px' }}>
  <button style={{ color: 'white' }}>提交</button>
</div>
```

---

## 故障排查

### 后端连接失败

1. 检查后端是否运行：
   ```bash
   curl http://localhost:8081/todo/v1/public/health
   ```

2. 检查数据库连接：
   ```bash
   cd server
   docker-compose ps
   ```

3. 查看后端日志：
   ```bash
   docker logs -f todo-service
   ```

### CORS 错误

确保后端 `.env` 配置了正确的 CORS：
```env
CORS_ALLOW_ORIGINS=http://localhost:3000
```

### 前端环境变量不生效

1. 确保环境变量以 `NEXT_PUBLIC_` 开头
2. 重启开发服务器（修改环境变量后需要重启）

---

## 下一步

1. **阅读 API 文档**: 查看 `server/api/README.md` 了解后端 API
2. **查看设计规范**: 查看 `specs/main/design/` 了解 UI 设计
3. **开始开发**: 参考 `specs/main/plan.md` 的项目结构开始实现

---

**版本**: 1.0.0  
**最后更新**: 2024-12-19
