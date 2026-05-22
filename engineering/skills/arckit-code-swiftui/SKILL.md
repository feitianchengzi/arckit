---
name: arckit-code-swiftui
description: SwiftUI tech-stack skill for Apple platform development. Use when writing, reviewing, or scaffolding Swift/SwiftUI code. Triggers on mentions of Swift, SwiftUI, iOS, macOS, watchOS, tvOS, visionOS, Xcode, SPM, SwiftData, @Observable, @State, @Query, @Model, @Environment, Apple, UIKit, Swift Package, xcodeproj, or arckit-code-swiftui.
---

# ArcKit Code SwiftUI — Apple 平台技术栈

为 Swift/SwiftUI 开发提供架构规则、代码模式和质量标准的统一知识源。

## 技术栈约束

| 项目 | 要求 |
|------|------|
| 语言 | Swift 6.0+ |
| 最低平台 | iOS 18+, macOS 15+, watchOS 11+, tvOS 18+, visionOS 2+ |
| UI 框架 | **SwiftUI only**（禁止 UIKit / AppKit，除非 SwiftUI 无法实现） |
| 数据持久化 | SwiftData（@Model，离线优先） |
| 状态观察 | Observation 框架（@Observable） |
| 依赖管理 | Swift Package Manager (SPM) |
| 测试框架 | Swift Testing（@Test） |
| 并发模型 | Swift Concurrency（async/await, @MainActor, Task, actor） |
| 禁止 | Objective-C 线程管理（NSThread, DispatchQueue, GCD） |

## MV 架构

Model（独立的领域数据）+ Service（View 外部服务）+ View（协调者与决策者）。基于 SwiftUI 响应式特性，通过子 View 拆分实现业务逻辑的自然分离。

### 分层职责

| 层 | 定义 | 可以 | 禁止 |
|----|------|------|------|
| **Model** | 领域数据与状态 | 领域数据结构；基于自身的简单计算属性/业务逻辑 | 依赖 Service；依赖其他 Model；包含 UI 状态 |
| **Service** | View 外部服务 | 数据获取/保存/同步；外部 API；系统服务封装（相机、传感器等）；第三方 SDK；复杂算法 | 业务逻辑判断；业务规则处理 |
| **Utils** | 项目独立工具 | 日期格式化、字符串处理、通用扩展等 | 依赖项目内任何代码 |
| **View** | 协调者 | 持有所有数据；访问所有 Service；协调多个 Model；组合业务逻辑；管理 UI 状态；通过子 View 拆分逻辑 | — |

### View 作为最高权限协调者

- **数据持有**：@Query（持久化）、@Observable（业务数据）、@State（UI 状态）
- **Service 访问**：通过 @Environment 注入
- **业务协调**：组合多个 Model 的数据，决定何时调用 Service
- **逻辑分离**：通过子 View 拆分实现，父 View 协调，子 View 接收数据并回调

### Service 实现要求

1. 定义协议（Protocol + Sendable）
2. 创建实现（Struct 优先）
3. 定义 EnvironmentKey
4. 扩展 EnvironmentValues
5. View 中通过 `@Environment(\.xxxService)` 注入

## 状态管理决策树

```
需要管理什么状态？
├─ 持久化领域数据 → @Model (SwiftData) + @Query 查询
├─ 非持久化业务数据 → @Observable class（独立状态模型）
│  └─ 特征：仅包含自身领域状态，禁止依赖 Service/其他 Model
├─ 简单 UI 状态（loading/showAlert/selectedTab/isEditing）→ @State
└─ 复杂 UI+业务混合状态 → @Observable class（状态模型）
   └─ 信号：View 中 @State 变量超过 5-6 个且相互关联
```

| 属性包装器 | 用途 | 所在层 |
|-----------|------|--------|
| `@Model` | 持久化领域数据 | Model |
| `@Observable` | 非持久化业务数据 / 复杂状态模型 | Model |
| `@State` | 简单 UI 状态 | View |
| `@Query` | 查询持久化数据 | View |
| `@Environment` | 注入 Service / 系统值 | View |
| `@Binding` | 父子 View 双向数据传递 | View |

## View 拆分指导

