# Tasks: 待办管理系统

**Feature**: 待办管理系统（Todo Management System）  
**Branch**: `master`  
**Created**: 2024-12-19  
**Status**: In Progress

---

## 📋 Task Overview

**总任务数**: 83  
**完成数**: 0  
**进行中**: 0

### User Story Summary

| Story | Priority | Tasks | Status | Description |
|-------|----------|-------|--------|-------------|
| Setup | - | 8 | Pending | 项目初始化和配置 |
| Foundation | - | 14 | Pending | 基础组件和设计系统 |
| US1 | P1 | 6 | Pending | 用户注册和登录（与网关集成） |
| US2 | P1 | 10 | Pending | 创建和查看项目 |
| US3 | P1 | 12 | Pending | 创建和查看待办事项 |
| US4 | P2 | 6 | Pending | 编辑待办事项 |
| US5 | P2 | 9 | Pending | 项目邀请成员 |
| US6 | P3 | 7 | Pending | 创建和管理子待办 |
| US7 | P3 | 6 | Pending | 待办流转 |
| Polish | - | 5 | Pending | 优化和完善 |

---

## 🎯 Implementation Strategy

### MVP Scope (User Story 1)
最小可行产品包含：
- 项目基础设施（Setup + Foundation）
- 用户认证（与网关集成）

这为后续功能提供了基础，可以独立测试认证流程。

### Incremental Delivery
1. **Phase 1**: Setup → Foundation → US1（认证基础）
2. **Phase 2**: US2 + US3（项目和待办核心功能）
3. **Phase 3**: US4 + US5（编辑和协作功能）
4. **Phase 4**: US6 + US7（高级功能）
5. **Phase 5**: Polish（优化和完善）

---

## 📊 Dependencies

### User Story Completion Order

```
Setup (Phase 1)
  ↓
Foundation (Phase 2)
  ↓
US1 (Phase 3) - 认证基础
  ↓
US2 (Phase 4) - 项目管理 (depends on US1)
  ↓
US3 (Phase 5) - 待办管理 (depends on US2)
  ↓
┌─────────────────┬─────────────────┐
│   US4 (Phase 6) │   US5 (Phase 7) │
│   编辑待办       │   邀请成员       │
│ (depends on US3)│ (depends on US2)│
└─────────────────┴─────────────────┘
  ↓
┌─────────────────┬─────────────────┐
│   US6 (Phase 8) │   US7 (Phase 9) │
│   子待办         │   待办流转       │
│ (depends on US3)│ (depends on US3)│
└─────────────────┴─────────────────┘
  ↓
Polish (Phase 10)
```

### Blocking Tasks
- **T001-T008**: Setup 阶段任务必须完成才能开始开发
- **T009-T022**: Foundation 阶段提供基础组件，必须在页面开发前完成
- **T023-T028**: US1 认证功能是所有其他功能的前提

---

## 🔄 Parallel Execution Examples

### Phase 2 (Foundation) - 最大并行度 8
所有基础组件可以并行开发（标记 [P]）：
```bash
# 可以同时进行的任务组
Group 1: T009, T010, T011, T012, T013, T014, T015, T016
```

### Phase 4 (US2) - 并行度 4
```bash
# 前端组件可以并行开发
Group 1: T032 (ProjectCard), T033 (EmptyStateView)
# API 调用可以在组件完成后并行
Group 2: T034, T035, T036
```

### Phase 6 + Phase 7 (US4 + US5) - 跨 Story 并行
```bash
# US4 和 US5 独立，可以并行开发
Team A: T049-T054 (US4 - 编辑待办)
Team B: T055-T063 (US5 - 邀请成员)
```

---

## Phase 1: Setup

**Goal**: 初始化 Next.js 项目和配置开发环境

**Tasks**:

