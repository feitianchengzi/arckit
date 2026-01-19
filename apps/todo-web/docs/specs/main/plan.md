# Implementation Plan: 待办管理系统

**Branch**: `master` | **Date**: 2024-12-19 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/main/spec.md`

## Summary

待办管理系统是一个基于 Web 的协作式任务管理平台，支持项目管理、任务分配、成员协作和评论功能。

**后端**：采用 **Go + Gin + GORM + PostgreSQL**（已实现），提供高性能的 RESTful API，支持网关统一认证架构。

**前端**：采用 **React 18.2.0 + Vite 5.0.8 + React Router 6.21.1 + TypeScript**，提供现代化的 SPA 体验，通过 HTTP 客户端对接后端 API。前端托管在阿里云 OSS 静态网站托管。

## Technical Context

**Language/Version**: 
- Frontend: TypeScript 5+
- Backend: Go 1.21+ (已实现)

**Primary Dependencies**: 
- Frontend: React 18.2.0, Vite 5.0.8, React Router 6.21.1, Tailwind CSS 3.4.0, Zustand 4.4.7, React Query 5.17.9, Axios 1.6.5, React Hook Form 7.49.3, Zod 3.22.4, react-i18next 14.0.0
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

**技术演进历史**：
- **Phase 1**: Next.js 14 App Router（已弃用）
  - 遇到问题：静态导出限制（`generateStaticParams` bug）、路由组冲突、Middleware 不工作、构建复杂度高
- **Phase 2**: Vite + React（当前方案）✅
  - 迁移时间：2026-01-15
  - 迁移原因：
    1. ✅ 更简单的静态部署（无 SSR 复杂性）
    2. ✅ 更快的开发体验（HMR 更快）
    3. ✅ 更灵活的路由配置（React Router）
    4. ✅ 避免 Next.js 静态导出的 Bug
  - 构建性能提升：构建时间从 30-60 秒降至 1.06 秒（提升 30-60x），构建产物从 1.6M 降至 385KB（减小 76%）
  - 环境变量变更：`NEXT_PUBLIC_*` → `VITE_*`

**Scale/Scope**: 
- 用户规模: 100+ 并发用户
- 页面数量: 9 个主要页面
- 组件数量: 16+ 个组件
- 数据实体: User, Project, Todo, ProjectInvitation, TodoStatusHistory

**Technology Stack** (Constitution Requirement):
- **Backend**: Go 1.21+ + Gin + GORM + PostgreSQL（已实现），采用 API Gateway 微服务架构
- **Web Frontend**: React 18.2.0 + Vite 5.0.8 + React Router 6.21.1 + TypeScript（已实现）
- **部署**: 阿里云 OSS 静态网站托管（前端）+ 微服务集群（后端）
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
  - ✅ UI 流畅度：目标 60fps（使用 React 18 Concurrent Features，Vite 优化）
  - ✅ 响应时间：用户交互响应 <100ms（客户端状态更新）
  - ✅ 页面加载：首屏内容 <500ms（Vite 代码分割、构建优化）
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
    - UI 目标：60fps（React 18 + Vite 优化）
    - 交互响应：<100ms（客户端状态更新）
    - 构建优化：Vite 代码分割、手动分包（react-vendor, ui-vendor）

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
├── frontend/                 # Vite + React 前端项目（已实现）
│   ├── index.html           # 入口 HTML
│   ├── vite.config.ts       # Vite 配置
│   ├── tsconfig.json        # TypeScript 配置
│   ├── tailwind.config.ts   # Tailwind CSS 配置
│   ├── package.json         # 依赖管理
│   ├── .env.local           # 本地环境变量
│   │
│   ├── src/
│   │   ├── main.tsx         # 应用入口
│   │   ├── App.tsx          # React Router 路由配置
│   │   ├── globals.css      # 全局样式
│   │   ├── vite-env.d.ts    # Vite 类型声明
│   │   │
│   │   ├── pages/           # 页面组件
│   │   │   ├── LoginPage.tsx
│   │   │   ├── ProjectsPage.tsx
│   │   │   ├── ProjectDetailPage.tsx
│   │   │   ├── TaskDetailPage.tsx
│   │   │   └── ...
│   │   │
│   │   ├── components/      # UI 组件
│   │   │   ├── ui/          # 基础 UI 组件（基于 DesignTokens）
│   │   │   │   ├── Button.tsx
│   │   │   │   ├── TextField.tsx
│   │   │   │   ├── Select.tsx
│   │   │   │   ├── Label.tsx
│   │   │   │   ├── LoadingView.tsx
│   │   │   │   ├── ErrorView.tsx
│   │   │   │   └── EmptyStateView.tsx
│   │   │   ├── layout/      # 布局组件
│   │   │   │   ├── Sidebar.tsx
│   │   │   │   └── DashboardLayout.tsx
│   │   │   ├── features/    # 功能组件
│   │   │   │   ├── ProjectCard.tsx
│   │   │   │   ├── TodoItem.tsx
│   │   │   │   ├── SubtaskList.tsx
│   │   │   │   ├── MemberList.tsx
│   │   │   │   └── InviteCodeDisplay.tsx
│   │   │   └── auth/        # 认证组件
│   │   │       └── AuthGuard.tsx
│   │   │
│   │   ├── hooks/           # 自定义 Hooks
│   │   │   ├── useAuth.ts   # 与网关认证集成
│   │   │   ├── useProjects.ts
│   │   │   └── useTasks.ts
│   │   │
│   │   ├── store/           # Zustand 状态管理
│   │   │   ├── authStore.ts # 存储用户信息（从网关获取）
│   │   │   └── uiStore.ts
│   │   │
│   │   ├── lib/             # 工具库
│   │   │   ├── api/         # API 客户端
│   │   │   │   ├── client.ts # Axios 实例（配置后端 API 地址）
│   │   │   │   └── endpoints/ # API 端点定义
│   │   │   │       ├── auth.ts
│   │   │   │       ├── projects.ts
│   │   │   │       ├── tasks.ts
│   │   │   │       ├── users.ts
│   │   │   │       └── invitations.ts
│   │   │   ├── utils/       # 工具函数
│   │   │   │   ├── tokenManager.ts
│   │   │   │   └── taskMapper.ts
│   │   │   ├── design-tokens/ # DesignTokens 定义
│   │   │   │   └── tokens.css # CSS Variables
│   │   │   └── i18n/        # 国际化
│   │   │       └── index.ts
│   │   │
│   │   ├── types/           # TypeScript 类型
│   │   │   ├── index.ts
│   │   │   └── auth.ts
│   │   │
│   │   └── layouts/         # 布局组件
│   │       └── DashboardLayout.tsx
│   │
│   ├── scripts/             # 构建脚本
│   │   ├── build-vite.sh    # Vite 构建脚本
│   │   └── diagnose-online-issue.sh
│   │
│   └── dist/                # 构建输出（自动生成，部署到 OSS）
│       ├── index.html
│       └── assets/
├── server/                  # Go 后端微服务集群（已实现）
│   ├── auth-service/        # 认证服务
│   │   ├── main.go
│   │   ├── router/
│   │   ├── handler/
│   │   └── ...
│   ├── user-service/        # 用户服务
│   │   ├── main.go
│   │   ├── router/
│   │   ├── handler/
│   │   └── ...
│   ├── workshop-service/    # 业务服务（项目、任务）
│   │   ├── main.go
│   │   ├── router/
│   │   ├── handler/
│   │   ├── middleware/
│   │   ├── models/          # 数据模型（GORM）
│   │   ├── database/        # 数据库配置
│   │   ├── api/             # API 文档
│   │   ├── docker-compose.yml
│   │   ├── go.mod
│   │   └── README.md
│   └── gateway/             # API Gateway（JWT 认证、路由转发）
├── specs/                   # 设计文档
└── README.md
```

