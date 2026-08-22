# Tech 技术文档规范

## 文件命名
- 目录: kebab-case（如 `user-management/`）
- Markdown: kebab-case（如 `auth-solution.md`）
- YAML 模型: PascalCase（如 `User.yaml`, `OrderItem.yaml`）
- YAML 契约: kebab-case（如 `auth-login.yaml`, `get-user.yaml`）

## 文件大小限制
| 文件类型 | 建议行数 | 强制拆分 |
|---------|---------|---------|
| research.md | 300-600 | 800 |
| solution.md | 300-500 | 600 |
| decision.md | 200-400 | 500 |

## 路径与引用
- 跨文档引用使用路径（如 tech/user-management/auth-solution.md、tech/_shared/models/User.yaml）
- 依赖关系在 _map/RELATIONS.md 维护

## 状态标识
- 技术方案: ✅ 已采用 | 🔬 调研中 | 📋 调研完成 | ❌ 已废弃 | ⚪ 待定
- 数据模型: ✅ 已定义 | 🟡 设计中 | ⚪ 待定义
- API 契约: ✅ 已定义 | 🟡 设计中 | ⚪ 待定义

## 数据模型规范
- 格式: YAML，遵循 JSON Schema
- 文件位置: _shared/models/{Entity}.yaml（统一在 _shared）
- 命名: PascalCase，与代码实体名一致
- 必含 metadata 元信息块

## API 契约规范
- 格式: YAML，类 OpenAPI 3.0
- 文件位置: _shared/contracts/{endpoint}.yaml（统一在 _shared）
- 命名: kebab-case，反映端点语义
- 必含 metadata 元信息块

## 引用规范
- 模型间引用: `$ref: "../_shared/models/Error.yaml"`
- 跨领域引用: `$ref: "../../_shared/models/{Entity}.yaml"`
- Markdown 引用: 使用路径（如 spec/…/feature.md、interaction/…/default.html、visual/_library/design-tokens.yaml）