- [ ] T001 创建 Next.js 14 项目，使用 TypeScript 和 Tailwind CSS (`npx create-next-app@latest frontend --typescript --tailwind --app`)
- [ ] T002 安装前端依赖包：axios, @tanstack/react-query, zustand, @headlessui/react, @radix-ui/react-*, react-hook-form, zod, react-i18next in frontend/package.json
- [ ] T003 配置 Next.js 为 SPA 模式（`output: 'export'`），配置图片优化 in frontend/next.config.js
- [ ] T004 配置环境变量：NEXT_PUBLIC_API_URL, NEXT_PUBLIC_GATEWAY_URL in frontend/.env.local
- [ ] T005 [P] 配置 Tailwind CSS，集成 DesignTokens（颜色、间距、字体）in frontend/tailwind.config.js
- [ ] T006 [P] 创建 Axios API 客户端，配置请求/响应拦截器（添加 token，处理 401）in frontend/lib/api/client.ts
- [ ] T007 [P] 配置 React Query Provider，设置默认选项 in frontend/app/providers.tsx
- [ ] T008 [P] 更新根布局，集成 Providers in frontend/app/layout.tsx

**Completion Criteria**:
- ✅ Next.js 项目正常启动（`npm run dev`）
- ✅ Tailwind CSS 正常工作（可以使用设计令牌类名）
- ✅ 环境变量正确加载
- ✅ API 客户端可以正常发起请求

---

## Phase 2: Foundational - 基础组件和设计系统

**Goal**: 实现设计系统的基础组件，为所有页面提供构建模块

**Dependencies**: Phase 1 完成

**Tasks**:

### DesignTokens 实现
- [ ] T009 [P] 定义 CSS Variables for DesignTokens（colors, spacing, typography, shadows, animations）in frontend/lib/design-tokens/tokens.css
- [ ] T010 [P] 创建 TypeScript 类型定义 for DesignTokens in frontend/lib/design-tokens/tokens.ts

### 基础 UI 组件（按依赖顺序）
- [ ] T011 [P] 实现 Button 组件（5 个状态：normal, hover, pressed, disabled, loading）in frontend/components/ui/Button.tsx
- [ ] T012 [P] 实现 Label 组件（3 个状态：normal, required, disabled）in frontend/components/ui/Label.tsx
- [ ] T013 [P] 实现 TextField 组件（6 个状态，依赖 Label 和 ErrorView）in frontend/components/ui/TextField.tsx
- [ ] T014 [P] 实现 Select 组件（6 个状态，依赖 Label）in frontend/components/ui/Select.tsx
- [ ] T015 [P] 实现 LoadingView 组件（加载指示器，3 个大小）in frontend/components/ui/LoadingView.tsx
- [ ] T016 [P] 实现 ErrorView 组件（错误提示，依赖 Button）in frontend/components/ui/ErrorView.tsx
- [ ] T017 [P] 实现 EmptyStateView 组件（空状态，依赖 Button）in frontend/components/ui/EmptyStateView.tsx
- [ ] T018 [P] 实现 Avatar 组件（3 个状态：normal, hover, loading）in frontend/components/ui/Avatar.tsx
- [ ] T019 [P] 实现 StatusBadge 组件（任务状态徽章，3 个状态）in frontend/components/ui/StatusBadge.tsx

### 布局组件
- [ ] T020 实现 Sidebar 组件（侧边栏，包含用户头像、设置、导航项）in frontend/components/layout/Sidebar.tsx
- [ ] T021 实现 MainLayout 组件（主布局：Sidebar + 主内容区）in frontend/components/layout/MainLayout.tsx

### 状态管理
- [ ] T022 [P] 创建 Zustand auth store（存储用户信息、token）in frontend/store/authStore.ts

**Completion Criteria**:
- ✅ 所有基础组件可以在 Storybook 或独立页面中查看
- ✅ 组件遵循 DesignTokens（无硬编码样式）
- ✅ 组件支持键盘导航和屏幕阅读器
- ✅ Sidebar 可以正常显示，点击导航项可以切换 active 状态