### 拆分信号（考虑拆分）

- `body` 超过 150 行
- View 同时处理多个不相关业务
- UI 模式需要在多处复用
- 存在可独立理解和测试的逻辑单元
- 清晰的视觉/功能边界（Header/Content/Footer）
- 条件渲染嵌套超过 3 层

### 拆分平衡

| 场景 | 建议 | 理由 |
|------|------|------|
| body 150+ 行的复杂表单 | 拆分 | 代码过长，难维护 |
| 清晰视觉区域（Header/List/Footer） | 拆分 | 职责边界清晰 |
| 条件渲染 5+ 层嵌套 | 拆分 | 逻辑难理解 |
| 多页面复用的卡片组件 | 拆分 | 提升复用性 |
| body 40 行但逻辑简单清晰 | 可选 | 权衡可读性收益 |
| HStack 包含 2 个按钮 | 不拆分 | 过度拆分增加复杂度 |

### 父子 View 职责分工

**父 View**：持有数据（@Query/@Observable/@State）→ 访问 Service（@Environment）→ 协调业务逻辑 → 传递数据给子 View

**子 View**：接收参数 → 展示逻辑 → 闭包回调通知父 View。**禁止**：直接使用 @Query、@Observable、@Environment 注入 Service、操作 modelContext

## 数据流

### 持久化数据流（SwiftData）

```
@Model 定义数据 → @Query 自动查询 → View 自动更新
                   modelContext → 增删改 → 持久化存储自动同步
```

- **数据定义**：`@Model` class 定义持久化领域数据
- **数据查询**：View 使用 `@Query` 自动获取，自动响应变化
- **数据操作**：View 通过 `@Environment(\.modelContext)` 直接 CRUD

### 非持久化数据流（@Observable + Service）

```
View 决定加载 → 调用 Service（@Environment 注入）→ 更新 @Observable 状态 → View 自动刷新
```

- **业务模型**：`@Observable` 表达非持久化业务数据，不含 UI 状态
- **Service 注入**：`@Environment(\.xxxService)` 注入
- **UI 状态**：loading/error/editing 等仅在 View 用 @State 管理

### 父子 View 数据传递

```
父 View（持有 @Query/@Observable/@State/@Environment）
  → 通过参数传递数据给子 View
  ← 子 View 通过闭包回调通知父 View 用户操作
```

## 导航

使用集中式 `NavigationManager` 管理路由，避免在各 View 分散推送。

- **iOS**：基于 NavigationStack + NavigationPath
- **macOS**：基于 NavigationSplitView（3 列布局）
- 所有路由定义集中在 `Navigation/` 目录

## 目录结构

```
ios/{PROJECT_NAME}/{PACKAGE_NAME}/
├── Sources/{PACKAGE_NAME}/
│   ├── App/                    # App 入口
│   │   └── {PROJECT_NAME}App.swift
│   ├── Views/
│   │   └── {PageName}/         # 页面模块
│   │       ├── {PageName}View.swift        # 主页面
│   │       └── {ComponentName}View.swift   # 子视图组件
│   ├── Models/
│   │   ├── SwiftData/          # 持久化 @Model
│   │   └── Observable/         # 非持久化 @Observable
│   ├── Services/               # 协议 + 实现 + 环境键
│   ├── DesignSystem/
│   │   └── Generated/          # 设计令牌
│   ├── Navigation/             # 集中式路由管理
│   └── Utils/                  # 项目独立工具
├── Resources/
│   └── {PACKAGE_NAME}Assets.xcassets/
│       └── Colors/             # Asset Catalog 颜色
└── Tests/
    └── {PACKAGE_NAME}Tests/
```

## 质量门

### I. 代码质量

- Model 独立性：不依赖 Service、不依赖其他 Model、不含 UI 状态
- Service 纯粹性：不含业务逻辑判断，必须协议抽象 + 环境注入
- View 协调者角色：持有数据、组合逻辑、拆分子 View
- 代码风格：Struct 优先、Swift Concurrency、一文件一 View

### II. 测试标准

