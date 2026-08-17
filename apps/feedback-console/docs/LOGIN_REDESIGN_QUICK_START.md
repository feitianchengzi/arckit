# 登录流程重设计 - 快速启动指南

> 🤖 **面向弱AI开发者**：本文档提供最简洁的开发路径，让你快速开始工作。

---

## 📖 文档索引

在开始之前，了解文档体系：

| 文档 | 用途 | 何时查看 |
|------|------|----------|
| **本文档** | 快速启动和总览 | 开始开发前必读 |
| [UI设计规范](./LOGIN_REDESIGN_UI_SPEC.md) | 详细的UI设计规范 | 开发组件时参考 |
| [编码实现指导](./LOGIN_REDESIGN_IMPLEMENTATION_GUIDE.md) | 逐步实现指导 | 开发过程中参考 |
| [业务总结](../../../server/login业务总结.md) | 业务需求和流程 | 需要理解业务时 |

---

## 🎯 核心变更总结

### 旧流程 vs 新流程

| 项目 | 旧流程 | 新流程 |
|------|--------|--------|
| 认证方式 | 用户名 + 密码 | 邮箱/手机号 + 验证码 |
| 注册方式 | 独立注册页面 | 登录时自动注册 |
| 首次登录 | 直接进入应用 | 弹窗设置用户名和头像 |
| Token管理 | 手动管理 | 自动刷新 |
| 页面数量 | 2个（登录+注册） | 1个（登录） |

---

## 🚀 5分钟快速开始

### 步骤 1: 理解新登录流程（1分钟）

```
用户访问 → 输入邮箱/手机号 → 点击"发送验证码" 
→ 输入验证码 → 点击"登录" → [首次?] 
→ 是：弹窗设置用户名和头像 → 进入应用
→ 否：直接进入应用
```

### 步骤 2: 查看需要创建的文件（1分钟）

**必须创建**:
```
✨ types/auth.ts                          - 类型定义
✨ lib/utils/validators.ts                - 验证工具
✨ lib/utils/tokenManager.ts              - Token管理
✨ lib/api/endpoints/gateway.ts           - 网关API
✨ components/ui/Dialog.tsx               - 对话框组件
✨ components/ui/VerificationCodeInput.tsx - 验证码输入
✨ components/ui/AvatarUpload.tsx         - 头像上传
✨ components/features/FirstTimeSetupDialog.tsx - 首次设置对话框
```

**必须修改**:
```
🔧 store/authStore.ts                    - 状态管理
🔧 hooks/useAuth.ts                      - 认证Hooks
🔧 lib/api/client.ts                     - API拦截器
🔧 lib/api/endpoints/auth.ts             - TODO后端API
🔧 app/(auth)/login/page.tsx             - 登录页面
🔧 app/(auth)/register/page.tsx          - 改为重定向
🔧 middleware.ts                         - 中间件
🔧 app/layout.tsx                        - 根布局
```

### 步骤 3: 按顺序开发（3分钟阅读计划）

**推荐顺序**:

```
第1天: 基础设施 ✅
  1. 创建 types/auth.ts
  2. 创建 validators.ts
  3. 创建 tokenManager.ts

第2天: API层 ✅
  4. 创建 gateway.ts
  5. 修改 auth.ts
  6. 修改 client.ts (添加自动刷新)

第3天: 状态和Hooks ✅
  7. 修改 authStore.ts
  8. 修改 useAuth.ts

第4天: UI组件 ✅
  9. 创建 Dialog.tsx
  10. 创建 VerificationCodeInput.tsx
  11. 创建 AvatarUpload.tsx
  12. 创建 FirstTimeSetupDialog.tsx

第5天: 页面 ✅
  13. 重写 login/page.tsx
  14. 修改 register/page.tsx
  15. 更新 middleware.ts
  16. 更新 layout.tsx

第6天: 测试和优化 ✅
  17. 功能测试
  18. 错误处理测试
  19. 响应式测试
  20. 代码优化
```

---

## 🔑 关键概念速查

### 1. Token 自动管理机制

