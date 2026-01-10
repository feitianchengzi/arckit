# 快速开始 - 测试前端功能

## 🚀 快速测试方案（无需启动后端）

由于后端采用网关统一认证架构，前端代码已经做了**开发模式适配**，可以直接测试 UI 功能。

### 步骤 1: 启动后端（可选，用于完整功能测试）

如果想测试完整的后端交互，需要启动后端：

```bash
# 进入后端目录
cd ../server

# 使用 Docker Compose 启动（推荐）
cp env.example .env
# 编辑 .env，设置数据库密码
./deploy.sh

# 验证后端运行
curl http://localhost:8081/todo/v1/public/health
```

**如果后端未启动**，前端仍然可以运行，但 API 调用会失败（这是正常的，用于 UI 测试）。

### 步骤 2: 启动前端

```bash
cd frontend
npm run dev
```

访问：http://localhost:3000

### 步骤 3: 测试登录

在登录页面，输入任意用户名和密码即可"登录"：

- **开发模式下**，登录不会真正调用后端
- 前端会自动设置测试用户信息（`dev_user_id` 和 `dev_username`）
- 如果后端已启动，登录后会自动调用后端接口创建用户

**测试账号**（任意）：
- 用户名：`testuser`（或任意）
- 密码：`password`（或任意）

### 步骤 4: 测试功能

登录后可以测试：

1. **项目列表页面** (`/projects`)
   - 如果后端已启动，可以创建项目
   - 如果后端未启动，会显示错误（正常）

2. **创建项目** (`/projects/new`)
   - 填写项目名称和 Git URL
   - 如果后端已启动，会真正创建项目

3. **项目详情** (`/projects/[id]`)
   - 查看项目信息
   - 创建任务
   - 查看任务列表

4. **任务管理**
   - 创建任务
   - 查看任务详情
   - 编辑任务
   - 删除任务

---

## 📋 开发模式说明

### 自动 Header 设置

在开发模式下（`NODE_ENV === 'development'`），API 客户端会自动设置以下 Header：

```
X-User-ID: <从 localStorage 获取或使用默认 UUID>
X-User-Username: <从 localStorage 获取或使用 'testuser'>
```

这些 Header 模拟了网关的行为，让前端可以直接调用后端 API。

### 测试用户信息

测试用户信息存储在 `localStorage` 中：

- `dev_user_id`: 测试用户 UUID
- `dev_username`: 测试用户名
- `auth_token`: 开发模式 token（可选）

### 登录流程

1. 用户在登录页面输入用户名和密码
2. 开发模式下，前端直接：
   - 生成 UUID（基于用户名）
   - 存储到 localStorage
   - 如果后端已启动，调用 `/user/users` 创建用户
   - 返回 mock 用户信息
3. 后续所有 API 请求都会自动携带 `X-User-ID` Header

---

## 🔧 故障排查

### 问题 1: 登录后无法加载数据

**原因**：后端未启动

**解决**：
- 如果只想测试 UI，这是正常的（API 调用会失败）
- 如果想测试完整功能，需要启动后端（见步骤 1）

### 问题 2: 后端启动失败

**检查**：
```bash
# 检查 Docker 是否运行
docker ps

# 检查端口是否被占用
lsof -i :8081

# 查看后端日志
cd ../server
docker logs todo-service
```

### 问题 3: CORS 错误

**原因**：后端 CORS 配置未允许前端域名

**解决**：确保后端 `.env` 中设置了：
```
CORS_ALLOW_ORIGINS=http://localhost:3000
```

---

## 💡 提示

1. **UI 测试**：即使后端未启动，也可以测试所有 UI 组件和页面路由
2. **完整测试**：需要启动后端才能测试完整的数据流
3. **生产模式**：生产环境必须通过网关访问后端，不能直接设置 Header

---

## 📚 相关文档

- [完整测试指南](./TESTING_GUIDE.md) - 详细的测试方案和 Mock 数据配置
- [后端 README](../server/README.md) - 后端启动和配置说明
- [API 对接文档](../specs/main/contracts/frontend-backend-api.md) - 前后端 API 对接说明

