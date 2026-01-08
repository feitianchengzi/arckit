# frontend/ - 前端开发目录

**用途**: 待办管理系统的 Web 前端，基于 React + Next.js 14 (App Router)

---

## 📁 目录结构

```
frontend/
├── app/                 # Next.js App Router（页面和路由）
├── components/          # React 组件（ui、layout、features）
├── hooks/               # 自定义 Hooks（业务逻辑封装）
├── lib/                 # 工具库（API、DesignTokens、utils）
├── store/               # Zustand 状态管理（客户端状态）
├── public/              # 静态资源（图片、字体、图标）
├── package.json         # 依赖配置（待创建）
├── next.config.js       # Next.js 配置（待创建）
├── tailwind.config.js   # Tailwind 配置（待创建）
├── tsconfig.json        # TypeScript 配置（待创建）
└── README.md            # 本文件
```

每个子目录都有详细的 README 说明文档。

---

## 🚀 快速开始

### 前置要求

- **Node.js**: 18.17+ 或 20.0+
- **包管理器**: npm, yarn, 或 pnpm
- **后端**: Go 后端需要先启动（参考 `../server/README.md`）

### 1. 初始化项目

```bash
# 进入前端目录
cd frontend

# 使用 create-next-app 初始化项目（在当前目录）
npx create-next-app@latest . --typescript --tailwind --app

# 选项：
# ✅ TypeScript
# ✅ ESLint
# ✅ Tailwind CSS
# ✅ `src/` directory: No（我们使用 app/ 目录）
# ✅ App Router: Yes
# ✅ Import alias (@/*): Yes
```

### 2. 安装依赖

```bash
# 核心依赖
npm install axios @tanstack/react-query zustand

# UI 组件库
npm install @headlessui/react @radix-ui/react-dropdown-menu @radix-ui/react-dialog

# 表单和验证
npm install react-hook-form zod @hookform/resolvers

# 国际化
npm install react-i18next i18next

# 开发依赖
npm install -D @types/node @types/react @types/react-dom
```

### 3. 配置环境变量

```bash
# 创建 .env.local 文件
cat > .env.local << EOF
# 后端 API 地址
NEXT_PUBLIC_API_URL=http://localhost:8081/todo/v1

# 网关地址（如果需要）
NEXT_PUBLIC_GATEWAY_URL=http://localhost:8080
EOF
```

### 4. 启动开发服务器

```bash
# 确保后端已启动（在另一个终端）
cd ../server && ./deploy.sh

# 启动前端开发服务器
npm run dev

# 访问 http://localhost:3000
```

---

## 📚 开发指南

### 目录说明

1. **[app/README.md](app/README.md)** - Next.js App Router 说明
   - 路由规则和文件结构
   - 动态路由使用
   - 布局嵌套
   - 路由组概念

2. **[components/README.md](components/README.md)** - 组件开发指南
   - 组件分类（ui、layout、features）
   - 组件开发规范
   - DesignTokens 使用
   - 无障碍支持

3. **[hooks/README.md](hooks/README.md)** - 自定义 Hooks 说明
   - API Hooks（useAuth、useProjects、useTasks）
   - UI Hooks（useToast、useDialog）
   - 工具 Hooks（useDebounce、useLocalStorage）

4. **[lib/README.md](lib/README.md)** - 工具库说明
   - API 客户端配置
   - DesignTokens 定义
   - 工具函数
   - 国际化配置
   - 表单验证 Schema

5. **[store/README.md](store/README.md)** - 状态管理说明
   - authStore（认证状态）
   - uiStore（UI 状态）
   - Zustand 使用指南

6. **[public/README.md](public/README.md)** - 静态资源说明
   - 文件命名规范
   - 图片优化
   - Favicon 配置

### 开发流程

#### 1. 实现基础设施（Phase 1-2）

```bash
# 1. 配置 Tailwind（集成 DesignTokens）
# 编辑 tailwind.config.js

# 2. 实现 DesignTokens
touch lib/design-tokens/tokens.css
touch lib/design-tokens/tokens.ts

# 3. 创建 API 客户端
touch lib/api/client.ts
mkdir lib/api/endpoints

# 4. 创建 Zustand stores
touch store/authStore.ts
touch store/uiStore.ts

# 5. 实现基础组件（16+ 个）
# 参考 components/README.md
```

#### 2. 实现用户故事（Phase 3-9）

按照 `../specs/main/tasks.md` 中的任务顺序开发：

```bash
# Phase 3: US1 - 用户认证
# - 登录页面 app/(auth)/login/page.tsx
# - 注册页面 app/(auth)/register/page.tsx
# - useAuth Hook

# Phase 4: US2 - 项目管理
# - 项目列表页面 app/(dashboard)/projects/page.tsx
# - 创建项目页面 app/(dashboard)/projects/new/page.tsx
# - useProjects Hook

# Phase 5: US3 - 任务管理
# - 任务列表页面（集成在项目详情中）
# - 创建任务页面
# - useTasks Hook

# ... 依此类推
```

#### 3. 组件开发流程

```bash
# 1. 查看设计规范
open ../specs/main/design/components/button.md
open ../specs/main/design/wireframes/demo.html

# 2. 创建组件文件
touch components/ui/Button.tsx

# 3. 实现组件（遵循 DesignTokens，支持无障碍）

# 4. 在页面中使用
# import { Button } from '@/components/ui/Button'
```

---

## 🎨 设计系统

### DesignTokens

所有设计值必须从 DesignTokens 读取，不允许硬编码：