```typescript
// 每次API请求前自动检查
if (Token即将过期) {
  → 调用刷新接口
  → 获取新Token
  → 保存到localStorage
  → 继续原请求
}
```

**关键文件**: `lib/utils/tokenManager.ts`, `lib/api/client.ts`

---

### 2. 智能识别邮箱/手机号

```typescript
// 用户输入: "user@example.com"
detectInputType() → "email"

// 用户输入: "13800138000"
detectInputType() → "sms"
```

**关键文件**: `lib/utils/validators.ts`

---

### 3. 自动注册逻辑

```
用户登录 → 网关检查用户是否存在
→ 不存在：自动创建 + 返回Token
→ 存在：直接返回Token

前端收到Token → 调用TODO后端创建用户接口
→ 已存在：返回现有用户
→ 不存在：创建新用户
```

**关键文件**: `hooks/useAuth.ts`

---

### 4. 首次设置检测

```typescript
登录成功 → 检查 user.username
→ null: 弹出设置对话框
→ 有值: 直接进入应用
```

**关键文件**: `app/(auth)/login/page.tsx`, `components/features/FirstTimeSetupDialog.tsx`

---

## 📋 开发检查清单

### 开始前

- [ ] 阅读本文档（5分钟）
- [ ] 浏览 UI设计规范文档（10分钟）
- [ ] 准备开发环境（Node.js, npm）

### 开发中

- [ ] 创建所有必需的新文件
- [ ] 修改所有需要更新的文件
- [ ] 代码通过 TypeScript 类型检查
- [ ] 代码通过 ESLint 检查
- [ ] 所有导入路径正确

### 完成后

- [ ] 在浏览器中测试登录流程
- [ ] 测试首次登录设置
- [ ] 测试Token自动刷新
- [ ] 测试错误处理
- [ ] 测试响应式布局

---

## 🛠️ 开发环境设置

### 1. 安装依赖（如果缺失）

```bash
cd frontend
npm install @headlessui/react @heroicons/react
```

### 2. 创建环境变量文件

创建 `frontend/.env.local`:

```bash
# 开发模式
NODE_ENV=development

# 网关地址（开发模式会使用mock，这里配置生产地址即可）
NEXT_PUBLIC_GATEWAY_URL=https://gateway.example.com

# TODO 后端地址
NEXT_PUBLIC_API_URL=http://localhost:3000
```

### 3. 启动开发服务器

```bash
npm run dev
```

访问: http://localhost:3000/login

---

## 🧪 开发模式测试说明

### 验证码

在开发模式下，验证码固定为 **`123456`**，无需真实发送。

### Mock 数据

所有网关接口在开发模式下返回 mock 数据：

```typescript
// 登录成功返回
{
  success: true,
  data: {
    user: { id: "dev-uuid", email: "...", username: null },
    tokens: {
      access_token: "dev-access-token-...",
      refresh_token: "dev-refresh-token-...",
      expires_in: 7200
    }
  }
}
```

### 测试账号

任意邮箱/手机号都可以登录，验证码统一使用 `123456`。

---

## 💡 代码示例速查

### 发送验证码

```typescript
const sendCode = useSendVerificationCode()

await sendCode.mutateAsync({
  code_type: 'email',
  target: 'user@example.com',
  purpose: 'login',
})
```

### 登录

```typescript
const login = useLogin()

await login.mutateAsync({
  email: 'user@example.com',
  code: '123456',
  code_type: 'email',
  purpose: 'login',
})
```

### 检查Token是否过期

```typescript
import { shouldRefreshToken } from '@/lib/utils/tokenManager'

if (shouldRefreshToken()) {
  // 需要刷新
}
```

### 智能识别输入类型

```typescript
import { detectInputType } from '@/lib/utils/validators'

const type = detectInputType('user@example.com')
// type === 'email'

const type2 = detectInputType('13800138000')
// type2 === 'sms'
```

---

## ⚠️ 常见错误速查

### 错误 1: "Cannot use localStorage in SSR"

**原因**: 在服务端渲染时使用了 localStorage  
**解决**: 添加检查

```typescript
if (typeof window !== 'undefined') {
  localStorage.setItem(...)
}
```