---

## Phase 3: US1 - 用户注册和登录 (Priority: P1)

**Story Goal**: 用户可以创建账户并登录系统，与网关认证集成

**Dependencies**: Phase 2 完成

**Independent Test**: 用户能够成功注册、登录、获取 token 并访问受保护的页面

**Acceptance Scenarios**:
1. 用户填写注册表单 → 网关创建用户 → 返回 token → 前端存储 token
2. 用户填写登录表单 → 网关验证凭据 → 返回 token → 前端存储 token
3. 用户使用错误密码登录 → 网关返回 401 → 显示错误提示
4. 用户点击退出 → 清除 token → 返回登录页面

**Tasks**:

### API 集成
- [ ] T023 [P] [US1] 创建 auth API 端点（login, register, logout）in frontend/lib/api/endpoints/auth.ts
- [ ] T024 [P] [US1] 创建 useAuth Hook，封装认证逻辑（login, logout, getUser）in frontend/hooks/useAuth.ts

### 页面实现
- [ ] T025 [US1] 实现 LoginView 页面（4 个状态：加载中、登录表单、错误、成功），参考 wireframes/login-view.html in frontend/app/(auth)/login/page.tsx
- [ ] T026 [US1] 实现 RegisterView 页面（4 个状态：加载中、注册表单、错误、成功），参考 wireframes/register-view.html in frontend/app/(auth)/register/page.tsx

### 路由保护
- [ ] T027 [US1] 创建路由中间件，验证 token 有效性 in frontend/middleware.ts
- [ ] T028 [US1] 更新 app/layout.tsx，添加认证状态检查，未登录重定向到登录页

**Completion Criteria**:
- ✅ 用户可以注册新账户（网关创建用户）
- ✅ 用户可以登录并获取 token
- ✅ Token 存储在 localStorage
- ✅ 受保护的页面需要登录才能访问
- ✅ 错误提示正确显示（401 → "用户名或密码错误"）

---

## Phase 4: US2 - 创建和查看项目 (Priority: P1)

**Story Goal**: 用户可以创建项目并查看项目列表

**Dependencies**: US1 完成（需要认证）

**Independent Test**: 登录用户可以创建项目、查看项目列表、点击项目查看详情

**Acceptance Scenarios**:
1. 用户点击"创建项目" → 填写名称和 Git URL → 调用后端 API → 项目创建成功 → 显示在列表中
2. 用户访问项目列表页面 → 加载用户参与的所有项目 → 显示项目卡片
3. 用户点击项目卡片 → 跳转到项目详情页面 → 显示项目信息和待办列表
4. 用户尝试创建没有名称的项目 → 表单验证失败 → 显示错误提示

**Tasks**:

### API 集成
- [ ] T029 [P] [US2] 创建 projects API 端点（create, list, getById）in frontend/lib/api/endpoints/projects.ts
- [ ] T030 [P] [US2] 创建 useProjects Hook（useProjectList, useCreateProject）in frontend/hooks/useProjects.ts

### 复合组件
- [ ] T031 [P] [US2] 实现 ProjectCard 组件（项目卡片，4 个状态，依赖 Button 和 Label）in frontend/components/features/ProjectCard.tsx

### 页面实现
- [ ] T032 [US2] 实现 ProjectListView 页面（4 个状态：加载中、项目列表、空状态、错误），参考 wireframes/project-list-view.html in frontend/app/(dashboard)/projects/page.tsx
- [ ] T033 [US2] 实现 CreateProjectView 页面（4 个状态：加载中、创建表单、错误、成功），参考 wireframes/create-project-view.html in frontend/app/(dashboard)/projects/new/page.tsx
- [ ] T034 [US2] 实现 ProjectDetailView 页面（基础版本，只显示项目信息和空的待办列表），参考 wireframes/project-detail-view.html in frontend/app/(dashboard)/projects/[id]/page.tsx

