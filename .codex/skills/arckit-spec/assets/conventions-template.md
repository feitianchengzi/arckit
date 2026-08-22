# Spec 文档编写规范

## 文件命名
- 目录: kebab-case（如 `user-management/`）
- 文件: kebab-case（如 `password-reset.md`）
- 特殊文件: 大写（`INDEX.md`, `GLOSSARY.md`, `CONVENTIONS.md`）

## 文件大小限制
| 文件类型 | 建议行数 | 强制拆分 |
|---------|---------|---------|
| INDEX.md | 50-100 | 150 |
| feature.md | 300-500 | 500 |

## 路径与引用
- 跨文档引用使用路径（如 spec/user-management/authentication.md、tech/_shared/models/User.yaml）
- 依赖关系在 _map/RELATIONS.md 维护

## 状态标识
- 🟢 已实现 | 🟡 开发中 | ⚪ 计划中 | 🔴 已废弃

## 优先级
- P0: 必须实现（核心功能）
- P1: 应该实现（重要功能）
- P2: 可以实现（增强功能）

## 用户场景格式
使用 Given/When/Then 结构，每个场景附带验收条件。

## 跨文档引用
- 使用相对路径链接
- 引用时附带 ID（如 `[功能名](path.md) \`FEAT-001\``）
- 关联关系在元信息中显式声明

## 归档规范
- 移至 `_archive/` 目录
- 重命名为 `YYYY-MM-DD-{原名}.md`
- 顶部添加归档说明块
- 同步更新所有索引和映射层