**Structure Decision**: 
采用 **Web application (frontend + backend microservices)** 结构。

**前端**：使用 **Vite 5.0.8 + React 18.2.0 + React Router 6.21.1**（已实现，从 Next.js 14 App Router 迁移而来）。采用 SPA 模式，部署在阿里云 OSS 静态网站托管。构建产物自动分包（react-vendor, ui-vendor）以优化加载性能。

**技术迁移历史**：
- **Phase 1**: Next.js 14 App Router（已弃用）
  - 问题：静态导出限制、路由组冲突、Middleware 不工作、构建复杂度高
- **Phase 2**: Vite + React（当前方案）✅
  - 优势：更简单的静态部署、更快的开发体验（HMR）、更灵活的路由配置、避免 Next.js 静态导出 Bug

**后端**：使用 **Go 1.21+ + Gin + GORM + PostgreSQL**（已实现），采用 **API Gateway 微服务架构**。微服务包括：
- **Auth Service**：认证服务（登录、注册、Token 刷新）
- **User Service**：用户服务（用户管理、个人信息）
- **Workshop Service**：业务服务（项目、任务、成员、邀请）

**API 路由格式**：`/{service}/v1/{auth_level}/{path}`
- 示例：`/auth-server/v1/public/login`、`/workshop/v1/user/projects`

**认证机制**：
- JWT Token 结构：Access Token（15分钟）+ Refresh Token（7天）
- API Gateway 验证 JWT Token，注入 `X-User-ID` header 到下游服务
- 下游服务通过 header 获取用户信息，无需再次验证 Token

**对接方式**：
- 前端通过 Axios 调用 API Gateway（`https://api.feitianchengzi.com`）
- 网关验证 Token 后转发到对应的微服务
- 后端从请求头（`X-User-ID`, `X-User-Username`）获取用户信息（由网关注入）

**部署架构**：
- **前端**：阿里云 OSS 静态网站托管
  - 域名：`workshop.feitianchengzi.com`
  - 配置：SPA 路由支持（错误文档 → index.html）
- **后端**：微服务集群 + API Gateway
  - 域名：`api.feitianchengzi.com`
  - 功能：JWT 认证、请求转发、用户信息注入

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| N/A | 无违反项 | - |

---

**版本**: 1.0.0  
**最后更新**: 2026-01-16  
**更新说明**: 根据实际架构文档更新技术栈（Vite + React Router 替代 Next.js）和部署方案（阿里云 OSS）