### 表单验证
- [ ] T035 [P] [US2] 使用 React Hook Form + Zod 创建项目表单验证 schema in frontend/lib/validation/projectSchema.ts
- [ ] T036 [US2] 集成表单验证到 CreateProjectView

### 导航集成
- [ ] T037 [US2] 更新 Sidebar 组件，添加"项目列表"导航项，点击跳转到 /projects
- [ ] T038 [US2] 在 MainLayout 中集成项目列表路由

**Completion Criteria**:
- ✅ 用户可以创建项目（填写名称和 Git URL）
- ✅ 项目列表正确显示（使用 ProjectCard）
- ✅ 点击项目卡片可以跳转到详情页面
- ✅ 空状态正确显示（没有项目时）
- ✅ 表单验证正确工作（名称必填）

---

## Phase 5: US3 - 创建和查看待办事项 (Priority: P1)

**Story Goal**: 用户可以在项目中创建待办并查看待办列表

**Dependencies**: US2 完成（需要项目）

**Independent Test**: 用户在项目详情页面可以创建待办、查看待办列表、点击待办查看详情

**Acceptance Scenarios**:
1. 用户在项目详情页面点击"创建待办" → 填写内容和执行人 → 调用后端 API → 待办创建成功 → 显示在列表中
2. 用户查看项目待办列表 → 显示所有待办（创建人、执行人、内容）
3. 用户点击待办 → 跳转到待办详情页面 → 显示完整信息
4. 用户尝试创建没有内容的待办 → 表单验证失败 → 显示错误提示

**Tasks**:

### API 集成
- [ ] T039 [P] [US3] 创建 tasks API 端点（create, list, getById），适配后端 Task 模型 in frontend/lib/api/endpoints/tasks.ts
- [ ] T040 [P] [US3] 创建字段映射工具（Todo ↔ Task，status ↔ state）in frontend/lib/utils/taskMapper.ts
- [ ] T041 [P] [US3] 创建 useTasks Hook（useTaskList, useCreateTask），封装字段映射 in frontend/hooks/useTasks.ts

### 复合组件
- [ ] T042 [P] [US3] 实现 TodoItem 组件（待办卡片，4 个状态，依赖 Button、Label、StatusBadge）in frontend/components/features/TodoItem.tsx
- [ ] T043 [P] [US3] 实现 MemberItem 组件（成员卡片，3 个状态，依赖 Avatar）in frontend/components/features/MemberItem.tsx

### 页面实现
- [ ] T044 [US3] 更新 ProjectDetailView，添加待办列表（使用 TodoItem），支持空状态 in frontend/app/(dashboard)/projects/[id]/page.tsx
- [ ] T045 [US3] 实现 CreateTodoView 页面（4 个状态：加载中、创建表单、错误、成功），参考 wireframes/create-todo-view.html in frontend/app/(dashboard)/projects/[id]/tasks/new/page.tsx
- [ ] T046 [US3] 实现 TodoDetailView 页面（基础版本，显示待办详情，无评论），参考 wireframes/todo-detail-view.html in frontend/app/(dashboard)/projects/[id]/tasks/[taskId]/page.tsx

### 表单验证
- [ ] T047 [P] [US3] 使用 React Hook Form + Zod 创建待办表单验证 schema in frontend/lib/validation/taskSchema.ts
- [ ] T048 [US3] 集成表单验证到 CreateTodoView

### 状态映射
- [ ] T049 [P] [US3] 创建状态映射常量和工具函数（PENDING ↔ pending, IN_PROGRESS ↔ in_progress）in frontend/lib/constants/taskStatus.ts
- [ ] T050 [US3] 在 TodoItem 中使用 StatusBadge 显示任务状态

