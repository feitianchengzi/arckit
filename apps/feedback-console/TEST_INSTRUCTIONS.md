# 🧪 测试说明

## 当前状态

✅ **前端已配置开发模式适配**，可以直接测试 UI 功能，无需启动后端。

## 快速测试步骤

### 1. 启动前端（必须）

```bash
cd frontend
npm run dev
```

访问：http://localhost:3000

### 2. 测试登录

- 访问登录页面
- **输入任意用户名和密码**（例如：`testuser` / `password`）
- 点击"登录"
- **开发模式下会自动"登录"成功**，跳转到项目列表

### 3. 测试功能（UI 层面）

登录后可以测试所有 UI 功能：

- ✅ 项目列表页面
- ✅ 创建项目表单
- ✅ 项目详情页面
- ✅ 创建任务表单
- ✅ 任务列表显示
- ✅ 任务详情页面
- ✅ 状态徽章显示
- ✅ 导航和布局

**注意**：如果后端未启动，API 调用会失败，但 UI 可以正常展示和交互。

---

## 完整功能测试（需要后端）

如果想测试完整的数据流，需要启动后端：

### 步骤 1: 启动后端

```bash
cd ../server
cp env.example .env
# 编辑 .env，设置数据库密码（如果需要）
./deploy.sh
```

### 步骤 2: 验证后端运行

```bash
curl http://localhost:8081/todo/v1/public/health
```

应该返回：
```json
{"status":"ok","timestamp":"...","service":"todo"}
```

### 步骤 3: 测试完整流程

1. 登录后会自动调用后端创建用户
2. 创建项目会真正保存到数据库
3. 创建任务会真正保存到数据库
4. 所有数据操作都会与后端交互

---

## 开发模式特性

### 自动 Header 设置

开发模式下，所有 API 请求会自动添加：

```
X-User-ID: <从 localStorage 或默认值>
X-User-Username: <从 localStorage 或 'testuser'>
```

这模拟了网关的行为，让前端可以直接调用后端 API。

### 登录流程

1. 用户在登录页面输入用户名和密码
2. 前端生成 UUID（基于用户名）
3. 存储到 localStorage（`dev_user_id`, `dev_username`）
4. 如果后端已启动，自动调用 `/user/users` 创建用户
5. 如果后端未启动，返回 mock 数据
6. 后续所有请求自动携带 Header

---

## 故障排查

### 问题：登录后无法进入应用

**检查**：
1. 打开浏览器控制台（F12）
2. 查看是否有错误
3. 检查 localStorage 中是否有 `auth_token`

**解决**：
- 清除 localStorage 后重新登录
- 检查 middleware.ts 是否正确配置

### 问题：API 调用失败

**这是正常的**，如果后端未启动：
- UI 功能仍然可以测试
- API 调用会失败，但不会影响 UI 展示
- 如果想测试完整功能，需要启动后端

### 问题：后端启动失败

参考 `../server/README.md` 或 `QUICK_START.md`

---

## 相关文档

- [QUICK_START.md](./QUICK_START.md) - 快速开始指南
- [TESTING_GUIDE.md](./TESTING_GUIDE.md) - 详细测试方案
