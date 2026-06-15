---
name: arckit-code-review
description: 当用户要求代码审查、PR review、实现风险评估、YAGNI/过度工程检查、可维护性审查或变更质量反馈时使用。默认采用 findings-first 的代码审查口径。
---

# Arckit Code Review

本 skill 用于代码审查和实现质量反馈。输出优先服务于修复风险，而不是展示工作量。

## 边界

- 适合：代码 review、PR review、架构实现偏差、可维护性风险、测试缺口、过度工程和不必要复杂度。
- 适合：把 review evidence 交给治理或验证流程。
- 不适合：自动修改代码。用户明确要求修复时，按普通代码工作流执行。
- 不适合：替代 `arckit-verify-implementation` 的运行验证。

## 审查口径

1. 先读变更和相关上下文，不只看 diff 表面。
2. 发现项优先，按严重程度排序。
3. 每个发现必须包含文件/行号、问题、影响和建议。
4. 关注 bug、回归、数据丢失、安全、性能、兼容性、测试缺口和维护风险。
5. 没有发现时明确说没有发现阻塞问题，并说明残余风险或未运行检查。

## 证据查找顺序

先读用户要求和 review scope；再读治理层 Task/Review/Decision；再读相关 `arckit/spec`、`arckit/interaction`、`arckit/visual`、`arckit/tech`；最后读 diff、相关实现、测试和日志。若缺少关键上下文，把它列为 open question 或 test gap，不要把代码现状默认等同于正确设计。

## 输出格式

```yaml
code_review_handoff:
  scope: ""
  findings:
    - severity: critical|high|medium|low
      path: ""
      line: null
      issue: ""
      impact: ""
      recommendation: ""
  open_questions: []
  test_gaps: []
  result: no_blocking_findings|changes_requested|blocked
  downstream_candidates:
    - arckit-verify-implementation
    - arckit-project-governance-workflow
```

## 参考和脚本

`references/` 中保留原始 review 检查材料。`scripts/check_flattery.py`、`scripts/check_yagni.py`、`scripts/generate_review_report.py` 是可选辅助，不替代人工代码理解。