**Completion Criteria**:
- ✅ 用户可以在项目中创建待办（填写内容、选择执行人）
- ✅ 待办列表正确显示（使用 TodoItem，显示创建人、执行人、状态）
- ✅ 点击待办可以跳转到详情页面
- ✅ 空状态正确显示（没有待办时）
- ✅ 字段映射正确（前端 Todo ↔ 后端 Task）
- ✅ 状态映射正确（前端 status ↔ 后端 state）

---

## Phase 6: US4 - 编辑待办事项 (Priority: P2)

**Story Goal**: 用户可以编辑已创建的待办事项

**Dependencies**: US3 完成

**Independent Test**: 用户可以点击"编辑"按钮、修改待办内容、保存更改并查看更新后的信息

**Acceptance Scenarios**:
1. 用户点击待办的"编辑"按钮 → 跳转到编辑页面 → 显示当前信息
2. 用户修改待办内容 → 点击保存 → 调用后端 API → 更新成功 → 返回详情页面
3. 用户没有编辑权限（不是创建人或执行人） → 显示权限错误
4. 用户点击取消 → 放弃更改 → 返回详情页面

**Tasks**:

### API 集成
- [ ] T051 [P] [US4] 在 tasks API 端点添加 update 方法 in frontend/lib/api/endpoints/tasks.ts
- [ ] T052 [P] [US4] 在 useTasks Hook 添加 useUpdateTask mutation in frontend/hooks/useTasks.ts

### 页面实现
- [ ] T053 [US4] 实现 EditTodoView 页面（4 个状态：加载中、编辑表单、错误、成功），参考 wireframes/edit-todo-view.html in frontend/app/(dashboard)/projects/[id]/tasks/[taskId]/edit/page.tsx
- [ ] T054 [US4] 在 TodoDetailView 添加"编辑"按钮，点击跳转到编辑页面

### 权限验证
- [ ] T055 [US4] 在 EditTodoView 添加权限检查（只有创建人或执行人可以编辑）
- [ ] T056 [US4] 处理权限错误（403 → 显示错误提示并禁用表单）

**Completion Criteria**:
- ✅ 用户可以编辑自己创建或被分配的待办
- ✅ 编辑表单预填充当前信息
- ✅ 保存后数据正确更新
- ✅ 无权限用户不能编辑（显示错误）

---

## Phase 7: US5 - 项目邀请成员 (Priority: P2)

**Story Goal**: 项目创建者可以生成邀请码邀请其他用户加入项目

**Dependencies**: US2 完成

**Independent Test**: 项目创建者可以生成邀请码、分享链接、其他用户使用邀请码加入项目

**Acceptance Scenarios**:
1. 用户点击"邀请成员" → 选择角色和过期时间 → 生成邀请码 → 显示邀请码和链接
2. 用户点击"复制邀请码" → 邀请码复制到剪贴板 → 显示 Toast 提示
3. 其他用户使用邀请码 → 输入邀请码 → 加入项目 → 成为项目成员
4. 邀请码过期或无效 → 显示错误提示

**Tasks**:

### API 集成
- [ ] T057 [P] [US5] 创建 invitations API 端点（create, validate, accept）in frontend/lib/api/endpoints/invitations.ts
- [ ] T058 [P] [US5] 创建 useInvitations Hook（useCreateInvitation, useAcceptInvitation）in frontend/hooks/useInvitations.ts

### 复合组件
- [ ] T059 [P] [US5] 实现 InviteCodeDisplay 组件（显示邀请码和链接，提供复制功能）in frontend/components/features/InviteCodeDisplay.tsx

### 页面实现
- [ ] T060 [US5] 实现 InviteMemberView 页面（5 个状态：加载中、邀请表单、邀请码生成后、错误、复制成功提示），参考 wireframes/invite-member-view.html in frontend/app/(dashboard)/projects/[id]/invite/page.tsx
- [ ] T061 [US5] 在 ProjectDetailView 添加"邀请成员"按钮，点击跳转到邀请页面
- [ ] T062 [US5] 实现邀请码验证页面（用户输入邀请码加入项目）in frontend/app/invite/[code]/page.tsx

