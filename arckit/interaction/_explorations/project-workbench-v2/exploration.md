# 项目事情台 V2探索记录

## 问题与范围

保留原 runtime/arcorbit/design/project-workbench-v2/ 的交互探索、参考材料与本地验证证据。具体候选问题、体验路径和模拟边界见 options/original/README.md。

## 固定要求与基线

- 原稿来源 Git revision：799339cf61e2c19b805f134e0bc7aed64d8c543b。
- 迁移基线包含工作区现存文件，不假设该 revision 已包含全部未提交修改；逐文件 SHA-256 位于 ../migration-baseline.json。
- 现行正式事情台交互和视觉已有未提交维护；其内容以迁移时工作区为准。采纳过程不覆盖无关用户修改。
- 所有数据、Agent、执行、提交与发布动作均为本地模拟，不触发真实业务。

## 候选入口与比较结论

- [完整入口](options/original/index.html)
- [原始说明](options/original/README.md)
- 状态：已采纳。
- 正式目标为 ../../project-workbench/default.html。采纳事情布局、持续身份、按需消息、可变安排和成果验收；正式稿应用已生效的 visual light 主题并保留现行“全部页面”约定。候选旧色值、独立存储、样本计时器及历史验证结果不自动成为生产契约。
- 历史验证及截图保留原始含义；迁移后的复测范围在 ../migration-report.md 记录。

## 采纳记录与待决定问题

2026-09-16 用户明确要求迁移 design 探索稿，并将 project-workbench-v2 升级为正式设计。该授权不采纳其他探索方向，也不批准其未实现的后端能力。

正式规范为 [interaction.md](../../project-workbench/interaction.md)，完整原型为 [default.html](../../project-workbench/default.html)。无等待用户选择的事项；完整暗色及新品牌取舍不在范围内。正式稿和候选使用不同存储键，候选不会消费正式稿的新状态。