- 所有 Model 和 Service 必须覆盖单元测试
- 视图使用快照测试或交互测试
- 使用 Swift Testing（@Test 标注）
- 静态分析通过 `swift build`
- 最终交付需通过 `xcodebuild -workspace -scheme -sdk iphonesimulator build`

### III. 用户体验

- 所有颜色/间距/排版从 DesignTokens 读取，禁止硬编码
- 必须支持 VoiceOver
- 必须支持 Dynamic Type（动态字体）
- 组件优先复用，保证视觉一致性

### IV. 性能要求

- UI 帧率：60fps（每帧 <16.67ms）
- 触控响应：<100ms
- 启动时间：符合 iOS 标准
- 关键场景需用 Instruments 验证性能和内存

### V. 国际化

- 所有用户可见文本必须国际化（iOS 使用 LocalizedStringKey / .strings）
- 初始支持中文和英文
- UI 布局适应不同语言文本长度
- 禁止硬编码用户可见文本

## 平台差异速查

| 维度 | iOS | macOS |
|------|-----|-------|
| 导航 | NavigationStack（单窗口） | NavigationSplitView（3 列） |
| 交互 | 手势（swipe/tap/long press） | 鼠标 + 右键菜单 + trackpad |
| 列表操作 | swipe action | 右键上下文菜单 |
| 反馈 | 触觉反馈（Haptic） | 音效反馈 |
| Hover | 无 | 支持 .onHover |
| HIG | iOS Human Interface Guidelines | macOS Human Interface Guidelines |

## 工作流

### 1. 创建新项目

```
步骤:
1. 运行脚手架脚本:
   bash .cursor/skills/arckit-code-swiftui/scripts/create-ios-app.sh \
     --name {ProjectName} \
     --package {PackageName} \
     --bundle-id com.example.{ProjectName}
2. 可选参数: --ios-version, --macos-version, --output
3. 脚本自动生成: Xcode 项目 + SPM Package + 目录结构 + 入口文件
```

### 2. 编写代码

```
步骤:
1. 加载 references/code-patterns.md（核心代码模式参考）
2. 如涉及设计系统 → 额外加载 references/design-tokens.md
3. 按开发顺序执行:
   a. Model（@Model）：定义持久化数据结构
   b. 业务 Model（@Observable）：定义各自独立的业务状态
   c. Service（如需要）：定义数据通道（协议→实现→环境键→注入）
   d. View：协调所有数据，组合业务逻辑
   e. 子 View：拆分复杂逻辑
   f. 测试：单元测试 + UI 测试
4. 每个 Swift 文件只包含一个 View + 对应的 #Preview
5. 使用 Swift Concurrency（@MainActor, async/await, Task），禁止 OC 线程
6. 完成后对照 code-patterns.md 末尾的「代码生成检查清单」逐项验证
```

### 3. 代码审查

```
步骤:
1. 加载 references/code-patterns.md 的检查清单部分
2. 逐项检查:
   - 架构合规: Model 独立性 / Service 纯粹性 / View 协调者角色
   - 代码风格: Struct 优先 / Swift Concurrency / 文件组织
   - View 拆分: 合理性 / 动机明确 / 父子职责分工
   - 设计系统: 无硬编码设计值 / DesignTokens 使用（见 references/design-tokens.md）
   - 性能: 关键路径 60fps / <100ms 响应
   - 可访问性: VoiceOver / Dynamic Type
   - 国际化: 无硬编码文本 / 中英文支持
3. 输出审查报告
```

## 工具命令

```bash
# SPM 包依赖解析
xcodebuild -resolvePackageDependencies -scmProvider system

# 构建验证（静态分析）
swift build

# 完整构建验证
xcodebuild -workspace {Project}.xcworkspace -scheme {Scheme} -sdk iphonesimulator build
```

## 加载指引

| 任务类型 | 加载文件 |
|---------|---------|
| 任何 SwiftUI 任务 | **SKILL.md**（本文件，始终加载） |
| 编写 / 审查代码 | + [references/code-patterns.md](references/code-patterns.md) |
| 设计系统 / 颜色 / 字体 | + [references/design-tokens.md](references/design-tokens.md) |
| 创建新项目 | 运行 `scripts/create-ios-app.sh` |