### 工具函数
- [ ] T063 [P] [US5] 实现剪贴板工具函数（copyToClipboard），显示 Toast 提示 in frontend/lib/utils/clipboard.ts
- [ ] T064 [US5] 实现 Toast 提示组件（成功、错误、信息）in frontend/components/ui/Toast.tsx
- [ ] T065 [US5] 在 InviteCodeDisplay 中集成复制功能和 Toast

**Completion Criteria**:
- ✅ 项目创建者可以生成邀请码
- ✅ 邀请码和链接正确显示
- ✅ 复制功能正常工作（显示 Toast）
- ✅ 其他用户可以使用邀请码加入项目
- ✅ 过期或无效的邀请码显示错误

---

## Phase 8: US6 - 创建和管理子待办 (Priority: P3)

**Story Goal**: 用户可以为待办创建子待办，实现任务层级

**Dependencies**: US3 完成

**Independent Test**: 用户可以为待办创建子待办、查看父子关系、编辑子待办

**Acceptance Scenarios**:
1. 用户在待办详情页面点击"创建子待办" → 填写信息 → 创建成功 → 显示在父待办下
2. 用户查看待办详情 → 显示所有子待办（层次结构）
3. 用户编辑子待办 → 保存更改 → 更新显示
4. 用户删除有子待办的父待办 → 显示确认对话框 → 确认后级联删除或保留子待办

**Tasks**:

### API 集成
- [ ] T066 [P] [US6] 在 tasks API 端点添加 getChildren 方法（获取子待办列表）in frontend/lib/api/endpoints/tasks.ts
- [ ] T067 [P] [US6] 在 useTasks Hook 添加 useChildTasks Hook in frontend/hooks/useTasks.ts

### 组件更新
- [ ] T068 [US6] 更新 TodoDetailView，显示子待办列表（使用 TodoItem，支持嵌套显示）in frontend/app/(dashboard)/projects/[id]/tasks/[taskId]/page.tsx
- [ ] T069 [US6] 在 CreateTodoView 添加"父待办"选择器（可选，用于创建子待办）in frontend/app/(dashboard)/projects/[id]/tasks/new/page.tsx

### 删除确认
- [ ] T070 [P] [US6] 实现 ConfirmDialog 组件（确认对话框，用于删除操作）in frontend/components/ui/ConfirmDialog.tsx
- [ ] T071 [US6] 在删除待办时添加确认对话框（如果有子待办，提示级联删除）
- [ ] T072 [US6] 在 tasks API 端点添加 delete 方法，支持级联删除参数 in frontend/lib/api/endpoints/tasks.ts

**Completion Criteria**:
- ✅ 用户可以创建子待办
- ✅ 子待办正确显示在父待办下（层次结构）
- ✅ 用户可以编辑子待办
- ✅ 删除父待办时显示确认对话框

---

## Phase 9: US7 - 待办流转 (Priority: P3)

**Story Goal**: 用户可以改变待办状态，跟踪任务进度

**Dependencies**: US3 完成

**Independent Test**: 用户可以改变待办状态、查看状态历史

**Acceptance Scenarios**:
1. 用户将待办从"待处理"改为"进行中" → 调用后端 API → 状态更新 → 显示新状态
2. 用户将待办改为"已完成" → 更新状态 → 可能移动到已完成列表
3. 用户查看待办详情 → 显示状态历史（时间线，操作人）
4. 用户尝试无效的状态流转 → 显示错误提示

**Tasks**:

### 状态更新
- [ ] T073 [P] [US7] 在 tasks API 端点添加 updateStatus 方法 in frontend/lib/api/endpoints/tasks.ts
- [ ] T074 [P] [US7] 在 useTasks Hook 添加 useUpdateTaskStatus mutation in frontend/hooks/useTasks.ts

