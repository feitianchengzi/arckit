# Semantic Command Handoff

语义命令的字段、typed refs、候选 token 和 Review finding 关联契约由 `arckit-development-ledger` 独占维护。

提交前，从 Host 提供的 `agent_contracts.contracts.case_command` 读取实际绑定 Ledger 的 `reference_path`；无 Host 时从已安装 Ledger 的 manifest 解析 `agent_contracts.case_command.reference`。按该完整契约提交 `arckit-semantic-case-command/v1`，不以仓库中新版本代替当前可信运行版本。

本文件只定位显式接口，不隐式调用另一 skill，也不复制其协议正文。单 Gap 选择、证据判断及续轮方法仍以 using-arckit 为准。
