# Implementation Plan: 待办管理系统

**Branch**: `master` | **Date**: 2024-12-19 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/main/spec.md`

## Summary

待办管理系统是一个基于 Web 的协作式任务管理平台，支持项目管理、任务分配、成员协作和评论功能。

**后端**：采用 **Go + Gin + GORM + PostgreSQL**（已实现），提供高性能的 RESTful API，支持网关统一认证架构。

**前端**：采用 **React 18 + Next.js 14 (App Router) + TypeScript**，提供现代化的 SPA 体验，通过 HTTP 客户端对接后端 API。

## Technical Context

**Language/Version**: 
- Frontend: TypeScript 5+
- Backend: Go 1.24+ (已实现)

**Primary Dependencies**: 
- Frontend: React 18, Next.js 14, Tailwind CSS, Zustand, React Query, Axios
- Backend: Gin, GORM, PostgreSQL (已实现)

**Storage**: PostgreSQL (通过 GORM)  
**Testing**: 
- Frontend: Vitest, React Testing Library, Playwright
- Backend: Go testing (已实现)

**Target Platform**: Web (现代浏览器：Chrome, Firefox, Safari, Edge)  
**Project Type**: Web application (frontend + backend)  
**Performance Goals**: 
- UI 流畅度: 60fps
- 用户交互响应: <100ms
- 页面加载: <500ms
- 数据刷新: <1s
- 支持至少 100 并发用户

**Constraints**: 
- 响应式设计（移动端、平板、桌面端）
- 无障碍支持（WCAG 2.1 AA）
- 国际化支持（中英文）
- DesignTokens 设计系统（无硬编码设计值）

**Scale/Scope**: 
- 用户规模: 100+ 并发用户
- 页面数量: 9 个主要页面
- 组件数量: 16+ 个组件
- 数据实体: User, Project, Todo, ProjectInvitation, TodoStatusHistory

**Technology Stack** (Constitution Requirement):
- **Backend**: Go 1.24+ + Gin + GORM + PostgreSQL（已实现）
- **Web Frontend**: React 18 + Next.js 14 (App Router) + TypeScript
- **iOS**: N/A (Web only)
- **Android**: N/A (Web only)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

验证以下 Constitution 原则的合规性：

- **需求制作流程**：
  - ✅ 设计规范：功能特性包含完整的设计规范文档（视觉设计、交互设计、组件规范、状态定义）
  - ✅ 功能规格：包含用户故事、验收场景、功能需求、成功标准

- **无障碍 (Accessibility)**：
  - ✅ 键盘导航：支持 Tab 键导航，Enter/Space 键激活
  - ✅ 屏幕阅读器：使用语义化 HTML，ARIA 属性
  - ✅ 色彩对比度：文本与背景对比度至少 4.5:1 (WCAG AA)
  - ✅ 动态字体：支持浏览器字体缩放

- **性能 (Performance)**：
  - ✅ UI 流畅度：目标 60fps（使用 React 18 Concurrent Features，Next.js 优化）
  - ✅ 响应时间：用户交互响应 <100ms（客户端状态更新）
  - ✅ 页面加载：首屏内容 <500ms（Next.js 自动代码分割、预加载）
  - ✅ 数据刷新：<1s（React Query 缓存和后台更新）

- **国际化 (Internationalization)**：
  - ✅ 文本国际化：使用 react-i18next，所有用户可见文本支持多语言
  - ✅ 布局适配：UI 布局适应不同语言的文本长度变化
  - ✅ 语言切换：支持中英文切换功能
  - ✅ 后端支持：API 响应中的用户消息支持多语言

- **Web 架构要求**：
  - ✅ **代码质量**：
    - 组件化：使用 React 组件，符合单一职责原则
    - 状态管理分层：客户端状态（Zustand），服务端状态（React Query）
    - 业务逻辑：在组件或自定义 Hooks 中协调
  - ✅ **测试标准**：
    - 新功能包含相应测试（Vitest + React Testing Library）
    - 组件有单元测试覆盖
    - 关键流程有 E2E 测试（Playwright）
  - ✅ **用户体验一致性**：
    - 设计值从 DesignTokens 读取，无硬编码（使用 Tailwind CSS + CSS Variables）
    - 可访问性：支持键盘导航和屏幕阅读器
  - ✅ **性能要求**：
    - UI 目标：60fps（React 18 + Next.js 优化）
    - 交互响应：<100ms（客户端状态更新）
    - 构建优化：Next.js 自动代码分割、图片优化

## Project Structure

### Documentation (this feature)

```text
specs/main/
├── plan.md              # This file (/arckit.plan command output)
├── research.md          # Phase 0 output (/arckit.plan command)
├── data-model.md        # Phase 1 output (/arckit.plan command)
├── quickstart.md        # Phase 1 output (/arckit.plan command)
├── contracts/           # Phase 1 output (/arckit.plan command)
└── tasks.md             # Phase 2 output (/arckit.tasks command - NOT created by /arckit.plan)
```

### Source Code (repository root)

```text
workshop-todo-website/
├── frontend/                 # Next.js 前端项目
│   ├── app/                 # App Router (Next.js 13+)
│   │   ├── (auth)/          # 路由组：认证相关（如需要）
│   │   │   ├── login/       # 登录页面（可选，如果网关已处理）
│   │   │   └── register/    # 注册页面（可选，如果网关已处理）
│   │   ├── (dashboard)/     # 路由组：主应用（包含 Sidebar）
│   │   │   ├── projects/    # 项目列表
│   │   │   ├── projects/[id]/ # 项目详情
│   │   │   │   ├── tasks/   # 任务列表（嵌套路由）
│   │   │   │   └── invite/  # 邀请成员
│   │   │   └── tasks/       # 全局任务列表
│   │   ├── layout.tsx      # 根布局
│   │   └── page.tsx        # 首页（重定向到项目列表）
│   ├── components/          # 组件
│   │   ├── ui/             # 基础 UI 组件（基于 DesignTokens）
│   │   │   ├── Button.tsx
│   │   │   ├── TextField.tsx
│   │   │   ├── Select.tsx
│   │   │   ├── Label.tsx
│   │   │   ├── LoadingView.tsx
│   │   │   ├── ErrorView.tsx
│   │   │   └── EmptyStateView.tsx
│   │   ├── layout/         # 布局组件
│   │   │   ├── Sidebar.tsx # 侧边栏（用户头像、设置、导航）
│   │   │   └── MainLayout.tsx # 主布局（Sidebar + 主内容区）
│   │   └── features/       # 功能组件
│   │       ├── ProjectCard.tsx
│   │       ├── TaskItem.tsx
│   │       ├── MemberList.tsx
│   │       └── InviteCodeDisplay.tsx
│   ├── hooks/              # 自定义 Hooks
│   │   ├── useAuth.ts      # 与网关认证集成
│   │   ├── useProjects.ts
│   │   └── useTasks.ts
│   ├── store/              # Zustand 状态管理
│   │   ├── authStore.ts    # 存储用户信息（从网关获取）
│   │   └── uiStore.ts
│   ├── lib/                # 工具库
│   │   ├── api/           # API 客户端
│   │   │   ├── client.ts  # Axios 实例（配置后端 API 地址）
│   │   │   └── endpoints/ # API 端点定义
│   │   │       ├── projects.ts
│   │   │       ├── tasks.ts
│   │   │       ├── users.ts
│   │   │       └── invitations.ts
│   │   ├── utils/         # 工具函数
│   │   ├── design-tokens/ # DesignTokens 定义
│   │   │   └── tokens.ts  # CSS Variables + TypeScript 类型
│   │   └── i18n/          # 国际化
│   │       ├── config.ts
│   │       └── locales/
│   ├── public/            # 静态资源
│   ├── next.config.js     # Next.js 配置
│   ├── tailwind.config.js # Tailwind 配置（使用 DesignTokens）
│   ├── tsconfig.json
│   └── package.json
├── server/                  # Go 后端（已实现，不修改）
│   ├── main.go             # 应用入口
│   ├── router/             # 路由配置
│   ├── handler/            # 业务处理器
│   ├── middleware/         # 中间件
│   ├── models/             # 数据模型（GORM）
│   ├── database/           # 数据库配置
│   ├── api/                # API 文档
│   ├── docker-compose.yml  # Docker 配置
│   ├── go.mod              # Go 依赖
│   └── README.md           # 后端文档
├── specs/                   # 设计文档
└── README.md
```

**Structure Decision**: 
采用 **Web application (frontend + backend)** 结构。

**前端**：使用 Next.js 14 App Router，支持 SPA 模式（`output: 'export'`），同时保留未来扩展 SSR 的能力。

**后端**：使用 Go + Gin + GORM（已实现），采用网关统一认证架构，通过 RESTful API 提供服务。API 路由格式：`/{service}/v1/{auth_level}/{path}`。

**对接方式**：前端通过 Axios 调用后端 API，后端从请求头（`X-User-ID`, `X-User-Username`）获取用户信息（由网关转发）。

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| N/A | 无违反项 | - |

---

**版本**: 1.0.0  
**最后更新**: 2024-12-19