### 组件更新
- [ ] T075 [US7] 在 TodoDetailView 添加状态选择器（下拉菜单，显示所有可用状态）in frontend/app/(dashboard)/projects/[id]/tasks/[taskId]/page.tsx
- [ ] T076 [US7] 在 TodoItem 添加快速状态切换（点击状态徽章切换状态）in frontend/components/features/TodoItem.tsx

### 状态历史（如果后端支持）
- [ ] T077 [P] [US7] 创建 taskHistory API 端点（getHistory）in frontend/lib/api/endpoints/taskHistory.ts
- [ ] T078 [US7] 在 TodoDetailView 添加状态历史时间线组件 in frontend/app/(dashboard)/projects/[id]/tasks/[taskId]/page.tsx

**Completion Criteria**:
- ✅ 用户可以改变待办状态（所有状态互相转换）
- ✅ 状态更新后 UI 立即反映
- ✅ 状态历史正确显示（如果后端支持）
- ✅ 无效的状态流转显示错误

---

## Phase 10: Polish - 优化和完善

**Goal**: 优化性能、完善用户体验、添加国际化

**Dependencies**: 所有核心功能完成

**Tasks**:

### 国际化
- [ ] T079 [P] 配置 react-i18next，创建中英文资源文件 in frontend/lib/i18n/config.ts, frontend/lib/i18n/locales/zh-CN.json, frontend/lib/i18n/locales/en-US.json
- [ ] T080 [P] 在所有页面和组件中替换硬编码文本为 i18n keys
- [ ] T081 [P] 在 Sidebar 添加语言切换器

### 性能优化
- [ ] T082 [P] 添加 React Query 缓存策略优化（staleTime, cacheTime）
- [ ] T083 [P] 使用 Next.js 动态导入（dynamic import）优化页面加载

### 无障碍和 UX
- [ ] T084 [P] 添加键盘快捷键支持（Ctrl+K 搜索，Esc 关闭对话框）
- [ ] T085 [P] 优化移动端响应式设计（侧边栏折叠为抽屉）

### 错误处理
- [ ] T086 [P] 实现全局错误边界（Error Boundary）in frontend/app/error.tsx
- [ ] T087 [P] 优化 API 错误提示（网络错误、超时、服务器错误）

**Completion Criteria**:
- ✅ 支持中英文切换
- ✅ 所有文本已国际化
- ✅ 页面加载速度优化（首屏 <500ms）
- ✅ 键盘导航正常工作
- ✅ 移动端体验良好

---

## 📝 Task Format Validation

**所有任务遵循以下格式**:
```
- [ ] [TaskID] [P?] [Story?] Description with file path
```

**示例**:
- ✅ `- [ ] T001 Create project structure`
- ✅ `- [ ] T009 [P] Define CSS Variables for DesignTokens in frontend/lib/design-tokens/tokens.css`
- ✅ `- [ ] T023 [P] [US1] Create auth API endpoints in frontend/lib/api/endpoints/auth.ts`
- ✅ `- [ ] T028 [US1] Update app/layout.tsx to check auth status`

---

## 🎉 Definition of Done

每个任务完成时必须满足：
1. ✅ 代码实现符合设计规范（DesignTokens，组件规范）
2. ✅ 无 TypeScript 类型错误
3. ✅ 无 ESLint 警告
4. ✅ 组件支持无障碍（键盘导航，ARIA 属性）
5. ✅ 响应式设计（移动端、平板、桌面端）
6. ✅ 代码已提交到 Git

每个 User Story 完成时必须满足：
1. ✅ 所有 Acceptance Scenarios 通过
2. ✅ Independent Test 通过
3. ✅ 可以在浏览器中完整演示功能
4. ✅ 与后端 API 正确对接（字段映射、状态映射）

---

**版本**: 1.0.0  
**最后更新**: 2024-12-19

