---
name: arckit-release-readiness
description: 当用户要求发布前检查、release gate、上线准备、灰度/canary 策略、回滚准备、发布风险评估或发布 go/no-go 判断时使用。输出 release_readiness_handoff，不直接执行生产发布。
---

# Arckit Release Readiness

本 skill 用于发布前质量和运营准备判断。它不自动执行部署、发布或回滚命令。

## 边界

- 适合：发布准备、go/no-go、灰度策略、回滚策略、运行指标、发布风险。
- 适合：把发布结论交给项目治理、验证或运维流程。
- 不适合：直接执行生产操作。所有生产发布、回滚、数据变更必须获得用户明确确认。
- 不适合：替代实现验证。缺少验证证据时，先交给 `arckit-verify-implementation`。

## 工作流

1. 明确发布对象、环境、用户影响范围和时间窗口。
2. 收集依据：变更摘要、测试结果、监控指标、迁移脚本、回滚方案、已知风险。
3. 检查 gate：功能、数据、安全、性能、观测、回滚、沟通和支持。
4. 给出 go/no-go 判断和阻塞项。
5. 输出 `release_readiness_handoff`。

## 证据查找顺序

先读用户给出的发布目标和时间窗口；再读治理层 Release/Task/Review/Decision；再读验证和代码审查结果；再读 `arckit/spec`、`arckit/tech`、迁移说明、监控指标、回滚方案和运行记录。缺少关键 gate 证据时输出 `blocked` 或 `no_go`，不要默认通过。

## 输出格式

```yaml
release_readiness_handoff:
  release_target: ""
  evidence: []
  gates:
    - name: ""
      status: pass|fail|unknown
      notes: ""
  decision: go|go_with_risk|no_go|blocked
  blockers: []
  rollback_notes: []
  canary_notes: []
  downstream_candidates:
    - arckit-project-governance-workflow
    - arckit-runtime-operations
```

## 参考和脚本

`references/` 保留原始 ship 参考资料。`scripts/canary_monitor.py` 是可选监控辅助。迁移时未纳入原始发布、回滚和 gate shell 脚本，避免通用 skill 隐式执行环境相关命令。
