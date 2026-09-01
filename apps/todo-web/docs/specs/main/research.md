# 技术调研文档

**项目**: 待办管理系统  
**创建日期**: 2024-12-19  
**目的**: 解决技术选型中的关键决策点

---

## 1. 前端框架选择：React + Next.js

### Decision: React 18 + Next.js 14 (App Router)

### Rationale:

**选择 React + Next.js 的理由**:

1. **Next.js 14 App Router 优势**:
   - ✅ **文件系统路由**: 基于文件系统的路由，更直观，无需额外配置
   - ✅ **内置优化**: 自动代码分割、图片优化、字体优化
   - ✅ **开发体验**: 极快的开发服务器（基于 Turbopack），优秀的 HMR
   - ✅ **灵活性**: 支持 SPA 模式（`output: 'export'`），也支持 SSR/SSG（未来扩展）
   - ✅ **API Routes**: 可选择性使用，减少后端依赖

2. **与项目需求匹配**:
   - ✅ **SPA 架构**: 通过配置 `output: 'export'` 实现纯 SPA
   - ✅ **侧边栏布局**: App Router 的布局系统完美支持嵌套布局
   - ✅ **性能要求**: Next.js 自动优化满足 60fps 和 <100ms 响应要求
   - ✅ **DesignTokens**: 与 Tailwind CSS 完美集成

3. **技术生态**:
   - ✅ **React 18**: Concurrent Features 提供优秀的性能
   - ✅ **TypeScript**: 原生支持，类型安全
   - ✅ **社区支持**: 庞大的社区和丰富的插件生态

### Alternatives Considered:

1. **Vite + React Router**:
   - ❌ 需要额外配置路由
   - ❌ 缺少内置优化（需要手动配置）
   - ✅ 更轻量，启动更快
   - **决策**: 选择 Next.js，因为内置优化和更好的开发体验

2. **Vue 3 + Nuxt**:
   - ❌ 团队更熟悉 React
   - ❌ 生态相对较小
   - ✅ 性能优秀
   - **决策**: 保持 React 技术栈一致性

---

## 2. 状态管理方案

### Decision: Zustand + React Query

### Rationale:

**组合使用的原因**:

1. **Zustand** (客户端状态):
   - ✅ 轻量级（<1KB），API 简洁
   - ✅ 性能优秀，无额外渲染
   - ✅ 适合 UI 状态（侧边栏展开/收起、表单状态）

2. **React Query** (服务端状态):
   - ✅ 自动缓存、后台更新、重试机制
   - ✅ 乐观更新支持
   - ✅ 减少样板代码

### Alternatives Considered:

1. **Redux Toolkit**:
   - ❌ 配置复杂，样板代码多
   - ❌ 对于项目规模来说过于重量级
   - **决策**: 选择更轻量的 Zustand

2. **Context API**:
   - ❌ 性能问题（频繁更新会导致所有消费者重新渲染）
   - ❌ 缺少中间件支持
   - **决策**: 选择专门的状态管理库

---

## 3. 样式方案

### Decision: Tailwind CSS + CSS Variables (DesignTokens)

### Rationale:

1. **Tailwind CSS**:
   - ✅ 工具类优先，开发效率高
   - ✅ 自动树摇，生产环境体积小
   - ✅ 与 DesignTokens 完美集成（通过 `tailwind.config.js`）

2. **CSS Variables**:
   - ✅ 动态主题支持（Light/Dark Mode）
   - ✅ 运行时修改 DesignTokens
   - ✅ 符合设计系统要求

### Alternatives Considered:

1. **CSS Modules / Styled Components**:
   - ❌ 需要为每个组件写样式
   - ❌ 不符合 DesignTokens 工具类优先的理念
   - **决策**: 选择 Tailwind CSS

---

## 4. 表单处理

### Decision: React Hook Form + Zod

### Rationale:

1. **React Hook Form**:
   - ✅ 性能优秀（非受控组件，减少重渲染）
   - ✅ API 简洁，易于使用
   - ✅ 与 Zod 完美集成

2. **Zod**:
   - ✅ TypeScript 优先，类型推导
   - ✅ 运行时验证，类型安全
   - ✅ 与 React Hook Form 集成良好

### Alternatives Considered:

