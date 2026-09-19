# Release 集成交付工作台探索记录

## 问题与范围

保留原 runtime/arcorbit/design/release-workbench/ 的交互探索、参考材料与本地验证证据。具体候选问题、体验路径和模拟边界见 options/original/README.md。

## 固定要求与基线

- 原稿来源 Git revision：799339cf61e2c19b805f134e0bc7aed64d8c543b。
- 迁移基线包含工作区现存文件，不假设该 revision 已包含全部未提交修改；逐文件 SHA-256 位于 ../migration-baseline.json。
- 现行正式事情台交互和视觉已有未提交维护；其内容以迁移时工作区为准。采纳过程不覆盖无关用户修改。
- 所有数据、Agent、执行、提交与发布动作均为本地模拟，不触发真实业务。

## 候选入口与比较结论

- [完整入口](options/original/index.html)
- [原始说明](options/original/README.md)
- 状态：候选。
- 本次仅迁移；已有正式 release-workspace 持续维护。本次不以原型模拟或生产现状重新批准候选范围。
- 历史验证及截图保留原始含义；迁移后的复测范围在 ../migration-report.md 记录。

## 采纳记录与待决定问题

2026-09-16 用户明确要求迁移 design 探索稿，并将 project-workbench-v2 升级为正式设计。该授权不采纳其他探索方向，也不批准其未实现的后端能力。

待决定：若后续需要将本候选的独有内容整合至正式页面，须有相应选择依据；本次迁移不以此为阻塞。
