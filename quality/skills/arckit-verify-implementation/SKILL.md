---
name: arckit-verify-implementation
description: 当用户要求验证实现是否符合规格、检查验收口径、运行回归/测试策略、生成实现验证报告或确认代码变更是否可靠时使用。输出 verification_handoff，不直接改变项目定义或治理事实。
---

# Arckit Verify Implementation

本 skill 用于实现后的验证和验收准备。它检查实现与预期是否一致，但不替代代码修改、规格维护或项目治理。

## 边界

- 适合：实现验收、测试策略、回归检查、规格对照、验证报告。
- 适合：把验证结果交给 `arckit-project-governance-workflow` 作为 Review evidence。
- 不适合：直接修复代码。若用户要求修复，按代码工作流或 debug skill 执行。
- 不适合：直接更改 spec、interaction、visual 或 tech 事实。发现偏差时交给对应结果 skill。

## 工作流

1. 明确验证对象：代码变更、功能、页面、接口、发布候选或回归范围。
2. 找到依据：用户要求、测试、spec、interaction、visual、tech、issue 或 commit。
3. 设计最小可信验证集，优先覆盖高风险路径和用户可见行为。
4. 执行可运行检查；无法执行时说明阻塞原因和替代证据。
5. 输出结论、证据、残余风险和下游 handoff。

## 证据查找顺序

优先读取用户当前验收口径；其次读取治理层 Task/Review/Decision；再读取 `arckit/spec`、`arckit/interaction`、`arckit/visual`、`arckit/tech` 中的稳定事实；最后读取代码 diff、测试输出、构建日志或运行日志。依据不足时输出 `blocked` 或 `pass_with_risk`，不要伪造验证结论。

## 输出格式

```yaml
verification_handoff:
  target: ""
  basis: []
  checks_run: []
  checks_not_run:
    - check: ""
      reason: ""
  findings: []
  result: pass|pass_with_risk|fail|blocked
  residual_risks: []
  downstream_candidates:
    - arckit-project-governance-workflow
    - arckit-spec
    - arckit-tech
```

## 参考和脚本

`references/` 保留原始 verify 参考资料。`scripts/generate_verify_report.py` 可用于报告草案生成；迁移时未纳入原始 gate、e2e 和 security scan 脚本，避免把项目特定执行假设变成通用强流程。