1. **Formik**:
   - ❌ 性能较差（受控组件）
   - ❌ API 较复杂
   - **决策**: 选择 React Hook Form

---

## 5. 后端实现（已有）

### Decision: Go + Gin + GORM + PostgreSQL（现有实现）

### Rationale:

1. **Go + Gin**:
   - ✅ 高性能，并发处理能力强
   - ✅ Gin 框架轻量级，路由性能优秀
   - ✅ 编译型语言，部署简单（单一二进制文件）

2. **GORM + PostgreSQL**:
   - ✅ GORM 是 Go 生态成熟的 ORM
   - ✅ 支持自动迁移和关系管理
   - ✅ PostgreSQL 关系型数据库，支持复杂查询和事务

3. **网关统一认证架构**:
   - ✅ 认证逻辑由网关处理（JWT/API Key）
   - ✅ 业务服务从请求头获取用户信息（`X-User-ID`, `X-User-Username`）
   - ✅ 简化业务服务的认证逻辑

4. **路由格式**:
   - ✅ `/{service}/v1/{auth_level}/{path}` 统一格式
   - ✅ 支持三种认证级别：public, user, apikey

### 前后端对接:

**前端 → 后端**:
- 前端使用 Axios 调用后端 API
- 前端从网关获取 JWT token，添加到请求头
- 后端从网关转发的请求头获取用户信息

**数据流**:
```
用户 → Next.js (前端) → 网关 (认证) → Go Backend (业务逻辑) → PostgreSQL
```

---

## 6. 认证方案（网关统一认证）

### Decision: 网关统一认证 + Header 转发

### Rationale:

1. **网关统一认证**:
   - ✅ 网关负责所有认证逻辑（JWT、API Key 等）
   - ✅ 业务服务无需处理认证，降低复杂度
   - ✅ 认证逻辑统一管理，易于维护

2. **Header 转发机制**:
   - ✅ 网关验证通过后，转发用户信息到业务服务
   - ✅ 请求头包含：`X-User-ID` (UUID)、`X-User-Username`
   - ✅ 业务服务从请求头提取用户信息

3. **前端实现**:
   - ✅ 前端从网关获取 JWT token
   - ✅ 前端请求时携带 token（Authorization header）
   - ✅ 网关验证 token 后转发到后端服务

### 认证流程:

```
1. 用户登录 → 网关认证 → 返回 JWT token
2. 前端存储 token（localStorage/sessionStorage）
3. 前端请求 API → 携带 token → 网关验证
4. 网关验证通过 → 添加 X-User-ID 等 header → 转发到后端
5. 后端从 header 获取用户信息 → 处理业务逻辑
```

---

## 7. 并发编辑冲突处理

### Decision: Last-Write-Wins (乐观锁版本号)

### Rationale:

1. **Last-Write-Wins**:
   - ✅ 实现简单
   - ✅ 适合项目规模（100+ 并发用户）
   - ✅ 通过版本号检测冲突

2. **实现方案**:
   - 每个实体包含 `version` 字段
   - 更新时检查版本号
   - 版本不匹配时返回冲突错误

### Alternatives Considered:

1. **Operational Transform (OT)**:
   - ❌ 实现复杂
   - ❌ 对于待办管理系统来说过于复杂
   - **决策**: 选择简单的 Last-Write-Wins

2. **Lock 机制**:
   - ❌ 影响用户体验（需要等待）
   - ❌ 不适合实时协作
   - **决策**: 选择乐观锁

---

## 8. 邀请过期时间

### Decision: 7 天（可配置）

### Rationale:

1. **7 天过期**:
   - ✅ 平衡安全性和用户体验
   - ✅ 足够用户响应邀请
   - ✅ 可通过配置调整

2. **实现**:
   - 邀请码包含过期时间戳
   - 验证时检查是否过期
   - 支持 0（永不过期）选项

---

## 总结

所有技术选型都基于以下原则：
1. **性能优先**: 满足 60fps 和 <100ms 响应要求
2. **开发效率**: 现代化工具链，减少样板代码
3. **类型安全**: TypeScript + Zod + Prisma 全链路类型
4. **可维护性**: 清晰的架构，易于扩展
5. **设计系统**: 完全符合 DesignTokens 要求

---

**版本**: 1.0.0  
**最后更新**: 2024-12-19