### 错误 2: "Module not found: @/types/auth"

**原因**: TypeScript 路径别名配置  
**解决**: 确保 `tsconfig.json` 中有：

```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./*"]
    }
  }
}
```

### 错误 3: 验证码按钮一直显示倒计时

**原因**: 倒计时状态没有正确重置  
**解决**: 检查 `VerificationCodeInput.tsx` 中的 useEffect

### 错误 4: 登录后没有弹出设置对话框

**原因**: 用户名检查逻辑错误  
**解决**: 检查登录成功后的用户状态判断

```typescript
// 正确的检查方式
if (!user || !user.username) {
  setShowSetupDialog(true)
}
```

---

## 📊 开发进度追踪

复制下面的清单到你的开发笔记中，完成一项打勾一项：

```markdown
## 基础设施 (Day 1)
- [ ] types/auth.ts
- [ ] lib/utils/validators.ts
- [ ] lib/utils/tokenManager.ts

## API层 (Day 2)
- [ ] lib/api/endpoints/gateway.ts
- [ ] lib/api/endpoints/auth.ts (修改)
- [ ] lib/api/client.ts (修改)

## 状态和Hooks (Day 3)
- [ ] store/authStore.ts (修改)
- [ ] hooks/useAuth.ts (修改)

## UI组件 (Day 4)
- [ ] components/ui/Dialog.tsx
- [ ] components/ui/VerificationCodeInput.tsx
- [ ] components/ui/AvatarUpload.tsx
- [ ] components/features/FirstTimeSetupDialog.tsx

## 页面 (Day 5)
- [ ] app/(auth)/login/page.tsx (重写)
- [ ] app/(auth)/register/page.tsx (修改)
- [ ] middleware.ts (修改)
- [ ] app/layout.tsx (修改)

## 测试 (Day 6)
- [ ] 功能测试
- [ ] 错误处理测试
- [ ] 响应式测试
- [ ] 代码优化
```

---

## 🎓 学习资源

如果遇到不熟悉的技术，参考：

- **TypeScript**: https://www.typescriptlang.org/docs/
- **React Hooks**: https://react.dev/reference/react
- **Next.js App Router**: https://nextjs.org/docs/app
- **React Query**: https://tanstack.com/query/latest/docs/react/overview
- **Zustand**: https://zustand-demo.pmnd.rs/
- **Tailwind CSS**: https://tailwindcss.com/docs

---

## 🆘 需要帮助？

### 卡在某个步骤？

1. 查看详细的编码实现指导文档
2. 检查代码示例
3. 查看浏览器控制台错误
4. 搜索错误信息

### 不理解业务逻辑？

1. 查看登录业务总结文档
2. 查看网关接口文档
3. 查看UI设计规范文档

### 不确定UI如何实现？

1. 查看UI设计规范文档
2. 参考现有组件代码
3. 查看Tailwind CSS文档

---

## ✅ 完成标志

当你可以完成以下操作时，说明开发完成：

1. ✅ 访问 `/login` 页面，看到新的验证码登录界面
2. ✅ 输入邮箱，点击发送验证码，看到倒计时
3. ✅ 输入验证码 `123456`，点击登录，成功登录
4. ✅ 首次登录弹出设置对话框，可以设置用户名和头像
5. ✅ 设置完成后跳转到主页
6. ✅ 再次访问 `/login`，自动跳转到主页（已登录）
7. ✅ 退出登录，可以重新登录

---

## 🚀 开始开发！

现在你已经了解了所有必要信息，可以开始开发了！

**推荐开发流程**:

1. ⭐ 先阅读 [编码实现指导文档](./LOGIN_REDESIGN_IMPLEMENTATION_GUIDE.md) 的"阶段1"
2. 创建第一个文件 `types/auth.ts`
3. 运行 `npm run dev` 确保没有类型错误
4. 继续下一个文件...
5. 遇到问题时查看"常见错误速查"
6. 完成一个阶段后进行测试

**记住**: 
- 📖 详细实现请看完整的编码实现指导文档
- 🎨 UI细节请看UI设计规范文档
- 💡 本文档只是快速启动指南

祝开发顺利！🎉

