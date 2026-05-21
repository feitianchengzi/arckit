# arckit-tech YAML Schema 参考

数据模型与 API 契约的 YAML 结构规范。模板文件在 assets/（model-template.yaml、contract-template.yaml），由脚本复制到 _shared/models/、_shared/contracts/。

## 数据模型模板 (Entity.yaml)

- 必含 **metadata**：path（如 tech/_shared/models/User.yaml）, domain, entity_name, storage, owner, version, created, updated
- 正文为 **JSON Schema**：type: object, required, properties（主键 id、业务字段、外键、时间戳 created_at/updated_at/deleted_at）
- 可选：relationships（has_many/belongs_to/many_to_many）、indexes、state_machine、validation

详见 assets/model-template.yaml 或按需读取本文件下方完整示例。

## API 契约模板 (endpoint.yaml)

- 必含 **metadata**：path（如 tech/_shared/contracts/auth-login.yaml）, domain, owner, version, created, updated
- **endpoint**：method, path, summary, description, auth_required, permission
- **request**：path_params, query_params, body（content_type, schema, example）
- **responses**：success（status, schema, example）、errors（status/code/message 列表）
- 可选：business_logic（flow, state_transitions, side_effects）、pagination

详见 assets/contract-template.yaml 或按需读取本文件下方完整示例。

## 通用模型参考

- **Error.yaml**：标准错误响应（success: false, error: { code, message, details? }）
- **PageInfo.yaml**：分页信息（page, limit, total, total_pages）

创建于 _shared/models/，供各领域契约 $ref 引用。

## $ref 引用规范

- 同领域模型：`$ref: "../models/User.yaml"`
- 共享模型：`$ref: "../../_shared/models/Error.yaml"`
- 跨领域模型：`$ref: "../../{domain}/models/{Entity}.yaml"`
- 路径 POSIX 风格，相对于当前文件；引用的文件必须存在。
