# State-driven loop foundation

Iteration: ITER-20260705-001
Status: active
Updated: 2026-07-05T16:33:20.000Z
Canonical Record: ITER-20260705-001-state-driven-loop-foundation.record.json

## Goal

将 Arckit 状态机制从记录型账本升级为可驱动真实软件项目开发 loop 的项目完整性状态与迭代状态控制面。

## Next State Transition

- Transition: quality_validation: verified -> accepted
- Why: 完成本轮结构校验，并把真实复杂项目 loop 验证列为下一状态 gap。

## Acceptance

- Current state: verified
- Close condition: 当状态机制通过结构校验，并至少经过一次真实复杂项目的 state gap -> case -> verification -> state delta 闭环验证后关闭本迭代。

## Remaining Gaps

- 用真实复杂项目验证 state-driven loop 是否能稳定驱动下一步行动。

## Recent State Changes

- iteration_governance: needed -> implemented; 增加 iteration state schema、project-iteration 脚本和当前迭代记录。
- quality_validation: defined -> verified; project state、iteration state、case record 和 ledger scripts 已通过结构校验。
- implementation_coverage: designed -> verified; project-state v2、iteration-state v1、脚本和当前项目状态样例已落地并通过校验。
- runtime_surfaces: verified -> verified; Arckit 已通过 ArcForge 安装到 Codex 用户级 skills 目录，并由 subagent 使用已安装脚本在 arckit-demo 中创建和校验账本。
- iteration_governance: implemented -> implemented; demo 验证发现 ITERATIONS.md 不由 new 自动生成；已修复 project-iteration new/migrate 自动刷新索引，并由 audit 检查索引缺失或漂移。

## Blocking Gaps

- none

## Read For Precision

- ITER-20260705-001-state-driven-loop-foundation.record.json
- arckit/project/state.record.json
- arckit/cases/closed/CASE-20260705-003-extract-project-state-record-json.md
- arckit/cases/closed/CASE-20260705-004-refine-generated-state-decision-briefs.md
- arckit/cases/closed/CASE-20260705-005-install-and-demo-validate-arckit-state-loop.md

## Notes

- This Markdown file is a generated iteration decision brief.
- Update the canonical `*.record.json` file and render this projection.