```tsx
// ✅ 正确：使用 Tailwind 类名（基于 DesignTokens）
<button className="bg-primary text-white px-md py-sm rounded-md hover:bg-primary-600">
  提交
</button>

// ❌ 错误：硬编码样式
<button style={{ backgroundColor: '#2563EB', padding: '8px 16px' }}>
  提交
</button>
```

### 组件规范

- **位置**: `../specs/main/design/components/`
- **线框图**: `../specs/main/design/wireframes/`
- **视觉设计**: `../specs/main/design/visual-design.md`
- **交互设计**: `../specs/main/design/interaction-design.md`

---

## 🏗️ 技术栈

| 类别 | 技术 | 版本 | 用途 |
|------|------|------|------|
| **框架** | React | 18+ | UI 框架 |
| | Next.js | 14+ | 应用框架（App Router）|
| | TypeScript | 5+ | 类型安全 |
| **样式** | Tailwind CSS | 3+ | 工具类样式 |
| | CSS Variables | - | DesignTokens |
| **状态管理** | Zustand | 4+ | 客户端状态 |
| | React Query | 5+ | 服务端状态 |
| **HTTP** | Axios | 1+ | API 调用 |
| **表单** | React Hook Form | 7+ | 表单处理 |
| | Zod | 3+ | 表单验证 |
| **国际化** | react-i18next | 14+ | 多语言支持 |
| **UI 组件** | Headless UI | 2+ | 无障碍组件 |
| | Radix UI | 1+ | 组件原语 |

---

## 📋 开发任务

### 任务清单

所有开发任务详见 `../specs/main/tasks.md`（87 个任务）：

- **Phase 1**: Setup（8 个任务）- 项目初始化
- **Phase 2**: Foundation（14 个任务）- 基础组件和工具
- **Phase 3**: US1 - 用户认证（6 个任务）- P1 优先级
- **Phase 4**: US2 - 项目管理（10 个任务）- P1 优先级
- **Phase 5**: US3 - 任务管理（12 个任务）- P1 优先级
- **Phase 6**: US4 - 编辑任务（6 个任务）- P2 优先级
- **Phase 7**: US5 - 邀请成员（9 个任务）- P2 优先级
- **Phase 8**: US6 - 子任务（7 个任务）- P3 优先级
- **Phase 9**: US7 - 任务流转（6 个任务）- P3 优先级
- **Phase 10**: Polish（9 个任务）- 优化和国际化

### 当前状态

- ✅ 目录结构已创建
- ✅ README 文档已完成
- ⏳ Next.js 项目待初始化
- ⏳ 基础设施待实现
- ⏳ 功能开发待开始

---

## 🔗 API 对接

### 后端 API

- **基础 URL**: `http://localhost:8081/todo/v1`
- **认证方式**: JWT Token（通过网关）
- **API 文档**: `../server/api/README.md`
- **对接指南**: `../specs/main/contracts/frontend-backend-api.md`

### 字段映射

前端使用 `Todo` 模型，后端使用 `Task` 模型，需要进行字段映射：

| 前端（Todo） | 后端（Task） | 说明 |
|-------------|-------------|------|
| `title` | - | 从 `content` 截取前 50 字符 |
| `content` | `content` | 任务内容 |
| `status` | `state` | 状态（需映射） |
| `assigneeId` | `executor_id` | 执行者 ID |
| `parentId` | `father_id` | 父任务 ID |

详见 `lib/utils/taskMapper.ts`（待实现）

---

## 🧪 测试

### 测试策略

每个组件和 Hook 都应包含：

1. **单元测试**（Vitest + React Testing Library）
2. **无障碍测试**（键盘导航、屏幕阅读器）
3. **集成测试**（页面级别）

```bash
# 安装测试依赖（待定）
npm install -D vitest @testing-library/react @testing-library/jest-dom

# 运行测试
npm run test
```

---

## 📖 参考文档

### 项目文档

- **项目总览**: `../README.md`
- **架构说明**: `../ARCHITECTURE.md`
- **技术选型**: `../TECH_STACK.md`

### 规格文档

- **功能规格**: `../specs/main/spec.md`
- **实现计划**: `../specs/main/plan.md`
- **任务清单**: `../specs/main/tasks.md`
- **数据模型**: `../specs/main/data-model.md`
- **快速开始**: `../specs/main/quickstart.md`

### 设计文档

- **设计总览**: `../specs/main/design/overview.md`
- **设计摘要**: `../specs/main/design/summary.md`
- **视觉设计**: `../specs/main/design/visual-design.md`
- **交互设计**: `../specs/main/design/interaction-design.md`
- **组件规范**: `../specs/main/design/components/`
- **线框原型**: `../specs/main/design/wireframes/`

---

## 🎯 开发原则

1. **类型安全**: 全面使用 TypeScript，避免 `any`
2. **DesignTokens 驱动**: 所有设计值从 DesignTokens 读取
3. **无障碍优先**: 支持键盘导航和屏幕阅读器（WCAG 2.1 AA）
4. **性能优化**: 60fps UI 流畅度，<100ms 响应时间
5. **代码复用**: 组件和 Hooks 高度模块化
6. **测试覆盖**: 关键功能必须有测试

---

## 📞 获取帮助

- **后端问题**: 查看 `../server/README.md`
- **设计问题**: 查看 `../specs/main/design/`
- **API 对接**: 查看 `../specs/main/contracts/frontend-backend-api.md`
- **任务详情**: 查看 `../specs/main/tasks.md`

---

**最后更新**: 2024-12-19  
**版本**: 1.0.0  
**状态**: 待开始开发

