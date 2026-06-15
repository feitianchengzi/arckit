---
name: arckit-runtime-operations
description: 当用户要求运行期健康检查、SLA/SLO、监控指标分析、baseline 采集、线上状态巡检、告警线索整理或运维观察时使用。输出 runtime_operations_handoff，不直接替代 debug 修复或发布决策。
---

# Arckit Runtime Operations

本 skill 用于运行期观察和运维证据整理。它关注系统是否健康、指标是否异常、风险是否需要升级。

## 边界

- 适合：健康检查、SLA/SLO、监控指标、baseline、告警分析、运行状态报告。
- 适合：把运行证据交给 debug、release readiness 或 project governance。
- 不适合：直接修复 bug。故障定位和最小修复使用 `arckit-debug-diagnosis`。
- 不适合：发布 go/no-go 结论。发布判断使用 `arckit-release-readiness`。

## 工作流

1. 明确系统、环境、时间窗口和用户影响范围。
2. 收集健康检查、指标、日志摘要、告警、baseline 或用户反馈。
3. 对比预期阈值和历史 baseline，区分正常波动、异常、未知。
4. 判断是否需要升级到 debug、发布回滚或治理记录。
5. 输出 `runtime_operations_handoff`。

## 证据查找顺序

先读用户描述的系统、环境和时间窗口；再读发布记录、治理层 Decision/Review 和运行目标；再读监控指标、日志、健康检查、baseline、告警和用户反馈；必要时读取相关 `arckit/tech` 或 `arckit/spec` 判断预期行为。信号不足时标记 `unknown`，并说明需要补采哪些指标。

## 输出格式

```yaml
runtime_operations_handoff:
  target_system: ""
  window: ""
  signals:
    - name: ""
      value: ""
      status: normal|degraded|critical|unknown
      basis: ""
  user_impact: ""
  suspected_causes: []
  recommended_next: []
  downstream_candidates:
    - arckit-debug-diagnosis
    - arckit-release-readiness
    - arckit-project-governance-workflow
```

## 参考和脚本

- `references/sla-definitions.md`：SLA/SLO 参考定义。
- `scripts/analyze_metrics.py`、`scripts/collect_baseline.py`、`scripts/health_check.sh` 是可选辅助脚本。运行前先确认目标环境和凭证不会被脚本误用。
