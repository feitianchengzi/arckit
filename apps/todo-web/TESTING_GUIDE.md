# 前端测试指南

## 🎯 测试方案

由于后端采用**网关统一认证架构**，前端无法直接调用后端 API。有以下几种测试方案：

---

## 方案一：启动后端 + Mock 网关（推荐用于完整功能测试）

### 1. 启动后端服务

```bash
# 进入后端目录
cd ../server

# 方式 A: 使用 Docker Compose（推荐）
# 1. 复制环境变量文件
cp env.example .env
# 2. 编辑 .env 文件，配置数据库密码等
# 3. 运行部署脚本
chmod +x deploy.sh
./deploy.sh

# 方式 B: 本地运行（需要 PostgreSQL）
# 设置环境变量
export PORT=8081
export HOST=0.0.0.0
export SERVICE_NAME=todo
export DB_HOST=localhost
export DB_PORT=5432
export DB_USER=postgres
export DB_PASSWORD=postgres
export DB_NAME=todo

# 运行服务
go run main.go
```

### 2. 验证后端运行

```bash
# 健康检查
curl http://localhost:8081/todo/v1/public/health
```

### 3. 修改前端 API 客户端以支持开发模式

由于后端需要网关认证，我们需要在开发模式下**模拟网关行为**。修改 `frontend/lib/api/client.ts`，添加开发模式支持：

**在开发模式下，前端可以直接设置 Header `X-User-ID` 和 `X-User-Username` 来模拟已认证用户。**

### 4. 创建测试用户和项目

使用 curl 创建测试数据：

```bash
# 创建用户（需要设置 Header）
curl -X POST "http://localhost:8081/todo/v1/user/users" \
  -H "X-User-ID: 11111111-1111-1111-1111-111111111111" \
  -H "X-User-Username: testuser" \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","avatar":"https://example.com/avatar.png"}'

# 创建项目
curl -X POST "http://localhost:8081/todo/v1/user/projects" \
  -H "X-User-ID: 11111111-1111-1111-1111-111111111111" \
  -H "X-User-Username: testuser" \
  -H "Content-Type: application/json" \
  -d '{"name":"测试项目","git_url":"https://github.com/test/project.git"}'
```

---

## 方案二：Mock 模式（推荐用于 UI 开发）

创建一个 Mock API 拦截器，让前端可以在没有后端的情况下测试 UI。

### 1. 安装 Mock Service Worker

```bash
cd frontend
npm install -D msw@latest
```

### 2. 创建 Mock Handler

创建 `frontend/mocks/handlers.ts`：

```typescript
import { http, HttpResponse } from 'msw'

export const handlers = [
  // Mock 登录
  http.post('/todo/v1/public/login', async ({ request }) => {
    const body = await request.json()
    return HttpResponse.json({
      token: 'mock-token-12345',
      user: {
        id: 1,
        username: body.username,
        avatar: 'https://example.com/avatar.png',
      },
    })
  }),

  // Mock 注册
  http.post('/todo/v1/public/register', async ({ request }) => {
    const body = await request.json()
    return HttpResponse.json({
      token: 'mock-token-12345',
      user: {
        id: 1,
        username: body.username,
        avatar: 'https://example.com/avatar.png',
      },
    })
  }),

  // Mock 当前用户
  http.get('/todo/v1/user/info', () => {
    return HttpResponse.json({
      id: 1,
      username: 'testuser',
      avatar: 'https://example.com/avatar.png',
    })
  }),

  // Mock 项目列表
  http.get('/todo/v1/user/projects', () => {
    return HttpResponse.json([
      {
        id: 1,
        name: '测试项目 1',
        git_url: 'https://github.com/test/project1.git',
        created_at: '2024-01-01T12:00:00Z',
        updated_at: '2024-01-01T12:00:00Z',
      },
      {
        id: 2,
        name: '测试项目 2',
        git_url: 'https://github.com/test/project2.git',
        created_at: '2024-01-02T12:00:00Z',
        updated_at: '2024-01-02T12:00:00Z',
      },
    ])
  }),

  // Mock 任务列表
  http.get('/todo/v1/user/projects/:projectId/tasks', () => {
    return HttpResponse.json([
      {
        id: 1,
        content: '这是第一个任务，内容比较长，用来测试显示效果',
        state: 'pending',
        executor_id: 1,
        creator_id: 1,
        project_id: 1,
        father_id: null,
        created_at: '2024-01-01T12:00:00Z',
        updated_at: '2024-01-01T12:00:00Z',
        completion_at: null,
      },
      {
        id: 2,
        content: '第二个任务，状态为进行中',
        state: 'in_progress',
        executor_id: 1,
        creator_id: 1,
        project_id: 1,
        father_id: null,
        created_at: '2024-01-02T12:00:00Z',
        updated_at: '2024-01-02T12:00:00Z',
        completion_at: null,
      },
    ])
  }),
]
```

