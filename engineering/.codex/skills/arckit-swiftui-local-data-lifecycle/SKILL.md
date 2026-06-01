---
name: arckit-swiftui-local-data-lifecycle
description: SwiftUI 本地数据生命周期 skill。用于 SwiftData schema、迁移、草稿、缓存、历史、作品库、离线数据、数据损坏降级、导入导出、Widget 共享数据、App Group 数据、缓存清理、历史兼容。用户提到本地数据、SwiftData、草稿、历史记录、缓存、作品、迁移、数据坏了、离线、导入导出、Widget 数据共享时使用。
---

# ArcKit SwiftUI Local Data Lifecycle

## 目标

把本地数据从创建、读取、更新、迁移、损坏降级、共享到清理的生命周期设计清楚。Agent 执行时不要只“保存一条数据”，而要判断数据类型、存储位置、兼容策略和长期迭代成本。

## 执行流程

1. 列出功能涉及的本地数据：草稿、历史、作品、缓存、设置、离线数据、Widget 共享数据、导入文件、生成结果等。
2. 为每类数据选择存储：SwiftData、UserDefaults/AppStorage、Keychain、文件缓存、URLCache、App Group container、临时目录。
3. 定义生命周期：谁创建、谁读取、谁更新、谁删除、何时清理、是否导出、是否共享给 Widget。
4. 设计 schema 和迁移策略；字段重命名、旧 id、后端字段变化、本地 JSON 解析失败都要有兼容位置。
5. 设计损坏/缺失/旧版本数据的降级路径，不能让坏数据阻断 App 主路径。
6. 涉及缓存时定义过期、容量、清理入口；涉及 Widget 时确认路径和数据结构可被扩展进程读取。
7. 为迁移、兼容、损坏兜底、关键转换补测试或构造验证样本。

## 读取资源

- SwiftData schema、草稿、缓存、Widget 共享、迁移、损坏降级、导入导出：`references/local-data-lifecycle.md`
- SwiftData/@Query/ModelContext 边界：`arckit-swiftui-state-dataflow`
- Keychain、App Group、Widget 系统配置：`arckit-swiftui-system-integration`
- 图片/封面缓存：`arckit-swiftui-media-pipeline`

## 核心规则

| 数据类型 | 常见存储 |
| --- | --- |
| 结构化持久数据 | SwiftData |
| 简单偏好 | UserDefaults / AppStorage |
| 敏感凭据 | Keychain |
| 大文件/图片缓存 | FileManager / URLCache |
| Widget 共享 | App Group container |
| 临时数据 | tmp/cache directory |

## 最低交付标准

- 每类本地数据都有明确存储位置和生命周期。
- schema 变化、旧数据、损坏数据有处理策略。
- 缓存有清理或过期规则。
- Widget/App Group 数据小而稳定，可独立读取。
- 关键迁移和数据转换有测试或样本验证。

## 降级/停止条件

- 单次会话内临时状态不做持久生命周期设计。
- 已有存储模型的小字段展示调整，不重构整个 schema。
- 无法确定长期数据规则时，先实现最小兼容层并记录项目待确认事实，不把猜测写进通用 skill。
