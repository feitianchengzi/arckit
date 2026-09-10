# Idea 正式目录与界面 / Agent 共同语义

用户要求优化：正式源码应放在用户选择、其他工具可直接使用的本地 Git 工作目录。材料可原地使用，也可复制进入关联 GitHub 的另一工作目录；应用私有 Agent cwd 不充当正式目录。Agent 必须理解左侧字段、可选项、当前值、实际目标和效果，包括 Workshop 组织与 GitHub 主体、保存与执行、复制与同步的区别。保留原材料，不能静默覆盖目标文件。未完成草稿仅本机，正式记录与 arckit/product 一起恢复及共享。既有 Lifecycle 保留，不增加迭代或发布范围。

审计事实：旧 managed 分支克隆到 dataDir/projects/id，未复制材料；context 仅 plan.directory 枚举，未携带 UI 标签、目标路径和操作含义。
