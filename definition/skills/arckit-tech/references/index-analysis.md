# INDEX 全局分析（详细步骤）

变更类操作执行前必须完成 INDEX 全局分析。完整步骤与输出示例见下文。

## 第一步：读取并解析 INDEX.md

1. 读取 `arckit/tech/INDEX.md` 完整内容
2. 解析树形结构：
   - 各层级领域/方案的路径
   - 每个条目的行数标注（含 _shared/models、contracts）
   - 嵌套深度（从根到叶的最大层数）

## 第二步：综合分析

依据 SKILL.md 中「综合分析指标与拆分策略」表格判断是否触发拆分（任一满足即需拆分）。

## 第三步：输出分析结果

**若需拆分**，输出：

```yaml
分析结果:
  需要拆分: 是
  涉及范围: user-management/solution.md (580行)
  拆分方式: 按模块拆为 3 个方案（认证方案/授权方案/会话方案）
  预期结构:
    - user-management/
      - auth-solution.md 认证方案：JWT实现、Refresh Token、多端登录。(210行)
      - authz-solution.md 授权方案：RBAC模型、资源权限、动态策略。(190行)
      - session-solution.md 会话方案：Redis存储、过期策略、并发控制。(180行)
  连带更新:
    - INDEX.md: 原条目改为新方案列表
    - _map/feature-matrix.md、RELATIONS.md: 原路径废弃，迁移到新路径
```

**若无需拆分**，输出：

```yaml
分析结果:
  需要拆分: 否
  本次操作: {用户意图}
  涉及文档: auth-solution.md (当前 320行)
  预计行数: 约 360行（无风险）
```

## 第四步：执行方案

- 若需拆分：先执行拆分，再继续用户请求的变更；全部完成后输出 `document_scope`（scope_kind: change）。
- 若无需拆分：直接执行用户操作；完成后输出 `document_scope`。