### 3. 设置 Mock Service Worker

在 `frontend/app/providers.tsx` 中初始化 MSW（仅在开发模式）：

```typescript
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  // 动态导入 MSW
  import('@/mocks').then(({ worker }) => {
    worker.start({
      onUnhandledRequest: 'bypass', // 未处理的请求直接通过
    })
  })
}
```

---

## 方案三：修改前端以适配后端架构（长期方案）

### 问题分析

当前前端实现期望有 `/public/login` 和 `/public/register` 接口，但后端是网关统一认证架构：
- 后端没有登录/注册接口
- 后端需要通过网关获取 JWT token
- 后端通过 Header `X-User-ID` 识别用户

### 解决方案

1. **开发模式：直接设置 Header**
   - 修改 API 客户端，在开发模式下自动设置 `X-User-ID` 和 `X-User-Username`
   - 使用固定的测试用户 UUID

2. **生产模式：通过网关**
   - 前端需要先调用网关的登录接口获取 JWT
   - 然后在请求 Header 中携带 JWT token
   - 网关验证后转发请求到后端并添加 `X-User-ID` Header

### 修改 API 客户端

在 `frontend/lib/api/client.ts` 中：

```typescript
// 开发模式：直接设置 Header（绕过网关）
if (process.env.NODE_ENV === 'development') {
  apiClient.interceptors.request.use((config) => {
    // 从 localStorage 获取测试用户信息，如果没有则使用默认值
    const testUserId = localStorage.getItem('dev_user_id') || '11111111-1111-1111-1111-111111111111'
    const testUsername = localStorage.getItem('dev_username') || 'testuser'
    
    config.headers['X-User-ID'] = testUserId
    config.headers['X-User-Username'] = testUsername
    return config
  })
}
```

---

## 🚀 快速开始（推荐使用方案一）

### 步骤 1: 启动后端

```bash
cd server
cp env.example .env
# 编辑 .env，设置数据库密码
./deploy.sh
```

### 步骤 2: 修改前端 API 客户端以支持开发模式

修改 `frontend/lib/api/client.ts`，添加开发模式 Header 支持。

### 步骤 3: 创建测试用户

```bash
curl -X POST "http://localhost:8081/todo/v1/user/users" \
  -H "X-User-ID: 11111111-1111-1111-1111-111111111111" \
  -H "X-User-Username: testuser" \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser"}'
```

### 步骤 4: 启动前端

```bash
cd frontend
npm run dev
```

### 步骤 5: 测试登录流程

由于后端没有 `/public/login` 接口，我们需要：
1. 在开发模式下，前端自动使用测试用户 UUID
2. 直接进入应用，跳过登录页面
3. 或者修改登录页面，在开发模式下自动"登录"

---

## 📝 注意事项

1. **网关依赖**：生产环境必须通过网关访问后端
2. **认证流程**：开发环境需要模拟网关行为
3. **用户创建**：后端会根据 `X-User-ID` Header 自动创建用户（如果不存在）
4. **数据持久化**：使用 Docker Compose 时，数据库数据会持久化在 Volume 中

---

## 🔧 故障排查

### 后端无法启动

```bash
# 检查 Docker 是否运行
docker ps

# 检查端口是否被占用
lsof -i :8081

# 查看后端日志
cd server
docker logs todo-service
```

### 前端无法连接后端

```bash
# 检查后端健康状态
curl http://localhost:8081/todo/v1/public/health

# 检查前端环境变量
cat frontend/.env.local
```

### 认证失败

- 确保开发模式下 API 客户端设置了 `X-User-ID` Header
- 检查后端日志，查看是否有认证错误

